<script setup lang="ts">
import { computed, ref, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { ArrowLeft, Lock, Download, WarningFilled, Connection, Document } from '@element-plus/icons-vue'
import ctImage from '@/assets/patients/P-0001/exams/ct.jpg'
import endoscopyImage from '@/assets/patients/P-0001/exams/endoscopy.jpg'
import petCtImage from '@/assets/patients/P-0001/exams/pet-ct.jpg'
import molecularReportUrl from '@/assets/patients/P-0001/molecular/escc-molecular-case-report.pdf?url'
import pathologyImage from '@/assets/patients/P-0001/pathology/escc-he-high-mag.jpg'
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

// ---------- 脱敏权限状态（与临床状态分开表达） ----------
const levelText: Record<DataLevel, string> = { full: '完全可见', masked: '脱敏可见', summary: '摘要可见' }
const levelType: Record<DataLevel, 'success' | 'warning' | 'info'> = {
  full: 'success', masked: 'warning', summary: 'info',
}
// ---------- 临床状态语义色 ----------
const statusType: Record<string, 'primary' | 'success' | 'warning' | 'info'> = {
  随访中: 'primary', 治疗中: 'warning', 评估中: 'info', 失访: 'info', 已结案: 'success',
}
const statusColor: Record<string, string> = {
  随访中: '#06b6d4', 治疗中: '#f59e0b', 评估中: '#8b5cf6', 失访: '#94a3b8', 已结案: '#10b981',
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
type NavKey = 'overview' | 'exams' | 'diagnosis' | 'treatment' | 'followup' | 'archive'
const navItems: { key: NavKey; label: string; color: string }[] = [
  { key: 'overview', label: '就诊记录', color: '#0ea5e9' },
  { key: 'exams', label: '检查检验', color: '#f59e0b' },
  { key: 'diagnosis', label: '诊断', color: '#8b5cf6' },
  { key: 'treatment', label: '治疗记录', color: '#06b6d4' },
  { key: 'followup', label: '疗效随访', color: '#10b981' },
  { key: 'archive', label: '完整档案', color: '#64748b' },
]
const activeNav = ref<NavKey>('overview')
// 左侧旅程轴当前选中节点（点击或联动高亮）
const selectedNodeId = ref('')

// ---------- 时间轴事件 → 右侧业务页面映射 ----------
// 左侧筛选只控制左侧时间轴内容；右侧导航只控制右侧页面。
// 点击某一条时间轴事件时，左侧时间轴保持当前位置和筛选状态不变，
// 仅切换右侧对应业务页面，并定位到该事件关联的具体记录。
const kindToNav: Record<string, NavKey> = {
  就诊节点: 'overview',
  检查: 'exams',
  诊断分期: 'diagnosis',
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
// 「就诊」由时间轴的「就诊节点」承载，与右侧「就诊概览」同源；筛选「就诊」即只看真实门诊/住院/急诊。
const kindColor: Record<string, string> = {
  就诊节点: '#0ea5e9', 检查: '#f59e0b', 诊断分期: '#8b5cf6',
  治疗决策: '#6366f1', 治疗: '#06b6d4',
  疗效评估: '#10b981', 复查: '#10b981', 随访: '#10b981', 复发转移: '#ef4444',
}
const kindLabel: Record<string, string> = {
  就诊节点: '就诊', 检查: '检查', 诊断分期: '诊断',
  治疗决策: '治疗决策', 治疗: '治疗',
  疗效评估: '疗效评估', 复查: '复查', 随访: '随访', 复发转移: '复发转移',
}

// 按真实日期倒序排列（系统操作不计入核心临床旅程）
const timelineAll = computed(() =>
  [...patient.value.timeline].sort((a, b) => b.date.localeCompare(a.date)),
)
// 二级筛选：治疗决策归入「治疗」，病理/分期覆盖诊断分期，随访覆盖疗效评估/复查/随访/复发转移
// 「就诊」为独立筛选桶（由真实就诊生成），仅在「全部」或「就诊」时展示就诊节点

function switchNav(key: NavKey) {
  activeNav.value = key
}

// 点击旅程事件 → 进入对应业务页面 → 左侧选中态 + 右侧按记录 id 滚动并短暂高亮
const highlightRef = ref('')
// 点击左侧就诊节点 → 右侧就诊概览定位并高亮对应的真实就诊卡
const flashVisitId = ref('')
// 就诊概览为真实门诊/住院/急诊经历的独立视图，与左侧时间轴事件级不再做双向就诊高亮联动
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

  if (node.kind === '治疗决策') {
    highlightRef.value = 'treatment-decision'
    const decisionEl = document.getElementById('rec-treatment-decision')
    if (decisionEl) decisionEl.scrollIntoView({ behavior: 'smooth', block: 'center' })
    window.setTimeout(() => {
      if (highlightRef.value === 'treatment-decision') highlightRef.value = ''
    }, 2600)
    return
  }

  if (target === 'followup' && (node.kind === '疗效评估' || node.title.includes('疗效评估'))) {
    highlightRef.value = 'eval-' + node.id
    const evalEl = document.getElementById('rec-eval-' + node.id)
    if (evalEl) evalEl.scrollIntoView({ behavior: 'smooth', block: 'center' })
    window.setTimeout(() => {
      if (highlightRef.value === 'eval-' + node.id) highlightRef.value = ''
    }, 2600)
    return
  }

  if (node.kind === '复发转移') {
    const pid = node.ref ?? node.id
    highlightRef.value = 'progression-' + pid
    const progressionEl = document.getElementById('rec-progression-' + pid)
    if (progressionEl) progressionEl.scrollIntoView({ behavior: 'smooth', block: 'center' })
    window.setTimeout(() => {
      if (highlightRef.value === 'progression-' + pid) highlightRef.value = ''
    }, 2600)
    return
  }

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
  评估中: '诊断与治疗方案评估阶段',
  已结案: '治疗结束 · 已结案',
  失访: '失访 · 联系中断',
}
const currentStageText = computed(() => {
  if (patient.value.status === '治疗中' && currentTreatment.value) {
    return `${currentTreatment.value.name}（${currentTreatment.value.line}）`
  }
  return phaseLabel[patient.value.status] ?? patient.value.status
})

// ---------- 顶部患者摘要 ----------
const treatmentPhaseText = computed(() =>
  patient.value.status === '治疗中' && currentTreatment.value
    ? `${currentTreatment.value.line} · ${currentTreatment.value.modality}`
    : phaseLabel[patient.value.status] ?? patient.value.status,
)

const treatmentDecision = computed(() =>
  timelineAll.value.find((n) => n.kind === '治疗决策') ?? null,
)

const treatmentClinicalDiagnosis = computed(() =>
  patient.value.diagnoses.find((d) => d.type === '分期诊断' && !d.basis.includes('术后病理')) ??
  patient.value.diagnoses.find((d) => d.type === '临床诊断') ??
  null,
)

const treatmentPath = computed(() =>
  patient.value.treatments.map((t) => {
    const timelineNode = patient.value.timeline.find(
      (n) => n.kind === '治疗' && (n.ref === t.id || n.title.includes(t.name.slice(0, 6)) || n.date === t.startDate),
    )
    const isResection = t.modality === '手术' || t.modality === '内镜治疗'
    const resectionResult =
      isResection
        ? timelineNode?.desc.includes('R0')
          ? 'R0切除'
          : '已完成'
        : t.efficacy !== '—'
          ? t.efficacy
          : t.status

    return {
      ...t,
      displayResult: resectionResult,
      timelineDesc: timelineNode?.desc ?? '',
    }
  }),
)

const postoperativePathology = computed(() =>
  patient.value.diagnoses.find((d) => d.basis.includes('术后病理') || d.basis.includes('ESD')) ?? null,
)
const recentConclusion = computed(() =>
  patient.value.followUps[0]?.summary ?? patient.value.timeline[0]?.desc ?? '—',
)
const nextFollowUp = computed(() => patient.value.followUps[0]?.nextDate ?? '—')
const pathologyDiagnoses = computed(() =>
  patient.value.diagnoses.filter((d) => d.type === '病理诊断' || d.basis.includes('病理')),
)
const clinicalDiagnoses = computed(() =>
  patient.value.diagnoses.filter(
    (d) => d.type === '临床诊断' || (d.type === '分期诊断' && !d.basis.includes('术后病理')),
  ),
)
const pathologyResources = computed(() =>
  patient.value.resources.filter((r) => r.type === '病理切片' || r.type === '基因检测'),
)
function pathologySpecimen(d: { basis: string }) {
  if (d.basis.includes('ESD')) return 'ESD切除标本'
  return d.basis.includes('术后病理') ? '食管切除标本' : '胃镜活检组织'
}
function pathologyNote(d: { date: string }) {
  return patient.value.timeline.find((n) => n.date === d.date && n.title.includes('病理'))?.desc ?? ''
}
const molecularRecords = computed(() => {
  const tests = patient.value.molecularTests
  const pdL1 = tests.find((m) => m.item === 'PD-L1')
  const mmr = tests.find((m) => m.item === 'MMR')
  const msi = tests.find((m) => m.item === 'MSI')
  const ngs = tests.find((m) => m.item === 'NGS')

  return [
    pdL1 && {
      id: 'MR-PDL1',
      title: 'PD-L1 免疫组化',
      sub: '免疫治疗相关标志物',
      result: pdL1.result,
      note: pdL1.note,
      date: pdL1.date,
      org: pdL1.org,
    },
    (mmr || msi) && {
      id: 'MR-MMR-MSI',
      title: mmr && msi ? 'MMR / MSI 检测' : mmr ? 'MMR 检测' : 'MSI 检测',
      sub: mmr && msi ? '错配修复 / 微卫星状态' : mmr ? '错配修复状态' : '微卫星状态',
      result: [mmr?.result, msi?.result].filter(Boolean).join(' · '),
      note: [mmr?.note, msi?.note].filter(Boolean).join('；'),
      date: mmr?.date ?? msi?.date ?? '',
      org: mmr?.org ?? msi?.org ?? '',
    },
    ngs && {
      id: 'MR-NGS',
      title: 'NGS 基因检测',
      sub: '食管癌相关基因 Panel',
      result: ngs.result,
      note: ngs.note,
      date: ngs.date,
      org: ngs.org,
    },
  ].filter(Boolean) as {
    id: string
    title: string
    result: string
    note: string
    sub: string
    date: string
    org: string
  }[]
})

// ---------- 检查检验 ----------

// 检验指标分类（用于「近期检验」分类标签）
const labCategories = ['全部', '血清肿瘤标志物', '血常规', '肝肾功能', '营养指标', '凝血功能', '其他'] as const
const labCategoryMap: Record<string, string> = {
  cea: '血清肿瘤标志物', scc: '血清肿瘤标志物',
  hgb: '血常规', wbc: '血常规',
  alt: '肝肾功能',
  alb: '营养指标',
  pt: '凝血功能',
}
const labCat = ref('全部')
const filteredLabs = computed(() =>
  patient.value.labs.filter((l) => labCat.value === '全部' || labCategoryMap[l.key] === labCat.value),
)
function labLatestPoint(lab: LabSeries) {
  return lab.points[lab.points.length - 1]
}
// 最新状态：相对参考范围 → 正常 / 升高 / 降低
function labStatus(lab: LabSeries) {
  const v = labLatestPoint(lab).value
  if (v > lab.refUpper) return { text: '升高', tone: '#f43f5e' }
  if (v < lab.refLower) return { text: '降低', tone: '#f97316' }
  return { text: '正常', tone: '#10b981' }
}
// 较前次变化：最新值与上一次的差值方向
function labDelta(lab: LabSeries) {
  const pts = lab.points
  if (pts.length < 2) return { text: '—', tone: 'var(--pf-text-faint)' }
  const cur = pts[pts.length - 1].value
  const prev = pts[pts.length - 2].value
  const diff = +(cur - prev).toFixed(2)
  if (diff === 0) return { text: '持平', tone: 'var(--pf-text-soft)' }
  if (diff > 0) return { text: `+${diff} ↑`, tone: '#f43f5e' }
  return { text: `${diff} ↓`, tone: '#f97316' }
}

// ---------- 近期检查（检查事件 → 检查记录卡） ----------
const examTypes = ['全部', '内镜', 'CT', 'MRI', 'PET-CT', '超声', '其他'] as const
const examType = ref('全部')
function examTypeOf(node: TimelineNode): string {
  const t = node.title
  if (t.includes('EUS') || t.includes('超声内镜') || t.includes('内镜') || t.includes('胃镜')) return '内镜'
  if (t.includes('PET')) return 'PET-CT'
  if (t.includes('MRI') || t.includes('核磁')) return 'MRI'
  if (t.includes('CT')) return 'CT'
  if (t.includes('超声') || t.includes('彩超')) return '超声'
  return '其他'
}
const examTypeColor: Record<string, string> = {
  内镜: '#2563eb', CT: '#06b6d4', MRI: '#0ea5e9', 'PET-CT': '#8b5cf6', 超声: '#10b981', 其他: '#94a3b8',
}
const examList = computed(() =>
  patient.value.timeline
    .filter((t) => t.kind === '检查')
    .sort((a, b) => b.date.localeCompare(a.date))
    .map((t) => ({
      id: t.id,
      date: t.date,
      title: t.title,
      type: examTypeOf(t),
      org: t.org,
      desc: t.desc,
      compared: t.compared ?? '',
    })),
)
const filteredExams = computed(() =>
  examList.value.filter((e) => examType.value === '全部' || e.type === examType.value),
)

// ---------- 就诊概览（就诊级聚合，与左侧事件级时间轴职责区分） ----------
// 按真实日期倒序展示，最新就诊在前
const visits = computed(() =>
  [...patient.value.visits].sort((a, b) => b.date.localeCompare(a.date)),
)
const visitTypeColor: Record<string, string> = {
  门诊: '#0ea5e9',
  住院: '#8b5cf6',
  急诊: '#ef4444',
}

// ---------- 资源图标 ----------
const resourceIcon: Record<string, string> = {
  内镜: 'Camera', CT: 'View', MRI: 'View', 'PET-CT': 'View', 超声: 'View', 病理切片: 'Notebook', 基因检测: 'DataLine',
}
const resIconColor: Record<string, string> = {
  内镜: '#2563eb', CT: '#06b6d4', MRI: '#06b6d4', 'PET-CT': '#8b5cf6', 超声: '#10b981', 病理切片: '#f59e0b', 基因检测: '#8b5cf6',
}
type ExamRecord = {
  id: string
  date: string
  title: string
  type: string
  org: string
  desc: string
  compared: string
}

const examReportVisible = ref(false)
const selectedExam = ref<ExamRecord | null>(null)
const pathologyViewerVisible = ref(false)
const selectedPathologyResource = ref<{
  title: string
  date: string
  size: string
  format: string
} | null>(null)

function examImageOf(exam: ExamRecord | null): string {
  if (!exam || patient.value.id !== 'P-0001') return ''
  if (exam.type === 'PET-CT') return petCtImage
  if (exam.type === 'CT') return ctImage
  if (exam.type === '内镜') return endoscopyImage
  return ''
}

const selectedExamImage = computed(() => examImageOf(selectedExam.value))

function openExamReport(exam: ExamRecord) {
  selectedExam.value = exam
  examReportVisible.value = true
}

function openResource(resource: {
  type: string
  title?: string
  date?: string
  size?: string
  format?: string
}) {
  if (patient.value.id === 'P-0001' && resource.type === '病理切片') {
    selectedPathologyResource.value = {
      title: resource.title ?? '病理切片',
      date: resource.date ?? '—',
      size: resource.size ?? '—',
      format: resource.format ?? 'JPG',
    }
    pathologyViewerVisible.value = true
    return
  }

  if (patient.value.id === 'P-0001' && resource.type === '基因检测') {
    window.open(molecularReportUrl, '_blank', 'noopener,noreferrer')
    return
  }

  ElMessage.info('原型演示：该原始资料将在资源查看器中打开')
}

// ---------- 疗效标签 ----------
const effType: Record<string, 'success' | 'primary' | 'warning' | 'danger' | 'info'> = {
  CR: 'success', PR: 'primary', SD: 'warning', PD: 'danger', '—': 'info',
}

// ---------- 疗效随访：记录型展示 ----------
const efficacyEvaluations = computed(() =>
  patient.value.timeline
    .filter((n) =>
      n.kind === '疗效评估' ||
      n.title.includes('疗效评估') ||
      !!n.compared?.match(/\b(CR|PR|SD|PD)\b/),
    )
    .map((n) => {
      const result =
        n.compared?.match(/\b(CR|PR|SD|PD)\b/)?.[1] ??
        n.desc.match(/\b(CR|PR|SD|PD)\b/)?.[1] ??
        '—'
      return {
        ...n,
        result,
        basis: n.title.replace(/（疗效评估）|疗效评估/g, '').trim() || n.title,
        summary: n.compared ?? n.desc,
      }
    })
    .sort((a, b) => b.date.localeCompare(a.date)),
)

const progressionRecords = computed(() => {
  const seen = new Set<string>()
  return [...patient.value.followUps]
    .filter((f) => f.outcome === '局部复发' || f.outcome === '远处转移')
    .sort((a, b) => a.date.localeCompare(b.date))
    .filter((f) => {
      if (seen.has(f.outcome)) return false
      seen.add(f.outcome)
      return true
    })
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

    <!-- ===================== 顶部患者总览 ===================== -->
    <section class="pd__hero pf-card">
      <div class="pd__hero-top">
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

        <div class="pd__ops">
          <el-button v-if="patient.level !== 'full'" round type="primary" plain @click="applyFullView">
            <el-icon><Lock /></el-icon>&nbsp;申请完整授权
          </el-button>
          <el-button round plain @click="exportSummary">
            <el-icon><Download /></el-icon>&nbsp;导出脱敏摘要
          </el-button>
        </div>
      </div>

      <div class="pd__hero-info">
        <div class="pd__info-item pd__info-item--dx">
          <span class="pd__info-k">主要诊断</span>
          <strong class="pd__info-v">{{ patient.diagnosis }}</strong>
        </div>
        <div class="pd__info-item">
          <span class="pd__info-k">TNM 分期</span>
          <span class="pd__stage-pill">{{ patient.stage }}</span>
        </div>
        <div class="pd__info-item">
          <span class="pd__info-k">当前临床状态</span>
          <span class="pd__status-pill" :style="{ background: statusColor[patient.status] + '1a', color: statusColor[patient.status], borderColor: statusColor[patient.status] + '55' }">
            <i class="pd__status-dot" :style="{ background: statusColor[patient.status] }"></i>{{ patient.status }}
          </span>
        </div>
        <div class="pd__info-item">
          <span class="pd__info-k">治疗阶段</span>
          <strong class="pd__info-v">{{ treatmentPhaseText }}</strong>
        </div>
        <div class="pd__info-item">
          <span class="pd__info-k">最近随访</span>
          <strong class="pd__info-v">{{ patient.followUps[0]?.date || '—' }}</strong>
        </div>
        <div class="pd__info-item pd__info-item--conclusion">
          <span class="pd__info-k">最近病情结论</span>
          <span class="pd__info-text">{{ recentConclusion }}</span>
        </div>
      </div>
    </section>


    <!-- ===================== 主体：左 临床导航轴 / 右 业务详情（导航置于右栏顶部，与左侧时间轴并列） ===================== -->
    <div class="pd__main">
      <!-- 左侧：临床导航轴（始终可见，按真实日期倒序；当前阶段/最近事件由高亮表达） -->
      <aside class="pd__axis">
        <div class="pd__axis-head">
          <h3 class="pd__h pd__h--inline">诊疗时间轴</h3>
        </div>
        <el-timeline class="pd__tl">
          <el-timeline-item
            v-for="node in timelineAll"
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
                  {{ kindLabel[node.kind] ?? node.kind }}
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
        <!-- 一级业务导航：固定在右栏顶部 -->
        <div class="pd__nav-sticky">
          <nav class="pd__nav">
            <button
              v-for="n in navItems"
              :key="n.key"
              class="pd__nav-item"
              :class="{ 'is-active': activeNav === n.key }"
              :style="activeNav === n.key ? { background: n.color, borderColor: n.color } : {}"
              @click="switchNav(n.key)"
            >
              <span class="pd__nav-dot" :style="{ background: n.color }"></span>
              {{ n.label }}
            </button>
          </nav>
        </div>
        <!-- ① 就诊记录：患者跨机构真实就诊经历 -->
        <div v-if="activeNav === 'overview'">
          <div class="pd__group pd__group--flush" id="rec-clinical">
            <div class="pd__sec-head">
              <h3 class="pd__h pd__h--inline">就诊记录</h3>

            </div>
            <div v-if="visits.length" class="pd__visits">
              <div
                v-for="v in visits"
                :key="v.id"
                :id="'visit-' + v.id"
                class="pd__visit"
                :class="{ 'pd__flash': flashVisitId === v.id }"
              >
                <div class="pd__visit-head">
                  <div class="pd__visit-title">
                    <span class="pd__visit-type" :style="{ color: visitTypeColor[v.type], background: visitTypeColor[v.type] + '1a' }">{{ v.type }}</span>
                    <strong>{{ v.date || '待补全' }}</strong>
                  </div>
                  <span class="pd__visit-org">{{ v.org }}</span>
                </div>

                <div class="pd__visit-body">
                  <div class="pd__visit-row">
                    <span class="pd__visit-k">就诊科室</span>
                    <strong class="pd__visit-v">{{ v.dept }}</strong>
                  </div>
                  <div class="pd__visit-row">
                    <span class="pd__visit-k">主要诊断</span>
                    <strong class="pd__visit-v">{{ v.diagnosis }}</strong>
                  </div>
                  <div class="pd__visit-row pd__visit-row--wide">
                    <span class="pd__visit-k">就诊原因</span>
                    <strong class="pd__visit-v">{{ v.reason }}</strong>
                  </div>
                  <div class="pd__visit-row pd__visit-row--wide">
                    <span class="pd__visit-k">就诊去向</span>
                    <strong class="pd__visit-v">{{ v.disposition }}</strong>
                  </div>
                </div>
              </div>
            </div>
            <el-empty v-else description="暂无结构化就诊记录" :image-size="70" />
          </div>
        </div>

        <!-- ② 检查检验 -->
        <div v-else-if="activeNav === 'exams'">
          <!-- ① 近期检验：分类筛选 + 紧凑指标表 -->
          <section class="pd__group pd__labs">
            <div class="pd__sec-head">
              <h3 class="pd__h pd__h--inline">近期检验</h3>
              <el-radio-group v-model="labCat" size="small">
                <el-radio-button v-for="c in labCategories" :key="c" :value="c">{{ c }}</el-radio-button>
              </el-radio-group>
            </div>
            <el-table v-if="filteredLabs.length" :data="filteredLabs" border size="small" class="pd__table">
              <el-table-column label="检验项目" min-width="150">
                <template #default="{ row }">
                  <div class="pd__lab-name">{{ row.name }}</div>
                  <div class="pd__lab-cat">{{ labCategoryMap[row.key] }}</div>
                </template>
              </el-table-column>
              <el-table-column label="最近结果" width="104" align="center">
                <template #default="{ row }">
                  <span class="pd__lab-val" :style="{ color: labStatus(row).tone, fontWeight: 700 }">{{ labLatestPoint(row).value }}</span>
                </template>
              </el-table-column>
              <el-table-column label="单位" width="78" align="center">
                <template #default="{ row }"><span class="pd__muted">{{ row.unit }}</span></template>
              </el-table-column>
              <el-table-column label="状态" width="80" align="center">
                <template #default="{ row }">
                  <span class="pd__status-chip" :style="{ color: labStatus(row).tone, borderColor: labStatus(row).tone + '55', background: labStatus(row).tone + '12' }">{{ labStatus(row).text }}</span>
                </template>
              </el-table-column>
              <el-table-column label="较前次" width="104" align="center">
                <template #default="{ row }"><span :style="{ color: labDelta(row).tone, fontWeight: 600 }">{{ labDelta(row).text }}</span></template>
              </el-table-column>
              <el-table-column label="参考范围" width="150" align="center">
                <template #default="{ row }"><span class="pd__muted">{{ row.refLower }} ~ {{ row.refUpper }}</span></template>
              </el-table-column>
              <el-table-column label="检验日期" width="104" align="center">
                <template #default="{ row }">{{ labLatestPoint(row).date }}</template>
              </el-table-column>
            </el-table>
            <el-empty v-else description="暂无检验记录" :image-size="70" />
          </section>

          <!-- ② 近期检查：类型筛选 + 纵向检查记录卡 -->
          <section class="pd__group pd__exams">
            <div class="pd__sec-head">
              <h3 class="pd__h pd__h--inline">近期检查</h3>
              <el-radio-group v-model="examType" size="small">
                <el-radio-button v-for="t in examTypes" :key="t" :value="t">{{ t }}</el-radio-button>
              </el-radio-group>
            </div>
            <div v-if="filteredExams.length" class="pd__exam-list">
              <div
                v-for="e in filteredExams"
                :key="e.id"
                :id="'rec-' + e.id"
                class="pd__exam-card"
                :class="{ 'pd__flash': highlightRef === e.id }"
              >
                <div class="pd__exam-head">
                  <span class="pd__exam-type" :style="{ color: examTypeColor[e.type], borderColor: examTypeColor[e.type] }">{{ e.type }}</span>
                  <span class="pd__exam-title">{{ e.title }}</span>
                  <span class="pd__exam-date">{{ e.date }}</span>
                </div>
                <div class="pd__exam-org"><el-icon><Connection /></el-icon>{{ e.org }}</div>
                <div class="pd__exam-desc">{{ e.desc }}</div>
                <div v-if="e.compared" class="pd__exam-compared">
                  <span class="pd__exam-cmp-label">较前变化</span>{{ e.compared }}
                </div>
                <div class="pd__exam-foot">
                  <el-button size="small" link type="primary" :icon="Document" @click="openExamReport(e)">查看报告</el-button>
                </div>
              </div>
            </div>
            <el-empty v-else description="暂无检查记录" :image-size="70" />
          </section>
        </div>

        <!-- ③ 诊断：临床诊断与分期 + 病理诊断 + 分子检测 + 原始资料 -->
        <div v-else-if="activeNav === 'diagnosis'">
          <div class="pd__group">
            <h3 class="pd__h">临床诊断与分期</h3>
            <div class="pd__diagnosis-summary">
              <div class="pd__diagnosis-main">
                <span class="pd__diagnosis-label">主要诊断</span>
                <strong>{{ patient.diagnosis }}</strong>
              </div>
              <div class="pd__diagnosis-stage">
                <span>当前分期</span>
                <strong>{{ patient.stage }}</strong>
              </div>
            </div>

            <div v-if="clinicalDiagnoses.length" class="pd__dx-list pd__dx-list--mt">
              <div
                v-for="d in clinicalDiagnoses"
                :key="d.id"
                :id="'rec-' + d.id"
                class="pd__dx-card"
                :class="{ 'pd__flash': highlightRef === d.id }"
              >
                <div class="pd__dx-card-head">
                  <div>
                    <div class="pd__dx-card-type">{{ d.type }}</div>
                    <div class="pd__dx-card-title">{{ d.histology }} · {{ d.differentiation }} · {{ d.site }}</div>
                  </div>
                  <span class="pd__dx-card-stage">{{ d.t }}{{ d.n }}{{ d.m }} · {{ d.stage }}</span>
                </div>
                <div class="pd__dx-card-basis">诊断依据：{{ d.basis }}</div>
                <div class="pd__dx-card-org">{{ d.org }} · {{ d.date || '日期待补全' }}</div>
              </div>
            </div>
          </div>

          <div class="pd__group">
            <h3 class="pd__h">病理诊断</h3>
            <div v-if="pathologyDiagnoses.length" class="pd__path-records">
              <div
                v-for="d in pathologyDiagnoses"
                :key="d.id"
                :id="'rec-' + d.id"
                class="pd__path-record"
                :class="{ 'pd__flash': highlightRef === d.id }"
              >
                <div class="pd__path-record-head">
                  <div>
                    <div class="pd__path-record-title">{{ d.basis.includes('ESD') ? 'ESD术后病理' : d.basis.includes('术后病理') ? '术后病理' : '胃镜活检病理' }}</div>
                    <div class="pd__path-record-sub">{{ d.org }} · {{ d.date }}</div>
                  </div>
                </div>

                <div class="pd__detail-grid">
                  <div class="pd__detail-item">
                    <span>标本类型</span>
                    <strong>{{ pathologySpecimen(d) }}</strong>
                  </div>
                  <div class="pd__detail-item">
                    <span>组织学类型</span>
                    <strong>{{ d.histology }}</strong>
                  </div>
                  <div class="pd__detail-item">
                    <span>分化程度</span>
                    <strong>{{ d.differentiation }}</strong>
                  </div>
                  <div class="pd__detail-item">
                    <span>病变部位</span>
                    <strong>{{ d.site }}</strong>
                  </div>
                  <div class="pd__detail-item pd__detail-item--wide">
                    <span>诊断依据</span>
                    <strong>{{ d.basis }}</strong>
                  </div>
                  <div v-if="pathologyNote(d)" class="pd__detail-item pd__detail-item--wide">
                    <span>病理要点</span>
                    <strong>{{ pathologyNote(d) }}</strong>
                  </div>
                </div>
              </div>
            </div>
            <el-empty v-else description="暂无病理诊断" :image-size="70" />
          </div>

          <div class="pd__group">
            <h3 class="pd__h">分子检测</h3>
            <div v-if="molecularRecords.length" class="pd__molecular-records">
              <div v-for="m in molecularRecords" :key="m.id" class="pd__molecular-record">
                <div class="pd__molecular-record-head">
                  <div>
                    <div class="pd__molecular-record-title">{{ m.title }}</div>
                    <div class="pd__molecular-record-sub">{{ m.sub }}</div>
                  </div>
                  <span class="pd__molecular-date">{{ m.org }} · {{ m.date }}</span>
                </div>

                <div class="pd__detail-grid pd__detail-grid--molecular">
                  <div class="pd__detail-item">
                    <span>检测项目</span>
                    <strong>{{ m.title }}</strong>
                  </div>
                  <div class="pd__detail-item">
                    <span>检测结果</span>
                    <strong class="pd__molecular-value">{{ m.result }}</strong>
                  </div>
                  <div class="pd__detail-item pd__detail-item--wide">
                    <span>结果说明</span>
                    <strong>{{ m.note }}</strong>
                  </div>
                </div>
              </div>
            </div>
            <div v-else class="pd__chain-empty">暂无分子检测</div>
          </div>

          <div class="pd__group">
            <h3 class="pd__h">原始资料</h3>
            <div v-if="pathologyResources.length" class="pd__path-res-list">
              <div v-for="r in pathologyResources" :key="r.id" class="pd__path-res">
                <div class="pd__path-res-main">
                  <span class="pd__path-res-type" :class="{ 'is-molecular': r.type === '基因检测' }">
                    {{ r.type === '基因检测' ? '分子原始报告' : '病理原始切片' }}
                  </span>
                  <div>
                    <div class="pd__path-res-title">{{ r.title }}</div>
                    <div class="pd__path-res-meta">{{ r.format }} · {{ r.size }} · {{ r.date }}</div>
                  </div>
                </div>
                <div class="pd__path-res-actions">
                  <el-tag size="small" effect="plain" :type="r.status === '待对齐' ? 'warning' : 'success'">{{ r.status }}</el-tag>
                  <el-button size="small" link type="primary" @click="openResource(r)">
                    {{ r.type === '病理切片' ? '查看切片' : '查看原报告' }}
                  </el-button>
                </div>
              </div>
            </div>
            <div v-else class="pd__chain-empty">暂无原始资料</div>
          </div>
        </div>

        <!-- ④ 治疗记录：治疗路径 + 治疗决策 + 具体治疗 -->
        <div v-else-if="activeNav === 'treatment'">
          <div v-if="patient.treatments.length" class="pd__group">
            <h3 class="pd__h">治疗路径</h3>
            <div class="pd__tx-path">
              <template v-for="(t, i) in treatmentPath" :key="t.id">
                <div class="pd__tx-path-item">
                  <div class="pd__tx-path-top">
                    <span class="pd__tx-path-line">{{ t.line }}</span>
                    <span class="pd__tx-path-result">{{ t.displayResult }}</span>
                  </div>
                  <strong>{{ t.name }}</strong>
                  <span>{{ t.startDate }}{{ t.endDate !== '—' && t.endDate !== t.startDate ? ` ～ ${t.endDate}` : '' }}</span>
                </div>
                <span v-if="i < treatmentPath.length - 1" class="pd__tx-path-arrow">→</span>
              </template>
            </div>
          </div>

          <div
            v-if="treatmentDecision"
            id="rec-treatment-decision"
            class="pd__group"
            :class="{ 'pd__flash': highlightRef === 'treatment-decision' }"
          >
            <h3 class="pd__h">治疗决策</h3>
            <div class="pd__tx-decision">
              <div class="pd__tx-decision-head">
                <div>
                  <strong>{{ treatmentDecision.title }}</strong>
                  <span>{{ treatmentDecision.org }} · {{ treatmentDecision.date }}</span>
                </div>
                <el-tag size="small" effect="light" type="primary">MDT</el-tag>
              </div>

              <div class="pd__tx-detail-grid">
                <div class="pd__tx-detail-item">
                  <span>临床诊断</span>
                  <strong>
                    {{ patient.diagnosis }}
                    <template v-if="treatmentClinicalDiagnosis">
                      · {{ treatmentClinicalDiagnosis.t }}{{ treatmentClinicalDiagnosis.n }}{{ treatmentClinicalDiagnosis.m }}
                      · {{ treatmentClinicalDiagnosis.stage }}
                    </template>
                  </strong>
                </div>
                <div class="pd__tx-detail-item">
                  <span>治疗策略</span>
                  <strong>{{ patient.treatments.map((t) => t.line).join(' → ') }}</strong>
                </div>
                <div class="pd__tx-detail-item pd__tx-detail-item--wide">
                  <span>MDT 结论</span>
                  <strong>{{ treatmentDecision.desc }}</strong>
                </div>
              </div>
            </div>
          </div>

          <div class="pd__group">
            <h3 class="pd__h">治疗记录</h3>
            <div v-if="patient.treatments.length" class="pd__tx-records">
              <div
                v-for="t in treatmentPath"
                :key="t.id"
                :id="'rec-' + t.id"
                class="pd__tx-record"
                :class="{ 'is-doing': t.status === '进行中', 'pd__flash': highlightRef === t.id }"
              >
                <div class="pd__tx-record-head">
                  <div class="pd__tx-record-title">
                    <el-tag size="small" effect="dark" round>{{ t.line }}</el-tag>
                    <strong>{{ t.name }}</strong>
                  </div>
                  <span class="pd__tx-status" :class="{ 'pd__tx-status--doing': t.status === '进行中' }">
                    {{ t.status }}
                  </span>
                </div>

                <div class="pd__tx-detail-grid">
                  <div class="pd__tx-detail-item">
                    <span>治疗方式</span>
                    <strong>{{ t.modality }}</strong>
                  </div>
                  <div class="pd__tx-detail-item">
                    <span>{{ t.modality === '手术' ? '手术方式' : t.modality === '内镜治疗' ? '治疗术式' : '治疗方案' }}</span>
                    <strong>{{ t.scheme }}</strong>
                  </div>

                  <div v-if="t.modality !== '手术' && t.modality !== '内镜治疗' && t.cycles !== '—'" class="pd__tx-detail-item">
                    <span>治疗周期</span>
                    <strong>{{ t.cycles }}</strong>
                  </div>
                  <div class="pd__tx-detail-item">
                    <span>{{ t.modality === '手术' ? '手术日期' : t.modality === '内镜治疗' ? '治疗日期' : '治疗日期' }}</span>
                    <strong>
                      {{ t.startDate }}
                      <template v-if="t.endDate !== '—' && t.endDate !== t.startDate"> ～ {{ t.endDate }}</template>
                      <template v-else-if="t.endDate === '—'"> ～ 至今</template>
                    </strong>
                  </div>

                  <div v-if="t.modality === '手术' || t.modality === '内镜治疗'" class="pd__tx-detail-item">
                    <span>切除情况</span>
                    <strong>{{ t.displayResult }}</strong>
                  </div>
                  <div v-else-if="t.efficacy !== '—'" class="pd__tx-detail-item">
                    <span>疗效评估</span>
                    <strong>{{ t.efficacy }}</strong>
                  </div>

                  <div class="pd__tx-detail-item">
                    <span>治疗机构</span>
                    <strong>{{ t.org }}</strong>
                  </div>

                  <div v-if="(t.modality === '手术' || t.modality === '内镜治疗') && postoperativePathology" class="pd__tx-detail-item pd__tx-detail-item--wide">
                    <span>术后病理</span>
                    <strong>{{ postoperativePathology.histology }} · {{ postoperativePathology.differentiation }}</strong>
                  </div>
                </div>
              </div>
            </div>
            <el-empty v-else description="暂无治疗记录" :image-size="80" />
          </div>
        </div>

        <!-- ⑤ 疗效随访：随访记录 + 疗效评估 + 复发转移 -->
        <div v-else-if="activeNav === 'followup'">
          <div class="pd__group">
            <h3 class="pd__h">随访记录</h3>
            <div v-if="patient.followUps.length" class="pd__follow-records">
              <div
                v-for="f in patient.followUps"
                :key="f.id"
                :id="'rec-' + f.id"
                class="pd__follow-record"
                :class="{ 'pd__flash': highlightRef === f.id }"
              >
                <div class="pd__follow-head">
                  <div class="pd__follow-title">
                    <el-tag
                      size="small"
                      :type="f.outcome === '无病生存' ? 'success' : f.outcome === '死亡' ? 'danger' : 'warning'"
                      effect="light"
                    >
                      {{ f.modality }}
                    </el-tag>
                    <strong>{{ f.date }}</strong>
                  </div>
                  <span>{{ f.org }}</span>
                </div>

                <div class="pd__follow-grid">
                  <div class="pd__follow-item">
                    <span>随访结局</span>
                    <strong>{{ f.outcome }}</strong>
                  </div>
                  <div class="pd__follow-item">
                    <span>下次随访</span>
                    <strong>{{ f.nextDate }}</strong>
                  </div>
                  <div class="pd__follow-item pd__follow-item--wide">
                    <span>随访情况</span>
                    <strong>{{ f.summary }}</strong>
                  </div>
                </div>
              </div>
            </div>
            <el-empty v-else description="暂无随访记录" :image-size="80" />
          </div>

          <div v-if="efficacyEvaluations.length" class="pd__group">
            <h3 class="pd__h">疗效评估</h3>
            <div class="pd__eval-records">
              <div
                v-for="e in efficacyEvaluations"
                :key="e.id"
                :id="'rec-eval-' + e.id"
                class="pd__eval-record"
                :class="{ 'pd__flash': highlightRef === 'eval-' + e.id }"
              >
                <div class="pd__follow-head">
                  <div class="pd__follow-title">
                    <el-tag size="small" :type="effType[e.result]" effect="light">{{ e.result }}</el-tag>
                    <strong>{{ e.date }}</strong>
                  </div>
                  <span>{{ e.org }}</span>
                </div>

                <div class="pd__follow-grid">
                  <div class="pd__follow-item">
                    <span>评估依据</span>
                    <strong>{{ e.basis }}</strong>
                  </div>
                  <div class="pd__follow-item">
                    <span>评估结果</span>
                    <strong>{{ e.result }}</strong>
                  </div>
                  <div class="pd__follow-item pd__follow-item--wide">
                    <span>疾病变化</span>
                    <strong>{{ e.summary }}</strong>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div v-if="progressionRecords.length" class="pd__group">
            <h3 class="pd__h">复发 / 转移记录</h3>
            <div class="pd__progression-records">
              <div
                v-for="f in progressionRecords"
                :key="f.id"
                :id="'rec-progression-' + f.id"
                class="pd__progression-record"
                :class="{ 'pd__flash': highlightRef === 'progression-' + f.id }"
              >
                <div class="pd__follow-head">
                  <div class="pd__follow-title">
                    <el-tag size="small" type="danger" effect="light">{{ f.outcome }}</el-tag>
                    <strong>{{ f.date }}</strong>
                  </div>
                  <span>{{ f.org }}</span>
                </div>

                <div class="pd__follow-grid">
                  <div class="pd__follow-item pd__follow-item--wide">
                    <span>记录说明</span>
                    <strong>{{ f.summary }}</strong>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- ⑥ 完整档案：数据资产视图 -->
        <div v-else-if="activeNav === 'archive'">
          <div class="pd__group">
            <h3 class="pd__h">多模态资源</h3>
            <div v-if="patient.resources.length" class="pd__ress">
              <div v-for="r in patient.resources" :key="r.id" class="pd__res" @click="openResource(r)">
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
            <h3 class="pd__h">档案完整性</h3>
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

    <el-dialog
      v-model="examReportVisible"
      :title="selectedExam?.title || '检查报告'"
      width="900px"
      class="pd__exam-dialog"
      destroy-on-close
      align-center
    >
      <div v-if="selectedExam" class="pd__report">
        <div class="pd__report-meta">
          <div>
            <span>检查类型</span>
            <strong>{{ selectedExam.type }}</strong>
          </div>
          <div>
            <span>检查日期</span>
            <strong>{{ selectedExam.date }}</strong>
          </div>
          <div>
            <span>检查机构</span>
            <strong>{{ selectedExam.org }}</strong>
          </div>
        </div>

        <section class="pd__report-section">
          <h4>检查结论</h4>
          <p>{{ selectedExam.desc }}</p>
          <div v-if="selectedExam.compared" class="pd__report-compared">
            <span>较前变化</span>
            {{ selectedExam.compared }}
          </div>
        </section>

        <section class="pd__report-section">
          <h4>代表影像</h4>
          <div v-if="selectedExamImage" class="pd__report-image">
            <el-image
              :src="selectedExamImage"
              :preview-src-list="[selectedExamImage]"
              fit="contain"
              preview-teleported
            />
            <div class="pd__report-image-tip">点击影像可放大查看</div>
          </div>
          <div v-else class="pd__report-empty">当前检查暂无演示影像，保留报告结论展示。</div>
        </section>

        <div class="pd__report-note">
          演示影像仅用于原型展示；正式系统中由检查记录关联原始 DICOM / 内镜影像资源，并按授权范围访问。
        </div>
      </div>
    </el-dialog>

    <el-dialog
      v-model="pathologyViewerVisible"
      title="病理切片"
      width="900px"
      class="pd__exam-dialog"
      destroy-on-close
      align-center
    >
      <div v-if="selectedPathologyResource" class="pd__report">
        <div class="pd__report-meta">
          <div>
            <span>资料名称</span>
            <strong>{{ selectedPathologyResource.title }}</strong>
          </div>
          <div>
            <span>资料日期</span>
            <strong>{{ selectedPathologyResource.date }}</strong>
          </div>
          <div>
            <span>资源格式</span>
            <strong>{{ selectedPathologyResource.format }}</strong>
          </div>
        </div>

        <section class="pd__report-section">
          <h4>代表性病理切片</h4>
          <div class="pd__report-image pd__pathology-image">
            <el-image
              :src="pathologyImage"
              :preview-src-list="[pathologyImage]"
              fit="contain"
              preview-teleported
            />
            <div class="pd__report-image-tip">点击切片可放大查看</div>
          </div>
        </section>

        <section class="pd__report-section">
          <h4>切片说明</h4>
          <p>食管鳞状细胞癌 H&E 染色代表性显微图像，用于原型演示病理资源查看能力。</p>
        </section>

        <div class="pd__report-note">
          当前为 JPG 演示切片；正式系统可对接 SVS / NDPI 等全视野数字病理切片及专业阅片器，并按授权范围访问。
        </div>
      </div>
    </el-dialog>
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
  padding: 20px 24px;
}
.pd__hero-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
}
.pd__id-top {
  display: flex;
  align-items: center;
  gap: 16px;
  min-width: 0;
}
.pd__avatar {
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
  margin-top: 7px;
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
.pd__ops {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  justify-content: flex-end;
}
.pd__hero-info {
  display: grid;
  grid-template-columns: minmax(230px, 1.35fr) minmax(150px, 0.8fr) minmax(150px, 0.8fr) minmax(180px, 1fr) minmax(120px, 0.65fr);
  gap: 0;
  margin-top: 18px;
  padding-top: 16px;
  border-top: 1px dashed var(--pf-border);
}
.pd__info-item {
  min-width: 0;
  padding: 0 18px;
  border-left: 1px solid var(--pf-border);
}
.pd__info-item:first-child {
  padding-left: 0;
  border-left: none;
}
.pd__info-k {
  display: block;
  font-size: 12px;
  color: var(--pf-text-faint);
  margin-bottom: 6px;
}
.pd__info-v {
  display: block;
  font-size: 14px;
  font-weight: 700;
  color: var(--pf-text);
  line-height: 1.45;
}
.pd__info-item--conclusion {
  grid-column: 1 / -1;
  display: grid;
  grid-template-columns: 94px 1fr;
  align-items: start;
  gap: 12px;
  padding: 14px 0 0;
  margin-top: 14px;
  border-left: none;
  border-top: 1px solid var(--pf-border);
}
.pd__info-item--conclusion .pd__info-k {
  margin: 0;
}
.pd__info-text {
  font-size: 14px;
  color: var(--pf-text-soft);
  line-height: 1.55;
}
.pd__stage-pill {
  display: inline-flex;
  font-family: ui-monospace, 'Cascadia Code', Consolas, monospace;
  font-size: 13px;
  font-weight: 600;
  color: #2563eb;
  border: 1px solid rgba(37, 99, 235, 0.3);
  background: rgba(37, 99, 235, 0.06);
  border-radius: 999px;
  padding: 3px 12px;
}
.pd__stage-pill.sm {
  font-size: 12px;
  padding: 2px 10px;
}
.pd__status-pill {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  font-size: 13px;
  font-weight: 700;
  padding: 4px 12px;
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

/* 提示条 */
.pd__notice {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: var(--pf-text-soft);
  margin-top: 10px;
  padding: 8px 14px;
  border-radius: 10px;
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

/* ===================== 检查报告弹窗 ===================== */
:deep(.pd__exam-dialog) {
  border-radius: 16px;
}
:deep(.pd__exam-dialog .el-dialog__header) {
  margin-right: 0;
  padding-bottom: 14px;
  border-bottom: 1px solid var(--pf-border);
}
:deep(.pd__exam-dialog .el-dialog__body) {
  padding-top: 18px;
}
.pd__report-meta {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
  margin-bottom: 16px;
}
.pd__report-meta > div {
  padding: 11px 13px;
  background: var(--pf-surface-2);
  border: 1px solid var(--pf-border);
  border-radius: 10px;
}
.pd__report-meta span {
  display: block;
  margin-bottom: 5px;
  font-size: 11px;
  color: var(--pf-text-faint);
}
.pd__report-meta strong {
  font-size: 13px;
  color: var(--pf-text);
}
.pd__report-section + .pd__report-section {
  margin-top: 18px;
}
.pd__report-section h4 {
  margin: 0 0 10px;
  font-size: 14px;
  color: var(--pf-text);
}
.pd__report-section p {
  margin: 0;
  padding: 12px 14px;
  line-height: 1.7;
  color: var(--pf-text-soft);
  background: var(--pf-surface-2);
  border: 1px solid var(--pf-border);
  border-radius: 10px;
}
.pd__report-compared {
  margin-top: 8px;
  padding: 9px 12px;
  font-size: 12px;
  color: #b45309;
  background: rgba(245, 158, 11, 0.08);
  border-radius: 8px;
}
.pd__report-compared span {
  margin-right: 8px;
  font-weight: 700;
}
.pd__report-image {
  padding: 12px;
  text-align: center;
  background: #0f172a;
  border-radius: 12px;
  overflow: hidden;
}
.pd__report-image :deep(.el-image) {
  width: 100%;
  max-height: 520px;
}
.pd__report-image :deep(.el-image__inner) {
  max-height: 520px;
}
.pd__report-image-tip {
  margin-top: 8px;
  font-size: 11px;
  color: rgba(255, 255, 255, 0.65);
}
.pd__pathology-image :deep(.el-image__inner) {
  max-height: 560px;
}
.pd__report-empty {
  padding: 26px;
  text-align: center;
  color: var(--pf-text-faint);
  background: var(--pf-surface-2);
  border: 1px dashed var(--pf-border);
  border-radius: 10px;
}
.pd__report-note {
  margin-top: 16px;
  padding-top: 12px;
  border-top: 1px dashed var(--pf-border);
  font-size: 11px;
  line-height: 1.6;
  color: var(--pf-text-faint);
}

/* ===================== 中部导航 ===================== */
.pd__nav-sticky {
  position: sticky;
  top: 0;
  z-index: 30;
  padding-bottom: 14px;
  background: var(--pf-page-bg, #f4f7fb);
}
.pd__nav {
  display: flex;
  gap: 6px;
  margin: 0;
  padding: 6px;
  background: #fff;
  border: 1px solid var(--pf-border);
  border-radius: 14px;
  overflow-x: auto;
  box-shadow: 0 8px 18px -16px rgba(15, 23, 42, 0.45);
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
  position: sticky;
  top: 12px;
  max-height: calc(100vh - 130px);
  overflow-y: auto;
  overflow-x: hidden;
  isolation: isolate;
  background: var(--pf-page-bg, #f4f7fb);
  overscroll-behavior: contain;
}
.pd__detail > :not(.pd__nav-sticky) {
  position: relative;
  z-index: 1;
}

/* 固定导航后，锚点定位预留导航高度 */
.pd__detail [id^='rec-'],
.pd__detail [id^='visit-'] {
  scroll-margin-top: 78px;
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

/* 就诊记录 */
.pd__visits {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.pd__visit {
  padding: 15px 16px;
  border: 1px solid var(--pf-border);
  border-radius: 12px;
  background: var(--pf-surface-2);
}
.pd__visit-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  padding-bottom: 11px;
  border-bottom: 1px dashed var(--pf-border);
}
.pd__visit-title {
  display: flex;
  align-items: center;
  gap: 9px;
}
.pd__visit-title strong {
  font-size: 14px;
  color: var(--pf-text);
}
.pd__visit-type {
  font-size: 12px;
  font-weight: 700;
  padding: 2px 11px;
  border-radius: 999px;
}
.pd__visit-org {
  flex: none;
  font-size: 11px;
  color: var(--pf-text-faint);
  white-space: nowrap;
}
.pd__visit-body {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
}
.pd__visit-row {
  min-width: 0;
  padding: 10px 0;
  display: grid;
  grid-template-columns: 78px 1fr;
  gap: 10px;
  border-bottom: 1px dashed var(--pf-border);
}
.pd__visit-row:nth-child(odd):not(.pd__visit-row--wide) {
  padding-right: 18px;
}
.pd__visit-row:nth-child(even):not(.pd__visit-row--wide) {
  padding-left: 18px;
  border-left: 1px dashed var(--pf-border);
}
.pd__visit-row--wide {
  grid-column: 1 / -1;
}
.pd__visit-k {
  font-size: 12px;
  color: var(--pf-text-faint);
}
.pd__visit-v {
  font-size: 13px;
  font-weight: 650;
  line-height: 1.55;
  color: var(--pf-text);
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
/* 就诊节点与其他诊疗事件使用统一卡片底色，仅通过左侧色条和标签区分类别 */
.pd__tl-card.is-encounter {
  background: var(--pf-surface-2);
  border-color: var(--pf-border);
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


/* ===================== 检查检验：四大模块 ===================== */
.pd__labs .el-table {
  border-radius: 12px;
  overflow: hidden;
}
.pd__lab-name {
  font-size: 14px;
  font-weight: 600;
  color: var(--pf-text);
}
.pd__lab-cat {
  font-size: 12px;
  color: var(--pf-text-faint);
  margin-top: 2px;
}
.pd__lab-val {
  font-variant-numeric: tabular-nums;
}
.pd__muted {
  color: var(--pf-text-faint);
}
.pd__status-chip {
  display: inline-block;
  font-size: 12px;
  font-weight: 700;
  padding: 3px 10px;
  border-radius: 999px;
  border: 1px solid;
}
/* 纵向检查记录卡 */
.pd__exam-list {
  display: flex;
  flex-direction: column;
  gap: 12px
}
.pd__exam-card {
  border: 1px solid var(--pf-border);
  border-left-width: 3px;
  border-radius: 12px;
  padding: 14px 18px;
  background: var(--pf-surface-2);
  transition: box-shadow 0.18s ease, border-color 0.18s ease;
}
.pd__exam-card:hover {
  box-shadow: 0 8px 22px -12px rgba(37, 99, 235, 0.4);
}
.pd__exam-head {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}
.pd__exam-type {
  font-size: 12px;
  font-weight: 700;
  padding: 2px 12px;
  border-radius: 999px;
  border: 1px solid;
}
.pd__exam-title {
  font-size: 14px;
  font-weight: 700;
  color: var(--pf-text);
}
.pd__exam-date {
  font-family: ui-monospace, 'Cascadia Code', Consolas, monospace;
  font-size: 13px;
  color: var(--pf-text-soft);
  margin-left: auto;
}
.pd__exam-org {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: var(--pf-text-soft);
  margin-top: 8px;
}
.pd__exam-desc {
  font-size: 13px;
  color: var(--pf-text-soft);
  line-height: 1.6;
  margin-top: 8px;
}
.pd__exam-compared {
  margin-top: 8px;
  font-size: 12px;
  color: #b45309;
  background: rgba(245, 158, 11, 0.08);
  border-radius: 8px;
  padding: 6px 10px;
}
.pd__exam-cmp-label {
  font-weight: 700;
  margin-right: 6px;
}
.pd__exam-foot {
  margin-top: 10px;
}
/* 诊断：逻辑链 */
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
/* 诊断页 */
.pd__diagnosis-summary {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 18px;
  align-items: center;
  padding: 15px 16px;
  border: 1px solid var(--pf-border);
  border-radius: 12px;
  background: var(--pf-surface-2);
}
.pd__diagnosis-main,
.pd__diagnosis-stage {
  display: flex;
  flex-direction: column;
  gap: 5px;
}
.pd__diagnosis-label,
.pd__diagnosis-stage span {
  font-size: 12px;
  color: var(--pf-text-faint);
}
.pd__diagnosis-main strong {
  font-size: 15px;
  color: var(--pf-text);
}
.pd__diagnosis-stage {
  min-width: 150px;
  padding-left: 18px;
  border-left: 1px solid var(--pf-border);
}
.pd__diagnosis-stage strong {
  font-family: ui-monospace, 'Cascadia Code', Consolas, monospace;
  font-size: 14px;
  color: #7c3aed;
}
.pd__dx-list--mt {
  margin-top: 12px;
}

/* 诊断：诊断卡片列表 */
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
.pd__path-actions {
  margin-top: 8px;
}
.pd__path-records,
.pd__molecular-records {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.pd__path-record,
.pd__molecular-record {
  border: 1px solid var(--pf-border);
  border-radius: 12px;
  padding: 15px 16px;
  background: var(--pf-surface-2);
}
.pd__path-record-head,
.pd__molecular-record-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 12px;
}
.pd__path-record-title,
.pd__molecular-record-title {
  font-size: 14px;
  font-weight: 800;
  color: var(--pf-text);
}
.pd__path-record-sub,
.pd__molecular-record-sub,
.pd__molecular-date {
  margin-top: 4px;
  font-size: 11px;
  color: var(--pf-text-faint);
}
.pd__detail-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  border-top: 1px dashed var(--pf-border);
}
.pd__detail-item {
  min-width: 0;
  padding: 11px 0;
  display: grid;
  grid-template-columns: 78px 1fr;
  gap: 10px;
  border-bottom: 1px dashed var(--pf-border);
}
.pd__detail-item:nth-child(odd):not(.pd__detail-item--wide) {
  padding-right: 18px;
}
.pd__detail-item:nth-child(even):not(.pd__detail-item--wide) {
  padding-left: 18px;
  border-left: 1px dashed var(--pf-border);
}
.pd__detail-item--wide {
  grid-column: 1 / -1;
}
.pd__detail-item > span {
  font-size: 12px;
  color: var(--pf-text-faint);
}
.pd__detail-item > strong {
  font-size: 13px;
  font-weight: 650;
  line-height: 1.55;
  color: var(--pf-text);
}
.pd__detail-grid--molecular .pd__detail-item:last-child {
  border-bottom: 0;
}
.pd__molecular-value {
  color: #7c3aed !important;
  font-family: inherit;
  font-size: 13px !important;
  font-weight: 650;
  line-height: 1.55;
  letter-spacing: normal;
}
.pd__source-tip {
  margin: -4px 0 10px;
  font-size: 12px;
  color: var(--pf-text-faint);
}

.pd__path-res-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.pd__path-res {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 11px 12px;
  border: 1px solid var(--pf-border);
  border-radius: 10px;
  background: var(--pf-surface-2);
}
.pd__path-res-main,
.pd__path-res-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}
.pd__path-res-type {
  flex: none;
  font-size: 12px;
  font-weight: 700;
  color: #7c3aed;
  background: rgba(139, 92, 246, 0.08);
  border-radius: 999px;
  padding: 3px 10px;
}

.pd__path-res-type.is-molecular {
  color: #7c3aed;
  background: rgba(124, 58, 237, 0.08);
}
.pd__path-res-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--pf-text);
}
.pd__path-res-meta {
  margin-top: 3px;
  font-size: 12px;
  color: var(--pf-text-faint);
}

/* 治疗记录 */
.pd__tx-path {
  display: flex;
  align-items: stretch;
  gap: 10px;
  overflow-x: auto;
}
.pd__tx-path-item {
  min-width: 210px;
  flex: 1;
  padding: 13px 14px;
  border: 1px solid var(--pf-border);
  border-radius: 12px;
  background: var(--pf-surface-2);
}
.pd__tx-path-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 7px;
}
.pd__tx-path-line {
  font-size: 12px;
  font-weight: 700;
  color: #2563eb;
}
.pd__tx-path-result {
  font-size: 11px;
  color: #10b981;
}
.pd__tx-path-item strong {
  display: block;
  font-size: 14px;
  color: var(--pf-text);
}
.pd__tx-path-item > span {
  display: block;
  margin-top: 6px;
  font-size: 11px;
  color: var(--pf-text-faint);
}
.pd__tx-path-arrow {
  flex: none;
  align-self: center;
  font-size: 18px;
  color: var(--pf-text-faint);
}
.pd__tx-decision {
  border: 1px solid var(--pf-border);
  border-radius: 12px;
  padding: 15px 16px;
  background: var(--pf-surface-2);
}
.pd__tx-decision-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  padding-bottom: 12px;
  border-bottom: 1px dashed var(--pf-border);
}
.pd__tx-decision-head > div {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.pd__tx-decision-head strong {
  font-size: 14px;
  color: var(--pf-text);
}
.pd__tx-decision-head span {
  font-size: 11px;
  color: var(--pf-text-faint);
}
.pd__tx-records {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.pd__tx-record {
  border: 1px solid var(--pf-border);
  border-radius: 12px;
  padding: 15px 16px;
  background: var(--pf-surface-2);
}
.pd__tx-record.is-doing {
  border-color: rgba(6, 182, 212, 0.4);
  background: rgba(6, 182, 212, 0.03);
}
.pd__tx-record-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  margin-bottom: 12px;
}
.pd__tx-record-title {
  display: flex;
  align-items: center;
  gap: 9px;
  min-width: 0;
}
.pd__tx-record-title strong {
  font-size: 15px;
  color: var(--pf-text);
}
.pd__tx-status {
  font-size: 12px;
  color: var(--pf-text-faint);
}
.pd__tx-status--doing {
  color: #06b6d4;
  font-weight: 700;
}
.pd__tx-detail-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
}
.pd__tx-detail-item {
  min-width: 0;
  padding: 10px 0;
  display: grid;
  grid-template-columns: 80px 1fr;
  gap: 10px;
  border-bottom: 1px dashed var(--pf-border);
}
.pd__tx-detail-item:nth-child(odd):not(.pd__tx-detail-item--wide) {
  padding-right: 18px;
}
.pd__tx-detail-item:nth-child(even):not(.pd__tx-detail-item--wide) {
  padding-left: 18px;
  border-left: 1px dashed var(--pf-border);
}
.pd__tx-detail-item--wide {
  grid-column: 1 / -1;
}
.pd__tx-detail-item span {
  font-size: 12px;
  color: var(--pf-text-faint);
}
.pd__tx-detail-item strong {
  font-size: 13px;
  font-weight: 650;
  color: var(--pf-text);
  line-height: 1.55;
}

/* 疗效随访 */
.pd__follow-records,
.pd__eval-records,
.pd__progression-records {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.pd__follow-record,
.pd__eval-record,
.pd__progression-record {
  padding: 15px 16px;
  border: 1px solid var(--pf-border);
  border-radius: 12px;
  background: var(--pf-surface-2);
}
.pd__follow-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  padding-bottom: 11px;
  border-bottom: 1px dashed var(--pf-border);
}
.pd__follow-head > span {
  flex: none;
  font-size: 11px;
  color: var(--pf-text-faint);
}
.pd__follow-title {
  display: flex;
  align-items: center;
  gap: 9px;
}
.pd__follow-title strong {
  font-size: 14px;
  color: var(--pf-text);
}
.pd__follow-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
}
.pd__follow-item {
  min-width: 0;
  padding: 10px 0;
  display: grid;
  grid-template-columns: 78px 1fr;
  gap: 10px;
  border-bottom: 1px dashed var(--pf-border);
}
.pd__follow-item:nth-child(odd):not(.pd__follow-item--wide) {
  padding-right: 18px;
}
.pd__follow-item:nth-child(even):not(.pd__follow-item--wide) {
  padding-left: 18px;
  border-left: 1px dashed var(--pf-border);
}
.pd__follow-item--wide {
  grid-column: 1 / -1;
}
.pd__follow-item span {
  font-size: 12px;
  color: var(--pf-text-faint);
}
.pd__follow-item strong {
  font-size: 13px;
  font-weight: 650;
  line-height: 1.55;
  color: var(--pf-text);
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
  .pd__hero-info {
    grid-template-columns: repeat(2, 1fr);
    row-gap: 16px;
  }
  .pd__info-item {
    border-left: none;
    padding: 0;
  }
  .pd__info-item--conclusion {
    grid-column: 1 / -1;
  }
  .pd__main {
    grid-template-columns: 1fr;
  }
  .pd__axis {
    position: static;
    max-height: none;
  }
  .pd__ress {
    grid-template-columns: 1fr;
  }
}
@media (max-width: 640px) {
  .pd__report-meta {
    grid-template-columns: 1fr;
  }

  .pd__visit-body {
    grid-template-columns: 1fr;
  }
  .pd__visit-row,
  .pd__visit-row:nth-child(odd):not(.pd__visit-row--wide),
  .pd__visit-row:nth-child(even):not(.pd__visit-row--wide) {
    grid-column: auto;
    padding: 10px 0;
    border-left: none;
  }

  .pd__follow-grid {
    grid-template-columns: 1fr;
  }
  .pd__follow-item,
  .pd__follow-item:nth-child(odd):not(.pd__follow-item--wide),
  .pd__follow-item:nth-child(even):not(.pd__follow-item--wide) {
    grid-column: auto;
    padding: 10px 0;
    border-left: none;
  }

  .pd__tx-path {
    align-items: stretch;
  }
  .pd__tx-path-arrow {
    display: none;
  }
  .pd__tx-path-item {
    min-width: 230px;
  }
  .pd__tx-detail-grid {
    grid-template-columns: 1fr;
  }
  .pd__tx-detail-item,
  .pd__tx-detail-item:nth-child(odd):not(.pd__tx-detail-item--wide),
  .pd__tx-detail-item:nth-child(even):not(.pd__tx-detail-item--wide) {
    grid-column: auto;
    padding: 10px 0;
    border-left: none;
  }

  .pd__detail-grid {
    grid-template-columns: 1fr;
  }
  .pd__detail-item,
  .pd__detail-item:nth-child(odd):not(.pd__detail-item--wide),
  .pd__detail-item:nth-child(even):not(.pd__detail-item--wide) {
    grid-column: auto;
    padding: 10px 0;
    border-left: none;
  }

  .pd__path-record-head,
  .pd__molecular-record-head {
    flex-direction: column;
    gap: 6px;
  }
  .pd__path-result,
  .pd__molecular-result-row,
  .pd__molecular-note-row {
    grid-template-columns: 1fr;
    gap: 4px;
  }
  .pd__path-detail,
  .pd__path-actions {
    padding-left: 0;
  }
  .pd__path-res {
    align-items: flex-start;
    flex-direction: column;
  }
  .pd__path-res-actions {
    width: 100%;
    justify-content: flex-end;
  }
  .pd__hero {
    padding: 18px;
  }
  .pd__hero-top {
    align-items: flex-start;
    flex-direction: column;
  }
  .pd__ops {
    width: 100%;
    justify-content: flex-start;
  }
  .pd__hero-info {
    grid-template-columns: 1fr;
  }
  .pd__info-item--conclusion {
    grid-column: auto;
    grid-template-columns: 1fr;
    gap: 6px;
  }
.pd__chain-arrow {
    display: none;
  }
}
</style>

