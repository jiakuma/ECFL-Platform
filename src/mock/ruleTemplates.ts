/* ============================================================
   标准化规则模型 + 规则模板库（继承与复用）
   规则不以「字段」为单位重复配置，而是绑定到标准字段 + 源特征：
     同一标准字段、同源值域/单位/格式 → 直接复用已有模板
   ============================================================ */

/** 标准化规则类型（字段映射阶段生成，覆盖标准数据生产的全部转换形态） */
export type FieldRuleType = '直接映射' | '值域映射' | '格式转换' | '单位转换' | '编码转换'
export const fieldRuleTypes: FieldRuleType[] = ['直接映射', '值域映射', '格式转换', '单位转换', '编码转换']

/** 规则状态 */
export type RuleStatus = '未生成' | '已自动生成' | '待人工处理' | '已配置'
export const ruleStatuses: RuleStatus[] = ['未生成', '已自动生成', '待人工处理', '已配置']

export const ruleStatusTag: Record<RuleStatus, 'info' | 'success' | 'warning' | 'primary'> = {
  未生成: 'info',
  已自动生成: 'success',
  待人工处理: 'warning',
  已配置: 'primary',
}

/** 值域 / 编码映射条目 */
export interface RuleEntry {
  src: string
  dst: string
}

/** 标准化规则 */
export interface StdRule {
  type: FieldRuleType
  /** 值域映射 / 编码转换条目 */
  map: RuleEntry[]
  /** 格式转换：源格式 */
  formatFrom: string
  /** 格式转换：标准格式（统一 ISO 8601） */
  formatTo: string
  /** 单位转换 */
  unitFrom: string
  unitTo: string
  factor: string
  /** 转换表达式：value × 10 */
  expression: string
  /** 规则说明 */
  note: string
  /** 复用模板 id，null = 独立规则 */
  templateId: string | null
  /** 生成来源：自动推导 / 模板复用 / 人工配置 */
  origin: 'auto' | 'template' | 'manual'
  status: RuleStatus
  /** 转人工原因 */
  reason: string
  /** 待人工补齐的标准值候选 */
  pendingTargets: string[]
}

export function emptyStdRule(type: FieldRuleType = '直接映射'): StdRule {
  return {
    type,
    map: [],
    formatFrom: '',
    formatTo: '',
    unitFrom: '',
    unitTo: '',
    factor: '',
    expression: '',
    note: '',
    templateId: null,
    origin: 'manual',
    status: '未生成',
    reason: '',
    pendingTargets: [],
  }
}

/* ---------- 规则模板 ---------- */

export interface RuleTemplate {
  id: string
  /** 模板名称 */
  name: string
  /** 绑定的标准字段编码，'*' = 通用（如日期格式标准化） */
  standardCode: string
  /** 标准数据类型 */
  dataType: string
  /** 标准值域 */
  domain: string
  /** 标准单位 */
  unit: string
  type: FieldRuleType
  map: RuleEntry[]
  formatFrom?: string
  formatTo?: string
  unitFrom?: string
  unitTo?: string
  factor?: string
  /** 转换表达式 */
  expression?: string
  /** 规则说明 */
  note?: string
  /** 是否启用 */
  enabled: boolean
  /** 已被复用次数 */
  usage: number
  /**
   * 复用匹配键（源侧特征）：
   *   VALUES:1|2  源值域
   *   UNIT:g/dL   源单位
   *   DATE:YYYYMMDD 源日期格式
   * 全部命中才复用；为空数组表示无条件（同标准字段即可复用）
   */
  matchKeys: string[]
}

const P = (src: string, dst: string): RuleEntry => ({ src, dst })

export const ruleTemplates: RuleTemplate[] = [
  /* ---- 性别：三种源编码体系，后续同标准字段可直接复用 ---- */
  {
    id: 'TPL_SEX_1_2_CN', name: 'SEX_1_2_CN', standardCode: 'SEX', dataType: '字符串型', domain: '男，女', unit: '',
    type: '值域映射', map: [P('1', '男'), P('2', '女')], enabled: true, usage: 0, matchKeys: ['VALUES:1|2'],
  },
  {
    id: 'TPL_SEX_MF_CN', name: 'SEX_MF_CN', standardCode: 'SEX', dataType: '字符串型', domain: '男，女', unit: '',
    type: '值域映射', map: [P('M', '男'), P('F', '女')], enabled: true, usage: 0, matchKeys: ['VALUES:F|M'],
  },
  {
    id: 'TPL_SEX_MALE_FEMALE', name: 'SEX_MALE_FEMALE', standardCode: 'SEX', dataType: '字符串型', domain: '男，女', unit: '',
    type: '值域映射', map: [P('male', '男'), P('female', '女')], enabled: true, usage: 0, matchKeys: ['VALUES:female|male'],
  },

  /* ---- 日期：统一 ISO 8601，与具体标准字段无关 ---- */
  {
    id: 'TPL_DATE_YYYYMMDD_ISO', name: 'DATE_YYYYMMDD_ISO', standardCode: '*', dataType: '时间', domain: '', unit: '',
    type: '格式转换', map: [], formatFrom: 'YYYYMMDD', formatTo: 'YYYY-MM-DD', expression: 'YYYYMMDD → YYYY-MM-DD',
    note: '统一为 ISO 8601 日期格式', enabled: true, usage: 0, matchKeys: ['DATE:YYYYMMDD'],
  },
  {
    id: 'TPL_DATE_SLASH_ISO', name: 'DATE_SLASH_ISO', standardCode: '*', dataType: '时间', domain: '', unit: '',
    type: '格式转换', map: [], formatFrom: 'YYYY/MM/DD', formatTo: 'YYYY-MM-DD', expression: 'YYYY/MM/DD → YYYY-MM-DD',
    note: '统一为 ISO 8601 日期格式', enabled: true, usage: 0, matchKeys: ['DATE:YYYY/MM/DD'],
  },
  {
    id: 'TPL_DATE_TIMESTAMP_ISO', name: 'DATE_TIMESTAMP_ISO', standardCode: '*', dataType: '时间', domain: '', unit: '',
    type: '格式转换', map: [], formatFrom: 'TIMESTAMP', formatTo: 'YYYY-MM-DD', expression: 'TIMESTAMP → YYYY-MM-DD',
    note: 'Unix 时间戳转 ISO 8601', enabled: true, usage: 0, matchKeys: ['DATE:TIMESTAMP'],
  },
  {
    id: 'TPL_DATE_ISO_DIRECT', name: 'DATE_ISO_DIRECT', standardCode: '*', dataType: '时间', domain: '', unit: '',
    type: '直接映射', map: [], formatFrom: 'YYYY-MM-DD', formatTo: 'YYYY-MM-DD',
    note: '源已是 ISO 8601，无需转换', enabled: true, usage: 0, matchKeys: ['DATE:YYYY-MM-DD'],
  },

  /* ---- 单位换算 ---- */
  {
    id: 'TPL_GLU_MGDL_MMOLL', name: 'GLU_MGDL_MMOLL', standardCode: 'FBG', dataType: '数值型', domain: '正整数', unit: 'mmol/L',
    type: '单位转换', map: [], unitFrom: 'mg/dL', unitTo: 'mmol/L', factor: '÷18', expression: 'value ÷ 18',
    note: '血糖 mg/dL → mmol/L', enabled: true, usage: 0, matchKeys: ['UNIT:mg/dL'],
  },
  {
    id: 'TPL_LEN_CM_MM', name: 'LEN_CM_MM', standardCode: 'EUS_DEPTH', dataType: '数值型', domain: '正整数', unit: 'mm',
    type: '单位转换', map: [], unitFrom: 'cm', unitTo: 'mm', factor: '×10', expression: 'value × 10',
    note: '长度 cm → mm', enabled: true, usage: 0, matchKeys: ['UNIT:cm'],
  },
  {
    id: 'TPL_LEN_MM_CM', name: 'LEN_MM_CM', standardCode: 'LESION_LEN', dataType: '数值型', domain: '正整数', unit: 'cm',
    type: '单位转换', map: [], unitFrom: 'mm', unitTo: 'cm', factor: '÷10', expression: 'value ÷ 10',
    note: '长度 mm → cm', enabled: true, usage: 0, matchKeys: ['UNIT:mm'],
  },
  {
    id: 'TPL_DUR_DAY_MONTH', name: 'DUR_DAY_MONTH', standardCode: 'SYM_DUR', dataType: '数值型', domain: '正整数', unit: '月',
    type: '单位转换', map: [], unitFrom: '天', unitTo: '月', factor: '÷30', expression: 'value ÷ 30',
    note: '时长 天 → 月', enabled: true, usage: 0, matchKeys: ['UNIT:天'],
  },

  /* ---- 布尔型 / 阴性阳性：多个标准字段共用同一值域形态 ---- */
  {
    id: 'TPL_BOOL_0_1_YESNO', name: 'BOOL_0_1_YESNO', standardCode: '*', dataType: '布尔型', domain: '是，否', unit: '',
    type: '值域映射', map: [P('0', '否'), P('1', '是')], enabled: true, usage: 0, matchKeys: ['VALUES:0|1'],
  },
  {
    id: 'TPL_BOOL_0_1_NONE', name: 'BOOL_0_1_NONE', standardCode: '*', dataType: '布尔型', domain: '无，有', unit: '',
    type: '值域映射', map: [P('0', '无'), P('1', '有')], enabled: true, usage: 0, matchKeys: ['VALUES:0|1'],
  },
  {
    id: 'TPL_BOOL_FALSE_TRUE', name: 'BOOL_FALSE_TRUE', standardCode: '*', dataType: '布尔型', domain: '是，否', unit: '',
    type: '值域映射', map: [P('false', '否'), P('true', '是')], enabled: true, usage: 0, matchKeys: ['VALUES:false|true'],
  },
  {
    id: 'TPL_NEG_POS_0_1', name: 'NEG_POS_0_1', standardCode: '*', dataType: '字符串型', domain: '阴性，阳性', unit: '',
    type: '值域映射', map: [P('0', '阴性'), P('1', '阳性')], enabled: true, usage: 0, matchKeys: ['VALUES:0|1'],
  },
  {
    id: 'TPL_NEG_POS_EN', name: 'NEG_POS_EN', standardCode: '*', dataType: '字符串型', domain: '阴性，阳性', unit: '',
    type: '值域映射', map: [P('negative', '阴性'), P('positive', '阳性')], enabled: true, usage: 0,
    matchKeys: ['VALUES:negative|positive'],
  },
  {
    id: 'TPL_NEG_POS_NEGPOS', name: 'NEG_POS_NEGPOS', standardCode: '*', dataType: '字符串型', domain: '阴性，阳性', unit: '',
    type: '值域映射', map: [P('NEG', '阴性'), P('POS', '阳性')], enabled: true, usage: 0, matchKeys: ['VALUES:NEG|POS'],
  },

  /* ---- 具体枚举值域 ---- */
  {
    id: 'TPL_MARITAL_1_4', name: 'MARITAL_1_4', standardCode: 'MARITAL', dataType: '字符串型', domain: '未婚，已婚，离婚，丧偶', unit: '',
    type: '值域映射', map: [P('1', '未婚'), P('2', '已婚'), P('3', '离婚'), P('4', '丧偶')], enabled: true, usage: 0,
    matchKeys: ['VALUES:1|2|3|4'],
  },
  {
    id: 'TPL_MARITAL_10_40', name: 'MARITAL_10_40', standardCode: 'MARITAL', dataType: '字符串型', domain: '未婚，已婚，离婚，丧偶', unit: '',
    type: '值域映射', map: [P('10', '未婚'), P('20', '已婚'), P('30', '离异'), P('40', '丧偶')], enabled: true, usage: 0,
    matchKeys: ['VALUES:10|20|30|40'],
  },
  {
    id: 'TPL_MARITAL_U_M_D_W', name: 'MARITAL_U_M_D_W', standardCode: 'MARITAL', dataType: '字符串型', domain: '未婚，已婚，离婚，丧偶', unit: '',
    type: '值域映射', map: [P('U', '未婚'), P('M', '已婚'), P('D', '离婚'), P('W', '丧偶')], enabled: true, usage: 0,
    matchKeys: ['VALUES:D|M|U|W'],
  },
  {
    id: 'TPL_INSURANCE_1_3', name: 'INSURANCE_1_3', standardCode: 'INSURANCE', dataType: '字符串型', domain: '', unit: '',
    type: '值域映射', map: [P('1', '城镇职工医保'), P('2', '城镇居民医保'), P('3', '新农合')], enabled: true, usage: 0,
    matchKeys: ['VALUES:1|2|3'],
  },
  {
    id: 'TPL_STAIN_01_02', name: 'STAIN_01_02', standardCode: 'STAIN', dataType: '字符串型', domain: '', unit: '',
    type: '编码转换', map: [P('01', '卢戈氏碘染色'), P('02', '电子染色'), P('00', '无染色')], enabled: true, usage: 0,
    matchKeys: ['VALUES:00|01|02'],
  },
  {
    id: 'TPL_STAIN_CODE', name: 'STAIN_CODE', standardCode: 'STAIN', dataType: '字符串型', domain: '', unit: '',
    type: '编码转换', map: [P('LUGOL', '卢戈氏碘染色'), P('NBI', '电子染色'), P('NONE', '无染色')], enabled: true, usage: 0,
    matchKeys: ['VALUES:LUGOL|NBI|NONE'],
  },
  {
    id: 'TPL_GRADE_1_9', name: 'GRADE_1_9', standardCode: 'GRADE', dataType: '字符串型', domain: 'G1，G2，G3，Gx', unit: '',
    type: '编码转换', map: [P('1', 'G1'), P('2', 'G2'), P('3', 'G3'), P('9', 'Gx')], enabled: true, usage: 0,
    matchKeys: ['VALUES:1|2|3|9'],
  },
  {
    id: 'TPL_ENDO_LOC_1_5', name: 'ENDO_LOC_1_5', standardCode: 'ENDO_LOC', dataType: '字符串型', domain: '', unit: '',
    type: '编码转换',
    map: [P('1', '颈段'), P('2', '上段'), P('3', '中段'), P('4', '下段'), P('5', '贲门')], enabled: true, usage: 0,
    matchKeys: ['VALUES:1|2|3|4|5'],
  },
  {
    id: 'TPL_ENDO_LOC_CODE', name: 'ENDO_LOC_CODE', standardCode: 'ENDO_LOC', dataType: '字符串型', domain: '', unit: '',
    type: '编码转换',
    map: [P('UPPER', '上段'), P('MIDDLE', '中段'), P('LOWER', '下段')], enabled: true, usage: 0,
    matchKeys: ['VALUES:LOWER|MIDDLE|UPPER'],
  },
  {
    id: 'TPL_MET_SITE_1_4', name: 'MET_SITE_1_4', standardCode: 'MET_SITE', dataType: '字符串型', domain: '', unit: '',
    type: '值域映射', map: [P('1', '肝'), P('2', '肺'), P('3', '骨'), P('4', '远处淋巴结')], enabled: true, usage: 0,
    matchKeys: ['VALUES:1|2|3|4'],
  },
  {
    id: 'TPL_PATH_TYPE_1_3', name: 'PATH_TYPE_1_3', standardCode: 'PATH_TYPE', dataType: '字符串型', domain: '', unit: '',
    type: '值域映射', map: [P('1', '活检'), P('2', '内镜下切除（EMR/ESD）'), P('3', '手术')], enabled: true, usage: 0,
    matchKeys: ['VALUES:1|2|3'],
  },
  {
    id: 'TPL_FU_STATUS_1_3', name: 'FU_STATUS_1_3', standardCode: 'FU_STATUS', dataType: '字符串型', domain: '', unit: '',
    type: '值域映射', map: [P('1', '存活'), P('2', '失访'), P('3', '死亡')], enabled: true, usage: 0,
    matchKeys: ['VALUES:1|2|3'],
  },
  {
    id: 'TPL_DETECT_1_3', name: 'DETECT_1_3', standardCode: 'DETECT_METHOD', dataType: '字符串型', domain: '', unit: '',
    type: '值域映射', map: [P('1', '筛查发现'), P('2', '症状就诊'), P('3', '体检发现')], enabled: true, usage: 0,
    matchKeys: ['VALUES:1|2|3'],
  },
  {
    id: 'TPL_OS_CENSOR_0_1', name: 'OS_CENSOR_0_1', standardCode: 'OS_CENSOR', dataType: '布尔型', domain: '', unit: '',
    type: '值域映射', map: [P('0', '删失'), P('1', '死亡')], enabled: true, usage: 0, matchKeys: ['VALUES:0|1'],
  },
  {
    id: 'TPL_INV_DEPTH_SM', name: 'INV_DEPTH_SM', standardCode: 'INV_DEPTH', dataType: '字符串型', domain: '', unit: '',
    type: '编码转换',
    map: [
      P('M1', 'M1（上皮内）'), P('M2', 'M2（固有层）'), P('M3', 'M3（黏膜肌层）'),
      P('SM1', 'SM1（<200μm）'), P('SM2', 'SM2（≥200μm）'),
    ],
    enabled: true, usage: 0, matchKeys: ['VALUES:M1|M2|M3|SM1|SM2'],
  },
  {
    id: 'TPL_TRG_0_3', name: 'TRG_0_3', standardCode: 'TRG', dataType: '字符串型', domain: '', unit: '',
    type: '编码转换', map: [P('0', 'TRG0'), P('1', 'TRG1'), P('2', 'TRG2'), P('3', 'TRG3')], enabled: true, usage: 0,
    matchKeys: ['VALUES:0|1|2|3'],
  },
  {
    id: 'TPL_CT_TYPE_0_1', name: 'CT_TYPE_0_1', standardCode: 'CT_TYPE', dataType: '字符串型', domain: '', unit: '',
    type: '值域映射', map: [P('0', '平扫'), P('1', '增强')], enabled: true, usage: 0, matchKeys: ['VALUES:0|1'],
  },
  {
    id: 'TPL_IEN_1_3', name: 'IEN_1_3', standardCode: 'IEN', dataType: '字符串型', domain: '', unit: '',
    type: '值域映射', map: [P('1', '低级别'), P('2', '高级别'), P('3', '不能分类')], enabled: true, usage: 0,
    matchKeys: ['VALUES:1|2|3'],
  },
  {
    id: 'TPL_LUGOL_1_4', name: 'LUGOL_1_4', standardCode: 'LUGOL', dataType: '字符串型', domain: '', unit: '',
    type: '编码转换', map: [P('1', 'I级'), P('2', 'II级'), P('3', 'III级'), P('4', 'IV级')], enabled: true, usage: 0,
    matchKeys: ['VALUES:1|2|3|4'],
  },
]

/* ---------- 模板匹配 ---------- */

/** 源侧特征签名 */
export interface TemplateContext {
  standardCode: string
  sourceValues: string[]
  unitFrom: string | null
  dateFormat: string | null
}

function valueKey(values: string[]): string {
  return `VALUES:${[...values].sort().join('|')}`
}

/** 查找可复用模板：绑定同一标准字段（或通用模板）且源特征完全命中 */
export function findTemplate(ctx: TemplateContext): RuleTemplate | null {
  const keys = new Set<string>()
  if (ctx.sourceValues.length) keys.add(valueKey(ctx.sourceValues))
  if (ctx.unitFrom) keys.add(`UNIT:${ctx.unitFrom}`)
  if (ctx.dateFormat) keys.add(`DATE:${ctx.dateFormat}`)

  const candidates = ruleTemplates.filter(
    (t) => t.enabled && (t.standardCode === ctx.standardCode || t.standardCode === '*'),
  )
  // 绑定具体标准字段的模板优先于通用模板
  const sorted = [...candidates].sort((a, b) => {
    if (a.standardCode === '*' && b.standardCode !== '*') return 1
    if (b.standardCode === '*' && a.standardCode !== '*') return -1
    return 0
  })
  for (const t of sorted) {
    if (!t.matchKeys.length) return t
    if (t.matchKeys.every((k) => keys.has(k))) return t
  }
  return null
}

/** 模板 → 规则 */
export function ruleFromTemplate(t: RuleTemplate): StdRule {
  return {
    type: t.type,
    map: t.map.map((e) => ({ ...e })),
    formatFrom: t.formatFrom ?? '',
    formatTo: t.formatTo ?? '',
    unitFrom: t.unitFrom ?? '',
    unitTo: t.unitTo ?? '',
    factor: t.factor ?? '',
    expression: t.expression ?? '',
    note: t.note ?? `复用模板 ${t.name}`,
    templateId: t.id,
    origin: 'template',
    status: '已自动生成',
    reason: '',
    pendingTargets: [],
  }
}

/** 累计复用次数 */
export function markTemplateUsage(id: string): void {
  const t = ruleTemplates.find((x) => x.id === id)
  if (t) t.usage += 1
}

/** 将当前规则另存为模板，供后续数据源复用 */
export function saveAsTemplate(input: {
  name: string
  standardCode: string
  dataType: string
  domain: string
  unit: string
  rule: StdRule
  sourceValues: string[]
  unitFrom: string | null
  dateFormat: string | null
}): RuleTemplate {
  const matchKeys: string[] = []
  // 模板按「源侧特征」复用：源值域优先取 manifests 值，其次取已配映射的源值
  const values = input.sourceValues.length
    ? input.sourceValues
    : input.rule.map.map((e) => e.src).filter(Boolean)
  if (values.length) matchKeys.push(valueKey(values))
  if (input.rule.type === '单位转换' && input.rule.unitFrom) matchKeys.push(`UNIT:${input.rule.unitFrom}`)
  if (input.rule.type === '格式转换' && input.rule.formatFrom) matchKeys.push(`DATE:${input.rule.formatFrom}`)

  const id = `TPL_${input.name.toUpperCase().replace(/[^A-Z0-9_]/g, '_')}_${ruleTemplates.length}`
  const tpl: RuleTemplate = {
    id,
    name: input.name,
    standardCode: input.standardCode,
    dataType: input.dataType,
    domain: input.domain,
    unit: input.unit,
    type: input.rule.type,
    map: input.rule.map.map((e) => ({ ...e })),
    formatFrom: input.rule.formatFrom,
    formatTo: input.rule.formatTo,
    unitFrom: input.rule.unitFrom,
    unitTo: input.rule.unitTo,
    factor: input.rule.factor,
    expression: input.rule.expression,
    note: input.rule.note,
    enabled: true,
    usage: 0,
    matchKeys,
  }
  ruleTemplates.unshift(tpl)
  return tpl
}

/** 规则摘要（表格不在列表展开，仅在抽屉/查看规则展示） */
export function ruleSummary(rule: StdRule): string {
  switch (rule.type) {
    case '直接映射':
      return '源值与标准定义完全一致，原样写入'
    case '值域映射':
      return rule.map.length ? rule.map.map((e) => `${e.src}→${e.dst}`).join('，') : '值域映射（待补全）'
    case '格式转换':
      return `${rule.formatFrom || '?'} → ${rule.formatTo || '?'}`
    case '单位转换':
      return `${rule.unitFrom || '?'} → ${rule.unitTo || '?'}（${rule.expression || 'value × 1'}）`
    case '编码转换':
      return rule.map.length ? rule.map.map((e) => `${e.src}→${e.dst}`).join('，') : '编码转换（待补全）'
    default:
      return rule.note || '—'
  }
}
