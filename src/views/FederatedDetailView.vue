<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import AppIcon from '@/components/AppIcon.vue'
import TrainingManage from '@/components/training/TrainingManage.vue'
import {
  useFederatedStore,
  STATUS_COLOR,
  matchOrg,
  type ApprovalState,
  type LocalTrainConfig,
} from '@/store/federated'
import { useOrgStore } from '@/store/org'
import { useDatasetStore, type Dataset } from '@/store/dataset'
import { nodesOfOrg } from '@/mock/computeNodes'
import { fieldDef } from '@/mock/datasetFields'

const route = useRoute()
const router = useRouter()
const store = useFederatedStore()
const orgStore = useOrgStore()
const datasetStore = useDatasetStore()
onMounted(() => {
  store.ensureSeed()
  datasetStore.ensureSeed()
})

const id = computed(() => route.params.id as string)
const task = computed(() => store.getById(id.value))

/** 当前机构视角：牵头方可发起 / 推进，参与方确认训练请求并配置本机构训练 */
const currentOrg = computed(() => orgStore.appCurrent)
const isLeader = computed(() => task.value?.leaderOrg === currentOrg.value)
const myPart = computed(() => task.value?.participants.find((p) => p.org === currentOrg.value))

const tab = ref('overview')

const approvalLabel: Record<ApprovalState, string> = { pending: '待审批', approved: '已通过', rejected: '未通过' }
const approvalColor: Record<ApprovalState, string> = { pending: '#f59e0b', approved: '#10b981', rejected: '#f43f5e' }
const trainColor: Record<string, string> = {
  未开始: '#64748b',
  准备中: '#f59e0b',
  就绪: '#0ea5e9',
  训练中: '#8b5cf6',
  完成: '#10b981',
  失败: '#f43f5e',
}

/* ---------------- 参与方统计 ---------------- */

const totalOrgs = computed(() => task.value?.participants.length ?? 0)
const approvedCount = computed(() => task.value?.participants.filter((p) => p.approval === 'approved').length ?? 0)
const pendingCount = computed(() => task.value?.participants.filter((p) => p.approval === 'pending').length ?? 0)
const rejectedCount = computed(() => task.value?.participants.filter((p) => p.approval === 'rejected').length ?? 0)
const trainingCount = computed(() => task.value?.participants.filter((p) => p.trainStatus === '训练中').length ?? 0)
const doneCount = computed(() => task.value?.participants.filter((p) => p.trainStatus === '完成').length ?? 0)

const approvalPct = computed(() => (totalOrgs.value ? Math.round((approvedCount.value / totalOrgs.value) * 100) : 0))

const approvalSegments = computed(() => {
  const base = [
    { key: 'approved', label: '已通过', count: approvedCount.value, color: '#10b981' },
    { key: 'pending', label: '待审批', count: pendingCount.value, color: '#f59e0b' },
    { key: 'rejected', label: '未通过', count: rejectedCount.value, color: '#f43f5e' },
  ]
  const total = totalOrgs.value || 1
  return base.map((s) => ({ ...s, pct: (s.count / total) * 100 }))
})

/* ---------------- 参与方：训练请求 ---------------- */

/** 本机构有待处理的训练请求：已通过审批、尚未确认，且牵头方已下发 */
const canAck = computed(
  () =>
    !!myPart.value &&
    !isLeader.value &&
    myPart.value.approval === 'approved' &&
    myPart.value.trainStatus === '未开始' &&
    (task.value?.status === '待执行' || task.value?.status === '训练中'),
)

/** 有请求待确认时默认落在「训练请求」页；请求处理完或切换机构后回到任务配置 */
watch(
  canAck,
  (v) => {
    if (v) tab.value = 'request'
    else if (tab.value === 'request') tab.value = 'overview'
  },
  { immediate: true },
)

const reqMatch = computed(() => (task.value && !isLeader.value ? matchOrg(currentOrg.value, task.value.req) : null))

function ackRequest() {
  const r = store.ackTrainingRequest(id.value, currentOrg.value)
  if (!r.ok) return ElMessage.warning(r.reason || '无法确认')
  tab.value = 'overview'
  ElMessage.success('已确认训练请求，请配置本机构训练参数')
}

/* ---------------- 参与方：本机构训练配置 ---------------- */

const cfg = ref<LocalTrainConfig>({ datasetIds: [], nodeId: '', epochs: 5, batch: 64, lr: 0.01 })

/** 本机构全部数据集（训练配置的可选范围） */
const orgDatasets = computed(() => datasetStore.list.filter((d) => d.org === currentOrg.value))
const nodeOptions = computed(() => nodesOfOrg(currentOrg.value))

/** 数据集缺哪些任务所需字段 */
function datasetGap(d: Dataset): string[] {
  const have = new Set(d.fields.map((f) => f.key))
  return (task.value?.req.fieldKeys || []).filter((k) => !have.has(k))
}

const selectedGap = computed(() => {
  const gaps = new Set<string>()
  cfg.value.datasetIds.forEach((did) => {
    const d = orgDatasets.value.find((x) => x.id === did)
    if (d) datasetGap(d).forEach((k) => gaps.add(k))
  })
  return [...gaps]
})

const selectedSamples = computed(() =>
  cfg.value.datasetIds.reduce((n, did) => n + (orgDatasets.value.find((x) => x.id === did)?.sampleCount || 0), 0),
)

function initCfg() {
  const t = task.value
  if (!t) return
  const exist = myPart.value?.localConfig
  if (exist) {
    cfg.value = { ...exist }
    return
  }
  const full = orgDatasets.value.filter((d) => datasetGap(d).length === 0).map((d) => d.id)
  cfg.value = {
    datasetIds: full,
    nodeId: nodeOptions.value.find((n) => n.status === '在线')?.id ?? '',
    epochs: t.req.params.epochs,
    batch: t.req.params.batch,
    lr: t.req.params.lr,
  }
}

watch(
  [() => myPart.value?.trainStatus, () => currentOrg.value, id],
  () => {
    if (myPart.value?.trainStatus === '准备中') initCfg()
  },
  { immediate: true },
)

const canEditCfg = computed(() => myPart.value?.trainStatus === '准备中')

function datasetName(did: string) {
  return datasetStore.list.find((d) => d.id === did)?.name ?? did
}

function nodeName(nid?: string) {
  if (!nid) return '—'
  const n = nodeOptions.value.find((x) => x.id === nid)
  return n ? `${n.name}（${n.id}）` : nid
}

function submitCfg() {
  if (!cfg.value.datasetIds.length) return ElMessage.warning('请选择参与训练的数据集')
  if (!cfg.value.nodeId) return ElMessage.warning('请选择计算节点')
  const r1 = store.saveLocalConfig(id.value, currentOrg.value, { ...cfg.value })
  if (!r1.ok) return ElMessage.warning(r1.reason || '配置保存失败')
  const r2 = store.startLocalTraining(id.value, currentOrg.value)
  if (!r2.ok) return ElMessage.warning(r2.reason || '无法启动训练')
  ElMessage.success('本机构训练配置已保存，已开始本地训练')
}

/* ---------------- 牵头方操作 ---------------- */

function confirmLaunch() {
  const r = store.confirmAndLaunch(id.value)
  if (!r.ok) ElMessage.warning(r.reason || '无法发起')
  else ElMessage.success('训练请求已下发至各参与机构')
}
function advance() {
  const r = store.advanceTraining(id.value)
  if (!r.ok) ElMessage.warning(r.reason || '无法推进')
  else if (task.value?.status === '已完成') ElMessage.success('训练已完成（模拟结果）')
}
function fail() {
  ElMessageBox.prompt('请填写失败原因', '标记训练失败', { inputType: 'textarea' })
    .then(({ value }) => {
      store.failTraining(id.value, value || '训练执行失败')
      ElMessage.info('已标记为失败')
    })
    .catch(() => {})
}

const fieldLabels = computed(() => (task.value?.req.fieldKeys || []).map((k) => fieldDef(k)?.label ?? k))

/* ---------------- 视图辅助 ---------------- */

const tabs = computed(() => {
  const list: { name: string; label: string; count?: string }[] = []
  if (canAck.value) list.push({ name: 'request', label: '训练请求' })
  list.push({ name: 'overview', label: '任务配置' })
  list.push({ name: 'approval', label: '审批反馈', count: `${approvedCount.value}/${totalOrgs.value}` })
  list.push({ name: 'train', label: '训练管理' })
  return list
})

const statusStyle = computed(() => {
  const s = task.value?.status
  const c = s ? STATUS_COLOR[s] : '#6366f1'
  return { color: c, background: c + '14', borderColor: c + '38' }
})

const avatarPalettes: [string, string][] = [
  ['#6366f1', '#8b5cf6'],
  ['#06b6d4', '#22d3ee'],
  ['#8b5cf6', '#a855f7'],
  ['#3b82f6', '#60a5fa'],
  ['#10b981', '#34d399'],
  ['#f59e0b', '#fbbf24'],
]
function orgAvatar(org: string) {
  let h = 0
  for (const ch of org) h = (h * 31 + ch.charCodeAt(0)) >>> 0
  const [a, b] = avatarPalettes[h % avatarPalettes.length]
  return { background: `linear-gradient(135deg, ${a}, ${b})` }
}

const resultTones: [string, string][] = [
  ['#6366f1', '#8b5cf6'],
  ['#06b6d4', '#22d3ee'],
  ['#8b5cf6', '#a855f7'],
  ['#10b981', '#34d399'],
]
function resultStyle(i: number) {
  const [a, b] = resultTones[i % resultTones.length]
  return { background: `linear-gradient(90deg, ${a}, ${b})` }
}

const dataAvailLabel: Record<string, string> = { ok: '可用', partial: '部分可用', none: '不可用' }

/** 状态标签的软底描边样式 */
function softTag(color: string) {
  return { color, background: color + '14', borderColor: color + '30' }
}
</script>

<template>
  <div v-if="task" class="fd">
    <!-- 页头 -->
    <header class="fd-head" v-reveal>
      <div class="fd-head__bar">
        <div class="fd-head__id">
          <h1 class="fd-title">{{ task.name }}</h1>
          <span class="fd-status" :style="statusStyle"><i></i>{{ task.status }}</span>
        </div>
        <div class="fd-head__ops">
          <el-button v-if="isLeader && task.status === '待确认'" type="primary" size="small" @click="confirmLaunch">
            确认参与范围并发起训练
          </el-button>
          <template v-else-if="isLeader && task.status === '训练中'">
            <el-button size="small" @click="fail">标记失败</el-button>
            <el-button type="primary" size="small" @click="advance">推进训练</el-button>
          </template>
          <el-button text size="small" class="fd-back" @click="router.push('/federated')">返回列表</el-button>
        </div>
      </div>

      <!-- 页签 -->
      <nav class="fd-tabs" role="tablist">
        <button
          v-for="t in tabs"
          :key="t.name"
          class="fd-tab"
          :class="{ 'is-active': tab === t.name }"
          role="tab"
          :aria-selected="tab === t.name"
          @click="tab = t.name"
        >
          {{ t.label }}
          <span v-if="t.count" class="fd-tab__count">{{ t.count }}</span>
        </button>
      </nav>
    </header>

    <div :key="tab" class="fd-pane">
      <!-- 训练请求 -->
      <section v-if="tab === 'request'" class="pf-card panel panel--request">
        <div class="panel__head">
          <div class="panel__head-main">
            <span class="panel__icon panel__icon--warning"><AppIcon name="files" tone="warning" /></span>
            <div>
              <h3 class="panel__title">训练请求</h3>
              <p class="panel__sub">{{ task.leaderOrg }} 下发 · {{ task.configVersion }}</p>
            </div>
          </div>
          <span class="panel__chip">{{ task.status }}</span>
        </div>

        <div class="spec">
          <div class="spec__cell"><span>算法 / 模型</span><b>{{ task.req.algorithm }} · {{ task.req.modelType }}</b></div>
          <div class="spec__cell"><span>全局轮次</span><b>{{ task.req.params.rounds }} 轮</b></div>
          <div class="spec__cell"><span>本地轮次 / 批大小 / 学习率</span><b>{{ task.req.params.epochs }} / {{ task.req.params.batch }} / {{ task.req.params.lr }}</b></div>
          <div class="spec__cell">
            <span>算力要求</span>
            <b>CPU {{ task.req.compute.cpuCores }} 核 · 显存 {{ task.req.compute.gpuMemory }}GB · {{ task.req.compute.network }}</b>
          </div>
          <div v-if="reqMatch" class="spec__cell"><span>完全匹配数据集</span><b>{{ reqMatch.datasetCount }} 个 · {{ reqMatch.sampleCount }} 例</b></div>
          <div v-if="reqMatch" class="spec__cell">
            <span>本机构算力</span>
            <b :class="reqMatch.computeReady ? 'spec__ok' : 'spec__warn'">{{ reqMatch.computeReady ? '就绪' : '需扩容' }}</b>
          </div>
        </div>

        <p v-if="reqMatch && !reqMatch.datasetCount" class="spec__gap">
          本机构暂无完全匹配的数据集，可在任务配置环节自选数据集并补齐缺失字段。
        </p>

        <div class="panel__foot">
          <el-button type="primary" @click="ackRequest">确认训练请求</el-button>
        </div>
      </section>

      <!-- 任务配置 -->
      <template v-if="tab === 'overview'">
        <section v-if="!isLeader" class="pf-card panel">
          <div class="panel__head">
            <div class="panel__head-main">
              <span class="panel__icon"><AppIcon name="cpu" tone="violet" /></span>
              <div>
                <h3 class="panel__title">本机构训练配置</h3>
                <p class="panel__sub">{{ currentOrg }}</p>
              </div>
            </div>
            <span class="panel__chip" :style="{ color: trainColor[myPart?.trainStatus || '未开始'], background: trainColor[myPart?.trainStatus || '未开始'] + '12' }">
              {{ myPart?.trainStatus || '未开始' }}
            </span>
          </div>

          <!-- 可编辑 -->
          <div v-if="canEditCfg" class="cfg">
            <div class="cfg__row">
              <span class="cfg__lb">参与训练的数据集</span>
              <el-select v-model="cfg.datasetIds" multiple size="small" style="width: 100%" placeholder="选择本机构数据集">
                <el-option v-for="d in orgDatasets" :key="d.id" :label="d.name" :value="d.id">
                  <span class="cfg__opt">{{ d.name }}</span>
                  <span class="cfg__opt-meta">
                    {{ d.sampleCount }} 例 ·
                    <em v-if="datasetGap(d).length" class="cfg__warn">缺 {{ datasetGap(d).length }} 字段</em>
                    <em v-else>字段完整</em>
                  </span>
                </el-option>
              </el-select>
              <p class="cfg__hint">已选 {{ cfg.datasetIds.length }} 个数据集 · 合计 {{ selectedSamples }} 例</p>
              <p v-if="selectedGap.length" class="spec__gap">
                所选数据集缺少任务所需字段：{{ selectedGap.map((k) => fieldDef(k)?.label ?? k).join('、') }}
              </p>
            </div>

            <div class="cfg__row">
              <span class="cfg__lb">计算节点</span>
              <el-select v-model="cfg.nodeId" size="small" style="width: 100%" placeholder="选择执行训练的计算节点">
                <el-option
                  v-for="n in nodeOptions"
                  :key="n.id"
                  :label="`${n.name}（${n.id}）· ${n.status}`"
                  :value="n.id"
                  :disabled="n.status === '离线'"
                >
                  <span class="cfg__opt">{{ n.name }}（{{ n.id }}）</span>
                  <span class="cfg__opt-meta">{{ n.gpuModel }} · CPU {{ n.cpuCores }} 核 · {{ n.status }}</span>
                </el-option>
              </el-select>
            </div>

            <div class="cfg__row cfg__row--inline">
              <span class="cfg__lb">本地训练参数</span>
              <div class="cfg__nums">
                <label>本地轮次<el-input-number v-model="cfg.epochs" :min="1" :max="50" size="small" controls-position="right" /></label>
                <label>批大小<el-input-number v-model="cfg.batch" :min="8" :max="512" :step="8" size="small" controls-position="right" /></label>
                <label>学习率<el-input-number v-model="cfg.lr" :min="0.0001" :max="1" :step="0.001" :precision="4" size="small" controls-position="right" /></label>
              </div>
            </div>

            <el-button type="primary" size="small" @click="submitCfg">保存配置并开始训练</el-button>
          </div>

          <!-- 已配置（只读） -->
          <div v-else-if="myPart?.localConfig" class="spec">
            <div class="spec__cell spec__cell--full">
              <span>参与训练的数据集</span>
              <b class="chips">
                <span v-for="d in myPart.localConfig.datasetIds" :key="d" class="chip">{{ datasetName(d) }}</span>
              </b>
            </div>
            <div class="spec__cell"><span>计算节点</span><b>{{ nodeName(myPart.localConfig.nodeId) }}</b></div>
            <div class="spec__cell"><span>配置时间</span><b>{{ myPart.localConfig.configuredAt || '—' }}</b></div>
            <div class="spec__cell spec__cell--full">
              <span>本地训练参数</span>
              <b class="chips">
                <span class="chip chip--num">轮次 {{ myPart.localConfig.epochs }}</span>
                <span class="chip chip--num">批大小 {{ myPart.localConfig.batch }}</span>
                <span class="chip chip--num">学习率 {{ myPart.localConfig.lr }}</span>
              </b>
            </div>
          </div>

          <!-- 空态 -->
          <div v-else class="empty">
            <div class="empty__icon"><AppIcon name="cpu" tone="accent" /></div>
            <div class="empty__body">
              <template v-if="myPart?.approval === 'rejected'">
                <b>本机构审批未通过，不参与本次训练</b>
                <span>如需参与，请由牵头机构重新提交审批。</span>
              </template>
              <template v-else-if="myPart?.approval === 'pending'">
                <b>本机构审批尚未通过</b>
                <span>审批通过并收到训练请求后可配置本机构参数。</span>
              </template>
              <template v-else>
                <b>牵头机构尚未下发训练请求</b>
                <span>收到请求并确认后即可配置本机构训练参数。</span>
                <el-button v-if="canAck" text type="primary" size="small" @click="tab = 'request'">去确认</el-button>
              </template>
            </div>
          </div>
        </section>

        <section class="pf-card panel">
          <div class="panel__head">
            <div class="panel__head-main">
              <span class="panel__icon"><AppIcon name="files" tone="primary" /></span>
              <div>
                <h3 class="panel__title">牵头方任务要求</h3>
                <p class="panel__sub">{{ task.req.cohortName }} · {{ task.req.fieldKeys.length }} 个字段 · CPU {{ task.req.compute.cpuCores }} 核</p>
              </div>
            </div>
            <span class="panel__chip">{{ task.leaderOrg }}</span>
          </div>

          <div class="spec">
            <div class="spec__cell"><span>任务名称</span><b>{{ task.name }}</b></div>
            <div class="spec__cell"><span>研究目的</span><b>{{ task.purpose || '—' }}</b></div>
            <div class="spec__cell"><span>科研队列</span><b>{{ task.req.cohortName }}</b></div>
            <div class="spec__cell">
              <span>任务类型 / 目标标签</span>
              <b>{{ task.req.taskType }} · {{ fieldDef(task.req.labelField)?.label || (task.req.taskType === '无监督' ? '无' : '未设置') }}</b>
            </div>
            <div class="spec__cell"><span>算法 / 模型</span><b>{{ task.req.algorithm }} · {{ task.req.modelType }}</b></div>
            <div class="spec__cell">
              <span>训练参数</span>
              <b>{{ task.req.params.rounds }} 轮 · 本地 {{ task.req.params.epochs }} · 批 {{ task.req.params.batch }} · lr {{ task.req.params.lr }}</b>
            </div>
            <div class="spec__cell spec__cell--full">
              <span>所需字段</span>
              <b class="chips">
                <span v-for="f in fieldLabels" :key="f" class="chip chip--soft">{{ f }}</span>
              </b>
            </div>
            <div class="spec__cell spec__cell--full">
              <span>算力要求</span>
              <b class="chips">
                <span class="chip chip--num">CPU {{ task.req.compute.cpuCores }} 核</span>
                <span class="chip chip--num">显存 {{ task.req.compute.gpuMemory }}GB</span>
                <span class="chip chip--num">{{ task.req.compute.network }}</span>
              </b>
            </div>
          </div>
        </section>
      </template>

      <!-- 审批反馈 -->
      <section v-if="tab === 'approval'" class="pf-card panel">
        <div class="panel__head">
          <div class="panel__head-main">
            <span class="panel__icon panel__icon--success"><AppIcon name="shield" tone="success" /></span>
            <div>
              <h3 class="panel__title">机构审批</h3>
              <p class="panel__sub">{{ approvedCount }} / {{ totalOrgs }} 家已通过</p>
            </div>
          </div>
        </div>

        <div class="approve">
          <div class="approve__num">
            <b :class="{ 'is-full': approvalPct === 100 }">{{ approvalPct }}<small>%</small></b>
            <span>审批通过率</span>
          </div>
          <div class="approve__right">
            <div class="segbar">
              <i
                v-for="s in approvalSegments.filter((x) => x.count > 0)"
                :key="s.key"
                :style="{ width: s.pct + '%', background: s.color }"
              ></i>
            </div>
            <div class="approve__legend">
              <span v-for="s in approvalSegments" :key="s.key">
                <i :style="{ background: s.color }"></i>{{ s.label }} <b>{{ s.count }}</b>
              </span>
            </div>
          </div>
        </div>

        <div class="orgs">
          <article v-for="p in task.participants" :key="p.org" class="org" :class="'org--' + p.approval">
            <header class="org__hd">
              <span class="org__avatar" :style="orgAvatar(p.org)">{{ p.org.slice(0, 1) }}</span>
              <div class="org__id">
                <b>{{ p.org }}</b>
                <span v-if="p.org === task.leaderOrg" class="org__role">牵头</span>
              </div>
              <span class="tag" :style="softTag(approvalColor[p.approval])">
                {{ approvalLabel[p.approval] }}
              </span>
            </header>
            <div class="org__meta">
              <div class="org__kv"><em>数据可用</em><b>{{ dataAvailLabel[p.dataAvailable || ''] || '待核查' }}</b></div>
              <div v-if="p.approvedAt" class="org__kv"><em>审批时间</em><b>{{ p.approvedAt }}</b></div>
            </div>
            <p v-if="p.opinion" class="org__note"><em>意见</em>{{ p.opinion }}</p>
            <p v-if="p.conditions" class="org__note"><em>限制</em>{{ p.conditions }}</p>
          </article>
        </div>
      </section>

      <!-- 训练管理 -->
      <TrainingManage v-if="tab === 'train'" :task="task" :current-org="currentOrg" :is-leader="isLeader" />
    </div>
  </div>
</template>

<style scoped>
.fd {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

/* ---------- 页头 ---------- */
.fd-head {
  display: flex;
  flex-direction: column;
  gap: 0;
}
.fd-head__bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px 20px;
  flex-wrap: wrap;
  padding-bottom: 12px;
}
.fd-head__id {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
}
.fd-title {
  font-size: 24px;
  font-weight: 800;
  letter-spacing: -0.01em;
  line-height: 1.3;
  margin: 0;
  color: var(--pf-text);
}
.fd-status {
  flex: none;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 3px 10px 3px 9px;
  font-size: 12px;
  font-weight: 700;
  border: 1px solid transparent;
  border-radius: 999px;
  white-space: nowrap;
}
.fd-status i {
  position: relative;
  flex: none;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: currentColor;
}
.fd-status i::after {
  content: '';
  position: absolute;
  inset: -3px;
  border-radius: 50%;
  background: currentColor;
  opacity: 0.16;
  animation: blink 1.8s ease-in-out infinite;
}
.fd-head__ops {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-left: auto;
}
.fd-back {
  margin-left: 4px;
  font-weight: 600;
  color: var(--pf-text-soft);
}
.fd-back:hover {
  color: var(--pf-primary);
  background: transparent;
}

/* ---------- 页签 ---------- */
.fd-tabs {
  display: flex;
  align-items: center;
  gap: 26px;
  border-bottom: 1px solid var(--pf-border);
  overflow-x: auto;
  scrollbar-width: none;
}
.fd-tabs::-webkit-scrollbar {
  display: none;
}
.fd-tab {
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 4px 0 11px;
  font-family: inherit;
  font-size: 13.5px;
  font-weight: 600;
  color: var(--pf-text-soft);
  background: transparent;
  border: none;
  white-space: nowrap;
  cursor: pointer;
  transition: color 0.2s ease;
}
.fd-tab::after {
  content: '';
  position: absolute;
  left: 0;
  right: 0;
  bottom: -1px;
  height: 2px;
  border-radius: 2px;
  background: transparent;
  transition: background 0.25s ease;
}
.fd-tab:hover {
  color: var(--pf-text);
}
.fd-tab.is-active {
  color: var(--pf-primary);
  font-weight: 700;
}
.fd-tab.is-active::after {
  background: var(--pf-gradient);
}
.fd-tab__count {
  padding: 0 6px;
  font-size: 11px;
  font-weight: 700;
  line-height: 17px;
  font-variant-numeric: tabular-nums;
  color: var(--pf-primary);
  background: rgba(99, 102, 241, 0.1);
  border-radius: 999px;
}
.fd-tab.is-active .fd-tab__count {
  color: #fff;
  background: var(--pf-primary);
}

/* ---------- 内容区 ---------- */
.fd-pane {
  display: flex;
  flex-direction: column;
  gap: 16px;
  animation: paneIn 0.42s cubic-bezier(0.22, 1, 0.36, 1) both;
}
.panel {
  padding: 20px 22px;
}
.panel:hover {
  transform: none;
  box-shadow: var(--pf-shadow-sm);
}
.panel--request {
  border-color: rgba(245, 158, 11, 0.4);
  box-shadow: 0 10px 30px -22px rgba(245, 158, 11, 0.8);
}
.panel__head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 16px;
}
.panel__head-main {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
}
.panel__icon {
  width: 36px;
  height: 36px;
  flex: none;
  display: grid;
  place-items: center;
  background: rgba(99, 102, 241, 0.08);
  border: 1px solid rgba(99, 102, 241, 0.16);
  border-radius: 10px;
}
.panel__icon--success {
  background: rgba(16, 185, 129, 0.08);
  border-color: rgba(16, 185, 129, 0.18);
}
.panel__icon--warning {
  background: rgba(245, 158, 11, 0.1);
  border-color: rgba(245, 158, 11, 0.2);
}
.panel__icon :deep(.app-icon) {
  width: 20px;
  height: 20px;
}
.panel__title {
  font-size: 16px;
  font-weight: 700;
  line-height: 1.35;
}
.panel__sub {
  margin-top: 2px;
  font-size: 12.5px;
  color: var(--pf-text-soft);
}
.panel__chip {
  flex: none;
  padding: 4px 11px;
  font-size: 11.5px;
  font-weight: 700;
  color: var(--pf-text-soft);
  background: var(--pf-bg-soft);
  border-radius: 999px;
  white-space: nowrap;
}
.panel__foot {
  margin-top: 16px;
}

/* ---------- 规格网格 ---------- */
.spec {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1px;
  background: var(--pf-border);
  border: 1px solid var(--pf-border);
  border-radius: 12px;
  overflow: hidden;
}
.spec__cell {
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 0;
  padding: 13px 16px;
  background: var(--pf-surface);
  transition: background 0.2s ease;
}
.spec__cell:hover {
  background: var(--pf-surface-2);
}
.spec__cell > span {
  font-size: 11.5px;
  letter-spacing: 0.02em;
  color: var(--pf-text-soft);
  opacity: 0.85;
}
.spec__cell > b {
  font-size: 13.5px;
  font-weight: 600;
  line-height: 1.55;
  color: var(--pf-text);
  word-break: break-word;
}
.spec__cell--full { grid-column: 1 / -1; }
.spec__ok { color: #10b981; }
.spec__warn { color: #f59e0b; }
.spec__gap {
  margin: 12px 0 0;
  padding: 9px 13px;
  font-size: 12.5px;
  line-height: 1.6;
  color: #b45309;
  background: rgba(245, 158, 11, 0.09);
  border-radius: 9px;
}

/* ---------- 标签 ---------- */
.chips {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
.chip {
  display: inline-flex;
  align-items: center;
  padding: 2px 10px;
  font-size: 12.5px;
  font-weight: 600;
  color: var(--pf-text);
  background: var(--pf-bg-soft);
  border-radius: 6px;
}
.chip--num {
  font-variant-numeric: tabular-nums;
  color: var(--pf-primary);
  background: rgba(99, 102, 241, 0.09);
}
.chip--soft {
  color: var(--pf-text-soft);
  font-weight: 500;
}
.tag {
  flex: none;
  padding: 2px 10px;
  font-size: 12px;
  font-weight: 700;
  border: 1px solid transparent;
  border-radius: 999px;
  white-space: nowrap;
}

/* ---------- 审批概览 ---------- */
.approve {
  display: flex;
  align-items: center;
  gap: 26px;
  padding: 16px 18px;
  margin-bottom: 16px;
  background: linear-gradient(120deg, #f7f9ff 0%, #fbfdff 60%, #f4fdfb 100%);
  border: 1px solid var(--pf-border);
  border-radius: 12px;
}
.approve__num {
  display: flex;
  flex-direction: column;
  line-height: 1.1;
  padding-right: 24px;
  border-right: 1px solid var(--pf-border);
}
.approve__num b {
  font-size: 30px;
  font-weight: 800;
  letter-spacing: -0.02em;
  color: #f59e0b;
  font-variant-numeric: tabular-nums;
}
.approve__num b.is-full {
  color: #10b981;
}
.approve__num b small {
  margin-left: 1px;
  font-size: 15px;
  font-weight: 700;
}
.approve__num span {
  margin-top: 4px;
  font-size: 11.5px;
  color: var(--pf-text-faint);
}
.approve__right {
  flex: 1;
  min-width: 0;
}
.segbar {
  display: flex;
  gap: 3px;
  height: 9px;
  overflow: hidden;
  border-radius: 999px;
  background: var(--pf-bg-soft);
}
.segbar i {
  display: block;
  height: 100%;
  border-radius: 999px;
  transition: width 0.8s cubic-bezier(0.22, 1, 0.36, 1);
}
.approve__legend {
  display: flex;
  flex-wrap: wrap;
  gap: 6px 18px;
  margin-top: 10px;
  font-size: 12px;
  color: var(--pf-text-soft);
}
.approve__legend span {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}
.approve__legend i {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}
.approve__legend b {
  font-weight: 700;
  color: var(--pf-text);
  font-variant-numeric: tabular-nums;
}

/* ---------- 机构卡片 ---------- */
.orgs {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: 12px;
}
.org {
  position: relative;
  padding: 16px 18px 16px 21px;
  overflow: hidden;
  background: var(--pf-surface-2);
  border: 1px solid var(--pf-border);
  border-radius: 12px;
  transition: border-color 0.22s ease, box-shadow 0.22s ease, transform 0.22s ease;
}
.org::before {
  content: '';
  position: absolute;
  top: 14px;
  bottom: 14px;
  left: 0;
  width: 3px;
  border-radius: 0 3px 3px 0;
  background: var(--pf-border-strong);
}
.org--approved::before { background: linear-gradient(180deg, #10b981, #34d399); }
.org--pending::before { background: linear-gradient(180deg, #f59e0b, #fbbf24); }
.org--rejected::before { background: linear-gradient(180deg, #f43f5e, #fb7185); }
.org:hover {
  transform: translateY(-2px);
  border-color: var(--pf-border-strong);
  box-shadow: var(--pf-shadow-sm);
  background: var(--pf-surface);
}
.org__hd {
  display: flex;
  align-items: center;
  gap: 10px;
}
.org__avatar {
  width: 32px;
  height: 32px;
  flex: none;
  display: grid;
  place-items: center;
  font-size: 14px;
  font-weight: 700;
  color: #fff;
  border-radius: 9px;
  box-shadow: 0 6px 14px -8px rgba(28, 34, 48, 0.5);
}
.org__id {
  display: flex;
  align-items: center;
  gap: 6px;
  flex: 1;
  min-width: 0;
}
.org__id b {
  font-size: 13.5px;
  font-weight: 700;
  color: var(--pf-text);
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}
.org__role {
  flex: none;
  padding: 1px 6px;
  font-size: 10.5px;
  font-weight: 700;
  color: var(--pf-primary);
  background: rgba(99, 102, 241, 0.1);
  border-radius: 4px;
}
.org__avatar--sm {
  width: 26px;
  height: 26px;
  font-size: 12px;
  border-radius: 7px;
}

/* ---------- 训练行列表 ---------- */
.tlist {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.titem {
  padding: 14px 16px 14px 18px;
  background: var(--pf-surface-2);
  border: 1px solid var(--pf-border);
  border-radius: 12px;
  transition: background 0.2s ease, border-color 0.2s ease;
}
.titem:hover {
  background: var(--pf-surface);
  border-color: var(--pf-border-strong);
}
.titem__main {
  display: flex;
  align-items: center;
  gap: 12px;
}
.titem__name {
  display: flex;
  align-items: center;
  gap: 7px;
  flex: 1;
  min-width: 0;
}
.titem__name b {
  font-size: 13.5px;
  font-weight: 700;
  color: var(--pf-text);
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}
.titem__main .prog {
  flex: none;
  width: 230px;
  margin-top: 0;
}
.titem__main .tag {
  width: 86px;
  text-align: center;
}
.titem__sub {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
  margin-top: 11px;
  padding-top: 11px;
  border-top: 1px dashed var(--pf-border);
}
.titem__result {
  margin-left: auto;
  font-size: 12px;
  font-weight: 600;
  color: var(--pf-text-soft);
  font-variant-numeric: tabular-nums;
}
.org__meta {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
  margin-top: 13px;
  font-variant-numeric: tabular-nums;
}
.org__kv {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}
.org__kv em {
  font-style: normal;
  font-size: 11px;
  letter-spacing: 0.02em;
  color: var(--pf-text-faint);
}
.org__kv b {
  font-size: 12.5px;
  font-weight: 600;
  color: var(--pf-text);
}
.org__note {
  margin-top: 9px;
  padding: 8px 11px;
  font-size: 12px;
  line-height: 1.55;
  color: var(--pf-text-soft);
  background: rgba(99, 102, 241, 0.045);
  border-radius: 8px;
}
.org__note em {
  font-style: normal;
  margin-right: 3px;
  color: var(--pf-text-faint);
}
.org--approved .org__note {
  background: rgba(16, 185, 129, 0.05);
}
.org--rejected .org__note {
  background: rgba(244, 63, 94, 0.05);
}
.org--pending .org__note {
  background: rgba(245, 158, 11, 0.06);
}

/* ---------- 进度条 ---------- */
.prog {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 11px;
}
.prog__track {
  flex: 1;
  height: 7px;
  overflow: hidden;
  background: var(--pf-bg-soft);
  border-radius: 999px;
}
.prog__fill {
  height: 100%;
  border-radius: 999px;
  background: linear-gradient(90deg, #6366f1, #8b5cf6);
  box-shadow: 0 0 10px rgba(99, 102, 241, 0.45);
  transition: width 0.8s cubic-bezier(0.22, 1, 0.36, 1);
}
.prog__fill--done {
  background: linear-gradient(90deg, #10b981, #34d399);
  box-shadow: 0 0 10px rgba(16, 185, 129, 0.4);
}
.prog__num {
  flex: none;
  font-size: 12px;
  font-weight: 700;
  color: var(--pf-text-soft);
  font-variant-numeric: tabular-nums;
}

/* ---------- 结果卡 ---------- */
.res {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(190px, 1fr));
  gap: 12px;
  margin: 14px 0 0;
}
.res__card {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 3px;
  padding: 16px 18px;
  overflow: hidden;
  background: linear-gradient(180deg, #ffffff, var(--pf-surface-2));
  border: 1px solid var(--pf-border);
  border-radius: 12px;
}
.res__bar {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  opacity: 0.85;
}
.res__metric {
  font-size: 11.5px;
  letter-spacing: 0.02em;
  color: var(--pf-text-faint);
}
.res__val {
  font-size: 24px;
  font-weight: 800;
  letter-spacing: -0.01em;
  color: var(--pf-text);
  font-variant-numeric: tabular-nums;
}
.res__note {
  font-style: normal;
  font-size: 11.5px;
  color: var(--pf-text-soft);
}

/* ---------- 空态 / 提示 ---------- */
.empty {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 22px;
  background: linear-gradient(120deg, #f8faff, #fbfdff);
  border: 1px solid var(--pf-border);
  border-radius: 12px;
}
.empty__icon {
  width: 46px;
  height: 46px;
  flex: none;
  display: grid;
  place-items: center;
  background: #fff;
  border: 1px solid var(--pf-border);
  border-radius: 12px;
  box-shadow: var(--pf-shadow-sm);
}
.empty__icon :deep(.app-icon) {
  width: 24px;
  height: 24px;
}
.empty__body {
  display: flex;
  flex-direction: column;
  gap: 3px;
}
.empty__body b {
  font-size: 13.5px;
  font-weight: 700;
  color: var(--pf-text);
}
.empty__body span {
  font-size: 12.5px;
  color: var(--pf-text-soft);
}
.empty__body :deep(.el-button) {
  align-self: flex-start;
  padding-left: 0;
  margin-top: 2px;
}
.fd__note {
  margin: 0 0 14px;
  padding: 12px 16px;
  font-size: 12.8px;
  line-height: 1.7;
  color: var(--pf-text-soft);
  background: var(--pf-bg-soft);
  border-radius: 10px;
}
.fd__sim {
  margin: 12px 0 0;
  font-size: 11.5px;
  color: var(--pf-text-faint);
}
.fd__fail {
  margin: 0 0 14px;
  padding: 12px 16px;
  font-size: 12.8px;
  color: #e11d48;
  background: rgba(244, 63, 94, 0.08);
  border-radius: 10px;
}

/* ---------- 配置表单 ---------- */
.cfg {
  max-width: 660px;
}
.cfg__row {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 16px;
}
.cfg__row--inline {
  flex-direction: row;
  align-items: center;
  gap: 18px;
}
.cfg__lb {
  font-size: 12.5px;
  font-weight: 600;
  color: var(--pf-text-soft);
}
.cfg__nums {
  display: flex;
  flex-wrap: wrap;
  gap: 14px;
}
.cfg__nums label {
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 11.5px;
  color: var(--pf-text-faint);
}
.cfg__nums :deep(.el-input-number) {
  width: 120px;
}
.cfg__opt {
  font-size: 13px;
}
.cfg__opt-meta {
  float: right;
  margin-left: 16px;
  font-size: 12px;
  color: var(--pf-text-faint);
}
.cfg__opt-meta em {
  font-style: normal;
}
.cfg__warn {
  color: #d97706;
}
.cfg__hint {
  font-size: 12px;
  color: var(--pf-text-faint);
}

/* ---------- 动画 ---------- */
@keyframes rise {
  from {
    opacity: 0;
    transform: translateY(14px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
@keyframes paneIn {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
@keyframes blink {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.4;
  }
}

/* ---------- 响应式 ---------- */
@media (max-width: 860px) {
  .spec {
    grid-template-columns: 1fr;
  }
  .spec__cell {
    grid-column: auto;
  }
  .approve {
    flex-direction: column;
    align-items: stretch;
    gap: 14px;
  }
  .approve__num {
    padding: 0 0 12px;
    border-right: none;
    border-bottom: 1px solid var(--pf-border);
  }
  .orgs {
    grid-template-columns: 1fr;
  }
  .titem__main {
    flex-wrap: wrap;
  }
  .titem__main .prog {
    order: 3;
    width: 100%;
  }
  .titem__main .tag {
    margin-left: auto;
  }
  .titem__result {
    margin-left: 0;
  }
  .cfg__row--inline {
    flex-direction: column;
    align-items: flex-start;
  }
}
@media (max-width: 640px) {
  .fd-head__bar {
    align-items: flex-start;
  }
  .fd-head__id {
    flex-wrap: wrap;
    gap: 8px 10px;
  }
  .fd-title {
    font-size: 20px;
  }
  .fd-head__ops {
    width: 100%;
    margin-left: 0;
    justify-content: flex-end;
  }
  .fd-tabs {
    gap: 20px;
  }
}
</style>
