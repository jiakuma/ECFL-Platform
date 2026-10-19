/* ============================================================
   数据治理 Mock 层：多中心结构化数据接入 → 标准化 → 质量检测
   A：传统 HIS/LIS 数据库风格（大写下划线）
   B：业务系统 / JSON 接口风格（小驼峰）
   C：FHIR 标准接口风格（下划线 + 语义化编码）
   本期仅处理结构化文本数据，影像仅保留入口
   ============================================================ */

/* ---------------- 一、数据源 ---------------- */
export type SourceStatus = '正常' | '同步中' | '同步异常' | '暂未开放'

export interface DataSourceRow {
  id: string
  name: string
  org: string
  system: string
  dataType: string
  access: string
  records: string
  lastSync: string
  status: SourceStatus
  imaging?: boolean
}

export const dataSources: DataSourceRow[] = [
  // 解放军总医院（牵头医院）：数据库直连
  { id: 'DS-A-HIS', name: '解放军总医院 HIS', org: '解放军总医院', system: 'HIS 数据库', dataType: '患者基本信息', access: '数据库直连', records: '185', lastSync: '2026-10-07 08:30', status: '正常' },
  { id: 'DS-A-LIS', name: '解放军总医院 LIS', org: '解放军总医院', system: 'LIS 系统', dataType: '检验数据', access: '数据库直连', records: '2,340', lastSync: '2026-10-07 08:32', status: '正常' },
  { id: 'DS-A-FU', name: '解放军总医院随访库', org: '解放军总医院', system: '随访管理系统', dataType: '随访 / 生存信息', access: '数据库直连', records: '96', lastSync: '2026-10-07 08:33', status: '同步异常' },
  // 中日友好医院：业务接口接入
  { id: 'DS-B-HIS', name: '中日友好医院 HIS', org: '中日友好医院', system: 'HIS 数据库', dataType: '患者基本信息', access: 'API', records: '142', lastSync: '2026-10-07 08:30', status: '正常' },
  { id: 'DS-B-LIS', name: '中日友好医院 LIS', org: '中日友好医院', system: 'LIS 系统', dataType: '检验数据', access: 'API', records: '1,876', lastSync: '2026-10-07 08:32', status: '正常' },
  { id: 'DS-B-FU', name: '中日友好医院随访库', org: '中日友好医院', system: '随访管理系统', dataType: '随访 / 生存信息', access: 'API', records: '88', lastSync: '2026-10-07 08:33', status: '正常' },
  // 肿瘤医院：FHIR 标准接口接入
  { id: 'DS-C-HIS', name: '肿瘤医院 HIS', org: '肿瘤医院', system: 'HIS 数据库', dataType: '患者基本信息', access: 'FHIR API', records: '96', lastSync: '2026-10-07 08:31', status: '正常' },
  { id: 'DS-C-LIS', name: '肿瘤医院 LIS', org: '肿瘤医院', system: 'LIS 系统', dataType: '检验数据', access: 'FHIR API', records: '1,204', lastSync: '2026-10-07 08:31', status: '同步异常' },
  { id: 'DS-C-FU', name: '肿瘤医院随访库', org: '肿瘤医院', system: '随访管理系统', dataType: '随访 / 生存信息', access: 'FHIR API', records: '64', lastSync: '2026-10-07 08:31', status: '正常' },
  // 影像类本期仅保留入口
  { id: 'DS-IMG-CT', name: 'CT 影像库', org: '影像中心', system: 'PACS', dataType: 'CT', access: '—', records: '—', lastSync: '—', status: '暂未开放', imaging: true },
  { id: 'DS-IMG-PET', name: 'PET-CT 影像库', org: '影像中心', system: 'PACS', dataType: 'PET-CT', access: '—', records: '—', lastSync: '—', status: '暂未开放', imaging: true },
  { id: 'DS-IMG-EDO', name: '内镜影像库', org: '内镜中心', system: '内镜工作站', dataType: '内镜', access: '—', records: '—', lastSync: '—', status: '暂未开放', imaging: true },
  { id: 'DS-IMG-PATH', name: '病理切片库', org: '病理科', system: '数字病理系统', dataType: '病理切片', access: '—', records: '—', lastSync: '—', status: '暂未开放', imaging: true },
]

/* ---------------- 一·B 原始数据（列名 = 机构登记的源字段，与字段映射页严格对齐；仅保留 2 名患者样例） ---------------- */
export type RawRow = Record<string, string>

export interface RawDataSet {
  sourceId: string
  /** 源系统真实字段名，同时作为表格列名（必须与 orgSourceFields 登记的源字段一致） */
  columns: string[]
  rows: RawRow[]
}

export const rawDataSets: RawDataSet[] = [
  // 解放军总医院 HIS —— 患者基本信息（源字段：基本信息 12 项）
  {
    sourceId: 'DS-A-HIS',
    columns: [
      'PATIENT_ID', 'PATIENT_NAME', 'SEX_CODE', 'AGE', 'ID_CARD_NO', 'NATIVE_PLACE',
      'ADDRESS', 'PHONE_NO', 'NATION_CODE', 'MARRIAGE_CODE', 'EDU_CODE', 'INSURANCE_TYPE',
    ],
    rows: [
      {
        PATIENT_ID: '0002781', PATIENT_NAME: '王*明', SEX_CODE: '1', AGE: '65',
        ID_CARD_NO: '110105196103****1234', NATIVE_PLACE: '北京市朝阳区',
        ADDRESS: '北京市朝阳区建国路15号', PHONE_NO: '138****2216',
        NATION_CODE: '01', MARRIAGE_CODE: '2', EDU_CODE: '5', INSURANCE_TYPE: '1',
      },
      {
        PATIENT_ID: '0002792', PATIENT_NAME: '李*华', SEX_CODE: '2', AGE: '58',
        ID_CARD_NO: '130102196802****5678', NATIVE_PLACE: '河北省石家庄市',
        ADDRESS: '河北省石家庄市长安区中山东路200号', PHONE_NO: '139****8835',
        NATION_CODE: '01', MARRIAGE_CODE: '2', EDU_CODE: '3', INSURANCE_TYPE: '3',
      },
    ],
  },
  // 解放军总医院 LIS —— 检验数据（源字段：血检肿瘤标志物 + 实验室检测）
  {
    sourceId: 'DS-A-LIS',
    columns: [
      'PATIENT_ID', 'LAB_NO', 'LAB_DATE', 'CEA', 'SCC', 'CA199', 'CYFRA211', 'CA724',
      'AFP', 'CA125', 'NSE', 'HBSAG', 'ANTI_HCV', 'HP_TEST',
      'GLU', 'TG', 'CHOL', 'HDL', 'LDL', 'PG1', 'PGR', 'G17',
    ],
    rows: [
      {
        PATIENT_ID: '0002781', LAB_NO: 'LAB2026091201', LAB_DATE: '20260912',
        CEA: '4.8', SCC: '2.1', CA199: '35.6', CYFRA211: '3.2', CA724: '1.8',
        AFP: '3.9', CA125: '12.4', NSE: '6.5',
        HBSAG: '0', ANTI_HCV: '0', HP_TEST: '1',
        GLU: '104', TG: '1.35', CHOL: '4.6', HDL: '1.12', LDL: '2.48',
        PG1: '18.6', PGR: '4.2', G17: '3.1',
      },
      {
        PATIENT_ID: '0002792', LAB_NO: 'LAB2026091802', LAB_DATE: '20260918',
        CEA: '6.2', SCC: '1.4', CA199: '52.3', CYFRA211: '4.8', CA724: '2.6',
        AFP: '4.5', CA125: '15.1', NSE: '7.8',
        HBSAG: '1', ANTI_HCV: '0', HP_TEST: '0',
        GLU: '112', TG: '1.62', CHOL: '5.3', HDL: '1.35', LDL: '3.05',
        PG1: '22.4', PGR: '5.1', G17: '2.6',
      },
    ],
  },
  // 解放军总医院随访库 —— 随访 / 生存信息（源字段：随访 + 生存与预后）
  {
    sourceId: 'DS-A-FU',
    columns: [
      'PATIENT_ID', 'FU_NO', 'FU_DATE', 'FU_TIMES', 'FU_STATE', 'DEATH_DATE',
      'RECUR_FLAG', 'RECUR_DATE', 'LAST_FU_DATE', 'OS_DAYS', 'OS_CENSOR', 'DFS_DAYS',
    ],
    rows: [
      {
        PATIENT_ID: '0002781', FU_NO: 'FU2026001', FU_DATE: '20260901', FU_TIMES: '3',
        FU_STATE: '1', DEATH_DATE: '', RECUR_FLAG: '0', RECUR_DATE: '',
        LAST_FU_DATE: '20260901', OS_DAYS: '420', OS_CENSOR: '0', DFS_DAYS: '420',
      },
      {
        PATIENT_ID: '0002792', FU_NO: 'FU2026002', FU_DATE: '20260815', FU_TIMES: '2',
        FU_STATE: '3', DEATH_DATE: '20260510', RECUR_FLAG: '1', RECUR_DATE: '20250320',
        LAST_FU_DATE: '20260815', OS_DAYS: '680', OS_CENSOR: '1', DFS_DAYS: '610',
      },
    ],
  },
  // 中日友好医院 EMR —— 诊断信息（源字段：诊断与分期 + 病理检查）
  // 中日友好医院 HIS —— 患者基本信息（源字段：基本信息，小驼峰命名）
  {
    sourceId: 'DS-B-HIS',
    columns: [
      'patientNo', 'patientName', 'gender', 'patientAge', 'nativePlace', 'address',
      'nation', 'marriage', 'education', 'insuranceType',
    ],
    rows: [
      {
        patientNo: 'ZRY-0001', patientName: '王*明', gender: '男', patientAge: '65.0',
        nativePlace: '北京市朝阳区', address: '北京市朝阳区建国路15号',
        nation: '01', marriage: '20', education: '5', insuranceType: 'URBAN_EMP',
      },
      {
        patientNo: 'ZRY-0002', patientName: '李*华', gender: '女', patientAge: '58.0',
        nativePlace: '河北省石家庄市', address: '河北省石家庄市长安区中山东路200号',
        nation: '01', marriage: '20', education: '3', insuranceType: 'NCMS',
      },
    ],
  },
  // 中日友好医院 LIS —— 检验数据（源字段：血检肿瘤标志物 + 实验室检测）
  {
    sourceId: 'DS-B-LIS',
    columns: [
      'patientNo', 'labNo', 'labDate',
      'cea', 'scc', 'ca199', 'cyfra211', 'ca724', 'afp', 'ca125', 'nse',
      'hbsag', 'antiHcv', 'hpTest', 'fbg', 'tg', 'chol', 'hdl', 'ldl',
    ],
    rows: [
      {
        patientNo: 'ZRY-0001', labNo: 'LAB2026091201', labDate: '2026/09/12',
        cea: '4.8', scc: '2.1', ca199: '35.6', cyfra211: '3.2', ca724: '1.8',
        afp: '3.9', ca125: '12.4', nse: '6.5',
        hbsag: 'NEG', antiHcv: 'NEG', hpTest: 'POS',
        fbg: '5.8', tg: '1.35', chol: '4.6', hdl: '1.12', ldl: '2.48',
      },
      {
        patientNo: 'ZRY-0002', labNo: 'LAB2026091802', labDate: '2026/09/18',
        cea: '6.2', scc: '1.4', ca199: '52.3', cyfra211: '4.8', ca724: '2.6',
        afp: '4.5', ca125: '15.1', nse: '7.8',
        hbsag: 'POS', antiHcv: 'NEG', hpTest: 'NEG',
        fbg: '6.2', tg: '1.62', chol: '5.3', hdl: '1.35', ldl: '3.05',
      },
    ],
  },
  // 中日友好医院随访库 —— 随访 / 生存信息（源字段：随访 + 生存与预后）
  {
    sourceId: 'DS-B-FU',
    columns: [
      'patientNo', 'fuNo', 'fuDate', 'fuTimes', 'fuStatus',
      'recurFlag', 'recurDate', 'lastFuDate', 'osDays', 'osCensor',
    ],
    rows: [
      {
        patientNo: 'ZRY-0001', fuNo: 'FU2026001', fuDate: '2026/09/01', fuTimes: '3',
        fuStatus: 'ALIVE', recurFlag: 'false', recurDate: '', lastFuDate: '2026/09/01',
        osDays: '420', osCensor: '0',
      },
      {
        patientNo: 'ZRY-0002', fuNo: 'FU2026002', fuDate: '2026/08/15', fuTimes: '2',
        fuStatus: 'DEAD', recurFlag: 'true', recurDate: '2025/03/20', lastFuDate: '2026/08/15',
        osDays: '680', osCensor: '1',
      },
    ],
  },
  // 肿瘤医院 HIS —— 患者基本信息（源字段：基本信息，下划线 + 语义化命名）
  {
    sourceId: 'DS-C-HIS',
    columns: [
      'patient_id', 'patient_name', 'sex_at_birth', 'age', 'birth_place', 'address_line',
      'telecom', 'ethnicity', 'marital_status', 'education_level', 'insurance',
    ],
    rows: [
      {
        patient_id: 'ZLY-0001', patient_name: '王*明', sex_at_birth: 'male', age: '65',
        birth_place: '北京市朝阳区', address_line: '北京市朝阳区建国路15号',
        telecom: '138****2216', ethnicity: '汉族', marital_status: 'M', education_level: '5',
        insurance: 'URBAN_EMP',
      },
      {
        patient_id: 'ZLY-0002', patient_name: '李*华', sex_at_birth: 'female', age: '58',
        birth_place: '河北省石家庄市', address_line: '河北省石家庄市长安区中山东路200号',
        telecom: '139****8835', ethnicity: '汉族', marital_status: 'M', education_level: '3',
        insurance: 'NCMS',
      },
    ],
  },
  // 肿瘤医院 LIS —— 检验数据（源字段：血检肿瘤标志物 + 实验室检测，LOINC 观测项）
  {
    sourceId: 'DS-C-LIS',
    columns: [
      'patient_id', 'lab_id', 'lab_date',
      'obs_cea', 'obs_scc', 'obs_ca199', 'obs_cyfra211', 'obs_ca724', 'obs_afp', 'obs_ca125', 'obs_nse',
      'obs_hbsag', 'obs_anti_hcv', 'obs_hp', 'obs_glu', 'obs_tg', 'obs_chol', 'obs_hdl', 'obs_ldl',
    ],
    rows: [
      {
        patient_id: 'ZLY-0001', lab_id: 'LAB2026091201', lab_date: '2026-09-12',
        obs_cea: '4.8', obs_scc: '2.1', obs_ca199: '35.6', obs_cyfra211: '3.2', obs_ca724: '1.8',
        obs_afp: '3.9', obs_ca125: '12.4', obs_nse: '6.5',
        obs_hbsag: 'negative', obs_anti_hcv: 'negative', obs_hp: 'positive',
        obs_glu: '104', obs_tg: '1.35', obs_chol: '4.6', obs_hdl: '1.12', obs_ldl: '2.48',
      },
      {
        patient_id: 'ZLY-0002', lab_id: 'LAB2026091802', lab_date: '2026-09-18',
        obs_cea: '6.2', obs_scc: '1.4', obs_ca199: '52.3', obs_cyfra211: '4.8', obs_ca724: '2.6',
        obs_afp: '4.5', obs_ca125: '15.1', obs_nse: '7.8',
        obs_hbsag: 'positive', obs_anti_hcv: 'negative', obs_hp: 'negative',
        obs_glu: '112', obs_tg: '1.62', obs_chol: '5.3', obs_hdl: '1.35', obs_ldl: '3.05',
      },
    ],
  },
  // 肿瘤医院随访库 —— 随访 / 生存信息（源字段：随访 + 生存与预后）
  {
    sourceId: 'DS-C-FU',
    columns: [
      'patient_id', 'followup_id', 'followup_date', 'followup_seq', 'vital_status',
      'recurrence_status', 'recurrence_date', 'last_followup_date', 'os_days', 'os_censor',
    ],
    rows: [
      {
        patient_id: 'ZLY-0001', followup_id: 'FU2026001', followup_date: '2026-09-01',
        followup_seq: '3', vital_status: 'alive', recurrence_status: 'none',
        recurrence_date: '', last_followup_date: '2026-09-01', os_days: '420', os_censor: '0',
      },
      {
        patient_id: 'ZLY-0002', followup_id: 'FU2026002', followup_date: '2026-08-15',
        followup_seq: '2', vital_status: 'dead', recurrence_status: 'relapse',
        recurrence_date: '2025-03-20', last_followup_date: '2026-08-15', os_days: '680', os_censor: '1',
      },
    ],
  },
]

export function getRawDataSet(sourceId: string): RawDataSet | undefined {
  return rawDataSets.find((d) => d.sourceId === sourceId)
}


/* ---------------- 四、数据质量 ---------------- */
export type Severity = '高' | '中' | '低'
export type QualityStatus = '待处理' | '处理中' | '已修复'

export interface QualityIssueRow {
  id: string
  org: string
  dataType: string
  field: string
  issueType: string
  count: number
  severity: Severity
  status: QualityStatus
}

export const qualityIssues: QualityIssueRow[] = [
  { id: 'QA-01', org: '解放军总医院', dataType: '患者基本信息', field: 'PATIENT_ID', issueType: '重复数据', count: 5, severity: '高', status: '待处理' },
  { id: 'QA-02', org: '解放军总医院', dataType: '患者基本信息', field: 'BIRTH_DATE', issueType: '格式错误', count: 12, severity: '中', status: '已修复' },
  { id: 'QA-03', org: '解放军总医院', dataType: '检验数据', field: 'RESULT_UNIT', issueType: '单位不一致', count: 46, severity: '高', status: '处理中' },
  { id: 'QA-04', org: '解放军总医院', dataType: '随访 / 生存信息', field: 'FOLLOWUP_DAYS', issueType: '缺失值', count: 9, severity: '低', status: '待处理' },
  { id: 'QA-05', org: '中日友好医院', dataType: '诊断信息', field: 'icdCode', issueType: '编码不规范', count: 23, severity: '高', status: '待处理' },
  { id: 'QA-06', org: '中日友好医院', dataType: '检验数据', field: 'patientNo', issueType: '主外键关联失败', count: 17, severity: '高', status: '待处理' },
  { id: 'QA-07', org: '中日友好医院', dataType: '患者基本信息', field: 'patientAge', issueType: '值域异常', count: 4, severity: '中', status: '已修复' },
  { id: 'QA-08', org: '中日友好医院', dataType: '随访 / 生存信息', field: 'survivalStatus', issueType: '缺失值', count: 3, severity: '低', status: '已修复' },
  { id: 'QA-09', org: '肿瘤医院', dataType: '诊断信息', field: 'condition_code', issueType: '缺失值', count: 6, severity: '中', status: '已修复' },
  { id: 'QA-10', org: '肿瘤医院', dataType: '随访 / 生存信息', field: 'vital_status', issueType: '值域异常', count: 8, severity: '中', status: '待处理' },
  { id: 'QA-11', org: '肿瘤医院', dataType: '患者基本信息', field: 'birth_date', issueType: '格式错误', count: 2, severity: '低', status: '待处理' },
  { id: 'QA-12', org: '肿瘤医院', dataType: '检验数据', field: 'observation_value', issueType: '重复数据', count: 11, severity: '低', status: '已修复' },
]

/* ---------------- 五、标准数据 ---------------- */
export interface PatientStd {
  patient_id: string
  gender: string
  birth_date: string
  age: number
}
export interface DiagnosisStd {
  diagnosis_id: string
  patient_id: string
  diagnosis_code: string
  diagnosis_name: string
  diagnosis_type: string
  ajcc_stage: string
  t_stage: string
  n_stage: string
  m_stage: string
  tumor_grade: string
}
export interface LabStd {
  patient_id: string
  item_code: string
  item_name: string
  result_value: string
  unit: string
  test_time: string
}
export interface FollowUpStd {
  patient_id: string
  vital_status: string
  recurrence: string
  followup_days: number
  survival_days: number
}

export const stdPatients: PatientStd[] = [
  { patient_id: 'PMI-0001', gender: 'MALE', birth_date: '1961-03-12', age: 65 },
  { patient_id: 'PMI-0002', gender: 'FEMALE', birth_date: '1958-07-12', age: 68 },
  { patient_id: 'PMI-0003', gender: 'MALE', birth_date: '1965-09-21', age: 61 },
  { patient_id: 'PMI-0004', gender: 'MALE', birth_date: '1954-02-08', age: 72 },
  { patient_id: 'PMI-0005', gender: 'FEMALE', birth_date: '1970-11-30', age: 55 },
  { patient_id: 'PMI-0006', gender: 'MALE', birth_date: '1962-05-17', age: 64 },
]

export const stdDiagnoses: DiagnosisStd[] = [
  { diagnosis_id: 'DG-0001', patient_id: 'PMI-0001', diagnosis_code: 'C15.5', diagnosis_name: '食管下段恶性肿瘤', diagnosis_type: '病理确诊', ajcc_stage: 'IIB', t_stage: 'T3', n_stage: 'N1', m_stage: 'M0', tumor_grade: 'G2' },
  { diagnosis_id: 'DG-0002', patient_id: 'PMI-0002', diagnosis_code: 'C15.3', diagnosis_name: '食管上段恶性肿瘤', diagnosis_type: '病理确诊', ajcc_stage: 'IIIA', t_stage: 'T3', n_stage: 'N2', m_stage: 'M0', tumor_grade: 'G2' },
  { diagnosis_id: 'DG-0003', patient_id: 'PMI-0003', diagnosis_code: 'C15.4', diagnosis_name: '食管胸中段恶性肿瘤', diagnosis_type: '临床诊断', ajcc_stage: 'IB', t_stage: 'T2', n_stage: 'N0', m_stage: 'M0', tumor_grade: 'G1' },
  { diagnosis_id: 'DG-0004', patient_id: 'PMI-0004', diagnosis_code: 'C15.9', diagnosis_name: '食管恶性肿瘤', diagnosis_type: '病理确诊', ajcc_stage: 'IIIB', t_stage: 'T3', n_stage: 'N2', m_stage: 'M0', tumor_grade: 'G3' },
  { diagnosis_id: 'DG-0005', patient_id: 'PMI-0005', diagnosis_code: 'C15.5', diagnosis_name: '食管下段恶性肿瘤', diagnosis_type: '病理确诊', ajcc_stage: 'I', t_stage: 'T1', n_stage: 'N0', m_stage: 'M0', tumor_grade: 'G1' },
  { diagnosis_id: 'DG-0006', patient_id: 'PMI-0006', diagnosis_code: 'C15.4', diagnosis_name: '食管胸中段恶性肿瘤', diagnosis_type: '病理确诊', ajcc_stage: 'IIB', t_stage: 'T3', n_stage: 'N1', m_stage: 'M0', tumor_grade: 'G2' },
]

export const stdLabs: LabStd[] = [
  { patient_id: 'PMI-0001', item_code: '1751-7', item_name: '白蛋白', result_value: '35', unit: 'g/L', test_time: '2026-09-12 08:20' },
  { patient_id: 'PMI-0001', item_code: '2345-7', item_name: '葡萄糖', result_value: '5.6', unit: 'mmol/L', test_time: '2026-09-12 08:20' },
  { patient_id: 'PMI-0002', item_code: '1751-7', item_name: '白蛋白', result_value: '38', unit: 'g/L', test_time: '2026-09-18 09:05' },
  { patient_id: 'PMI-0003', item_code: '26453-1', item_name: '红细胞计数', result_value: '4.2', unit: '10⁹/L', test_time: '2026-09-20 07:45' },
  { patient_id: 'PMI-0004', item_code: '1751-7', item_name: '白蛋白', result_value: '32', unit: 'g/L', test_time: '2026-09-25 08:10' },
  { patient_id: 'PMI-0005', item_code: '2345-7', item_name: '葡萄糖', result_value: '5.1', unit: 'mmol/L', test_time: '2026-10-02 08:35' },
  { patient_id: 'PMI-0006', item_code: '1751-7', item_name: '白蛋白', result_value: '36', unit: 'g/L', test_time: '2026-10-05 08:02' },
]

/** 标准数据归属机构（patient_id 前缀 → 机构），用于按当前机构过滤标准数据 */
export const stdPatientOrg: Record<string, string> = {
  'PMI-': '解放军总医院',
  'ZRY-': '中日友好医院',
  'ZLY-': '肿瘤医院',
}

/** patient_id → 归属机构 */
export function orgOfPatient(patientId: string): string | undefined {
  const prefix = Object.keys(stdPatientOrg).find((p) => patientId.startsWith(p))
  return prefix ? stdPatientOrg[prefix] : undefined
}

export const stdFollowUps: FollowUpStd[] = [
  { patient_id: 'PMI-0001', vital_status: 'ALIVE', recurrence: '无', followup_days: 420, survival_days: 420 },
  { patient_id: 'PMI-0002', vital_status: 'ALIVE', recurrence: '有', followup_days: 365, survival_days: 365 },
  { patient_id: 'PMI-0003', vital_status: 'DEAD', recurrence: '有', followup_days: 180, survival_days: 214 },
  { patient_id: 'PMI-0004', vital_status: 'ALIVE', recurrence: '无', followup_days: 730, survival_days: 730 },
  { patient_id: 'PMI-0005', vital_status: 'ALIVE', recurrence: '无', followup_days: 150, survival_days: 150 },
  { patient_id: 'PMI-0006', vital_status: 'DEAD', recurrence: '无', followup_days: 90, survival_days: 132 },
]
