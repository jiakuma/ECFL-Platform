/* ============================================================
   科研数据集：可选字段目录与字段统计
   字段全部派生自本机构「标准数据产物」（standardDataBuilder），
   即宽表经过 标准化 → 清洗 → 去重 → 脱敏 之后的最终标准宽表，
   不引入任何标准数据之外的虚构字段。
   统计（缺失率 / 取值范围 / 类别分布）均按当前机构范围实时计算，
   没有观测数据时返回 hasStats=false，页面显示「暂无统计」。
   ============================================================ */

import { buildStandardWideTable, type StdWideRow } from './standardDataBuilder'
import { wideFieldOrder, wideRows, wideRowsFor } from './wideTableBuilder'

/** 字段数据类型 */
export type FieldKind = '标识' | '文本' | '日期' | '数值' | '枚举'

/** 字段分类 */
export type FieldCategory = '基本信息' | '诊断信息' | '检验数据' | '治疗信息' | '随访信息'

export const DATASET_FIELD_CATS: FieldCategory[] = [
  '基本信息',
  '诊断信息',
  '检验数据',
  '治疗信息',
  '随访信息',
]

export interface DatasetFieldDef {
  /** 标准数据字段名 */
  key: string
  /** 中文名称 */
  label: string
  kind: FieldKind
  category: FieldCategory
  unit?: string
  /** 敏感字段（脱敏后仍不建议作为建模特征） */
  sensitive?: boolean
}

/* ---------- 字段目录（与标准宽表字段一一对应） ---------- */

export const datasetFieldCatalog: DatasetFieldDef[] = [
  // 基本信息
  { key: 'patient_id', label: '患者主键', kind: '标识', category: '基本信息', sensitive: true },
  { key: 'patient_name', label: '患者姓名（已脱敏）', kind: '文本', category: '基本信息', sensitive: true },
  { key: 'gender', label: '性别', kind: '枚举', category: '基本信息' },
  { key: 'birth_date', label: '出生日期', kind: '日期', category: '基本信息' },
  { key: 'age', label: '年龄', kind: '数值', category: '基本信息', unit: '岁' },
  // 诊断信息
  { key: 'diagnosis_code', label: '诊断编码（ICD-10）', kind: '枚举', category: '诊断信息' },
  { key: 'diagnosis_name', label: '诊断名称', kind: '枚举', category: '诊断信息' },
  { key: 'ajcc_stage', label: 'AJCC 分期', kind: '枚举', category: '诊断信息' },
  // 检验数据
  { key: 'cea', label: '癌胚抗原 CEA', kind: '数值', category: '检验数据', unit: 'ng/mL' },
  { key: 'scc', label: '鳞状细胞癌抗原 SCC', kind: '数值', category: '检验数据', unit: 'ng/mL' },
  { key: 'ca199', label: '糖类抗原 199', kind: '数值', category: '检验数据', unit: 'U/mL' },
  { key: 'cyfra211', label: '细胞角蛋白 19 片段', kind: '数值', category: '检验数据', unit: 'ng/mL' },
  { key: 'afp', label: '甲胎蛋白 AFP', kind: '数值', category: '检验数据', unit: 'ng/mL' },
  // 随访信息
  { key: 'vital_status', label: '生存状态', kind: '枚举', category: '随访信息' },
  { key: 'recurrence', label: '复发情况', kind: '枚举', category: '随访信息' },
  { key: 'followup_days', label: '随访天数', kind: '数值', category: '随访信息', unit: '天' },
  { key: 'survival_days', label: '生存天数', kind: '数值', category: '随访信息', unit: '天' },
]

/** 标准宽表中实际存在的字段（防止目录漂移） */
const knownKeys = new Set(wideFieldOrder)

export function fieldDef(key: string): DatasetFieldDef | undefined {
  return datasetFieldCatalog.find((f) => f.key === key)
}

export function fieldLabel(key: string): string {
  return fieldDef(key)?.label ?? key
}

/** 字段是否仍存在于当前标准数据（用于版本兼容性检查） */
export function fieldExists(key: string): boolean {
  return knownKeys.has(key) && !!fieldDef(key)
}

/* ---------- 字段统计 ---------- */

export interface FieldStats {
  /** 参与统计的标准数据样本数 */
  total: number
  /** 缺失条数 */
  missing: number
  /** 缺失率（0~1） */
  missingRate: number
  /** 去重取值数 */
  distinct: number
  /** 数值型取值区间 */
  min?: number
  max?: number
  /** 枚举型类别分布（降序） */
  categories?: { name: string; count: number }[]
  /** 是否有真实观测数据 */
  hasStats: boolean
}

function isMissing(v: unknown): boolean {
  if (v === null || v === undefined) return true
  if (typeof v === 'number') return !Number.isFinite(v)
  return String(v).trim() === ''
}

/** 标准数据行缓存（按机构隔离，避免把其他机构数据混入统计） */
const rowsCache = new Map<string, StdWideRow[]>()

/**
 * 标准数据行。
 * 传 org 时只统计该机构；不传时沿用当前机构上下文（平台管理员为三家合并）。
 */
export function stdRows(org?: string): StdWideRow[] {
  const cacheKey = org || '__current__'
  if (!rowsCache.has(cacheKey)) {
    rowsCache.set(cacheKey, buildStandardWideTable(org ? wideRowsFor(org) : wideRows).rows)
  }
  return rowsCache.get(cacheKey)!
}

/** 标准数据样本数（可指定机构） */
export function stdSampleCount(org?: string): number {
  return stdRows(org).length
}

/** 单字段统计：按机构范围实时计算 */
export function fieldStats(key: string, org?: string): FieldStats {
  const rows = stdRows(org)
  const def = fieldDef(key)
  const total = rows.length
  if (!def || total === 0) {
    return { total: 0, missing: 0, missingRate: 0, distinct: 0, hasStats: false }
  }

  const values = rows.map((r) => (r as unknown as Record<string, unknown>)[key])
  const present = values.filter((v) => !isMissing(v))
  const missing = total - present.length
  const distinct = new Set(present.map((v) => String(v))).size

  const stats: FieldStats = {
    total,
    missing,
    missingRate: total ? missing / total : 0,
    distinct,
    hasStats: present.length > 0,
  }

  if (def.kind === '数值') {
    const nums = present.map((v) => Number(v)).filter((n) => Number.isFinite(n))
    if (nums.length) {
      stats.min = Math.min(...nums)
      stats.max = Math.max(...nums)
    } else {
      stats.hasStats = false
    }
  }

  if (def.kind === '枚举') {
    const map = new Map<string, number>()
    for (const v of present) map.set(String(v), (map.get(String(v)) ?? 0) + 1)
    stats.categories = [...map]
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
  }

  return stats
}

/** 批量统计 */
export function fieldStatsMap(keys: string[], org?: string): Record<string, FieldStats> {
  const out: Record<string, FieldStats> = {}
  for (const k of keys) out[k] = fieldStats(k, org)
  return out
}

/**
 * 标签分布：按给定字段统计类别分布（分类任务）。
 * 无标签或字段无观测数据时返回 null，由页面显示「暂无统计」。
 */
export function labelDistribution(key: string): { name: string; count: number }[] | null {
  const s = fieldStats(key)
  return s.hasStats && s.categories ? s.categories : null
}
