// ============================================================
// 患者主档案 Mock 数据层 —— 后端就绪后可整体替换为真实 API 调用
// 数据不出域策略：敏感字段一律脱敏/遮蔽，可见级别决定展示口径
// ============================================================

// ---------- 数据可见级别 ----------
// full    完全可见（本机构内，可信节点授权）
// masked  脱敏可见（跨机构协作，仅可见脱敏后的诊疗信息）
// summary 摘要可见（其他联盟，仅可见聚合摘要）
export type DataLevel = 'full' | 'masked' | 'summary'

export type FollowStatus = '随访中' | '治疗中' | '评估中' | '失访' | '已结案'

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
  // 临床特征优先参考《样例数据(4)》十例病例；机构、PMI、权限等为平台演示层信息。
  { id: 'P-0001', code: 'EC-2026-000128', name: '王晓明', gender: '男', age: 61, diagnosis: '食管鳞状细胞癌', histology: '中-低分化鳞癌（化疗后）', site: '胸中下段', stage: 'cT2N1M0 → ypT2N0', org: '国家癌症中心', level: 'full', status: '随访中', updatedAt: '2026-08-27', followUps: 1, resources: 4,
    primaryId: 'PMI-EC-000128', localIds: [{ org: '江城人民医院', id: 'JC-2026-0514' }, { org: '国家癌症中心', id: 'NCC-2026-0831' }] },
  { id: 'P-0002', code: 'EC-2026-000217', name: '陈建国', gender: '男', age: 55, diagnosis: '食管鳞状细胞癌', histology: '中-低分化鳞癌', site: '胸中段', stage: 'pT1bN0M0', org: '国家癌症中心', level: 'masked', status: '随访中', updatedAt: '2026-08-18', followUps: 1, resources: 5,
    primaryId: 'PMI-EC-000217', localIds: [{ org: '国家癌症中心', id: 'NCC-2026-0217' }] },
  { id: 'P-0003', code: 'EC-2026-000309', name: '李国强', gender: '男', age: 68, diagnosis: '食管鳞状细胞癌', histology: '新辅助后无癌残存（pCR）', site: '胸下段', stage: 'ypT0N0M0', org: '华东肿瘤医院', level: 'masked', status: '随访中', updatedAt: '2026-08-20', followUps: 1, resources: 6,
    primaryId: 'PMI-EC-000309', localIds: [{ org: '华东肿瘤医院', id: 'HD-2026-0309' }] },
  { id: 'P-0004', code: 'EC-2026-000421', name: '刘秀英', gender: '女', age: 69, diagnosis: '早期食管鳞状细胞癌', histology: 'HGIN + 小灶浸润中分化鳞癌', site: '胸中下段', stage: 'pT1aN0M0', org: '国家癌症中心', level: 'full', status: '随访中', updatedAt: '2026-08-26', followUps: 1, resources: 4,
    primaryId: 'PMI-EC-000421', localIds: [{ org: '解放军第五医学中心', id: 'PLA5-2026-0621' }, { org: '国家癌症中心', id: 'NCC-2026-0709' }] },
  { id: 'P-0005', code: 'EC-2026-000508', name: '周志远', gender: '男', age: 67, diagnosis: '食管原位癌', histology: 'HGIN + 少许 LGIN', site: '胸中段', stage: 'pTisN0M0', org: '国家癌症中心', level: 'summary', status: '随访中', updatedAt: '2026-08-17', followUps: 1, resources: 4,
    primaryId: 'PMI-EC-000508', localIds: [{ org: '中国中医科学院广安门医院', id: 'GAM-2026-0601' }, { org: '国家癌症中心', id: 'NCC-2026-0703' }] },
  { id: 'P-0006', code: 'EC-2026-000623', name: '张淑华', gender: '女', age: 73, diagnosis: '食管鳞状细胞癌', histology: '中分化鳞癌', site: '胸中段', stage: 'ypT1bN0M0', org: '北方肿瘤医院', level: 'masked', status: '随访中', updatedAt: '2026-08-21', followUps: 1, resources: 5,
    primaryId: 'PMI-EC-000623', localIds: [{ org: '北方肿瘤医院', id: 'BF-2026-0623' }] },
  { id: 'P-0007', code: 'EC-2026-000734', name: '赵成林', gender: '男', age: 63, diagnosis: '食管鳞状细胞癌', histology: '中分化鳞癌', site: '胸中段', stage: 'cT3~4N+M0', org: '江城人民医院', level: 'full', status: '评估中', updatedAt: '2026-08-24', followUps: 0, resources: 5,
    primaryId: 'PMI-EC-000734', localIds: [{ org: '江城人民医院', id: 'JC-2026-0734' }] },
  { id: 'P-0008', code: 'EC-2026-000842', name: '孙建军', gender: '男', age: 64, diagnosis: '食管鳞状细胞癌', histology: '中分化鳞癌', site: '胸中段', stage: 'cT?N+M0（疑）', org: '华东肿瘤医院', level: 'summary', status: '评估中', updatedAt: '2026-08-24', followUps: 0, resources: 4,
    primaryId: 'PMI-EC-000842', localIds: [{ org: '华东肿瘤医院', id: 'HD-2026-0842' }, { org: '国家癌症中心', id: 'NCC-2026-0842' }], duplicateFlag: true },
  { id: 'P-0009', code: 'EC-2026-000919', name: '吴德明', gender: '男', age: 67, diagnosis: '食管基底细胞样鳞状细胞癌', histology: '基底细胞样鳞状细胞癌', site: '胸中段', stage: '局部进展期', org: '国家癌症中心', level: 'masked', status: '评估中', updatedAt: '2026-08-24', followUps: 0, resources: 5,
    primaryId: 'PMI-EC-000919', localIds: [{ org: '外院协作节点', id: 'EXT-2026-0729' }, { org: '国家癌症中心', id: 'NCC-2026-0804' }] },
  { id: 'P-0010', code: 'EC-2026-001033', name: '郑国庆', gender: '男', age: 78, diagnosis: '同时性双发食管病变', histology: 'LGIN + 中-低分化鳞癌', site: '胸上/中段', stage: '待评估', org: '国家癌症中心', level: 'masked', status: '评估中', updatedAt: '2026-08-25', followUps: 0, resources: 3,
    primaryId: 'PMI-EC-001033', localIds: [{ org: '外院协作节点', id: 'EXT-2026-0729' }, { org: '国家癌症中心', id: 'NCC-2026-0805' }], duplicateFlag: true },
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
  modality: '手术' | '内镜治疗' | '化疗' | '放疗' | '免疫治疗' | '靶向治疗'
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

// 就诊（真实门诊 / 住院 / 急诊行为）：患者跨医疗机构发生的真实就诊经历，与「诊疗时间轴（事件级）」职责区分。
// 仅承载一次真实医疗接触本身的信息（就诊类型 / 科室 / 原因 / 当次诊断 / 去向），不重复展开检查、病理、治疗细节。
export type VisitType = '门诊' | '住院' | '急诊'
export interface VisitRecord {
  id: string
  date: string
  org: string            // 医疗机构
  type: VisitType        // 门诊 / 住院 / 急诊
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
  type: '内镜' | 'CT' | 'MRI' | 'PET-CT' | '超声' | '病理切片' | '基因检测'
  title: string
  date: string
  size: string
  format: string
  status: '已对齐' | '待对齐' | '授权可见'
}

export interface MolecularResult {
  id: string
  date: string
  item: string
  result: string
  note: string
  org: string
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

// 患者旅程事件类别（事件级，与「就诊记录」真实门诊/住院/急诊就诊职责区分）：
// 就诊节点→由真实就诊（门诊/住院/急诊）生成，作为时间轴的就诊标记，可经「就诊」筛选；与右侧「就诊记录」同源同量；
// 检查→检查检验；诊断分期→诊断；
// 治疗决策/治疗→治疗记录；疗效评估/复查/随访/复发转移→疗效随访
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
  // 检查类事件：与既往检查相比的变化提示（如「病灶较前缩小」）
  compared?: string
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
  molecularTests: MolecularResult[]
  resources: ResourceItem[]
  audits: AuditLog[]
  timeline: TimelineNode[]
  visits: VisitRecord[]
}

// ---------- 详情数据（按 id 检索） ----------
const ctzPoint = (dates: string[], values: number[]): LabPoint[] => dates.map((date, i) => ({ date, value: values[i] }))

const _patientDetailsRaw: Record<string, Omit<PatientDetail, 'visits'>> = {
  // ===== P-0001：样例病例 8 原型——局部进展期，新辅助化疗后跨院手术 =====
  'P-0001': {
    id: 'P-0001',
    code: 'EC-2026-000128',
    name: '王晓明',
    gender: '男',
    age: 61,
    idNo: '420102196508120011',
    phone: '13871001122',
    address: '湖北省武汉市江岸区长江路 132 号',
    level: 'full',
    status: '随访中',
    diagnosis: '食管鳞状细胞癌（胸中下段）',
    stage: 'cT2N1M0 → ypT2N0',
    org: '国家癌症中心',
    joinedAt: '2026-07-30',
    updatedAt: '2026-08-27',
    primaryId: 'PMI-EC-000128',
    localIds: [
      { org: '江城人民医院', id: 'JC-2026-0514' },
      { org: '国家癌症中心', id: 'NCC-2026-0831' },
    ],
    diagnoses: [
      { id: 'D-1', date: '2026-07', type: '分期诊断', histology: '食管鳞状细胞癌', differentiation: '—', site: '胸中下段', t: 'cT2', n: 'N1', m: 'M0', stage: '局部进展期', basis: '外院 PET/CT + 增强 CT', org: '江城人民医院' },
      { id: 'D-2', date: '2026-05-14', type: '病理诊断', histology: '食管鳞状细胞癌', differentiation: '—', site: '距门齿 30~35cm', t: '—', n: '—', m: '—', stage: '—', basis: '外院上消化道内镜活检病理', org: '江城人民医院' },
      { id: 'D-3', date: '2026-08-10', type: '病理诊断', histology: '中-低分化食管鳞状细胞癌（化疗后）', differentiation: '中-低分化', site: '距门齿 30~35cm', t: 'ypT2', n: 'N0', m: 'M0', stage: '—', basis: '术后病理：R0，0/62 淋巴结，Mandard TRG 2级', org: '国家癌症中心' },
    ],
    treatments: [
      { id: 'T-1', line: '新辅助治疗', modality: '化疗', name: '新辅助化疗', scheme: '外院方案（原始样例未记录具体药物）', cycles: '2 周期', startDate: '2026-06-22', endDate: '2026-07-20', efficacy: '—', status: '已完成', org: '江城人民医院' },
      { id: 'T-2', line: '手术治疗', modality: '手术', name: '胸腹腔镜食管癌根治性切除', scheme: '部分食管部分胃切除 + 颈部淋巴结清扫 + 喉返神经解剖术', cycles: '—', startDate: '2026-08-03', endDate: '2026-08-03', efficacy: '—', status: '已完成', org: '国家癌症中心' },
    ],
    // 演示补全：样例记录至 2026-08-13 出院，增加一次近期术后门诊以支撑随访页面。
    followUps: [
      { id: 'F-1', date: '2026-08-27', modality: '门诊', outcome: '无病生存', summary: '术后恢复平稳，切口愈合可，进食逐步恢复；复核病理为 ypT2N0、R0，进入规律随访', nextDate: '2026-11-27', org: '国家癌症中心' },
    ],
    // 演示补全：样例未提供具体检验数值，仅用于展示“近期检验”的结构化能力。
    labs: [
      { key: 'hgb', name: '血红蛋白 HGB', unit: 'g/L', refLower: 130, refUpper: 175,
        points: ctzPoint(['2026-07-30', '2026-08-27'], [132, 128]) },
      { key: 'wbc', name: '白细胞计数 WBC', unit: '×10⁹/L', refLower: 3.5, refUpper: 9.5,
        points: ctzPoint(['2026-07-30', '2026-08-27'], [5.6, 6.1]) },
      { key: 'alt', name: '谷丙转氨酶 ALT', unit: 'U/L', refLower: 9, refUpper: 50,
        points: ctzPoint(['2026-07-30', '2026-08-27'], [23, 25]) },
      { key: 'alb', name: '白蛋白 ALB', unit: 'g/L', refLower: 40, refUpper: 55,
        points: ctzPoint(['2026-07-30', '2026-08-27'], [41, 40]) },
      { key: 'pt', name: '凝血酶原时间 PT', unit: 's', refLower: 11, refUpper: 14,
        points: ctzPoint(['2026-07-30', '2026-08-27'], [11.9, 12.1]) },
    ],
    // 演示补充：样例数据原始病例未记录分子检测。
    // 以下结果参考公开食管鳞癌分子检测案例，用于展示平台对分子数据和原始报告的承载能力。
    molecularTests: [
      { id: 'M-1', date: '2026-07-31', item: 'PD-L1', result: 'CPS 6', note: 'PD-L1 表达阳性，可作为免疫治疗相关参考', org: '国家癌症中心' },
      { id: 'M-2', date: '2026-07-31', item: 'MSI', result: 'MSS', note: '原发灶微卫星状态稳定', org: '国家癌症中心' },
      { id: 'M-3', date: '2026-07-31', item: 'NGS', result: '未发现明确可靶向变异', note: '543 个肿瘤相关基因 Panel 检测', org: '国家癌症中心' },
    ],
    resources: [
      { id: 'R-1', type: '内镜', title: '外院上消化道内镜图像', date: '2026-05-14', size: '148 MB', format: 'JPEG+MP4', status: '授权可见' },
      { id: 'R-2', type: 'CT', title: '术前增强 CT', date: '2026-07', size: '72 MB', format: 'DICOM', status: '已对齐' },
      { id: 'R-3', type: 'PET-CT', title: '外院 PET/CT 分期影像', date: '2026-07', size: '136 MB', format: 'DICOM', status: '授权可见' },
      { id: 'R-4', type: '病理切片', title: '术后病理数字切片与报告', date: '2026-08-10', size: '1.6 GB', format: 'SVS+PDF', status: '已对齐' },
      { id: 'R-5', type: '基因检测', title: '食管鳞癌分子检测报告（演示）', date: '2026-07-31', size: '2.1 MB', format: 'PDF', status: '授权可见' },
    ],
    audits: [
      { id: 'A-3', time: '2026-08-27 14:10', actor: '周医生', org: '国家癌症中心', action: '查看完整档案', scope: '本院完整字段 + 外院授权资料', channel: '院内可信终端', result: '通过' },
      { id: 'A-2', time: '2026-07-30 16:25', actor: '数据治理服务', org: '国家癌症中心', action: '跨机构主索引关联', scope: 'PMI 与外院本地患者号映射', channel: '可信数据空间', result: '通过' },
      { id: 'A-1', time: '2026-07-30 16:20', actor: '数据治理服务', org: '国家癌症中心', action: '归集外院影像与病理摘要', scope: '授权范围内诊疗资料', channel: '联邦网关', result: '脱敏下发' },
    ],
    timeline: [
      { id: 'L-1', date: '2026-05-14', kind: '检查', title: '外院上消化道内镜', desc: '距门齿 30~35cm 食管占位，表面糜烂，质脆易出血', org: '江城人民医院' },
      { id: 'L-2', date: '2026-05-14', kind: '诊断分期', title: '外院活检病理', desc: '食管鳞状细胞癌', org: '江城人民医院' },
      { id: 'L-3', date: '2026-06-22', kind: '治疗', title: '新辅助化疗启动', desc: '外院完成 2 个疗程新辅助化疗，原始样例未记录具体药物方案', org: '江城人民医院' },
      { id: 'L-4', date: '2026-07', kind: '检查', title: 'PET-CT', desc: '食管胸中下段局限性增厚伴代谢增高，纵隔 1 区小淋巴结轻度高代谢，提示 cT2N1M0', org: '江城人民医院' },
      { id: 'L-5', date: '2026-07', kind: '检查', title: '胸腹部增强 CT', desc: '食管胸下段局部管壁增厚约 1.34cm，右侧气管食管沟见小淋巴结；肝右叶囊肿，未见明确远处转移', org: '国家癌症中心' },
      { id: 'L-6', date: '2026-07-30', kind: '治疗决策', title: '术前综合评估', desc: '新辅助治疗后具备根治性手术条件，计划行胸腹腔镜食管癌根治性切除', org: '国家癌症中心' },
      { id: 'L-7', date: '2026-08-03', kind: '治疗', title: '胸腹腔镜食管癌根治性切除', desc: '部分食管部分胃切除 + 颈部淋巴结清扫 + 喉返神经解剖术，R0 切除', org: '国家癌症中心' },
      { id: 'L-8', date: '2026-08-10', kind: '诊断分期', title: '术后病理', desc: '中-低分化鳞状细胞癌（化疗后），浸润固有肌层 ypT2；0/62 淋巴结，R0，Mandard TRG 2级', org: '国家癌症中心' },
      { id: 'L-9', date: '2026-08-27', kind: '随访', title: '术后门诊随访', desc: '恢复平稳，复核术后病理并进入规律随访', org: '国家癌症中心', ref: 'F-1' },
    ],
  },

  // ===== P-0004：样例病例 9 原型——体检发现，早期病变 ESD 根治 =====
  'P-0004': {
    id: 'P-0004',
    code: 'EC-2026-000421',
    name: '刘秀英',
    gender: '女',
    age: 69,
    idNo: '110105195609080026',
    phone: '13601002266',
    address: '北京市朝阳区建国路 88 号',
    level: 'full',
    status: '随访中',
    diagnosis: '早期食管鳞状细胞癌（胸中下段）',
    stage: 'pT1aN0M0',
    org: '国家癌症中心',
    joinedAt: '2026-07-09',
    updatedAt: '2026-08-26',
    primaryId: 'PMI-EC-000421',
    localIds: [
      { org: '解放军第五医学中心', id: 'PLA5-2026-0621' },
      { org: '国家癌症中心', id: 'NCC-2026-0709' },
    ],
    diagnoses: [
      { id: 'D-1', date: '2026-07-09', type: '分期诊断', histology: '早期食管鳞状上皮病变', differentiation: '—', site: '距门齿约 26~35cm', t: 'cT1', n: 'N0', m: 'M0', stage: '早期', basis: '本院胃镜 + EUS + 胸腹部增强 CT', org: '国家癌症中心' },
      { id: 'D-2', date: '2026-08-10', type: '病理诊断', histology: 'LGIN + HGIN + 小灶浸润中分化鳞状细胞癌', differentiation: '中分化', site: '食管 26~35cm', t: 'pT1a', n: 'N0', m: 'M0', stage: '—', basis: 'ESD 切除标本病理：M2，口侧/肛侧/基底切缘阴性，R0', org: '国家癌症中心' },
    ],
    treatments: [
      { id: 'T-1', line: '内镜治疗', modality: '内镜治疗', name: '内镜黏膜下剥离术（ESD）', scheme: '食管病变 ESD 整块切除', cycles: '—', startDate: '2026-08-07', endDate: '2026-08-07', efficacy: '—', status: '已完成', org: '国家癌症中心' },
    ],
    // 演示补全：样例记录至 2026-08-12 出院，增加一次病理复核后的门诊随访。
    followUps: [
      { id: 'F-1', date: '2026-08-26', modality: '门诊', outcome: '无病生存', summary: 'ESD术后恢复良好，复核病理为 pT1a、R0，未行淋巴结清扫，进入内镜随访', nextDate: '2026-11-26', org: '国家癌症中心' },
    ],
    // 演示补全：样例仅说明血常规、凝血、肝肾功能等大致正常。
    labs: [
      { key: 'hgb', name: '血红蛋白 HGB', unit: 'g/L', refLower: 115, refUpper: 150,
        points: ctzPoint(['2026-08-05', '2026-08-26'], [126, 128]) },
      { key: 'wbc', name: '白细胞计数 WBC', unit: '×10⁹/L', refLower: 3.5, refUpper: 9.5,
        points: ctzPoint(['2026-08-05', '2026-08-26'], [5.2, 5.4]) },
      { key: 'alt', name: '谷丙转氨酶 ALT', unit: 'U/L', refLower: 7, refUpper: 40,
        points: ctzPoint(['2026-08-05', '2026-08-26'], [21, 20]) },
      { key: 'alb', name: '白蛋白 ALB', unit: 'g/L', refLower: 40, refUpper: 55,
        points: ctzPoint(['2026-08-05', '2026-08-26'], [43, 44]) },
      { key: 'pt', name: '凝血酶原时间 PT', unit: 's', refLower: 11, refUpper: 14,
        points: ctzPoint(['2026-08-05', '2026-08-26'], [11.7, 11.8]) },
    ],
    molecularTests: [],
    resources: [
      { id: 'R-1', type: '内镜', title: '上消化道内镜 + EUS 图像', date: '2026-07-09', size: '192 MB', format: 'JPEG+MP4', status: '已对齐' },
      { id: 'R-2', type: 'CT', title: '胸腹部增强 CT', date: '2026-07-03', size: '66 MB', format: 'DICOM', status: '已对齐' },
      { id: 'R-3', type: '内镜', title: 'ESD 术中内镜图像', date: '2026-08-07', size: '226 MB', format: 'JPEG+MP4', status: '已对齐' },
      { id: 'R-4', type: '病理切片', title: 'ESD 切除标本数字病理切片与报告', date: '2026-08-10', size: '1.2 GB', format: 'SVS+PDF', status: '已对齐' },
    ],
    audits: [
      { id: 'A-3', time: '2026-08-26 10:05', actor: '李医生', org: '国家癌症中心', action: '查看完整档案', scope: '本院完整字段 + 外院授权摘要', channel: '院内可信终端', result: '通过' },
      { id: 'A-2', time: '2026-07-09 09:18', actor: '数据治理服务', org: '国家癌症中心', action: '跨机构主索引关联', scope: '解放军第五医学中心与本院患者号', channel: '可信数据空间', result: '通过' },
      { id: 'A-1', time: '2026-07-09 09:16', actor: '数据治理服务', org: '国家癌症中心', action: '接收外院诊断摘要', scope: '胃镜与活检结果摘要', channel: '联邦网关', result: '脱敏下发' },
    ],
    timeline: [
      { id: 'L-1', date: '2026-06', kind: '诊断分期', title: '外院胃镜及活检', desc: '食管 33/30/27cm 多处病变，活检提示高级别上皮内瘤变', org: '解放军第五医学中心' },
      { id: 'L-2', date: '2026-07-03', kind: '检查', title: '胸腹部增强 CT', desc: '食管中下段管壁稍厚；双肺散在索条影及小结节，倾向慢性炎性/良性改变', org: '国家癌症中心' },
      { id: 'L-3', date: '2026-07-09', kind: '检查', title: '上消化道内镜 + 超声内镜（EUS）', desc: '食管约 26~35cm 表浅平坦型病变，主要位于黏膜层，局部与黏膜下层关系密切', org: '国家癌症中心' },
      { id: 'L-4', date: '2026-07-09', kind: '治疗决策', title: '内镜治疗评估', desc: '考虑早期食管癌或癌前病变，影像提示病变主要局限于黏膜层，拟行 ESD', org: '国家癌症中心' },
      { id: 'L-5', date: '2026-08-07', kind: '治疗', title: 'ESD 内镜黏膜下剥离术', desc: '完成食管病变整块切除，术后病理评估切缘与浸润深度', org: '国家癌症中心' },
      { id: 'L-6', date: '2026-08-10', kind: '诊断分期', title: 'ESD 术后病理', desc: 'LGIN + HGIN + 小灶 pT1a 浸润中分化鳞癌，M2，切缘阴性，R0', org: '国家癌症中心' },
      { id: 'L-7', date: '2026-08-26', kind: '随访', title: 'ESD 术后门诊随访', desc: '恢复良好，复核病理后进入规律内镜随访', org: '国家癌症中心', ref: 'F-1' },
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
    molecularTests: [],
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

// ---------- 就诊（真实门诊 / 住院 / 急诊）数据：独立于诊疗时间轴的跨机构就诊经历 ----------
// 仅记录患者真实发生的门诊 / 住院 / 急诊行为，不含治疗过程、随访、检查、病理等诊疗细节；
// 这些诊疗细节由「诊疗时间轴 / 检查检验 / 诊断 / 治疗记录 / 疗效随访」分别承载。
const patientVisits: Record<string, VisitRecord[]> = {
  'P-0001': [
    { id: 'V-1', date: '2026-05-14', org: '江城人民医院', type: '门诊', dept: '消化内科', reason: '进食哽噎感 3 个月余，胃镜发现食管胸中下段占位', diagnosis: '食管占位待查', disposition: '完成活检并进一步分期' },
    { id: 'V-2', date: '2026-06-22', org: '江城人民医院', type: '住院', dept: '肿瘤内科', reason: '确诊食管鳞状细胞癌后接受新辅助治疗', diagnosis: '食管鳞状细胞癌 cT2N1M0', disposition: '完成 2 个疗程新辅助化疗后转诊手术评估' },
    { id: 'V-3', date: '2026-07-30', org: '国家癌症中心', type: '住院', dept: '胸外科', reason: '外院新辅助治疗后入院行根治性手术评估', diagnosis: '食管鳞状细胞癌新辅助治疗后', disposition: '2026-08-03 完成根治性切除，2026-08-13 出院' },
    { id: 'V-4', date: '2026-08-27', org: '国家癌症中心', type: '门诊', dept: '胸外科', reason: '术后病理复核及近期恢复评估', diagnosis: '食管鳞状细胞癌术后 ypT2N0，R0', disposition: '进入规律随访' },
  ],
  'P-0004': [
    { id: 'V-1', date: '2026-06', org: '解放军第五医学中心', type: '门诊', dept: '消化内科', reason: '体检发现食管病变，无明显症状', diagnosis: '食管高级别上皮内瘤变', disposition: '转上级医院进一步评估' },
    { id: 'V-2', date: '2026-07-09', org: '国家癌症中心', type: '门诊', dept: '消化内镜中心', reason: '外院高级别上皮内瘤变，进一步评估病变深度及内镜治疗可能', diagnosis: '早期食管癌 / 癌前病变', disposition: '完善胃镜、EUS 后计划 ESD' },
    { id: 'V-3', date: '2026-08-05', org: '国家癌症中心', type: '住院', dept: '消化内镜中心', reason: '早期食管病变入院接受内镜下根治治疗', diagnosis: '早期食管癌 cT1N0M0', disposition: '2026-08-07 完成 ESD，2026-08-12 出院' },
    { id: 'V-4', date: '2026-08-26', org: '国家癌症中心', type: '门诊', dept: '消化内镜中心', reason: 'ESD 术后病理复核及随访计划制定', diagnosis: '食管鳞癌 pT1aN0M0，R0', disposition: '进入规律内镜随访' },
  ],
}


// 将真实就诊（门诊 / 住院 / 急诊）映射为时间轴的「就诊节点」，使左侧「诊疗时间轴（就诊筛选）」
// 与右侧「就诊记录」同源、同量，消除同一患者前后数据不一致。
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
    // 再注入真实就诊记录，保证与「就诊记录」同源同量；其余事件级节点按真实日期并入。
    const timeline = [
      ...enriched.timeline.filter((n) => n.kind !== '就诊节点'),
      ...visits.map(visitToNode),
    ].sort((a, b) => a.date.localeCompare(b.date))
    return [k, { ...enriched, timeline, visits }]
  }),
)
