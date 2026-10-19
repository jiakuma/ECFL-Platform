<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Connection } from '@element-plus/icons-vue'
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
  未开始: '#94a3b8',
  准备中: '#f59e0b',
  就绪: '#0ea5e9',
  训练中: '#8b5cf6',
  完成: '#10b981',
  失败: '#f43f5e',
}

const approvedCount = computed(() => task.value?.participants.filter((p) => p.approval === 'approved').length || 0)
const approvalPct = computed(() => {
  const total = task.value?.participants.length || 0
  return total ? Math.round((approvedCount.value / total) * 100) : 0
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
</script>

<template>
  <div v-if="task" class="fd">
    <header class="fd-hero">
      <div class="fd-hero__icon">
        <el-icon :size="20"><Connection /></el-icon>
      </div>
      <div class="fd-hero__main">
        <h1 class="fd-hero__title">{{ task.name }}</h1>
      </div>
      <div class="fd-hero__ops">
        <span class="tag" :style="{ color: STATUS_COLOR[task.status], background: STATUS_COLOR[task.status] + '14' }">
          {{ task.status }}
        </span>
        <el-button v-if="isLeader && task.status === '待确认'" type="primary" size="small" @click="confirmLaunch">
          确认参与范围并发起训练
        </el-button>
        <template v-else-if="isLeader && task.status === '训练中'">
          <el-button type="primary" size="small" @click="advance">推进训练</el-button>
          <el-button size="small" @click="fail">标记失败</el-button>
        </template>
        <el-button size="small" @click="router.push('/federated')">返回列表</el-button>
      </div>
    </header>

    <el-tabs v-model="tab" class="fd__tabs">
      <!-- 训练请求（仅参与方待确认时出现） -->
      <el-tab-pane v-if="canAck" label="训练请求" name="request">
        <div class="panel">
          <div class="panel__hd">训练请求</div>
          <div class="kv">
            <div class="kv__item"><span>牵头机构</span><b>{{ task.leaderOrg }}</b></div>
            <div class="kv__item"><span>配置版本</span><b>{{ task.configVersion }}</b></div>
            <div class="kv__item"><span>算法 / 模型</span><b>{{ task.req.algorithm }} · {{ task.req.modelType }}</b></div>
            <div class="kv__item"><span>全局轮次</span><b>{{ task.req.params.rounds }}</b></div>
            <div class="kv__item"><span>本地轮次 / 批大小 / 学习率</span><b>{{ task.req.params.epochs }} / {{ task.req.params.batch }} / {{ task.req.params.lr }}</b></div>
            <div class="kv__item"><span>算力要求</span><b>CPU {{ task.req.compute.cpuCores }} 核 · 显存 {{ task.req.compute.gpuMemory }}GB · {{ task.req.compute.network }}</b></div>
            <div v-if="reqMatch" class="kv__item"><span>完全匹配数据集</span><b>{{ reqMatch.datasetCount }} 个 · {{ reqMatch.sampleCount }} 例</b></div>
            <div v-if="reqMatch" class="kv__item">
              <span>本机构算力</span>
              <b :style="{ color: reqMatch.computeReady ? '#10b981' : '#f59e0b' }">{{ reqMatch.computeReady ? '就绪' : '需扩容' }}</b>
            </div>
          </div>
          <p v-if="reqMatch && !reqMatch.datasetCount" class="cfg__gap">
            本机构暂无完全匹配的数据集，可在任务配置环节自选数据集并补齐缺失字段。
          </p>
          <div class="panel__foot">
            <el-button type="primary" size="small" @click="ackRequest">确认训练请求</el-button>
          </div>
        </div>
      </el-tab-pane>

      <!-- 任务配置 -->
      <el-tab-pane label="任务配置" name="overview">
        <!-- 参与方：本机构训练配置 -->
        <template v-if="!isLeader">
          <div class="panel">
            <div class="panel__hd">本机构训练配置</div>

            <template v-if="canEditCfg">
              <div class="cfg">
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
                </div>
                <p class="cfg__hint">已选 {{ cfg.datasetIds.length }} 个数据集 · 合计 {{ selectedSamples }} 例</p>
                <p v-if="selectedGap.length" class="cfg__gap">
                  所选数据集缺少任务所需字段：{{ selectedGap.map((k) => fieldDef(k)?.label ?? k).join('、') }}
                </p>

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
            </template>

            <div v-else-if="myPart?.localConfig" class="kv">
              <div class="kv__item"><span>参与训练的数据集</span><b>{{ myPart.localConfig.datasetIds.map(datasetName).join('、') }}</b></div>
              <div class="kv__item"><span>计算节点</span><b>{{ myPart.localConfig.nodeId }}</b></div>
              <div class="kv__item"><span>本地轮次 / 批大小 / 学习率</span><b>{{ myPart.localConfig.epochs }} / {{ myPart.localConfig.batch }} / {{ myPart.localConfig.lr }}</b></div>
              <div class="kv__item"><span>配置时间</span><b>{{ myPart.localConfig.configuredAt || '—' }}</b></div>
            </div>

            <div v-else class="fd__note">
              <template v-if="myPart?.approval === 'rejected'">本机构审批未通过，不参与本次训练。</template>
              <template v-else-if="myPart?.approval === 'pending'">本机构审批尚未通过，暂无可配置的训练。</template>
              <template v-else>
                牵头机构尚未下发训练请求。
                <el-button v-if="canAck" text type="primary" size="small" @click="tab = 'request'">去确认</el-button>
              </template>
            </div>
          </div>
        </template>

        <div class="panel">
          <div class="panel__hd">牵头方任务要求</div>
          <div class="kv">
            <div class="kv__item"><span>任务名称</span><b>{{ task.name }}</b></div>
            <div class="kv__item"><span>研究目的</span><b>{{ task.purpose || '—' }}</b></div>
            <div class="kv__item"><span>科研队列</span><b>{{ task.req.cohortName }}</b></div>
            <div class="kv__item"><span>任务类型</span><b>{{ task.req.taskType }}</b></div>
            <div class="kv__item"><span>目标标签</span><b>{{ fieldDef(task.req.labelField)?.label || (task.req.taskType === '无监督' ? '无' : '未设置') }}</b></div>
            <div class="kv__item"><span>所需字段</span><b>{{ fieldLabels.join('、') }}</b></div>
            <div class="kv__item"><span>算法</span><b>{{ task.req.algorithm }}</b></div>
            <div class="kv__item"><span>模型类型</span><b>{{ task.req.modelType }}</b></div>
            <div class="kv__item"><span>训练参数</span><b>轮次 {{ task.req.params.rounds }} · 本地 {{ task.req.params.epochs }} · 批 {{ task.req.params.batch }} · lr {{ task.req.params.lr }}</b></div>
            <div class="kv__item"><span>算力要求</span><b>CPU {{ task.req.compute.cpuCores }} 核 · 显存 {{ task.req.compute.gpuMemory }}GB · {{ task.req.compute.network }}</b></div>
          </div>
        </div>
      </el-tab-pane>

      <!-- 审批反馈 -->
      <el-tab-pane label="审批反馈" name="approval">
        <div class="statbar">
          <div class="statbar__row">
            <span>机构审批进度</span>
            <b>{{ approvedCount }} <em>/ {{ task.participants.length }}</em></b>
          </div>
          <el-progress :percentage="approvalPct" :stroke-width="8" :show-text="false" />
        </div>
        <div class="plist">
          <div v-for="p in task.participants" :key="p.org" class="prow">
            <div class="prow__hd">
              <b>{{ p.org }}</b>
              <span class="tag" :style="{ color: approvalColor[p.approval], background: approvalColor[p.approval] + '14' }">
                {{ approvalLabel[p.approval] }}
              </span>
            </div>
            <div class="prow__bd">
              <span>数据可用：{{ p.dataAvailable === 'ok' ? '可用' : p.dataAvailable === 'partial' ? '部分可用' : p.dataAvailable === 'none' ? '不可用' : '待核查' }}</span>
              <span v-if="p.approvedAt">审批时间：{{ p.approvedAt }}</span>
            </div>
            <div v-if="p.opinion" class="prow__op">意见：{{ p.opinion }}</div>
            <div v-if="p.conditions" class="prow__op">限制条件：{{ p.conditions }}</div>
          </div>
        </div>
      </el-tab-pane>

      <!-- 训练管理 -->
      <el-tab-pane label="训练管理" name="train">
        <template v-if="task.status === '待执行'">
          <p class="fd__note">已下发训练请求，等待各参与机构确认并配置本机构训练参数。</p>
        </template>
        <template v-else-if="task.status === '已完成' && task.results">
          <div class="res">
            <div v-for="r in task.results" :key="r.metric" class="res__card">
              <span class="res__metric">{{ r.metric }}</span>
              <b class="res__val">{{ r.value }}</b>
              <em class="res__note">{{ r.note }}</em>
            </div>
          </div>
          <p class="fd__sim">注：以上为演示用模拟结果，非真实训练产出。</p>
        </template>
        <template v-else-if="task.status === '失败'">
          <p class="fd__fail">训练失败：{{ task.failReason }}</p>
        </template>

        <div class="plist">
          <div v-for="p in task.participants" :key="p.org" class="prow">
            <div class="prow__hd">
              <b>{{ p.org }}</b>
              <span class="tag" :style="{ color: trainColor[p.trainStatus], background: trainColor[p.trainStatus] + '14' }">
                {{ p.trainStatus }}
              </span>
            </div>
            <el-progress
              v-if="p.trainStatus === '训练中' || p.trainStatus === '完成'"
              :percentage="p.trainProgress"
              :status="p.trainStatus === '完成' ? 'success' : undefined"
              :stroke-width="8"
              style="margin: 8px 0"
            />
            <div v-if="p.localConfig" class="prow__op">
              数据 {{ p.localConfig.datasetIds.map(datasetName).join('、') }} · 节点 {{ p.localConfig.nodeId }} · 本地 {{ p.localConfig.epochs }} 轮 / 批 {{ p.localConfig.batch }} / lr {{ p.localConfig.lr }}
            </div>
            <div v-if="p.result" class="prow__op">本机构结果：{{ p.result }}</div>
          </div>
        </div>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<style scoped>
.fd {
  padding: 2px;
}

/* ---------- 顶部标题 ---------- */
.fd-hero {
  position: relative;
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 16px 20px;
  margin-bottom: 16px;
  overflow: hidden;
  background: var(--pf-surface);
  border: 1px solid var(--pf-border);
  border-radius: 14px;
  box-shadow: var(--pf-shadow-sm);
}
.fd-hero::before {
  content: '';
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  width: 4px;
  background: var(--pf-gradient);
}
.fd-hero__icon {
  flex: none;
  width: 42px;
  height: 42px;
  display: grid;
  place-items: center;
  color: var(--pf-primary);
  background: var(--pf-gradient-soft);
  border-radius: 12px;
}
.fd-hero__main {
  flex: 1;
  min-width: 0;
}
.fd-hero__title {
  margin: 0;
  font-size: 19px;
  font-weight: 700;
  line-height: 1.35;
  letter-spacing: 0.02em;
  color: var(--pf-text);
}
.fd-hero__ops {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
}

/* ---------- 标签页容器 ---------- */
.fd__tabs {
  padding: 2px 20px 20px;
  background: var(--pf-surface);
  border: 1px solid var(--pf-border);
  border-radius: 14px;
  box-shadow: var(--pf-shadow-sm);
}
.fd__tabs :deep(.el-tabs__header) {
  margin: 0 0 18px;
}
.fd__tabs :deep(.el-tabs__nav-wrap::after) {
  height: 1px;
  background: var(--pf-border);
}
.fd__tabs :deep(.el-tabs__item) {
  height: 46px;
  font-size: 13px;
  font-weight: 600;
  color: var(--pf-text-soft);
}
.fd__tabs :deep(.el-tabs__item.is-active) {
  color: var(--pf-primary);
}
.fd__tabs :deep(.el-tabs__active-bar) {
  height: 3px;
  border-radius: 3px;
  background: var(--pf-gradient);
}

/* ---------- 分区面板 ---------- */
.panel {
  padding: 16px 18px;
  background: var(--pf-surface-2);
  border: 1px solid var(--pf-border);
  border-radius: 12px;
}
.panel + .panel {
  margin-top: 16px;
}
.panel__hd {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 14px;
  font-size: 13px;
  font-weight: 700;
  color: var(--pf-text);
}
.panel__hd::before {
  content: '';
  width: 3px;
  height: 14px;
  border-radius: 2px;
  background: var(--pf-gradient);
}
.panel__foot {
  margin-top: 16px;
}

/* ---------- 键值卡片 ---------- */
.kv {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 10px;
}
.kv__item {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 11px 13px;
  font-size: 13px;
  background: var(--pf-surface);
  border: 1px solid var(--pf-border);
  border-radius: 10px;
}
.kv__item span {
  font-size: 11.5px;
  color: var(--pf-text-faint);
}
.kv__item b {
  color: var(--pf-text);
  font-weight: 600;
  line-height: 1.55;
  word-break: break-word;
}
.kv__item em {
  font-style: normal;
  font-size: 11.5px;
  color: var(--pf-text-faint);
}

/* ---------- 状态标签 ---------- */
.tag {
  display: inline-block;
  padding: 1px 9px;
  font-size: 12px;
  font-weight: 600;
  white-space: nowrap;
  border-radius: 999px;
}

/* ---------- 审批进度 ---------- */
.statbar {
  padding: 14px 16px;
  margin-bottom: 14px;
  background: var(--pf-surface-2);
  border: 1px solid var(--pf-border);
  border-radius: 12px;
}
.statbar__row {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  margin-bottom: 8px;
  font-size: 12.5px;
  color: var(--pf-text-soft);
}
.statbar__row b {
  font-size: 16px;
  font-weight: 700;
  color: var(--pf-text);
}
.statbar__row b em {
  font-size: 12px;
  font-style: normal;
  font-weight: 500;
  color: var(--pf-text-faint);
}

/* ---------- 结果卡 ---------- */
.res {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 12px;
}
.res__card {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 14px 16px;
  background: linear-gradient(180deg, #fff, var(--pf-surface-2));
  border: 1px solid var(--pf-border);
  border-radius: 12px;
}
.res__metric {
  font-size: 12px;
  color: var(--pf-text-faint);
}
.res__val {
  font-size: 20px;
  font-weight: 700;
  color: var(--pf-primary);
}
.res__note {
  font-style: normal;
  font-size: 11.5px;
  color: var(--pf-text-faint);
}

/* ---------- 提示 ---------- */
.fd__note {
  padding: 14px 16px;
  font-size: 12.8px;
  line-height: 1.7;
  color: var(--pf-text-soft);
  background: var(--pf-bg-soft);
  border-radius: 10px;
}
.fd__sim,
.fd__fail {
  margin: 12px 0 0;
  font-size: 12px;
  color: var(--pf-text-faint);
}
.fd__fail {
  color: #f43f5e;
}

/* ---------- 机构卡片列表 ---------- */
.plist {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 12px;
  margin-top: 12px;
}
.prow {
  padding: 14px 16px;
  background: var(--pf-surface);
  border: 1px solid var(--pf-border);
  border-radius: 12px;
  transition: border-color 0.18s, box-shadow 0.18s, transform 0.18s;
}
.prow:hover {
  border-color: var(--pf-border-strong);
  box-shadow: var(--pf-shadow-sm);
  transform: translateY(-1px);
}
.prow__hd {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 8px;
}
.prow__hd b {
  font-size: 13.5px;
  color: var(--pf-text);
}
.prow__bd {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 14px;
  font-size: 12px;
  color: var(--pf-text-soft);
}
.prow__op {
  margin-top: 8px;
  font-size: 12px;
  line-height: 1.6;
  color: var(--pf-text-faint);
}

/* ---------- 配置表单 ---------- */
.cfg {
  max-width: 640px;
}
.cfg__row {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 14px;
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
  font-size: 12px;
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
  margin: -6px 0 8px;
  font-size: 12px;
  color: var(--pf-text-faint);
}
.cfg__gap {
  margin: 0 0 14px;
  padding: 8px 12px;
  font-size: 12.5px;
  color: #b45309;
  background: rgba(245, 158, 11, 0.1);
  border-radius: 8px;
}
</style>
