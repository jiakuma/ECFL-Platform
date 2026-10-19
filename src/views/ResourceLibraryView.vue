<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { Search, Refresh, Download, Lock, ArrowRight } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { getAllResources, getAllAlignments, type ResourceView, type AlignmentTask, type AlignType, type AlignStatus, type AlignModality } from '@/mock/patients'

const router = useRouter()

type ResStatus = ResourceView['status']

const keyword = ref('')
const orgFilter = ref('')
const statusFilter = ref('')
const typeFilter = ref<string>('')

// 资源目录仅登记本期需要对齐的 6 类模态（与「对齐任务」范围一致）
const CATALOG_TYPES = ['内镜', 'CT', 'PET-CT', '病理切片', '检查数据', '患者基本信息']

const all = getAllResources().filter((r) => CATALOG_TYPES.includes(r.type))
const orgOptions = computed(() => [...new Set(all.map((r) => r.org))])

const typeMeta: Record<string, { color: string }> = {
  内镜: { color: '#2563eb' },
  CT: { color: '#8b5cf6' },
  'PET-CT': { color: '#f59e0b' },
  病理切片: { color: '#f43f5e' },
  检查数据: { color: '#0ea5e9' },
  患者基本信息: { color: '#64748b' },
}
const allTypes = CATALOG_TYPES

const statusOptions: ResStatus[] = ['已对齐', '待对齐', '授权可见']
const statusColor: Record<ResStatus, string> = {
  已对齐: '#10b981',
  待对齐: '#f59e0b',
  授权可见: '#2563eb',
}

// 对齐任务模态配色（仅覆盖本期需要对齐的模态：内镜 / CT / PET-CT / 切片 / 检查数据 / 患者基本信息）
const alignModMeta: Record<AlignModality, { color: string }> = {
  内镜: { color: '#2563eb' },
  CT: { color: '#8b5cf6' },
  'PET-CT': { color: '#f59e0b' },
  病理切片: { color: '#f43f5e' },
  检查数据: { color: '#0ea5e9' },
  患者基本信息: { color: '#64748b' },
}

const typeCounts = computed<Record<string, number>>(() => {
  const m: Record<string, number> = {}
  for (const r of all) m[r.type] = (m[r.type] ?? 0) + 1
  return m
})

const filtered = computed<ResourceView[]>(() => {
  const kw = keyword.value.trim().toLowerCase()
  return all.filter((r) => {
    const kwHit =
      !kw ||
      r.title.toLowerCase().includes(kw) ||
      r.patientCode.toLowerCase().includes(kw) ||
      r.patientName.toLowerCase().includes(kw) ||
      r.org.toLowerCase().includes(kw)
    const orgHit = !orgFilter.value || r.org === orgFilter.value
    const statusHit = !statusFilter.value || r.status === statusFilter.value
    const typeHit = !typeFilter.value || r.type === typeFilter.value
    return kwHit && orgHit && statusHit && typeHit
  })
})

function resetFilter() {
  keyword.value = ''
  orgFilter.value = ''
  statusFilter.value = ''
  typeFilter.value = ''
}

// 预览抽屉
const drawer = ref(false)
const current = ref<ResourceView | null>(null)
function openPreview(r: ResourceView) {
  current.value = r
  drawer.value = true
}
function requestAccess() {
  if (!current.value) return
  ElMessage.success(`已发起「${current.value.title}」的跨机构授权申请，审计已留痕。`)
}
function downloadRes() {
  if (!current.value) return
  ElMessage.success('下载任务已创建，按当前可见级别脱敏打包。')
}

// ---------- 对齐任务视图 ----------
const tab = ref<'resources' | 'align'>('resources')

const alignments = ref<AlignmentTask[]>(getAllAlignments())
const alignTypeFilter = ref<AlignType | ''>('')
const alignStatusFilter = ref<AlignStatus | ''>('')
const alignOrgFilter = ref('')

const alignTypeOptions: AlignType[] = ['语义字典', '空间', '时间', '标识', '特征']
const alignStatusOptions: AlignStatus[] = ['待对齐', '对齐中', '已校验', '校验失败']
const alignOrgOptions = computed(() => [...new Set(alignments.value.map((t) => t.org))])

const alignStatusColor: Record<AlignStatus, string> = {
  待对齐: '#f59e0b',
  对齐中: '#2563eb',
  已校验: '#10b981',
  校验失败: '#f43f5e',
}

const filteredAlign = computed<AlignmentTask[]>(() =>
  alignments.value.filter(
    (t) =>
      (!alignTypeFilter.value || t.alignType === alignTypeFilter.value) &&
      (!alignStatusFilter.value || t.status === alignStatusFilter.value) &&
      (!alignOrgFilter.value || t.org === alignOrgFilter.value),
  ),
)

function resetAlignFilter() {
  alignTypeFilter.value = ''
  alignStatusFilter.value = ''
  alignOrgFilter.value = ''
}

// 对齐校验抽屉
const alignDrawer = ref(false)
const currentTask = ref<AlignmentTask | null>(null)
function openAlign(t: AlignmentTask) {
  // 患者基本信息对齐已独立为详情页，点击直接跳转而非打开抽屉
  if (t.modality === '患者基本信息') {
    router.push({ path: '/dataset/align/basic', query: { task: t.id } })
    return
  }
  currentTask.value = t
  alignDrawer.value = true
}
function genHash(): string {
  const hex = '0123456789abcdef'
  let s = '0x'
  for (let i = 0; i < 12; i++) s += hex[Math.floor(Math.random() * 16)]
  return s
}
function todayStr(): string {
  const d = new Date()
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
}
const mapLabel: Record<string, string> = { ok: '本就合规', fixed: '已修正', blocked: '待修正' }

function runAlign() {
  if (!currentTask.value) return
  const idx = alignments.value.findIndex((x) => x.id === currentTask.value!.id)
  if (idx < 0) return
  // 执行对齐规则：将待修正 / 已修正的字段对齐至统一标准
  const maps = (currentTask.value.mappings ?? []).map((m) => ({ ...m, result: 'ok' as const }))
  const updated: AlignmentTask = {
    ...alignments.value[idx],
    status: '已校验',
    updatedAt: todayStr(),
    txHash: genHash(),
    checks: alignments.value[idx].checks.map((c) => ({ ...c, pass: true })),
    mappings: maps,
  }
  alignments.value[idx] = updated
  currentTask.value = updated
  ElMessage.success('对齐规则已执行，全部字段已对齐至标准字典，存证已上链（演示）。')
}
</script>

<template>
  <div class="rl">
    <div class="rl__head">
      <h1 class="rl__title">多模态资源</h1>
      <p class="rl__count">{{ tab === 'resources' ? filtered.length + ' / ' + all.length + ' 项' : alignments.length + ' 项对齐任务' }}</p>
    </div>

    <div class="rl__tabs">
      <button class="rl__tab" :class="{ 'is-active': tab === 'resources' }" @click="tab = 'resources'">资源目录</button>
      <button class="rl__tab" :class="{ 'is-active': tab === 'align' }" @click="tab = 'align'">对齐任务</button>
    </div>

    <div v-if="tab === 'resources'">
    <div class="rl__types">
      <button class="rl__type" :class="{ 'is-active': typeFilter === '' }" @click="typeFilter = ''">
        全部 <span class="rl__type-n">{{ all.length }}</span>
      </button>
      <button
        v-for="t in allTypes"
        :key="t"
        class="rl__type"
        :class="{ 'is-active': typeFilter === t }"
        :style="typeFilter === t ? { color: typeMeta[t].color, borderColor: typeMeta[t].color, background: typeMeta[t].color + '12' } : {}"
        @click="typeFilter = typeFilter === t ? '' : t"
      >
        <i class="rl__type-dot" :style="{ background: typeMeta[t].color }" />
        {{ t }} <span class="rl__type-n">{{ typeCounts[t] ?? 0 }}</span>
      </button>
    </div>

    <div class="rl__bar pf-card">
      <el-input v-model="keyword" placeholder="搜索资源标题 / 患者主索引 / 机构" :prefix-icon="Search" clearable class="rl__f-kw" />
      <el-select v-model="orgFilter" placeholder="归属机构" clearable class="rl__f">
        <el-option v-for="o in orgOptions" :key="o" :label="o" :value="o" />
      </el-select>
      <el-select v-model="statusFilter" placeholder="对齐状态" clearable class="rl__f">
        <el-option v-for="s in statusOptions" :key="s" :label="s" :value="s" />
      </el-select>
      <el-button type="primary" plain :icon="Refresh" @click="resetFilter">重置</el-button>
    </div>

    <div class="rl__grid">
      <article v-for="r in filtered" :key="r.patientCode + '-' + r.id" class="rl-card" @click="openPreview(r)">
        <header class="rl-card__top">
          <span class="rl-card__tag" :style="{ color: typeMeta[r.type].color, borderColor: typeMeta[r.type].color, background: typeMeta[r.type].color + '12' }">
            <i class="rl-card__tag-dot" :style="{ background: typeMeta[r.type].color }" />{{ r.type }}
          </span>
          <span class="rl-card__status" :style="{ color: statusColor[r.status] }">
            <i class="rl-card__dot" :style="{ background: statusColor[r.status] }" />{{ r.status }}
          </span>
        </header>

        <h3 class="rl-card__title">{{ r.title }}</h3>

        <div class="rl-card__meta">
          <span>{{ r.patientCode }}</span>
          <span class="rl-card__org" :title="r.org">{{ r.org }}</span>
        </div>
        <div class="rl-card__sub">
          <span>{{ r.date }}</span>
          <span class="rl__sep">·</span>
          <span>{{ r.size }}</span>
          <span class="rl__sep">·</span>
          <span>{{ r.format }}</span>
        </div>
      </article>
    </div>

    <div v-if="filtered.length === 0" class="rl__empty">未检索到匹配的多模态资源</div>
    </div>

    <div v-else-if="tab === 'align'">
      <div class="rl__bar pf-card">
        <el-select v-model="alignTypeFilter" placeholder="对齐类型" clearable class="rl__f">
          <el-option v-for="t in alignTypeOptions" :key="t" :label="t" :value="t" />
        </el-select>
        <el-select v-model="alignStatusFilter" placeholder="状态" clearable class="rl__f">
          <el-option v-for="s in alignStatusOptions" :key="s" :label="s" :value="s" />
        </el-select>
        <el-select v-model="alignOrgFilter" placeholder="归属机构" clearable class="rl__f">
          <el-option v-for="o in alignOrgOptions" :key="o" :label="o" :value="o" />
        </el-select>
        <el-button type="primary" plain :icon="Refresh" @click="resetAlignFilter">重置</el-button>
      </div>

      <div class="al-list">
        <article v-for="t in filteredAlign" :key="t.id" class="al-row" @click="openAlign(t)">
          <span class="al-row__bar" :style="{ background: alignModMeta[t.modality].color }" />
          <div class="al-row__main">
            <div class="al-row__t1">
              <span class="al-row__title">{{ t.resourceTitle }}</span>
              <span class="al-row__mod" :style="{ color: alignModMeta[t.modality].color }">{{ t.modality }}</span>
            </div>
            <div class="al-row__t2">
              <span>{{ t.patientCode }}</span>
              <span class="rl__sep">·</span>
              <span>{{ t.org }}</span>
              <span class="rl__sep">·</span>
              <span>{{ t.standard }}</span>
            </div>
          </div>
          <div class="al-row__side">
            <span class="al-row__type">{{ t.alignType }}</span>
            <span class="al-row__status" :style="{ color: alignStatusColor[t.status] }">
              <i class="rl-card__dot" :style="{ background: alignStatusColor[t.status] }" />{{ t.status }}
            </span>
          </div>
          <span v-if="t.modality === '患者基本信息'" class="al-row__go" title="打开基本信息对齐详情页">
            <el-icon><ArrowRight /></el-icon>
          </span>
        </article>
      </div>

      <div v-if="filteredAlign.length === 0" class="rl__empty">未检索到匹配的对齐任务</div>
    </div>

    <el-drawer v-model="drawer" :title="current?.title ?? '资源预览'" size="420px" direction="rtl">
      <div v-if="current" class="rl-prev">
        <div class="rl-prev__hero" :style="{ background: typeMeta[current.type].color + '14', borderColor: typeMeta[current.type].color + '40' }">
          <span class="rl-prev__type" :style="{ color: typeMeta[current.type].color }">{{ current.type }}</span>
          <span class="rl-prev__format">{{ current.format }} · {{ current.size }}</span>
        </div>

        <dl class="rl-prev__list">
          <div><dt>归属患者</dt><dd>{{ current.patientName }}（{{ current.patientCode }}）</dd></div>
          <div><dt>归属机构</dt><dd>{{ current.org }}</dd></div>
          <div><dt>采集日期</dt><dd>{{ current.date }}</dd></div>
          <div><dt>对齐状态</dt><dd :style="{ color: statusColor[current.status] }">{{ current.status }}</dd></div>
        </dl>

        <div class="rl-prev__placeholder">
          <el-icon :size="34"><Lock /></el-icon>
          <span>演示资源 · 原型展示</span>
        </div>

        <div class="rl-prev__actions">
          <el-button :icon="Download" @click="downloadRes">下载脱敏包</el-button>
          <el-button type="primary" :icon="Lock" @click="requestAccess">申请跨机构授权</el-button>
        </div>
      </div>
    </el-drawer>

    <el-drawer v-model="alignDrawer" :title="currentTask?.resourceTitle ?? '对齐任务'" size="440px" direction="rtl">
      <div v-if="currentTask" class="al-prev">
        <div class="al-prev__hero" :style="{ background: alignModMeta[currentTask.modality].color + '14', borderColor: alignModMeta[currentTask.modality].color + '40' }">
          <span class="al-prev__mod" :style="{ color: alignModMeta[currentTask.modality].color }">{{ currentTask.modality }}</span>
          <span class="al-prev__type">{{ currentTask.alignType }} · {{ currentTask.status }}</span>
        </div>

        <dl class="al-prev__list">
          <div><dt>关联资源</dt><dd>{{ currentTask.resourceTitle }}</dd></div>
          <div><dt>归属患者</dt><dd>{{ currentTask.patientCode }}</dd></div>
          <div><dt>归属机构</dt><dd>{{ currentTask.org }}</dd></div>
          <div><dt>对齐标准</dt><dd>{{ currentTask.standard }}</dd></div>
          <div><dt>操作方</dt><dd>{{ currentTask.operator }}</dd></div>
          <div><dt>更新时间</dt><dd>{{ currentTask.updatedAt }}</dd></div>
          <div v-if="currentTask.txHash"><dt>存证哈希</dt><dd class="al-prev__hash">{{ currentTask.txHash }}</dd></div>
        </dl>

        <h4 class="al-prev__h">对齐过程</h4>
        <div class="al-map">
          <article v-for="(m, i) in (currentTask.mappings ?? [])" :key="i" class="al-map__item" :class="'is-' + m.result">
            <header class="al-map__head">
              <span class="al-map__field">{{ m.field }}</span>
              <span class="al-map__tag" :class="'is-' + m.result">{{ mapLabel[m.result] }}</span>
            </header>
            <div class="al-map__raw"><span class="al-map__k">原始</span>{{ m.raw }}</div>
            <div v-if="m.issue" class="al-map__issue"><span class="al-map__k">问题</span>{{ m.issue }}</div>
            <div class="al-map__arrow">↓ 对齐规则</div>
            <div class="al-map__mapped"><span class="al-map__k">标准</span>{{ m.mapped }}<span v-if="m.code" class="al-map__code">{{ m.code }}</span></div>
          </article>
        </div>

        <h4 class="al-prev__h">校验项</h4>
        <ul class="al-checks">
          <li v-for="(c, i) in currentTask.checks" :key="i" class="al-check" :class="c.pass ? 'is-pass' : 'is-fail'">
            <span class="al-check__icon">{{ c.pass ? '✓' : '!' }}</span>
            <div class="al-check__body">
              <span class="al-check__name">{{ c.name }}</span>
              <span class="al-check__detail">{{ c.detail }}</span>
            </div>
          </li>
        </ul>

        <div class="al-prev__actions">
          <el-button
            v-if="currentTask.status !== '已校验'"
            type="primary"
            :icon="Lock"
            @click="runAlign"
          >执行对齐</el-button>
        </div>
        <p v-if="currentTask.status === '已校验'" class="al-prev__note">该任务已完成校验并上链存证。</p>
      </div>
    </el-drawer>
  </div>
</template>

<style scoped>
.rl {
  padding: 4px 0;
}
.rl__head {
  display: flex;
  align-items: baseline;
  gap: 14px;
  margin-bottom: 16px;
}
.rl__title {
  position: relative;
  font-size: 22px;
  font-weight: 800;
  letter-spacing: 0.04em;
  padding-left: 16px;
  margin: 0;
  color: var(--pf-text);
}
.rl__title::before {
  content: '';
  position: absolute;
  left: 0;
  top: 3px;
  bottom: 3px;
  width: 4px;
  border-radius: 2px;
  background: var(--pf-primary);
}
.rl__count {
  color: var(--pf-text-faint);
  font-size: 14px;
}

.rl__types {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 16px;
}
.rl__type {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 7px 13px;
  border-radius: 999px;
  border: 1px solid var(--pf-border);
  background: var(--pf-surface);
  color: var(--pf-text-soft);
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.18s ease;
}
.rl__type:hover {
  border-color: var(--pf-border-strong);
  color: var(--pf-text);
}
.rl__type.is-active {
  color: var(--pf-primary);
  border-color: var(--pf-primary);
  background: rgba(99, 102, 241, 0.08);
}
.rl__type-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  display: inline-block;
}
.rl__type-n {
  font-size: 12px;
  color: var(--pf-text-faint);
  font-weight: 700;
}
.rl__type.is-active .rl__type-n {
  color: inherit;
}

.rl__bar {
  display: flex;
  gap: 12px;
  align-items: center;
  flex-wrap: wrap;
  padding: 12px 14px;
  border-radius: 12px;
  margin-bottom: 16px;
}
.rl__f-kw {
  flex: 1 1 260px;
}
.rl__f {
  width: 160px;
}

.rl__grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 14px;
}
.rl-card {
  background: var(--pf-surface);
  border: 1px solid var(--pf-border);
  border-radius: 12px;
  padding: 14px 16px;
  cursor: pointer;
  transition: border-color 0.2s ease, box-shadow 0.2s ease, transform 0.2s ease;
}
.rl-card:hover {
  border-color: var(--pf-border-strong);
  box-shadow: var(--pf-shadow-sm);
  transform: translateY(-2px);
}
.rl-card__top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 12px;
}
.rl-card__tag {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  font-weight: 700;
  padding: 3px 9px;
  border-radius: 999px;
  border: 1px solid;
}
.rl-card__tag-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
}
.rl-card__status {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 12px;
  font-weight: 600;
}
.rl-card__dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
}
.rl-card__title {
  font-size: 15px;
  font-weight: 700;
  line-height: 1.4;
  margin: 0 0 12px;
  color: var(--pf-text);
}
.rl-card__meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  font-size: 13px;
  color: var(--pf-text-soft);
  margin-bottom: 6px;
}
.rl-card__org {
  max-width: 50%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.rl-card__sub {
  font-size: 12px;
  color: var(--pf-text-faint);
  display: flex;
  align-items: center;
  gap: 6px;
}
.rl__sep {
  opacity: 0.6;
}

.rl__empty {
  text-align: center;
  color: var(--pf-text-faint);
  padding: 48px 0;
  font-size: 14px;
}

.rl-prev__hero {
  border: 1px solid;
  border-radius: 12px;
  padding: 18px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 16px;
}
.rl-prev__type {
  font-size: 18px;
  font-weight: 800;
}
.rl-prev__format {
  font-size: 13px;
  color: var(--pf-text-soft);
}
.rl-prev__list {
  margin: 0;
}
.rl-prev__list > div {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  padding: 10px 0;
  border-bottom: 1px solid var(--pf-border);
}
.rl-prev__list dt {
  color: var(--pf-text-faint);
  font-size: 13px;
}
.rl-prev__list dd {
  margin: 0;
  font-size: 13px;
  color: var(--pf-text);
  font-weight: 600;
  text-align: right;
}
.rl-prev__placeholder {
  margin-top: 16px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 28px;
  border: 1px dashed var(--pf-border-strong);
  border-radius: 12px;
  color: var(--pf-text-faint);
  font-size: 13px;
}
.rl-prev__actions {
  display: flex;
  gap: 10px;
  margin-top: 16px;
}
.rl-prev__actions .el-button {
  flex: 1;
}

.rl__tabs {
  display: flex;
  gap: 4px;
  margin-bottom: 16px;
  border-bottom: 1px solid var(--pf-border);
}
.rl__tab {
  padding: 9px 16px;
  border: none;
  background: transparent;
  color: var(--pf-text-soft);
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  position: relative;
  transition: color 0.15s ease;
}
.rl__tab:hover {
  color: var(--pf-text);
}
.rl__tab.is-active {
  color: var(--pf-primary);
}
.rl__tab.is-active::after {
  content: '';
  position: absolute;
  left: 12px;
  right: 12px;
  bottom: -1px;
  height: 2px;
  border-radius: 2px;
  background: var(--pf-primary);
}

/* 对齐任务列表 */
.al-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.al-row {
  display: flex;
  align-items: stretch;
  gap: 12px;
  background: var(--pf-surface);
  border: 1px solid var(--pf-border);
  border-radius: 10px;
  padding: 0;
  cursor: pointer;
  overflow: hidden;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}
.al-row:hover {
  border-color: var(--pf-border-strong);
  box-shadow: var(--pf-shadow-sm);
}
.al-row__bar {
  width: 4px;
  flex: none;
}
.al-row__main {
  flex: 1;
  min-width: 0;
  padding: 12px 4px 12px 0;
}
.al-row__t1 {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 6px;
}
.al-row__title {
  font-size: 14px;
  font-weight: 700;
  color: var(--pf-text);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.al-row__mod {
  font-size: 12px;
  font-weight: 700;
  flex: none;
}
.al-row__t2 {
  font-size: 12px;
  color: var(--pf-text-faint);
  display: flex;
  align-items: center;
  gap: 6px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.al-row__side {
  flex: none;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  justify-content: center;
  gap: 6px;
  padding: 12px 16px;
}
.al-row__type {
  font-size: 12px;
  font-weight: 600;
  color: var(--pf-text-soft);
}
.al-row__status {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 12px;
  font-weight: 600;
}
.al-row__go {
  flex: none;
  display: grid;
  place-items: center;
  padding: 0 14px;
  color: var(--pf-primary);
  font-size: 16px;
  border-left: 1px solid var(--pf-border);
}

/* 对齐校验抽屉 */
.al-prev__hero {
  border: 1px solid;
  border-radius: 12px;
  padding: 18px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 16px;
}
.al-prev__mod {
  font-size: 18px;
  font-weight: 800;
}
.al-prev__type {
  font-size: 13px;
  color: var(--pf-text-soft);
}
.al-prev__list {
  margin: 0;
}
.al-prev__list > div {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  padding: 10px 0;
  border-bottom: 1px solid var(--pf-border);
}
.al-prev__list dt {
  color: var(--pf-text-faint);
  font-size: 13px;
}
.al-prev__list dd {
  margin: 0;
  font-size: 13px;
  color: var(--pf-text);
  font-weight: 600;
  text-align: right;
}
.al-prev__hash {
  font-family: var(--font-mono, monospace);
  font-size: 12px !important;
  color: var(--pf-text-soft) !important;
}
.al-prev__h {
  margin: 18px 0 10px;
  font-size: 14px;
  font-weight: 700;
  color: var(--pf-text);
}
.al-checks {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.al-check {
  display: flex;
  gap: 10px;
  align-items: flex-start;
  padding: 10px 12px;
  border: 1px solid var(--pf-border);
  border-radius: 10px;
  background: var(--pf-surface-2);
}
.al-check.is-fail {
  border-color: #f43f5e55;
  background: #fdeef0;
}
.al-check__icon {
  flex: none;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  display: grid;
  place-items: center;
  font-size: 12px;
  font-weight: 800;
  color: #fff;
  background: #10b981;
  margin-top: 1px;
}
.al-check.is-fail .al-check__icon {
  background: #f43f5e;
}
.al-check__body {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}
.al-check__name {
  font-size: 13px;
  font-weight: 700;
  color: var(--pf-text);
}
.al-check__detail {
  font-size: 12px;
  color: var(--pf-text-soft);
  line-height: 1.5;
}
.al-prev__actions {
  margin-top: 18px;
}
.al-prev__note {
  margin-top: 10px;
  font-size: 12px;
  color: var(--pf-text-faint);
  text-align: center;
}

/* 对齐过程：原始 → 规则识别 → 标准值 */
.al-map {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.al-map__item {
  border: 1px solid var(--pf-border);
  border-radius: 10px;
  background: var(--pf-surface-2);
  padding: 11px 13px;
  border-left-width: 3px;
}
.al-map__item.is-ok {
  border-left-color: #10b981;
}
.al-map__item.is-fixed {
  border-left-color: #2563eb;
}
.al-map__item.is-blocked {
  border-left-color: #f43f5e;
  background: #fdeef0;
}
.al-map__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 8px;
}
.al-map__field {
  font-size: 13px;
  font-weight: 700;
  color: var(--pf-text);
}
.al-map__tag {
  font-size: 11px;
  font-weight: 700;
  padding: 1px 8px;
  border-radius: 999px;
  flex: none;
}
.al-map__tag.is-ok {
  color: #0f9d6b;
  background: #e3f6ee;
}
.al-map__tag.is-fixed {
  color: #2563eb;
  background: #e6eefe;
}
.al-map__tag.is-blocked {
  color: #f43f5e;
  background: #fbe0e4;
}
.al-map__raw,
.al-map__issue,
.al-map__mapped {
  font-size: 12.5px;
  line-height: 1.5;
  color: var(--pf-text-soft);
  display: flex;
  gap: 8px;
}
.al-map__k {
  flex: none;
  width: 32px;
  color: var(--pf-text-faint);
  font-weight: 700;
}
.al-map__issue {
  color: #c2454f;
}
.al-map__arrow {
  font-size: 11px;
  color: var(--pf-text-faint);
  text-align: center;
  margin: 5px 0;
  letter-spacing: 0.04em;
}
.al-map__mapped {
  color: var(--pf-text);
  font-weight: 600;
}
.al-map__code {
  margin-left: 6px;
  font-family: var(--font-mono, monospace);
  font-size: 11px;
  font-weight: 600;
  color: #2563eb;
  background: #e6eefe;
  padding: 0 6px;
  border-radius: 4px;
}
</style>
