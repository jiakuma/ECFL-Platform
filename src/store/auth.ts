import { defineStore } from 'pinia'

export type AuthRole = 'admin' | 'user' | 'governor'

export interface AuthUser {
  name: string
  role: AuthRole
  org: string
}

const TOKEN_KEY = 'ecflp_token'
const USER_KEY = 'ecflp_user'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    token: localStorage.getItem(TOKEN_KEY) || 'debug-token',
    user: JSON.parse(localStorage.getItem(USER_KEY) || '{"name":"调试用户","role":"admin","org":"测试医院"}') as AuthUser | null,
  }),
  getters: {
    isAuthenticated: (s) => !!s.token,
  },
  actions: {
    login(payload: { name: string; role: AuthRole; org: string }) {
      this.token = 'mock-token-' + Date.now()
      this.user = { name: payload.name, role: payload.role, org: payload.org }
      localStorage.setItem(TOKEN_KEY, this.token)
      localStorage.setItem(USER_KEY, JSON.stringify(this.user))
    },
    logout() {
      this.token = ''
      this.user = null
      localStorage.removeItem(TOKEN_KEY)
      localStorage.removeItem(USER_KEY)
    },
  },
})
