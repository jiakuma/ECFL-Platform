import { defineStore } from 'pinia'
import { cohortSummary, runCohort } from '@/mock/cohortFields'
import { fieldDef, fieldExists, fieldStats } from '@/mock/datasetFields'
import { orgNames } from '@/mock/organizations'
import { useCohortStore } from './cohort'
import { useOrgStore } from './org'

/* ------------------------------------------------------------
   科研数据集：确定队列对象用于分析 / 训练的数据字段、标签与版本
   - 数据集归属各机构本地，机构间默认隔离
   - 保存队列「引用 + 规则版本快照」，队列后续修改不影响历史数据集含义
   - 可用状态由训练前检查实时计算，不由配置直接决定
   ------------------------------------------------------------ */

export type TaskType = '分类' | '回归' | '无监督'
export type FieldRole = 'feature' | 'label'
export type DatasetStatus = '可用于训练' | '待完善' | '不可用'
export type CheckLevel = '通过' | '警告' | '失败'

export interface DatasetField {
  key: string
  role: FieldRole
}

/** 配置版本快照（用于被任务引用的历史版本追溯） */
export interface DatasetVersion {
  version: number
  at: string
  fieldCount: number
  taskType: TaskType
  labelField: string
  /** 该版本被哪些任务引用（引用后不会再改） */
  referencedBy: string[]
}

export interface Dataset {
  id: string
  name: string
  /** 研究目的 */
  purpose: string
  /** 数据集说明 */
  desc: string
  /** 数据类型 */
  dataType: string
  org: string
  /* —— 来源队列引用与规则版本 —— */
  cohortId: string
  cohortName: string
  /** 关联时锁定的筛选条件摘要 */
  cohortRuleSnapshot: string
  /** 关联时锁定的队列规则版本（队列 updatedAt） */
  cohortRuleAt: string
  /** 关联时锁定的样本数 */
  sampleCount: number
  /* —— 字段与标签 —— */
  fields: DatasetField[]
  taskType: TaskType
  labelField: string
  /* —— 版本与状态 —— */
  version: number
  status: DatasetStatus
  createdAt: string
  updatedAt: string
  creator: string
  /** 引用该数据集的联邦任务 id（非空时禁止删除） */
  referencedBy: string[]
  /** 经授权参与跨机构协作（其他机构可在任务中选用） */
  shared?: boolean
  /** 配置版本记录（最新在最后） */
  history: DatasetVersion[]
}

export interface CheckItem {
  name: string
  level: CheckLevel
  detail: string
}

/** 建模建议的最小样本数 */
export const MIN_SAMPLE = 5

export const DATA_TYPE_OPTIONS = [
  '结构化临床数据',
  '结构化临床 + 检验数据',
  '结构化临床 + 随访数据',
  '多模态（临床 + 影像特征）',
]

export const TASK_TYPES: TaskType[] = ['分类', '回归', '无监督']

function today(): string {
  const d = new Date()
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`
}

let idSeq = 0
function nextId(): string {
  idSeq += 1
  return `DS-${String(idSeq).padStart(3, '0')}`
}

/** 空数据集草稿 */
export function emptyDataset(): Dataset {
  return {
    id: '',
    name: '',
    purpose: '',
    desc: '',
    dataType: DATA_TYPE_OPTIONS[0],
    org: '',
    cohortId: '',
    cohortName: '',
    cohortRuleSnapshot: '',
    cohortRuleAt: '',
    sampleCount: 0,
    fields: [],
    taskType: '分类',
    labelField: '',
    version: 1,
    status: '不可用',
    createdAt: '',
    updatedAt: '',
    creator: '机构管理员',
    referencedBy: [],
    history: [],
  }
}

/** 锁定队列引用：取当前队列规则与样本数 */
export function lockCohort(d: Dataset, cohortId: string): boolean {
  const c = useCohortStore().list.find((x) => x.id === cohortId)
  if (!c) return false
  d.cohortId = c.id
  d.cohortName = c.name
  d.cohortRuleSnapshot = cohortSummary(c.includes, c.excludes)
  d.cohortRuleAt = c.updatedAt
  d.sampleCount = runCohort(c.includes, c.excludes).total
  return true
}

/** 训练前检查：全部基于当前真实数据计算 */
export function checkDataset(d: Dataset): CheckItem[] {
  const items: CheckItem[] = []
  const cs = useCohortStore()

  /* 1. 配置完整性 */
  if (!d.cohortId) {
    items.push({ name: '数据集配置完整性', level: '失败', detail: '未关联来源科研队列，无法确定患者范围。' })
  } else {
    const c = cs.list.find((x) => x.id === d.cohortId)
    if (!c) {
      items.push({ name: '数据集配置完整性', level: '失败', detail: `来源队列 ${d.cohortId} 已不存在，请重新选择队列。` })
    } else if (c.updatedAt !== d.cohortRuleAt) {
      items.push({
        name: '数据集配置完整性',
        level: '警告',
        detail: `来源队列「${d.cohortName}」规则已更新（队列版本 ${c.updatedAt}，数据集锁定版本 ${d.cohortRuleAt}）。数据集仍沿用关联时的规则版本，如需同步请重新选择队列。`,
      })
    } else {
      items.push({ name: '数据集配置完整性', level: '通过', detail: `已关联队列「${d.cohortName}」，规则版本 ${d.cohortRuleAt}。` })
    }
  }

  if (!d.fields.length) {
    items.push({ name: '数据字段配置', level: '失败', detail: '未选择任何数据字段。' })
  } else if (!d.fields.some((f) => f.role === 'feature')) {
    items.push({ name: '数据字段配置', level: '失败', detail: '至少需要选择一个特征字段。' })
  } else {
    items.push({ name: '数据字段配置', level: '通过', detail: `已选 ${d.fields.filter((f) => f.role === 'feature').length} 个特征字段。` })
  }

  /* 2. 样本数量 */
  if (d.sampleCount <= 0) {
    items.push({ name: '样本数量', level: '失败', detail: '来源队列当前符合条件患者数为 0，无法用于训练。' })
  } else if (d.sampleCount < MIN_SAMPLE) {
    items.push({
      name: '样本数量',
      level: '警告',
      detail: `样本数 ${d.sampleCount} 例，低于建议的最小样本数 ${MIN_SAMPLE} 例，模型泛化能力可能不足。`,
    })
  } else {
    items.push({ name: '样本数量', level: '通过', detail: `样本数 ${d.sampleCount} 例，满足最低要求（≥ ${MIN_SAMPLE} 例）。` })
  }

  /* 3. 特征缺失情况 */
  const features = d.fields.filter((f) => f.role === 'feature')
  if (features.length) {
    const bad: string[] = []
    let allMissing = 0
    for (const f of features) {
      const s = fieldStats(f.key)
      if (s.total === 0 || !s.hasStats) {
        bad.push(`${fieldDef(f.key)?.label ?? f.key}（暂无统计）`)
        allMissing += 1
        continue
      }
      if (s.missingRate > 0.5) {
        bad.push(`${fieldDef(f.key)?.label ?? f.key} 缺失率 ${(s.missingRate * 100).toFixed(0)}%`)
      }
    }
    if (allMissing === features.length) {
      items.push({ name: '特征字段缺失情况', level: '失败', detail: '所有特征字段均无可用观测数据，无法计算缺失率。' })
    } else if (bad.length) {
      items.push({ name: '特征字段缺失情况', level: '警告', detail: `以下特征缺失率偏高或无统计：${bad.join('、')}。` })
    } else {
      items.push({ name: '特征字段缺失情况', level: '通过', detail: '特征字段均有观测数据，缺失率在可接受范围内（≤ 50%）。' })
    }
  }

  /* 4. 标签与标签分布 */
  if (d.taskType === '无监督') {
    items.push({
      name: '目标标签',
      level: '通过',
      detail: d.labelField
        ? `无监督任务不使用标签，已选字段「${fieldDef(d.labelField)?.label ?? d.labelField}」仅作留存，不参与训练。`
        : '无监督任务，未设置目标标签。',
    })
  } else if (!d.labelField) {
    items.push({ name: '目标标签', level: '失败', detail: `${d.taskType}任务必须设置目标标签。` })
  } else {
    const def = fieldDef(d.labelField)
    const need = d.taskType === '分类' ? '枚举' : '数值'
    if (!def) {
      items.push({ name: '目标标签', level: '失败', detail: `标签字段 ${d.labelField} 不存在于本机构标准数据字段。` })
    } else if (def.kind !== need) {
      items.push({
        name: '目标标签',
        level: '失败',
        detail: `${d.taskType}任务要求${need}型标签，当前标签「${def.label}」为${def.kind}型。`,
      })
    } else {
      const s = fieldStats(d.labelField)
      if (!s.hasStats) {
        items.push({ name: '目标标签', level: '失败', detail: `标签「${def.label}」无可用观测数据，无法评估标签质量。` })
      } else if (d.taskType === '分类' && s.categories) {
        const thin = s.categories.filter((c) => c.count < 2)
        if (s.categories.length < 2) {
          items.push({ name: '标签分布', level: '失败', detail: `标签「${def.label}」仅有 1 个类别，无法进行分类训练。` })
        } else if (thin.length) {
          items.push({
            name: '标签分布',
            level: '警告',
            detail: `标签「${def.label}」存在样本过少的类别：${thin.map((t) => `${t.name} ${t.count} 例`).join('、')}，建议补充样本或合并类别。`,
          })
        } else {
          items.push({
            name: '标签分布',
            level: '通过',
            detail: `标签「${def.label}」共 ${s.categories.length} 个类别：${s.categories.map((t) => `${t.name} ${t.count} 例`).join('、')}。`,
          })
        }
      } else {
        items.push({
          name: '标签分布',
          level: '通过',
          detail: `标签「${def.label}」取值范围 ${s.min} ~ ${s.max}${def.unit ? ` ${def.unit}` : ''}，缺失率 ${(s.missingRate * 100).toFixed(0)}%。`,
        })
      }
    }
  }

  /* 5. 数据版本与字段兼容性 */
  const missing = d.fields.filter((f) => !fieldExists(f.key)).map((f) => f.key)
  if (missing.length) {
    items.push({
      name: '数据版本与字段兼容性',
      level: '失败',
      detail: `字段 ${missing.join('、')} 在当前本机构标准数据中不存在，数据集版本与当前标准数据不兼容。`,
    })
  } else {
    items.push({
      name: '数据版本与字段兼容性',
      level: '通过',
      detail: `数据集版本 v${d.version}，全部 ${d.fields.length} 个字段在当前标准数据中存在。`,
    })
  }

  /* 6. 与算法输入要求兼容 */
  const nonNumeric = features
    .map((f) => fieldDef(f.key))
    .filter((f) => f && (f.kind === '标识' || f.kind === '文本' || f.kind === '日期'))
  const sensitive = features.map((f) => fieldDef(f.key)).filter((f) => f?.sensitive)
  if (nonNumeric.length) {
    items.push({
      name: '算法输入兼容性',
      level: '警告',
      detail: `特征中包含非数值字段：${nonNumeric.map((f) => f!.label).join('、')}，多数算法要求先做编码处理。`,
    })
  } else if (sensitive.length) {
    items.push({
      name: '算法输入兼容性',
      level: '警告',
      detail: `特征中包含标识 / 敏感字段：${sensitive.map((f) => f!.label).join('、')}，不建议直接参与建模。`,
    })
  } else {
    items.push({ name: '算法输入兼容性', level: '通过', detail: '特征均为数值或可枚举字段，满足常规算法输入要求。' })
  }

  return items
}

/** 由检查结果推导可用状态 */
export function statusOf(items: CheckItem[]): DatasetStatus {
  if (items.some((i) => i.level === '失败')) return '不可用'
  if (items.some((i) => i.level === '警告')) return '待完善'
  return '可用于训练'
}

export const useDatasetStore = defineStore('dataset', {
  state: () => ({ list: [] as Dataset[], seeded: false }),
  getters: {
    /** 当前机构的数据集 */
    own(): Dataset[] {
      const org = useOrgStore().selected || orgNames[0]
      return this.list.filter((d) => d.org === org)
    },
    /** 经授权可参与协作的他院数据集 */
    sharedFromOthers(): Dataset[] {
      const org = useOrgStore().selected || orgNames[0]
      return this.list.filter((d) => !!d.shared && d.org !== org)
    },
  },
  actions: {
    /**
     * 首次访问时按真实科研队列播种数据集。
     * 放在这里而不是模块初始化，确保引用到的队列编号真实存在。
     */
    ensureSeed() {
      if (this.seeded) return
      this.seeded = true
      const cs = useCohortStore()
      const now = today()

      const make = (
        org: string,
        cohortIdx: number,
        base: Partial<Omit<Dataset, 'fields'>> & {
          name: string
          taskType: TaskType
          fields: string[]
          labelField: string
        },
      ): Dataset | null => {
        const cohorts = cs.list.filter((c) => c.org === org)
        const c = cohorts[cohortIdx]
        if (!c) return null
        const d: Dataset = {
          ...emptyDataset(),
          org,
          dataType: base.dataType ?? DATA_TYPE_OPTIONS[1],
          purpose: base.purpose ?? '',
          desc: base.desc ?? '',
          taskType: base.taskType,
          labelField: base.labelField,
          fields: base.fields.map((k) => ({ key: k, role: (k === base.labelField ? 'label' : 'feature') as FieldRole })) as DatasetField[],
          name: base.name,
          creator: '机构管理员',
        }
        lockCohort(d, c.id)
        d.id = nextId()
        d.createdAt = base.createdAt ?? now
        d.updatedAt = base.updatedAt ?? now
        d.history = [
          {
            version: 1,
            at: d.createdAt,
            fieldCount: d.fields.length,
            taskType: d.taskType,
            labelField: d.labelField,
            referencedBy: [],
          },
        ]
        d.status = statusOf(checkDataset(d))
        return d
      }

      // 解放军总医院：三个队列各建一个数据集，覆盖三种状态
      const a1 = make(orgNames[0], 0, {
        name: '食管鳞癌复发预测数据集',
        purpose: '基于鳞癌随访队列构建复发预测数据集，用于跨中心复发风险建模',
        desc: '纳入基线、肿瘤标志物与随访结局字段，标签为复发情况（二分类）',
        dataType: DATA_TYPE_OPTIONS[1],
        taskType: '分类',
        fields: ['age', 'gender', 'cea', 'scc', 'cyfra211', 'recurrence'],
        labelField: 'recurrence',
        createdAt: '2026-09-14 10:05',
        updatedAt: '2026-09-14 10:05',
      })
      const a2 = make(orgNames[0], 1, {
        name: '老年患者生存分析数据集',
        purpose: '老年或手术患者的生存时间建模，回归任务预测生存天数',
        desc: '包含人口学与生存随访字段，标签为生存天数',
        dataType: DATA_TYPE_OPTIONS[2],
        taskType: '回归',
        fields: ['age', 'gender', 'ajcc_stage', 'survival_days'],
        labelField: 'survival_days',
        createdAt: '2026-09-26 16:40',
        updatedAt: '2026-09-26 16:40',
      })
      const a3 = make(orgNames[0], 2, {
        name: '肿瘤标志物聚类数据集',
        purpose: '对鳞状细胞癌抗原升高患者做标志物模式聚类，探索亚型',
        desc: '无监督任务，仅使用检验指标作为特征',
        dataType: DATA_TYPE_OPTIONS[0],
        taskType: '无监督',
        fields: ['cea', 'scc', 'ca199', 'cyfra211', 'afp'],
        labelField: '',
        createdAt: '2026-10-09 09:12',
        updatedAt: '2026-10-09 09:12',
      })

      // 肿瘤医院：一个已授权协作的数据集
      const b1 = make(orgNames[2], 0, {
        name: '局部晚期鳞癌疗效数据集',
        purpose: '新辅助化疗患者的病理缓解与生存分析',
        desc: '已授权参与跨机构协作任务',
        dataType: DATA_TYPE_OPTIONS[1],
        taskType: '分类',
        fields: ['age', 'gender', 'scc', 'ajcc_stage', 'vital_status'],
        labelField: 'vital_status',
        createdAt: '2026-09-18 14:20',
        updatedAt: '2026-09-18 14:20',
      })
      if (b1) b1.shared = true

      // 中日友好医院：一个已授权协作的数据集
      const c1 = make(orgNames[1], 0, {
        name: '食管腺癌免疫治疗数据集',
        purpose: '免疫治疗患者生存状态分类建模',
        desc: '已授权参与跨机构协作任务',
        dataType: DATA_TYPE_OPTIONS[2],
        taskType: '分类',
        fields: ['age', 'gender', 'cea', 'followup_days', 'vital_status'],
        labelField: 'vital_status',
        createdAt: '2026-09-28 11:30',
        updatedAt: '2026-10-02 16:20',
      })
      if (c1) c1.shared = true

      const all = [a1, a2, a3, b1, c1].filter((x): x is Dataset => !!x)
      this.list.unshift(...all)

      // 演示：其中两个已被联邦任务引用，禁止直接删除
      for (const [d, taskId] of [
        [a1, 'FT-2026-003'],
        [a3, 'FT-2026-005'],
      ] as [Dataset | null, string][]) {
        if (!d) continue
        d.referencedBy = [taskId]
        if (d.history[0]) d.history[0].referencedBy = [taskId]
        d.status = statusOf(checkDataset(d))
      }
    },

    /** 新建 */
    create(draft: Dataset): Dataset {
      const now = today()
      const item: Dataset = {
        ...draft,
        id: nextId(),
        fields: draft.fields.map((f) => ({ ...f })),
        version: 1,
        referencedBy: [],
        createdAt: now,
        updatedAt: now,
        history: [
          {
            version: 1,
            at: now,
            fieldCount: draft.fields.length,
            taskType: draft.taskType,
            labelField: draft.labelField,
            referencedBy: [],
          },
        ],
      }
      item.status = statusOf(checkDataset(item))
      this.list.unshift(item)
      return item
    },

    /** 编辑：版本 +1，保留创建时间与任务引用 */
    update(id: string, draft: Dataset): Dataset | undefined {
      const idx = this.list.findIndex((d) => d.id === id)
      if (idx < 0) return
      const old = this.list[idx]
      const next: Dataset = {
        ...draft,
        id,
        fields: draft.fields.map((f) => ({ ...f })),
        version: old.version + 1,
        createdAt: old.createdAt,
        referencedBy: [...old.referencedBy],
        updatedAt: today(),
        history: [
          ...(old.history ?? []).map((h) => ({ ...h, referencedBy: [...h.referencedBy] })),
          {
            version: old.version + 1,
            at: today(),
            fieldCount: draft.fields.length,
            taskType: draft.taskType,
            labelField: draft.labelField,
            // 新版本尚未被任务引用；历史版本的引用记录保留在各自快照中
            referencedBy: [],
          },
        ],
      }
      next.status = statusOf(checkDataset(next))
      this.list[idx] = next
      return next
    },

    /** 复制：只复制配置，不复制患者数据；不继承任务引用 */
    duplicate(id: string): Dataset | undefined {
      const src = this.list.find((d) => d.id === id)
      if (!src) return
      const now = today()
      const item: Dataset = {
        ...src,
        id: nextId(),
        name: `${src.name}（副本）`,
        fields: src.fields.map((f) => ({ ...f })),
        version: 1,
        referencedBy: [],
        shared: false,
        createdAt: now,
        updatedAt: now,
        history: [
          {
            version: 1,
            at: now,
            fieldCount: src.fields.length,
            taskType: src.taskType,
            labelField: src.labelField,
            referencedBy: [],
          },
        ],
      }
      item.status = statusOf(checkDataset(item))
      this.list.unshift(item)
      return item
    },

    /**
     * 删除：被任务引用的数据集禁止删除
     * @returns { ok: boolean; reason?: string }
     */
    remove(id: string): { ok: boolean; reason?: string } {
      const idx = this.list.findIndex((d) => d.id === id)
      if (idx < 0) return { ok: false, reason: '数据集不存在' }
      const d = this.list[idx]
      if (d.referencedBy.length) {
        return {
          ok: false,
          reason: `该数据集已被联邦任务 ${d.referencedBy.join('、')} 引用，不能删除。请先结束或解除任务引用。`,
        }
      }
      this.list.splice(idx, 1)
      return { ok: true }
    },

    /** 重算状态（队列或标准数据变化后调用） */
    recalc(id: string) {
      const d = this.list.find((x) => x.id === id)
      if (!d) return
      d.status = statusOf(checkDataset(d))
    },

    /** 登记任务引用（同时记录到当前最新版本快照） */
    addTaskRef(id: string, taskId: string) {
      const d = this.list.find((x) => x.id === id)
      if (!d) return
      if (!d.referencedBy.includes(taskId)) d.referencedBy.push(taskId)
      const last = d.history[d.history.length - 1]
      if (last && !last.referencedBy.includes(taskId)) last.referencedBy.push(taskId)
    },

    /** 检查结果（供详情页调用） */
    checksOf(d: Dataset): CheckItem[] {
      return checkDataset(d)
    },
  },
})
