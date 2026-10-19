/* ============================================================
   标准元数据集注册中心
   切换标准集后，字段匹配目标整体切换：
     已有映射关系保留版本，不删除，需操作人员在新标准集下重新确认
   ============================================================ */

import { standardFields, standardCategories } from './esophagusMetadata'
import type { StandardField } from './esophagusMetadata'

export interface StandardSet {
  id: string
  /** 标准集名称 */
  name: string
  /** 适用范围说明 */
  scope: string
  /** 标准字段全集（目标匹配对象） */
  fields: StandardField[]
}

/** V2 核心必填集：约束为 M 的字段 */
const coreSet = standardFields.filter((f) => f.constraint === 'M')

/** V3 MDT 精简集：临床试验常用分类 */
const mdtCategories = [
  '基本信息',
  '血检肿瘤标志物',
  '内镜检查',
  '影像学检查',
  '病理检查',
  '诊断与分期',
  '随访',
  '生存与预后',
]
const mdtSet = standardFields.filter((f) => mdtCategories.includes(f.category))

export const standardSets: StandardSet[] = [
  {
    id: 'esophagus-v1',
    name: '食管癌专病标准 V1',
    scope: `完整集 · ${standardFields.length} 字段 · ${standardCategories.length} 分类`,
    fields: standardFields,
  },
  {
    id: 'esophagus-v2',
    name: '食管癌专病标准 V2',
    scope: `核心必填集 · ${coreSet.length} 字段 · 约束 M`,
    fields: coreSet,
  },
  {
    id: 'esophagus-v3',
    name: '食管癌专病标准 V3',
    scope: `MDT 精简集 · ${mdtSet.length} 字段 · 8 类临床分类`,
    fields: mdtSet,
  },
]

export const defaultSetId = standardSets[0].id

export function getStandardSet(id: string): StandardSet {
  return standardSets.find((s) => s.id === id) ?? standardSets[0]
}
