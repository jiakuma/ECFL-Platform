<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { FolderOpened } from '@element-plus/icons-vue'
import { useOrgStore } from '@/store/org'

const route = useRoute()
const org = useOrgStore()
const title = computed(() => (route.meta.title as string) || '页面')
</script>

<template>
  <div class="sp">
    <h1 class="sp__title">{{ title }}<span class="sp__scope">{{ org.current }}</span></h1>
    <div class="sp__empty">
      <el-icon class="sp__ico"><FolderOpened /></el-icon>
      <span>暂无数据</span>
    </div>
  </div>
</template>

<style scoped>
.sp {
  min-height: calc(100vh - 56px - 44px);
}
.sp__scope {
  float: right;
  padding: 2px 10px;
  border: 1px solid var(--pf-border-strong);
  border-radius: 999px;
  font-size: 12px;
  font-weight: 600;
  color: var(--pf-text-soft);
  background: var(--pf-surface);
}
.sp__title {
  position: relative;
  font-size: 18px;
  font-weight: 700;
  letter-spacing: 0.03em;
  padding-left: 12px;
  margin: 0 0 14px;
  color: var(--pf-text);
}
.sp__title::before {
  content: '';
  position: absolute;
  left: 0;
  top: 2px;
  bottom: 2px;
  width: 3px;
  border-radius: 2px;
  background: var(--pf-primary);
}
.sp__empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  height: 180px;
  background: var(--pf-surface);
  border: 1px dashed var(--pf-border-strong);
  border-radius: var(--pf-radius-sm);
  color: var(--pf-text-faint);
  font-size: 13px;
}
.sp__ico {
  font-size: 26px;
  color: var(--pf-text-faint);
}
</style>
