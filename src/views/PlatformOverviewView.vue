<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import EChart from '@/components/EChart.vue'
import AppIcon from '@/components/AppIcon.vue'
import StatCounter from '@/components/StatCounter.vue'

// ---------- 核心运行指标（监控属性：在线率 / 趋势 / 实时状态） ----------
const kpi = [
  {
    label: '参与机构',
    sublabel: '联盟规模',
    value: 28,
    suffix: ' 家',
    decimals: 0,
    icon: 'building',
    tone: 'primary',
    badge: '跨 6 个联盟协同',
    badgeType: 'info' as const,
    subIcon: 'network',
    sub: '覆盖国家 / 省 / 市三级节点',
  },
  {
    label: '可信计算节点',
    sublabel: '接入能力',
    value: 12,
    suffix: ' / 13',
    decimals: 0,
    icon: 'cpu',
    tone: 'accent',
    badge: '12 在线 · 1 待认证',
    badgeType: 'info' as const,
    subIcon: 'shield',
    sub: 'CA 认证通过率 92.3%',
  },
  {
    label: '联邦协作任务',
    sublabel: '协同计算',
    value: 156,
    suffix: ' 个',
    decimals: 0,
    icon: 'share',
    tone: 'violet',
    badge: '训练中 23 · 已完成 133',
    badgeType: 'up' as const,
    subIcon: 'cpu',
    sub: '累计安全聚合 4,812 轮',
  },
  {
    label: '数据调用合规率',
    sublabel: '安全合规',
    value: 99.7,
    suffix: '%',
    decimals: 1,
    icon: 'shield',
    tone: 'success',
    badge: '本月异常调用 0',
    badgeType: 'safe' as const,
    subIcon: 'lock',
    sub: '审计通过率 100%',
  },
  {
    label: '今日审批通过',
    sublabel: '运行管理',
    value: 12,
    suffix: ' 项',
    decimals: 0,
    icon: 'select',
    tone: 'blue',
    badge: '入盟 / 资源 / 任务',
    badgeType: 'info' as const,
    subIcon: 'select',
    sub: '平均审批时长 1.8h',
  },
  {
    label: '本月异常拦截',
    sublabel: '风险阻断',
    value: 0,
    suffix: ' 次',
    decimals: 0,
    icon: 'lock',
    tone: 'success',
    badge: '风险阻断',
    badgeType: 'safe' as const,
    subIcon: 'shield',
    sub: '越权调用全部拒绝',
  },
]

// ---------- 联盟拓扑网络（身份可信互认） ----------
let _seed = 20260825
function rand(min: number, max: number) {
  _seed = (_seed * 1664525 + 1013904223) >>> 0
  const v = _seed / 4294967296
  return min + v * (max - min)
}

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
  depth: number
  r: number
  idx: number
  floatDelay: number
  floatAmp: number
  angle: number
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
  const memberCount = a.members.length
  const baseAngle = rand(0, Math.PI * 2)
  a.members.forEach((m, mi) => {
    const angle = baseAngle + (mi / memberCount) * Math.PI * 2
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

nodes.forEach((n) => {
  const base = n.role === 'leader' ? 14 : rand(5.5, 10)
  n.r = Math.round(base * (0.55 + n.depth * 0.45) * 10) / 10
})

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
    overflow = y < edgePad + fontSize / 2 || y > svgH - edgePad - fontSize / 2
  } else {
    const anchor = cos > 0 ? 'start' : 'end'
    if (anchor === 'start') overflow = x + textW > svgW - edgePad
    if (anchor === 'end') overflow = x - textW < edgePad
    overflow = overflow || y < edgePad || y > svgH - edgePad
  }
  if (overflow) n.angle += Math.PI
})

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
  for (let i = 0; i < 8; i++) pushFeed(true)
  feedTimer = window.setInterval(() => pushFeed(false), 2800)
})
onBeforeUnmount(() => {
  if (feedTimer) clearInterval(feedTimer)
})

// ---------- 图表：可信数据空间运行态势 ----------
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

const complianceMetrics = [
  { label: '本月调用', value: '2,847', unit: '次', icon: 'files', tone: 'primary' },
  { label: '风险阻断', value: '0', unit: '次', icon: 'shield', tone: 'success' },
  { label: '审计通过率', value: '100', unit: '%', icon: 'lock', tone: 'accent' },
]

const resourceBars = [
  { label: '影像数据', value: 5420, total: 12847, color: '#6366f1', colorEnd: '#818cf8', tone: 'primary', institutions: 18, growth: '+12%' },
  { label: '病理数据', value: 3468, total: 12847, color: '#8b5cf6', colorEnd: '#a78bfa', tone: 'violet', institutions: 14, growth: '+8%' },
  { label: '基因数据', value: 2312, total: 12847, color: '#06b6d4', colorEnd: '#22d3ee', tone: 'accent', institutions: 9, growth: '+15%' },
  { label: '文本报告', value: 1647, total: 12847, color: '#a855f7', colorEnd: '#c084fc', tone: 'purple', institutions: 22, growth: '+5%' },
]
const resourceTotal = 12847

const gaugeOption = {
  series: [
    {
      type: 'gauge',
      startAngle: 90,
      endAngle: -270,
      min: 0,
      max: 100,
      radius: '80%',
      pointer: { show: false },
      progress: { show: false },
      axisLine: { roundCap: true, lineStyle: { width: 18, color: [[1, '#f0f2fa']] } },
      axisTick: { show: false },
      splitLine: { show: false },
      axisLabel: { show: false },
      detail: { show: false },
      data: [{ value: 0 }],
      animation: false,
    },
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
            type: 'linear', x: 0, y: 0, x2: 1, y2: 1,
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
</script>

<template>
  <div class="overview">
    <!-- 页头 -->
    <header class="ov-head" v-reveal>
      <div>
        <span class="pf-eyebrow">OPERATIONS · 运行态势</span>
        <h1 class="ov-title">平台运行态势</h1>
        <p class="ov-sub">实时掌握联盟协作、节点状态、合规与安全 —— 平台现在运行得怎么样。</p>
      </div>
      <span class="ov-pill"><i></i>实时监测中</span>
    </header>

    <!-- 核心运行指标 + 运行管理指标 -->
    <section class="metrics">
      <div
        v-for="(m, i) in kpi"
        :key="m.label"
        class="pf-card metric"
        :class="'metric--' + m.tone"
        v-reveal
        :style="{ '--delay': i * 0.06 + 's' }"
      >
        <div class="metric__top">
          <div class="metric__icon"><AppIcon :name="m.icon" :tone="m.tone" /></div>
          <span class="metric__badge" :class="'metric__badge--' + m.badgeType">
            <span v-if="m.badgeType === 'up'" class="metric__badge-dot metric__badge-dot--up"></span>
            <span v-else-if="m.badgeType === 'safe'" class="metric__badge-dot metric__badge-dot--safe"></span>
            <span v-else-if="m.badgeType === 'info'" class="metric__badge-dot metric__badge-dot--info"></span>
            {{ m.badge }}
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
            <p class="panel__sub">参与机构及节点状态（在线 · 待认证 · 离线）</p>
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
            <radialGradient id="spaceBg" cx="50%" cy="45%" r="75%">
              <stop offset="0%" stop-color="#151c3a" />
              <stop offset="45%" stop-color="#0d1228" />
              <stop offset="100%" stop-color="#060815" />
            </radialGradient>
            <radialGradient :id="'nebula' + (i + 1)" v-for="(c, i) in galaxyCenters" :key="'neb-' + i" cx="50%" cy="50%" r="50%">
              <stop offset="0%" :stop-color="['rgba(99,102,241,0.22)', 'rgba(6,182,212,0.18)', 'rgba(139,92,246,0.18)', 'rgba(59,130,246,0.18)', 'rgba(168,85,247,0.18)', 'rgba(34,211,238,0.16)'][i]" />
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

          <rect x="0" y="0" width="900" height="540" fill="url(#spaceBg)" rx="16" />

          <circle v-for="(c, i) in galaxyCenters" :key="'neb-' + i" :cx="c.x" :cy="c.y" r="110" :fill="`url(#nebula${i + 1})`" opacity="0.7" />

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
            <g :filter="n.depth < 0.35 ? 'url(#farBlur)' : undefined">
              <circle
                :cx="n.x"
                :cy="n.y"
                :r="n.r + (n.role === 'leader' ? 18 : 8) * (0.5 + n.depth * 0.5)"
                :fill="n.allianceColor"
                :opacity="n.status === 'offline' ? 0.04 : ((n.role === 'leader' ? 0.18 : 0.1) * n.depth)"
              />
              <circle
                v-if="n.role === 'leader' && n.status === 'online'"
                :cx="n.x"
                :cy="n.y"
                :r="n.r + 10"
                class="pulse"
                :style="{ stroke: n.allianceColor }"
              />
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
  </div>
</template>

<style scoped>
.overview {
  display: flex;
  flex-direction: column;
  gap: 22px;
}

/* ---------- 页头 ---------- */
.ov-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
}
.ov-title {
  font-size: 26px;
  font-weight: 800;
  margin: 8px 0 6px;
  color: var(--pf-text);
}
.ov-sub {
  font-size: 14px;
  color: var(--pf-text-soft);
  margin: 0;
}
.ov-pill {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  font-size: 12px;
  font-weight: 700;
  color: var(--pf-success);
  background: rgba(16, 185, 129, 0.1);
  border: 1px solid rgba(16, 185, 129, 0.25);
  padding: 7px 14px;
  border-radius: 999px;
}
.ov-pill i {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--pf-success);
  animation: blink 1.4s ease-in-out infinite;
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

/* ---------- 指标 strip ---------- */
.metrics {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
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

/* ---------- 运行态势（图表） ---------- */
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
.compliance-item--primary .compliance-item__icon {
  background: rgba(99, 102, 241, 0.1);
}
.compliance-item--success .compliance-item__icon {
  background: rgba(16, 185, 129, 0.1);
}
.compliance-item--accent .compliance-item__icon {
  background: rgba(6, 182, 212, 0.1);
}
.compliance-item__icon {
  width: 32px;
  height: 32px;
  flex-shrink: 0;
  border-radius: 8px;
  display: grid;
  place-items: center;
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
}
@media (max-width: 560px) {
  .metrics,
  .charts {
    grid-template-columns: 1fr;
  }
  .chart-card--wide {
    grid-column: auto;
  }
}
</style>
