// ============================================================
// 多中心数据对齐 —— 规则引擎（与界面展示分离的纯逻辑层）
// 覆盖「患者基本信息」六大类字段：
//   患者身份（病案号 / 病理编号 / 主索引）
//   人口学（性别 / 年龄 / 出生年份）
//   时间（初诊日期 / 检查日期）
//   疾病（疾病名称 / 病理类型）
//   分期（cTNM / pTNM）
//   既往史（高血压 / 吸烟史 / 过敏史）
// 设计原则：
//   - 规则可查：每条规则带标准依据(basis)与适用范围(scope)
//   - 不杜撰：缺失信息时禁止推算，标记「待人工确认」
//   - 保留精度：日期仅保留原始精度，不得补日
//   - 身份谨慎：病案号不直接等同患者，须基于关联依据
// ============================================================

// ---------- 规则注册表 ----------
export type AlignTransform = 'dict' | 'date-precision' | 'calc' | 'identity' | 'passthrough'

export interface AlignRule {
  id: string
  name: string
  version: string
  basis: string // 标准依据
  scope: string // 适用范围与约束
  transform: AlignTransform
  note?: string
}

export const alignRules: Record<string, AlignRule> = {
  SEX_GBT2261: {
    id: 'SEX_GBT2261',
    name: '性别编码',
    version: 'v1.2',
    basis: 'GB/T 2261.1-2003《个人基本信息分类与代码 第1部分：人的性别代码》',
    scope: '男/M/1 → 男性(代码1)；女/F/0 → 女性(代码2)。中心自定编码须先验证含义，含义不一致不得直接转换。',
    transform: 'dict',
    note: '字段名不同（sex/gender/患者性别）不默认语义一致；中心编码含义不明时标记待确认。',
  },
  BIRTH_PRECISION: {
    id: 'BIRTH_PRECISION',
    name: '出生日期精度保留',
    version: 'v1.0',
    basis: 'ISO 8601 精度等价原则（原值精度不可提升）',
    scope: '仅保留原值已有的年月 / 年月日精度；YYYY-MM 不得补全为 YYYY-MM-01；格式非法标记对齐失败。',
    transform: 'date-precision',
  },
  SMOKING_PACKYEAR: {
    id: 'SMOKING_PACKYEAR',
    name: '吸烟包年计算',
    version: 'v1.1',
    basis: '包年(pack-year) = 日吸烟包数 × 吸烟年数',
    scope: '必须同时存在吸烟量与吸烟年限；任一项缺失禁止推算，标记待人工确认。',
    transform: 'calc',
    note: '保留原始自由文本与计算过程，不杜撰数值。',
  },
  MPI_MAP: {
    id: 'MPI_MAP',
    name: '患者主索引映射',
    version: 'v1.0',
    basis: '平台统一主索引(PMI) + 跨机构本地编码映射表',
    scope: '不同中心病案号不得直接视为同一患者；须有明确关联依据后合并；多候选或依据不足标记待确认。',
    transform: 'identity',
  },
  PASS_THROUGH: {
    id: 'PASS_THROUGH',
    name: '源标识保留',
    version: 'v1.0',
    basis: '平台标识保留策略（源标识原值留存，关联至统一主索引）',
    scope: '病理编号等源系统标识原值保留，不重编码；仅作为溯源键关联 PMI。',
    transform: 'passthrough',
  },
  BIRTH_YEAR: {
    id: 'BIRTH_YEAR',
    name: '出生年份精度保留',
    version: 'v1.0',
    basis: 'ISO 8601 精度等价原则（原值精度不可提升）',
    scope: '仅保留原始年份精度（YYYY）；不得补全为 YYYY-MM 或 YYYY-MM-DD。',
    transform: 'date-precision',
  },
  AGE_SNAPSHOT: {
    id: 'AGE_SNAPSHOT',
    name: '年龄口径统一',
    version: 'v1.0',
    basis: '临床流行病学约定：年龄取「确诊时」快照，= 初诊日期 − 出生日期',
    scope: '年龄为时点快照，须标注「确诊时」；不随当前日期变化；超 0–120 岁范围标记对齐失败。',
    transform: 'calc',
    note: '年龄由出生日期派生，原始报送值缺口径时统一折算为确诊时年龄。',
  },
  DISEASE_NAME: {
    id: 'DISEASE_NAME',
    name: '疾病名称字典',
    version: 'v1.1',
    basis: 'ICD-10 食管恶性肿瘤（C15）；合并食管鳞癌/食管癌别称至标准术语',
    scope: '食管鳞癌 / 食管癌等别称统一为「食管鳞状细胞癌」；未命中标准字典标记待确认，禁止臆造编码。',
    transform: 'dict',
  },
  PATH_TYPE: {
    id: 'PATH_TYPE',
    name: '病理类型字典',
    version: 'v1.1',
    basis: 'ICD-O-3 形态学编码（鳞状细胞癌 8070/3，腺癌 8140/3）',
    scope: '鳞癌 / 腺癌等简称统一为标准病理类型并赋 ICD-O-3 码；未命中标记待确认。',
    transform: 'dict',
  },
  TNM_VERSION: {
    id: 'TNM_VERSION',
    name: 'TNM 分期版本统一',
    version: 'v1.0',
    basis: 'AJCC 癌症分期手册 第 8 版（2017）',
    scope: '统一标注 AJCC 第 8 版；cTNM/pTNM 分期值原样保留；缺版本时补标注并留痕。',
    transform: 'dict',
  },
  HISTORY_YESNO: {
    id: 'HISTORY_YESNO',
    name: '既往史有无标准化',
    version: 'v1.0',
    basis: '既往史阳性/阴性二值编码约定',
    scope: '有/阳性/是 → 阳性；无/阴性/否 → 阴性；未命中标准取值标记待确认。',
    transform: 'dict',
  },
  ALLERGY_STRUCT: {
    id: 'ALLERGY_STRUCT',
    name: '过敏史结构化',
    version: 'v1.0',
    basis: '过敏史结构化规范（有无 + 过敏原）',
    scope: '无/否认 → 阴性；有明确过敏原 → 阳性并记录过敏原；缺失标记待确认。',
    transform: 'dict',
  },
}

// ---------- 字段映射字典（来源中心 → 标准模型） ----------
export interface FieldMap {
  sourceOrg: string
  sourceField: string
  sourceType: string
  standardField: string
  standardType: string
  ruleId: string
  ambiguous?: boolean // 字段名相似但语义未确认
}

export const fieldMaps: FieldMap[] = [
  { sourceOrg: '国家癌症中心', sourceField: '性别', sourceType: 'string', standardField: '性别', standardType: 'code(GB/T 2261.1)', ruleId: 'SEX_GBT2261' },
  { sourceOrg: '国家癌症中心', sourceField: '出生年月', sourceType: 'date(YM)', standardField: '出生日期', standardType: 'date(YM)', ruleId: 'BIRTH_PRECISION' },
  { sourceOrg: '通用', sourceField: '吸烟史', sourceType: 'free-text', standardField: '吸烟包年', standardType: 'number(包年)', ruleId: 'SMOKING_PACKYEAR' },
  { sourceOrg: '通用', sourceField: '病案号/本地编码', sourceType: 'string', standardField: '统一主索引(PMI)', standardType: 'code', ruleId: 'MPI_MAP' },
  { sourceOrg: '通用', sourceField: '病理编号/标本号', sourceType: 'string', standardField: '病理编号（溯源键）', standardType: 'string', ruleId: 'PASS_THROUGH' },
  { sourceOrg: '通用', sourceField: '出生年份', sourceType: 'year', standardField: '出生年份', standardType: 'year', ruleId: 'BIRTH_YEAR' },
  { sourceOrg: '通用', sourceField: '年龄', sourceType: 'number', standardField: '年龄（确诊时）', standardType: 'number', ruleId: 'AGE_SNAPSHOT' },
  { sourceOrg: '通用', sourceField: '初诊日期/检查日期', sourceType: 'date', standardField: '初诊/检查日期', standardType: 'date', ruleId: 'BIRTH_PRECISION' },
  { sourceOrg: '通用', sourceField: '疾病名称', sourceType: 'string', standardField: '疾病名称', standardType: 'ICD-10 C15', ruleId: 'DISEASE_NAME' },
  { sourceOrg: '通用', sourceField: '病理类型', sourceType: 'string', standardField: '病理类型', standardType: 'ICD-O-3', ruleId: 'PATH_TYPE' },
  { sourceOrg: '通用', sourceField: 'cTNM/pTNM', sourceType: 'string', standardField: 'TNM 分期', standardType: 'AJCC 第8版', ruleId: 'TNM_VERSION' },
  { sourceOrg: '通用', sourceField: '高血压/既往史', sourceType: 'enum(有/无)', standardField: '既往史（阳性/阴性）', standardType: 'enum', ruleId: 'HISTORY_YESNO' },
  { sourceOrg: '通用', sourceField: '过敏史', sourceType: 'free-text', standardField: '过敏史（结构化）', standardType: 'enum+过敏原', ruleId: 'ALLERGY_STRUCT' },
  // 跨中心：字段名不同，默认待确认
  { sourceOrg: '省肿瘤医院', sourceField: 'gender', sourceType: 'string', standardField: '性别', standardType: 'code(GB/T 2261.1)', ruleId: 'SEX_GBT2261', ambiguous: true },
  { sourceOrg: '省肿瘤医院', sourceField: 'birth_date', sourceType: 'date(YMD)', standardField: '出生日期', standardType: 'date(YM/YMD)', ruleId: 'BIRTH_PRECISION', ambiguous: true },
]

// ---------- 通用结果类型 ----------
export type AlignRecordStatus = '对齐成功' | '待人工确认' | '对齐失败'

export interface MappingResult {
  standardValue: string
  status: AlignRecordStatus
  issue?: string
  formula?: string // 计算过程（仅 calc）
  code?: string // 标准编码
}

// ---------- 纯函数：性别 ----------
const SEX_DICT: Record<string, { label: string; code: string }> = {
  男: { label: '男性', code: '1' },
  M: { label: '男性', code: '1' },
  1: { label: '男性', code: '1' },
  女: { label: '女性', code: '2' },
  F: { label: '女性', code: '2' },
  0: { label: '女性', code: '2' },
}

export function mapSex(raw: string): MappingResult {
  const hit = SEX_DICT[raw.trim()]
  if (hit) return { standardValue: hit.label, code: hit.code, status: '对齐成功' }
  return {
    standardValue: '',
    status: '待人工确认',
    issue: `源值「${raw}」未在标准字典命中，且中心编码含义未经验证，禁止直接转换。`,
  }
}

// ---------- 纯函数：出生日期/年份（保留精度，禁止补日/补月） ----------
export function mapBirth(raw: string): MappingResult {
  const v = raw.trim()
  // 年精度：保留年份，禁止补月/补日
  if (/^\d{4}$/.test(v)) {
    return { standardValue: v, status: '对齐成功', issue: '原值精度为年，已保留年份，未补月/补日。' }
  }
  const ym = /^(\d{4})-(\d{2})$/.exec(v)
  if (ym) {
    const mo = +ym[2]
    if (mo < 1 || mo > 12) {
      return { standardValue: '', status: '对齐失败', issue: '日期格式错误：月份超出范围。' }
    }
    // 年月精度：保留，不补日
    return { standardValue: v, status: '对齐成功', issue: '原值精度为年月，已保留，未补日。' }
  }
  const ymd = /^(\d{4})-(\d{2})-(\d{2})$/.exec(v)
  if (ymd) {
    const mo = +ymd[2]
    const d = +ymd[3]
    if (mo < 1 || mo > 12 || d < 1 || d > 31) {
      return { standardValue: '', status: '对齐失败', issue: '日期格式错误：月份或日期超出范围。' }
    }
    return { standardValue: v, status: '对齐成功' }
  }
  return { standardValue: '', status: '对齐失败', issue: '日期格式错误：应为 YYYY / YYYY-MM / YYYY-MM-DD。' }
}

// ---------- 纯函数：患者身份（病理编号等源标识保留） ----------
export function mapPassthrough(raw: string): MappingResult {
  const v = raw.trim()
  if (!v) return { standardValue: '', status: '对齐失败', issue: '源标识为空，不可保留。' }
  return { standardValue: v, status: '对齐成功', issue: '源系统标识原值保留，作为溯源键关联统一主索引。' }
}

// ---------- 纯函数：年龄（确诊时快照，口径统一） ----------
export function mapAge(raw: string): MappingResult {
  const n = Number(raw.trim())
  if (Number.isNaN(n) || n < 0 || n > 120) {
    return { standardValue: '', status: '对齐失败', issue: '年龄数值超合理范围（0–120 岁）。' }
  }
  return {
    standardValue: `${n} 岁（确诊时）`,
    status: '对齐成功',
    formula: `确诊时年龄 = 初诊日期 − 出生日期（快照，不随当前日期变化）`,
    issue: '年龄统一取确诊时快照口径。',
  }
}

// ---------- 纯函数：疾病名称（ICD-10 字典） ----------
const DISEASE_DICT: Record<string, { label: string; code: string }> = {
  食管鳞癌: { label: '食管鳞状细胞癌', code: 'C15(ICD-10)' },
  食管癌: { label: '食管恶性肿瘤', code: 'C15(ICD-10)' },
  食道鳞癌: { label: '食管鳞状细胞癌', code: 'C15(ICD-10)' },
  食管鳞状细胞癌: { label: '食管鳞状细胞癌', code: 'C15(ICD-10)' },
  食管腺癌: { label: '食管腺癌', code: 'C15(ICD-10)' },
}
export function mapDiseaseName(raw: string): MappingResult {
  const hit = DISEASE_DICT[raw.trim()]
  if (hit) return { standardValue: hit.label, code: hit.code, status: '对齐成功' }
  return {
    standardValue: '',
    status: '待人工确认',
    issue: `疾病名称「${raw}」未命中标准字典（ICD-10 C15 食管恶性肿瘤），禁止臆造编码，需人工确认术语。`,
  }
}

// ---------- 纯函数：病理类型（ICD-O-3 字典） ----------
const PATH_DICT: Record<string, { label: string; code: string }> = {
  鳞癌: { label: '鳞状细胞癌', code: '8070/3' },
  鳞状细胞癌: { label: '鳞状细胞癌', code: '8070/3' },
  腺癌: { label: '腺癌', code: '8140/3' },
  腺鳞癌: { label: '腺鳞癌', code: '8560/3' },
}
export function mapPathType(raw: string): MappingResult {
  const hit = PATH_DICT[raw.trim()]
  if (hit) return { standardValue: hit.label, code: hit.code, status: '对齐成功' }
  return {
    standardValue: '',
    status: '待人工确认',
    issue: `病理类型「${raw}」未命中标准字典（ICD-O-3），需人工确认术语与编码。`,
  }
}

// ---------- 纯函数：TNM 分期版本统一（AJCC 第8版） ----------
export function mapTnm(raw: string): MappingResult {
  const v = raw.trim()
  if (/AJCC/.test(v)) return { standardValue: v, status: '对齐成功' }
  return {
    standardValue: `${v}（AJCC 第8版）`,
    status: '对齐成功',
    issue: '原值未标注分期版本，已统一标注 AJCC 第8版。',
  }
}

// ---------- 纯函数：既往史有无标准化 ----------
export function mapHistoryYesNo(raw: string): MappingResult {
  const v = raw.trim()
  if (['有', '阳性', '是', 'Y', 'yes'].includes(v)) return { standardValue: '阳性', status: '对齐成功' }
  if (['无', '阴性', '否', 'N', 'no'].includes(v)) return { standardValue: '阴性', status: '对齐成功' }
  return {
    standardValue: '',
    status: '待人工确认',
    issue: `既往史取值「${raw}」未命中 有/无 标准，需人工确认。`,
  }
}

// ---------- 纯函数：过敏史结构化 ----------
export function mapAllergy(raw: string): MappingResult {
  const v = raw.trim()
  if (['无', '否认', '无已知过敏'].includes(v)) return { standardValue: '阴性（无已知过敏）', status: '对齐成功' }
  if (!v) return { standardValue: '', status: '待人工确认', issue: '过敏史缺失，须补充。' }
  return { standardValue: `阳性；过敏原：${v}`, status: '对齐成功', issue: '已结构化：有过敏史并记录过敏原。' }
}

// ---------- 纯函数：吸烟包年（缺量/年限不推算） ----------
export function mapSmoking(raw: string): MappingResult {
  const v = raw.trim()
  const yearsM = /(\d+(?:\.\d+)?)\s*年/.exec(v)
  const packsM = /(\d+(?:\.\d+)?)\s*包\s*\/\s*天/.exec(v) || /(\d+(?:\.\d+)?)\s*包每天/.exec(v)
  const years = yearsM ? parseFloat(yearsM[1]) : NaN
  const packs = packsM ? parseFloat(packsM[1]) : NaN
  if (Number.isNaN(years) || Number.isNaN(packs)) {
    return {
      standardValue: '',
      status: '待人工确认',
      issue: '原始信息缺失吸烟量或吸烟年限之一，禁止推算。',
    }
  }
  const packYears = Math.round(years * packs)
  return {
    standardValue: `${packYears} 包年`,
    status: '对齐成功',
    formula: `包年 = 日吸烟包数(${packs}) × 吸烟年数(${years}) = ${packYears}`,
  }
}

// ---------- 纯函数：患者主索引（身份对齐） ----------
export interface MpiContext {
  localId: string
  org: string
  candidates: string[] // 候选统一主索引
}

export function mapMPI(ctx: MpiContext): MappingResult {
  if (ctx.candidates.length === 0) {
    return { standardValue: '', status: '待人工确认', issue: '无匹配的统一主索引，无法确定患者身份。' }
  }
  if (ctx.candidates.length > 1) {
    return {
      standardValue: '',
      status: '待人工确认',
      issue: `存在 ${ctx.candidates.length} 个候选主索引，需人工甄别后合并，不得仅凭病案号相似自动合并。`,
    }
  }
  return { standardValue: ctx.candidates[0], code: ctx.candidates[0], status: '对齐成功' }
}

// ---------- 冲突检测：同一标准字段、不同中心、值不一致 ----------
export interface ConflictInput {
  field: string
  values: { org: string; value: string }[]
}

export interface ConflictResult {
  field: string
  values: { org: string; value: string }[]
  conflict: boolean
  note?: string
}

export function detectConflict(input: ConflictInput): ConflictResult {
  const uniq = new Set(input.values.map((v) => v.value))
  if (uniq.size <= 1) {
    return { ...input, conflict: false }
  }
  return {
    ...input,
    conflict: true,
    note: `跨中心数据冲突：${input.values.map((v) => `${v.org}=${v.value}`).join('；')}`,
  }
}
