<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { appMenus, adminMenus } from '@/router/menu'
import { ElMessageBox } from 'element-plus'
import { useAuthStore } from '@/store/auth'
import { useOrgStore } from '@/store/org'
import {
  Bell, Fold, Expand, ArrowDown,
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

/** 仅展开当前所在的菜单分组，其余分组保持收起 */
const openedGroups = computed(() =>
  menus.value
    .filter((g) => g.children?.length && (activeMenu.value === g.path || activeMenu.value.startsWith(g.path + '/')))
    .map((g) => g.path),
)

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
        </span>
      </div>
      <el-scrollbar class="sidebar__scroll">
        <el-menu
          :collapse="collapsed"
          :default-active="activeMenu"
          :default-openeds="openedGroups"
          unique-opened
          router
          class="side-menu"
          popper-class="side-menu-popper"
        >
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

      <main class="main" :class="{ 'main--bleed': route.meta.bleed }">
        <slot />
      </main>
    </div>
  </div>
</template>

<style scoped>
/* ===========================================================
   导航：整屏统一背景图，顶栏 / 侧栏 / 主内容全部透明共用一张底图
   =========================================================== */
.app {
  display: flex;
  height: 100vh;
  overflow: hidden;
  /* 全平台唯一背景：乳白罩层压淡底图，固定不随内容滚动 */
  background-color: #EFFAF5;
  background-image:
    linear-gradient(rgba(255, 255, 255, 0.46), rgba(255, 255, 255, 0.46)),
    url('../assets/bg/app-bg.webp');
  background-position: center center;
  background-size: cover;
  background-repeat: no-repeat;
}

/* ---------- 侧栏 ---------- */
.sidebar {
  width: 216px;
  flex: none;
  display: flex;
  flex-direction: column;
  /* 完全透明：不铺任何底色、模糊层或分割线，与页面背景融为一体 */
  background: transparent;
  transition: width 0.25s ease;
}
.app--collapsed .sidebar {
  width: 64px;
}
.brand {
  height: 72px;
  flex: none;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 0 14px;
  background: transparent;
  border-bottom: none;
  white-space: nowrap;
  overflow: visible;
  cursor: pointer;
}
.brand:hover .brand__text strong {
  color: var(--medical-color-primary);
}
.brand__logo {
  width: 32px;
  height: 32px;
  flex: none;
  border-radius: 9px;
  display: grid;
  place-items: center;
  color: #fff;
  font-weight: 700;
  font-size: 12px;
  letter-spacing: 0.02em;
  background: var(--nav-logo-bg);
}
.brand__text {
  display: flex;
  flex-direction: column;
  justify-content: center;
  line-height: 1.15;
  overflow: visible;
}
.brand__text strong {
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0.01em;
  color: var(--nav-top-text);
}
.app--collapsed .brand__text {
  display: none;
}
.sidebar__scroll {
  flex: 1;
  min-height: 0;
}
.sidebar__scroll :deep(.el-scrollbar__thumb) {
  background: rgba(62, 90, 91, 0.22);
}

/* ---------- 菜单 ---------- */
.side-menu {
  border-right: none !important;
  background: transparent;
  padding: 10px 0 16px;
  --el-menu-bg-color: transparent;
  --el-menu-text-color: var(--nav-side-text);
  --el-menu-active-color: var(--nav-active-text);
  --el-menu-hover-bg-color: transparent;
  --el-menu-border-color: transparent;
  --el-menu-item-height: 44px;
  --el-menu-sub-item-height: 42px;
}
.side-menu :deep(.el-menu-item),
.side-menu :deep(.el-sub-menu__title) {
  margin: 3px 14px;
  width: calc(100% - 28px);
  height: 44px;
  line-height: 44px;
  padding: 0 20px !important;
  border-radius: 10px;
  color: var(--nav-side-text);
  background: transparent;
  font-size: 14px;
  font-weight: 500;
}
.side-menu :deep(.el-menu-item .el-icon),
.side-menu :deep(.el-sub-menu__title .el-icon) {
  margin-right: 12px;
  font-size: 16px;
}
.side-menu :deep(.el-menu--inline .el-menu-item) {
  margin: 2px 14px;
  width: calc(100% - 28px);
  padding-left: 54px !important;
  height: 40px;
  line-height: 40px;
  font-size: 13.5px;
  border-radius: 8px;
}
.side-menu :deep(.el-menu--inline .el-menu-item .el-icon) {
  display: none;
}
.side-menu :deep(.el-menu-item .el-icon),
.side-menu :deep(.el-sub-menu__title .el-icon) {
  color: #43524E;
}
.side-menu :deep(.el-menu-item:hover),
.side-menu :deep(.el-sub-menu__title:hover) {
  background: var(--nav-hover-bg);
  color: var(--medical-color-primary);
}
.side-menu :deep(.el-menu--inline) {
  background: transparent;
}
.side-menu :deep(.el-menu-item.is-active) {
  background: var(--nav-active-bg);
  color: var(--nav-active-text);
  font-weight: 600;
}
.side-menu :deep(.el-menu-item.is-active .el-icon) {
  color: var(--nav-active-text);
}
.side-menu :deep(.el-menu-item.is-active:hover) {
  background: var(--nav-active-bg);
}
.side-menu :deep(.el-sub-menu.is-active > .el-sub-menu__title) {
  color: var(--medical-color-primary);
  font-weight: 600;
}

/* 折叠态：图标居中，当前分组同样亮蓝块 */
.app--collapsed .side-menu :deep(.el-menu-item),
.app--collapsed .side-menu :deep(.el-sub-menu__title) {
  margin: 3px 8px;
  width: calc(100% - 16px);
  padding: 0 !important;
  display: flex;
  align-items: center;
  justify-content: center;
}
.app--collapsed .side-menu :deep(.el-sub-menu.is-active > .el-sub-menu__title) {
  background: var(--nav-active-bg);
  color: var(--nav-active-text);
}

/* 折叠后的弹出式子菜单（teleport 到 body，需全局选择器） */
:global(.side-menu-popper.el-popper) {
  background: rgba(250, 255, 253, 0.98) !important;
  border: 1px solid rgba(96, 158, 146, 0.18) !important;
  border-radius: 10px !important;
  box-shadow: 0 12px 32px rgba(20, 70, 64, 0.16) !important;
  padding: 6px !important;
  backdrop-filter: blur(8px);
}
:global(.side-menu-popper.el-popper .el-popper__arrow::before) {
  background: rgba(250, 255, 253, 0.96) !important;
  border-color: var(--nav-side-divider) !important;
}
:global(.side-menu-popper .el-menu--popup) {
  background: transparent !important;
  min-width: 176px;
}
:global(.side-menu-popper .el-menu-item) {
  color: var(--nav-side-text);
  border-radius: 6px;
  height: 38px;
  line-height: 38px;
}
:global(.side-menu-popper .el-menu-item:hover) {
  background: var(--nav-hover-bg) !important;
  color: var(--medical-color-primary) !important;
}
:global(.side-menu-popper .el-menu-item.is-active) {
  background: var(--nav-active-bg) !important;
  color: var(--nav-active-text) !important;
}

/* ---------- 内容区 ---------- */
.content {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
}

/* ---------- 顶栏 ---------- */
.topbar {
  height: 72px;
  flex: none;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px 0 16px;
  background: transparent;
  border-bottom: none;
}
.topbar__left {
  display: flex;
  align-items: center;
  gap: 16px;
  min-width: 0;
}
/* 折叠按钮去掉左侧内边距，让图标与下方内容左边缘对齐 */
.collapse-btn {
  margin-right: 0;
  padding: 0;
  color: #3E4A48;
}
.crumbs {
  font-size: 14px;
  line-height: 1.2;
}
.crumbs :deep(.el-breadcrumb__inner) {
  color: var(--nav-top-text-soft);
  font-weight: 500;
  transition: color 0.15s ease;
}
.crumbs :deep(.el-breadcrumb__inner.is-link):hover {
  color: var(--medical-color-primary);
}
.crumbs :deep(.el-breadcrumb__item:last-child .el-breadcrumb__inner) {
  color: var(--nav-top-text);
  font-weight: 600;
  cursor: default;
}
.crumbs :deep(.el-breadcrumb__separator) {
  color: #A6C0BA;
  margin: 0 6px;
  font-weight: 400;
}
.topbar__right {
  display: flex;
  align-items: center;
  gap: 14px;
}
.org-wrap :deep(.el-dropdown-menu__item) {
  padding: 6px 12px;
}
.org-switch {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  height: 34px;
  padding: 0 14px;
  border: 1px solid var(--nav-top-border-soft);
  border-radius: 999px;
  font-size: 13px;
  font-weight: 600;
  color: var(--nav-top-text-soft);
  background: var(--nav-top-soft);
  cursor: pointer;
  outline: none;
  transition: border-color 0.2s ease, color 0.2s ease;
}
.org-switch:hover {
  border-color: var(--medical-color-primary);
  color: var(--medical-color-primary);
}
.org-switch__label {
  font-weight: 500;
  color: var(--nav-top-text-faint);
}
.org-switch__name {
  color: var(--nav-top-text);
}
.org-opt {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: var(--nav-top-text-soft);
}
.org-opt__name {
  font-weight: 600;
}
.org-opt.is-active {
  color: var(--medical-color-primary);
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
  background: var(--nav-logo-bg);
  font-size: 13px;
  font-weight: 600;
  color: #fff;
}
.user__meta {
  display: flex;
  flex-direction: column;
  gap: 2px;
  line-height: 1.2;
}
.user__name {
  font-size: 13px;
  font-weight: 600;
  color: var(--nav-top-text);
}
.user__role {
  font-size: 11.5px;
  color: var(--nav-top-text-faint);
}
.side-switch {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 34px;
  padding: 0 14px;
  border: 1px solid rgba(14, 157, 138, 0.32);
  border-radius: 999px;
  font-size: 13px;
  font-weight: 600;
  color: #0E9D7F;
  background: rgba(233, 249, 242, 0.72);
}
.side-switch:hover {
  border-color: var(--medical-color-primary);
  background: rgba(222, 246, 236, 0.9);
}

/* ---------- 主内容 ---------- */
/* 主内容区透明，直接透出 .app 上的统一背景图 */
.main {
  flex: 1;
  overflow: auto;
  padding: 16px;
  background: transparent;
}
.app--admin .main {
  padding: 16px;
  background: transparent;
}
/* 列表页：内容卡片贴边留白，底部留出背景带 */
/* 注意：必须用双类选择器，否则被 .app--admin .main 的更高优先级盖掉 */
.main.main--bleed {
  padding: 16px 16px 0;
}
</style>
