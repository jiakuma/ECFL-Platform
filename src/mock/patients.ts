// ============================================================
// 患者主档案 Mock 数据层 —— 后端就绪后可整体替换为真实 API 调用
// 数据不出域策略：敏感字段一律脱敏/遮蔽，可见级别决定展示口径
// ============================================================

import {
  alignRules,
  mapSex,
  mapBirth,
  mapSmoking,
  mapMPI,
  detectConflict,
  mapPassthrough,
  mapAge,
  mapDiseaseName,
  mapPathType,
  mapTnm,
  mapHistoryYesNo,
  mapAllergy,
  type AlignRecordStatus,
  type MappingResult,
} from '@/mock/alignRules'

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
  complication?: string
}

export interface FollowUpRecord {
  id: string
  date: string
  modality: '门诊' | '电话' | '住院复查'
  outcome: '无病生存' | '局部复发' | '远处转移' | '死亡'
  summary: string
  nextDate: string
  org: string
  symptom?: string
  weight?: string
  nutrition?: string
  general?: string
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

// ---------- 检验记录（检验组合 / 检验单，按病程阶段归属） ----------
// 与 labs（单项时序趋势，用于随访趋势表）职责不同：本结构面向「一次开单的检验组合」，
// 支持阶段归属与完整明细查看，不重复 labs 的时序能力。每条指标携带 category，便于独立页按类分组与跨单趋势聚合。
export type LabCategory =
  | '血常规'
  | '肝功能'
  | '肾功能'
  | '凝血功能'
  | '肿瘤标志物'
  | '营养相关指标'
  | '其他检验'

export const labCategoryOrder: LabCategory[] = [
  '血常规', '肝功能', '肾功能', '凝血功能', '肿瘤标志物', '营养相关指标', '其他检验',
]

export const labCategoryColor: Record<LabCategory, string> = {
  血常规: '#2563eb',
  肝功能: '#8b5cf6',
  肾功能: '#06b6d4',
  凝血功能: '#f59e0b',
  肿瘤标志物: '#f43f5e',
  营养相关指标: '#10b981',
  其他检验: '#64748b',
}

export interface LabReportItem {
  category: LabCategory // 所属检验类别（分组 / 筛选依据）
  name: string // 指标名称
  value: string // 检验结果
  unit: string // 单位
  ref: string // 参考范围
  abnormal: boolean // 是否异常
}
export interface LabReport {
  id: string
  panel: string // 检验项目 / 组合名称
  date: string // 检验日期
  org: string // 检验机构
  stage: CourseStageKey // 阶段归属（早筛 / 诊断 / 治疗 / 随访）
  phase?: string // 阶段展示标签（早筛 / 治疗前 / 治疗中 / 术后 / 随访），缺省用 stage 标签
  items: LabReportItem[] // 完整检验明细
}

export interface ResourceItem {
  id: string
  type: '内镜' | 'CT' | 'MRI' | 'PET-CT' | '超声' | '病理切片' | '基因检测' | '检查数据' | '患者基本信息'
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

// ---------- 患者基础资料（入组基线表单 / Excel 元数据字段） ----------
// 基本身份信息复用 PatientDetail 上的 name/gender/age/idNo/phone/address/code/primaryId；
// 以下四组为基线表单扩展字段，仅在 Mock 层做必要补充，不改动诊疗/时间轴等既有结构。
export interface Sociodemographic {
  ethnicity: string      // 民族
  birthplace: string     // 籍贯 / 出生地
  maritalStatus: string  // 婚姻状况
  residence: string      // 居住地类型（城镇 / 农村）
  occupation: string     // 职业
  education: string      // 文化程度
  insurance: string      // 医保类型
}
export interface Lifestyle {
  smoking: string        // 吸烟史（含包年）
  drinking: string       // 饮酒史
  tea: string            // 饮茶习惯
  diet: string           // 饮食习惯（烫食 / 腌制等）
  riskFactors: string    // 主要危险因素
}
export interface PersonalHistory {
  pastHistory: string    // 既往病史
  pastSurgery: string    // 手术史
  allergy: string        // 过敏史
  familyCancer: string   // 恶性肿瘤家族史
}
export interface PhysicalInfo {
  height: string         // 身高 cm
  weight: string         // 体重 kg
  bmi: string            // 体重指数
  bloodPressure: string  // 血压
  heartRate: string      // 心率
  ecog: string           // ECOG 评分
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
  labReports: LabReport[] // 检验组合记录（按阶段归属，独立于 labs 时序趋势）
  molecularTests: MolecularResult[]
  resources: ResourceItem[]
  audits: AuditLog[]
  timeline: TimelineNode[]
  visits: VisitRecord[]
  // ---------- 患者基础资料（入组基线表单 / Excel 元数据字段） ----------
  // 基本身份信息复用 name/gender/age/idNo/phone/address/code/primaryId；
  // 其余四组为基线表单扩展字段（参考 Excel 元数据字段分组）。
  sociodemographic: Sociodemographic
  lifestyle: Lifestyle
  history: PersonalHistory
  physical: PhysicalInfo
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
    // 患者基础资料（入组基线表单 / Excel 元数据字段）
    sociodemographic: {
      ethnicity: '汉族', birthplace: '湖北武汉', maritalStatus: '已婚', residence: '城镇',
      occupation: '退休职工（既往货运司机）', education: '初中', insurance: '城镇职工基本医疗保险',
    },
    lifestyle: {
      smoking: '吸烟 40 年，约 20 支/日（约 40 包年），已戒 1 年',
      drinking: '偶尔饮酒（白酒），已减量',
      tea: '少饮浓茶', diet: '喜烫食、腌制咸菜',
      riskFactors: '长期吸烟、喜烫食、腌制饮食',
    },
    history: {
      pastHistory: '高血压 2 级（服药控制）', pastSurgery: '无',
      allergy: '青霉素过敏', familyCancer: '父亲患胃癌',
    },
    physical: {
      height: '172 cm', weight: '68 kg', bmi: '23.0',
      bloodPressure: '138/86 mmHg', heartRate: '76 次/分', ecog: '0 分',
    },
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
      { id: 'T-2', line: '手术治疗', modality: '手术', name: '胸腹腔镜食管癌根治性切除', scheme: '部分食管部分胃切除 + 颈部淋巴结清扫 + 喉返神经解剖术', cycles: '—', startDate: '2026-08-03', endDate: '2026-08-03', efficacy: '—', status: '已完成', org: '国家癌症中心', complication: '喉返神经解剖，术后声嘶一过性，1 周内恢复；无乳糜漏、无吻合口瘘' },
    ],
    // 演示补全：样例记录至 2026-08-13 出院，增加一次近期术后门诊以支撑随访页面。
    followUps: [
      { id: 'F-1', date: '2026-08-27', modality: '门诊', outcome: '无病生存', summary: '术后恢复平稳，切口愈合可，进食逐步恢复；复核病理为 ypT2N0、R0，进入规律随访', nextDate: '2026-11-27', org: '国家癌症中心', symptom: '无明显吞咽困难，偶有进食后胸骨后不适', weight: '62 kg（较术前稳定）', nutrition: '半流质逐步恢复，营养风险低', general: '神志清，精神状态可，切口愈合好' },
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
    // 演示补全：检验记录（按阶段归属的检验组合）。早筛初诊评估组合覆盖全部类别，
    // 随访复查组合复用部分指标以演示「同一指标多次结果的趋势」能力。
    labReports: [
      {
        id: 'LR-1',
        panel: '初诊评估检验组合',
        date: '2026-05-18',
        org: '江城人民医院',
        stage: 'screening',
        phase: '早筛',
        items: [
          { category: '血常规', name: '白细胞计数 WBC', value: '5.6', unit: '×10⁹/L', ref: '3.5 ~ 9.5', abnormal: false },
          { category: '血常规', name: '血红蛋白 HGB', value: '132', unit: 'g/L', ref: '130 ~ 175', abnormal: false },
          { category: '血常规', name: '血小板计数 PLT', value: '210', unit: '×10⁹/L', ref: '125 ~ 350', abnormal: false },
          { category: '肝功能', name: '谷丙转氨酶 ALT', value: '23', unit: 'U/L', ref: '9 ~ 50', abnormal: false },
          { category: '肝功能', name: '谷草转氨酶 AST', value: '21', unit: 'U/L', ref: '15 ~ 40', abnormal: false },
          { category: '肝功能', name: '白蛋白 ALB', value: '41', unit: 'g/L', ref: '40 ~ 55', abnormal: false },
          { category: '肝功能', name: '总胆红素 TBIL', value: '12', unit: 'μmol/L', ref: '3 ~ 22', abnormal: false },
          { category: '肾功能', name: '肌酐 Crea', value: '68', unit: 'μmol/L', ref: '44 ~ 106', abnormal: false },
          { category: '肾功能', name: '尿素 BUN', value: '5.1', unit: 'mmol/L', ref: '2.9 ~ 8.2', abnormal: false },
          { category: '凝血功能', name: '凝血酶原时间 PT', value: '11.9', unit: 's', ref: '11 ~ 14', abnormal: false },
          { category: '凝血功能', name: '活化部分凝血活酶时间 APTT', value: '30.2', unit: 's', ref: '25 ~ 35', abnormal: false },
          { category: '凝血功能', name: '国际标准化比值 INR', value: '1.0', unit: '', ref: '0.8 ~ 1.2', abnormal: false },
          { category: '肿瘤标志物', name: '鳞状细胞癌抗原 SCC', value: '3.2', unit: 'ng/mL', ref: '0 ~ 1.5', abnormal: true },
          { category: '肿瘤标志物', name: '癌胚抗原 CEA', value: '1.8', unit: 'ng/mL', ref: '0 ~ 5', abnormal: false },
          { category: '肿瘤标志物', name: '细胞角蛋白19片段 CYFRA21-1', value: '2.1', unit: 'ng/mL', ref: '0 ~ 3.3', abnormal: false },
          { category: '营养相关指标', name: '前白蛋白 PA', value: '220', unit: 'mg/L', ref: '200 ~ 400', abnormal: false },
          { category: '营养相关指标', name: '转铁蛋白 TRF', value: '2.4', unit: 'g/L', ref: '2.0 ~ 3.6', abnormal: false },
          { category: '其他检验', name: 'C反应蛋白 CRP', value: '3.0', unit: 'mg/L', ref: '0 ~ 8', abnormal: false },
        ],
      },
      {
        id: 'LR-D',
        panel: '诊断分期检验',
        date: '2026-05-25',
        org: '江城人民医院',
        stage: 'diagnosis',
        phase: '诊断',
        items: [
          { category: '血常规', name: '白细胞计数 WBC', value: '5.3', unit: '×10⁹/L', ref: '3.5 ~ 9.5', abnormal: false },
          { category: '血常规', name: '血红蛋白 HGB', value: '129', unit: 'g/L', ref: '130 ~ 175', abnormal: false },
          { category: '肝功能', name: '谷丙转氨酶 ALT', value: '26', unit: 'U/L', ref: '9 ~ 50', abnormal: false },
          { category: '肝功能', name: '白蛋白 ALB', value: '42', unit: 'g/L', ref: '40 ~ 55', abnormal: false },
          { category: '肿瘤标志物', name: '鳞状细胞癌抗原 SCC', value: '3.0', unit: 'ng/mL', ref: '0 ~ 1.5', abnormal: true },
          { category: '肿瘤标志物', name: '癌胚抗原 CEA', value: '1.7', unit: 'ng/mL', ref: '0 ~ 5', abnormal: false },
          { category: '肿瘤标志物', name: '细胞角蛋白19片段 CYFRA21-1', value: '2.0', unit: 'ng/mL', ref: '0 ~ 3.3', abnormal: false },
        ],
      },
      {
        id: 'LR-T1',
        panel: '新辅助治疗前基线检验',
        date: '2026-06-20',
        org: '江城人民医院',
        stage: 'treatment',
        phase: '治疗前',
        items: [
          { category: '血常规', name: '白细胞计数 WBC', value: '4.8', unit: '×10⁹/L', ref: '3.5 ~ 9.5', abnormal: false },
          { category: '血常规', name: '血红蛋白 HGB', value: '118', unit: 'g/L', ref: '130 ~ 175', abnormal: true },
          { category: '肝功能', name: '白蛋白 ALB', value: '38', unit: 'g/L', ref: '40 ~ 55', abnormal: true },
          { category: '肝功能', name: '谷丙转氨酶 ALT', value: '28', unit: 'U/L', ref: '9 ~ 50', abnormal: false },
          { category: '肿瘤标志物', name: '鳞状细胞癌抗原 SCC', value: '2.8', unit: 'ng/mL', ref: '0 ~ 1.5', abnormal: true },
          { category: '肿瘤标志物', name: '癌胚抗原 CEA', value: '1.6', unit: 'ng/mL', ref: '0 ~ 5', abnormal: false },
          { category: '肿瘤标志物', name: '细胞角蛋白19片段 CYFRA21-1', value: '1.9', unit: 'ng/mL', ref: '0 ~ 3.3', abnormal: false },
        ],
      },
      {
        id: 'LR-T2',
        panel: '新辅助治疗中检验',
        date: '2026-07-10',
        org: '江城人民医院',
        stage: 'treatment',
        phase: '治疗中',
        items: [
          { category: '血常规', name: '白细胞计数 WBC', value: '3.2', unit: '×10⁹/L', ref: '3.5 ~ 9.5', abnormal: true },
          { category: '血常规', name: '血红蛋白 HGB', value: '105', unit: 'g/L', ref: '130 ~ 175', abnormal: true },
          { category: '肝功能', name: '白蛋白 ALB', value: '35', unit: 'g/L', ref: '40 ~ 55', abnormal: true },
          { category: '肝功能', name: '谷丙转氨酶 ALT', value: '34', unit: 'U/L', ref: '9 ~ 50', abnormal: false },
          { category: '肿瘤标志物', name: '鳞状细胞癌抗原 SCC', value: '2.1', unit: 'ng/mL', ref: '0 ~ 1.5', abnormal: true },
          { category: '肿瘤标志物', name: '癌胚抗原 CEA', value: '1.5', unit: 'ng/mL', ref: '0 ~ 5', abnormal: false },
          { category: '肿瘤标志物', name: '细胞角蛋白19片段 CYFRA21-1', value: '1.7', unit: 'ng/mL', ref: '0 ~ 3.3', abnormal: false },
        ],
      },
      {
        id: 'LR-T3',
        panel: '术后检验',
        date: '2026-08-10',
        org: '国家癌症中心',
        stage: 'treatment',
        phase: '术后',
        items: [
          { category: '血常规', name: '白细胞计数 WBC', value: '5.2', unit: '×10⁹/L', ref: '3.5 ~ 9.5', abnormal: false },
          { category: '血常规', name: '血红蛋白 HGB', value: '112', unit: 'g/L', ref: '130 ~ 175', abnormal: true },
          { category: '肝功能', name: '白蛋白 ALB', value: '37', unit: 'g/L', ref: '40 ~ 55', abnormal: true },
          { category: '肝功能', name: '谷丙转氨酶 ALT', value: '32', unit: 'U/L', ref: '9 ~ 50', abnormal: false },
          { category: '肿瘤标志物', name: '鳞状细胞癌抗原 SCC', value: '1.7', unit: 'ng/mL', ref: '0 ~ 1.5', abnormal: true },
          { category: '肿瘤标志物', name: '癌胚抗原 CEA', value: '1.4', unit: 'ng/mL', ref: '0 ~ 5', abnormal: false },
          { category: '肿瘤标志物', name: '细胞角蛋白19片段 CYFRA21-1', value: '1.5', unit: 'ng/mL', ref: '0 ~ 3.3', abnormal: false },
        ],
      },
      {
        id: 'LR-2',
        panel: '术后复查检验组合',
        date: '2026-08-27',
        org: '国家癌症中心',
        stage: 'followup',
        phase: '随访',
        items: [
          { category: '血常规', name: '白细胞计数 WBC', value: '6.2', unit: '×10⁹/L', ref: '3.5 ~ 9.5', abnormal: false },
          { category: '血常规', name: '血红蛋白 HGB', value: '128', unit: 'g/L', ref: '130 ~ 175', abnormal: false },
          { category: '肝功能', name: '谷丙转氨酶 ALT', value: '19', unit: 'U/L', ref: '9 ~ 50', abnormal: false },
          { category: '肝功能', name: '白蛋白 ALB', value: '39', unit: 'g/L', ref: '40 ~ 55', abnormal: false },
          { category: '肾功能', name: '肌酐 Crea', value: '65', unit: 'μmol/L', ref: '44 ~ 106', abnormal: false },
          { category: '肾功能', name: '尿素 BUN', value: '4.8', unit: 'mmol/L', ref: '2.9 ~ 8.2', abnormal: false },
          { category: '凝血功能', name: '凝血酶原时间 PT', value: '12.1', unit: 's', ref: '11 ~ 14', abnormal: false },
          { category: '凝血功能', name: '国际标准化比值 INR', value: '1.0', unit: '', ref: '0.8 ~ 1.2', abnormal: false },
          { category: '肿瘤标志物', name: '鳞状细胞癌抗原 SCC', value: '1.4', unit: 'ng/mL', ref: '0 ~ 1.5', abnormal: false },
          { category: '肿瘤标志物', name: '癌胚抗原 CEA', value: '1.5', unit: 'ng/mL', ref: '0 ~ 5', abnormal: false },
          { category: '营养相关指标', name: '前白蛋白 PA', value: '205', unit: 'mg/L', ref: '200 ~ 400', abnormal: false },
          { category: '营养相关指标', name: '转铁蛋白 TRF', value: '2.3', unit: 'g/L', ref: '2.0 ~ 3.6', abnormal: false },
          { category: '其他检验', name: 'C反应蛋白 CRP', value: '5.0', unit: 'mg/L', ref: '0 ~ 8', abnormal: false },
        ],
      },
    ],
    // 演示补充：样例数据原始病例未记录分子检测。
    // 以下结果参考公开食管鳞癌分子检测案例，用于展示平台对分子数据和原始报告的承载能力。
    molecularTests: [
      { id: 'M-1', date: '2026-07-31', item: 'PD-L1', result: 'CPS 6', note: 'PD-L1 表达阳性，可作为免疫治疗相关参考', org: '国家癌症中心' },
      { id: 'M-2', date: '2026-07-31', item: 'MSI', result: 'MSS', note: '原发灶微卫星状态稳定', org: '国家癌症中心' },
      { id: 'M-3', date: '2026-07-31', item: 'NGS', result: '未发现明确可靶向变异', note: '543 个肿瘤相关基因 Panel 检测', org: '国家癌症中心' },
      { id: 'M-4', date: '2026-07-31', item: 'HER2', result: 'IHC 0（无扩增）', note: '食管鳞癌 HER2 阴性', org: '国家癌症中心' },
    ],
    resources: [
      { id: 'R-1', type: '内镜', title: '外院上消化道内镜图像', date: '2026-05-14', size: '148 MB', format: 'JPEG+MP4', status: '授权可见' },
      { id: 'R-2', type: 'CT', title: '术前增强 CT', date: '2026-07', size: '72 MB', format: 'DICOM', status: '已对齐' },
      { id: 'R-3', type: 'PET-CT', title: '外院 PET/CT 分期影像', date: '2026-07', size: '136 MB', format: 'DICOM', status: '授权可见' },
      { id: 'R-4', type: '病理切片', title: '术后病理数字切片与报告', date: '2026-08-10', size: '1.6 GB', format: 'SVS+PDF', status: '已对齐' },
      { id: 'R-5', type: '基因检测', title: '食管鳞癌分子检测报告（演示）', date: '2026-07-31', size: '2.1 MB', format: 'PDF', status: '授权可见' },
      { id: 'R-6', type: 'MRI', title: '上腹部 MRI 平扫+增强', date: '2026-07', size: '88 MB', format: 'DICOM', status: '已对齐' },
      { id: 'R-7', type: '超声', title: '颈部淋巴结超声', date: '2026-07', size: '24 MB', format: 'MP4', status: '待对齐' },
      { id: 'R-8', type: '检查数据', title: '术前血清学与血常规检查', date: '2026-07', size: '0.4 MB', format: 'CSV+PDF', status: '待对齐' },
      { id: 'R-9', type: '患者基本信息', title: '患者人口学基本信息', date: '2026-05', size: '12 KB', format: 'JSON', status: '已对齐' },
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
      { id: 'L-10', date: '2026-08-27', kind: '检查', title: '术后胸部增强 CT', desc: '吻合口壁略增厚，未见明确复发征象；双侧胸腔少量积液已吸收，符合术后改变', org: '国家癌症中心' },
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
    // 患者基础资料（入组基线表单 / Excel 元数据字段）
    sociodemographic: {
      ethnicity: '汉族', birthplace: '北京', maritalStatus: '已婚', residence: '城镇',
      occupation: '退休教师', education: '大专', insurance: '城镇居民基本医疗保险',
    },
    lifestyle: {
      smoking: '无', drinking: '无', tea: '常饮绿茶', diet: '清淡，偶有腌制食品',
      riskFactors: '年龄（老年）、喜烫食',
    },
    history: {
      pastHistory: '2 型糖尿病（饮食控制）', pastSurgery: '无',
      allergy: '无明确药物过敏', familyCancer: '无',
    },
    physical: {
      height: '158 cm', weight: '56 kg', bmi: '22.4',
      bloodPressure: '128/78 mmHg', heartRate: '72 次/分', ecog: '0 分',
    },
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
    labReports: [],
    molecularTests: [],
    resources: [
      { id: 'R-1', type: '内镜', title: '上消化道内镜 + EUS 图像', date: '2026-07-09', size: '192 MB', format: 'JPEG+MP4', status: '已对齐' },
      { id: 'R-2', type: 'CT', title: '胸腹部增强 CT', date: '2026-07-03', size: '66 MB', format: 'DICOM', status: '已对齐' },
      { id: 'R-3', type: '内镜', title: 'ESD 术中内镜图像', date: '2026-08-07', size: '226 MB', format: 'JPEG+MP4', status: '已对齐' },
      { id: 'R-4', type: '病理切片', title: 'ESD 切除标本数字病理切片与报告', date: '2026-08-10', size: '1.2 GB', format: 'SVS+PDF', status: '已对齐' },
      { id: 'R-5', type: 'PET-CT', title: '全身 PET/CT 分期评估', date: '2026-07-03', size: '118 MB', format: 'DICOM', status: '授权可见' },
      { id: 'R-6', type: '超声', title: '体表超声（颈部/腹部）', date: '2026-07-03', size: '19 MB', format: 'MP4', status: '已对齐' },
      { id: 'R-7', type: '基因检测', title: '肿瘤相关基因 Panel 检测报告', date: '2026-07-09', size: '1.8 MB', format: 'PDF', status: '授权可见' },
      { id: 'R-8', type: '检查数据', title: '术前实验室与功能学检查', date: '2026-07', size: '0.5 MB', format: 'CSV+PDF', status: '待对齐' },
      { id: 'R-9', type: '患者基本信息', title: '患者人口学基本信息', date: '2026-06', size: '10 KB', format: 'JSON', status: '已对齐' },
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
    labReports: [],
    molecularTests: [],
    resources: [],
    audits: [],
    timeline: [
      { id: 'L-1', date: '', kind: '诊断分期', title: `临床诊断：${f.diagnosis}（${f.site}）`, desc: `${f.histology}`, org: f.org },
      { id: 'L-2', date: '', kind: '诊断分期', title: `临床分期 ${f.stage}`, desc: '分期信息由归属机构上报', org: f.org },
    ],
    visits: [],
    // 基线表单字段兜底：列表合成的最小详情不携带基础资料，统一以「—」占位
    sociodemographic: { ethnicity: '—', birthplace: '—', maritalStatus: '—', residence: '—', occupation: '—', education: '—', insurance: '—' },
    lifestyle: { smoking: '—', drinking: '—', tea: '—', diet: '—', riskFactors: '—' },
    history: { pastHistory: '—', pastSurgery: '—', allergy: '—', familyCancer: '—' },
    physical: { height: '—', weight: '—', bmi: '—', bloodPressure: '—', heartRate: '—', ecog: '—' },
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

// ---------- 病程四阶段：早筛 / 诊断 / 治疗 / 随访 ----------
// 仅对既有时间轴事件做前端分组，不新增数据字段、不改写临床事实。
// 阶段为临床叙事的一级结构；检查、就诊、病理、治疗、随访等事件为阶段内二级事件。
// 阶段归属按「事件在病程中的先后与临床目的」判定，而非按检查类型简单归类：
//   确诊前的过程（体检/筛查/初次发现异常）→ 早筛
//   确诊与分期过程 → 诊断
//   首次治疗决策至末次治疗（含治疗期再分期检查、术后病理）→ 治疗
//   治疗结束后的复查、疗效评估、复发转移 → 随访
export type CourseStageKey = 'screening' | 'diagnosis' | 'treatment' | 'followup'
export interface CourseStage {
  key: CourseStageKey
  label: string
  color: string
  nodes: TimelineNode[]
}

const COURSE_FOLLOW_KINDS = ['随访', '复查', '疗效评估', '复发转移']

// 是否确诊为恶性肿瘤：结论中出现「癌」，且非单纯癌前病变（瘤变 / 异型增生）
function isConfirmedMalignancy(n: TimelineNode): boolean {
  const text = `${n.title} ${n.desc}`
  if (/瘤变|异型增生|不典型增生/.test(text) && !/癌/.test(text)) return false
  return /癌/.test(text)
}

export function resolveCourseStages(timeline: TimelineNode[]): CourseStage[] {
  // 同日内「就诊 → 检查 → 诊断 → 治疗决策」更符合临床发生顺序
  const rank = (n: TimelineNode) => (n.kind === '就诊节点' ? 0 : 1)
  const nodes = [...timeline].sort(
    (a, b) => a.date.localeCompare(b.date) || rank(a) - rank(b) || a.id.localeCompare(b.id),
  )

  let treatIdx = nodes.findIndex((n) => n.kind === '治疗' || n.kind === '治疗决策')
  // 与首次治疗同日的就诊（如入院接受新辅助治疗）一并归入治疗阶段，避免落在诊断阶段
  if (treatIdx >= 0) {
    const d = nodes[treatIdx].date
    let i = treatIdx - 1
    while (i >= 0 && nodes[i].date === d && nodes[i].kind === '就诊节点') {
      treatIdx = i
      i -= 1
    }
  }
  const diagIdx = nodes.findIndex((n) => n.kind === '诊断分期')

  // 随访起点：首次治疗之后出现的第一个随访类事件（无治疗时取全局第一个）
  let followIdx = -1
  for (let i = treatIdx >= 0 ? treatIdx + 1 : 0; i < nodes.length; i += 1) {
    if (COURSE_FOLLOW_KINDS.includes(nodes[i].kind)) {
      followIdx = i
      break
    }
  }
  // 与随访事件同日的其他事件（如同日的术后随访门诊）一并归入随访
  if (followIdx >= 0) {
    const d = nodes[followIdx].date
    let i = followIdx - 1
    while (i >= Math.max(treatIdx, 0) && nodes[i].date === d) {
      followIdx = i
      i -= 1
    }
  }

  // 早筛终点（不含）：首个「确诊」事件之前属于发现过程；
  // 若首个诊断分期仅为癌前病变（如高级别上皮内瘤变），该事件本身仍属发现过程。
  let screenEnd: number
  if (diagIdx < 0) screenEnd = treatIdx >= 0 ? treatIdx : nodes.length
  else screenEnd = isConfirmedMalignancy(nodes[diagIdx]) ? diagIdx : diagIdx + 1
  if (treatIdx >= 0) screenEnd = Math.min(screenEnd, treatIdx)
  // 同一次发现经过：与早筛末位事件同日、且非诊断分期的就诊 / 检查并入早筛
  const lastIdx = screenEnd - 1
  if (lastIdx >= 0) {
    while (
      screenEnd < nodes.length &&
      nodes[screenEnd].date === nodes[lastIdx].date &&
      nodes[screenEnd].kind !== '诊断分期' &&
      (treatIdx < 0 || screenEnd < treatIdx)
    ) {
      screenEnd += 1
    }
  }

  const pick = (from: number, to: number) => nodes.slice(Math.max(0, from), Math.max(0, to))
  const diagEnd = treatIdx >= 0 ? treatIdx : followIdx >= 0 ? followIdx : nodes.length
  const treatEnd = followIdx >= 0 ? followIdx : nodes.length

  return [
    { key: 'screening', label: '早筛', color: '#0ea5e9', nodes: pick(0, screenEnd) },
    { key: 'diagnosis', label: '诊断', color: '#8b5cf6', nodes: pick(screenEnd, diagEnd) },
    { key: 'treatment', label: '治疗', color: '#06b6d4', nodes: treatIdx >= 0 ? pick(treatIdx, treatEnd) : [] },
    { key: 'followup', label: '随访', color: '#10b981', nodes: followIdx >= 0 ? pick(followIdx, nodes.length) : [] },
  ]
}


// ---------- 病程里程碑：左侧时间轴只呈现推动病程发展的关键节点 ----------
// 左侧回答「病程如何一步步发展」，右侧承载完整记录与证据。
// 规则：
//   诊断分期 / 治疗 / 治疗决策 / 随访类事件 → 里程碑节点
//   检查 → 优先作为里程碑的证据标签（同一 CT 可因临床目的归属诊断、治疗或随访）
//   就诊节点、检验、常规复查 → 不进入左侧，仅保留在右侧详情
//   某阶段若无关键节点，则该阶段的检查合并为一个证据型里程碑
export interface MilestoneEvidence {
  id: string
  label: string
}
export interface CourseMilestone {
  id: string
  stage: CourseStageKey
  date: string
  title: string
  brief: string
  tags: MilestoneEvidence[]
}

const MILESTONE_KINDS = ['诊断分期', '治疗', '治疗决策', '随访', '复查', '疗效评估', '复发转移']
const EVIDENCE_TITLE: Record<CourseStageKey, string> = {
  screening: '首次发现异常',
  diagnosis: '完成临床分期',
  treatment: '治疗后评估',
  followup: '随访复查',
}

// 证据标签：按检查名称给出简短模态标签
function examTagOf(n: TimelineNode): string {
  const t = n.title
  if (/EUS|超声内镜/.test(t)) return '超声内镜'
  if (/PET/.test(t)) return 'PET-CT'
  if (/MRI|核磁/.test(t)) return 'MRI'
  if (/CT/.test(t)) return 'CT'
  if (/超声|彩超/.test(t)) return '超声'
  if (/内镜|胃镜/.test(t)) return '内镜'
  return '检查'
}

function briefOf(text: string, n = 36): string {
  const t = text.trim()
  return t.length <= n ? t : `${t.slice(0, n)}…`
}

// 节点标题表达「病程意义」而非单纯的医疗数据名称（如「外院活检病理」→「病理明确鳞癌」）
function milestoneTitleOf(n: TimelineNode, _stage: CourseStageKey): string {
  const text = `${n.title} ${n.desc}`
  if (n.kind === '诊断分期') {
    const cancer = /腺癌/.test(text) ? '腺癌' : /鳞/.test(text) ? '鳞癌' : '癌'
    if (/术后病理|ESD 术后|术后/.test(n.title)) return `术后病理明确${cancer}`
    if (/癌/.test(text)) return `病理明确${cancer}`
    return '病理提示癌前病变'
  }
  if (n.kind === '治疗决策') {
    if (/ESD|内镜/.test(text)) return '确定内镜下切除方案'
    return '确定根治性手术方案'
  }
  if (n.kind === '治疗') {
    if (/ESD|黏膜下剥离/.test(n.title)) return 'ESD 内镜下切除'
    if (/化疗/.test(n.title)) return '新辅助化疗'
    if (/切除|根治/.test(n.title)) return '根治性手术切除'
    if (/放疗/.test(n.title)) return '放射治疗'
    return n.title
  }
  if (n.kind === '随访') {
    if (/术后/.test(n.title)) return '进入规律随访'
    return '随访复查'
  }
  return n.title
}

export function resolveCourseMilestones(stages: CourseStage[]): CourseMilestone[] {
  const out: CourseMilestone[] = []

  for (const s of stages) {
    const nodes = s.nodes
    if (!nodes.length) continue
    const isKey = nodes.map((n) => MILESTONE_KINDS.includes(n.kind))
    const examIdx = nodes.map((n, i) => ({ n, i })).filter(({ n }) => n.kind === '检查').map(({ i }) => i)

    // 检查归属同阶段内「其后最近」的关键节点；没有则「其前最近」
    const attach = new Map<string, MilestoneEvidence[]>()
    const orphan: number[] = []
    for (let x = 0; x < examIdx.length; x += 1) {
      const i = examIdx[x]
      let target = -1
      for (let k = i + 1; k < nodes.length; k += 1) if (isKey[k]) { target = k; break }
      if (target < 0) for (let k = i - 1; k >= 0; k -= 1) if (isKey[k]) { target = k; break }
      if (target < 0) { orphan.push(i); continue }
      const id = nodes[target].id
      const list = attach.get(id) ?? []
      list.push({ id: nodes[i].id, label: examTagOf(nodes[i]) })
      attach.set(id, list)
    }

    nodes.forEach((n, i) => {
      if (!isKey[i]) return
      out.push({
        id: n.id,
        stage: s.key,
        date: n.date,
        title: milestoneTitleOf(n, s.key),
        brief: briefOf(n.desc),
        tags: attach.get(n.id) ?? [],
      })
    })

    // 本阶段没有关键节点：把该阶段检查合并为一个证据型里程碑
    if (orphan.length) {
      const group = orphan.map((i) => nodes[i])
      const last = group[group.length - 1]
      out.push({
        id: last.id,
        stage: s.key,
        date: group[0].date,
        title: EVIDENCE_TITLE[s.key] ?? '检查评估',
        brief: briefOf(last.desc),
        tags: group.map((n) => ({ id: n.id, label: examTagOf(n) })),
      })
    }

    // 兜底：阶段有事件但未产出里程碑（如仅有就诊节点）
    if (!out.some((m) => m.stage === s.key)) {
      const last = nodes[nodes.length - 1]
      out.push({ id: last.id, stage: s.key, date: last.date, title: milestoneTitleOf(last, s.key), brief: briefOf(last.desc), tags: [] })
    }
  }

  return out
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

// ---------- 多模态资源聚合（平台级资源库统一出口） ----------
export interface ResourceView extends ResourceItem {
  patientId: string
  patientName: string
  patientCode: string
  patientLevel: DataLevel
  org: string
}

export function getAllResources(): ResourceView[] {
  const out: ResourceView[] = []
  for (const [pid, detail] of Object.entries(patientDetails)) {
    for (const r of detail.resources) {
      out.push({
        ...r,
        patientId: pid,
        patientName: detail.name,
        patientCode: detail.code,
        patientLevel: detail.level,
        org: detail.org,
      })
    }
  }
  return out.sort((a, b) => b.date.localeCompare(a.date))
}

// ---------- 对齐任务（语义 / 字典对齐登记与校验，联邦可联合训练的前置） ----------
export type AlignType = '语义字典' | '空间' | '时间' | '标识' | '特征'
export type AlignStatus = '待对齐' | '对齐中' | '已校验' | '校验失败'
// 本期对齐仅覆盖：内镜 / CT / PET-CT / 切片（病理切片）/ 检查数据 / 患者基本信息
export type AlignModality = '内镜' | 'CT' | 'PET-CT' | '病理切片' | '检查数据' | '患者基本信息'

// 患者基本信息对齐的一级分类（与用户给定的字段分组一致）
export type AlignCategory =
  | '患者身份'
  | '人口学'
  | '时间'
  | '疾病'
  | '分期'
  | '既往史'

// 一级分类展示顺序
export const CATEGORY_ORDER: AlignCategory[] = [
  '患者身份',
  '人口学',
  '时间',
  '疾病',
  '分期',
  '既往史',
]

export interface AlignmentCheck {
  name: string
  pass: boolean
  detail: string
}

// 对齐过程的一项：原始值 →（规则识别的问题）→ 映射后的标准值
export interface AlignMappingItem {
  field: string // 字段 / 术语来源
  raw: string // 原始值（来自源机构）
  mapped: string // 对齐后的标准值
  code?: string // 对标标准编码（ICD-O-3 / GRCh38 / AJCC 等）
  issue?: string // 对齐规则识别出的偏差（无则本就一致）
  result: 'ok' | 'fixed' | 'blocked' // ok=本就合规；fixed=经规则修正；blocked=需重注释/人工
}

export interface AlignmentTask {
  id: string
  resourceId: string
  resourceTitle: string
  patientCode: string
  org: string
  modality: AlignModality
  alignType: AlignType
  standard: string
  status: AlignStatus
  operator: string
  updatedAt: string
  txHash?: string
  checks: AlignmentCheck[]
  mappings?: AlignMappingItem[]
  // —— 患者基本信息对齐扩展（向后兼容，旧任务可不填）——
  records?: AlignRecord[] // 字段级溯源记录
  quality?: QualityCheck[] // 结构化质量校验
  conflicts?: ConflictItem[] // 跨中心冲突
  review?: AlignReview // 人工确认
}

// 字段级溯源记录：从标准结果可回溯至原始数据
export interface AlignRecord {
  category: AlignCategory // 一级分类（患者身份/人口学/时间/疾病/分期/既往史）
  sourceOrg: string
  sourceField: string
  sourceType: string
  sourceValue: string
  standardField: string
  standardType: string
  standardValue: string
  ruleId: string
  ruleVersion: string
  basis: string
  status: AlignRecordStatus
  processTime: string
  operator: string
  formula?: string // 计算过程（仅 calc 类规则）
  issue?: string // 异常/待确认原因
  code?: string // 标准编码（性别码 / PMI 等）
}

export type QualityDimension =
  | '必填缺失'
  | '日期格式错误'
  | '数据类型错误'
  | '数值超范围'
  | '单位不一致'
  | '跨中心冲突'
  | '转换规则缺失'

export interface QualityCheck {
  dimension: QualityDimension
  level: 'error' | 'warn'
  message: string
  autoPass: boolean // 是否可自动通过
}

export interface ConflictItem {
  field: string
  values: { org: string; value: string }[]
  severity: 'high' | 'mid'
  note: string
}

export interface ReviewLog {
  time: string
  operator: string
  action: string
  note?: string
}

export interface AlignReview {
  open: boolean // 是否处于待确认状态
  reason: string // 待确认原因
  candidates?: string[] // 候选患者 / 值
  resolution?: 'confirmed' | 'corrected' | 'rejected'
  resolutionNote?: string
  logs: ReviewLog[]
}

// 由规则函数构造一条字段级溯源记录（保证与规则引擎一致、可被单测验证）
function rec(p: {
  category: AlignCategory
  sourceOrg: string
  sourceField: string
  sourceType: string
  sourceValue: string
  standardField: string
  standardType: string
  ruleId: string
  res: MappingResult
  processTime?: string
  operator?: string
}): AlignRecord {
  const rule = alignRules[p.ruleId]
  return {
    category: p.category,
    sourceOrg: p.sourceOrg,
    sourceField: p.sourceField,
    sourceType: p.sourceType,
    sourceValue: p.sourceValue,
    standardField: p.standardField,
    standardType: p.standardType,
    standardValue: p.res.standardValue,
    ruleId: p.ruleId,
    ruleVersion: rule.version,
    basis: rule.basis,
    status: p.res.status,
    processTime: p.processTime ?? '2026-08-22',
    operator: p.operator ?? '国家癌症中心 · 数据治理岗',
    formula: p.res.formula,
    issue: p.res.issue,
    code: p.res.code,
  }
}

export const alignmentTasks: AlignmentTask[] = [
  {
    id: 'AL-1',
    resourceId: 'R-1',
    resourceTitle: '外院上消化道内镜图像',
    patientCode: 'P-0001',
    org: '国家癌症中心',
    modality: '内镜',
    alignType: '语义字典',
    standard: '内镜下食管癌分型（Lugol 染色法）',
    status: '已校验',
    operator: '国家癌症中心 · 数据治理岗',
    updatedAt: '2026-08-12',
    txHash: '0x9f3a7c21bd4e',
    checks: [
      { name: '术语映射', pass: true, detail: '已映射至统一内镜分型字典' },
      { name: '病灶定位', pass: true, detail: '食管胸中段编号一致' },
      { name: '实体解析', pass: true, detail: '已关联 PMI=P-0001' },
    ],
  },
  {
    id: 'AL-2',
    resourceId: 'R-2',
    resourceTitle: '术前增强 CT',
    patientCode: 'P-0001',
    org: '省肿瘤医院',
    modality: 'CT',
    alignType: '空间',
    standard: '胸部 CT 层厚 1mm 统一重采样',
    status: '已校验',
    operator: '省肿瘤医院 · 影像对齐',
    updatedAt: '2026-08-13',
    txHash: '0x4c1e88a0f7b2',
    checks: [
      { name: '层厚统一', pass: true, detail: '已重采样至 1mm 各向同性' },
      { name: '坐标系', pass: true, detail: '统一至 LPS 坐标系' },
      { name: '实体解析', pass: true, detail: '已关联 PMI=P-0001' },
    ],
  },
  {
    id: 'AL-3',
    resourceId: 'R-3',
    resourceTitle: '外院 PET/CT 分期影像',
    patientCode: 'P-0001',
    org: '省肿瘤医院',
    modality: 'PET-CT',
    alignType: '语义字典',
    standard: 'PERCIST 1.0 代谢应答标准',
    status: '已校验',
    operator: '省肿瘤医院 · 数据治理岗',
    updatedAt: '2026-08-14',
    txHash: '0x77b0d3c9e51a',
    checks: [
      { name: '标准映射', pass: true, detail: '已对齐 PERCIST 1.0 术语' },
      { name: 'SUV 校准', pass: true, detail: '体重视差已校正' },
      { name: '实体解析', pass: true, detail: '已关联 PMI=P-0001' },
    ],
  },
  {
    id: 'AL-4',
    resourceId: 'R-4',
    resourceTitle: '术后病理数字切片与报告',
    patientCode: 'P-0001',
    org: '国家癌症中心',
    modality: '病理切片',
    alignType: '语义字典',
    standard: 'WHO 食管鳞状细胞癌分类（2022）',
    status: '已校验',
    operator: '国家癌症中心 · 病理对齐',
    updatedAt: '2026-08-15',
    txHash: '0x2de9f41a8c70',
    checks: [
      { name: '术语映射', pass: true, detail: '已映射至 WHO 食管鳞癌分类(2022)' },
      { name: 'TNM 版本', pass: true, detail: '统一为 AJCC 第 8 版' },
      { name: '实体解析', pass: true, detail: '已关联 PMI=P-0001' },
    ],
  },
  {
    id: 'AL-6',
    resourceId: 'R-6',
    resourceTitle: '上消化道内镜 + EUS 图像',
    patientCode: 'P-0004',
    org: '市一医院',
    modality: '内镜',
    alignType: '语义字典',
    standard: '内镜下食管癌分型（Lugol 染色法）',
    status: '待对齐',
    operator: '市一医院 · 数据治理岗',
    updatedAt: '2026-08-18',
    checks: [
      { name: '术语映射', pass: false, detail: '报告使用院内自由文本，待结构化' },
      { name: '病灶定位', pass: false, detail: '部位描述未统一至标准分段' },
      { name: '实体解析', pass: true, detail: '已关联 PMI=P-0004' },
    ],
  },
  {
    id: 'AL-7',
    resourceId: 'R-7',
    resourceTitle: '胸腹部增强 CT',
    patientCode: 'P-0004',
    org: '市一医院',
    modality: 'CT',
    alignType: '空间',
    standard: '胸部 CT 层厚 1mm 统一重采样',
    status: '对齐中',
    operator: '市一医院 · 影像对齐',
    updatedAt: '2026-08-19',
    checks: [
      { name: '层厚统一', pass: false, detail: '重采样任务进行中' },
      { name: '坐标系', pass: true, detail: '已转换至 LPS 坐标系' },
      { name: '实体解析', pass: true, detail: '已关联 PMI=P-0004' },
    ],
  },
  {
    id: 'AL-8',
    resourceId: 'R-8',
    resourceTitle: 'ESD 术中内镜图像',
    patientCode: 'P-0004',
    org: '市一医院',
    modality: '内镜',
    alignType: '时间',
    standard: '随访时间点对齐（基线 / 术后 / 随访 N 月）',
    status: '待对齐',
    operator: '市一医院 · 数据治理岗',
    updatedAt: '2026-08-20',
    checks: [
      { name: '时间点归并', pass: false, detail: '术后与随访序列时间轴未对齐' },
      { name: '实体解析', pass: true, detail: '已关联 PMI=P-0004' },
    ],
  },
  {
    id: 'AL-10',
    resourceId: 'R-10',
    resourceTitle: 'ESD 切除标本数字病理切片与报告',
    patientCode: 'P-0004',
    org: '市一医院',
    modality: '病理切片',
    alignType: '语义字典',
    standard: 'WHO 食管鳞状细胞癌分类（2022）',
    status: '待对齐',
    operator: '市一医院 · 病理对齐',
    updatedAt: '2026-08-22',
    checks: [
      { name: '术语映射', pass: false, detail: '院内模板待映射至 WHO 分类' },
      { name: 'TNM 版本', pass: false, detail: '分期版本待统一为 AJCC 第 8 版' },
      { name: '实体解析', pass: true, detail: '已关联 PMI=P-0004' },
    ],
  },
  {
    id: 'AL-11',
    resourceId: 'L-P0001',
    resourceTitle: '术前血清学与血常规检查',
    patientCode: 'P-0001',
    org: '省肿瘤医院',
    modality: '检查数据',
    alignType: '语义字典',
    standard: 'LOINC 检验项目编码 + UCUM 单位',
    status: '待对齐',
    operator: '省肿瘤医院 · 数据治理岗',
    updatedAt: '2026-08-22',
    checks: [
      { name: '项目编码', pass: false, detail: '院内项目名未映射至 LOINC' },
      { name: '单位统一', pass: false, detail: '部分指标单位口径不一致（g/dl ↔ g/L）' },
      { name: '实体解析', pass: true, detail: '已关联 PMI=P-0001' },
    ],
  },
  {
    id: 'AL-12',
    resourceId: 'D-P0001',
    resourceTitle: '患者人口学基本信息',
    patientCode: 'P-0001',
    org: '国家癌症中心',
    modality: '患者基本信息',
    alignType: '标识',
    standard: '统一主索引（PMI）+ 人口学字段字典（GB/T 2261.1）',
    status: '已校验',
    operator: '国家癌症中心 · 数据治理岗',
    updatedAt: '2026-08-12',
    txHash: '0x3b71e9c4a208',
    checks: [
      { name: '主索引', pass: true, detail: '已映射至统一 PMI=P-0001' },
      { name: '性别编码', pass: true, detail: '统一为 GB/T 2261.1 编码' },
      { name: '出生日期精度', pass: true, detail: '保留年月精度，未补日' },
      { name: '吸烟包年', pass: true, detail: '按公式量化，未杜撰数值' },
    ],
    records: [
      // —— 患者身份 ——
      rec({ category: '患者身份', sourceOrg: '国家癌症中心', sourceField: '病案号', sourceType: 'string', sourceValue: 'NCC-2026-0831', standardField: '统一主索引(PMI)', standardType: 'code', ruleId: 'MPI_MAP', res: mapMPI({ localId: 'NCC-2026-0831', org: '国家癌症中心', candidates: ['P-0001'] }), processTime: '2026-08-12 09:16', operator: '国家癌症中心 · 数据治理岗' }),
      rec({ category: '患者身份', sourceOrg: '国家癌症中心', sourceField: '病理编号', sourceType: 'string', sourceValue: 'P-2024-118', standardField: '病理编号（溯源键）', standardType: 'string', ruleId: 'PASS_THROUGH', res: mapPassthrough('P-2024-118'), processTime: '2026-08-12 09:16', operator: '国家癌症中心 · 数据治理岗' }),
      rec({ category: '患者身份', sourceOrg: '国家癌症中心', sourceField: '主索引', sourceType: 'code', sourceValue: 'P-0001', standardField: '统一主索引(PMI)', standardType: 'code', ruleId: 'MPI_MAP', res: mapMPI({ localId: 'P-0001', org: '国家癌症中心', candidates: ['P-0001'] }), processTime: '2026-08-12 09:16', operator: '国家癌症中心 · 数据治理岗' }),
      // —— 人口学 ——
      rec({ category: '人口学', sourceOrg: '国家癌症中心', sourceField: '性别', sourceType: 'string', sourceValue: '男', standardField: '性别', standardType: 'code(GB/T 2261.1)', ruleId: 'SEX_GBT2261', res: mapSex('男'), processTime: '2026-08-12 09:14', operator: '国家癌症中心 · 数据治理岗' }),
      rec({ category: '人口学', sourceOrg: '国家癌症中心', sourceField: '年龄', sourceType: 'number', sourceValue: '58', standardField: '年龄（确诊时）', standardType: 'number', ruleId: 'AGE_SNAPSHOT', res: mapAge('58'), processTime: '2026-08-12 09:14', operator: '国家癌症中心 · 数据治理岗' }),
      rec({ category: '人口学', sourceOrg: '国家癌症中心', sourceField: '出生年份', sourceType: 'year', sourceValue: '1968', standardField: '出生年份', standardType: 'year', ruleId: 'BIRTH_YEAR', res: mapBirth('1968'), processTime: '2026-08-12 09:14', operator: '国家癌症中心 · 数据治理岗' }),
      // —— 时间 ——
      rec({ category: '时间', sourceOrg: '国家癌症中心', sourceField: '初诊日期', sourceType: 'date(YMD)', sourceValue: '2024-03-15', standardField: '初诊日期', standardType: 'date(YMD)', ruleId: 'BIRTH_PRECISION', res: mapBirth('2024-03-15'), processTime: '2026-08-12 09:15', operator: '国家癌症中心 · 数据治理岗' }),
      rec({ category: '时间', sourceOrg: '国家癌症中心', sourceField: '检查日期', sourceType: 'date(YMD)', sourceValue: '2024-03-10', standardField: '检查日期', standardType: 'date(YMD)', ruleId: 'BIRTH_PRECISION', res: mapBirth('2024-03-10'), processTime: '2026-08-12 09:15', operator: '国家癌症中心 · 数据治理岗' }),
      // —— 疾病 ——
      rec({ category: '疾病', sourceOrg: '国家癌症中心', sourceField: '疾病名称', sourceType: 'string', sourceValue: '食管鳞癌', standardField: '疾病名称', standardType: 'ICD-10 C15', ruleId: 'DISEASE_NAME', res: mapDiseaseName('食管鳞癌'), processTime: '2026-08-12 09:15', operator: '国家癌症中心 · 数据治理岗' }),
      rec({ category: '疾病', sourceOrg: '国家癌症中心', sourceField: '病理类型', sourceType: 'string', sourceValue: '鳞癌', standardField: '病理类型', standardType: 'ICD-O-3', ruleId: 'PATH_TYPE', res: mapPathType('鳞癌'), processTime: '2026-08-12 09:15', operator: '国家癌症中心 · 数据治理岗' }),
      // —— 分期 ——
      rec({ category: '分期', sourceOrg: '国家癌症中心', sourceField: 'cTNM', sourceType: 'string', sourceValue: 'cT2N0M0', standardField: 'cTNM', standardType: 'AJCC 第8版', ruleId: 'TNM_VERSION', res: mapTnm('cT2N0M0'), processTime: '2026-08-12 09:15', operator: '国家癌症中心 · 数据治理岗' }),
      rec({ category: '分期', sourceOrg: '国家癌症中心', sourceField: 'pTNM', sourceType: 'string', sourceValue: 'pT1N0M0', standardField: 'pTNM', standardType: 'AJCC 第8版', ruleId: 'TNM_VERSION', res: mapTnm('pT1N0M0'), processTime: '2026-08-12 09:15', operator: '国家癌症中心 · 数据治理岗' }),
      // —— 既往史 ——
      rec({ category: '既往史', sourceOrg: '国家癌症中心', sourceField: '高血压', sourceType: 'enum(有/无)', sourceValue: '有', standardField: '既往史（阳性/阴性）', standardType: 'enum', ruleId: 'HISTORY_YESNO', res: mapHistoryYesNo('有'), processTime: '2026-08-12 09:16', operator: '国家癌症中心 · 数据治理岗' }),
      rec({ category: '既往史', sourceOrg: '国家癌症中心', sourceField: '吸烟史', sourceType: 'free-text', sourceValue: '吸烟30年，1包/天', standardField: '吸烟包年', standardType: 'number(包年)', ruleId: 'SMOKING_PACKYEAR', res: mapSmoking('吸烟30年，1包/天'), processTime: '2026-08-12 09:15', operator: '国家癌症中心 · 数据治理岗' }),
      rec({ category: '既往史', sourceOrg: '国家癌症中心', sourceField: '过敏史', sourceType: 'free-text', sourceValue: '青霉素过敏', standardField: '过敏史（结构化）', standardType: 'enum+过敏原', ruleId: 'ALLERGY_STRUCT', res: mapAllergy('青霉素过敏'), processTime: '2026-08-12 09:16', operator: '国家癌症中心 · 数据治理岗' }),
    ],
    quality: [
      { dimension: '必填缺失', level: 'warn', message: '无缺失必填字段', autoPass: true },
      { dimension: '日期格式错误', level: 'warn', message: '出生日期格式合法（年月精度）', autoPass: true },
      { dimension: '数值超范围', level: 'warn', message: '吸烟包年 30 在合理范围', autoPass: true },
      { dimension: '转换规则缺失', level: 'warn', message: '全部字段均匹配到有效规则', autoPass: true },
    ],
    conflicts: [],
    review: { open: false, reason: '', logs: [{ time: '2026-08-12 09:16', operator: '国家癌症中心 · 数据治理岗', action: '自动对齐通过', note: '无冲突、无歧义' }] },
  },
  {
    id: 'AL-13',
    resourceId: 'D-P0001-ST',
    resourceTitle: '患者人口学基本信息（省肿瘤医院报送）',
    patientCode: 'P-0001',
    org: '省肿瘤医院',
    modality: '患者基本信息',
    alignType: '标识',
    standard: '统一主索引（PMI）+ 人口学字段字典（GB/T 2261.1）',
    status: '待对齐',
    operator: '省肿瘤医院 · 数据治理岗',
    updatedAt: '2026-08-21',
    checks: [
      { name: '主索引', pass: false, detail: '本地编码匹配到 2 个候选 PMI，待人工甄别' },
      { name: '性别编码', pass: true, detail: 'gender=M 已映射至男性' },
      { name: '出生日期', pass: false, detail: '与国家癌症中心报送的出生年月不一致（跨中心冲突）' },
      { name: '吸烟包年', pass: false, detail: '原始仅含年限，缺日吸烟量，禁止推算' },
    ],
    records: [
      rec({ category: '人口学', sourceOrg: '省肿瘤医院', sourceField: 'gender', sourceType: 'string', sourceValue: 'M', standardField: '性别', standardType: 'code(GB/T 2261.1)', ruleId: 'SEX_GBT2261', res: mapSex('M'), processTime: '2026-08-21 10:02', operator: '省肿瘤医院 · 数据治理岗' }),
      rec({ category: '人口学', sourceOrg: '省肿瘤医院', sourceField: 'birth_year', sourceType: 'year', sourceValue: '1965', standardField: '出生年份', standardType: 'year', ruleId: 'BIRTH_YEAR', res: mapBirth('1965'), processTime: '2026-08-21 10:02', operator: '省肿瘤医院 · 数据治理岗' }),
      rec({ category: '既往史', sourceOrg: '省肿瘤医院', sourceField: '吸烟史', sourceType: 'free-text', sourceValue: '吸烟40年', standardField: '吸烟包年', standardType: 'number(包年)', ruleId: 'SMOKING_PACKYEAR', res: mapSmoking('吸烟40年'), processTime: '2026-08-21 10:03', operator: '省肿瘤医院 · 数据治理岗' }),
      rec({ category: '患者身份', sourceOrg: '省肿瘤医院', sourceField: '病案号', sourceType: 'string', sourceValue: 'ST-2026-0427', standardField: '统一主索引(PMI)', standardType: 'code', ruleId: 'MPI_MAP', res: mapMPI({ localId: 'ST-2026-0427', org: '省肿瘤医院', candidates: ['P-0001', 'P-0002'] }), processTime: '2026-08-21 10:04', operator: '省肿瘤医院 · 数据治理岗' }),
    ],
    quality: [
      { dimension: '跨中心冲突', level: 'error', message: '出生年份：国家癌症中心=1968，省肿瘤医院=1965', autoPass: false },
      { dimension: '必填缺失', level: 'error', message: '吸烟史缺日吸烟量，无法计算包年', autoPass: false },
      { dimension: '转换规则缺失', level: 'error', message: '病案号匹配到多个候选 PMI，无唯一关联依据', autoPass: false },
    ],
    conflicts: [
      {
        field: '出生年份',
        values: [
          { org: '国家癌症中心', value: '1968' },
          { org: '省肿瘤医院', value: '1965' },
        ],
        severity: 'high',
        note: '两中心出生年份相差约 3 年，须人工核对原始证件后裁决，不得自动取其一。',
      },
    ],
    review: {
      open: true,
      reason: '①出生年份跨中心冲突；②吸烟史缺日吸烟量禁止推算；③病案号匹配到多个候选 PMI。均不满足自动通过条件。',
      candidates: ['P-0001', 'P-0002'],
      resolution: undefined,
      logs: [{ time: '2026-08-21 10:04', operator: '省肿瘤医院 · 数据治理岗', action: '提交待确认', note: '自动对齐暂停，转人工' }],
    },
  },
]

// 对齐映射链路：记录每条原始数据如何被规则引擎对齐到统一标准（"怎么对齐"的可视化来源）
export const alignMappings: Record<string, AlignMappingItem[]> = {
  'AL-1': [
    { field: '病变部位', raw: '距门齿 28 cm', mapped: '食管胸中段', code: 'C15.4', result: 'ok' },
    { field: 'Lugol 染色', raw: '染色不着色区', mapped: '碘染色阴性（不典型上皮）', result: 'ok' },
    { field: '病变分型', raw: 'Ⅱb 型浅表平坦', mapped: 'Paris Ⅱb 型', code: 'ParisⅡb', result: 'ok' },
  ],
  'AL-2': [
    { field: '层厚', raw: '5 mm', mapped: '1 mm 各向同性', result: 'fixed', issue: '原层厚不满足联合建模体素一致性要求' },
    { field: '坐标系', raw: 'RAS', mapped: 'LPS', result: 'fixed', issue: '翻转坐标轴向至标准坐标系' },
    { field: '窗技术', raw: '默认纵隔窗', mapped: '纵隔窗 W:350 L:40', result: 'ok' },
  ],
  'AL-3': [
    { field: 'SUV 校正', raw: 'SUVmax 11.2（瘦体重）', mapped: 'SUVmax 11.2（体重校正）', result: 'fixed', issue: '统一为按体重校正口径' },
    { field: '代谢标准', raw: 'Deauville 4', mapped: 'PERCIST 部分代谢缓解（PMR）', result: 'fixed', issue: 'Deauville→PERCIST 1.0 术语映射' },
  ],
  'AL-4': [
    { field: '组织学类型', raw: '鳞状细胞癌', mapped: '食管鳞状细胞癌', code: '8070/3', result: 'ok' },
    { field: '分化程度', raw: '中分化', mapped: 'G2', result: 'ok' },
    { field: 'TNM 版本', raw: 'T2N0M0（AJCC 第7版）', mapped: 'T2N0M0（AJCC 第8版）', result: 'fixed', issue: '分期版本升级' },
  ],
  'AL-6': [
    { field: '原始报告', raw: '食管距门齿28cm见约2.5cm粘膜隆起', mapped: '部位=胸中段；大小=2.5cm；形态=粘膜隆起', result: 'blocked', issue: '自由文本未结构化抽取' },
    { field: '部位分段', raw: '距门齿 28 cm', mapped: '食管胸中段', code: 'C15.4', result: 'fixed', issue: '映射至标准解剖分段' },
    { field: 'Lugol', raw: '不着色', mapped: '碘染色阴性', result: 'ok' },
  ],
  'AL-7': [
    { field: '层厚', raw: '5 mm', mapped: '1 mm 各向同性', result: 'blocked', issue: '重采样任务进行中' },
    { field: '坐标系', raw: 'RAS', mapped: 'LPS', result: 'ok' },
  ],
  'AL-8': [
    { field: '时间点', raw: '术后第3天 / 随访3月', mapped: '基线=术前；术后=+3d；随访1=+90d', result: 'blocked', issue: '时间轴未归并至统一随访节点' },
  ],
  'AL-10': [
    { field: '组织学类型', raw: '鳞癌', mapped: '食管鳞状细胞癌', code: '8070/3', result: 'blocked', issue: '院内简称待映射至标准术语' },
    { field: 'TNM 版本', raw: 'T1N0M0', mapped: 'T1N0M0（AJCC 第8版）', result: 'fixed', issue: '分期版本待统一' },
  ],
  'AL-11': [
    { field: '检验项目', raw: '白细胞计数', mapped: '白细胞计数', code: 'LP15533-4', result: 'ok' },
    { field: '单位换算', raw: '血红蛋白 13.5 g/dl', mapped: '血红蛋白 135 g/L', result: 'fixed', issue: '单位换算 g/dl → g/L' },
    { field: '参考区间', raw: 'CEA 5.2 ng/ml（本院区间 0–5）', mapped: 'CEA 5.2 ng/ml（标准区间 0–5）', result: 'blocked', issue: '跨院参考区间口径不一致' },
  ],
  'AL-12': [
    { field: '病案号', raw: 'NCC-2026-0831', mapped: 'PMI P-0001', code: 'P-0001', result: 'ok' },
    { field: '病理编号', raw: 'P-2024-118', mapped: 'P-2024-118（溯源键）', result: 'ok', issue: '源标识原值保留' },
    { field: '主索引', raw: 'P-0001', mapped: 'PMI P-0001', code: 'P-0001', result: 'ok' },
    { field: '性别', raw: '男', mapped: '男性', code: '1', result: 'ok' },
    { field: '年龄', raw: '58', mapped: '58 岁（确诊时）', result: 'fixed', issue: '统一为确诊时快照口径' },
    { field: '出生年份', raw: '1968', mapped: '1968', result: 'ok', issue: '保留年精度，未补月/补日' },
    { field: '初诊日期', raw: '2024-03-15', mapped: '2024-03-15', result: 'ok' },
    { field: '检查日期', raw: '2024-03-10', mapped: '2024-03-10', result: 'ok' },
    { field: '疾病名称', raw: '食管鳞癌', mapped: '食管鳞状细胞癌', code: 'C15', result: 'fixed', issue: '别称归一为标准术语' },
    { field: '病理类型', raw: '鳞癌', mapped: '鳞状细胞癌', code: '8070/3', result: 'fixed', issue: '简称归一并赋 ICD-O-3 码' },
    { field: 'cTNM', raw: 'cT2N0M0', mapped: 'cT2N0M0（AJCC 第8版）', result: 'fixed', issue: '补标注分期版本' },
    { field: 'pTNM', raw: 'pT1N0M0', mapped: 'pT1N0M0（AJCC 第8版）', result: 'fixed', issue: '补标注分期版本' },
    { field: '高血压', raw: '有', mapped: '阳性', result: 'ok' },
    { field: '吸烟史', raw: '吸烟30年，1包/天', mapped: '30 包年', result: 'fixed', issue: '包年=1包/天 × 30年=30；原始信息完整' },
    { field: '过敏史', raw: '青霉素过敏', mapped: '阳性；过敏原：青霉素', result: 'fixed', issue: '结构化：有过敏史并记录过敏原' },
  ],
  'AL-13': [
    { field: 'gender', raw: 'M', mapped: '男性', code: '1', result: 'ok' },
    { field: 'birth_year', raw: '1965', mapped: '', result: 'blocked', issue: '与国家癌症中心(1968)存在跨中心冲突，待人工裁决' },
    { field: '吸烟史', raw: '吸烟40年', mapped: '', result: 'blocked', issue: '缺失日吸烟量，禁止推算包年' },
    { field: '病案号', raw: 'ST-2026-0427', mapped: '', result: 'blocked', issue: '匹配到多个候选 PMI，无唯一关联依据' },
  ],
}

export function getAllAlignments(): AlignmentTask[] {
  return alignmentTasks.map((t) => ({ ...t, mappings: alignMappings[t.id] ?? [] }))
}
