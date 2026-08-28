<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import * as echarts from 'echarts'
import EChart from '@/components/EChart.vue'
import {
  barCategories,
  barValues,
  gaugeValue,
  lineMonths,
  lineSeries,
  nextWalk,
  pieData,
} from '@/mock/data'

const live = ref(false)
const lineVisits = ref<number[]>([...lineSeries.visits])
const lineTasks = ref<number[]>([...lineSeries.tasks])
const gauge = ref(gaugeValue)
const lastUpdate = ref('—')

const barGradient = new echarts.graphic.LinearGradient(0, 0, 0, 1, [
  { offset: 0, color: '#8b5cf6' },
  { offset: 1, color: '#6366f1' },
])
const lineGradient = new echarts.graphic.LinearGradient(0, 0, 0, 1, [
  { offset: 0, color: 'rgba(99,102,241,0.35)' },
  { offset: 1, color: 'rgba(99,102,241,0.02)' },
])

const lineOption = computed(() => ({
  tooltip: { trigger: 'axis' },
  legend: { data: ['访问量', '任务量'], bottom: 0 },
  grid: { left: 44, right: 18, top: 24, bottom: 44 },
  xAxis: { type: 'category', boundaryGap: false, data: lineMonths },
  yAxis: { type: 'value' },
  series: [
    {
      name: '访问量',
      type: 'line',
      smooth: true,
      symbol: 'circle',
      symbolSize: 7,
      data: lineVisits.value,
      lineStyle: { width: 3, color: '#6366f1' },
      itemStyle: { color: '#6366f1' },
      areaStyle: { color: lineGradient },
    },
    {
      name: '任务量',
      type: 'line',
      smooth: true,
      symbol: 'circle',
      symbolSize: 7,
      data: lineTasks.value,
      lineStyle: { width: 3, color: '#22d3ee' },
      itemStyle: { color: '#22d3ee' },
    },
  ],
}))

const barOption = computed(() => ({
  tooltip: { trigger: 'axis' },
  grid: { left: 44, right: 18, top: 24, bottom: 30 },
  xAxis: { type: 'category', data: barCategories },
  yAxis: { type: 'value' },
  series: [
    {
      type: 'bar',
      data: barValues,
      barWidth: '46%',
      itemStyle: { color: barGradient, borderRadius: [8, 8, 0, 0] },
    },
  ],
}))

const pieOption = computed(() => ({
  tooltip: { trigger: 'item' },
  legend: { bottom: 0 },
  series: [
    {
      type: 'pie',
      radius: ['45%', '70%'],
      avoidLabelOverlap: true,
      itemStyle: { borderRadius: 8, borderColor: '#fff', borderWidth: 2 },
      label: { formatter: '{b}\n{d}%' },
      data: pieData.map((d, i) => ({
        ...d,
        itemStyle: { color: ['#6366f1', '#8b5cf6', '#22d3ee', '#10b981'][i % 4] },
      })),
    },
  ],
}))

const gaugeOption = computed(() => ({
  series: [
    {
      type: 'gauge',
      startAngle: 210,
      endAngle: -30,
      min: 0,
      max: 100,
      progress: { show: true, width: 16, itemStyle: { color: '#6366f1' } },
      axisLine: { lineStyle: { width: 16, color: [[1, '#eef1f9']] } },
      axisTick: { show: false },
      splitLine: { length: 10, lineStyle: { color: '#d3d9e8' } },
      axisLabel: { color: '#94a0b8', fontSize: 11, distance: 16 },
      pointer: { width: 5, itemStyle: { color: '#8b5cf6' } },
      detail: {
        valueAnimation: true,
        formatter: '{value}',
        fontSize: 30,
        fontWeight: 800,
        color: '#6366f1',
        offsetCenter: [0, '62%'],
      },
      title: { show: false },
      data: [{ value: gauge.value }],
    },
  ],
}))

// ---------- 实时刷新 ----------
let timer: number | undefined
function stamp() {
  lastUpdate.value = new Date().toLocaleTimeString('zh-CN', { hour12: false })
}
function tick() {
  lineVisits.value = lineVisits.value.map((v) => nextWalk(v, 120, 500, 2000))
  lineTasks.value = lineTasks.value.map((v) => nextWalk(v, 70, 200, 1000))
  gauge.value = nextWalk(gauge.value, 3, 72, 99)
  stamp()
}

watch(live, (on) => {
  if (on) {
    stamp()
    timer = window.setInterval(tick, 1500)
  } else if (timer) {
    clearInterval(timer)
    timer = undefined
  }
})

onBeforeUnmount(() => timer && clearInterval(timer))
</script>

<template>
  <div class="charts">
    <header class="charts__hero pf-container">
      <span class="pf-eyebrow" v-reveal>DATA VISUALIZATION</span>
      <h1 class="charts__title pf-section-title" v-reveal>
        数据，<span class="pf-gradient-text">会呼吸</span>
      </h1>
      <p class="pf-section-sub" v-reveal>
        基于 ECharts 的图表演示，开启实时刷新即可看到数据游走动画。
      </p>
      <div class="charts__ctrl" v-reveal>
        <el-switch v-model="live" active-text="实时刷新" inactive-text="静态" />
        <el-tag :type="live ? 'success' : 'info'" effect="light" round>
          {{ live ? '运行中 · 更新于 ' + lastUpdate : '已暂停' }}
        </el-tag>
      </div>
    </header>

    <div class="charts__grid pf-container">
      <section class="pf-card panel" v-reveal>
        <h3 class="panel__title"><el-icon><TrendCharts /></el-icon> 访问与任务趋势</h3>
        <EChart :option="lineOption" />
      </section>
      <section class="pf-card panel" v-reveal>
        <h3 class="panel__title"><el-icon><Histogram /></el-icon> 框架热度</h3>
        <EChart :option="barOption" />
      </section>
      <section class="pf-card panel" v-reveal>
        <h3 class="panel__title"><el-icon><PieChart /></el-icon> 功能占比</h3>
        <EChart :option="pieOption" />
      </section>
      <section class="pf-card panel" v-reveal>
        <h3 class="panel__title"><el-icon><Odometer /></el-icon> 综合评分</h3>
        <EChart :option="gaugeOption" />
      </section>
    </div>
  </div>
</template>

<style scoped>
.charts__hero {
  text-align: center;
  padding: 56px 24px 10px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}
.charts__title {
  margin-top: 6px;
}
.charts__ctrl {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-top: 10px;
}
.charts__grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 22px;
  padding-bottom: 40px;
}
.panel {
  padding: 22px 18px 12px;
}
.panel__title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 17px;
  margin: 0 6px 8px;
}
.panel__title .el-icon {
  color: var(--pf-primary);
}

@media (max-width: 860px) {
  .charts__grid {
    grid-template-columns: 1fr;
  }
}
</style>
