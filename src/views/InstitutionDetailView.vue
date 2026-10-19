<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Cpu, Grid, MagicStick, Box, Connection, Platform } from '@element-plus/icons-vue'
import type { FormInstance, FormRules } from 'element-plus'
import { useOrgStore } from '@/store/org'
import { institutionInfo } from '@/mock/institutions'
import { orgInfo } from '@/mock/organizations'
import { emptyNode, useNodeStore } from '@/store/nodes'
import type { ComputeNode, NetworkType } from '@/mock/computeNodes'

const route = useRoute()
const org = useOrgStore()
const nodeStore = useNodeStore()

const orgName = computed(() => String(route.params.org ?? ''))
const info = computed(() => institutionInfo(orgName.value))
const orgMeta = computed(() => orgInfo(orgName.value))
const nodes = computed<ComputeNode[]>(() => nodeStore.byOrg(orgName.value))
const summary = computed(() => {
  const list = nodes.value
  return {
    total: list.length,
    online: list.filter((n) => n.status === '在线').length,
    offline: list.filter((n) => n.status === '离线').length,
    gpuTotal: list.reduce((n, x) => n + x.gpuCount, 0),
    gpuMemoryTotal: list.reduce((n, x) => n + x.gpuMemoryTotal, 0),
    cpuCores: list.reduce((n, x) => n + x.cpuCores, 0),
  }
})

/** 网络方式 → 标签色调 */
const networkType: Record<NetworkType, 'success' | 'warning' | 'primary'> = {
  专线: 'primary',
  VPN: 'warning',
  内网: 'success',
}

/** 容量文本 → GB（兼容 "8 TB NVMe SSD" / "3.4 TB" / "512 GB"） */
function toGB(v: string): number {
  const m = v.trim().match(/^([\d.]+)\s*(TB|GB)/i)
  if (!m) return 0
  return m[2].toUpperCase() === 'TB' ? Number(m[1]) * 1024 : Number(m[1])
}

/** 存储可用占比（%） */
function storagePct(n: ComputeNode): number {
  const total = toGB(n.storageTotal)
  if (!total) return 0
  return Math.max(0, Math.min(100, Math.round((toGB(n.storageFree) / total) * 100)))
}

/** 内存代次（DDR4 / DDR5 …） */
function memType(v: string): string {
  const m = v.match(/DDR\s*\d/i)
  return m ? m[0].replace(/\s/g, '').toUpperCase() : '已配置容量'
}

/* ---------- 新增 / 编辑 ---------- */
const dialogVisible = ref(false)
const saving = ref(false)
const formRef = ref<FormInstance>()
const editingId = ref('')
const form = reactive<ComputeNode>(emptyNode(''))

const rules: FormRules = {
  name: [{ required: true, message: '请输入节点名称', trigger: 'blur' }],
  model: [{ required: true, message: '请输入服务器型号', trigger: 'blur' }],
  cpu: [{ required: true, message: '请输入 CPU 型号', trigger: 'blur' }],
  cpuCores: [{ required: true, message: '请输入核心数', trigger: 'blur' }],
  memory: [{ required: true, message: '请输入内存容量', trigger: 'blur' }],
  storageTotal: [{ required: true, message: '请输入存储总容量', trigger: 'blur' }],
  network: [{ required: true, message: '请选择网络连接方式', trigger: 'change' }],
  bandwidth: [{ required: true, message: '请输入标称带宽', trigger: 'blur' }],
  crossBandwidth: [{ required: true, message: '请输入跨机构可用带宽', trigger: 'blur' }],
  status: [{ required: true, message: '请选择节点状态', trigger: 'change' }],
}

function openAdd() {
  Object.assign(form, emptyNode(orgName.value))
  editingId.value = ''
  dialogVisible.value = true
}

function openEdit(n: ComputeNode) {
  Object.assign(form, { ...n })
  editingId.value = n.id
  dialogVisible.value = true
}

async function save() {
  if (!formRef.value) return
  await formRef.value.validate(async (valid) => {
    if (!valid) return
    saving.value = true
    if (editingId.value) {
      nodeStore.update({ ...form })
      ElMessage.success(`已更新「${form.name}」`)
    } else {
      const item = nodeStore.add({ ...form })
      ElMessage.success(`已新增「${item.name}」（${item.id}）`)
    }
    saving.value = false
    dialogVisible.value = false
  })
}

function remove(n: ComputeNode) {
  ElMessageBox.confirm(`确定删除「${n.name}」（${n.id}）吗？`, '删除确认', {
    confirmButtonText: '删除',
    cancelButtonText: '取消',
    type: 'warning',
  })
    .then(() => {
      nodeStore.remove(n.id)
      ElMessage.success(`已删除「${n.name}」`)
    })
    .catch(() => {})
}
</script>

<template>
  <div class="id">
    <!-- ============ 页头：机构标识 ============ -->
    <header class="id__head">
      <div class="id__title">
        <img v-if="info" class="id__avatar" :src="info.avatar" :alt="orgName" />
        <div class="id__id">
          <h1 class="id__name">
            {{ orgName }}
            <span v-if="info?.lead" class="id__lead">牵头医院</span>
          </h1>
          <p v-if="info && orgMeta" class="id__sub">
            {{ orgMeta.level }} · 联邦节点 {{ orgMeta.nodeCode }} · 接入状态
            <span class="id__dot" :class="info.status === '已接入' ? 'is-ok' : 'is-sync'" />
            {{ info.status }}
          </p>
        </div>
      </div>
      <span class="id__scope">{{ org.isPlatformAdmin ? '平台管理员视图' : '机构管理员视图' }}</span>
    </header>

    <!-- ============ 节点管理 ============ -->
    <section class="id__block">
      <div class="id__block-head">
        <h2 class="id__block-title">节点管理</h2>
        <el-button size="small" type="primary" :icon="Plus" @click="openAdd">新增节点</el-button>
      </div>
      <div class="id__nodes">
        <div class="id__nodes-bar">
          <span class="id__metric">节点总数 <b>{{ summary.total }}</b></span>
          <span class="id__metric is-ok">在线 <b>{{ summary.online }}</b></span>
          <span class="id__metric is-off">离线 <b>{{ summary.offline }}</b></span>
          <span class="id__spacer" />
          <span class="id__metric">CPU 核心合计 <b>{{ summary.cpuCores }}</b></span>
          <span class="id__metric">GPU 合计 <b>{{ summary.gpuTotal }} 卡 / {{ summary.gpuMemoryTotal }} GB</b></span>
        </div>

        <div class="id__grid">
          <article v-for="n in nodes" :key="n.id" class="node" :class="{ 'node--off': n.status === '离线' }">
            <header class="node__head">
              <span class="node__icon" :class="n.status === '在线' ? 'is-on' : 'is-off'">
                <el-icon size="18"><Platform /></el-icon>
              </span>
              <div class="node__id">
                <h3 class="node__name">{{ n.name }}</h3>
                <p class="node__code">{{ n.id }} · {{ n.model || '未填写型号' }}</p>
              </div>
              <div class="node__acts">
                <span class="node__status" :class="n.status === '在线' ? 'is-on' : 'is-off'">
                  <span class="node__dot" /> {{ n.status }}
                </span>
                <el-button link type="primary" size="small" @click="openEdit(n)">编辑</el-button>
                <el-button link type="danger" size="small" @click="remove(n)">删除</el-button>
              </div>
            </header>

            <div class="node__tiles">
              <div class="tile">
                <div class="tile__label"><el-icon size="13"><Cpu /></el-icon>CPU</div>
                <p class="tile__value">{{ n.cpu }}</p>
                <p class="tile__extra">{{ n.cpuCores }} 核</p>
              </div>

              <div class="tile">
                <div class="tile__label"><el-icon size="13"><Grid /></el-icon>内存</div>
                <p class="tile__value">{{ n.memory }}</p>
                <p class="tile__extra">{{ memType(n.memory) }}</p>
              </div>

              <div class="tile" :class="{ 'tile--muted': !n.gpuCount }">
                <div class="tile__label"><el-icon size="13"><MagicStick /></el-icon>GPU</div>
                <template v-if="n.gpuCount">
                  <p class="tile__value">{{ n.gpuModel }} × {{ n.gpuCount }}</p>
                  <p class="tile__extra">单卡 {{ n.gpuMemory }} GB · 总显存 <b>{{ n.gpuMemoryTotal }} GB</b></p>
                </template>
                <template v-else>
                  <p class="tile__value tile__value--na">无 GPU</p>
                  <p class="tile__extra">仅参与数据预处理</p>
                </template>
              </div>

              <div class="tile">
                <div class="tile__label"><el-icon size="13"><Box /></el-icon>存储</div>
                <p class="tile__value">
                  {{ n.storageFree || '—' }}<span class="tile__unit"> / {{ n.storageTotal }}</span>
                </p>
                <div class="tile__bar" :class="{ 'is-low': storagePct(n) <= 15 }">
                  <span :style="{ width: storagePct(n) + '%' }" />
                </div>
                <p class="tile__extra">可用 {{ storagePct(n) }}%</p>
              </div>
            </div>

            <footer class="node__net">
              <el-tag size="small" :type="networkType[n.network]" effect="light" round>{{ n.network }}</el-tag>
              <span class="node__net-item">标称带宽 <b>{{ n.bandwidth }} Mbps</b></span>
              <span class="node__net-sep" />
              <span class="node__net-item">跨机构可用 <b>{{ n.crossBandwidth }} Mbps</b></span>
            </footer>
          </article>
        </div>

        <p v-if="!nodes.length" class="id__empty">暂无计算节点，点击右上角「新增节点」添加。</p>
      </div>
    </section>

    <!-- ============ 新增 / 编辑节点 ============ -->
    <el-dialog
      v-model="dialogVisible"
      :title="editingId ? `编辑节点 ${editingId}` : '新增节点'"
      width="620px"
      top="8vh"
      append-to-body
    >
      <el-form ref="formRef" :model="form" :rules="rules" label-width="110px" class="node-form">
        <div class="node-form__row">
          <el-form-item label="节点名称" prop="name">
            <el-input v-model="form.name" placeholder="如：训练计算节点" />
          </el-form-item>
          <el-form-item label="服务器型号" prop="model">
            <el-input v-model="form.model" placeholder="如：Dell PowerEdge R750" />
          </el-form-item>
        </div>
        <div class="node-form__row">
          <el-form-item label="CPU 型号" prop="cpu">
            <el-input v-model="form.cpu" placeholder="如：Intel Xeon Gold 6338" />
          </el-form-item>
          <el-form-item label="CPU 核心数" prop="cpuCores">
            <el-input-number v-model="form.cpuCores" :min="0" :max="512" class="node-form__num" />
          </el-form-item>
        </div>
        <div class="node-form__row">
          <el-form-item label="内存容量" prop="memory">
            <el-input v-model="form.memory" placeholder="如：256 GB DDR4" />
          </el-form-item>
          <el-form-item label="节点状态" prop="status">
            <el-select v-model="form.status" class="node-form__num">
              <el-option label="在线" value="在线" />
              <el-option label="离线" value="离线" />
            </el-select>
          </el-form-item>
        </div>

        <div class="node-form__row">
          <el-form-item label="GPU 数量" prop="gpuCount">
            <el-input-number v-model="form.gpuCount" :min="0" :max="16" class="node-form__num" />
          </el-form-item>
          <el-form-item label="GPU 型号" prop="gpuModel">
            <el-input v-model="form.gpuModel" :disabled="!form.gpuCount" placeholder="数量为 0 即无 GPU" />
          </el-form-item>
        </div>
        <div class="node-form__row">
          <el-form-item label="单卡显存" prop="gpuMemory">
            <el-input-number v-model="form.gpuMemory" :min="0" :max="256" class="node-form__num">
              <template #append>GB</template>
            </el-input-number>
          </el-form-item>
          <el-form-item label="总显存">
            <span class="node-form__auto">{{ form.gpuCount * form.gpuMemory }} GB</span>
          </el-form-item>
        </div>

        <div class="node-form__row">
          <el-form-item label="存储总容量" prop="storageTotal">
            <el-input v-model="form.storageTotal" placeholder="如：8 TB NVMe SSD" />
          </el-form-item>
          <el-form-item label="存储可用" prop="storageFree">
            <el-input v-model="form.storageFree" placeholder="如：3.4 TB" />
          </el-form-item>
        </div>
        <div class="node-form__row">
          <el-form-item label="网络方式" prop="network">
            <el-select v-model="form.network" class="node-form__num">
              <el-option label="内网" value="内网" />
              <el-option label="VPN" value="VPN" />
              <el-option label="专线" value="专线" />
            </el-select>
          </el-form-item>
          <el-form-item label="标称带宽" prop="bandwidth">
            <el-input-number v-model="form.bandwidth" :min="0" :max="100000" class="node-form__num">
              <template #append>Mbps</template>
            </el-input-number>
          </el-form-item>
        </div>
        <el-form-item label="跨机构可用带宽" prop="crossBandwidth">
          <el-input-number v-model="form.crossBandwidth" :min="0" :max="100000" class="node-form__num">
            <template #append>Mbps</template>
          </el-input-number>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="save">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.id__head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 14px;
}
.id__title {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
}
.id__avatar {
  width: 44px;
  height: 44px;
  flex: none;
  border-radius: 10px;
  object-fit: cover;
  background: var(--pf-bg-soft);
}
.id__name {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 18px;
  font-weight: 700;
  color: var(--pf-text);
}
.id__lead {
  padding: 1px 8px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 600;
  color: var(--pf-primary);
  background: var(--pf-primary-soft, rgba(99, 102, 241, 0.1));
}
.id__sub {
  display: flex;
  align-items: center;
  gap: 5px;
  margin: 4px 0 0;
  font-size: 12.5px;
  color: var(--pf-text-soft);
}
.id__dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
}
.id__dot.is-ok { background: var(--pf-success); }
.id__dot.is-sync { background: var(--pf-warning); }
.id__scope {
  flex: none;
  padding: 3px 10px;
  border: 1px solid var(--pf-border-strong);
  border-radius: 999px;
  font-size: 12px;
  font-weight: 600;
  color: var(--pf-text-soft);
  background: var(--pf-surface);
}
.id__block-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 10px;
}
.id__block-title {
  font-size: 14px;
  font-weight: 700;
  color: var(--pf-text);
  margin: 0;
}
.id__empty {
  margin: 0;
  padding: 28px;
  text-align: center;
  font-size: 13px;
  color: var(--pf-text-faint);
  background: var(--pf-surface);
  border: 1px dashed var(--pf-border-strong);
  border-radius: var(--pf-radius-sm);
}

/* ---------- 计算节点 ---------- */
.id__nodes-bar {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 16px;
  padding: 10px 14px;
  margin-bottom: 14px;
  background: var(--pf-surface);
  border: 1px solid var(--pf-border);
  border-radius: var(--pf-radius-sm);
  font-size: 13px;
  color: var(--pf-text-soft);
}
.id__nodes-bar b {
  color: var(--pf-text);
  font-weight: 700;
}
.id__metric.is-ok b { color: var(--pf-success); }
.id__metric.is-off b { color: var(--pf-text-faint); }
.id__spacer { flex: 1; }
.id__grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 14px;
}
@media (max-width: 1100px) {
  .id__grid { grid-template-columns: 1fr; }
}

.node {
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 16px;
  background: var(--pf-surface);
  border: 1px solid var(--pf-border);
  border-radius: var(--pf-radius-sm);
  box-shadow: var(--pf-shadow-sm);
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}
.node:hover {
  border-color: var(--pf-primary);
  box-shadow: var(--pf-shadow);
}
.node--off {
  background: var(--pf-surface-2);
}
.node__head {
  display: flex;
  align-items: center;
  gap: 10px;
}
.node__icon {
  width: 36px;
  height: 36px;
  flex: none;
  display: grid;
  place-items: center;
  border-radius: 9px;
  color: #fff;
}
.node__icon.is-on {
  background: var(--pf-gradient);
}
.node__icon.is-off {
  background: var(--pf-border-strong);
}
.node__id {
  min-width: 0;
  flex: 1;
}
.node__name {
  font-size: 15px;
  font-weight: 700;
  color: var(--pf-text);
}
.node__code {
  margin: 2px 0 0;
  font-size: 12px;
  color: var(--pf-text-faint);
}
.node__status {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  flex: none;
  padding: 2px 10px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 600;
}
.node__status.is-on {
  color: var(--pf-success);
  background: rgba(16, 185, 129, 0.1);
}
.node__status.is-off {
  color: var(--pf-text-faint);
  background: var(--pf-bg-soft);
}
.node__dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: currentColor;
}
.node__acts {
  display: flex;
  align-items: center;
  flex: none;
  gap: 2px;
}

/* ---------- 规格磁贴 ---------- */
.node__tiles {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}
.tile {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 10px 12px;
  background: var(--pf-surface-2);
  border: 1px solid var(--pf-border);
  border-radius: 8px;
}
.tile--muted {
  background: var(--pf-bg-soft);
}
.tile__label {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.04em;
  color: var(--pf-text-faint);
}
.tile__value {
  margin: 0;
  font-size: 13px;
  font-weight: 600;
  color: var(--pf-text);
  word-break: break-word;
}
.tile__value--na {
  color: var(--pf-text-faint);
  font-weight: 500;
}
.tile__unit {
  font-size: 11px;
  font-weight: 500;
  color: var(--pf-text-faint);
}
.tile__extra {
  margin: 0;
  font-size: 11.5px;
  color: var(--pf-text-soft);
}
.tile__extra b {
  color: var(--pf-text);
  font-weight: 700;
}
.tile__bar {
  height: 4px;
  margin: 2px 0 1px;
  border-radius: 999px;
  background: var(--pf-border);
  overflow: hidden;
}
.tile__bar span {
  display: block;
  height: 100%;
  border-radius: 999px;
  background: var(--pf-primary);
  transition: width 0.3s ease;
}
.tile__bar.is-low span {
  background: var(--pf-warning);
}
.node__net {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
  padding: 8px 12px;
  border-radius: 8px;
  background: var(--pf-gradient-soft);
  font-size: 12.5px;
  color: var(--pf-text-soft);
}
.node__net b {
  color: var(--pf-text);
  font-weight: 700;
}
.node__net-item {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}
.node__net-sep {
  width: 1px;
  height: 12px;
  background: var(--pf-border-strong);
}

/* ---------- 新增 / 编辑表单 ---------- */
.node-form__row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0 16px;
}
.node-form__num {
  width: 100%;
}
.node-form__auto {
  font-size: 13px;
  font-weight: 700;
  color: var(--pf-text);
}
</style>
