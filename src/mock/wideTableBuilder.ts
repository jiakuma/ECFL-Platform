/* ============================================================
   多源数据抽取与宽表构建 Mock 层
   模拟从 HIS / LIS / 随访库抽取数据，按 patient_id 汇总为
   科研 / 建模使用的「患者级宽表」。

   本宽表是「源数据汇总后、质量处理前」的原始态：
   - 含脏数据（日期多格式、年龄带单位/空格、指标带单位、编码型值域、姓名空格、诊断编码小写）
   - 含重复记录（同一 patient_id 多条）
   - 未脱敏（patient_name 为真实全名）
   供「数据质量」的 清洗 / 去重 / 脱敏 功能作为真实输入。
   本期仅处理结构化文本数据；影像结构化字段预留入口，不处理 CT 图像本体。

   机构范围：三家医院各自持有 HIS / LIS / 随访库，宽表结构一致（标准化目标），
   仅机构名、记录数、同步状态与患者主键前缀不同。
   平台管理员（不选择机构）= 三家数据合并视图。
   ============================================================ */

import { orgNames, orgIdPrefix } from './organizations'

export type WideSourceKey = 'HIS' | 'LIS' | 'FU'
export type WideSourceStatus = '正常' | '同步异常'

export interface WideField {
  name: string
  label: string
  source: WideSourceKey
}

export interface WideSource {
  key: WideSourceKey
  /** 归属机构 */
  org: string
  /** 系统简称 */
  system: string
  /** 系统名称 */
  name: string
  /** 主要数据 */
  mainData: string
  /** 记录数 */
  records: number
  status: WideSourceStatus
  /** 对应 dataGovernance 原始数据集的 sourceId（用于「查看原始数据」抽屉） */
  rawId: string
  /** 抽取进入宽表的字段 */
  fields: WideField[]
}

/** 宽表字段顺序（按来源系统分组，强调「多源汇总成宽表」） */
export const wideFieldOrder: string[] = [
  // HIS
  'patient_id', 'patient_name', 'gender', 'birth_date', 'age',
  'diagnosis_code', 'diagnosis_name', 'ajcc_stage',
  // LIS
  'cea', 'scc', 'ca199', 'cyfra211', 'afp',
  // 随访库
  'vital_status', 'recurrence', 'followup_days', 'survival_days',
]

/** 源系统模板：三家医院结构一致，仅实例化时的机构名 / 记录数 / 状态不同 */
const SOURCE_TEMPLATE: {
  key: WideSourceKey
  system: string
  mainData: string
  fields: WideField[]
}[] = [
  {
    key: 'HIS',
    system: 'HIS',
    mainData: '患者基本信息、诊断信息、住院信息',
    fields: [
      { name: 'patient_id', label: '患者主键', source: 'HIS' },
      { name: 'patient_name', label: '患者姓名', source: 'HIS' },
      { name: 'gender', label: '性别', source: 'HIS' },
      { name: 'birth_date', label: '出生日期', source: 'HIS' },
      { name: 'age', label: '年龄', source: 'HIS' },
      { name: 'diagnosis_code', label: '诊断编码 (ICD-10)', source: 'HIS' },
      { name: 'diagnosis_name', label: '诊断名称', source: 'HIS' },
      { name: 'ajcc_stage', label: 'AJCC 分期', source: 'HIS' },
    ],
  },
  {
    key: 'LIS',
    system: 'LIS',
    mainData: '检验数据、肿瘤标志物',
    fields: [
      { name: 'cea', label: '癌胚抗原', source: 'LIS' },
      { name: 'scc', label: '鳞状细胞癌抗原', source: 'LIS' },
      { name: 'ca199', label: '糖类抗原 199', source: 'LIS' },
      { name: 'cyfra211', label: '细胞角蛋白 19 片段', source: 'LIS' },
      { name: 'afp', label: '甲胎蛋白', source: 'LIS' },
    ],
  },
  {
    key: 'FU',
    system: '随访库',
    mainData: '随访、生存信息',
    fields: [
      { name: 'vital_status', label: '生存状态', source: 'FU' },
      { name: 'recurrence', label: '复发情况', source: 'FU' },
      { name: 'followup_days', label: '随访天数', source: 'FU' },
      { name: 'survival_days', label: '生存天数', source: 'FU' },
    ],
  },
]

/** 各机构源系统规模与同步状态（记录数与 dataGovernance 的接入数据源一致） */
const ORG_SOURCE_META: Record<
  string,
  { records: number[]; status: WideSourceStatus[]; rawIds: string[] }
> = {
  解放军总医院: {
    records: [185, 2340, 96],
    status: ['正常', '正常', '同步异常'],
    rawIds: ['DS-A-HIS', 'DS-A-LIS', 'DS-A-FU'],
  },
  中日友好医院: {
    records: [142, 1876, 88],
    status: ['正常', '正常', '正常'],
    rawIds: ['DS-B-HIS', 'DS-B-LIS', 'DS-B-FU'],
  },
  肿瘤医院: {
    records: [96, 1204, 64],
    status: ['正常', '同步异常', '正常'],
    rawIds: ['DS-C-HIS', 'DS-C-LIS', 'DS-C-FU'],
  },
}

/** 机构 → 接入数据源 */
export function wideSourcesFor(org: string): WideSource[] {
  const meta = ORG_SOURCE_META[org]
  if (!meta) return []
  return SOURCE_TEMPLATE.map((t, i) => ({
    key: t.key,
    org,
    system: t.system,
    name: `${org} ${t.system}`,
    mainData: t.mainData,
    records: meta.records[i],
    status: meta.status[i],
    rawId: meta.rawIds[i],
    fields: t.fields,
  }))
}

/** 全部机构的接入数据源（平台管理员视图） */
export function allWideSources(): WideSource[] {
  return orgNames.flatMap((o) => wideSourcesFor(o))
}

/**
 * 宽表行。字段类型放宽为 `number | string`，以承载源系统抽取后、
 * 尚未经过质量处理的原始脏值（如 '65.0'、'4.3 ng/mL'、'19610312'）。
 */
export interface WideRow {
  patient_id: string
  patient_name: string
  gender: string
  birth_date: string
  age: number | string
  diagnosis_code: string
  diagnosis_name: string
  ajcc_stage: string
  cea: number | string
  scc: number | string
  ca199: number | string
  cyfra211: number | string
  afp: number | string
  vital_status: string
  recurrence: string
  followup_days: number
  survival_days: number
}

/** 确定性构造患者级宽表样例（原始态，含脏数据 / 重复 / 未脱敏） */
function buildWideRows(org: string): WideRow[] {
  const prefix = orgIdPrefix(org)
  const rows: WideRow[] = []

  // 前两行与需求示例一致（清洁基线，便于对照）
  rows.push({
    patient_id: `${prefix}-0001`, patient_name: '王大明', gender: '男', birth_date: '1961-03-12', age: 65,
    diagnosis_code: 'C15.5', diagnosis_name: '食管下段恶性肿瘤', ajcc_stage: 'IIB',
    cea: 4.3, scc: 1.2, ca199: 23.5, cyfra211: 2.8, afp: 5.1,
    vital_status: '生存', recurrence: '无', followup_days: 320, survival_days: 320,
  })
  rows.push({
    patient_id: `${prefix}-0002`, patient_name: '李秀华', gender: '女', birth_date: '1958-07-12', age: 68,
    diagnosis_code: 'C15.4', diagnosis_name: '食管胸中段恶性肿瘤', ajcc_stage: 'IIIA',
    cea: 6.8, scc: 0.9, ca199: 31.7, cyfra211: 3.4, afp: 4.6,
    vital_status: '复发', recurrence: '有', followup_days: 210, survival_days: 210,
  })

  const names = [
    '张建国', '赵丽芳', '孙志强', '周美玲', '吴东海', '郑梅香',
    '冯建军', '陈英姿', '褚伟峰', '卫平', '蒋红霞', '沈波', '韩雪梅', '杨建', '朱文军', '秦刚',
  ]
  const diags = [
    { code: 'C15.5', name: '食管下段恶性肿瘤', stage: 'IIB' },
    { code: 'C15.4', name: '食管胸中段恶性肿瘤', stage: 'IIIA' },
    { code: 'C15.3', name: '食管上段恶性肿瘤', stage: 'IB' },
    { code: 'C15.9', name: '食管恶性肿瘤', stage: 'IIIB' },
    { code: 'C15.2', name: '食管腹段恶性肿瘤', stage: 'IIA' },
    { code: 'C15.5', name: '食管下段恶性肿瘤', stage: 'III' },
  ]
  const vitalOpts = [
    { v: '生存', r: '无' },
    { v: '复发', r: '有' },
    { v: '死亡', r: '有' },
    { v: '生存', r: '无' },
  ]

  const total = 18
  for (let i = 3; i <= total; i++) {
    const k = i - 3
    const gender = k % 2 === 0 ? '男' : '女'
    const by = 1950 + ((i * 3) % 26)
    const bm = 1 + ((i * 5) % 12)
    const bd = 1 + ((i * 7) % 27)
    const diag = diags[k % diags.length]
    const vital = vitalOpts[k % vitalOpts.length]
    const fd = 90 + ((i * 23) % 640)
    const sd = vital.v === '死亡' ? fd + ((i * 5) % 80) : fd

    const row: WideRow = {
      patient_id: `${prefix}-${String(i).padStart(4, '0')}`,
      patient_name: names[k % names.length],
      gender,
      birth_date: `${by}-${String(bm).padStart(2, '0')}-${String(bd).padStart(2, '0')}`,
      age: 2026 - by,
      diagnosis_code: diag.code,
      diagnosis_name: diag.name,
      ajcc_stage: diag.stage,
      cea: Number((2.5 + ((i * 13) % 70) / 10).toFixed(1)),
      scc: Number((0.7 + ((i * 11) % 30) / 10).toFixed(1)),
      ca199: Number((15 + ((i * 17) % 90) / 10).toFixed(1)),
      cyfra211: Number((2.1 + ((i * 9) % 25) / 10).toFixed(1)),
      afp: Number((3.2 + ((i * 7) % 40) / 10).toFixed(1)),
      vital_status: vital.v,
      recurrence: vital.r,
      followup_days: fd,
      survival_days: sd,
    }

    // —— 注入脏数据（按行号模拟不同源系统的不规范写法）——
    switch (i) {
      case 3: // 日期：8 位紧凑 / 年龄：带空格
        row.birth_date = '19610312'
        row.age = ' 58 '
        break
      case 4: // 日期：斜杠分隔
        row.birth_date = '1961/03/12'
        break
      case 5: // 年龄：带 .0 / 性别：编码
        row.age = '65.0'
        row.gender = '2'
        break
      case 6: // 性别：字母编码 / 生存状态：编码 / 复发：编码 / 诊断名称：同义词
        row.gender = 'M'
        row.vital_status = '1'
        row.recurrence = '0'
        row.diagnosis_name = '食道恶性肿瘤'
        break
      case 7: // 指标：带单位
        row.cea = '4.3 ng/mL'
        row.scc = '0.9 ng/mL'
        break
      case 8: // 指标：带单位（U/mL）
        row.ca199 = '31.7 U/mL'
        row.cyfra211 = '3.4 U/mL'
        break
      case 9: // 指标：带单位 / 姓名：首尾空格
        row.afp = '5.1 IU/mL'
        row.patient_name = ' 陈英姿 '
        break
      case 10: // 诊断编码：小写 / 日期：8 位紧凑
        row.diagnosis_code = 'c15.4'
        row.birth_date = '19620518'
        break
      case 11: // 生存状态：编码
        row.vital_status = '0'
        break
      case 12: // 年龄：带「岁」/ 性别：字母编码 / 诊断名称：缺失
        row.age = '62岁'
        row.gender = 'F'
        row.diagnosis_name = ''
        break
      case 13: // 复发：编码 / 指标：带单位
        row.recurrence = '1'
        row.scc = '1.1 ng/mL'
        break
      case 14: // 日期：非法（月份 13，无法解析为合法日历日）
        row.birth_date = '20261345'
        break
      case 15: // 指标：带单位
        row.cea = '3.7 ng/mL'
        break
      case 16: // 性别：编码 / 指标：带单位 / 年龄：异常值（超出合理区间）
        row.gender = '1'
        row.ca199 = '28.4 U/mL'
        row.age = 150
        break
      case 17: // 年龄：带空格 / 生存状态：编码
        row.age = ' 70 '
        row.vital_status = '1'
        break
      case 18: // 诊断编码：小写
        row.diagnosis_code = 'c15.9'
        break
    }
    rows.push(row)
  }

  // —— 注入重复记录（同一 patient_id 多条，供「去重」功能检测）——
  // 近重复：同一患者，姓名格式 / 部分字段略有差异
  rows.push({
    patient_id: `${prefix}-0001`, patient_name: '王大明', gender: '男', birth_date: '1961-03-12', age: 65,
    diagnosis_code: 'C15.5', diagnosis_name: '食管下段恶性肿瘤', ajcc_stage: 'IIB',
    cea: 4.3, scc: 1.2, ca199: 23.5, cyfra211: 2.8, afp: 5.1,
    vital_status: '生存', recurrence: '无', followup_days: 320, survival_days: 320,
  } as WideRow)
  // 完全重复：与第 5 行完全一致
  rows.push({ ...rows[4] })
  // 近重复：第 11 行患者，随访天数不同（不同批次抽取）
  rows.push({
    patient_id: `${prefix}-0011`, patient_name: '蒋红霞', gender: '女', birth_date: '1960-06-18', age: 66,
    diagnosis_code: 'C15.4', diagnosis_name: '食管胸中段恶性肿瘤', ajcc_stage: 'IIIB',
    cea: 5.9, scc: 1.4, ca199: 22.1, cyfra211: 3.0, afp: 4.9,
    vital_status: '死亡', recurrence: '有', followup_days: 188, survival_days: 188,
  } as WideRow)

  return rows
}

/** 机构 → 宽表行 */
export function wideRowsFor(org: string): WideRow[] {
  return buildWideRows(org)
}

/** 全部机构的宽表行（平台管理员视图） */
export function allWideRows(): WideRow[] {
  return orgNames.flatMap((o) => buildWideRows(o))
}

/* ------------------------------------------------------------
   当前生效的机构范围（活绑定）
   三个质量引擎在函数体内读取 wideRows / wideSources，
   因此切换机构后无需改签名即可跟随数据范围。
   ------------------------------------------------------------ */
export let wideSources: WideSource[] = allWideSources()
export let wideRows: WideRow[] = allWideRows()

/** 切换机构范围：org 为空 = 平台管理员（三家合并） */
export function setWideOrg(org: string | null): void {
  wideSources = org ? wideSourcesFor(org) : allWideSources()
  wideRows = org ? wideRowsFor(org) : allWideRows()
}
