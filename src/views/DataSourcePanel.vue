<script setup lang="ts">
import { computed, nextTick, reactive, ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import {
  View,
  Download,
  Refresh,
  DataAnalysis,
  Document,
} from '@element-plus/icons-vue'
import {
  wideSources,
  wideFieldOrder,
  wideRows,
  type WideSource,
  type WideSourceKey,
} from '@/mock/wideTableBuilder'
import { getRawDataSet, type RawDataSet } from '@/mock/dataGovernance'

const sources = wideSources

/* ---------- 参与构建 / 字段收起展开 / 移除 ---------- */
const participating = reactive<Record<WideSourceKey, boolean>>({
  HIS: true,
  LIS: true,
  FU: true,
})
const expanded = reactive<Record<WideSourceKey, boolean>>({
  HIS: true,
  LIS: true,
  FU: true,
})
const removed = ref<Set<string>>(new Set())

function toggleParticipate(key: WideSourceKey, val: boolean) {
  participating[key] = val
  if (!val && key === 'FU') {
    ElMessage.warning('已取消随访库参与，表格将缺少生存 / 复发信息')
  }
}

function removeField(name: string) {
  const s = new Set(removed.value)
  s.add(name)
  removed.value = s
}
function hasRemoved() {
  return removed.value.size > 0
}
function restoreAll() {
  removed.value = new Set()
  ElMessage.success('已恢复全部字段')
}

/* ---------- 派生数据 ---------- */
const enabledSources = computed(() => sources.filter((s) => participating[s.key]))

const fieldGroups = computed(() =>
  enabledSources.value
    .map((s) => ({
      source: s,
      fields: s.fields.filter((f) => !removed.value.has(f.name)),
    }))
    .filter((g) => g.fields.length > 0),
)

const totalFields = computed(() =>
  fieldGroups.value.reduce((n, g) => n + g.fields.length, 0),
)

const previewColumns = computed(() =>
  wideFieldOrder.filter((name) => {
    const src = sources.find((s) => s.fields.some((f) => f.name === name))
    if (!src) return false
    if (!participating[src.key]) return false
    if (removed.value.has(name)) return false
    return true
  }),
)

/* ---------- 构建状态 ---------- */
const extracted = ref(false)
const generated = ref(false)
const buildMsg = ref('')

const previewRef = ref<HTMLElement | null>(null)

function doExtract() {
  extracted.value = true
  const n = enabledSources.value.length
  const rec = enabledSources.value.reduce((a, s) => a + s.records, 0)
  buildMsg.value = `已从 ${n} 个数据源抽取 ${rec.toLocaleString()} 条记录`
  ElMessage.success(buildMsg.value)
}

function doPreview() {
  extracted.value = true
  nextTick(() =>
    previewRef.value?.scrollIntoView({ behavior: 'smooth', block: 'start' }),
  )
}

function doGenerate() {
  generated.value = true
  buildMsg.value = `原始数据表格已生成：共 ${wideRows.length} 行记录（${uniquePatients.value} 名患者）、${totalFields.value} 个字段`
  ElMessage.success(buildMsg.value)
  nextTick(() =>
    previewRef.value?.scrollIntoView({ behavior: 'smooth', block: 'start' }),
  )
}

/* ---------- 预览分页 ---------- */
const pvPage = ref(1)
const pvSize = ref(10)
const pvTotal = computed(() => wideRows.length)
const pvRows = computed(() =>
  wideRows.slice((pvPage.value - 1) * pvSize.value, pvPage.value * pvSize.value),
)

/* ---------- 去重计数（原始数据表格含重复记录，供「去重」功能检测） ---------- */
const uniquePatients = computed(() => new Set(wideRows.map((r) => r.patient_id)).size)
const dupCount = computed(() => wideRows.length - uniquePatients.value)
watch([previewColumns, pvSize], () => {
  pvPage.value = 1
})

/* ---------- 导出当前表格 (CSV) ---------- */
function csvCell(v: unknown): string {
  const s = String(v ?? '')
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}
function downloadFile(content: string, filename: string) {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
function doExport() {
  const cols = previewColumns.value
  const header = cols.join(',')
  const body = wideRows
    .map((r) => cols.map((c) => csvCell((r as unknown as Record<string, unknown>)[c])).join(','))
    .join('\n')
  downloadFile('﻿' + header + '\n' + body, 'patient_wide_table.csv')
  ElMessage.success(`已导出原始数据表格 ${wideRows.length} 行 × ${cols.length} 列（前端生成 CSV）`)
}

/* ---------- 抽屉：原始数据 / 抽取字段 ---------- */
const rawDrawer = ref(false)
const rawSource = ref<WideSource | null>(null)
const rawSet = computed<RawDataSet | undefined>(() =>
  rawSource.value ? getRawDataSet(rawSource.value.rawId) : undefined,
)
function openRaw(s: WideSource) {
  rawSource.value = s
  rawDrawer.value = true
}

const fieldDrawer = ref(false)
const fieldSource = ref<WideSource | null>(null)
function openFields(s: WideSource) {
  fieldSource.value = s
  fieldDrawer.value = true
}

const statusType: Record<string, 'success' | 'danger'> = {
  正常: 'success',
  同步异常: 'danger',
}
</script>

<template>
  <div class="wb">
    <!-- ============ 区域一：数据源 ============ -->
    <section class="wb__sec">
      <div class="wb__sec-head">
        <h2 class="wb__sec-title">接入数据源</h2>
      </div>

      <div class="wb__sources">
        <el-card
          v-for="s in sources"
          :key="s.key"
          class="wb__src"
          :class="{ 'is-off': !participating[s.key] }"
          shadow="never"
        >
          <div class="wb__src-top">
            <span class="wb__src-badge" :class="`wb__src-badge--${s.key.toLowerCase()}`">
              {{ s.system }}
            </span>
            <el-tag size="small" :type="statusType[s.status]" effect="light">
              {{ s.status }}
            </el-tag>
          </div>

          <div class="wb__src-name">{{ s.name }}</div>
          <div class="wb__src-meta">
            <div class="wb__src-kv"><span>主要数据</span><b>{{ s.mainData }}</b></div>
            <div class="wb__src-kv">
              <span>记录数</span>
              <b class="wb__src-rec">{{ s.records.toLocaleString() }}</b>
            </div>
          </div>

          <div class="wb__src-acts">
            <el-button link type="primary" size="small" :icon="View" @click="openRaw(s)">
              查看原始数据
            </el-button>
            <el-button link type="primary" size="small" :icon="Document" @click="openFields(s)">
              查看抽取字段
            </el-button>
            <el-switch
              :model-value="participating[s.key]"
              size="small"
              active-text="参与构建"
              @update:model-value="(v: boolean | string | number) => toggleParticipate(s.key, !!v)"
            />
          </div>
        </el-card>
      </div>
    </section>

    <!-- ============ 区域二：构建操作 ============ -->
    <section class="wb__sec">
      <div class="wb__sec-head">
        <h2 class="wb__sec-title">原始数据表格</h2>
        <div class="wb__acts">
          <el-button size="small" :icon="Refresh" @click="doExtract">抽取数据</el-button>
          <el-button size="small" :icon="View" @click="doPreview">预览表格</el-button>
          <el-button size="small" type="primary" :icon="DataAnalysis" @click="doGenerate">生成表格</el-button>
          <el-button size="small" :icon="Download" @click="doExport">导出表格</el-button>
        </div>
      </div>

      <div v-if="buildMsg" class="wb__status">
        <el-tag v-if="extracted" size="small" type="success" effect="plain">已抽取</el-tag>
        <el-tag v-if="generated" size="small" type="primary" effect="plain">已生成</el-tag>
        <span class="wb__status-text">{{ buildMsg }}</span>
      </div>
    </section>

    <!-- ============ 区域三：原始数据字段汇总 ============ -->
    <section class="wb__sec">
      <div class="wb__sec-head">
        <h2 class="wb__sec-title">原始数据字段</h2>
        <span class="wb__sec-sub">共 {{ totalFields }} 个字段</span>
        <el-button
          v-if="hasRemoved()"
          class="wb__sec-restore"
          link type="primary"
          size="small"
          @click="restoreAll"
        >
          恢复全部字段
        </el-button>
      </div>

      <div v-if="fieldGroups.length === 0" class="wb__empty">
        未选择任何参与构建的数据源
      </div>

      <div v-for="g in fieldGroups" :key="g.source.key" class="wb__group">
        <div class="wb__group-head" @click="expanded[g.source.key] = !expanded[g.source.key]">
          <span class="wb__chip" :class="`wb__chip--${g.source.key.toLowerCase()}`">
            {{ g.source.system }}
          </span>
          <span class="wb__group-count">{{ g.fields.length }} 个字段</span>
          <span class="wb__group-toggle">
            {{ expanded[g.source.key] ? '收起' : '展开' }}
          </span>
        </div>

        <div v-show="expanded[g.source.key]" class="wb__fields">
          <span
            v-for="f in g.fields"
            :key="f.name"
            class="wb__field"
            :title="f.label"
          >
            <code class="wb__field-name">{{ f.name }}</code>
            <span class="wb__field-label">{{ f.label }}</span>
            <button class="wb__field-del" title="移除字段" @click="removeField(f.name)">×</button>
          </span>
        </div>
      </div>
    </section>

    <!-- ============ 区域四：原始数据表格预览 ============ -->
    <section ref="previewRef" class="wb__sec">
      <div class="wb__sec-head">
        <h2 class="wb__sec-title">原始数据表格预览</h2>
        <span class="wb__sec-sub">共 {{ wideRows.length }} 行（含 {{ dupCount }} 条重复）</span>
        <el-button
          class="wb__sec-export"
          size="small"
          :icon="Download"
          @click="doExport"
        >
          导出当前表格
        </el-button>
      </div>

      <el-table :data="pvRows" border size="small" class="wb__table" stripe>
        <el-table-column type="index" label="#" width="52" align="center" />
        <el-table-column
          v-for="c in previewColumns"
          :key="c"
          :prop="c"
          :label="c"
          min-width="118"
          show-overflow-tooltip
        />
        <template #empty>无匹配记录</template>
      </el-table>

      <div class="wb__pager">
        <el-pagination
          v-model:current-page="pvPage"
          v-model:page-size="pvSize"
          :page-sizes="[10, 20]"
          :total="pvTotal"
          layout="total, sizes, prev, pager, next"
          size="small"
        />
      </div>
    </section>

    <!-- 原始数据抽屉 -->
    <el-drawer v-model="rawDrawer" :title="`原始数据 · ${rawSource?.name ?? ''}`" size="62%">
      <template v-if="rawSource && rawSet">
        <div class="wb__raw-meta">
          <div class="wb__raw-mi"><span>系统名称</span><b>{{ rawSource.name }}</b></div>
          <div class="wb__raw-mi"><span>来源系统</span><b>{{ rawSource.system }}</b></div>
          <div class="wb__raw-mi"><span>记录数</span><b>{{ rawSet.rows.length }}</b></div>
        </div>
        <el-table
          :data="rawSet.rows"
          border
          size="small"
          class="wb__raw-table"
          max-height="calc(100vh - 240px)"
        >
          <el-table-column
            v-for="c in rawSet.columns"
            :key="c"
            :prop="c"
            :label="c"
            min-width="140"
            show-overflow-tooltip
          />
        </el-table>
      </template>
    </el-drawer>

    <!-- 抽取字段抽屉 -->
    <el-drawer v-model="fieldDrawer" :title="`抽取字段 · ${fieldSource?.name ?? ''}`" size="42%">
      <template v-if="fieldSource">
        <div class="wb__fd-list">
          <div v-for="f in fieldSource.fields" :key="f.name" class="wb__fd-item">
            <code class="wb__fd-name">{{ f.name }}</code>
            <span class="wb__fd-label">{{ f.label }}</span>
          </div>
        </div>
      </template>
    </el-drawer>
  </div>
</template>

<style scoped>
.wb {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.wb__sec {
  background: var(--pf-surface);
  border: 1px solid var(--pf-border);
  border-radius: var(--pf-radius-sm);
  padding: 14px 16px;
}
.wb__sec-head {
  display: flex;
  align-items: baseline;
  gap: 10px;
  margin-bottom: 12px;
}
.wb__sec-title {
  font-size: 15px;
  font-weight: 700;
  color: var(--pf-text);
}
.wb__sec-sub {
  font-size: 12.5px;
  color: var(--pf-text-faint);
}
.wb__sec-restore,
.wb__sec-export {
  margin-left: auto;
}

/* ---------- 区域一：数据源卡片 ---------- */
.wb__sources {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}
.wb__src {
  border-radius: var(--pf-radius-sm);
  transition: opacity 0.2s ease, border-color 0.2s ease;
}
.wb__src.is-off {
  opacity: 0.55;
}
.wb__src :deep(.el-card__body) {
  padding: 14px;
}
.wb__src-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
}
.wb__src-badge {
  display: inline-flex;
  align-items: center;
  padding: 2px 10px;
  border-radius: 6px;
  font-size: 12.5px;
  font-weight: 700;
  font-family: var(--font-mono, monospace);
  color: #fff;
}
.wb__src-badge--his { background: var(--pf-primary); }
.wb__src-badge--lis { background: #0ea5e9; }
.wb__src-badge--fu { background: var(--pf-primary-2); }
.wb__src-name {
  font-size: 14px;
  font-weight: 600;
  color: var(--pf-text);
  margin-bottom: 8px;
}
.wb__src-meta {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 12px;
}
.wb__src-kv {
  display: flex;
  align-items: baseline;
  gap: 8px;
  font-size: 12.5px;
}
.wb__src-kv span {
  flex: none;
  width: 52px;
  color: var(--pf-text-faint);
}
.wb__src-kv b {
  color: var(--pf-text-soft);
  font-weight: 600;
}
.wb__src-rec {
  font-family: var(--font-mono, monospace);
  color: var(--pf-primary);
}
.wb__src-acts {
  display: flex;
  align-items: center;
  gap: 6px;
  padding-top: 10px;
  border-top: 1px dashed var(--pf-border);
}
.wb__src-acts .el-button.is-link {
  padding: 0 4px;
}

/* ---------- 区域二：构建操作 ---------- */
.wb__acts {
  margin-left: auto;
  align-self: center;
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}
.wb__acts .el-button {
  margin-left: 0;
}
.wb__status {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 12px;
  font-size: 12.5px;
}
.wb__status-text {
  color: var(--pf-text-soft);
}

/* ---------- 区域三：字段汇总 ---------- */
.wb__empty {
  padding: 18px;
  text-align: center;
  font-size: 13px;
  color: var(--pf-text-faint);
  background: var(--pf-surface-2);
  border-radius: var(--pf-radius-sm);
}
.wb__group {
  border: 1px solid var(--pf-border);
  border-radius: var(--pf-radius-sm);
  margin-bottom: 10px;
  overflow: hidden;
}
.wb__group-head {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 12px;
  background: var(--pf-surface-2);
  cursor: pointer;
  user-select: none;
}
.wb__chip {
  display: inline-flex;
  align-items: center;
  padding: 1px 10px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 700;
  font-family: var(--font-mono, monospace);
  color: #fff;
}
.wb__chip--his { background: var(--pf-primary); }
.wb__chip--lis { background: #0ea5e9; }
.wb__chip--fu { background: var(--pf-primary-2); }
.wb__group-count {
  font-size: 12.5px;
  color: var(--pf-text-soft);
}
.wb__group-toggle {
  margin-left: auto;
  font-size: 12.5px;
  color: var(--pf-primary);
}
.wb__fields {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  padding: 12px;
}
.wb__field {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 3px 4px 3px 10px;
  border: 1px solid var(--pf-border);
  border-radius: 999px;
  background: var(--pf-surface);
  font-size: 12.5px;
}
.wb__field-name {
  font-family: var(--font-mono, monospace);
  color: var(--pf-primary);
  font-weight: 600;
}
.wb__field-label {
  color: var(--pf-text-soft);
}
.wb__field-del {
  border: none;
  background: transparent;
  color: var(--pf-text-faint);
  font-size: 15px;
  line-height: 1;
  cursor: pointer;
  padding: 0 4px;
  border-radius: 999px;
}
.wb__field-del:hover {
  color: var(--pf-danger);
  background: rgba(239, 68, 68, 0.1);
}
/* ---------- 区域四：预览 ---------- */
.wb__table {
  font-size: 13px;
  border-radius: var(--pf-radius-sm);
  overflow: hidden;
}
.wb__table :deep(th.el-table__cell) {
  background: var(--pf-surface-2);
  color: var(--pf-text-soft);
  font-weight: 600;
  font-family: var(--font-mono, monospace);
}
.wb__table :deep(td .cell) {
  font-family: var(--font-mono, monospace);
}
.wb__pager {
  display: flex;
  justify-content: flex-end;
  margin-top: 10px;
}

/* ---------- 抽屉 ---------- */
.wb__raw-meta {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px 16px;
  padding: 12px 14px;
  margin-bottom: 12px;
  background: var(--pf-surface-2);
  border: 1px solid var(--pf-border);
  border-radius: var(--pf-radius-sm);
}
.wb__raw-mi {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.wb__raw-mi span {
  font-size: 12px;
  color: var(--pf-text-faint);
}
.wb__raw-mi b {
  font-size: 13px;
  color: var(--pf-text);
  font-weight: 600;
}
.wb__raw-table {
  font-size: 13px;
  border-radius: var(--pf-radius-sm);
  overflow: hidden;
}
.wb__raw-table :deep(th.el-table__cell) {
  background: var(--pf-surface-2);
  color: var(--pf-text-soft);
  font-weight: 600;
  font-family: var(--font-mono, monospace);
}
.wb__fd-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.wb__fd-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 12px;
  border: 1px solid var(--pf-border);
  border-radius: var(--pf-radius-sm);
  background: var(--pf-surface-2);
}
.wb__fd-name {
  font-family: var(--font-mono, monospace);
  font-weight: 600;
  color: var(--pf-primary);
}
.wb__fd-label {
  font-size: 13px;
  color: var(--pf-text-soft);
}

@media (max-width: 900px) {
  .wb__sources { grid-template-columns: 1fr; }
  .wb__sec-head { flex-wrap: wrap; }
  .wb__acts { margin-left: 0; width: 100%; }
}
</style>
