// ============================================================
// 患者主档案 Mock 数据层 —— 后端就绪后可整体替换为真实 API 调用
// 数据不出域策略：敏感字段一律脱敏/遮蔽，可见级别决定展示口径
// ============================================================

// ---------- 数据可见级别 ----------
// full    完全可见（本机构内，可信节点授权）
// masked  脱敏可见（跨机构协作，仅可见脱敏后的诊疗信息）
// summary 摘要可见（其他联盟，仅可见聚合摘要）
export type DataLevel = 'full' | 'masked' | 'summary'

export type FollowStatus = '随访中' | '治疗中' | '失访' | '已结案'

export type Gender = '男' | '女'

// ---------- 脱敏工具（演示用，正式实现由后端脱敏引擎下发） ----------
export function maskName(name: string): string {
  if (name.length <= 1) return name
  if (name.length === 2) return `${name[0]}*`
  return `${name[0]}${'*'.repeat(name.length - 2)}${name[name.length - 1]}`
}

export function maskIdNo(id: string): string {
  if (id.length < 8) return id
  return `${id.slice(0, 4)}**********${id.slice(-4)}`
}

export function maskPhone(phone: string): string {
  if (phone.length < 7) return phone
  return `${phone.slice(0, 3)}****${phone.slice(-4)}`
}

export function maskAddress(addr: string): string {
  if (addr.length <= 4) return addr
  return `${addr.slice(0, 4)}****`
}

export function maskCode(code: string): string {
  return `${code.slice(0, 4)}****${code.slice(-4)}`
}

// ---------- 列表行数据 ----------
export interface PatientRow {
  id: string
  code: string
  name: string
  gender: Gender
  age: number
  diagnosis: string
  histology: string
  site: string
  stage: string
  org: string
  level: DataLevel
  status: FollowStatus
  updatedAt: string
  followUps: number
  resources: number
  // ---------- PMI 主索引要素 ----------
  primaryId: string                 // 平台统一主索引编码
  localIds: { org: string; id: string }[]  // 跨机构本地编码映射
  duplicateFlag?: boolean           // 疑似重复待核（低匹配度候选）
}

export const patientList: PatientRow[] = [
  { id: 'P-0001', code: 'EC-2024-000128', name: '王晓明', gender: '男', age: 61, diagnosis: '食管鳞状细胞癌', histology: '中分化鳞癌', site: '胸中段', stage: 'pT2N1M0 · IIB', org: '国家癌症中心', level: 'full', status: '随访中', updatedAt: '2026-08-22', followUps: 11, resources: 23,
    primaryId: 'PMI-EC-000128', localIds: [{ org: '国家癌症中心', id: 'NCC-2024-00318' }, { org: '江城人民医院', id: 'JC-2024-09721' }] },
  { id: 'P-0002', code: 'EC-2024-000217', name: '李桂芳', gender: '女', age: 58, diagnosis: '食管腺癌', histology: '黏液腺癌', site: '贲门', stage: 'pT3N1M0 · IIIA', org: '华东肿瘤医院', level: 'masked', status: '治疗中', updatedAt: '2026-08-20', followUps: 6, resources: 17,
    primaryId: 'PMI-EC-000217', localIds: [{ org: '华东肿瘤医院', id: 'HD-2024-01169' }, { org: '滨海检验中心', id: 'BH-2024-00452' }] },
  { id: 'P-0003', code: 'EC-2024-000309', name: '张建军', gender: '男', age: 66, diagnosis: '食管鳞状细胞癌', histology: '低分化鳞癌', site: '胸上段', stage: 'pT1bN0M0 · IA', org: '华南省疾控', level: 'masked', status: '随访中', updatedAt: '2026-08-18', followUps: 9, resources: 12,
    primaryId: 'PMI-EC-000309', localIds: [{ org: '华南省疾控', id: 'GD-2024-00247' }] },
  { id: 'P-0004', code: 'EC-2024-000421', name: '刘秀英', gender: '女', age: 54, diagnosis: '食管小细胞癌', histology: '小细胞癌', site: '胸下段', stage: 'pT2N2M1 · IVB', org: '江城人民医院', level: 'full', status: '治疗中', updatedAt: '2026-08-19', followUps: 5, resources: 29,
    primaryId: 'PMI-EC-000421', localIds: [{ org: '江城人民医院', id: 'JC-2024-00954' }, { org: '国家癌症中心', id: 'NCC-2024-02107' }], duplicateFlag: true },
  { id: 'P-0005', code: 'EC-2024-000508', name: '陈建国', gender: '男', age: 70, diagnosis: '食管鳞状细胞癌', histology: '高分化鳞癌', site: '颈段', stage: 'pT1aN0M0 · I', org: '国家癌症中心', level: 'summary', status: '已结案', updatedAt: '2026-08-15', followUps: 14, resources: 8,
    primaryId: 'PMI-EC-000508', localIds: [{ org: '国家癌症中心', id: 'NCC-2024-00177' }, { org: '华东肿瘤医院', id: 'HD-2024-01883' }] },
  { id: 'P-0006', code: 'EC-2024-000623', name: '赵春梅', gender: '女', age: 63, diagnosis: '食管鳞状细胞癌', histology: '中分化鳞癌', site: '胸中段', stage: 'pT3N1M0 · IIIA', org: '北方肿瘤', level: 'masked', status: '随访中', updatedAt: '2026-08-21', followUps: 8, resources: 19,
    primaryId: 'PMI-EC-000623', localIds: [{ org: '北方肿瘤', id: 'BF-2024-00621' }, { org: '华南省疾控', id: 'GD-2024-01552' }], duplicateFlag: true },
  { id: 'P-0007', code: 'EC-2024-000734', name: '孙永强', gender: '男', age: 52, diagnosis: '食管腺癌', histology: '腺鳞癌', site: '贲门', stage: 'pT2N0M0 · IB', org: '华东肿瘤医院', level: 'full', status: '随访中', updatedAt: '2026-08-17', followUps: 7, resources: 15,
    primaryId: 'PMI-EC-000734', localIds: [{ org: '华东肿瘤医院', id: 'HD-2024-01440' }] },
  { id: 'P-0008', code: 'EC-2024-000842', name: '周淑芬', gender: '女', age: 67, diagnosis: '食管鳞状细胞癌', histology: '低分化鳞癌', site: '胸下段', stage: 'pT4N1M0 · IIIB', org: '浙江省肿瘤', level: 'summary', status: '失访', updatedAt: '2026-07-28', followUps: 4, resources: 21,
    primaryId: 'PMI-EC-000842', localIds: [{ org: '浙江省肿瘤', id: 'ZJ-2024-00335' }, { org: '国家癌症中心', id: 'NCC-2024-01998' }] },
  { id: 'P-0009', code: 'EC-2024-000919', name: '吴志刚', gender: '男', age: 59, diagnosis: '食管鳞状细胞癌', histology: '中分化鳞癌', site: '胸上段', stage: 'pT1bN0M0 · IA', org: '湘雅医院', level: 'masked', status: '随访中', updatedAt: '2026-08-16', followUps: 10, resources: 11,
    primaryId: 'PMI-EC-000919', localIds: [{ org: '湘雅医院', id: 'XY-2024-00761' }, { org: '华南省疾控', id: 'GD-2024-01709' }], duplicateFlag: true },
  { id: 'P-0010', code: 'EC-2024-001033', name: '郑丽娟', gender: '女', age: 49, diagnosis: '食管腺癌', histology: '黏液腺癌', site: '胸中段', stage: 'pT2N1M0 · IIB', org: '华西医院', level: 'masked', status: '治疗中', updatedAt: '2026-08-23', followUps: 6, resources: 26,
    primaryId: 'PMI-EC-001033', localIds: [{ org: '华西医院', id: 'XH-2024-01005' }] },
  { id: 'P-0011', code: 'EC-2024-001137', name: '冯国庆', gender: '男', age: 64, diagnosis: '食管鳞状细胞癌', histology: '高分化鳞癌', site: '胸下段', stage: 'pT1aN0M0 · I', org: '华南省疾控', level: 'full', status: '随访中', updatedAt: '2026-08-14', followUps: 13, resources: 9,
    primaryId: 'PMI-EC-001137', localIds: [{ org: '华南省疾控', id: 'GD-2024-00418' }] },
  { id: 'P-0012', code: 'EC-2024-001221', name: '何秀兰', gender: '女', age: 57, diagnosis: '食管鳞状细胞癌', histology: '中分化鳞癌', site: '胸中段', stage: 'pT2N2M0 · IIIA', org: '江城人民医院', level: 'summary', status: '治疗中', updatedAt: '2026-08-24', followUps: 5, resources: 31,
    primaryId: 'PMI-EC-001221', localIds: [{ org: '江城人民医院', id: 'JC-2024-01184' }, { org: '国家癌症中心', id: 'NCC-2024-02430' }], duplicateFlag: true },
]

// ---------- 详情子结构 ----------
export interface DiagnosisRecord {
  id: string
  date: string
  type: '临床诊断' | '病理诊断' | '分期诊断'
  histology: string
  differentiation: string
  site: string
  t: string
  n: string
  m: string
  stage: string
  basis: string
  org: string
}

export interface TreatmentRecord {
  id: string
  line: string
  modality: '手术' | '化疗' | '放疗' | '免疫治疗' | '靶向治疗'
  name: string
  scheme: string
  cycles: string
  startDate: string
  endDate: string
  efficacy: 'CR' | 'PR' | 'SD' | 'PD' | '—'
  status: '进行中' | '已完成'
  org: string
}

export interface FollowUpRecord {
  id: string
  date: string
  modality: '门诊' | '电话' | '住院复查'
  outcome: '无病生存' | '局部复发' | '远处转移' | '死亡'
  summary: string
  nextDate: string
  org: string
}

export interface LabPoint {
  date: string
  value: number
}

export interface LabSeries {
  key: string
  name: string
  unit: string
  refLower: number
  refUpper: number
  points: LabPoint[]
}

export interface ResourceItem {
  id: string
  type: '内镜' | 'CT' | 'MRI' | '病理切片' | '基因检测'
  title: string
  date: string
  size: string
  format: string
  status: '已对齐' | '待对齐' | '授权可见'
}

export interface AuditLog {
  id: string
  time: string
  actor: string
  org: string
  action: string
  scope: string
  channel: string
  result: '通过' | '拒绝' | '脱敏下发'
}

export interface TimelineNode {
  id: string
  date: string
  kind: '建档' | '诊断' | '治疗' | '随访' | '检查'
  title: string
  desc: string
  org: string
}

export interface PatientDetail {
  id: string
  code: string
  name: string
  gender: Gender
  age: number
  idNo: string
  phone: string
  address: string
  level: DataLevel
  status: FollowStatus
  diagnosis: string
  stage: string
  org: string
  joinedAt: string
  updatedAt: string
  primaryId: string
  localIds: { org: string; id: string }[]
  diagnoses: DiagnosisRecord[]
  treatments: TreatmentRecord[]
  followUps: FollowUpRecord[]
  labs: LabSeries[]
  resources: ResourceItem[]
  audits: AuditLog[]
  timeline: TimelineNode[]
}

// ---------- 详情数据（按 id 检索） ----------
const ctzPoint = (dates: string[], values: number[]): LabPoint[] => dates.map((date, i) => ({ date, value: values[i] }))

export const patientDetails: Record<string, PatientDetail> = {
  'P-0001': {
    id: 'P-0001',
    code: 'EC-2024-000128',
    name: '王晓明',
    gender: '男',
    age: 61,
    idNo: '420102196508120011',
    phone: '13871001122',
    address: '湖北省武汉市江岸区长江路 132 号',
    level: 'full',
    status: '随访中',
    diagnosis: '食管鳞状细胞癌（胸中段）',
    stage: 'pT2N1M0 · IIB',
    org: '国家癌症中心',
    joinedAt: '2024-03-12',
    updatedAt: '2026-08-22',
    primaryId: 'EC-2024-000128',
    localIds: [
      { org: '国家癌症中心', id: 'NCC-2024-00318' },
      { org: '江城人民医院', id: 'JC-2024-09721' },
    ],
    diagnoses: [
      { id: 'D-1', date: '2024-03-15', type: '临床诊断', histology: '食管鳞状细胞癌', differentiation: '中分化', site: '胸中段', t: 'T2', n: 'N1', m: 'M0', stage: 'IIB', basis: '消化道造影 + 病理活检', org: '国家癌症中心' },
      { id: 'D-2', date: '2024-03-20', type: '病理诊断', histology: '食管鳞状细胞癌', differentiation: '中分化', site: '胸中段', t: 'T2', n: 'N1', m: 'M0', stage: 'IIB', basis: '内镜下活检 HE + IHC', org: '国家癌症中心' },
      { id: 'D-3', date: '2024-03-28', type: '分期诊断', histology: '食管鳞状细胞癌', differentiation: '中分化', site: '胸中段', t: 'T2', n: 'N1', m: 'M0', stage: 'IIB', basis: '增强 CT + 超声内镜', org: '国家癌症中心' },
    ],
    treatments: [
      { id: 'T-1', line: '新辅助治疗', modality: '化疗', name: '顺铂 + 氟尿嘧啶', scheme: 'DCF 方案', cycles: '2 周期', startDate: '2024-04-05', endDate: '2024-05-10', efficacy: 'PR', status: '已完成', org: '国家癌症中心' },
      { id: 'T-2', line: '手术治疗', modality: '手术', name: '胸腹腔镜联合食管癌根治术', scheme: 'McKeown 术式', cycles: '—', startDate: '2024-06-02', endDate: '2024-06-09', efficacy: 'CR', status: '已完成', org: '江城人民医院' },
      { id: 'T-3', line: '辅助治疗', modality: '免疫治疗', name: '替雷利珠单抗', scheme: '单药维持', cycles: '12 周期', startDate: '2024-07-15', endDate: '2025-07-10', efficacy: 'SD', status: '已完成', org: '国家癌症中心' },
      { id: 'T-4', line: '随访观察', modality: '化疗', name: '定期复查', scheme: '门诊随访', cycles: '—', startDate: '2025-07-11', endDate: '—', efficacy: '—', status: '进行中', org: '国家癌症中心' },
    ],
    followUps: [
      { id: 'F-8', date: '2026-08-10', modality: '门诊', outcome: '无病生存', summary: '血常规、肝肾功能正常，CEA 平稳', nextDate: '2026-11-10', org: '国家癌症中心' },
      { id: 'F-7', date: '2026-05-12', modality: '电话', outcome: '无病生存', summary: '自述进食通畅，无吞咽困难', nextDate: '2026-08-12', org: '国家癌症中心' },
      { id: 'F-6', date: '2026-02-03', modality: '住院复查', outcome: '无病生存', summary: '增强 CT 未见复发迹象', nextDate: '2026-05-03', org: '江城人民医院' },
      { id: 'F-5', date: '2025-11-06', modality: '门诊', outcome: '无病生存', summary: '复查未见异常，营养状态良好', nextDate: '2026-02-06', org: '国家癌症中心' },
    ],
    labs: [
      {
        key: 'cea', name: '癌胚抗原 CEA', unit: 'ng/mL', refLower: 0, refUpper: 5,
        points: ctzPoint(
          ['2024-04', '2024-08', '2025-01', '2025-06', '2025-12', '2026-03', '2026-08'],
          [18.6, 6.2, 4.8, 3.9, 3.1, 2.7, 2.4],
        ),
      },
      {
        key: 'scc', name: '鳞状细胞癌抗原 SCC', unit: 'ng/mL', refLower: 0, refUpper: 1.5,
        points: ctzPoint(
          ['2024-04', '2024-08', '2025-01', '2025-06', '2025-12', '2026-03', '2026-08'],
          [9.4, 2.1, 1.6, 1.1, 0.9, 0.8, 0.7],
        ),
      },
      {
        key: 'hgb', name: '血红蛋白 HGB', unit: 'g/L', refLower: 130, refUpper: 175,
        points: ctzPoint(
          ['2024-04', '2024-08', '2025-01', '2025-06', '2025-12', '2026-03', '2026-08'],
          [88, 102, 118, 126, 131, 134, 138],
        ),
      },
    ],
    resources: [
      { id: 'R-1', type: '内镜', title: '胃镜白光图像组（2024-03）', date: '2024-03-18', size: '2.1 GB', format: 'DICOM', status: '已对齐' },
      { id: 'R-2', type: 'CT', title: '胸部增强 CT 三平面（2024-03）', date: '2024-03-24', size: '68 MB', format: 'DICOM', status: '已对齐' },
      { id: 'R-3', type: '病理切片', title: '食管活检 HE 全片', date: '2024-03-20', size: '1.4 GB', format: 'SVS', status: '已对齐' },
      { id: 'R-4', type: '基因检测', title: 'NGS 68 基因 Panel 报告', date: '2024-04-01', size: '12 MB', format: 'VCF+PDF', status: '授权可见' },
      { id: 'R-5', type: 'CT', title: '术后随访胸部 CT（2026-02）', date: '2026-02-03', size: '71 MB', format: 'DICOM', status: '待对齐' },
    ],
    audits: [
      { id: 'A-6', time: '2026-08-22 14:32', actor: '周医生', org: '国家癌症中心', action: '查看完整档案', scope: '全部字段（full 级）', channel: '院内可信终端', result: '通过' },
      { id: 'A-5', time: '2026-08-10 09:12', actor: '随访专管员', org: '国家癌症中心', action: '录入随访记录', scope: '随访模块', channel: '院内可信终端', result: '通过' },
      { id: 'A-4', time: '2026-07-19 16:03', actor: '数据专员', org: '华东肿瘤医院', action: '申请跨机构授权', scope: '治疗记录（masked）', channel: '联邦网关', result: '拒绝' },
      { id: 'A-3', time: '2026-03-01 11:45', actor: '科研员 B', org: '南方医科大', action: '检索命中（不落库）', scope: '摘要级聚合', channel: '联邦查询代理', result: '脱敏下发' },
      { id: 'A-2', time: '2025-12-20 10:08', actor: '质控员', org: '国家癌症中心', action: '数据质控复核', scope: '诊断与分期', channel: '院内可信终端', result: '通过' },
      { id: 'A-1', time: '2024-03-12 08:30', actor: '档案管理员', org: '国家癌症中心', action: '患者主索引建档', scope: '基本信息', channel: '院内可信终端', result: '通过' },
    ],
    timeline: [
      { id: 'L-9', date: '2026-08-10', kind: '随访', title: '门诊随访（第 8 次）', desc: '无病生存，复查指标平稳，下次随访 2026-11-10', org: '国家癌症中心' },
      { id: 'L-8', date: '2025-07-11', kind: '治疗', title: '免疫维持治疗完成', desc: '替雷利珠单抗 12 周期给药完成，进入随访观察期', org: '国家癌症中心' },
      { id: 'L-7', date: '2025-03-02', kind: '检查', title: '定期影像复查', desc: '增强 CT 未见复发，纵隔淋巴结稳定', org: '国家癌症中心' },
      { id: 'L-6', date: '2024-07-15', kind: '治疗', title: '辅助免疫治疗启动', desc: '替雷利珠单抗维持，目标 1 年', org: '国家癌症中心' },
      { id: 'L-5', date: '2024-06-02', kind: '治疗', title: '食管癌根治术', desc: '胸腹腔镜联合 McKeown 术式，R0 切除', org: '江城人民医院' },
      { id: 'L-4', date: '2024-04-05', kind: '治疗', title: '新辅助化疗启动', desc: 'DCF 方案 2 周期，疗效评估 PR', org: '国家癌症中心' },
      { id: 'L-3', date: '2024-03-28', kind: '诊断', title: '临床分期 pT2N1M0 · IIB', desc: '增强 CT + 超声内镜确认淋巴结转移', org: '国家癌症中心' },
      { id: 'L-2', date: '2024-03-20', kind: '诊断', title: '病理确诊：食管鳞状细胞癌（中分化）', desc: '内镜下活检 HE + IHC 确诊', org: '国家癌症中心' },
      { id: 'L-1', date: '2024-03-12', kind: '建档', title: '建立患者主索引', desc: '主索引 EC-2024-000128，归属国家癌症中心', org: '国家癌症中心' },
    ],
  },
  'P-0002': {
    id: 'P-0002',
    code: 'EC-2024-000217',
    name: '李桂芳',
    gender: '女',
    age: 58,
    idNo: '320105196804230028',
    phone: '13705155678',
    address: '江苏省南京市鼓楼区中山北路 88 号',
    level: 'masked',
    status: '治疗中',
    diagnosis: '食管腺癌（贲门）',
    stage: 'pT3N1M0 · IIIA',
    org: '华东肿瘤医院',
    joinedAt: '2024-05-08',
    updatedAt: '2026-08-20',
    primaryId: 'EC-2024-000217',
    localIds: [
      { org: '华东肿瘤医院', id: 'HD-2024-01169' },
      { org: '滨海检验中心', id: 'BH-2024-00452' },
    ],
    diagnoses: [
      { id: 'D-1', date: '2024-05-12', type: '病理诊断', histology: '食管腺癌', differentiation: '黏液腺癌', site: '贲门', t: 'T3', n: 'N1', m: 'M0', stage: 'IIIA', basis: '胃镜活检 HE', org: '华东肿瘤医院' },
      { id: 'D-2', date: '2024-05-20', type: '分期诊断', histology: '食管腺癌', differentiation: '黏液腺癌', site: '贲门', t: 'T3', n: 'N1', m: 'M0', stage: 'IIIA', basis: '腹部增强 CT', org: '滨海检验中心' },
    ],
    treatments: [
      { id: 'T-1', line: '一线治疗', modality: '化疗', name: '奥沙利铂 + 卡培他滨', scheme: 'XELOX 方案', cycles: '4 周期', startDate: '2024-06-01', endDate: '2024-09-20', efficacy: 'SD', status: '已完成', org: '华东肿瘤医院' },
      { id: 'T-2', line: '二线治疗', modality: '放疗', name: '贲门病灶调强放疗', scheme: 'IMRT 50.4Gy/28f', cycles: '28 次', startDate: '2024-10-10', endDate: '2024-11-28', efficacy: 'PR', status: '已完成', org: '华东肿瘤医院' },
      { id: 'T-3', line: '维持治疗', modality: '靶向治疗', name: '曲妥珠单抗', scheme: 'HER2 阳性维持', cycles: '6 周期', startDate: '2025-01-05', endDate: '2026-07-30', efficacy: 'SD', status: '进行中', org: '华东肿瘤医院' },
    ],
    followUps: [
      { id: 'F-4', date: '2026-07-30', modality: '住院复查', outcome: '无病生存', summary: '贲门病灶较前缩小，吞咽顺利', nextDate: '2026-10-30', org: '华东肿瘤医院' },
      { id: 'F-3', date: '2026-03-18', modality: '门诊', outcome: '无病生存', summary: '血象耐受，轻度外周神经毒性', nextDate: '2026-07-18', org: '华东肿瘤医院' },
    ],
    labs: [
      {
        key: 'cea', name: '癌胚抗原 CEA', unit: 'ng/mL', refLower: 0, refUpper: 5,
        points: ctzPoint(['2024-06', '2024-09', '2025-01', '2025-07', '2026-02', '2026-07'], [24.1, 15.2, 8.6, 6.4, 4.2, 3.5]),
      },
      {
        key: 'hgb', name: '血红蛋白 HGB', unit: 'g/L', refLower: 115, refUpper: 150,
        points: ctzPoint(['2024-06', '2024-09', '2025-01', '2025-07', '2026-02', '2026-07'], [92, 104, 112, 118, 122, 125]),
      },
    ],
    resources: [
      { id: 'R-1', type: '内镜', title: '胃镜贲门病灶组（2024-05）', date: '2024-05-12', size: '1.9 GB', format: 'DICOM', status: '已对齐' },
      { id: 'R-2', type: 'CT', title: '腹部增强 CT（2024-05）', date: '2024-05-20', size: '54 MB', format: 'DICOM', status: '已对齐' },
      { id: 'R-3', type: '基因检测', title: 'HER2 FISH 检测报告', date: '2024-06-03', size: '8 MB', format: 'PDF', status: '授权可见' },
    ],
    audits: [
      { id: 'A-4', time: '2026-08-20 10:15', actor: '张医生', org: '华东肿瘤医院', action: '查看完整档案', scope: '全部字段（full 级）', channel: '院内可信终端', result: '通过' },
      { id: 'A-3', time: '2026-07-19 16:03', actor: '数据专员', org: '国家癌症中心', action: '申请跨机构授权', scope: '诊断与分期（masked）', channel: '联邦网关', result: '拒绝' },
      { id: 'A-2', time: '2026-05-11 09:40', actor: '科研员 A', org: '南方医科大', action: '检索命中（不落库）', scope: '摘要级聚合', channel: '联邦查询代理', result: '脱敏下发' },
      { id: 'A-1', time: '2024-05-08 15:20', actor: '档案管理员', org: '华东肿瘤医院', action: '患者主索引建档', scope: '基本信息', channel: '院内可信终端', result: '通过' },
    ],
    timeline: [
      { id: 'L-6', date: '2025-01-05', kind: '治疗', title: 'HER2 靶向维持启动', desc: '曲妥珠单抗维持，状态 SD 平稳', org: '华东肿瘤医院' },
      { id: 'L-5', date: '2024-10-10', kind: '治疗', title: '贲门调强放疗（IMRT）', desc: '50.4Gy/28f，疗效评估 PR', org: '华东肿瘤医院' },
      { id: 'L-4', date: '2024-09-20', kind: '检查', title: '一线 XELOX 疗效评估', desc: '4 周期后状态 SD，启动二线放疗', org: '华东肿瘤医院' },
      { id: 'L-3', date: '2024-06-01', kind: '治疗', title: '一线化疗启动', desc: 'XELOX 方案 4 周期', org: '华东肿瘤医院' },
      { id: 'L-2', date: '2024-05-20', kind: '诊断', title: '分期 pT3N1M0 · IIIA', desc: '腹部增强 CT 见贲门病灶侵犯浆膜', org: '滨海检验中心' },
      { id: 'L-1', date: '2024-05-08', kind: '建档', title: '建立患者主索引', desc: '主索引 EC-2024-000217，归属华东肿瘤医院', org: '华东肿瘤医院' },
    ],
  },
  'P-0003': {
    id: 'P-0003',
    code: 'EC-2024-000309',
    name: '张建军',
    gender: '男',
    age: 66,
    idNo: '440106195807301455',
    phone: '13926008901',
    address: '广东省广州市天河区体育西路 19 号',
    level: 'masked',
    status: '随访中',
    diagnosis: '食管鳞状细胞癌（胸上段）',
    stage: 'pT1bN0M0 · IA',
    org: '华南省疾控',
    joinedAt: '2024-06-21',
    updatedAt: '2026-08-18',
    primaryId: 'EC-2024-000309',
    localIds: [{ org: '华南省疾控', id: 'GD-2024-00247' }],
    diagnoses: [
      { id: 'D-1', date: '2024-06-25', type: '病理诊断', histology: '食管鳞状细胞癌', differentiation: '低分化', site: '胸上段', t: 'T1b', n: 'N0', m: 'M0', stage: 'IA', basis: '内镜下黏膜剥离标本病理', org: '华南省疾控' },
    ],
    treatments: [
      { id: 'T-1', line: '内镜治疗', modality: '手术', name: '内镜下黏膜下剥离术（ESD）', scheme: 'ESD 整块切除', cycles: '—', startDate: '2024-07-08', endDate: '2024-07-08', efficacy: 'CR', status: '已完成', org: '华南省疾控' },
    ],
    followUps: [
      { id: 'F-5', date: '2026-07-14', modality: '门诊', outcome: '无病生存', summary: '复查内镜未见残留病灶', nextDate: '2026-10-14', org: '华南省疾控' },
      { id: 'F-4', date: '2026-01-09', modality: '电话', outcome: '无病生存', summary: '吞咽正常，体重稳定', nextDate: '2026-04-09', org: '华南省疾控' },
      { id: 'F-3', date: '2025-07-11', modality: '门诊', outcome: '无病生存', summary: '复查未见异常', nextDate: '2025-10-11', org: '华南省疾控' },
    ],
    labs: [
      {
        key: 'scc', name: '鳞状细胞癌抗原 SCC', unit: 'ng/mL', refLower: 0, refUpper: 1.5,
        points: ctzPoint(['2024-07', '2025-01', '2025-07', '2026-01', '2026-07'], [2.3, 1.2, 0.9, 0.8, 0.7]),
      },
    ],
    resources: [
      { id: 'R-1', type: '内镜', title: 'ESD 术前白光 + NBI（2024-06）', date: '2024-06-25', size: '2.4 GB', format: 'DICOM', status: '已对齐' },
      { id: 'R-2', type: '病理切片', title: 'ESD 全片病理（2024-07）', date: '2024-07-12', size: '1.7 GB', format: 'SVS', status: '已对齐' },
    ],
    audits: [
      { id: 'A-3', time: '2026-08-18 17:02', actor: '随访护士', org: '华南省疾控', action: '录入随访记录', scope: '随访模块', channel: '院内可信终端', result: '通过' },
      { id: 'A-2', time: '2026-04-02 11:28', actor: '科研员 C', org: '浙江肿瘤', action: '申请跨机构授权', scope: '病理切片（masked）', channel: '联邦网关', result: '拒绝' },
      { id: 'A-1', time: '2024-06-21 14:10', actor: '档案管理员', org: '华南省疾控', action: '患者主索引建档', scope: '基本信息', channel: '院内可信终端', result: '通过' },
    ],
    timeline: [
      { id: 'L-4', date: '2025-07-11', kind: '随访', title: '门诊随访（无病生存）', desc: '内镜复查未见残留病灶', org: '华南省疾控' },
      { id: 'L-3', date: '2024-07-08', kind: '治疗', title: 'ESD 整块切除', desc: '标本病理 R0，无需辅助治疗', org: '华南省疾控' },
      { id: 'L-2', date: '2024-06-25', kind: '诊断', title: '病理确诊 pT1bN0M0 · IA', desc: '低分化鳞癌，局限于黏膜下层', org: '华南省疾控' },
      { id: 'L-1', date: '2024-06-21', kind: '建档', title: '建立患者主索引', desc: '主索引 EC-2024-000309，归属华南省疾控', org: '华南省疾控' },
    ],
  },
}

// ---------- 详情解析：优先返回完整详情，缺失时由列表行合成最小可用详情 ----------
export function resolvePatientDetail(id: string): PatientDetail {
  if (patientDetails[id]) return patientDetails[id]
  const row = patientList.find((p) => p.id === id)
  const f = row ?? patientList[0]
  const stageSuffix = (f.stage.split(' · ')[1] ?? '').trim()
  return {
    id: f.id,
    code: f.code,
    name: f.name,
    gender: f.gender,
    age: f.age,
    idNo: '—',
    phone: '—',
    address: '—',
    level: f.level,
    status: f.status,
    diagnosis: `${f.diagnosis}（${f.site}）`,
    stage: f.stage,
    org: f.org,
    joinedAt: '—',
    updatedAt: f.updatedAt,
    primaryId: f.primaryId,
    localIds: f.localIds,
    diagnoses: [
      {
        id: 'D-1', date: '', type: '临床诊断', histology: f.histology,
        differentiation: '—', site: f.site, t: '—', n: '—', m: '—',
        stage: stageSuffix, basis: '由归属机构上报', org: f.org,
      },
    ],
    treatments: [],
    followUps: [],
    labs: [],
    resources: [],
    audits: [],
    timeline: [
      { id: 'L-1', date: '', kind: '建档', title: '建立患者主索引', desc: `主索引 ${f.primaryId}，归属 ${f.org}`, org: f.org },
      { id: 'L-2', date: '', kind: '诊断', title: `临床诊断：${f.diagnosis}（${f.site}）`, desc: `${f.histology}`, org: f.org },
      { id: 'L-3', date: '', kind: '诊断', title: `临床分期 ${f.stage}`, desc: '分期信息由归属机构上报', org: f.org },
    ],
  }
}