/* ============================================================
   标准化引擎（可执行）
   仅负责「含义相同但表达不同」的数据统一为标准格式：
     日期格式统一 · 性别/随访等值域映射 · 检验指标单位统一 · 诊断编码标准化 · 标准术语转换
   不含数据质量处理（去空格 / 缺失 / 非法日期 / 异常值 等归「清洗」页）。
   归一逻辑与 standardDataBuilder 严格一致；非法日期（如 20261345）不强行转换，交「清洗」标记。
   ============================================================ */

import { wideRows } from './wideTableBuilder'
import type { ValueChange } from './dataQualityEngine'
import type { SpecKind } from './standardizationSpec'

export type StdStatus = '待执行' | '处理中' | '已完成' | '执行失败'

export interface StandardizeTask {
  id: string
  category: string
  source: string
  target: string
  type: string
  rule: string
  matched: number
  status: StdStatus
  enabled: boolean
  kind: SpecKind
  fields: string[]
}

/* ---------------- 归一函数（与 standardDataBuilder 对齐） ---------------- */
const STD_DATE = /^\d{4}-\d{2}-\d{2}$/

const GENDER_MAP: Record<string, string> = { '1': '男', '2': '女', M: '男', F: '女', m: '男', f: '女' }
const VITAL_MAP: Record<string, string> = { '1': '生存', '0': '死亡', '2': '死亡' }
const RECUR_MAP: Record<string, string> = { '0': '无', '1': '有' }

/** 合法日历日校验（与 dataQualityEngine / standardDataBuilder 共用口径，避免把 20261345 误判为可标准化） */
function validDate(y: number, mo: number, d: number): boolean {
  if (mo < 1 || mo > 12) return false
  const dim = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]
  if (mo === 2 && ((y % 4 === 0 && y % 100 !== 0) || y % 400 === 0)) dim[1] = 29
  return d >= 1 && d <= dim[mo - 1]
}

function dateStd(v: string): string | null {
  const s = v.trim()
  if (STD_DATE.test(s)) return null
  let m: RegExpMatchArray | null
  if ((m = s.match(/^(\d{4})(\d{2})(\d{2})$/))) {
    const y = +m[1], mo = +m[2], d = +m[3]
    if (!validDate(y, mo, d)) return null
    return `${m[1]}-${m[2]}-${m[3]}`
  }
  if ((m = s.match(/^(\d{4})\/(\d{1,2})\/(\d{1,2})$/))) {
    const y = +m[1], mo = +m[2], d = +m[3]
    if (!validDate(y, mo, d)) return null
    return `${m[1]}-${String(mo).padStart(2, '0')}-${String(d).padStart(2, '0')}`
  }
  return null
}
function genderStd(v: string): string | null {
  const s = v.trim()
  if (s === '男' || s === '女') return null
  return GENDER_MAP[s] ?? null
}
function vitalStd(v: string): string | null {
  const s = v.trim()
  if (s === '生存' || s === '死亡') return null
  return VITAL_MAP[s] ?? null
}
function recurStd(v: string): string | null {
  const s = v.trim()
  if (s === '无' || s === '有') return null
  return RECUR_MAP[s] ?? null
}
function unitStd(v: unknown): string | null {
  if (typeof v !== 'string') return null
  // 单位段不得以小数点开头，避免把纯小数（如 "4.3"）的小数部分误判为单位
  const m = v.trim().match(/^(-?\d+(?:\.\d+)?)\s*([^\s\d.].*)$/)
  return m ? m[1] : null
}
function codeStd(v: string): string | null {
  const s = v.trim()
  if (s === s.toUpperCase()) return null
  return s.toUpperCase()
}

/** 标准术语转换：同义诊断名称 → 标准术语 */
const TERM_MAP: Record<string, string> = { '食道恶性肿瘤': '食管恶性肿瘤' }
function termStd(v: string): string | null {
  const s = v.trim()
  return TERM_MAP[s] ?? null
}

type DetectFn = (raw: string) => string | null

interface TaskDef {
  id: string
  kind: SpecKind
  category: string
  source: string
  target: string
  type: string
  rule: string
  fields: string[]
  detect: DetectFn
}

const TASK_DEFS: TaskDef[] = [
  { id: 'std-date', kind: '时间格式', category: '患者基本信息', source: 'HIS', target: 'birth_date', type: '日期格式统一', rule: 'YYYYMMDD / YYYY/MM/DD → YYYY-MM-DD', fields: ['birth_date'], detect: dateStd },
  { id: 'std-unit', kind: '指标单位', category: '检验数据', source: 'LIS', target: '肿瘤标志物浓度', type: '单位统一', rule: '「数值+单位」文本 → 数值（单位统一 ng/mL）', fields: ['cea', 'scc', 'ca199', 'cyfra211', 'afp'], detect: unitStd },
  { id: 'std-gender', kind: '值域映射', category: '患者基本信息', source: 'HIS', target: 'gender', type: '性别值域映射', rule: '1/2/M/F → 男/女', fields: ['gender'], detect: genderStd },
  { id: 'std-vital', kind: '值域映射', category: '随访信息', source: '随访库', target: 'vital_status', type: '生存状态值域映射', rule: '0/1/2 → 生存/死亡', fields: ['vital_status'], detect: vitalStd },
  { id: 'std-recur', kind: '值域映射', category: '随访信息', source: '随访库', target: 'recurrence', type: '复发值域映射', rule: '0/1 → 无/有', fields: ['recurrence'], detect: recurStd },
  { id: 'std-code', kind: '编码体系', category: '诊断信息', source: 'HIS', target: 'diagnosis_code', type: '诊断编码归一', rule: '小写院内码 → ICD-10（大写）', fields: ['diagnosis_code'], detect: codeStd },
  { id: 'std-term', kind: '标准术语', category: '诊断信息', source: 'HIS', target: 'diagnosis_name', type: '标准术语转换', rule: '同义诊断名称 → 标准术语（食道恶性肿瘤 → 食管恶性肿瘤）', fields: ['diagnosis_name'], detect: termStd },
]

/** 单字段待标准化变更（原始 → 标准） */
interface FieldChange {
  index: number
  raw: string
  std: string
}

function fieldChanges(field: string, detect: DetectFn): FieldChange[] {
  const out: FieldChange[] = []
  wideRows.forEach((r, i) => {
    const raw = String((r as unknown as Record<string, unknown>)[field] ?? '')
    const std = detect(raw)
    if (std !== null) out.push({ index: i, raw, std })
  })
  return out
}

export function buildStandardizeTasks(): StandardizeTask[] {
  return TASK_DEFS.map((d) => {
    const matched = d.fields.reduce((n, f) => n + fieldChanges(f, d.detect).length, 0)
    return {
      id: d.id,
      category: d.category,
      source: d.source,
      target: d.target,
      type: d.type,
      rule: d.rule,
      matched,
      status: '待执行' as StdStatus,
      enabled: true,
      kind: d.kind,
      fields: d.fields,
    }
  })
}

/** 预览：每个待标准化字段的 原始 → 标准 */
export function previewStandardize(task: StandardizeTask): ValueChange[] {
  const def = TASK_DEFS.find((d) => d.id === task.id)
  if (!def) return []
  const rows: ValueChange[] = []
  for (const f of def.fields) {
    for (const ch of fieldChanges(f, def.detect)) {
      const pid = String((wideRows[ch.index] as unknown as Record<string, unknown>).patient_id ?? `#${ch.index + 1}`)
      rows.push({ recId: pid, field: f, before: ch.raw, after: ch.std })
    }
  }
  return rows
}

export function executeStandardize(task: StandardizeTask): { affected: number } {
  const def = TASK_DEFS.find((d) => d.id === task.id)
  if (!def) return { affected: 0 }
  const affected = def.fields.reduce((n, f) => n + fieldChanges(f, def.detect).length, 0)
  return { affected }
}
