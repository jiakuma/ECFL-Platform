<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { appMenus, adminMenus } from '@/router/menu'
import { ElMessageBox } from 'element-plus'
import { useAuthStore } from '@/store/auth'
import { useOrgStore } from '@/store/org'
import {
  Search, Bell, Fold, Expand, ArrowDown,
  SwitchButton, Tickets, Switch, Monitor, DataBoard, Select,
} from '@element-plus/icons-vue'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const org = useOrgStore()
const collapsed = ref(localStorage.getItem('sidebar-collapsed') === '1')

function toggle() {
  collapsed.value = !collapsed.value
  localStorage.setItem('sidebar-collapsed', collapsed.value ? '1' : '0')
}

/** 当前所处端 */
const side = computed(() => auth.currentSide)
const menus = computed(() => (side.value === 'admin' ? adminMenus : appMenus))
const brandTitle = computed(() => (side.value === 'admin' ? '食管癌联邦学习管理平台' : '食管癌专病联邦学习平台'))
const brandSub = computed(() => (side.value === 'admin' ? 'Admin Console' : 'Esophageal Cancer FLP'))
const sideHome = computed(() => (side.value === 'admin' ? '/admin/overview' : '/'))

/** 切换应用端 / 管理端（仅管理角色可见入口） */
function switchSide() {
  const target = side.value === 'admin' ? 'app' : 'admin'
  if (!auth.setSide(target)) return
  router.push(target === 'admin' ? '/admin/overview' : '/')
}

const activeMenu = computed(() => {
  const p = route.path
  let best = ''
  for (const g of menus.value) {
    if (!g.children?.length) {
      // 叶子菜单的子路径（如 /admin/organization/XX）归并到该菜单
      if ((p === g.path || p.startsWith(g.path + '/')) && g.path.length > best.length) best = g.path
      continue
    }
    // 详情 / 编辑等子页面按最长子路径前缀归并，避免落到分组第一个子菜单
    for (const c of g.children) {
      if ((p === c.path || p.startsWith(c.path + '/')) && c.path.length > best.length) best = c.path
    }
  }
  return best || p
})

interface Crumb { title: string; to?: string }
const breadcrumbs = computed<Crumb[]>(() => {
  const meta = route.meta as Record<string, unknown>
  if (Array.isArray(meta.breadcrumb)) return meta.breadcrumb as Crumb[]
  for (const g of menus.value) {
    if (!g.children?.length) continue
    const child = g.children.find((c) => c.path === route.path)
    if (child) {
      return [
        { title: g.title, to: g.children[0]?.path },
        { title: child.title, to: child.path },
      ]
    }
    if (route.path.startsWith(g.path + '/')) {
      return [
        { title: g.title, to: g.children[0]?.path },
        { title: (route.meta.title as string) || '' },
      ]
    }
  }
  return [{ title: (route.meta.title as string) || '页面' }]
})

const keyword = ref('')

/** 仅管理后台存在机构上下文 */
const inAdmin = computed(() => side.value === 'admin')

interface OrgOption { value: string; label: string }
/** 机构切换项：管理端可回到「平台管理员」，应用端固定落在具体机构 */
const orgOptions = computed<OrgOption[]>(() => {
  const orgs = org.allowedOrgs.map((name) => ({ value: name, label: name }))
  return inAdmin.value ? [{ value: '', label: '平台管理员（不选择机构）' }, ...orgs] : orgs
})
const orgValue = computed(() => (inAdmin.value ? org.selected : org.appCurrent))
const orgLabel = computed(() => (inAdmin.value && org.isPlatformAdmin ? '当前角色' : '当前机构'))
const orgName = computed(() => (inAdmin.value ? (org.isPlatformAdmin ? org.roleLabel : org.current) : org.appCurrent))

function onOrgCommand(name: string) {
  org.select(name || null)
}

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
  <div class="app" :class="{ 'app--collapsed': collapsed, 'app--admin': side === 'admin' }">
    <!-- 侧边栏 -->
    <aside class="sidebar">
      <div class="brand" @click="router.push(sideHome)">
        <span class="brand__logo">{{ side === 'admin' ? 'AD' : 'EC' }}</span>
        <span class="brand__text">
          <strong>{{ brandTitle }}</strong>
          <em>{{ brandSub }}</em>
        </span>
      </div>
      <el-scrollbar class="sidebar__scroll">
        <el-menu :collapse="collapsed" :default-active="activeMenu" router class="side-menu">
          <template v-for="g in menus" :key="g.path">
            <el-menu-item v-if="!g.children || !g.children.length" :index="g.path">
              <el-icon><component :is="g.icon" /></el-icon>
              <template #title>{{ g.title }}</template>
            </el-menu-item>
            <el-sub-menu v-else :index="g.path">
              <template #title>
                <el-icon><component :is="g.icon" /></el-icon>
                <span>{{ g.title }}</span>
              </template>
              <el-menu-item v-for="c in g.children" :key="c.path" :index="c.path">
                <el-icon><component :is="c.icon" /></el-icon>
                <template #title>{{ c.title }}</template>
              </el-menu-item>
            </el-sub-menu>
          </template>
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
            <el-breadcrumb-item v-for="(b, i) in breadcrumbs" :key="i" :to="b.to">
              {{ b.title }}
            </el-breadcrumb-item>
          </el-breadcrumb>
        </div>
        <div class="topbar__right">
          <el-dropdown
            trigger="click"
            class="org-wrap"
            @command="onOrgCommand"
          >
            <span class="org-switch">
              <span class="org-switch__label">{{ orgLabel }}</span>
              <span class="org-switch__name">{{ orgName }}</span>
              <el-icon size="12"><ArrowDown /></el-icon>
            </span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item
                  v-for="(o, i) in orgOptions"
                  :key="o.value"
                  :command="o.value"
                  :divided="inAdmin && i === 1"
                >
                  <span class="org-opt" :class="{ 'is-active': o.value === orgValue }">
                    <span class="org-opt__name">{{ o.label }}</span>
                    <el-icon v-if="o.value === orgValue" size="14"><Select /></el-icon>
                  </span>
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
          <el-input
            v-model="keyword"
            :placeholder="side === 'admin' ? '搜索机构 / 任务 / 审批' : '搜索患者 / 任务 / 机构'"
            :prefix-icon="Search"
            clearable
            class="search"
          />
          <el-button v-if="auth.canAccessAdmin" text class="side-switch" @click="switchSide">
            <el-icon size="16"><component :is="side === 'admin' ? Monitor : Switch" /></el-icon>
            <span>{{ side === 'admin' ? '返回应用端' : '进入管理后台' }}</span>
          </el-button>
          <el-badge :value="5" class="topbar__item">
            <el-button text><el-icon size="18"><Bell /></el-icon></el-button>
          </el-badge>
          <el-dropdown>
            <span class="user">
              <el-avatar :size="32" class="user__avatar">{{ (auth.user?.name || '医').slice(0, 1) }}</el-avatar>
              <span class="user__meta">
                <span class="user__name">{{ auth.user?.name || '机构管理员' }}</span>
                <span class="user__role">{{ auth.roleLabel }}</span>
              </span>
              <el-icon><ArrowDown /></el-icon>
            </span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item @click="router.push('/profile/tasks')">
                  <el-icon><Tickets /></el-icon> 我的任务
                </el-dropdown-item>
                <el-dropdown-item v-if="auth.canAccessAdmin" @click="switchSide">
                  <el-icon><component :is="side === 'admin' ? DataBoard : Switch" /></el-icon>
                  {{ side === 'admin' ? '返回应用端' : '进入管理后台' }}
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
  cursor: pointer;
}
.brand:hover .brand__text strong {
  color: var(--pf-primary);
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
  line-height: 1.2;
}
.crumbs :deep(.el-breadcrumb__inner) {
  color: var(--pf-text-soft);
  font-weight: 500;
  transition: color 0.15s ease;
}
.crumbs :deep(.el-breadcrumb__inner.is-link):hover {
  color: #2563eb;
}
.crumbs :deep(.el-breadcrumb__item:last-child .el-breadcrumb__inner) {
  color: var(--pf-text);
  font-weight: 600;
  cursor: default;
}
.crumbs :deep(.el-breadcrumb__separator) {
  color: var(--pf-text-faint);
  margin: 0 6px;
  font-weight: 400;
}
.topbar__right {
  display: flex;
  align-items: center;
  gap: 14px;
}
.search {
  width: 240px;
}
.org-wrap :deep(.el-dropdown-menu__item) {
  padding: 6px 12px;
}
.org-switch {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 30px;
  padding: 0 10px;
  border: 1px solid var(--pf-border-strong);
  border-radius: 999px;
  font-size: 12.5px;
  font-weight: 600;
  color: var(--pf-text-soft);
  background: var(--pf-surface-2);
  cursor: pointer;
  outline: none;
  transition: border-color 0.2s ease, color 0.2s ease, background 0.2s ease;
}
.org-switch:hover {
  border-color: var(--pf-primary);
  color: var(--pf-primary);
}
.org-switch__label {
  font-weight: 500;
  color: var(--pf-text-faint);
}
.org-switch__name {
  color: var(--pf-text);
}
.org-opt {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: var(--pf-text-soft);
}
.org-opt__name {
  font-weight: 600;
}
.org-opt.is-active {
  color: var(--pf-primary);
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
.user__meta {
  display: flex;
  flex-direction: column;
  line-height: 1.2;
}
.user__name {
  font-size: 13px;
  color: var(--pf-text);
}
.user__role {
  font-size: 11px;
  color: var(--pf-text-faint);
}
.side-switch {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 30px;
  padding: 0 10px;
  border: 1px solid var(--pf-border-strong);
  border-radius: 999px;
  font-size: 12.5px;
  font-weight: 600;
  color: var(--pf-primary);
  background: var(--pf-surface-2);
}
.side-switch:hover {
  border-color: var(--pf-primary);
  background: var(--pf-surface);
}

/* 管理后台：更偏后台管理系统，底色偏冷灰蓝紫 */
.app--admin .sidebar {
  background: var(--pf-surface-2);
}
.app--admin .main {
  padding: 18px;
  background: var(--pf-bg-soft);
}
.app--admin .side-menu,
.app--admin .sidebar .el-menu-item,
.app--admin .sidebar .el-sub-menu__title {
  background: transparent;
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
