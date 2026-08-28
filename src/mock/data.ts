// ============================================================
// Mock 数据层 —— 后端就绪后可整体替换为真实 API 调用
// ============================================================

export interface MemberRow {
  id: number
  name: string
  role: '管理员' | '操作员' | '审计员' | '访客'
  org: string
  level: '国家级' | '省级' | '市级' | '区级' | '院级'
  status: '在线' | '离线' | '审批中'
  joinDate: string
}

export const members: MemberRow[] = [
  { id: 1, name: '林若曦', role: '管理员', org: '国家生物安全中心', level: '国家级', status: '在线', joinDate: '2024-03-12' },
  { id: 2, name: '陈砚之', role: '操作员', org: '华东省疾控中心', level: '省级', status: '在线', joinDate: '2024-05-08' },
  { id: 3, name: '苏明远', role: '审计员', org: '江城市卫生厅', level: '市级', status: '离线', joinDate: '2024-06-21' },
  { id: 4, name: '周清禾', role: '操作员', org: '高新区人民医院', level: '区级', status: '审批中', joinDate: '2024-07-02' },
  { id: 5, name: '何思源', role: '访客', org: '北方医科大学实验室', level: '院级', status: '在线', joinDate: '2024-08-15' },
  { id: 6, name: '郑书瑶', role: '操作员', org: '华南省疾控研究院', level: '省级', status: '离线', joinDate: '2024-09-03' },
  { id: 7, name: '马知远', role: '管理员', org: '西部生物样本库', level: '国家级', status: '在线', joinDate: '2024-10-19' },
  { id: 8, name: '冯亦舒', role: '审计员', org: '滨海市检验中心', level: '市级', status: '审批中', joinDate: '2024-11-27' },
  { id: 9, name: '韩沐辰', role: '操作员', org: '云岭省监测站', level: '省级', status: '在线', joinDate: '2025-01-09' },
  { id: 10, name: '叶清欢', role: '访客', org: '江城大学附属医院', level: '院级', status: '离线', joinDate: '2025-02-14' },
  { id: 11, name: '邵云帆', role: '操作员', org: '江南市疾控中心', level: '市级', status: '在线', joinDate: '2025-03-22' },
  { id: 12, name: '唐知夏', role: '审计员', org: '高原省样本中心', level: '省级', status: '离线', joinDate: '2025-04-30' },
]

// ---------- 图表数据 ----------
export const lineMonths = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月']

export const lineSeries = {
  visits: [820, 932, 901, 1290, 1330, 1620, 1450, 1780],
  tasks: [260, 410, 380, 520, 610, 730, 690, 880],
}

export const barCategories = ['Vue3', 'React', 'Svelte', 'Angular', 'Solid', 'Qwit']
export const barValues = [92, 86, 74, 61, 55, 42]

export const pieData = [
  { name: '表单交互', value: 38 },
  { name: '数据可视化', value: 27 },
  { name: '动效演示', value: 19 },
  { name: '路由布局', value: 16 },
]

export const gaugeValue = 86

// 生成实时刷新用的随机游走序列
export function nextWalk(prev: number, amp = 120, min = 400, max = 2000): number {
  const delta = (Math.random() - 0.5) * 2 * amp
  return Math.min(max, Math.max(min, Math.round(prev + delta)))
}
