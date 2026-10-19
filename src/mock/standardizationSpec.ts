/* ============================================================
   数据标准化规范总览
   系统统一采用的标准化约定，按类别汇总；与字段映射联动展示。
   覆盖当前宽表字段（patient_id ... survival_days），共 17 个。
   约定来源：时间采用 YYYY-MM-DD、肿瘤标志物采用 ng/mL、
   枚举值采用标准中文标签、诊断采用 ICD-10、分期采用 AJCC 第8版。
   ============================================================ */

/** 标准化约定类别 */
export type SpecKind = '时间格式' | '指标单位' | '值域映射' | '编码体系' | '标准术语' | '直接映射'

/** 一条标准化约定 */
export interface SpecItem {
  kind: SpecKind
  /** 约定标题，如「日期统一格式」 */
  title: string
  /** 源侧现状 */
  source: string
  /** 标准化目标 */
  target: string
  /** 约定说明 */
  note: string
  /** 适用宽表字段 */
  fields: string[]
}

export const specItems: SpecItem[] = [
  {
    kind: '时间格式',
    title: '日期统一格式',
    source: 'YYYYMMDD / YYYY/MM/DD 等异构日期书写',
    target: 'YYYY-MM-DD',
    note: '统一日期书写规范，保证跨源按 patient_id 关联后可正确排序与区间计算。',
    fields: ['birth_date'],
  },
  {
    kind: '指标单位',
    title: '肿瘤标志物单位统一',
    source: 'ng/mL（个别源为 μg/L）',
    target: 'ng/mL',
    note: 'CEA / SCC / CA199 / CYFRA211 / AFP 浓度统一以 ng/mL 存储，避免单位混杂导致建模偏差。',
    fields: ['cea', 'scc', 'ca199', 'cyfra211', 'afp'],
  },
  {
    kind: '值域映射',
    title: '枚举值标准化',
    source: '编码 / 异构标签（如 1/2、0/1、生存/复发/死亡）',
    target: '标准中文标签',
    note: '性别、复发、生存状态等枚举字段统一映射为标准中文取值，消除口径差异。',
    fields: ['gender', 'recurrence', 'vital_status'],
  },
  {
    kind: '编码体系',
    title: '诊断与分期编码',
    source: '院内诊断码 / 文本分期',
    target: 'ICD-10 / AJCC 第8版',
    note: '诊断编码归一为 ICD-10，TNM 分期归一为 AJCC 第8版，便于跨机构比对与统计。',
    fields: ['diagnosis_code', 'ajcc_stage'],
  },
  {
    kind: '直接映射',
    title: '原值写入',
    source: '类型 / 单位 / 值域已与标准一致',
    target: '原值',
    note: '主键、姓名（脱敏）、年龄、诊断名称、随访/生存天数等直接写入标准数据，无需转换。',
    fields: ['patient_id', 'patient_name', 'age', 'diagnosis_name', 'followup_days', 'survival_days'],
  },
]

/** 类别顺序 */
export const specKinds: SpecKind[] = ['时间格式', '指标单位', '值域映射', '编码体系', '直接映射']

/** 覆盖的全部宽表字段 */
export function specFields(): string[] {
  return specItems.flatMap((s) => s.fields)
}
