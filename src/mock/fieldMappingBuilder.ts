/* ============================================================
   字段映射状态层
   映射对象 = 机构实际存在的源字段（不是 338 个标准字段逐个配置）
   标准元数据集负责定义目标标准，Schema Matching 生成候选，
   人工确认绑定，规则引擎负责值域 / 单位 / 格式 / 编码转换
   ============================================================ */

import { standardCategories } from './esophagusMetadata'
import { orgNames } from './organizations'
import { disabledFields } from './orgSourceFields'
import { standardSets, getStandardSet } from './standardSets'
import { getSourceFields, inferCategory, type SourceProfile } from './sourceFieldRegistry'
import { matchCandidates, type Candidate, type MatchingInput } from './schemaMatching'
import type { StandardSet } from './standardSets'
import {
  accumulate,
  emptyBatchResult,
  inferRule,
  type BatchResult,
} from './autoRuleEngine'
import { type RuleStatus, type StdRule } from './ruleTemplates'

/** 映射状态 */
export type MappingStatus = '待匹配' | '待确认' | '已映射' | '已停用'
export const mappingStatuses: MappingStatus[] = ['待匹配', '待确认', '已映射', '已停用']

/** 数据分类 → 源系统（数据来源） */
const SYSTEM_BY_KEYWORD: [string, string][] = [
  ['基本信息', 'HIS'],
  ['血检', 'LIS'],
  ['实验室', 'LIS'],
  ['检验', 'LIS'],
  ['随访', '随访库'],
  ['生存', '随访库'],
  ['诊断', 'EMR'],
  ['病理', 'EMR'],
  ['影像', 'EMR'],
  ['手术', 'EMR'],
  ['放化疗', 'EMR'],
  ['分期', 'EMR'],
  ['内镜', 'EMR'],
]
export function inferSystem(category: string): string {
  for (const [kw, sys] of SYSTEM_BY_KEYWORD) if (category.includes(kw)) return sys
  return '其他'
}

/** 宽表字段 → 源系统（与「数据源」页分组保持一致，覆盖通用分类推断） */
const WIDE_SOURCE_SYSTEM: Record<string, string> = {
  patient_id: 'HIS', patient_name: 'HIS', gender: 'HIS', age: 'HIS',
  birth_date: 'HIS', diagnosis_code: 'HIS', diagnosis_name: 'HIS', ajcc_stage: 'HIS',
  cea: 'LIS', scc: 'LIS', ca199: 'LIS', cyfra211: 'LIS', afp: 'LIS',
  vital_status: '随访库', recurrence: '随访库', followup_days: '随访库', survival_days: '随访库',
}

/** 映射状态 → 标签类型 */
export const statusTagType: Record<MappingStatus, 'info' | 'warning' | 'success' | 'danger'> = {
  待匹配: 'info',
  待确认: 'warning',
  已映射: 'success',
  已停用: 'danger',
}

/** 一行源字段映射 */
export interface MappingRow {
  id: string
  org: string
  /** 当前标准集 */
  setId: string
  sourceField: string
  sourceDesc: string
  sourceType: string
  /** 数据分类（由字段名规则推断 / 确认后标准字段分类） */
  category: string
  /** 数据来源（源系统：HIS / LIS / EMR / 随访库 等） */
  sourceSystem: string
  /** 候选标准字段 Top3 */
  candidates: Candidate[]
  /** 当前选中（或已确认）的标准编码 */
  selectedCode: string | null
  /** 是否人工确认 */
  confirmed: boolean
  /** 确认时所依据的标准集 id（版本保留） */
  confirmedInSet: string | null
  status: MappingStatus
  /** 自动生成的标准化规则（值转换层），未生成时为 null */
  stdRule: StdRule | null
  /** 标准化规则状态 */
  ruleStatus: RuleStatus
  /** 源字段画像：源值域 / 源单位 / 源日期格式 */
  profile: SourceProfile
  /** 确认操作序号，用于展示版本 */
  version: number
  /** 源字段清单内的顺序 */
  order: number
}

/** 规则状态：映射确认后未生成规则 = 未生成 */
export const ruleStatuses: RuleStatus[] = ['未生成', '已自动生成', '待人工处理', '已配置']

export const ruleStatusTagType: Record<RuleStatus, 'info' | 'success' | 'warning' | 'primary'> = {
  未生成: 'info',
  已自动生成: 'success',
  待人工处理: 'warning',
  已配置: 'primary',
}

/* ---------- 已确认映射持久存储（跨标准集保留） ---------- */

export interface ConfirmedRecord {
  code: string
  setId: string
  version: number
  disabled: boolean
  /** 标准化规则（自动生成 / 人工配置） */
  stdRule?: StdRule | null
  /** 标准化规则状态 */
  ruleStatus?: RuleStatus
}

const confirmedStore = new Map<string, ConfirmedRecord>()
let versionSeed = 0

const keyOf = (org: string, source: string) => `${org}|${source}`

export function getRecord(org: string, source: string): ConfirmedRecord | undefined {
  return confirmedStore.get(keyOf(org, source))
}

/** 人工确认：绑定源字段到标准字段，值转换规则由规则引擎单独产出 */
export function confirmMapping(org: string, source: string, code: string, setId: string): void {
  const prev = confirmedStore.get(keyOf(org, source))
  versionSeed += 1
  // 换绑标准字段 → 已有标准规则失效，回到「未生成」，需重新执行规则生成
  const rebound = !!prev && prev.code !== code
  confirmedStore.set(keyOf(org, source), {
    code,
    setId,
    version: versionSeed,
    disabled: false,
    stdRule: rebound ? null : prev?.stdRule ?? null,
    ruleStatus: rebound ? '未生成' : prev?.ruleStatus ?? '未生成',
  })
}

/* ---------- 标准化规则：自动生成 / 人工配置 ---------- */

/**
 * 保存标准化规则
 * 待人工处理的半成品规则同样记录状态，但不作为可执行规则生效
 */
export function saveStdRule(org: string, source: string, rule: StdRule): void {
  const key = keyOf(org, source)
  const cur = confirmedStore.get(key)
  if (!cur) return
  confirmedStore.set(key, {
    ...cur,
    stdRule: { ...rule, map: rule.map.map((e) => ({ ...e })) },
    ruleStatus: rule.status,
  })
}

/** 清空已有规则（重新匹配 / 删除映射场景） */
export function clearRule(org: string, source: string): void {
  const key = keyOf(org, source)
  const cur = confirmedStore.get(key)
  if (!cur) return
  confirmedStore.set(key, { ...cur, stdRule: null, ruleStatus: '未生成' })
}

/**
 * 批量自动生成标准化规则
 * 仅对「已确认映射」的字段执行；能确定性判定的直接落规则，
 * 无法判定的落「待人工处理」，不要求人工逐字段配置
 */
export function generateRulesForRows(rows: MappingRow[], set: StandardSet): BatchResult {
  const batch = emptyBatchResult()
  rows.forEach((row) => {
    if (!row.confirmed || !row.selectedCode) {
      batch.skipped += 1
      return
    }
    const std = set.fields.find((f) => f.code === row.selectedCode)
    if (!std) {
      batch.skipped += 1
      return
    }
    const outcome = inferRule({
      sourceField: row.sourceField,
      profile: row.profile,
      standard: std,
      candidates: row.candidates,
    })
    saveStdRule(row.org, row.sourceField, outcome.rule)
    accumulate(batch, outcome, { sourceField: row.sourceField, standardField: std.cn })
  })
  return batch
}

/** 停用 / 启用（保留映射配置，不参与治理） */
export function setDisabled(org: string, source: string, disabled: boolean): void {
  const key = keyOf(org, source)
  const current = confirmedStore.get(key)
  confirmedStore.set(key, current ? { ...current, disabled } : { code: '', setId: '', version: 0, disabled })
}

/** 删除映射关系 */
export function removeRecord(org: string, source: string): void {
  confirmedStore.delete(keyOf(org, source))
}

/** 清空当前机构的所有映射（用于「重新匹配」演示） */
export function clearOrgRecords(org: string): void {
  for (const key of [...confirmedStore.keys()]) {
    if (key.startsWith(`${org}|`)) confirmedStore.delete(key)
  }
}

/* ---------- 预置示例：已人工确认的映射（便于直接查看下游标准化效果） ---------- */

function seedConfirmed(org: string, set: StandardSet, limit = 40): void {
  const scored = getSourceFields(org).map((def) => ({
    def,
    top: matchCandidates(
      { field: def.field, desc: def.desc, type: def.type, category: inferCategory(def.field) },
      set.fields,
      1,
      35,
    )[0],
  }))
  const picked = scored
    .filter((x) => x.top && x.top.score >= 50)
    .slice(0, limit)
  picked.forEach(({ def, top }) => {
    if (!top) return
    confirmMapping(org, def.field, top.standard.code, set.id)
  })
}

/* ---------- 构建映射清单 ---------- */

/**
 * 为机构在当前标准集下生成映射清单
 * 仅包含该机构实际存在的源字段
 */
export function buildMappingRows(org: string, set: StandardSet): MappingRow[] {
  return getSourceFields(org).map((def, index) => {
    const input: MatchingInput = {
      field: def.field,
      desc: def.desc,
      type: def.type,
      category: inferCategory(def.field),
    }
    const candidates = matchCandidates(input, set.fields, 3, 35)
    const record = getRecord(org, def.field)
    const disabledSet = new Set(disabledFields[org] ?? [])
    const top = candidates[0]

    if (record && record.code) {
      const std = set.fields.find((f) => f.code === record.code)
      const confirmedCandidate: Candidate[] = std
        ? [
            {
              standard: std,
              score: top?.standard.code === std.code ? (top?.score ?? 0) : 0,
              method: top?.standard.code === std.code ? (top?.method ?? '字段名规则') : '结构约束',
              breakdown: top?.breakdown ?? { name: 0, abbr: 0, synonym: 0, semantic: 0, structure: 0 },
            },
          ]
        : []
      // 确认于其它标准集的映射：保留版本，待操作人员在当前标准集下重新确认
      const stale = record.setId !== set.id
      return {
        id: `${org}|${def.field}|${set.id}`,
        org,
        setId: set.id,
        sourceField: def.field,
        sourceDesc: def.desc,
        sourceType: def.profile.sourceType || def.type,
        category: std?.category ?? (inferCategory(def.field) || top?.standard.category || '—'),
        sourceSystem: WIDE_SOURCE_SYSTEM[def.field] ?? inferSystem(std?.category ?? (inferCategory(def.field) || top?.standard.category || '—')),
        candidates: confirmedCandidate,
        selectedCode: std?.code ?? null,
        confirmed: true,
        confirmedInSet: record.setId,
        status: stale ? '待确认' : record.disabled || disabledSet.has(record.code) ? '已停用' : '已映射',
        stdRule: record.stdRule ?? null,
        ruleStatus: record.ruleStatus ?? '未生成',
        profile: def.profile,
        version: record.version,
        order: index,
      }
    }

    const status: MappingStatus = top && top.score >= 50 ? '待确认' : '待匹配'
    const cat = inferCategory(def.field) || top?.standard.category || '—'
    return {
      id: `${org}|${def.field}|${set.id}`,
      org,
      setId: set.id,
      sourceField: def.field,
      sourceDesc: def.desc,
      sourceType: def.profile.sourceType || def.type,
      category: cat,
      sourceSystem: WIDE_SOURCE_SYSTEM[def.field] ?? inferSystem(cat),
      candidates,
      selectedCode: null,
      confirmed: false,
      confirmedInSet: null,
      status,
      stdRule: null,
      ruleStatus: '未生成',
      profile: def.profile,
      version: 0,
      order: index,
    }
  })
}

/** 重新匹配：仅重算候选，不影响已有确认 */
export function reMatchRow(org: string, row: MappingRow, set: StandardSet): MappingRow {
  const def = getSourceFields(org).find((d) => d.field === row.sourceField)
  const input: MatchingInput = {
    field: def?.field ?? row.sourceField,
    desc: def?.desc ?? row.sourceDesc,
    type: def?.type ?? row.sourceType,
    category: inferCategory(row.sourceField),
  }
  const candidates = matchCandidates(input, set.fields, 3, 35)
  return {
    ...row,
    candidates,
    selectedCode: null,
    confirmed: false,
    confirmedInSet: null,
    status: '待匹配',
    stdRule: null,
    ruleStatus: '未生成',
  }
}

/* 使用首个标准集预置示例确认（仅演示用，保留确认记录以便查看下游标准化） */
const demoOrg = orgNames[0]
const demoSet = getStandardSet(standardSets[0].id)
seedConfirmed(demoOrg, demoSet)
// 预置示例同步跑一遍规则生成，直接呈现「映射 → 自动规则」链路
generateRulesForRows(buildMappingRows(demoOrg, demoSet), demoSet)

export { standardCategories }
