<script setup lang="ts">
import { computed, ref, watch, nextTick, onMounted, onBeforeUnmount } from 'vue'
import { useRoute } from 'vue-router'
import * as echarts from 'echarts'
import {
  resolvePatientDetail,
  labCategoryOrder,
  labCategoryColor,
} from '@/mock/patients'
import type { LabCategory, LabReportItem, CourseStageKey } from '@/mock/patients'

const route = useRoute()

const patient = computed(() => resolvePatientDetail(route.params.id as string))
const displayName = computed(() =>
  patient.value.level === 'full' ? patient.value.name : `*${patient.value.name.slice(-1)}`,
)
const levelTextMap: Record<string, string> = { full: '完全可见', masked: '脱敏可见', summary: '摘要可见' }
const levelTypeVal = computed<'success' | 'warning' | 'info'>(() =>
  patient.value.level === 'full' ? 'success' : patient.value.level === 'masked' ? 'warning' : 'info',
)

// ---------- 筛选 ----------
const stageOptions = [
  { key: '全部', label: '全部阶段' },
  { key: 'screening', label: '早筛' },
  { key: 'diagnosis', label: '诊断' },
  { key: 'treatment', label: '治疗' },
  { key: 'followup', label: '随访' },
] as const
const catOptions = ['全部', ...labCategoryOrder]
const stageFilter = ref<string>((route.query.stage as string) || '全部')
const catFilter = ref<string>('全部')
const sortOrder = ref<'desc' | 'asc'>('desc')

const allReports = computed(() => patient.value.labReports ?? [])
const filteredReports = computed(() => {
  let list = allReports.value
  if (stageFilter.value !== '全部') list = list.filter((r) => r.stage === stageFilter.value)
  if (catFilter.value !== '全部') list = list.filter((r) => r.items.some((i) => i.category === catFilter.value))
  return [...list].sort((a, b) =>
    sortOrder.value === 'desc' ? b.date.localeCompare(a.date) : a.date.localeCompare(b.date),
  )
})

type FlatItem = LabReportItem & { date: string; org: string; stage: CourseStageKey }
const flatItems = computed<FlatItem[]>(() => {
  const out: FlatItem[] = []
  for (const r of filteredReports.value) {
    for (const it of r.items) out.push({ ...it, date: r.date, org: r.org, stage: r.stage })
  }
  return out
})

const grouped = computed(() => {
  const cats: LabCategory[] = catFilter.value === '全部' ? labCategoryOrder : [catFilter.value as LabCategory]
  const res: { category: LabCategory; color: string; rows: FlatItem[] }[] = []
  for (const c of cats) {
    const rows = flatItems.value.filter((r) => r.category === c)
    if (rows.length) res.push({ category: c, color: labCategoryColor[c], rows })
  }
  return res
})

// 同一指标在多次检验单中出现 → 可看趋势
const trendByName = computed(() => {
  const m = new Map<string, { date: string; value: number; org: string; stage: CourseStageKey }[]>()
  for (const r of flatItems.value) {
    const v = parseFloat(r.value)
    if (Number.isNaN(v)) continue
    if (!m.has(r.name)) m.set(r.name, [])
    m.get(r.name)!.push({ date: r.date, value: v, org: r.org, stage: r.stage })
  }
  const out = new Map<string, { date: string; value: number; org: string; stage: CourseStageKey }[]>()
  for (const [k, arr] of m) if (arr.length >= 2) out.set(k, arr)
  return out
})
function hasTrend(name: string) {
  return trendByName.value.has(name)
}

// ---------- 顶部趋势折线图（关键指标 / 肿瘤相关，按指标切换，展示全部阶段） ----------
const keyIndicators = [
  { key: 'WBC', name: '白细胞计数 WBC', color: '#2563eb', unit: '×10⁹/L' },
  { key: 'HGB', name: '血红蛋白 HGB', color: '#f59e0b', unit: 'g/L' },
  { key: 'ALB', name: '白蛋白 ALB', color: '#10b981', unit: 'g/L' },
  { key: 'ALT', name: '谷丙转氨酶 ALT', color: '#8b5cf6', unit: 'U/L' },
] as const
const tumorIndicators = [
  { key: 'SCC', name: '鳞状细胞癌抗原 SCC', color: '#f43f5e', unit: 'ng/mL' },
  { key: 'CEA', name: '癌胚抗原 CEA', color: '#0ea5e9', unit: 'ng/mL' },
  { key: 'CYFRA21-1', name: '细胞角蛋白19片段 CYFRA21-1', color: '#14b8a6', unit: 'ng/mL' },
] as const

const keySelected = ref<string>('WBC')
const tumorSelected = ref<string>('SCC')
const keyInd = computed(() => keyIndicators.find((i) => i.key === keySelected.value)!)
const tumorInd = computed(() => tumorIndicators.find((i) => i.key === tumorSelected.value)!)

// 跨全部阶段的指标时序，用于趋势图（不受下方筛选影响）
const allTrendByName = computed(() => {
  const m = new Map<string, { date: string; value: number; org: string; stage: CourseStageKey; phase: string; abnormal: boolean }[]>()
  for (const r of allReports.value) {
    for (const it of r.items) {
      const v = parseFloat(it.value)
      if (Number.isNaN(v)) continue
      if (!m.has(it.name)) m.set(it.name, [])
      m.get(it.name)!.push({
        date: r.date,
        value: v,
        org: r.org,
        stage: r.stage,
        phase: r.phase || stageText(r.stage),
        abnormal: it.abnormal,
      })
    }
  }
  return m
})
const keyTrendAvailable = computed(() => keyIndicators.some((i) => allTrendByName.value.has(i.name)))
const tumorTrendAvailable = computed(() => tumorIndicators.some((i) => allTrendByName.value.has(i.name)))

const charts: Record<'key' | 'tumor', echarts.ECharts | null> = { key: null, tumor: null }
const keyChartEl = ref<HTMLElement | null>(null)
const tumorChartEl = ref<HTMLElement | null>(null)

function parseRefUpperFor(name: string): number | null {
  for (const r of allReports.value) {
    const it = r.items.find((i) => i.name === name)
    if (it) return parseRefUpper(it.ref)
  }
  return null
}
function drawTrendChart(el: HTMLElement, slot: 'key' | 'tumor', ind: { name: string; color: string; unit: string }) {
  if (!charts[slot]) charts[slot] = echarts.init(el)
  const rows = (allTrendByName.value.get(ind.name) ?? [])
    .slice()
    .sort((a, b) => a.date.localeCompare(b.date))
  const xLabels = rows.map((r) => r.date.slice(5))
  const phaseByIndex = rows.map((r) => r.phase)
  const upper = parseRefUpperFor(ind.name)
  charts[slot]!.setOption(
    {
      grid: { left: 58, right: 22, top: 30, bottom: 50 },
      tooltip: {
        trigger: 'axis',
        formatter: (params: any) => {
          const d = params[0].data
          const lines = [
            `<div style="font-weight:600;margin-bottom:2px">${d.fullDate} · ${d.phase}</div>`,
            `<div>数值：<b>${d.value}</b> ${ind.unit}</div>`,
            `<div style="color:#64748b">机构：${d.org}</div>`,
          ]
          if (d.abnormal) lines.push('<div style="color:#f43f5e;margin-top:2px">⚠ 超出参考范围</div>')
          return lines.join('')
        },
      },
      xAxis: {
        type: 'category',
        data: xLabels,
        boundaryGap: false,
        axisTick: { alignWithLabel: true },
        axisLabel: { fontSize: 11, lineHeight: 14, formatter: (val: string, idx: number) => `${val}\n${phaseByIndex[idx]}` },
      },
      yAxis: { type: 'value', name: ind.unit, scale: true, nameTextStyle: { fontSize: 11, color: '#64748b' }, axisLabel: { fontSize: 11 } },
      series: [
        {
          type: 'line',
          smooth: true,
          symbol: 'circle',
          symbolSize: 9,
          lineStyle: { width: 2.5, color: ind.color },
          itemStyle: { color: ind.color },
          areaStyle: { color: `${ind.color}14` },
          data: rows.map((r) => ({
            value: r.value,
            fullDate: r.date,
            phase: r.phase,
            org: r.org,
            abnormal: r.abnormal,
            itemStyle: { color: stageMetaColor[r.stage] ?? ind.color },
          })),
          markLine:
            upper != null
              ? {
                  silent: true,
                  symbol: 'none',
                  lineStyle: { color: '#ef4444', type: 'dashed', width: 1 },
                  label: { formatter: `参考上限 ${upper}`, fontSize: 10, color: '#ef4444', position: 'insideEndTop' as const },
                  data: [{ yAxis: upper }],
                }
              : undefined,
        },
      ],
    },
    true,
  )
  charts[slot]!.resize()
}
function renderKeyChart() {
  if (keyChartEl.value) drawTrendChart(keyChartEl.value, 'key', keyInd.value)
}
function renderTumorChart() {
  if (tumorChartEl.value) drawTrendChart(tumorChartEl.value, 'tumor', tumorInd.value)
}

// 阶段标签样式
const stageMetaColor: Record<CourseStageKey, string> = {
  screening: '#0ea5e9',
  diagnosis: '#8b5cf6',
  treatment: '#06b6d4',
  followup: '#10b981',
}
function stageText(k: CourseStageKey) {
  return stageOptions.find((o) => o.key === k)?.label ?? k
}
function stageTagStyle(k: CourseStageKey) {
  const c = stageMetaColor[k] ?? '#64748b'
  return { color: c, borderColor: `${c}66`, background: `${c}12` }
}

// ---------- 趋势弹窗 ----------
const trendVisible = ref(false)
const trendTarget = ref<{ name: string; unit: string; rows: { date: string; value: number; org: string; stage: CourseStageKey }[] } | null>(null)
const trendChartEl = ref<HTMLElement | null>(null)
let chartInstance: echarts.ECharts | null = null

function parseRefUpper(ref: string): number | null {
  const nums = ref.split('~').map((s) => parseFloat(s)).filter((n) => !Number.isNaN(n))
  return nums.length >= 2 ? nums[1] : null
}

function openTrend(name: string) {
  const rows = (trendByName.value.get(name) ?? []).slice().sort((a, b) => a.date.localeCompare(b.date))
  const sample = flatItems.value.find((r) => r.name === name)
  trendTarget.value = { name, unit: sample?.unit ?? '', rows }
  trendVisible.value = true
}

function renderTrend() {
  if (!trendChartEl.value || !trendTarget.value) return
  if (!chartInstance) chartInstance = echarts.init(trendChartEl.value)
  const t = trendTarget.value
  const upper = (() => {
    const s = flatItems.value.find((r) => r.name === t.name)
    return s ? parseRefUpper(s.ref) : null
  })()
  chartInstance.setOption(
    {
      grid: { left: 56, right: 24, top: 30, bottom: 40 },
      tooltip: { trigger: 'axis', valueFormatter: (v: number) => `${v} ${t.unit}` },
      xAxis: { type: 'category', data: t.rows.map((r) => r.date), boundaryGap: false, axisLabel: { fontSize: 11 } },
      yAxis: { type: 'value', name: t.unit, scale: true, nameTextStyle: { fontSize: 11 }, axisLabel: { fontSize: 11 } },
      series: [
        {
          type: 'line',
          smooth: true,
          data: t.rows.map((r) => r.value),
          symbolSize: 8,
          lineStyle: { width: 2, color: '#2563eb' },
          itemStyle: { color: '#2563eb' },
          areaStyle: { color: 'rgba(37,99,235,0.08)' },
          markLine:
            upper != null
              ? {
                  silent: true,
                  symbol: 'none',
                  lineStyle: { color: '#ef4444', type: 'dashed', width: 1 },
                  label: { formatter: `参考上限 ${upper}`, fontSize: 10, color: '#ef4444', position: 'insideEndTop' as const },
                  data: [{ yAxis: upper }],
                }
              : undefined,
        },
      ],
    },
    true,
  )
  chartInstance.resize()
}

function onTrendClosed() {
  chartInstance?.dispose()
  chartInstance = null
}
watch(trendVisible, (v) => {
  if (v) nextTick(() => renderTrend())
})
watch(keySelected, renderKeyChart)
watch(tumorSelected, renderTumorChart)
watch(allReports, () => {
  renderKeyChart()
  renderTumorChart()
})
function onResize() {
  chartInstance?.resize()
  charts.key?.resize()
  charts.tumor?.resize()
}
onMounted(() => {
  window.addEventListener('resize', onResize)
  nextTick(() => {
    renderKeyChart()
    renderTumorChart()
  })
})
onBeforeUnmount(() => {
  window.removeEventListener('resize', onResize)
  chartInstance?.dispose()
  charts.key?.dispose()
  charts.tumor?.dispose()
})
</script>

<template>
  <div class="lr">
    <div class="lr__bar pf-container">
      <div class="lr__title">
        <h2>检验记录</h2>
      </div>
    </div>

    <div class="pf-container lr__body">
      <section class="pf-card lr__hero">
        <div class="lr__name">
          {{ displayName }}<span class="lr__code">{{ patient.code }}</span>
        </div>
        <div class="lr__chips">
          <el-tag size="small" :type="levelTypeVal" effect="light">{{ levelTextMap[patient.level] }}</el-tag>
          <span class="lr__chip">{{ patient.gender }} · {{ patient.age }}岁</span>
          <span class="lr__chip">PMI {{ patient.primaryId }}</span>
          <span class="lr__chip">{{ patient.org }}</span>
        </div>
      </section>

      <!-- 关键指标趋势（折线图） -->
      <section v-if="keyTrendAvailable" class="pf-card lr__trend-sec">
        <div class="lr__sec-head">
          <h3>关键指标趋势</h3>
        </div>
        <div class="lr__chart-toolbar">
          <el-select v-model="keySelected" size="small" style="width: 180px">
            <el-option v-for="i in keyIndicators" :key="i.key" :label="i.key" :value="i.key" />
          </el-select>
          <span class="lr__chart-unit">单位：{{ keyInd.unit }}</span>
        </div>
        <div ref="keyChartEl" class="lr__chart"></div>
      </section>

      <!-- 肿瘤相关指标趋势（折线图） -->
      <section v-if="tumorTrendAvailable" class="pf-card lr__trend-sec">
        <div class="lr__sec-head">
          <h3>肿瘤相关指标趋势</h3>
        </div>
        <div class="lr__chart-toolbar">
          <el-select v-model="tumorSelected" size="small" style="width: 180px">
            <el-option v-for="i in tumorIndicators" :key="i.key" :label="i.key" :value="i.key" />
          </el-select>
          <span class="lr__chart-unit">单位：{{ tumorInd.unit }}</span>
        </div>
        <div ref="tumorChartEl" class="lr__chart"></div>
      </section>

      <!-- 检验记录筛选（仅作用于下方完整检验记录表格） -->
      <section class="pf-card lr__filters">
        <div class="lr__sec-head lr__sec-head--plain">
          <h3>检验记录筛选</h3>
        </div>
        <div class="lr__filter">
          <span class="lr__filter-label">临床阶段</span>
          <el-radio-group v-model="stageFilter" size="small">
            <el-radio-button v-for="o in stageOptions" :key="o.key" :value="o.key">{{ o.label }}</el-radio-button>
          </el-radio-group>
        </div>
        <div class="lr__filter">
          <span class="lr__filter-label">检验类别</span>
          <el-radio-group v-model="catFilter" size="small">
            <el-radio-button v-for="c in catOptions" :key="c" :value="c">{{ c }}</el-radio-button>
          </el-radio-group>
        </div>
        <div class="lr__filter">
          <span class="lr__filter-label">时间</span>
          <el-radio-group v-model="sortOrder" size="small">
            <el-radio-button value="desc">最新优先</el-radio-button>
            <el-radio-button value="asc">最早优先</el-radio-button>
          </el-radio-group>
        </div>
      </section>

      <!-- 完整检验记录 -->
      <div class="lr__sec-head lr__sec-head--plain">
        <h3>完整检验记录</h3>
      </div>
      <div class="lr__summary">
        <span>共 <strong>{{ flatItems.length }}</strong> 条检验结果，来自 <strong>{{ filteredReports.length }}</strong> 张检验单</span>
      </div>

      <template v-for="g in grouped" :key="g.category">
        <section class="pf-card lr__cat">
          <div class="lr__cat-head">
            <span class="lr__dot" :style="{ background: g.color }"></span>
            <h3>{{ g.category }}</h3>
            <span class="lr__cat-count">{{ g.rows.length }} 项</span>
          </div>
          <el-table :data="g.rows" border size="small" class="lr__table">
            <el-table-column label="指标名称" min-width="190" prop="name" />
            <el-table-column label="检验结果" width="120" align="center">
              <template #default="{ row }">
                <strong :class="{ 'is-abn': row.abnormal }">{{ row.value }}</strong>
              </template>
            </el-table-column>
            <el-table-column label="单位" width="96" align="center">
              <template #default="{ row }"><span class="lr__muted">{{ row.unit || '—' }}</span></template>
            </el-table-column>
            <el-table-column label="参考范围" width="150" align="center">
              <template #default="{ row }"><span class="lr__muted">{{ row.ref }}</span></template>
            </el-table-column>
            <el-table-column label="是否异常" width="96" align="center">
              <template #default="{ row }">
                <el-tag size="small" :type="row.abnormal ? 'danger' : 'success'" effect="light">
                  {{ row.abnormal ? '异常' : '正常' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="来源" min-width="210">
              <template #default="{ row }">
                <div class="lr__src">
                  <span class="lr__src-date">{{ row.date }}</span>
                  <span class="lr__src-org">{{ row.org }}</span>
                  <el-tag size="small" effect="plain" class="lr__src-stage" :style="stageTagStyle(row.stage)">
                    {{ stageText(row.stage) }}
                  </el-tag>
                </div>
              </template>
            </el-table-column>
            <el-table-column label="趋势" width="84" align="center">
              <template #default="{ row }">
                <el-button v-if="hasTrend(row.name)" link type="primary" size="small" @click="openTrend(row.name)">
                  趋势
                </el-button>
                <span v-else class="lr__muted">—</span>
              </template>
            </el-table-column>
          </el-table>
        </section>
      </template>

      <el-empty v-if="!grouped.length" description="当前筛选条件下暂无检验记录" :image-size="80" />
    </div>

    <el-dialog
      v-model="trendVisible"
      :title="trendTarget ? trendTarget.name + ' · 历史趋势' : '历史趋势'"
      width="640px"
      destroy-on-close
      align-center
      @closed="onTrendClosed"
    >
      <div v-if="trendTarget" class="lr__trend">
        <div ref="trendChartEl" class="lr__trend-chart"></div>
        <div class="lr__trend-foot">
          <span>单位：{{ trendTarget.unit || '—' }}</span>
          <span>
            {{ trendTarget.rows.length }} 次记录 ·
            {{ trendTarget.rows[0].date }} ~ {{ trendTarget.rows[trendTarget.rows.length - 1].date }}
          </span>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<style scoped>
.lr {
  min-height: 100%;
  background: var(--pf-bg);
}
.lr__bar {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 18px 0 6px;
}
.lr__title h2 {
  font-size: 20px;
  font-weight: 800;
  color: var(--pf-text);
  margin: 0;
}
.lr__body {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding-bottom: 40px;
}
.lr__hero {
  padding: 16px 20px;
}
.lr__name {
  font-size: 18px;
  font-weight: 800;
  color: var(--pf-text);
  display: flex;
  align-items: baseline;
  gap: 10px;
}
.lr__code {
  font-family: ui-monospace, Consolas, monospace;
  font-size: 12px;
  color: var(--pf-text-faint);
  font-weight: 600;
}
.lr__chips {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
  margin-top: 8px;
}
.lr__chip {
  font-size: 12px;
  color: var(--pf-text-soft);
  background: var(--pf-bg-soft);
  padding: 3px 10px;
  border-radius: 999px;
}
.lr__filters {
  padding: 14px 18px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.lr__filter {
  display: flex;
  align-items: center;
  gap: 14px;
  flex-wrap: wrap;
}
.lr__filter-label {
  font-size: 13px;
  font-weight: 600;
  color: var(--pf-text-soft);
  min-width: 64px;
}
.lr__summary {
  display: flex;
  align-items: center;
  gap: 14px;
  font-size: 13px;
  color: var(--pf-text-soft);
  padding: 0 4px;
}
.lr__summary strong {
  color: var(--pf-text);
}
.lr__trend-sec {
  padding: 14px 18px 18px;
}
.lr__sec-head {
  display: flex;
  align-items: baseline;
  gap: 10px;
  margin-bottom: 12px;
}
.lr__sec-head h3 {
  font-size: 15px;
  font-weight: 700;
  color: var(--pf-text);
  margin: 0;
}
.lr__sec-head--plain {
  margin-top: 2px;
}
.lr__chart-toolbar {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 8px;
}
.lr__chart-unit {
  font-size: 12px;
  color: var(--pf-text-faint);
}
.lr__chart {
  width: 100%;
  height: 280px;
}
.lr__cat {
  padding: 14px 18px 18px;
}
.lr__cat-head {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
}
.lr__dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
}
.lr__cat-head h3 {
  font-size: 15px;
  font-weight: 700;
  color: var(--pf-text);
  margin: 0;
}
.lr__cat-count {
  font-size: 12px;
  color: var(--pf-text-faint);
}
.lr__table {
  border-radius: 12px;
  overflow: hidden;
}
.lr__muted {
  color: var(--pf-text-faint);
}
.is-abn {
  color: #f43f5e;
}
.lr__src {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  font-size: 12px;
  color: var(--pf-text-soft);
}
.lr__src-date {
  font-family: ui-monospace, Consolas, monospace;
}
.lr__src-stage {
  font-weight: 600;
}
.lr__trend-chart {
  width: 100%;
  height: 300px;
}
.lr__trend-foot {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: var(--pf-text-faint);
  margin-top: 10px;
}
</style>
