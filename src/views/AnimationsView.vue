<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'

// ---------- 打字机 ----------
const phrases = [
  '流畅，是一种态度。',
  '微交互，藏着产品的温度。',
  '每一帧，都值得打磨。',
  '动效不是装饰，而是引导。',
]
const typed = ref('')
let pi = 0
let ci = 0
let typer: number | undefined

function typeLoop() {
  const full = phrases[pi]
  if (ci <= full.length) {
    typed.value = full.slice(0, ci)
    ci++
    typer = window.setTimeout(typeLoop, 90)
  } else {
    typer = window.setTimeout(() => {
      ci = 0
      pi = (pi + 1) % phrases.length
      typeLoop()
    }, 1800)
  }
}

// ---------- 缓动调试台 ----------
const easings = [
  { label: 'Linear', value: 'linear' },
  { label: 'Ease', value: 'ease' },
  { label: 'Ease-In', value: 'ease-in' },
  { label: 'Ease-Out', value: 'ease-out' },
  { label: '弹簧', value: 'cubic-bezier(.34,1.56,.64,1)' },
  { label: '平滑', value: 'cubic-bezier(.22,1,.36,1)' },
  { label: '急停', value: 'cubic-bezier(.55,0,.1,1)' },
]
const chosen = ref(easings[5].value)
const duration = ref(900)
const moved = ref(false)

function play() {
  moved.value = false
  requestAnimationFrame(() => requestAnimationFrame(() => (moved.value = true)))
}

// ---------- 涟漪 ----------
function ripple(e: MouseEvent) {
  const btn = e.currentTarget as HTMLElement
  const circle = document.createElement('span')
  const d = Math.max(btn.clientWidth, btn.clientHeight)
  circle.style.width = circle.style.height = `${d}px`
  const rect = btn.getBoundingClientRect()
  circle.style.left = `${e.clientX - rect.left - d / 2}px`
  circle.style.top = `${e.clientY - rect.top - d / 2}px`
  circle.className = 'ripple-dot'
  btn.appendChild(circle)
  setTimeout(() => circle.remove(), 650)
}

onMounted(typeLoop)
onUnmounted(() => clearTimeout(typer))
</script>

<template>
  <div class="anim">
    <header class="anim__hero pf-container">
      <span class="pf-eyebrow" v-reveal>ANIMATION LAB</span>
      <h1 class="anim__title pf-section-title" v-reveal>
        把 <span class="pf-gradient-text">motion</span> 玩出花样
      </h1>
      <p class="pf-section-sub" v-reveal>
        一组纯 CSS / JS 实现的交互动效，部分可实时调参，感受缓动曲线的差异。
      </p>
    </header>

    <div class="anim__grid pf-container">
      <!-- 加载动画 -->
      <section class="pf-card panel" v-reveal>
        <h3 class="panel__title"><el-icon><Loading /></el-icon> 加载动画</h3>
        <div class="loaders">
          <div class="loader">
            <span class="ring"></span><em>环形</em>
          </div>
          <div class="loader">
            <span class="dots"><i></i><i></i><i></i></span><em>跳动</em>
          </div>
          <div class="loader">
            <span class="pulse"></span><em>脉冲</em>
          </div>
        </div>
      </section>

      <!-- 按钮微交互 -->
      <section class="pf-card panel" v-reveal>
        <h3 class="panel__title"><el-icon><Pointer /></el-icon> 按钮微交互</h3>
        <div class="btns">
          <button class="mbtn mbtn--shine">光泽扫过</button>
          <button class="mbtn mbtn--fill">填充展开</button>
          <button class="mbtn mbtn--border">描边绘制</button>
          <button class="mbtn mbtn--ripple" @click="ripple">点击涟漪</button>
        </div>
      </section>

      <!-- 3D 翻转 -->
      <section class="pf-card panel" v-reveal>
        <h3 class="panel__title"><el-icon><Switch /></el-icon> 3D 翻转卡片</h3>
        <div class="flip">
          <div class="flip__inner">
            <div class="flip__face flip__front">
              <el-icon><Sunny /></el-icon>
              <span>悬停查看背面</span>
            </div>
            <div class="flip__face flip__back">
              <el-icon><Moon /></el-icon>
              <span>背面内容区</span>
            </div>
          </div>
        </div>
      </section>

      <!-- 打字机 -->
      <section class="pf-card panel" v-reveal>
        <h3 class="panel__title"><el-icon><EditPen /></el-icon> 打字机效果</h3>
        <p class="typewriter">{{ typed }}<span class="caret">|</span></p>
      </section>

      <!-- 缓动调试台 -->
      <section class="pf-card panel panel--wide" v-reveal>
        <h3 class="panel__title"><el-icon><VideoPlay /></el-icon> 缓动调试台</h3>
        <div class="ease">
          <div class="ease__controls">
            <el-radio-group v-model="chosen" size="small">
              <el-radio-button v-for="e in easings" :key="e.value" :value="e.value">
                {{ e.label }}
              </el-radio-button>
            </el-radio-group>
            <div class="ease__dur">
              <span>时长 {{ duration }}ms</span>
              <el-slider v-model="duration" :min="200" :max="2000" :step="100" style="width: 200px" />
            </div>
            <el-button type="primary" round @click="play">
              <el-icon><VideoPlay /></el-icon>&nbsp;播放
            </el-button>
          </div>
          <div class="ease__track">
            <span
              class="ease__ball"
              :class="{ 'ease__ball--moved': moved }"
              :style="{ transitionTimingFunction: chosen, transitionDuration: duration + 'ms' }"
            ></span>
          </div>
          <code class="ease__code">transition-timing-function: {{ chosen }};</code>
        </div>
      </section>
    </div>
  </div>
</template>

<style scoped>
.anim__hero {
  text-align: center;
  padding: 56px 24px 10px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}
.anim__title {
  margin-top: 6px;
}
.anim__grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 22px;
  padding-bottom: 40px;
}
.panel {
  padding: 26px;
}
.panel--wide {
  grid-column: 1 / -1;
}
.panel__title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 17px;
  margin-bottom: 20px;
  color: var(--pf-text);
}
.panel__title .el-icon {
  color: var(--pf-primary);
}

/* loaders */
.loaders {
  display: flex;
  justify-content: space-around;
  align-items: center;
  min-height: 120px;
}
.loader {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  color: var(--pf-text-soft);
  font-size: 13px;
}
.ring {
  width: 42px;
  height: 42px;
  border-radius: 50%;
  border: 4px solid var(--pf-border);
  border-top-color: var(--pf-primary);
  animation: pf-spin 0.9s linear infinite;
}
.dots {
  display: flex;
  gap: 6px;
}
.dots i {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: var(--pf-primary);
  animation: dotBounce 1.2s ease-in-out infinite;
}
.dots i:nth-child(2) {
  animation-delay: 0.15s;
  background: var(--pf-primary-2);
}
.dots i:nth-child(3) {
  animation-delay: 0.3s;
  background: var(--pf-accent);
}
@keyframes dotBounce {
  0%,
  80%,
  100% {
    transform: translateY(0);
    opacity: 0.6;
  }
  40% {
    transform: translateY(-14px);
    opacity: 1;
  }
}
.pulse {
  width: 34px;
  height: 34px;
  border-radius: 50%;
  background: var(--pf-primary);
  animation: pf-pulse-ring 1.4s ease-out infinite;
  position: relative;
}
.pulse::after {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: 50%;
  background: var(--pf-primary);
  animation: pf-pulse-ring 1.4s ease-out infinite;
  animation-delay: 0.7s;
}

/* buttons */
.btns {
  display: flex;
  flex-wrap: wrap;
  gap: 14px;
}
.mbtn {
  position: relative;
  overflow: hidden;
  padding: 11px 22px;
  border-radius: 999px;
  font-weight: 700;
  font-size: 14px;
  cursor: pointer;
  border: none;
  color: #fff;
  background: var(--pf-primary);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}
.mbtn:hover {
  transform: translateY(-2px);
  box-shadow: var(--pf-shadow);
}
.mbtn--shine::before {
  content: '';
  position: absolute;
  top: 0;
  left: -120%;
  width: 60%;
  height: 100%;
  background: linear-gradient(120deg, transparent, rgba(255, 255, 255, 0.6), transparent);
  transform: skewX(-20deg);
}
.mbtn--shine:hover::before {
  animation: shine 0.8s ease;
}
@keyframes shine {
  to {
    left: 130%;
  }
}
.mbtn--fill {
  background: transparent;
  color: var(--pf-primary);
  border: 2px solid var(--pf-primary);
  z-index: 0;
}
.mbtn--fill::before {
  content: '';
  position: absolute;
  inset: 0;
  background: var(--pf-gradient);
  transform: scaleX(0);
  transform-origin: left;
  transition: transform 0.4s ease;
  z-index: -1;
}
.mbtn--fill:hover {
  color: #fff;
  border-color: transparent;
}
.mbtn--fill:hover::before {
  transform: scaleX(1);
}
.mbtn--border {
  background: var(--pf-surface);
  color: var(--pf-text);
  border: 2px solid transparent;
  background-image: linear-gradient(var(--pf-surface), var(--pf-surface)),
    var(--pf-gradient);
  background-origin: border-box;
  background-clip: padding-box, border-box;
}
.mbtn--border:hover {
  box-shadow: 0 0 0 4px rgba(99, 102, 241, 0.15);
}
.mbtn--ripple {
  background: var(--pf-primary-2);
}
.ripple-dot {
  position: absolute;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.6);
  transform: scale(0);
  animation: rippleAnim 0.6s ease-out;
  pointer-events: none;
}
@keyframes rippleAnim {
  to {
    transform: scale(2.4);
    opacity: 0;
  }
}

/* flip */
.flip {
  perspective: 1100px;
  height: 150px;
}
.flip__inner {
  position: relative;
  width: 100%;
  height: 100%;
  transform-style: preserve-3d;
  transition: transform 0.7s cubic-bezier(0.22, 1, 0.36, 1);
}
.flip:hover .flip__inner {
  transform: rotateY(180deg);
}
.flip__face {
  position: absolute;
  inset: 0;
  border-radius: 14px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  backface-visibility: hidden;
  font-weight: 600;
  color: #fff;
}
.flip__front {
  background: var(--pf-gradient);
}
.flip__back {
  background: linear-gradient(135deg, #0ea5e9, #6366f1);
  transform: rotateY(180deg);
}
.flip__face .el-icon {
  font-size: 34px;
}

/* typewriter */
.typewriter {
  min-height: 60px;
  font-size: 22px;
  font-weight: 700;
  color: var(--pf-text);
  display: flex;
  align-items: center;
}
.caret {
  color: var(--pf-primary);
  animation: blink 1s step-end infinite;
  margin-left: 2px;
}
@keyframes blink {
  50% {
    opacity: 0;
  }
}

/* easing */
.ease__controls {
  display: flex;
  align-items: center;
  gap: 18px;
  flex-wrap: wrap;
  margin-bottom: 20px;
}
.ease__dur {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 13px;
  color: var(--pf-text-soft);
}
.ease__track {
  position: relative;
  height: 56px;
  border-radius: 14px;
  background: var(--pf-bg-soft);
  border: 1px solid var(--pf-border);
  overflow: hidden;
}
.ease__ball {
  position: absolute;
  top: 50%;
  left: 14px;
  width: 30px;
  height: 30px;
  margin-top: -15px;
  border-radius: 50%;
  background: var(--pf-gradient);
  box-shadow: var(--pf-shadow-sm);
  transform: translateX(0);
}
.ease__ball--moved {
  transform: translateX(calc(100% - 0px));
  left: calc(100% - 44px);
}
.ease__code {
  display: block;
  margin-top: 14px;
  font-family: 'SF Mono', 'Fira Code', monospace;
  font-size: 13px;
  color: var(--pf-text-soft);
  background: var(--pf-bg-soft);
  padding: 8px 12px;
  border-radius: 8px;
}

@media (max-width: 860px) {
  .anim__grid {
    grid-template-columns: 1fr;
  }
}
</style>
