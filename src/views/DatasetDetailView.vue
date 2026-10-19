<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { EditPen, CopyDocument, Delete, Cpu } from '@element-plus/icons-vue'
import { useDatasetStore, type Dataset } from '@/store/dataset'
import { useCohortStore } from '@/store/cohort'
import {
  fieldDef,
  fieldStats,
  DATASET_FIELD_CATS,
  type FieldCategory,
  type FieldStats,
} from '@/mock/datasetFields'

const route = useRoute()
const router = useRouter()
const store = useDatasetStore()
const cohortStore = useCohortStore()

const id = computed(() => (route.params.id as string) || '')
const d = computed<Dataset | undefined>(() => store.list.find((x) => x.id === id.value))

onMounted(() => store.ensureSeed())

const tab = ref('basic')
const statusColor: Record<Dataset['status'], string> = {
  可用于训练: '#10b981',
  待完善: '#f59e0b',
  不可用: '#f43f5e',
}

const checks = computed(() => (d.value ? store.checksOf(d.value) : []))
const cohortAlive = computed(() => !!cohortStore.list.find((c) => c.id === d.value?.cohortId))
const labelText = computed(() =>
  d.value?.labelField ? (fieldDef(d.value.labelField)?.label ?? d.value.labelField) : '未设置标签',
)

/* ---------- 特征字段 ---------- */
const fkw = ref('')
const fcat = ref<FieldCategory | ''>('')
const fieldRows = computed(() => {
  if (!d.value) return []
  return d.value.fields
    .map((f) => {
      const def = fieldDef(f.key)
      const s = fieldStats(f.key)
      return {
        key: f.key,
        role: f.role,
        label: def?.label ?? f.key,
        kind: def?.kind ?? '—',
        category: def?.category ?? '—',
        unit: def?.unit ?? '',
        stats: s,
      }
    })
    .filter((r) => {
      if (fcat.value && r.category !== fcat.value) return false
      if (fkw.value && !`${r.key}${r.label}`.toLowerCase().includes(fkw.value.toLowerCase())) return false
      return true
    })
})

/* ---------- 字段详情 ---------- */
const detailOpen = ref(false)
const detailRow = ref<{ key: string; label: string; kind: string; category: string; unit: string; stats: FieldStats } | null>(null)
function openField(row: typeof detailRow.value) {
  detailRow.value = row
  detailOpen.value = true
}

/* ---------- 操作 ---------- */
function goEdit() {
  router.push(`/dataset/research-datasets/${id.value}/edit`)
}
function goCohort() {
  router.push('/dataset/cohort')
}
function goTask() {
  router.push({ path: '/federated/create', query: { dataset: id.value } })
}
function duplicate() {
  const item = store.duplicate(id.value)
  if (item) {
    ElMessage.success(`已复制为「${item.name}」`)
    router.push(`/dataset/research-datasets/${item.id}`)
  }
}
async function remove() {
  const cur = d.value
  if (!cur) return
  if (cur.referencedBy.length) {
    ElMessage.warning(`该数据集已被联邦任务 ${cur.referencedBy.join('、')} 引用，不能删除`)
    return
  }
  try {
    await ElMessageBox.confirm(
      `确定删除数据集「${cur.name}」吗？该操作只删除配置，不删除任何患者原始数据。`,
      '删除确认',
      { confirmButtonText: '删除', cancelButtonText: '取消', type: 'warning' },
    )
  } catch {
    return
  }
  const res = store.remove(id.value)
  if (res.ok) {
    ElMessage.success('数据集已删除')
    router.push('/dataset/research-datasets')
  } else {
    ElMessage.warning(res.reason || '删除失败')
  }
}

const levelColor: Record<string, string> = { 通过: '#10b981', 警告: '#f59e0b', 失败: '#f43f5e' }
</script>

<template>
  <div v-if="d" class="dd">
    <div class="dd__head">
      <div class="dd__title-wrap">
        <h1 class="dd__title">{{ d.name }}</h1>
        <span class="dd__id">{{ d.id }}</span>
        <span class="dd__status" :style="{ color: statusColor[d.status] }">
          <i :style="{ background: statusColor[d.status] }" />{{ d.status }}
        </span>
      </div>
      <div class="dd__ops">
        <el-button size="small" :icon="EditPen" @click="goEdit">编辑</el-button>
        <el-button size="small" :icon="CopyDocument" @click="duplicate">复制</el-button>
        <el-button size="small" :icon="Delete" @click="remove">删除</el-button>
        <el-button type="primary" size="small" :icon="Cpu" @click="goTask">创建训练任务</el-button>
      </div>
    </div>

    <div class="dd__meta">
      <span>所属机构：{{ d.org }}</span>
      <span>更新于 {{ d.updatedAt }}</span>
      <span>版本 v{{ d.version }}</span>
    </div>

    <el-tabs v-model="tab" class="dd__tabs">
      <!-- 基本信息 -->
      <el-tab-pane label="基本信息" name="basic">
        <div class="panel">
          <div class="kv">
            <div class="kv__i"><span class="kv__k">数据集说明</span><span class="kv__v">{{ d.desc || '—' }}</span></div>
            <div class="kv__i"><span class="kv__k">研究目的</span><span class="kv__v">{{ d.purpose || '—' }}</span></div>
            <div class="kv__i">
              <span class="kv__k">来源队列</span>
              <span class="kv__v">
                {{ d.cohortName || '—' }}
                <el-button text size="small" @click="goCohort">查看来源队列</el-button>
              </span>
            </div>
            <div class="kv__i"><span class="kv__k">队列规则版本</span><span class="kv__v">{{ d.cohortRuleAt || '—' }}</span></div>
            <div class="kv__i"><span class="kv__k">数据类型</span><span class="kv__v">{{ d.dataType }}</span></div>
            <div class="kv__i"><span class="kv__k">样本数量</span><span class="kv__v">{{ d.sampleCount }} 例</span></div>
            <div class="kv__i"><span class="kv__k">字段数量</span><span class="kv__v">{{ d.fields.length }} 个</span></div>
            <div class="kv__i"><span class="kv__k">目标标签</span><span class="kv__v">{{ labelText }}</span></div>
            <div class="kv__i"><span class="kv__k">任务类型</span><span class="kv__v">{{ d.taskType }}</span></div>
            <div class="kv__i"><span class="kv__k">创建人</span><span class="kv__v">{{ d.creator }}</span></div>
            <div class="kv__i"><span class="kv__k">更新时间</span><span class="kv__v">{{ d.updatedAt }}</span></div>
            <div class="kv__i">
              <span class="kv__k">关联任务</span>
              <span class="kv__v">{{ d.referencedBy.length ? d.referencedBy.join('、') : '未关联任务' }}</span>
            </div>
          </div>

          <div v-if="!cohortAlive" class="warn">
            来源队列 {{ d.cohortId }} 已不存在，数据集沿用关联时的规则版本，建议编辑后重新选择队列。
          </div>

          <div class="vhist">
            <div class="vhist__hd">配置版本记录</div>
            <div v-for="h in d.history || []" :key="h.version" class="vhist__row">
              <span class="vhist__v">v{{ h.version }}</span>
              <span class="vhist__t">{{ h.at }}</span>
              <span class="vhist__d">{{ h.fieldCount }} 个字段 · {{ h.taskType }} · 标签：{{ h.labelField ? (fieldDef(h.labelField)?.label ?? h.labelField) : '无' }}</span>
              <span class="vhist__ref" :class="{ 'is-ref': h.referencedBy.length }">
                {{ h.referencedBy.length ? '被 ' + h.referencedBy.join('、') + ' 引用' : '未引用' }}
              </span>
            </div>
          </div>
        </div>
      </el-tab-pane>

      <!-- 特征字段 -->
      <el-tab-pane label="特征字段" name="fields">
        <div class="fbar">
          <el-input v-model="fkw" placeholder="搜索字段名称 / 中文名称" clearable class="fbar__kw" />
          <el-select v-model="fcat" placeholder="数据分类" clearable class="fbar__sel">
            <el-option v-for="c in DATASET_FIELD_CATS" :key="c" :label="c" :value="c" />
          </el-select>
          <span class="fbar__num">共 {{ fieldRows.length }} 个字段</span>
        </div>

        <el-table :data="fieldRows" size="small" class="ftable">
          <el-table-column prop="key" label="字段名称" width="150" show-overflow-tooltip />
          <el-table-column prop="label" label="中文名称" min-width="150" show-overflow-tooltip />
          <el-table-column prop="kind" label="数据类型" width="80" />
          <el-table-column prop="category" label="数据分类" width="90" />
          <el-table-column label="字段用途" width="90">
            <template #default="{ row }">
              <span class="role" :class="'is-' + row.role">{{ row.role === 'label' ? '目标标签' : '特征' }}</span>
            </template>
          </el-table-column>
          <el-table-column label="缺失情况" width="100">
            <template #default="{ row }">
              <span v-if="!row.stats.total || !row.stats.hasStats" class="muted">暂无统计</span>
              <span v-else>{{ (row.stats.missingRate * 100).toFixed(0) }}%</span>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="80" align="center">
            <template #default="{ row }">
              <el-button text size="small" @click="openField(row)">详情</el-button>
            </template>
          </el-table-column>
          <template #empty>
            <span class="muted">没有匹配的字段</span>
          </template>
        </el-table>
      </el-tab-pane>

      <!-- 训练配置与可用性 -->
      <el-tab-pane label="训练配置与可用性" name="train">
        <div class="panel">
          <div class="kv kv--tight">
            <div class="kv__i"><span class="kv__k">任务类型</span><span class="kv__v">{{ d.taskType }}</span></div>
            <div class="kv__i"><span class="kv__k">目标标签</span><span class="kv__v">{{ labelText }}</span></div>
            <div class="kv__i">
              <span class="kv__k">特征字段</span>
              <span class="kv__v">{{ d.fields.filter((f) => f.role === 'feature').length }} 个</span>
            </div>
            <div class="kv__i"><span class="kv__k">样本数量</span><span class="kv__v">{{ d.sampleCount }} 例</span></div>
          </div>

          <div class="ck__hd">
            训练前检查结果
            <span class="ck__hd-status" :style="{ color: statusColor[d.status] }">{{ d.status }}</span>
          </div>
          <div class="ck">
            <div v-for="c in checks" :key="c.name" class="ck__item">
              <span class="ck__lv" :style="{ background: levelColor[c.level] }">{{ c.level }}</span>
              <div class="ck__txt">
                <b>{{ c.name }}</b>
                <p>{{ c.detail }}</p>
              </div>
            </div>
          </div>
        </div>
      </el-tab-pane>
    </el-tabs>

    <!-- 字段详情抽屉 -->
    <el-drawer v-model="detailOpen" :title="detailRow?.label || '字段详情'" size="420px">
      <template v-if="detailRow">
        <div class="fd">
          <div class="fd__row"><span>字段名称</span><b>{{ detailRow.key }}</b></div>
          <div class="fd__row"><span>中文名称</span><b>{{ detailRow.label }}</b></div>
          <div class="fd__row"><span>数据类型</span><b>{{ detailRow.kind }}</b></div>
          <div class="fd__row"><span>数据分类</span><b>{{ detailRow.category }}</b></div>
        </div>

        <div class="fd__sec">
          <div class="fd__sec-hd">统计信息</div>
          <template v-if="detailRow.stats.total && detailRow.stats.hasStats">
            <div class="fd__row"><span>统计样本</span><b>{{ detailRow.stats.total }} 条</b></div>
            <div class="fd__row">
              <span>缺失率</span>
              <b>{{ (detailRow.stats.missingRate * 100).toFixed(0) }}%（{{ detailRow.stats.missing }} 条）</b>
            </div>
            <div class="fd__row"><span>取值数</span><b>{{ detailRow.stats.distinct }}</b></div>
            <div v-if="detailRow.stats.min !== undefined" class="fd__row">
              <span>取值范围</span>
              <b>{{ detailRow.stats.min }} ~ {{ detailRow.stats.max }}{{ detailRow.unit ? ' ' + detailRow.unit : '' }}</b>
            </div>
            <div v-if="detailRow.stats.categories" class="fd__dist">
              <div class="fd__sec-hd">类别分布</div>
              <div v-for="c in detailRow.stats.categories" :key="c.name" class="fd__dist-row">
                <span class="fd__dist-name">{{ c.name }}</span>
                <span class="fd__dist-bar"><i :style="{ width: (c.count / detailRow.stats.total * 100) + '%' }" /></span>
                <span class="fd__dist-num">{{ c.count }}</span>
              </div>
            </div>
          </template>
          <div v-else class="muted">暂无统计</div>
        </div>
      </template>
    </el-drawer>
  </div>

  <div v-else class="dd__empty">数据集不存在或已被删除</div>
</template>

<style scoped>
.dd__head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 14px;
  flex-wrap: wrap;
  margin-bottom: 10px;
}
.dd__title-wrap {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}
.dd__title {
  position: relative;
  font-size: 18px;
  font-weight: 700;
  letter-spacing: 0.03em;
  padding-left: 12px;
  margin: 0;
  color: var(--pf-text);
}
.dd__title::before {
  content: '';
  position: absolute;
  left: 0;
  top: 2px;
  bottom: 2px;
  width: 3px;
  border-radius: 2px;
  background: var(--pf-primary);
}
.dd__id {
  padding: 2px 9px;
  font-size: 12px;
  color: var(--pf-text-soft);
  background: var(--pf-bg-soft);
  border-radius: 999px;
}
.dd__status {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 12px;
  font-weight: 600;
}
.dd__status i {
  width: 6px;
  height: 6px;
  border-radius: 50%;
}
.dd__ops {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}
.dd__meta {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
  margin-bottom: 14px;
  font-size: 12px;
  color: var(--pf-text-faint);
}
.dd__tabs :deep(.el-tabs__header) {
  margin-bottom: 14px;
}
.dd__empty {
  padding: 60px 0;
  text-align: center;
  color: var(--pf-text-faint);
  font-size: 13px;
}

.panel {
  padding: 14px 16px;
  background: var(--pf-surface);
  border: 1px solid var(--pf-border);
  border-radius: 12px;
}
.kv {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(360px, 1fr));
  gap: 10px 24px;
}
.kv--tight {
  margin-bottom: 16px;
}
.kv__i {
  display: flex;
  gap: 10px;
  font-size: 12.5px;
  line-height: 1.6;
}
.kv__k {
  flex: none;
  width: 88px;
  color: var(--pf-text-faint);
}
.kv__v {
  min-width: 0;
  color: var(--pf-text);
}
.warn {
  margin-top: 14px;
  padding: 8px 12px;
  font-size: 12px;
  color: var(--pf-warning);
  background: rgba(245, 158, 11, 0.1);
  border-radius: 8px;
}
.vhist {
  margin-top: 16px;
  padding-top: 12px;
  border-top: 1px solid var(--pf-border);
}
.vhist__hd {
  margin-bottom: 8px;
  font-size: 12.5px;
  font-weight: 700;
  color: var(--pf-text);
}
.vhist__row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 6px 0;
  font-size: 12px;
  color: var(--pf-text-soft);
  border-bottom: 1px dashed var(--pf-border);
}
.vhist__row:last-child {
  border-bottom: none;
}
.vhist__v {
  flex: none;
  width: 44px;
  font-weight: 700;
  color: var(--pf-primary);
}
.vhist__t {
  flex: none;
  width: 140px;
  color: var(--pf-text-faint);
}
.vhist__d {
  flex: 1;
  min-width: 0;
}
.vhist__ref {
  flex: none;
  font-size: 11.5px;
  color: var(--pf-text-faint);
}
.vhist__ref.is-ref {
  color: var(--pf-primary);
}

.fbar {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
  margin-bottom: 12px;
}
.fbar__kw {
  width: 260px;
}
.fbar__sel {
  width: 150px;
}
.fbar__num {
  margin-left: auto;
  font-size: 12px;
  color: var(--pf-text-faint);
}
.ftable {
  border: 1px solid var(--pf-border);
  border-radius: 12px;
  overflow: hidden;
}
.role {
  padding: 1px 8px;
  font-size: 11px;
  border-radius: 4px;
  background: var(--pf-bg-soft);
  color: var(--pf-text-soft);
}
.role.is-label {
  color: var(--pf-primary);
  background: rgba(37, 99, 235, 0.1);
}
.muted {
  color: var(--pf-text-faint);
  font-size: 12px;
}

.ck__hd {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
  font-size: 13px;
  font-weight: 700;
  color: var(--pf-text);
}
.ck__hd-status {
  font-size: 12px;
  font-weight: 600;
}
.ck {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.ck__item {
  display: flex;
  gap: 10px;
  padding: 10px 12px;
  background: var(--pf-bg-soft);
  border-radius: 8px;
}
.ck__lv {
  flex: none;
  align-self: flex-start;
  padding: 1px 8px;
  font-size: 11px;
  font-weight: 700;
  color: #fff;
  border-radius: 4px;
}
.ck__txt b {
  font-size: 12.5px;
  color: var(--pf-text);
}
.ck__txt p {
  margin: 3px 0 0;
  font-size: 12px;
  line-height: 1.55;
  color: var(--pf-text-soft);
}

.fd__row {
  display: flex;
  align-items: baseline;
  gap: 10px;
  padding: 6px 0;
  font-size: 12.5px;
  border-bottom: 1px dashed var(--pf-border);
}
.fd__row span {
  flex: none;
  width: 84px;
  color: var(--pf-text-faint);
}
.fd__sec {
  margin-top: 16px;
}
.fd__sec-hd {
  margin-bottom: 8px;
  font-size: 12.5px;
  font-weight: 700;
  color: var(--pf-text);
}
.fd__dist-row {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 6px;
  font-size: 12px;
}
.fd__dist-name {
  flex: none;
  width: 80px;
  color: var(--pf-text);
}
.fd__dist-bar {
  flex: 1;
  height: 6px;
  background: var(--pf-border);
  border-radius: 999px;
  overflow: hidden;
}
.fd__dist-bar i {
  display: block;
  height: 100%;
  background: var(--pf-primary);
  border-radius: 999px;
}
.fd__dist-num {
  flex: none;
  width: 40px;
  text-align: right;
  color: var(--pf-text-faint);
}
</style>
