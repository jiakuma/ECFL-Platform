<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Plus,
  CopyDocument,
  Delete,
  Check,
  RefreshLeft,
  Close,
  MoreFilled,
  Search,
} from '@element-plus/icons-vue'
import {
  useCohortStore,
  emptyCohort,
  COHORT_TYPES,
  COHORT_STATUSES,
  COHORT_DIRECTIONS,
  COHORT_STATUS_TYPE,
  type Cohort,
} from '@/store/cohort'
import { useOrgStore } from '@/store/org'
import { StatusBadge } from '@/components/common'
import {
  availableFields,
  ENUM_OPS,
  NUMBER_OPS,
  fieldDef,
  fieldLabel,
  fieldOptions,
  fieldRange,
  newCondition,
  runCohort,
  cohortSummary,
  type CohortCondition,
} from '@/mock/cohortFields'

const store = useCohortStore()
const orgStore = useOrgStore()

/** 当前机构上下文：机构切换器未选时取第一家作为本机构 */
const currentOrg = computed(() => orgStore.selected || orgStore.allowedOrgs[0])

/* ---------- 页签 ---------- */
const activeTab = ref<'manage' | 'filter'>('manage')

/* ---------- 列表：本机构队列 + 他院共享摘要 ---------- */
const allRows = computed(() =>
  store.list
    .filter((c) => c.org === currentOrg.value || !!c.shared)
    .map((c) => ({
      cohort: c,
      count: runCohort(c.includes, c.excludes).total,
      own: c.org === currentOrg.value,
    })),
)

/* ---------- 筛选 ---------- */
const kw = ref('')
const orgFilter = ref('')
const typeFilter = ref('')
const directionFilter = ref('')
const statusFilter = ref('')

const orgOptions = computed(() => [...new Set(allRows.value.map((r) => r.cohort.org))])

const rows = computed(() =>
  allRows.value.filter(({ cohort: c }) => {
    if (kw.value && !`${c.name}${c.id}`.includes(kw.value)) return false
    if (orgFilter.value && c.org !== orgFilter.value) return false
    if (typeFilter.value && c.cohortType !== typeFilter.value) return false
    if (directionFilter.value && c.direction !== directionFilter.value) return false
    if (statusFilter.value && c.status !== statusFilter.value) return false
    return true
  }),
)

const hasFilter = computed(
  () =>
    !!(kw.value || orgFilter.value || typeFilter.value || directionFilter.value || statusFilter.value),
)

function resetFilter() {
  kw.value = ''
  orgFilter.value = ''
  typeFilter.value = ''
  directionFilter.value = ''
  statusFilter.value = ''
}

/* ---------- 分页 ---------- */
const page = ref(1)
const pageSize = ref(10)
const paged = computed(() =>
  rows.value.slice((page.value - 1) * pageSize.value, page.value * pageSize.value),
)
watch(rows, () => {
  page.value = 1
})
function onSizeChange(v: number) {
  pageSize.value = v
  page.value = 1
}

const num = (n: number) => n.toLocaleString('zh-CN')
const dateOf = (s: string) => (s ? s.split(' ')[0] : '—')
const statusType = (c: Cohort) => COHORT_STATUS_TYPE[c.status]

/* ---------- 纳排工作台状态 ---------- */
const activeId = ref('')
const form = reactive<Cohort>(emptyCohort())
const baseline = ref('')
const isNew = computed(() => !activeId.value)

/** 纳入 + 排除规则序列化，用于未保存判断 */
function snapshot(): string {
  return JSON.stringify({
    name: form.name,
    purpose: form.purpose,
    cohortType: form.cohortType,
    direction: form.direction,
    status: form.status,
    includes: form.includes,
    excludes: form.excludes,
  })
}
const dirty = computed(() => snapshot() !== baseline.value)

/** 实时纳排结果（规则一变立即重算） */
const preview = computed(() => runCohort(form.includes, form.excludes))

/** 各条件单独命中数，直接标在条件行上 */
const hitMap = computed(() => {
  const m: Record<string, number> = {}
  for (const h of preview.value.conditionHits) m[h.id] = h.hits
  return m
})

function loadForm(c: Cohort) {
  Object.assign(form, {
    id: c.id,
    name: c.name,
    purpose: c.purpose,
    org: c.org,
    cohortType: c.cohortType,
    direction: c.direction,
    status: c.status,
    includes: c.includes.map((x) => ({ ...x })),
    excludes: c.excludes.map((x) => ({ ...x })),
    createdAt: c.createdAt,
    updatedAt: c.updatedAt,
  })
  baseline.value = snapshot()
}

async function confirmDiscard(): Promise<boolean> {
  if (!dirty.value) return true
  try {
    await ElMessageBox.confirm('当前纳排条件尚未保存，切换后将丢失。', '提示', {
      confirmButtonText: '继续切换',
      cancelButtonText: '取消',
      type: 'warning',
    })
    return true
  } catch {
    return false
  }
}

async function selectCohort(id: string) {
  if (id === activeId.value && activeTab.value === 'filter') return
  if (!(await confirmDiscard())) return
  const c = store.list.find((x) => x.id === id)
  if (!c) return
  activeId.value = id
  loadForm(c)
  activeTab.value = 'filter'
}

async function startCreate() {
  if (!(await confirmDiscard())) return
  activeId.value = ''
  loadForm(emptyCohort())
  form.org = currentOrg.value
  activeTab.value = 'filter'
}

/* ---------- 条件编辑 ---------- */
function onFieldChange(c: CohortCondition) {
  const f = fieldDef(c.field)
  if (!f) return
  c.op = f.kind === 'enum' ? 'eq' : 'gte'
  c.value = f.kind === 'enum' ? '' : (fieldRange(c.field)?.min ?? 0)
}

/** 比较符切换时校正取值结构（多选 / 区间） */
function onOpChange(c: CohortCondition) {
  const f = fieldDef(c.field)
  if (!f) return
  if (f.kind === 'enum' && (c.op === 'in' || c.op === 'not_in') && !Array.isArray(c.value)) {
    c.value = []
  }
  if (c.op === 'between' && !Array.isArray(c.value)) {
    const r = fieldRange(c.field)
    c.value = [r?.min ?? 0, r?.max ?? 0]
  }
}

function toggleLogic(c: CohortCondition) {
  c.logic = c.logic === 'AND' ? 'OR' : 'AND'
}

function addCondition(group: 'includes' | 'excludes') {
  const c = newCondition('age')
  const r = fieldRange('age')
  if (r) {
    c.op = 'gte'
    c.value = r.min
  }
  form[group].push(c)
}

function removeCondition(group: 'includes' | 'excludes', id: string) {
  form[group] = form[group].filter((c) => c.id !== id)
}

/* ---------- 保存 / 复制 / 删除 / 重置 ---------- */
function save() {
  if (!form.name.trim()) return ElMessage.warning('请填写队列名称')
  if (!form.includes.length) return ElMessage.warning('请至少配置一条纳入条件')

  if (isNew.value) {
    const item = store.create({ ...form })
    activeId.value = item.id
    loadForm(item)
    ElMessage.success('队列已保存，纳排规则已生效')
  } else {
    store.update(activeId.value, { ...form })
    const c = store.list.find((x) => x.id === activeId.value)
    if (c) loadForm(c)
    ElMessage.success('队列已更新，纳排结果已重新计算')
  }
}

function duplicateActive() {
  if (isNew.value) return
  const item = store.duplicate(activeId.value)
  if (!item) return
  activeId.value = item.id
  loadForm(item)
  ElMessage.success(`已复制为「${item.name}」`)
}

async function removeActive() {
  if (isNew.value) return
  const c = store.list.find((x) => x.id === activeId.value)
  if (!c) return
  try {
    await ElMessageBox.confirm(
      `确定删除队列「${c.name}」吗？删除后不影响已创建的科研数据集。`,
      '删除确认',
      { confirmButtonText: '删除', cancelButtonText: '取消', type: 'warning' },
    )
  } catch {
    return
  }
  store.remove(c.id)
  ElMessage.success('队列已删除')
  const next = store.list[0]
  if (next) {
    activeId.value = next.id
    loadForm(next)
  } else {
    activeId.value = ''
    loadForm(emptyCohort())
  }
}

function resetForm() {
  if (isNew.value) {
    loadForm(emptyCohort())
    return
  }
  const c = store.list.find((x) => x.id === activeId.value)
  if (c) loadForm(c)
}

/* ---------- 行操作（按队列 id，不依赖当前选中） ---------- */
/** 复制：生成新队列（保留规则，换名称与编号），跳到筛选页继续编辑 */
function duplicateById(id: string) {
  const item = store.duplicate(id)
  if (!item) return
  activeId.value = item.id
  loadForm(item)
  activeTab.value = 'filter'
  ElMessage.success(`已复制为「${item.name}」`)
}

/** 删除：按 id 删除本机构队列 */
async function removeById(id: string) {
  const c = store.list.find((x) => x.id === id)
  if (!c) return
  try {
    await ElMessageBox.confirm(`确定删除队列「${c.name}」吗？删除后不影响已创建的科研数据集。`, '删除确认', {
      confirmButtonText: '删除',
      cancelButtonText: '取消',
      type: 'warning',
    })
  } catch {
    return
  }
  store.remove(id)
  ElMessage.success('队列已删除')
  if (activeId.value === id) {
    const next = store.list[0]
    if (next) {
      activeId.value = next.id
      loadForm(next)
    } else {
      activeId.value = ''
      loadForm(emptyCohort())
    }
  }
}

/* ---------- 查看弹窗（只读摘要，不进入筛选页） ---------- */
const viewOpen = ref(false)
const viewCohort = ref<Cohort | null>(null)
const viewPreview = computed(() =>
  viewCohort.value ? runCohort(viewCohort.value.includes, viewCohort.value.excludes) : null,
)
const viewSummary = computed(() =>
  viewCohort.value ? cohortSummary(viewCohort.value.includes, viewCohort.value.excludes) : '',
)
function openView(c: Cohort) {
  viewCohort.value = c
  viewOpen.value = true
}

/** 本机构看详情弹窗，他院共享看摘要弹窗 */
function viewRow(c: Cohort) {
  if (c.org === currentOrg.value) openView(c)
  else openOther(c)
}

/* 行「更多」菜单 */
function onRowCmd(cmd: string, c: Cohort) {
  if (cmd === 'edit') selectCohort(c.id)
  else if (cmd === 'dup') duplicateById(c.id)
  else if (cmd === 'del') removeById(c.id)
  else if (cmd === 'apply') applyUse(c)
}

/** 申请使用：其他机构共享队列的模拟申请交互 */
function applyUse(c: Cohort) {
  ElMessage.success(`已向「${c.org}」提交「${c.name}」的使用申请，等待对方审批`)
}

/** 其他机构共享队列：只读摘要弹窗（不展示筛选规则与患者明细） */
const otherOpen = ref(false)
const otherView = ref<Cohort | null>(null)
function openOther(c: Cohort) {
  otherView.value = c
  otherOpen.value = true
}
function applyOther() {
  if (otherView.value) applyUse(otherView.value)
  otherOpen.value = false
}

/* ---------- 渲染辅助 ---------- */
function opOptions(c: CohortCondition) {
  const f = fieldDef(c.field)
  return f?.kind === 'number' ? NUMBER_OPS : ENUM_OPS
}
function isMultiOp(c: CohortCondition): boolean {
  const f = fieldDef(c.field)
  if (f?.kind !== 'enum') return false
  return ENUM_OPS.find((o) => o.value === c.op)?.multi ?? false
}
function isBetween(c: CohortCondition): boolean {
  return c.op === 'between'
}
function rangeValue(c: CohortCondition, idx: 0 | 1): number {
  const arr = Array.isArray(c.value) ? c.value : []
  const v = Number(arr[idx])
  return Number.isFinite(v) ? v : 0
}
function setRangeValue(c: CohortCondition, idx: 0 | 1, v: number) {
  const arr: [number, number] = [rangeValue(c, 0), rangeValue(c, 1)]
  arr[idx] = Number.isFinite(v) ? v : 0
  c.value = arr
}

/* ---------- 初始化：默认选中第一个队列 ---------- */
const first = store.list[0]
if (first) {
  activeId.value = first.id
  loadForm(first)
} else {
  loadForm(emptyCohort())
}
</script>

<template>
  <div class="cq">
    <div class="cq__panel">
      <!-- 页签 + 新建 -->
      <div class="lp__bar">
        <div class="lp__tabs">
          <button
            type="button"
            class="lp__tab"
            :class="{ 'is-on': activeTab === 'manage' }"
            @click="activeTab = 'manage'"
          >
            队列管理
          </button>
          <button
            type="button"
            class="lp__tab"
            :class="{ 'is-on': activeTab === 'filter' }"
            @click="activeTab = 'filter'"
          >
            队列筛选
          </button>
        </div>
        <el-button
          v-if="activeTab === 'manage'"
          type="primary"
          :icon="Plus"
          class="lp__new"
          @click="startCreate"
        >
          新建队列
        </el-button>
      </div>

      <!-- 队列管理 -->
      <template v-if="activeTab === 'manage'">
        <div class="lp__filter">
          <el-input
            v-model="kw"
            placeholder="搜索队列名称 / 编号"
            clearable
            :prefix-icon="Search"
            class="lp__search"
          />
          <el-select v-model="orgFilter" placeholder="归属机构" clearable class="lp__sel">
            <el-option v-for="o in orgOptions" :key="o" :label="o" :value="o" />
          </el-select>
          <el-select v-model="typeFilter" placeholder="队列类型" clearable class="lp__sel">
            <el-option v-for="t in COHORT_TYPES" :key="t" :label="t" :value="t" />
          </el-select>
          <el-select v-model="directionFilter" placeholder="研究方向" clearable class="lp__sel">
            <el-option v-for="d in COHORT_DIRECTIONS" :key="d" :label="d" :value="d" />
          </el-select>
          <el-select v-model="statusFilter" placeholder="状态" clearable class="lp__sel">
            <el-option v-for="s in COHORT_STATUSES" :key="s" :label="s" :value="s" />
          </el-select>
          <el-button v-if="hasFilter" text class="lp__reset" @click="resetFilter">重置</el-button>
        </div>

        <div class="lp__body">
        <el-table
          :data="paged"
          row-key="cohort.id"
          :border="false"
          :empty-text="hasFilter ? '没有符合筛选条件的队列' : '暂无队列'"
          class="lp__table"
        >
          <el-table-column label="队列名称" min-width="210" show-overflow-tooltip>
            <template #default="{ row }">
              <button type="button" class="lp__name" @click="viewRow(row.cohort)">
                {{ row.cohort.name }}
              </button>
            </template>
          </el-table-column>

          <el-table-column prop="cohort.id" label="队列编号" min-width="100" />

          <el-table-column prop="cohort.cohortType" label="队列类型" min-width="104" />

          <el-table-column prop="cohort.direction" label="研究方向" min-width="110" />

          <el-table-column label="患者数" min-width="88" align="right">
            <template #default="{ row }">{{ num(row.count) }}</template>
          </el-table-column>

          <el-table-column prop="cohort.org" label="归属机构" min-width="132" show-overflow-tooltip />

          <el-table-column label="创建时间" min-width="116">
            <template #default="{ row }">{{ dateOf(row.cohort.createdAt) }}</template>
          </el-table-column>

          <el-table-column label="状态" min-width="96">
            <template #default="{ row }">
              <StatusBadge :type="statusType(row.cohort)" :text="row.cohort.status" />
            </template>
          </el-table-column>

          <el-table-column label="操作" min-width="104" align="right">
            <template #default="{ row }">
            <div class="lp__ops">
              <button type="button" class="lp__ops-link" @click="viewRow(row.cohort)">查看</button>
              <el-dropdown
                trigger="click"
                placement="bottom-end"
                @command="(cmd: string) => onRowCmd(cmd, row.cohort)"
              >
                <button type="button" class="lp__ops-more" aria-label="更多操作">
                    <el-icon><MoreFilled /></el-icon>
                  </button>
                  <template #dropdown>
                    <el-dropdown-menu v-if="row.own">
                      <el-dropdown-item command="edit">编辑规则</el-dropdown-item>
                      <el-dropdown-item command="dup">复制</el-dropdown-item>
                      <el-dropdown-item command="del" divided>删除</el-dropdown-item>
                    </el-dropdown-menu>
                    <el-dropdown-menu v-else>
                      <el-dropdown-item command="apply">申请使用</el-dropdown-item>
                    </el-dropdown-menu>
                  </template>
                </el-dropdown>
              </div>
            </template>
          </el-table-column>
        </el-table>
        </div>

        <!-- 分页 -->
        <div class="lp__pager">
          <el-select :model-value="pageSize" class="lp__size" @change="onSizeChange">
            <el-option :value="10" label="10 条/页" />
            <el-option :value="20" label="20 条/页" />
            <el-option :value="50" label="50 条/页" />
          </el-select>
          <el-pagination
            :current-page="page"
            :page-size="pageSize"
            :total="rows.length"
            layout="prev, pager, next"
            background
            small
            @current-change="page = $event"
          />
        </div>
      </template>

      <!-- 队列筛选：纳排工作台 -->
      <div v-else class="wq">
        <div class="wq__top">
          <div class="wq__head">
            <div class="wq__id">
              <div class="wq__namewrap">
                <span class="wq__namesize">{{ form.name || '未命名队列' }}</span>
                <input
                  v-model="form.name"
                  class="wq__name"
                  placeholder="未命名队列"
                  maxlength="40"
                />
              </div>
              <span v-if="dirty" class="wq__dirty">未保存</span>
            </div>
            <div class="wq__ops">
              <el-button v-if="!isNew" text size="small" :icon="CopyDocument" @click="duplicateActive">
                复制
              </el-button>
              <el-button v-if="!isNew" text size="small" :icon="Delete" @click="removeActive">
                删除
              </el-button>
              <el-button v-if="dirty" text size="small" :icon="RefreshLeft" @click="resetForm">
                重置
              </el-button>
              <el-button type="primary" size="small" :icon="Check" @click="save">保存</el-button>
            </div>
          </div>

          <div class="wq__attrs">
            <el-select v-model="form.cohortType" size="small" class="wq__attr">
              <el-option v-for="t in COHORT_TYPES" :key="t" :label="t" :value="t" />
            </el-select>
            <el-select v-model="form.direction" size="small" class="wq__attr">
              <el-option v-for="d in COHORT_DIRECTIONS" :key="d" :label="d" :value="d" />
            </el-select>
            <el-select v-model="form.status" size="small" class="wq__attr">
              <el-option v-for="s in COHORT_STATUSES" :key="s" :label="s" :value="s" />
            </el-select>
          </div>
        </div>

        <div class="wq__body">
          <!-- 纳排规则 -->
          <div class="rules">
            <section class="rgroup">
              <div class="rgroup__head">
                <i class="rgroup__dot is-in"></i>
                <span class="rgroup__name">纳入条件</span>
                <button type="button" class="rgroup__add" @click="addCondition('includes')">
                  + 添加条件
                </button>
              </div>
              <div class="rgroup__rows">
                <p v-if="!form.includes.length" class="rgroup__empty">尚未设置纳入条件</p>
                <div v-for="(c, i) in form.includes" :key="c.id" class="crow">
                  <button
                    v-if="i > 0"
                    type="button"
                    class="crow__logic"
                    :title="c.logic === 'AND' ? '与上一条同时满足，点击切换为或' : '与上一条满足其一，点击切换为且'"
                    @click="toggleLogic(c)"
                  >
                    {{ c.logic === 'AND' ? '且' : '或' }}
                  </button>
                  <i v-else class="crow__mark"></i>

                  <el-select v-model="c.field" size="small" placeholder="选择字段" @change="onFieldChange(c)">
                    <el-option-group v-for="g in ['基线', '诊断', '检验', '治疗', '随访']" :key="g" :label="g">
                      <el-option
                        v-for="f in availableFields.filter((x) => x.group === g)"
                        :key="f.key"
                        :label="fieldLabel(f.key)"
                        :value="f.key"
                      />
                    </el-option-group>
                  </el-select>

                  <el-select v-model="c.op" size="small" @change="onOpChange(c)">
                    <el-option v-for="o in opOptions(c)" :key="o.value" :label="o.label" :value="o.value" />
                  </el-select>

                  <div class="crow__val">
                    <template v-if="fieldDef(c.field)?.kind === 'enum'">
                      <el-select
                        v-if="isMultiOp(c)"
                        v-model="c.value"
                        size="small"
                        multiple
                        collapse-tags
                        collapse-tags-tooltip
                        placeholder="选择取值"
                      >
                        <el-option v-for="o in fieldOptions(c.field)" :key="o" :label="o" :value="o" />
                      </el-select>
                      <el-input v-else-if="c.op === 'contains'" v-model="c.value" size="small" placeholder="关键字" />
                      <el-select v-else v-model="c.value" size="small" placeholder="选择取值">
                        <el-option v-for="o in fieldOptions(c.field)" :key="o" :label="o" :value="o" />
                      </el-select>
                    </template>
                    <template v-else-if="isBetween(c)">
                      <el-input-number
                        :model-value="rangeValue(c, 0)"
                        size="small"
                        controls-position="right"
                        :min="fieldRange(c.field)?.min"
                        :max="fieldRange(c.field)?.max"
                        @update:model-value="(v: number) => setRangeValue(c, 0, v)"
                      />
                      <span class="crow__tilde">~</span>
                      <el-input-number
                        :model-value="rangeValue(c, 1)"
                        size="small"
                        controls-position="right"
                        :min="fieldRange(c.field)?.min"
                        :max="fieldRange(c.field)?.max"
                        @update:model-value="(v: number) => setRangeValue(c, 1, v)"
                      />
                    </template>
                    <template v-else>
                      <el-input-number
                        v-model="c.value"
                        size="small"
                        controls-position="right"
                        :min="fieldRange(c.field)?.min"
                        :max="fieldRange(c.field)?.max"
                      />
                      <span v-if="fieldDef(c.field)?.unit" class="crow__unit">{{ fieldDef(c.field)?.unit }}</span>
                    </template>
                  </div>

                  <span class="crow__hit" title="该条件单独命中的人数">{{ hitMap[c.id] ?? 0 }} 例</span>

                  <button type="button" class="crow__del" title="删除条件" @click="removeCondition('includes', c.id)">
                    <el-icon><Close /></el-icon>
                  </button>
                </div>
              </div>
            </section>

            <section class="rgroup">
              <div class="rgroup__head">
                <i class="rgroup__dot is-ex"></i>
                <span class="rgroup__name">排除条件</span>
                <button type="button" class="rgroup__add" @click="addCondition('excludes')">
                  + 添加条件
                </button>
              </div>
              <div class="rgroup__rows">
                <p v-if="!form.excludes.length" class="rgroup__empty">未设置排除条件</p>
                <div v-for="(c, i) in form.excludes" :key="c.id" class="crow">
                  <button
                    v-if="i > 0"
                    type="button"
                    class="crow__logic"
                    :title="c.logic === 'AND' ? '与上一条同时满足，点击切换为或' : '与上一条满足其一，点击切换为且'"
                    @click="toggleLogic(c)"
                  >
                    {{ c.logic === 'AND' ? '且' : '或' }}
                  </button>
                  <i v-else class="crow__mark"></i>

                  <el-select v-model="c.field" size="small" placeholder="选择字段" @change="onFieldChange(c)">
                    <el-option-group v-for="g in ['基线', '诊断', '检验', '治疗', '随访']" :key="g" :label="g">
                      <el-option
                        v-for="f in availableFields.filter((x) => x.group === g)"
                        :key="f.key"
                        :label="fieldLabel(f.key)"
                        :value="f.key"
                      />
                    </el-option-group>
                  </el-select>

                  <el-select v-model="c.op" size="small" @change="onOpChange(c)">
                    <el-option v-for="o in opOptions(c)" :key="o.value" :label="o.label" :value="o.value" />
                  </el-select>

                  <div class="crow__val">
                    <template v-if="fieldDef(c.field)?.kind === 'enum'">
                      <el-select
                        v-if="isMultiOp(c)"
                        v-model="c.value"
                        size="small"
                        multiple
                        collapse-tags
                        collapse-tags-tooltip
                        placeholder="选择取值"
                      >
                        <el-option v-for="o in fieldOptions(c.field)" :key="o" :label="o" :value="o" />
                      </el-select>
                      <el-input v-else-if="c.op === 'contains'" v-model="c.value" size="small" placeholder="关键字" />
                      <el-select v-else v-model="c.value" size="small" placeholder="选择取值">
                        <el-option v-for="o in fieldOptions(c.field)" :key="o" :label="o" :value="o" />
                      </el-select>
                    </template>
                    <template v-else-if="isBetween(c)">
                      <el-input-number
                        :model-value="rangeValue(c, 0)"
                        size="small"
                        controls-position="right"
                        :min="fieldRange(c.field)?.min"
                        :max="fieldRange(c.field)?.max"
                        @update:model-value="(v: number) => setRangeValue(c, 0, v)"
                      />
                      <span class="crow__tilde">~</span>
                      <el-input-number
                        :model-value="rangeValue(c, 1)"
                        size="small"
                        controls-position="right"
                        :min="fieldRange(c.field)?.min"
                        :max="fieldRange(c.field)?.max"
                        @update:model-value="(v: number) => setRangeValue(c, 1, v)"
                      />
                    </template>
                    <template v-else>
                      <el-input-number
                        v-model="c.value"
                        size="small"
                        controls-position="right"
                        :min="fieldRange(c.field)?.min"
                        :max="fieldRange(c.field)?.max"
                      />
                      <span v-if="fieldDef(c.field)?.unit" class="crow__unit">{{ fieldDef(c.field)?.unit }}</span>
                    </template>
                  </div>

                  <span class="crow__hit" title="该条件单独命中的人数">{{ hitMap[c.id] ?? 0 }} 例</span>

                  <button type="button" class="crow__del" title="删除条件" @click="removeCondition('excludes', c.id)">
                    <el-icon><Close /></el-icon>
                  </button>
                </div>
              </div>
            </section>
          </div>
        </div>

        <!-- 患者明细 -->
        <section class="detail">
          <div class="detail__head">
            <span class="detail__title">患者明细</span>
            <span class="detail__count">符合条件 {{ preview.total }} 例</span>
          </div>
          <el-table :data="preview.visible" size="small" max-height="260">
            <el-table-column prop="primaryId" label="患者主索引" width="132" show-overflow-tooltip />
            <el-table-column prop="gender" label="性别" width="52" align="center" />
            <el-table-column prop="age" label="年龄" width="52" align="center" />
            <el-table-column prop="diagnosis" label="诊断" min-width="170" show-overflow-tooltip />
            <el-table-column prop="histology" label="病理组织学" min-width="150" show-overflow-tooltip />
            <el-table-column prop="stage" label="AJCC 分期" width="150" show-overflow-tooltip />
            <el-table-column prop="status" label="随访状态" width="84" />
            <el-table-column prop="org" label="所属机构" width="110" show-overflow-tooltip />
            <template #empty>
              <span class="detail__empty">授权范围内无符合条件的患者</span>
            </template>
          </el-table>
        </section>
      </div>
    </div>

    <!-- 查看弹窗：只读摘要，不进入筛选页、不重复渲染筛选表单 -->
    <el-dialog
      v-model="viewOpen"
      :title="viewCohort ? viewCohort.name + ' · 队列详情（只读）' : '队列详情'"
      width="880px"
      class="cq-view"
      append-to-body
    >
      <template v-if="viewCohort && viewPreview">
        <div class="cq-view__meta">
          <span class="cq-view__org">{{ viewCohort.org }}</span>
          <span class="cq-view__chip">{{ viewCohort.cohortType }}</span>
          <span class="cq-view__chip">{{ viewCohort.direction }}</span>
          <span>符合条件 <b>{{ viewPreview.total }}</b> 例</span>
          <span>创建于 {{ viewCohort.createdAt }}</span>
        </div>
        <p class="cq-view__purpose">{{ viewCohort.purpose || '—' }}</p>
        <div class="cq-view__block">
          <div class="cq-view__label">筛选条件摘要</div>
          <p class="cq-view__summary">{{ viewSummary }}</p>
        </div>
        <div class="cq-view__block">
          <div class="cq-view__label">符合患者明细（授权范围内）</div>
          <el-table :data="viewPreview.visible" size="small" max-height="300">
            <el-table-column prop="primaryId" label="患者主索引" width="132" show-overflow-tooltip />
            <el-table-column prop="gender" label="性别" width="52" align="center" />
            <el-table-column prop="age" label="年龄" width="52" align="center" />
            <el-table-column prop="diagnosis" label="诊断" min-width="170" show-overflow-tooltip />
            <el-table-column prop="histology" label="病理组织学" min-width="150" show-overflow-tooltip />
            <el-table-column prop="stage" label="AJCC 分期" width="150" show-overflow-tooltip />
            <el-table-column prop="status" label="随访状态" width="84" />
            <el-table-column prop="org" label="所属机构" width="110" show-overflow-tooltip />
            <template #empty>
              <span class="detail__empty">授权范围内无符合条件的患者</span>
            </template>
          </el-table>
        </div>
      </template>
    </el-dialog>

    <!-- 其他机构共享队列：只读摘要（不展示筛选规则与患者明细） -->
    <el-dialog
      v-model="otherOpen"
      :title="otherView ? otherView.name + ' · 共享摘要' : '共享队列摘要'"
      width="600px"
      append-to-body
    >
      <template v-if="otherView">
        <div class="cq-view__meta">
          <span class="cq-view__org">{{ otherView.org }}</span>
          <span class="cq-view__chip">{{ otherView.cohortType }}</span>
          <span class="cq-view__chip">{{ otherView.direction }}</span>
          <span>更新于 {{ otherView.updatedAt }}</span>
        </div>
        <p class="cq-view__purpose">{{ otherView.purpose || '—' }}</p>
        <div class="cq-view__block">
          <div class="cq-view__label">适用数据类型</div>
          <p class="cq-view__summary">{{ otherView.dataType || '—' }}</p>
        </div>
        <div class="cq-view__block">
          <div class="cq-view__label">共享说明</div>
          <p class="cq-view__summary">{{ otherView.shareNote || '—' }}</p>
        </div>
      </template>
      <template #footer>
        <el-button @click="otherOpen = false">关闭</el-button>
        <el-button type="primary" @click="applyOther">申请使用</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
/* ---------- 页面容器：白色大卡片，浮在背景图上，底部留出背景带 ---------- */
.cq {
  display: flex;
  flex-direction: column;
  height: calc(100% - 56px);
  min-height: 460px;
  padding: 14px 22px 12px;
  background: #FFFFFF;
  border-radius: 16px;
  box-shadow: 0 10px 30px rgba(26, 92, 80, 0.08);
}

/* ---------- 面板 ---------- */
.cq__panel {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  padding: 0;
  background: transparent;
}

/* ---------- 页签 + 新建 / 筛选行 / 表格 / 行操作 / 分页 统一定义在 src/styles/list-page.css（与科研队列页一致），本页直接复用 lp-* 类 ---------- */

/* ---------- 工作台 ---------- */
.wq {
  padding: 0 18px 18px;
  background: #fff;
  border: 1px solid var(--medical-color-border);
  border-radius: 12px;
  overflow: hidden;
}
.wq__top {
  margin: 0 -18px;
  padding: 11px 18px 12px;
  background: var(--medical-color-surface-secondary);
  border-bottom: 1px solid var(--medical-color-border);
}
.wq__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
}
.wq__id {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
  flex: 1;
}
.wq__namewrap {
  display: inline-grid;
  align-items: center;
  min-width: 0;
  max-width: 420px;
  margin-left: -6px;
}
.wq__namewrap > * {
  grid-area: 1 / 1;
}
.wq__namesize {
  padding: 2px 6px;
  font-size: 17px;
  font-weight: 600;
  line-height: 1.4;
  white-space: pre;
  visibility: hidden;
}
.wq__name {
  width: 0;
  min-width: 100%;
  padding: 2px 6px;
  font-family: inherit;
  font-size: 17px;
  font-weight: 600;
  line-height: 1.4;
  color: var(--medical-color-text-primary);
  background: transparent;
  border: 1px solid transparent;
  border-radius: 6px;
  outline: none;
  transition: border-color 0.15s, background 0.15s;
}
.wq__name:hover {
  border-color: var(--medical-color-border);
}
.wq__name:focus {
  border-color: var(--medical-color-primary);
  background: #fff;
}
.wq__name::placeholder {
  color: var(--medical-color-text-tertiary);
  font-weight: 500;
}
.wq__dirty {
  flex: none;
  padding: 1px 8px;
  border-radius: 4px;
  font-size: 11px;
  color: var(--medical-color-warning);
  background: rgba(245, 158, 11, 0.1);
}
.wq__ops {
  display: flex;
  align-items: center;
  gap: 2px;
  flex: none;
}
.wq__attrs {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 10px;
}
.wq__attr {
  width: 128px;
}
.wq__attr :deep(.el-select__wrapper) {
  min-height: 28px;
  background: #fff;
  font-size: 12.5px;
  box-shadow: 0 0 0 1px var(--medical-color-border) inset;
}

.wq__body {
  display: flex;
  align-items: stretch;
  gap: 16px;
  margin-top: 16px;
}
.rules {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

/* ---------- 条件组 ---------- */
.rgroup__head {
  display: flex;
  align-items: center;
  gap: 7px;
  margin-bottom: 7px;
}
.rgroup__dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
}
.rgroup__dot.is-in {
  background: var(--medical-color-success);
}
.rgroup__dot.is-ex {
  background: var(--medical-color-danger);
}
.rgroup__name {
  font-size: 12.5px;
  font-weight: 600;
  color: var(--medical-color-text-primary);
}
.rgroup__add {
  margin-left: auto;
  padding: 2px 6px;
  font-family: inherit;
  font-size: 12px;
  color: var(--medical-color-primary);
  background: transparent;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}
.rgroup__add:hover {
  background: rgba(14, 157, 138, 0.09);
}

.rgroup__rows {
  background: #fff;
  border: 1px solid var(--medical-color-border);
  border-radius: 8px;
  overflow: hidden;
}
.rgroup__empty {
  margin: 0;
  padding: 16px;
  text-align: center;
  font-size: 12px;
  color: var(--medical-color-text-tertiary);
}

.crow {
  display: grid;
  grid-template-columns: 26px 176px 84px minmax(200px, 360px) 1fr 44px 20px;
  align-items: center;
  gap: 8px;
  padding: 7px 10px;
  border-top: 1px solid var(--medical-color-border);
  transition: background 0.12s;
}
.crow > :nth-child(1) {
  grid-column: 1;
}
.crow > :nth-child(2) {
  grid-column: 2;
}
.crow > :nth-child(3) {
  grid-column: 3;
}
.crow > :nth-child(4) {
  grid-column: 4;
}
.crow > :nth-child(5) {
  grid-column: 6;
}
.crow > :nth-child(6) {
  grid-column: 7;
}
.crow:first-child {
  border-top: none;
}
.crow:hover {
  background: var(--medical-color-surface-secondary);
}
.crow :deep(.el-select),
.crow :deep(.el-input) {
  width: 100%;
}
.crow :deep(.el-input-number) {
  width: 100%;
}
.crow :deep(.el-select__wrapper),
.crow :deep(.el-input__wrapper) {
  min-height: 30px;
}
.crow__mark {
  width: 5px;
  height: 5px;
  margin-left: 8px;
  border-radius: 50%;
  background: var(--medical-color-border-strong);
}
.crow__logic {
  width: 24px;
  height: 20px;
  padding: 0;
  font-family: inherit;
  font-size: 11.5px;
  color: var(--medical-color-text-secondary);
  background: #fff;
  border: 1px solid var(--medical-color-border);
  border-radius: 4px;
  cursor: pointer;
}
.crow__logic:hover {
  color: var(--medical-color-primary);
  border-color: var(--medical-color-primary);
}
.crow__val {
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
}
.crow__val :deep(.el-input-number) {
  min-width: 0;
}
.crow__tilde {
  flex: none;
  font-size: 12px;
  color: var(--medical-color-text-tertiary);
}
.crow__unit {
  flex: none;
  font-size: 11.5px;
  color: var(--medical-color-text-tertiary);
}
.crow__hit {
  font-size: 11px;
  color: var(--medical-color-text-tertiary);
  text-align: right;
  white-space: nowrap;
  font-variant-numeric: tabular-nums;
}
.crow__del {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  padding: 0;
  font-size: 12px;
  color: var(--medical-color-text-tertiary);
  background: transparent;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  opacity: 0;
  transition: opacity 0.12s, color 0.12s;
}
.crow:hover .crow__del {
  opacity: 1;
}
.crow__del:hover {
  color: var(--medical-color-danger);
  background: rgba(239, 68, 68, 0.08);
}

/* ---------- 患者明细 ---------- */
.detail {
  margin-top: 16px;
}
.detail__head {
  display: flex;
  align-items: baseline;
  gap: 10px;
  margin-bottom: 8px;
}
.detail__title {
  font-size: 12.5px;
  font-weight: 600;
  color: var(--medical-color-text-primary);
}
.detail__count {
  font-size: 12px;
  color: var(--medical-color-text-tertiary);
}
.detail__empty {
  font-size: 12px;
  color: var(--medical-color-text-tertiary);
}
.detail :deep(.el-table__inner-wrapper::before) {
  display: none;
}
.detail :deep(.el-table th.el-table__cell) {
  height: 32px;
  padding: 0;
  font-size: 11.5px;
  font-weight: 500;
  color: var(--medical-color-text-secondary);
  background: var(--medical-color-surface-secondary);
}
.detail :deep(.el-table td.el-table__cell) {
  padding: 6px 0;
  font-size: 12px;
}
.detail :deep(.el-table .cell) {
  line-height: 1.5;
}

/* ---------- 查看弹窗（只读） ---------- */
.cq-view :deep(.el-dialog__body) {
  padding-top: 8px;
}
.cq-view__meta {
  display: flex;
  align-items: center;
  gap: 14px;
  flex-wrap: wrap;
  font-size: 12px;
  color: var(--medical-color-text-secondary);
}
.cq-view__meta b {
  color: var(--medical-color-primary);
  font-size: 14px;
}
.cq-view__org {
  padding: 1px 8px;
  font-size: 11px;
  color: var(--medical-color-primary);
  background: rgba(14, 157, 138, 0.10);
  border-radius: 4px;
}
.cq-view__chip {
  padding: 1px 8px;
  font-size: 11px;
  color: var(--medical-color-text-secondary);
  background: var(--medical-color-surface-secondary);
  border-radius: 4px;
}
.cq-view__purpose {
  margin: 8px 0 4px;
  font-size: 12.5px;
  line-height: 1.5;
  color: var(--medical-color-text-secondary);
}
.cq-view__block {
  margin-top: 12px;
}
.cq-view__label {
  margin-bottom: 6px;
  font-size: 12px;
  font-weight: 600;
  color: var(--medical-color-text-primary);
}
.cq-view__summary {
  margin: 0;
  padding: 10px 12px;
  font-size: 12px;
  line-height: 1.6;
  color: var(--medical-color-text-secondary);
  background: var(--medical-color-surface-secondary);
  border: 1px solid var(--medical-color-border);
  border-radius: 6px;
}
.cq-view .detail :deep(.el-table th.el-table__cell) {
  height: 32px;
  padding: 0;
  font-size: 11.5px;
  font-weight: 500;
  color: var(--medical-color-text-secondary);
  background: var(--medical-color-surface-secondary);
}
.cq-view .detail :deep(.el-table td.el-table__cell) {
  padding: 6px 0;
  font-size: 12px;
}

/* ---------- 响应式 ---------- */
@media (max-width: 1024px) {
  .cq__search {
    width: 200px;
  }
}
@media (max-width: 720px) {
  .cq__panel {
    padding: 14px 12px 8px;
  }
  .cq__search {
    width: calc(50% - 4px);
  }
}
</style>
