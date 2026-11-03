<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, ArrowDown, Search } from '@element-plus/icons-vue'
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

const hasFilter = computed(() => !!(kw.value || cohortFilter.value || typeFilter.value || statusFilter.value))
const totalCount = computed(() => store.own.length)
const trainableCount = computed(() => list.value.filter((d) => d.status === '可用于训练').length)

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
const typeColor = (t: string) => taskColor[t] || '#64748b'

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

/* 行内「更多」菜单：复制 / 删除 */
function onDsCmd(cmd: string, d: Dataset) {
  if (cmd === 'dup') duplicate(d)
  else if (cmd === 'del') remove(d)
}
</script>

<template>
  <div class="ds">
    <!-- 页头 -->
    <header class="ds__head">
      <div class="ds__headline">
        <h1 class="ds__title">科研数据集</h1>
        <p class="ds__crumb">
          <span>本机构 · {{ currentOrg }}</span>
          <span class="ds__crumbsep" />
          <span>共 <b>{{ totalCount }}</b> 个数据集</span>
          <template v-if="hasFilter">
            <span class="ds__crumbsep" />
            <span>筛选出 <b>{{ list.length }}</b> 个</span>
          </template>
          <span v-else-if="trainableCount" class="ds__ok">其中 {{ trainableCount }} 个可用于训练</span>
        </p>
      </div>
      <el-button type="primary" :icon="Plus" @click="goCreate">新建数据集</el-button>
    </header>

    <!-- 筛选工具栏 -->
    <div class="ds__toolbar">
      <el-input
        v-model="kw"
        placeholder="搜索数据集名称 / 编号"
        clearable
        :prefix-icon="Search"
        class="ds__search"
      />
      <span class="ds__vline" />
      <el-select v-model="cohortFilter" placeholder="来源队列" clearable class="ds__select">
        <el-option v-for="c in cohortOptions" :key="c.id" :label="c.name" :value="c.id" />
      </el-select>
      <el-select v-model="typeFilter" placeholder="数据类型" clearable class="ds__select">
        <el-option v-for="t in typeOptions" :key="t" :label="t" :value="t" />
      </el-select>
      <el-select v-model="statusFilter" placeholder="训练状态" clearable class="ds__select">
        <el-option v-for="s in statusOptions" :key="s" :label="s" :value="s" />
      </el-select>
      <button v-if="hasFilter" type="button" class="ds__reset" @click="resetFilter">重置筛选</button>
    </div>

    <!-- 数据集卡片 -->
    <div v-if="list.length" class="ds__grid">
      <article
        v-for="d in list"
        :key="d.id"
        class="dcard"
        :style="{ '--tc': typeColor(d.taskType) }"
        @click="goDetail(d.id)"
      >
        <div class="dcard__head">
          <span class="dcard__type">{{ d.taskType }}</span>
          <span class="dcard__status" :style="{ color: statusColor[d.status] }">
            <i />{{ d.status }}
          </span>
        </div>

        <h3 class="dcard__name" :title="d.name">{{ d.name }}</h3>

        <p class="dcard__spec">
          <span>{{ d.sampleCount }} 个样本</span>
          <i class="dcard__dot" />
          <span>{{ d.fields.length }} 个字段</span>
          <i class="dcard__dot" />
          <span>V{{ d.version }}</span>
        </p>

        <div class="dcard__foot" @click.stop>
          <button type="button" class="dlink" @click="goEdit(d.id)">编辑</button>
          <el-dropdown trigger="click" @command="(cmd: string) => onDsCmd(cmd, d)">
            <button type="button" class="dlink dcard__more">更多<el-icon><ArrowDown /></el-icon></button>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="dup">复制</el-dropdown-item>
                <el-dropdown-item command="del" divided>删除</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
          <span class="dcard__cta">
            <el-button type="primary" size="small" @click="goTask(d)">创建训练任务</el-button>
          </span>
        </div>
      </article>
    </div>

    <!-- 空状态 -->
    <div v-else class="ds__empty">
      <p class="ds__empty-t">{{ hasFilter ? '没有符合筛选条件的数据集' : '本机构还没有科研数据集' }}</p>
      <p class="ds__empty-s">{{ hasFilter ? '调整筛选条件，或清空后重新查找' : '从科研队列中引用样本，配置字段与标签即可创建' }}</p>
      <div class="ds__empty-ops">
        <el-button v-if="hasFilter" @click="resetFilter">清空筛选</el-button>
        <el-button type="primary" @click="goCreate">新建数据集</el-button>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* ---------- 页头 ---------- */
.ds__head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 16px;
}
.ds__headline {
  min-width: 0;
}
.ds__title {
  position: relative;
  padding-left: 12px;
  margin: 0 0 3px;
  font-size: 19px;
  font-weight: 700;
  letter-spacing: 0.02em;
  color: var(--pf-text);
}
.ds__title::before {
  content: '';
  position: absolute;
  left: 0;
  top: 3px;
  bottom: 3px;
  width: 3px;
  border-radius: 2px;
  background: var(--pf-primary);
}
.ds__crumb {
  display: flex;
  align-items: center;
  gap: 8px;
  padding-left: 12px;
  font-size: 12.5px;
  color: var(--pf-text-faint);
}
.ds__crumb b {
  color: var(--pf-text);
  font-weight: 700;
  font-variant-numeric: tabular-nums;
}
.ds__crumbsep {
  width: 1px;
  height: 10px;
  background: var(--pf-border-strong);
}
.ds__ok {
  padding: 1px 8px;
  font-size: 11.5px;
  font-weight: 600;
  color: #059669;
  background: rgba(16, 185, 129, 0.1);
  border-radius: 999px;
}

/* ---------- 筛选工具栏 ---------- */
.ds__toolbar {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
  padding: 10px 12px;
  margin-bottom: 14px;
  background: var(--pf-surface);
  border: 1px solid var(--pf-border);
  border-radius: 12px;
  box-shadow: var(--pf-shadow-sm);
}
.ds__search {
  flex: 1 1 260px;
  max-width: 340px;
}
.ds__select {
  width: 152px;
}
.ds__vline {
  width: 1px;
  height: 20px;
  background: var(--pf-border);
}
.ds__reset {
  margin-left: auto;
  padding: 4px 8px;
  font-family: inherit;
  font-size: 12.5px;
  color: var(--pf-text-soft);
  background: transparent;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: color 0.15s, background 0.15s;
}
.ds__reset:hover {
  color: var(--pf-primary);
  background: var(--pf-bg-soft);
}

/* ---------- 数据集卡片 ---------- */
.ds__grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(324px, 1fr));
  gap: 14px;
  align-items: stretch;
}
.dcard {
  position: relative;
  display: flex;
  flex-direction: column;
  padding: 18px 20px 14px;
  background: var(--pf-surface);
  border: 1px solid var(--pf-border);
  border-radius: 16px;
  cursor: pointer;
  transition: border-color 0.18s ease, box-shadow 0.22s ease, transform 0.18s ease;
}
.dcard:hover {
  border-color: var(--pf-border-strong);
  box-shadow: 0 18px 38px -26px rgba(28, 34, 48, 0.5);
  transform: translateY(-2px);
}

.dcard__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}
.dcard__type {
  padding: 3px 11px;
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.01em;
  color: var(--tc);
  background: color-mix(in srgb, var(--tc) 8%, transparent);
  border-radius: 999px;
}
.dcard__status {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 12.5px;
  font-weight: 600;
  white-space: nowrap;
}
.dcard__status i {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: currentColor;
}

.dcard__name {
  margin: 14px 0 0;
  overflow: hidden;
  font-size: 17px;
  font-weight: 700;
  line-height: 1.4;
  letter-spacing: 0.01em;
  color: var(--pf-text);
  text-overflow: ellipsis;
  white-space: nowrap;
}
.dcard__spec {
  display: flex;
  align-items: center;
  gap: 9px;
  margin: 9px 0 0;
  font-size: 13px;
  line-height: 1.6;
  color: var(--pf-text-soft);
  white-space: nowrap;
}
.dcard__dot {
  flex: none;
  width: 3px;
  height: 3px;
  background: var(--pf-border-strong);
  border-radius: 50%;
}

.dcard__foot {
  display: flex;
  align-items: center;
  gap: 2px;
  margin-top: 16px;
  padding-top: 12px;
  border-top: 1px solid var(--pf-border);
}
.dcard__cta {
  display: inline-flex;
  margin-left: auto;
}
.dcard__cta :deep(.el-button) {
  height: 31px;
  padding: 0 16px;
  font-size: 12.5px;
  font-weight: 600;
  color: #fff;
  background: #18181b;
  border-color: #18181b;
  border-radius: 999px;
}
.dcard__cta :deep(.el-button:hover),
.dcard__cta :deep(.el-button:focus) {
  color: #fff;
  background: #2a2a2e;
  border-color: #2a2a2e;
}

.dlink {
  padding: 3px 7px;
  font-family: inherit;
  font-size: 12.5px;
  line-height: 1.5;
  white-space: nowrap;
  color: var(--pf-text-soft);
  background: transparent;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  transition: color 0.14s, background 0.14s;
}
.dlink:hover {
  color: var(--pf-primary);
  background: var(--pf-bg-soft);
}
.dcard__more {
  display: inline-flex;
  align-items: center;
  gap: 2px;
}

/* ---------- 空状态 ---------- */
.ds__empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 60px 24px;
  background: var(--pf-surface);
  border: 1px dashed var(--pf-border-strong);
  border-radius: 12px;
}
.ds__empty-t {
  margin: 0 0 6px;
  font-size: 14px;
  font-weight: 600;
  color: var(--pf-text-soft);
}
.ds__empty-s {
  margin: 0 0 16px;
  font-size: 12.5px;
  color: var(--pf-text-faint);
}
.ds__empty-ops {
  display: flex;
  gap: 8px;
}

/* ---------- 响应式 ---------- */
@media (max-width: 1024px) {
  .ds__grid {
    grid-template-columns: repeat(auto-fill, minmax(290px, 1fr));
  }
}
@media (max-width: 640px) {
  .ds__select {
    width: calc(50% - 5px);
  }
  .ds__reset {
    margin-left: 0;
  }
  .ds__grid {
    grid-template-columns: minmax(0, 1fr);
  }
}
</style>
