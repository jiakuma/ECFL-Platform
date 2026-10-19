<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useOrgStore } from '@/store/org'
import { institutions } from '@/mock/institutions'

const router = useRouter()
const org = useOrgStore()

/** 平台管理员看三家；机构管理员只看本机构 */
const list = computed(() =>
  org.isPlatformAdmin ? institutions : institutions.filter((i) => i.name === org.current),
)
const totalPatients = computed(() => list.value.reduce((n, i) => n + i.patients, 0))

function openDetail(name: string) {
  router.push(`/admin/organization/${encodeURIComponent(name)}`)
}
</script>

<template>
  <div class="ie">
    <h1 class="ie__title">
      机构管理
      <span class="ie__scope">{{ list.length }} 家接入机构 · {{ totalPatients }} 例患者</span>
    </h1>

    <div class="ie__grid">
      <article
        v-for="i in list"
        :key="i.name"
        class="org"
        :class="{ 'org--lead': i.lead }"
        tabindex="0"
        role="link"
        @click="openDetail(i.name)"
        @keyup.enter="openDetail(i.name)"
      >
        <img class="org__avatar" :src="i.avatar" :alt="i.name" />
        <div class="org__body">
          <h2 class="org__name">{{ i.name }}</h2>
          <span v-if="i.lead" class="org__lead">牵头医院</span>
        </div>
        <span class="org__status" :class="i.status === '已接入' ? 'is-ok' : 'is-sync'">
          <span class="org__dot" /> {{ i.status }}
        </span>
      </article>
    </div>
  </div>
</template>

<style scoped>
.ie__title {
  position: relative;
  font-size: 18px;
  font-weight: 700;
  letter-spacing: 0.03em;
  padding-left: 12px;
  margin: 0 0 16px;
  color: var(--pf-text);
}
.ie__title::before {
  content: '';
  position: absolute;
  left: 0;
  top: 2px;
  bottom: 2px;
  width: 3px;
  border-radius: 2px;
  background: var(--pf-primary);
}
.ie__scope {
  float: right;
  padding: 2px 10px;
  border: 1px solid var(--pf-border-strong);
  border-radius: 999px;
  font-size: 12px;
  font-weight: 600;
  color: var(--pf-text-soft);
  background: var(--pf-surface);
}
.ie__grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}
@media (max-width: 1100px) {
  .ie__grid { grid-template-columns: repeat(2, 1fr); }
}
@media (max-width: 720px) {
  .ie__grid { grid-template-columns: 1fr; }
}

.org {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  background: var(--pf-surface);
  border: 1px solid var(--pf-border);
  border-radius: var(--pf-radius-sm);
  box-shadow: var(--pf-shadow-sm);
  cursor: pointer;
  outline: none;
  transition: border-color 0.2s ease, box-shadow 0.2s ease, transform 0.2s ease;
}
.org:hover {
  border-color: var(--pf-primary);
  box-shadow: var(--pf-shadow);
  transform: translateY(-1px);
}
.org:focus-visible {
  border-color: var(--pf-primary);
}
.org--lead {
  border-color: var(--pf-primary);
}
.org__avatar {
  width: 44px;
  height: 44px;
  flex: none;
  border-radius: 10px;
  object-fit: cover;
  background: var(--pf-bg-soft);
}
.org__body {
  flex: 1;
  min-width: 0;
}
.org__name {
  font-size: 14.5px;
  font-weight: 700;
  color: var(--pf-text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.org__lead {
  display: inline-block;
  margin-top: 5px;
  padding: 1px 7px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 600;
  color: var(--pf-primary);
  background: var(--pf-primary-soft, rgba(99, 102, 241, 0.1));
}
.org__status {
  flex: none;
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 12px;
  font-weight: 600;
}
.org__status.is-ok { color: var(--pf-success); }
.org__status.is-sync { color: var(--pf-warning); }
.org__dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: currentColor;
}
</style>
