export interface MenuChild {
  path: string
  title: string
  icon: string
}

export interface MenuGroup {
  path: string
  title: string
  icon: string
  children: MenuChild[]
}

// 侧边栏菜单：与 router/index.ts 路由一一对应（父 path 仅作分组 index，不作为路由）
export const menus: MenuGroup[] = [
  {
    path: '/portal',
    title: '门户',
    icon: 'HomeFilled',
    children: [
      { path: '/', title: '平台概览', icon: 'HomeFilled' },
    ],
  },
  {
    path: '/dataset',
    title: '专病数据中心',
    icon: 'Files',
    children: [
      { path: '/dataset/patients', title: '患者主档案', icon: 'User' },
      { path: '/dataset/resources', title: '多模态资源', icon: 'Picture' },
      { path: '/dataset/retrieval', title: '专病检索', icon: 'Search' },
      { path: '/dataset/datasets', title: '数据集', icon: 'Coin' },
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
    path: '/federated',
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
