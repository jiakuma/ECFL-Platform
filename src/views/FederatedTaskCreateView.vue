<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Check } from '@element-plus/icons-vue'
import {
  useFederatedStore,
  type TaskRequirement,
} from '@/store/federated'
import { useCohortStore } from '@/store/cohort'
import { useDatasetStore, type Dataset } from '@/store/dataset'
import { useOrgStore } from '@/store/org'
import { orgNames } from '@/mock/organizations'
import {
  datasetFieldCatalog,
  fieldDef,
  DATASET_FIELD_CATS,
  type FieldCategory,
} from '@/mock/datasetFields'

const route = useRoute()
const router = useRouter()
const store = useFederatedStore()
const cohortStore = useCohortStore()
const datasetStore = useDatasetStore()
const orgStore = useOrgStore()

onMounted(() => {
  store.ensureSeed()
  datasetStore.ensureSeed()
})

/** 牵头机构 = 应用端当前机构（新建任务者即牵头方） */
const leaderOrg = computed(() => orgStore.appCurrent)
const others = computed(() => orgNames.filter((o) => o !== leaderOrg.value))

const carriedId = computed(() => (route.query.dataset as string) || '')
const carried = computed<Dataset | undefined>(() => datasetStore.list.find((d) => d.id === carriedId.value))

const step = ref(0)
const steps = ['基本信息', '参与机构', '数据要求', '训练配置', '算力要求', '检查并下发']

const draft = reactive({
  name: '',
  purpose: '',
  participantOrgs: [] as string[],
  cohortId: '',
  fieldKeys: [] as string[],
  labelField: '',
  taskType: '分类' as TaskRequirement['taskType'],
  algorithm: 'FedAvg',
  modelType: '逻辑回归',
  rounds: 20,
  epochs: 5,
  batch: 64,
  lr: 0.01,
  cpuCores: 32,
  memory: '≥ 128 GB',
  gpuMemory: 24,
  storage: '≥ 500 GB',
  network: '专线',
})

/** 带入数据集时预填数据要求 */
onMounted(() => {
  if (carried.value) {
    const d = carried.value
    draft.taskType = d.taskType
    draft.labelField = d.labelField
    draft.fieldKeys = d.fields.map((f) => f.key)
    draft.cohortId = d.cohortId
  }
})

const cohorts = computed(() => cohortStore.list.filter((c) => c.org === leaderOrg.value))

const groupedFields = computed(() =>
  DATASET_FIELD_CATS.map((cat: FieldCategory) => ({
    cat,
    fields: datasetFieldCatalog.filter((f) => f.category === cat && f.kind !== '标识' && f.kind !== '文本' && f.kind !== '日期'),
  })),
)

const labelOptions = computed(() => {
  const need = draft.taskType === '分类' ? '枚举' : draft.taskType === '回归' ? '数值' : ''
  return datasetFieldCatalog.filter((f) => !need || f.kind === need)
})

const algorithmOptions = ['FedAvg', 'SecureBoost', 'FATE-LR', '横向联邦 XGBoost']
const modelOptions: Record<TaskRequirement['taskType'], string[]> = {
  分类: ['逻辑回归', 'XGBoost', '深度神经网络'],
  回归: ['线性回归', 'XGBoost', '深度神经网络'],
  无监督: ['K-Means 聚类', 'AutoEncoder'],
}
const networkOptions = ['内网', 'VPN', '专线']

function toggleOrg(o: string) {
  const i = draft.participantOrgs.indexOf(o)
  if (i >= 0) draft.participantOrgs.splice(i, 1)
  else draft.participantOrgs.push(o)
}

function stepValid(i: number): boolean {
  switch (i) {
    case 0:
      return !!draft.name.trim()
    case 1:
      return draft.participantOrgs.length >= 1
    case 2:
      if (!draft.cohortId || draft.fieldKeys.length < 1) return false
      if (draft.taskType !== '无监督' && (!draft.labelField || !draft.fieldKeys.includes(draft.labelField)))
        return false
      return true
    default:
      return true
  }
}

const canNext = computed(() => stepValid(step.value))
function next() {
  if (!canNext.value) {
    ElMessage.warning('请完成本步骤的必要配置')
    return
  }
  if (step.value < steps.length - 1) step.value += 1
}
function prev() {
  if (step.value > 0) step.value -= 1
}

const cohortName = computed(() => cohorts.value.find((c) => c.id === draft.cohortId)?.name || '')

function buildReq(): TaskRequirement {
  return {
    cohortId: draft.cohortId,
    cohortName: cohortName.value,
    fieldKeys: [...draft.fieldKeys],
    labelField: draft.labelField,
    taskType: draft.taskType,
    algorithm: draft.algorithm,
    modelType: draft.modelType,
    params: { rounds: draft.rounds, epochs: draft.epochs, batch: draft.batch, lr: draft.lr },
    compute: {
      cpuCores: draft.cpuCores,
      memory: draft.memory,
      gpuMemory: draft.gpuMemory,
      storage: draft.storage,
      network: draft.network,
    },
  }
}

function submit() {
  const t = store.createTask({
    name: draft.name,
    purpose: draft.purpose,
    leaderOrg: leaderOrg.value,
    participantOrgs: draft.participantOrgs,
    req: buildReq(),
  })
  ElMessage.success(`任务 ${t.id} 已下发至 ${draft.participantOrgs.length} 家参与机构`)
  router.push(`/federated/${t.id}`)
}
</script>

<template>
  <div class="wz">
    <div class="wz__head">
      <h1 class="wz__title">新建联邦学习任务</h1>
      <div class="wz__ops">
        <el-button size="small" @click="router.push('/federated')">取消</el-button>
      </div>
    </div>

    <el-steps :active="step" finish-status="success" align-center class="wz__steps">
      <el-step v-for="s in steps" :key="s" :title="s" />
    </el-steps>

    <div class="wz__body">
      <div v-if="carried" class="carried">
        <span class="carried__lb">已带入数据集</span>
        <b>{{ carried.name }}</b>
        <span class="carried__id">{{ carried.id }}</span>
        <span>{{ carried.org }} · {{ carried.sampleCount }} 例 · {{ carried.fields.length }} 字段 · {{ carried.taskType }}</span>
      </div>

      <!-- 0 基本信息 -->
      <section v-if="step === 0" class="wz__panel">
        <el-form label-width="96px" label-position="right">
          <el-form-item label="任务名称" required>
            <el-input v-model="draft.name" placeholder="例如：多中心食管癌生存预测" style="max-width: 420px" />
          </el-form-item>
          <el-form-item label="研究目的">
            <el-input v-model="draft.purpose" type="textarea" :rows="3" placeholder="简述本次联邦训练的研究目标" style="max-width: 520px" />
          </el-form-item>
        </el-form>
      </section>

      <!-- 1 参与机构 -->
      <section v-else-if="step === 1" class="wz__panel">
        <p class="wz__hint">牵头机构 <b>{{ leaderOrg }}</b> 发起任务，请选择参与本次联邦训练的医院。</p>
        <div class="orgs">
          <div
            v-for="o in others"
            :key="o"
            class="org"
            :class="{ 'is-on': draft.participantOrgs.includes(o) }"
            @click="toggleOrg(o)"
          >
            <el-icon v-if="draft.participantOrgs.includes(o)" class="org__ck"><Check /></el-icon>
            <span>{{ o }}</span>
          </div>
        </div>
      </section>

      <!-- 2 数据要求 -->
      <section v-else-if="step === 2" class="wz__panel">
        <el-form label-width="96px" label-position="right">
          <el-form-item label="任务类型">
            <el-radio-group v-model="draft.taskType">
              <el-radio value="分类">分类</el-radio>
              <el-radio value="回归">回归</el-radio>
              <el-radio value="无监督">无监督</el-radio>
            </el-radio-group>
          </el-form-item>
          <el-form-item label="科研队列" required>
            <el-select v-model="draft.cohortId" placeholder="选择来源科研队列" style="max-width: 360px">
              <el-option v-for="c in cohorts" :key="c.id" :label="c.name" :value="c.id" />
            </el-select>
          </el-form-item>
          <el-form-item label="所需数据字段" required>
            <div class="fields">
              <div v-for="g in groupedFields" :key="g.cat" class="fgrp">
                <div class="fgrp__hd">
                  <span>{{ g.cat }}</span>
                  <span class="fgrp__cnt">{{ g.fields.filter((f) => draft.fieldKeys.includes(f.key)).length }}/{{ g.fields.length }}</span>
                </div>
                <div class="fgrp__items">
                  <el-checkbox
                    v-for="f in g.fields"
                    :key="f.key"
                    :model-value="draft.fieldKeys.includes(f.key)"
                    :label="f.key"
                    @change="(v: any) => { const i = draft.fieldKeys.indexOf(f.key); if (v && i < 0) draft.fieldKeys.push(f.key); if (!v && i >= 0) draft.fieldKeys.splice(i, 1); }"
                  >
                    {{ f.label }}
                  </el-checkbox>
                </div>
              </div>
            </div>
          </el-form-item>
          <el-form-item :label="draft.taskType === '无监督' ? '目标标签（可选）' : '目标标签'" required>
            <el-select
              v-model="draft.labelField"
              placeholder="选择标签字段"
              clearable
              style="max-width: 360px"
              :disabled="draft.taskType === '无监督'"
            >
              <el-option v-for="f in labelOptions" :key="f.key" :label="f.label" :value="f.key" />
            </el-select>
            <span v-if="draft.taskType === '无监督'" class="wz__note">无监督任务不设置目标标签</span>
          </el-form-item>
        </el-form>
      </section>

      <!-- 3 训练配置 -->
      <section v-else-if="step === 3" class="wz__panel">
        <el-form label-width="96px" label-position="right">
          <el-form-item label="算法">
            <el-select v-model="draft.algorithm" style="max-width: 280px">
              <el-option v-for="a in algorithmOptions" :key="a" :label="a" :value="a" />
            </el-select>
          </el-form-item>
          <el-form-item label="模型类型">
            <el-select v-model="draft.modelType" style="max-width: 280px">
              <el-option v-for="m in modelOptions[draft.taskType]" :key="m" :label="m" :value="m" />
            </el-select>
          </el-form-item>
          <el-form-item label="训练参数">
            <div class="params">
              <label>通信轮次<input v-model.number="draft.rounds" type="number" min="1" /></label>
              <label>本地轮次<input v-model.number="draft.epochs" type="number" min="1" /></label>
              <label>批大小<input v-model.number="draft.batch" type="number" min="1" /></label>
              <label>学习率<input v-model.number="draft.lr" type="number" step="0.001" min="0" /></label>
            </div>
          </el-form-item>
        </el-form>
      </section>

      <!-- 4 算力要求 -->
      <section v-else-if="step === 4" class="wz__panel">
        <el-form label-width="96px" label-position="right">
          <el-form-item label="CPU 核数">
            <el-input-number v-model="draft.cpuCores" :min="1" :max="256" />
          </el-form-item>
          <el-form-item label="内存">
            <el-select v-model="draft.memory" style="max-width: 200px">
              <el-option label="≥ 64 GB" value="≥ 64 GB" />
              <el-option label="≥ 128 GB" value="≥ 128 GB" />
              <el-option label="≥ 256 GB" value="≥ 256 GB" />
            </el-select>
          </el-form-item>
          <el-form-item label="GPU 显存">
            <el-input-number v-model="draft.gpuMemory" :min="0" :max="640" :step="8" />
            <span class="wz__note">单位 GB，无 GPU 需求填 0</span>
          </el-form-item>
          <el-form-item label="存储">
            <el-select v-model="draft.storage" style="max-width: 200px">
              <el-option label="≥ 200 GB" value="≥ 200 GB" />
              <el-option label="≥ 500 GB" value="≥ 500 GB" />
              <el-option label="≥ 1 TB" value="≥ 1 TB" />
            </el-select>
          </el-form-item>
          <el-form-item label="网络条件">
            <el-radio-group v-model="draft.network">
              <el-radio v-for="n in networkOptions" :key="n" :value="n">{{ n }}</el-radio>
            </el-radio-group>
          </el-form-item>
        </el-form>
      </section>

      <!-- 5 检查并下发 -->
      <section v-else class="wz__panel">
        <div class="summary">
          <div class="sum__row"><span>任务名称</span><b>{{ draft.name }}</b></div>
          <div class="sum__row"><span>牵头机构</span><b>{{ leaderOrg }}</b></div>
          <div class="sum__row"><span>参与机构</span><b>{{ draft.participantOrgs.join('、') || '—' }}</b></div>
          <div class="sum__row"><span>科研队列</span><b>{{ cohortName || '—' }}</b></div>
          <div class="sum__row"><span>任务类型</span><b>{{ draft.taskType }}</b></div>
          <div class="sum__row"><span>目标标签</span><b>{{ fieldDef(draft.labelField)?.label || (draft.taskType === '无监督' ? '无' : '未设置') }}</b></div>
          <div class="sum__row"><span>所需字段</span><b>{{ draft.fieldKeys.length }} 个</b></div>
          <div class="sum__row"><span>算法 / 模型</span><b>{{ draft.algorithm }} · {{ draft.modelType }}</b></div>
          <div class="sum__row"><span>算力要求</span><b>CPU {{ draft.cpuCores }} 核 · 显存 {{ draft.gpuMemory }}GB · {{ draft.network }}</b></div>
        </div>
        <p class="wz__note">
          下发后任务进入「待审批」，各参与机构需在后台审批管理模块提交审批结果。本平台结果均为演示用模拟数据。
        </p>
      </section>
    </div>

    <div class="wz__foot">
      <el-button v-if="step > 0" size="small" @click="prev">上一步</el-button>
      <el-button v-if="step < steps.length - 1" type="primary" size="small" :disabled="!canNext" @click="next">下一步</el-button>
      <el-button v-else type="primary" size="small" :icon="Check" @click="submit">下发任务</el-button>
    </div>
  </div>
</template>

<style scoped>
.wz {
  padding: 4px 2px;
}
.wz__head {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 14px;
}
.wz__title {
  position: relative;
  font-size: 18px;
  font-weight: 700;
  letter-spacing: 0.03em;
  padding-left: 12px;
  margin: 0;
  color: var(--pf-text);
}
.wz__title::before {
  content: '';
  position: absolute;
  left: 0;
  top: 2px;
  bottom: 2px;
  width: 3px;
  border-radius: 2px;
  background: var(--pf-primary);
}
.wz__ops {
  margin-left: auto;
}
.wz__steps {
  margin-bottom: 18px;
}
.wz__body {
  padding: 18px 20px;
  background: var(--pf-surface);
  border: 1px solid var(--pf-border);
  border-radius: 12px;
  min-height: 300px;
}
.wz__panel {
  max-width: 720px;
}
.wz__hint {
  margin: 0 0 14px;
  font-size: 12.5px;
  color: var(--pf-text-soft);
}
.wz__note {
  margin-left: 10px;
  font-size: 12px;
  color: var(--pf-text-faint);
}
.carried {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
  padding: 10px 14px;
  margin-bottom: 14px;
  font-size: 12.5px;
  color: var(--pf-text-soft);
  background: var(--pf-bg-soft);
  border-radius: 10px;
}
.carried__lb {
  padding: 1px 8px;
  font-size: 11px;
  color: var(--pf-primary);
  background: rgba(37, 99, 235, 0.1);
  border-radius: 4px;
}
.carried b {
  color: var(--pf-text);
}
.carried__id {
  color: var(--pf-text-faint);
}
.orgs {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 10px;
}
.org {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 14px;
  border: 1px solid var(--pf-border);
  border-radius: 10px;
  cursor: pointer;
  font-size: 13px;
  color: var(--pf-text);
  transition: border-color 0.15s, background 0.15s;
}
.org:hover {
  border-color: var(--pf-border-strong);
}
.org.is-on {
  border-color: var(--pf-primary);
  background: var(--pf-surface-2);
  box-shadow: inset 0 0 0 1px var(--pf-primary);
}
.org__ck {
  color: var(--pf-primary);
}
.fields {
  display: flex;
  flex-direction: column;
  gap: 12px;
  max-width: 620px;
}
.fgrp {
  border: 1px solid var(--pf-border);
  border-radius: 8px;
  padding: 8px 12px 10px;
}
.fgrp__hd {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  font-weight: 600;
  color: var(--pf-text-soft);
  margin-bottom: 6px;
}
.fgrp__cnt {
  color: var(--pf-primary);
}
.fgrp__items {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 2px 12px;
}
.params {
  display: flex;
  flex-wrap: wrap;
  gap: 14px;
}
.params label {
  display: flex;
  flex-direction: column;
  font-size: 12px;
  color: var(--pf-text-soft);
  gap: 4px;
}
.params input {
  width: 90px;
  padding: 5px 8px;
  border: 1px solid var(--pf-border);
  border-radius: 6px;
  font-family: inherit;
}
.summary {
  border: 1px solid var(--pf-border);
  border-radius: 10px;
  overflow: hidden;
}
.sum__row {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  padding: 9px 14px;
  font-size: 13px;
  border-bottom: 1px solid var(--pf-border);
}
.sum__row:last-child {
  border-bottom: none;
}
.sum__row span {
  color: var(--pf-text-faint);
}
.sum__row b {
  color: var(--pf-text);
  font-weight: 600;
  text-align: right;
}
.wz__foot {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 14px;
}
</style>
