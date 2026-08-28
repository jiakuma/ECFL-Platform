<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()

const title = computed(() => (route.meta.title as string) || '页面')
const desc = computed(() => (route.meta.desc as string) || '')
</script>

<template>
  <div class="ph">
    <div class="ph__card">
      <div class="ph__icon"><el-icon><Compass /></el-icon></div>
      <h1 class="ph__title">{{ title }}</h1>
      <p class="ph__desc">{{ desc || '该模块正在规划与建设中，敬请期待。' }}</p>

      <div class="ph__skeleton" aria-hidden="true">
        <div class="sk sk--lg"></div>
        <div class="sk sk--md"></div>
        <div class="sk sk--sm"></div>
      </div>

      <div class="ph__actions">
        <el-button type="primary" round @click="router.push('/')">
          <el-icon><HomeFilled /></el-icon>&nbsp;返回概览
        </el-button>
        <el-button round plain @click="router.back()">返回上一级</el-button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.ph {
  min-height: calc(100vh - 56px - 44px);
  display: grid;
  place-items: center;
  padding: 24px;
}
.ph__card {
  width: 100%;
  max-width: 560px;
  text-align: center;
  background: var(--pf-surface);
  border: 1px solid var(--pf-border);
  border-radius: 18px;
  padding: 44px 36px;
  box-shadow: var(--pf-shadow);
}
.ph__icon {
  width: 64px;
  height: 64px;
  margin: 0 auto 18px;
  border-radius: 18px;
  display: grid;
  place-items: center;
  font-size: 30px;
  color: #fff;
  background: var(--pf-gradient);
  background-size: 200% 200%;
  animation: ph-gradient-shift 6s ease infinite;
}
.ph__title {
  font-size: 24px;
  margin-bottom: 10px;
}
.ph__desc {
  color: var(--pf-text-soft);
  font-size: 15px;
  margin-bottom: 26px;
  line-height: 1.6;
}
.ph__skeleton {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 26px;
}
.sk {
  height: 14px;
  border-radius: 8px;
  background: linear-gradient(90deg, var(--pf-bg-soft), var(--pf-surface), var(--pf-bg-soft));
  background-size: 200% 100%;
  animation: ph-shimmer 1.4s linear infinite;
}
.sk--lg { width: 92%; margin: 0 auto; }
.sk--md { width: 76%; margin: 0 auto; }
.sk--sm { width: 56%; margin: 0 auto; }
.ph__actions {
  display: flex;
  gap: 12px;
  justify-content: center;
  flex-wrap: wrap;
}
@keyframes ph-shimmer {
  to { background-position: -200% 0; }
}
@keyframes ph-gradient-shift {
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}
</style>
