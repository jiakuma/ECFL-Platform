<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, shallowRef, watch } from 'vue'
import * as echarts from 'echarts'

const props = defineProps<{ option: Record<string, unknown> }>()

const el = ref<HTMLDivElement | null>(null)
const chart = shallowRef<echarts.ECharts | null>(null)

function resize() {
  chart.value?.resize()
}

onMounted(() => {
  if (!el.value) return
  chart.value = echarts.init(el.value)
  chart.value.setOption(props.option)
  window.addEventListener('resize', resize)
})

watch(
  () => props.option,
  (opt) => chart.value?.setOption(opt),
  { deep: true },
)

onBeforeUnmount(() => {
  window.removeEventListener('resize', resize)
  chart.value?.dispose()
  chart.value = null
})
</script>

<template>
  <div ref="el" class="echart"></div>
</template>

<style scoped>
.echart {
  width: 100%;
  height: 320px;
}
</style>
