<script setup lang="ts">
import { onMounted } from 'vue'
import { useAppStore } from '@/store'

const app = useAppStore()
onMounted(() => app.bumpVisit())

const year = new Date().getFullYear()
const groups = [
  { title: '演示', links: ['首页', '动画演示', '组件演示', '图表演示'] },
  { title: '技术栈', links: ['Vue 3', 'Vite', 'TypeScript', 'Element Plus'] },
  { title: '资源', links: ['设计系统', 'Mock 数据', '组件清单', '更新日志'] },
]
</script>

<template>
  <footer class="footer">
    <div class="pf-container footer__inner">
      <div class="footer__brand">
        <div class="footer__logo">PF</div>
        <p class="footer__desc">
          PixelForge 是一个用于展示前端交互与视觉能力<br />
          的多功能演示站，全部数据均为本地 Mock。
        </p>
        <p class="footer__visit">本站累计访问 · <strong>{{ app.visits }}</strong> 次</p>
      </div>
      <div v-for="g in groups" :key="g.title" class="footer__col">
        <h4>{{ g.title }}</h4>
        <a v-for="l in g.links" :key="l" href="javascript:void(0)" class="footer__link">{{ l }}</a>
      </div>
    </div>
    <div class="pf-container footer__bottom">
      <span>© {{ year }} PixelForge · 前端演示工坊</span>
      <span>Built with Vue 3 + Vite + Element Plus</span>
    </div>
  </footer>
</template>

<style scoped>
.footer {
  margin-top: 40px;
  background: var(--pf-surface);
  border-top: 1px solid var(--pf-border);
}
.footer__inner {
  display: grid;
  grid-template-columns: 1.6fr 1fr 1fr 1fr;
  gap: 32px;
  padding: 56px 24px 36px;
}
.footer__logo {
  width: 42px;
  height: 42px;
  border-radius: 12px;
  background: var(--pf-gradient);
  color: #fff;
  font-weight: 800;
  display: grid;
  place-items: center;
  margin-bottom: 14px;
}
.footer__desc {
  font-size: 14px;
  color: var(--pf-text-soft);
  line-height: 1.7;
}
.footer__visit {
  margin-top: 14px;
  font-size: 13px;
  color: var(--pf-text-faint);
}
.footer__visit strong {
  color: var(--pf-primary);
}
.footer__col h4 {
  font-size: 14px;
  margin-bottom: 14px;
}
.footer__link {
  display: block;
  font-size: 14px;
  color: var(--pf-text-soft);
  padding: 5px 0;
  transition: color 0.2s ease, transform 0.2s ease;
}
.footer__link:hover {
  color: var(--pf-primary);
  transform: translateX(3px);
}
.footer__bottom {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 18px 24px 30px;
  border-top: 1px solid var(--pf-border);
  font-size: 13px;
  color: var(--pf-text-faint);
}
@media (max-width: 860px) {
  .footer__inner {
    grid-template-columns: 1fr 1fr;
  }
  .footer__bottom {
    flex-direction: column;
    gap: 8px;
    text-align: center;
  }
}
</style>
