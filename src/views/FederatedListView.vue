<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { Plus } from '@element-plus/icons-vue'
import { useFederatedStore, STATUS_COLOR, TASK_STATUS_OPTIONS, type FederatedTask, type TaskStatus } from '@/store/federated'
import { useOrgStore } from '@/store/org'

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
  <div class="fl">
    <div class="fl__head">
      <h1 class="fl__title">联邦任务中心</h1>
      <span class="fl__sub">
        当前机构：{{ currentOrg }} · 我牵头 {{ leadCount }} 个 / 我参与 {{ total - leadCount }} 个
      </span>
      <el-button type="primary" :icon="Plus" size="small" class="fl__new" @click="goCreate">新建任务</el-button>
    </div>

    <div class="fl__f">
      <el-input v-model="keyword" placeholder="搜索任务名称" clearable size="small" style="width: 200px" />
      <el-select v-model="statusFilter" placeholder="全部状态" clearable size="small" style="width: 140px">
        <el-option v-for="s in TASK_STATUS_OPTIONS" :key="s" :label="s" :value="s" />
      </el-select>
      <el-button size="small" @click="reset">重置</el-button>
    </div>

    <el-table :data="list" class="fl__table" row-key="id" empty-text="本机构暂无联邦任务">
      <el-table-column label="任务名称" min-width="200">
        <template #default="{ row }">
          <a class="fl__name" @click="goDetail(row.id)">{{ row.name }}</a>
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
          <span class="role" :class="isLeader(row.leaderOrg) ? 'role--lead' : 'role--join'">
            {{ isLeader(row.leaderOrg) ? '牵头' : '参与' }}
          </span>
        </template>
      </el-table-column>
      <el-table-column label="当前状态" width="110">
        <template #default="{ row }">
          <span class="tag" :style="{ color: STATUS_COLOR[row.status as TaskStatus], background: STATUS_COLOR[row.status as TaskStatus] + '14' }">
            {{ row.status }}
          </span>
        </template>
      </el-table-column>
      <el-table-column label="我的待办" width="140">
        <template #default="{ row }">
          <a v-if="todoOf(row)" class="fl__todo" :style="{ color: todoOf(row)!.color }" @click="goDetail(row.id)">
            {{ todoOf(row)!.label }}
          </a>
          <span v-else class="fl__none">—</span>
        </template>
      </el-table-column>
      <el-table-column prop="updatedAt" label="更新时间" width="160" />
      <el-table-column label="操作" width="90" fixed="right">
        <template #default="{ row }">
          <el-button text size="small" type="primary" @click="goDetail(row.id)">查看</el-button>
        </template>
      </el-table-column>
    </el-table>
  </div>
</template>

<style scoped>
.fl {
  padding: 4px 2px;
}
.fl__head {
  display: flex;
  align-items: baseline;
  gap: 12px;
  margin-bottom: 14px;
}
.fl__title {
  position: relative;
  font-size: 18px;
  font-weight: 700;
  letter-spacing: 0.03em;
  padding-left: 12px;
  margin: 0;
  color: var(--pf-text);
}
.fl__title::before {
  content: '';
  position: absolute;
  left: 0;
  top: 2px;
  bottom: 2px;
  width: 3px;
  border-radius: 2px;
  background: var(--pf-primary);
}
.fl__sub {
  font-size: 12.5px;
  color: var(--pf-text-faint);
}
.fl__new {
  margin-left: auto;
}
.fl__f {
  display: flex;
  gap: 10px;
  margin-bottom: 12px;
}
.fl__table {
  background: var(--pf-surface);
  border: 1px solid var(--pf-border);
  border-radius: 12px;
  overflow: hidden;
}
.fl__name {
  color: var(--pf-primary);
  cursor: pointer;
}
.fl__name:hover {
  text-decoration: underline;
}
.fl__org {
  font-size: 12.5px;
  color: var(--pf-text-soft);
}
.fl__org i {
  color: var(--pf-text-faint);
  font-style: normal;
}
.tag {
  display: inline-block;
  padding: 1px 9px;
  font-size: 12px;
  font-weight: 600;
  border-radius: 999px;
}
.role {
  display: inline-block;
  padding: 1px 8px;
  font-size: 12px;
  font-weight: 600;
  border-radius: 4px;
  border: 1px solid transparent;
}
.role--lead {
  color: var(--pf-primary);
  border-color: color-mix(in srgb, var(--pf-primary) 32%, transparent);
  background: color-mix(in srgb, var(--pf-primary) 8%, transparent);
}
.role--join {
  color: var(--pf-text-soft);
  border-color: var(--pf-border-strong);
  background: var(--pf-surface-2);
}
.fl__todo {
  font-size: 12.5px;
  font-weight: 600;
  cursor: pointer;
}
.fl__todo:hover {
  text-decoration: underline;
}
.fl__none {
  color: var(--pf-text-faint);
}
</style>
