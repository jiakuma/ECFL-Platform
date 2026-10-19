<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useFederatedStore, STATUS_COLOR, type ApprovalState, type TaskStatus } from '@/store/federated'
import { useOrgStore } from '@/store/org'
import { orgNames } from '@/mock/organizations'

const router = useRouter()
const store = useFederatedStore()
const org = useOrgStore()
onMounted(() => store.ensureSeed())

const actingOrg = ref(org.selected || '')
watch(
  () => org.selected,
  (v) => {
    actingOrg.value = v || ''
  },
)

const statusFilter = ref<'all' | ApprovalState>('all')

const allTasks = computed(() =>
  actingOrg.value ? store.asParticipant(actingOrg.value) : store.list,
)

const list = computed(() =>
  allTasks.value
    .filter((t) => {
      if (statusFilter.value === 'all' || !actingOrg.value) return true
      const my = t.participants.find((p) => p.org === actingOrg.value)
      return my?.approval === statusFilter.value
    })
    .map((t) => {
      const my = t.participants.find((p) => p.org === actingOrg.value)
      return {
        ...t,
        myApproval: (my?.approval ?? 'pending') as ApprovalState,
        myTrain: my?.trainStatus ?? '',
      }
    }),
)

function orgChange(cmd: string) {
  if (cmd === '__none__') org.select(null)
  else org.select(cmd)
}

const approvalLabel: Record<ApprovalState, string> = { pending: '待我审批', approved: '已通过', rejected: '未通过' }
const approvalColor: Record<ApprovalState, string> = { pending: '#f59e0b', approved: '#10b981', rejected: '#f43f5e' }

function goDetail(id: string) {
  router.push(`/admin/approval/${id}`)
}
function reset() {
  statusFilter.value = 'all'
}
</script>

<template>
  <div class="al">
    <div class="al__head">
      <h1 class="al__title">审批管理</h1>
      <el-dropdown trigger="click" @command="orgChange">
        <span class="al__org">
          {{ actingOrg || '平台管理员（全部机构）' }}<el-icon size="12"><ArrowDown /></el-icon>
        </span>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item command="__none__">平台管理员（全部机构）</el-dropdown-item>
            <el-dropdown-item v-for="o in orgNames" :key="o" :command="o" divided>{{ o }}</el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
    </div>

    <div v-if="!actingOrg" class="al__tip">
      平台管理员视图：展示全部机构的联邦任务审批概览。切换至具体机构可处理本机构审批。
    </div>

    <div class="al__f">
      <el-select v-model="statusFilter" size="small" style="width: 150px">
        <el-option label="全部" value="all" />
        <el-option label="待我审批" value="pending" />
        <el-option label="已通过" value="approved" />
        <el-option label="未通过" value="rejected" />
      </el-select>
      <el-button size="small" @click="reset">重置</el-button>
    </div>

    <el-table :data="list" class="al__table" row-key="id" empty-text="暂无审批事项">
      <el-table-column label="任务名称" min-width="200">
        <template #default="{ row }">
          <a class="al__name" @click="goDetail(row.id)">{{ row.name }}</a>
        </template>
      </el-table-column>
      <el-table-column prop="id" label="任务编号" width="140" />
      <el-table-column prop="leaderOrg" label="牵头机构" width="140" />
      <el-table-column prop="createdAt" label="提交时间" width="160" />
      <el-table-column label="本机构审批" width="110">
        <template #default="{ row }">
          <span class="tag" :style="{ color: approvalColor[row.myApproval as ApprovalState], background: approvalColor[row.myApproval as ApprovalState] + '14' }">
            {{ actingOrg ? approvalLabel[row.myApproval as ApprovalState] : (row.status as TaskStatus) }}
          </span>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="90" fixed="right">
        <template #default="{ row }">
          <el-button text size="small" type="primary" @click="goDetail(row.id)">
            {{ actingOrg && row.myApproval === 'pending' ? '审批' : '查看' }}
          </el-button>
        </template>
      </el-table-column>
    </el-table>
  </div>
</template>

<style scoped>
.al {
  padding: 4px 2px;
}
.al__head {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-bottom: 14px;
}
.al__title {
  position: relative;
  font-size: 18px;
  font-weight: 700;
  letter-spacing: 0.03em;
  padding-left: 12px;
  margin: 0;
  color: var(--pf-text);
}
.al__title::before {
  content: '';
  position: absolute;
  left: 0;
  top: 2px;
  bottom: 2px;
  width: 3px;
  border-radius: 2px;
  background: var(--pf-primary);
}
.al__org {
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
.al__tip {
  font-size: 12.5px;
  color: var(--pf-text-faint);
  padding: 10px 14px;
  background: var(--pf-bg-soft);
  border-radius: 10px;
  margin-bottom: 12px;
}
.al__f {
  display: flex;
  gap: 10px;
  margin-bottom: 12px;
}
.al__table {
  background: var(--pf-surface);
  border: 1px solid var(--pf-border);
  border-radius: 12px;
  overflow: hidden;
}
.al__name {
  color: var(--pf-primary);
  cursor: pointer;
}
.al__name:hover {
  text-decoration: underline;
}
.tag {
  display: inline-block;
  padding: 1px 9px;
  font-size: 12px;
  font-weight: 600;
  border-radius: 999px;
  white-space: nowrap;
}
</style>
