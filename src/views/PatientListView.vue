<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { Search, Refresh } from '@element-plus/icons-vue'
import { patientList, type PatientRow } from '@/mock/patients'

const router = useRouter()

// ---------- 筛选（按主索引号检索，不暴露姓名等原始 PII） ----------
const keyword = ref('')
const orgFilter = ref('')
const stageFilter = ref('')

const orgOptions = computed(() => [...new Set(patientList.map((p) => p.org))])
const stageOptions = computed(() => [...new Set(patientList.map((p) => p.stage.split(' · ')[1]))])

const filtered = computed<PatientRow[]>(() => {
  const kw = keyword.value.trim().toLowerCase()
  return patientList.filter((p) => {
    const kwHit = !kw
      || p.primaryId.toLowerCase().includes(kw)   // 主索引号可检索（不脱敏）
      || p.diagnosis.toLowerCase().includes(kw)
      || p.org.toLowerCase().includes(kw)
    const orgHit = !orgFilter.value || p.org === orgFilter.value
    const stageHit = !stageFilter.value || p.stage.includes(stageFilter.value)
    return kwHit && orgHit && stageHit
  })
})

function resetFilter() {
  keyword.value = ''
  orgFilter.value = ''
  stageFilter.value = ''
}

// 状态色：随访中=数据青 / 治疗中=橙 / 已结案=绿 / 失访=灰
const statusColor: Record<string, string> = {
  随访中: '#06b6d4', 治疗中: '#f59e0b', 已结案: '#10b981', 失访: '#94a0b8',
}

// 分期按严重程度着色：早期绿 / 中期蓝 / 局部晚期橙 / 晚期红
function stageTone(stage: string) {
  const s = (stage.split(' · ')[1] ?? stage).trim()
  if (/^i(a|b)?$/i.test(s)) return { bg: 'rgba(16,185,129,.12)', fg: '#10b981', bd: 'rgba(16,185,129,.35)' }
  if (/^ii/i.test(s)) return { bg: 'rgba(37,99,235,.10)', fg: '#2563eb', bd: 'rgba(37,99,235,.30)' }
  if (/^iii/i.test(s)) return { bg: 'rgba(245,158,11,.12)', fg: '#f59e0b', bd: 'rgba(245,158,11,.32)' }
  return { bg: 'rgba(239,68,68,.12)', fg: '#ef4444', bd: 'rgba(239,68,68,.32)' }
}

function goDetail(p: PatientRow) {
  router.push(`/dataset/patients/${p.id}`)
}
</script>

<template>
  <div class="pm">
    <!-- 页头 -->
    <div class="pm__head">
      <h1 class="pm__title">患者主档案</h1>
      <p class="pm__count">{{ filtered.length }} 例</p>
    </div>

    <!-- 筛选 -->
    <div class="pm__bar pf-card">
      <el-input v-model="keyword" placeholder="搜索主索引号 / 诊断 / 机构" :prefix-icon="Search" clearable class="pm__f-kw" />
      <el-select v-model="orgFilter" placeholder="归属机构" clearable class="pm__f">
        <el-option v-for="o in orgOptions" :key="o" :label="o" :value="o" />
      </el-select>
      <el-select v-model="stageFilter" placeholder="临床分期" clearable class="pm__f">
        <el-option v-for="s in stageOptions" :key="s" :label="s" :value="s" />
      </el-select>
      <el-button type="primary" plain :icon="Refresh" @click="resetFilter">重置</el-button>
    </div>

    <!-- 患者卡片流 -->
    <div class="pm__grid">
      <article v-for="p in filtered" :key="p.id" class="pm-card" @click="goDetail(p)">
        <header class="pm-card__top">
          <span class="pm-card__id">{{ p.primaryId }}</span>
          <span class="pm-card__status" :style="{ color: statusColor[p.status] }">
            <i class="pm-card__dot" />{{ p.status }}
          </span>
        </header>

        <div class="pm-card__dx">
          <div class="pm-card__dx-main">{{ p.diagnosis }}</div>
          <div class="pm-card__dx-sub">{{ p.histology }} · {{ p.site }}</div>
        </div>

        <div class="pm-card__stage">
          <span class="pm-card__stage-pill" :style="stageTone(p.stage)">{{ p.stage }}</span>
        </div>

        <footer class="pm-card__foot">
          <span>{{ p.gender }} · {{ p.age }} 岁</span>
          <span class="pm-card__org" :title="p.org">{{ p.org }}</span>
        </footer>
      </article>
    </div>

    <div v-if="filtered.length === 0" class="pm__empty">未检索到匹配的患者主索引</div>
  </div>
</template>

<style scoped>
.pm {
  padding: 4px 0;
}
.pm__head {
  display: flex;
  align-items: baseline;
  gap: 14px;
  margin-bottom: 16px;
}
.pm__title {
  position: relative;
  font-size: 22px;
  font-weight: 800;
  letter-spacing: 0.04em;
  padding-left: 16px;
  margin: 0;
  color: var(--pf-text);
}
.pm__title::before {
  content: '';
  position: absolute;
  left: 0;
  top: 2px;
  bottom: 2px;
  width: 4px;
  border-radius: 2px;
  background: linear-gradient(180deg, #22d3ee, #2563eb);
}
.pm__count {
  font-size: 13px;
  color: var(--pf-text-faint);
  letter-spacing: 0.02em;
}

.pm__bar {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  padding: 14px 16px;
  margin-bottom: 16px;
}
.pm__f-kw {
  width: 260px;
}
.pm__f {
  width: 170px;
}
.pm__bar :deep(.el-input__wrapper),
.pm__bar :deep(.el-select .el-input__wrapper) {
  border-radius: 8px;
  box-shadow: 0 0 0 1px var(--pf-border-strong) inset !important;
}
.pm__bar :deep(.el-button) {
  border-radius: 8px;
}

.pm__grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(290px, 1fr));
  gap: 16px;
}

/* ---------- 患者卡片 ---------- */
.pm-card {
  display: flex;
  flex-direction: column;
  background: #fff;
  border: 1px solid var(--pf-border);
  border-radius: 14px;
  padding: 16px 18px;
  cursor: pointer;
  transition: border-color 0.2s ease, box-shadow 0.2s ease, transform 0.2s ease;
}
.pm-card:hover {
  border-color: #2563eb;
  box-shadow: 0 14px 30px -18px rgba(37, 99, 235, 0.45);
  transform: translateY(-3px);
}

.pm-card__top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}
.pm-card__id {
  font-family: ui-monospace, 'Cascadia Code', Consolas, monospace;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.03em;
  color: #06b6d4;
  background: rgba(6, 182, 212, 0.08);
  padding: 3px 9px;
  border-radius: 6px;
}
.pm-card__status {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  font-weight: 700;
  white-space: nowrap;
}
.pm-card__dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: currentColor;
}

.pm-card__dx {
  margin-top: 14px;
}
.pm-card__dx-main {
  font-size: 16px;
  font-weight: 700;
  color: var(--pf-text);
  line-height: 1.35;
}
.pm-card__dx-sub {
  font-size: 12px;
  color: var(--pf-text-soft);
  margin-top: 4px;
}

.pm-card__stage {
  margin-top: 12px;
}
.pm-card__stage-pill {
  display: inline-block;
  font-size: 12px;
  font-weight: 700;
  padding: 4px 12px;
  border-radius: 999px;
  border: 1px solid;
}

.pm-card__foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin-top: 14px;
  padding-top: 12px;
  border-top: 1px solid var(--pf-border);
  font-size: 12px;
  color: var(--pf-text-faint);
}
.pm-card__org {
  color: var(--pf-text-soft);
  font-weight: 600;
  max-width: 55%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.pm__empty {
  text-align: center;
  color: var(--pf-text-faint);
  padding: 60px 0;
  font-size: 14px;
}
</style>
