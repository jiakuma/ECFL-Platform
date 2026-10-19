<script setup lang="ts">
import { computed, ref } from 'vue'
import { useOrgStore } from '@/store/org'
import FieldMappingPanel from './FieldMappingPanel.vue'
import DataQualityPanel from './DataQualityPanel.vue'
import StandardDataPanel from './StandardDataPanel.vue'
import DataSourcePanel from './DataSourcePanel.vue'

const tab = ref('source')

const org = useOrgStore()
/** 机构范围变化时重挂载面板，刷新数据源 / 映射 / 质量任务与标准数据 */
const scopeKey = computed(() => (org.isPlatformAdmin ? 'all' : org.current))
</script>

<template>
  <div class="dm">
    <h1 class="dm__title">数据管理</h1>

    <el-tabs v-model="tab" class="dm__tabs">
      <!-- 数据源：多源数据抽取与原始数据表格构建工作台 -->
      <el-tab-pane label="数据源" name="source">
        <DataSourcePanel :key="scopeKey" />
      </el-tab-pane>

      <!-- 字段映射：源字段 → 标准字段，按机构 / 数据分类筛选，批量确认 -->
      <el-tab-pane label="字段映射" name="mapping">
        <FieldMappingPanel :key="scopeKey" />
      </el-tab-pane>

      <!-- 数据处理：可执行的标准化 / 清洗 / 去重 / 脱敏 -->
      <el-tab-pane label="数据处理" name="quality">
        <DataQualityPanel :key="scopeKey" />
      </el-tab-pane>

      <!-- 标准数据：抽取 → 标准化 → 清洗 → 去重 → 脱敏 的最终产物 -->
      <el-tab-pane label="标准数据" name="std">
        <StandardDataPanel :key="scopeKey" />
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<style scoped>
.dm__title {
  position: relative;
  font-size: 18px;
  font-weight: 700;
  letter-spacing: 0.03em;
  padding-left: 12px;
  margin: 0 0 14px;
  color: var(--pf-text);
}
.dm__title::before {
  content: '';
  position: absolute;
  left: 0;
  top: 2px;
  bottom: 2px;
  width: 3px;
  border-radius: 2px;
  background: var(--pf-primary);
}
.dm__tabs :deep(.el-tabs__header) {
  margin-bottom: 12px;
}
.dm__tabs :deep(.el-tabs__nav-wrap)::after {
  height: 1px;
  background-color: var(--pf-border);
}
</style>
