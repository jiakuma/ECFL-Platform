<script setup lang="ts">
import { computed, ref } from 'vue'
import { buildStandardWideTable, fieldStage, type StdWideRow } from '@/mock/standardDataBuilder'

const result = buildStandardWideTable()

/* ---------- 指标 ---------- */
const metrics = computed(() => [
  { label: '原始数据记录', value: result.rawCount, tone: '' },
  { label: '清洗修复', value: `${result.cleanChanges} 单元格`, tone: 'clean' },
  { label: '去重消除', value: `${result.dupCount} 条`, tone: 'warn' },
  { label: '脱敏项', value: result.maskCount, tone: 'mask' },
  { label: '最终标准记录', value: result.uniqueCount, tone: 'primary' },
])

/* ---------- 列定义（与原始数据字段顺序一致，标注标准化单位） ---------- */
interface Col {
  key: string
  label: string
  width?: number
  num?: boolean
  mono?: boolean
  unit?: string
  tag?: 'vital' | 'recur'
}
const COLS: Col[] = [
  { key: 'patient_id', label: '患者编号(匿名)', width: 132, mono: true },
  { key: 'patient_name', label: '姓名(脱敏)', width: 110 },
  { key: 'gender', label: '性别', width: 78 },
  { key: 'birth_date', label: '出生日期', width: 118 },
  { key: 'age', label: '年龄', width: 78, num: true },
  { key: 'diagnosis_code', label: '诊断编码', width: 108, mono: true },
  { key: 'diagnosis_name', label: '诊断名称', width: 178 },
  { key: 'ajcc_stage', label: 'AJCC 分期', width: 100 },
  { key: 'cea', label: 'CEA', width: 92, num: true, unit: 'ng/mL' },
  { key: 'scc', label: 'SCC', width: 92, num: true, unit: 'ng/mL' },
  { key: 'ca199', label: 'CA199', width: 96, num: true, unit: 'ng/mL' },
  { key: 'cyfra211', label: 'CYFRA21-1', width: 104, num: true, unit: 'ng/mL' },
  { key: 'afp', label: 'AFP', width: 92, num: true, unit: 'ng/mL' },
  { key: 'vital_status', label: '生存状态', width: 100, tag: 'vital' },
  { key: 'recurrence', label: '复发', width: 90, tag: 'recur' },
  { key: 'followup_days', label: '随访天数', width: 100, num: true },
  { key: 'survival_days', label: '生存天数', width: 100, num: true },
]

/* ---------- 搜索 + 分页 ---------- */
const kw = ref('')
const page = ref(1)
const size = ref(20)
const filtered = computed(() => {
  const q = kw.value.trim().toLowerCase()
  if (!q) return result.rows
  return result.rows.filter((r) =>
    Object.values(r as unknown as Record<string, unknown>).some((v) => String(v).toLowerCase().includes(q)),
  )
})
const paged = computed(() => filtered.value.slice((page.value - 1) * size.value, page.value * size.value))

function fmt(v: unknown, c: Col): string {
  if (v == null || v === '') return '—'
  if (typeof v === 'number') return c.num ? (Number.isInteger(v) ? String(v) : v.toFixed(1)) : String(v)
  return String(v)
}

/* ---------- 导出 CSV（脱敏后标准数据） ---------- */
function exportStd() {
  const head = COLS.map((c) => c.label).join(',')
  const lines = result.rows.map((r) =>
    COLS.map((c) => {
      const v = (r as unknown as Record<string, unknown>)[c.key]
      const s = v == null ? '' : String(v)
      return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
    }).join(','),
  )
  const csv = '﻿' + [head, ...lines].join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = '标准数据_患者级.csv'
  a.click()
  URL.revokeObjectURL(url)
}

/* ---------- 字段级溯源抽屉：原始脏值 → 标准值 + 处理步骤 ---------- */
const drawer = ref(false)
const traceRow = ref<StdWideRow | null>(null)
function openTrace(row: StdWideRow) {
  traceRow.value = row
  drawer.value = true
}
const traceRows = computed(() => {
  const r = traceRow.value
  if (!r) return []
  return COLS.map((c) => {
    const rawVal = (r._raw as unknown as Record<string, unknown>)[c.key]
    const stdVal = (r as unknown as Record<string, unknown>)[c.key]
    return {
      field: c.key,
      label: c.label,
      raw: rawVal == null || rawVal === '' ? '（空）' : String(rawVal),
      std: stdVal == null || stdVal === '' ? '（空）' : String(stdVal),
      changed: String(rawVal) !== String(stdVal),
      stages: fieldStage[c.key] ?? [],
    }
  })
})
</script>

<template>
  <div class="sd">
    <!-- 指标 -->
    <div class="sd__stats">
      <span v-for="m in metrics" :key="m.label" class="sd__stat" :class="`sd__stat--${m.tone}`">
        {{ m.label }} <b>{{ m.value }}</b>
      </span>
    </div>

    <!-- 工具栏 -->
    <div class="sd__bar">
      <el-input v-model="kw" size="small" clearable placeholder="记录搜索" class="sd__kw" />
      <el-button size="small" type="primary" @click="exportStd">导出标准数据</el-button>
    </div>

    <!-- 最终标准数据 -->
    <el-table :data="paged" border size="small" class="sd__table" :max-height="460">
      <el-table-column type="index" :index="(i: number) => (page - 1) * size + i + 1" label="#" width="52" align="center" />
      <el-table-column
        v-for="c in COLS" :key="c.key" :prop="c.key" :label="c.label"
        :width="c.width" :align="c.num ? 'right' : 'left'" show-overflow-tooltip
      >
        <template v-if="c.tag === 'vital'" #default="{ row }">
          <el-tag size="small" :type="row.vital_status === '生存' ? 'success' : 'info'" effect="light">
            {{ row.vital_status }}
          </el-tag>
        </template>
        <template v-else-if="c.tag === 'recur'" #default="{ row }">
          <el-tag size="small" :type="row.recurrence === '无' ? 'success' : 'warning'" effect="light">
            {{ row.recurrence }}
          </el-tag>
        </template>
        <template v-else #default="{ row }">
          <span :class="{ 'sd__mono': c.mono, 'sd__num': c.num }">{{ fmt(row[c.key], c) }}</span>
          <span v-if="c.unit" class="sd__unit">{{ c.unit }}</span>
        </template>
      </el-table-column>

      <el-table-column label="操作" width="90" align="center" fixed="right">
        <template #default="{ row }">
          <el-button link type="primary" size="small" @click="openTrace(row)">溯源</el-button>
        </template>
      </el-table-column>

      <template #empty>暂无标准数据</template>
    </el-table>

    <div class="sd__pager">
      <el-pagination
        v-model:current-page="page" v-model:page-size="size"
        :page-sizes="[20, 50]" :total="filtered.length"
        layout="total, sizes, prev, pager, next" size="small"
      />
    </div>

    <!-- 字段级溯源抽屉 -->
    <el-drawer v-model="drawer" title="字段溯源 · 原始脏值 → 标准值" size="60%">
      <template v-if="traceRow">
        <div class="sd__trace-head">
          患者
          <b class="sd__mono">{{ traceRow._srcPatientId }}</b>
          <span class="sd__trace-mask">→ 脱敏后 {{ traceRow.patient_id }}</span>
          <span v-if="traceRow._dup > 0" class="sd__trace-dup">
            · 本患者原始 {{ traceRow._dup + 1 }} 条记录，去重保留 1 条
          </span>
        </div>
        <el-table :data="traceRows" border size="small" class="sd__trace">
          <el-table-column prop="label" label="字段" width="130" show-overflow-tooltip />
          <el-table-column label="原始值（治理前）" min-width="170" show-overflow-tooltip>
            <template #default="{ row }">
              <span class="sd__mono sd__raw">{{ row.raw }}</span>
            </template>
          </el-table-column>
          <el-table-column label="标准值（治理后）" min-width="150" show-overflow-tooltip>
            <template #default="{ row }">
              <span class="sd__mono sd__std">{{ row.std }}</span>
            </template>
          </el-table-column>
          <el-table-column label="处理步骤" min-width="150">
            <template #default="{ row }">
              <template v-if="row.changed">
                <span v-for="s in (row.stages as string[])" :key="s" class="sd__tag sd__tag--step">{{ s }}</span>
              </template>
              <span v-else class="sd__tag sd__tag--na">无变更</span>
            </template>
          </el-table-column>
        </el-table>
      </template>
    </el-drawer>
  </div>
</template>

<style scoped>
.sd__stats {
  display: flex;
  align-items: center;
  gap: 18px;
  flex-wrap: wrap;
  font-size: 12.5px;
  color: var(--pf-text-soft);
  margin-bottom: 10px;
}
.sd__stat b {
  margin-left: 4px;
  font-size: 15px;
  color: var(--pf-text);
}
.sd__stat--primary b { color: var(--pf-primary); }
.sd__stat--clean b { color: var(--pf-success); }
.sd__stat--warn b { color: var(--pf-warning); }
.sd__stat--mask b { color: #8b5cf6; }

.sd__bar {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
  flex-wrap: wrap;
}
.sd__kw {
  width: 200px;
}

.sd__table {
  font-size: 13px;
  border-radius: var(--pf-radius-sm);
  overflow: hidden;
}
.sd__table :deep(th.el-table__cell) {
  background: var(--pf-surface-2);
  color: var(--pf-text-soft);
  font-weight: 600;
}
.sd__mono {
  font-family: var(--font-mono, monospace);
  color: var(--pf-primary);
  font-weight: 600;
}
.sd__num {
  font-variant-numeric: tabular-nums;
}
.sd__unit {
  margin-left: 4px;
  font-size: 11px;
  color: var(--pf-text-faint);
}
.sd__pager {
  display: flex;
  justify-content: flex-end;
  margin-top: 10px;
}

.sd__trace-head {
  font-size: 13px;
  color: var(--pf-text-soft);
  margin-bottom: 10px;
}
.sd__trace-head b { color: var(--pf-text); }
.sd__trace-mask {
  margin-left: 8px;
  color: var(--pf-primary);
  font-weight: 600;
}
.sd__trace-dup {
  margin-left: 8px;
  color: var(--pf-warning);
}
.sd__trace {
  font-size: 13px;
  border-radius: var(--pf-radius-sm);
  overflow: hidden;
}
.sd__trace :deep(th.el-table__cell) {
  background: var(--pf-surface-2);
  color: var(--pf-text-soft);
  font-weight: 600;
}
.sd__raw { color: var(--pf-warning); }
.sd__std { color: var(--pf-success); }
.sd__tag {
  display: inline-block;
  margin: 1px 4px 1px 0;
  padding: 1px 8px;
  border-radius: 4px;
  font-size: 11.5px;
  font-weight: 600;
}
.sd__tag--step {
  color: var(--pf-success);
  background: rgba(16, 185, 129, 0.12);
}
.sd__tag--na {
  color: var(--pf-text-faint);
  background: var(--pf-surface-2);
}
</style>
