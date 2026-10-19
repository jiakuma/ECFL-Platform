<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { ArrowLeft, ArrowRight, Check } from '@element-plus/icons-vue'
import {
  useDatasetStore,
  emptyDataset,
  lockCohort,
  checkDataset,
  statusOf,
  DATA_TYPE_OPTIONS,
  TASK_TYPES,
  type Dataset,
  type TaskType,
  type CheckItem,
} from '@/store/dataset'
import { useCohortStore } from '@/store/cohort'
import { useOrgStore } from '@/store/org'
import { cohortSummary, runCohort } from '@/mock/cohortFields'
import {
  datasetFieldCatalog,
  fieldDef,
  fieldStats,
  DATASET_FIELD_CATS,
  type FieldCategory,
} from '@/mock/datasetFields'

const route = useRoute()
const router = useRouter()
const store = useDatasetStore()
const cohortStore = useCohortStore()
const orgStore = useOrgStore()

const currentOrg = computed(() => orgStore.selected || orgStore.allowedOrgs[0])
const editId = computed(() => (route.params.id as string) || '')
const isEdit = computed(() => !!editId.value && route.path.endsWith('/edit'))

const step = ref(0)
const draft = reactive<Dataset>(emptyDataset())

onMounted(() => {
  store.ensureSeed()
  if (isEdit.value) {
    const src = store.list.find((d) => d.id === editId.value)
    if (!src) {
      ElMessage.warning('数据集不存在')
      router.replace('/dataset/research-datasets')
      return
    }
    Object.assign(draft, {
      ...src,
      fields: src.fields.map((f) => ({ ...f })),
      referencedBy: [...src.referencedBy],
    })
    // 回填字段与标签选择
    selectedKeys.value = draft.fields.filter((f) => f.role === 'feature').map((f) => f.key)
    taskType.value = draft.taskType
    labelField.value = draft.labelField
  } else {
    draft.org = currentOrg.value
  }
})

/* ---------- 步骤 2：来源队列 ---------- */
const cohorts = computed(() =>
  cohortStore.list
    .filter((c) => c.org === currentOrg.value)
    .map((c) => ({
      id: c.id,
      name: c.name,
      summary: cohortSummary(c.includes, c.excludes),
      count: runCohort(c.includes, c.excludes).total,
    })),
)

function pickCohort(id: string) {
  if (lockCohort(draft, id)) {
    ElMessage.success(`已关联队列「${draft.cohortName}」，样本数 ${draft.sampleCount} 例`)
  }
}

/* ---------- 步骤 3：字段配置 ---------- */
const fieldKw = ref('')
const fieldCat = ref<FieldCategory | ''>('')
const selectedKeys = ref<string[]>([])

const catalogFiltered = computed(() =>
  datasetFieldCatalog.filter((f) => {
    if (fieldCat.value && f.category !== fieldCat.value) return false
    if (fieldKw.value && !`${f.key}${f.label}`.toLowerCase().includes(fieldKw.value.toLowerCase())) return false
    return true
  }),
)
const grouped = computed(() =>
  DATASET_FIELD_CATS.map((cat) => ({
    cat,
    items: catalogFiltered.value.filter((f) => f.category === cat),
  })).filter((g) => g.items.length),
)

function isSelected(key: string) {
  return selectedKeys.value.includes(key)
}
function toggleField(key: string) {
  selectedKeys.value = isSelected(key)
    ? selectedKeys.value.filter((k) => k !== key)
    : [...selectedKeys.value, key]
}
function selectCat(cat: FieldCategory) {
  const keys = datasetFieldCatalog.filter((f) => f.category === cat).map((f) => f.key)
  selectedKeys.value = [...new Set([...selectedKeys.value, ...keys])]
}
function clearFields() {
  selectedKeys.value = []
}
function missingText(key: string): string {
  const s = fieldStats(key)
  if (!s.total || !s.hasStats) return '暂无统计'
  return s.missingRate > 0 ? `缺失 ${(s.missingRate * 100).toFixed(0)}%` : '无缺失'
}

/* ---------- 步骤 4：目标标签 ---------- */
const taskType = ref<TaskType>('分类')
const labelField = ref('')

const labelCandidates = computed(() => {
  const need = taskType.value === '回归' ? '数值' : '枚举'
  return datasetFieldCatalog.filter((f) => f.kind === need && !f.sensitive)
})
const labelStats = computed(() => (labelField.value ? fieldStats(labelField.value) : null))

/* ---------- 同步草稿 ---------- */
function syncDraft() {
  draft.taskType = taskType.value
  draft.labelField = taskType.value === '无监督' ? '' : labelField.value
  const keys = taskType.value === '无监督' || !labelField.value
    ? selectedKeys.value
    : [...new Set([...selectedKeys.value, labelField.value])]
  draft.fields = keys.map((k) => ({
    key: k,
    role: (k === draft.labelField ? 'label' : 'feature') as 'label' | 'feature',
  }))
}

/* ---------- 步骤 5：检查 ---------- */
const checks = computed<CheckItem[]>(() => {
  syncDraft()
  return checkDataset(draft)
})
const failCount = computed(() => checks.value.filter((c) => c.level === '失败').length)
const warnCount = computed(() => checks.value.filter((c) => c.level === '警告').length)
const nextStatus = computed(() => statusOf(checks.value))

/* ---------- 步骤流转 ---------- */
const stepValid = computed(() => {
  if (step.value === 0) return !!draft.name.trim()
  if (step.value === 1) return !!draft.cohortId
  if (step.value === 2) return selectedKeys.value.length > 0
  if (step.value === 3) {
    if (taskType.value === '无监督') return true
    if (!labelField.value) return false
    const def = fieldDef(labelField.value)
    return def?.kind === (taskType.value === '回归' ? '数值' : '枚举')
  }
  return true
})

function next() {
  if (!stepValid.value) {
    ElMessage.warning(stepHint.value)
    return
  }
  if (step.value < 4) step.value += 1
}
function prev() {
  if (step.value > 0) step.value -= 1
}

const stepHint = computed(() => {
  if (step.value === 0) return '请填写数据集名称'
  if (step.value === 1) return '请选择一个来源科研队列'
  if (step.value === 2) return '请至少选择一个数据字段'
  if (step.value === 3) {
    if (taskType.value === '无监督') return ''
    if (!labelField.value) return '请选择目标标签字段'
    return `所选标签类型与「${taskType.value}」任务要求不符`
  }
  return ''
})

function save() {
  syncDraft()
  const items = checkDataset(draft)
  if (items.some((i) => i.level === '失败')) {
    ElMessage.error('存在未通过的检查项，请修正后再保存')
    return
  }
  if (isEdit.value) {
    const updated = store.update(editId.value, draft)
    if (updated) {
      ElMessage.success(`数据集已更新至 v${updated.version}`)
      router.replace(`/dataset/research-datasets/${updated.id}`)
    }
  } else {
    const item = store.create(draft)
    ElMessage.success(`数据集已保存，编号 ${item.id}`)
    router.replace(`/dataset/research-datasets/${item.id}`)
  }
}

function goCohort() {
  router.push('/dataset/cohort')
}
function cancel() {
  router.push('/dataset/research-datasets')
}

const levelColor: Record<string, string> = { 通过: '#10b981', 警告: '#f59e0b', 失败: '#f43f5e' }
</script>

<template>
  <div class="wz">
    <div class="wz__head">
      <h1 class="wz__title">{{ isEdit ? '编辑数据集' : '新建数据集' }}</h1>
      <div class="wz__ops">
        <el-button size="small" @click="cancel">取消</el-button>
      </div>
    </div>

    <el-steps :active="step" finish-status="success" align-center class="wz__steps">
      <el-step title="基本信息" />
      <el-step title="选择来源队列" />
      <el-step title="配置数据字段" />
      <el-step title="设置目标标签" />
      <el-step title="检查并保存" />
    </el-steps>

    <div class="wz__body">
      <!-- 1 基本信息 -->
      <section v-if="step === 0" class="wz__panel">
        <div class="fld">
          <label class="fld__lb">数据集名称<i>*</i></label>
          <el-input v-model="draft.name" placeholder="如：食管鳞癌复发预测数据集" maxlength="40" />
        </div>
        <div class="fld">
          <label class="fld__lb">研究目的</label>
          <el-input v-model="draft.purpose" type="textarea" :rows="2" placeholder="说明该数据集用于什么研究" maxlength="120" />
        </div>
        <div class="fld">
          <label class="fld__lb">数据集说明</label>
          <el-input v-model="draft.desc" type="textarea" :rows="2" placeholder="补充数据范围、字段口径等说明" maxlength="120" />
        </div>
        <div class="fld">
          <label class="fld__lb">数据类型<i>*</i></label>
          <el-select v-model="draft.dataType" class="fld__sel">
            <el-option v-for="t in DATA_TYPE_OPTIONS" :key="t" :label="t" :value="t" />
          </el-select>
        </div>
      </section>

      <!-- 2 选择来源队列 -->
      <section v-else-if="step === 1" class="wz__panel">
        <p class="wz__hint">字段来源于本机构标准数据，已完成标准化、清洗、去重与脱敏，无需重新配置映射与清洗规则。</p>

        <div v-if="cohorts.length" class="qc">
          <div
            v-for="c in cohorts"
            :key="c.id"
            class="qc__item"
            :class="{ 'is-on': draft.cohortId === c.id }"
            @click="pickCohort(c.id)"
          >
            <div class="qc__top">
              <span class="qc__name">{{ c.name }}</span>
              <span class="qc__count">{{ c.count }} 例</span>
            </div>
            <p class="qc__rule">{{ c.summary }}</p>
          </div>
        </div>

        <div v-else class="wz__empty">
          <span>本机构暂无可用的科研队列，请先创建科研队列</span>
          <el-button type="primary" size="small" @click="goCohort">前往科研队列</el-button>
        </div>

        <div v-if="draft.cohortId" class="wz__picked">
          已关联：<b>{{ draft.cohortName }}</b> · 符合条件 {{ draft.sampleCount }} 例 · 规则版本 {{ draft.cohortRuleAt }}
        </div>
      </section>

      <!-- 3 配置数据字段 -->
      <section v-else-if="step === 2" class="wz__panel">
        <div class="fbar">
          <el-input v-model="fieldKw" placeholder="搜索字段名称 / 中文名称" clearable class="fbar__kw" />
          <el-select v-model="fieldCat" placeholder="数据分类" clearable class="fbar__sel">
            <el-option v-for="c in DATASET_FIELD_CATS" :key="c" :label="c" :value="c" />
          </el-select>
          <el-button size="small" @click="clearFields">清空已选</el-button>
          <span class="fbar__num">已选 {{ selectedKeys.length }} 个字段</span>
        </div>

        <div v-for="g in grouped" :key="g.cat" class="fgrp">
          <div class="fgrp__hd">
            <span class="fgrp__name">{{ g.cat }}</span>
            <span class="fgrp__num">{{ g.items.filter((f) => isSelected(f.key)).length }}/{{ g.items.length }}</span>
            <button type="button" class="fgrp__btn" @click="selectCat(g.cat)">全选本类</button>
          </div>
          <div class="fgrp__rows">
            <div v-for="f in g.items" :key="f.key" class="frow" :class="{ 'is-on': isSelected(f.key) }" @click="toggleField(f.key)">
              <span class="frow__chk">{{ isSelected(f.key) ? '✓' : '' }}</span>
              <span class="frow__key">{{ f.key }}</span>
              <span class="frow__label">{{ f.label }}</span>
              <span class="frow__kind">{{ f.kind }}</span>
              <span class="frow__cat">{{ f.category }}</span>
              <span class="frow__miss">{{ missingText(f.key) }}</span>
            </div>
          </div>
        </div>

        <div v-if="!grouped.length" class="wz__empty"><span>没有匹配的字段</span></div>
      </section>

      <!-- 4 设置目标标签 -->
      <section v-else-if="step === 3" class="wz__panel">
        <div class="fld">
          <label class="fld__lb">机器学习任务类型<i>*</i></label>
          <el-radio-group v-model="taskType">
            <el-radio v-for="t in TASK_TYPES" :key="t" :value="t">{{ t }}</el-radio>
          </el-radio-group>
        </div>

        <div v-if="taskType === '无监督'" class="wz__note">
          无监督学习不设置目标标签，仅使用已选特征字段进行训练。
        </div>

        <template v-else>
          <div class="fld">
            <label class="fld__lb">目标标签字段<i>*</i></label>
            <el-select v-model="labelField" placeholder="选择标签字段" class="fld__sel">
              <el-option v-for="f in labelCandidates" :key="f.key" :label="`${f.label}（${f.key}）`" :value="f.key" />
            </el-select>
          </div>

          <div v-if="labelField && labelStats" class="wz__stat">
            <template v-if="taskType === '分类' && labelStats.categories">
              <div class="wz__stat-hd">
                类别分布（基于本机构标准数据 {{ labelStats.total }} 条样本计算，缺失 {{ labelStats.missing }} 条）
              </div>
              <div class="wz__dist">
                <div v-for="c in labelStats.categories" :key="c.name" class="wz__dist-row">
                  <span class="wz__dist-name">{{ c.name }}</span>
                  <span class="wz__dist-bar"><i :style="{ width: (c.count / labelStats.total * 100) + '%' }" /></span>
                  <span class="wz__dist-num">{{ c.count }} 例</span>
                </div>
              </div>
            </template>
            <template v-else-if="labelStats.hasStats">
              <div class="wz__stat-hd">
                取值范围：{{ labelStats.min }} ~ {{ labelStats.max }} · 缺失 {{ labelStats.missing }} / {{ labelStats.total }} 条
              </div>
            </template>
            <div v-else class="wz__note">该字段暂无可用统计</div>
          </div>
        </template>
      </section>

      <!-- 5 检查并保存 -->
      <section v-else class="wz__panel">
        <div class="ck__sum">
          <span class="ck__badge" :style="{ color: levelColor[failCount ? '失败' : warnCount ? '警告' : '通过'] }">
            检查结果：{{ failCount }} 项失败 · {{ warnCount }} 项警告
          </span>
          <span class="ck__status">保存后状态：{{ nextStatus }}</span>
        </div>

        <div class="ck">
          <div v-for="c in checks" :key="c.name" class="ck__item">
            <span class="ck__lv" :style="{ background: levelColor[c.level] }">{{ c.level }}</span>
            <div class="ck__txt">
              <b>{{ c.name }}</b>
              <p>{{ c.detail }}</p>
            </div>
          </div>
        </div>

        <div v-if="failCount" class="ck__fail">
          存在 {{ failCount }} 项未通过的检查，请返回上一步修正后再保存。
        </div>
      </section>
    </div>

    <div class="wz__foot">
      <el-button v-if="step > 0" size="small" :icon="ArrowLeft" @click="prev">上一步</el-button>
      <el-button v-if="step < 4" type="primary" size="small" :icon="ArrowRight" @click="next">下一步</el-button>
      <el-button v-else type="primary" size="small" :icon="Check" :disabled="!!failCount" @click="save">
        保存数据集
      </el-button>
    </div>
  </div>
</template>

<style scoped>
.wz__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
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
.wz__steps {
  padding: 14px 16px;
  margin-bottom: 14px;
  background: var(--pf-surface);
  border: 1px solid var(--pf-border);
  border-radius: 12px;
}
.wz__body {
  padding: 16px 18px;
  background: var(--pf-surface);
  border: 1px solid var(--pf-border);
  border-radius: 12px;
  min-height: 320px;
}
.wz__foot {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 14px;
}
.wz__hint {
  margin: 0 0 12px;
  font-size: 12px;
  color: var(--pf-text-faint);
}
.wz__note {
  padding: 10px 12px;
  font-size: 12px;
  color: var(--pf-text-soft);
  background: var(--pf-bg-soft);
  border-radius: 8px;
}
.wz__empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 40px 0;
  border: 1px dashed var(--pf-border-strong);
  border-radius: 10px;
  color: var(--pf-text-faint);
  font-size: 13px;
}
.wz__picked {
  margin-top: 12px;
  padding: 8px 12px;
  font-size: 12.5px;
  color: var(--pf-text-soft);
  background: var(--pf-bg-soft);
  border-radius: 8px;
}

/* 表单 */
.fld {
  margin-bottom: 14px;
}
.fld__lb {
  display: block;
  margin-bottom: 6px;
  font-size: 12.5px;
  font-weight: 600;
  color: var(--pf-text);
}
.fld__lb i {
  color: var(--pf-danger);
  font-style: normal;
  margin-left: 3px;
}
.fld__sel {
  width: 320px;
}

/* 队列选择 */
.qc {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 12px;
}
.qc__item {
  padding: 12px 14px;
  border: 1px solid var(--pf-border);
  border-radius: 10px;
  cursor: pointer;
  transition: border-color 0.15s, background 0.15s;
}
.qc__item:hover {
  border-color: var(--pf-border-strong);
}
.qc__item.is-on {
  border-color: var(--pf-primary);
  background: var(--pf-surface-2);
  box-shadow: inset 0 0 0 1px var(--pf-primary);
}
.qc__top {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 8px;
}
.qc__name {
  font-size: 13.5px;
  font-weight: 700;
  color: var(--pf-text);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.qc__count {
  flex: none;
  font-size: 12px;
  font-weight: 600;
  color: var(--pf-primary);
}
.qc__rule {
  margin: 6px 0 0;
  font-size: 11.5px;
  line-height: 1.5;
  color: var(--pf-text-faint);
}

/* 字段配置 */
.fbar {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
  margin-bottom: 14px;
}
.fbar__kw {
  width: 260px;
}
.fbar__sel {
  width: 150px;
}
.fbar__num {
  margin-left: auto;
  font-size: 12px;
  color: var(--pf-text-faint);
}
.fgrp {
  margin-bottom: 14px;
}
.fgrp__hd {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 6px;
}
.fgrp__name {
  font-size: 12.5px;
  font-weight: 700;
  color: var(--pf-text);
}
.fgrp__num {
  font-size: 11.5px;
  color: var(--pf-text-faint);
}
.fgrp__btn {
  margin-left: auto;
  padding: 2px 8px;
  font-family: inherit;
  font-size: 12px;
  color: var(--pf-primary);
  background: transparent;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}
.fgrp__btn:hover {
  background: var(--pf-bg-soft);
}
.fgrp__rows {
  border: 1px solid var(--pf-border);
  border-radius: 8px;
  overflow: hidden;
}
.frow {
  display: grid;
  grid-template-columns: 22px 150px 1fr 56px 72px 78px;
  align-items: center;
  gap: 8px;
  padding: 7px 10px;
  font-size: 12px;
  color: var(--pf-text-soft);
  border-top: 1px solid var(--pf-border);
  cursor: pointer;
}
.frow:first-child {
  border-top: none;
}
.frow:hover {
  background: var(--pf-bg-soft);
}
.frow.is-on {
  background: var(--pf-surface-2);
}
.frow__chk {
  color: var(--pf-primary);
  font-weight: 700;
}
.frow__key {
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 11.5px;
  color: var(--pf-text-faint);
  overflow: hidden;
  text-overflow: ellipsis;
}
.frow__label {
  color: var(--pf-text);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.frow__kind,
.frow__cat,
.frow__miss {
  font-size: 11.5px;
  color: var(--pf-text-faint);
}

/* 标签统计 */
.wz__stat {
  padding: 12px 14px;
  background: var(--pf-bg-soft);
  border-radius: 10px;
}
.wz__stat-hd {
  margin-bottom: 8px;
  font-size: 12px;
  color: var(--pf-text-soft);
}
.wz__dist-row {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 5px;
  font-size: 12px;
}
.wz__dist-name {
  flex: none;
  width: 90px;
  color: var(--pf-text);
}
.wz__dist-bar {
  flex: 1;
  height: 6px;
  background: var(--pf-border);
  border-radius: 999px;
  overflow: hidden;
}
.wz__dist-bar i {
  display: block;
  height: 100%;
  background: var(--pf-primary);
  border-radius: 999px;
}
.wz__dist-num {
  flex: none;
  width: 56px;
  text-align: right;
  color: var(--pf-text-faint);
}

/* 检查 */
.ck__sum {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 12px;
}
.ck__badge {
  font-size: 12.5px;
  font-weight: 700;
}
.ck__status {
  font-size: 12.5px;
  color: var(--pf-text-soft);
}
.ck {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.ck__item {
  display: flex;
  gap: 10px;
  padding: 10px 12px;
  background: var(--pf-bg-soft);
  border-radius: 8px;
}
.ck__lv {
  flex: none;
  align-self: flex-start;
  padding: 1px 8px;
  font-size: 11px;
  font-weight: 700;
  color: #fff;
  border-radius: 4px;
}
.ck__txt b {
  font-size: 12.5px;
  color: var(--pf-text);
}
.ck__txt p {
  margin: 3px 0 0;
  font-size: 12px;
  line-height: 1.55;
  color: var(--pf-text-soft);
}
.ck__fail {
  margin-top: 12px;
  padding: 8px 12px;
  font-size: 12px;
  color: var(--pf-danger);
  background: rgba(244, 63, 94, 0.08);
  border-radius: 8px;
}
</style>
