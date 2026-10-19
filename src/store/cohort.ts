import { defineStore } from 'pinia'
import {
  newCondition,
  runCohort,
  type CohortCondition,
  type CohortPreview,
} from '@/mock/cohortFields'
import { orgNames } from '@/mock/organizations'

/* ------------------------------------------------------------
   科研队列：保存筛选规则，患者名单由规则实时计算
   队列归属：org 标记所属机构，shared 标记是否为他院共享摘要
   ------------------------------------------------------------ */

export interface Cohort {
  id: string
  name: string
  purpose: string
  /** 所属机构（用于本机构 / 其他机构区分） */
  org: string
  /** 纳入条件（组内 AND / OR） */
  includes: CohortCondition[]
  /** 排除条件（任一满足即排除） */
  excludes: CohortCondition[]
  createdAt: string
  updatedAt: string
  /** 是否为他院主动共享的只读摘要（非本机构队列） */
  shared?: boolean
  /** 适用数据类型（仅共享队列展示） */
  dataType?: string
  /** 共享说明（仅共享队列展示） */
  shareNote?: string
}

/** 本机构默认归属（未选择机构时取第一家） */
const SELF_ORG = orgNames[0]

/** 新建队列的空条件结构 */
export function emptyCohort(): Cohort {
  return {
    id: '',
    name: '',
    purpose: '',
    org: SELF_ORG,
    includes: [newCondition('diagnosis')],
    excludes: [],
    createdAt: '',
    updatedAt: '',
  }
}

function today(): string {
  const d = new Date()
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`
}

let idSeq = 0
function nextId(): string {
  idSeq += 1
  return `CQ-${String(idSeq).padStart(3, '0')}`
}

function seed(): Cohort[] {
  const list: Cohort[] = [
    {
      id: nextId(),
      name: '食管鳞癌随访队列',
      purpose: '筛选病理类型为鳞癌且已进入规律随访的患者，用于术后复发风险因素分析',
      org: SELF_ORG,
      includes: [{ ...newCondition('diagnosis'), op: 'contains', value: '鳞状' }],
      excludes: [{ ...newCondition('followup_status'), op: 'eq', value: '评估中' }],
      createdAt: '2026-09-12 10:24',
      updatedAt: '2026-09-12 10:24',
    },
    {
      id: nextId(),
      name: '老年或手术患者队列',
      purpose: '65 岁以上或已接受手术治疗的患者，演示 OR 逻辑组合',
      org: SELF_ORG,
      includes: [
        { ...newCondition('age'), op: 'gte', value: 65 },
        { ...newCondition('treatment_modality'), op: 'eq', value: '手术', logic: 'OR' },
      ],
      excludes: [],
      createdAt: '2026-09-20 15:02',
      updatedAt: '2026-09-28 09:41',
    },
    {
      id: nextId(),
      name: '肿瘤标志物监测队列',
      purpose: '近期鳞状细胞癌抗原高于 1 ng/mL 的患者，用于标志物动态监测研究',
      org: SELF_ORG,
      includes: [{ ...newCondition('lab:鳞状细胞癌抗原 SCC'), op: 'gt', value: 1 }],
      excludes: [],
      createdAt: '2026-10-08 11:17',
      updatedAt: '2026-10-08 11:17',
    },
  ]

  // 其他机构主动共享的队列摘要（只读，不携带完整筛选规则与明细）
  const shared: Cohort[] = [
    {
      id: nextId(),
      name: '局部晚期食管鳞癌新辅助化疗队列',
      purpose: '纳入 cT3-4aNanyM0 局部晚期食管鳞癌、接受新辅助化疗的患者，用于病理缓解与生存分析',
      org: orgNames[2],
      shared: true,
      dataType: '临床基线 · 影像 · 病理',
      shareNote: '仅共享队列定义与汇总级入组人数，患者级明细需经审批后申请使用',
      includes: [{ ...newCondition('diagnosis'), op: 'contains', value: '鳞状' }],
      excludes: [],
      createdAt: '2026-09-15 09:30',
      updatedAt: '2026-09-15 09:30',
    },
    {
      id: nextId(),
      name: '食管癌免疫治疗随访队列',
      purpose: '接受系统治疗并进入随访的食管癌患者，分析治疗反应与生存预后',
      org: orgNames[1],
      shared: true,
      dataType: '临床基线 · 检验 · 随访',
      shareNote: '开放队列摘要，可用于跨中心联合统计的初步可行性评估',
      includes: [{ ...newCondition('followup_status'), op: 'eq', value: '随访中' }],
      excludes: [],
      createdAt: '2026-09-22 14:08',
      updatedAt: '2026-10-02 16:20',
    },
    {
      id: nextId(),
      name: '老年营养风险筛查队列',
      purpose: '70 岁以上、营养风险筛查评分偏高且合并基础疾病的患者，用于营养干预研究',
      org: orgNames[2],
      shared: true,
      dataType: '临床基线 · 检验 · 营养评估',
      shareNote: '共享队列摘要与入组标准，申请使用后可在授权范围内查看脱敏明细',
      includes: [{ ...newCondition('age'), op: 'gte', value: 70 }],
      excludes: [],
      createdAt: '2026-10-05 11:45',
      updatedAt: '2026-10-05 11:45',
    },
  ]

  return [...list, ...shared]
}

export const useCohortStore = defineStore('cohort', {
  state: () => ({ list: seed() }),
  getters: {
    /** 队列 + 实时计算的符合患者数 */
    withCount(): { cohort: Cohort; count: number }[] {
      return this.list.map((c) => ({
        cohort: c,
        count: runCohort(c.includes, c.excludes).total,
      }))
    },
  },
  actions: {
    /** 新建（返回新队列） */
    create(draft: Cohort): Cohort {
      const now = today()
      const item: Cohort = {
        ...draft,
        id: nextId(),
        includes: draft.includes.map((c) => ({ ...c })),
        excludes: draft.excludes.map((c) => ({ ...c })),
        createdAt: now,
        updatedAt: now,
      }
      this.list.unshift(item)
      return item
    },
    /** 编辑（按 id 覆盖筛选规则） */
    update(id: string, draft: Cohort) {
      const idx = this.list.findIndex((c) => c.id === id)
      if (idx < 0) return
      this.list[idx] = {
        ...draft,
        id,
        includes: draft.includes.map((c) => ({ ...c })),
        excludes: draft.excludes.map((c) => ({ ...c })),
        createdAt: this.list[idx].createdAt,
        updatedAt: today(),
      }
    },
    /** 复制（保留规则，换名称与编号） */
    duplicate(id: string): Cohort | undefined {
      const src = this.list.find((c) => c.id === id)
      if (!src) return
      const now = today()
      const item: Cohort = {
        ...src,
        id: nextId(),
        name: `${src.name}（副本）`,
        includes: src.includes.map((c) => ({ ...c, id: newCondition().id })),
        excludes: src.excludes.map((c) => ({ ...c, id: newCondition().id })),
        createdAt: now,
        updatedAt: now,
      }
      this.list.unshift(item)
      return item
    },
    /** 删除 */
    remove(id: string) {
      const idx = this.list.findIndex((c) => c.id === id)
      if (idx >= 0) this.list.splice(idx, 1)
    },
    /** 预览（与列表计数同源） */
    preview(c: Cohort): CohortPreview {
      return runCohort(c.includes, c.excludes)
    },
  },
})
