<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const scrolled = ref(false)
const open = ref(false)

const links = [
  { to: '/', label: '首页' },
  { to: '/animations', label: '动画演示' },
  { to: '/components', label: '组件演示' },
  { to: '/charts', label: '图表演示' },
]

function onScroll() {
  scrolled.value = window.scrollY > 12
}

onMounted(() => {
  window.addEventListener('scroll', onScroll, { passive: true })
  onScroll()
})
onUnmounted(() => window.removeEventListener('scroll', onScroll))
</script>

<template>
  <header class="nav" :class="{ 'nav--scrolled': scrolled }">
    <div class="nav__inner pf-container">
      <router-link to="/" class="brand" @click="open = false">
        <span class="brand__logo">PF</span>
        <span class="brand__text">
          <strong>PixelForge</strong>
          <em>前端演示工坊</em>
        </span>
      </router-link>

      <nav class="nav__links" :class="{ 'nav__links--open': open }">
        <router-link
          v-for="l in links"
          :key="l.to"
          :to="l.to"
          class="nav__link"
          :class="{ 'router-link-exact-active': route.path === l.to }"
          @click="open = false"
        >
          {{ l.label }}
        </router-link>
        <router-link to="/components" class="nav__cta" @click="open = false">
          开始体验
        </router-link>
      </nav>

      <button
        class="nav__toggle"
        :aria-expanded="open"
        aria-label="切换菜单"
        @click="open = !open"
      >
        <span :class="{ bar: true, 'bar--1': true, open }"></span>
        <span :class="{ bar: true, 'bar--2': true, open }"></span>
        <span :class="{ bar: true, 'bar--3': true, open }"></span>
      </button>
    </div>
  </header>
</template>

<style scoped>
.nav {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: var(--pf-nav-h);
  z-index: 100;
  transition: background 0.3s ease, box-shadow 0.3s ease, border-color 0.3s ease;
  background: rgba(255, 255, 255, 0.55);
  backdrop-filter: saturate(180%) blur(14px);
  -webkit-backdrop-filter: saturate(180%) blur(14px);
  border-bottom: 1px solid transparent;
}
.nav--scrolled {
  background: rgba(255, 255, 255, 0.82);
  border-bottom-color: var(--pf-border);
  box-shadow: 0 6px 24px -16px rgba(28, 34, 48, 0.4);
}
.nav__inner {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.brand {
  display: flex;
  align-items: center;
  gap: 11px;
}
.brand__logo {
  width: 38px;
  height: 38px;
  border-radius: 11px;
  background: var(--pf-gradient);
  background-size: 200% 200%;
  animation: pf-gradient-shift 6s ease infinite;
  color: #fff;
  font-weight: 800;
  font-size: 15px;
  letter-spacing: 0.02em;
  display: grid;
  place-items: center;
  box-shadow: var(--pf-shadow-sm);
}
.brand__text {
  display: flex;
  flex-direction: column;
  line-height: 1.1;
}
.brand__text strong {
  font-size: 16px;
  font-weight: 800;
}
.brand__text em {
  font-style: normal;
  font-size: 11px;
  color: var(--pf-text-faint);
  letter-spacing: 0.04em;
}
.nav__links {
  display: flex;
  align-items: center;
  gap: 6px;
}
.nav__link {
  position: relative;
  padding: 8px 14px;
  border-radius: 999px;
  font-size: 15px;
  font-weight: 600;
  color: var(--pf-text-soft);
  transition: color 0.2s ease, background 0.2s ease;
}
.nav__link:hover {
  color: var(--pf-text);
  background: var(--pf-bg-soft);
}
.nav__link.router-link-exact-active {
  color: var(--pf-primary);
}
.nav__link.router-link-exact-active::after {
  content: '';
  position: absolute;
  left: 50%;
  bottom: 2px;
  width: 18px;
  height: 3px;
  border-radius: 999px;
  background: var(--pf-gradient);
  transform: translateX(-50%);
}
.nav__cta {
  margin-left: 8px;
  padding: 9px 18px;
  border-radius: 999px;
  font-size: 14px;
  font-weight: 700;
  color: #fff;
  background: var(--pf-gradient);
  background-size: 180% 180%;
  box-shadow: var(--pf-shadow-sm);
  transition: transform 0.25s ease, box-shadow 0.25s ease;
}
.nav__cta:hover {
  transform: translateY(-2px);
  box-shadow: var(--pf-shadow);
}
.nav__toggle {
  display: none;
  flex-direction: column;
  justify-content: center;
  gap: 5px;
  width: 42px;
  height: 42px;
  border: 1px solid var(--pf-border);
  border-radius: 11px;
  background: var(--pf-surface);
  cursor: pointer;
}
.bar {
  display: block;
  width: 18px;
  height: 2px;
  margin: 0 auto;
  border-radius: 2px;
  background: var(--pf-text);
  transition: transform 0.3s ease, opacity 0.3s ease;
}
.bar.open.bar--1 {
  transform: translateY(7px) rotate(45deg);
}
.bar.open.bar--2 {
  opacity: 0;
}
.bar.open.bar--3 {
  transform: translateY(-7px) rotate(-45deg);
}

@media (max-width: 860px) {
  .nav__toggle {
    display: flex;
  }
  .nav__links {
    position: absolute;
    top: var(--pf-nav-h);
    left: 0;
    right: 0;
    flex-direction: column;
    align-items: stretch;
    gap: 4px;
    padding: 14px 20px 22px;
    background: rgba(255, 255, 255, 0.96);
    backdrop-filter: blur(14px);
    border-bottom: 1px solid var(--pf-border);
    box-shadow: var(--pf-shadow);
    transform: translateY(-12px);
    opacity: 0;
    pointer-events: none;
    transition: opacity 0.25s ease, transform 0.25s ease;
  }
  .nav__links--open {
    opacity: 1;
    transform: translateY(0);
    pointer-events: auto;
  }
  .nav__link {
    padding: 12px 14px;
    font-size: 16px;
  }
  .nav__cta {
    margin: 6px 0 0;
    text-align: center;
  }
}
</style>
