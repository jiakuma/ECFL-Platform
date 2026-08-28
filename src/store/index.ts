import { defineStore } from 'pinia'

export const useAppStore = defineStore('app', {
  state: () => ({
    brand: 'PixelForge',
    tagline: '前端演示工坊',
    visits: Number(localStorage.getItem('pf_visits') || 0),
  }),
  actions: {
    bumpVisit() {
      this.visits += 1
      localStorage.setItem('pf_visits', String(this.visits))
    },
  },
})
