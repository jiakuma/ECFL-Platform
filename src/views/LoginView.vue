<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import { User, Lock } from '@element-plus/icons-vue'
import { useAuthStore, type AuthRole } from '@/store/auth'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()

const formRef = ref<FormInstance>()
const loading = ref(false)

const form = reactive({
  username: '',
  password: '',
  role: 'admin' as AuthRole,
})

const rules: FormRules = {
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }],
}

const roleOptions = [
  { value: 'admin', label: '系统管理员' },
  { value: 'user', label: '普通用户' },
  { value: 'governor', label: '监管方' },
]

const orgMap: Record<AuthRole, string> = {
  admin: '国家癌症中心',
  user: '某三甲医院',
  governor: '卫生健康监管部门',
}

function quickFill(name: string) {
  form.username = name
  form.password = 'demo1234'
}

async function handleLogin() {
  if (!formRef.value) return
  await formRef.value.validate((valid) => {
    if (!valid) return
    loading.value = true
    // Mock 登录：实际项目此处调用后端鉴权接口
    setTimeout(() => {
      auth.login({ name: form.username, role: form.role, org: orgMap[form.role] })
      ElMessage.success('登录成功，欢迎使用食管癌专病联邦平台')
      const redirect = (route.query.redirect as string) || '/'
      router.push(redirect)
      loading.value = false
    }, 600)
  })
}
</script>

<template>
  <div class="login">
    <div class="login__card">
      <div class="login__brand">
        <span class="login__logo">EC</span>
        <div class="login__brand-text">
          <h1>食管癌专病联邦平台</h1>
          <p>Esophageal Cancer Federated Learning Platform</p>
        </div>
      </div>
      <p class="login__sub">可信数据空间 · 联邦学习协作门户</p>

      <el-form ref="formRef" :model="form" :rules="rules" size="large" @keyup.enter="handleLogin">
        <el-form-item prop="username">
          <el-input v-model="form.username" placeholder="用户名" :prefix-icon="User" clearable />
        </el-form-item>
        <el-form-item prop="password">
          <el-input v-model="form.password" type="password" placeholder="密码" :prefix-icon="Lock" show-password />
        </el-form-item>
        <el-form-item>
          <el-select v-model="form.role" placeholder="选择角色" class="login__role">
            <el-option v-for="o in roleOptions" :key="o.value" :label="o.label" :value="o.value" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" class="login__submit" :loading="loading" @click="handleLogin">登 录</el-button>
        </el-form-item>
      </el-form>

      <div class="login__demo">
        <span>演示账号（点击快速填充）：</span>
        <el-link type="primary" @click="quickFill('张医生')">张医生</el-link>
        <el-link type="primary" @click="quickFill('李管理员')">李管理员</el-link>
        <el-link type="primary" @click="quickFill('王监管')">王监管</el-link>
      </div>
    </div>
    <p class="login__foot">数据可用不可见 · 主权可控 · 身份互认 · 信任态势可感</p>
  </div>
</template>

<style scoped>
.login {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 18px;
  background: var(--pf-bg);
  padding: 24px;
}
.login__card {
  width: 100%;
  max-width: 380px;
  background: var(--pf-surface);
  border: 1px solid var(--pf-border);
  border-radius: 18px;
  padding: 32px 30px 26px;
  box-shadow: var(--pf-shadow);
}
.login__brand {
  display: flex;
  align-items: center;
  gap: 12px;
}
.login__logo {
  width: 44px;
  height: 44px;
  flex: none;
  border-radius: 12px;
  display: grid;
  place-items: center;
  color: #fff;
  font-weight: 800;
  font-size: 17px;
  background: var(--pf-gradient);
}
.login__brand-text h1 {
  font-size: 17px;
  margin: 0;
  color: var(--pf-text);
}
.login__brand-text p {
  font-size: 11px;
  margin: 2px 0 0;
  color: var(--pf-text-faint);
  letter-spacing: 0.02em;
}
.login__sub {
  font-size: 13px;
  color: var(--pf-text-soft);
  margin: 14px 0 22px;
}
.login__role {
  width: 100%;
}
.login__submit {
  width: 100%;
}
.login__demo {
  font-size: 12px;
  color: var(--pf-text-soft);
  margin-top: 6px;
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}
.login__foot {
  font-size: 12px;
  color: var(--pf-text-faint);
}
</style>
