/* ============================================================
   计算节点 —— 各机构接入联邦平台的计算资源
   节点 = 机构本地实际参与联邦计算的服务器（SecretFlow 节点部署载体）
   状态仅两种：在线 / 离线
   带宽单位统一 Mbps
   ============================================================ */

export type NetworkType = '内网' | 'VPN' | '专线'
export type NodeStatus = '在线' | '离线'

export interface ComputeNode {
  /** 节点编号（机构内唯一） */
  id: string
  /** 归属机构 */
  org: string
  /** 节点名称 */
  name: string
  /** 服务器型号 */
  model: string
  /** CPU 型号 */
  cpu: string
  /** CPU 核心数 */
  cpuCores: number
  /** 内存容量 */
  memory: string
  /** GPU 型号；无 GPU 时为 '—' */
  gpuModel: string
  /** GPU 数量 */
  gpuCount: number
  /** 单卡显存（GB） */
  gpuMemory: number
  /** 总显存（GB）= 数量 × 单卡显存 */
  gpuMemoryTotal: number
  /** 存储总容量 */
  storageTotal: string
  /** 存储可用容量 */
  storageFree: string
  /** 网络连接方式 */
  network: NetworkType
  /** 标称带宽（Mbps） */
  bandwidth: number
  /** 跨机构可用带宽（Mbps） */
  crossBandwidth: number
  /** 节点状态 */
  status: NodeStatus
}

export const computeNodes: ComputeNode[] = [
  /* ---------------- 解放军总医院（牵头医院）：3 台 ---------------- */
  {
    id: 'NCC-CN-01',
    org: '解放军总医院',
    name: '计算节点(1)',
    model: 'Dell PowerEdge R750',
    cpu: 'Intel Xeon Gold 6338',
    cpuCores: 32,
    memory: '256 GB DDR4',
    gpuModel: 'NVIDIA A100 80GB',
    gpuCount: 2,
    gpuMemory: 80,
    gpuMemoryTotal: 160,
    storageTotal: '8 TB NVMe SSD',
    storageFree: '3.4 TB',
    network: '专线',
    bandwidth: 1000,
    crossBandwidth: 800,
    status: '在线',
  },
  {
    id: 'NCC-CN-02',
    org: '解放军总医院',
    name: '计算节点(2)',
    model: '华为 FusionServer 2288H V6',
    cpu: '鲲鹏 920 7260',
    cpuCores: 48,
    memory: '512 GB DDR4',
    gpuModel: 'NVIDIA V100 32GB',
    gpuCount: 4,
    gpuMemory: 32,
    gpuMemoryTotal: 128,
    storageTotal: '16 TB SAS/SATA',
    storageFree: '6.2 TB',
    network: '专线',
    bandwidth: 1000,
    crossBandwidth: 800,
    status: '在线',
  },
  {
    id: 'NCC-CN-03',
    org: '解放军总医院',
    name: '计算节点(3)',
    model: 'HPE ProLiant DL380 Gen10',
    cpu: 'Intel Xeon Silver 4214',
    cpuCores: 24,
    memory: '128 GB DDR4',
    gpuModel: '—',
    gpuCount: 0,
    gpuMemory: 0,
    gpuMemoryTotal: 0,
    storageTotal: '4 TB SATA SSD',
    storageFree: '0.6 TB',
    network: '内网',
    bandwidth: 1000,
    crossBandwidth: 300,
    status: '离线',
  },

  /* ---------------- 中日友好医院：2 台 ---------------- */
  {
    id: 'ZRY-CN-01',
    org: '中日友好医院',
    name: '计算节点(1)',
    model: 'Lenovo ThinkSystem SR650',
    cpu: 'Intel Xeon Gold 6248R',
    cpuCores: 24,
    memory: '192 GB DDR4',
    gpuModel: 'NVIDIA RTX 4090 24GB',
    gpuCount: 1,
    gpuMemory: 24,
    gpuMemoryTotal: 24,
    storageTotal: '6 TB NVMe SSD',
    storageFree: '2.1 TB',
    network: 'VPN',
    bandwidth: 500,
    crossBandwidth: 200,
    status: '在线',
  },
  {
    id: 'ZRY-CN-02',
    org: '中日友好医院',
    name: '计算节点(2)',
    model: '浪潮 NF5280M6',
    cpu: 'Intel Xeon Bronze 3204',
    cpuCores: 12,
    memory: '96 GB DDR4',
    gpuModel: '—',
    gpuCount: 0,
    gpuMemory: 0,
    gpuMemoryTotal: 0,
    storageTotal: '3 TB SATA SSD',
    storageFree: '1.5 TB',
    network: '内网',
    bandwidth: 200,
    crossBandwidth: 100,
    status: '在线',
  },

  /* ---------------- 肿瘤医院：2 台 ---------------- */
  {
    id: 'ZLY-CN-01',
    org: '肿瘤医院',
    name: '计算节点(1)',
    model: '华为 Atlas 800 训练服务器',
    cpu: '鲲鹏 920 5250',
    cpuCores: 32,
    memory: '384 GB DDR4',
    gpuModel: '昇腾 910B 32GB',
    gpuCount: 4,
    gpuMemory: 32,
    gpuMemoryTotal: 128,
    storageTotal: '12 TB NVMe SSD',
    storageFree: '5.8 TB',
    network: '专线',
    bandwidth: 1000,
    crossBandwidth: 600,
    status: '在线',
  },
  {
    id: 'ZLY-CN-02',
    org: '肿瘤医院',
    name: '计算节点(2)',
    model: 'Dell PowerEdge R740',
    cpu: 'Intel Xeon Gold 5120',
    cpuCores: 16,
    memory: '128 GB DDR4',
    gpuModel: 'NVIDIA T4 16GB',
    gpuCount: 1,
    gpuMemory: 16,
    gpuMemoryTotal: 16,
    storageTotal: '4 TB SAS',
    storageFree: '0.4 TB',
    network: 'VPN',
    bandwidth: 300,
    crossBandwidth: 100,
    status: '离线',
  },
]

/** 机构的计算节点 */
export function nodesOfOrg(org: string): ComputeNode[] {
  return computeNodes.filter((n) => n.org === org)
}

/** 机构节点汇总 */
export function nodeSummary(org: string) {
  const list = nodesOfOrg(org)
  return {
    total: list.length,
    online: list.filter((n) => n.status === '在线').length,
    offline: list.filter((n) => n.status === '离线').length,
    gpuTotal: list.reduce((n, x) => n + x.gpuCount, 0),
    gpuMemoryTotal: list.reduce((n, x) => n + x.gpuMemoryTotal, 0),
    cpuCores: list.reduce((n, x) => n + x.cpuCores, 0),
  }
}
