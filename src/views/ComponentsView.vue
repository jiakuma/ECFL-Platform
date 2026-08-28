<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { ElMessage, ElNotification } from 'element-plus'
import { members } from '@/mock/data'
import type { FormInstance, FormRules } from 'element-plus'

const statusType: Record<string, 'success' | 'info' | 'warning'> = {
  在线: 'success',
  离线: 'info',
  审批中: 'warning',
}

// ---------- 表格 ----------
const keyword = ref('')
const page = ref(1)
const pageSize = ref(6)

const filtered = computed(() => {
  const k = keyword.value.trim().toLowerCase()
  if (!k) return members
  return members.filter(
    (m) =>
      m.name.toLowerCase().includes(k) ||
      m.org.toLowerCase().includes(k) ||
      m.role.toLowerCase().includes(k),
  )
})
const paged = computed(() => {
  const start = (page.value - 1) * pageSize.value
  return filtered.value.slice(start, start + pageSize.value)
})

// ---------- 表单 ----------
const formRef = ref<FormInstance>()
const form = reactive({
  name: '',
  email: '',
  role: '',
  agree: false,
})
const rules: FormRules = {
  name: [{ required: true, message: '请输入姓名', trigger: 'blur' }],
  email: [
    { required: true, message: '请输入邮箱', trigger: 'blur' },
    { type: 'email', message: '邮箱格式不正确', trigger: 'blur' },
  ],
  role: [{ required: true, message: '请选择角色', trigger: 'change' }],
  agree: [
    {
      validator: (_r, v, cb) => (v ? cb() : cb(new Error('请阅读并同意条款'))),
      trigger: 'change',
    },
  ],
}
function submit(formEl: FormInstance | undefined) {
  if (!formEl) return
  formEl.validate((ok) => {
    if (ok) {
      ElMessage.success(`已提交：${form.name}（${form.role}）`)
    } else {
      ElMessage.error('请检查表单填写')
    }
  })
}

// ---------- 对话框 / 抽屉 ----------
const dialogVisible = ref(false)
const drawerVisible = ref(false)

// ---------- 消息 ----------
function notify() {
  ElNotification({
    title: '操作成功',
    message: '这是一条演示用的通知消息。',
    type: 'success',
    position: 'top-right',
  })
}
</script>

<template>
  <div class="comps">
    <header class="comps__hero pf-container">
      <span class="pf-eyebrow" v-reveal>COMPONENT GALLERY</span>
      <h1 class="comps__title pf-section-title" v-reveal>
        组件，<span class="pf-gradient-text">拿来即用</span>
      </h1>
      <p class="pf-section-sub" v-reveal>
        基于 Element Plus 的常用交互组件演示，数据均为本地 Mock。
      </p>
    </header>

    <div class="comps__grid pf-container">
      <!-- 表格 -->
      <section class="pf-card panel" v-reveal>
        <div class="panel__head">
          <h3><el-icon><List /></el-icon> 数据表格</h3>
          <el-input
            v-model="keyword"
            placeholder="搜索姓名 / 机构 / 角色"
            clearable
            size="small"
            style="width: 220px"
          >
            <template #prefix><el-icon><Search /></el-icon></template>
          </el-input>
        </div>
        <el-table :data="paged" stripe style="width: 100%" :max-height="320">
          <el-table-column prop="name" label="姓名" width="100" />
          <el-table-column prop="role" label="角色" width="90" />
          <el-table-column prop="org" label="机构" min-width="180" show-overflow-tooltip />
          <el-table-column prop="level" label="等级" width="90" />
          <el-table-column label="状态" width="100">
            <template #default="{ row }">
              <el-tag :type="statusType[row.status]" effect="light" round>
                {{ row.status }}
              </el-tag>
            </template>
          </el-table-column>
        </el-table>
        <div class="pager">
          <el-pagination
            v-model:current-page="page"
            :page-size="pageSize"
            :total="filtered.length"
            layout="prev, pager, next"
            background
            small
          />
        </div>
      </section>

      <!-- 表单 -->
      <section class="pf-card panel" v-reveal>
        <h3 class="panel__title"><el-icon><EditPen /></el-icon> 表单校验</h3>
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
              <el-option label="审计员" value="审计员" />
              <el-option label="访客" value="访客" />
            </el-select>
          </el-form-item>
          <el-form-item prop="agree">
            <el-checkbox v-model="form.agree">我已阅读并同意相关条款</el-checkbox>
          </el-form-item>
          <el-button type="primary" round @click="submit(formRef)">提交</el-button>
        </el-form>
      </section>

      <!-- 对话框 / 抽屉 / 反馈 -->
      <section class="pf-card panel" v-reveal>
        <h3 class="panel__title"><el-icon><MessageBox /></el-icon> 浮层与反馈</h3>
        <div class="action-row">
          <el-button @click="dialogVisible = true">打开对话框</el-button>
          <el-button @click="drawerVisible = true">打开抽屉</el-button>
          <el-button type="success" plain @click="notify">发送通知</el-button>
          <el-button type="warning" plain @click="ElMessage.warning('这是一条警告消息')">
            警告消息
          </el-button>
        </div>
        <el-dialog v-model="dialogVisible" title="演示对话框" width="420px" align-center>
          <p>这是一个基于 Element Plus 的对话框示例，可用于确认、表单或详情展示。</p>
          <template #footer>
            <el-button @click="dialogVisible = false">取消</el-button>
            <el-button type="primary" @click="dialogVisible = false">确定</el-button>
          </template>
        </el-dialog>
        <el-drawer v-model="drawerVisible" title="演示抽屉" direction="rtl" size="320px">
          <p>抽屉适合承载次要操作或详情面板，从侧边滑出，不打断主流程。</p>
          <el-steps :active="2" direction="vertical" class="drawer-steps">
            <el-step title="创建" description="发起申请" />
            <el-step title="审批" description="管理员审核" />
            <el-step title="生效" description="配置完成" />
          </el-steps>
        </el-drawer>
      </section>

      <!-- 标签页 -->
      <section class="pf-card panel panel--wide" v-reveal>
        <h3 class="panel__title"><el-icon><Files /></el-icon> 标签页与内容</h3>
        <el-tabs type="border-card">
          <el-tab-pane label="概览">
            <p class="tab-text">
              概览页用于汇总关键指标，配合卡片与图表呈现整体态势。
            </p>
          </el-tab-pane>
          <el-tab-pane label="成员">
            <p class="tab-text">当前演示数据包含 {{ members.length }} 条成员记录，可在上方表格中检索。</p>
          </el-tab-pane>
          <el-tab-pane label="权限">
            <div class="tag-row">
              <el-tag>admin</el-tag><el-tag type="success">user</el-tag>
              <el-tag type="warning">governor</el-tag><el-tag type="info">auditor</el-tag>
            </div>
          </el-tab-pane>
          <el-tab-pane label="日志">
            <el-timeline>
              <el-timeline-item timestamp="2026-08-24" type="primary">演示站点上线</el-timeline-item>
              <el-timeline-item timestamp="2026-08-20" type="success">接入 Mock 数据层</el-timeline-item>
              <el-timeline-item timestamp="2026-08-18">完成路由与布局</el-timeline-item>
            </el-timeline>
          </el-tab-pane>
        </el-tabs>
      </section>
    </div>
  </div>
</template>

<style scoped>
.comps__hero {
  text-align: center;
  padding: 56px 24px 10px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}
.comps__title {
  margin-top: 6px;
}
.comps__grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 22px;
  padding-bottom: 40px;
}
.panel {
  padding: 24px;
}
.panel--wide {
  grid-column: 1 / -1;
}
.panel__head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 14px;
}
.panel__title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 17px;
  margin-bottom: 18px;
}
.panel__title .el-icon {
  color: var(--pf-primary);
}
.pager {
  display: flex;
  justify-content: flex-end;
  margin-top: 14px;
}
.action-row {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}
.tab-text {
  color: var(--pf-text-soft);
  padding: 6px 2px;
}
.tag-row {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}
.drawer-steps {
  margin-top: 16px;
}

@media (max-width: 860px) {
  .comps__grid {
    grid-template-columns: 1fr;
  }
}
</style>
