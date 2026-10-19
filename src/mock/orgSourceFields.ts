/* ============================================================
   各机构源字段 —— 仅登记该机构实际提供的字段
   未在此登记的元数据标准字段一律按「未映射」展示，源字段显示 —
   严禁为凑覆盖率虚构机构并不存在的源字段
   ============================================================ */

/** 映射转换规则类型 */
export type RuleType = '直接映射' | '值域映射' | '编码转换' | '编码转换' | '格式转换' | '单位转换'

export interface OrgSourceEntry {
  source: string
  ruleType: RuleType
  rule: string
}

/** 机构 → 标准编码 → 源字段映射 */
export const orgSourceMap: Record<string, Record<string, OrgSourceEntry>> = {
  // ============ 解放军总医院：宽表字段（与「数据源」页展示字段保持一致） ============
  // 仅登记参与宽表构建的 17 个源字段，映射对象即数据源实际抽取的字段
  解放军总医院: {
    // HIS —— 患者基本信息 / 诊断信息
    ID: { source: 'patient_id', ruleType: '直接映射', rule: '去除前导零后写入病案号（脱敏）' },
    NAME: { source: 'patient_name', ruleType: '直接映射', rule: '脱敏后写入（保留姓）' },
    SEX: { source: 'gender', ruleType: '值域映射', rule: '1→男，2→女' },
    AGE: { source: 'age', ruleType: '直接映射', rule: '原值保留' },
    BIRTH_DATE: { source: 'birth_date', ruleType: '格式转换', rule: 'YYYYMMDD → YYYY-MM-DD' },
    DIAG_CODE: { source: 'diagnosis_code', ruleType: '编码转换', rule: 'ICD-10 编码原值保留' },
    DIAG_NAME: { source: 'diagnosis_name', ruleType: '直接映射', rule: '原值保留' },
    STAGE: { source: 'ajcc_stage', ruleType: '编码转换', rule: 'AJCC 第8版总分期校验' },
    // LIS —— 检验数据 / 肿瘤标志物
    CEA: { source: 'cea', ruleType: '单位转换', rule: 'ng/mL 原值保留' },
    SCC: { source: 'scc', ruleType: '单位转换', rule: 'ng/mL 原值保留' },
    CA19_9: { source: 'ca199', ruleType: '编码转换', rule: 'CA199 → 糖类抗原19-9' },
    CYFRA21_1: { source: 'cyfra211', ruleType: '编码转换', rule: 'CYFRA211 → 细胞角蛋白19片段' },
    AFP: { source: 'afp', ruleType: '直接映射', rule: 'ng/mL 原值保留' },
    // 随访库 —— 随访 / 生存信息
    FU_STATUS: { source: 'vital_status', ruleType: '值域映射', rule: '1→存活，2→失访，3→死亡' },
    RECUR_STATUS: { source: 'recurrence', ruleType: '值域映射', rule: '0→无，1→有' },
    FU_DAYS: { source: 'followup_days', ruleType: '直接映射', rule: '天，原值保留' },
    OS: { source: 'survival_days', ruleType: '直接映射', rule: '天，原值保留' },
  },

  // ============ 中日友好医院：业务系统 / JSON 接口风格（小驼峰） ============
  中日友好医院: {
    // 基本信息
    ID: { source: 'patientNo', ruleType: '直接映射', rule: '原值保留' },
    NAME: { source: 'patientName', ruleType: '直接映射', rule: '脱敏后写入（保留姓）' },
    SEX: { source: 'gender', ruleType: '值域映射', rule: '男→男，女→女，M→男，F→女' },
    AGE: { source: 'patientAge', ruleType: '格式转换', rule: '浮点取整' },
    NATIVE: { source: 'nativePlace', ruleType: '直接映射', rule: '原值保留' },
    ADDRESS: { source: 'address', ruleType: '直接映射', rule: '原值保留' },
    ETHNIC: { source: 'nation', ruleType: '编码转换', rule: '民族代码 → 民族名称' },
    MARITAL: { source: 'marriage', ruleType: '值域映射', rule: '10→未婚，20→已婚，30→离异，40→丧偶' },
    EDU: { source: 'education', ruleType: '编码转换', rule: '学历代码 → 教育程度' },
    INSURANCE: { source: 'insuranceType', ruleType: '值域映射', rule: 'URBAN_EMP→城镇职工医保，NCMS→新农合' },
    // 血检肿瘤标志物
    BT_ID: { source: 'labNo', ruleType: '直接映射', rule: '原值保留' },
    BT_DATE: { source: 'labDate', ruleType: '格式转换', rule: '时间戳 → YYYY-MM-DD' },
    CEA: { source: 'cea', ruleType: '单位转换', rule: '统一为 ng/mL' },
    SCC: { source: 'scc', ruleType: '单位转换', rule: '统一为 ng/mL' },
    CA19_9: { source: 'ca199', ruleType: '编码转换', rule: 'ca199 → 糖类抗原19-9' },
    CYFRA21_1: { source: 'cyfra211', ruleType: '编码转换', rule: 'cyfra211 → 细胞角蛋白19片段' },
    CA72_4: { source: 'ca724', ruleType: '编码转换', rule: 'ca724 → 糖类抗原72-4' },
    AFP: { source: 'afp', ruleType: '直接映射', rule: 'ng/mL 原值保留' },
    CA125: { source: 'ca125', ruleType: '直接映射', rule: 'U/mL 原值保留' },
    NSE: { source: 'nse', ruleType: '直接映射', rule: 'ng/mL 原值保留' },
    // 实验室检测
    HBSAG: { source: 'hbsag', ruleType: '值域映射', rule: 'NEG→阴性，POS→阳性' },
    ANTI_HCV: { source: 'antiHcv', ruleType: '值域映射', rule: 'NEG→阴性，POS→阳性' },
    HP_TEST: { source: 'hpTest', ruleType: '值域映射', rule: 'NEG→阴性，POS→阳性' },
    FBG: { source: 'fbg', ruleType: '直接映射', rule: 'mmol/L 原值保留' },
    TG: { source: 'tg', ruleType: '直接映射', rule: 'mmol/L 原值保留' },
    CHOL: { source: 'chol', ruleType: '直接映射', rule: 'mmol/L 原值保留' },
    HDL: { source: 'hdl', ruleType: '直接映射', rule: 'mmol/L 原值保留' },
    LDL: { source: 'ldl', ruleType: '直接映射', rule: 'mmol/L 原值保留' },
    // 体格检查
    HEIGHT: { source: 'height', ruleType: '直接映射', rule: 'cm 原值保留' },
    WEIGHT: { source: 'weight', ruleType: '直接映射', rule: 'kg 原值保留' },
    BMI: { source: 'bmi', ruleType: '直接映射', rule: 'kg/m² 原值保留' },
    WAIST: { source: 'waist', ruleType: '直接映射', rule: 'cm 原值保留' },
    // 内镜检查
    ENDO_ID: { source: 'endoId', ruleType: '直接映射', rule: '原值保留' },
    ENDO_DATE: { source: 'endoDate', ruleType: '格式转换', rule: 'YYYY/MM/DD → YYYY-MM-DD' },
    ANESTHESIA: { source: 'anesthesia', ruleType: '值域映射', rule: 'false→否，true→是' },
    STAIN: { source: 'stainMethod', ruleType: '编码转换', rule: 'LUGOL→卢戈氏碘染色，NBI→电子染色' },
    BIOPSY: { source: 'biopsy', ruleType: '值域映射', rule: 'false→否，true→是' },
    ENDO_LOC: { source: 'lesionLoc', ruleType: '编码转换', rule: 'UPPER→上段，MIDDLE→中段，LOWER→下段' },
    ENDO_N: { source: 'lesionCount', ruleType: '直接映射', rule: '原值保留' },
    DIAG_ENDO: { source: 'endoDiag', ruleType: '直接映射', rule: '原值保留' },
    ENDO_RPT: { source: 'endoReport', ruleType: '直接映射', rule: '原值保留' },
    // 影像学检查
    CT_ID: { source: 'ctNo', ruleType: '直接映射', rule: '原值保留' },
    CT_DATE: { source: 'ctDate', ruleType: '格式转换', rule: 'YYYY/MM/DD → YYYY-MM-DD' },
    CT_TYPE: { source: 'ctType', ruleType: '值域映射', rule: 'PLAIN→平扫，ENHANCE→增强' },
    CT_DIAG: { source: 'ctDiag', ruleType: '直接映射', rule: '原值保留' },
    CT_RPT: { source: 'ctReport', ruleType: '直接映射', rule: '原值保留' },
    CM: { source: 'mStage', ruleType: '编码转换', rule: 'M0/M1/Mx 校验后写入' },
    // 病理检查
    PATH_ID: { source: 'pathNo', ruleType: '直接映射', rule: '原值保留' },
    PATH_DATE: { source: 'pathDate', ruleType: '格式转换', rule: 'YYYY/MM/DD → YYYY-MM-DD' },
    PATH_TYPE: { source: 'specType', ruleType: '值域映射', rule: 'BIOPSY→活检，ESD→内镜下切除（EMR/ESD），SURGERY→手术' },
    HISTO_TYPE: { source: 'histoType', ruleType: '编码转换', rule: 'WHO 分类编码 → 组织学类型' },
    GRADE: { source: 'grade', ruleType: '编码转换', rule: 'G1/G2/G3/Gx 校验后写入' },
    pT: { source: 'ptStage', ruleType: '编码转换', rule: 'AJCC 第8版 pT 校验' },
    pN: { source: 'pnStage', ruleType: '编码转换', rule: 'AJCC 第8版 pN 校验' },
    STAGE: { source: 'tnmStage', ruleType: '编码转换', rule: 'AJCC 第8版总分期校验' },
    LN_EXAM: { source: 'lnExam', ruleType: '直接映射', rule: '原值保留' },
    LN_POS: { source: 'lnPos', ruleType: '直接映射', rule: '原值保留' },
    PATH_CODE: { source: 'pathDiag', ruleType: '编码转换', rule: '院内病理码 → 标准病理诊断编码' },
    // 诊断与分期
    DIAG_DATE: { source: 'diagDate', ruleType: '格式转换', rule: 'YYYY/MM/DD → YYYY-MM-DD' },
    CHIEF_COM: { source: 'chiefComplaint', ruleType: '直接映射', rule: '原值保留（多值用逗号分隔）' },
    DETECT_METHOD: { source: 'findWay', ruleType: '值域映射', rule: 'SCREEN→筛查发现，SYMPTOM→症状就诊，CHECKUP→体检发现' },
    cT: { source: 'ct', ruleType: '编码转换', rule: 'AJCC 第8版 cT 校验' },
    cN: { source: 'cn', ruleType: '编码转换', rule: 'AJCC 第8版 cN 校验' },
    cM_DIAG: { source: 'cm', ruleType: '编码转换', rule: 'M0/M1/Mx 校验后写入' },
    cSTAGE: { source: 'clinStage', ruleType: '编码转换', rule: 'AJCC 第8版临床分期校验' },
    LESION_LEN: { source: 'lesionLength', ruleType: '直接映射', rule: 'cm 原值保留' },
    ECOG: { source: 'ecog', ruleType: '直接映射', rule: '0-4 原值保留' },
    // 随访
    FU_ID: { source: 'fuNo', ruleType: '直接映射', rule: '原值保留' },
    FU_DATE: { source: 'fuDate', ruleType: '格式转换', rule: 'YYYY/MM/DD → YYYY-MM-DD' },
    FU_SEQ: { source: 'fuTimes', ruleType: '直接映射', rule: '原值保留' },
    FU_STATUS: { source: 'fuStatus', ruleType: '值域映射', rule: 'ALIVE→存活，LOST→失访，DEAD→死亡' },
    RECUR_STATUS: { source: 'recurFlag', ruleType: '值域映射', rule: 'false→无，true→有' },
    RECUR_DATE: { source: 'recurDate', ruleType: '格式转换', rule: 'YYYY/MM/DD → YYYY-MM-DD' },
    LAST_FU_DATE: { source: 'lastFuDate', ruleType: '格式转换', rule: 'YYYY/MM/DD → YYYY-MM-DD' },
    // 生存与预后
    OS: { source: 'osDays', ruleType: '直接映射', rule: '天，原值保留' },
    OS_CENSOR: { source: 'osCensor', ruleType: '值域映射', rule: '0→删失，1→死亡' },
  },

  // ============ 肿瘤医院：FHIR 标准接口风格（下划线 + 语义化编码） ============
  肿瘤医院: {
    // 基本信息
    ID: { source: 'patient_id', ruleType: '直接映射', rule: '原值保留' },
    NAME: { source: 'patient_name', ruleType: '直接映射', rule: '脱敏后写入（保留姓）' },
    SEX: { source: 'sex_at_birth', ruleType: '值域映射', rule: 'male→男，female→女' },
    AGE: { source: 'age', ruleType: '直接映射', rule: '原值保留' },
    UID: { source: 'national_id', ruleType: '直接映射', rule: '加密脱敏后写入' },
    NATIVE: { source: 'birth_place', ruleType: '直接映射', rule: '省/市/区县拼接' },
    ADDRESS: { source: 'address_line', ruleType: '直接映射', rule: '原值保留' },
    CELLPHONE: { source: 'telecom', ruleType: '格式转换', rule: '去除 tel: 前缀与分隔符' },
    ETHNIC: { source: 'ethnicity', ruleType: '编码转换', rule: '民族代码 → 民族名称' },
    MARITAL: { source: 'marital_status', ruleType: '编码转换', rule: 'U→未婚，M→已婚，D→离婚，W→丧偶' },
    EDU: { source: 'education_level', ruleType: '编码转换', rule: '学历代码 → 教育程度' },
    INSURANCE: { source: 'insurance', ruleType: '编码转换', rule: '医保代码 → 医疗保障类型' },
    // 血检肿瘤标志物
    BT_ID: { source: 'lab_id', ruleType: '直接映射', rule: '原值保留' },
    BT_DATE: { source: 'lab_date', ruleType: '直接映射', rule: 'ISO 8601 直接写入' },
    CEA: { source: 'obs_cea', ruleType: '编码转换', rule: 'LOINC 2039-6 取值，统一 ng/mL' },
    SCC: { source: 'obs_scc', ruleType: '编码转换', rule: 'LOINC 6088-6 取值，统一 ng/mL' },
    CA19_9: { source: 'obs_ca199', ruleType: '编码转换', rule: 'LOINC 24108-4 取值，统一 U/mL' },
    CYFRA21_1: { source: 'obs_cyfra211', ruleType: '编码转换', rule: 'LOINC 47357-5 取值，统一 ng/mL' },
    CA72_4: { source: 'obs_ca724', ruleType: '编码转换', rule: 'LOINC 24108-4 取值，统一 U/mL' },
    AFP: { source: 'obs_afp', ruleType: '编码转换', rule: 'LOINC 1834-0 取值，统一 ng/mL' },
    CA125: { source: 'obs_ca125', ruleType: '编码转换', rule: 'LOINC 14879-7 取值，统一 U/mL' },
    NSE: { source: 'obs_nse', ruleType: '编码转换', rule: 'LOINC 19607-1 取值，统一 ng/mL' },
    // 实验室检测
    HBSAG: { source: 'obs_hbsag', ruleType: '值域映射', rule: 'negative→阴性，positive→阳性' },
    ANTI_HCV: { source: 'obs_anti_hcv', ruleType: '值域映射', rule: 'negative→阴性，positive→阳性' },
    HP_TEST: { source: 'obs_hp', ruleType: '值域映射', rule: 'negative→阴性，positive→阳性' },
    FBG: { source: 'obs_glu', ruleType: '单位转换', rule: 'mg/dL → mmol/L（÷18）' },
    TG: { source: 'obs_tg', ruleType: '直接映射', rule: 'mmol/L 原值保留' },
    CHOL: { source: 'obs_chol', ruleType: '直接映射', rule: 'mmol/L 原值保留' },
    HDL: { source: 'obs_hdl', ruleType: '直接映射', rule: 'mmol/L 原值保留' },
    LDL: { source: 'obs_ldl', ruleType: '直接映射', rule: 'mmol/L 原值保留' },
    PG1: { source: 'obs_pg1', ruleType: '直接映射', rule: 'ng/mL 原值保留' },
    PGR: { source: 'obs_pgr', ruleType: '直接映射', rule: '原值保留' },
    G17: { source: 'obs_g17', ruleType: '直接映射', rule: 'pmol/L 原值保留' },
    // 体格检查
    HEIGHT: { source: 'body_height', ruleType: '直接映射', rule: 'cm 原值保留' },
    WEIGHT: { source: 'body_weight', ruleType: '直接映射', rule: 'kg 原值保留' },
    BMI: { source: 'bmi', ruleType: '直接映射', rule: 'kg/m² 原值保留' },
    WAIST: { source: 'waist_circum', ruleType: '直接映射', rule: 'cm 原值保留' },
    // 内镜检查
    ENDO_ID: { source: 'endoscopy_id', ruleType: '直接映射', rule: '原值保留' },
    ENDO_DATE: { source: 'endoscopy_date', ruleType: '直接映射', rule: 'ISO 8601 直接写入' },
    ANESTHESIA: { source: 'anesthesia_flag', ruleType: '值域映射', rule: 'false→否，true→是' },
    STAIN: { source: 'staining_method', ruleType: '编码转换', rule: 'LUGOL→卢戈氏碘染色，NBI→电子染色，NONE→无染色' },
    BIOPSY: { source: 'biopsy_flag', ruleType: '值域映射', rule: 'false→否，true→是' },
    ENDO_LOC: { source: 'lesion_location', ruleType: '编码转换', rule: '位置代码 → 颈段/上段/中段/下段/贲门' },
    ENDO_N: { source: 'lesion_count', ruleType: '直接映射', rule: '原值保留' },
    DIAG_ENDO: { source: 'endoscopy_diagnosis', ruleType: '直接映射', rule: '原值保留' },
    ENDO_RPT: { source: 'endoscopy_report', ruleType: '直接映射', rule: '原值保留' },
    EUS_DEPTH: { source: 'eus_depth', ruleType: '直接映射', rule: 'mm 原值保留' },
    // 影像学检查
    CT_ID: { source: 'ct_exam_id', ruleType: '直接映射', rule: '原值保留' },
    CT_DATE: { source: 'ct_exam_date', ruleType: '直接映射', rule: 'ISO 8601 直接写入' },
    CT_TYPE: { source: 'ct_scan_type', ruleType: '值域映射', rule: 'plain→平扫，contrast→增强' },
    CT_LOC: { source: 'ct_lesion_location', ruleType: '直接映射', rule: '原值保留' },
    CT_DIAG: { source: 'ct_diagnosis', ruleType: '直接映射', rule: '原值保留' },
    CT_RPT: { source: 'ct_report', ruleType: '直接映射', rule: '原值保留' },
    CM: { source: 'm_stage', ruleType: '编码转换', rule: 'M0/M1/Mx 校验后写入' },
    cM: { source: 'clinical_m_stage', ruleType: '编码转换', rule: 'M0/M1/Mx 校验后写入' },
    MET_SITE: { source: 'metastasis_site', ruleType: '编码转换', rule: '转移部位代码 → 标准名称' },
    // 病理检查
    PATH_ID: { source: 'pathology_id', ruleType: '直接映射', rule: '原值保留' },
    PATH_DATE: { source: 'pathology_date', ruleType: '直接映射', rule: 'ISO 8601 直接写入' },
    PATH_TYPE: { source: 'specimen_type', ruleType: '编码转换', rule: '标本类型代码 → 标准样本类型' },
    PATH_LOC: { source: 'biopsy_location', ruleType: '直接映射', rule: '原值保留' },
    PATH_CODE: { source: 'pathology_code', ruleType: '编码转换', rule: '院内病理码 → 标准病理诊断编码' },
    PATH_RPT: { source: 'pathology_report', ruleType: '直接映射', rule: '原值保留' },
    HISTO_TYPE: { source: 'histology_type', ruleType: '编码转换', rule: 'WHO 分类编码 → 组织学类型' },
    GRADE: { source: 'histologic_grade', ruleType: '编码转换', rule: 'G1/G2/G3/Gx 校验后写入' },
    EARLY: { source: 'early_cancer', ruleType: '值域映射', rule: 'false→否，true→是' },
    INV_DEPTH: { source: 'invasion_depth', ruleType: '编码转换', rule: '浸润深度代码 → 标准值域' },
    LVI: { source: 'lvi_flag', ruleType: '值域映射', rule: 'false→无，true→有' },
    MARGIN: { source: 'margin_status', ruleType: '值域映射', rule: 'negative→阴性，positive→阳性' },
    pT: { source: 'pathologic_t', ruleType: '编码转换', rule: 'AJCC 第8版 pT 校验' },
    pN: { source: 'pathologic_n', ruleType: '编码转换', rule: 'AJCC 第8版 pN 校验' },
    STAGE: { source: 'tnm_stage_group', ruleType: '编码转换', rule: 'AJCC 第8版总分期校验' },
    LN_EXAM: { source: 'lymph_nodes_examined', ruleType: '直接映射', rule: '原值保留' },
    LN_POS: { source: 'lymph_nodes_positive', ruleType: '直接映射', rule: '原值保留' },
    // 诊断与分期
    DIAG_DATE: { source: 'diagnosis_date', ruleType: '直接映射', rule: 'ISO 8601 直接写入' },
    CHIEF_COM: { source: 'chief_complaint', ruleType: '直接映射', rule: '原值保留（多值用逗号分隔）' },
    SYM_DUR: { source: 'symptom_duration', ruleType: '单位转换', rule: '天 → 月（÷30）' },
    DETECT_METHOD: { source: 'detection_method', ruleType: '编码转换', rule: '发现方式代码 → 标准值域' },
    cT: { source: 'clinical_t', ruleType: '编码转换', rule: 'AJCC 第8版 cT 校验' },
    cN: { source: 'clinical_n', ruleType: '编码转换', rule: 'AJCC 第8版 cN 校验' },
    cM_DIAG: { source: 'clinical_m', ruleType: '编码转换', rule: 'M0/M1/Mx 校验后写入' },
    cSTAGE: { source: 'clinical_stage_group', ruleType: '编码转换', rule: 'AJCC 第8版临床分期校验' },
    LESION_LEN: { source: 'lesion_length', ruleType: '直接映射', rule: 'cm 原值保留' },
    ECOG: { source: 'ecog_score', ruleType: '直接映射', rule: '0-4 原值保留' },
    // 随访
    FU_ID: { source: 'followup_id', ruleType: '直接映射', rule: '原值保留' },
    FU_DATE: { source: 'followup_date', ruleType: '直接映射', rule: 'ISO 8601 直接写入' },
    FU_SEQ: { source: 'followup_seq', ruleType: '直接映射', rule: '原值保留' },
    FU_METHOD: { source: 'followup_method', ruleType: '编码转换', rule: '随访方式代码 → 标准值域' },
    FU_STATUS: { source: 'vital_status', ruleType: '值域映射', rule: 'alive→存活，dead→死亡' },
    DEATH_DATE: { source: 'death_date', ruleType: '直接映射', rule: 'ISO 8601 直接写入' },
    RECUR_STATUS: { source: 'recurrence_status', ruleType: '值域映射', rule: 'none→无，relapse→有' },
    RECUR_DATE: { source: 'recurrence_date', ruleType: '直接映射', rule: 'ISO 8601 直接写入' },
    LAST_FU_DATE: { source: 'last_followup_date', ruleType: '直接映射', rule: 'ISO 8601 直接写入' },
    // 生存与预后
    OS: { source: 'os_days', ruleType: '直接映射', rule: '天，原值保留' },
    OS_CENSOR: { source: 'os_censor', ruleType: '值域映射', rule: '0→删失，1→死亡' },
    DFS: { source: 'dfs_days', ruleType: '直接映射', rule: '天，原值保留' },
    PFS: { source: 'pfs_days', ruleType: '直接映射', rule: '天，原值保留' },
  },
}

/**
 * 已停用字段：机构确实提供了源字段，但因授权/隐私等原因暂停参与治理
 * 保留映射配置，不参与标准化处理
 */
export const disabledFields: Record<string, string[]> = {
  解放军总医院: [],
  中日友好医院: ['NAME'],
  肿瘤医院: ['CELLPHONE'],
}
