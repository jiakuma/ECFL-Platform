/* ============================================================
   科研队列字段字典与筛选引擎
   字段全部派生自 patientList / patientDetails 的真实字段，
   enum 取值与数值范围在运行时从数据计算，不虚构任何字段或取值。
   队列保存筛选规则，患者名单由规则实时计算得出。
   ============================================================ */

import { patientList, patientDetails, type PatientDetail, type PatientRow } from './patients'

/** 字段分组 */
export type FieldGroup = '基线' | '诊断' | '检验' | '治疗' | '随访'

/** 字段类型：枚举（取值来自数据） / 数值 */
export type FieldKind = 'enum' | 'number'

export interface CohortFieldDef {
  key: string
  label: string
  group: FieldGroup
  kind: FieldKind
  unit?: string
  /** 取患者在该字段上的全部取值（一条记录多值时返回多项） */
  values: (p: PatientRow, d?: PatientDetail) => (string | number)[]
}

/* ---------- 字段字典 ---------- */

/** 检验报告项 → 字段（取最近一次检验的数值） */
const LAB_FIELDS: { name: string; label: string; group: FieldGroup; unit: string }[] = [
  { name: '鳞状细胞癌抗原 SCC', label: '鳞状细胞癌抗原 SCC', group: '检验', unit: 'ng/mL' },
  { name: '癌胚抗原 CEA', label: '癌胚抗原 CEA', group: '检验', unit: 'ng/mL' },
  { name: '细胞角蛋白19片段 CYFRA21-1', label: '细胞角蛋白19片段 CYFRA21-1', group: '检验', unit: 'ng/mL' },
  { name: '血红蛋白 HGB', label: '血红蛋白 HGB', group: '检验', unit: 'g/L' },
  { name: '白细胞计数 WBC', label: '白细胞计数 WBC', group: '检验', unit: '×10⁹/L' },
  { name: '血小板计数 PLT', label: '血小板计数 PLT', group: '检验', unit: '×10⁹/L' },
  { name: '谷丙转氨酶 ALT', label: '谷丙转氨酶 ALT', group: '检验', unit: 'U/L' },
  { name: '谷草转氨酶 AST', label: '谷草转氨酶 AST', group: '检验', unit: 'U/L' },
  { name: '白蛋白 ALB', label: '白蛋白 ALB', group: '检验', unit: 'g/L' },
  { name: '总胆红素 TBIL', label: '总胆红素 TBIL', group: '检验', unit: 'μmol/L' },
  { name: '肌酐 Crea', label: '肌酐 Crea', group: '检验', unit: 'μmol/L' },
  { name: '尿素 BUN', label: '尿素 BUN', group: '检验', unit: 'mmol/L' },
  { name: '凝血酶原时间 PT', label: '凝血酶原时间 PT', group: '检验', unit: 's' },
  { name: '活化部分凝血活酶时间 APTT', label: '活化部分凝血活酶时间 APTT', group: '检验', unit: 's' },
  { name: '国际标准化比值 INR', label: '国际标准化比值 INR', group: '检验', unit: '' },
  { name: '前白蛋白 PA', label: '前白蛋白 PA', group: '检验', unit: 'mg/L' },
  { name: '转铁蛋白 TRF', label: '转铁蛋白 TRF', group: '检验', unit: 'g/L' },
  { name: 'C反应蛋白 CRP', label: 'C反应蛋白 CRP', group: '检验', unit: 'mg/L' },
]

/** 最近一次检验报告中的指标数值 */
function latestLabValue(d: PatientDetail | undefined, name: string): number | null {
  if (!d) return null
  const hits: { date: string; v: number }[] = []
  for (const r of d.labReports) {
    for (const it of r.items) {
      if (it.name !== name) continue
      const n = Number(it.value)
      if (Number.isFinite(n)) hits.push({ date: r.date, v: n })
    }
  }
  if (!hits.length) return null
  hits.sort((a, b) => (a.date < b.date ? 1 : -1))
  return hits[0].v
}

const row = (fn: (p: PatientRow) => (string | number)[]) => fn
const detail = (fn: (d: PatientDetail) => (string | number)[]) => (p: PatientRow, d?: PatientDetail) =>
  d ? fn(d) : []

export const cohortFields: CohortFieldDef[] = [
  // 基线
  { key: 'age', label: '年龄', group: '基线', kind: 'number', unit: '岁', values: row((p) => [p.age]) },
  { key: 'gender', label: '性别', group: '基线', kind: 'enum', values: row((p) => [p.gender]) },
  { key: 'followup_count', label: '随访次数', group: '基线', kind: 'number', unit: '次', values: row((p) => [p.followUps]) },
  // 诊断
  { key: 'diagnosis', label: '诊断', group: '诊断', kind: 'enum', values: row((p) => [p.diagnosis]) },
  { key: 'stage', label: 'AJCC 分期', group: '诊断', kind: 'enum', values: row((p) => [p.stage]) },
  { key: 'site', label: '原发部位', group: '诊断', kind: 'enum', values: row((p) => [p.site]) },
  {
    key: 'histology',
    label: '病理组织学',
    group: '诊断',
    kind: 'enum',
    values: detail((d) => d.diagnoses.map((x) => x.histology)),
  },
  {
    key: 't_stage',
    label: 'T 分期',
    group: '诊断',
    kind: 'enum',
    values: detail((d) => d.diagnoses.map((x) => x.t).filter((v) => v && v !== '—')),
  },
  {
    key: 'n_stage',
    label: 'N 分期',
    group: '诊断',
    kind: 'enum',
    values: detail((d) => d.diagnoses.map((x) => x.n).filter((v) => v && v !== '—')),
  },
  // 检验
  ...LAB_FIELDS.map<CohortFieldDef>((f) => ({
    key: `lab:${f.name}`,
    label: f.label,
    group: f.group,
    kind: 'number',
    unit: f.unit,
    values: (p, d) => {
      const v = latestLabValue(d, f.name)
      return v === null ? [] : [v]
    },
  })),
  // 治疗
  {
    key: 'treatment_modality',
    label: '治疗方式',
    group: '治疗',
    kind: 'enum',
    values: detail((d) => d.treatments.map((t) => t.modality)),
  },
  {
    key: 'treatment_line',
    label: '治疗线别',
    group: '治疗',
    kind: 'enum',
    values: detail((d) => d.treatments.map((t) => t.line)),
  },
  {
    key: 'treatment_status',
    label: '治疗状态',
    group: '治疗',
    kind: 'enum',
    values: detail((d) => d.treatments.map((t) => t.status)),
  },
  {
    key: 'treatment_efficacy',
    label: '疗效评价',
    group: '治疗',
    kind: 'enum',
    values: detail((d) => d.treatments.map((t) => t.efficacy).filter((v) => v && v !== '—')),
  },
  // 随访
  { key: 'followup_status', label: '随访状态', group: '随访', kind: 'enum', values: row((p) => [p.status]) },
  {
    key: 'followup_outcome',
    label: '随访结局',
    group: '随访',
    kind: 'enum',
    values: detail((d) => d.followUps.map((f) => f.outcome)),
  },
  {
    key: 'followup_modality',
    label: '随访方式',
    group: '随访',
    kind: 'enum',
    values: detail((d) => d.followUps.map((f) => f.modality)),
  },
]

const FIELD_MAP = new Map(cohortFields.map((f) => [f.key, f]))
export function fieldDef(key: string): CohortFieldDef | undefined {
  return FIELD_MAP.get(key)
}

/** 数据中出现过的字段（enum 无取值 / 数值无观测的字段不进选择器） */
const observed = new Map<string, { options: string[]; min: number; max: number }>()
function observe(key: string) {
  if (observed.has(key)) return observed.get(key)!
  const f = FIELD_MAP.get(key)!
  const set = new Set<string>()
  let min = Infinity
  let max = -Infinity
  for (const p of patientList) {
    for (const v of f.values(p, patientDetails[p.id])) {
      if (typeof v === 'number') {
        if (Number.isFinite(v)) {
          min = Math.min(min, v)
          max = Math.max(max, v)
        }
      } else if (v !== '') set.add(v)
    }
  }
  const rec = { options: [...set].sort(), min, max }
  observed.set(key, rec)
  return rec
}

/** 可选字段（保证选择器里每一项都真实有数据） */
export const availableFields: CohortFieldDef[] = cohortFields.filter((f) => {
  const o = observe(f.key)
  return f.kind === 'number' ? Number.isFinite(o.min) : o.options.length > 0
})

/** enum 字段的取值（来自数据） */
export function fieldOptions(key: string): string[] {
  return observe(key).options
}

/** 数值字段的观测范围 */
export function fieldRange(key: string): { min: number; max: number } | null {
  const o = observe(key)
  return Number.isFinite(o.min) ? { min: o.min, max: o.max } : null
}

/** 字段展示名（带单位） */
export function fieldLabel(key: string): string {
  const f = FIELD_MAP.get(key)
  if (!f) return key
  return f.unit ? `${f.label}（${f.unit}）` : f.label
}

/* ---------- 比较符 ---------- */

export const ENUM_OPS = [
  { value: 'eq', label: '等于', multi: false },
  { value: 'ne', label: '不等于', multi: false },
  { value: 'contains', label: '包含', multi: false },
  { value: 'in', label: '属于', multi: true },
  { value: 'not_in', label: '不属于', multi: true },
] as const

export const NUMBER_OPS = [
  { value: 'gt', label: '大于' },
  { value: 'gte', label: '大于等于' },
  { value: 'lt', label: '小于' },
  { value: 'lte', label: '小于等于' },
  { value: 'eq', label: '等于' },
  { value: 'between', label: '介于' },
] as const

export type EnumOp = (typeof ENUM_OPS)[number]['value']
export type NumberOp = (typeof NUMBER_OPS)[number]['value']

/* ---------- 条件 ---------- */

export type LogicOp = 'AND' | 'OR'

export interface CohortCondition {
  id: string
  field: string
  op: string
  /** 单值 / 多值数组 / 数值区间 [from, to] */
  value: string | string[] | [number, number] | number
  /** 与上一条条件的逻辑关系；首条无效 */
  logic: LogicOp
}

let seq = 0
export function newCondition(field = 'diagnosis'): CohortCondition {
  seq += 1
  return { id: `c-${Date.now()}-${seq}`, field, op: 'eq', value: '', logic: 'AND' }
}

/* ---------- 求值 ---------- */

function matchOne(v: string | number, op: string, value: CohortCondition['value']): boolean {
  if (op === 'eq') return String(v) === String(value)
  if (op === 'ne') return String(v) !== String(value)
  if (op === 'contains') return String(v).includes(String(value ?? ''))
  const list: (string | number)[] = Array.isArray(value) ? value : [value as string | number]
  if (op === 'in') return list.includes(String(v))
  if (op === 'not_in') return !list.includes(String(v))

  const n = typeof v === 'number' ? v : Number(v)
  if (!Number.isFinite(n)) return false
  if (op === 'gt') return n > Number(list[0])
  if (op === 'gte') return n >= Number(list[0])
  if (op === 'lt') return n < Number(list[0])
  if (op === 'lte') return n <= Number(list[0])
  if (op === 'between') {
    const from = Number(list[0])
    const to = Number(list[1])
    if (!Number.isFinite(from) || !Number.isFinite(to)) return false
    return n >= from && n <= to
  }
  return false
}

/** 单条条件是否命中某患者（多值记录任一命中即算命中） */
export function matchCondition(c: CohortCondition, p: PatientRow, d?: PatientDetail): boolean {
  const f = fieldDef(c.field)
  if (!f) return false
  const vals = f.values(p, d)
  if (!vals.length) return false
  return vals.some((v) => matchOne(v, c.op, c.value))
}

/** 条件组求值（AND / OR 链） */
export function matchGroup(conds: CohortCondition[], p: PatientRow, d?: PatientDetail): boolean {
  if (!conds.length) return true
  let result = matchCondition(conds[0], p, d)
  for (let i = 1; i < conds.length; i++) {
    const hit = matchCondition(conds[i], p, d)
    result = conds[i].logic === 'AND' ? result && hit : result || hit
  }
  return result
}

/* ---------- 数据可见级别（授权范围） ---------- */

/** 授权范围内：可见脱敏后的诊疗明细 */
export const VISIBLE_LEVELS: PatientRow['level'][] = ['full', 'masked']
/** 摘要级：仅计入机构汇总，不展示原始患者信息 */
export const SUMMARY_LEVELS: PatientRow['level'][] = ['summary']

export interface OrgHit {
  org: string
  count: number
}

export interface ConditionHit {
  id: string
  label: string
  hits: number
}

export interface CohortPreview {
  /** 符合条件的患者总数 */
  total: number
  /** 各机构本地执行结果（仅回传计数） */
  byOrg: OrgHit[]
  /** 授权范围内可见的脱敏明细 */
  visible: PatientRow[]
  /** 仅摘要级授权、只计入汇总的数量 */
  summaryOnly: number
  /** 各筛选条件独立命中数 */
  conditionHits: ConditionHit[]
}

/** 全部机构（联邦执行节点） */
export const cohortOrgs: string[] = [...new Set(patientList.map((p) => p.org))].sort()

/** 执行队列：返回总数、各机构分布、各条件命中数与授权范围内明细 */
export function runCohort(includes: CohortCondition[], excludes: CohortCondition[]): CohortPreview {
  const byOrg = new Map<string, number>(cohortOrgs.map((o) => [o, 0]))
  const visible: PatientRow[] = []
  let summaryOnly = 0

  for (const p of patientList) {
    const d = patientDetails[p.id]
    if (!matchGroup(includes, p, d)) continue
    if (excludes.length && matchGroup(excludes, p, d)) continue
    byOrg.set(p.org, (byOrg.get(p.org) ?? 0) + 1)
    if (VISIBLE_LEVELS.includes(p.level)) visible.push(p)
    else summaryOnly += 1
  }

  const conditionHits: ConditionHit[] = []
  const collect = (conds: CohortCondition[]) => {
    for (const c of conds) {
      const f = fieldDef(c.field)
      if (!f) continue
      let hits = 0
      for (const p of patientList) {
        if (matchCondition(c, p, patientDetails[p.id])) hits += 1
      }
      conditionHits.push({ id: c.id, label: conditionText(c), hits })
    }
  }
  collect(includes)
  collect(excludes)

  return {
    total: [...byOrg.values()].reduce((a, b) => a + b, 0),
    byOrg: [...byOrg].map(([org, count]) => ({ org, count })),
    visible,
    summaryOnly,
    conditionHits,
  }
}

/* ---------- 条件摘要文本 ---------- */

export function conditionText(c: CohortCondition): string {
  const f = fieldDef(c.field)
  const name = f ? f.label : c.field
  const opLabel =
    ENUM_OPS.find((o) => o.value === c.op)?.label ?? NUMBER_OPS.find((o) => o.value === c.op)?.label ?? c.op
  let val = ''
  if (Array.isArray(c.value)) val = c.value.join(' ~ ')
  else val = String(c.value ?? '')
  return `${name} ${opLabel} ${val}`.trim()
}

/** 队列条件摘要（纳入 / 排除） */
export function cohortSummary(includes: CohortCondition[], excludes: CohortCondition[]): string {
  const inc = includes.length ? includes.map(conditionText).join(` ${includes[1]?.logic ?? 'AND'} `) : '无条件'
  const parts = [`纳入：${inc}`]
  if (excludes.length) parts.push(`排除：${excludes.map(conditionText).join(' 且 ')}`)
  return parts.join('；')
}
