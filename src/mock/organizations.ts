/* ============================================================
   接入机构登记表 —— 机构名称的唯一数据源
   name 与 orgSourceFields / dataGovernance / wideTableBuilder 中的机构名保持一致
   三家医院 + 「不选择机构（平台管理员）」的全局视图
   ============================================================ */

export interface OrgInfo {
  /** 机构名称（机构上下文的唯一标识） */
  name: string
  /** 机构等级：国家级 / 省级 */
  level: string
  /** 联邦节点编码 */
  nodeCode: string
  /** 宽表患者主键前缀（同一机构内唯一） */
  idPrefix: string
  /** 计算节点编号前缀 */
  nodePrefix: string
}

export const orgRegistry: OrgInfo[] = [
  { name: '解放军总医院', level: '国家级', nodeCode: 'NCC-0001', idPrefix: 'PMI', nodePrefix: 'NCC' },
  { name: '中日友好医院', level: '省级', nodeCode: 'ZRY-0002', idPrefix: 'ZRY', nodePrefix: 'ZRY' },
  { name: '肿瘤医院', level: '省级', nodeCode: 'ZLY-0003', idPrefix: 'ZLY', nodePrefix: 'ZLY' },
]

/** 机构名称列表 */
export const orgNames: string[] = orgRegistry.map((o) => o.name)

/** 牵头医院（第一家） */
export const leadOrg: string = orgRegistry[0].name

export function orgInfo(name: string): OrgInfo | undefined {
  return orgRegistry.find((o) => o.name === name)
}

/** 机构患者主键前缀；未知机构回落 PMI */
export function orgIdPrefix(name: string): string {
  return orgInfo(name)?.idPrefix ?? 'PMI'
}

/** 机构计算节点编号前缀；未知机构回落 NCC */
export function orgNodePrefix(name: string): string {
  return orgInfo(name)?.nodePrefix ?? 'NCC'
}
