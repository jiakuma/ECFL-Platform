<script setup lang="ts">
// 自绘渐变图标集：比线框图标更具材质感与辨识度，支持色调映射
let seq = 0
const props = withDefaults(defineProps<{ name: string; tone?: string }>(), { tone: 'primary' })
const gid = `ai${++seq}`

const tones: Record<string, [string, string]> = {
  primary: ['#6366f1', '#8b5cf6'],
  success: ['#10b981', '#34d399'],
  accent: ['#06b6d4', '#22d3ee'],
  warning: ['#f59e0b', '#fbbf24'],
  rose: ['#f43f5e', '#fb7185'],
  violet: ['#7c3aed', '#a855f7'],
  purple: ['#a855f7', '#c084fc'],
  blue: ['#3b82f6', '#60a5fa'],
}
const c = tones[props.tone] ?? tones.primary

const raw: Record<string, string> = {
  shield:
    '<path d="M12 2.2 4.3 5.1v5.7c0 4.9 3.3 8.3 7.7 10.8 4.4-2.5 7.7-5.9 7.7-10.8V5.1L12 2.2z" fill="url(#ID)"/><path d="M8.6 12.1l2.3 2.3 4.5-4.7" fill="none" stroke="#fff" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>',
  lock:
    '<rect x="5" y="10.5" width="14" height="9.6" rx="2.2" fill="url(#ID)"/><path d="M8 10.5V8a4 4 0 0 1 8 0v2.5" fill="none" stroke="url(#ID)" stroke-width="2"/><circle cx="12" cy="15" r="1.7" fill="#fff"/><rect x="11" y="15.4" width="2" height="3.3" rx="1" fill="#fff"/>',
  network:
    '<circle cx="12" cy="5" r="2.4" fill="url(#ID)"/><circle cx="5" cy="18.5" r="2.4" fill="url(#ID)"/><circle cx="19" cy="18.5" r="2.4" fill="url(#ID)"/><path d="M12 7.3 5.9 16.6M12 7.3 18.1 16.6M7.2 18.5h9.6" stroke="#fff" stroke-width="1.5" stroke-opacity="0.65" fill="none"/>',
  building:
    '<rect x="5" y="3.4" width="14" height="17.2" rx="1.6" fill="url(#ID)"/><g fill="#fff" fill-opacity="0.92"><rect x="8" y="6.4" width="2.4" height="2.4" rx="0.5"/><rect x="13.6" y="6.4" width="2.4" height="2.4" rx="0.5"/><rect x="8" y="11" width="2.4" height="2.4" rx="0.5"/><rect x="13.6" y="11" width="2.4" height="2.4" rx="0.5"/><rect x="8" y="15.6" width="2.4" height="2.4" rx="0.5"/><rect x="13.6" y="15.6" width="2.4" height="2.4" rx="0.5"/></g>',
  monitor:
    '<rect x="3.4" y="4.4" width="17.2" height="12" rx="2" fill="url(#ID)"/><rect x="6" y="6.8" width="12" height="7" rx="1" fill="#fff" fill-opacity="0.88"/><path d="M9 20h6M12 16.4V20" stroke="url(#ID)" stroke-width="1.8" stroke-linecap="round"/>',
  cpu:
    '<rect x="6.5" y="6.5" width="11" height="11" rx="2" fill="url(#ID)"/><rect x="9.6" y="9.6" width="4.8" height="4.8" rx="1" fill="#fff" fill-opacity="0.92"/><g stroke="url(#ID)" stroke-width="1.7" stroke-linecap="round"><path d="M9 4v2.6M15 4v2.6M9 17.4V20M15 17.4V20M4 9h2.6M4 15h2.6M17.4 9H20M17.4 15H20"/></g>',
  gauge:
    '<path d="M4 16.5a8 8 0 0 1 16 0" fill="url(#ID)"/><path d="M4 16.5a8 8 0 0 1 16 0" fill="none" stroke="#fff" stroke-width="1.3" stroke-opacity="0.5"/><path d="M12 16.5 16.2 9.6" stroke="#fff" stroke-width="1.9" stroke-linecap="round"/><circle cx="12" cy="16.5" r="1.9" fill="#fff"/>',
  files:
    '<path d="M6 3.4h7l5 5V20a1.6 1.6 0 0 1-1.6 1.6h-9.8A1.6 1.6 0 0 1 5.4 20V4a.6.6 0 0 1 .6-.6z" fill="url(#ID)"/><path d="M13 3.4V8.4h5" fill="none" stroke="#fff" stroke-width="1.6" stroke-linejoin="round"/><g stroke="#fff" stroke-width="1.4" stroke-linecap="round" stroke-opacity="0.85"><path d="M8.6 12.6h6.8M8.6 15.6h6.8M8.6 18.6h4.4"/></g>',
  share:
    '<circle cx="6" cy="12" r="2.3" fill="url(#ID)"/><circle cx="17.6" cy="6" r="2.3" fill="url(#ID)"/><circle cx="17.6" cy="18" r="2.3" fill="url(#ID)"/><path d="M8 11 15.7 7.2M8 13 15.7 16.8" stroke="#fff" stroke-width="1.5" stroke-opacity="0.65" fill="none"/>',
  setting:
    '<path d="M12 3.1l1.7 2.2 2.6-.5.8 2.5 2.4 1-.9 2.5 1.4 2.3-2 1.7-.3 2.7-2.6.3-1.7 2.2-2.5-.8-2.5.8-1.7-2.2-2.6-.3-.3-2.7-2-1.7 1.4-2.3-.9-2.5 2.4-1 .8-2.5 2.6.5L12 3.1z" fill="url(#ID)"/><circle cx="12" cy="12" r="3.1" fill="#fff"/>',
}

const markup = (raw[props.name] ?? raw.monitor).split('ID').join(gid)
</script>

<template>
  <svg viewBox="0 0 24 24" class="app-icon" aria-hidden="true">
    <defs>
      <linearGradient :id="gid" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" :stop-color="c[0]" />
        <stop offset="1" :stop-color="c[1]" />
      </linearGradient>
    </defs>
    <g v-html="markup" />
  </svg>
</template>

<style scoped>
.app-icon {
  width: 100%;
  height: 100%;
  display: block;
}
</style>
