/* ============================================================
   标准数据产物构建（End-to-End Mock）
   把「患者级宽表（原始 / 脏 / 重复 / 未脱敏）」依次过：
      标准化 → 清洗 → 去重 → 脱敏
   得到治理链路的「最终标准数据」。

   规则与 dataQualityEngine（清洗）/ standardizationEngine（标准化）严格一致，保证
   「标准数据」页展示的就是前面 数据处理 跑完后的真实产物：
     宽表 21 行（含 3 条重复、未脱敏）
       → 标准化（日期 / 性别 / 随访值域 / 单位 / 编码 / 术语）+ 清洗（姓名空格 / 年龄）
       → 按 patient_id 去重（消除 3 条）
       → 脱敏（姓名掩码 + 编号伪匿名）
       = 18 名患者级标准宽表
   ============================================================ */

import { wideRows, wideFieldOrder, type WideRow } from './wideTableBuilder'

/* ---------------- 标准化 / 清洗 规则（与 dataQualityEngine 对齐） ---------------- */

function validDate(y: number, mo: number, d: number): boolean {
  if (mo < 1 || mo > 12) return false
  const dim = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]
  if (mo === 2 && ((y % 4 === 0 && y % 100 !== 0) || y % 400 === 0)) dim[1] = 29
  return d >= 1 && d <= dim[mo - 1]
}

function toISODate(v: string): string {
  const s = v.trim()
  let m: RegExpMatchArray | null
  if ((m = s.match(/^(\d{4})(\d{2})(\d{2})$/))) {
    if (!validDate(+m[1], +m[2], +m[3])) return ''
    return `${m[1]}-${m[2]}-${m[3]}`
  }
  if ((m = s.match(/^(\d{4})\/(\d{1,2})\/(\d{1,2})$/))) {
    if (!validDate(+m[1], +m[2], +m[3])) return ''
    return `${m[1]}-${String(+m[2]).padStart(2, '0')}-${String(+m[3]).padStart(2, '0')}`
  }
  if (/^\d{4}-\d{1,2}-\d{1,2}$/.test(s)) return s
  return ''
}

const TERM_MAP: Record<string, string> = { '食道恶性肿瘤': '食管恶性肿瘤' }

function cleanAge(v: unknown): string | null {
  if (typeof v !== 'string') return null
  const t = v.trim()
  const canon = t.replace(/\.0$/, '').replace(/\s*岁$/, '')
  return canon !== t ? canon : null
}

const GENDER_MAP: Record<string, string> = { '1': '男', '2': '女', M: '男', F: '女', m: '男', f: '女' }
const VITAL_MAP: Record<string, string> = { '1': '生存', '0': '死亡', '2': '死亡' }
const RECUR_MAP: Record<string, string> = { '0': '无', '1': '有' }

function stripUnit(v: unknown): { ok: boolean; num: string } {
  if (typeof v !== 'string') return { ok: false, num: '' }
  // 单位段不得以小数点开头，避免把纯小数（如 "4.3"）的小数部分误判为单位
  const m = v.trim().match(/^(-?\d+(?:\.\d+)?)\s*([^\s\d.].*)$/)
  if (m) return { ok: true, num: m[1] }
  return { ok: false, num: '' }
}

function trimSpaces(v: unknown): string | null {
  if (typeof v !== 'string') return null
  return v.trim() !== v ? v.trim() : null
}

function toNumber(v: unknown): number {
  if (typeof v === 'number') return v
  const s = stripUnit(v)
  if (s.ok) return Number(s.num)
  return Number(String(v).trim())
}

/* ---------------- 脱敏（与 dataQualityEngine 对齐） ---------------- */

function maskName(v: string): string {
  return v.length <= 1 ? v : v[0] + '*'.repeat(v.length - 1)
}

function pseudoId(v: string): string {
  let h = 0
  for (let i = 0; i < v.length; i++) h = (h * 31 + v.charCodeAt(i)) >>> 0
  return `ANON-${(h % 0xffffffff).toString(36).toUpperCase().padStart(7, '0')}`
}

/* ---------------- 字段 → 治理步骤（溯源展示用） ---------------- */
export const fieldStage: Record<string, string[]> = {
  patient_id: ['脱敏'],
  patient_name: ['清洗', '脱敏'],
  gender: ['标准化'],
  birth_date: ['标准化'],
  age: ['清洗'],
  diagnosis_code: ['标准化'],
  diagnosis_name: ['标准化'],
  ajcc_stage: ['标准化'],
  cea: ['标准化'],
  scc: ['标准化'],
  ca199: ['标准化'],
  cyfra211: ['标准化'],
  afp: ['标准化'],
  vital_status: ['标准化'],
  recurrence: ['标准化'],
  followup_days: ['直接映射'],
  survival_days: ['直接映射'],
}

/* ---------------- 最终标准宽表行 ---------------- */
export interface StdWideRow {
  /** 已伪匿名的患者编号 */
  patient_id: string
  /** 已掩码姓名 */
  patient_name: string
  gender: string
  birth_date: string
  age: number
  diagnosis_code: string
  diagnosis_name: string
  ajcc_stage: string
  cea: number
  scc: number
  ca199: number
  cyfra211: number
  afp: number
  vital_status: string
  recurrence: string
  followup_days: number
  survival_days: number
  /** 溯源：脱敏前原始 patient_id */
  _srcPatientId: string
  /** 溯源：被保留的原始宽表行（去重首条） */
  _raw: WideRow
  /** 该患者在原始宽表中的重复条数（已消除） */
  _dup: number
}

/** 单条：标准化 + 清洗 + 脱敏 */
function transformRow(r: WideRow): StdWideRow {
  const bd = toISODate(String(r.birth_date).trim())
  const ageRaw = r.age
  const age = typeof ageRaw === 'number' ? ageRaw : Number(cleanAge(ageRaw) ?? ageRaw)
  const gender = GENDER_MAP[String(r.gender).trim()] ?? String(r.gender)
  const nameTrim = trimSpaces(r.patient_name) ?? r.patient_name
  const code = r.diagnosis_code.toUpperCase()
  const vital = VITAL_MAP[String(r.vital_status).trim()] ?? r.vital_status
  const recur = RECUR_MAP[String(r.recurrence).trim()] ?? r.recurrence
  return {
    patient_id: pseudoId(r.patient_id),
    patient_name: maskName(nameTrim),
    gender,
    birth_date: bd || String(r.birth_date),
    age,
    diagnosis_code: code,
    diagnosis_name: TERM_MAP[String(r.diagnosis_name).trim()] ?? r.diagnosis_name,
    ajcc_stage: r.ajcc_stage,
    cea: toNumber(r.cea),
    scc: toNumber(r.scc),
    ca199: toNumber(r.ca199),
    cyfra211: toNumber(r.cyfra211),
    afp: toNumber(r.afp),
    vital_status: vital,
    recurrence: recur,
    followup_days: r.followup_days,
    survival_days: r.survival_days,
    _srcPatientId: r.patient_id,
    _raw: r,
    _dup: 0,
  }
}

/** 统计单条被清洗修复的单元格数（原始 → 标准 有差异） */
function countCleanChanges(raw: WideRow, std: StdWideRow): number {
  let n = 0
  const eq = (a: unknown, b: unknown) => String(a) === String(b)
  if (!eq(raw.birth_date, std.birth_date)) n++
  if (!eq(raw.age, std.age)) n++
  if (!eq(raw.gender, std.gender)) n++
  if (!eq(raw.patient_name, std.patient_name)) n++
  for (const f of ['cea', 'scc', 'ca199', 'cyfra211', 'afp'] as const) {
    if (!eq(raw[f], (std as unknown as Record<string, unknown>)[f])) n++
  }
  if (!eq(raw.diagnosis_code, std.diagnosis_code)) n++
  if (!eq(raw.vital_status, std.vital_status)) n++
  if (!eq(raw.recurrence, std.recurrence)) n++
  return n
}

export interface StandardWideResult {
  /** 最终标准宽表（去重后、已脱敏） */
  rows: StdWideRow[]
  /** 原始宽表行数 */
  rawCount: number
  /** 独立患者数（去重后） */
  uniqueCount: number
  /** 去重消除条数 */
  dupCount: number
  /** 清洗修复单元格数 */
  cleanChanges: number
  /** 脱敏项（姓名 + 编号） */
  maskCount: number
  /** 字段顺序 */
  fieldOrder: string[]
}

export function buildStandardWideTable(source?: WideRow[]): StandardWideResult {
  const raw = source ?? wideRows
  const transformed = raw.map(transformRow)
  const cleanChanges = raw.reduce((n, r, i) => n + countCleanChanges(r, transformed[i]), 0)

  // 按 patient_id 去重（保留首条）
  const counts = new Map<string, number>()
  raw.forEach((r) => counts.set(r.patient_id, (counts.get(r.patient_id) ?? 0) + 1))
  const seen = new Set<string>()
  const rows: StdWideRow[] = []
  transformed.forEach((t) => {
    const id = t._srcPatientId
    if (!seen.has(id)) {
      seen.add(id)
      rows.push(t)
    }
  })
  rows.forEach((t) => {
    t._dup = (counts.get(t._srcPatientId) ?? 1) - 1
  })

  return {
    rows,
    rawCount: raw.length,
    uniqueCount: rows.length,
    dupCount: raw.length - rows.length,
    cleanChanges,
    maskCount: rows.length * 2,
    fieldOrder: [...wideFieldOrder],
  }
}
