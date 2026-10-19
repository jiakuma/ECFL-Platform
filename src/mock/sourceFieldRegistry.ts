/* ============================================================
   机构源字段清单 —— 只登记该机构实际提供的源字段
   系统不再为每家机构生成 338 条待配置记录，
   映射对象一律是「机构实际存在的源字段」
   ============================================================ */

import { orgSourceMap } from './orgSourceFields'
import { standardFields } from './esophagusMetadata'

export interface SourceFieldDef {
  /** 源字段名 */
  field: string
  /** 源字段描述（原系统语义） */
  desc: string
  /** 源字段数据类型推断值 */
  type: string
  /** 机构原始登记所指向的标准编码 */
  codes: string[]
  /** 排序用顺序 */
  order: number
  /** 源字段画像：源侧实际单位 / 值域 / 日期格式 / 编码体系 */
  profile: SourceProfile
}

/* ============================================================
   源字段画像（Source Profiling）
   真实环境中由数据探查（采样统计）得到，这里由机构登记信息解析：
     源值域、源单位、日期格式、是否使用本地编码体系
   这是「自动生成标准化规则」的唯一输入，规则推导不做猜测
   ============================================================ */

export type SourceRuleKind = '直接映射' | '值域映射' | '编码转换' | '格式转换' | '单位转换'

export interface SourceProfile {
  /** 源侧登记的规则原文 */
  ruleText: string
  /** 源侧规则类别 */
  ruleType: SourceRuleKind
  /** 源侧数据类型（可能与标准类型不一致） */
  sourceType: string
  /** 源值域样本（离散枚举），为空表示未识别到枚举 */
  sourceValues: string[]
  /** 源值 → 目标值 线索对 */
  pairs: { src: string; dst: string }[]
  /** 源日期格式：YYYYMMDD / YYYY/MM/DD / YYYY-MM-DD / TIMESTAMP */
  dateFormat: string | null
  /** 源单位 */
  unitFrom: string | null
  /** 目标单位（源侧声明） */
  unitTo: string | null
  /** 换算系数：×10 / ÷30 */
  factor: string | null
  /** 编码体系：LOINC / ICD-10 / AJCC8 等 */
  codeSystem: string | null
  /** 编码取值 */
  codeValue: string | null
  /** 源侧信息不足，系统无法可靠确定规则 → 待人工处理 */
  needsReview: boolean
  /** 需人工处理的原因 */
  reviewReason: string
}

/** 源字段名 token → 中文语义 */
const TOKEN_CN: Record<string, string> = {
  address: '地址', at: '', afp: '甲胎蛋白', age: '年龄', anes: '麻醉', anesthesia: '麻醉',
  anti: '抗', biopsy: '活检', birth: '出生', bmi: '体质指数', body: '身体',
  ca125: '糖类抗原125', ca199: '糖类抗原19-9', ca724: '糖类抗原72-4', cancer: '癌',
  card: '心脏', cea: '癌胚抗原', censor: '删失', chief: '主诉', chol: '总胆固醇',
  circum: '围度', clin: '临床', clinical: '临床', cm: '临床M分期', cn: '临床N分期',
  code: '代码', complaint: '主诉', count: '数量', ct: 'CT', cyfra211: '细胞角蛋白19片段',
  date: '日期', days: '天', death: '死亡', depth: '深度', desc: '描述',
  detection: '检测', dfs: '无进展生存', diag: '诊断', diagnosis: '诊断', duration: '时长',
  early: '早期', ecog: '体力状况', edu: '教育', education: '教育', endo: '内镜',
  endoscopy: '内镜检查', ethnicity: '民族', eus: '超声内镜', exam: '检查', examined: '检查',
  fbg: '空腹血糖', find: '发现', flag: '标志', followup: '随访', fu: '随访',
  g17: '胃泌素17', gender: '性别', glu: '血糖', grade: '分级', group: '分组',
  hbsag: '乙型肝炎表面抗原', hcv: '丙型肝炎抗体', hdl: '高密度脂蛋白', height: '身高',
  hist: '组织学', histo: '组织学', histologic: '组织学', histology: '组织学',
  hp: '幽门螺杆菌', ien: '上皮内瘤变', id: '标识', insurance: '医保', invasion: '浸润',
  lab: '检验', lamina: '切片', last: '最近', ldl: '低密度脂蛋白', length: '长度',
  lesion: '病灶', level: '级别', line: '项', ln: '淋巴结', loc: '位置',
  location: '位置', lugol: '卢戈氏碘', lvi: '脉管侵犯', lymph: '淋巴', m: 'M分期',
  margin: '切缘', marital: '婚姻', marriage: '婚姻', met: '转移', metastasis: '转移',
  method: '方法', n: 'N分期', name: '姓名', nation: '民族', national: '证件',
  native: '籍贯', no: '编号', nodes: '淋巴结', nse: '神经元特异性烯醇化酶', obs: '观测值',
  os: '总生存', path: '病理', pathologic: '病理', pathology: '病理', patient: '患者',
  pfs: '无进展生存期', pg1: '胃蛋白酶原I', pgr: '胃蛋白酶原比值', phone: '电话',
  place: '地区', pn: '病理N分期', pos: '部位', positive: '阳性', pt: '病理T分期',
  recur: '复发', recurrence: '复发', report: '报告', scan: '扫描', scc: '鳞状细胞癌抗原',
  score: '评分', seq: '序号', sex: '性别', site: '部位', spec: '标本',
  specimen: '标本', stage: '分期', stain: '染色', staining: '染色', state: '状态',
  status: '状态', surv: '生存', sym: '症状', symptom: '症状', t: 'T分期',
  telecom: '通讯', test: '检测', tg: '甘油三酯', times: '次', tnm: '国际分期',
  total: '总数', trg: '肿瘤退缩分级', type: '类型', us: '超声', vital: '生命',
  waist: '腰围', way: '方式', weight: '体重', y: '年',
}

/** 拆分驼峰 / 下划线，保留原始大小写词 */
function splitTokens(field: string): string[] {
  return field.replace(/([a-z0-9])([A-Z])/g, '$1 $2').split(/[^A-Za-z0-9]+/).filter(Boolean)
}

/** 源字段描述：token 直译拼接，未收录的 token 原样保留 */
function describe(field: string): string {
  const parts = splitTokens(field).map((t) => TOKEN_CN[t.toLowerCase()] ?? t.toUpperCase())
  return parts.filter(Boolean).join('')
}

/** 标准编码反查（用于推断数据分类与源字段类型） */
const BY_CODE = new Map(standardFields.map((f) => [f.code.toUpperCase(), f]))

/** 由源字段名推断数据分类：命中标准编码即用该分类 */
export function inferCategory(field: string): string {
  const upper = field.toUpperCase()
  for (const token of splitTokens(field)) {
    const hit = BY_CODE.get(token.toUpperCase()) ?? BY_CODE.get(upper)
    if (hit) return hit.category
  }
  return ''
}

/* ---------- 画像解析：把机构登记规则拆成结构化画像 ---------- */

/** 单位 token：允许中文单位（天/月/年）与常见符号，不允许纯数值值域 */
const UNIT_TOKEN = '[\\u4e00-\\u9fa5A-Za-zµμ%][\\w\\u4e00-\\u9fa5µμ%.\\/²³]*'
const UNIT_ARROW_RE = new RegExp(
  `(${UNIT_TOKEN})\\s*→\\s*(${UNIT_TOKEN})\\s*[（(]\\s*([×x*÷\\/])\\s*([\\d.]+)\\s*[）)]`,
)

/** 抽取日期格式 */
function parseDateFormat(rule: string): string | null {
  if (/ISO\s*8601/i.test(rule)) return 'YYYY-MM-DD'
  const m = rule.match(/(YYYYMMDD|YYYY[\/\-.]MM[\/\-.]DD|时间戳|TIMESTAMP)\s*→\s*YYYY-MM-DD/i)
  if (!m) return null
  const raw = m[1].toUpperCase()
  if (raw.includes('时间戳') || raw === 'TIMESTAMP') return 'TIMESTAMP'
  if (raw === 'YYYYMMDD') return 'YYYYMMDD'
  if (raw.includes('/')) return 'YYYY/MM/DD'
  if (raw.includes('.')) return 'YYYY.MM.DD'
  return 'YYYY-MM-DD'
}

/** 抽取单位与换算系数 */
function parseUnit(rule: string): Pick<SourceProfile, 'unitFrom' | 'unitTo' | 'factor'> | null {
  const m = rule.match(UNIT_ARROW_RE)
  if (m) {
    const op = m[3] === '÷' || m[3] === '/' ? '÷' : '×'
    return { unitFrom: m[1], unitTo: m[2], factor: `${op}${m[4]}` }
  }
  const target = rule.match(/(?:统一为|统一)\s*([\u4e00-\u9fa5A-Za-zµμ%][\w\u4e00-\u9fa5µμ%.\/²³]*)/)
  if (target) return { unitFrom: null, unitTo: target[1], factor: null }
  const keep = rule.match(/([\u4e00-\u9fa5A-Za-zµμ%][\w\u4e00-\u9fa5µμ%.\/²³]*)\s*原值保留/)
  if (keep) return { unitFrom: keep[1], unitTo: keep[1], factor: null }
  return null
}

/** 抽取值域 / 编码对应对：a→b，c→d */
function parsePairs(rule: string): { src: string; dst: string }[] {
  return rule
    .split(/[，,]/)
    .map((s) => s.trim())
    .map((s) => {
      const [a, b] = s.split(/\s*→\s*/)
      if (!a || !b) return null
      return { src: a.trim(), dst: b.trim() }
    })
    .filter((x): x is { src: string; dst: string } => x !== null)
}

/** 抽取标准编码体系：LOINC 2039-6 / AJCC 第8版 / ICD-10 等 */
function parseCodeSystem(rule: string): Pick<SourceProfile, 'codeSystem' | 'codeValue'> | null {
  const loinc = rule.match(/LOINC\s*([\d-]+)/i)
  if (loinc) return { codeSystem: 'LOINC', codeValue: loinc[1] }
  if (/ICD-?10/i.test(rule)) return { codeSystem: 'ICD-10', codeValue: null }
  if (/AJCC/i.test(rule)) return { codeSystem: 'AJCC8', codeValue: null }
  if (/WHO/i.test(rule)) return { codeSystem: 'WHO-DIGESTIVE', codeValue: null }
  return null
}

/** 源侧使用「本地代码 → 标准名称」却未给出取值清单 */
function isVagueCoding(rule: string): boolean {
  return /(代码|码|编码)\s*→/.test(rule) || /→\s*(标准|.*?标准值域$)/.test(rule)
}

/** 源侧数据类型推断 */
function inferSourceType(pairs: { src: string; dst: string }[], dateFormat: string | null, unit: string | null, stdType: string): string {
  if (dateFormat) return '字符串型'
  if (pairs.length) {
    const numeric = pairs.every((p) => /^-?\d+(\.\d+)?$/.test(p.src))
    if (numeric) return '数值型'
    if (pairs.every((p) => /^(true|false)$/i.test(p.src))) return '布尔型'
    return '字符串型'
  }
  if (unit) return '数值型'
  return stdType
}

const EMPTY_PROFILE_PART = {
  sourceValues: [] as string[],
  pairs: [] as { src: string; dst: string }[],
  dateFormat: null,
  unitFrom: null,
  unitTo: null,
  factor: null,
  codeSystem: null,
  codeValue: null,
  needsReview: false,
  reviewReason: '',
}

function buildProfile(ruleText: string, ruleType: string, stdType: string): SourceProfile {
  const kind = (ruleType as SourceRuleKind) ?? '直接映射'
  // 日期格式与登记的规则类别无关（存在「直接映射」却声明 ISO 日期的情况），统一先识别
  const dateFormat = parseDateFormat(ruleText)
  const base = { ruleText, ruleType: kind, ...EMPTY_PROFILE_PART, dateFormat }

  /* 1. 单位转换：源 / 目标单位 + 换算系数 */
  if (kind === '单位转换') {
    const u = parseUnit(ruleText)
    if (!u || !u.unitFrom || !u.unitTo) {
      return { ...base, ...u, sourceType: '数值型', needsReview: true, reviewReason: '源单位或换算关系未知' }
    }
    return { ...base, ...u, sourceType: '数值型' }
  }

  /* 2. 格式转换：优先识别日期格式，其次文本 / 数值规整 */
  if (kind === '格式转换') {
    if (base.dateFormat) return { ...base, sourceType: '字符串型' }
    return { ...base, sourceType: inferSourceType([], null, null, stdType) }
  }

  /* 3. 编码转换：LOINC / AJCC / 明确取值清单 → 可自动；本地代码无字典 → 待人工 */
  if (kind === '编码转换') {
    const cs = parseCodeSystem(ruleText)
    const pairs = parsePairs(ruleText)
    // 「学历代码 → 教育程度」这类只登记了类别名、未给出本地取值，不是可用的映射清单
    const vague = pairs.some(
      (p) => /(代码|编码|码)$/.test(p.src) || /(标准|值域|名称|编码)$/.test(p.dst),
    )
    if (pairs.length && !vague) {
      return {
        ...base, ...cs, pairs, sourceValues: pairs.map((p) => p.src),
        sourceType: inferSourceType(pairs, null, null, stdType),
      }
    }
    if (cs?.codeSystem === 'LOINC') {
      return { ...base, ...cs, sourceType: '数值型' }
    }
    // 「M0/M1/Mx 校验后写入」「AJCC 第8版 pT 校验」：源值已是标准值域，仅需值域校验
    if (/校验/.test(ruleText)) {
      return { ...base, ...cs, sourceType: stdType, codeSystem: cs?.codeSystem ?? '值域校验' }
    }
    if (isVagueCoding(ruleText) || cs?.codeSystem === 'WHO-DIGESTIVE') {
      return { ...base, ...cs, sourceType: stdType, needsReview: true, reviewReason: '缺少本地编码 → 标准编码字典' }
    }
    return { ...base, ...cs, sourceType: stdType }
  }

  /* 4. 值域映射：必须有明确的源取值清单才能自动生成 */
  if (kind === '值域映射') {
    const pairs = parsePairs(ruleText)
    if (!pairs.length) {
      return { ...base, sourceType: stdType, needsReview: true, reviewReason: '源值域未登记，无法确定对应关系' }
    }
    return {
      ...base, pairs, sourceValues: pairs.map((p) => p.src),
      sourceType: inferSourceType(pairs, null, null, stdType),
    }
  }

  /* 5. 直接映射：可能仍携带单位信息（如 ng/mL 原值保留） */
  const u = parseUnit(ruleText)
  return { ...base, ...u, sourceType: inferSourceType([], null, u?.unitFrom ?? null, stdType) }
}

/* ---------- 机构源字段清单 ---------- */

/** 机构源字段清单：由 orgSourceMap 反查（源字段 → 已登记的标准编码） */
const inventory = new Map<string, SourceFieldDef[]>()

function build(org: string): SourceFieldDef[] {
  const registered = orgSourceMap[org] ?? {}
  const list: SourceFieldDef[] = []
  for (const [code, entry] of Object.entries(registered)) {
    const idx = list.findIndex((x) => x.field === entry.source)
    if (idx >= 0) {
      if (!list[idx].codes.includes(code)) list[idx].codes.push(code)
      continue
    }
    const std = BY_CODE.get(code.toUpperCase())
    list.push({
      field: entry.source,
      desc: describe(entry.source),
      type: std?.dataType ?? '字符串型',
      codes: [code],
      order: list.length,
      profile: buildProfile(entry.rule ?? '', entry.ruleType ?? '直接映射', std?.dataType ?? '字符串型'),
    })
  }
  return list.sort((a, b) => a.order - b.order)
}

/** 取机构源字段清单 */
export function getSourceFields(org: string): SourceFieldDef[] {
  if (!inventory.has(org)) inventory.set(org, build(org))
  return inventory.get(org)!
}

/** 全部机构 */
export const sourceOrgKeys: string[] = Object.keys(orgSourceMap)
