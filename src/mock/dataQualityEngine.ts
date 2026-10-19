/* ============================================================
   数据质量处理引擎
   把「数据质量」从统计面板升级为可实际执行的治理页面：
   [清洗] [去重] [脱敏] 三类处理任务，统一流程
   检测 → 预览影响 → 执行 → 查看结果

   本引擎直接消费「原始数据表格」(wideRows) 作为原始输入，
   与「多源数据抽取与原始数据表格构建」工作台形成端到端管线：
   原始数据（脏 / 重复 / 未脱敏）→ 标准化 + 清洗 → 去重 → 脱敏 → 标准数据。
   ============================================================ */

import { wideRows, wideFieldOrder, wideSources, type WideRow, type WideSourceKey } from './wideTableBuilder'

/* ---------------- 字段 → 数据源系统（数据质量任务标注「来源」用） ---------------- */
const FIELD_SOURCE: Record<string, WideSourceKey> = {}
wideSources.forEach((s) => s.fields.forEach((f) => { FIELD_SOURCE[f.name] = s.key }))
const SOURCE_LABEL: Record<WideSourceKey, string> = { HIS: 'HIS', LIS: 'LIS', FU: '随访库' }
function fieldSourceLabel(field: string): string {
  const k = FIELD_SOURCE[field]
  return k ? SOURCE_LABEL[k] : '—'
}

/* ---------------- 通用 ---------------- */

export type DQStatus = '待执行' | '处理中' | '已完成' | '执行失败'

export interface DQTask {
  id: string
  /** 数据分类 */
  category: string
  /** 来源系统（HIS / LIS / 随访库），标注该任务作用于源数据的哪个系统 */
  source: string
  /** 字段 / 数据对象 */
  target: string
  /** 处理类型 */
  type: string
  /** 处理规则摘要 */
  rule: string
  /** 命中记录数 */
  matched: number
  status: DQStatus
  enabled: boolean
}

export interface ValueChange {
  recId: string
  field: string
  before: string
  after: string
}

export interface ExecuteResult {
  affected: number
  changes: ValueChange[]
}

/* ---------------- 一、清洗：仅处理「数据质量问题」，不重复标准化的值映射 / 单位剥离 ----------------
   职责边界（与「标准化」互斥，消除功能重复）：
     · 本页只做：去空格/无效字符 · 缺失检测 · 非法日期识别 · 错误数据类型修复 · 异常值标记 · 重复记录识别(转去重)
     · 值映射(性别/生存/复发) · 单位剥离 · 编码大写 · 日期格式化 · 术语转换 一律归「标准化」页
   对无法自动修复的问题（缺失 / 非法日期 / 异常值）仅标记「待处理」，不强行转换或填充。 */

export type CleanseKind =
  | 'trim' | 'missing' | 'illegalDate' | 'wrongType' | 'anomaly' | 'duplicate'

export interface CleanseTask extends DQTask {
  kind: CleanseKind
  /** 作用字段（trim / missing 可覆盖多字段，其余为单字段语义） */
  fields: string[]
}

const TRIM_FIELDS = ['patient_name', 'age', 'diagnosis_name']
const MISSING_FIELDS = [
  'diagnosis_name', 'diagnosis_code', 'vital_status', 'recurrence',
  'followup_days', 'survival_days', 'cea', 'scc', 'ca199', 'cyfra211', 'afp',
]

function isBlank(v: unknown): boolean {
  return v === null || v === undefined || (typeof v === 'string' && v.trim() === '')
}

/** 合法日历日校验（与 standardizationEngine / standardDataBuilder 共用口径，避免把 20261345 误判为可标准化） */
function validDate(y: number, mo: number, d: number): boolean {
  if (mo < 1 || mo > 12) return false
  const dim = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]
  if (mo === 2 && ((y % 4 === 0 && y % 100 !== 0) || y % 400 === 0)) dim[1] = 29
  return d >= 1 && d <= dim[mo - 1]
}

/** 非法日期：形如日期但月/日越界，无法解析为合法日历日 */
function illegalDate(v: unknown): boolean {
  if (typeof v !== 'string') return false
  const s = v.trim()
  let m: RegExpMatchArray | null
  if ((m = s.match(/^(\d{4})(\d{2})(\d{2})$/))) return !validDate(+m[1], +m[2], +m[3])
  if ((m = s.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})$/))) return !validDate(+m[1], +m[2], +m[3])
  return false
}

/** 错误数据类型（年龄）：以含单位/小数等非整数字符串存储 → 可自动修复为整数 */
function repairAge(v: unknown): string | null {
  if (typeof v !== 'string') return null
  const t = v.trim()
  if (/^\d+$/.test(t)) return null
  const digits = t.replace(/[^\d.]/g, '')
  if (digits === '') return null
  const intPart = digits.split('.')[0]
  return intPart !== t.replace(/[^\d]/g, '') ? intPart : null
}

/** 异常值（年龄）：数值超出合理区间（<0 或 >120），仅标记不修复 */
function anomalyAge(v: unknown): boolean {
  const n = typeof v === 'number'
    ? v
    : (typeof v === 'string' && /^\d+$/.test(v.trim()) ? Number(v.trim()) : NaN)
  return Number.isFinite(n) && (n > 120 || n < 0)
}

const FLAG_MISSING = '⚠ 缺失·待处理'
const FLAG_ILLEGAL = '⚠ 非法日期·待处理'
const FLAG_ANOMALY = '⚠ 异常值·待处理'
const HANDOFF_DEDUP = '转「去重」处理'

/** 单任务影响清单（before → after） */
function cleanseChanges(task: CleanseTask): ValueChange[] {
  const out: ValueChange[] = []
  const push = (recId: string, field: string, before: string, after: string) =>
    out.push({ recId, field, before, after })
  switch (task.kind) {
    case 'trim':
      for (const r of wideRows) {
        for (const f of task.fields) {
          const raw = (r as unknown as Record<string, unknown>)[f]
          if (typeof raw === 'string' && raw.trim() !== raw) push(r.patient_id, f, raw, raw.trim())
        }
      }
      break
    case 'missing':
      for (const r of wideRows) {
        for (const f of task.fields) {
          const raw = (r as unknown as Record<string, unknown>)[f]
          if (isBlank(raw)) push(r.patient_id, f, '(空)', FLAG_MISSING)
        }
      }
      break
    case 'illegalDate':
      for (const r of wideRows) {
        if (illegalDate(r.birth_date)) push(r.patient_id, 'birth_date', String(r.birth_date), FLAG_ILLEGAL)
      }
      break
    case 'wrongType':
      for (const r of wideRows) {
        const fix = repairAge(r.age)
        if (fix !== null) push(r.patient_id, 'age', String(r.age), fix)
      }
      break
    case 'anomaly':
      for (const r of wideRows) {
        if (anomalyAge(r.age)) push(r.patient_id, 'age', String(r.age), FLAG_ANOMALY)
      }
      break
    case 'duplicate': {
      const probe: DedupTask = {
        id: '_probe', category: '', source: '', target: 'patient_id', type: '', rule: '',
        matched: 0, status: '待执行', enabled: true, keys: ['patient_id'], handle: '保留第一条',
      }
      for (const g of analyzeDedup(probe).groups.filter((x) => x.dup)) {
        push(g.key, 'patient_id', `${g.recs.length} 条重复`, HANDOFF_DEDUP)
      }
      break
    }
  }
  return out
}

const CLEANSE_DEFS: {
  id: string
  kind: CleanseKind
  category: string
  target: string
  type: string
  rule: string
  fields: string[]
}[] = [
  { id: 'cl-trim', kind: 'trim', category: '患者基本信息', target: 'patient_name / age / diagnosis_name', type: '首尾空格与无效字符清理', rule: '去除姓名、年龄、诊断名称首尾空格', fields: TRIM_FIELDS },
  { id: 'cl-missing', kind: 'missing', category: '综合', target: '关键字段', type: '缺失值检测', rule: '关键字段空值检测，标记为待处理', fields: MISSING_FIELDS },
  { id: 'cl-illegal', kind: 'illegalDate', category: '患者基本信息', target: 'birth_date', type: '非法日期识别', rule: '月份/日越界的非法日期，不强行转换', fields: ['birth_date'] },
  { id: 'cl-type', kind: 'wrongType', category: '患者基本信息', target: 'age', type: '错误数据类型修复', rule: '年龄含单位/小数等非整数字符串 → 整数', fields: ['age'] },
  { id: 'cl-anomaly', kind: 'anomaly', category: '患者基本信息', target: 'age', type: '异常值识别', rule: '年龄超出合理区间（<0 或 >120），标记待处理', fields: ['age'] },
  { id: 'cl-dup', kind: 'duplicate', category: '原始数据表格', target: 'patient_id', type: '重复记录识别', rule: '识别疑似重复记录，转「去重」处理（不在本页删除）', fields: ['patient_id'] },
]

export function buildCleanseTasks(): CleanseTask[] {
  return CLEANSE_DEFS.map((d) => {
    const task: CleanseTask = {
      ...d,
      source: fieldSourceLabel(d.fields[0]),
      matched: 0,
      status: '待执行',
      enabled: true,
    }
    task.matched = cleanseChanges(task).length
    return task
  })
}

export function previewCleanse(task: CleanseTask): ValueChange[] {
  return cleanseChanges(task)
}

export function executeCleanse(task: CleanseTask): ExecuteResult {
  const changes = cleanseChanges(task)
  return { affected: changes.length, changes }
}

/* ---------------- 二、去重：按 patient_id 关联键 ---------------- */

export type DedupHandle = '保留第一条' | '保留最新一条' | '合并记录' | '人工处理'

export interface DedupTask extends DQTask {
  keys: string[]
  handle: DedupHandle
}

/** 按去重键分组，返回重复组与重复记录数 */
export function analyzeDedup(task: DedupTask): { groups: { key: string; recs: WideRow[]; dup: boolean }[]; dupCount: number } {
  const map = new Map<string, WideRow[]>()
  for (const r of wideRows) {
    const k = task.keys.map((kk) => String((r as unknown as Record<string, unknown>)[kk] ?? '')).join('|')
    if (!map.has(k)) map.set(k, [])
    map.get(k)!.push(r)
  }
  const groups = [...map.entries()].map(([key, recs]) => ({ key, recs, dup: recs.length > 1 }))
  const dupCount = groups.filter((g) => g.dup).reduce((n, g) => n + g.recs.length - 1, 0)
  return { groups, dupCount }
}

export function buildDedupTasks(): DedupTask[] {
  const defs = [
    { id: 'dd-pid', category: '原始数据表格', keys: ['patient_id'], type: '按主键去重', handle: '保留最新一条' as DedupHandle },
    { id: 'dd-full', category: '原始数据表格', keys: [...wideFieldOrder], type: '全字段完全一致去重', handle: '保留第一条' as DedupHandle },
  ]
  return defs.map((d) => {
    const task: DedupTask = {
      id: d.id,
      category: d.category,
      source: d.id === 'dd-pid' ? 'HIS' : '多源',
      target: d.keys.join(' + '),
      type: d.type,
      rule: `去重键：${d.keys.join(' + ')}`,
      matched: 0,
      status: '待执行',
      enabled: true,
      keys: d.keys,
      handle: d.handle,
    }
    task.matched = analyzeDedup(task).dupCount
    return task
  })
}

export function previewDedup(task: DedupTask): { groups: { key: string; recs: WideRow[]; dup: boolean }[] } {
  return { groups: analyzeDedup(task).groups }
}

export function executeDedup(task: DedupTask): ExecuteResult {
  const { groups } = analyzeDedup(task)
  const changes: ValueChange[] = []
  if (task.handle === '人工处理') return { affected: 0, changes: [] }
  groups.filter((g) => g.dup).forEach((g) => {
    changes.push({
      recId: g.key,
      field: task.keys.join('+'),
      before: `${g.recs.length} 条`,
      after: `保留 1 条（${task.handle}）`,
    })
  })
  return { affected: changes.length, changes }
}

/* ---------------- 三、脱敏：患者敏感信息（宽表 patient_name / patient_id） ---------------- */

export type MaskKind = 'name' | 'pseudo'

export interface MaskTask extends DQTask {
  kind: MaskKind
  field: string
}

function maskValue(kind: MaskKind, v: string): string {
  switch (kind) {
    case 'name':
      return v.length <= 1 ? v : v[0] + '*'.repeat(v.length - 1)
    case 'pseudo': {
      let h = 0
      for (let i = 0; i < v.length; i++) h = (h * 31 + v.charCodeAt(i)) >>> 0
      return `ANON-${(h % 0xffffffff).toString(36).toUpperCase().padStart(7, '0')}`
    }
  }
}

const MASK_DEFS: { id: string; type: string; rule: string; kind: MaskKind; field: string; category: string }[] = [
  { id: 'mk-name', type: '姓名脱敏', rule: '保留首字符，其余替换为 *（王大明 → 王**）', kind: 'name', field: 'patient_name', category: '患者基本信息' },
  { id: 'mk-pseudo', type: '患者编号伪匿名化', rule: '不可逆哈希替换为匿名编号', kind: 'pseudo', field: 'patient_id', category: '患者基本信息' },
]

export function buildMaskTasks(): MaskTask[] {
  return MASK_DEFS.map((d) => ({
    ...d,
    target: d.field,
    source: fieldSourceLabel(d.field),
    matched: wideRows.length,
    status: '待执行',
    enabled: true,
  }))
}

export function previewMask(task: MaskTask): ValueChange[] {
  return wideRows.map((r) => {
    const val = String((r as unknown as Record<string, unknown>)[task.field] ?? '')
    return {
      recId: r.patient_id,
      field: task.field,
      before: val,
      after: maskValue(task.kind, val),
    }
  })
}

export function executeMask(task: MaskTask): ExecuteResult {
  const changes = previewMask(task)
  return { affected: changes.length, changes }
}
