import { defineStore } from 'pinia'
import { computeNodes, type ComputeNode } from '@/mock/computeNodes'
import { orgNodePrefix } from '@/mock/organizations'

/* ------------------------------------------------------------
   计算节点管理（机构详情页「节点管理」区块）
   种子数据来自 computeNodes mock，增删改只在会话内生效
   ------------------------------------------------------------ */

/** 新建节点的表单初始值 */
export function emptyNode(org: string): ComputeNode {
  return {
    id: '',
    org,
    name: '',
    model: '',
    cpu: '',
    cpuCores: 0,
    memory: '',
    gpuModel: '—',
    gpuCount: 0,
    gpuMemory: 0,
    gpuMemoryTotal: 0,
    storageTotal: '',
    storageFree: '',
    network: '内网',
    bandwidth: 0,
    crossBandwidth: 0,
    status: '在线',
  }
}

export const useNodeStore = defineStore('node', {
  state: () => ({ items: computeNodes.map((n) => ({ ...n })) }),
  getters: {
    byOrg: (s) => (org: string) => s.items.filter((n) => n.org === org),
  },
  actions: {
    /** 下一个可用节点编号：<前缀>-CN-nn */
    nextId(org: string): string {
      const prefix = orgNodePrefix(org)
      const used = this.items
        .filter((n) => n.org === org)
        .map((n) => Number(n.id.split('-').pop()))
        .filter((n) => Number.isFinite(n))
      const next = (used.length ? Math.max(...used) : 0) + 1
      return `${prefix}-CN-${String(next).padStart(2, '0')}`
    },
    /** 新增节点（自动补编号；GPU 数量为 0 时按无 GPU 归一） */
    add(node: ComputeNode): ComputeNode {
      const item: ComputeNode = {
        ...node,
        id: this.nextId(node.org),
        gpuMemoryTotal: node.gpuCount * node.gpuMemory,
        gpuModel: node.gpuCount ? node.gpuModel : '—',
      }
      this.items.push(item)
      return item
    },
    /** 更新节点 */
    update(node: ComputeNode) {
      const idx = this.items.findIndex((n) => n.id === node.id)
      if (idx < 0) return
      this.items[idx] = {
        ...node,
        gpuMemoryTotal: node.gpuCount * node.gpuMemory,
        gpuModel: node.gpuCount ? node.gpuModel : '—',
      }
    },
    /** 删除节点 */
    remove(id: string) {
      const idx = this.items.findIndex((n) => n.id === id)
      if (idx >= 0) this.items.splice(idx, 1)
    },
  },
})
