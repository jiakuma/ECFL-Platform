import json
import requests
import pandas as pd


API_URL = "https://api.gdc.cancer.gov/cases"

# =========================================================
# 1. 查询字段
# =========================================================

fields = [
    # Case 基础信息
    "case_id",
    "submitter_id",
    "primary_site",
    "disease_type",

    # 人口学信息
    "demographic.sex_at_birth",
    "demographic.race",
    "demographic.ethnicity",
    "demographic.vital_status",
    "demographic.days_to_birth",
    "demographic.days_to_death",
    "demographic.year_of_birth",
    "demographic.year_of_death",

    # Diagnosis 信息
    "diagnoses.diagnosis_id",
    "diagnoses.submitter_id",
    "diagnoses.primary_diagnosis",
    "diagnoses.age_at_diagnosis",

    "diagnoses.ajcc_pathologic_stage",
    "diagnoses.ajcc_pathologic_t",
    "diagnoses.ajcc_pathologic_n",
    "diagnoses.ajcc_pathologic_m",

    "diagnoses.ajcc_clinical_stage",
    "diagnoses.ajcc_clinical_t",
    "diagnoses.ajcc_clinical_n",
    "diagnoses.ajcc_clinical_m",

    "diagnoses.tumor_grade",
    "diagnoses.morphology",

    "diagnoses.tissue_or_organ_of_origin",
    "diagnoses.site_of_resection_or_biopsy",

    "diagnoses.classification_of_tumor",

    "diagnoses.days_to_diagnosis",
    "diagnoses.days_to_last_follow_up",
    "diagnoses.days_to_last_known_disease_status",

    "diagnoses.prior_malignancy",
    "diagnoses.prior_treatment",
    "diagnoses.progression_or_recurrence",
]


# =========================================================
# 2. 只查询 TCGA-ESCA
# =========================================================

filters = {
    "op": "in",
    "content": {
        "field": "project.project_id",
        "value": ["TCGA-ESCA"]
    }
}


params = {
    "filters": json.dumps(filters),
    "fields": ",".join(fields),
    "format": "JSON",
    "size": "500"
}


# =========================================================
# 3. 请求 GDC
# =========================================================

print("正在下载 TCGA-ESCA 临床数据...")

session = requests.Session()

# 如果你之前必须使用系统代理才能访问，
# 把下一行改成 True 或直接删除
session.trust_env = False

try:

    response = session.get(
        API_URL,
        params=params,
        timeout=120
    )

    response.raise_for_status()

except requests.exceptions.RequestException as e:

    print()
    print("数据下载失败：")
    print(e)
    exit(1)


data = response.json()

cases = data["data"]["hits"]

print(f"成功获取病例：{len(cases)}")


# =========================================================
# 4. Case 级数据
#    一个患者 = 一行
# =========================================================

case_rows = []

for case in cases:

    demographic = case.get("demographic") or {}

    days_to_birth = demographic.get("days_to_birth")

    age = None

    if days_to_birth is not None:

        try:
            age = round(abs(float(days_to_birth)) / 365.25, 1)

        except (TypeError, ValueError):
            pass


    case_rows.append({

        "case_id":
            case.get("case_id"),

        "patient_id":
            case.get("submitter_id"),

        "primary_site":
            case.get("primary_site"),

        "disease_type":
            case.get("disease_type"),

        "sex_at_birth":
            demographic.get("sex_at_birth"),

        "age":
            age,

        "race":
            demographic.get("race"),

        "ethnicity":
            demographic.get("ethnicity"),

        "vital_status":
            demographic.get("vital_status"),

        "days_to_birth":
            demographic.get("days_to_birth"),

        "days_to_death":
            demographic.get("days_to_death"),

        "year_of_birth":
            demographic.get("year_of_birth"),

        "year_of_death":
            demographic.get("year_of_death"),

        "diagnosis_count":
            len(case.get("diagnoses") or []),

    })


case_df = pd.DataFrame(case_rows)


# =========================================================
# 5. Diagnosis 级数据
#    一个 diagnosis = 一行
# =========================================================

diagnosis_rows = []

for case in cases:

    patient_id = case.get("submitter_id")

    primary_site = case.get("primary_site")

    disease_type = case.get("disease_type")

    diagnoses = case.get("diagnoses") or []


    # 如果没有 diagnosis，也保留患者记录
    if not diagnoses:

        diagnosis_rows.append({

            "patient_id": patient_id,

            "primary_site": primary_site,

            "disease_type": disease_type,

        })

        continue


    for index, diagnosis in enumerate(diagnoses, start=1):

        diagnosis_rows.append({

            # -------------------------------------------------
            # 患者信息
            # -------------------------------------------------

            "patient_id":
                patient_id,

            "primary_site":
                primary_site,

            "disease_type":
                disease_type,

            "diagnosis_index":
                index,


            # -------------------------------------------------
            # Diagnosis 标识
            # -------------------------------------------------

            "diagnosis_id":
                diagnosis.get("diagnosis_id"),

            "diagnosis_submitter_id":
                diagnosis.get("submitter_id"),


            # -------------------------------------------------
            # 诊断
            # -------------------------------------------------

            "primary_diagnosis":
                diagnosis.get("primary_diagnosis"),

            "classification_of_tumor":
                diagnosis.get("classification_of_tumor"),

            "age_at_diagnosis_days":
                diagnosis.get("age_at_diagnosis"),


            # -------------------------------------------------
            # AJCC 病理分期
            # -------------------------------------------------

            "ajcc_pathologic_stage":
                diagnosis.get("ajcc_pathologic_stage"),

            "ajcc_pathologic_t":
                diagnosis.get("ajcc_pathologic_t"),

            "ajcc_pathologic_n":
                diagnosis.get("ajcc_pathologic_n"),

            "ajcc_pathologic_m":
                diagnosis.get("ajcc_pathologic_m"),


            # -------------------------------------------------
            # AJCC 临床分期
            # -------------------------------------------------

            "ajcc_clinical_stage":
                diagnosis.get("ajcc_clinical_stage"),

            "ajcc_clinical_t":
                diagnosis.get("ajcc_clinical_t"),

            "ajcc_clinical_n":
                diagnosis.get("ajcc_clinical_n"),

            "ajcc_clinical_m":
                diagnosis.get("ajcc_clinical_m"),


            # -------------------------------------------------
            # 肿瘤信息
            # -------------------------------------------------

            "tumor_grade":
                diagnosis.get("tumor_grade"),

            "morphology":
                diagnosis.get("morphology"),

            "tissue_or_organ_of_origin":
                diagnosis.get("tissue_or_organ_of_origin"),

            "site_of_resection_or_biopsy":
                diagnosis.get("site_of_resection_or_biopsy"),


            # -------------------------------------------------
            # 随访信息
            # -------------------------------------------------

            "days_to_diagnosis":
                diagnosis.get("days_to_diagnosis"),

            "days_to_last_follow_up":
                diagnosis.get("days_to_last_follow_up"),

            "days_to_last_known_disease_status":
                diagnosis.get(
                    "days_to_last_known_disease_status"
                ),


            # -------------------------------------------------
            # 既往病史
            # -------------------------------------------------

            "prior_malignancy":
                diagnosis.get("prior_malignancy"),

            "prior_treatment":
                diagnosis.get("prior_treatment"),

            "progression_or_recurrence":
                diagnosis.get("progression_or_recurrence"),

        })


diagnosis_df = pd.DataFrame(diagnosis_rows)


# =========================================================
# 6. 保存文件
# =========================================================

case_file = "TCGA_ESCA_case_raw.csv"

diagnosis_file = "TCGA_ESCA_diagnosis_raw.csv"


case_df.to_csv(
    case_file,
    index=False,
    encoding="utf-8-sig"
)

diagnosis_df.to_csv(
    diagnosis_file,
    index=False,
    encoding="utf-8-sig"
)


# =========================================================
# 7. 输出简单统计
# =========================================================

print()
print("=" * 60)

print("下载完成")

print("=" * 60)

print()

print(f"患者级文件：{case_file}")
print(f"患者数量：{len(case_df)}")

print()

print(f"诊断级文件：{diagnosis_file}")
print(f"诊断记录数量：{len(diagnosis_df)}")

print()

print("性别分布：")

print(
    case_df["sex_at_birth"]
    .value_counts(dropna=False)
)

print()

print("Primary Site 分布：")

print(
    case_df["primary_site"]
    .value_counts(dropna=False)
)

print()

print("Disease Type 分布：")

print(
    case_df["disease_type"]
    .value_counts(dropna=False)
)

print()

print("每个患者 Diagnosis 数量：")

print(
    case_df["diagnosis_count"]
    .value_counts()
    .sort_index()
)