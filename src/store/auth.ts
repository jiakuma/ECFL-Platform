import { defineStore } from 'pinia'

/** 旧角色码（兼容历史登录数据与既有页面） */
export type AuthRole = 'admin' | 'user' | 'governor'

/** 界面端：应用端 / 管理端 */
export type SideMode = 'app' | 'admin'

/** 应用端角色 */
export type AppRoleKey = 'doctor' | 'researcher' | 'fedMember'
/** 管理端角色 */
export type AdminRoleKey = 'platformAdmin' | 'orgAdmin' | 'dataAdmin' | 'approver' | 'securityAdmin'
export type RoleKey = AppRoleKey | AdminRoleKey

export interface RoleDef {
  key: RoleKey
  label: string
  side: SideMode
}

/** 角色目录：决定用户默认进入哪一端（本次仅做结构占位，未实现完整 RBAC） */
export const ROLE_CATALOG: RoleDef[] = [
  { key: 'doctor', label: '医生', side: 'app' },
  { key: 'researcher', label: '科研人员', side: 'app' },
  { key: 'fedMember', label: '联邦任务参与人员', side: 'app' },
  { key: 'platformAdmin', label: '平台管理员', side: 'admin' },
  { key: 'orgAdmin', label: '机构管理员', side: 'admin' },
  { key: 'dataAdmin', label: '数据管理员', side: 'admin' },
  { key: 'approver', label: '审批人员', side: 'admin' },
  { key: 'securityAdmin', label: '安全管理员', side: 'admin' },
]

/** 旧角色码 → 新角色码 */
const LEGACY_ROLE_MAP: Record<AuthRole, RoleKey> = {
  admin: 'platformAdmin',
  user: 'doctor',
  governor: 'approver',
}

export function roleDef(key?: string | null): RoleDef | undefined {
  return ROLE_CATALOG.find((r) => r.key === key)
}

export function sideOfRole(key?: string | null): SideMode {
  return roleDef(key)?.side ?? 'app'
}

export interface AuthUser {
  name: string
  role: AuthRole
  org: string
}

const TOKEN_KEY = 'ecflp_token'
const USER_KEY = 'ecflp_user'
const ROLE_KEY = 'ecflp_role'
const SIDE_KEY = 'ecflp_side'

function readUser(): AuthUser | null {
  try {
    return JSON.parse(localStorage.getItem(USER_KEY) || '{"name":"调试用户","role":"admin","org":"测试医院"}') as AuthUser
  } catch {
    return null
  }
}

const initialUser = readUser()

export const useAuthStore = defineStore('auth', {
  state: () => ({
    token: localStorage.getItem(TOKEN_KEY) || 'debug-token',
    user: initialUser as AuthUser | null,
    /** 当前角色码（新体系），缺省由旧角色码映射 */
    roleKey: (localStorage.getItem(ROLE_KEY) as RoleKey | null) || LEGACY_ROLE_MAP[initialUser?.role ?? 'admin'],
    /** 当前所处界面端 */
    side: (localStorage.getItem(SIDE_KEY) as SideMode | null) || sideOfRole(LEGACY_ROLE_MAP[initialUser?.role ?? 'admin']),
  }),
  getters: {
    isAuthenticated: (s) => !!s.token,
    /** 当前角色定义 */
    roleDef(): RoleDef | undefined {
      return roleDef(this.roleKey)
    },
    /** 当前角色标签 */
    roleLabel(): string {
      return this.roleDef?.label ?? '未分配角色'
    },
    /** 是否具备进入管理端的资格 */
    canAccessAdmin(): boolean {
      return this.roleDef?.side === 'admin'
    },
    /** 生效界面端：无管理端权限时强制回落应用端 */
    currentSide(): SideMode {
      return this.side === 'admin' && this.canAccessAdmin ? 'admin' : 'app'
    },
  },
  actions: {
    login(payload: { name: string; role: AuthRole; org: string }) {
      this.token = 'mock-token-' + Date.now()
      this.user = { name: payload.name, role: payload.role, org: payload.org }
      const mapped = LEGACY_ROLE_MAP[payload.role]
      this.roleKey = mapped
      this.side = sideOfRole(mapped)
      localStorage.setItem(TOKEN_KEY, this.token)
      localStorage.setItem(USER_KEY, JSON.stringify(this.user))
      localStorage.setItem(ROLE_KEY, this.roleKey)
      localStorage.setItem(SIDE_KEY, this.side)
    },
    /** 切换界面端（无管理端权限时忽略） */
    setSide(side: SideMode) {
      if (side === 'admin' && !this.canAccessAdmin) return false
      this.side = side
      localStorage.setItem(SIDE_KEY, side)
      return true
    },
    /** 切换角色（由机构上下文驱动）；不改变当前所处端，切换机构不会把人踢到另一端 */
    setRole(key: RoleKey) {
      this.roleKey = key
      localStorage.setItem(ROLE_KEY, key)
    },
    logout() {
      this.token = ''
      this.user = null
      localStorage.removeItem(TOKEN_KEY)
      localStorage.removeItem(USER_KEY)
      localStorage.removeItem(ROLE_KEY)
      localStorage.removeItem(SIDE_KEY)
    },
  },
})
