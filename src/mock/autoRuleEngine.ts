/* ============================================================
   标准化规则自动生成引擎
   输入：源字段画像 + 标准字段定义
   输出：确定性规则，或「待人工处理」标记

   判定优先级：
     1. 多个标准字段含义接近  → 待人工处理
     2. 源侧画像信息不足      → 待人工处理
     3. 规则模板复用          → 已自动生成（继承已有规则）
     4. 标准类型判定          → 日期 → 单位 → 编码 → 值域 → 直接映射
   所有结论均来自确定性字典，未命中字典一律转人工，不做推测
   ============================================================ */

import type { SourceProfile } from './sourceFieldRegistry'
import type { StandardField } from './esophagusMetadata'
import type { Candidate } from './schemaMatching'
import {
  DATE_TARGET_FORMAT,
  STANDARD_CODE_SYSTEM,
  STANDARD_UNIT,
  ajccValueSet,
  domainValues,
  findDateConversion,
  findUnitConversion,
  LOINC_MAP,
  standardCandidates,
} from './stdDictionaries'
import {
  emptyStdRule,
  findTemplate,
  markTemplateUsage,
  ruleFromTemplate,
  type FieldRuleType,
  type StdRule,
} from './ruleTemplates'

export interface RuleInput {
  sourceField: string
  profile: SourceProfile
  standard: StandardField
  /** 候选匹配结果，用于判断「多个标准字段含义接近」 */
  candidates: Candidate[]
}

export type RuleOutcome =
  | { kind: 'ok'; rule: StdRule }
  | { kind: 'review'; rule: StdRule }

/** 候选过于接近时的判定阈值 */
const AMBIGUOUS_GAP = 3
const AMBIGUOUS_MIN = 50

/** 多个标准字段含义接近：候选首名次差过小，不适合系统自动定规则 */
function isAmbiguous(candidates: Candidate[]): boolean {
  const [a, b] = candidates
  if (!a || !b) return false
  return a.score >= AMBIGUOUS_MIN && b.score >= AMBIGUOUS_MIN && a.score - b.score <= AMBIGUOUS_GAP
}

function reviewRule(type: FieldRuleType, reason: string, std: StandardField): StdRule {
  const rule = emptyStdRule(type)
  rule.status = '待人工处理'
  rule.reason = reason
  rule.pendingTargets = domainValues(std.domain).length
    ? domainValues(std.domain)
    : standardCandidates(STANDARD_CODE_SYSTEM[std.code] ?? '', std.code).map((c) => c.name)
  return rule
}

function ok(rule: StdRule): RuleOutcome {
  rule.status = '已自动生成'
  rule.reason = ''
  return { kind: 'ok', rule }
}

function review(rule: StdRule): RuleOutcome {
  return { kind: 'review', rule }
}

/** 推断规则类型（用于待人工处理时的预选类型） */
function suggestType(std: StandardField, profile: SourceProfile): FieldRuleType {
  if (std.dataType === '时间') return '格式转换'
  if (profile.pairs.length) return profile.ruleType === '编码转换' ? '编码转换' : '值域映射'
  if (profile.unitFrom || profile.unitTo) return '单位转换'
  if (domainValues(std.domain).length) return '值域映射'
  return '直接映射'
}

/** 规则推导主流程 */
export function inferRule(input: RuleInput): RuleOutcome {
  const { profile, standard: std } = input

  /* 1. 多个标准字段含义接近 */
  if (isAmbiguous(input.candidates)) {
    return review(reviewRule(suggestType(std, profile), '多个标准字段含义接近，需人工判断', std))
  }

  /* 2. 源侧画像不足：缺字典 / 源值域未知 / 单位关系未知 */
  if (profile.needsReview) {
    const reason =
      profile.codeSystem && profile.codeSystem !== '值域校验'
        ? `本地${profile.codeSystem}编码无对应标准字典`
        : profile.reviewReason || '源侧信息不足，无法可靠确定对应关系'
    return review(reviewRule(suggestType(std, profile), reason, std))
  }

  /* 3. 规则模板复用：同一标准字段 + 同源值域/单位/格式 → 继承已有规则 */
  const tpl = findTemplate({
    standardCode: std.code,
    sourceValues: profile.sourceValues,
    unitFrom: profile.unitFrom,
    dateFormat: profile.dateFormat,
  })
  if (tpl) {
    const inherited = ruleFromTemplate(tpl)
    inherited.note = inherited.note || `自动复用规则模板 ${tpl.name}`
    markTemplateUsage(tpl.id)
    return ok(inherited)
  }

  /* 4. 日期：统一 ISO 8601 */
  if (std.dataType === '时间') {
    if (!profile.dateFormat) {
      return review(reviewRule('格式转换', '源数据日期格式未识别', std))
    }
    const conv = findDateConversion(profile.dateFormat)
    if (!conv) return review(reviewRule('格式转换', `源日期格式 ${profile.dateFormat} 无对应标准转换`, std))

    if (conv.from === DATE_TARGET_FORMAT) {
      const rule = emptyStdRule('直接映射')
      rule.note = '源已是 ISO 8601 日期，直接写入'
      rule.formatFrom = DATE_TARGET_FORMAT
      rule.formatTo = DATE_TARGET_FORMAT
      return ok(rule)
    }
    const rule = emptyStdRule('格式转换')
    rule.formatFrom = conv.from
    rule.formatTo = DATE_TARGET_FORMAT
    rule.expression = `${conv.from} → ${DATE_TARGET_FORMAT}`
    rule.note = conv.expr
    return ok(rule)
  }

  /* 5. 单位：源单位 ≠ 标准单位时查换算字典 */
  const stdUnit = STANDARD_UNIT[std.code] ?? ''
  const srcUnit = profile.unitFrom
  if (profile.ruleType === '单位转换' && (!srcUnit || !profile.unitTo)) {
    return review(reviewRule('单位转换', '源单位或换算关系未知', std))
  }
  if (srcUnit && stdUnit && srcUnit !== stdUnit) {
    const conv = findUnitConversion(std.code, srcUnit, stdUnit)
    if (!conv) {
      return review(reviewRule('单位转换', `缺少 ${srcUnit} → ${stdUnit} 的换算关系`, std))
    }
    const rule = emptyStdRule('单位转换')
    rule.unitFrom = srcUnit
    rule.unitTo = stdUnit
    rule.factor = conv.expr.replace('value ', '')
    rule.expression = conv.expr
    rule.note = conv.scope
    return ok(rule)
  }
  if (!srcUnit && profile.unitTo && stdUnit && profile.unitTo !== stdUnit) {
    return review(reviewRule('单位转换', `源单位未登记，无法确认 ${profile.unitTo} 与 ${stdUnit} 的换算`, std))
  }

  /* 6. 编码：LOINC / ICD-10 等标准编码体系 */
  if (profile.codeSystem === 'LOINC' && profile.codeValue) {
    const entry = LOINC_MAP[profile.codeValue]
    if (entry) {
      const rule = emptyStdRule('编码转换')
      rule.map = [{ src: input.sourceField, dst: `${entry.code} ${entry.name}` }]
      rule.note = `LOINC 字典命中：${entry.code} ${entry.name}${entry.unit ? ` · 单位 ${entry.unit}` : ''}`
      return ok(rule)
    }
    return review(reviewRule('编码转换', `LOINC 字典未收录 ${profile.codeValue}`, std))
  }

  /* 7. 值域 / 编码映射：源取值清单 → 标准值域 */
  if (profile.pairs.length) {
    const stdVals = domainValues(std.domain)
    const targets = profile.pairs.map((p) => p.dst)
    const allInDomain = stdVals.length ? targets.every((t) => stdVals.includes(t)) : true
    if (!allInDomain) {
      return review(reviewRule(suggestType(std, profile), '值域含义与标准值域不完全匹配，需人工确认', std))
    }
    const type: FieldRuleType = profile.ruleType === '编码转换' ? '编码转换' : '值域映射'
    const rule = emptyStdRule(type)
    rule.map = profile.pairs.map((p) => ({ src: p.src, dst: p.dst }))
    rule.note = stdVals.length ? `标准值域：${std.domain}` : '按源登记值域映射'
    return ok(rule)
  }

  /* 8. 值域校验型：源值已是标准值域成员（如 AJCC M0/M1/Mx、G1/G2/G3/Gx） */
  if (profile.codeSystem === 'AJCC8' || profile.codeSystem === '值域校验') {
    const stdVals = domainValues(std.domain).length ? domainValues(std.domain) : ajccValueSet(std.code)
    if (!stdVals.length) return review(reviewRule('直接映射', '标准值域未定义，无法校验', std))
    const rule = emptyStdRule('值域映射')
    rule.map = stdVals.map((v) => ({ src: v, dst: v }))
    rule.note = `源值域与标准值域一致（${stdVals.join('/')}），写入前做值域校验`
    return ok(rule)
  }

  /* 9. 文本 / 数值规整：非标准的书写形式（含单位、分隔符、小数） */
  if (profile.ruleType === '格式转换') {
    const numeric = std.dataType === '数值型'
    const rule = emptyStdRule('格式转换')
    rule.formatFrom = numeric ? '含单位或小数的文本' : '含分隔符/前缀的文本'
    rule.formatTo = numeric ? '数值型' : '标准字符串'
    rule.expression = profile.ruleText
    rule.note = profile.ruleText || '按标准格式规整'
    return ok(rule)
  }

  /* 10. 兜底：类型一致、单位一致、值域一致 → 直接映射 */
  const rule = emptyStdRule('直接映射')
  rule.note = srcUnit ? `源单位 ${srcUnit} 与标准一致，原值写入` : '类型、单位、值域均一致，原值写入'
  return ok(rule)
}

/* ---------- 批量生成统计 ---------- */

export interface BatchResult {
  /** 参与生成的字段数 */
  total: number
  /** 自动生成成功 */
  ok: number
  /** 需人工处理 */
  review: number
  /** 跳过（未确认映射 / 标准字段缺失） */
  skipped: number
  /** 复用模板的数量 */
  reused: number
  byType: Record<FieldRuleType, number>
  reviews: { sourceField: string; standardField: string; reason: string }[]
}

export function emptyBatchResult(): BatchResult {
  return {
    total: 0,
    ok: 0,
    review: 0,
    skipped: 0,
    reused: 0,
    byType: { 直接映射: 0, 值域映射: 0, 格式转换: 0, 单位转换: 0, 编码转换: 0 },
    reviews: [],
  }
}

export function accumulate(batch: BatchResult, outcome: RuleOutcome | null, meta: {
  sourceField: string
  standardField: string
}): BatchResult {
  batch.total += 1
  if (!outcome) {
    batch.skipped += 1
    return batch
  }
  batch.byType[outcome.rule.type] += 1
  if (outcome.kind === 'ok') {
    batch.ok += 1
    if (outcome.rule.origin === 'template') batch.reused += 1
    return batch
  }
  batch.review += 1
  batch.reviews.push({ sourceField: meta.sourceField, standardField: meta.standardField, reason: outcome.rule.reason })
  return batch
}
