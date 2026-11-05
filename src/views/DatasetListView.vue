<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Search, MoreFilled } from '@element-plus/icons-vue'
import { useDatasetStore, type Dataset } from '@/store/dataset'
import { useCohortStore } from '@/store/cohort'
import { useOrgStore } from '@/store/org'
import { StatusBadge, ListView } from '@/components/common'

const router = useRouter()
const store = useDatasetStore()
const cohortStore = useCohortStore()
const orgStore = useOrgStore()

const currentOrg = computed(() => orgStore.selected || orgStore.allowedOrgs[0])

onMounted(() => store.ensureSeed())

/* ---------- 范围页签：本机构 / 其他机构共享 ---------- */
const scope = ref<'self' | 'shared'>('self')

const sourceList = computed(() =>
  scope.value === 'self' ? store.own : store.sharedFromOthers,
)

/* ---------- 筛选 ---------- */
const kw = ref('')
const cohortFilter = ref('')
const typeFilter = ref('')
const taskFilter = ref('')
const statusFilter = ref('')

const cohortOptions = computed(() => {
  const all = scope.value === 'self'
    ? cohortStore.list.filter((c) => c.org === currentOrg.value)
    : cohortStore.list
  return all.map((c) => ({ id: c.id, name: c.name }))
})
const typeOptions = computed(() => [...new Set(sourceList.value.map((d) => d.dataType))])
const taskOptions: Dataset['taskType'][] = ['分类', '回归', '无监督']
const statusOptions: Dataset['status'][] = ['可用于训练', '待完善', '不可用']

const list = computed(() =>
  sourceList.value.filter((d) => {
    if (kw.value && !`${d.name}${d.id}`.includes(kw.value)) return false
    if (cohortFilter.value && d.cohortId !== cohortFilter.value) return false
    if (typeFilter.value && d.dataType !== typeFilter.value) return false
    if (taskFilter.value && d.taskType !== taskFilter.value) return false
    if (statusFilter.value && d.status !== statusFilter.value) return false
    return true
  }),
)

const hasFilter = computed(
  () => !!(kw.value || cohortFilter.value || typeFilter.value || taskFilter.value || statusFilter.value),
)

function resetFilter() {
  kw.value = ''
  cohortFilter.value = ''
  typeFilter.value = ''
  taskFilter.value = ''
  statusFilter.value = ''
}

/* ---------- 分页 ---------- */
const page = ref(1)
const pageSize = ref(10)
const paged = computed(() =>
  list.value.slice((page.value - 1) * pageSize.value, page.value * pageSize.value),
)
watch([list, scope], () => {
  page.value = 1
})
function onSizeChange(v: number) {
  pageSize.value = v
  page.value = 1
}
function onScopeChange(v: 'self' | 'shared') {
  if (scope.value === v) return
  scope.value = v
  cohortFilter.value = ''
  typeFilter.value = ''
  taskFilter.value = ''
  statusFilter.value = ''
}

/* ---------- 状态语义色 ---------- */
const datasetStatusType: Record<Dataset['status'], 'success' | 'pending' | 'danger'> = {
  可用于训练: 'success',
  待完善: 'pending',
  不可用: 'danger',
}

/* ---------- 展示辅助 ---------- */
const num = (n: number) => n.toLocaleString('zh-CN')
const dateOf = (s: string) => (s ? s.split(' ')[0] : '—')
const versionOf = (n: number) => `V${n}.0`
/** 特征数：只统计特征字段，标签不计入 */
const featureCount = (d: Dataset) => d.fields.filter((f) => f.role === 'feature').length

/* ---------- 操作 ---------- */
function goDetail(id: string) {
  router.push(`/dataset/research-datasets/${id}`)
}
function goEdit(id: string) {
  router.push(`/dataset/research-datasets/${id}/edit`)
}
function goCreate() {
  router.push('/dataset/research-datasets/new')
}
function goTask(d: Dataset) {
  router.push({ path: '/federated/create', query: { dataset: d.id } })
}

function duplicate(d: Dataset) {
  const item = store.duplicate(d.id)
  if (item) ElMessage.success(`已复制为「${item.name}」`)
}

async function remove(d: Dataset) {
  if (d.referencedBy.length) {
    ElMessage.warning(`该数据集已被联邦任务 ${d.referencedBy.join('、')} 引用，不能删除`)
    return
  }
  try {
    await ElMessageBox.confirm(
      `确定删除数据集「${d.name}」吗？该操作只删除配置，不删除任何患者原始数据。`,
      '删除确认',
      { confirmButtonText: '删除', cancelButtonText: '取消', type: 'warning' },
    )
  } catch {
    return
  }
  const res = store.remove(d.id)
  if (res.ok) ElMessage.success('数据集已删除')
  else ElMessage.warning(res.reason || '删除失败')
}

/* 行内「更多」菜单 */
function onDsCmd(cmd: string, d: Dataset) {
  if (cmd === 'edit') goEdit(d.id)
  else if (cmd === 'task') goTask(d)
  else if (cmd === 'dup') duplicate(d)
  else if (cmd === 'del') remove(d)
}
</script>

<template>
  <ListView
    :new-label="scope === 'self' ? '新建数据集' : ''"
    :page="page"
    :page-size="pageSize"
    :total="list.length"
    @new="goCreate"
    @update:page="page = $event"
    @update:page-size="onSizeChange"
  >
    <template #tabs>
      <div class="lp__tabs">
        <button
          type="button"
          class="lp__tab"
          :class="{ 'is-on': scope === 'self' }"
          @click="onScopeChange('self')"
        >
          本机构数据集
        </button>
        <button
          type="button"
          class="lp__tab"
          :class="{ 'is-on': scope === 'shared' }"
          @click="onScopeChange('shared')"
        >
          共享数据集
        </button>
      </div>
    </template>

    <template #filter>
      <el-input
        v-model="kw"
        placeholder="搜索数据集名称 / 编号"
        clearable
        :prefix-icon="Search"
        class="lp__search"
      />
      <el-select v-model="cohortFilter" placeholder="来源队列" clearable class="lp__sel">
        <el-option v-for="c in cohortOptions" :key="c.id" :label="c.name" :value="c.id" />
      </el-select>
      <el-select v-model="typeFilter" placeholder="数据类型" clearable class="lp__sel">
        <el-option v-for="t in typeOptions" :key="t" :label="t" :value="t" />
      </el-select>
      <el-select v-model="taskFilter" placeholder="任务类型" clearable class="lp__sel">
        <el-option v-for="t in taskOptions" :key="t" :label="t" :value="t" />
      </el-select>
      <el-select v-model="statusFilter" placeholder="状态" clearable class="lp__sel">
        <el-option v-for="s in statusOptions" :key="s" :label="s" :value="s" />
      </el-select>
      <button v-if="hasFilter" type="button" class="lp__reset" @click="resetFilter">重置</button>
    </template>

    <el-table
      :data="paged"
      row-key="id"
      class="lp__table"
      :empty-text="hasFilter ? '没有符合筛选条件的数据集' : '暂无数据集'"
    >
      <el-table-column label="数据集名称" min-width="220" show-overflow-tooltip>
        <template #default="{ row }">
          <button type="button" class="lp__name" @click="goDetail(row.id)">{{ row.name }}</button>
        </template>
      </el-table-column>

      <el-table-column prop="id" label="编号" min-width="92" />

      <el-table-column
        v-if="scope === 'self'"
        prop="cohortName"
        label="来源队列"
        min-width="180"
        show-overflow-tooltip
      />

      <el-table-column v-if="scope === 'shared'" prop="org" label="归属机构" min-width="150" show-overflow-tooltip />

      <el-table-column label="样本数" min-width="88">
        <template #default="{ row }">{{ num(row.sampleCount) }}</template>
      </el-table-column>

      <el-table-column label="特征数" min-width="80">
        <template #default="{ row }">{{ featureCount(row) }}</template>
      </el-table-column>

      <el-table-column label="版本" min-width="76">
        <template #default="{ row }">{{ versionOf(row.version) }}</template>
      </el-table-column>

      <el-table-column label="状态" min-width="104">
        <template #default="{ row }">
          <StatusBadge :type="datasetStatusType[row.status as Dataset['status']]" :text="row.status" />
        </template>
      </el-table-column>

      <el-table-column label="更新时间" min-width="112">
        <template #default="{ row }">{{ dateOf(row.updatedAt) }}</template>
      </el-table-column>

      <el-table-column label="操作" min-width="104">
        <template #default="{ row }">
          <div class="lp__ops">
            <button type="button" class="lp__ops-link" @click="goDetail(row.id)">查看</button>
            <el-dropdown
              v-if="scope === 'self'"
              trigger="click"
              placement="bottom-end"
              @command="(cmd: string) => onDsCmd(cmd, row)"
            >
              <button type="button" class="lp__ops-more" aria-label="更多操作">
                <el-icon><MoreFilled /></el-icon>
              </button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item command="edit">编辑</el-dropdown-item>
                  <el-dropdown-item command="task">创建训练任务</el-dropdown-item>
                  <el-dropdown-item command="dup">复制</el-dropdown-item>
                  <el-dropdown-item command="del" divided>删除</el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </div>
        </template>
      </el-table-column>
    </el-table>
  </ListView>
</template>
