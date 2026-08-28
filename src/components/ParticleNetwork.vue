<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'

const container = ref<HTMLDivElement>()
const canvas = ref<HTMLCanvasElement>()

const COLORS = ['#6366f1', '#06b6d4', '#8b5cf6', '#22d3ee', '#a855f7', '#3b82f6']

interface Particle {
  x: number
  y: number
  r: number
  vx: number
  vy: number
  color: string
  alpha: number
  pulse: number
  pulseSpeed: number
}

let ctx: CanvasRenderingContext2D | null = null
let particles: Particle[] = []
let animationId = 0
let width = 0
let height = 0
let mouseX = -1000
let mouseY = -1000
let reducedMotion = false
let dpr = 1

function random(a: number, b: number) {
  return Math.random() * (b - a) + a
}

function createParticles(count: number) {
  const list: Particle[] = []
  for (let i = 0; i < count; i++) {
    list.push({
      x: Math.random() * width,
      y: Math.random() * height,
      r: random(1.2, 2.8),
      vx: random(-0.35, 0.35),
      vy: random(-0.35, 0.35),
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      alpha: random(0.35, 0.85),
      pulse: random(0, Math.PI * 2),
      pulseSpeed: random(0.01, 0.04),
    })
  }
  return list
}

function resize() {
  const el = container.value
  const c = canvas.value
  if (!el || !c) return
  const rect = el.getBoundingClientRect()
  width = rect.width
  height = rect.height
  dpr = Math.min(window.devicePixelRatio || 1, 2)
  c.width = Math.floor(width * dpr)
  c.height = Math.floor(height * dpr)
  c.style.width = `${width}px`
  c.style.height = `${height}px`
  ctx = c.getContext('2d')
  if (ctx) {
    ctx.scale(dpr, dpr)
    ctx.clearRect(0, 0, width, height)
  }
  const count = Math.max(40, Math.min(100, Math.floor((width * height) / 18000)))
  particles = createParticles(count)
  if (reducedMotion) drawFrame()
}

function hexToRgba(hex: string, alpha: number) {
  const n = parseInt(hex.slice(1), 16)
  const r = (n >> 16) & 255
  const g = (n >> 8) & 255
  const b = n & 255
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

function drawFrame() {
  if (!ctx) return
  ctx.clearRect(0, 0, width, height)

  // draw connections first
  for (let i = 0; i < particles.length; i++) {
    const a = particles[i]
    for (let j = i + 1; j < particles.length; j++) {
      const b = particles[j]
      const dx = a.x - b.x
      const dy = a.y - b.y
      const dist = Math.sqrt(dx * dx + dy * dy)
      const threshold = 120
      if (dist < threshold) {
        const alpha = (1 - dist / threshold) * 0.35
        const grad = ctx.createLinearGradient(a.x, a.y, b.x, b.y)
        grad.addColorStop(0, hexToRgba(a.color, alpha))
        grad.addColorStop(1, hexToRgba(b.color, alpha))
        ctx.beginPath()
        ctx.strokeStyle = grad
        ctx.lineWidth = 0.8
        ctx.moveTo(a.x, a.y)
        ctx.lineTo(b.x, b.y)
        ctx.stroke()
      }
    }

    // mouse interaction: stronger connections near cursor
    const mdx = a.x - mouseX
    const mdy = a.y - mouseY
    const mdist = Math.sqrt(mdx * mdx + mdy * mdy)
    const mThreshold = 160
    if (mdist < mThreshold) {
      const alpha = (1 - mdist / mThreshold) * 0.5
      ctx.beginPath()
      ctx.strokeStyle = hexToRgba(a.color, alpha)
      ctx.lineWidth = 1
      ctx.moveTo(a.x, a.y)
      ctx.lineTo(mouseX, mouseY)
      ctx.stroke()
    }
  }

  // draw particles
  for (const p of particles) {
    const pulse = 1 + Math.sin(p.pulse) * 0.18
    const radius = p.r * pulse
    ctx.beginPath()
    ctx.fillStyle = hexToRgba(p.color, p.alpha)
    ctx.arc(p.x, p.y, radius, 0, Math.PI * 2)
    ctx.fill()

    // soft glow
    const glow = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, radius * 4)
    glow.addColorStop(0, hexToRgba(p.color, p.alpha * 0.35))
    glow.addColorStop(1, hexToRgba(p.color, 0))
    ctx.beginPath()
    ctx.fillStyle = glow
    ctx.arc(p.x, p.y, radius * 4, 0, Math.PI * 2)
    ctx.fill()
  }
}

function animate() {
  if (reducedMotion) return
  for (const p of particles) {
    p.x += p.vx
    p.y += p.vy
    p.pulse += p.pulseSpeed

    if (p.x < -10) p.x = width + 10
    if (p.x > width + 10) p.x = -10
    if (p.y < -10) p.y = height + 10
    if (p.y > height + 10) p.y = -10
  }
  drawFrame()
  animationId = requestAnimationFrame(animate)
}

function onMouseMove(e: MouseEvent) {
  const rect = container.value?.getBoundingClientRect()
  if (!rect) return
  mouseX = e.clientX - rect.left
  mouseY = e.clientY - rect.top
}

function onMouseLeave() {
  mouseX = -1000
  mouseY = -1000
}

function onTouchMove(e: TouchEvent) {
  const rect = container.value?.getBoundingClientRect()
  if (!rect || !e.touches[0]) return
  mouseX = e.touches[0].clientX - rect.left
  mouseY = e.touches[0].clientY - rect.top
}

onMounted(() => {
  reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  resize()
  window.addEventListener('resize', resize)
  if (!reducedMotion) animationId = requestAnimationFrame(animate)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', resize)
  if (animationId) cancelAnimationFrame(animationId)
})
</script>

<template>
  <div ref="container" class="particle-network" @mousemove="onMouseMove" @mouseleave="onMouseLeave" @touchmove="onTouchMove">
    <canvas ref="canvas" class="particle-network__canvas" aria-hidden="true"></canvas>
  </div>
</template>

<style scoped>
.particle-network {
  position: absolute;
  inset: 0;
  overflow: hidden;
  pointer-events: auto;
  z-index: 0;
}
.particle-network__canvas {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  display: block;
}
</style>
