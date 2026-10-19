<script setup lang="ts">
import { computed, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  buildCleanseTasks,
  buildDedupTasks,
  buildMaskTasks,
  previewCleanse,
  previewDedup,
  previewMask,
  executeCleanse,
  executeDedup,
  executeMask,
  type DQTask, type DQStatus, type CleanseTask, type DedupTask, type MaskTask, type ValueChange,
  type DedupHandle,
} from '@/mock/dataQualityEngine'
import {
  buildStandardizeTasks,
  previewStandardize,
  executeStandardize,
  type StandardizeTask,
  type StdStatus,
} from '@/mock/standardizationEngine'

const active = ref<'standardize' | 'cleanse' | 'dedup' | 'mask'>('standardize')

const statusTag: Record<DQStatus, 'info' | 'warning' | 'success' | 'danger'> = {
  待执行: 'info',
  处理中: 'warning',
  已完成: 'success',
  执行失败: 'danger',
}

/* ---------- 任务集合（reactive 拷贝，维护本地状态） ---------- */
const cleanseTasks = ref<CleanseTask[]>(buildCleanseTasks())
const dedupTasks = ref<DedupTask[]>(buildDedupTasks())
const maskTasks = ref<MaskTask[]>(buildMaskTasks())
const standardizeTasks = ref<StandardizeTask[]>(buildStandardizeTasks())

/* ---------- 选择 ---------- */
const selCleanse = ref<CleanseTask[]>([])
const selDedup = ref<DedupTask[]>([])
const selMask = ref<MaskTask[]>([])
const selStandardize = ref<StandardizeTask[]>([])

/* ---------- 预览 / 结果抽屉 ---------- */
const drawer = ref(false)
const drawerTitle = ref('')
const previewRows = ref<ValueChange[]>([])

function openPreview(title: string, rows: ValueChange[]) {
  drawerTitle.value = title
  previewRows.value = rows
  drawer.value = true
}

/* ---------- 执行 ---------- */
function runOne(task: DQTask) {
  task.status = '处理中'
  setTimeout(() => {
    task.status = '已完成'
    ElMessage.success(`「${task.type}」处理完成，影响 ${task.matched} 条记录`)
  }, 300)
}

function runMany(tasks: DQTask[], label: string) {
  const pool = tasks.filter((t) => t.enabled && t.status !== '已完成')
  if (!pool.length) return ElMessage.warning('没有可执行的任务（已禁用或已完成）')
  pool.forEach((t) => {
    t.status = '处理中'
    setTimeout(() => (t.status = '已完成'), 300)
  })
  ElMessage.success(`已对 ${pool.length} 项「${label}」任务发起执行`)
}

function runManyStd() {
  const pool = standardizeTasks.value.filter((t) => t.enabled && t.status !== '已完成')
  if (!pool.length) return ElMessage.warning('没有可执行的任务（已禁用或已完成）')
  pool.forEach((t) => {
    t.status = '处理中'
    setTimeout(() => (t.status = '已完成'), 300)
  })
  ElMessage.success(`已对 ${pool.length} 项「标准化」任务发起执行`)
}

/* ---------- 批量启用 / 停用规则 ---------- */
function toggleEnabled(tasks: Array<{ status: string; enabled: boolean }>, enabled: boolean) {
  const pool = tasks.filter((t) => t.status !== '已完成')
  if (!pool.length) return ElMessage.warning('没有可调整的待执行任务')
  pool.forEach((t) => (t.enabled = enabled))
  ElMessage.success(`已${enabled ? '启用' : '停用'} ${pool.length} 项规则`)
}

/* ---------- 去重处理方式 ---------- */
const handleOptions: DedupHandle[] = ['保留第一条', '保留最新一条', '合并记录', '人工处理']

/* ---------- 各 tab 顶部指标 ---------- */
const cleanseSummary = computed(() => {
  const t = cleanseTasks.value
  return { total: t.length, done: t.filter((x) => x.status === '已完成').length, wait: t.filter((x) => x.status === '待执行').length }
})
const dedupSummary = computed(() => {
  const t = dedupTasks.value
  return { total: t.length, dup: t.reduce((n, x) => n + x.matched, 0), done: t.filter((x) => x.status === '已完成').length }
})
const maskSummary = computed(() => {
  const t = maskTasks.value
  return { total: t.length, done: t.filter((x) => x.status === '已完成').length, wait: t.filter((x) => x.status === '待执行').length }
})
const standardizeSummary = computed(() => {
  const t = standardizeTasks.value
  return { total: t.length, done: t.filter((x) => x.status === '已完成').length, wait: t.filter((x) => x.status === '待执行').length }
})

/* ---------- 操作绑定 ---------- */
function cleansePreview(t: CleanseTask) { openPreview(`清洗 · ${t.type} 影响预览`, previewCleanse(t)) }
function cleanseExec(t: CleanseTask) {
  const r = executeCleanse(t)
  t.status = '已完成'
  ElMessage.success(`「${t.type}」执行完成，清洗 ${r.affected} 处`)
}
function dedupPreview(t: DedupTask) {
  const { groups } = previewDedup(t)
  const rows: ValueChange[] = groups.filter((g) => g.dup).flatMap((g) =>
    g.recs.map((rec, i) => ({ recId: g.key, field: t.keys.join('+'), before: `#${i + 1} ${t.keys.map((k) => (rec as unknown as Record<string, unknown>)[k]).join('/')}`, after: i === 0 ? '保留' : '待去重' })),
  )
  openPreview(`去重 · ${t.category} 重复组预览`, rows)
}
function dedupExec(t: DedupTask) {
  if (t.handle === '人工处理') { ElMessage.warning('该任务设为「人工处理」，不自动执行'); return }
  const r = executeDedup(t)
  t.status = '已完成'
  ElMessage.success(`「${t.category}」去重完成，处理 ${r.affected} 个重复组`)
}
function maskPreview(t: MaskTask) { openPreview(`脱敏 · ${t.type} 影响预览`, previewMask(t)) }
function maskExec(t: MaskTask) {
  const r = executeMask(t)
  t.status = '已完成'
  ElMessage.success(`「${t.type}」执行完成，脱敏 ${r.affected} 条记录`)
}

/* ---------- 标准化 ---------- */
function standardizePreview(t: StandardizeTask) {
  openPreview(`标准化 · ${t.type} 影响预览`, previewStandardize(t))
}
function standardizeExec(t: StandardizeTask) {
  const r = executeStandardize(t)
  t.status = '已完成'
  ElMessage.success(`「${t.type}」执行完成，标准化 ${r.affected} 处`)
}

const colLayout = {
  select: { type: 'selection', width: 40 },
  category: { prop: 'category', label: '数据分类', width: 110 },
  source: { prop: 'source', label: '来源', width: 86, align: 'center' as const, slot: 'source' },
  target: { prop: 'target', label: '字段 / 数据对象', minWidth: 150 },
  type: { prop: 'type', label: '处理类型', width: 130 },
  rule: { prop: 'rule', label: '处理规则', minWidth: 200 },
  matched: { prop: 'matched', label: '命中', width: 80, align: 'right' as const },
  status: { label: '状态', width: 100, align: 'center' as const, slot: 'status' },
  op: { label: '操作', width: 190, align: 'center' as const, slot: 'op' },
}
</script>

<template>
  <div class="dq">
    <el-tabs v-model="active" class="dq__tabs">
      <!-- ===================== 标准化 ===================== -->
      <el-tab-pane label="标准化" name="standardize">
        <div class="dq__bar">
          <span class="dq__metric">标准化任务 <b>{{ standardizeSummary.total }}</b></span>
          <span class="dq__metric dq__metric--done">已完成 <b>{{ standardizeSummary.done }}</b></span>
          <span class="dq__metric dq__metric--wait">待执行 <b>{{ standardizeSummary.wait }}</b></span>
          <span class="dq__spacer" />
          <el-button size="small" type="primary" @click="runManyStd()">批量执行</el-button>
          <el-button size="small" @click="toggleEnabled(selStandardize, true)">批量启用规则</el-button>
          <el-button size="small" @click="toggleEnabled(selStandardize, false)">批量停用规则</el-button>
          <span class="dq__seltext">已选 {{ selStandardize.length }}</span>
        </div>
        <el-table :data="standardizeTasks" border size="small" class="dq__table" row-key="id" @selection-change="(v: StandardizeTask[]) => (selStandardize = v)">
          <el-table-column v-bind="colLayout.select" />
          <el-table-column v-bind="colLayout.category" />
          <el-table-column v-bind="colLayout.source">
            <template #default="{ row }">
              <el-tag size="small" effect="plain" :type="row.source === '随访库' ? 'warning' : row.source === 'LIS' ? 'success' : 'primary'">{{ row.source }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column v-bind="colLayout.target" />
          <el-table-column v-bind="colLayout.type" />
          <el-table-column v-bind="colLayout.rule" show-overflow-tooltip />
          <el-table-column v-bind="colLayout.matched" />
          <el-table-column v-bind="colLayout.status">
            <template #default="{ row }">
              <el-tag size="small" :type="statusTag[row.status as DQStatus]" effect="light">{{ row.status }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column v-bind="colLayout.op">
            <template #default="{ row }">
              <el-button link type="primary" size="small" @click="standardizePreview(row)">预览</el-button>
              <el-button link type="primary" size="small" :disabled="row.status === '已完成'" @click="standardizeExec(row)">执行</el-button>
              <el-button link type="info" size="small" @click="standardizePreview(row)">查看结果</el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>

      <!-- ===================== 清洗 ===================== -->
      <el-tab-pane label="清洗" name="cleanse">
        <div class="dq__bar">
          <span class="dq__metric">任务 <b>{{ cleanseSummary.total }}</b></span>
          <span class="dq__metric dq__metric--done">已完成 <b>{{ cleanseSummary.done }}</b></span>
          <span class="dq__metric dq__metric--wait">待执行 <b>{{ cleanseSummary.wait }}</b></span>
          <span class="dq__spacer" />
          <el-button size="small" type="primary" @click="runMany(selCleanse as DQTask[], '清洗')">批量执行</el-button>
          <el-button size="small" @click="toggleEnabled(selCleanse as DQTask[], true)">批量启用规则</el-button>
          <el-button size="small" @click="toggleEnabled(selCleanse as DQTask[], false)">批量停用规则</el-button>
          <span class="dq__seltext">已选 {{ selCleanse.length }}</span>
        </div>
        <el-table :data="cleanseTasks" border size="small" class="dq__table" row-key="id" @selection-change="(v: CleanseTask[]) => (selCleanse = v)">
          <el-table-column v-bind="colLayout.select" />
          <el-table-column v-bind="colLayout.category" />
          <el-table-column v-bind="colLayout.source">
            <template #default="{ row }">
              <el-tag size="small" effect="plain" :type="row.source === '随访库' ? 'warning' : row.source === 'LIS' ? 'success' : 'primary'">{{ row.source }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column v-bind="colLayout.target" />
          <el-table-column v-bind="colLayout.type" />
          <el-table-column v-bind="colLayout.rule" show-overflow-tooltip />
          <el-table-column v-bind="colLayout.matched" />
          <el-table-column v-bind="colLayout.status">
            <template #default="{ row }">
              <el-tag size="small" :type="statusTag[row.status as DQStatus]" effect="light">{{ row.status }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column v-bind="colLayout.op">
            <template #default="{ row }">
              <el-button link type="primary" size="small" @click="cleansePreview(row)">预览</el-button>
              <el-button link type="primary" size="small" :disabled="row.status === '已完成'" @click="cleanseExec(row)">执行</el-button>
              <el-button link type="info" size="small" @click="cleansePreview(row)">查看结果</el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>

      <!-- ===================== 去重 ===================== -->
      <el-tab-pane label="去重" name="dedup">
        <div class="dq__bar">
          <span class="dq__metric">去重配置 <b>{{ dedupSummary.total }}</b></span>
          <span class="dq__metric dq__metric--wait">重复记录 <b>{{ dedupSummary.dup }}</b></span>
          <span class="dq__metric dq__metric--done">已完成 <b>{{ dedupSummary.done }}</b></span>
          <span class="dq__spacer" />
          <el-button size="small" type="primary" @click="runMany(selDedup as DQTask[], '去重')">批量执行</el-button>
          <el-button size="small" @click="toggleEnabled(selDedup as DQTask[], true)">批量启用规则</el-button>
          <el-button size="small" @click="toggleEnabled(selDedup as DQTask[], false)">批量停用规则</el-button>
          <span class="dq__seltext">已选 {{ selDedup.length }}</span>
        </div>
        <el-table :data="dedupTasks" border size="small" class="dq__table" row-key="id" @selection-change="(v: DedupTask[]) => (selDedup = v)">
          <el-table-column v-bind="colLayout.select" />
          <el-table-column v-bind="colLayout.category" />
          <el-table-column v-bind="colLayout.source">
            <template #default="{ row }">
              <el-tag size="small" effect="plain" :type="row.source === '多源' ? 'info' : 'primary'">{{ row.source }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column v-bind="colLayout.target" />
          <el-table-column v-bind="colLayout.type" />
          <el-table-column v-bind="colLayout.rule" show-overflow-tooltip />
          <el-table-column v-bind="colLayout.matched">
            <template #header>重复记录</template>
          </el-table-column>
          <el-table-column label="处理方式" width="140">
            <template #default="{ row }">
              <el-select v-model="row.handle" size="small" :disabled="row.status === '已完成'" @change="() => {}">
                <el-option v-for="h in handleOptions" :key="h" :label="h" :value="h" />
              </el-select>
            </template>
          </el-table-column>
          <el-table-column v-bind="colLayout.status">
            <template #default="{ row }">
              <el-tag size="small" :type="statusTag[row.status as DQStatus]" effect="light">{{ row.status }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column v-bind="colLayout.op">
            <template #default="{ row }">
              <el-button link type="primary" size="small" @click="dedupPreview(row)">预览</el-button>
              <el-button link type="primary" size="small" :disabled="row.status === '已完成'" @click="dedupExec(row)">执行</el-button>
              <el-button link type="info" size="small" @click="dedupPreview(row)">查看结果</el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>

      <!-- ===================== 脱敏 ===================== -->
      <el-tab-pane label="脱敏" name="mask">
        <div class="dq__bar">
          <span class="dq__metric">脱敏任务 <b>{{ maskSummary.total }}</b></span>
          <span class="dq__metric dq__metric--done">已完成 <b>{{ maskSummary.done }}</b></span>
          <span class="dq__metric dq__metric--wait">待执行 <b>{{ maskSummary.wait }}</b></span>
          <span class="dq__spacer" />
          <el-button size="small" type="primary" @click="runMany(selMask as DQTask[], '脱敏')">批量执行</el-button>
          <el-button size="small" @click="toggleEnabled(selMask as DQTask[], true)">批量启用规则</el-button>
          <el-button size="small" @click="toggleEnabled(selMask as DQTask[], false)">批量停用规则</el-button>
          <span class="dq__seltext">已选 {{ selMask.length }}</span>
        </div>
        <el-table :data="maskTasks" border size="small" class="dq__table" row-key="id" @selection-change="(v: MaskTask[]) => (selMask = v)">
          <el-table-column v-bind="colLayout.select" />
          <el-table-column v-bind="colLayout.category" />
          <el-table-column v-bind="colLayout.source">
            <template #default="{ row }">
              <el-tag size="small" effect="plain" :type="row.source === '随访库' ? 'warning' : row.source === 'LIS' ? 'success' : 'primary'">{{ row.source }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column v-bind="colLayout.target" />
          <el-table-column v-bind="colLayout.type" />
          <el-table-column v-bind="colLayout.rule" show-overflow-tooltip />
          <el-table-column v-bind="colLayout.matched" />
          <el-table-column v-bind="colLayout.status">
            <template #default="{ row }">
              <el-tag size="small" :type="statusTag[row.status as DQStatus]" effect="light">{{ row.status }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column v-bind="colLayout.op">
            <template #default="{ row }">
              <el-button link type="primary" size="small" @click="maskPreview(row)">预览</el-button>
              <el-button link type="primary" size="small" :disabled="row.status === '已完成'" @click="maskExec(row)">执行</el-button>
              <el-button link type="info" size="small" @click="maskPreview(row)">查看结果</el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>
    </el-tabs>

    <el-drawer v-model="drawer" :title="drawerTitle" size="46%">
      <el-table :data="previewRows" border size="small" max-height="70vh">
        <el-table-column prop="recId" label="记录" width="120" />
        <el-table-column prop="field" label="字段" width="140" />
        <el-table-column label="处理前 → 处理后" min-width="240">
          <template #default="{ row }">
            <span class="dq__before">{{ row.before }}</span>
            <span class="dq__arrow">→</span>
            <span class="dq__after">{{ row.after }}</span>
          </template>
        </el-table-column>
      </el-table>
      <el-empty v-if="!previewRows.length" description="无影响数据" />
    </el-drawer>
  </div>
</template>

<style scoped>
.dq { padding-top: 4px; }
.dq__tabs :deep(.el-tabs__header) { margin-bottom: 14px; }
.dq__bar {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
  padding: 6px 2px 12px;
}
.dq__metric { font-size: 13px; color: var(--pf-text-soft); }
.dq__metric b { color: var(--pf-text); font-size: 15px; margin: 0 2px; }
.dq__metric--done b { color: var(--pf-success); }
.dq__metric--wait b { color: var(--pf-warning); }
.dq__spacer { flex: 1; }
.dq__seltext { font-size: 12px; color: var(--pf-text-faint); }
.dq__table { width: 100%; }
.dq__before { color: var(--pf-danger); font-family: ui-monospace, monospace; font-size: 12px; }
.dq__arrow { color: var(--pf-text-faint); margin: 0 8px; }
.dq__after { color: var(--pf-success); font-family: ui-monospace, monospace; font-size: 12px; }
</style>
