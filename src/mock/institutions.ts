/* ============================================================
   接入机构清单 —— 「机构管理」一级菜单的入口页数据来源
   机构名称 / 等级 / 节点编码以 organizations.ts 为唯一数据源；
   患者数由已登记的患者级数据源记录汇总，不另造数字
   ============================================================ */

import { orgNames, leadOrg } from './organizations'
import { dataSources } from './dataGovernance'
import plaAvatar from '@/assets/org-avatars/pla-general-hospital.png'
import cjfAvatar from '@/assets/org-avatars/china-japan-friendship.png'
import chAvatar from '@/assets/org-avatars/cancer-hospital.png'

export interface InstitutionInfo {
  /** 机构名称 */
  name: string
  /** 机构头像 */
  avatar: string
  /** 是否牵头医院 */
  lead: boolean
  /** 接入状态 */
  status: '已接入' | '同步中'
  /** 已接入患者数（患者级数据源的记录合计） */
  patients: number
}

/** 机构头像 */
const AVATAR: Record<string, string> = {
  解放军总医院: plaAvatar,
  中日友好医院: cjfAvatar,
  肿瘤医院: chAvatar,
}

/** 接入状态 */
const STATUS: Record<string, InstitutionInfo['status']> = {
  解放军总医院: '已接入',
  中日友好医院: '已接入',
  肿瘤医院: '同步中',
}

function num(v: string): number {
  const n = Number(v.replace(/,/g, ''))
  return Number.isFinite(n) ? n : 0
}

/** 患者级记录合计 */
function patientCount(name: string): number {
  return dataSources
    .filter((d) => d.org === name && !d.imaging && d.dataType.includes('患者'))
    .reduce((n, d) => n + num(d.records), 0)
}

export const institutions: InstitutionInfo[] = orgNames.map((name) => ({
  name,
  avatar: AVATAR[name] ?? plaAvatar,
  lead: name === leadOrg,
  status: STATUS[name] ?? '已接入',
  patients: patientCount(name),
}))

/** 机构名称 → 卡片信息 */
export function institutionInfo(name: string): InstitutionInfo | undefined {
  return institutions.find((i) => i.name === name)
}
