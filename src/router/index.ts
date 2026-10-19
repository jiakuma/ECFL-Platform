import { createRouter, createWebHashHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'
import PlaceholderView from '@/views/PlaceholderView.vue'
import SimplePlaceholderView from '@/views/SimplePlaceholderView.vue'
import { useAuthStore } from '@/store/auth'

type Crumb = { title: string; to?: string }

function ph(path: string, name: string, title: string, desc?: string): RouteRecordRaw {
  return { path, name, component: PlaceholderView, meta: { title, desc } }
}

/** 简洁占位页：仅标题 + 空状态，面包屑由 meta.breadcrumb 提供 */
function sp(path: string, name: string, title: string, breadcrumb: Crumb[]): RouteRecordRaw {
  return { path, name, component: SimplePlaceholderView, meta: { title, breadcrumb } }
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
    meta: { title: '平台首页' },
  },

  // 平台概览（运营态势 / 管理驾驶舱，与平台首页分离）
  {
    path: '/overview',
    name: 'overview',
    component: () => import('@/views/PlatformOverviewView.vue'),
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
    meta: {
      title: '患者档案详情',
      breadcrumb: [
        { title: '专病数据中心', to: '/overview' },
        { title: '患者主档案', to: '/dataset/patients' },
        { title: '患者详情' },
      ],
    },
  },
  {
    path: '/dataset/patients/:id/info',
    name: 'dataset-patient-info',
    component: () => import('@/views/PatientInfoView.vue'),
    meta: {
      title: '患者详细信息',
      breadcrumb: [
        { title: '专病数据中心', to: '/overview' },
        { title: '患者主档案', to: '/dataset/patients' },
        { title: '患者详细信息' },
      ],
    },
  },
  {
    path: '/dataset/patients/:id/labs',
    name: 'dataset-patient-labs',
    component: () => import('@/views/LabRecordView.vue'),
    meta: {
      title: '检验记录',
      breadcrumb: [
        { title: '专病数据中心', to: '/overview' },
        { title: '患者主档案', to: '/dataset/patients' },
        { title: '检验记录' },
      ],
    },
  },
  {
    path: '/dataset/resources',
    name: 'dataset-resources',
    component: () => import('@/views/ResourceLibraryView.vue'),
    meta: {
      title: '多模态资源',
      desc: '影像、病理切片、文本报告与基因测序等多模态数据的存储与预览。',
      breadcrumb: [
        { title: '专病数据中心', to: '/overview' },
        { title: '多模态资源' },
      ],
    },
  },
  {
    path: '/dataset/align/basic',
    name: 'dataset-align-basic',
    component: () => import('@/views/AlignmentBasicView.vue'),
    meta: {
      title: '基本信息对齐',
      desc: '多中心患者基本信息（性别 / 出生日期 / 吸烟史 / 患者主索引）对齐：规则可查、冲突可控、过程可追溯。',
      breadcrumb: [
        { title: '专病数据中心', to: '/overview' },
        { title: '基本信息对齐' },
      ],
    },
  },
  // —— 应用端新增入口（本期为占位页） ——
  {
    path: '/dataset/cohort',
    name: 'dataset-cohort',
    component: () => import('@/views/CohortView.vue'),
    meta: {
      title: '科研队列',
      breadcrumb: [
        { title: '专病数据中心', to: '/dataset/patients' },
        { title: '科研队列' },
      ],
    },
  },
  {
    path: '/dataset/research-datasets',
    name: 'dataset-research-datasets',
    component: () => import('@/views/DatasetListView.vue'),
    meta: {
      title: '科研数据集',
      breadcrumb: [
        { title: '专病数据中心', to: '/dataset/patients' },
        { title: '科研数据集' },
      ],
    },
  },
  {
    path: '/dataset/research-datasets/new',
    name: 'dataset-new',
    component: () => import('@/views/DatasetWizardView.vue'),
    meta: {
      title: '新建数据集',
      breadcrumb: [
        { title: '专病数据中心', to: '/dataset/patients' },
        { title: '科研数据集', to: '/dataset/research-datasets' },
        { title: '新建数据集' },
      ],
    },
  },
  {
    path: '/dataset/research-datasets/:id',
    name: 'dataset-detail',
    component: () => import('@/views/DatasetDetailView.vue'),
    meta: {
      title: '数据集详情',
      breadcrumb: [
        { title: '专病数据中心', to: '/dataset/patients' },
        { title: '科研数据集', to: '/dataset/research-datasets' },
        { title: '数据集详情' },
      ],
    },
  },
  {
    path: '/dataset/research-datasets/:id/edit',
    name: 'dataset-edit',
    component: () => import('@/views/DatasetWizardView.vue'),
    meta: {
      title: '编辑数据集',
      breadcrumb: [
        { title: '专病数据中心', to: '/dataset/patients' },
        { title: '科研数据集', to: '/dataset/research-datasets' },
        { title: '编辑数据集' },
      ],
    },
  },
  {
    path: '/federated',
    name: 'federated-center',
    component: () => import('@/views/FederatedListView.vue'),
    meta: { title: '联邦任务中心', breadcrumb: [{ title: '联邦任务中心' }] },
  },
  {
    path: '/federated/:id',
    name: 'federated-detail',
    component: () => import('@/views/FederatedDetailView.vue'),
    meta: {
      title: '任务详情',
      breadcrumb: [
        { title: '联邦任务中心', to: '/federated' },
        { title: '任务详情' },
      ],
    },
  },
  sp('/results', 'results-center', '结果中心', [{ title: '结果中心' }]),

  // —— 管理后台（本期全部为占位页） ——
  sp('/admin/overview', 'admin-overview', '平台总览', [{ title: '平台总览' }]),
  {
    path: '/admin/data',
    name: 'admin-data',
    component: () => import('@/views/DataManagementView.vue'),
    meta: { title: '数据管理', breadcrumb: [{ title: '数据管理' }] },
  },
  {
    path: '/admin/organization',
    name: 'admin-organization',
    component: () => import('@/views/InstitutionEntryView.vue'),
    meta: { title: '机构管理', breadcrumb: [{ title: '机构管理' }] },
  },
  {
    path: '/admin/organization/:org',
    name: 'admin-organization-detail',
    component: () => import('@/views/InstitutionDetailView.vue'),
    meta: {
      title: '机构详情',
      breadcrumb: [
        { title: '机构管理', to: '/admin/organization' },
        { title: '机构详情' },
      ],
    },
  },
  {
    path: '/admin/approval',
    name: 'admin-approval',
    component: () => import('@/views/ApprovalListView.vue'),
    meta: { title: '审批管理', breadcrumb: [{ title: '审批管理' }] },
  },
  {
    path: '/admin/approval/:id',
    name: 'admin-approval-detail',
    component: () => import('@/views/ApprovalDetailView.vue'),
    meta: {
      title: '审批详情',
      breadcrumb: [
        { title: '审批管理', to: '/admin/approval' },
        { title: '审批详情' },
      ],
    },
  },
  sp('/admin/system/users', 'admin-system-users', '用户权限', [
    { title: '系统管理', to: '/admin/system/users' },
    { title: '用户权限' },
  ]),
  sp('/admin/system/audit', 'admin-system-audit', '审计日志', [
    { title: '系统管理', to: '/admin/system/users' },
    { title: '审计日志' },
  ]),

  ph('/dataset/retrieval', 'dataset-retrieval', '专病检索', '按条件组合检索患者队列，构建可复用的研究 Cohort（仅返回聚合统计）。'),
  ph('/dataset/datasets', 'dataset-datasets', '数据集', '可用于联邦学习的本地数据集，仅展示元数据与统计摘要（不出域）。'),

  // 联盟协作（原"群组"，替代机构五级）
  ph('/alliance/list', 'alliance-list', '我的联盟', '我创建与参与的联邦学习联盟，牵头机构可管理成员、资源与任务。'),
  ph('/alliance/create', 'alliance-create', '创建联盟', '牵头机构发起联盟：设定名称、目标、参与机构与共享资源目录。'),
  ph('/alliance/approval', 'alliance-approval', '联盟审批', '入盟申请、资源使用申请与任务参与申请的审批流转。'),
  ph('/alliance/:id', 'alliance-detail', '联盟空间', '联盟概览：资源目录、成员与授权、联盟内联邦任务与审批。'),

  // 联邦任务管理
  ph('/federated/list', 'federated-list', '任务列表', '联邦学习任务的创建、状态、进度与参与方总览。'),
  {
    path: '/federated/create',
    name: 'federated-create',
    component: () => import('@/views/FederatedTaskCreateView.vue'),
    meta: {
      title: '新建任务',
      breadcrumb: [
        { title: '联邦任务中心', to: '/federated' },
        { title: '新建任务' },
      ],
    },
  },
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
  // 管理端访问控制（基础占位：仅校验角色所属端，完整 RBAC 后续实现）
  if (to.path.startsWith('/admin') && !auth.canAccessAdmin) {
    return { path: '/' }
  }
  // 管理角色首次进入时落到管理端；手动切回应用端后不再强制跳转
  if (to.path === '/' && auth.currentSide === 'admin') {
    return { path: '/admin/overview' }
  }
  return true
})

router.afterEach((to) => {
  const title = (to.meta.title as string) || '食管癌专病联邦平台'
  document.title = `${title} · 食管癌专病联邦平台`
})

export default router
