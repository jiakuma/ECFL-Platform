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
  { id: 'P-0006', code: 'EC-2024-000623', name: '赵春梅', gender: '女', age: 63, diagnosis: '食管鳞状细胞癌', histology: '中分化鳞癌', site: '胸中段', stage: 'pT3N1M0 · IIIA', org: '北方肿瘤', level: 'masked', status: '随访中', updatedAt: '2026-08-21', followUps:    8, resources: 19,
    primaryId: 'PMI-EC-000623', localIds: [{ org: '北方肿瘤', id: 'BF-2024-00621' }, { org: '华南省疾控', id: 'GD-2024-01552' }], duplicateFlag: true },
  { id: 'P-0007', code: 'EC-2024-000734', name: '孙永强', gender: '男', age: 52, diagnosis: '食管腺癌', histology: '腺鳞癌', site: '贲门', stage: 'pT2N0M0 · IB', org: '华东肿瘤医院', level: 'full', status: '随访中', updatedAt: '2026-08-17', followUps: 7, resources: 15,
    primaryId: 'PMI-EC-000734', localIds: [{ org: '华东肿瘤医院', id: 'HD-2024-01440' }] },
  { id: 'P-0008', code: 'EC-2024-000842', name: '周淑芬', gender: '女', age: 67, diagnosis: '食管鳞状细胞癌', histology: '低分化鳞癌', site: '胸下段', stage: 'pT4N1M0 · IIIB', org: '浙江省肿瘤', level: 'summary', status: '失访', updatedAt: '2026-07-28', followUps: 4, resources: 21,
    primaryId: 'PMI-EC-000842', localIds: [{ org: '浙江省肿瘤', id: 'ZJ-2024-00335' }, { org: '国家癌症中心', id: 'NCC-2024-01998' }] },
  { id: 'P-0009', code: 'EC-2024-000919', name: '吴志刚', gender: '男', age: 59, diagnosis: '食管鳞状细胞癌', histology: '中分化鳞癌', site: '胸上段', stage: 'pT1bN0M0 · IA', org: '湘雅医院', level: 'masked', status: '随访中', updatedAt: '2026-08-16', followUps: 10, resources: 11,
    primaryId: 'PMI-EC-000919', localIds: [{ org: '湘雅医院', id: 'XY-2024-00761' }, { org: '华南省疾控', id: 'GD-2024-01709' }], duplicateFlag: true },
  { id: 'P-0010', code: 'EC-2024-001033', name: '郑丽娟', gender: '女', age: 49, diagnosis: '食管腺癌', histology: '黏液腺癌', site: '胸中段', stage: 'pT2N1M0 · IIB', org: '华西医院', level: 'masked', status: '治疗中', updatedAt: '2026-08-23', followUps: 6, resources:  26,
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

// 就诊（真实门诊 / 急诊行为）：患者跨医疗机构发生的真实就诊经历，与「诊疗时间轴（事件级）」职责区分。
// 仅承载就诊本身信息（科室 / 主诉 / 当次诊断 / 去向），不含治疗过程、随访、检查、病理等诊疗细节。
export type VisitType = '门诊' | '急诊'
export interface VisitRecord {
  id: string
  date: string
  org: string            // 医疗机构
  type: VisitType        // 门诊 / 急诊
  dept: string           // 就诊科室
  reason: string         // 就诊原因或主诉
  diagnosis: string      // 当次主要诊断
  disposition: string    // 就诊去向（离院 / 转诊 / 收住院，如有）
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

// 患者旅程事件类别（事件级，与「就诊概览」真实门诊/急诊就诊职责区分）：
// 就诊节点→由真实就诊（门诊/急诊）生成，作为时间轴的就诊标记，可经「就诊」筛选；与右侧「就诊概览」同源同量；
// 检查→检查检验；诊断分期→病理与分子；
// 治疗决策/治疗→治疗记录；疗效评估/复查/随访/复发转移→随访预后
export type TimelineKind =
  | '就诊节点'
  | '检查'
  | '诊断分期'
  | '治疗决策'
  | '治疗'
  | '疗效评估'
  | '复查'
  | '随访'
  | '复发转移'
export interface TimelineNode {
  id: string
  date: string
  kind: TimelineKind
  title: string
  desc: string
  org: string
  // 关联业务记录 id：用于从旅程事件跳转到对应页面并定位具体记录
  // 诊断分期→诊断记录 D-id；治疗/治疗决策→治疗记录 T-id；
  // 随访/复查/疗效评估/复发转移→随访记录 F-id；检查→时间轴节点自身 id
  ref?: string
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
  visits: VisitRecord[]
}

// ---------- 详情数据（按 id 检索） ----------
const ctzPoint = (dates: string[], values: number[]): LabPoint[] => dates.map((date, i) => ({ date, value: values[i] }))

const _patientDetailsRaw: Record<string, Omit<PatientDetail, 'visits'>> = {
  // ===== P-0001 食管中段鳞癌 IIB：新辅助化疗 → 手术 → 辅助免疫 → 随访 =====
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
      { id: 'D-1', date: '2024-03-15', type: '病理诊断', histology: '食管鳞状细胞癌', differentiation: '中分化', site: '胸中段', t: 'T2', n: 'N1', m: 'M0', stage: 'IIB', basis: '胃镜活检 HE + IHC', org: '国家癌症中心' },
      { id: 'D-2', date: '2024-06-09', type: '分期诊断', histology: '食管鳞状细胞癌', differentiation: '中分化', site: '胸中段', t: 'ypT2', n: 'N1', m: 'M0', stage: 'IIB', basis: '术后病理', org: '江城人民医院' },
    ],
    treatments: [
      { id: 'T-1', line: '新辅助治疗', modality: '化疗', name: 'DCF 方案', scheme: '多西他赛+顺铂+氟尿嘧啶', cycles: '2 周期', startDate: '2024-04-05', endDate: '2024-05-10', efficacy: 'PR', status: '已完成', org: '国家癌症中心' },
      { id: 'T-2', line: '手术治疗', modality: '手术', name: '胸腹腔镜联合食管癌根治术', scheme: 'McKeown 三切口', cycles: '—', startDate: '2024-06-02', endDate: '2024-06-09', efficacy: 'CR', status: '已完成', org: '江城人民医院' },
      { id: 'T-3', line: '辅助治疗', modality: '免疫治疗', name: '替雷利珠单抗', scheme: '单药维持', cycles: '12 周期', startDate: '2024-07-15', endDate: '2025-07-10', efficacy: 'SD', status: '已完成', org: '国家癌症中心' },
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
        points: ctzPoint(['2024-04', '2024-08', '2025-01', '2025-06', '2025-12', '2026-03', '2026-08'], [18.6, 6.2, 4.8, 3.9, 3.1, 2.7, 2.4]),
      },
      {
        key: 'scc', name: '鳞状细胞癌抗原 SCC', unit: 'ng/mL', refLower: 0, refUpper: 1.5,
        points: ctzPoint(['2024-04', '2024-08', '2025-01', '2025-06', '2025-12', '2026-03', '2026-08'], [9.4, 2.1, 1.6, 1.1, 0.9, 0.8, 0.7]),
      },
      {
        key: 'hgb', name: '血红蛋白 HGB', unit: 'g/L', refLower: 130, refUpper: 175,
        points: ctzPoint(['2024-04', '2024-08', '2025-01', '2025-06', '2025-12', '2026-03', '2026-08'], [88, 102, 118, 126, 131, 134, 138]),
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
    ],
    timeline: [
      { id: 'L-1', date: '2024-02-20', kind: '就诊节点', title: '外院首诊转入', desc: '进行性吞咽困难 2 月，外院胃镜报食管中段占位，转入本院', org: '国家癌症中心' },
      { id: 'L-2', date: '2024-03-02', kind: '检查', title: '胃镜 + 超声内镜（EUS）', desc: '距门齿 28–32cm 不规则隆起，EUS 示侵犯黏膜下层，未及外膜', org: '国家癌症中心' },
      { id: 'L-3', date: '2024-03-15', kind: '诊断分期', title: '活检病理 · 临床分期 cT2N1M0 IIB', desc: '食管鳞癌（中分化），纵隔淋巴结可疑转移；依据胃镜活检 HE + IHC', org: '国家癌症中心' },
      { id: 'L-4', date: '2024-03-24', kind: '检查', title: '胸部增强 CT', desc: '纵隔 2 枚淋巴结可疑（长径 1.1cm），未见远处转移', org: '国家癌症中心' },
      { id: 'L-5', date: '2024-03-30', kind: '治疗决策', title: 'MDT 多学科讨论', desc: '食管中段鳞癌 IIB（cT2N1M0），推荐新辅助化疗后手术', org: '国家癌症中心' },
      { id: 'L-6', date: '2024-04-05', kind: '治疗', title: '新辅助化疗（DCF）启动', desc: '多西他赛+顺铂+氟尿嘧啶，2 周期，疗效评估 PR', org: '国家癌症中心' },
      { id: 'L-7', date: '2024-06-02', kind: '治疗', title: '食管癌根治术（McKeown）', desc: '胸腹腔镜联合三切口，R0 切除', org: '江城人民医院' },
      { id: 'L-8', date: '2024-06-09', kind: '诊断分期', title: '术后病理 · ypT2N1M0', desc: '切缘 R0，清扫淋巴结 1/18 阳性，分期 IIB', org: '江城人民医院' },
      { id: 'L-9', date: '2024-07-15', kind: '治疗', title: '辅助免疫治疗（替雷利珠单抗）', desc: '术后维持 12 周期，疗效 SD', org: '国家癌症中心' },
      { id: 'L-10', date: '2026-08-10', kind: '随访', title: '门诊随访（第 11 次）', desc: '无病生存，CEA 平稳，下次随访 2026-11-10', org: '国家癌症中心' },
    ],
  },

  // ===== P-0002 食管胃结合部腺癌 IIIA：新辅助化疗 + 同步放化疗 + 靶向维持（治疗中） =====
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
      { id: 'D-2', date: '2024-05-20', type: '分期诊断', histology: '食管腺癌', differentiation: '黏液腺癌', site: '贲门', t: 'T3', n: 'N1', m: 'M0', stage: 'IIIA', basis: '腹盆增强 CT + PET-CT', org: '滨海检验中心' },
    ],
    treatments: [
      { id: 'T-1', line: '一线治疗', modality: '化疗', name: 'XELOX 方案', scheme: '奥沙利铂 + 卡培他滨', cycles: '4 周期', startDate: '2024-06-01', endDate: '2024-09-20', efficacy: 'SD', status: '已完成', org: '华东肿瘤医院' },
      { id: 'T-2', line: '同步放疗', modality: '放疗', name: '调强放疗 IMRT', scheme: '50.4Gy/28f', cycles: '28 次', startDate: '2024-10-10', endDate: '2024-11-28', efficacy: 'PR', status: '已完成', org: '华东肿瘤医院' },
      { id: 'T-3', line: '维持治疗', modality: '靶向治疗', name: '曲妥珠单抗', scheme: 'HER2 阳性维持', cycles: '持续', startDate: '2025-01-05', endDate: '—', efficacy: 'SD', status: '进行中', org: '华东肿瘤医院' },
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
      { id: 'R-2', type: 'CT', title: '腹盆增强 CT（2024-05）', date: '2024-05-20', size: '54 MB', format: 'DICOM', status: '已对齐' },
      { id: 'R-3', type: '基因检测', title: 'HER2 FISH 检测报告', date: '2024-06-03', size: '8 MB', format: 'PDF', status: '授权可见' },
    ],
    audits: [
      { id: 'A-4', time: '2026-08-20 10:15', actor: '张医生', org: '华东肿瘤医院', action: '查看完整档案', scope: '全部字段（full 级）', channel: '院内可信终端', result: '通过' },
      { id: 'A-3', time: '2026-07-19 16:03', actor: '数据专员', org: '国家癌症中心', action: '申请跨机构授权', scope: '诊断与分期（masked）', channel: '联邦网关', result: '拒绝' },
      { id: 'A-1', time: '2024-05-08 15:20', actor: '档案管理员', org: '华东肿瘤医院', action: '患者主索引建档', scope: '基本信息', channel: '院内可信终端', result: '通过' },
    ],
    timeline: [
      { id: 'L-1', date: '2024-04-15', kind: '就诊节点', title: '外院首诊 · 本院初诊', desc: '进食哽噎 4 月，外院胃镜查出贲门占位，转入本院', org: '华东肿瘤医院' },
      { id: 'L-2', date: '2024-04-28', kind: '检查', title: '胃镜 + EUS', desc: '贲门后壁 3.5cm 溃疡型肿物，EUS 侵犯肌层（sm3），累及浆膜下', org: '华东肿瘤医院' },
      { id: 'L-3', date: '2024-05-12', kind: '诊断分期', title: '活检病理 · cT3N1M0 IIIA', desc: '黏液腺癌，依据胃镜活检 HE', org: '华东肿瘤医院' },
      { id: 'L-4', date: '2024-05-20', kind: '检查', title: '腹盆增强 CT + PET-CT', desc: '纵隔 1 枚淋巴结可疑；PET-CT 未见远处转移', org: '滨海检验中心' },
      { id: 'L-5', date: '2024-05-28', kind: '治疗决策', title: 'MDT 治疗决策', desc: '食管胃结合部腺癌 IIIA，HER2(3+) 阳性，行新辅助放化疗 + 靶向', org: '华东肿瘤医院' },
      { id: 'L-6', date: '2024-06-01', kind: '治疗', title: '一线化疗（XELOX）', desc: '奥沙利铂+卡培他滨 4 周期，疗效 SD', org: '华东肿瘤医院' },
      { id: 'L-7', date: '2024-10-10', kind: '治疗', title: '同步调强放疗（IMRT）', desc: '50.4Gy/28f，疗效评估 PR', org: '华东肿瘤医院' },
      { id: 'L-8', date: '2025-01-05', kind: '治疗', title: '曲妥珠单抗靶向维持（进行中）', desc: 'HER2 阳性维持治疗，状态 SD 平稳', org: '华东肿瘤医院' },
      { id: 'L-9', date: '2026-07-30', kind: '随访', title: '住院复查', desc: '贲门病灶缩小，吞咽顺利，下次随访 2026-10-30', org: '华东肿瘤医院' },
    ],
  },

  // ===== P-0003 早期食管鳞癌 IA：内镜 ESD，无辅助治疗 =====
  'P-0003': {
    id: 'P-0003',
    code: 'EC-2024-000309',
    name: '张建军',
    gender: '男',
    age: 66,
    idNo: '440106195807301455',
    phone:  '13926008901',
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
      { id: 'D-1', date: '2024-06-25', type: '病理诊断', histology: '食管鳞状细胞癌', differentiation: '低分化', site: '胸上段', t: 'T1b', n: 'N0', m: 'M0', stage: 'IA', basis: 'ESD 标本病理', org: '华南省疾控' },
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
      { id: 'L-1', date: '2024-06-10', kind: '就诊节点', title: '体检内镜发现病变', desc: '常规体检胃镜发现胸上段黏膜病变，无自觉症状', org: '华南省疾控' },
      { id: 'L-2', date: '2024-06-20', kind: '检查', title: '胃镜 + NBI 放大', desc: '胸上段 1.5cm 平坦病变，边界清晰，EUS 局限于黏膜下层', org: '华南省疾控' },
      { id: 'L-3', date: '2024-06-25', kind: '诊断分期', title: '活检病理 · cT1bN0M0 IA', desc: '低分化鳞癌，局限于黏膜下层，无淋巴结转移征象', org: '华南省疾控' },
      { id: 'L-4', date: '2024-07-08', kind: '治疗', title: 'ESD 整块切除', desc: '内镜下黏膜下剥离，切缘阴性，无需辅助治疗', org: '华南省疾控' },
      { id: 'L-5', date: '2024-07-12', kind: '诊断分期', title: '术后病理 · pT1bN0M0', desc: '标本完整，切缘及基底阴性，淋巴结未清扫', org: '华南省疾控' },
      { id: 'L-6', date: '2026-08-18', kind: '随访', title: '门诊随访（第 9 次）', desc: '内镜复查未见残留，下次随访 2026-10-14', org: '华南省疾控' },
    ],
  },

  // ===== P-0004 食管小细胞癌 IVB：广泛期系统性化疗 + 免疫维持（治疗中） =====
  'P-0004': {
    id: 'P-0004',
    code: 'EC-2024-000421',
    name: '刘秀英',
    gender: '女',
    age: 54,
    idNo: '320106197203110044',
    phone: '13901558899',
    address: '江苏省南京市建邺区江东中路 28 号',
    level: 'full',
    status: '治疗中',
    diagnosis: '食管小细胞癌',
    stage: 'pT2N2M1 · IVB',
    org:  '江城人民医院',
    joinedAt: '2024-03-05',
    updatedAt: '2026-08-19',
    primaryId: 'EC-2024-000421',
    localIds: [
      { org: '江城人民医院', id: 'JC-2024-00954' },
      { org: '国家癌症中心', id: 'NCC-2024-02107' },
    ],
    diagnoses: [
      { id: 'D-1', date: '2024-03-18', type: '病理诊断', histology: '小细胞神经内分泌癌', differentiation: '高级别', site: '胸下段', t: 'T2', n: 'N2', m: 'M1', stage: 'IVB', basis: '胃镜活检 + 肝穿刺', org: '江城人民医院' },
      { id: 'D-2', date: '2024-03-22', type: '分期诊断', histology: '小细胞神经内分泌癌', differentiation: '高级别', site: '胸下段', t: 'T2', n: 'N2', m: 'M1', stage: 'IVB', basis: 'PET-CT', org: '国家癌症中心' },
    ],
    treatments: [
      { id: 'T-1', line: '一线治疗', modality: '化疗', name: 'EP 方案', scheme: '依托泊苷 + 顺铂', cycles: '4 周期', startDate: '2024-04-05', endDate: '2024-08-20', efficacy: 'PR', status: '已完成', org: '江城人民医院' },
      { id: 'T-2', line: '维持治疗', modality: '免疫治疗', name: '卡瑞利珠单抗', scheme: '单药维持', cycles: '持续', startDate: '2024-09-01', endDate: '—', efficacy: 'SD', status: '进行中', org: '江城人民医院' },
    ],
    followUps: [
      { id: 'F-4', date: '2026-08-19', modality: '住院复查', outcome: '无病生存', summary: '肝转移灶稳定，继续免疫维持', nextDate: '2026-11-19', org: '江城人民医院' },
      { id: 'F-3', date: '2026-04-10', modality: '门诊', outcome: '无病生存', summary: '肿瘤标志物下降，一般状况可', nextDate: '2026-08-10', org: '江城人民医院' },
    ],
    labs: [
      {
        key: 'nse', name: '神经元特异烯醇化酶 NSE', unit: 'ng/mL', refLower: 0, refUpper: 16.3,
        points: ctzPoint(['2024-04', '2024-08', '2025-02', '2025-08', '2026-02', '2026-08'], [38.5, 21.2, 15.8, 14.0, 12.5, 11.9]),
      },
    ],
    resources: [
      { id: 'R-1', type: '内镜', title: '胃镜（2024-03）', date: '2024-03-10', size: '1.6 GB', format: 'DICOM', status: '已对齐' },
      { id: 'R-2', type: 'CT', title: 'PET-CT（2024-03）', date: '2024-03-22', size: '120 MB', format: 'DICOM', status: '已对齐' },
      { id: 'R-3', type: '病理切片', title: '肝穿刺活检（2024-03）', date: '2024-03-18', size: '0.8 GB', format: 'SVS', status: '已对齐' },
    ],
    audits: [
      { id: 'A-3', time: '2026-08-19 09:40', actor: '李医生', org: '江城人民医院', action: '查看完整档案', scope: '全部字段（full 级）', channel: '院内可信终端', result: '通过' },
      { id: 'A-2', time: '2026-05-11 10:30', actor: '数据专员', org: '国家癌症中心', action: '申请跨机构授权', scope: '治疗记录（masked）', channel: '联邦网关', result: '脱敏下发' },
    ],
    timeline: [
      { id: 'L-1', date: '2024-03-01', kind: '就诊节点', title: '外院首诊', desc: '进食哽噎加重，外院 CT 报食管下段占位并肝占位，转入本院', org: '江城人民医院' },
      { id: 'L-2', date: '2024-03-10', kind: '检查', title: '胃镜 + EUS', desc: '食管下段 4cm 溃疡性肿物，EUS 侵犯全层（T2），区域淋巴结多发', org: '江城人民医院' },
      { id: 'L-3', date: '2024-03-18', kind: '诊断分期', title: '活检病理 · cT2N2M1 IVB', desc: '小细胞癌，肝穿刺见转移，分期 IVB（广泛期）', org: '江城人民医院' },
      { id: 'L-4', date: '2024-03-22', kind: '检查', title: 'PET-CT', desc: '肝右叶 2 处高代谢灶，确认远处转移，无腹膜种植', org: '国家癌症中心' },
      { id: 'L-5', date: '2024-03-28', kind: '治疗决策', title: 'MDT 分期评估', desc: '广泛期小细胞食管癌，行系统性化疗 + 免疫，非手术', org: '江城人民医院' },
      { id: 'L-6', date: '2024-04-05', kind: '治疗', title: 'EP 方案化疗', desc: '依托泊苷+顺铂 4 周期，疗效 PR', org: '江城人民医院' },
      { id: 'L-7', date: '2024-09-01', kind: '治疗', title: '卡瑞利珠单抗维持（进行中）', desc: '免疫维持治疗，状态 SD', org: '江城人民医院' },
      { id: 'L-8', date: '2026-08-19', kind: '随访', title: '住院复查', desc: '肝转移灶稳定，继续维持，下次 2026-11-19', org: '江城人民医院' },
    ],
  },

  // ===== P-0005 早期颈段鳞癌 I：内镜 ESD，已结案 =====
  'P-0005': {
    id: 'P-0005',
    code: 'EC-2024-000508',
    name: '陈建国',
    gender: '男',
    age: 70,
    idNo: '110108195403220055',
    phone: '13601009988',
    address: '北京市海淀区中关村南大街 5 号',
    level: 'summary',
    status: '已结案',
    diagnosis: '食管鳞状细胞癌（颈段）',
    stage: 'pT1aN0M0 · I',
    org: '国家癌症中心',
    joinedAt: '2024-01-10',
    updatedAt: '2026-08-15',
    primaryId: 'EC-2024-000508',
    localIds: [
      { org: '国家癌症中心', id: 'NCC-2024-00177' },
      { org: '华东肿瘤医院', id: 'HD-2024-01883' },
    ],
    diagnoses: [
      { id: 'D-1', date: '2024-02-02', type: '病理诊断', histology: '食管鳞状细胞癌', differentiation: '高分化', site: '颈段', t: 'T1a', n: 'N0', m: 'M0', stage: 'I', basis: 'ESD 标本病理', org: '国家癌症中心' },
    ],
    treatments: [
      { id: 'T-1', line: '内镜治疗', modality: '手术', name: 'ESD 整块切除', scheme: '内镜下黏膜下剥离', cycles: '—', startDate: '2024-02-20', endDate: '2024-02-20', efficacy: 'CR', status: '已完成', org: '国家癌症中心' },
    ],
    followUps: [
      { id: 'F-6', date: '2026-06-15', modality: '门诊', outcome: '无病生存', summary: '规律随访 2 年无复发，转社区随访', nextDate: '2027-06-15', org: '国家癌症中心' },
      { id: 'F-5', date: '2025-12-20', modality: '门诊', outcome: '无病生存', summary: '内镜复查阴性', nextDate: '2026-06-15', org: '国家癌症中心' },
    ],
    labs: [],
    resources: [
      { id: 'R-1', type: '内镜', title: '胃镜白光 + NBI（2024-01）', date: '2024-01-26', size: '1.8 GB', format: 'DICOM', status: '已对齐' },
      { id: 'R-2', type: '病理切片', title: 'ESD 全片（2024-02）', date: '2024-02-22', size: '1.2 GB', format: 'SVS', status: '已对齐' },
    ],
    audits: [
      { id: 'A-2', time: '2026-06-15 10:00', actor: '随访护士', org: '国家癌症中心', action: '转入常规随访', scope: '随访模块', channel: '院内可信终端', result: '通过' },
      { id: 'A-1', time: '2024-01-10 09:00', actor: '档案管理员', org: '国家癌症中心', action: '患者主索引建档', scope: '基本信息', channel: '院内可信终端', result: '通过' },
    ],
    timeline: [
      { id: 'L-1', date: '2024-01-15', kind: '就诊节点', title: '本院初诊', desc: '声音嘶哑伴吞咽不适 1 月，门诊喉镜发现颈段病变', org: '国家癌症中心' },
      { id: 'L-2', date: '2024-01-26', kind: '检查', title: '喉镜 + 胃镜', desc: '颈段食管黏膜病变，EUS 局限于黏膜层', org: '国家癌症中心' },
      { id: 'L-3', date: '2024-02-02', kind: '诊断分期', title: '活检病理 · cT1aN0M0 I', desc: '高分化鳞癌 IA 期，无淋巴结转移征象', org: '国家癌症中心' },
      { id: 'L-4', date: '2024-02-20', kind: '治疗', title: 'ESD 整块切除', desc: '颈段病灶内镜下切除，切缘阴性', org: '国家癌症中心' },
      { id: 'L-5', date: '2024-02-26', kind: '诊断分期', title: '术后病理 · pT1aN0M0', desc: '切缘及基底阴性，淋巴结未清扫', org: '国家癌症中心' },
      { id: 'L-6', date: '2026-06-15', kind: '随访', title: '末次随访 · 转社区', desc: '随访 2 年无病生存，转社区常规随访', org: '国家癌症中心' },
    ],
  },

  // ===== P-0006 胸中段鳞癌 IIIA：新辅助放化疗 → 手术 → 随访（局部进展路径） =====
  'P-0006': {
    id: 'P-0006',
    code: 'EC-2024-000623',
    name: '赵春梅',
    gender: '女',
    age: 63,
    idNo: '370102196307080066',
    phone: '13905318888',
    address: '山东省济南市历下区解放路 12 号',
    level: 'masked',
    status: '随访中',
    diagnosis: '食管鳞状细胞癌（胸中段）',
    stage: 'pT3N1M0 · IIIA',
    org: '北方肿瘤',
    joinedAt: '2024-05-18',
    updatedAt: '2026-08-21',
    primaryId: 'EC-2024-000623',
    localIds: [
      { org: '北方肿瘤', id: 'BF-2024-00621' },
      { org: '华南省疾控', id: 'GD-2024-01552' },
    ],
    diagnoses: [
      { id: 'D-1', date: '2024-06-01', type: '病理诊断', histology: '食管鳞状细胞癌', differentiation: '中分化', site: '胸中段', t: 'T3', n: 'N1', m: 'M0', stage: 'IIIA', basis: '胃镜活检 + 增强 CT', org: '北方肿瘤' },
      { id: 'D-2', date: '2024-09-20', type: '分期诊断', histology: '食管鳞状细胞癌', differentiation: '中分化', site: '胸中段', t: 'ypT3', n: 'N1', m: 'M0', stage: 'IIIA', basis: '术后病理', org: '北方肿瘤' },
    ],
    treatments: [
      { id: 'T-1', line: '新辅助治疗', modality: '放疗', name: '新辅助放化疗', scheme: '放疗 41.4Gy + 同期 TP 化疗', cycles: '2 周期', startDate: '2024-06-25', endDate: '2024-08-10', efficacy: 'PR', status: '已完成', org: '北方肿瘤' },
      { id: 'T-2', line: '手术治疗', modality: '手术', name: '食管癌根治术', scheme: '左胸入路', cycles: '—', startDate: '2024-09-12', endDate: '2024-09-19', efficacy: 'CR', status: '已完成', org: '北方肿瘤' },
    ],
    followUps: [
      { id: 'F-3', date: '2026-08-21', modality: '门诊', outcome: '无病生存', summary: '复查 CT 未见复发，进食可', nextDate: '2026-11-21', org: '北方肿瘤' },
      { id: 'F-2', date: '2026-03-10', modality: '电话', outcome: '无病生存', summary: '体重稳定', nextDate: '2026-06-10', org: '北方肿瘤' },
    ],
    labs: [
      {
        key: 'scc', name: '鳞状细胞癌抗原 SCC', unit: 'ng/mL', refLower: 0, refUpper: 1.5,
        points: ctzPoint(['2024-06', '2024-09', '2025-03', '2025-09', '2026-03', '2026-08'], [12.8, 4.2, 1.9, 1.2, 0.9, 0.8]),
      },
    ],
    resources: [
      { id: 'R-1', type: '内镜', title: '胃镜（2024-05）', date: '2024-05-22', size: '1.7 GB', format: 'DICOM', status: '已对齐' },
      { id: 'R-2', type: 'CT', title: '胸部增强 CT（2024-06）', date: '2024-06-08', size: '62 MB', format: 'DICOM', status: '已对齐' },
      { id: 'R-3', type: '病理切片', title: '术后病理（2024-09）', date: '2024-09-20', size: '1.5 GB', format: 'SVS', status: '已对齐' },
    ],
    audits: [
      { id: 'A-2', time: '2026-08-21 08:50', actor: '王医生', org: '北方肿瘤', action: '查看摘要档案', scope: '摘要级（masked）', channel: '院内可信终端', result: '脱敏下发' },
      { id: 'A-1', time: '2024-05-18 14:20', actor: '档案管理员', org: '北方肿瘤', action: '患者主索引建档', scope: '基本信息', channel: '院内可信终端', result: '通过' },
    ],
    timeline: [
      { id: 'L-1', date: '2024-05-10', kind: '就诊节点', title: '外院首诊转入', desc: '吞咽困难 3 月，外院胃镜报胸中段占位，转入本院', org: '北方肿瘤' },
      { id: 'L-2', date: '2024-05-22', kind: '检查', title: '胃镜 + EUS', desc: '胸中段 5cm 环周肿物，EUS 侵犯肌层外膜（T3）', org: '北方肿瘤' },
      { id: 'L-3', date: '2024-06-01', kind: '诊断分期', title: '活检病理 · cT3N1M0 IIIA', desc: '中分化鳞癌，纵隔淋巴结 1 枚可疑', org: '北方肿瘤' },
      { id: 'L-4', date: '2024-06-08', kind: '检查', title: '胸部增强 CT + PET-CT', desc: '纵隔淋巴结 3 枚肿大，未见远处转移', org: '华南省疾控' },
      { id: 'L-5', date: '2024-06-15', kind: '治疗决策', title: 'MDT 新辅助放化疗', desc: '局部晚期，先行新辅助放化疗后评估手术', org: '北方肿瘤' },
      { id: 'L-6', date: '2024-06-25', kind: '治疗', title: '新辅助放化疗', desc: '放疗 41.4Gy 同期 TP 方案 2 周期，疗效 PR', org: '北方肿瘤' },
      { id: 'L-7', date: '2024-09-12', kind: '治疗', title: '食管癌根治术', desc: '左胸入路，R0 切除', org: '北方肿瘤' },
      { id: 'L-8', date: '2024-09-20', kind: '诊断分期', title: '术后病理 · ypT3N1M0', desc: '清扫淋巴结 2/24 阳性，R0，分期 IIIA', org: '北方肿瘤' },
      { id: 'L-9', date: '2026-08-21', kind: '随访', title: '门诊随访（第 8 次）', desc: '无病生存，下次随访 2026-11-21', org: '北方肿瘤' },
    ],
  },

  // ===== P-0007 食管胃结合部腺癌 IB：手术，随访 =====
  'P-0007': {
    id: 'P-0007',
    code: 'EC-2024-000734',
    name: '孙永强',
    gender: '男',
    age: 52,
    idNo: '310104197303150077',
    phone: '13901772233',
    address: '上海市徐汇区漕溪北路 99 号',
    level: 'full',
    status: '随访中',
    diagnosis: '食管胃结合部腺癌',
    stage: 'pT2N0M0 · IB',
    org: '华东肿瘤医院',
    joinedAt: '2024-04-08',
    updatedAt: '2026-08-17',
    primaryId: 'EC-2024-000734',
    localIds: [{ org: '华东肿瘤医院', id: 'HD-2024-01440' }],
    diagnoses: [
      { id: 'D-1', date: '2024-04-19', type: '病理诊断', histology: '腺鳞癌', differentiation: '中分化', site: '贲门', t: 'T2', n: 'N0', m: 'M0', stage: 'IB', basis: '术后病理', org: '华东肿瘤医院' },
    ],
    treatments: [
      { id: 'T-1', line: '手术治疗', modality: '手术', name: '腹腔镜贲门癌根治术', scheme: '经腹近端胃切除', cycles: '—', startDate: '2024-05-10', endDate: '2024-05-16', efficacy: 'CR', status: '已完成', org: '华东肿瘤医院' },
    ],
    followUps: [
      { id: 'F-4', date: '2026-08-17', modality: '门诊', outcome: '无病生存', summary: '术后恢复良好，进食无碍', nextDate: '2026-11-17', org: '华东肿瘤医院' },
      { id: 'F-3', date: '2026-02-20', modality: '电话', outcome: '无病生存', summary: '体重回升', nextDate: '2026-05-20', org: '华东肿瘤医院' },
    ],
    labs: [],
    resources: [
      { id: 'R-1', type: '内镜', title: '胃镜（2024-04）', date: '2024-04-12', size: '1.5 GB', format: 'DICOM', status: '已对齐' },
      { id: 'R-2', type: '病理切片', title: '手术标本病理（2024-05）', date: '2024-05-18', size: '1.3 GB', format: 'SVS', status: '已对齐' },
    ],
    audits: [
      { id: 'A-2', time: '2026-08-17 11:10', actor: '随访护士', org: '华东肿瘤医院', action: '录入随访记录', scope: '随访模块', channel: '院内可信终端', result: '通过' },
      { id: 'A-1', time: '2024-04-08 10:05', actor: '档案管理员', org: '华东肿瘤医院', action: '患者主索引建档', scope: '基本信息', channel: '院内可信终端', result: '通过' },
    ],
    timeline: [
      { id: 'L-1', date: '2024-04-02', kind: '就诊节点', title: '本院初诊', desc: '上腹隐痛伴反酸，胃镜检查发现贲门病变', org: '华东肿瘤医院' },
      { id: 'L-2', date: '2024-04-12', kind: '检查', title: '胃镜 + EUS', desc: '贲门小弯 2cm 隆起，EUS 黏膜下层，未及外膜', org: '华东肿瘤医院' },
      { id: 'L-3', date: '2024-04-19', kind: '诊断分期', title: '活检病理 · cT2N0M0 IB', desc: '腺鳞癌，未见区域淋巴结转移', org: '华东肿瘤医院' },
      { id: 'L-4', date: '2024-04-25', kind: '治疗决策', title: 'MDT 手术指征', desc: 'IB 期，推荐直接手术切除', org: '华东肿瘤医院' },
      { id: 'L-5', date: '2024-05-10', kind: '治疗', title: '腹腔镜贲门癌根治术', desc: '经腹近端胃切除，R0', org: '华东肿瘤医院' },
      { id: 'L-6', date: '2024-05-18', kind: '诊断分期', title: '术后病理 · pT2N0M0', desc: '切缘及淋巴结 0/16 阴性', org: '华东肿瘤医院' },
      { id: 'L-7', date: '2026-08-17', kind: '随访', title: '门诊随访（第 7 次）', desc: '无病生存，下次 2026-11-17', org: '华东肿瘤医院' },
    ],
  },

  // ===== P-0008 胸下段鳞癌 IIIB：新辅助 → 手术，失访 =====
  'P-0008': {
    id: 'P-0008',
    code: 'EC-2024-000842',
    name: '周淑芬',
    gender: '女',
    age: 67,
    idNo: '330106195812030099',
    phone: '13957106677',
    address: '浙江省杭州市西湖区文三路 56 号',
    level: 'summary',
    status: '失访',
    diagnosis: '食管鳞状细胞癌（胸下段）',
    stage: 'pT4N1M0 · IIIB',
    org: '浙江省肿瘤',
    joinedAt: '2024-02-05',
    updatedAt: '2026-07-28',
    primaryId: 'EC-2024-000842',
    localIds: [
      { org: '浙江省肿瘤', id: 'ZJ-2024-00335' },
      { org: '国家癌症中心', id: 'NCC-2024-01998' },
    ],
    diagnoses: [
      { id: 'D-1', date: '2024-02-27', type: '病理诊断', histology: '食管鳞状细胞癌', differentiation: '低分化', site: '胸下段', t: 'T4', n: 'N1', m: 'M0', stage: 'IIIB', basis: '胃镜活检 + PET-CT', org: '浙江省肿瘤' },
      { id: 'D-2', date: '2024-06-04', type: '分期诊断', histology: '食管鳞状细胞癌', differentiation: '低分化', site: '胸下段', t: 'ypT4a', n: 'N1', m: 'M0', stage: 'IIIB', basis: '术后病理', org: '浙江省肿瘤' },
    ],
    treatments: [
      { id: 'T-1', line: '新辅助治疗', modality: '化疗', name: '紫杉醇 + 顺铂', scheme: 'TP 方案', cycles: '2 周期', startDate: '2024-03-20', endDate: '2024-05-15', efficacy: 'PR', status: '已完成', org: '浙江省肿瘤' },
      { id: 'T-2', line: '手术治疗', modality: '手术', name: '食管癌根治术', scheme: '右胸腹两切口', cycles: '—', startDate: '2024-06-04', endDate: '2024-06-11', efficacy: 'CR', status: '已完成', org: '浙江省肿瘤' },
    ],
    followUps: [
      { id: 'F-2', date: '2025-07-28', modality: '门诊', outcome: '无病生存', summary: '末次随访无病生存，后转入随访失联', nextDate: '2025-10-28', org: '浙江省肿瘤' },
    ],
    labs: [],
    resources: [
      { id: 'R-1', type: '内镜', title: '胃镜（2024-02）', date: '2024-02-20', size: '1.6 GB', format: 'DICOM', status: '已对齐' },
      { id: 'R-2', type: 'CT', title: 'PET-CT（2024-03）', date: '2024-03-05', size: '118 MB', format: 'DICOM', status: '已对齐' },
      { id: 'R-3', type: '病理切片', title: '术后病理（2024-06）', date: '2024-06-04', size: '1.4 GB', format: 'SVS', status: '已对齐' },
    ],
    audits: [
      { id: 'A-2', time: '2025-07-28 09:30', actor: '随访护士', org: '浙江省肿瘤', action: '末次随访', scope: '随访模块', channel: '院内可信终端', result: '通过' },
      { id: 'A-1', time: '2024-02-05 13:40', actor: '档案管理员', org: '浙江省肿瘤', action: '患者主索引建档', scope: '基本信息', channel: '院内可信终端', result: '通过' },
    ],
    timeline: [
      { id: 'L-1', date: '2024-02-08', kind: '就诊节点', title: '外院首诊', desc: '吞咽困难进行性加重，外院胃镜报胸下段占位', org: '浙江省肿瘤' },
      { id: 'L-2', date: '2024-02-20', kind: '检查', title: '胃镜 + EUS', desc: '胸下段 6cm 肿物，EUS 侵犯邻近结构（T4）', org: '浙江省肿瘤' },
      { id: 'L-3', date: '2024-02-27', kind: '诊断分期', title: '活检病理 · cT4N1M0 IIIB', desc: '低分化鳞癌，PET-CT 暂无远处转移', org: '浙江省肿瘤' },
      { id: 'L-4', date: '2024-03-05', kind: '检查', title: 'PET-CT', desc: '纵隔淋巴结 2 枚高代谢，无远处转移', org: '国家癌症中心' },
      { id: 'L-5', date: '2024-03-12', kind: '治疗决策', title: 'MDT 局部晚期', desc: '先行新辅助化疗降期，再评估手术', org: '浙江省肿瘤' },
      { id: 'L-6', date: '2024-03-20', kind: '治疗', title: '新辅助化疗（TP）', desc: '紫杉醇+顺铂 2 周期，疗效 PR', org: '浙江省肿瘤' },
      { id: 'L-7', date: '2024-06-04', kind: '治疗', title: '食管癌根治术', desc: '右胸腹两切口，R0，术后病理 ypT4aN1M0', org: '浙江省肿瘤' },
      { id: 'L-8', date: '2025-07-28', kind: '随访', title: '末次随访 · 失访', desc: '本次无病生存，此后失联，下次安排 2025-10-28 未完成', org: '浙江省肿瘤' },
    ],
  },

  // ===== P-0009 早期胸上段鳞癌 IA：ESD，随访 =====
  'P-0009': {
    id: 'P-0009',
    code: 'EC-2024-000919',
    name: '吴志刚',
    gender: '男',
    age: 59,
    idNo: '430104196603220113',
    phone: '13973104567',
    address: '湖南省长沙市岳麓区麓山路 20 号',
    level: 'masked',
    status: '随访中',
    diagnosis: '食管鳞状细胞癌（胸上段）',
    stage: 'pT1bN0M0 · IA',
    org: '湘雅医院',
    joinedAt: '2024-03-02',
    updatedAt: '2026-08-16',
    primaryId: 'EC-2024-000919',
    localIds: [
      { org: '湘雅医院', id: 'XY-2024- 00761' },
      { org: '华南省疾控', id: 'GD-2024-01709' },
    ],
    diagnoses: [
      { id: 'D-1', date: '2024-03-23', type: '病理诊断', histology: '食管鳞状细胞癌', differentiation: '中分化', site: '胸上段', t: 'T1b', n: 'N0', m: 'M0', stage: 'IA', basis: 'ESD 标本病理', org: '湘雅医院' },
    ],
    treatments: [
      { id: 'T-1', line: '内镜治疗', modality: '手术', name: 'ESD 整块切除', scheme: '内镜下黏膜下剥离', cycles: '—', startDate: '2024-04-12', endDate: '2024-04-12', efficacy: 'CR', status: `已完成`, org: '湘雅医院' },
    ],
    followUps: [
      { id: 'F-5', date: '2026-08-16', modality: '门诊', outcome: '无病生存', summary: '复查内镜阴性', nextDate: '2026-11-16', org: '湘雅医院' },
      { id: 'F-4', date: '2026-01-15', modality: '电话', outcome: '无病生存', summary: '一般状况好', nextDate: '2026-04-15', org: '湘雅医院' },
    ],
    labs: [],
    resources: [
      { id: 'R-1', type: '内镜', title: '胃镜 + NBI（2024-03）', date: '2024-03-16', size: '2.0 GB', format: 'DICOM', status: '已对齐' },
      { id: 'R-2', type: '病理切片', title: 'ESD 全片（2024-04）', date: '2024-04-18', size: '1.6 GB', format: 'SVS', status: '已对齐' },
    ],
    audits: [
      { id: 'A-2', time: '2026-08-16 14:30', actor: '随访护士', org: '湘雅医院', action: '录入随访记录', scope: '随访模块', channel: '院内可信终端', result: '通过' },
      { id: 'A-1', time: '2024-03-02 10:20', actor: '档案管理员', org: '湘雅医院', action: '患者主索引建档', scope: '基本信息', channel: '院内可信终端', result: '通过' },
    ],
    timeline: [
      { id: 'L-1', date: '2024-03-05', kind: '就诊节点', title: '体检内镜发现', desc: '体检胃镜发现胸上段病变，无明显症状', org: '湘雅医院' },
      { id: 'L-2', date: '2024-03-16', kind: '检查', title: '胃镜 + NBI 放大', desc: '胸上段 1.5cm，EUS 黏膜下层，边界清', org: '湘雅医院' },
      { id: 'L-3', date: '2024-03-23', kind: '诊断分期', title: '活检病理 · cT1bN0M0 IA', desc: '中分化鳞癌，无淋巴结转移征象', org: '湘雅医院' },
      { id: 'L-4', date: '2024-04-12', kind: '治疗', title: 'ESD 整块切除', desc: '内镜下切除，切缘阴性', org: '湘雅医院' },
      { id: 'L-5', date: '2024-04-18', kind: '诊断分期', title: '术后病理 · pT1bN0M0', desc: '基底及侧切缘阴性', org: '湘雅医院' },
      { id: 'L-6', date: '2026-08-16', kind: '随访', title: '门诊随访（第 10 次）', desc: '无病生存，下次 2026-11-16', org: '湘雅医院' },
    ],
  },

  // ===== P-0010 食管腺癌 IIB：新辅助 → 手术 → 辅助化疗（治疗中） =====
  'P-0010': {
    id: 'P-0010',
    code: 'EC-2024-001033',
    name: '郑丽娟',
    gender: '女',
    age: 49,
    idNo: '510107197705090088',
    phone: '13908005544',
    address: '四川省成都市武侯区人民南路 8 号',
    level: 'masked',
    status: '治疗中',
    diagnosis: '食管腺癌（胸中段）',
    stage: 'pT2N1M0 · IIB',
    org: '华西医院',
    joinedAt: '2024-06-01',
    updatedAt: '2026-08-23',
    primaryId: 'EC-2024-001033',
    localIds: [{ org: '华西医院', id: 'XH-2024-01005' }],
    diagnoses: [
      { id: 'D-1', date: '2024-06-19', type: '病理诊断', histology: '食管腺癌', differentiation: '黏液腺癌', site: '胸中段', t: 'T2', n: 'N1', m: 'M0', stage: 'IIB', basis: '胃镜活检 + 增强 CT', org: '华西医院' },
      { id: 'D-2', date: '2024-09-23', type: '分期诊断', histology: '食管腺癌', differentiation: '黏液腺癌', site: '胸中段', t: 'ypT2', n: 'N1', m: 'M0', stage: 'IIB', basis: '术后病理', org: '华西医院' },
    ],
    treatments: [
      { id: 'T-1', line: '新辅助治疗', modality: '化疗', name: 'SOX 方案', scheme: '奥沙利铂 + 替吉奥', cycles: '2 周期', startDate: '2024-07-10', endDate: '2024-08-25', efficacy: 'PR', status: '已完成', org: '华西医院' },
      { id: 'T-2', line: '手术治疗', modality: '手术', name: '胸腹腔镜食管癌根治术', scheme: 'McKeown', cycles: '—', startDate: '2024-09-15', endDate: '2024-09-22', efficacy: 'CR', status: '已完成', org: '华西医院' },
      { id: 'T-3', line: '辅助治疗', modality: '化疗', name: '卡培他滨', scheme: '单药辅助', cycles: '6 周期', startDate: '2025-10-10', endDate: '—', efficacy: '—', status: '进行中', org: '华西医院' },
    ],
    followUps: [
      { id: 'F-3', date: '2026-08-23', modality: '门诊', outcome: '无病生存', summary: '辅助治疗中，耐受可', nextDate: '2026-11-23', org: '华西医院' },
    ],
    labs: [
      {
        key: 'cea', name: '癌胚抗原 CEA', unit: 'ng/mL', refLower: 0, refUpper: 5,
        points: ctzPoint(['2024-07', '2024-09', '2025-03', '2025-10', '2026-08'], [11.2, 4.8, 3.2, 2.6, 2.1]),
      },
    ],
    resources: [
      { id: 'R-1', type: '内镜', title: '胃镜（2024-06）', date: '2024-06-12', size: '1.6 GB', format: 'DICOM', status: '已对齐' },
      { id: 'R-2', type: 'CT', title: '胸部增强 CT（2024-06）', date: '2024-06-25', size: '60 MB', format: 'DICOM', status: '已对齐' },
      { id: 'R-3', type: '病理切片', title: '术后病理（2024-09）', date: '2024-09-23', size: '1.5 GB', format: 'SVS', status: '已对齐' },
    ],
    audits: [
      { id: 'A-2', time: '2026-08-23 15:20', actor: '赵医生', org: '华西医院', action: '查看摘要档案', scope: '摘要级（masked）', channel: '院内可信终端', result: '脱敏下发' },
      { id: 'A-1', time: '2024-06-01 11:00', actor: '档案管理员', org: '华西医院', action: '患者主索引建档', scope: '基本信息', channel: '院内可信终端', result: '通过' },
    ],
    timeline: [
      { id: 'L-1', date: '2024-06-01', kind: '就诊节点', title: '本院初诊', desc: '吞咽梗阻 3 月，门诊就诊', org: '华西医院' },
      { id: 'L-2', date: '2024-06-12', kind: '检查', title: '胃镜 + EUS', desc: '胸中段 3cm，EUS 黏膜下侵犯，区域淋巴结 1 枚', org: '华西医院' },
      { id: 'L-3', date: '2024-06-19', kind: '诊断分期', title: '活检病理 · cT2N1M0 IIB', desc: '黏液腺癌，依据胃镜活检 + 增强 CT', org: '华西医院' },
      { id: 'L-4', date: '2024-06-25', kind: '检查', title: '增强 CT', desc: '纵隔 1 枚淋巴结可疑，未见远处转移', org: '华西医院' },
      { id: 'L-5', date: '2024-07-02', kind: '治疗决策', title: 'MDT 新辅助后手术', desc: 'IIB 期，推荐新辅助化疗后手术', org: '华西医院' },
      { id: 'L-6', date: '2024-07-10', kind: '治疗', title: '新辅助化疗（SOX）', desc: '奥沙利铂+替吉奥 2 周期，疗效 PR', org: '华西医院' },
      { id: 'L-7', date: '2024-09-15', kind: '治疗', title: '胸腹腔镜食管癌根治术', desc: 'McKeown，R0', org: '华西医院' },
      { id: 'L-8', date: '2024-09-23', kind: '诊断分期', title: '术后病理 · ypT2N1M0', desc: '淋巴结 1/20 阳性，R0，分期 IIB', org: '华西医院' },
      { id: 'L-9', date: '2025-10-10', kind: '治疗', title: '辅助化疗（卡培他滨）进行中', desc: '单药辅助 6 周期，进行中', org: '华西医院' },
      { id: 'L-10', date: '2026-08-23', kind: '随访', title: '门诊随访', desc: '辅助治疗中耐受可，下次 202 6-11-23', org: '华西医院' },
    ],
  },

  // ===== P-0011 早期胸下段鳞癌 I：ESD，随访 =====
  'P-0011': {
    id: 'P-0011',
    code: 'EC-2024-001137',
    name: '冯国庆',
    gender: '男',
    age: 64,
    idNo: '440605196203160121',
    phone: '13928236699',
    address: '广东省佛山市禅城区祖庙路 33 号',
    level: 'full',
    status: '随访中',
    diagnosis: '食管鳞状细胞癌（胸下段）',
    stage: 'pT1aN0M0 · I',
    org: '华南省疾控',
    joinedAt: '2024-02-15',
    updatedAt: '2026-08-14',
    primaryId: 'EC-2024-001137',
    localIds: [{ org: '华南省疾控', id: 'GD-2024-00418' }],
    diagnoses: [
      { id: 'D-1', date: '2024-03-06', type: '病理诊断', histology: '食管鳞状细胞癌', differentiation: '高分化', site: '胸下段', t: 'T1a', n: 'N0', m: 'M0', stage: 'I', basis: 'ESD 标本病理', org: '华南省疾控' },
    ],
    treatments: [
      { id: 'T-1', line: '内镜治疗', modality: '手术', name: 'ESD 整块切除', scheme: '内镜下黏膜下剥离', cycles: '—', startDate: '2024-03-20', endDate: '2024-03-20', efficacy: 'CR', status: '已完成', org: '华南省疾控' },
    ],
    followUps: [
      { id: 'F-6', date: '2026-08-14', modality: '门诊', outcome: '无病生存', summary: '复查内镜阴性', nextDate: '2026-11-14', org: '华南省疾控' },
      { id:  'F-5', date: '2026-01-12', modality: '电话', outcome: '无病生存', summary: '进食正常', nextDate: '2026-04-12', org: '华南省疾控' },
    ],
    labs: [],
    resources: [
      { id: 'R-1', type: '内镜', title: '胃镜（2024-02）', date: '2024-02-28', size: '1.7 GB', format: 'DICOM', status: '已对齐' },
      { id: 'R-2', type: '病理切片', title: 'ESD 全片（2024-03）', date: '2024-03-26', size: '1.2 GB', format: 'SVS', status: '已对齐' },
    ],
    audits: [
      { id: 'A-2', time: '2026-08-14 09:20', actor: '随访护士', org: '华南省疾控', action: '录入随访记录', scope: '随访模块', channel: '院内可信终端', result: '通过' },
      { id: 'A-1', time: '2024-02-15 08:30', actor: '档案管理员', org: '华南省疾控', action: '患者主索引建档', scope: '基本信息', channel: '院内可信终端', result: '通过' },
    ],
    timeline: [
      { id: 'L-1', date: '2024-02-18', kind: '就诊节点', title: '进食异物感就诊', desc: '胃镜发现胸下段病变', org: '华南省疾控' },
      { id: 'L-2', date: '2024-02-28', kind: '检查', title: '胃镜 + EUS', desc: '胸下段 1.2cm，EUS 黏膜内（T1a）', org: '华南省疾控' },
      { id: 'L-3', date: '2024-03-06', kind: '诊断分期', title: '活检病理 · cT1aN0M0 I', desc: '高分化鳞癌，无淋巴结转移', org: '华南省疾控' },
      { id: 'L-4', date: '2024-03-20', kind: '治疗', title: 'ESD 整块切除', desc: '内镜下切除，切缘阴性', org: '华南省疾控' },
      { id: 'L-5', date: '2024-03-26', kind: '诊断分期', title: '术后病理 · pT1aN0M0', desc: '基底及侧切缘阴性', org: '华南省疾控' },
      { id: 'L-6', date: '2026-08-14', kind: '随访', title: '门诊随访（第 13 次）', desc: '无病生存，下次 2026-11-14', org: '华南省疾控' },
    ],
  },

  // ===== P-0012 胸中段鳞癌 IIIA：新辅助放化疗 → 手术 → 辅助化疗（治疗中） =====
  'P-0012': {
    id: 'P-0012',
    code: 'EC-2024-001221',
    name: '何秀兰',
    gender: '女',
    age: 57,
    idNo: '370202196808120066',
    phone: '13953208877',
    address: '山东省青岛市市南区香港中路 18 号',
    level: 'summary',
    status: '治疗中',
    diagnosis: '食管鳞状细胞癌（胸中段）',
    stage: 'pT2N2M0 · IIIA',
    org: '江城人民医院',
    joinedAt: '2024-04-08',
    updatedAt: '2026-08-24',
    primaryId: 'EC-2024-001221',
    localIds: [
      { org: '江城人民医院', id: 'JC-2024-01184' },
      { org: '国家癌症中心', id: 'NCC-2024-02430' },
    ],
    diagnoses: [
      { id: 'D-1', date: '2024-04-29', type: '病理诊断', histology: '食管鳞状细胞癌', differentiation: '中分化', site: '胸中段', t: 'T2', n: 'N2', m: 'M0', stage: 'IIIA', basis: '胃镜活检 + 增强 CT', org: '江城人民医院' },
      { id: 'D-2', date: '2024-08-09', type: '分期诊断', histology: '食管鳞状细胞癌', differentiation: '中分化', site: '胸中段', t: 'ypT2', n: 'N2', m: 'M0', stage: 'IIIA', basis: '术后病理', org: '江城人民医院' },
    ],
    treatments: [
      { id: 'T-1', line: '新辅助治疗', modality: '放疗', name: '新辅助放化疗', scheme: 'TP + IMRT', cycles: '2 周期', startDate: '2024-05-20', endDate: '2024-07-08', efficacy: 'PR', status: '已完成', org: '江城人民医院' },
      { id: 'T-2', line: '手术治疗', modality: '手术', name: '食管癌根治术', scheme: 'McKeown', cycles: '—', startDate: '2024-08-01', endDate: '2024-08-08', efficacy: 'CR', status: '已完成', org: '江城人民医院' },
      { id: 'T-3', line: '辅助治疗', modality: '化疗', name: '卡培他滨', scheme: '单药辅助', cycles: '6 周期', startDate: '2025-09-15', endDate: '—', efficacy: '—', status: '进行中', org: '江城人民医院' },
    ],
    followUps: [
      { id: 'F-4', date: '2026-08-24', modality: '门诊', outcome: '无病生存', summary: '辅助化疗中，耐受可', nextDate: '2026-11-24', org: '江城人民医院' },
    ],
    labs: [
      {
        key: 'scc', name: '鳞状细胞癌抗原 SCC', unit: 'ng/mL', refLower: 0, refUpper: 1.5,
        points: ctzPoint(['2024-05', '2024-08', '2025-02', '2025-09', '2026-08'], [10.5, 3.8, 2.0, 1.4, 0.9]),
      },
    ],
    resources: [
      { id: 'R-1', type: '内镜', title: '胃镜（2024-04）', date: '2024-04-22', size: '1.7 GB', format: 'DICOM', status: '已对齐' },
      { id: 'R-2', type: 'CT', title: '胸部增强 CT（2024-05）', date: '2024-05-05', size: '64 MB', format: 'DICOM', status: '已对齐' },
      { id: 'R-3', type: '病理切片', title: '术后病理（2024-08）', date: '2024-08-09', size: '1.5 GB', format: 'SVS', status: '已对齐' },
    ],
    audits: [
      { id: 'A-2', time: '2026-08-24 16:10', actor: '孙医生', org: '江城人民医院', action: '查看摘要档案', scope: '摘要级（masked）', channel: '院内可信终端', result: '脱敏下发' },
      { id: 'A-1', time: '2024-04-08 14:00', actor: '档案管理员', org: '江城人民医院', action: '患者主索引建档', scope: '基本信息', channel: '院内可信终端', result: '通过' },
    ],
    timeline: [
      { id: 'L-1', date: '2024-04-10', kind: '就诊节点', title: '外院首诊转入', desc: '吞咽梗阻，外院胃镜报胸中段占位，转入本院', org: '江城人民医院' },
      { id: 'L-2', date: '2024-04-22', kind: '检查', title: '胃镜 + EUS', desc: '胸中段 4cm 环周肿物，EUS 侵犯肌层（T2）', org: '江城人民医院' },
      { id: 'L-3', date: '2024-04-29', kind: '诊断分期', title: '活检病理 · cT2N2M0 IIIA', desc: '中分化鳞癌，淋巴结多发肿大', org: '江城人民医院' },
      { id: 'L-4', date: '2024-05-05', kind: '检查', title: '增强 CT + PET-CT', desc: '淋巴结多发，未见远处转移', org: '国家癌症中心' },
      { id: 'L-5', date: '2024-05-12', kind: '治疗决策', title: 'MDT 新辅助放化疗', desc: 'III A 期，新辅助放化疗降期后手术', org: '江城人民医院' },
      { id: 'L-6', date: '2024-05-20', kind: '治疗', title: '新辅助放化疗（TP+IMRT）', desc: '同期放化疗 2 周期，疗效 PR', org: '江城人民医院' },
      { id: 'L-7', date: '2024-08-01', kind: '治疗', title: '食管癌根治术', desc: 'McKeown，R0', org: '江城人民医院' },
      { id: 'L-8', date: '2024-08-09', kind: '诊断分期', title: '术后病理 · ypT2N2M0', desc: '淋巴结 4/22 阳性，R0，分期 IIIA', org: '江城人民医院' },
      { id: 'L-9', date: '2025-09-15', kind: '治疗', title: '辅助化疗（卡培他滨）进行中', desc: '单药辅助 6 周期，进行中', org: '江城人民医院' },
      { id: 'L-10', date: '2026-08-24', kind: '随访', title: '门诊随访', desc: '辅助化疗中耐受可，下次 2026-11-24', org: '江城人民医院' },
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
      { id: 'L-1', date: '', kind: '诊断分期', title: `临床诊断：${f.diagnosis}（${f.site}）`, desc: `${f.histology}`, org: f.org },
      { id: 'L-2', date: '', kind: '诊断分期', title: `临床分期 ${f.stage}`, desc: '分期信息由归属机构上报', org: f.org },
    ],
    visits: [],
  }
}

// ---------- 旅程事件 → 业务记录自动关联 ----------
// 为每条时间轴事件补齐 ref，使「点击旅程事件 → 进入对应页面 → 定位具体记录」成立。
// 规则：诊断分期→诊断记录；治疗/治疗决策→治疗记录；随访/复查/疗效评估/复发转移→随访记录；
// 检查→时间轴节点自身；就诊→概览临床摘要（固定 'clinical'）。
const FOLLOWUP_KINDS = ['随访', '复查', '疗效评估', '复发转移']
function enrichTimeline(p: Omit<PatientDetail, 'visits'>): Omit<PatientDetail, 'visits'> {
  const timeline = p.timeline.map((n) => {
    const node = { ...n }
    if (n.kind === '诊断分期') {
      const d = p.diagnoses.find((x) => x.date === n.date) ?? p.diagnoses[0]
      node.ref = d?.id
    } else if (n.kind === '治疗' || n.kind === '治疗决策') {
      const t =
        p.treatments.find((x) => n.title.includes(x.name.slice(0, 6))) ??
        p.treatments.find((x) => n.date >= x.startDate && (x.endDate === '—' || n.date <= x.endDate)) ??
        p.treatments[0]
      node.ref = t?.id
    } else if (FOLLOWUP_KINDS.includes(n.kind)) {
      const f = p.followUps.find((x) => x.date === n.date) ?? p.followUps[0]
      node.ref = f?.id
    } else if (n.kind === '检查') {
      node.ref = n.id
    }
    return node
  })
  return { ...p, timeline }
}

// ---------- 就诊（真实门诊 / 急诊）数据：独立于诊疗时间轴的跨机构就诊经历 ----------
// 仅记录患者真实发生的门诊 / 急诊行为，不含治疗过程、随访、检查、病理等诊疗细节；
// 这些诊疗细节由「诊疗时间轴 / 检查检验 / 病理与分子 / 治疗记录 / 随访预后」分别承载。
const patientVisits: Record<string, VisitRecord[]> = {
  'P-0001': [
    { id: 'V-1', date: '2024-02-20', org: '国家癌症中心', type: '门诊', dept: '胸外科', reason: '进行性吞咽困难 2 个月', diagnosis: '食管占位待查', disposition: '进一步检查' },
    { id: 'V-2', date: '2024-03-12', org: '江城人民医院', type: '门诊', dept: '肿瘤科', reason: '外院确诊后进一步治疗评估', diagnosis: '食管鳞状细胞癌', disposition: '拟进一步分期及治疗评估' },
  ],
  'P-0002': [
    { id: 'V-1', date: '2024-04-15', org: '华东肿瘤医院', type: '门诊', dept: '消化内科', reason: '进食哽噎 4 月，外院胃镜示贲门占位', diagnosis: '贲门占位待查', disposition: '转入肿瘤科进一步评估' },
  ],
  'P-0003': [
    { id: 'V-1', date: '2024-06-10', org: '华南省疾控', type: '门诊', dept: '消化内科', reason: '体检内镜发现胸上段黏膜病变，无自觉症状', diagnosis: '食管黏膜病变待查', disposition: '进一步活检及病理评估' },
  ],
  'P-0004': [
    { id: 'V-1', date: '2024-03-01', org: '江城人民医院', type: '门诊', dept: '消化内科', reason: '进食哽噎加重，外院 CT 报食管下段占位并肝占位', diagnosis: '食管下段占位伴肝占位待查', disposition: '收住院进一步诊治' },
  ],
  'P-0005': [
    { id: 'V-1', date: '2024-01-15', org: '国家癌症中心', type: '门诊', dept: '耳鼻喉科', reason: '声音嘶哑伴吞咽不适 1 月', diagnosis: '颈段食管病变待查', disposition: '进一步内镜及病理评估' },
  ],
  'P-0006': [
    { id: 'V-1', date: '2024-05-10', org: '北方肿瘤', type: '门诊', dept: '胸外科', reason: '吞咽困难 3 月，外院胃镜示胸中段占位', diagnosis: '胸中段食管占位待查', disposition: '转入肿瘤科进一步评估' },
  ],
  'P-0007': [
    { id: 'V-1', date: '2024-04-02', org: '华东肿瘤医院', type: '门诊', dept: '消化内科', reason: '上腹隐痛伴反酸，胃镜发现贲门病变', diagnosis: '贲门病变待查', disposition: '进一步评估' },
  ],
  'P-0008': [
    { id: 'V-1', date: '2024-02-08', org: '浙江省肿瘤', type: '门诊', dept: '胸外科', reason: '吞咽困难进行性加重，外院胃镜示胸下段占位', diagnosis: '胸下段食管占位待查', disposition: '收住院进一步评估' },
  ],
  'P-0009': [
    { id: 'V-1', date: '2024-03-05', org: '湘雅医院', type: '门诊', dept: '消化内科', reason: '体检内镜发现胸上段病变，无明显症状', diagnosis: '食管黏膜病变待查', disposition: '进一步活检评估' },
  ],
  'P-0010': [
    { id: 'V-1', date: '2024-06-01', org: '华西医院', type: '门诊', dept: '胸外科', reason: '吞咽梗阻 3 月', diagnosis: '胸中段食管占位待查', disposition: '进一步评估' },
  ],
  'P-0011': [
    { id: 'V-1', date: '2024-02-18', org: '华南省疾控', type: '门诊', dept: '消化内科', reason: '进食异物感，胃镜发现胸下段病变', diagnosis: '胸下段食管病变待查', disposition: '进一步评估' },
  ],
  'P-0012': [
    { id: 'V-1', date: '2024-04-10', org: '江城人民医院', type: '门诊', dept: '胸外科', reason: '吞咽梗阻，外院胃镜示胸中段占位', diagnosis: '胸中段食管占位待查', disposition: '转入肿瘤科进一步评估' },
  ],
}

// 将真实就诊（门诊 / 急诊）映射为时间轴的「就诊节点」，使左侧「诊疗时间轴（就诊筛选）」
// 与右侧「就诊概览」同源、同量，消除同一患者前后数据不一致。
function visitToNode(vis: VisitRecord): TimelineNode {
  return {
    id: vis.id,
    date: vis.date,
    kind: '就诊节点',
    title: `${vis.type} · ${vis.dept}`,
    desc: vis.reason,
    org: vis.org,
  }
}

export const patientDetails: Record<string, PatientDetail> = Object.fromEntries(
  Object.entries(_patientDetailsRaw).map(([k, v]) => {
    const enriched = enrichTimeline(v)
    const visits = patientVisits[k] ?? []
    // 时间轴的就诊节点统一由真实就诊生成：先移除旧手写就诊节点（首诊/入院标记），
    // 再注入真实就诊记录，保证与「就诊概览」同源同量；其余事件级节点按真实日期并入。
    const timeline = [
      ...enriched.timeline.filter((n) => n.kind !== '就诊节点'),
      ...visits.map(visitToNode),
    ].sort((a, b) => a.date.localeCompare(b.date))
    return [k, { ...enriched, timeline, visits }]
  }),
)
