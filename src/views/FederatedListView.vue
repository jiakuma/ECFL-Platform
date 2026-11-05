<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { Plus, Search } from '@element-plus/icons-vue'
import { useFederatedStore, TASK_STATUS_OPTIONS, type FederatedTask, type TaskStatus } from '@/store/federated'
import { useOrgStore } from '@/store/org'
import { StatusBadge, ListView } from '@/components/common'

/** 联邦任务状态 → 语义色（统一，不再使用各页面独立的状态色映射） */
const taskStatusType: Record<TaskStatus, 'pending' | 'danger' | 'processing' | 'success' | 'disabled'> = {
  待审批: 'pending',
  审批未通过: 'danger',
  待确认: 'processing',
  待执行: 'processing',
  训练中: 'processing',
  已完成: 'success',
  失败: 'disabled',
}

const router = useRouter()
const store = useFederatedStore()
const orgStore = useOrgStore()
onMounted(() => store.ensureSeed())

/** 应用端当前机构（顶部机构切换器控制），本机构既可能是牵头方也可能是参与方 */
const currentOrg = computed(() => orgStore.appCurrent)

const keyword = ref('')
const statusFilter = ref<TaskStatus | ''>('')

const involved = computed(() => store.involving(currentOrg.value))

const list = computed(() =>
  involved.value
    .filter((t) => (statusFilter.value ? t.status === statusFilter.value : true))
    .filter((t) => (keyword.value ? t.name.includes(keyword.value) : true)),
)

const total = computed(() => involved.value.length)
const leadCount = computed(() => involved.value.filter((t) => t.leaderOrg === currentOrg.value).length)

/* ---------- 分页 ---------- */
const page = ref(1)
const pageSize = ref(10)
const paged = computed(() =>
  list.value.slice((page.value - 1) * pageSize.value, page.value * pageSize.value),
)
watch([list], () => {
  page.value = 1
})
function onSizeChange(v: number) {
  pageSize.value = v
  page.value = 1
}

function isLeader(leaderOrg: string) {
  return leaderOrg === currentOrg.value
}
/** 本机构在该任务上的待办（牵头方确认发起 / 参与方确认训练请求、配置训练） */
function todoOf(row: FederatedTask): { label: string; color: string } | null {
  if (isLeader(row.leaderOrg)) {
    return row.status === '待确认' ? { label: '待确认发起', color: '#3b82f6' } : null
  }
  const p = row.participants.find((x) => x.org === currentOrg.value)
  if (!p || p.approval !== 'approved') return null
  if (p.trainStatus === '准备中') return { label: '待配置训练', color: '#0ea5e9' }
  if (p.trainStatus === '未开始' && (row.status === '待执行' || row.status === '训练中'))
    return { label: '训练请求待确认', color: '#f43f5e' }
  return null
}
function goDetail(id: string) {
  router.push(`/federated/${id}`)
}
function goCreate() {
  router.push('/federated/create')
}
function reset() {
  keyword.value = ''
  statusFilter.value = ''
}
</script>

<template>
  <ListView
    new-label="新建任务"
    :page="page"
    :page-size="pageSize"
    :total="list.length"
    @new="goCreate"
    @update:page="page = $event"
    @update:page-size="onSizeChange"
  >
    <template #filter>
      <el-input
        v-model="keyword"
        placeholder="搜索任务名称"
        clearable
        :prefix-icon="Search"
        class="lp__search"
      />
      <el-select v-model="statusFilter" placeholder="全部状态" clearable class="lp__sel">
        <el-option v-for="s in TASK_STATUS_OPTIONS" :key="s" :label="s" :value="s" />
      </el-select>
      <button v-if="keyword || statusFilter" type="button" class="lp__reset" @click="reset">重置</button>
    </template>

    <el-table
      :data="paged"
      row-key="id"
      class="lp__table"
      empty-text="本机构暂无联邦任务"
    >
      <el-table-column label="任务名称" min-width="200">
        <template #default="{ row }">
          <button type="button" class="lp__name" @click="goDetail(row.id)">{{ row.name }}</button>
        </template>
      </el-table-column>
      <el-table-column prop="id" label="任务编号" width="140" />
      <el-table-column label="参与机构" min-width="200">
        <template #default="{ row }">
          <span v-for="(p, i) in row.participants" :key="p.org" class="fl__org">
            {{ p.org }}<i v-if="i < row.participants.length - 1">、</i>
          </span>
        </template>
      </el-table-column>
      <el-table-column label="我的角色" width="100">
        <template #default="{ row }">
          <span class="fl__role" :class="isLeader(row.leaderOrg) ? 'fl__role--lead' : 'fl__role--join'">
            {{ isLeader(row.leaderOrg) ? '牵头' : '参与' }}
          </span>
        </template>
      </el-table-column>
      <el-table-column label="当前状态" width="110">
        <template #default="{ row }">
          <StatusBadge :type="taskStatusType[row.status as TaskStatus]" :text="row.status" />
        </template>
      </el-table-column>
      <el-table-column label="我的待办" width="140">
        <template #default="{ row }">
          <button
            v-if="todoOf(row)"
            type="button"
            class="fl__todo"
            :style="{ color: todoOf(row)!.color }"
            @click="goDetail(row.id)"
          >
            {{ todoOf(row)!.label }}
          </button>
          <span v-else class="fl__none">—</span>
        </template>
      </el-table-column>
      <el-table-column prop="updatedAt" label="更新时间" width="160" />
      <el-table-column label="操作" width="90" fixed="right">
        <template #default="{ row }">
          <div class="lp__ops">
            <button type="button" class="lp__ops-link" @click="goDetail(row.id)">查看</button>
          </div>
        </template>
      </el-table-column>
    </el-table>
  </ListView>
</template>

<style scoped>
/* ---------- 仅保留本页特有的状态/角色样式，其余统一走 ListView + list-page.css ---------- */
.fl__org {
  font-size: 12.5px;
  color: var(--medical-color-text-secondary);
}
.fl__org i {
  color: var(--medical-color-text-tertiary);
  font-style: normal;
}
.fl__role {
  display: inline-block;
  padding: 1px 8px;
  font-size: 12px;
  font-weight: 600;
  border-radius: 4px;
  border: 1px solid transparent;
}
.fl__role--lead {
  color: var(--medical-color-primary);
  border-color: color-mix(in srgb, var(--medical-color-primary) 32%, transparent);
  background: color-mix(in srgb, var(--medical-color-primary) 8%, transparent);
}
.fl__role--join {
  color: var(--medical-color-text-secondary);
  border-color: var(--medical-color-border-strong);
  background: var(--medical-color-surface-secondary);
}
.fl__todo {
  font-size: 12.5px;
  font-weight: 600;
  background: transparent;
  border: none;
  cursor: pointer;
}
.fl__todo:hover {
  text-decoration: underline;
}
.fl__none {
  color: var(--medical-color-text-tertiary);
}
</style>
