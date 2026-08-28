<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { menus } from '@/router/menu'
import { ElMessageBox } from 'element-plus'
import { useAuthStore } from '@/store/auth'
import {
  Search, Bell, Fold, Expand, ArrowDown,
  SwitchButton, Tickets,
} from '@element-plus/icons-vue'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const collapsed = ref(localStorage.getItem('sidebar-collapsed') === '1')

function toggle() {
  collapsed.value = !collapsed.value
  localStorage.setItem('sidebar-collapsed', collapsed.value ? '1' : '0')
}

const activeMenu = computed(() => route.path)

const breadcrumbs = computed(() => {
  for (const g of menus) {
    const child = g.children.find((c) => c.path === route.path)
    if (child) return [{ title: g.title }, { title: child.title }]
    if (route.path.startsWith(g.path + '/')) {
      return [{ title: g.title }, { title: (route.meta.title as string) || '' }]
    }
  }
  return [{ title: (route.meta.title as string) || '页面' }]
})

const keyword = ref('')

function logout() {
  ElMessageBox.confirm('确认退出当前登录？', '提示', {
    confirmButtonText: '退出',
    cancelButtonText: '取消',
    type: 'warning',
  }).then(() => {
    auth.logout()
    router.push('/login')
  }).catch(() => {})
}
</script>

<template>
  <div class="app" :class="{ 'app--collapsed': collapsed }">
    <!-- 侧边栏 -->
    <aside class="sidebar">
      <div class="brand">
        <span class="brand__logo">EC</span>
        <span class="brand__text">
          <strong>食管癌专病联邦平台</strong>
          <em>Esophageal Cancer FLP</em>
        </span>
      </div>
      <el-scrollbar class="sidebar__scroll">
        <el-menu :collapse="collapsed" :default-active="activeMenu" router class="side-menu">
          <el-sub-menu v-for="g in menus" :key="g.path" :index="g.path">
            <template #title>
              <el-icon><component :is="g.icon" /></el-icon>
              <span>{{ g.title }}</span>
            </template>
            <el-menu-item v-for="c in g.children" :key="c.path" :index="c.path">
              <el-icon><component :is="c.icon" /></el-icon>
              <template #title>{{ c.title }}</template>
            </el-menu-item>
          </el-sub-menu>
        </el-menu>
      </el-scrollbar>
    </aside>

    <!-- 内容区 -->
    <div class="content">
      <header class="topbar">
        <div class="topbar__left">
          <el-button text class="collapse-btn" @click="toggle">
            <el-icon size="18"><component :is="collapsed ? 'Expand' : 'Fold'" /></el-icon>
          </el-button>
          <el-breadcrumb separator="/" class="crumbs">
            <el-breadcrumb-item v-for="(b, i) in breadcrumbs" :key="i">
              {{ b.title }}
            </el-breadcrumb-item>
          </el-breadcrumb>
        </div>
        <div class="topbar__right">
          <el-input
            v-model="keyword"
            placeholder="搜索患者 / 任务 / 机构"
            :prefix-icon="Search"
            clearable
            class="search"
          />
          <el-badge :value="5" class="topbar__item">
            <el-button text><el-icon size="18"><Bell /></el-icon></el-button>
          </el-badge>
          <el-dropdown>
            <span class="user">
              <el-avatar :size="32" class="user__avatar">{{ (auth.user?.name || '医').slice(0, 1) }}</el-avatar>
              <span class="user__name">{{ auth.user?.name || '机构管理员' }}</span>
              <el-icon><ArrowDown /></el-icon>
            </span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item @click="router.push('/profile/tasks')">
                  <el-icon><Tickets /></el-icon> 我的任务
                </el-dropdown-item>
                <el-dropdown-item divided @click="logout">
                  <el-icon><SwitchButton /></el-icon> 退出登录
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </header>

      <main class="main">
        <slot />
      </main>
    </div>
  </div>
</template>

<style scoped>
.app {
  display: flex;
  height: 100vh;
  overflow: hidden;
}
.sidebar {
  width: 232px;
  flex: none;
  background: var(--pf-surface);
  border-right: 1px solid var(--pf-border);
  display: flex;
  flex-direction: column;
  transition: width 0.25s ease;
}
.app--collapsed .sidebar {
  width: 64px;
}
.brand {
  height: 56px;
  flex: none;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 0 16px;
  border-bottom: 1px solid var(--pf-border);
  white-space: nowrap;
  overflow: hidden;
}
.brand__logo {
  width: 34px;
  height: 34px;
  flex: none;
  border-radius: 9px;
  display: grid;
  place-items: center;
  color: #fff;
  font-weight: 800;
  font-size: 14px;
  letter-spacing: 0.02em;
  background: var(--pf-gradient);
  background-size: 200% 200%;
  animation: app-gradient-shift 6s ease infinite;
}
.brand__text {
  display: flex;
  flex-direction: column;
  line-height: 1.15;
  overflow: hidden;
}
.brand__text strong {
  font-size: 14px;
  font-weight: 700;
}
.brand__text em {
  font-style: normal;
  font-size: 10px;
  color: var(--pf-text-faint);
  letter-spacing: 0.03em;
}
.app--collapsed .brand__text {
  display: none;
}
.sidebar__scroll {
  flex: 1;
  min-height: 0;
}
.side-menu {
  border-right: none !important;
  background: transparent;
}

.content {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
}
.topbar {
  height: 56px;
  flex: none;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 18px;
  border-bottom: 1px solid var(--pf-border);
  background: rgba(255, 255, 255, 0.72);
  backdrop-filter: saturate(180%) blur(10px);
}
.topbar__left {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}
.collapse-btn {
  margin-right: 2px;
}
.crumbs {
  font-size: 13px;
}
.topbar__right {
  display: flex;
  align-items: center;
  gap: 14px;
}
.search {
  width: 240px;
}
.topbar__item :deep(.el-badge__content) {
  border: none;
}
.user {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  outline: none;
}
.user__avatar {
  background: var(--pf-gradient);
  font-size: 13px;
  color: #fff;
}
.user__name {
  font-size: 13px;
  color: var(--pf-text);
}
.main {
  flex: 1;
  overflow: auto;
  padding: 22px;
  background: var(--pf-bg);
}
@keyframes app-gradient-shift {
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}
</style>
