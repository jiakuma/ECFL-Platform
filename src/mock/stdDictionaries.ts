/* ============================================================
   标准化字典 —— 规则自动生成的「确定性依据」
   原则：字典命中才生成规则，字典未命中一律转人工，不做推测
   ============================================================ */

/** 标准字段 → 标准单位（标准集定义的物理量单位） */
export const STANDARD_UNIT: Record<string, string> = {
  // 肿瘤标志物
  CEA: 'ng/mL',
  SCC: 'ng/mL',
  CA19_9: 'U/mL',
  CYFRA21_1: 'ng/mL',
  CA72_4: 'U/mL',
  AFP: 'ng/mL',
  CA125: 'U/mL',
  NSE: 'ng/mL',
  PG1: 'ng/mL',
  G17: 'pmol/L',
  // 生化
  FBG: 'mmol/L',
  GLU: 'mmol/L',
  TG: 'mmol/L',
  CHOL: 'mmol/L',
  HDL: 'mmol/L',
  LDL: 'mmol/L',
  HGB: 'g/L',
  // 体格
  HEIGHT: 'cm',
  WEIGHT: 'kg',
  BMI: 'kg/m²',
  WAIST: 'cm',
  // 病灶 / 分期
  EUS_DEPTH: 'mm',
  INV_DEPTH: 'mm',
  LESION_LEN: 'cm',
  // 时间与随访
  OS: '天',
  DFS: '天',
  PFS: '天',
  SYM_DUR: '月',
  AGE: '岁',
}

/** 单位换算项 */
export interface UnitConversion {
  from: string
  to: string
  /** 转换表达式：value × 10 */
  expr: string
  /** 适用说明（限定字段或限定量纲） */
  scope: string
}

/** 确定性单位换算表（仅收录可严格换算的关系，不同物质不同换算率单独限定） */
export const UNIT_CONVERSIONS: UnitConversion[] = [
  // 长度
  { from: 'cm', to: 'mm', expr: 'value × 10', scope: '长度' },
  { from: 'mm', to: 'cm', expr: 'value ÷ 10', scope: '长度' },
  { from: 'm', to: 'cm', expr: 'value × 100', scope: '长度' },
  { from: 'cm', to: 'm', expr: 'value ÷ 100', scope: '长度' },
  // 质量
  { from: 'kg', to: 'g', expr: 'value × 1000', scope: '质量' },
  { from: 'g', to: 'kg', expr: 'value ÷ 1000', scope: '质量' },
  // 时间
  { from: '天', to: '月', expr: 'value ÷ 30', scope: '时长' },
  { from: '月', to: '天', expr: 'value × 30', scope: '时长' },
  { from: '天', to: '年', expr: 'value ÷ 365', scope: '时长' },
  { from: '年', to: '天', expr: 'value × 365', scope: '时长' },
  { from: '月', to: '年', expr: 'value ÷ 12', scope: '时长' },
  // 同种物质质量浓度
  { from: 'g/dL', to: 'g/L', expr: 'value × 10', scope: '质量浓度' },
  { from: 'g/L', to: 'g/dL', expr: 'value ÷ 10', scope: '质量浓度' },
  { from: 'mg/L', to: 'µg/mL', expr: 'value ÷ 1000', scope: '质量浓度' },
  { from: 'µg/mL', to: 'mg/L', expr: 'value × 1000', scope: '质量浓度' },
]

/** 限定具体标准字段的换算（不同物质摩尔质量不同，不能套通用系数） */
const FIELD_SCOPED_UNITS: Record<string, UnitConversion> = {
  'FBG|mg/dL|mmol/L': { from: 'mg/dL', to: 'mmol/L', expr: 'value ÷ 18', scope: '葡萄糖（限定字段 FBG）' },
  'GLU|mg/dL|mmol/L': { from: 'mg/dL', to: 'mmol/L', expr: 'value ÷ 18', scope: '葡萄糖（限定字段 GLU）' },
  'CHOL|mg/dL|mmol/L': { from: 'mg/dL', to: 'mmol/L', expr: 'value ÷ 38.67', scope: '胆固醇（限定字段 CHOL）' },
  'TG|mg/dL|mmol/L': { from: 'mg/dL', to: 'mmol/L', expr: 'value ÷ 88.57', scope: '甘油三酯（限定字段 TG）' },
}

/** 单位规范化（空格 / 大小写） */
function normUnit(u: string): string {
  return u.trim().replace(/\s+/g, '').replace('μg/mL', 'µg/mL')
}

/** 查单位换算：字段限定优先，其次通用同量纲换算，无命中 → null（转人工） */
export function findUnitConversion(code: string, from: string, to: string): UnitConversion | null {
  const f = normUnit(from)
  const t = normUnit(to)
  if (!f || !t || f === t) return null
  return (
    FIELD_SCOPED_UNITS[`${code}|${f}|${t}`] ??
    UNIT_CONVERSIONS.find((c) => c.from === f && c.to === t) ??
    null
  )
}

/** 时间 src 格式 → 目标格式（统一 ISO 8601） */
export const DATE_TARGET_FORMAT = 'YYYY-MM-DD'

export interface DateConversion {
  from: string
  expr: string
}

/** 确定性日期格式字典 */
export const DATE_CONVERSIONS: Record<string, DateConversion> = {
  YYYYMMDD: { from: 'YYYYMMDD', expr: '截取 4-2-2 位重组为 YYYY-MM-DD' },
  'YYYY/MM/DD': { from: 'YYYY/MM/DD', expr: '替换分隔符 / → -' },
  'YYYY.MM.DD': { from: 'YYYY.MM.DD', expr: '替换分隔符 . → -' },
  TIMESTAMP: { from: 'TIMESTAMP', expr: 'Unix 时间戳按本地时区转换为 YYYY-MM-DD' },
  'YYYY-MM-DD': { from: 'YYYY-MM-DD', expr: '已符合 ISO 8601，无需转换' },
}

/** 取日期转换定义，未收录 → null（转人工） */
export function findDateConversion(format: string | null): DateConversion | null {
  if (!format) return null
  return DATE_CONVERSIONS[format] ?? null
}

/* ---------- 标准值域 ---------- */

/** 标准值域解析：'M0，M1，Mx' → ['M0','M1','Mx']；'正整数' / '—' → []（非枚举） */
export function domainValues(domain: string): string[] {
  if (!domain || domain === '—') return []
  const parts = domain.split(/[，,、\/]/).map((v) => v.trim()).filter(Boolean)
  // 无分隔符的单一取值视为量纲/类型描述，不构成枚举值域
  if (parts.length <= 1) return []
  return parts
}

/* ---------- 编码字典 ---------- */

export interface CodeEntry {
  /** 标准编码 */
  code: string
  /** 标准名称 / 标准值 */
  name: string
  unit?: string
}

/** LOINC 检验项目字典 */
export const LOINC_MAP: Record<string, CodeEntry> = {
  '2039-6': { code: '2039-6', name: '癌胚抗原 CEA', unit: 'ng/mL' },
  '6088-6': { code: '6088-6', name: '鳞状细胞癌抗原 SCC', unit: 'ng/mL' },
  '24108-4': { code: '24108-4', name: '糖类抗原19-9 CA19-9', unit: 'U/mL' },
  '47357-5': { code: '47357-5', name: '细胞角蛋白19片段 CYFRA21-1', unit: 'ng/mL' },
  '1834-0': { code: '1834-0', name: '甲胎蛋白 AFP', unit: 'ng/mL' },
  '14879-7': { code: '14879-7', name: '糖类抗原125 CA125', unit: 'U/mL' },
  '19607-1': { code: '19607-1', name: '神经元特异性烯醇化酶 NSE', unit: 'ng/mL' },
  '2345-7': { code: '2345-7', name: '葡萄糖 GLU', unit: 'mg/dL' },
  '2571-8': { code: '2571-8', name: '甘油三酯 TG', unit: 'mg/dL' },
  '2085-9': { code: '2085-9', name: '高密度脂蛋白 HDL', unit: 'mg/dL' },
  '13457-7': { code: '13457-7', name: '低密度脂蛋白 LDL', unit: 'mg/dL' },
  '2093-3': { code: '2093-3', name: '总胆固醇 CHOL', unit: 'mg/dL' },
}

/** ICD-10 食管恶性肿瘤字典（人工配置时的标准值候选） */
export const ICD10_ESOPHAGUS: CodeEntry[] = [
  { code: 'C15.0', name: '食管颈段恶性肿瘤' },
  { code: 'C15.1', name: '食管胸上段恶性肿瘤' },
  { code: 'C15.2', name: '食管胸中段恶性肿瘤' },
  { code: 'C15.3', name: '食管胸下段恶性肿瘤' },
  { code: 'C15.4', name: '食管胸段交界处恶性肿瘤' },
  { code: 'C15.5', name: '食管腹段恶性肿瘤' },
  { code: 'C15.8', name: '食管交搭跨越恶性肿瘤' },
  { code: 'C15.9', name: '食管未特指恶性肿瘤' },
  { code: 'D00.1', name: '食管原位癌' },
]

/** AJCC 第 8 版 食管癌 TNM 值域（用于值域校验型规则） */
export const AJCC8_VALUE_SETS: Record<'pT' | 'pN' | 'M' | 'STAGE' | 'GRADE', string[]> = {
  pT: ['Tis', 'T1', 'T1a', 'T1b', 'T2', 'T3', 'T4a', 'T4b', 'Tx'],
  pN: ['N0', 'N1', 'N2', 'N3', 'Nx'],
  M: ['M0', 'M1', 'Mx'],
  STAGE: ['0', 'I', 'II', 'IIA', 'IIB', 'III', 'IIIA', 'IIIB', 'IV', 'IVA', 'IVB'],
  GRADE: ['G1', 'G2', 'G3', 'Gx'],
}

/** 标准字段 → AJCC 值集（源值已是 AJCC 写法时，直接做值域校验并写入） */
const AJCC8_FIELD_SET: Record<string, keyof typeof AJCC8_VALUE_SETS> = {
  pT: 'pT', cT: 'pT', tTNM: 'pT',
  pN: 'pN', cN: 'pN', nTNM: 'pN',
  CM: 'M', cM: 'M', cM_DIAG: 'M',
  STAGE: 'STAGE', cSTAGE: 'STAGE', pSTAGE: 'STAGE', STAGE_TNM: 'STAGE',
  GRADE: 'GRADE', cGRADE: 'GRADE',
}

export function ajccValueSet(code: string): string[] {
  const key = AJCC8_FIELD_SET[code]
  return key ? AJCC8_VALUE_SETS[key] : []
}

/** 标准字段 → 适用的标准编码体系（驱动「编码转换」自动套用） */
export const STANDARD_CODE_SYSTEM: Record<string, string> = {
  PATH_CODE: 'ICD-10',
  DIAG_PATH_DIS: 'ICD-10',
  CEA: 'LOINC',
  SCC: 'LOINC',
  CA19_9: 'LOINC',
  CYFRA21_1: 'LOINC',
  CA72_4: 'LOINC',
  AFP: 'LOINC',
  CA125: 'LOINC',
  NSE: 'LOINC',
  FBG: 'LOINC',
  TG: 'LOINC',
  CHOL: 'LOINC',
  HDL: 'LOINC',
  LDL: 'LOINC',
}

/** 取某标准编码体系下的标准值候选 */
export function standardCandidates(system: string, code: string): CodeEntry[] {
  if (system === 'ICD-10') return ICD10_ESOPHAGUS
  if (system === 'LOINC') return Object.values(LOINC_MAP)
  if (system === 'AJCC8') {
    if (code === 'pT' || code === 'cT') return AJCC8_VALUE_SETS.pT.map((v) => ({ code: v, name: v }))
    if (code === 'pN' || code === 'cN') return AJCC8_VALUE_SETS.pN.map((v) => ({ code: v, name: v }))
    return AJCC8_VALUE_SETS.STAGE.map((v) => ({ code: v, name: v }))
  }
  return []
}
