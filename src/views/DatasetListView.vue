<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, ArrowDown } from '@element-plus/icons-vue'
import { useDatasetStore, type Dataset } from '@/store/dataset'
import { useCohortStore } from '@/store/cohort'
import { useOrgStore } from '@/store/org'

const router = useRouter()
const store = useDatasetStore()
const cohortStore = useCohortStore()
const orgStore = useOrgStore()

const currentOrg = computed(() => orgStore.selected || orgStore.allowedOrgs[0])

onMounted(() => store.ensureSeed())

/* ---------- 筛选 ---------- */
const kw = ref('')
const cohortFilter = ref('')
const typeFilter = ref('')
const statusFilter = ref('')

const cohortOptions = computed(() =>
  cohortStore.list.filter((c) => c.org === currentOrg.value).map((c) => ({ id: c.id, name: c.name })),
)
const typeOptions = computed(() => [...new Set(store.own.map((d) => d.dataType))])
const statusOptions: Dataset['status'][] = ['可用于训练', '待完善', '不可用']

const list = computed(() =>
  store.own.filter((d) => {
    if (kw.value && !`${d.name}${d.id}`.includes(kw.value)) return false
    if (cohortFilter.value && d.cohortId !== cohortFilter.value) return false
    if (typeFilter.value && d.dataType !== typeFilter.value) return false
    if (statusFilter.value && d.status !== statusFilter.value) return false
    return true
  }),
)

function resetFilter() {
  kw.value = ''
  cohortFilter.value = ''
  typeFilter.value = ''
  statusFilter.value = ''
}

/* ---------- 状态配色 ---------- */
const statusColor: Record<Dataset['status'], string> = {
  可用于训练: '#10b981',
  待完善: '#f59e0b',
  不可用: '#f43f5e',
}
const taskColor: Record<string, string> = { 分类: '#2563eb', 回归: '#8b5cf6', 无监督: '#64748b' }

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

/* 卡片底部：任务关联状态文案 */
function referencedText(d: Dataset): string {
  return d.referencedBy.length ? `已关联 ${d.referencedBy.length} 个任务` : '未关联任务'
}

/* 卡片「更多」菜单：复制 / 删除 */
function onDsCmd(cmd: string, d: Dataset) {
  if (cmd === 'dup') duplicate(d)
  else if (cmd === 'del') remove(d)
}
</script>

<template>
  <div class="ds">
    <div class="ds__head">
      <h1 class="ds__title">科研数据集</h1>
      <el-button type="primary" size="small" :icon="Plus" @click="goCreate">新建数据集</el-button>
    </div>

    <div class="ds__filter">
      <el-input v-model="kw" placeholder="搜索数据集名称 / 编号" clearable class="ds__f-kw" />
      <el-select v-model="cohortFilter" placeholder="来源队列" clearable class="ds__f">
        <el-option v-for="c in cohortOptions" :key="c.id" :label="c.name" :value="c.id" />
      </el-select>
      <el-select v-model="typeFilter" placeholder="数据类型" clearable class="ds__f">
        <el-option v-for="t in typeOptions" :key="t" :label="t" :value="t" />
      </el-select>
      <el-select v-model="statusFilter" placeholder="训练状态" clearable class="ds__f">
        <el-option v-for="s in statusOptions" :key="s" :label="s" :value="s" />
      </el-select>
      <el-button size="small" @click="resetFilter">重置</el-button>
    </div>

    <div class="ds__meta">
      本机构 · {{ currentOrg }} · 共 {{ list.length }} 个数据集
    </div>

    <div v-if="list.length" class="ds__grid">
      <article v-for="d in list" :key="d.id" class="qcard" @click="goDetail(d.id)">
        <header class="qcard__top">
          <span
            class="qcard__tag"
            :style="{ color: taskColor[d.taskType], borderColor: taskColor[d.taskType], background: taskColor[d.taskType] + '12' }"
          >
            <i class="qcard__tagdot" />{{ d.taskType }}
          </span>
          <span class="qcard__status" :style="{ color: statusColor[d.status] }">
            <i class="qcard__dot" />{{ d.status }}
          </span>
        </header>

        <h3 class="qcard__title" :title="d.name">{{ d.name }}</h3>

        <div class="qcard__meta">
          <span class="qcard__id">{{ d.id }}</span>
          <span class="qcard__org" :title="d.cohortName || '—'">{{ d.cohortName || '—' }}</span>
        </div>

        <p class="qcard__sub">
          <span>{{ d.sampleCount }} 例样本</span>
          <span class="ds__sep">·</span>
          <span>{{ d.fields.length }} 个字段</span>
        </p>

        <div class="qcard__ops" @click.stop>
          <button type="button" @click="goDetail(d.id)">查看</button>
          <button type="button" @click="goEdit(d.id)">编辑</button>
          <el-dropdown trigger="click" @command="(cmd: string) => onDsCmd(cmd, d)">
            <button type="button" class="qcard__more">更多<el-icon><ArrowDown /></el-icon></button>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="dup">复制</el-dropdown-item>
                <el-dropdown-item command="del" divided>删除</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>

        <div class="qcard__foot" @click.stop>
          <span class="qcard__date">{{ referencedText(d) }}</span>
          <el-button type="primary" size="small" @click="goTask(d)">创建训练任务</el-button>
        </div>
      </article>
    </div>

    <div v-else class="ds__empty">
      <span>暂无符合条件的科研数据集</span>
      <el-button type="primary" size="small" @click="goCreate">新建数据集</el-button>
    </div>
  </div>
</template>

<style scoped>
.ds__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 14px;
}
.ds__title {
  position: relative;
  font-size: 18px;
  font-weight: 700;
  letter-spacing: 0.03em;
  padding-left: 12px;
  margin: 0;
  color: var(--pf-text);
}
.ds__title::before {
  content: '';
  position: absolute;
  left: 0;
  top: 2px;
  bottom: 2px;
  width: 3px;
  border-radius: 2px;
  background: var(--pf-primary);
}
.ds__filter {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
  padding: 12px 14px;
  margin-bottom: 12px;
  background: var(--pf-surface);
  border: 1px solid var(--pf-border);
  border-radius: 12px;
}
.ds__f-kw {
  flex: 1 1 240px;
  max-width: 320px;
}
.ds__f {
  width: 168px;
}
.ds__meta {
  margin-bottom: 12px;
  font-size: 12.5px;
  color: var(--pf-text-faint);
}

/* 卡片：与「多模态资源」/「科研队列」同一套规格 */
.ds__grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 14px;
}
.qcard {
  display: flex;
  flex-direction: column;
  background: var(--pf-surface);
  border: 1px solid var(--pf-border);
  border-radius: 12px;
  padding: 14px 16px;
  cursor: pointer;
  transition: border-color 0.2s ease, box-shadow 0.2s ease, transform 0.2s ease;
}
.qcard:hover {
  border-color: var(--pf-border-strong);
  box-shadow: var(--pf-shadow-sm);
  transform: translateY(-2px);
}
.qcard__top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 12px;
}
.qcard__tag {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  font-weight: 700;
  padding: 3px 9px;
  border-radius: 999px;
  border: 1px solid;
}
.qcard__tagdot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: currentColor;
}
.qcard__status {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 12px;
  font-weight: 600;
}
.qcard__dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: currentColor;
}
.qcard__title {
  font-size: 15px;
  font-weight: 700;
  line-height: 1.4;
  margin: 0 0 12px;
  color: var(--pf-text);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.qcard__meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  font-size: 13px;
  color: var(--pf-text-soft);
  margin-bottom: 6px;
}
.qcard__org {
  max-width: 60%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.qcard__id {
  font-variant-numeric: tabular-nums;
  color: var(--pf-text-faint);
}
.qcard__sub {
  margin: 2px 0 10px;
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: var(--pf-text-soft);
}
.ds__sep {
  opacity: 0.6;
}
.qcard__date {
  font-size: 12px;
  color: var(--pf-text-faint);
}
.qcard__ops {
  display: flex;
  align-items: center;
  gap: 2px;
  margin-top: auto;
  padding-top: 10px;
  border-top: 1px solid var(--pf-border);
}
.qcard__ops button {
  padding: 2px 7px;
  font-family: inherit;
  font-size: 12px;
  color: var(--pf-text-soft);
  background: transparent;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: color 0.14s, background 0.14s;
}
.qcard__ops button:hover {
  color: var(--pf-primary);
  background: var(--pf-bg-soft);
}
.qcard__more {
  display: inline-flex;
  align-items: center;
  gap: 2px;
}
.qcard__foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-top: 8px;
}

.ds__empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 56px 0;
  background: var(--pf-surface);
  border: 1px dashed var(--pf-border-strong);
  border-radius: 12px;
  color: var(--pf-text-faint);
  font-size: 13px;
}
</style>
