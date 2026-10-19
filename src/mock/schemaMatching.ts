/* ============================================================
   混合 Schema Matching
   五个分量加权得到综合匹配得分（0-100），不使用单一 NLP，也不调用 LLM：
     1. 字段名规则      SEX_CODE / sexCode / sex_code 统一规范化后比对
     2. 英文缩写        CEA → 癌胚抗原
     3. 同义词词典      患者性别 / 生物学性别 / sex / gender 归一到同一词根
     4. 语义相似度      源字段文本 与 标准字段（中文名/英文名/值域/定义）大粒度相似度
     5. 结构约束        数据类型 / 值域 / 数据分类 命中与重排
   最终映射关系必须由操作人员确认
   ============================================================ */

import type { StandardField } from './esophagusMetadata'

/** 匹配方式（页面只展示主导方式） */
export type MatchMethod = '字段名规则' | '英文缩写' | '同义词词典' | '语义相似度' | '结构约束'

/** 综合得分分解 */
export interface ScoreBreakdown {
  /** 字段名相似度 */
  name: number
  /** 英文缩写匹配 */
  abbr: number
  /** 同义词匹配 */
  synonym: number
  /** 语义相似度 */
  semantic: number
  /** 结构约束（类型/值域/分类） */
  structure: number
}

export interface Candidate {
  standard: StandardField
  /** 综合匹配得分（0-100） */
  score: number
  /** 主导匹配方式 */
  method: MatchMethod
  breakdown: ScoreBreakdown
}

export interface MatchingInput {
  /** 源字段名 */
  field: string
  /** 源字段描述 */
  desc: string
  /** 源字段数据类型 */
  type?: string
  /** 示例值 */
  sample?: string
  /** 数据分类线索（由字段名规则推断） */
  category?: string
}

/** 综合得分权重 */
const WEIGHTS: Record<keyof ScoreBreakdown, number> = {
  name: 0.3,
  abbr: 0.2,
  synonym: 0.16,
  semantic: 0.2,
  structure: 0.14,
}

/** 源字段名中的通用后缀，不参与「字段名规则」核心匹配 */
const GENERIC = new Set([
  'code', 'no', 'num', 'flag', 'value', 'desc', 'description', 'level', 'type',
  'status', 'state', 'id', 'name', 'date', 'time', 'result', 'unit', 'days',
  'seq', 'times', 'count', 'total', 'pos', 't', 'n', 'm', 'c',
])

/** 医疗术语同义词组：归一到同一词根（组首为词根） */
const SYNONYM_GROUPS: string[][] = [
  ['sex', 'sexcode', 'gender', 'sexatbirth', 'biologicalsex', '性别', '生物学性别', '患者性别', '生理性别'],
  ['age', 'patientage', '年龄', '患者年龄'],
  ['name', 'patientname', 'name', '姓名', '患者姓名'],
  ['id', 'patientid', 'patientno', 'patientidno', '病案号', '住院号', '患者标识'],
  ['address', 'addressline', 'address', '地址', '通讯地址'],
  ['phone', 'telecom', 'phonenumber', 'mobile', '手机号', '联系电话'],
  ['nativeplace', 'birthplace', '籍贯', '出生地', '所在地区'],
  ['native', 'ethnicity', 'nation', 'nationcode', '民族', '民族代码'],
  ['marriage', 'maritalstatus', '婚姻状况', '婚姻状态'],
  ['education', 'educationlevel', 'edu', '学历', '文化程度'],
  ['insurance', 'insurancetype', 'insurance', '医疗保障', '医保类型'],
  ['cea', 'carcinoembryonicantigen', '癌胚抗原'],
  ['scc', 'squamouscellcarcino', '鳞状细胞癌抗原'],
  ['ca199', 'carbohydrateantigen199', '糖类抗原199', 'ca19', 'ca19-9'],
  ['ca724', 'carbohydrateantigen724', '糖类抗原724'],
  ['cyfra211', 'cyfra21', 'cyfra21-1', '细胞角蛋白19片段'],
  ['afp', 'alphafetoprotein', '甲胎蛋白'],
  ['ca125', 'carbohydrateantigen125', '糖类抗原125', 'ca12', 'ca12-5'],
  ['nse', 'neuronspecificenolase', '神经元特异性烯醇化酶'],
  ['fbg', 'glu', 'fastingglucose', '空腹血糖', '血糖'],
  ['tg', 'triglyceride', '甘油三酯'],
  ['chol', 'cholesterol', 'totalcholesterol', '总胆固醇'],
  ['hdl', 'highdensitylipoprotein', '高密度脂蛋白胆固醇'],
  ['ldl', 'lowdensitylipoprotein', '低密度脂蛋白胆固醇'],
  ['pg1', 'pepsinogen1', '胃蛋白酶原I'],
  ['pgr', 'pepsinogenratio', '胃蛋白酶原比值'],
  ['g17', 'gastrin17', '胃泌素17'],
  ['hbsag', 'hepatitisbsurfaceantigen', '乙型肝炎表面抗原'],
  ['hcv', 'hepatitisccantibody', '丙型肝炎抗体'],
  ['hp', 'hpv', '幽门螺杆菌', '幽门螺旋杆菌'],
  ['endo', 'endoscopy', 'endoscopyid', 'exam', 'examination', 'check', '内镜检查', '内镜', '检查'],
  ['eus', 'endoscopicultrasound', '超声内镜'],
  ['lesion', 'lesionlocation', 'lesionlength', 'lesioncount', '病灶', '病变'],
  ['biopsy', 'biopsyflag', 'biopsylocation', '活检', '活组织检查'],
  ['pathology', 'pathologic', 'path', '病理'],
  ['histology', 'histo', 'histologicgrade', '组织学', '组织学类型'],
  ['grade', 'histologicgrade', 'grading', '分级'],
  ['stage', 'staging', '分期'],
  ['invasion', 'invasiondepth', 'invasivedepth', '浸润深度'],
  ['depth', 'depthofinvasion', '深度'],
  ['lymphnode', 'lymphnodes', 'lymphnodemetastasis', '淋巴结'],
  ['margin', 'marginstatus', '切缘'],
  ['trg', 'tumorregressiongrade', '肿瘤退缩分级'],
  ['ecog', 'ecogscore', 'performancestatus', '体力状况', '体力状况评分'],
  ['recurrence', 'recur', 'recurrence', '复发'],
  ['followup', 'followupdate', 'followupstatus', '随访'],
  ['survival', 'os', 'overallsurvival', '总生存'],
  ['dfs', 'diseasefree', 'diseasefreesurvival', '无进展生存'],
  ['pfs', 'progressionsurvival', 'progressfreesurvival', '无进展生存期'],
  ['death', 'deathdate', 'death', '死亡'],
  ['censor', 'censoring', '删失'],
  ['early', 'earlycancer', 'earlyflag', '早期癌', '早期'],
  ['ien', 'intraepithelialneoplasia', '上皮内瘤变'],
  ['lvi', 'lymphovascularinvasion', '脉管侵犯'],
  ['height', 'bodyheight', '身高'],
  ['weight', 'bodyweight', '体重'],
  ['bmi', 'bodymassindex', '体质指数'],
  ['waist', 'waistcircum', 'waistcircumference', '腰围'],
  ['diagnosis', 'diag', 'diagnosisdate', '诊断'],
  ['symptom', 'symptomduration', '症状'],
  ['chiefcomplaint', 'chiefcomplaint', '主诉'],
  ['detectionmethod', 'findway', '发现方式', '检出方式'],
  ['stain', 'stainingmethod', '染色方法'],
  ['lugol', 'lugolgrade', '卢戈氏碘染色'],
  ['anesthesia', 'anes', 'anesflag', '麻醉'],
  ['ct', 'ctscan', 'ctscan', '计算机断层扫描'],
  ['mri', 'magneticresonance', '磁共振'],
  ['us', 'ultrasound', '超声检查'],
  ['lab', 'labno', 'labdate', '实验室', '检验'],
  ['score', '评分'],
  ['occ', 'occurrence', '出现次数'],
]

const ROOT: Record<string, string> = {}
for (const group of SYNONYM_GROUPS) {
  const root = group[0]
  for (const term of group) ROOT[term.toLowerCase()] = root
}

const METHOD_OF: Record<keyof ScoreBreakdown, MatchMethod> = {
  name: '字段名规则',
  abbr: '英文缩写',
  synonym: '同义词词典',
  semantic: '语义相似度',
  structure: '结构约束',
}

/* ---------- 文本工具 ---------- */

/** 分词：拆分驼峰 / 下划线 / 标点，仅保留字母数字 */
function tokenize(text: string): string[] {
  const normalized = text.replace(/([a-z0-9])([A-Z])/g, '$1 $2').toLowerCase()
  return normalized.match(/[a-z0-9]+/g) ?? []
}

/** 同义词归一 */
function canonical(tokens: string[]): string[] {
  return [...new Set(tokens.map((t) => ROOT[t] ?? t))]
}

/** 字符二元组集合 */
function bigrams(text: string): Set<string> {
  const chars = text.toLowerCase().replace(/[^a-z0-9一-龥]/g, '').split('')
  const out = new Set<string>()
  if (chars.length === 1) out.add(chars[0] + '#')
  for (let i = 0; i < chars.length - 1; i += 1) out.add(chars[i] + chars[i + 1])
  return out
}

/** Dice 系数 */
function dice(a: Set<string>, b: Set<string>): number {
  if (!a.size || !b.size) return 0
  let hit = 0
  for (const x of a) if (b.has(x)) hit += 1
  return (2 * hit) / (a.size + b.size)
}

/* ---------- 数据类型归一 ---------- */

const TYPE_GROUP: Record<string, string> = {
  数值型: '数值', 整数型: '数值', 浮点型: '数值', 小数型: '数值',
  字符串型: '字符', 文本型: '字符', 字符型: '字符',
  时间: '时间', 日期型: '时间', 日期时间: '时间', 时间戳: '时间',
  布尔型: '布尔', 枚举型: '枚举', 类别型: '枚举',
}

function typeGroupOf(text: string): string {
  if (!text) return ''
  const key = text.trim()
  if (TYPE_GROUP[key]) return TYPE_GROUP[key]
  for (const [name, group] of Object.entries(TYPE_GROUP)) if (key.includes(name)) return group
  return ''
}

function typeScore(srcType: string, stdType: string): number {
  const a = typeGroupOf(srcType)
  const b = typeGroupOf(stdType)
  if (!a || !b) return 0.7
  if (a === b) return 1
  if ((a === '数值' && b === '字符') || (a === '字符' && b === '数值')) return 0.5
  return 0.2
}

/* ---------- 匹配分量 ---------- */

function scoreOf(input: MatchingInput, std: StandardField): { breakdown: ScoreBreakdown; score: number } {
  const srcTokens = tokenize(input.field)
  // 整体词根命中：patientNo / patient_no 这类整词等价于 id / name 等词根
  const wholeRoot = ROOT[input.field.toLowerCase()] ?? ''
  const srcCore = [...srcTokens.filter((t) => !GENERIC.has(t)), wholeRoot].filter(Boolean)
  const srcKey = canonical(srcCore.length ? srcCore : srcTokens)
  const srcAll = [...new Set([...canonical(srcTokens), wholeRoot].filter(Boolean))]
  const srcText = [input.field, input.desc, input.type, input.sample].filter(Boolean).join(' ')

  const stdTokens = [...new Set([...tokenize(std.code), ...tokenize(std.en)])]
  const stdKey = canonical(stdTokens)
  const stdAll = [...new Set([...stdKey, ...tokenize(std.cn)])]

  // 1. 字段名规则：核心 token 完全命中 > 含通用后缀命中 > 前缀 > 部分重叠
  // 通用后缀（code/no/flag…）单独命中不计入全等分，避免 <>XXX_NO → XXX_NO 类误配
  const coreHit = srcKey.some((t) => stdAll.includes(t))
  const allHit = srcAll.some((t) => stdAll.some((c) => !GENERIC.has(c) && c === t))
  const prefixHit = srcAll.some((t) => stdAll.some((c) => c.length >= 3 && (t.startsWith(c) || c.startsWith(t))))
  const overlap = new Set(srcAll.filter((t) => stdAll.includes(t))).size
  const name = coreHit
    ? 1
    : allHit
      ? 0.6
      : prefixHit
        ? 0.35
        : overlap
          ? Math.min(0.4, (overlap / Math.max(1, srcAll.length)) * 0.6)
          : 0

  // 2. 英文缩写
  const codeTokens = tokenize(std.code)
  const abbr = srcKey.some((t) => codeTokens.includes(t))
    ? 1
    : srcAll.some((t) => codeTokens.some((c) => !GENERIC.has(c) && c === t))
      ? 0.85
      : srcAll.some((t) => codeTokens.some((c) => c.length >= 3 && (t.startsWith(c) || c.startsWith(t))))
        ? 0.7
        : srcAll.some((t) => codeTokens.some((c) => c.length >= 4 && (t.includes(c) || c.includes(t))))
          ? 0.45
          : 0

  // 3. 同义词词典
  const synonym = srcKey.some((t) => stdKey.includes(t))
    ? 1
    : srcAll.some((t) => stdAll.some((s) => ROOT[t] && ROOT[s] === ROOT[t]))
      ? 0.8
      : dice(bigrams(input.desc), bigrams(std.cn))
        ? Math.min(0.6, dice(bigrams(input.desc), bigrams(std.cn)) * 1.2)
        : 0

  // 4. 语义相似度
  const semantic = dice(bigrams(srcText), bigrams([std.cn, std.en, std.domain, std.category].join(' ')))

  // 5. 结构约束
  const typeM = typeScore(input.type ?? '', std.dataType)
  const domainM = std.domain
    ? canonical(tokenize(std.domain)).some((t) => srcKey.includes(t) || srcAll.includes(t))
      ? 1
      : 0.55
    : 0.6
  const catM = input.category
    ? input.category === std.category
      ? 1
      : 0.45
    : 0.35
  const structure = typeM * 0.4 + domainM * 0.3 + catM * 0.3

  const breakdown: ScoreBreakdown = { name, abbr, synonym, semantic, structure }
  const score = Math.min(
    1,
    Object.entries(WEIGHTS).reduce((sum, [key, w]) => sum + w * breakdown[key as keyof ScoreBreakdown], 0),
  )
  return { breakdown, score }
}

/** 主导匹配方式 = 贡献最大的分量 */
function dominantMethod(breakdown: ScoreBreakdown): MatchMethod {
  let best: keyof ScoreBreakdown = 'name'
  let bestValue = -1
  for (const key of Object.keys(WEIGHTS) as (keyof ScoreBreakdown)[]) {
    const value = breakdown[key] * WEIGHTS[key]
    if (value > bestValue) {
      bestValue = value
      best = key
    }
  }
  return METHOD_OF[best]
}

/**
 * 混合 Schema Matching：返回候选标准字段（默认 Top3）
 * 低分候选直接过滤，不进入待确认队列
 */
export function matchCandidates(
  input: MatchingInput,
  pool: StandardField[],
  topN = 3,
  minScore = 35,
): Candidate[] {
  const scored = pool.map((std) => {
    const { breakdown, score } = scoreOf(input, std)
    return {
      standard: std,
      score: Math.round(score * 1000) / 10,
      method: dominantMethod(breakdown),
      breakdown,
    }
  })
  return scored
    .filter((c) => c.score >= minScore)
    .sort((a, b) => b.score - a.score || a.standard.code.localeCompare(b.standard.code))
    .slice(0, topN)
}

/** 按标准编码取字段 */
export function findByCode(pool: StandardField[], code: string): StandardField | undefined {
  return pool.find((f) => f.code === code)
}
