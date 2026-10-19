import { defineStore } from 'pinia'
import { orgNames } from '@/mock/organizations'
import { useCohortStore } from './cohort'
import { useDatasetStore, type Dataset } from './dataset'
import { nodesOfOrg, type ComputeNode } from '@/mock/computeNodes'

/* ============================================================
   联邦任务：应用端「联邦任务中心」与后台「审批管理」的统一数据底座
   - 牵头机构下发任务 → 参与机构审批 → 牵头机构确认 → 发起训练请求
     → 参与机构准备环境并接受 → 执行训练 → 查看结果
   - 两模块通过任务编号 / 机构标识 / 配置版本关联
   - 审批记录与训练记录分别保存，可互相追溯
   ============================================================ */

/** 7 个核心状态，不额外扩展 */
export type TaskStatus =
  | '待审批'
  | '审批未通过'
  | '待确认'
  | '待执行'
  | '训练中'
  | '已完成'
  | '失败'

export type ApprovalState = 'pending' | 'approved' | 'rejected'
export type TrainState = '未开始' | '准备中' | '就绪' | '训练中' | '完成' | '失败'

export const TASK_STATUS_OPTIONS: TaskStatus[] = [
  '待审批',
  '审批未通过',
  '待确认',
  '待执行',
  '训练中',
  '已完成',
  '失败',
]

export const STATUS_COLOR: Record<TaskStatus, string> = {
  待审批: '#f59e0b',
  审批未通过: '#f43f5e',
  待确认: '#3b82f6',
  待执行: '#0ea5e9',
  训练中: '#8b5cf6',
  已完成: '#10b981',
  失败: '#64748b',
}

/** 参与机构的本机构训练配置（确认训练请求后填写） */
export interface LocalTrainConfig {
  /** 参与训练的本机构数据集 */
  datasetIds: string[]
  /** 执行训练的计算节点 */
  nodeId: string
  /** 本地训练轮次 */
  epochs: number
  batch: number
  lr: number
  configuredAt?: string
}

export interface Participant {
  org: string
  /* 审批 */
  approval: ApprovalState
  opinion?: string
  conditions?: string
  approvedAt?: string
  /** 数据可用情况：ok 全部可用 / partial 部分可用 / none 不可用 */
  dataAvailable?: 'ok' | 'partial' | 'none'
  /* 训练 */
  trainStatus: TrainState
  trainProgress: number
  result?: string
  /** 本机构训练配置（确认训练请求后在任务配置环节填写） */
  localConfig?: LocalTrainConfig
}

export interface TaskRequirement {
  cohortId: string
  cohortName: string
  fieldKeys: string[]
  labelField: string
  taskType: '分类' | '回归' | '无监督'
  algorithm: string
  modelType: string
  params: { rounds: number; epochs: number; batch: number; lr: number }
  compute: { cpuCores: number; memory: string; gpuMemory: number; storage: string; network: string }
}

export interface TaskResult {
  metric: string
  value: string
  note: string
}

export interface FederatedTask {
  id: string
  name: string
  purpose: string
  leaderOrg: string
  configVersion: string
  createdAt: string
  updatedAt: string
  status: TaskStatus
  participants: Participant[]
  req: TaskRequirement
  results?: TaskResult[]
  /** 结果是否为模拟数据（后端未接入时为 true） */
  simulated?: boolean
  /** 失败原因（status === 失败 时） */
  failReason?: string
}

/* ---------------- 工具 ---------------- */

function now(): string {
  const d = new Date()
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`
}

let seq = 0
function nextId(): string {
  seq += 1
  return `FT-${new Date().getFullYear()}-${String(100 + seq).padStart(3, '0')}`
}

function emptyParticipant(org: string): Participant {
  return { org, approval: 'pending', trainStatus: '未开始', trainProgress: 0 }
}

/** 仅当任务仍处于「审批阶段」时才重新推导状态，避免覆盖 待执行/训练中/已完成/失败 */
function recompute(task: FederatedTask): void {
  if (!['待审批', '审批未通过', '待确认'].includes(task.status)) return
  const ps = task.participants
  if (ps.some((p) => p.approval === 'rejected')) task.status = '审批未通过'
  else if (ps.every((p) => p.approval === 'approved')) task.status = '待确认'
  else if (ps.some((p) => p.approval === 'pending')) task.status = '待审批'
}

/* ---------------- 参与方本机构核查（供审批端复用） ---------------- */

export interface OrgMatch {
  org: string
  /** 匹配的训练任务类型数据集数量 */
  datasetCount: number
  /** 可参与样本规模 */
  sampleCount: number
  /** 所需字段覆盖数 / 总数 */
  fieldCovered: number
  fieldTotal: number
  /** 字段匹配率 */
  fieldRate: number
  /** 任务要求中本机构缺失的字段 */
  missingFields: string[]
  /** 计算资源是否就绪 */
  computeReady: boolean
  nodeSummary: { online: number; total: number; gpuMemoryTotal: number; cpuCores: number }
}

/** 本机构与任务要求完全匹配的数据集（任务类型 / 标签 / 所需字段全含） */
export function matchDatasets(org: string, req: TaskRequirement): Dataset[] {
  const ds = useDatasetStore()
  return ds.list.filter(
    (d) =>
      d.org === org &&
      d.taskType === req.taskType &&
      (req.taskType === '无监督' ? true : d.labelField === req.labelField) &&
      req.fieldKeys.every((k) => d.fields.some((f) => f.key === k)),
  )
}

/** 某机构针对任务要求的本地数据 / 算力核查 */
export function matchOrg(org: string, req: TaskRequirement): OrgMatch {
  const ds = useDatasetStore()
  const dsList = ds.list.filter((d) => d.org === org)
  const matched = matchDatasets(org, req)
  const sampleCount = matched.reduce((n, d) => n + d.sampleCount, 0)
  // 覆盖情况按本机构全部数据集计算（而非仅完全匹配的数据集），便于指出字段缺口
  const have = new Set(dsList.flatMap((d) => d.fields.map((f) => f.key)))
  const fieldCovered = req.fieldKeys.filter((k) => have.has(k)).length
  const fieldTotal = req.fieldKeys.length
  const fieldRate = fieldTotal ? Math.round((fieldCovered / fieldTotal) * 100) : 100
  const missingFields = req.fieldKeys.filter((k) => !have.has(k))

  const nodes = nodesOfOrg(org)
  const online = nodes.filter((n) => n.status === '在线')
  const cpuReady = online.reduce((n, x) => n + x.cpuCores, 0) >= req.compute.cpuCores
  const gpuReady =
    req.compute.gpuMemory === 0
      ? true
      : online.reduce((n, x) => n + x.gpuMemoryTotal, 0) >= req.compute.gpuMemory
  const netReady = online.some((n) => n.network === req.compute.network || req.compute.network === '内网')
  const computeReady = cpuReady && gpuReady && netReady

  return {
    org,
    datasetCount: matched.length,
    sampleCount,
    fieldCovered,
    fieldTotal,
    fieldRate,
    missingFields,
    computeReady,
    nodeSummary: {
      online: online.length,
      total: nodes.length,
      gpuMemoryTotal: online.reduce((n, x) => n + x.gpuMemoryTotal, 0),
      cpuCores: online.reduce((n, x) => n + x.cpuCores, 0),
    },
  }
}

/* ---------------- store ---------------- */

export const useFederatedStore = defineStore('federated', {
  state: () => ({ list: [] as FederatedTask[], seeded: false }),
  getters: {
    /** 牵头机构视角的任务：leaderOrg === org */
    asLeader() {
      return (org: string) => this.list.filter((t) => t.leaderOrg === org)
    },
    /** 参与机构视角的任务：该机构是参与方 */
    asParticipant() {
      return (org: string) => this.list.filter((t) => t.participants.some((p) => p.org === org))
    },
    /** 本机构相关任务（牵头 + 参与），应用端「联邦任务中心」列表用 */
    involving() {
      return (org: string) =>
        this.list.filter((t) => t.leaderOrg === org || t.participants.some((p) => p.org === org))
    },
    getById() {
      return (id: string) => this.list.find((t) => t.id === id)
    },
  },
  actions: {
    ensureSeed() {
      if (this.seeded) return
      this.seeded = true
      const cs = useCohortStore()
      const ds = useDatasetStore()
      ds.ensureSeed()
      const leader = orgNames[0]

      const cohort = cs.list.find((c) => c.org === leader && c.name.includes('鳞癌随访'))!
      const cohortId = cohort?.id ?? 'CQ-001'
      const cohortName = cohort?.name ?? '食管鳞癌随访队列'

      const baseReq = (over: Partial<TaskRequirement> = {}): TaskRequirement => ({
        cohortId,
        cohortName,
        fieldKeys: ['age', 'gender', 'scc', 'ajcc_stage', 'vital_status'],
        labelField: 'vital_status',
        taskType: '分类',
        algorithm: 'FedAvg',
        modelType: '逻辑回归',
        params: { rounds: 20, epochs: 5, batch: 64, lr: 0.01 },
        compute: { cpuCores: 32, memory: '≥ 128 GB', gpuMemory: 24, storage: '≥ 500 GB', network: '专线' },
        ...over,
      })

      const mk = (
        id: string,
        name: string,
        purpose: string,
        participants: Participant[],
        status: TaskStatus,
        over: Partial<TaskRequirement> = {},
        extra: Partial<FederatedTask> = {},
      ): FederatedTask => ({
        id,
        name,
        purpose,
        leaderOrg: leader,
        configVersion: 'v1',
        createdAt: '2026-09-20 09:30',
        updatedAt: '2026-10-10 15:00',
        status,
        participants,
        req: baseReq(over),
        ...extra,
      })

      const today = now()
      const p = (orgs: string[], set: Partial<Participant> = {}) =>
        orgs.map((o) => ({ ...emptyParticipant(o), ...set }))

      /** 已进入训练阶段的机构，补一份本机构训练配置，便于回看配置内容 */
      const cfg = (org: string, nodeId: string, at: string): LocalTrainConfig => ({
        datasetIds: ds.list.filter((d) => d.org === org).slice(0, 1).map((d) => d.id),
        nodeId,
        epochs: 5,
        batch: 64,
        lr: 0.01,
        configuredAt: at,
      })

      this.list.push(
        // 1. 待审批
        mk(
          'FT-2026-001',
          '多中心食管癌生存预测',
          '联合三家中心构建食管癌生存状态预测模型',
          p(['中日友好医院', '肿瘤医院']),
          '待审批',
        ),
        // 2. 待确认（两方均已通过）
        mk(
          'FT-2026-002',
          '跨中心鳞癌复发风险建模',
          '基于多中心鳞癌随访数据建模复发风险',
          [
            {
              ...emptyParticipant('中日友好医院'),
              approval: 'approved',
              approvedAt: '2026-10-08 11:20',
              opinion: '数据可用，字段匹配，同意参与。',
              dataAvailable: 'ok',
            },
            {
              ...emptyParticipant('肿瘤医院'),
              approval: 'approved',
              approvedAt: '2026-10-09 14:05',
              opinion: '计算资源就绪，同意参与。',
              dataAvailable: 'ok',
            },
          ],
          '待确认',
        ),
        // 3. 待执行（已确认，下发训练请求）
        mk(
          'FT-2026-003',
          '食管腺癌免疫疗效联合分析',
          '联合评估免疫治疗患者生存状态',
          [
            {
              ...emptyParticipant('中日友好医院'),
              approval: 'approved',
              approvedAt: '2026-09-22 10:00',
              dataAvailable: 'ok',
              trainStatus: '未开始',
            },
            {
              ...emptyParticipant('肿瘤医院'),
              approval: 'approved',
              approvedAt: '2026-09-23 09:30',
              dataAvailable: 'ok',
              trainStatus: '未开始',
            },
          ],
          '待执行',
          {},
          { updatedAt: '2026-09-25 16:40' },
        ),
        // 4. 训练中（一方已接受并开始，一方未开始）
        mk(
          'FT-2026-004',
          '肿瘤标志物模式联合聚类',
          '多中心标志物数据无监督聚类探索亚型',
          [
            {
              ...emptyParticipant('中日友好医院'),
              approval: 'approved',
              approvedAt: '2026-10-01 10:00',
              dataAvailable: 'ok',
              trainStatus: '训练中',
              trainProgress: 36,
              localConfig: cfg('中日友好医院', 'ZRY-CN-01', '2026-10-03 09:20'),
            },
            {
              ...emptyParticipant('肿瘤医院'),
              approval: 'approved',
              approvedAt: '2026-10-02 09:10',
              dataAvailable: 'ok',
              trainStatus: '未开始',
            },
          ],
          '训练中',
          { taskType: '无监督', labelField: '', fieldKeys: ['cea', 'scc', 'ca199', 'cyfra211', 'afp'] },
        ),
        // 5. 已完成（模拟结果）
        mk(
          'FT-2026-005',
          '老年手术患者生存回归',
          '老年或手术患者生存天数回归建模',
          [
            {
              ...emptyParticipant('中日友好医院'),
              approval: 'approved',
              approvedAt: '2026-09-10 10:00',
              dataAvailable: 'ok',
              trainStatus: '完成',
              trainProgress: 100,
              result: 'auc 0.81',
              localConfig: cfg('中日友好医院', 'ZRY-CN-01', '2026-09-12 10:05'),
            },
            {
              ...emptyParticipant('肿瘤医院'),
              approval: 'approved',
              approvedAt: '2026-09-11 09:00',
              dataAvailable: 'ok',
              trainStatus: '完成',
              trainProgress: 100,
              result: 'auc 0.79',
              localConfig: cfg('肿瘤医院', 'ZLY-CN-01', '2026-09-12 15:40'),
            },
          ],
          '已完成',
          { taskType: '回归', labelField: 'survival_days', fieldKeys: ['age', 'gender', 'ajcc_stage', 'survival_days'], algorithm: 'FATE-LR', modelType: '线性回归' },
          {
            updatedAt: '2026-09-30 18:00',
            simulated: true,
            results: [
              { metric: '联合模型 AUC', value: '0.80', note: '五折交叉验证均值（模拟数据）' },
              { metric: 'C-index', value: '0.77', note: '生存模型区分度（模拟数据）' },
              { metric: '参与样本', value: '1,284 例', note: '两中心合并去重后（模拟统计）' },
            ],
          },
        ),
        // 6. 审批未通过（肿瘤医院不通过）
        mk(
          'FT-2026-006',
          '晚期患者新辅助疗效预测',
          '新辅助化疗病理缓解预测',
          [
            {
              ...emptyParticipant('中日友好医院'),
              approval: 'approved',
              approvedAt: '2026-10-05 10:00',
              dataAvailable: 'ok',
            },
            {
              ...emptyParticipant('肿瘤医院'),
              approval: 'rejected',
              approvedAt: '2026-10-06 11:20',
              opinion: '本中心相关队列样本不足，暂不参与。',
              dataAvailable: 'none',
            },
          ],
          '审批未通过',
          { fieldKeys: ['age', 'gender', 'scc', 'ajcc_stage', 'vital_status', 'recurrence'] },
        ),
      )
      void today
    },

    /** 牵头机构新建任务并下发 */
    createTask(payload: {
      name: string
      purpose: string
      leaderOrg: string
      participantOrgs: string[]
      req: TaskRequirement
    }): FederatedTask {
      const t: FederatedTask = {
        id: nextId(),
        name: payload.name,
        purpose: payload.purpose,
        leaderOrg: payload.leaderOrg,
        configVersion: 'v1',
        createdAt: now(),
        updatedAt: now(),
        status: '待审批',
        participants: payload.participantOrgs.map((o) => emptyParticipant(o)),
        req: payload.req,
        simulated: true,
      }
      this.list.unshift(t)
      return t
    },

    /** 参与机构审批通过 */
    approve(taskId: string, org: string, opinion: string, conditions: string) {
      const t = this.getById(taskId)
      if (!t) return
      const p = t.participants.find((x) => x.org === org)
      if (!p) return
      p.approval = 'approved'
      p.opinion = opinion || '同意参与。'
      p.conditions = conditions || ''
      p.approvedAt = now()
      p.dataAvailable = 'ok'
      t.updatedAt = now()
      recompute(t)
    },

    /** 参与机构审批不通过 */
    reject(taskId: string, org: string, opinion: string, conditions: string) {
      const t = this.getById(taskId)
      if (!t) return
      const p = t.participants.find((x) => x.org === org)
      if (!p) return
      p.approval = 'rejected'
      p.opinion = opinion || '不予通过。'
      p.conditions = conditions || ''
      p.approvedAt = now()
      p.dataAvailable = 'none'
      t.updatedAt = now()
      recompute(t)
    },

    /** 牵头机构确认参与范围并发起正式训练请求（需全部通过） */
    confirmAndLaunch(taskId: string): { ok: boolean; reason?: string } {
      const t = this.getById(taskId)
      if (!t) return { ok: false, reason: '任务不存在' }
      if (t.status !== '待确认') return { ok: false, reason: '存在未通过审批，无法发起训练' }
      t.status = '待执行'
      for (const p of t.participants) {
        if (p.approval === 'approved') p.trainStatus = '未开始'
      }
      t.updatedAt = now()
      return { ok: true }
    },

    /** 参与机构确认训练请求，进入本机构任务配置环节 */
    ackTrainingRequest(taskId: string, org: string): { ok: boolean; reason?: string } {
      const t = this.getById(taskId)
      if (!t) return { ok: false, reason: '任务不存在' }
      if (t.status !== '待执行' && t.status !== '训练中')
        return { ok: false, reason: '牵头机构尚未下发训练请求' }
      const p = t.participants.find((x) => x.org === org)
      if (!p) return { ok: false, reason: '本机构不是参与方' }
      if (p.approval !== 'approved') return { ok: false, reason: '本机构尚未通过审批' }
      if (p.trainStatus !== '未开始') return { ok: false, reason: '本机构已处理该训练请求' }
      p.trainStatus = '准备中'
      t.updatedAt = now()
      return { ok: true }
    },

    /** 参与机构保存本机构训练配置（数据集 / 计算节点 / 本地参数） */
    saveLocalConfig(taskId: string, org: string, config: LocalTrainConfig): { ok: boolean; reason?: string } {
      const t = this.getById(taskId)
      if (!t) return { ok: false, reason: '任务不存在' }
      const p = t.participants.find((x) => x.org === org)
      if (!p) return { ok: false, reason: '本机构不是参与方' }
      if (p.trainStatus !== '准备中') return { ok: false, reason: '请先确认训练请求' }
      if (!config.datasetIds.length) return { ok: false, reason: '请选择参与训练的数据集' }
      if (!config.nodeId) return { ok: false, reason: '请选择计算节点' }
      p.localConfig = { ...config, configuredAt: now() }
      p.trainStatus = '就绪'
      t.updatedAt = now()
      return { ok: true }
    },

    /** 参与机构配置完成后启动本地训练 */
    startLocalTraining(taskId: string, org: string): { ok: boolean; reason?: string } {
      const t = this.getById(taskId)
      if (!t) return { ok: false, reason: '任务不存在' }
      const p = t.participants.find((x) => x.org === org)
      if (!p) return { ok: false, reason: '本机构不是参与方' }
      if (p.trainStatus !== '就绪') return { ok: false, reason: '本机构训练配置尚未完成' }
      p.trainStatus = '训练中'
      p.trainProgress = 0
      if (t.status === '待执行') t.status = '训练中'
      t.updatedAt = now()
      return { ok: true }
    },

    /** 牵头机构推进训练（模拟局部迭代） */
    advanceTraining(taskId: string): { ok: boolean; reason?: string } {
      const t = this.getById(taskId)
      if (!t) return { ok: false, reason: '任务不存在' }
      if (t.status !== '训练中') return { ok: false, reason: '当前状态不可推进训练' }
      let changed = false
      for (const p of t.participants) {
        if (p.trainStatus === '训练中') {
          p.trainProgress = Math.min(100, p.trainProgress + 34)
          if (p.trainProgress >= 100) p.trainStatus = '完成'
          changed = true
        }
      }
      if (!changed) return { ok: false, reason: '暂无参与方处于训练中' }
      if (t.participants.every((p) => p.trainStatus === '完成')) {
        t.status = '已完成'
        t.simulated = true
        t.results = [
          { metric: '联合模型 AUC', value: '0.82', note: '本轮验证均值（模拟数据）' },
          { metric: '参与样本', value: `${t.participants.length} 家中心`, note: '本地数据不出域（模拟统计）' },
        ]
      }
      t.updatedAt = now()
      return { ok: true }
    },

    /** 标记训练失败 */
    failTraining(taskId: string, reason: string) {
      const t = this.getById(taskId)
      if (!t) return
      t.status = '失败'
      t.failReason = reason || '训练执行失败'
      t.updatedAt = now()
    },
  },
})
