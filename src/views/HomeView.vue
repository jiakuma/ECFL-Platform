<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ArrowRight } from '@element-plus/icons-vue'
import StatCounter from '@/components/StatCounter.vue'
import EChart from '@/components/EChart.vue'
import AppIcon from '@/components/AppIcon.vue'
import ParticleNetwork from '@/components/ParticleNetwork.vue'
import slide1 from '@/assets/carousel/slide1.jpg'
import slide2 from '@/assets/carousel/slide2.jpg'
import slide3 from '@/assets/carousel/slide3.jpg'
import slide4 from '@/assets/carousel/slide4.jpg'

const router = useRouter()

// ---------- 实时时钟（真实感） ----------
const now = ref('')
let clockTimer: number | undefined
function tickClock() {
  now.value = new Date().toLocaleString('zh-CN', { hour12: false })
}

// ---------- 信任态势指标（四大维度：联盟规模 · 可信节点 · 协同计算 · 安全合规） ----------
const toneColor: Record<string, string> = {
  primary: '#6366f1',
  accent: '#06b6d4',
  violet: '#8b5cf6',
  blue: '#3b82f6',
  purple: '#a855f7',
  ice: '#22d3ee',
  success: '#10b981',
  rose: '#f43f5e',
}
const metrics = [
  {
    label: '参与机构',
    sublabel: '联盟规模',
    value: 28,
    suffix: ' 家',
    decimals: 0,
    icon: 'building',
    tone: 'primary',
    trend: '+3 本月新增',
    trendType: 'up' as const,
    sub: '跨 6 个联盟协同',
    subIcon: 'network',
  },
  {
    label: '可信计算节点',
    sublabel: '接入能力',
    value: 12,
    suffix: ' / 13',
    decimals: 0,
    icon: 'cpu',
    tone: 'accent',
    trend: '12 在线 · 1 待认证',
    trendType: 'info' as const,
    sub: 'CA 认证通过率 92.3%',
    subIcon: 'shield',
  },
  {
    label: '联邦协作任务',
    sublabel: '协同计算',
    value: 156,
    suffix: ' 个',
    decimals: 0,
    icon: 'share',
    tone: 'violet',
    trend: '+8 今日完成',
    trendType: 'up' as const,
    sub: '训练中 23 · 已完成 133',
    subIcon: 'cpu',
  },
  {
    label: '数据合规拦截',
    sublabel: '安全合规',
    value: 0,
    suffix: ' 次',
    decimals: 0,
    icon: 'shield',
    tone: 'success',
    trend: '本月异常调用 0',
    trendType: 'safe' as const,
    sub: '合规率 99.7%',
    subIcon: 'lock',
  },
]

// ---------- 联盟拓扑网络（身份可信互认） ----------
// 模型：深空星系布局。每个节点都是独立恒星，通过 depth 体现远近立体感：
// depth 越大越近（更大/更亮/更清晰），越小越远（更小/更暗/微模糊）。
// 同一联盟的节点自然聚集成松散星系，近处节点显示标签，远处只保留光点。
const statusColor: Record<string, string> = { online: '#10b981', pending: '#f59e0b', offline: '#94a0b8' }
const statusText: Record<string, string> = { online: '在线·已认证', pending: '待认证', offline: '离线' }

// 固定随机种子（LCG）：保证每次刷新拓扑布局完全一致，同一联盟的节点位置固定不变。
let _seed = 20260825
function rand(min: number, max: number) {
  _seed = (_seed * 1664525 + 1013904223) >>> 0
  const v = _seed / 4294967296
  return min + v * (max - min)
}

// 按联盟着色：同一联盟内所有节点使用同一套色系；牵头节点用联盟主色，成员用同色系提亮。
// 节点状态（在线/待认证/离线）通过描边样式表达，不再改变填充色，以保证联盟色彩一致性。
function lighten(hex: string, amount: number) {
  const num = parseInt(hex.replace('#', ''), 16)
  const r = Math.min(255, Math.round((num >> 16) + (255 - (num >> 16)) * amount))
  const g = Math.min(255, Math.round(((num >> 8) & 0x00ff) + (255 - ((num >> 8) & 0x00ff)) * amount))
  const b = Math.min(255, Math.round((num & 0x0000ff) + (255 - (num & 0x0000ff)) * amount))
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`
}
function muted(hex: string, strength = 0.55) {
  const c = parseInt(hex.replace('#', ''), 16)
  const r = Math.round(((c >> 16) + 128) * (1 - strength))
  const g = Math.round((((c >> 8) & 0x00ff) + 128) * (1 - strength))
  const b = Math.round(((c & 0x0000ff) + 128) * (1 - strength))
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`
}
function nodeFill(n: AllianceNode) {
  if (n.status === 'offline') return muted(n.allianceColor, 0.5)
  if (n.role === 'leader') return n.allianceColor
  return lighten(n.allianceColor, 0.24)
}
function nodeStroke(n: AllianceNode) {
  if (n.status === 'offline') return '#94a0b8'
  if (n.status === 'pending') return lighten(n.allianceColor, 0.65)
  if (n.depth > 0.6) return n.role === 'leader' ? '#fff' : lighten(n.allianceColor, 0.55)
  return 'rgba(255,255,255,0.35)'
}

interface AllianceNode {
  id: string
  name: string
  status: 'online' | 'pending' | 'offline'
  role: 'leader' | 'member'
  alliance: string
  allianceColor: string
  x: number
  y: number
  depth: number // 0 = 最远，1 = 最近
  r: number
  idx: number
  floatDelay: number
  floatAmp: number
  angle: number // 标签排布方向（相对于联盟中心的角度）
}

interface Star {
  x: number
  y: number
  r: number
  opacity: number
  duration: number
  delay: number
}

const alliances = [
  {
    name: '国家食管癌协作网',
    color: '#6366f1',
    leader: { name: '国家癌症中心', status: 'online' as const },
    members: [
      { name: '江城人民医院', status: 'online' as const },
      { name: '云岭监测站', status: 'online' as const },
      { name: '华南省疾控', status: 'pending' as const },
      { name: '北方肿瘤', status: 'online' as const },
    ],
  },
  {
    name: '华东食管癌协作体',
    color: '#06b6d4',
    leader: { name: '华东肿瘤医院', status: 'online' as const },
    members: [
      { name: '南方医科大', status: 'online' as const },
      { name: '滨海检验中心', status: 'offline' as const },
      { name: '长三角医院', status: 'online' as const },
      { name: '浙江省肿瘤', status: 'online' as const },
    ],
  },
  {
    name: '华南早筛联盟',
    color: '#8b5cf6',
    leader: { name: '广东省医院', status: 'online' as const },
    members: [
      { name: '深圳三院', status: 'online' as const },
      { name: '福建肿瘤', status: 'online' as const },
      { name: '广西医科大', status: 'pending' as const },
    ],
  },
  {
    name: '华中科研联盟',
    color: '#3b82f6',
    leader: { name: '武汉协和', status: 'online' as const },
    members: [
      { name: '湘雅医院', status: 'online' as const },
      { name: '河南省肿瘤', status: 'pending' as const },
      { name: '同济医院', status: 'online' as const },
      { name: '南昌一附院', status: 'online' as const },
    ],
  },
  {
    name: '西部样本联盟',
    color: '#a855f7',
    leader: { name: '西部样本库', status: 'pending' as const },
    members: [
      { name: '华西医院', status: 'online' as const },
      { name: '西南肿瘤', status: 'online' as const },
      { name: '西安交大一附院', status: 'online' as const },
      { name: '重庆肿瘤', status: 'online' as const },
    ],
  },
  {
    name: '东北防治联盟',
    color: '#22d3ee',
    leader: { name: '哈医大肿瘤', status: 'online' as const },
    members: [
      { name: '辽宁省肿瘤', status: 'online' as const },
      { name: '吉林省肿瘤', status: 'pending' as const },
    ],
  },
]

// 联盟星系中心（画布坐标）：分散到四角与中轴，留出充足标签空间
const galaxyCenters = [
  { x: 170, y: 150 },
  { x: 730, y: 150 },
  { x: 170, y: 410 },
  { x: 730, y: 410 },
  { x: 450, y: 120 },
  { x: 450, y: 440 },
]

const svgW = 900
const svgH = 540
const pad = 52

let globalIdx = 0
const nodes: AllianceNode[] = []
alliances.forEach((a, gi) => {
  const center = galaxyCenters[gi]
  // 牵头节点：更近、更大
  nodes.push({
    id: `${a.name}-leader`,
    name: a.leader.name,
    status: a.leader.status,
    role: 'leader',
    alliance: a.name,
    allianceColor: a.color,
    x: center.x + rand(-34, 34),
    y: center.y + rand(-28, 28),
    depth: rand(0.72, 1),
    r: 0,
    idx: globalIdx++,
    floatDelay: rand(0, 4),
    floatAmp: rand(3, 6),
    angle: -Math.PI / 2,
  })
  // 成员围绕星系中心按固定角度均匀分布，避免重叠、保持同一联盟聚集
  const memberCount = a.members.length
  const baseAngle = rand(0, Math.PI * 2)
  a.members.forEach((m, mi) => {
    const angle = baseAngle + (mi / memberCount) * Math.PI * 2
    // 半径做轻微错落，避免挤在同一圆周上；同时远离联盟中心减少标签重叠
    const radius = rand(95, 135) + (mi % 2) * rand(12, 28)
    const x = Math.max(pad, Math.min(svgW - pad, center.x + radius * Math.cos(angle)))
    const y = Math.max(pad, Math.min(svgH - pad, center.y + radius * Math.sin(angle)))
    nodes.push({
      id: `${a.name}-${m.name}`,
      name: m.name,
      status: m.status,
      role: 'member',
      alliance: a.name,
      allianceColor: a.color,
      x,
      y,
      depth: rand(0.6, 0.9),
      r: 0,
      idx: globalIdx++,
      floatDelay: rand(0, 4),
      floatAmp: rand(2, 4),
      angle,
    })
  })
})

// 根据远近计算半径：越近越大
nodes.forEach((n) => {
  const base = n.role === 'leader' ? 14 : rand(5.5, 10)
  n.r = Math.round(base * (0.55 + n.depth * 0.45) * 10) / 10
})

// 修正标签角度：若按当前方向标签会超出画布或被边缘截断，则翻转向内
nodes.forEach((n) => {
  const labelOffset = n.r + 34
  const fontSize = 12 + n.depth * 1.6
  const textW = n.name.length * fontSize * 0.6
  const cos = Math.cos(n.angle)
  const sin = Math.sin(n.angle)
  const x = n.x + labelOffset * cos
  const y = n.y + labelOffset * sin
  const edgePad = 10
  let overflow = false
  if (Math.abs(cos) < 0.35) {
    // 上下方向
    overflow = y < edgePad + fontSize / 2 || y > svgH - edgePad - fontSize / 2
  } else {
    const anchor = cos > 0 ? 'start' : 'end'
    if (anchor === 'start') overflow = x + textW > svgW - edgePad
    if (anchor === 'end') overflow = x - textW < edgePad
    overflow = overflow || y < edgePad || y > svgH - edgePad
  }
  if (overflow) n.angle += Math.PI
})

// 背景星空：稀疏、低调的小恒星，避免与机构节点混淆
const stars: Star[] = []
for (let i = 0; i < 55; i++) {
  stars.push({
    x: rand(0, svgW),
    y: rand(0, svgH),
    r: rand(0.25, 1.1),
    opacity: rand(0.12, 0.4),
    duration: rand(3, 8),
    delay: rand(-5, 0),
  })
}

// 连线：同一联盟内，牵头节点连接所有成员（保证联盟结构完整、不断裂），
// 同时成员之间距离较近的也连线，增强网状协作感。不跨联盟连线。
interface TopologyLink {
  x1: number
  y1: number
  x2: number
  y2: number
  color: string
  status: 'online' | 'pending' | 'offline'
  opacity: number
  dash: string
  idx: number
}
const links: TopologyLink[] = []
const linkDist = 175
const byAlliance: Record<string, AllianceNode[]> = {}
nodes.forEach((n) => {
  if (!byAlliance[n.alliance]) byAlliance[n.alliance] = []
  byAlliance[n.alliance].push(n)
})
Object.values(byAlliance).forEach((group) => {
  const leader = group.find((n) => n.role === 'leader')
  // 牵头节点连接所有成员，确保联盟内部不会"断开"
  if (leader) {
    group.forEach((m) => {
      if (m === leader) return
      links.push({
        x1: leader.x, y1: leader.y, x2: m.x, y2: m.y,
        color: leader.allianceColor,
        status: leader.status === 'offline' || m.status === 'offline' ? 'offline' : 'online',
        opacity: 0.2 + (leader.depth + m.depth) * 0.13,
        dash: '3 6',
        idx: links.length,
      })
    })
  }
  // 成员之间靠近的也连线（阈值放宽，避免成员间脱节）
  const members = group.filter((n) => n.role === 'member')
  for (let i = 0; i < members.length; i++) {
    for (let j = i + 1; j < members.length; j++) {
      const a = members[i]
      const b = members[j]
      const dx = a.x - b.x
      const dy = a.y - b.y
      const dist = Math.sqrt(dx * dx + dy * dy)
      if (dist < linkDist) {
        links.push({
          x1: a.x, y1: a.y, x2: b.x, y2: b.y,
          color: a.allianceColor,
          status: a.status === 'offline' || b.status === 'offline' ? 'offline' : 'online',
          opacity: 0.16 + (a.depth + b.depth) * 0.12,
          dash: '3 6',
          idx: links.length,
        })
      }
    }
  }
})

// ---------- 实时可信事件流 ----------
const eventPool = [
  { text: '新联盟「华东食管癌协作体」完成节点握手认证', status: 'online' },
  { text: '联邦任务 #F-2031 第 12 轮安全聚合完成', status: 'online' },
  { text: '江城人民医院 申请使用数据集「内镜影像 v2」', status: 'pending' },
  { text: '数据调用合规校验通过（用途：早筛模型推理）', status: 'online' },
  { text: '滨海检验中心 节点离线，已触发自动重连', status: 'offline' },
  { text: '西部样本库 通过 CA 认证，加入可信空间', status: 'online' },
  { text: '联邦任务 #F-2044 模型评估 AUC 提升至 0.91', status: 'online' },
  { text: '多模态资源「病理切片组 A」完成特征对齐', status: 'pending' },
  { text: '国家癌症中心 审批通过「内镜影像 v2」使用申请', status: 'online' },
  { text: '东北防治联盟 完成第 3 轮模型评估', status: 'online' },
  { text: '广东省医院 上传多模态样本 128 例', status: 'online' },
  { text: '联邦任务 #F-2056 启动：食管癌淋巴结转移预测', status: 'online' },
  { text: '数据安全审计：本月异常调用 0 次', status: 'online' },
  { text: '华东肿瘤医院 邀请 南方医科大 加入联盟', status: 'pending' },
  { text: '华西医院 完成隐私计算节点版本升级', status: 'online' },
  { text: '华中科研联盟 更新数据使用策略 v2.1', status: 'online' },
  { text: '浙江省肿瘤 完成联邦任务 #F-2044 本地epoch', status: 'online' },
]
const feeds = ref<{ id: number; text: string; status: string; time: string }[]>([])
let feedTimer: number | undefined
let feedId = 0
function pushFeed(seed = false) {
  const pick = eventPool[Math.floor(Math.random() * eventPool.length)]
  const pool = ['online', 'online', 'online', 'pending', 'offline']
  const status = seed ? 'online' : pool[Math.floor(Math.random() * pool.length)]
  feeds.value.unshift({
    id: feedId++,
    text: pick.text,
    status,
    time: new Date().toLocaleTimeString('zh-CN', { hour12: false }),
  })
  if (feeds.value.length > 11) feeds.value.pop()
}

onMounted(() => {
  tickClock()
  clockTimer = window.setInterval(tickClock, 1000)
  for (let i = 0; i < 8; i++) pushFeed(true)
  feedTimer = window.setInterval(() => pushFeed(false), 2800)
  slideTimer = window.setInterval(nextSlide, 6000)
})
onBeforeUnmount(() => {
  if (clockTimer) clearInterval(clockTimer)
  if (feedTimer) clearInterval(feedTimer)
  if (slideTimer) clearInterval(slideTimer)
})

// ---------- 图表：可信数据空间运行态势 ----------
// 左图：协作增长 —— 三类任务堆叠面积图 + 时间筛选
const timeRange = ref<'7d' | '30d' | 'quarter'>('quarter')

const trendData: Record<string, { labels: string[]; train: number[]; infer: number[]; analysis: number[]; marks: { idx: number; label: string }[] }> = {
  '7d': {
    labels: ['周一', '周二', '周三', '周四', '周五', '周六', '周日'],
    train: [3, 5, 4, 6, 8, 2, 4],
    infer: [8, 10, 12, 9, 14, 6, 11],
    analysis: [2, 3, 2, 4, 3, 1, 2],
    marks: [{ idx: 4, label: '华东协作体加入' }],
  },
  '30d': {
    labels: ['第1周', '第2周', '第3周', '第4周'],
    train: [18, 22, 26, 31],
    infer: [42, 55, 61, 73],
    analysis: [8, 11, 10, 14],
    marks: [{ idx: 2, label: '大型训练任务完成' }],
  },
  quarter: {
    labels: ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月'],
    train: [12, 18, 16, 24, 29, 33, 31, 38],
    infer: [42, 55, 61, 73, 80, 92, 88, 104],
    analysis: [5, 8, 7, 11, 10, 14, 12, 16],
    marks: [{ idx: 3, label: '新增3家机构接入' }, { idx: 6, label: '跨联盟任务启动' }],
  },
}

function buildLineOption() {
  const d = trendData[timeRange.value]
  return {
    grid: { left: 44, right: 16, top: 48, bottom: 32 },
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(255,255,255,0.96)',
      borderColor: '#e5e9f3',
      textStyle: { color: '#1c2230', fontSize: 12 },
      axisPointer: { type: 'line', lineStyle: { color: '#6366f1', type: 'dashed' } },
    },
    legend: {
      data: ['训练任务', '推理任务', '数据分析'],
      top: 0,
      right: 0,
      icon: 'roundRect',
      itemWidth: 14,
      itemHeight: 8,
      textStyle: { color: '#5a6276', fontSize: 12 },
    },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: d.labels,
      axisLine: { lineStyle: { color: '#d3d9e8' } },
      axisTick: { show: false },
      axisLabel: { color: '#94a0b8', fontSize: 12 },
    },
    yAxis: {
      type: 'value',
      splitLine: { lineStyle: { color: '#eef1f9' } },
      axisLabel: { color: '#94a0b8', fontSize: 12 },
    },
    series: [
      {
        name: '训练任务',
        type: 'line',
        stack: 'total',
        smooth: true,
        data: d.train,
        showSymbol: false,
        symbolSize: 7,
        lineStyle: { width: 2.5, color: '#6366f1' },
        itemStyle: { color: '#6366f1', borderWidth: 2, borderColor: '#fff' },
        emphasis: { focus: 'series', showSymbol: true },
        areaStyle: {
          color: {
            type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(99,102,241,0.40)' },
              { offset: 0.7, color: 'rgba(99,102,241,0.08)' },
              { offset: 1, color: 'rgba(99,102,241,0.01)' },
            ],
          },
        },
      },
      {
        name: '推理任务',
        type: 'line',
        stack: 'total',
        smooth: true,
        data: d.infer,
        showSymbol: false,
        symbolSize: 7,
        lineStyle: { width: 2.5, color: '#06b6d4' },
        itemStyle: { color: '#06b6d4', borderWidth: 2, borderColor: '#fff' },
        emphasis: { focus: 'series', showSymbol: true },
        areaStyle: {
          color: {
            type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(6,182,212,0.35)' },
              { offset: 0.7, color: 'rgba(6,182,212,0.06)' },
              { offset: 1, color: 'rgba(6,182,212,0.01)' },
            ],
          },
        },
      },
      {
        name: '数据分析',
        type: 'line',
        stack: 'total',
        smooth: true,
        data: d.analysis,
        showSymbol: false,
        symbolSize: 7,
        lineStyle: { width: 2.5, color: '#8b5cf6' },
        itemStyle: { color: '#8b5cf6', borderWidth: 2, borderColor: '#fff' },
        emphasis: { focus: 'series', showSymbol: true },
        areaStyle: {
          color: {
            type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(139,92,246,0.30)' },
              { offset: 0.7, color: 'rgba(139,92,246,0.05)' },
              { offset: 1, color: 'rgba(139,92,246,0.01)' },
            ],
          },
        },
        // 关键事件标记点
        markPoint: d.marks.length > 0 ? {
          symbol: 'pin',
          symbolSize: 42,
          itemStyle: { color: '#6366f1', shadowColor: 'rgba(99,102,241,0.35)', shadowBlur: 10 },
          label: { show: true, fontSize: 9, color: '#fff', fontWeight: 700 },
          data: d.marks.map(m => ({
            coord: [m.idx, d.train[m.idx] + d.infer[m.idx] + d.analysis[m.idx]],
            value: m.label,
            label: { formatter: m.label.length > 6 ? m.label.slice(0, 6) + '…' : m.label, fontSize: 8 },
          })),
        } : undefined,
      },
    ],
  }
}
const lineOption = computed(() => buildLineOption())

// 中图：数据安全 —— 合规率圆环 + 辅助指标
const complianceMetrics = [
  { label: '本月调用', value: '2,847', unit: '次', icon: 'files', tone: 'primary' },
  { label: '风险阻断', value: '0', unit: '次', icon: 'shield', tone: 'success' },
  { label: '审计通过率', value: '100', unit: '%', icon: 'lock', tone: 'accent' },
]

// 右图：资源规模 —— 横向分布条
const resourceBars = [
  { label: '影像数据', value: 5420, total: 12847, color: '#6366f1', colorEnd: '#818cf8', tone: 'primary', institutions: 18, growth: '+12%' },
  { label: '病理数据', value: 3468, total: 12847, color: '#8b5cf6', colorEnd: '#a78bfa', tone: 'violet', institutions: 14, growth: '+8%' },
  { label: '基因数据', value: 2312, total: 12847, color: '#06b6d4', colorEnd: '#22d3ee', tone: 'accent', institutions: 9, growth: '+15%' },
  { label: '文本报告', value: 1647, total: 12847, color: '#a855f7', colorEnd: '#c084fc', tone: 'purple', institutions: 22, growth: '+5%' },
]
const resourceTotal = 12847

const gaugeOption = {
  series: [
    // 底色轨道
    {
      type: 'gauge',
      startAngle: 90,
      endAngle: -270,
      min: 0,
      max: 100,
      radius: '80%',
      pointer: { show: false },
      progress: { show: false },
      axisLine: {
        roundCap: true,
        lineStyle: { width: 18, color: [[1, '#f0f2fa']] },
      },
      axisTick: { show: false },
      splitLine: { show: false },
      axisLabel: { show: false },
      detail: { show: false },
      data: [{ value: 0 }],
      animation: false,
    },
    // 主进度环
    {
      type: 'gauge',
      startAngle: 90,
      endAngle: -270,
      min: 0,
      max: 100,
      radius: '80%',
      pointer: { show: false },
      progress: {
        show: true,
        width: 18,
        roundCap: true,
        itemStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 1,
            y2: 1,
            colorStops: [
              { offset: 0, color: '#6366f1' },
              { offset: 0.4, color: '#3b82f6' },
              { offset: 0.7, color: '#06b6d4' },
              { offset: 1, color: '#8b5cf6' },
            ],
          },
          shadowColor: 'rgba(99,102,241,0.5)',
          shadowBlur: 18,
        },
      },
      axisLine: { show: false },
      axisTick: { show: false },
      splitLine: { show: false },
      axisLabel: { show: false },
      anchor: { show: false },
      detail: {
        valueAnimation: true,
        formatter: '{value}%',
        color: '#6366f1',
        fontSize: 34,
        fontWeight: 800,
        fontFamily: 'Inter, system-ui, sans-serif',
        offsetCenter: [0, '0%'],
        textShadowColor: 'rgba(99,102,241,0.2)',
        textShadowBlur: 10,
      },
      title: {
        show: true,
        offsetCenter: [0, '24%'],
        color: '#94a3b8',
        fontSize: 12,
        fontWeight: 500,
      },
      data: [{ value: 99.7, name: '数据调用合规率' }],
      animationDuration: 2200,
      animationEasing: 'cubicOut',
    },
  ],
}

// 右图已替换为纯 HTML/CSS 横向资源分布条，不再需要 pieOption

// ---------- 功能介绍轮播（仅图片） ----------
const slides = [
  { image: slide1 },
  { image: slide2 },
  { image: slide3 },
  { image: slide4 },
]

const activeSlide = ref(0)
let slideTimer: number | undefined

function nextSlide() {
  activeSlide.value = (activeSlide.value + 1) % slides.length
}
function prevSlide() {
  activeSlide.value = (activeSlide.value - 1 + slides.length) % slides.length
}
function goToSlide(i: number) {
  activeSlide.value = i
  resetSlideTimer()
}
function resetSlideTimer() {
  clearInterval(slideTimer)
  slideTimer = window.setInterval(nextSlide, 6000)
}

const quickLinks = [
  { title: '专病数据中心', desc: '患者主档案 · 多模态资源 · 专病检索', icon: 'files', to: '/dataset/patients', tone: 'primary' },
  { title: '联盟协作', desc: '创建联盟 · 共享资源目录 · 成员授权', icon: 'share', to: '/alliance/list', tone: 'accent' },
  { title: '联邦任务管理', desc: '任务列表 · 训练看板 · 模型评估', icon: 'cpu', to: '/federated/list', tone: 'violet' },
  { title: '系统管理', desc: '用户角色 · 机构节点 · 授权策略', icon: 'setting', to: '/settings/users', tone: 'blue' },
]
</script>

<template>
  <div class="overview">
    <!-- HERO -->
    <section class="hero">
      <div class="hero__bg" aria-hidden="true">
        <ParticleNetwork />
      </div>
      <div class="hero__inner">
        <span class="hero__eyebrow rise" style="--delay: 0.05s">TRUSTED · 可信数据空间</span>
        <h1 class="hero__title rise" style="--delay: 0.15s">
          食管癌全维专病<span class="hl">联邦学习</span>平台
        </h1>
        <p class="hero__sub rise" style="--delay: 0.28s">
          数据可用不可见，价值安全流转 —— 多机构在数据不出域的前提下，协同训练食管癌专病模型。
        </p>
        <div class="hero__badges rise" style="--delay: 0.4s">
          <span class="badge"><AppIcon name="shield" tone="primary" /><span>已通过 CA 认证</span></span>
          <span class="badge"><AppIcon name="lock" tone="accent" /><span>数据不出域</span></span>
          <span class="badge"><AppIcon name="network" tone="violet" /><span>28 家机构协同</span></span>
        </div>
        <div class="hero__status rise" style="--delay: 0.5s">
          <span><b>{{ now || '—' }}</b> 系统时间</span>
          <span class="sep"></span>
          <span><b>12 / 13</b> 节点在线</span>
          <span class="sep"></span>
          <span><b>1.24k/min</b> 数据调用</span>
          <span class="sep"></span>
          <span><b>UTC+8</b> 华东区域</span>
        </div>
      </div>
    </section>

    <!-- 功能介绍轮播（纯图片） -->
    <section class="showcase" v-reveal>
      <div class="showcase__viewport">
        <div
          class="showcase__track"
          :style="{ transform: `translateX(-${activeSlide * 100}%)` }"
        >
          <div
            v-for="(slide, i) in slides"
            :key="i"
            class="showcase__slide"
          >
            <img :src="slide.image" :alt="`功能介绍 ${i + 1}`" class="showcase__img" />
          </div>
        </div>
      </div>
      <!-- 底部控件 -->
      <div class="showcase__controls">
        <button class="showcase__arrow showcase__arrow--prev" @click="prevSlide(); resetSlideTimer()">
          <el-icon><ArrowRight /></el-icon>
        </button>
        <div class="showcase__dots">
          <button
            v-for="(_, i) in slides"
            :key="i"
            class="showcase__dot"
            :class="{ 'is-active': i === activeSlide }"
            @click="goToSlide(i)"
          ></button>
        </div>
        <button class="showcase__arrow showcase__arrow--next" @click="nextSlide(); resetSlideTimer()">
          <el-icon><ArrowRight /></el-icon>
        </button>
      </div>
    </section>

    <!-- 信任态势指标（四大维度） -->
    <section class="metrics">
      <div
        v-for="(m, i) in metrics"
        :key="m.label"
        class="pf-card metric"
        :class="'metric--' + m.tone"
        v-reveal
        :style="{ '--delay': i * 0.06 + 's' }"
      >
        <div class="metric__top">
          <div class="metric__icon"><AppIcon :name="m.icon" :tone="m.tone" /></div>
          <span class="metric__badge" :class="'metric__badge--' + m.trendType">
            <span v-if="m.trendType === 'up'" class="metric__badge-dot metric__badge-dot--up"></span>
            <span v-else-if="m.trendType === 'safe'" class="metric__badge-dot metric__badge-dot--safe"></span>
            <span v-else-if="m.trendType === 'info'" class="metric__badge-dot metric__badge-dot--info"></span>
            {{ m.trend }}
          </span>
        </div>
        <div class="metric__num">
          <StatCounter :value="m.value" :suffix="m.suffix" :decimals="(m.decimals as number) || 0" />
        </div>
        <div class="metric__label-row">
          <span class="metric__label">{{ m.label }}</span>
          <span class="metric__sublabel">{{ m.sublabel }}</span>
        </div>
        <div class="metric__sub">
          <AppIcon :name="m.subIcon" :tone="m.tone" class="metric__sub-icon" />
          <span>{{ m.sub }}</span>
        </div>
      </div>
    </section>

    <!-- 拓扑 + 事件流 -->
    <section class="grid-2">
      <div class="pf-card panel" v-reveal>
        <div class="panel__head">
          <div>
            <h3 class="panel__title">联盟拓扑</h3>
          </div>
          <div class="legend">
            <span><i class="dot dot--online"></i>在线</span>
            <span><i class="dot dot--pending"></i>待认证</span>
            <span><i class="dot dot--offline"></i>离线</span>
            <span><i class="dot dot--leader"></i>牵头节点</span>
          </div>
        </div>
        <svg class="net net--galaxy" viewBox="0 0 900 540" role="img" aria-label="联盟拓扑">
          <defs>
            <!-- 深空背景：中心稍亮、四周暗蓝紫 -->
            <radialGradient id="spaceBg" cx="50%" cy="45%" r="75%">
              <stop offset="0%" stop-color="#151c3a" />
              <stop offset="45%" stop-color="#0d1228" />
              <stop offset="100%" stop-color="#060815" />
            </radialGradient>
            <!-- 星云色块 -->
            <radialGradient id="nebula1" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stop-color="rgba(99, 102, 241, 0.22)" />
              <stop offset="100%" stop-color="transparent" />
            </radialGradient>
            <radialGradient id="nebula2" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stop-color="rgba(6, 182, 212, 0.18)" />
              <stop offset="100%" stop-color="transparent" />
            </radialGradient>
            <radialGradient id="nebula3" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stop-color="rgba(139, 92, 246, 0.18)" />
              <stop offset="100%" stop-color="transparent" />
            </radialGradient>
            <radialGradient id="nebula4" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stop-color="rgba(59, 130, 246, 0.18)" />
              <stop offset="100%" stop-color="transparent" />
            </radialGradient>
            <radialGradient id="nebula5" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stop-color="rgba(168, 85, 247, 0.18)" />
              <stop offset="100%" stop-color="transparent" />
            </radialGradient>
            <radialGradient id="nebula6" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stop-color="rgba(34, 211, 238, 0.16)" />
              <stop offset="100%" stop-color="transparent" />
            </radialGradient>
            <filter id="farBlur" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur in="SourceGraphic" stdDeviation="1.2" />
            </filter>
            <filter id="labelGlow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur in="SourceGraphic" stdDeviation="1.4" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          <!-- 深空底色 -->
          <rect x="0" y="0" width="900" height="540" fill="url(#spaceBg)" rx="16" />

          <!-- 星云雾团（按联盟中心位置） -->
          <circle v-for="(c, i) in galaxyCenters" :key="'neb-' + i" :cx="c.x" :cy="c.y" r="110" :fill="`url(#nebula${i + 1})`" opacity="0.7" />

          <!-- 背景星空 -->
          <circle
            v-for="(s, i) in stars"
            :key="'star-' + i"
            class="star"
            :cx="s.x"
            :cy="s.y"
            :r="s.r"
            fill="#fff"
            :opacity="s.opacity"
            :style="{ animationDuration: s.duration + 's', animationDelay: s.delay + 's' }"
          />

          <!-- 联盟内部与跨星系连线 -->
          <line
            v-for="(l, i) in links"
            :key="'l-' + i"
            :x1="l.x1"
            :y1="l.y1"
            :x2="l.x2"
            :y2="l.y2"
            class="net-line"
            :class="'net-line--' + l.status"
            :stroke="l.status === 'offline' ? '#94a0b8' : l.color"
            :stroke-dasharray="l.dash"
            :opacity="l.opacity"
          />

          <!-- 数据流光点：沿连线流动 -->
          <g v-for="(l, i) in links.filter((x) => x.status !== 'offline' && x.opacity > 0.12)" :key="'p-' + i">
            <circle :r="1.6 + l.opacity" :fill="l.color" class="packet">
              <animate
                attributeName="cx"
                :from="l.x1"
                :to="l.x2"
                :dur="(3 + (i % 4) * 0.6) + 's'"
                repeatCount="indefinite"
                :begin="(-i * 0.8) + 's'"
              />
              <animate
                attributeName="cy"
                :from="l.y1"
                :to="l.y2"
                :dur="(3 + (i % 4) * 0.6) + 's'"
                repeatCount="indefinite"
                :begin="(-i * 0.8) + 's'"
              />
            </circle>
          </g>

          <!-- 节点：星系恒星 -->
          <g
            v-for="n in nodes"
            :key="n.id"
            class="node-group"
            :class="{ 'node-group--far': n.depth < 0.45, 'node-group--offline': n.status === 'offline' }"
            :style="{
              transformOrigin: `${n.x}px ${n.y}px`,
              animationDelay: n.floatDelay + 's',
              animationDuration: (5 + n.floatAmp * 0.35) + 's',
              opacity: n.status === 'offline' ? (0.25 + n.depth * 0.35) : (0.35 + n.depth * 0.65),
            }"
          >
            <!-- 远处节点更模糊、更近更清晰 -->
            <g :filter="n.depth < 0.35 ? 'url(#farBlur)' : undefined">
              <!-- 光晕：牵头和近处成员更强（离线节点弱化） -->
              <circle
                :cx="n.x"
                :cy="n.y"
                :r="n.r + (n.role === 'leader' ? 18 : 8) * (0.5 + n.depth * 0.5)"
                :fill="n.allianceColor"
                :opacity="n.status === 'offline' ? 0.04 : ((n.role === 'leader' ? 0.18 : 0.1) * n.depth)"
              />
              <!-- 牵头节点脉冲 -->
              <circle
                v-if="n.role === 'leader' && n.status === 'online'"
                :cx="n.x"
                :cy="n.y"
                :r="n.r + 10"
                class="pulse"
                :style="{ stroke: n.allianceColor }"
              />
              <!-- 节点本体 -->
              <circle
                :cx="n.x"
                :cy="n.y"
                :r="n.r"
                :fill="nodeFill(n)"
                :stroke="nodeStroke(n)"
                :stroke-width="n.depth > 0.6 ? (n.role === 'leader' ? 2.5 : 2) : 1"
                class="node"
                :class="'node--' + n.role"
              />
              <!-- pending 状态环：柔和同色光晕，无锯齿、无旋转 -->
              <circle
                v-if="n.status === 'pending'"
                :cx="n.x"
                :cy="n.y"
                :r="n.r + 7"
                fill="none"
                :stroke="lighten(n.allianceColor, 0.55)"
                stroke-width="1"
                opacity="0.35"
              />
              <circle
                v-if="n.status === 'pending'"
                :cx="n.x"
                :cy="n.y"
                :r="n.r + 3"
                fill="none"
                :stroke="lighten(n.allianceColor, 0.75)"
                stroke-width="1.2"
                opacity="0.7"
              />
            </g>
            <!-- 标签：沿节点外缘向外偏移，避免遮挡节点；根据方向动态对齐 -->
            <text
              :x="n.x + (n.r + 34) * Math.cos(n.angle)"
              :y="n.y + (n.r + 34) * Math.sin(n.angle)"
              :text-anchor="Math.abs(Math.cos(n.angle)) < 0.35 ? 'middle' : (Math.cos(n.angle) > 0 ? 'start' : 'end')"
              dominant-baseline="middle"
              class="node-label"
              :style="{
                opacity: 0.55 + n.depth * 0.45,
                fontSize: (12 + n.depth * 1.6) + 'px',
                fill: n.depth > 0.75 ? '#ffffff' : '#e8ecff',
                filter: n.depth > 0.65 ? 'url(#labelGlow)' : undefined,
              }"
            >{{ n.name }}</text>
          </g>
        </svg>
      </div>

      <div class="pf-card panel panel--feed" v-reveal>
        <div class="panel__head">
          <div>
            <h3 class="panel__title">实时可信事件</h3>
            <p class="panel__sub">数据空间内的协作与合规动态</p>
          </div>
          <span class="live"><i></i>LIVE</span>
        </div>
        <ul class="feed">
          <li
            v-for="f in feeds"
            :key="f.id"
            class="feed__item"
            :class="'feed__item--' + f.status"
          >
            <span class="feed__dot" :class="'feed__dot--' + f.status"></span>
            <div class="feed__text">{{ f.text }}</div>
            <div class="feed__time">{{ f.time }}</div>
          </li>
        </ul>
      </div>
    </section>

    <!-- 可信数据空间运行态势 -->
    <section class="charts">
      <!-- 左：协作增长 -->
      <div class="pf-card panel chart-card chart-card--wide" v-reveal>
        <div class="panel__head">
          <div>
            <h3 class="panel__title">协作增长趋势</h3>
            <p class="panel__sub">联邦任务按类型分布（训练 / 推理 / 数据分析）</p>
          </div>
          <div class="time-filter">
            <button
              v-for="t in ([{ key: '7d', label: '近7天' }, { key: '30d', label: '近30天' }, { key: 'quarter', label: '季度' }] as const)"
              :key="t.key"
              class="time-filter__btn"
              :class="{ 'is-active': timeRange === t.key }"
              @click="timeRange = t.key"
            >{{ t.label }}</button>
          </div>
        </div>
        <EChart :option="lineOption" />
      </div>
      <!-- 中：数据安全 -->
      <div class="pf-card panel chart-card chart-card--gauge" v-reveal>
        <div class="panel__head">
          <div>
            <h3 class="panel__title">数据安全态势</h3>
            <p class="panel__sub">合规率与安全指标</p>
          </div>
        </div>
        <div class="gauge-wrap">
          <EChart :option="gaugeOption" />
          <div class="gauge-glow"></div>
        </div>
        <div class="compliance-grid">
          <div
            v-for="c in complianceMetrics"
            :key="c.label"
            class="compliance-item"
            :class="'compliance-item--' + c.tone"
          >
            <div class="compliance-item__icon"><AppIcon :name="c.icon" :tone="c.tone" /></div>
            <div class="compliance-item__info">
              <span class="compliance-item__value">{{ c.value }}<small>{{ c.unit }}</small></span>
              <span class="compliance-item__label">{{ c.label }}</span>
            </div>
          </div>
        </div>
      </div>
      <!-- 右：资源规模 -->
      <div class="pf-card panel chart-card" v-reveal>
        <div class="panel__head">
          <div>
            <h3 class="panel__title">多模态资源规模</h3>
            <p class="panel__sub">接入 <strong>{{ resourceTotal.toLocaleString() }}</strong> 条数据</p>
          </div>
        </div>
        <div class="resource-bars">
          <div
            v-for="r in resourceBars"
            :key="r.label"
            class="resource-bar"
          >
            <div class="resource-bar__header">
              <span class="resource-bar__label">{{ r.label }}</span>
              <span class="resource-bar__value">{{ r.value.toLocaleString() }}</span>
            </div>
            <div class="resource-bar__track">
              <div
                class="resource-bar__fill"
                :style="{
                  width: (r.value / r.total * 100).toFixed(1) + '%',
                  background: 'linear-gradient(90deg, ' + r.color + ', ' + r.colorEnd + ')',
                }"
              ></div>
            </div>
            <div class="resource-bar__meta">
              <span><AppIcon name="building" :tone="r.tone" class="resource-bar__meta-icon" />{{ r.institutions }} 家机构</span>
              <span class="resource-bar__growth">{{ r.growth }}</span>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- 业务快捷入口 -->
    <section class="quick">
      <div class="sec-head" v-reveal>
        <span class="pf-eyebrow">QUICK ACCESS</span>
        <h2 class="pf-section-title">进入业务模块</h2>
      </div>
      <div class="quick-grid">
        <router-link
          v-for="(q, i) in quickLinks"
          :key="q.title"
          :to="q.to"
          class="pf-card quick-card"
          v-reveal
          :style="{ '--delay': i * 0.06 + 's' }"
        >
          <div class="quick-card__icon"><AppIcon :name="q.icon" :tone="q.tone" /></div>
          <div class="quick-card__main">
            <h3 class="quick-card__title">{{ q.title }}</h3>
            <p class="quick-card__desc">{{ q.desc }}</p>
          </div>
          <span class="quick-card__arrow"><el-icon><ArrowRight /></el-icon></span>
        </router-link>
      </div>
    </section>
  </div>
</template>

<style scoped>
.overview {
  display: flex;
  flex-direction: column;
  gap: 22px;
}

/* ---------- HERO ---------- */
.hero {
  position: relative;
  overflow: hidden;
  border-radius: 22px;
  padding: 56px 24px 26px;
  background:
    radial-gradient(120% 120% at 80% -10%, rgba(99, 102, 241, 0.22) 0%, transparent 55%),
    radial-gradient(120% 120% at 20% 110%, rgba(6, 182, 212, 0.18) 0%, transparent 55%),
    radial-gradient(circle at 50% 120%, rgba(139, 92, 246, 0.18) 0%, transparent 50%),
    linear-gradient(135deg, #060819 0%, #0b1030 45%, #110f33 100%);
}
.hero__bg {
  position: absolute;
  inset: 0;
  overflow: hidden;
  pointer-events: auto;
}
.hero__inner {
  position: relative;
  z-index: 1;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
}
.hero__eyebrow {
  font-size: 13px;
  letter-spacing: 0.12em;
  color: #a9b4ff;
  font-weight: 600;
  padding: 6px 14px;
  border: 1px solid rgba(169, 180, 255, 0.35);
  border-radius: 999px;
  background: rgba(99, 102, 241, 0.12);
}
.hero__title {
  color: #fff;
  font-size: clamp(30px, 5vw, 52px);
  margin: 18px 0 14px;
  line-height: 1.15;
}
.hero__title .hl {
  background: linear-gradient(120deg, #a9b4ff, #22d3ee 55%, #8b5cf6);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
}
.hero__sub {
  color: #c7cdf0;
  max-width: 640px;
  font-size: clamp(14px, 2vw, 17px);
}
.hero__badges {
  display: flex;
  gap: 12px;
  margin-top: 28px;
  flex-wrap: wrap;
  justify-content: center;
}
.badge {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 9px 16px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.16);
  color: #e6e9ff;
  font-size: 14px;
  font-weight: 600;
  -webkit-backdrop-filter: blur(6px);
  backdrop-filter: blur(6px);
}
.badge :deep(.app-icon) {
  width: 18px;
  height: 18px;
}
.hero__status {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-top: 24px;
  flex-wrap: wrap;
  justify-content: center;
  font-size: 13px;
  color: #aeb6e0;
}
.hero__status b {
  color: #fff;
  font-variant-numeric: tabular-nums;
  font-weight: 700;
}
.hero__status .sep {
  width: 1px;
  height: 14px;
  background: rgba(255, 255, 255, 0.18);
}

/* ---------- 通用面板 ---------- */
.panel {
  padding: 22px;
}
.panel__head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 14px;
}
.panel__title {
  font-size: 18px;
}
.panel__sub {
  font-size: 13px;
  color: var(--pf-text-soft);
  margin-top: 4px;
}

/* ---------- 功能介绍轮播 ---------- */
.showcase {
  position: relative;
  border-radius: 18px;
  background: var(--pf-surface);
  border: 1px solid var(--pf-border);
  overflow: hidden;
}
.showcase__viewport {
  width: 100%;
  overflow: hidden;
  background: #f6f8fc;
}
.showcase__track {
  display: flex;
  width: 100%;
  transition: transform 0.7s cubic-bezier(0.16, 1, 0.3, 1);
}
.showcase__slide {
  flex: 0 0 100%;
  width: 100%;
  display: block;
}
.showcase__img {
  width: 100%;
  height: auto;
  display: block;
}
.showcase__controls {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  padding: 16px 40px 20px;
}
.showcase__arrow {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: 1px solid var(--pf-border);
  background: var(--pf-surface);
  cursor: pointer;
  display: grid;
  place-items: center;
  color: var(--pf-text-faint);
  transition: border-color 0.2s, color 0.2s;
}
.showcase__arrow:hover {
  border-color: #6366f1;
  color: #6366f1;
}
.showcase__arrow--prev {
  transform: rotate(180deg);
}
.showcase__dots {
  display: flex;
  gap: 8px;
}
.showcase__dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  border: none;
  background: #d1d5db;
  cursor: pointer;
  transition: background 0.25s, transform 0.25s;
  padding: 0;
}
.showcase__dot.is-active {
  background: #6366f1;
  transform: scale(1.35);
}


/* ---------- 指标 strip（四大维度：联盟规模 · 可信节点 · 协同计算 · 安全合规） ---------- */
.metrics {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 18px;
}
.metric {
  position: relative;
  padding: 22px 20px 18px;
  display: flex;
  flex-direction: column;
  gap: 5px;
  overflow: hidden;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}
.metric::before {
  content: '';
  position: absolute;
  top: -40px;
  right: -40px;
  width: 120px;
  height: 120px;
  border-radius: 50%;
  filter: blur(42px);
  opacity: 0.16;
  pointer-events: none;
  transition: opacity 0.3s ease;
}
/* 左侧维度色条 */
.metric::after {
  content: '';
  position: absolute;
  top: 18px;
  left: 0;
  width: 3.5px;
  height: 36px;
  border-radius: 0 3px 3px 0;
  opacity: 0.7;
  transition: height 0.3s ease, opacity 0.3s ease;
}
.metric:hover::after {
  height: 52px;
  opacity: 1;
}
.metric:hover {
  transform: translateY(-4px);
  box-shadow: var(--pf-shadow);
}
.metric:hover::before {
  opacity: 0.26;
}
/* -- 色调变体 -- */
.metric--primary {
  background: linear-gradient(135deg, #ffffff 0%, #f7f8ff 100%);
}
.metric--primary::before { background: #6366f1; }
.metric--primary::after { background: linear-gradient(180deg, #6366f1, #8b5cf6); }
.metric--primary .metric__icon {
  background: rgba(99, 102, 241, 0.1);
  border-color: rgba(99, 102, 241, 0.22);
}

.metric--accent {
  background: linear-gradient(135deg, #ffffff 0%, #f0fdff 100%);
}
.metric--accent::before { background: #06b6d4; }
.metric--accent::after { background: linear-gradient(180deg, #06b6d4, #22d3ee); }
.metric--accent .metric__icon {
  background: rgba(6, 182, 212, 0.1);
  border-color: rgba(6, 182, 212, 0.22);
}

.metric--violet {
  background: linear-gradient(135deg, #ffffff 0%, #faf7ff 100%);
}
.metric--violet::before { background: #8b5cf6; }
.metric--violet::after { background: linear-gradient(180deg, #8b5cf6, #a855f7); }
.metric--violet .metric__icon {
  background: rgba(139, 92, 246, 0.1);
  border-color: rgba(139, 92, 246, 0.22);
}

.metric--blue {
  background: linear-gradient(135deg, #ffffff 0%, #f5f9ff 100%);
}
.metric--blue::before { background: #3b82f6; }
.metric--blue::after { background: linear-gradient(180deg, #3b82f6, #60a5fa); }
.metric--blue .metric__icon {
  background: rgba(59, 130, 246, 0.1);
  border-color: rgba(59, 130, 246, 0.22);
}

.metric--success {
  background: linear-gradient(135deg, #ffffff 0%, #f0fdf6 100%);
}
.metric--success::before { background: #10b981; }
.metric--success::after { background: linear-gradient(180deg, #10b981, #34d399); }
.metric--success .metric__icon {
  background: rgba(16, 185, 129, 0.1);
  border-color: rgba(16, 185, 129, 0.22);
}

.metric--rose {
  background: linear-gradient(135deg, #ffffff 0%, #fff5f6 100%);
}
.metric--rose::before { background: #f43f5e; }
.metric--rose::after { background: linear-gradient(180deg, #f43f5e, #fb7185); }
.metric--rose .metric__icon {
  background: rgba(244, 63, 94, 0.1);
  border-color: rgba(244, 63, 94, 0.22);
}

.metric__top {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.metric__icon {
  width: 46px;
  height: 46px;
  border-radius: 13px;
  display: grid;
  place-items: center;
  background: var(--pf-surface-2);
  border: 1px solid var(--pf-border);
  box-shadow: var(--pf-shadow-sm);
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}
.metric:hover .metric__icon {
  transform: scale(1.08);
  box-shadow: 0 6px 18px -6px rgba(99, 102, 241, 0.25);
}
.metric__icon :deep(.app-icon) {
  width: 26px;
  height: 26px;
}
/* 业务动态标签（替代装饰性趋势线） */
.metric__badge {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 11.5px;
  font-weight: 700;
  padding: 4px 10px;
  border-radius: 999px;
  white-space: nowrap;
  letter-spacing: 0.01em;
}
.metric__badge--up {
  color: #6366f1;
  background: rgba(99, 102, 241, 0.10);
}
.metric__badge--info {
  color: #06b6d4;
  background: rgba(6, 182, 212, 0.10);
}
.metric__badge--safe {
  color: #10b981;
  background: rgba(16, 185, 129, 0.10);
}
.metric__badge-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  flex-shrink: 0;
}
.metric__badge-dot--up {
  background: #6366f1;
  box-shadow: 0 0 6px rgba(99, 102, 241, 0.45);
}
.metric__badge-dot--info {
  background: #06b6d4;
  box-shadow: 0 0 6px rgba(6, 182, 212, 0.45);
  animation: blink 2s ease-in-out infinite;
}
.metric__badge-dot--safe {
  background: #10b981;
  box-shadow: 0 0 6px rgba(16, 185, 129, 0.45);
}
.metric__num {
  font-size: clamp(26px, 3vw, 34px);
  font-weight: 800;
  line-height: 1.1;
  color: var(--pf-text);
  margin-top: 2px;
}
.metric__label-row {
  display: flex;
  align-items: baseline;
  gap: 8px;
}
.metric__label {
  font-size: 14px;
  font-weight: 600;
  color: var(--pf-text);
}
.metric__sublabel {
  font-size: 11px;
  font-weight: 600;
  color: var(--pf-text-faint);
  padding: 2px 7px;
  border-radius: 4px;
  background: var(--pf-bg-soft);
  letter-spacing: 0.02em;
}
/* 辅助业务指标行 */
.metric__sub {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 4px;
  padding-top: 10px;
  border-top: 1px solid var(--pf-border);
  font-size: 12px;
  color: var(--pf-text-soft);
}
.metric__sub-icon {
  width: 15px;
  height: 15px;
  flex-shrink: 0;
  opacity: 0.65;
}
.metric__sub span {
  font-weight: 500;
}

/* ---------- 拓扑 + 事件流 ---------- */
.grid-2 {
  display: grid;
  grid-template-columns: 1.7fr 1fr;
  gap: 18px;
}
.legend {
  display: flex;
  gap: 14px;
  font-size: 13px;
  color: var(--pf-text-soft);
}
.legend span {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}
.dot {
  width: 9px;
  height: 9px;
  border-radius: 50%;
  display: inline-block;
}
.dot--online {
  background: var(--pf-success);
}
.dot--pending {
  background: var(--pf-warning);
}
.dot--offline {
  background: var(--pf-text-faint);
}
.dot--leader {
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
}
.net {
  width: 100%;
  height: auto;
  display: block;
  border-radius: 16px;
}
.net--galaxy {
  background: #060815;
}
.net-line {
  fill: none;
  stroke-width: 1.3;
  stroke-linecap: round;
  animation: dash 2.4s linear infinite;
}
.net-line--offline {
  animation: none;
}
@keyframes dash {
  to {
    stroke-dashoffset: -36;
  }
}
.star {
  animation: twinkle ease-in-out infinite;
}
@keyframes twinkle {
  0%, 100% { opacity: 0.2; }
  50% { opacity: 0.9; }
}
.node-group {
  transform-box: fill-box;
  animation: nodeFloat 6s ease-in-out infinite;
}
.node-group--far {
  animation: nodeFloatFar 8s ease-in-out infinite;
}
@keyframes nodeFloat {
  0%, 100% { transform: translate(0, 0); }
  50% { transform: translate(0, -5px); }
}
@keyframes nodeFloatFar {
  0%, 100% { transform: translate(0, 0); }
  50% { transform: translate(0, -2px); }
}
.node {
  filter: drop-shadow(0 2px 6px rgba(0, 0, 0, 0.45));
}
.node--leader {
  filter: drop-shadow(0 4px 12px rgba(0, 0, 0, 0.55));
}
.node-label {
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.02em;
  paint-order: stroke;
  stroke: rgba(15, 23, 42, 0.9);
  stroke-width: 2.5px;
  stroke-linejoin: round;
  pointer-events: none;
}
.packet {
  filter: drop-shadow(0 0 4px currentColor);
}
.pulse {
  fill: none;
  stroke-width: 2;
  transform-box: fill-box;
  transform-origin: center;
  animation: pulse 2.8s ease-out infinite;
}
@keyframes pulse {
  0% { transform: scale(0.75); opacity: 0.6; }
  100% { transform: scale(2.8); opacity: 0; }
}
/* 事件流：浅色卡片面板，与指标卡/快捷入口统一设计语言 */
.panel--feed {
  display: flex;
  flex-direction: column;
  background: var(--pf-surface);
  border: 1px solid var(--pf-border);
}
.panel--feed .panel__title {
  color: var(--pf-text);
}
.panel--feed .panel__sub {
  color: var(--pf-text-soft);
}
.live {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.08em;
  color: var(--pf-primary);
}
.live i {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--pf-primary);
  animation: blink 1.4s ease-in-out infinite;
}
@keyframes blink {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.35;
  }
}
.feed {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 10px;
  overflow: hidden;
}
.feed__item {
  display: grid;
  grid-template-columns: 14px 1fr auto;
  align-items: center;
  gap: 10px;
  padding: 11px 12px;
  border-radius: 12px;
  background: var(--pf-surface-2);
  border: 1px solid var(--pf-border);
  border-left: 3px solid var(--pf-border-strong);
  animation: feedIn 0.5s cubic-bezier(0.22, 1, 0.36, 1) both;
  transition: background 0.25s ease, border-color 0.25s ease, transform 0.25s ease;
}
.feed__item:hover {
  background: #ffffff;
  border-color: var(--pf-border-strong);
  transform: translateX(2px);
}
.feed__item--online {
  border-left-color: #06b6d4;
}
.feed__item--pending {
  border-left-color: #6366f1;
}
.feed__item--offline {
  border-left-color: #94a0b8;
}
@keyframes feedIn {
  from {
    opacity: 0;
    transform: translateY(-8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
.feed__dot {
  width: 9px;
  height: 9px;
  border-radius: 50%;
}
.feed__dot--online {
  background: #06b6d4;
}
.feed__dot--pending {
  background: #6366f1;
}
.feed__dot--offline {
  background: #94a0b8;
}
.feed__text {
  font-size: 13px;
  color: var(--pf-text);
  line-height: 1.4;
}
.feed__time {
  font-size: 12px;
  color: var(--pf-text-faint);
  font-variant-numeric: tabular-nums;
}

/* ---------- 可信数据空间运行态势（图表） ---------- */
.charts {
  display: grid;
  grid-template-columns: 1.7fr 1fr 1fr;
  gap: 18px;
}
.chart-card {
  position: relative;
  overflow: hidden;
  transition: transform 0.35s ease, box-shadow 0.35s ease;
}
.chart-card::before {
  content: '';
  position: absolute;
  inset: 0;
  pointer-events: none;
  background:
    radial-gradient(120% 120% at 100% 0%, rgba(99, 102, 241, 0.06) 0%, transparent 55%),
    radial-gradient(120% 120% at 0% 100%, rgba(6, 182, 212, 0.05) 0%, transparent 55%);
  opacity: 0.6;
  transition: opacity 0.35s ease;
}
.chart-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--pf-shadow-md), 0 20px 40px rgba(99, 102, 241, 0.08);
}
.chart-card:hover::before {
  opacity: 1;
}
.chart-card--wide::after {
  content: '';
  position: absolute;
  top: 12px;
  right: 12px;
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(99, 102, 241, 0.12) 0%, transparent 70%);
  pointer-events: none;
  filter: blur(10px);
}
.chart-card .panel__head {
  position: relative;
  z-index: 1;
}

/* 时间筛选按钮 */
.time-filter {
  display: flex;
  gap: 4px;
  background: var(--pf-bg-soft);
  border-radius: 8px;
  padding: 3px;
}
.time-filter__btn {
  border: none;
  background: transparent;
  color: var(--pf-text-soft);
  font-size: 12px;
  font-weight: 600;
  padding: 5px 12px;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
  font-family: inherit;
}
.time-filter__btn:hover {
  color: var(--pf-text);
}
.time-filter__btn.is-active {
  background: var(--pf-surface);
  color: var(--pf-primary);
  box-shadow: 0 2px 8px rgba(99, 102, 241, 0.15);
}

/* 仪表盘区域 */
.chart-card--gauge {
  overflow: hidden;
  background: linear-gradient(180deg, #fefeff 0%, #fafaff 100%);
}
.chart-card--gauge .echart {
  z-index: 2;
  position: relative;
}
.gauge-wrap {
  position: relative;
  width: 100%;
  height: 200px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.gauge-wrap .echart {
  width: 100% !important;
  height: 100% !important;
}
.gauge-glow {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 200px;
  height: 200px;
  transform: translate(-50%, -50%);
  border-radius: 50%;
  background:
    radial-gradient(circle at 40% 40%, rgba(99, 102, 241, 0.22) 0%, transparent 50%),
    radial-gradient(circle at 65% 60%, rgba(6, 182, 212, 0.16) 0%, transparent 50%),
    radial-gradient(circle at 50% 80%, rgba(139, 92, 246, 0.10) 0%, transparent 45%);
  pointer-events: none;
  filter: blur(16px);
  z-index: 1;
  animation: gaugeGlowPulse 4s ease-in-out infinite alternate;
}
@keyframes gaugeGlowPulse {
  0% { opacity: 0.6; transform: translate(-50%, -50%) scale(0.96); }
  100% { opacity: 1; transform: translate(-50%, -50%) scale(1.04); }
}

/* 合规辅助指标网格 */
.compliance-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
  margin-top: 4px;
  padding-top: 14px;
  border-top: 1px solid var(--pf-border);
}
.compliance-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 8px;
  border-radius: 10px;
  transition: background 0.2s ease;
}
.compliance-item:hover {
  background: rgba(99, 102, 241, 0.06);
}
.compliance-item__icon {
  width: 32px;
  height: 32px;
  flex-shrink: 0;
  border-radius: 8px;
  display: grid;
  place-items: center;
}
.compliance-item--primary .compliance-item__icon {
  background: rgba(99, 102, 241, 0.1);
}
.compliance-item--success .compliance-item__icon {
  background: rgba(16, 185, 129, 0.1);
}
.compliance-item--accent .compliance-item__icon {
  background: rgba(6, 182, 212, 0.1);
}
.compliance-item__icon :deep(.app-icon) {
  width: 18px;
  height: 18px;
}
.compliance-item__info {
  display: flex;
  flex-direction: column;
  min-width: 0;
}
.compliance-item__value {
  font-size: 16px;
  font-weight: 800;
  color: var(--pf-text);
  line-height: 1.2;
  font-variant-numeric: tabular-nums;
}
.compliance-item__value small {
  font-size: 11px;
  font-weight: 600;
  color: var(--pf-text-soft);
  margin-left: 2px;
}
.compliance-item__label {
  font-size: 11px;
  color: var(--pf-text-faint);
  font-weight: 500;
}

/* 资源规模：横向分布条 */
.resource-bars {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding-top: 4px;
}
.resource-bar {
  display: flex;
  flex-direction: column;
  gap: 5px;
}
.resource-bar__header {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
}
.resource-bar__label {
  font-size: 13px;
  font-weight: 600;
  color: var(--pf-text);
}
.resource-bar__value {
  font-size: 13px;
  font-weight: 700;
  color: var(--pf-text-soft);
  font-variant-numeric: tabular-nums;
}
.resource-bar__track {
  height: 10px;
  background: var(--pf-bg-soft);
  border-radius: 6px;
  overflow: hidden;
  position: relative;
}
.resource-bar__fill {
  height: 100%;
  border-radius: 6px;
  transition: width 1s cubic-bezier(0.22, 1, 0.36, 1);
  position: relative;
  box-shadow: 0 2px 8px rgba(99, 102, 241, 0.18);
}
.resource-bar__meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 11px;
  color: var(--pf-text-faint);
}
.resource-bar__meta-icon {
  width: 12px;
  height: 12px;
  opacity: 0.5;
  margin-right: 3px;
  vertical-align: middle;
}
.resource-bar__growth {
  font-weight: 700;
  color: #10b981;
}

/* ---------- 快捷入口 ---------- */
.sec-head {
  margin-bottom: 18px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.quick-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 18px;
}
.quick-card {
  position: relative;
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 22px;
  overflow: hidden;
}
.quick-card__icon {
  width: 48px;
  height: 48px;
  flex: none;
  border-radius: 13px;
  display: grid;
  place-items: center;
  background: var(--pf-surface-2);
  border: 1px solid var(--pf-border);
  box-shadow: var(--pf-shadow-sm);
}
.quick-card__icon :deep(.app-icon) {
  width: 27px;
  height: 27px;
}
.quick-card__main {
  flex: 1;
  min-width: 0;
}
.quick-card__title {
  font-size: 16px;
  margin-bottom: 3px;
}
.quick-card__desc {
  font-size: 12.5px;
  color: var(--pf-text-soft);
}
.quick-card__arrow {
  color: var(--pf-text-faint);
  transition: transform 0.3s ease, color 0.3s ease;
}
.quick-card:hover .quick-card__arrow {
  transform: translateX(5px);
  color: #6366f1;
}

/* ---------- 响应式 ---------- */
@media (max-width: 1080px) {
  .metrics {
    grid-template-columns: repeat(2, 1fr);
  }
  .grid-2 {
    grid-template-columns: 1fr;
  }
  .charts {
    grid-template-columns: 1fr 1fr;
  }
  .chart-card--wide {
    grid-column: span 2;
  }
  .quick-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
@media (max-width: 560px) {
  .metrics,
  .charts,
  .quick-grid {
    grid-template-columns: 1fr;
  }
  .chart-card--wide {
    grid-column: auto;
  }
  .hero {
    padding: 40px 18px 22px;
  }
  .hero__status .sep {
    display: none;
  }
}

/* rise 入场（Hero 元素） */
.rise {
  opacity: 0;
  animation: heroUp 0.9s cubic-bezier(0.22, 1, 0.36, 1) forwards;
  animation-delay: var(--delay, 0s);
}
@keyframes heroUp {
  from {
    opacity: 0;
    transform: translateY(26px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
