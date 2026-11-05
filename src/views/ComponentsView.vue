<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { ElMessage, ElNotification } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import { members } from '@/mock/data'
import type { FormInstance, FormRules } from 'element-plus'
import {
  PageHeader,
  SectionCard,
  StatusBadge,
  FilterBar,
  MetricCard,
  DataTable,
} from '@/components/common'

// ---------- 状态标签语义映射示例 ----------
const semanticTypes = [
  { type: 'success', text: '已完成' },
  { type: 'processing', text: '进行中' },
  { type: 'pending', text: '待审批' },
  { type: 'danger', text: '失败' },
  { type: 'disabled', text: '已停用' },
  { type: 'info', text: '已知悉' },
] as const

// 过渡期：部分业务仍保留历史色，可通过 color 属性透传，不破坏既有页面
const legacyColors = [
  { text: '训练中', color: '#8b5cf6' },
  { text: '待执行', color: '#0ea5e9' },
  { text: '待确认', color: '#3b82f6' },
]

// ---------- 筛选栏 ----------
const keyword = ref('')
const statusFilter = ref('')
function resetFilters() {
  keyword.value = ''
  statusFilter.value = ''
}

// ---------- 表格 ----------
const page = ref(1)
const pageSize = ref(6)
const filtered = computed(() => {
  const k = keyword.value.trim().toLowerCase()
  if (!k) return members
  return members.filter(
    (m) => m.name.toLowerCase().includes(k) || m.org.toLowerCase().includes(k),
  )
})
const paged = computed(() => {
  const start = (page.value - 1) * pageSize.value
  return filtered.value.slice(start, start + pageSize.value)
})

// ---------- 指标卡 ----------
const metrics = [
  { label: '在研项目', value: 12, unit: '个', hint: '本机构牵头 4 个', trend: { value: '+2 本月', positive: true } },
  { label: '关联数据集', value: 38, unit: '个', hint: '跨 6 家中心' },
  { label: '联邦训练任务', value: 9, unit: '个', hint: '3 个训练中' },
  { label: '累计样本', value: 24180, unit: '例', hint: '脱敏汇总', trend: { value: '+5.1%', positive: true } },
]

// ---------- 表单 ----------
const formRef = ref<FormInstance>()
const form = reactive({ name: '', email: '', role: '' })
const rules: FormRules = {
  name: [{ required: true, message: '请输入姓名', trigger: 'blur' }],
  email: [
    { required: true, message: '请输入邮箱', trigger: 'blur' },
    { type: 'email', message: '邮箱格式不正确', trigger: 'blur' },
  ],
  role: [{ required: true, message: '请选择角色', trigger: 'change' }],
}
function submit(formEl: FormInstance | undefined) {
  if (!formEl) return
  formEl.validate((ok) => {
    if (ok) ElMessage.success(`已提交：${form.name}（${form.role}）`)
    else ElMessage.error('请检查表单填写')
  })
}

// ---------- 弹窗 / 抽屉 ----------
const dialogVisible = ref(false)
const drawerVisible = ref(false)
function notify() {
  ElNotification({ title: '操作成功', message: '这是一条演示通知。', type: 'success', position: 'top-right' })
}
</script>

<template>
  <div class="comps">
    <PageHeader
      title="组件总览"
      :breadcrumb="[{ label: '首页', to: '/portal' }, { label: '组件总览' }]"
      meta="统一医疗蓝白设计体系"
    >
      <template #actions>
        <el-button size="small" @click="notify">发送通知</el-button>
        <el-button type="primary" size="small" @click="dialogVisible = true">新建</el-button>
      </template>
    </PageHeader>

    <div class="comps__grid">
      <!-- 指标卡 -->
      <SectionCard title="统计指标卡 MetricCard" subtitle="核心数字突出，无装饰底板" class="comps__span2">
        <div class="comps__metrics">
          <MetricCard
            v-for="m in metrics"
            :key="m.label"
            :label="m.label"
            :value="m.value"
            :unit="m.unit"
            :hint="m.hint"
            :trend="m.trend"
          />
        </div>
      </SectionCard>

      <!-- 状态标签 -->
      <SectionCard title="状态标签 StatusBadge" subtitle="语义色统一，区分业务状态与分类标签">
        <div class="comps__row">
          <StatusBadge v-for="s in semanticTypes" :key="s.text" :type="s.type" :text="s.text" dot />
        </div>
        <div class="comps__row comps__row--mt">
          <StatusBadge text="仅文字" />
          <StatusBadge text="带点" dot />
          <StatusBadge
            v-for="l in legacyColors"
            :key="l.text"
            :text="l.text"
            :color="l.color"
            dot
          />
        </div>
        <p class="comps__note">前两类为语义色（推荐）；末组为过渡期业务自定义色，经 color 属性透传。</p>
      </SectionCard>

      <!-- 按钮 -->
      <SectionCard title="按钮 Buttons">
        <div class="comps__row">
          <el-button type="primary">主要</el-button>
          <el-button>默认</el-button>
          <el-button type="success" plain>成功</el-button>
          <el-button type="warning" plain>警告</el-button>
          <el-button type="danger" plain>危险</el-button>
          <el-button text type="primary">文字</el-button>
        </div>
        <div class="comps__row comps__row--mt">
          <el-button type="primary" size="small">小号</el-button>
          <el-button type="primary">默认</el-button>
          <el-button type="primary" round>圆角</el-button>
          <el-button type="primary" :icon="Plus" circle />
        </div>
      </SectionCard>

      <!-- 筛选栏 -->
      <SectionCard title="筛选栏 FilterBar" subtitle="灵活插槽，不含业务查询逻辑">
        <FilterBar default-actions @search="ElMessage.info('查询')" @reset="resetFilters">
          <template #filters>
            <el-input v-model="keyword" placeholder="搜索姓名 / 机构" clearable size="small" style="width: 220px" />
            <el-select v-model="statusFilter" placeholder="全部状态" clearable size="small" style="width: 140px">
              <el-option label="在线" value="在线" />
              <el-option label="离线" value="离线" />
            </el-select>
          </template>
          <template #actions>
            <el-button size="small" @click="drawerVisible = true">高级</el-button>
          </template>
        </FilterBar>
      </SectionCard>

      <!-- 表格 -->
      <SectionCard title="通用表格 DataTable" subtitle="基于 el-table 透传，统一表头 / 分页 / 空态" class="comps__span2">
        <DataTable
          :data="paged"
          :page-total="filtered.length"
          v-model:current-page="page"
          v-model:page-size="pageSize"
          row-key="id"
          empty-text="未匹配到成员"
        >
          <el-table-column prop="name" label="姓名" width="100" />
          <el-table-column prop="role" label="角色" width="90" />
          <el-table-column prop="org" label="机构" min-width="180" show-overflow-tooltip />
          <el-table-column prop="level" label="等级" width="90" />
          <el-table-column label="状态" width="110">
            <template #default="{ row }">
              <StatusBadge :type="row.status === '在线' ? 'success' : row.status === '审批中' ? 'pending' : 'info'" :text="row.status" dot />
            </template>
          </el-table-column>
          <el-table-column label="操作" width="90" fixed="right">
            <template #default="{ row }">
              <el-button text size="small" type="primary" @click="ElMessage.info(`查看 ${row.name}`)">查看</el-button>
            </template>
          </el-table-column>
        </DataTable>
      </SectionCard>

      <!-- 表单 -->
      <SectionCard title="表单 Form" subtitle="el-form-item 已统一标签 / 必填 / 校验布局，无需额外封装">
        <el-form ref="formRef" :model="form" :rules="rules" label-width="70px" label-position="top">
          <el-form-item label="姓名" prop="name">
            <el-input v-model="form.name" placeholder="请输入姓名" />
          </el-form-item>
          <el-form-item label="邮箱" prop="email">
            <el-input v-model="form.email" placeholder="name@example.com" />
          </el-form-item>
          <el-form-item label="角色" prop="role">
            <el-select v-model="form.role" placeholder="请选择角色" style="width: 100%">
              <el-option label="管理员" value="管理员" />
              <el-option label="操作员" value="操作员" />
              <el-option label="访客" value="访客" />
            </el-select>
          </el-form-item>
          <el-button type="primary" @click="submit(formRef)">提交</el-button>
        </el-form>
      </SectionCard>

      <!-- 浮层 -->
      <SectionCard title="浮层与反馈" subtitle="Element Plus 原生对话框 / 抽屉">
        <div class="comps__row">
          <el-button @click="dialogVisible = true">打开对话框</el-button>
          <el-button @click="drawerVisible = true">打开抽屉</el-button>
          <el-button type="warning" plain @click="ElMessage.warning('这是一条警告消息')">警告消息</el-button>
        </div>
      </SectionCard>

      <!-- 页头示例 -->
      <SectionCard title="页头 PageHeader" subtitle="面包屑 / 副标题 / 操作区 / 返回" class="comps__span2">
        <PageHeader
          title="食管鳞癌术后复发风险建模"
          subtitle="多中心联合 · 牵头：解放军总医院"
          :breadcrumb="[{ label: '科研项目中心', to: '/project' }, { label: '项目详情' }]"
          meta="进行中"
          back
          @back="ElMessage.info('返回')"
        >
          <template #actions>
            <el-button size="small">编辑</el-button>
            <el-button type="primary" size="small">发起训练</el-button>
          </template>
        </PageHeader>
      </SectionCard>
    </div>

    <el-dialog v-model="dialogVisible" title="演示对话框" width="420px" align-center>
      <p>基于 Element Plus 的对话框，可用于确认、表单或详情展示。</p>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="dialogVisible = false">确定</el-button>
      </template>
    </el-dialog>

    <el-drawer v-model="drawerVisible" title="演示抽屉" direction="rtl" size="320px">
      <p>抽屉适合承载次要操作或详情面板，从侧边滑出，不打断主流程。</p>
    </el-drawer>
  </div>
</template>

<style scoped>
.comps {
  padding: 4px 2px;
}
.comps__grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--medical-section-gap);
}
.comps__span2 {
  grid-column: 1 / -1;
}
.comps__metrics {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: var(--medical-spacing-4);
}
.comps__row {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
}
.comps__row--mt {
  margin-top: 12px;
}
.comps__note {
  margin: 12px 0 0;
  font-size: 12px;
  color: var(--medical-color-text-tertiary);
}

@media (max-width: 1024px) {
  .comps__metrics {
    grid-template-columns: repeat(2, 1fr);
  }
}
@media (max-width: 760px) {
  .comps__grid {
    grid-template-columns: 1fr;
  }
  .comps__span2 {
    grid-column: auto;
  }
  .comps__metrics {
    grid-template-columns: 1fr;
  }
}
</style>
