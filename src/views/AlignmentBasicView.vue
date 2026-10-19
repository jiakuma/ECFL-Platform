<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Check, Warning, Close, Link } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import {
  getAllAlignments,
  type AlignmentTask,
  type AlignRecord,
  type AlignReview,
  CATEGORY_ORDER,
  type AlignCategory,
} from '@/mock/patients'
import type { AlignRecordStatus } from '@/mock/alignRules'

const route = useRoute()
const router = useRouter()

// 本期仅处理「患者基本信息」模态的对齐任务；支持 ?task= 指定单条任务（从多模态资源跳转）
const allTasks = computed<AlignmentTask[]>(() => {
  const base = getAllAlignments().filter((t) => t.modality === '患者基本信息')
  const q = route.query.task
  if (typeof q === 'string' && q) {
    const hit = base.find((t) => t.id === q)
    if (hit) return [hit]
  }
  return base
})

// 当前是否为单任务视图（来自资源库跳转）
const activeTaskId = computed(() => {
  const q = route.query.task
  return typeof q === 'string' && q ? q : ''
})
function viewAllTasks() {
  router.push({ path: '/dataset/align/basic' })
}

const allRecords = computed<AlignRecord[]>(() => allTasks.value.flatMap((t) => t.records ?? []))

// —— 字段级溯源记录按一级分类分组（与用户给定字段分类一致）——
const grouped = computed<{ cat: AlignCategory; rows: AlignRecord[] }[]>(() => {
  const m = new Map<AlignCategory, AlignRecord[]>()
  for (const r of allRecords.value) {
    if (!m.has(r.category)) m.set(r.category, [])
    m.get(r.category)!.push(r)
  }
  return CATEGORY_ORDER.filter((c) => m.has(c)).map((c) => ({ cat: c, rows: m.get(c)! }))
})

function rowKey(r: AlignRecord): string {
  return [r.category, r.sourceOrg, r.sourceField, r.standardField].join('|')
}

// —— 概览：来源中心 / 记录数 / 进度 ——
const centers = computed(() => {
  const map = new Map<string, { total: number; ok: number }>()
  for (const r of allRecords.value) {
    const cur = map.get(r.sourceOrg) ?? { total: 0, ok: 0 }
    cur.total += 1
    if (r.status === '对齐成功') cur.ok += 1
    map.set(r.sourceOrg, cur)
  }
  return [...map.entries()].map(([org, v]) => ({
    org,
    total: v.total,
    ok: v.ok,
    pending: v.total - v.ok,
    pct: v.total ? Math.round((v.ok / v.total) * 100) : 0,
  }))
})

// —— 质量统计 ——
const statusCount = computed(() => {
  const c = { ok: 0, confirm: 0, fail: 0 }
  for (const r of allRecords.value) {
    if (r.status === '对齐成功') c.ok++
    else if (r.status === '待人工确认') c.confirm++
    else c.fail++
  }
  return c
})
const total = computed(() => allRecords.value.length || 1)
const pct = (n: number) => Math.round((n / total.value) * 100)

const statusColor: Record<AlignRecordStatus, string> = {
  对齐成功: '#10b981',
  待人工确认: '#f59e0b',
  对齐失败: '#ef4444',
}
const dimColor: Record<string, string> = { error: '#ef4444', warn: '#f59e0b' }

// —— 字段对齐详情（可展开规则依据）——
const expanded = reactive(new Set<string>())
function toggle(key: string) {
  if (expanded.has(key)) expanded.delete(key)
  else expanded.add(key)
}
function isOpen(r: AlignRecord): boolean {
  return expanded.has(rowKey(r))
}

// —— 异常数据列表 ——
const anomalies = computed(() => {
  const list: { kind: string; field: string; org: string; detail: string }[] = []
  for (const t of allTasks.value) {
    for (const c of t.conflicts ?? []) {
      list.push({ kind: '跨中心冲突', field: c.field, org: c.values.map((v) => v.org).join(' / '), detail: c.note })
    }
  }
  for (const r of allRecords.value) {
    if (r.status !== '对齐成功') {
      list.push({
        kind: r.status === '对齐失败' ? '转换失败' : '待人工确认',
        field: r.standardField,
        org: r.sourceOrg,
        detail: r.issue ?? '需人工介入',
      })
    }
  }
  return list
})

// —— 人工确认 ——
const reviews = computed(() => allTasks.value.filter((t) => t.review?.open))
// —— 操作记录（聚合所有任务的确认留痕）——
const allLogs = computed(() =>
  allTasks.value.flatMap((t) => (t.review?.logs ?? []).map((l) => ({ taskId: t.id, ...l }))),
)
const confirmCandidates = reactive<Record<string, string>>({})
const confirmNote = reactive<Record<string, string>>({})

function resolveReview(task: AlignmentTask, action: 'confirmed' | 'rejected') {
  const review = task.review as AlignReview
  const cand = confirmCandidates[task.id]
  const note = confirmNote[task.id] ?? ''
  if (action === 'confirmed' && !cand) {
    ElMessage.warning('请先选择确认后的统一主索引。')
    return
  }
  review.open = false
  review.resolution = action
  review.resolutionNote = action === 'confirmed' ? `确认合并至 ${cand}` : '退回补充原始资料'
  review.logs.push({
    time: new Date().toISOString().slice(0, 16).replace('T', ' '),
    operator: '当前治理员',
    action: action === 'confirmed' ? '人工确认合并' : '退回补充',
    note: note || (action === 'confirmed' ? `选定 PMI=${cand}` : ''),
  })
  // 仅更新「对齐结果」，不改动「原始值」
  if (action === 'confirmed' && cand) {
    for (const r of task.records ?? []) {
      if (r.ruleId === 'MPI_MAP') {
        r.standardValue = cand
        r.status = '对齐成功'
        r.code = cand
        r.issue = undefined
      }
    }
  }
  ElMessage.success(action === 'confirmed' ? '已确认合并，原始数据未改动，已留痕。' : '已退回补充原始资料。')
}
</script>

<template>
  <div class="ab">
    <header class="ab__head">
      <h1 class="ab__title">患者基本信息对齐</h1>
      <span v-if="activeTaskId" class="ab__ctx">
        当前任务 <b>{{ activeTaskId }}</b> · {{ allTasks[0]?.resourceTitle }}
        <button class="ab__ctx-clear" @click="viewAllTasks">查看全部</button>
      </span>
    </header>

    <!-- 1. 数据概览 -->
    <section class="ab__sec">
      <div class="ab-ov">
        <div class="ab-stat"><span class="n">{{ allRecords.length }}</span><span class="l">字段记录</span></div>
        <div class="ab-stat ok"><span class="n">{{ statusCount.ok }}</span><span class="l">对齐成功</span></div>
        <div class="ab-stat pend"><span class="n">{{ statusCount.confirm }}</span><span class="l">待人工确认</span></div>
        <div class="ab-stat fail"><span class="n">{{ statusCount.fail }}</span><span class="l">对齐失败</span></div>
      </div>
      <div class="ab-centers">
        <div v-for="c in centers" :key="c.org" class="ab-center">
          <div class="ab-center__top"><span>{{ c.org }}</span><span>{{ c.pct }}%</span></div>
          <div class="ab-center__bar"><span :style="{ width: c.pct + '%' }" /></div>
          <div class="ab-center__n">记录 {{ c.total }} · 成功 {{ c.ok }} · 待处理 {{ c.pending }}</div>
        </div>
      </div>
    </section>

    <!-- 2. 核心业务：字段对齐详情 -->
    <section class="ab__sec">
      <h2 class="ab__sec-t">字段对齐详情</h2>
      <div class="ab-tbl pf-card">
        <template v-for="g in grouped" :key="g.cat">
          <div class="ab-tbl__cat">{{ g.cat }}</div>
          <div class="ab-tbl__h">
            <span>来源中心</span><span>原始字段</span><span>原始值</span><span>对齐规则</span><span>标准值</span><span>状态</span>
          </div>
          <div v-for="r in g.rows" :key="rowKey(r)" class="ab-tbl__row">
            <div class="ab-tbl__cell">{{ r.sourceOrg }}</div>
            <div class="ab-tbl__cell">
              <div class="ab-field">{{ r.sourceField }}</div>
              <div class="ab-type">{{ r.sourceType }} → {{ r.standardField }}</div>
            </div>
            <div class="ab-tbl__cell ab-raw">{{ r.sourceValue || '—' }}</div>
            <div class="ab-tbl__cell">
              <button class="ab-rule" @click="toggle(rowKey(r))">
                <el-icon><Link /></el-icon>{{ r.ruleId }} · {{ r.ruleVersion }}
              </button>
            </div>
            <div class="ab-tbl__cell ab-std">
              {{ r.standardValue || '—' }}
              <span v-if="r.code" class="ab-code">{{ r.code }}</span>
            </div>
            <div class="ab-tbl__cell">
              <span class="ab-badge" :style="{ color: statusColor[r.status], borderColor: statusColor[r.status] + '55', background: statusColor[r.status] + '14' }">
                {{ r.status }}
              </span>
            </div>
            <div v-if="isOpen(r)" class="ab-tbl__rule">
              <div><b>标准依据：</b>{{ r.basis }}</div>
              <div v-if="r.formula"><b>计算过程：</b>{{ r.formula }}</div>
              <div v-if="r.issue"><b>说明：</b>{{ r.issue }}</div>
              <div><b>处理时间：</b>{{ r.processTime }} · {{ r.operator }}</div>
            </div>
          </div>
        </template>
      </div>
    </section>

    <!-- 3. 异常处理（问题 + 原因 + 操作入口） -->
    <section class="ab__sec">
      <h2 class="ab__sec-t">异常处理</h2>
      <div v-if="reviews.length" class="ab-reviews">
        <article v-for="t in reviews" :key="t.id" class="ab-review pf-card">
          <header class="ab-review__head">
            <span class="ab-review__id">{{ t.id }}</span>
            <span class="ab-review__title">{{ t.resourceTitle }}</span>
            <span class="ab-review__status">待确认</span>
          </header>
          <p class="ab-review__reason"><el-icon><Warning /></el-icon>{{ t.review?.reason }}</p>
          <div class="ab-review__pick">
            <span class="ab-review__label">确认后的统一主索引：</span>
            <el-radio-group v-model="confirmCandidates[t.id]">
              <el-radio v-for="c in t.review?.candidates ?? []" :key="c" :value="c">{{ c }}</el-radio>
            </el-radio-group>
          </div>
          <el-input v-model="confirmNote[t.id]" type="textarea" :rows="2" placeholder="确认/退回说明（留痕，可选）" class="ab-review__note" />
          <div class="ab-review__acts">
            <el-button type="primary" :icon="Check" @click="resolveReview(t, 'confirmed')">确认合并</el-button>
            <el-button :icon="Close" @click="resolveReview(t, 'rejected')">退回补充</el-button>
          </div>
        </article>
      </div>
      <div v-if="anomalies.length" class="ab-anom-tbl pf-card">
        <div class="ab-anom__h"><span>类型</span><span>字段</span><span>来源</span><span>原因</span></div>
        <div v-for="(a, i) in anomalies" :key="i" class="ab-anom__row">
          <span class="ab-anom__kind" :class="a.kind === '跨中心冲突' ? 'is-conflict' : a.kind === '转换失败' ? 'is-fail' : 'is-pend'">{{ a.kind }}</span>
          <span class="ab-anom__field"><b>{{ a.field }}</b></span>
          <span class="ab-anom__org">{{ a.org }}</span>
          <span class="ab-anom__detail">{{ a.detail }}</span>
        </div>
      </div>
      <div v-if="!reviews.length && !anomalies.length" class="ab-empty">无异常，全部字段已对齐成功。</div>
    </section>

    <!-- 4. 操作记录 -->
    <section class="ab__sec">
      <h2 class="ab__sec-t">操作记录</h2>
      <div v-if="allLogs.length" class="ab-logs pf-card">
        <div class="ab-log__h"><span>时间</span><span>任务</span><span>操作</span><span>说明</span></div>
        <div v-for="(l, i) in allLogs" :key="i" class="ab-log__row">
          <span class="ab-log__t">{{ l.time }}</span>
          <span class="ab-log__id">{{ l.taskId }}</span>
          <span class="ab-log__a">{{ l.action }}</span>
          <span class="ab-log__n">{{ l.note }}</span>
        </div>
      </div>
      <div v-else class="ab-empty">暂无操作记录。</div>
    </section>
  </div>
</template>

<style scoped>
.ab {
  padding: 4px 0 36px;
}
.ab__head {
  margin-bottom: 16px;
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
}
.ab__title {
  position: relative;
  font-size: 20px;
  font-weight: 800;
  letter-spacing: 0.04em;
  padding-left: 14px;
  margin: 0;
  color: var(--pf-text);
}
.ab__title::before {
  content: '';
  position: absolute;
  left: 0;
  top: 3px;
  bottom: 3px;
  width: 4px;
  border-radius: 2px;
  background: var(--pf-primary);
}
.ab__ctx {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 12.5px;
  color: var(--pf-text-soft);
  background: var(--pf-surface-2);
  border: 1px solid var(--pf-border);
  border-radius: 999px;
  padding: 3px 6px 3px 12px;
}
.ab__ctx b {
  color: var(--pf-primary);
  font-family: var(--font-mono, monospace);
}
.ab__ctx-clear {
  border: 1px solid var(--pf-border-strong);
  background: var(--pf-surface);
  color: var(--pf-primary);
  font-size: 12px;
  font-weight: 600;
  padding: 2px 10px;
  border-radius: 999px;
  cursor: pointer;
}
.ab__ctx-clear:hover {
  border-color: var(--pf-primary);
}
.ab__sec {
  margin-top: 18px;
}
.ab__sec-t {
  font-size: 15px;
  font-weight: 700;
  color: var(--pf-text);
  margin: 0 0 12px;
  padding-left: 10px;
  border-left: 3px solid var(--pf-primary);
}

/* 数据概览 */
.ab-ov {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
  margin-bottom: 12px;
}
.ab-stat {
  background: var(--pf-surface);
  border: 1px solid var(--pf-border);
  border-radius: 8px;
  padding: 12px 14px;
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.ab-stat .n {
  font-size: 24px;
  font-weight: 800;
  line-height: 1.1;
  color: var(--pf-text);
}
.ab-stat .l {
  font-size: 12px;
  color: var(--pf-text-faint);
}
.ab-stat.ok .n { color: var(--pf-success); }
.ab-stat.pend .n { color: var(--pf-warning); }
.ab-stat.fail .n { color: #ef4444; }

.ab-centers {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 10px;
}
.ab-center {
  background: var(--pf-surface-2);
  border: 1px solid var(--pf-border);
  border-radius: 8px;
  padding: 10px 12px;
}
.ab-center__top {
  display: flex;
  justify-content: space-between;
  font-size: 13px;
  font-weight: 700;
  color: var(--pf-text);
  margin-bottom: 6px;
}
.ab-center__bar {
  height: 5px;
  border-radius: 3px;
  background: var(--pf-border);
  overflow: hidden;
}
.ab-center__bar span {
  display: block;
  height: 100%;
  background: var(--pf-success);
  border-radius: 3px;
}
.ab-center__n {
  margin-top: 6px;
  font-size: 12px;
  color: var(--pf-text-faint);
}

/* 字段对齐表 */
.ab-tbl {
  border-radius: 12px;
  overflow: hidden;
}
.ab-tbl__h,
.ab-tbl__row {
  display: grid;
  grid-template-columns: 1.2fr 1.6fr 1.4fr 1.6fr 1.6fr 0.9fr;
  align-items: center;
  gap: 10px;
  padding: 12px 16px;
}
.ab-tbl__cat {
  grid-column: 1 / -1;
  padding: 10px 16px 8px;
  margin-top: 6px;
  font-size: 13px;
  font-weight: 800;
  color: var(--pf-primary);
  letter-spacing: 0.05em;
  border-bottom: 2px solid var(--pf-border);
}
.ab-tbl__cat:first-child { margin-top: 0; }
.ab-tbl__h {
  background: var(--pf-surface-2);
  font-size: 12px;
  font-weight: 700;
  color: var(--pf-text-faint);
  border-bottom: 1px solid var(--pf-border);
}
.ab-tbl__row {
  border-bottom: 1px solid var(--pf-border);
  font-size: 13px;
}
.ab-tbl__row:last-child { border-bottom: none; }
.ab-field { font-weight: 700; color: var(--pf-text); }
.ab-type { font-size: 11.5px; color: var(--pf-text-faint); margin-top: 2px; }
.ab-raw { color: var(--pf-text-soft); word-break: break-all; }
.ab-std { color: var(--pf-text); font-weight: 600; word-break: break-all; }
.ab-code {
  margin-left: 6px;
  font-family: var(--font-mono, monospace);
  font-size: 11px;
  color: var(--pf-primary);
  background: rgba(99, 102, 241, 0.12);
  padding: 0 6px;
  border-radius: 4px;
}
.ab-rule {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  border: 1px solid var(--pf-border-strong);
  background: var(--pf-surface);
  color: var(--pf-primary);
  font-size: 12px;
  font-weight: 600;
  padding: 4px 9px;
  border-radius: 999px;
  cursor: pointer;
}
.ab-badge {
  font-size: 12px;
  font-weight: 700;
  padding: 3px 10px;
  border-radius: 999px;
  border: 1px solid;
}
.ab-tbl__rule {
  grid-column: 1 / -1;
  background: var(--pf-surface-2);
  border-radius: 8px;
  padding: 12px 14px;
  margin: 0 4px 8px;
  font-size: 12.5px;
  color: var(--pf-text-soft);
  line-height: 1.7;
}

/* 异常表格 */
.ab-anom-tbl {
  border-radius: 10px;
  overflow: hidden;
}
.ab-anom__h,
.ab-anom__row {
  display: grid;
  grid-template-columns: 1fr 1.4fr 1.6fr 3fr;
  align-items: center;
  gap: 10px;
  padding: 10px 14px;
}
.ab-anom__h {
  background: var(--pf-surface-2);
  font-size: 12px;
  font-weight: 700;
  color: var(--pf-text-faint);
  border-bottom: 1px solid var(--pf-border);
}
.ab-anom__row {
  border-bottom: 1px solid var(--pf-border);
  font-size: 13px;
}
.ab-anom__row:last-child { border-bottom: none; }
.ab-anom__kind {
  justify-self: start;
  font-size: 11.5px;
  font-weight: 700;
  padding: 2px 9px;
  border-radius: 999px;
}
.ab-anom__kind.is-conflict { color: #ef4444; background: #fdeaea; }
.ab-anom__kind.is-fail { color: #f43f5e; background: #fdeef0; }
.ab-anom__kind.is-pend { color: #f59e0b; background: #fef3e2; }
.ab-anom__field b { font-weight: 700; color: var(--pf-text); }
.ab-anom__org { color: var(--pf-text-faint); font-size: 12px; }
.ab-anom__detail { color: var(--pf-text-soft); line-height: 1.5; }

/* 操作记录 */
.ab-logs {
  border-radius: 10px;
  overflow: hidden;
}
.ab-log__h,
.ab-log__row {
  display: grid;
  grid-template-columns: 1.4fr 1fr 1.2fr 3fr;
  align-items: center;
  gap: 10px;
  padding: 10px 14px;
}
.ab-log__h {
  background: var(--pf-surface-2);
  font-size: 12px;
  font-weight: 700;
  color: var(--pf-text-faint);
  border-bottom: 1px solid var(--pf-border);
}
.ab-log__row {
  border-bottom: 1px solid var(--pf-border);
  font-size: 13px;
}
.ab-log__row:last-child { border-bottom: none; }
.ab-log__t { color: var(--pf-text-faint); font-family: var(--font-mono, monospace); font-size: 12px; }
.ab-log__id { color: var(--pf-text-faint); font-family: var(--font-mono, monospace); font-size: 12px; }
.ab-log__a { font-weight: 600; color: var(--pf-text); }
.ab-log__n { color: var(--pf-text-soft); }

/* 人工确认 */
.ab-reviews {
  display: flex;
  flex-direction: column;
  gap: 14px;
}
.ab-review {
  padding: 16px;
  border-radius: 12px;
  border-left: 3px solid var(--pf-warning);
}
.ab-review__head {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
}
.ab-review__id {
  font-family: var(--font-mono, monospace);
  font-size: 12px;
  color: var(--pf-text-faint);
}
.ab-review__title {
  font-weight: 700;
  color: var(--pf-text);
  font-size: 14px;
}
.ab-review__status {
  margin-left: auto;
  font-size: 12px;
  font-weight: 700;
  color: var(--pf-warning);
  background: #fef3e2;
  padding: 2px 9px;
  border-radius: 999px;
}
.ab-review__reason {
  display: flex;
  align-items: flex-start;
  gap: 6px;
  font-size: 13px;
  color: var(--pf-text-soft);
  line-height: 1.6;
  margin: 0 0 12px;
}
.ab-review__reason .el-icon { color: var(--pf-warning); margin-top: 2px; }
.ab-review__pick {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
  flex-wrap: wrap;
}
.ab-review__label {
  font-size: 13px;
  color: var(--pf-text-soft);
  font-weight: 600;
}
.ab-review__note { margin-bottom: 10px; }
.ab-review__acts {
  display: flex;
  gap: 10px;
}

.ab-empty {
  text-align: center;
  color: var(--pf-text-faint);
  padding: 18px 0;
  font-size: 13px;
}

@media (max-width: 720px) {
  .ab-tbl__h { display: none; }
  .ab-tbl__row { grid-template-columns: 1fr 1fr; }
  .ab-ov { grid-template-columns: 1fr 1fr; }
}
</style>
