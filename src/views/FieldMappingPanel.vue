<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { CircleCheck } from '@element-plus/icons-vue'
import { useOrgStore } from '@/store/org'
import { orgNames } from '@/mock/organizations'
import { standardSets, getStandardSet } from '@/mock/standardSets'
import {
  buildMappingRows,
  reMatchRow,
  confirmMapping,
  setDisabled,
  removeRecord,
  mappingStatuses,
  statusTagType,
  type MappingRow,
  type MappingStatus,
} from '@/mock/fieldMappingBuilder'
import { standardCategories } from '@/mock/esophagusMetadata'

const org = useOrgStore()
/** 平台管理员 = 三家合并视图；机构管理员 = 仅本机构 */
const scopeOrgs = computed(() => (org.isPlatformAdmin ? orgNames : [org.current]))
const multiOrg = computed(() => scopeOrgs.value.length > 1)

/* ---------- 标准集 / 清单 ---------- */
const setId = ref(standardSets[0].id)
const currentSet = computed(() => getStandardSet(setId.value))
const rows = ref<MappingRow[]>([])

function rebuild() {
  rows.value = scopeOrgs.value.flatMap((o) => buildMappingRows(o, currentSet.value))
  selected.value = []
}

function reload() {
  rebuild()
}
watch(scopeOrgs, () => reload())
watch(setId, () => {
  reload()
  ElMessage.info(`已切换到「${currentSet.value.name}」，候选匹配目标同步切换`)
})

function setName(id: string | null) {
  return standardSets.find((s) => s.id === id)?.name ?? ''
}

/* ---------- 筛选 ---------- */
const category = ref('')
const status = ref<MappingStatus | ''>('')
const keyword = ref('')

const filtered = computed(() =>
  rows.value.filter((r) => {
    if (category.value && r.category !== category.value) return false
    if (status.value && r.status !== status.value) return false
    if (keyword.value) {
      const kw = keyword.value.trim().toLowerCase()
      if (!r.sourceField.toLowerCase().includes(kw) && !r.sourceDesc.toLowerCase().includes(kw)) return false
    }
    return true
  }),
)

const page = ref(1)
const size = ref(20)
watch([category, status, keyword, size], () => {
  page.value = 1
})
const pagedRows = computed(() => {
  const start = (page.value - 1) * size.value
  return filtered.value.slice(start, start + size.value)
})

/* ---------- 顶部统计（一行文字指标） ---------- */
const stats = computed(() => {
  const scope = rows.value
  const mapped = scope.filter((r) => r.status === '已映射').length
  const pendingConfirm = scope.filter((r) => r.status === '待确认').length
  const pendingMatch = scope.filter((r) => r.status === '待匹配').length
  return { total: scope.length, mapped, pendingConfirm, pendingMatch }
})

/* ---------- 选择 ---------- */
const selected = ref<MappingRow[]>([])
const tableRef = ref<{ clearSelection: () => void; toggleRowSelection: (r: MappingRow, v: boolean) => void }>()

/** 一次勾选全部筛选结果，避免逐页勾选上百个源字段 */
function selectAllFiltered() {
  if (!filtered.value.length) return ElMessage.warning('当前筛选结果为空')
  size.value = Math.max(filtered.value.length, 20)
  page.value = 1
  nextTick(() => {
    tableRef.value?.clearSelection()
    pagedRows.value.forEach((r) => tableRef.value?.toggleRowSelection(r, true))
  })
}

// 首屏直接载入，避免空表闪帧
reload()

/* ---------- 映射确认抽屉：只绑定标准字段，标准化按规范统一执行 ---------- */
const mapDrawer = ref(false)
const mapMode = ref<'confirm' | 'edit'>('confirm')
const currentRow = ref<MappingRow | null>(null)
const form = ref<{ code: string }>({ code: '' })

const stdOptions = computed(() => currentSet.value.fields)
const selectedStandard = computed(
  () => currentSet.value.fields.find((f) => f.code === form.value.code),
)

function openMapDrawer(mode: 'confirm' | 'edit', row: MappingRow) {
  mapMode.value = mode
  currentRow.value = row
  form.value = { code: row.selectedCode ?? row.candidates[0]?.standard.code ?? '' }
  mapDrawer.value = true
}

function saveMapping() {
  const row = currentRow.value
  const std = selectedStandard.value
  if (!row || !std) return
  confirmMapping(row.org, row.sourceField, std.code, setId.value)
  rebuild()
  mapDrawer.value = false
  ElMessage.success(`已确认 ${row.sourceField} → ${std.cn}（${std.code}）`)
}

/* ---------- 单行操作 ---------- */
function rowCommand(cmd: string, row: MappingRow) {
  if (cmd === 'edit') openMapDrawer('edit', row)
  else if (cmd === 'rematch') reMatch(row)
  else if (cmd === 'disable') toggleOff(row)
  else if (cmd === 'delete') del(row)
}

function scoreClass(score: number) {
  return score >= 50 ? 'is-hi' : 'is-low'
}

function reMatch(row: MappingRow) {
  const idx = rows.value.findIndex((r) => r.id === row.id)
  rows.value.splice(idx, 1, reMatchRow(row.org, row, currentSet.value))
  ElMessage.success(`${row.sourceField} 已重新生成候选`)
}

function toggleOff(row: MappingRow) {
  const next = row.status === '已停用'
  setDisabled(row.org, row.sourceField, !next)
  rebuild()
  ElMessage.success(
    `${row.sourceField} 已${next ? '启用' : '停用'}，${next ? '参与数据治理' : '保留映射配置但不参与治理'}`,
  )
}

function del(row: MappingRow) {
  ElMessageBox.confirm(`确定删除「${row.sourceField}」的映射关系吗？`, '删除确认', {
    confirmButtonText: '删除',
    cancelButtonText: '取消',
    type: 'warning',
  })
    .then(() => {
      removeRecord(row.org, row.sourceField)
      rows.value = rows.value.filter((r) => r.id !== row.id)
      ElMessage.success('映射关系已删除')
    })
    .catch(() => {})
}

/* ---------- 批量操作 ---------- */
const BATCH_CONFIRM_MIN = 55

function batchCommand(cmd: string) {
  if (cmd === 'enable') batchEnable(false)
  else if (cmd === 'disable') batchEnable(true)
  else if (cmd === 'delete') batchDelete()
}

function batchMatch() {
  if (!selected.value.length) return ElMessage.warning('请先勾选源字段')
  const list = [...selected.value]
  list.forEach((row) => {
    const idx = rows.value.findIndex((r) => r.id === row.id)
    if (idx >= 0) rows.value.splice(idx, 1, reMatchRow(row.org, row, currentSet.value))
  })
  selected.value = []
  ElMessage.success(`已为 ${list.length} 个源字段重新生成候选`)
}

function batchConfirm() {
  if (!selected.value.length) return ElMessage.warning('请先勾选源字段')
  const ok = selected.value.filter((r) => r.candidates.length && r.candidates[0].score >= BATCH_CONFIRM_MIN)
  if (!ok.length) return ElMessage.warning(`所选字段候选匹配度均低于 ${BATCH_CONFIRM_MIN}%，无法批量确认`)
  ok.forEach((row) => {
    const cand = row.candidates[0]
    confirmMapping(row.org, row.sourceField, cand.standard.code, setId.value)
  })
  rebuild()
  const skipped = selected.value.length - ok.length
  ElMessage.success(
    skipped
      ? `已批量确认 ${ok.length} 个源字段（${skipped} 个低于 ${BATCH_CONFIRM_MIN}% 已跳过）`
      : `已批量确认 ${ok.length} 个源字段`,
  )
  selected.value = []
}

function batchEnable(off: boolean) {
  if (!selected.value.length) return ElMessage.warning('请先勾选源字段')
  const count = selected.value.length
  selected.value.forEach((row) => setDisabled(row.org, row.sourceField, off))
  rebuild()
  ElMessage.success(`已${off ? '停用' : '启用'} ${count} 个源字段`)
  selected.value = []
}

function batchDelete() {
  if (!selected.value.length) return ElMessage.warning('请先勾选源字段')
  const count = selected.value.length
  ElMessageBox.confirm(`确定删除所选 ${count} 条映射关系吗？`, '批量删除确认', {
    confirmButtonText: '删除',
    cancelButtonText: '取消',
    type: 'warning',
  })
    .then(() => {
      selected.value.forEach((row) => removeRecord(row.org, row.sourceField))
      const ids = new Set(selected.value.map((r) => r.id))
      rows.value = rows.value.filter((r) => !ids.has(r.id))
      selected.value = []
      ElMessage.success(`已删除 ${count} 条映射关系`)
    })
    .catch(() => {})
}

</script>

<template>
  <div class="fm">
    <!-- ============ 字段映射 ============ -->
        <!-- 筛选 -->
        <div class="fm__bar">
          <span class="fm__lbl">标准集</span>
          <el-select v-model="setId" size="small" class="fm__sel">
            <el-option v-for="s in standardSets" :key="s.id" :label="s.name" :value="s.id">
              <span>{{ s.name }}</span>
              <span class="fm__opt-scope">{{ s.scope }}</span>
            </el-option>
          </el-select>

          <span class="fm__lbl">数据分类</span>
          <el-select v-model="category" size="small" clearable placeholder="全部分类" class="fm__sel fm__sel--mid">
            <el-option v-for="c in standardCategories" :key="c" :label="c" :value="c" />
          </el-select>

          <span class="fm__lbl">映射状态</span>
          <el-select v-model="status" size="small" clearable placeholder="全部" class="fm__sel fm__sel--sm">
            <el-option v-for="s in mappingStatuses" :key="s" :label="s" :value="s" />
          </el-select>

          <el-input v-model="keyword" size="small" clearable placeholder="搜索源字段 / 描述" class="fm__kw" />
        </div>

        <!-- 批量操作 -->
        <div class="fm__bar fm__bar--acts">
          <el-button size="small" @click="batchMatch">批量匹配</el-button>
          <el-button size="small" :icon="CircleCheck" @click="batchConfirm">批量确认</el-button>
          <el-button size="small" @click="batchEnable(false)">批量启用</el-button>
          <el-button size="small" @click="batchEnable(true)">批量停用</el-button>
          <el-button size="small" class="fm__danger" @click="batchDelete">批量删除</el-button>
          <span class="fm__selected">
            已选 {{ selected.length }} 项
            <button class="fm__link" @click="selectAllFiltered">选择全部 {{ filtered.length }} 条</button>
          </span>
        </div>

        <!-- 统计 -->
        <div class="fm__stats">
          <span class="fm__stat">源字段总数 <b>{{ stats.total }}</b></span>
          <span class="fm__stat is-ok">已映射 <b>{{ stats.mapped }}</b></span>
          <span class="fm__stat is-warn">待确认 <b>{{ stats.pendingConfirm }}</b></span>
          <span class="fm__stat is-info">待匹配 <b>{{ stats.pendingMatch }}</b></span>
        </div>

        <el-table
          ref="tableRef"
          :data="pagedRows" border size="small" class="fm__table"
          row-key="id" @selection-change="(val: MappingRow[]) => (selected = val)"
        >
          <el-table-column type="selection" width="42" align="center" />
          <el-table-column v-if="multiOrg" prop="org" label="机构" width="140" show-overflow-tooltip />
          <el-table-column prop="category" label="数据分类" width="120" show-overflow-tooltip />
          <el-table-column prop="sourceField" label="源字段" width="190" show-overflow-tooltip>
            <template #default="{ row }">
              <span class="fm__src">{{ (row as MappingRow).sourceField }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="sourceDesc" label="源字段描述" min-width="170" show-overflow-tooltip />
          <el-table-column label="候选标准字段" min-width="240">
            <template #default="{ row }">
              <div v-if="(row as MappingRow).candidates.length" class="fm__cand-top">
                <span class="fm__cand-name">
                  {{ (row as MappingRow).candidates[0].standard.cn }}（{{ (row as MappingRow).candidates[0].standard.code }}）
                </span>
              </div>
              <span v-else class="fm__none">—</span>
            </template>
          </el-table-column>
          <el-table-column label="匹配分数" width="96" align="center">
            <template #default="{ row }">
              <template v-if="(row as MappingRow).candidates.length">
                <b class="fm__score" :class="scoreClass((row as MappingRow).candidates[0].score)">
                  {{ (row as MappingRow).candidates[0].score }}%
                </b>
              </template>
              <span v-else class="fm__none">—</span>
            </template>
          </el-table-column>
          <el-table-column label="映射状态" width="104" align="center">
            <template #default="{ row }">
              <el-tag size="small" :type="statusTagType[(row as MappingRow).status]" effect="light">
                {{ (row as MappingRow).status }}
              </el-tag>
              <span v-if="(row as MappingRow).confirmed && (row as MappingRow).confirmedInSet !== setId" class="fm__ver">
                版本 {{ setName((row as MappingRow).confirmedInSet) }}
              </span>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="170" align="center">
            <template #default="{ row }">
              <div class="fm__acts">
                <button
                  v-if="(row as MappingRow).status === '待确认'"
                  class="fm__link is-primary" @click="openMapDrawer('confirm', row as MappingRow)"
                >确认</button>
                <button
                  v-else-if="(row as MappingRow).status === '已停用'"
                  class="fm__link is-primary" @click="toggleOff(row as MappingRow)"
                >启用</button>
                <button v-else class="fm__link is-primary" @click="openMapDrawer('edit', row as MappingRow)">修改</button>

                <el-dropdown trigger="click" @command="(cmd: string) => rowCommand(cmd, row as MappingRow)">
                  <button class="fm__link fm__more">更多</button>
                  <template #dropdown>
                    <el-dropdown-menu>
                      <el-dropdown-item command="rematch">重新匹配</el-dropdown-item>
                      <el-dropdown-item
                        v-if="(row as MappingRow).status === '已映射'" command="disable"
                      >停用</el-dropdown-item>
                      <el-dropdown-item command="delete" divided class="fm__dd-danger">删除</el-dropdown-item>
                    </el-dropdown-menu>
                  </template>
                </el-dropdown>
              </div>
            </template>
          </el-table-column>
          <template #empty>当前机构暂无源字段</template>
        </el-table>

        <div class="fm__pager">
          <el-pagination
            v-model:current-page="page" v-model:page-size="size"
            :page-sizes="[20, 50, 100]" :total="filtered.length"
            layout="total, sizes, prev, pager, next" size="small"
          />
        </div>

    <!-- 映射确认 / 修改：只绑定标准字段 -->
    <el-drawer v-model="mapDrawer" :title="mapMode === 'confirm' ? '确认映射' : '修改映射'" size="560">
      <template v-if="currentRow">
        <div class="fm__meta">
          <div class="fm__meta-item"><span>源字段</span><b>{{ currentRow.sourceField }}</b></div>
          <div class="fm__meta-item"><span>源数据类型</span><b>{{ currentRow.sourceType }}</b></div>
          <div class="fm__meta-item"><span>数据分类</span><b>{{ currentRow.category }}</b></div>
        </div>

        <el-form label-width="92" size="small" class="fm__form">
          <el-form-item label="标准字段">
            <el-select v-model="form.code" filterable placeholder="从当前标准集选择" class="fm__full">
              <el-option v-for="f in stdOptions" :key="f.code" :label="`${f.cn}（${f.code}）`" :value="f.code">
                <span>{{ f.cn }}</span>
                <span class="fm__opt-scope">{{ f.code }} · {{ f.dataType }} · {{ f.category }}</span>
              </el-option>
            </el-select>
          </el-form-item>
          <el-form-item v-if="selectedStandard" label="标准定义">
            <span class="fm__muted">
              数据类型 {{ selectedStandard.dataType }} · 值域 {{ selectedStandard.domain || '—' }} ·
              约束 {{ selectedStandard.constraint }}
            </span>
          </el-form-item>
        </el-form>
      </template>
      <template #footer>
        <el-button size="small" @click="mapDrawer = false">取消</el-button>
        <el-button size="small" type="primary" @click="saveMapping">确认绑定</el-button>
      </template>
    </el-drawer>
  </div>
</template>

<style scoped>
.fm__bar {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 10px;
}
.fm__bar--acts {
  padding-top: 2px;
}
.fm__lbl {
  flex: none;
  font-size: 12.5px;
  color: var(--pf-text-soft);
}
.fm__sel {
  width: 200px;
}
.fm__sel--mid {
  width: 150px;
}
.fm__sel--sm {
  width: 120px;
}
.fm__kw {
  width: 180px;
}
.fm__selected {
  margin-left: auto;
  font-size: 12px;
  color: var(--pf-text-faint);
}
.fm__danger {
  color: var(--pf-danger);
}
.fm__opt-scope {
  float: right;
  margin-left: 12px;
  font-size: 11px;
  color: var(--pf-text-faint);
}

/* 一行文字指标 */
.fm__stats {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 16px;
  margin-bottom: 10px;
  padding: 7px 10px;
  background: var(--pf-surface-2);
  border: 1px solid var(--pf-border);
  border-radius: var(--pf-radius-sm);
}
.fm__stat {
  font-size: 12.5px;
  color: var(--pf-text-soft);
}
.fm__stat b {
  margin-left: 4px;
  font-size: 15px;
  color: var(--pf-text);
}
.fm__stat.is-ok b { color: var(--pf-success); }
.fm__stat.is-warn b { color: var(--pf-warning); }
.fm__stat.is-info b { color: var(--pf-primary); }

.fm__table {
  width: 100%;
}
.fm__src {
  font-family: ui-monospace, Menlo, Consolas, monospace;
  font-size: 12px;
  color: var(--pf-primary);
}
.fm__muted {
  font-size: 12px;
  color: var(--pf-text-soft);
}
.fm__none {
  color: var(--pf-text-faint);
}
.fm__cand-top {
  display: flex;
  align-items: center;
  gap: 8px;
}
.fm__cand-name {
  font-size: 12.5px;
  color: var(--pf-text);
}
.fm__score {
  font-size: 12.5px;
}
.fm__score.is-hi { color: var(--pf-primary); }
.fm__score.is-low { color: var(--pf-danger); }
.fm__more {
  color: var(--pf-text-faint);
}
.fm__more:hover {
  color: var(--pf-primary);
}
:global(.fm__dd-danger) {
  color: var(--pf-danger);
}
.fm__ver {
  display: block;
  margin-top: 2px;
  font-size: 10.5px;
  color: var(--pf-text-faint);
}

.fm__acts {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  justify-content: center;
}
.fm__link {
  border: none;
  background: none;
  padding: 0;
  font-size: 12px;
  color: var(--pf-primary);
  cursor: pointer;
}
.fm__link:hover {
  text-decoration: underline;
}
.fm__link.is-primary { font-weight: 600; }

.fm__pager {
  display: flex;
  justify-content: flex-end;
  margin-top: 10px;
}

.fm__meta {
  display: flex;
  flex-wrap: wrap;
  gap: 12px 24px;
  padding: 10px 12px;
  margin-bottom: 14px;
  background: var(--pf-bg-soft);
  border-radius: var(--pf-radius-sm);
}
.fm__meta-item {
  font-size: 12.5px;
}
.fm__meta-item span {
  margin-right: 6px;
  color: var(--pf-text-soft);
}
.fm__form {
  max-height: calc(100vh - 260px);
  overflow: auto;
}
.fm__full {
  width: 100%;
}
</style>
