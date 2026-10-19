export interface MenuChild {
  path: string
  title: string
  icon: string
}

export interface MenuGroup {
  /** 分组 index；children 为空时表示叶子菜单项（无子级） */
  path: string
  title: string
  icon: string
  children?: MenuChild[]
}

/* ============================================================
   应用端侧边栏：医生 / 科研人员 / 联邦任务参与人员
   ============================================================ */
export const appMenus: MenuGroup[] = [
  {
    path: '/portal',
    title: '首页',
    icon: 'HomeFilled',
    children: [
      { path: '/', title: '平台首页', icon: 'HomeFilled' },
      { path: '/overview', title: '平台概览', icon: 'DataLine' },
    ],
  },
  {
    path: '/dataset',
    title: '专病数据中心',
    icon: 'Files',
    children: [
      { path: '/dataset/patients', title: '患者主档案', icon: 'User' },
      { path: '/dataset/resources', title: '多模态资源', icon: 'Picture' },
      { path: '/dataset/cohort', title: '科研队列', icon: 'Search' },
      { path: '/dataset/research-datasets', title: '科研数据集', icon: 'Coin' },
    ],
  },
  { path: '/federated', title: '联邦任务中心', icon: 'Cpu' },
  { path: '/results', title: '结果中心', icon: 'DataAnalysis' },
]

/* ============================================================
   管理后台侧边栏：平台管理员 / 机构管理员 / 数据管理员 / 审批人员 / 安全管理员
   ============================================================ */
export const adminMenus: MenuGroup[] = [
  { path: '/admin/overview', title: '平台总览', icon: 'DataBoard' },
  { path: '/admin/data', title: '数据管理', icon: 'Files' },
  { path: '/admin/organization', title: '机构管理', icon: 'OfficeBuilding' },
  { path: '/admin/approval', title: '审批管理', icon: 'Select' },
  {
    path: '/admin/system',
    title: '系统管理',
    icon: 'Setting',
    children: [
      { path: '/admin/system/users', title: '用户权限', icon: 'UserFilled' },
      { path: '/admin/system/audit', title: '审计日志', icon: 'Document' },
    ],
  },
]

/* ============================================================
   历史菜单（暂不在任何侧边栏展示，保留用于后续恢复）
   对应路由未被删除，仍可直接按路径访问
   ============================================================ */
export const legacyMenus: MenuGroup[] = [
  {
    path: '/dataset-legacy',
    title: '专病数据中心（历史项）',
    icon: 'Files',
    children: [
      { path: '/dataset/retrieval', title: '专病检索', icon: 'Search' },
      { path: '/dataset/datasets', title: '数据集', icon: 'Coin' },
      { path: '/dataset/align/basic', title: '基本信息对齐', icon: 'Connection' },
    ],
  },
  {
    path: '/alliance',
    title: '联盟协作',
    icon: 'Share',
    children: [
      { path: '/alliance/list', title: '我的联盟', icon: 'Files' },
      { path: '/alliance/create', title: '创建联盟', icon: 'Plus' },
      { path: '/alliance/approval', title: '联盟审批', icon: 'Select' },
    ],
  },
  {
    path: '/federated-legacy',
    title: '联邦任务管理',
    icon: 'Cpu',
    children: [
      { path: '/federated/list', title: '任务列表', icon: 'List' },
      { path: '/federated/create', title: '新建任务', icon: 'Plus' },
    ],
  },
  {
    path: '/analytics',
    title: '联合统计看板',
    icon: 'Histogram',
    children: [
      { path: '/analytics/overview', title: '统计总览', icon: 'DataAnalysis' },
      { path: '/analytics/drill', title: '指标下钻', icon: 'ZoomIn' },
    ],
  },
  {
    path: '/settings',
    title: '系统管理',
    icon: 'Setting',
    children: [
      { path: '/settings/users', title: '用户与角色', icon: 'UserFilled' },
      { path: '/settings/permission', title: '授权配置', icon: 'Key' },
      { path: '/settings/institutions', title: '机构管理', icon: 'OfficeBuilding' },
      { path: '/settings/nodes', title: '节点管理', icon: 'Monitor' },
      { path: '/settings/system', title: '系统设置', icon: 'Tools' },
    ],
  },
  {
    path: '/profile',
    title: '个人中心',
    icon: 'UserFilled',
    children: [
      { path: '/profile/tasks', title: '我的任务', icon: 'Tickets' },
      { path: '/profile/messages', title: '消息通知', icon: 'Bell' },
    ],
  },
]
