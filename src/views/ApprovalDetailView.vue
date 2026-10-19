<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { ArrowDown } from '@element-plus/icons-vue'
import { useFederatedStore, STATUS_COLOR, matchOrg, type ApprovalState } from '@/store/federated'
import { useOrgStore } from '@/store/org'
import { orgNames } from '@/mock/organizations'
import { fieldDef } from '@/mock/datasetFields'

const route = useRoute()
const router = useRouter()
const store = useFederatedStore()
const org = useOrgStore()
onMounted(() => store.ensureSeed())

const id = computed(() => route.params.id as string)
const task = computed(() => store.getById(id.value))

const actingOrg = ref(org.selected || orgNames[1])
watch(
  () => org.selected,
  (v) => {
    actingOrg.value = v || orgNames[1]
  },
)
function orgChange(cmd: string) {
  if (cmd === '__none__') org.select(null)
  else org.select(cmd)
}

const tab = ref('req')
const my = computed(() => task.value?.participants.find((p) => p.org === actingOrg.value))

const opinion = ref('')
const conditions = ref('')

const match = computed(() => (task.value && actingOrg.value ? matchOrg(actingOrg.value, task.value.req) : null))

const approvalLabel: Record<ApprovalState, string> = { pending: '待审批', approved: '已通过', rejected: '未通过' }

const canApprove = computed(
  () =>
    !!my.value &&
    my.value.approval === 'pending' &&
    ['待审批', '审批未通过', '待确认'].includes(task.value?.status || ''),
)

function approve() {
  if (!task.value) return
  store.approve(task.value.id, actingOrg.value, opinion.value, conditions.value)
  ElMessage.success('已通过审批并反馈牵头机构')
  opinion.value = ''
  conditions.value = ''
}
function reject() {
  if (!task.value) return
  store.reject(task.value.id, actingOrg.value, opinion.value || '不予通过。', conditions.value)
  ElMessage.warning('已标记未通过并反馈牵头机构')
  opinion.value = ''
  conditions.value = ''
}

const fieldLabels = computed(() => (task.value?.req.fieldKeys || []).map((k) => fieldDef(k)?.label ?? k))
</script>

<template>
  <div v-if="task" class="ad">
    <div class="ad__head">
      <div>
        <h1 class="ad__title">{{ task.name }}</h1>
        <div class="ad__meta">
          <span class="ad__id">{{ task.id }}</span>
          <span>牵头机构 {{ task.leaderOrg }}</span>
          <span>提交于 {{ task.createdAt }}</span>
        </div>
      </div>
      <div class="ad__ops">
        <span class="tag" :style="{ color: STATUS_COLOR[task.status], background: STATUS_COLOR[task.status] + '14' }">
          {{ task.status }}
        </span>
        <el-dropdown trigger="click" @command="orgChange">
          <span class="ad__org">{{ actingOrg }}<el-icon size="12"><ArrowDown /></el-icon></span>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item v-for="o in orgNames" :key="o" :command="o">{{ o }}</el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
        <el-button size="small" @click="router.push('/admin/approval')">返回列表</el-button>
      </div>
    </div>

    <el-tabs v-model="tab" class="ad__tabs">
      <!-- 任务要求 -->
      <el-tab-pane label="任务要求" name="req">
        <div class="kv">
          <div class="kv__item"><span>任务名称</span><b>{{ task.name }}</b></div>
          <div class="kv__item"><span>研究目的</span><b>{{ task.purpose || '—' }}</b></div>
          <div class="kv__item"><span>科研队列</span><b>{{ task.req.cohortName }}</b></div>
          <div class="kv__item"><span>任务类型</span><b>{{ task.req.taskType }}</b></div>
          <div class="kv__item"><span>目标标签</span><b>{{ fieldDef(task.req.labelField)?.label || (task.req.taskType === '无监督' ? '无' : '未设置') }}</b></div>
          <div class="kv__item"><span>所需字段</span><b>{{ fieldLabels.join('、') }}</b></div>
          <div class="kv__item"><span>算法 / 模型</span><b>{{ task.req.algorithm }} · {{ task.req.modelType }}</b></div>
          <div class="kv__item"><span>训练参数</span><b>轮次 {{ task.req.params.rounds }} · 本地 {{ task.req.params.epochs }} · 批 {{ task.req.params.batch }} · lr {{ task.req.params.lr }}</b></div>
          <div class="kv__item"><span>算力要求</span><b>CPU {{ task.req.compute.cpuCores }} 核 · 显存 {{ task.req.compute.gpuMemory }}GB · {{ task.req.compute.network }}</b></div>
        </div>
      </el-tab-pane>

      <!-- 本机构核查 -->
      <el-tab-pane label="本机构核查" name="check">
        <template v-if="match">
          <div class="kv">
            <div class="kv__item"><span>匹配数据集</span><b>{{ match.datasetCount }} 个（同任务类型 / 标签 / 字段）</b></div>
            <div class="kv__item"><span>可参与样本规模</span><b>{{ match.sampleCount }} 例</b></div>
            <div class="kv__item"><span>字段匹配率</span><b>{{ match.fieldRate }}%（{{ match.fieldCovered }}/{{ match.fieldTotal }}）</b></div>
            <div class="kv__item"><span>计算资源</span><b :style="{ color: match.computeReady ? '#10b981' : '#f59e0b' }">{{ match.computeReady ? '就绪' : '需扩容' }}</b></div>
            <div class="kv__item"><span>在线节点</span><b>{{ match.nodeSummary.online }}/{{ match.nodeSummary.total }}</b></div>
            <div class="kv__item"><span>在线 GPU 显存</span><b>{{ match.nodeSummary.gpuMemoryTotal }} GB</b></div>
          </div>
          <div v-if="match.missingFields.length" class="ad__gap">
            缺失字段：{{ match.missingFields.map((k) => fieldDef(k)?.label ?? k).join('、') }}（本机构暂无这些标准字段，需补齐后方可完全匹配任务要求）
          </div>
          <p class="ad__note">注：字段名称一致仅代表结构兼容，本地数据分布、缺失率与取值口径需分别确认，不因字段名相同即认定数据完全一致。</p>
        </template>
        <p v-else class="ad__note">请选择本机构以查看数据 / 算力核查。</p>
      </el-tab-pane>

      <!-- 审批操作 -->
      <el-tab-pane label="审批操作" name="approve">
        <template v-if="my">
          <div class="ap__state">
            本机构当前审批状态：
            <span class="tag" :style="{ color: my.approval === 'approved' ? '#10b981' : my.approval === 'rejected' ? '#f43f5e' : '#f59e0b', background: (my.approval === 'approved' ? '#10b981' : my.approval === 'rejected' ? '#f43f5e' : '#f59e0b') + '14' }">
              {{ approvalLabel[my.approval] }}
            </span>
          </div>
          <template v-if="canApprove">
            <el-input v-model="opinion" type="textarea" :rows="3" placeholder="审批意见" style="max-width: 520px" />
            <el-input v-model="conditions" placeholder="限制条件（可选，如样本范围、字段口径）" style="max-width: 520px; margin-top: 10px" />
            <div class="ap__btns">
              <el-button type="primary" size="small" @click="approve">审批通过</el-button>
              <el-button type="danger" size="small" plain @click="reject">审批不通过</el-button>
            </div>
          </template>
          <div v-else-if="my.opinion" class="ap__hist">
            <div>历史意见：{{ my.opinion }}</div>
            <div v-if="my.conditions">限制条件：{{ my.conditions }}</div>
            <div v-if="my.approvedAt">审批时间：{{ my.approvedAt }}</div>
          </div>
          <p v-else class="ad__note">当前任务状态不支持审批（需处于待审批阶段）。</p>
        </template>
        <p v-else class="ad__note">请选择本机构以进行审批。</p>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<style scoped>
.ad {
  padding: 4px 2px;
}
.ad__head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 14px;
}
.ad__title {
  position: relative;
  font-size: 18px;
  font-weight: 700;
  letter-spacing: 0.03em;
  padding-left: 12px;
  margin: 0 0 6px;
  color: var(--pf-text);
}
.ad__title::before {
  content: '';
  position: absolute;
  left: 0;
  top: 2px;
  bottom: 2px;
  width: 3px;
  border-radius: 2px;
  background: var(--pf-primary);
}
.ad__meta {
  display: flex;
  flex-wrap: wrap;
  gap: 14px;
  font-size: 12.5px;
  color: var(--pf-text-faint);
}
.ad__ops {
  display: flex;
  align-items: center;
  gap: 8px;
}
.ad__org {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 12.5px;
  color: var(--pf-text-soft);
  cursor: pointer;
  padding: 4px 10px;
  border: 1px solid var(--pf-border);
  border-radius: 8px;
}
.tag {
  display: inline-block;
  padding: 1px 9px;
  font-size: 12px;
  font-weight: 600;
  border-radius: 999px;
  white-space: nowrap;
}
.ad__tabs {
  background: var(--pf-surface);
  border: 1px solid var(--pf-border);
  border-radius: 12px;
  padding: 4px 16px 16px;
}
.kv {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 10px 24px;
}
.kv__item {
  display: flex;
  flex-direction: column;
  gap: 2px;
  font-size: 13px;
}
.kv__item span {
  color: var(--pf-text-faint);
  font-size: 12px;
}
.kv__item b {
  color: var(--pf-text);
  font-weight: 600;
}
.ad__note {
  font-size: 12.5px;
  color: var(--pf-text-faint);
  margin: 6px 0 0;
}
.ad__gap {
  margin-top: 12px;
  padding: 8px 12px;
  font-size: 12.5px;
  color: #b45309;
  background: rgba(245, 158, 11, 0.1);
  border-radius: 8px;
}
.ap__state {
  font-size: 13px;
  color: var(--pf-text-soft);
  margin-bottom: 12px;
}
.ap__btns {
  display: flex;
  gap: 10px;
  margin-top: 12px;
}
.ap__hist {
  font-size: 12.5px;
  color: var(--pf-text-soft);
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 12px 14px;
  background: var(--pf-bg-soft);
  border-radius: 10px;
}
</style>
