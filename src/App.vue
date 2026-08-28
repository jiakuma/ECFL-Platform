<template>
  <AppLayout v-if="!isFullscreen">
    <router-view v-slot="{ Component }">
      <transition name="page" mode="out-in">
        <component :is="Component" />
      </transition>
    </router-view>
  </AppLayout>
  <router-view v-else v-slot="{ Component }">
    <transition name="page" mode="out-in">
      <component :is="Component" />
    </transition>
  </router-view>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import AppLayout from './layout/AppLayout.vue'

const route = useRoute()
const isFullscreen = computed(() => route.meta.fullscreen === true)
</script>

<style>
.page-enter-active,
.page-leave-active {
  transition: opacity 0.35s ease, transform 0.35s cubic-bezier(0.22, 1, 0.36, 1);
}
.page-enter-from {
  opacity: 0;
  transform: translateY(18px);
}
.page-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}
</style>
