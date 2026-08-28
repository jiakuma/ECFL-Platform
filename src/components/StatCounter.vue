<script setup lang="ts">
import { onMounted, ref } from 'vue'

const props = withDefaults(
  defineProps<{
    value: number
    duration?: number
    suffix?: string
    prefix?: string
    decimals?: number
  }>(),
  { duration: 1600, suffix: '', prefix: '', decimals: 0 },
)

const display = ref(0)
const elRef = ref<HTMLElement | null>(null)
let started = false

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3)
}

function run() {
  if (started) return
  started = true
  const start = performance.now()
  const tick = (now: number) => {
    const p = Math.min(1, (now - start) / props.duration)
    display.value = props.value * easeOutCubic(p)
    if (p < 1) requestAnimationFrame(tick)
    else display.value = props.value
  }
  requestAnimationFrame(tick)
}

onMounted(() => {
  const node = elRef.value
  if (!node) return
  const io = new IntersectionObserver(
    (entries) => {
      if (entries[0].isIntersecting) {
        run()
        io.disconnect()
      }
    },
    { threshold: 0.4 },
  )
  io.observe(node)
})
</script>

<template>
  <span ref="elRef" class="stat-counter">
    <span v-if="prefix" class="stat-counter__affix">{{ prefix }}</span
    ><span class="stat-counter__num">{{ display.toFixed(decimals) }}</span
    ><span v-if="suffix" class="stat-counter__affix">{{ suffix }}</span>
  </span>
</template>

<style scoped>
.stat-counter {
  font-variant-numeric: tabular-nums;
  font-weight: 800;
}
.stat-counter__affix {
  font-weight: 700;
  opacity: 0.85;
}
</style>
