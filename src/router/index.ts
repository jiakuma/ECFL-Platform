import { createRouter, createWebHashHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'
import PlaceholderView from '@/views/PlaceholderView.vue'
import { useAuthStore } from '@/store/auth'

function ph(path: string, name: string, title: string, desc?: string): RouteRecordRaw {
  return { path, name, component: PlaceholderView, meta: { title, desc } }
}

const routes: RouteRecordRaw[] = [
  // 登录（独立页，不包裹侧边栏布局）
  {
    path: '/login',
    name: 'login',
    component: () => import('@/views/LoginView.vue'),
    meta: { title: '登录', fullscreen: true, public: true },
  },

  {
    path: '/',
    name: 'home',
    component: () => import('@/views/HomeView.vue'),
    meta: { title: '平台概览' },
  },

  // 专病数据中心
  {
    path: '/dataset/patients',
    name: 'dataset-patients',
    component: () => import('@/views/PatientListView.vue'),
    meta: { title: '患者主档案', desc: '以患者为中心的主索引、诊断、分期、治疗与随访时间轴。' },
  },
  {
    path: '/dataset/patients/:id',
    name: 'dataset-patient-detail',
    component: () => import('@/views/PatientDetailView.vue'),
    meta: { title: '患者档案详情' },
  },
  ph('/dataset/resources', 'dataset-resources', '多模态资源', '影像、病理切片、文本报告与基因测序等多模态数据的存储与预览。'),
  ph('/dataset/retrieval', 'dataset-retrieval', '专病检索', '按条件组合检索患者队列，构建可复用的研究 Cohort（仅返回聚合统计）。'),
  ph('/dataset/datasets', 'dataset-datasets', '数据集', '可用于联邦学习的本地数据集，仅展示元数据与统计摘要（不出域）。'),

  // 联盟协作（原"群组"，替代机构五级）
  ph('/alliance/list', 'alliance-list', '我的联盟', '我创建与参与的联邦学习联盟，牵头机构可管理成员、资源与任务。'),
  ph('/alliance/create', 'alliance-create', '创建联盟', '牵头机构发起联盟：设定名称、目标、参与机构与共享资源目录。'),
  ph('/alliance/approval', 'alliance-approval', '联盟审批', '入盟申请、资源使用申请与任务参与申请的审批流转。'),
  ph('/alliance/:id', 'alliance-detail', '联盟空间', '联盟概览：资源目录、成员与授权、联盟内联邦任务与审批。'),

  // 联邦任务管理
  ph('/federated/list', 'federated-list', '任务列表', '联邦学习任务的创建、状态、进度与参与方总览。'),
  ph('/federated/create', 'federated-create', '新建任务', '向导式创建联邦任务：选择算法、参与方、超参与隐私参数。'),
  ph('/federated/:id', 'federated-detail', '训练看板', '联邦任务的实时训练监控：轮次进度、损失曲线与各方贡献。'),
  ph('/federated/:id/eval', 'federated-eval', '模型评估', '联邦模型的 AUC、准确率、混淆矩阵与跨中心泛化对比。'),

  // 联合统计看板（先占位，待定具体应用场景）
  ph('/analytics/overview', 'analytics-overview', '统计总览', '联合统计看板（规划中）：将承载基于联邦模型的具体应用，如食管癌早筛、跨机构专病统计等。'),
  ph('/analytics/drill', 'analytics-drill', '指标下钻', '指标下钻分析（规划中）。'),

  // 系统管理
  ph('/settings/users', 'settings-users', '用户与角色', '平台用户管理与 admin / user / governor 三重角色配置。'),
  ph('/settings/permission', 'settings-permission', '授权配置', '成员、用户与节点的授权范围管理（策略卡片 + 申请-审批流）。'),
  ph('/settings/institutions', 'settings-institutions', '机构管理', '参与机构的注册、信息维护与状态管理（机构为权责主体）。'),
  ph('/settings/nodes', 'settings-nodes', '节点管理', '联邦节点（连接器）的注册、CA 认证、在线状态与可信等级管理。'),
  ph('/settings/system', 'settings-system', '系统设置', '平台级参数、通知与基础配置。'),

  // 个人中心
  ph('/profile/tasks', 'profile-tasks', '我的任务', '当前用户待办与参与的联邦任务、审批事项。'),
  ph('/profile/messages', 'profile-messages', '消息通知', '系统通知、任务动态与协作消息中心。'),

  // 前端基座演示（保留，暂未放入侧边栏导航）
  {
    path: '/animations',
    name: 'animations',
    component: () => import('@/views/AnimationsView.vue'),
    meta: { title: '动画演示' },
  },
  {
    path: '/components',
    name: 'components',
    component: () => import('@/views/ComponentsView.vue'),
    meta: { title: '组件演示' },
  },
  {
    path: '/charts',
    name: 'charts',
    component: () => import('@/views/ChartsView.vue'),
    meta: { title: '图表演示' },
  },

  {
    path: '/:pathMatch(.*)*',
    name: 'not-found',
    component: () => import('@/views/NotFoundView.vue'),
    meta: { title: '页面未找到' },
  },
]

const router = createRouter({
  history: createWebHashHistory(),
  routes,
  scrollBehavior() {
    return { top: 0 }
  },
})

router.beforeEach((to) => {
  const auth = useAuthStore()
  if (!to.meta.public && !auth.isAuthenticated) {
    return { name: 'login', query: { redirect: to.fullPath } }
  }
  if (to.name === 'login' && auth.isAuthenticated) {
    return { name: 'home' }
  }
  return true
})

router.afterEach((to) => {
  const title = (to.meta.title as string) || '食管癌专病联邦平台'
  document.title = `${title} · 食管癌专病联邦平台`
})

export default router
