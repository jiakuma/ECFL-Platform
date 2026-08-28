<script setup lang="ts">
import { useRouter } from 'vue-router'
const router = useRouter()
</script>

<template>
  <div class="nf pf-container">
    <div class="nf__code pf-gradient-text">404</div>
    <h1 class="nf__title">页面走丢了</h1>
    <p class="nf__sub">你访问的演示页面不存在，返回首页继续探索吧。</p>
    <el-button type="primary" size="large" round @click="router.push('/')">
      <el-icon><HomeFilled /></el-icon>&nbsp;回到首页
    </el-button>
  </div>
</template>

<style scoped>
.nf {
  min-height: 70vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  gap: 14px;
}
.nf__code {
  font-size: clamp(80px, 18vw, 160px);
  font-weight: 900;
  line-height: 1;
}
.nf__title {
  font-size: 28px;
}
.nf__sub {
  color: var(--pf-text-soft);
  margin-bottom: 12px;
}
</style>
