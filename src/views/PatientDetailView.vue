<script setup lang="ts">
import { computed, ref, watch, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Lock, Connection, Document } from '@element-plus/icons-vue'
import ctImage from '@/assets/patients/P-0001/exams/ct.jpg'
import endoscopyImage from '@/assets/patients/P-0001/exams/endoscopy.jpg'
import petCtImage from '@/assets/patients/P-0001/exams/pet-ct.jpg'
import molecularReportUrl from '@/assets/patients/P-0001/molecular/escc-molecular-case-report.pdf?url'
import pathologyImage from '@/assets/patients/P-0001/pathology/escc-he-high-mag.jpg'
import {
  resolvePatientDetail,
  resolveCourseStages,
  resolveCourseMilestones,
  maskIdNo,
  maskPhone,
  maskAddress,
  type CourseStageKey,
  type CourseMilestone,
  type MilestoneEvidence,
  type DataLevel,
  type TimelineNode,
  type VisitRecord,
} from '@/mock/patients'
const route = useRoute()
const router = useRouter()
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
function applyFullView() {
  ElMessage.info(`已提交完整档案授权申请（${patient.value.code}），等待数据治理审批，审计已留痕。`)
}
function goInfo() {
  router.push(`/dataset/patients/${patient.value.id}/info`)
}
type NavKey = CourseStageKey
const navItems: { key: NavKey; label: string; color: string }[] = [
  { key: 'screening', label: '早筛', color: '#0ea5e9' },
  { key: 'diagnosis', label: '诊断', color: '#8b5cf6' },
  { key: 'treatment', label: '治疗', color: '#06b6d4' },
  { key: 'followup', label: '随访', color: '#10b981' },
]
const activeNav = ref<NavKey>('screening')
const selectedNodeId = ref('')
const courseStages = computed(() => resolveCourseStages(patient.value.timeline))
const stageOfNodeId = computed(() => {
  const m = new Map<string, CourseStageKey>()
  courseStages.value.forEach((s) => s.nodes.forEach((n) => m.set(n.id, s.key)))
  return m
})
const courseMilestones = computed(() => resolveCourseMilestones(courseStages.value))
const stageMeta: Record<CourseStageKey, { label: string; color: string }> = {
  screening: { label: '早筛', color: '#0ea5e9' },
  diagnosis: { label: '诊断', color: '#8b5cf6' },
  treatment: { label: '治疗', color: '#06b6d4' },
  followup: { label: '随访', color: '#10b981' },
}
const journeyColor: Record<CourseStageKey, string> = {
  screening: '#0ea5e9',
  diagnosis: '#8b5cf6',
  treatment: '#f59e0b',
  followup: '#10b981',
}
const journeyNo: Record<CourseStageKey, string> = {
  screening: '01',
  diagnosis: '02',
  treatment: '03',
  followup: '04',
}
const journeySub: Record<CourseStageKey, string> = {
  screening: '发现疾病线索',
  diagnosis: '明确疾病状态',
  treatment: '疾病干预过程',
  followup: '长期疾病管理',
}
function stageColorOf(k: CourseStageKey): string {
  return stageMeta[k].color
}
function stageLabelOf(k: CourseStageKey): string {
  return stageMeta[k].label
}
const milestoneStages = computed(() => {
  const order: CourseStageKey[] = ['screening', 'diagnosis', 'treatment', 'followup']
  return order
    .map((key) => ({
      key,
      label: stageMeta[key].label,
      color: stageMeta[key].color,
      items: courseMilestones.value.filter((m) => m.stage === key),
    }))
    .filter((g) => g.items.length > 0)
})
const selectedStageKey = computed(() => {
  const m = courseMilestones.value.find((x) => x.id === selectedNodeId.value)
  return m?.stage
})
function stageRangeOf(items: { date: string }[]): string {
  const ds = items.map((i) => i.date).filter(Boolean).sort()
  if (!ds.length) return ''
  const fmt = (d: string) => d.slice(0, 7)
  return ds.length === 1 ? fmt(ds[0]) : `${fmt(ds[0])} — ${fmt(ds[ds.length - 1])}`
}
watch(
  () => route.params.id,
  () => {
    const first = courseStages.value.find((s) => s.nodes.length > 0)
    activeNav.value = first ? first.key : 'screening'
    selectedNodeId.value = ''
  },
  { immediate: true },
)
const followupKinds = ['随访', '复查', '疗效评估', '复发转移']
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
const timelineAll = computed(() => courseStages.value.flatMap((s) => s.nodes))
function switchNav(key: NavKey) {
  activeNav.value = key
}
const highlightRef = ref('')
const flashVisitId = ref('')
async function goToEvent(node: TimelineNode) {
  if (node.kind === '就诊节点') {
    activeNav.value = stageOfNodeId.value.get(node.id) ?? 'screening'
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
  const target = stageOfNodeId.value.get(node.id) ?? 'screening'
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
function locateByNodeId(id: string) {
  const node = timelineAll.value.find((n) => n.id === id)
  if (node) goToEvent(node)
}
const recentNodeId = computed(() => timelineAll.value[timelineAll.value.length - 1]?.id ?? '')
const currentTreatment = computed(
  () => patient.value.treatments.find((t) => t.status === '进行中') ?? patient.value.treatments[patient.value.treatments.length - 1] ?? null,
)
const currentStageNodeId = computed(() => {
  if (patient.value.status !== '治疗中') return ''
  const ct = currentTreatment.value
  if (!ct) return ''
  const hit = timelineAll.value.find((n) => n.kind === '治疗' && n.title.includes(ct.name))
  const fallback = timelineAll.value.filter((n) => n.kind === '治疗').slice(-1)[0]
  return (hit ?? fallback)?.id ?? ''
})
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
const resectionTreatments = computed(() =>
  treatmentPath.value.filter((t) => t.modality === '手术' || t.modality === '内镜治疗'),
)
const adjuvantTreatments = computed(() =>
  treatmentPath.value.filter(
    (t) =>
      (t.line.includes('辅助') && !t.line.includes('新辅助')) ||
      t.line.includes('后续') ||
      t.line === '维持治疗',
  ),
)
const treatmentGoal = computed(() => {
  const d = treatmentClinicalDiagnosis.value
  const goal = treatmentPath.value.some((t) => t.modality === '手术')
    ? '根治性切除'
    : treatmentPath.value.some((t) => t.modality === '内镜治疗')
      ? '内镜下根治性切除'
      : treatmentPath.value[0]
        ? `${treatmentPath.value[0].modality}治疗`
        : ''
  return [patient.value.diagnosis, d ? `${d.t}${d.n}${d.m}` : '', d && d.stage !== '—' ? d.stage : '', goal]
    .filter(Boolean)
    .join(' · ')
})
const recentConclusion = computed(() =>
  patient.value.followUps[0]?.summary ?? patient.value.timeline[0]?.desc ?? '—',
)
const nextFollowUp = computed(() => patient.value.followUps[0]?.nextDate ?? '—')
const latestFollowUp = computed(() =>
  patient.value.followUps.length
    ? [...patient.value.followUps].sort((a, b) => b.date.localeCompare(a.date))[0]
    : null,
)
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
const pathologySlideResources = computed(() => pathologyResources.value.filter((r) => r.type === '病理切片'))
const molecularReportResources = computed(() => pathologyResources.value.filter((r) => r.type === '基因检测'))
function pathologySpecimen(d: { basis: string }) {
  if (d.basis.includes('ESD')) return 'ESD切除标本'
  return d.basis.includes('术后病理') ? '食管切除标本' : '胃镜活检组织'
}
function pathologyNote(d: { date: string }) {
  return patient.value.timeline.find((n) => n.date === d.date && n.title.includes('病理'))?.desc ?? ''
}
function postopSummary(d: { t: string; n: string; m: string; basis: string }) {
  const tnm = `${d.t}${d.n}${d.m}`
  const margin = d.basis.match(/R0|R1|Rx/i)?.[0] ?? '—'
  const nodes = d.basis.match(/(\d+)\/(\d+)\s*淋巴结/)?.[0] ?? '—'
  const trg = d.basis.match(/Mandard\s*TRG\s*\d+\s*级|TRG\s*\d+\s*级/i)?.[0] ?? '—'
  return { tnm, margin, nodes, trg }
}
const molecularRecords = computed(() => {
  const tests = patient.value.molecularTests
  const pdL1 = tests.find((m) => m.item === 'PD-L1')
  const mmr = tests.find((m) => m.item === 'MMR')
  const msi = tests.find((m) => m.item === 'MSI')
  const ngs = tests.find((m) => m.item === 'NGS')
  const her2 = tests.find((m) => m.item === 'HER2')
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
    her2 && {
      id: 'MR-HER2',
      title: 'HER2 检测',
      sub: '食管鳞癌相关标志物',
      result: her2.result,
      note: her2.note,
      date: her2.date,
      org: her2.org,
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
// 影像评估：用于分期判断的影像检查（CT / PET-CT / MRI / EUS / 超声），不纳入随访期复查
const isStagingImaging = (title: string) => /CT|PET|MRI|核磁|EUS|超声内镜|超声|增强/.test(title)
const diagnosisImagingExams = computed(() =>
  examList.value
    .filter((e) => isStagingImaging(e.title) && stageOfNodeId.value.get(e.id) !== 'followup')
    .sort((a, b) => a.date.localeCompare(b.date)),
)
const visits = computed(() =>
  [...patient.value.visits].sort((a, b) => b.date.localeCompare(a.date)),
)
const visitTypeColor: Record<string, string> = {
  门诊: '#0ea5e9',
  住院: '#8b5cf6',
  急诊: '#ef4444',
}
function stageNodes(key: CourseStageKey): TimelineNode[] {
  return courseStages.value.find((s) => s.key === key)?.nodes ?? []
}
function stageRange(s: { nodes: TimelineNode[] }): string {
  if (!s.nodes.length) return ''
  const first = s.nodes[0].date || '待补全'
  const last = s.nodes[s.nodes.length - 1].date || '待补全'
  return first === last ? first : `${first} — ${last}`
}
const currentStageKey = computed<CourseStageKey>(() => activeNav.value)
const currentStageVisits = computed(() =>
  currentStageKey.value ? stageVisits.value[currentStageKey.value] : [],
)
const currentStageExams = computed(() =>
  currentStageKey.value ? stageExams.value[currentStageKey.value] : [],
)
const currentStageLabs = computed(() =>
  currentStageKey.value
    ? (patient.value.labReports ?? []).filter((r) => r.stage === currentStageKey.value)
    : [],
)
function goLabs(stage: CourseStageKey) {
  router.push({
    name: 'dataset-patient-labs',
    params: { id: route.params.id as string },
    query: { stage },
  })
}
const stageEmpty = computed(() => {
  const k = currentStageKey.value
  if (!k) return false
  const hasOwn =
    (k === 'diagnosis' && (diagnosisStageDiagnoses.value.length > 0 || molecularRecords.value.length > 0)) ||
    (k === 'treatment' && (patient.value.treatments.length > 0 || treatmentStageDiagnoses.value.length > 0)) ||
    (k === 'followup' &&
      (patient.value.followUps.length > 0 ||
        efficacyEvaluations.value.length > 0 ||
        progressionRecords.value.length > 0))
  return !hasOwn && currentStageVisits.value.length === 0 && currentStageExams.value.length === 0
})
const stageVisits = computed<Record<CourseStageKey, VisitRecord[]>>(() => {
  const m: Record<CourseStageKey, VisitRecord[]> = { screening: [], diagnosis: [], treatment: [], followup: [] }
  ;[...patient.value.visits]
    .sort((a, b) => a.date.localeCompare(b.date))
    .forEach((v) => {
      const k = stageOfNodeId.value.get(v.id)
      if (k) m[k].push(v)
    })
  return m
})
const stageExams = computed<Record<CourseStageKey, ExamRecord[]>>(() => {
  const m: Record<CourseStageKey, ExamRecord[]> = { screening: [], diagnosis: [], treatment: [], followup: [] }
  ;[...examList.value]
    .sort((a, b) => a.date.localeCompare(b.date))
    .forEach((e) => {
      const k = stageOfNodeId.value.get(e.id)
      if (k) m[k].push(e)
    })
  return m
})
const isPostopPathology = (d: { basis: string }) => d.basis.includes('术后病理') || d.basis.includes('ESD')
const diagnosisStageDiagnoses = computed(() => patient.value.diagnoses.filter((d) => !isPostopPathology(d)))
const treatmentStageDiagnoses = computed(() => patient.value.diagnoses.filter(isPostopPathology))
const diagnosisStageClinical = computed(() => clinicalDiagnoses.value.filter((d) => !isPostopPathology(d)))
const diagnosisStagePathology = computed(() => pathologyDiagnoses.value.filter((d) => !isPostopPathology(d)))
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
const effType: Record<string, 'success' | 'primary' | 'warning' | 'danger' | 'info'> = {
  CR: 'success', PR: 'primary', SD: 'warning', PD: 'danger', '—': 'info',
}
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
</script>
<template>
  <div class="pd">
        <section class="pd__hero">
      <div class="pd__hero-top">
        <div class="pd__id-top">
          <div class="pd__avatar">{{ displayName.slice(-1) }}</div>
          <div class="pd__id-name">
            <div class="pd__name-row">
              <span class="pd__name">{{ displayName }}</span>
              <span class="pd__chip">{{ patient.gender }} · {{ patient.age }} 岁</span>
            </div>
          </div>
        </div>
        <div class="pd__ops">
          <el-button v-if="patient.level !== 'full'" round type="primary" plain @click="applyFullView">
            <el-icon><Lock /></el-icon>&nbsp;申请完整授权
          </el-button>
          <el-button round plain @click="goInfo">
            <el-icon><Document /></el-icon>&nbsp;详细信息
          </el-button>
        </div>
      </div>
      <div class="pd__hero-info">
        <div class="pd__info-item">
          <span class="pd__info-k">性别</span>
          <span class="pd__info-v">{{ patient.gender }}</span>
        </div>
        <div class="pd__info-item">
          <span class="pd__info-k">年龄</span>
          <span class="pd__info-v">{{ patient.age }} 岁</span>
        </div>
        <div class="pd__info-item">
          <span class="pd__info-k">病案号 / 患者编号</span>
          <span class="pd__info-v pd__info-v--mono">{{ patient.code }}</span>
        </div>
        <div class="pd__info-item">
          <span class="pd__info-k">PMI</span>
          <span class="pd__info-v pd__info-v--mono">{{ patient.primaryId }}</span>
        </div>
        <div class="pd__info-item">
          <span class="pd__info-k">所属机构</span>
          <span class="pd__info-v">{{ patient.org }}</span>
        </div>
        <div class="pd__info-item">
          <span class="pd__info-k">联系方式</span>
          <span class="pd__info-v">{{ masked.phone }}</span>
        </div>
        <div class="pd__info-item">
          <span class="pd__info-k">籍贯 / 常住地</span>
          <span class="pd__info-v">{{ masked.address }}</span>
        </div>
        <div class="pd__info-item">
          <span class="pd__info-k">数据可见级别</span>
          <el-tag :type="levelType[patient.level]" size="small" effect="light" round>{{ levelText[patient.level] }}</el-tag>
        </div>
      </div>
    </section>
        <div class="pd__main">
            <aside class="pd__axis">
        <div class="pd__axis-head">
          <h3 class="pd__h pd__h--inline">关键病程节点</h3>
        </div>
                <div class="pd__ms">
          <section
            v-for="grp in milestoneStages"
            :key="grp.key"
            class="pd__ms-group"
            :class="{ 'is-active': grp.key === selectedStageKey }"
          >
                        <header class="pd__ms-stage-head" :style="{ '--stage-color': journeyColor[grp.key] }">
              <span class="pd__ms-chapter">{{ journeyNo[grp.key] }}</span>
              <div class="pd__ms-stage-meta">
                <div class="pd__ms-stage-title">
                  <span class="pd__ms-stage-dot"></span>
                  <span class="pd__ms-stage-name">{{ grp.label }}阶段</span>
                </div>
                <div class="pd__ms-stage-sub">{{ journeySub[grp.key] }}</div>
                <div v-if="stageRangeOf(grp.items)" class="pd__ms-stage-range">{{ stageRangeOf(grp.items) }}</div>
              </div>
            </header>
                        <div
              v-for="m in grp.items"
              :key="m.id"
              class="pd__ms-item"
              :class="{ 'is-selected': m.id === selectedNodeId }"
              :style="{ '--stage-color': journeyColor[grp.key] }"
            >
              <span class="pd__ms-dot"></span>
              <div class="pd__ms-body" @click="locateByNodeId(m.id)">
                <div class="pd__ms-date">{{ m.date || '待补全' }}</div>
                <div class="pd__ms-title">{{ m.title }}</div>
                <div v-if="m.brief" class="pd__ms-brief">{{ m.brief }}</div>
                <div v-if="m.tags.length" class="pd__ms-tags">
                  <span
                    v-for="t in m.tags"
                    :key="t.id"
                    class="pd__ms-tag"
                    :title="'定位证据：' + t.label"
                    @click.stop="locateByNodeId(t.id)"
                  >{{ t.label }}</span>
                </div>
              </div>
            </div>
          </section>
        </div>
      </aside>
            <div class="pd__detail">
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
                <div v-if="activeNav === 'diagnosis'">
          <div class="pd__group">
            <h3 class="pd__h">病理确诊</h3>
            <div v-if="diagnosisStagePathology.length" class="pd__path-records">
              <div
                v-for="d in diagnosisStagePathology"
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
            <div v-if="pathologySlideResources.length" class="pd__path-res-list">
              <div v-for="r in pathologySlideResources" :key="r.id" class="pd__path-res">
                <div class="pd__path-res-main">
                  <span class="pd__path-res-type">{{ r.type === '基因检测' ? '分子原始报告' : '病理原始切片' }}</span>
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
            <el-empty v-if="!diagnosisStagePathology.length && !pathologySlideResources.length" description="暂无病理确诊记录" :image-size="70" />
          </div>
          <div class="pd__group">
            <h3 class="pd__h">影像评估</h3>
            <div v-if="diagnosisImagingExams.length" class="pd__exam-list">
              <div
                v-for="e in diagnosisImagingExams"
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
            <el-empty v-else description="暂无影像评估记录" :image-size="70" />
          </div>
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
            <div v-if="diagnosisStageClinical.length" class="pd__dx-list pd__dx-list--mt">
              <div
                v-for="d in diagnosisStageClinical"
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
            <el-empty v-else description="暂无临床诊断与分期记录" :image-size="70" />
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
            <div v-if="molecularReportResources.length" class="pd__path-res-list">
              <div v-for="r in molecularReportResources" :key="r.id" class="pd__path-res">
                <div class="pd__path-res-main">
                  <span class="pd__path-res-type">{{ r.type === '基因检测' ? '分子原始报告' : '病理原始切片' }}</span>
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
            <div v-if="!molecularRecords.length && !molecularReportResources.length" class="pd__chain-empty">暂无分子检测</div>
          </div>
          <div class="pd__group">
            <h3 class="pd__h">检验记录</h3>
            <div v-if="currentStageLabs.length" class="pd__lab-list">
              <div v-for="r in currentStageLabs" :key="r.id" class="pd__lab-row">
                <div class="pd__lab-row-main">
                  <span class="pd__lab-panel">{{ r.panel }}</span>
                  <span class="pd__lab-meta">
                    <span class="pd__lab-date">{{ r.date }}</span>
                    <span class="pd__lab-org"><el-icon><Connection /></el-icon>{{ r.org }}</span>
                  </span>
                </div>
                <el-button size="small" type="primary" plain :icon="Document" @click="goLabs(r.stage)">
                  查看检验记录
                </el-button>
              </div>
            </div>
            <el-empty v-else description="暂无检验记录" :image-size="70" />
          </div>
        </div>
                <div v-else-if="activeNav === 'treatment'">
          <div
            v-if="patient.treatments.length || treatmentDecision"
            id="rec-treatment-decision"
            class="pd__group"
            :class="{ 'pd__flash': highlightRef === 'treatment-decision' }"
          >
            <h3 class="pd__h">治疗方案与决策</h3>
            <div class="pd__tx-decision">
              <div class="pd__tx-decision-head">
                <div>
                  <strong>{{ treatmentDecision?.title || treatmentGoal }}</strong>
                  <span>{{ treatmentDecision?.org }} · {{ treatmentDecision?.date }}</span>
                </div>
                <el-tag v-if="treatmentDecision" size="small" effect="light" type="primary">MDT</el-tag>
              </div>
              <div class="pd__tx-detail-grid">
                <div class="pd__tx-detail-item">
                  <span>治疗目的</span>
                  <strong>{{ treatmentGoal }}</strong>
                </div>
                <div class="pd__tx-detail-item">
                  <span>治疗方案</span>
                  <strong>{{ patient.treatments.map((t) => t.line).join(' → ') }}</strong>
                </div>
                <div v-if="treatmentClinicalDiagnosis" class="pd__tx-detail-item">
                  <span>主要决策依据</span>
                  <strong>{{ treatmentClinicalDiagnosis.t }}{{ treatmentClinicalDiagnosis.n }}{{ treatmentClinicalDiagnosis.m }} · {{ treatmentClinicalDiagnosis.basis }}</strong>
                </div>
                <div class="pd__tx-detail-item pd__tx-detail-item--wide">
                  <span>MDT 意见</span>
                  <strong>{{ treatmentDecision?.desc }}</strong>
                </div>
              </div>
            </div>
          </div>
          <div v-if="treatmentPath.length" class="pd__group">
            <h3 class="pd__h">治疗实施</h3>
            <div class="pd__tx-records">
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
                    <span>治疗日期</span>
                    <strong>
                      {{ t.startDate }}
                      <template v-if="t.endDate !== '—' && t.endDate !== t.startDate"> ～ {{ t.endDate }}</template>
                      <template v-else-if="t.endDate === '—'"> ～ 至今</template>
                    </strong>
                  </div>
                  <div v-if="t.efficacy !== '—'" class="pd__tx-detail-item">
                    <span>疗效评估</span>
                    <strong>{{ t.efficacy }}</strong>
                  </div>
                  <div class="pd__tx-detail-item">
                    <span>治疗机构</span>
                    <strong>{{ t.org }}</strong>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div v-if="currentStageExams.length" class="pd__group">
            <h3 class="pd__h">治疗后评估</h3>
            <div class="pd__exam-list">
              <div
                v-for="e in currentStageExams"
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
          </div>
          <div v-if="resectionTreatments.length" class="pd__group">
            <h3 class="pd__h">手术 / 局部治疗结果</h3>
            <div class="pd__tx-records">
              <div
                v-for="t in resectionTreatments"
                :key="t.id"
                class="pd__tx-record"
              >
                <div class="pd__tx-record-head">
                  <div class="pd__tx-record-title">
                    <el-tag size="small" effect="dark" round>{{ t.modality }}</el-tag>
                    <strong>{{ t.name }}</strong>
                  </div>
                  <span class="pd__tx-status">{{ t.displayResult }}</span>
                </div>
                <div class="pd__tx-detail-grid">
                  <div class="pd__tx-detail-item">
                    <span>{{ t.modality === '手术' ? '手术方式' : '治疗术式' }}</span>
                    <strong>{{ t.scheme }}</strong>
                  </div>
                  <div class="pd__tx-detail-item">
                    <span>日期</span>
                    <strong>{{ t.startDate }}</strong>
                  </div>
                  <div class="pd__tx-detail-item">
                    <span>机构</span>
                    <strong>{{ t.org }}</strong>
                  </div>
                  <div class="pd__tx-detail-item">
                    <span>切除情况</span>
                    <strong>{{ t.displayResult }}</strong>
                  </div>
                  <div v-if="t.complication" class="pd__tx-detail-item pd__tx-detail-item--wide">
                    <span>并发症</span>
                    <strong>{{ t.complication }}</strong>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div v-if="treatmentStageDiagnoses.length" class="pd__group">
            <h3 class="pd__h">术后病理</h3>
            <div class="pd__path-records">
              <div
                v-for="d in treatmentStageDiagnoses"
                :key="d.id"
                :id="'rec-' + d.id"
                class="pd__path-record"
                :class="{ 'pd__flash': highlightRef === d.id }"
              >
                <div class="pd__path-record-head">
                  <div>
                    <div class="pd__path-record-title">{{ d.basis.includes('ESD') ? 'ESD 切除标本病理' : '术后病理' }}</div>
                    <div class="pd__path-record-sub">{{ d.org }} · {{ d.date }}</div>
                  </div>
                </div>
                <div class="pd__detail-grid">
                  <div class="pd__detail-item">
                    <span>病理分期</span>
                    <strong>{{ postopSummary(d).tnm }}</strong>
                  </div>
                  <div class="pd__detail-item">
                    <span>淋巴结</span>
                    <strong>{{ postopSummary(d).nodes }}</strong>
                  </div>
                  <div class="pd__detail-item">
                    <span>TRG</span>
                    <strong>{{ postopSummary(d).trg }}</strong>
                  </div>
                  <div class="pd__detail-item">
                    <span>切缘</span>
                    <strong>{{ postopSummary(d).margin }}</strong>
                  </div>
                  <div class="pd__detail-item">
                    <span>组织学类型</span>
                    <strong>{{ d.histology }}</strong>
                  </div>
                  <div class="pd__detail-item">
                    <span>分化程度</span>
                    <strong>{{ d.differentiation }}</strong>
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
                <div v-if="pathologySlideResources.length" class="pd__path-record-foot">
                  <el-button size="small" link type="primary" :icon="Document" @click="openResource(pathologySlideResources[0])">查看切片</el-button>
                </div>
              </div>
            </div>
          </div>
          <div v-if="adjuvantTreatments.length" class="pd__group">
            <h3 class="pd__h">后续治疗</h3>
            <div class="pd__tx-records">
              <div v-for="t in adjuvantTreatments" :key="t.id" class="pd__tx-record">
                <div class="pd__tx-record-head">
                  <div class="pd__tx-record-title">
                    <el-tag size="small" effect="dark" round>{{ t.line }}</el-tag>
                    <strong>{{ t.name }}</strong>
                  </div>
                  <span class="pd__tx-status" :class="{ 'pd__tx-status--doing': t.status === '进行中' }">{{ t.status }}</span>
                </div>
                <div class="pd__tx-detail-grid">
                  <div class="pd__tx-detail-item">
                    <span>治疗方式</span>
                    <strong>{{ t.modality }}</strong>
                  </div>
                  <div class="pd__tx-detail-item">
                    <span>治疗方案</span>
                    <strong>{{ t.scheme }}</strong>
                  </div>
                  <div v-if="t.cycles !== '—'" class="pd__tx-detail-item">
                    <span>治疗周期</span>
                    <strong>{{ t.cycles }}</strong>
                  </div>
                  <div class="pd__tx-detail-item">
                    <span>治疗日期</span>
                    <strong>{{ t.startDate }}<template v-if="t.endDate !== '—' && t.endDate !== t.startDate"> ～ {{ t.endDate }}</template></strong>
                  </div>
                  <div class="pd__tx-detail-item">
                    <span>治疗机构</span>
                    <strong>{{ t.org }}</strong>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
                <div v-else-if="activeNav === 'followup'">
          <div v-if="latestFollowUp" class="pd__group">
            <h3 class="pd__h">当前随访状态</h3>
            <div class="pd__tx-decision">
              <div class="pd__tx-decision-head">
                <div>
                  <strong>{{ latestFollowUp.outcome }}</strong>
                  <span>{{ latestFollowUp.org }} · {{ latestFollowUp.date }}</span>
                </div>
                <el-tag
                  size="small"
                  effect="light"
                  :type="latestFollowUp.outcome === '无病生存' ? 'success' : latestFollowUp.outcome === '死亡' ? 'danger' : 'warning'"
                >
                  {{ latestFollowUp.modality }}
                </el-tag>
              </div>
              <div class="pd__tx-detail-grid">
                <div class="pd__tx-detail-item">
                  <span>最近随访时间</span>
                  <strong>{{ latestFollowUp.date }}</strong>
                </div>
                <div class="pd__tx-detail-item">
                  <span>当前疾病状态</span>
                  <strong>{{ latestFollowUp.outcome }}</strong>
                </div>
                <div class="pd__tx-detail-item">
                  <span>下次随访</span>
                  <strong>{{ nextFollowUp }}</strong>
                </div>
                <div class="pd__tx-detail-item pd__tx-detail-item--wide">
                  <span>最近结论</span>
                  <strong>{{ recentConclusion }}</strong>
                </div>
              </div>
            </div>
          </div>
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
                  <div v-if="f.symptom" class="pd__follow-item pd__follow-item--wide">
                    <span>症状</span>
                    <strong>{{ f.symptom }}</strong>
                  </div>
                  <div v-if="f.weight" class="pd__follow-item">
                    <span>体重</span>
                    <strong>{{ f.weight }}</strong>
                  </div>
                  <div v-if="f.nutrition" class="pd__follow-item">
                    <span>营养</span>
                    <strong>{{ f.nutrition }}</strong>
                  </div>
                  <div v-if="f.general" class="pd__follow-item pd__follow-item--wide">
                    <span>一般情况</span>
                    <strong>{{ f.general }}</strong>
                  </div>
                  <div class="pd__follow-item">
                    <span>随访结局</span>
                    <strong>{{ f.outcome }}</strong>
                  </div>
                  <div class="pd__follow-item">
                    <span>下次随访</span>
                    <strong>{{ f.nextDate }}</strong>
                  </div>
                  <div class="pd__follow-item pd__follow-item--wide">
                    <span>医生结论</span>
                    <strong>{{ f.summary }}</strong>
                  </div>
                </div>
              </div>
            </div>
            <el-empty v-else description="暂无随访记录" :image-size="80" />
          </div>
          <div v-if="currentStageExams.length || efficacyEvaluations.length" class="pd__group">
            <h3 class="pd__h">复查评估</h3>
            <div class="pd__exam-list">
              <div
                v-for="e in currentStageExams"
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
            <div v-if="efficacyEvaluations.length" class="pd__eval-records">
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
            <h3 class="pd__h">复发 / 转移</h3>
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
                    <span>部位与证据</span>
                    <strong>{{ f.summary }}</strong>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div v-if="progressionRecords.length" class="pd__group">
            <h3 class="pd__h">后续处置</h3>
            <div class="pd__tx-records">
              <div v-for="f in progressionRecords" :key="f.id" class="pd__tx-record">
                <div class="pd__tx-record-head">
                  <div class="pd__tx-record-title">
                    <el-tag size="small" effect="dark" round>{{ f.outcome }}</el-tag>
                    <strong>{{ f.date }}</strong>
                  </div>
                  <span class="pd__tx-status">{{ f.org }}</span>
                </div>
                <div class="pd__tx-detail-grid">
                  <div class="pd__tx-detail-item pd__tx-detail-item--wide">
                    <span>处理方案</span>
                    <strong>{{ f.summary }}</strong>
                  </div>
                  <div class="pd__tx-detail-item">
                    <span>复诊安排</span>
                    <strong>{{ f.nextDate }}</strong>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
                <div v-if="currentStageVisits.length && activeNav !== 'diagnosis'" class="pd__group">
          <h3 class="pd__h">就诊记录</h3>
          <div class="pd__visits">
            <div
              v-for="v in currentStageVisits"
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
        </div>
                <div v-if="currentStageExams.length && activeNav === 'screening'" class="pd__group">
          <h3 class="pd__h">检查记录</h3>
          <div class="pd__exam-list">
            <div
              v-for="e in currentStageExams"
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
        </div>
                <div v-if="currentStageLabs.length && activeNav !== 'diagnosis'" class="pd__group">
          <h3 class="pd__h">检验记录</h3>
          <div class="pd__lab-list">
            <div v-for="r in currentStageLabs" :key="r.id" class="pd__lab-row">
              <div class="pd__lab-row-main">
                <span class="pd__lab-panel">{{ r.panel }}</span>
                <span class="pd__lab-meta">
                  <span class="pd__lab-date">{{ r.date }}</span>
                  <span class="pd__lab-org"><el-icon><Connection /></el-icon>{{ r.org }}</span>
                </span>
              </div>
              <el-button size="small" type="primary" plain :icon="Document" @click="goLabs(r.stage)">
                查看检验记录
              </el-button>
            </div>
          </div>
        </div>
                <div v-if="stageEmpty && activeNav !== 'diagnosis'" class="pd__group">
          <el-empty description="该阶段暂无记录" :image-size="70" />
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
.pd {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
}
.pd__hero {
  flex: none;
  padding: 12px 18px;
  background: var(--pf-surface);
  border: 1px solid var(--pf-border);
  border-radius: 10px;
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
  width: 42px;
  height: 42px;
  flex: none;
  border-radius: 10px;
  display: grid;
  place-items: center;
  font-size: 18px;
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
  font-size: 18px;
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
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0;
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid var(--pf-border);
}
.pd__info-item {
  min-width: 0;
  padding: 6px 16px;
  border-left: 1px solid var(--pf-border);
}
.pd__info-item:nth-child(3n + 1) {
  padding-left: 0;
  border-left: none;
}
.pd__info-v--mono {
  font-family: ui-monospace, 'Cascadia Code', Consolas, monospace;
  color: #0e7490;
}
.pd__info-k {
  display: block;
  font-size: 12px;
  color: var(--pf-text-faint);
  margin-bottom: 4px;
}
.pd__info-v {
  display: block;
  font-size: 14px;
  font-weight: 700;
  color: var(--pf-text);
  line-height: 1.4;
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
  border-radius: 8px;
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
.pd__nav-sticky {
  position: sticky;
  top: 0;
  z-index: 30;
  padding: 12px 0 10px;
  background: #fff;
  border-bottom: 1px solid var(--pf-border);
}
.pd__nav {
  display: flex;
  gap: 4px;
  margin: 0;
  padding: 4px;
  background: var(--pf-surface-2);
  border: 1px solid var(--pf-border);
  border-radius: 8px;
  overflow-x: auto;
}
.pd__nav-item {
  flex: 1 1 0;
  border: 1px solid transparent;
  background: transparent;
  color: var(--pf-text-soft);
  font-size: 14px;
  font-weight: 600;
  padding: 8px 14px;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.18s ease;
  white-space: nowrap;
  display: inline-flex;
  align-items: center;
  justify-content: center;
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
  box-shadow: none;
}
.pd__main {
  flex: 1;
  min-height: 0;
  display: grid;
  grid-template-columns: 300px minmax(0, 1fr);
  gap: 16px;
  overflow: hidden;
}
.pd__axis {
  min-height: 0;
  overflow-y: auto;
  background: #fff;
  border: 1px solid var(--pf-border);
  border-radius: 10px;
  padding: 14px 16px;
}
.pd__axis-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 16px;
  flex-wrap: wrap;
}
.pd__ms {
  position: relative;
  padding: 6px 4px 4px;
}
.pd__ms::before {
  content: '';
  position: absolute;
  left: 17px;
  top: 26px;
  bottom: 22px;
  width: 2px;
  background: linear-gradient(180deg, #0ea5e9 0%, #8b5cf6 36%, #f59e0b 68%, #10b981 100%);
  opacity: 0.5;
  border-radius: 2px;
}
.pd__ms-group {
  position: relative;
}
.pd__ms-group + .pd__ms-group {
  margin-top: 18px;
}
.pd__ms-stage-head {
  position: relative;
  display: flex;
  align-items: flex-start;
  padding: 4px 0 14px 50px;
}
.pd__ms-chapter {
  position: absolute;
  left: 3px;
  top: 0;
  width: 30px;
  height: 30px;
  border-radius: 50%;
  background: #fff;
  border: 2px solid var(--stage-color, #94a3b8);
  color: var(--stage-color, #64748b);
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0.02em;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 0 0 5px #fff;
  z-index: 2;
  transition: transform 0.22s ease, box-shadow 0.22s ease;
}
.pd__ms-group.is-active .pd__ms-chapter {
  transform: scale(1.07);
  box-shadow: 0 0 0 5px #fff, 0 0 14px 2px color-mix(in srgb, var(--stage-color, #64748b) 45%, transparent);
}
.pd__ms-stage-meta {
  padding-top: 3px;
}
.pd__ms-stage-title {
  display: flex;
  align-items: center;
  gap: 7px;
}
.pd__ms-stage-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--stage-color, #94a3b8);
  flex: none;
}
.pd__ms-stage-name {
  font-size: 13px;
  font-weight: 700;
  color: var(--pf-text);
  letter-spacing: 0.02em;
}
.pd__ms-stage-sub {
  margin-top: 2px;
  font-size: 11.5px;
  color: var(--pf-text-faint);
  letter-spacing: 0.01em;
}
.pd__ms-stage-range {
  margin-top: 3px;
  font-size: 10.5px;
  color: var(--pf-text-faint);
  font-variant-numeric: tabular-nums;
  letter-spacing: 0.04em;
}
.pd__ms-item {
  position: relative;
  padding: 0 0 18px 50px;
}
.pd__ms-dot {
  position: absolute;
  left: 14px;
  top: 7px;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--stage-color, #94a3b8);
  box-shadow: 0 0 0 3px #fff;
  z-index: 1;
  transition: transform 0.18s ease, box-shadow 0.18s ease;
}
.pd__ms-body {
  position: relative;
  cursor: pointer;
  padding: 2px 8px;
  border: none;
  border-left: 2px solid transparent;
  border-radius: 0;
  background: transparent;
  transition: transform 0.18s ease, background 0.15s ease, border-color 0.15s ease;
}
.pd__ms-item:hover .pd__ms-dot {
  transform: scale(1.25);
}
.pd__ms-item:hover .pd__ms-body {
  transform: translateY(-1px);
  background: rgba(15, 23, 42, 0.025);
}
.pd__ms-item.is-selected .pd__ms-dot {
  transform: scale(1.5);
  box-shadow: 0 0 0 4px #fff, 0 0 12px 1px color-mix(in srgb, var(--stage-color, #64748b) 55%, transparent);
}
.pd__ms-item.is-selected .pd__ms-body {
  background: color-mix(in srgb, var(--stage-color, #64748b) 7%, transparent);
  border-left-color: var(--stage-color, #64748b);
}
.pd__ms-date {
  font-size: 11px;
  font-weight: 500;
  color: var(--pf-text-faint);
  font-variant-numeric: tabular-nums;
  letter-spacing: 0.02em;
  margin-bottom: 1px;
}
.pd__ms-title {
  font-size: 13.5px;
  font-weight: 700;
  color: var(--pf-text);
  line-height: 1.4;
}
.pd__ms-brief {
  margin-top: 2px;
  font-size: 11.5px;
  color: var(--pf-text-faint);
  line-height: 1.45;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.pd__ms-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-top: 5px;
}
.pd__ms-tag {
  font-size: 10px;
  font-weight: 500;
  color: #64748b;
  background: rgba(100, 116, 139, 0.07);
  border: 1px solid rgba(100, 116, 139, 0.12);
  border-radius: 4px;
  padding: 0 6px;
  line-height: 16px;
  cursor: pointer;
  transition: color 0.15s ease, background 0.15s ease, border-color 0.15s ease;
}
.pd__ms-tag:hover {
  color: #0e7490;
  background: rgba(6, 182, 212, 0.1);
  border-color: rgba(6, 182, 212, 0.22);
}
.pd__detail {
  min-width: 0;
  min-height: 0;
  background: #fff;
  border: 1px solid var(--pf-border);
  border-radius: 10px;
  padding: 4px 16px 16px;
  overflow-y: auto;
  overflow-x: hidden;
  isolation: isolate;
  overscroll-behavior: contain;
}
.pd__detail > :not(.pd__nav-sticky) {
  position: relative;
  z-index: 1;
}
.pd__detail [id^='rec-'],
.pd__detail [id^='visit-'] {
  scroll-margin-top: 78px;
}
.pd__group {
  padding-top: 20px;
  margin-bottom: 4px;
  border-top: 1px solid var(--pf-border);
}
.pd__group:first-child {
  padding-top: 6px;
  border-top: none;
}
.pd__group:last-child {
  margin-bottom: 0;
  padding-bottom: 8px;
}
.pd__group--flush {
  padding-bottom: 6px;
}
.pd__h {
  font-size: 15px;
  font-weight: 700;
  margin: 0 0 12px;
  padding-left: 9px;
  border-left: 2px solid #2563eb;
}
.pd__h--inline {
  margin: 0;
  border-left: none;
  padding-left: 0;
}
.pd__sec-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 16px;
  flex-wrap: wrap;
}
.pd__visits {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.pd__visit {
  padding: 15px 16px;
  border: 1px solid var(--pf-border);
  border-radius: 8px;
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
  border-color: rgba(37, 99, 235, 0.35);
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
.pd__tl-card.is-encounter {
  background: var(--pf-surface-2);
  border-color: var(--pf-border);
}
@keyframes pdFlash {
  0% { box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.35); background: rgba(37, 99, 235, 0.08); }
  70% { box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.35); background: rgba(37, 99, 235, 0.08); }
  100% { box-shadow: 0 0 0 0 rgba(37, 99, 235, 0); background: transparent; }
}
.pd__flash {
  animation: pdFlash 2.4s ease-out;
}
.pd__exam-list {
  display: flex;
  flex-direction: column;
  gap: 12px
}
.pd__exam-card {
  border: 1px solid var(--pf-border);
  border-left-width: 3px;
  border-radius: 8px;
  padding: 14px 18px;
  background: var(--pf-surface-2);
  transition: box-shadow 0.18s ease, border-color 0.18s ease;
}
.pd__exam-card:hover {
  border-color: rgba(37, 99, 235, 0.35);
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
.pd__lab-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.pd__lab-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  border: 1px solid var(--pf-border);
  border-left-width: 3px;
  border-left-color: #8b5cf6;
  border-radius: 8px;
  padding: 14px 18px;
  background: var(--pf-surface-2);
  transition: box-shadow 0.18s ease, border-color 0.18s ease;
}
.pd__lab-row:hover {
  border-color: rgba(37, 99, 235, 0.35);
}
.pd__lab-row-main {
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 0;
}
.pd__lab-panel {
  font-size: 14px;
  font-weight: 700;
  color: var(--pf-text);
}
.pd__lab-meta {
  display: inline-flex;
  align-items: center;
  gap: 14px;
  flex-wrap: wrap;
}
.pd__lab-date {
  font-family: ui-monospace, 'Cascadia Code', Consolas, monospace;
  font-size: 13px;
  color: var(--pf-text-soft);
}
.pd__lab-org {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: var(--pf-text-soft);
}
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
  border-radius: 10px;
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
.pd__diagnosis-summary {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 18px;
  align-items: center;
  padding: 15px 16px;
  border: 1px solid var(--pf-border);
  border-radius: 8px;
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
.pd__dx-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.pd__dx-card {
  border: 1px solid var(--pf-border);
  border-left-width: 3px;
  border-radius: 8px;
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
  border-radius: 8px;
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
.pd__path-record-foot {
  margin-top: 10px;
  padding-top: 10px;
  border-top: 1px dashed var(--pf-border);
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
  border-radius: 8px;
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
  border-radius: 8px;
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
  border-radius: 8px;
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
.pd__follow-records,
.pd__eval-records,
.pd__progression-records {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.pd__exam-list + .pd__eval-records {
  margin-top: 12px;
}
.pd__follow-record,
.pd__eval-record,
.pd__progression-record {
  padding: 15px 16px;
  border: 1px solid var(--pf-border);
  border-radius: 8px;
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
@media (max-width: 1180px) {
  .pd__main {
    grid-template-columns: 1fr;
    overflow-y: auto;
  }
  .pd__axis {
    overflow: visible;
    max-height: none;
  }
  .pd__detail {
    overflow: visible;
  }
  .pd__hero-info {
    grid-template-columns: repeat(3, minmax(0, 1fr));
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
  .pd__info-item {
    border-left: none;
    padding: 6px 0;
  }
.pd__chain-arrow {
    display: none;
  }
}
</style>