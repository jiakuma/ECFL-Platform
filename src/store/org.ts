import { defineStore } from 'pinia'
import { orgNames, orgInfo, leadOrg, type OrgInfo } from '@/mock/organizations'
import { setWideOrg } from '@/mock/wideTableBuilder'
import { useAuthStore, type RoleKey } from './auth'

/* ------------------------------------------------------------
   机构上下文（顶部「机构切换器」的唯一状态源，应用端 / 管理端共用）
   - 未选择机构 = 平台管理员：管理端可查看三家机构的全部数据
   - 选择某家医院 = 该机构的机构管理员：仅查看本机构数据
   - 应用端固定落在具体机构（未选择时默认牵头机构）
   切换时同步：全局角色（auth） + 宽表数据范围（wideTableBuilder）
   ------------------------------------------------------------ */

const ORG_KEY = 'ecflp_org'

/** 平台管理员标识（不选择机构） */
export const PLATFORM_ADMIN = '平台管理员'

function readSaved(): string {
  const v = localStorage.getItem(ORG_KEY) || ''
  return orgNames.includes(v) ? v : ''
}

export const useOrgStore = defineStore('org', {
  state: () => {
    const selected = readSaved()
    // 恢复持久化的机构范围，保证首屏与顶部切换器一致
    setWideOrg(selected || null)
    return { selected }
  },
  getters: {
    /** 是否平台管理员（未选择机构） */
    isPlatformAdmin(): boolean {
      return !this.selected
    },
    /** 当前机构名；未选择时为「全部机构」 */
    current(): string {
      return this.selected || '全部机构'
    },
    /** 应用端当前机构：应用端必须落在具体机构，未选择时默认牵头机构 */
    appCurrent(): string {
      return this.selected || leadOrg
    },
    /** 当前身份标签：平台管理员 / 机构管理员 */
    roleLabel(): string {
      return this.selected ? '机构管理员' : PLATFORM_ADMIN
    },
    /** 切换器可选项（三家医院） */
    allowedOrgs(): string[] {
      return orgNames
    },
    /** 当前机构信息 */
    currentOrgInfo(): OrgInfo | undefined {
      return this.selected ? orgInfo(this.selected) : undefined
    },
    /** 数据范围涉及的组织（平台管理员为三家，机构管理员为本机构） */
    scopeOrgs(): string[] {
      return this.selected ? [this.selected] : orgNames
    },
  },
  actions: {
    /** 选择机构；传 null / 空 = 回到平台管理员 */
    select(name: string | null) {
      const next = name && orgNames.includes(name) ? name : ''
      this.selected = next
      localStorage.setItem(ORG_KEY, next)

      const auth = useAuthStore()
      const role: RoleKey = next ? 'orgAdmin' : 'platformAdmin'
      if (auth.roleKey !== role) auth.setRole(role)

      setWideOrg(next || null)
    },
  },
})
