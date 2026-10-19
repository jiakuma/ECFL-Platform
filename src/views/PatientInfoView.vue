<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Lock, Download, Document } from '@element-plus/icons-vue'
import {
  resolvePatientDetail,
  maskIdNo,
  maskPhone,
  maskAddress,
  type DataLevel,
} from '@/mock/patients'

const route = useRoute()
const patient = computed(() => resolvePatientDetail(route.params.id as string))

const levelText: Record<DataLevel, string> = { full: '完全可见', masked: '脱敏可见', summary: '摘要可见' }
const levelType: Record<DataLevel, 'success' | 'warning' | 'info'> = {
  full: 'success', masked: 'warning', summary: 'info',
}
const displayName = computed(() =>
  patient.value.level === 'full' ? patient.value.name : `*${patient.value.name.slice(-1)}`,
)
const masked = computed(() => ({
  idNo: maskIdNo(patient.value.idNo),
  phone: maskPhone(patient.value.phone),
  address: maskAddress(patient.value.address),
}))
const localIdsText = computed(() =>
  patient.value.localIds.length
    ? patient.value.localIds.map((m) => `${m.org}：${m.id}`).join('；')
    : '—',
)

function applyFullView() {
  ElMessage.info(`已提交完整档案授权申请（${patient.value.code}），等待数据治理审批，审计已留痕。`)
}
function exportSummary() {
  ElMessage.success('摘要导出任务已创建（按当前可见级别脱敏），审计已留痕。')
}

interface InfoItem {
  label: string
  value: string
  wide?: boolean
  mono?: boolean
  sensitive?: boolean
  tag?: DataLevel
}
interface InfoGroup {
  key: string
  title: string
  items: InfoItem[]
}

const groups = computed<InfoGroup[]>(() => {
  const p = patient.value
  const m = masked.value
  return [
    {
      key: 'identity',
      title: '基本身份信息',
      items: [
        { label: '患者姓名', value: displayName.value },
        { label: '性别', value: p.gender },
        { label: '年龄', value: `${p.age} 岁` },
        { label: '证件号码', value: m.idNo, sensitive: p.level !== 'full' },
        { label: '联系电话', value: m.phone, sensitive: p.level !== 'full' },
        { label: '联系地址', value: m.address, sensitive: p.level !== 'full' },
        { label: '病历号', value: p.code, mono: true },
        { label: '平台主索引', value: p.primaryId, mono: true },
      ],
    },
    {
      key: 'demo',
      title: '社会人口学信息',
      items: [
        { label: '民族', value: p.sociodemographic.ethnicity },
        { label: '籍贯 / 出生地', value: p.sociodemographic.birthplace },
        { label: '婚姻状况', value: p.sociodemographic.maritalStatus },
        { label: '居住地类型', value: p.sociodemographic.residence },
        { label: '职业', value: p.sociodemographic.occupation },
        { label: '文化程度', value: p.sociodemographic.education },
        { label: '医保类型', value: p.sociodemographic.insurance },
      ],
    },
    {
      key: 'life',
      title: '生活方式与危险因素',
      items: [
        { label: '吸烟史', value: p.lifestyle.smoking },
        { label: '饮酒史', value: p.lifestyle.drinking },
        { label: '饮茶习惯', value: p.lifestyle.tea },
        { label: '饮食习惯', value: p.lifestyle.diet },
        { label: '主要危险因素', value: p.lifestyle.riskFactors, wide: true },
      ],
    },
    {
      key: 'history',
      title: '个人及家族史',
      items: [
        { label: '既往病史', value: p.history.pastHistory, wide: true },
        { label: '手术史', value: p.history.pastSurgery },
        { label: '过敏史', value: p.history.allergy },
        { label: '恶性肿瘤家族史', value: p.history.familyCancer, wide: true },
      ],
    },
    {
      key: 'physical',
      title: '体格信息',
      items: [
        { label: '身高', value: p.physical.height },
        { label: '体重', value: p.physical.weight },
        { label: '体重指数 (BMI)', value: p.physical.bmi },
        { label: '血压', value: p.physical.bloodPressure },
        { label: '心率', value: p.physical.heartRate },
        { label: 'ECOG 评分', value: p.physical.ecog },
      ],
    },
    {
      key: 'governance',
      title: '数据治理信息',
      items: [
        { label: '数据可见级别', value: levelText[p.level], tag: p.level },
        { label: '归属机构', value: p.org },
        { label: '平台主索引', value: p.primaryId, mono: true },
        { label: '入组时间', value: p.joinedAt },
        { label: '最近更新', value: p.updatedAt },
        { label: '跨机构本地编码', value: localIdsText.value, wide: true },
      ],
    },
  ]
})
</script>

<template>
  <div class="pi">
    <section class="pi__hero pf-card">
      <div class="pi__hero-top">
        <div class="pi__id-top">
          <div class="pi__avatar">{{ displayName.slice(-1) }}</div>
          <div class="pi__id-name">
            <div class="pi__name-row">
              <span class="pi__name">{{ displayName }}</span>
              <el-tag :type="levelType[patient.level]" size="small" effect="light" round>
                {{ levelText[patient.level] }}
              </el-tag>
            </div>
            <div class="pi__id-chips">
              <span class="pi__chip">{{ patient.gender }} · {{ patient.age }} 岁</span>
              <span class="pi__chip pi__chip--mono">{{ patient.primaryId }}</span>
              <span class="pi__chip">{{ patient.org }}</span>
            </div>
          </div>
        </div>
        <div class="pi__ops">
          <el-button v-if="patient.level !== 'full'" round type="primary" plain @click="applyFullView">
            <el-icon><Lock /></el-icon>&nbsp;申请完整授权
          </el-button>
          <el-button round plain @click="exportSummary">
            <el-icon><Download /></el-icon>&nbsp;导出脱敏摘要
          </el-button>
        </div>
      </div>
    </section>

    <div class="pi__main">
      <section
        v-for="g in groups"
        :key="g.key"
        class="pi__group"
      >
        <h3 class="pi__h">{{ g.title }}</h3>
        <div class="pi__grid">
          <div
            v-for="(it, i) in g.items"
            :key="i"
            class="pi__item"
            :class="{ 'pi__item--wide': it.wide }"
          >
            <span class="pi__k">{{ it.label }}</span>
            <div class="pi__v-wrap">
              <el-tag v-if="it.tag" :type="levelType[it.tag]" size="small" effect="light" round>{{ it.value }}</el-tag>
              <span
                v-else
                class="pi__v"
                :class="{ 'pi__v--mono': it.mono, 'pi__v--sensitive': it.sensitive }"
              >{{ it.value }}</span>
              <span v-if="it.sensitive" class="pi__mask-tag">已脱敏</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<style scoped>
.pi {
  max-width: var(--pf-maxw);
  margin: 0 auto;
}
.pi__hero {
  padding: 20px 24px;
}
.pi__hero-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
}
.pi__id-top {
  display: flex;
  align-items: center;
  gap: 16px;
  min-width: 0;
}
.pi__avatar {
  width: 54px;
  height: 54px;
  flex: none;
  border-radius: 14px;
  display: grid;
  place-items: center;
  font-size: 22px;
  font-weight: 800;
  color: #fff;
  background: #2563eb;
}
.pi__name-row {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}
.pi__name {
  font-size: 22px;
  font-weight: 800;
  letter-spacing: 0.02em;
}
.pi__id-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 7px;
}
.pi__chip {
  font-size: 12px;
  color: var(--pf-text-soft);
  background: var(--pf-bg-soft);
  border-radius: 999px;
  padding: 3px 12px;
}
.pi__chip--mono {
  font-family: ui-monospace, 'Cascadia Code', Consolas, monospace;
  color: #0e7490;
  background: rgba(6, 182, 212, 0.1);
}
.pi__ops {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  justify-content: flex-end;
}
.pi__main {
  margin-top: 18px;
}
.pi__group {
  background: #fff;
  border: 1px solid var(--pf-border);
  border-radius: 14px;
  padding: 18px 20px;
  margin-bottom: 16px;
}
.pi__group:last-child {
  margin-bottom: 0;
}
.pi__h {
  font-size: 15px;
  font-weight: 700;
  margin: 0 0 14px;
  padding-left: 10px;
  border-left: 3px solid #2563eb;
}
.pi__grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  border-top: 1px dashed var(--pf-border);
}
.pi__item {
  min-width: 0;
  padding: 11px 0;
  display: grid;
  grid-template-columns: 104px 1fr;
  gap: 10px;
  align-items: baseline;
  border-bottom: 1px dashed var(--pf-border);
}
.pi__item--wide {
  grid-column: 1 / -1;
}
.pi__k {
  font-size: 12px;
  color: var(--pf-text-faint);
}
.pi__v-wrap {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  min-width: 0;
}
.pi__v {
  font-size: 14px;
  font-weight: 600;
  color: var(--pf-text);
  line-height: 1.5;
  word-break: break-word;
}
.pi__v--mono {
  font-family: ui-monospace, 'Cascadia Code', Consolas, monospace;
  color: #0e7490;
  font-weight: 600;
}
.pi__v--sensitive {
  color: #9a6b0a;
  background: rgba(245, 158, 11, 0.08);
  border: 1px solid rgba(245, 158, 11, 0.22);
  border-radius: 6px;
  padding: 1px 8px;
}
.pi__mask-tag {
  font-size: 10.5px;
  font-weight: 600;
  color: #b45309;
  background: rgba(245, 158, 11, 0.1);
  border: 1px solid rgba(245, 158, 11, 0.28);
  border-radius: 999px;
  padding: 0 7px;
  line-height: 16px;
}
@media (max-width: 720px) {
  .pi__hero-top {
    align-items: flex-start;
    flex-direction: column;
  }
  .pi__ops {
    width: 100%;
    justify-content: flex-start;
  }
  .pi__grid {
    grid-template-columns: 1fr;
  }
  .pi__item--wide {
    grid-column: auto;
  }
}
</style>
