<script setup lang="ts">
import { computed, ref, watch, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import * as echarts from 'echarts'
import { ArrowLeft, Lock, Download, WarningFilled, InfoFilled, Connection } from '@element-plus/icons-vue'
import EChart from '@/components/EChart.vue'
import {
  resolvePatientDetail,
  maskIdNo,
  maskPhone,
  maskAddress,
  type DataLevel,
  type LabSeries,
  type TimelineNode,
} from '@/mock/patients'

const route = useRoute()
const router = useRouter()

// ---------- 当前患者（缺失详情时由列表行合成最小可用详情） ----------
const patient = computed(() => resolvePatientDetail(route.params.id as string))
const isSynth = computed(() => patient.value.joinedAt === '—')

// ---------- 脱敏权限状态（与临床状态分开表达） ----------
const levelText: Record<DataLevel, string> = { full: '完全可见', masked: '脱敏可见', summary: '摘要可见' }
const levelType: Record<DataLevel, 'success' | 'warning' | 'info'> = {
  full: 'success', masked: 'warning', summary: 'info',
}
// ---------- 临床状态语义色 ----------
const statusType: Record<string, 'primary' | 'success' | 'warning' | 'info'> = {
  随访中: 'primary', 治疗中: 'warning', 失访: 'info', 已结案: 'success',
}
const statusColor: Record<string, string> = {
  随访中: '#06b6d4', 治疗中: '#f59e0b', 失访: '#94a3b8', 已结案: '#10b981',
}

// ---------- 姓名门控（数据不出域：非 full 级遮蔽） ----------
const displayName = computed(() =>
  patient.value.level === 'full' ? patient.value.name : `*${patient.value.name.slice(-1)}`,
)
const masked = computed(() => ({
  idNo: maskIdNo(patient.value.idNo),
  phone: maskPhone(patient.value.phone),
  address: maskAddress(patient.value.address),
}))

function applyFullView() {
  ElMessage.info(`已提交完整档案授权申请（${patient.value.code}），等待数据治理审批，审计已留痕。`)
}
function exportSummary() {
  ElMessage.success('摘要导出任务已创建（按当前可见级别脱敏），审计已留痕。')
}
function goBack() {
  router.push('/dataset/patients')
}

// ---------- 功能导航（一级业务视图） ----------
// 患者旅程已独立为左侧固定导航轴，不再作为页签；点击旅程节点会联动此处
type NavKey = 'overview' | 'exams' | 'pathology' | 'treatment' | 'followup' | 'archive'
const navItems: { key: NavKey; label: string; color: string }[] = [
  { key: 'overview', label: '就诊概览', color: '#0ea5e9' },
  { key: 'exams', label: '检查检验', color: '#f59e0b' },
  { key: 'pathology', label: '病理与分子', color: '#8b5cf6' },
  { key: 'treatment', label: '治疗记录', color: '#06b6d4' },
  { key: 'followup', label: '随访预后', color: '#10b981' },
  { key: 'archive', label: '完整档案', color: '#64748b' },
]
const activeNav = ref<NavKey>('overview')
// 左侧旅程轴当前选中节点（点击或联动高亮）
const selectedNodeId = ref('')

// ---------- 事件 → 页面映射（统一业务语义：两级导航一致） ----------
// 就诊节点→就诊概览（作为结构性标记，点击定位该次就诊）；检查→检查检验；诊断分期→病理与分子；
// 治疗决策/治疗→治疗记录；疗效评估/复查/随访/复发转移→随访预后
const kindToNav: Record<string, NavKey> = {
  就诊节点: 'overview',
  检查: 'exams',
  诊断分期: 'pathology',
  治疗决策: 'treatment',
  治疗: 'treatment',
  疗效评估: 'followup',
  复查: 'followup',
  随访: 'followup',
  复发转移: 'followup',
}
const followupKinds = ['随访', '复查', '疗效评估', '复发转移']

// ---------- 患者旅程时间轴（核心，事件级） ----------
// 二级筛选仅用于筛选时间轴，与一级导航保持同名/同色/同业务归属。
// 「就诊」由时间轴的「就诊节点」承载，与右侧「就诊概览」同源；筛选「就诊」即只看真实门诊/急诊。
const timelineFilters = [
  { label: '全部', value: 'all', color: '#2563eb' },
  { label: '就诊', value: '就诊节点', color: '#0ea5e9' },
  { label: '检查', value: '检查', color: '#f59e0b' },
  { label: '病理分期', value: '诊断分期', color: '#8b5cf6' },
  { label: '治疗', value: '治疗', color: '#06b6d4' },
  { label: '随访', value: '随访', color: '#10b981' },
] as const
const timelineFilter = ref('all')
const kindColor: Record<string, string> = {
  就诊节点: '#0ea5e9', 检查: '#f59e0b', 诊断分期: '#8b5cf6',
  治疗决策: '#6366f1', 治疗: '#06b6d4',
  疗效评估: '#10b981', 复查: '#10b981', 随访: '#10b981', 复发转移: '#ef4444',
}

// 按真实日期倒序排列（系统操作不计入核心临床旅程）
const timelineAll = computed(() =>
  [...patient.value.timeline].sort((a, b) => b.date.localeCompare(a.date)),
)
// 二级筛选：治疗决策归入「治疗」，病理/分期覆盖诊断分期，随访覆盖疗效评估/复查/随访/复发转移
// 「就诊」为独立筛选桶（由真实就诊生成），仅在「全部」或「就诊」时展示就诊节点
function kindMatch(kind: string): boolean {
  const f = timelineFilter.value
  if (f === 'all') return true
  if (f === '就诊节点') return kind === '就诊节点'
  if (f === '诊断分期') return kind === '诊断分期'
  if (f === '治疗') return kind === '治疗' || kind === '治疗决策'
  if (f === '随访') return followupKinds.includes(kind)
  return kind === f
}
const filteredTimeline = computed(() => timelineAll.value.filter((t) => kindMatch(t.kind)))

// 点击旅程事件 → 进入对应业务页面 → 左侧选中态 + 右侧按记录 id 滚动并短暂高亮
const highlightRef = ref('')
// 点击左侧就诊节点 → 右侧就诊概览定位并高亮对应的真实就诊卡
const flashVisitId = ref('')
// 就诊概览为真实门诊/急诊经历的独立视图，与左侧时间轴事件级不再做双向就诊高亮联动
async function goToEvent(node: TimelineNode) {
  // 就诊节点对应一条真实就诊：点击切到就诊概览并定位/高亮该就诊卡（node.id === 就诊 id）
  if (node.kind === '就诊节点') {
    activeNav.value = 'overview'
    selectedNodeId.value = node.id
    await nextTick()
    const el = document.getElementById('visit-' + node.id)
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' })
      flashVisitId.value = node.id
      window.setTimeout(() => {
        if (flashVisitId.value === node.id) flashVisitId.value = ''
      }, 2600)
    }
    return
  }
  const target = kindToNav[node.kind] ?? 'overview'
  activeNav.value = target
  selectedNodeId.value = node.id
  await nextTick()
  const id = node.ref ?? node.id
  highlightRef.value = id
  const el = document.getElementById('rec-' + id)
  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' })
  window.setTimeout(() => {
    if (highlightRef.value === id) highlightRef.value = ''
  }, 2600)
}
// 最近事件 = 真实日期最新节点；当前阶段 = 进行中治疗（其余状态按临床状态推导）
const recentNodeId = computed(() => timelineAll.value[0]?.id ?? '')
const currentTreatment = computed(
  () => patient.value.treatments.find((t) => t.status === '进行中') ?? patient.value.treatments[patient.value.treatments.length - 1] ?? null,
)
// 当前阶段依据患者真实临床状态自动判断：仅“治疗中”高亮进行中治疗，其余按状态推导
const currentStageNodeId = computed(() => {
  if (patient.value.status !== '治疗中') return ''
  const ct = currentTreatment.value
  if (!ct) return ''
  const hit = timelineAll.value.find((n) => n.kind === '治疗' && n.title.includes(ct.name))
  const fallback = timelineAll.value.filter((n) => n.kind === '治疗')[0]
  return (hit ?? fallback)?.id ?? ''
})
const phaseLabel: Record<string, string> = {
  随访中: '规律随访阶段',
  已结案: '治疗结束 · 已结案',
  失访: '失访 · 联系中断',
}
const currentStageText = computed(() => {
  if (patient.value.status === '治疗中' && currentTreatment.value) {
    return `${currentTreatment.value.name}（${currentTreatment.value.line}）`
  }
  return phaseLabel[patient.value.status] ?? patient.value.status
})

// ---------- 全局临床摘要（顶部共享，原右侧四卡升级） ----------
const treatmentPhaseText = computed(() =>
  patient.value.status === '治疗中' && currentTreatment.value
    ? `${currentTreatment.value.line} · ${currentTreatment.value.modality}`
    : phaseLabel[patient.value.status] ?? patient.value.status,
)
const recentConclusion = computed(() =>
  patient.value.followUps[0]?.summary ?? patient.value.timeline[0]?.desc ?? '—',
)
const nextFollowUp = computed(() => patient.value.followUps[0]?.nextDate ?? '—')
const molecularCount = computed(() => patient.value.resources.filter((r) => r.type === '基因检测').length)
const keyDiagnosis = computed(() => patient.value.diagnoses[patient.value.diagnoses.length - 1] ?? null)

const summaryTreatment = computed(() =>
  currentTreatment.value ? `${currentTreatment.value.name}（${currentTreatment.value.line}）` : '暂无进行中治疗',
)
const summaryExam = computed(() =>
  activeLab.value && latestLab.value ? `${latestLab.value.value} ${activeLab.value.unit} · ${activeLab.value.name}` : '暂无检验指标',
)
const summaryMolecular = computed(() =>
  keyDiagnosis.value
    ? `${keyDiagnosis.value.histology} · ${keyDiagnosis.value.t}${keyDiagnosis.value.n}${keyDiagnosis.value.m} · ${keyDiagnosis.value.stage}`
    : '—',
)
const summaryFollowup = computed(() =>
  `${patient.value.status} · 下次 ${nextFollowUp.value} · 累计 ${patient.value.followUps.length} 次`,
)

// ---------- 检验指标趋势 ----------
const activeLabKey = ref('cea')
const activeLab = computed<LabSeries | undefined>(() =>
  patient.value.labs.find((l) => l.key === activeLabKey.value),
)
const labOption = computed(() => {
  const lab = activeLab.value
  if (!lab) return {}
  const gradient = new echarts.graphic.LinearGradient(0, 0, 0, 1, [
    { offset: 0, color: 'rgba(37,99,235,0.18)' },
    { offset: 1, color: 'rgba(37,99,235,0.01)' },
  ])
  return {
    tooltip: { trigger: 'axis' },
    grid: { left: 52, right: 28, top: 30, bottom: 40 },
    xAxis: { type: 'category', boundaryGap: false, data: lab.points.map((p) => p.date) },
    yAxis: { type: 'value', scale: true },
    series: [
      {
        type: 'line',
        smooth: true,
        symbol: 'circle',
        symbolSize: 7,
        data: lab.points.map((p) => p.value),
        lineStyle: { width: 3, color: '#2563eb' },
        itemStyle: { color: '#2563eb' },
        areaStyle: { color: gradient },
        markLine: {
          symbol: 'none',
          data: [
            {
              yAxis: lab.refUpper,
              lineStyle: { color: '#f59e0b', type: 'dashed' },
              label: { formatter: `参考上限 ${lab.refUpper}${lab.unit}`, color: '#f59e0b', fontSize: 11 },
            },
          ],
        },
      },
    ],
  }
})
watch(
  () => route.params.id,
  () => {
    activeLabKey.value = patient.value.labs[0]?.key ?? ''
  },
  { immediate: true },
)
const latestLab = computed(() =>
  activeLab.value ? activeLab.value.points[activeLab.value.points.length - 1] : null,
)
function labLatest(lab: LabSeries) {
  return lab.points[lab.points.length - 1]
}
function labAbnormal(lab: LabSeries) {
  const v = labLatest(lab).value
  return v > lab.refUpper || v < lab.refLower
}
const labStatus = computed(() => {
  const lab = activeLab.value
  if (!lab || !latestLab.value) return { text: '', tone: '' }
  if (latestLab.value.value > lab.refUpper) return { text: '超出参考范围', tone: '#f43f5e' }
  return { text: '参考范围内', tone: '#10b981' }
})
function makeSpark(lab: LabSeries) {
  return {
    grid: { left: 2, right: 2, top: 8, bottom: 2 },
    xAxis: { type: 'category', show: false, data: lab.points.map((p) => p.date) },
    yAxis: { type: 'value', show: false, scale: true },
    series: [
      {
        type: 'line',
        smooth: true,
        symbol: 'none',
        data: lab.points.map((p) => p.value),
        lineStyle: { width: 2, color: labAbnormal(lab) ? '#f43f5e' : '#2563eb' },
        areaStyle: { color: labAbnormal(lab) ? 'rgba(244,63,94,0.10)' : 'rgba(37,99,235,0.10)' },
      },
    ],
  }
}
// 异常变化：所有指标中超界的历史点
const abnormalPoints = computed(() => {
  const out: { lab: string; date: string; value: number; unit: string; ref: string }[] = []
  for (const lab of patient.value.labs) {
    for (const p of lab.points) {
      if (p.value > lab.refUpper || p.value < lab.refLower) {
        out.push({ lab: lab.name, date: p.date, value: p.value, unit: lab.unit, ref: `${lab.refLower}~${lab.refUpper}` })
      }
    }
  }
  return out
})
// 最近检查：时间轴中"检查"类事件（取最新 3 条）
const recentExams = computed(() => patient.value.timeline.filter((t) => t.kind === '检查').slice(0, 3))

// ---------- 就诊概览（就诊级聚合，与左侧事件级时间轴职责区分） ----------
// 按真实日期倒序展示，最新就诊在前
const visits = computed(() =>
  [...patient.value.visits].sort((a, b) => b.date.localeCompare(a.date)),
)
const visitTypeColor: Record<string, string> = {
  门诊: '#0ea5e9', 急诊: '#ef4444',
}

// ---------- 资源图标 ----------
const resourceIcon: Record<string, string> = {
  内镜: 'Camera', CT: 'View', MRI: 'View', 病理切片: 'Notebook', 基因检测: 'DataLine',
}
const resIconColor: Record<string, string> = {
  内镜: '#2563eb', CT: '#06b6d4', MRI: '#06b6d4', 病理切片: '#f59e0b', 基因检测: '#8b5cf6',
}
function openResource() {
  ElMessage.info('原型演示：多模态资源预览位于「完整档案 / 多模态资源」模块')
}

// ---------- 疗效标签 ----------
const effType: Record<string, 'success' | 'primary' | 'warning' | 'danger' | 'info'> = {
  CR: 'success', PR: 'primary', SD: 'warning', PD: 'danger', '—': 'info',
}

// ---------- 随访预后：长期管理推导 ----------
const latestFU = computed(() => patient.value.followUps[0])
const diseaseState = computed(() => {
  const o = latestFU.value?.outcome
  if (!o) return '待补全'
  if (o === '无病生存') return '无病生存'
  if (o === '局部复发') return '局部复发'
  if (o === '远处转移') return '远处转移'
  if (o === '死亡') return '终点事件'
  return o
})
const recurState = computed(() => {
  const o = latestFU.value?.outcome
  if (!o) return '待补全'
  return o === '局部复发' || o === '远处转移' ? '存在复发 / 转移' : '未见复发 / 转移'
})

// ---------- 完整档案：数据资产完整性 ----------
const completeness = computed(() => [
  { key: '诊断与分期', ok: patient.value.diagnoses.length > 0 },
  { key: '治疗记录', ok: patient.value.treatments.length > 0 },
  { key: '随访记录', ok: patient.value.followUps.length > 0 },
  { key: '检验指标', ok: patient.value.labs.length > 0 },
  { key: '多模态资源', ok: patient.value.resources.length > 0 },
  { key: '访问审计', ok: patient.value.audits.length > 0 },
])
const completeCount = computed(() => completeness.value.filter((c) => c.ok).length)
</script>

<template>
  <div class="pd">
    <!-- 返回 -->
    <div class="pd__bar">
      <el-button text :icon="ArrowLeft" class="pd__back" @click="goBack">返回患者列表</el-button>
    </div>

    <!-- ===================== 顶部全宽患者总览（三部分） ===================== -->
    <section class="pd__hero pf-card">
      <!-- 左：身份信息 -->
      <div class="pd__hero-col pd__hero-id">
        <div class="pd__id-top">
          <div class="pd__avatar">{{ displayName.slice(-1) }}</div>
          <div class="pd__id-name">
            <div class="pd__name-row">
              <span class="pd__name">{{ displayName }}</span>
              <el-tag :type="levelType[patient.level]" size="small" effect="light" round>
                {{ levelText[patient.level] }}
              </el-tag>
            </div>
            <div class="pd__id-chips">
              <span class="pd__chip">{{ patient.gender }} · {{ patient.age }} 岁</span>
              <span class="pd__chip pd__chip--mono">{{ patient.primaryId }}</span>
              <span class="pd__chip">{{ patient.org }}</span>
            </div>
          </div>
        </div>
        <div class="pd__dx">
          <div class="pd__dx-label">主要诊断</div>
          <div class="pd__dx-main">{{ patient.diagnosis }}</div>
          <div class="pd__dx-stage">
            <span class="pd__dx-stage-k">TNM 分期</span>
            <span class="pd__stage-pill">{{ patient.stage }}</span>
          </div>
        </div>
      </div>

      <!-- 中：临床状态焦点 -->
      <div class="pd__hero-col pd__hero-clinical">
        <div class="pd__clini-row">
          <span class="pd__clini-label">当前临床状态</span>
          <span class="pd__status-pill" :style="{ background: statusColor[patient.status] + '1a', color: statusColor[patient.status], borderColor: statusColor[patient.status] + '55' }">
            <i class="pd__status-dot" :style="{ background: statusColor[patient.status] }"></i>{{ patient.status }}
          </span>
        </div>
        <div class="pd__clini-row">
          <span class="pd__clini-label">治疗阶段</span>
          <span class="pd__clini-val">{{ treatmentPhaseText }}</span>
        </div>
        <div class="pd__clini-row pd__clini-row--block">
          <span class="pd__clini-label">最近病情结论</span>
          <span class="pd__clini-concl">{{ recentConclusion }}</span>
        </div>
      </div>

      <!-- 右：关键指标 + 操作 -->
      <div class="pd__hero-col pd__hero-metrics">
        <div class="pd__metrics">
          <div class="pd__metric">
            <strong>{{ patient.followUps.length }}</strong><span>随访次数</span>
          </div>
          <div class="pd__metric">
            <strong>{{ patient.treatments.length }}</strong><span>治疗线数</span>
          </div>
          <div class="pd__metric">
            <strong>{{ patient.resources.length }}</strong><span>多模态资源</span>
          </div>
          <div class="pd__metric">
            <strong class="pd__metric-sm">{{ patient.followUps[0]?.date || '—' }}</strong><span>最近随访日期</span>
          </div>
        </div>
        <div class="pd__ops">
          <el-button v-if="patient.level !== 'full'" round type="primary" plain @click="applyFullView">
            <el-icon><Lock /></el-icon>&nbsp;申请完整授权
          </el-button>
          <el-button round plain @click="exportSummary">
            <el-icon><Download /></el-icon>&nbsp;导出脱敏摘要
          </el-button>
        </div>
      </div>
    </section>

    <!-- 全局临床摘要（所有页签共享，原右侧四卡升级） -->
    <section class="pd__summary">
      <div class="pd__sum-cell">
        <span class="pd__sum-dot" style="background:#06b6d4"></span>
        <div class="pd__sum-meta">
          <div class="pd__sum-k">当前治疗方案</div>
          <div class="pd__sum-v">{{ summaryTreatment }}</div>
        </div>
      </div>
      <div class="pd__sum-cell">
        <span class="pd__sum-dot" style="background:#2563eb"></span>
        <div class="pd__sum-meta">
          <div class="pd__sum-k">最近检查结论</div>
          <div class="pd__sum-v">{{ summaryExam }}</div>
        </div>
      </div>
      <div class="pd__sum-cell">
        <span class="pd__sum-dot" style="background:#8b5cf6"></span>
        <div class="pd__sum-meta">
          <div class="pd__sum-k">关键病理 / 分子</div>
          <div class="pd__sum-v">{{ summaryMolecular }}</div>
          <div class="pd__sum-sub">分子检测 {{ molecularCount }} 项</div>
        </div>
      </div>
      <div class="pd__sum-cell">
        <span class="pd__sum-dot" :style="{ background: statusColor[patient.status] }"></span>
        <div class="pd__sum-meta">
          <div class="pd__sum-k">随访状态</div>
          <div class="pd__sum-v">{{ summaryFollowup }}</div>
        </div>
      </div>
    </section>

    <!-- 隐私 / 合成提示 -->
    <div class="pd__notice" :class="{ 'pd__notice--masked': patient.level !== 'full' }">
      <el-icon><Lock /></el-icon>
      <span v-if="patient.level === 'full'">
        当前为<strong>完全可见</strong>视图（本机构可信终端），姓名等原始 PII 可展示；所有访问已记入审计日志。
      </span>
      <span v-else>
        当前为<strong>脱敏权限 · {{ levelText[patient.level] }}</strong>视图：姓名、证件号、联系方式按数据不出域策略遮蔽，完整字段需发起跨机构授权。
      </span>
    </div>
    <div v-if="isSynth" class="pd__notice pd__notice--synth">
      <el-icon><InfoFilled /></el-icon>
      <span>该患者为列表快照，<strong>详细诊疗记录待补全</strong>；下方时间轴与摘要由主索引摘要生成，仅供定位参考。</span>
    </div>

    <!-- ===================== 主体：左 临床导航轴 / 右 业务详情（导航置于右栏顶部，与左侧时间轴并列） ===================== -->
    <div class="pd__main">
      <!-- 左侧：临床导航轴（始终可见，按真实日期倒序；当前阶段/最近事件由高亮表达） -->
      <aside class="pd__axis">
        <div class="pd__axis-head">
          <h3 class="pd__h pd__h--inline">诊疗时间轴</h3>
          <el-radio-group v-model="timelineFilter" size="small">
            <el-radio-button
              v-for="k in timelineFilters"
              :key="k.value"
              :value="k.value"
              :style="timelineFilter === k.value ? { background: k.color, borderColor: k.color, color: '#fff' } : { color: k.color }"
            >{{ k.label }}</el-radio-button>
          </el-radio-group>
        </div>
        <el-timeline class="pd__tl">
          <el-timeline-item
            v-for="node in filteredTimeline"
            :key="node.id"
            :timestamp="`${node.date || '待补全'} · ${node.org}`"
            placement="top"
            :color="kindColor[node.kind]"
            :hollow="node.kind === '检查'"
          >
            <div
              :id="'tl-' + node.id"
              class="pd__tl-card pd__tl-card--click"
              :class="{
                'is-encounter': node.kind === '就诊节点',
                'is-selected': node.id === selectedNodeId,
                'is-recent': node.id === recentNodeId,
                'is-current': node.id === currentStageNodeId,
              }"
              :style="{ borderLeftColor: kindColor[node.kind] }"
              @click="goToEvent(node)"
            >
              <div class="pd__tl-title">
                <el-tag size="small" effect="plain" :style="{ color: kindColor[node.kind], borderColor: kindColor[node.kind] }">
                  {{ node.kind }}
                </el-tag>
                <span>{{ node.title }}</span>
                <span v-if="node.id === recentNodeId" class="pd__tl-badge pd__tl-badge--recent">最近事件</span>
                <span v-else-if="node.id === currentStageNodeId" class="pd__tl-badge pd__tl-badge--current">当前阶段</span>
              </div>
              <p class="pd__tl-desc">{{ node.desc }}</p>
            </div>
          </el-timeline-item>
        </el-timeline>
      </aside>

      <!-- 右侧：业务详情（导航在顶部，点击左侧事件联动切换并滚动高亮对应记录） -->
      <div class="pd__detail">
        <!-- 一级业务导航：置于右栏顶部，与左侧时间轴并列 -->
        <nav class="pd__nav">
          <button
            v-for="n in navItems"
            :key="n.key"
            class="pd__nav-item"
            :class="{ 'is-active': activeNav === n.key }"
            :style="activeNav === n.key ? { background: n.color, borderColor: n.color } : {}"
            @click="activeNav = n.key"
          >
            <span class="pd__nav-dot" :style="{ background: n.color }"></span>
            {{ n.label }}
          </button>
        </nav>
        <!-- ① 就诊概览：患者跨机构真实门诊/急诊经历（与左侧事件级时间轴职责区分） -->
        <div v-if="activeNav === 'overview'">
          <div class="pd__group pd__group--flush" id="rec-clinical">
            <div class="pd__sec-head">
              <h3 class="pd__h pd__h--inline">就诊概览</h3>
              <span class="pd__visit-count">{{ visits.length }} 次就诊</span>
            </div>
            <div v-if="visits.length" class="pd__visits">
              <div
                v-for="v in visits"
                :key="v.id"
                :id="'visit-' + v.id"
                class="pd__visit"
                :class="{ 'pd__flash': flashVisitId === v.id }"
                :style="{ borderLeftColor: visitTypeColor[v.type] }"
              >
                <div class="pd__visit-head">
                  <span class="pd__visit-type" :style="{ color: visitTypeColor[v.type], background: visitTypeColor[v.type] + '1a' }">{{ v.type }}</span>
                  <span class="pd__visit-date">{{ v.date || '待补全' }}</span>
                  <span class="pd__visit-org">{{ v.org }}</span>
                </div>
                <div class="pd__visit-body">
                  <div class="pd__visit-row">
                    <span class="pd__visit-k">就诊科室</span>
                    <span class="pd__visit-v">{{ v.dept }}</span>
                  </div>
                  <div class="pd__visit-row">
                    <span class="pd__visit-k">就诊原因</span>
                    <span class="pd__visit-v">{{ v.reason }}</span>
                  </div>
                  <div class="pd__visit-row">
                    <span class="pd__visit-k">主要诊断</span>
                    <span class="pd__visit-v">{{ v.diagnosis }}</span>
                  </div>
                  <div class="pd__visit-row">
                    <span class="pd__visit-k">就诊去向</span>
                    <span class="pd__visit-v pd__visit-concl">{{ v.disposition }}</span>
                  </div>
                </div>
              </div>
            </div>
            <el-empty v-else description="暂无结构化就诊记录" :image-size="70" />
          </div>
        </div>

        <!-- ② 检查检验：趋势 + 全部指标 + 异常 + 最近检查 -->
        <div v-else-if="activeNav === 'exams'">
          <div class="pd__exams-top">
            <div class="pd__group pd__exams-chart">
              <div class="pd__sec-head">
                <h3 class="pd__h pd__h--inline">关键指标趋势</h3>
                <el-radio-group v-model="activeLabKey" size="small">
                  <el-radio-button v-for="l in patient.labs" :key="l.key" :value="l.key">{{ l.name.replace(/\s.*/, '') }}</el-radio-button>
                </el-radio-group>
              </div>
              <EChart v-if="activeLab" :option="labOption" />
              <el-empty v-else description="暂无检验指标" :image-size="80" />
            </div>
            <div class="pd__group pd__exams-list">
              <h3 class="pd__h">全部指标</h3>
              <div v-if="patient.labs.length" class="pd__metric-list">
                <div v-for="l in patient.labs" :key="l.key" class="pd__metric-item" :class="{ 'is-active': l.key === activeLabKey }" @click="activeLabKey = l.key">
                  <div class="pd__metric-top">
                    <span class="pd__metric-name">{{ l.name }}</span>
                    <span class="pd__metric-val" :style="{ color: labAbnormal(l) ? '#f43f5e' : '#10b981' }">
                      {{ labLatest(l).value }}<i>{{ l.unit }}</i>
                    </span>
                  </div>
                  <EChart class="pd__spark" :option="makeSpark(l)" />
                  <div class="pd__metric-ref">参考 {{ l.refLower }}~{{ l.refUpper }} {{ l.unit }}</div>
                </div>
              </div>
              <el-empty v-else description="暂无检验指标" :image-size="70" />
            </div>
          </div>
          <div class="pd__exams-bottom">
            <div class="pd__group">
              <h3 class="pd__h">异常变化</h3>
              <div v-if="abnormalPoints.length" class="pd__abn">
                <div v-for="(a, i) in abnormalPoints" :key="i" class="pd__abn-row">
                  <span class="pd__abn-dot"></span>
                  <span class="pd__abn-lab">{{ a.lab }}</span>
                  <span class="pd__abn-val">{{ a.value }} {{ a.unit }}</span>
                  <span class="pd__abn-date">{{ a.date }}</span>
                  <span class="pd__abn-ref">参考 {{ a.ref }}</span>
                </div>
              </div>
              <el-empty v-else description="无超界记录" :image-size="70" />
            </div>
            <div class="pd__group">
              <h3 class="pd__h">最近检查</h3>
              <div v-if="recentExams.length" class="pd__recent">
                <div v-for="e in recentExams" :key="e.id" :id="'rec-' + e.id" class="pd__recent-row" :class="{ 'pd__flash': highlightRef === e.id }">
                  <span class="pd__recent-date">{{ e.date || '待补全' }}</span>
                  <div class="pd__recent-body">
                    <div class="pd__recent-title">{{ e.title }}</div>
                    <div class="pd__recent-desc">{{ e.desc }}</div>
                  </div>
                </div>
              </div>
              <el-empty v-else description="暂无检查记录" :image-size="70" />
            </div>
          </div>
        </div>

        <!-- ④ 病理与分子：诊断 → 分期 → 分子 → 报告 -->
        <div v-else-if="activeNav === 'pathology'">
          <div class="pd__group">
            <h3 class="pd__h">诊断与分期（{{ patient.diagnoses.length }}）</h3>
            <div class="pd__dx-list">
              <div
                v-for="d in patient.diagnoses"
                :key="d.id"
                :id="'rec-' + d.id"
                class="pd__dx-card"
                :class="{ 'pd__flash': highlightRef === d.id }"
              >
                <div class="pd__dx-card-head">
                  <span class="pd__dx-card-type">{{ d.type }}</span>
                  <span class="pd__dx-card-stage" :style="{ color: '#8b5cf6', borderColor: 'rgba(139,92,246,0.4)' }">{{ d.t }} {{ d.n }} {{ d.m }} · {{ d.stage }}</span>
                </div>
                <div class="pd__dx-card-main">{{ d.histology }} · {{ d.differentiation }} · {{ d.site }}</div>
                <div class="pd__dx-card-tag">依据 {{ d.basis }} · {{ d.org }} · {{ d.date }}</div>
              </div>
            </div>
          </div>
          <div class="pd__group">
            <h3 class="pd__h">分子标志物</h3>
            <div v-if="molecularCount" class="pd__chain-mol-list">
              <div v-for="r in patient.resources.filter((x) => x.type === '基因检测')" :key="r.id" class="pd__chain-mol">
                {{ r.title }}
              </div>
            </div>
            <div v-else class="pd__chain-empty">暂无分子检测</div>
          </div>
          <div class="pd__group">
            <h3 class="pd__h">检测报告</h3>
            <div v-if="patient.resources.filter((x) => x.type === '基因检测').length" class="pd__chain-rep-list">
              <div v-for="r in patient.resources.filter((x) => x.type === '基因检测')" :key="r.id" class="pd__chain-rep">
                <span>{{ r.format }} · {{ r.size }}</span>
                <span class="pd__mono">{{ r.date }}</span>
                <el-tag size="small" effect="plain" :type="r.status === '待对齐' ? 'warning' : 'success'">{{ r.status }}</el-tag>
              </div>
            </div>
            <div v-else class="pd__chain-empty">暂无报告</div>
          </div>
        </div>

        <!-- ⑤ 治疗记录：连续关系流程 -->
        <div v-else-if="activeNav === 'treatment'">
          <div v-if="patient.treatments.length" class="pd__txflow">
            <div v-for="(t, i) in patient.treatments" :key="t.id" :id="'rec-' + t.id" class="pd__txnode" :class="{ 'is-doing': t.status === '进行中', 'pd__flash': highlightRef === t.id }">
              <div class="pd__tx-rail">
                <span class="pd__tx-dot"></span>
                <span v-if="i < patient.treatments.length - 1" class="pd__tx-line"></span>
              </div>
              <div class="pd__tx-card">
                <div class="pd__tx-head">
                  <div class="pd__tx-title">
                    <el-tag size="small" effect="dark" round>{{ t.line }}</el-tag>
                    <span class="pd__tx-name">{{ t.name }}</span>
                  </div>
                  <el-tag size="small" :type="effType[t.efficacy]" effect="light">疗效 {{ t.efficacy }}</el-tag>
                  <span class="pd__tx-status" :class="{ 'pd__tx-status--doing': t.status === '进行中' }">{{ t.status }}</span>
                </div>
                <div class="pd__tx-meta">
                  <span>{{ t.modality }}</span>
                  <span>{{ t.scheme }}</span>
                  <span>{{ t.cycles }}</span>
                  <span>{{ t.startDate }} ~ {{ t.endDate === '—' ? '至今' : t.endDate }}</span>
                  <span>{{ t.org }}</span>
                </div>
                <div v-if="i < patient.treatments.length - 1" class="pd__tx-next">下一阶段：{{ patient.treatments[i + 1].line }}</div>
              </div>
            </div>
          </div>
          <el-empty v-else description="暂无治疗记录" :image-size="80" />
        </div>

        <!-- ⑥ 随访预后：长期管理 -->
        <div v-else-if="activeNav === 'followup'">
          <div class="pd__group pd__prog">
            <h3 class="pd__h">长期管理概览</h3>
            <div class="pd__prog-grid">
              <div class="pd__prog-cell">
                <div class="pd__prog-k">疾病状态</div>
                <div class="pd__prog-v" :style="{ color: diseaseState === '无病生存' ? '#10b981' : diseaseState === '待补全' ? 'var(--pf-text-faint)' : '#f59e0b' }">{{ diseaseState }}</div>
              </div>
              <div class="pd__prog-cell">
                <div class="pd__prog-k">生存结局</div>
                <div class="pd__prog-v">{{ latestFU?.outcome ?? '待补全' }}</div>
              </div>
              <div class="pd__prog-cell">
                <div class="pd__prog-k">复发 / 转移</div>
                <div class="pd__prog-v" :style="{ color: recurState.startsWith('存在') ? '#f43f5e' : 'var(--pf-text)' }">{{ recurState }}</div>
              </div>
              <div class="pd__prog-cell">
                <div class="pd__prog-k">下一次随访</div>
                <div class="pd__prog-v">{{ nextFollowUp }}</div>
              </div>
            </div>
          </div>
          <div class="pd__group">
            <h3 class="pd__h">随访记录（{{ patient.followUps.length }} 条）</h3>
              <div v-if="patient.followUps.length" class="pd__fu-list">
              <div v-for="f in patient.followUps" :key="f.id" :id="'rec-' + f.id" class="pd__fu-row" :class="{ 'pd__flash': highlightRef === f.id }">
                <div class="pd__fu-date">{{ f.date }}</div>
                <div class="pd__fu-body">
                  <div class="pd__fu-top">
                    <el-tag size="small" :type="f.outcome === '无病生存' ? 'success' : f.outcome === '死亡' ? 'danger' : 'warning'" effect="light">{{ f.outcome }}</el-tag>
                    <span class="pd__fu-mod">{{ f.modality }}</span>
                    <span class="pd__fu-next">下次 {{ f.nextDate }}</span>
                    <span class="pd__fu-org">{{ f.org }}</span>
                  </div>
                  <div class="pd__fu-sum">{{ f.summary }}</div>
                </div>
              </div>
            </div>
            <el-empty v-else description="暂无随访记录" :image-size="80" />
          </div>
        </div>

        <!-- ⑦ 完整档案：数据资产视图 -->
        <div v-else-if="activeNav === 'archive'">
          <div class="pd__group">
            <h3 class="pd__h">多模态资源（{{ patient.resources.length }} 项）</h3>
            <div v-if="patient.resources.length" class="pd__ress">
              <div v-for="r in patient.resources" :key="r.id" class="pd__res" @click="openResource">
                <span class="pd__res-ic" :style="{ color: resIconColor[r.type] }"><el-icon><component :is="resourceIcon[r.type]" /></el-icon></span>
                <div class="pd__res-body">
                  <div class="pd__res-title">{{ r.title }}</div>
                  <div class="pd__res-meta">{{ r.type }} · {{ r.format }} · {{ r.size }} · {{ r.date }}</div>
                </div>
                <el-tag size="small" effect="plain" :type="r.status === '待对齐' ? 'warning' : 'success'">{{ r.status }}</el-tag>
              </div>
            </div>
            <el-empty v-else description="暂无多模态资源" :image-size="70" />
          </div>

          <div class="pd__group">
            <h3 class="pd__h">数据来源与跨机构映射</h3>
            <div class="pd__map">
              <div class="pd__map-row">
                <span class="pd__map-org"><el-icon><Connection /></el-icon>{{ patient.org }}</span>
                <span class="pd__map-arrow">→</span>
                <span class="pd__mono pd__map-id">{{ patient.primaryId }}</span>
                <el-tag size="small" effect="plain" type="primary">归属机构</el-tag>
              </div>
              <div v-for="m in patient.localIds" :key="m.id" class="pd__map-row">
                <span class="pd__map-org"><el-icon><Connection /></el-icon>{{ m.org }}</span>
                <span class="pd__map-arrow">→</span>
                <span class="pd__mono pd__map-id">{{ m.id }}</span>
                <el-tag size="small" effect="plain" type="info">机构内档案号</el-tag>
              </div>
            </div>
          </div>

          <div class="pd__group">
            <h3 class="pd__h">授权状态</h3>
            <div class="pd__auth">
              <el-tag :type="levelType[patient.level]" effect="light" round>{{ levelText[patient.level] }}</el-tag>
              <span class="pd__auth-note">完整字段需发起跨机构授权，审批通过后按脱敏口径下发。</span>
              <el-button v-if="patient.level !== 'full'" size="small" type="primary" plain :icon="Lock" @click="applyFullView">申请完整授权</el-button>
            </div>
          </div>

          <div class="pd__group">
            <h3 class="pd__h">档案完整性（{{ completeCount }} / {{ completeness.length }}）</h3>
            <div class="pd__complete">
              <div v-for="c in completeness" :key="c.key" class="pd__comp-cell" :class="{ 'is-ok': c.ok }">
                <span class="pd__comp-dot"></span>{{ c.key }}
              </div>
            </div>
          </div>

          <div class="pd__group">
            <div class="pd__audit-note">
              <el-icon><WarningFilled /></el-icon>
              数据不出域审计：所有跨机构访问经联邦网关，脱敏口径自动记录，不支持手动删除。
            </div>
            <h3 class="pd__h pd__h--mt">访问与操作审计</h3>
            <el-table v-if="patient.audits.length" :data="patient.audits" class="pd__table">
              <el-table-column prop="time" label="时间" width="150" />
              <el-table-column prop="actor" label="操作人" width="110" />
              <el-table-column prop="org" label="机构" width="140" />
              <el-table-column prop="action" label="操作" width="150" />
              <el-table-column prop="scope" label="数据范围" min-width="170" />
              <el-table-column prop="channel" label="访问通道" width="140" />
              <el-table-column label="结果" width="100">
                <template #default="{ row }">
                  <el-tag size="small" :type="row.result === '通过' ? 'success' : row.result === '拒绝' ? 'danger' : 'warning'" effect="light">{{ row.result }}</el-tag>
                </template>
              </el-table-column>
            </el-table>
            <el-empty v-else description="暂无审计记录" :image-size="70" />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.pd__bar {
  margin-bottom: 14px;
}
.pd__back {
  margin-left: -10px;
  font-size: 14px;
  color: var(--pf-text-soft);
}
.pd__back:hover {
  color: #2563eb;
}

/* ===================== 顶部总览 ===================== */
.pd__hero {
  display: grid;
  grid-template-columns: minmax(0, 1.35fr) minmax(0, 1fr) minmax(0, 1.05fr);
  gap: 0;
  padding: 0;
  overflow: hidden;
}
.pd__hero-col {
  padding: 22px 24px;
}
.pd__hero-col + .pd__hero-col {
  border-left: 1px solid var(--pf-border);
}
.pd__hero-id {
  background: rgba(37, 99, 235, 0.03);
}
.pd__id-top {
  display: flex;
  align-items: center;
  gap: 16px;
}
.pd__avatar {
  width: 56px;
  height: 56px;
  flex: none;
  border-radius: 14px;
  display: grid;
  place-items: center;
  font-size: 22px;
  font-weight: 800;
  color: #fff;
  background: #2563eb;
}
.pd__name-row {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}
.pd__name {
  font-size: 22px;
  font-weight: 800;
  letter-spacing: 0.02em;
}
.pd__id-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 8px;
}
.pd__chip {
  font-size: 12px;
  color: var(--pf-text-soft);
  background: var(--pf-bg-soft);
  border-radius: 999px;
  padding: 3px 12px;
}
.pd__chip--mono {
  font-family: ui-monospace, 'Cascadia Code', Consolas, monospace;
  color: #0e7490;
  background: rgba(6, 182, 212, 0.1);
}
.pd__dx {
  margin-top: 18px;
  padding-top: 16px;
  border-top: 1px dashed var(--pf-border);
}
.pd__dx-label {
  font-size: 12px;
  color: var(--pf-text-faint);
  letter-spacing: 0.08em;
}
.pd__dx-main {
  font-size: 17px;
  font-weight: 700;
  margin-top: 4px;
}
.pd__dx-stage {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 10px;
}
.pd__dx-stage-k {
  font-size: 12px;
  color: var(--pf-text-faint);
}
.pd__stage-pill {
  font-family: ui-monospace, 'Cascadia Code', Consolas, monospace;
  font-size: 13px;
  font-weight: 600;
  color: #2563eb;
  border: 1px solid rgba(37, 99, 235, 0.3);
  background: rgba(37, 99, 235, 0.06);
  border-radius: 999px;
  padding: 3px 14px;
}
.pd__stage-pill.sm {
  font-size: 12px;
  padding: 2px 10px;
}

/* 中部：临床焦点 */
.pd__hero-clinical {
  display: flex;
  flex-direction: column;
  gap: 16px;
  justify-content: center;
}
.pd__clini-row {
  display: flex;
  align-items: center;
  gap: 12px;
}
.pd__clini-row--block {
  flex-direction: column;
  align-items: flex-start;
  gap: 6px;
}
.pd__clini-label {
  font-size: 13px;
  color: var(--pf-text-faint);
  flex: none;
  width: 84px;
}
.pd__clini-val {
  font-size: 15px;
  font-weight: 600;
}
.pd__clini-concl {
  font-size: 14px;
  color: var(--pf-text-soft);
  line-height: 1.6;
}
.pd__status-pill {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  font-size: 15px;
  font-weight: 700;
  padding: 5px 16px;
  border-radius: 999px;
  border: 1px solid;
}
.pd__status-pill.sm {
  font-size: 13px;
  padding: 3px 12px;
}
.pd__status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

/* 右：指标 + 操作 */
.pd__hero-metrics {
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 18px;
}
.pd__metrics {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px 18px;
}
.pd__metric {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.pd__metric strong {
  font-size: 24px;
  font-weight: 800;
  color: #2563eb;
  font-variant-numeric: tabular-nums;
  line-height: 1.1;
}
.pd__metric-sm {
  font-size: 17px !important;
}
.pd__metric span {
  font-size: 12px;
  color: var(--pf-text-faint);
}
.pd__ops {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

/* ===================== 全局临床摘要 ===================== */
.pd__summary {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1px;
  margin-top: 14px;
  background: var(--pf-border);
  border: 1px solid var(--pf-border);
  border-radius: 14px;
  overflow: hidden;
}
.pd__sum-cell {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 18px;
  background: #fff;
}
.pd__sum-dot {
  width: 9px;
  height: 9px;
  flex: none;
  border-radius: 50%;
}
.pd__sum-meta {
  min-width: 0;
}
.pd__sum-k {
  font-size: 12px;
  color: var(--pf-text-faint);
}
.pd__sum-v {
  font-size: 14px;
  font-weight: 700;
  color: var(--pf-text);
  margin-top: 3px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.pd__sum-sub {
  font-size: 11px;
  color: var(--pf-text-faint);
  margin-top: 1px;
}

/* 提示条 */
.pd__notice {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: var(--pf-text-soft);
  margin-top: 14px;
  padding: 12px 16px;
  border-radius: 12px;
  background: rgba(37, 99, 235, 0.07);
  border: 1px solid rgba(37, 99, 235, 0.18);
}
.pd__notice--masked {
  background: rgba(245, 158, 11, 0.08);
  border-color: rgba(245, 158, 11, 0.28);
  color: #9a6b0a;
}
.pd__notice--synth {
  background: rgba(139, 92, 246, 0.07);
  border-color: rgba(139, 92, 246, 0.2);
  color: #6d4bbf;
}
.pd__notice strong {
  color: inherit;
  margin: 0 2px;
}
.pd__notice .el-icon {
  flex: none;
}

/* ===================== 中部导航 ===================== */
.pd__nav {
  display: flex;
  gap: 6px;
  margin: 0 0 16px;
  padding: 6px;
  background: #fff;
  border: 1px solid var(--pf-border);
  border-radius: 14px;
  overflow-x: auto;
  position: sticky;
  top: 12px;
  z-index: 5;
}
.pd__nav-item {
  flex: none;
  border: 1px solid transparent;
  background: transparent;
  color: var(--pf-text-soft);
  font-size: 14px;
  font-weight: 600;
  padding: 9px 18px;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.18s ease;
  white-space: nowrap;
  display: inline-flex;
  align-items: center;
  gap: 8px;
}
.pd__nav-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex: none;
}
.pd__nav-item:hover {
  color: #2563eb;
  background: rgba(37, 99, 235, 0.06);
}
.pd__nav-item.is-active {
  color: #fff;
  background: #2563eb;
  box-shadow: 0 6px 16px -6px rgba(37, 99, 235, 0.5);
}

/* ===================== 主体：左 30% 临床导航轴 / 右 70% 业务详情 ===================== */
.pd__main {
  margin-top: 18px;
  display: grid;
  grid-template-columns: minmax(280px, 30%) minmax(0, 1fr);
  gap: 20px;
  align-items: start;
}
.pd__axis {
  position: sticky;
  top: 12px;
  background: #fff;
  border: 1px solid var(--pf-border);
  border-radius: 14px;
  padding: 16px 18px;
  max-height: calc(100vh - 130px);
  overflow-y: auto;
}
.pd__axis-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 16px;
  flex-wrap: wrap;
}
.pd__detail {
  min-width: 0;
}

/* 轻量信息组（替代重卡片） */
.pd__group {
  background: #fff;
  border: 1px solid var(--pf-border);
  border-radius: 14px;
  padding: 18px 20px;
  margin-bottom: 16px;
}
.pd__group:last-child {
  margin-bottom: 0;
}
.pd__group--flush {
  padding-bottom: 6px;
}
.pd__h {
  font-size: 15px;
  font-weight: 700;
  margin: 0 0 14px;
  padding-left: 10px;
  border-left: 3px solid #2563eb;
}
.pd__h--inline {
  margin: 0;
  border-left: none;
  padding-left: 0;
}
.pd__h--mt {
  margin-top: 16px;
}
.pd__sec-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 16px;
  flex-wrap: wrap;
}

/* 就诊概览：就诊级卡片 */
.pd__visit-count {
  font-size: 13px;
  color: var(--pf-text-faint);
}
.pd__visits {
  display: flex;
  flex-direction: column;
  gap: 14px;
}
.pd__visit {
  border: 1px solid var(--pf-border);
  border-left-width: 3px;
  border-radius: 12px;
  padding: 14px 18px;
  background: #fff;
  cursor: pointer;
  transition: box-shadow 0.18s ease, transform 0.18s ease, border-color 0.18s ease;
}
.pd__visit:hover {
  box-shadow: 0 8px 22px -12px rgba(37, 99, 235, 0.4);
  transform: translateY(-1px);
}
.pd__visit-head {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
  margin-bottom: 12px;
}
.pd__visit-type {
  font-size: 12px;
  font-weight: 700;
  padding: 2px 12px;
  border-radius: 999px;
}
.pd__visit-date {
  font-family: ui-monospace, 'Cascadia Code', Consolas, monospace;
  font-size: 13px;
  font-weight: 600;
  color: var(--pf-text);
}
.pd__visit-org {
  font-size: 13px;
  color: var(--pf-text-soft);
  margin-left: auto;
}
.pd__visit-body {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.pd__visit-row {
  display: grid;
  grid-template-columns: 84px 1fr;
  gap: 12px;
  align-items: start;
}
.pd__visit-k {
  font-size: 13px;
  color: var(--pf-text-faint);
  flex: none;
  padding-top: 1px;
}
.pd__visit-v {
  font-size: 14px;
  color: var(--pf-text);
  line-height: 1.5;
}
.pd__visit-concl {
  color: var(--pf-text-soft);
}
.pd__mono {
  font-family: ui-monospace, 'Cascadia Code', Consolas, monospace;
  font-size: 13px;
}
/* 主索引映射 */
.pd__map {
  margin-top: 14px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.pd__map-row {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
  padding: 10px 12px;
  background: var(--pf-bg-soft);
  border-radius: 10px;
}
.pd__map-org {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  font-weight: 600;
}
.pd__map-arrow {
  color: var(--pf-text-faint);
}
.pd__map-id {
  color: #0e7490;
}

/* 时间轴 */
.pd__tl {
  padding-left: 4px;
  margin-top: 6px;
}
.pd__tl-card {
  border: 1px solid var(--pf-border);
  border-left-width: 3px;
  border-radius: 10px;
  padding: 10px 14px;
  margin-bottom: 4px;
  background: var(--pf-surface-2);
}
.pd__tl-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  font-size: 14px;
  flex-wrap: wrap;
}
.pd__tl-badge {
  font-size: 11px;
  font-weight: 700;
  padding: 1px 8px;
  border-radius: 999px;
}
.pd__tl-badge--recent {
  color: #0e7490;
  background: rgba(6, 182, 212, 0.14);
}
.pd__tl-badge--current {
  color: #b45309;
  background: rgba(245, 158, 11, 0.16);
}
.pd__tl-desc {
  font-size: 13px;
  color: var(--pf-text-soft);
  margin-top: 4px;
}
.pd__tl-card--click {
  cursor: pointer;
  transition: box-shadow 0.18s ease, transform 0.18s ease, border-color 0.18s ease;
}
.pd__tl-card--click:hover {
  box-shadow: 0 6px 18px -8px rgba(37, 99, 235, 0.35);
  transform: translateY(-1px);
}
.pd__tl-card.is-selected {
  background: rgba(37, 99, 235, 0.06);
  border-left-width: 4px;
  box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.25);
}
.pd__tl-card.is-current {
  border-left-color: #f59e0b !important;
}
.pd__tl-card.is-recent {
  border-left-color: #06b6d4 !important;
}
/* 就诊节点：结构性标记（首诊 / 入院 / 转院），与其他事件级卡片区分 */
.pd__tl-card.is-encounter {
  background: rgba(14, 165, 233, 0.07);
  border-color: rgba(14, 165, 233, 0.35);
  border-left-color: #0ea5e9 !important;
}
.pd__tl-card.is-encounter .pd__tl-desc {
  color: var(--pf-text);
}
/* 联动瞬时闪烁 */
@keyframes pdFlash {
  0% { box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.35); background: rgba(37, 99, 235, 0.08); }
  70% { box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.35); background: rgba(37, 99, 235, 0.08); }
  100% { box-shadow: 0 0 0 0 rgba(37, 99, 235, 0); background: transparent; }
}
.pd__flash {
  animation: pdFlash 2.4s ease-out;
}


/* 检查检验 */
.pd__exams-top {
  display: grid;
  grid-template-columns: 1fr 300px;
  gap: 16px;
}
.pd__exams-chart :deep(.echarts),
.pd__exams-chart :deep(canvas) {
  min-height: 280px;
}
.pd__exams-list .pd__metric-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.pd__metric-item {
  border: 1px solid var(--pf-border);
  border-radius: 10px;
  padding: 10px 12px;
  cursor: pointer;
  transition: all 0.15s ease;
}
.pd__metric-item:hover {
  border-color: rgba(37, 99, 235, 0.4);
}
.pd__metric-item.is-active {
  border-color: #2563eb;
  background: rgba(37, 99, 235, 0.04);
}
.pd__metric-top {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 8px;
}
.pd__metric-name {
  font-size: 13px;
  font-weight: 600;
}
.pd__metric-val {
  font-size: 18px;
  font-weight: 800;
  font-variant-numeric: tabular-nums;
}
.pd__metric-val i {
  font-size: 12px;
  font-weight: 600;
  font-style: normal;
  margin-left: 2px;
}
.pd__spark {
  height: 42px;
  margin: 4px 0;
}
.pd__metric-ref {
  font-size: 11px;
  color: var(--pf-text-faint);
}
.pd__exams-bottom {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  margin-top: 16px;
}
.pd__abn {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.pd__abn-row {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 13px;
  padding: 8px 10px;
  background: rgba(244, 63, 94, 0.05);
  border-radius: 8px;
}
.pd__abn-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #f43f5e;
  flex: none;
}
.pd__abn-lab {
  font-weight: 600;
}
.pd__abn-val {
  color: #f43f5e;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
}
.pd__abn-date {
  color: var(--pf-text-soft);
}
.pd__abn-ref {
  margin-left: auto;
  color: var(--pf-text-faint);
  font-size: 12px;
}
.pd__recent {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.pd__recent-row {
  display: flex;
  gap: 12px;
}
.pd__recent-date {
  font-size: 12px;
  color: var(--pf-text-faint);
  flex: none;
  width: 84px;
  padding-top: 2px;
}
.pd__recent-body {
  flex: 1;
  min-width: 0;
}
.pd__recent-title {
  font-size: 13px;
  font-weight: 600;
}
.pd__recent-desc {
  font-size: 12px;
  color: var(--pf-text-soft);
  margin-top: 2px;
}

/* 病理与分子：逻辑链 */
.pd__chain {
  display: flex;
  align-items: stretch;
  gap: 0;
  flex-wrap: wrap;
}
.pd__chain-step {
  flex: 1 1 200px;
  min-width: 180px;
  background: #fff;
  border: 1px solid var(--pf-border);
  border-radius: 14px;
  padding: 16px 16px 18px;
  position: relative;
}
.pd__chain-idx {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: #2563eb;
  color: #fff;
  font-size: 13px;
  font-weight: 700;
  display: grid;
  place-items: center;
  margin-bottom: 10px;
}
.pd__chain-t {
  font-size: 14px;
  font-weight: 700;
  margin: 0 0 10px;
}
.pd__chain-body {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.pd__chain-main {
  font-size: 14px;
  font-weight: 600;
}
.pd__chain-sub {
  font-size: 12px;
  color: var(--pf-text-soft);
}
.pd__chain-tnm {
  font-family: ui-monospace, 'Cascadia Code', Consolas, monospace;
  font-size: 15px;
  font-weight: 700;
  color: #2563eb;
}
.pd__chain-tag {
  font-size: 12px;
  color: var(--pf-text-faint);
}
.pd__chain-mol {
  font-size: 13px;
  font-weight: 600;
  color: #8b5cf6;
  padding: 4px 0;
  border-bottom: 1px dashed var(--pf-border);
}
.pd__chain-mol:last-child {
  border-bottom: none;
}
.pd__chain-rep {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: var(--pf-text-soft);
  padding: 4px 0;
  flex-wrap: wrap;
}
.pd__chain-empty {
  font-size: 13px;
  color: var(--pf-text-faint);
}
/* 病理与分子：诊断卡片列表 */
.pd__dx-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.pd__dx-card {
  border: 1px solid var(--pf-border);
  border-left-width: 3px;
  border-radius: 12px;
  padding: 14px 16px;
  background: var(--pf-surface-2);
}
.pd__dx-card-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
}
.pd__dx-card-type {
  font-size: 13px;
  font-weight: 700;
  color: var(--pf-text);
}
.pd__dx-card-stage {
  font-family: ui-monospace, 'Cascadia Code', Consolas, monospace;
  font-size: 12px;
  font-weight: 600;
  border: 1px solid;
  border-radius: 999px;
  padding: 2px 12px;
}
.pd__dx-card-main {
  font-size: 14px;
  font-weight: 600;
  margin-top: 8px;
}
.pd__dx-card-tag {
  font-size: 12px;
  color: var(--pf-text-faint);
  margin-top: 6px;
}
.pd__chain-mol-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.pd__chain-rep-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.pd__chain-arrow {
  align-self: center;
  font-size: 20px;
  color: var(--pf-text-faint);
  padding: 0 10px;
  flex: none;
}

/* 治疗记录：连续流程 */
.pd__txflow {
  display: flex;
  flex-direction: column;
}
.pd__txnode {
  display: flex;
  gap: 16px;
}
.pd__tx-rail {
  position: relative;
  width: 16px;
  flex: none;
  display: flex;
  justify-content: center;
}
.pd__tx-dot {
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: #2563eb;
  border: 3px solid #fff;
  box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.3);
  margin-top: 18px;
  z-index: 2;
}
.pd__txnode.is-doing .pd__tx-dot {
  background: #06b6d4;
  box-shadow: 0 0 0 2px rgba(6, 182, 212, 0.35);
}
.pd__tx-line {
  position: absolute;
  top: 32px;
  bottom: -2px;
  width: 2px;
  background: var(--pf-border);
}
.pd__tx-card {
  flex: 1;
  min-width: 0;
  border: 1px solid var(--pf-border);
  border-radius: 12px;
  padding: 14px 18px 16px;
  margin-bottom: 16px;
  background: #fff;
}
.pd__txnode.is-doing .pd__tx-card {
  border-color: rgba(6, 182, 212, 0.4);
  background: rgba(6, 182, 212, 0.03);
}
.pd__tx-head {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}
.pd__tx-title {
  display: flex;
  align-items: center;
  gap: 8px;
}
.pd__tx-name {
  font-weight: 700;
  font-size: 15px;
}
.pd__tx-status {
  font-size: 12px;
  color: var(--pf-text-faint);
}
.pd__tx-status--doing {
  color: #06b6d4;
  font-weight: 600;
}
.pd__tx-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 14px;
  margin-top: 10px;
  font-size: 13px;
  color: var(--pf-text-soft);
}
.pd__tx-meta span {
  background: var(--pf-bg-soft);
  border-radius: 8px;
  padding: 3px 10px;
}
.pd__tx-next {
  margin-top: 10px;
  font-size: 12px;
  color: #2563eb;
}

/* 随访预后 */
.pd__prog-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
}
.pd__prog-cell {
  background: var(--pf-bg-soft);
  border-radius: 10px;
  padding: 14px;
}
.pd__prog-k {
  font-size: 12px;
  color: var(--pf-text-faint);
}
.pd__prog-v {
  font-size: 17px;
  font-weight: 800;
  margin-top: 6px;
}
.pd__fu-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.pd__fu-row {
  display: flex;
  gap: 14px;
}
.pd__fu-date {
  font-size: 13px;
  font-weight: 600;
  color: var(--pf-text);
  flex: none;
  width: 96px;
  padding-top: 2px;
}
.pd__fu-body {
  flex: 1;
  min-width: 0;
}
.pd__fu-top {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}
.pd__fu-mod {
  font-size: 13px;
  color: var(--pf-text-soft);
}
.pd__fu-next {
  font-size: 12px;
  color: #2563eb;
}
.pd__fu-org {
  font-size: 12px;
  color: var(--pf-text-faint);
  margin-left: auto;
}
.pd__fu-sum {
  font-size: 13px;
  color: var(--pf-text-soft);
  margin-top: 4px;
  line-height: 1.5;
}

/* 完整档案 */
.pd__ress {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 14px;
}
.pd__res {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 14px 16px;
  border: 1px solid var(--pf-border);
  border-radius: 12px;
  cursor: pointer;
}
.pd__res:hover {
  border-color: rgba(37, 99, 235, 0.4);
}
.pd__res-ic {
  width: 46px;
  height: 46px;
  flex: none;
  border-radius: 12px;
  display: grid;
  place-items: center;
  font-size: 22px;
  color: #2563eb;
  background: rgba(37, 99, 235, 0.08);
}
.pd__res-body {
  flex: 1;
  min-width: 0;
}
.pd__res-title {
  font-weight: 600;
  font-size: 13px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.pd__res-meta {
  font-size: 12px;
  color: var(--pf-text-faint);
  margin-top: 3px;
}
.pd__auth {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}
.pd__auth-note {
  font-size: 13px;
  color: var(--pf-text-soft);
  flex: 1;
  min-width: 200px;
}
.pd__complete {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}
.pd__comp-cell {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  font-size: 13px;
  color: var(--pf-text-faint);
  background: var(--pf-bg-soft);
  border-radius: 999px;
  padding: 5px 14px;
}
.pd__comp-cell.is-ok {
  color: var(--pf-text);
}
.pd__comp-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--pf-text-faint);
}
.pd__comp-cell.is-ok .pd__comp-dot {
  background: #10b981;
}
.pd__audit-note {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: var(--pf-text-soft);
  background: var(--pf-bg-soft);
  border-radius: 12px;
  padding: 12px 16px;
  margin-bottom: 4px;
}
.pd__audit-note .el-icon {
  color: #f59e0b;
}
.pd__table {
  margin-top: 8px;
}

/* 患者旅程：左侧固定诊疗时间轴 + 右栏顶部一级业务导航 + 右侧业务详情 */

@media (max-width: 1180px) {
  .pd__hero {
    grid-template-columns: 1fr;
  }
  .pd__hero-col + .pd__hero-col {
    border-left: none;
    border-top: 1px solid var(--pf-border);
  }
  .pd__summary {
    grid-template-columns: repeat(2, 1fr);
  }
  .pd__main {
    grid-template-columns: 1fr;
  }
  .pd__axis {
    position: static;
    max-height: none;
  }
  .pd__exams-top {
    grid-template-columns: 1fr;
  }
  .pd__exams-bottom {
    grid-template-columns: 1fr;
  }
  .pd__ress {
    grid-template-columns: 1fr;
  }
  .pd__prog-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
@media (max-width: 640px) {
  .pd__summary {
    grid-template-columns: 1fr;
  }
  .pd__prog-grid {
    grid-template-columns: 1fr;
  }
  .pd__chain-arrow {
    display: none;
  }
}
</style>
