// src/mock/esophagusMetadata.ts
var standardFields = [
  { cn: "\u75C5\u6848\u53F7", en: "CaseID", code: "ID", dataType: "\u6570\u503C\u578B", domain: "\u6B63\u6574\u6570", constraint: "M", category: "\u57FA\u672C\u4FE1\u606F" },
  { cn: "\u59D3\u540D", en: "Name", code: "NAME", dataType: "\u5B57\u7B26\u4E32\u578B", domain: "", constraint: "M", category: "\u57FA\u672C\u4FE1\u606F" },
  { cn: "\u6027\u522B", en: "Sex", code: "SEX", dataType: "\u5B57\u7B26\u4E32\u578B", domain: "\u7537\uFF0C\u5973", constraint: "M", category: "\u57FA\u672C\u4FE1\u606F" },
  { cn: "\u5E74\u9F84", en: "Age", code: "AGE", dataType: "\u6570\u503C\u578B", domain: "\u6B63\u6574\u6570", constraint: "M", category: "\u57FA\u672C\u4FE1\u606F" },
  { cn: "\u8840\u68C0\u5355\u53F7", en: "Blood Test ID", code: "BT_ID", dataType: "\u5B57\u7B26\u4E32\u578B", domain: "", constraint: "M", category: "\u8840\u68C0\u80BF\u7624\u6807\u5FD7\u7269" },
  { cn: "\u8840\u68C0\u65F6\u95F4", en: "Blood Test Date", code: "BT_DATE", dataType: "\u65F6\u95F4", domain: "", constraint: "M", category: "\u8840\u68C0\u80BF\u7624\u6807\u5FD7\u7269" },
  { cn: "\u764C\u80DA\u6297\u539F", en: "Carcinoembryonic Antigen", code: "CEA", dataType: "\u6570\u503C\u578B", domain: "\u6B63\u6574\u6570", constraint: "M", category: "\u8840\u68C0\u80BF\u7624\u6807\u5FD7\u7269" },
  { cn: "\u9CDE\u72B6\u7EC6\u80DE\u764C\u6297\u539F", en: "Squamous Cell CarcinomaAntigen", code: "SCC", dataType: "\u6570\u503C\u578B", domain: "\u6B63\u6574\u6570", constraint: "M", category: "\u8840\u68C0\u80BF\u7624\u6807\u5FD7\u7269" },
  { cn: "\u7CD6\u7C7B\u6297\u539F19-9", en: "Carbohydrate Antigen 19_9", code: "CA19_9", dataType: "\u6570\u503C\u578B", domain: "\u6B63\u6574\u6570", constraint: "M", category: "\u8840\u68C0\u80BF\u7624\u6807\u5FD7\u7269" },
  { cn: "\u7EC6\u80DE\u89D2\u86CB\u767D19\u7247\u6BB5", en: "Cytokeratin 19 Fragment", code: "CYFRA21_1", dataType: "\u6570\u503C\u578B", domain: "\u6B63\u6574\u6570", constraint: "M", category: "\u8840\u68C0\u80BF\u7624\u6807\u5FD7\u7269" },
  { cn: "\u7CD6\u7C7B\u6297\u539F72-4", en: "Carbohydrate Antigen 72_4", code: "CA72_4", dataType: "\u6570\u503C\u578B", domain: "\u6B63\u6574\u6570", constraint: "M", category: "\u8840\u68C0\u80BF\u7624\u6807\u5FD7\u7269" },
  { cn: "\u7532\u80CE\u86CB\u767D", en: "Alpha Fetoprotein", code: "AFP", dataType: "\u6570\u503C\u578B", domain: "\u6B63\u6574\u6570", constraint: "M", category: "\u8840\u68C0\u80BF\u7624\u6807\u5FD7\u7269" },
  { cn: "\u7CD6\u7C7B\u6297\u539F125", en: "Carbohydrate Antigen 125", code: "CA125", dataType: "\u6570\u503C\u578B", domain: "\u6B63\u6574\u6570", constraint: "M", category: "\u8840\u68C0\u80BF\u7624\u6807\u5FD7\u7269" },
  { cn: "\u795E\u7ECF\u7279\u5F02\u6027\u70EF\u9187\u9176", en: "Neuron SpecificEnolase", code: "NSE", dataType: "\u6570\u503C\u578B", domain: "\u6B63\u6574\u6570", constraint: "M", category: "\u8840\u68C0\u80BF\u7624\u6807\u5FD7\u7269" },
  { cn: "\u75C5\u53D8\u6570\u91CF\uFF08\u5185\u955C\uFF09", en: "Endoscopic Lesion Count", code: "ENDO_N", dataType: "\u6570\u503C\u578B", domain: "\u6B63\u6574\u6570", constraint: "M", category: "\u5185\u955C\u68C0\u67E5" },
  { cn: "\u75C5\u53D8\u751F\u957F\u65B9\u5F0F\uFF08\u5185\u955C\uFF09", en: "Endoscopic Growth Pattern", code: "ENDO_GROW", dataType: "\u5B57\u7B26\u4E32\u578B", domain: "", constraint: "M", category: "\u5185\u955C\u68C0\u67E5" },
  { cn: "\u75C5\u53D8\u6027\u8D281-\u662F\u5426\u80BF\u7624\uFF08\u5185\u955C\uFF09", en: "Endoscopic Tumor Or Nontumor", code: "ENDO_TUM", dataType: "\u5B57\u7B26\u4E32\u578B", domain: "", constraint: "M", category: "\u5185\u955C\u68C0\u67E5" },
  { cn: "\u75C5\u53D8\u6027\u8D282-\u662F\u5426\u6076\u6027\u80BF\u7624\uFF08\u5185\u955C\uFF09", en: "Endoscopic Benign Or Malignant", code: "ENDO_MAL", dataType: "\u5B57\u7B26\u4E32\u578B", domain: "", constraint: "M", category: "\u5185\u955C\u68C0\u67E5" },
  { cn: "\u75C5\u53D8\u6027\u8D283-\u662F\u5426\u764C\u524D\u75C5\u53D8\uFF08\u5185\u955C\uFF09", en: "Endoscopic Precancer Or Cancer", code: "ENDO_PRE", dataType: "\u5B57\u7B26\u4E32\u578B", domain: "", constraint: "M", category: "\u5185\u955C\u68C0\u67E5" },
  { cn: "\u75C5\u53D8\u6027\u8D284-\u8BCA\u65AD\u540D\u79F0\uFF08\u5185\u955C\uFF09", en: "Endoscopic Histology Diagnosis", code: "ENDO_DIAG", dataType: "\u5B57\u7B26\u4E32\u578B", domain: "", constraint: "M", category: "\u5185\u955C\u68C0\u67E5" },
  { cn: "CT\u5355\u53F7", en: "CT ID", code: "CT_ID", dataType: "\u5B57\u7B26\u4E32\u578B", domain: "", constraint: "M", category: "\u5F71\u50CF\u5B66\u68C0\u67E5" },
  { cn: "CT\u62A5\u544A", en: "CT Report", code: "CT_RPT", dataType: "\u5B57\u7B26\u4E32\u578B", domain: "", constraint: "M", category: "\u5F71\u50CF\u5B66\u68C0\u67E5" },
  { cn: "\u8D85\u58F0\u5355\u53F7", en: "Ultrasound ID", code: "US_ID", dataType: "\u5B57\u7B26\u4E32\u578B", domain: "", constraint: "M", category: "\u5F71\u50CF\u5B66\u68C0\u67E5" },
  { cn: "\u8D85\u58F0\u65F6\u95F4", en: "Ultrasound Date", code: "US_DATE", dataType: "\u65F6\u95F4", domain: "", constraint: "M", category: "\u5F71\u50CF\u5B66\u68C0\u67E5" },
  { cn: "\u8D85\u58F0\u62A5\u544A", en: "Ultrasound Report", code: "US_RPT", dataType: "\u5B57\u7B26\u4E32\u578B", domain: "", constraint: "M", category: "\u5F71\u50CF\u5B66\u68C0\u67E5" },
  { cn: "\u75C5\u53D8\u4F4D\u7F6E\uFF08\u8D85\u58F0\uFF09", en: "Ultrasound Lesion Location", code: "US_LOC", dataType: "\u5B57\u7B26\u4E32\u578B", domain: "", constraint: "M", category: "\u5F71\u50CF\u5B66\u68C0\u67E5" },
  { cn: "\u8BCA\u65AD\u540D\u79F0\uFF08\u8D85\u58F0\uFF09", en: "Ultrasound Lesion Diagnosis", code: "US_DIAG", dataType: "\u5B57\u7B26\u4E32\u578B", domain: "", constraint: "M", category: "\u5F71\u50CF\u5B66\u68C0\u67E5" },
  { cn: "M\u5206\u671F", en: "M Stage", code: "CM", dataType: "\u5B57\u7B26\u4E32\u578B", domain: "M0\uFF0CM1\uFF0CMx", constraint: "M", category: "\u5F71\u50CF\u5B66\u68C0\u67E5" },
  { cn: "\u75C5\u7406\u62A5\u544A", en: "Pathology Report", code: "PATH_RPT", dataType: "\u5B57\u7B26\u4E32\u578B", domain: "", constraint: "M", category: "\u75C5\u7406\u68C0\u67E5" },
  { cn: "\u6837\u672C\u540D\u79F0", en: "Specimen Name", code: "PATH_NAME", dataType: "\u5B57\u7B26\u4E32\u578B", domain: "", constraint: "M", category: "\u75C5\u7406\u68C0\u67E5" },
  { cn: "\u75C5\u53D8\u751F\u957F\u65B9\u5F0F\uFF08\u75C5\u7406\uFF09", en: "Pathology Growth Pattern", code: "PATH_GROW", dataType: "\u5B57\u7B26\u4E32\u578B", domain: "", constraint: "M", category: "\u75C5\u7406\u68C0\u67E5" },
  { cn: "\u75C5\u53D8\u6027\u8D281-\u662F\u5426\u80BF\u7624\uFF08\u75C5\u7406\uFF09", en: "Pathology Tumor Or Nontumor", code: "PATH_TUM", dataType: "\u5E03\u5C14\u578B", domain: "", constraint: "M", category: "\u75C5\u7406\u68C0\u67E5" },
  { cn: "\u75C5\u53D8\u6027\u8D282-\u662F\u5426\u6076\u6027\u80BF\u7624\uFF08\u75C5\u7406\uFF09", en: "Pathology Benign Or Malignant", code: "PATH_MAL", dataType: "\u5E03\u5C14\u578B", domain: "", constraint: "M", category: "\u75C5\u7406\u68C0\u67E5" },
  { cn: "\u75C5\u53D8\u6027\u8D283-\u662F\u5426\u764C\u524D\u75C5\u53D8\uFF08\u75C5\u7406\uFF09", en: "Pathology Precancer Or Cancer", code: "PATH_PRE", dataType: "\u5E03\u5C14\u578B", domain: "", constraint: "M", category: "\u75C5\u7406\u68C0\u67E5" },
  { cn: "\u75C5\u53D8\u6027\u8D284-\u8BCA\u65AD\u540D\u79F0\uFF08\u75C5\u7406\uFF09", en: "Pathology Histology Diagnosis", code: "PATH_DIAG", dataType: "\u5B57\u7B26\u4E32\u578B", domain: "", constraint: "M", category: "\u75C5\u7406\u68C0\u67E5" },
  { cn: "\u662F\u5426\u7279\u6B8A\u7C7B\u578B\u764C", en: "Histologic specific subtype", code: "SPE_SUB", dataType: "\u5E03\u5C14\u578B", domain: "", constraint: "M", category: "\u75C5\u7406\u68C0\u67E5" },
  { cn: "\u6D78\u6DA6\u5C42\u6B21", en: "Invasion Layer", code: "INV_LAYER", dataType: "\u5B57\u7B26\u4E32\u578B", domain: "", constraint: "M", category: "\u75C5\u7406\u68C0\u67E5" },
  { cn: "\u75C5\u53D8\u9762\u79EF", en: "Lesion Area", code: "AREA", dataType: "\u5B57\u7B26\u4E32\u578B", domain: "", constraint: "M", category: "\u75C5\u7406\u68C0\u67E5" },
  { cn: "\u6700\u8FD1\u4FA7\u5207\u7F18\u8DDD\u79BB", en: "Closest Lateral Margin Distance", code: "CM_LATE", dataType: "\u5B57\u7B26\u4E32\u578B", domain: "", constraint: "M", category: "\u75C5\u7406\u68C0\u67E5" },
  { cn: "\u6700\u8FD1\u57FA\u5E95\u5207\u7F18\u8DDD\u79BB\uFF08\u65E9\u764C\uFF09", en: "Closest Deep Margin Distance", code: "CM_CIRC", dataType: "\u5B57\u7B26\u4E32\u578B", domain: "", constraint: "M", category: "\u75C5\u7406\u68C0\u67E5" },
  { cn: "\u6700\u8FD1\u73AF\u5468\u5207\u7F18\u8DDD\u79BB\uFF08\u975E\u65E9\u764C\uFF09", en: "Closest Circumferential Margin Distance", code: "CRM", dataType: "\u5B57\u7B26\u4E32\u578B", domain: "", constraint: "M", category: "\u75C5\u7406\u68C0\u67E5" },
  { cn: "\u80BF\u7624\u9000\u7F29\u5206\u7EA7", en: "Tumor Regression Grade", code: "TRG", dataType: "\u5B57\u7B26\u4E32\u578B", domain: "TRG0\uFF0CTRG1\uFF0CTRG2\uFF0CTRG3\uFF0CTRG4", constraint: "M", category: "\u75C5\u7406\u68C0\u67E5" },
  { cn: "PD-L1\uFF08\u514D\u75AB\u7EC4\u5316\uFF09", en: "PDL1_IHC", code: "PDL1", dataType: "\u6570\u503C\u578B", domain: "0-100", constraint: "M", category: "\u8F85\u52A9\u68C0\u67E5" },
  { cn: "MLH1\uFF08\u514D\u75AB\u7EC4\u5316\uFF09", en: "MLH1_IHC", code: "MLH1", dataType: "\u5B57\u7B26\u4E32\u578B", domain: "\u9634\u6027\uFF0C\u9633\u6027", constraint: "M", category: "\u8F85\u52A9\u68C0\u67E5" },
  { cn: "PMS2\uFF08\u514D\u75AB\u7EC4\u5316\uFF09", en: "PMS2_IHC", code: "PMS2", dataType: "\u5B57\u7B26\u4E32\u578B", domain: "\u9634\u6027\uFF0C\u9633\u6027", constraint: "M", category: "\u8F85\u52A9\u68C0\u67E5" },
  { cn: "MSH2\uFF08\u514D\u75AB\u7EC4\u5316\uFF09", en: "MSH2_IHC", code: "MSH2", dataType: "\u5B57\u7B26\u4E32\u578B", domain: "\u9634\u6027\uFF0C\u9633\u6027", constraint: "M", category: "\u8F85\u52A9\u68C0\u67E5" },
  { cn: "MSH6\uFF08\u514D\u75AB\u7EC4\u5316\uFF09", en: "MSH6_IHC", code: "MSH6", dataType: "\u5B57\u7B26\u4E32\u578B", domain: "\u9634\u6027\uFF0C\u9633\u6027", constraint: "M", category: "\u8F85\u52A9\u68C0\u67E5" },
  { cn: "HER2\uFF08\u514D\u75AB\u7EC4\u5316\uFF09", en: "HER2_IHC", code: "HER2_IHC", dataType: "\u5B57\u7B26\u4E32\u578B", domain: "0,1+\uFF0C2+\uFF0C3+", constraint: "M", category: "\u8F85\u52A9\u68C0\u67E5" },
  { cn: "HER2\uFF08\u8367\u5149\u539F\u4F4D\u6742\u4EA4\uFF09", en: "HER2_FISH", code: "HER2_FISH", dataType: "\u5B57\u7B26\u4E32\u578B", domain: "", constraint: "M", category: "\u8F85\u52A9\u68C0\u67E5" },
  { cn: "CLDN18.2\uFF08\u514D\u75AB\u7EC4\u5316\uFF09", en: "CLDN18.2_IHC", code: "CLDN18_2", dataType: "\u6570\u503C\u578B", domain: "0-100%", constraint: "M", category: "\u8F85\u52A9\u68C0\u67E5" },
  { cn: "\u5F39\u529B\u7EA4\u7EF4\u67D3\u8272", en: "Elastic Fiber Staining", code: "EVG", dataType: "\u5B57\u7B26\u4E32\u578B", domain: "", constraint: "M", category: "\u8F85\u52A9\u68C0\u67E5" },
  { cn: "\u4E8C\u4EE3\u6D4B\u5E8F\u62A5\u544A", en: "Nest Generation Testing Report", code: "NGS_report", dataType: "\u5B57\u7B26\u4E32\u578B", domain: "", constraint: "M", category: "\u8F85\u52A9\u68C0\u67E5" },
  { cn: "\u8EAB\u4EFD\u8BC1\u53F7", en: "National ID", code: "UID", dataType: "\u5B57\u7B26\u4E32\u578B", domain: "18\u4F4D", constraint: "O", category: "\u57FA\u672C\u4FE1\u606F" },
  { cn: "\u7C4D\u8D2F", en: "Native Place", code: "NATIVE", dataType: "\u5B57\u7B26\u4E32\u578B", domain: "", constraint: "O", category: "\u57FA\u672C\u4FE1\u606F" },
  { cn: "\u5E38\u4F4F\u5730\u5740", en: "Residential Address", code: "ADDRESS", dataType: "\u5B57\u7B26\u4E32\u578B", domain: "", constraint: "O", category: "\u57FA\u672C\u4FE1\u606F" },
  { cn: "\u8054\u7CFB\u7535\u8BDD", en: "Phone Number", code: "CELLPHONE", dataType: "\u5B57\u7B26\u4E32\u578B", domain: "", constraint: "O", category: "\u57FA\u672C\u4FE1\u606F" },
  { cn: "\u6C11\u65CF", en: "Ethnicity", code: "ETHNIC", dataType: "\u5B57\u7B26\u4E32\u578B", domain: "\u6C49\u65CF\uFF0C\u56DE\u65CF\uFF0C\u85CF\u65CF\uFF0C\u7EF4\u543E\u5C14\u65CF\uFF0C\u82D7\u65CF\uFF0C\u5F5D\u65CF\uFF0C\u58EE\u65CF\uFF0C\u6EE1\u65CF\uFF0C\u571F\u5BB6\u65CF\uFF0C\u5176\u4ED6", constraint: "O", category: "\u57FA\u672C\u4FE1\u606F" },
  { cn: "\u672C\u5730\u6237\u7C4D", en: "Local Household Registration", code: "LOCAL_RES", dataType: "\u5E03\u5C14\u578B", domain: "\u662F\uFF0C\u5426", constraint: "O", category: "\u57FA\u672C\u4FE1\u606F" },
  { cn: "\u672C\u5730\u5C45\u4F4F\u65F6\u95F4", en: "Local Residence Duration", code: "RES_DUR", dataType: "\u5B57\u7B26\u4E32\u578B", domain: "0-5.9\u6708\uFF0C6-11.9\u6708\uFF0C12-35.9\u6708\uFF0C36-59.9\u6708\uFF0C\u226560\u6708", constraint: "O", category: "\u57FA\u672C\u4FE1\u606F" },
  { cn: "\u5A5A\u59FB\u72B6\u6001", en: "Marital Status", code: "MARITAL", dataType: "\u5B57\u7B26\u4E32\u578B", domain: "\u672A\u5A5A\uFF0C\u5DF2\u5A5A\uFF0C\u5206\u5C45\uFF0C\u79BB\u5A5A\uFF0C\u4E27\u5076", constraint: "O", category: "\u57FA\u672C\u4FE1\u606F" },
  { cn: "\u521D\u5A5A\u5E74\u9F84", en: "Age at First Marriage", code: "AGE_MARRY", dataType: "\u6570\u503C\u578B", domain: "\u6B63\u6574\u6570", constraint: "O", category: "\u57FA\u672C\u4FE1\u606F" },
  { cn: "\u6559\u80B2\u7A0B\u5EA6", en: "Education Level", code: "EDU", dataType: "\u5B57\u7B26\u4E32\u578B", domain: "\u672A\u4E0A\u5B66\uFF0C\u5C0F\u5B66\uFF0C\u521D\u4E2D\uFF0C\u9AD8\u4E2D\uFF0C\u5927\u4E13\uFF0C\u672C\u79D1\uFF0C\u7814\u7A76\u751F\u53CA\u4EE5\u4E0A\uFF0C\u4E0D\u8BE6", constraint: "O", category: "\u57FA\u672C\u4FE1\u606F" },
  { cn: "\u76EE\u524D\u804C\u4E1A", en: "Current Occupation", code: "OCCU", dataType: "\u5B57\u7B26\u4E32\u578B", domain: "\u519C\u6797\u7267\u6E14\uFF0C\u5DE5\u4EBA\uFF0C\u884C\u653F\u7BA1\u7406\uFF0C\u4E13\u4E1A\u6280\u672F\uFF0C\u9500\u552E\u670D\u52A1\uFF0C\u5BB6\u52A1\uFF0C\u79C1\u8425\u4E1A\u4E3B\uFF0C\u79BB\u9000\u4F11\uFF0C\u5F85\u4E1A\uFF0C\u5176\u4ED6", constraint: "O", category: "\u57FA\u672C\u4FE1\u606F" },
  { cn: "\u804C\u4E1A\u6709\u5BB3\u7269\u8D28\u63A5\u89E6", en: "Occupational Hazard Exposure", code: "OCC_HAZ", dataType: "\u5B57\u7B26\u4E32\u578B", domain: "\u77F3\u68C9\uFF0C\u6A61\u80F6\uFF0C\u7164\u5C18\u7C89\u5C18\uFF0C\u519C\u836F\uFF0C\u653E\u5C04\u7EBF\uFF0C\u94CD\u94C0\u6C21\uFF0C\u5176\u4ED6\uFF0C\u672A\u63A5\u89E6", constraint: "O", category: "\u57FA\u672C\u4FE1\u606F" },
  { cn: "\u533B\u7597\u4FDD\u969C\u7C7B\u578B", en: "Medical Insurance Type", code: "INSURANCE", dataType: "\u5B57\u7B26\u4E32\u578B", domain: "\u65B0\u519C\u5408\uFF0C\u57CE\u9547\u5C45\u6C11\u533B\u4FDD\uFF0C\u57CE\u9547\u804C\u5DE5\u533B\u4FDD\uFF0C\u516C\u8D39\u533B\u7597\uFF0C\u5546\u4E1A\u4FDD\u9669\uFF0C\u81EA\u8D39\uFF0C\u5176\u4ED6", constraint: "O", category: "\u57FA\u672C\u4FE1\u606F" },
  { cn: "\u5BB6\u5EAD\u5E74\u6536\u5165", en: "Annual Household Income", code: "INCOME", dataType: "\u5B57\u7B26\u4E32\u578B", domain: "<1\uFF0C1-2.9\uFF0C3-4.9\uFF0C5-6.9\uFF0C7-8.9\uFF0C9-10.9\uFF0C11-19.9\uFF0C\u226520", constraint: "O", category: "\u57FA\u672C\u4FE1\u606F" },
  { cn: "\u5438\u70DF\u53F2", en: "Smoking History", code: "HIS_SMK", dataType: "\u5B57\u7B26\u4E32\u578B", domain: "\u4E0D\u5438\u70DF\uFF0C\u5076\u5C14\u5438\u70DF\uFF0C\u5927\u90E8\u5206\u5929\u6570\u5438\uFF0C\u6BCF\u5929\u5438", constraint: "M", category: "\u6D41\u884C\u75C5\u5B66-\u5438\u70DF" },
  { cn: "\u65E2\u5F80\u5438\u70DF\u4E60\u60EF", en: "Past Smoking Habit", code: "SMK_PAST", dataType: "\u5B57\u7B26\u4E32\u578B", domain: "\u4ECE\u4E0D\u5438\uFF0C\u5076\u5C14\u5438\uFF0C\u66FE\u5927\u90E8\u5206\u5929\u6570\u5438\uFF0C\u66FE\u6BCF\u5929\u5438", constraint: "O", category: "\u6D41\u884C\u75C5\u5B66-\u5438\u70DF" },
  { cn: "\u7D2F\u8BA1\u5438\u70DF\u8D85\u8FC7100\u652F", en: "Lifetime Smoking Over 100", code: "SMK_100", dataType: "\u5E03\u5C14\u578B", domain: "\u662F\uFF0C\u5426", constraint: "O", category: "\u6D41\u884C\u75C5\u5B66-\u5438\u70DF" },
  { cn: "\u6212\u70DF\u65F6\u957F", en: "Smoking Cessation Duration", code: "SMK_QUIT", dataType: "\u5B57\u7B26\u4E32\u578B", domain: "\u5E74/\u6708", constraint: "O", category: "\u6D41\u884C\u75C5\u5B66-\u5438\u70DF" },
  { cn: "\u5F00\u59CB\u6BCF\u65E5\u5438\u70DF\u5E74\u9F84", en: "Age Started Daily Smoking", code: "SMK_AGE", dataType: "\u6570\u503C\u578B", domain: "\u6B63\u6574\u6570\uFF08\u5C81\uFF09", constraint: "O", category: "\u6D41\u884C\u75C5\u5B66-\u5438\u70DF" },
  { cn: "\u6BCF\u65E5\u5438\u70DF\u91CF", en: "Daily Cigarette Amount", code: "SMK_AMT", dataType: "\u6570\u503C\u578B", domain: "\u652F/\u5929", constraint: "O", category: "\u6D41\u884C\u75C5\u5B66-\u5438\u70DF" },
  { cn: "\u88AB\u52A8\u5438\u70DF", en: "Passive Smoking", code: "SMK_PASSIVE", dataType: "\u5B57\u7B26\u4E32\u578B", domain: "\u4ECE\u65E0\uFF0C\u6709\u65F6\uFF0C1-2\u5929/\u5468\uFF0C3-5\u5929/\u5468\uFF0C\u6BCF\u5929", constraint: "O", category: "\u6D41\u884C\u75C5\u5B66-\u5438\u70DF" },
  { cn: "\u996E\u9152\u53F2", en: "Alcohol History", code: "HIS_ALC", dataType: "\u5B57\u7B26\u4E32\u578B", domain: "\u4ECE\u4E0D\uFF0C\u7279\u6B8A\u573A\u5408\u5076\u5C14\uFF0C\u7279\u5B9A\u6708\u4EFD\uFF0C\u6BCF\u6708\u4E0D\u5230\u6BCF\u5468\uFF0C\u6BCF\u5468\u81F3\u5C11\u4E00\u6B21", constraint: "M", category: "\u6D41\u884C\u75C5\u5B66-\u996E\u9152" },
  { cn: "\u65E2\u5F80\u89C4\u5F8B\u996E\u9152", en: "Past Regular Drinking", code: "ALC_PAST", dataType: "\u5E03\u5C14\u578B", domain: "\u662F\uFF0C\u5426", constraint: "O", category: "\u6D41\u884C\u75C5\u5B66-\u996E\u9152" },
  { cn: "\u5F00\u59CB\u6BCF\u5468\u996E\u9152\u5E74\u9F84", en: "Age Started Weekly Drinking", code: "ALC_AGE", dataType: "\u6570\u503C\u578B", domain: "\u6B63\u6574\u6570\uFF08\u5C81\uFF09", constraint: "O", category: "\u6D41\u884C\u75C5\u5B66-\u996E\u9152" },
  { cn: "\u6BCF\u5468\u996E\u9152\u5929\u6570", en: "Drinking Days per Week", code: "ALC_DAYS", dataType: "\u5B57\u7B26\u4E32\u578B", domain: "1-2\u5929/\u5468\uFF0C3-5\u5929/\u5468\uFF0C\u6BCF\u5929", constraint: "O", category: "\u6D41\u884C\u75C5\u5B66-\u996E\u9152" },
  { cn: "\u9AD8\u5EA6\u767D\u9152\u91CF", en: "High-proof Liquor Amount", code: "ALC_LIQUOR_H", dataType: "\u6570\u503C\u578B", domain: "\u4E24/\u5929", constraint: "O", category: "\u6D41\u884C\u75C5\u5B66-\u996E\u9152" },
  { cn: "\u4F4E\u5EA6\u767D\u9152\u91CF", en: "Low-proof Liquor Amount", code: "ALC_LIQUOR_L", dataType: "\u6570\u503C\u578B", domain: "\u4E24/\u5929", constraint: "O", category: "\u6D41\u884C\u75C5\u5B66-\u996E\u9152" },
  { cn: "\u996E\u9152\u540E\u9762\u7EA2\u53CD\u5E94", en: "Alcohol Flush Reaction", code: "ALC_FLUSH", dataType: "\u5B57\u7B26\u4E32\u578B", domain: "\u4E00\u4E8C\u53E3\u5373\u51FA\u73B0\uFF0C\u5C11\u91CF\u51FA\u73B0\uFF0C\u5927\u91CF\u624D\u51FA\u73B0\uFF0C\u4E0D\u51FA\u73B0", constraint: "O", category: "\u6D41\u884C\u75C5\u5B66-\u996E\u9152" },
  { cn: "\u996E\u8336\u53F2", en: "Tea Drinking History", code: "HIS_TEA", dataType: "\u5B57\u7B26\u4E32\u578B", domain: "\u4ECE\u4E0D\uFF0C\u7279\u6B8A\u573A\u5408\u5076\u5C14\uFF0C\u7279\u5B9A\u6708\u4EFD\uFF0C\u6BCF\u6708\u4E0D\u5230\u6BCF\u5468\uFF0C\u6BCF\u5468\u90FD\u996E", constraint: "O", category: "\u6D41\u884C\u75C5\u5B66-\u996E\u8336" },
  { cn: "\u8336\u6C34\u6E29\u5EA6\u504F\u597D", en: "Tea Temperature Preference", code: "TEA_TEMP", dataType: "\u5B57\u7B26\u4E32\u578B", domain: "\u6E29/\u51C9\u8336\uFF0C\u70ED\u8336\uFF0C\u6EDA\u70EB\u8336", constraint: "O", category: "\u6D41\u884C\u75C5\u5B66-\u996E\u8336" },
  { cn: "\u996E\u7528\u6C34\u6765\u6E90", en: "Drinking Water Source", code: "WATER_SRC", dataType: "\u5B57\u7B26\u4E32\u578B", domain: "\u5730\u7A96/\u6C60\u5858/\u6D45\u4E95\u6C34\uFF0C\u6E56\u6CB3\u6C34\uFF0C\u6DF1\u4E95/\u6CC9\u6C34\uFF0C\u81EA\u6765\u6C34\uFF0C\u7EAF\u51C0\u6C34\uFF0C\u5176\u4ED6", constraint: "O", category: "\u6D41\u884C\u75C5\u5B66-\u996E\u98DF" },
  { cn: "\u852C\u83DC\u6444\u5165\u9891\u7387", en: "Vegetable Intake Frequency", code: "DIET_VEG", dataType: "\u5B57\u7B26\u4E32\u578B", domain: "\u6BCF\u5929\uFF0C4-6\u5929/\u5468\uFF0C1-3\u5929/\u5468\uFF0C1-3\u5929/\u6708\uFF0C\u4E0D\u5403/\u6781\u5C11", constraint: "O", category: "\u6D41\u884C\u75C5\u5B66-\u996E\u98DF" },
  { cn: "\u6C34\u679C\u6444\u5165\u9891\u7387", en: "Fruit Intake Frequency", code: "DIET_FRUIT", dataType: "\u5B57\u7B26\u4E32\u578B", domain: "\u6BCF\u5929\uFF0C4-6\u5929/\u5468\uFF0C1-3\u5929/\u5468\uFF0C1-3\u5929/\u6708\uFF0C\u4E0D\u5403/\u6781\u5C11", constraint: "O", category: "\u6D41\u884C\u75C5\u5B66-\u996E\u98DF" },
  { cn: "\u755C\u8089\u6444\u5165\u9891\u7387", en: "Red Meat Intake Frequency", code: "DIET_MEAT", dataType: "\u5B57\u7B26\u4E32\u578B", domain: "\u6BCF\u5929\uFF0C4-6\u5929/\u5468\uFF0C1-3\u5929/\u5468\uFF0C1-3\u5929/\u6708\uFF0C\u4E0D\u5403/\u6781\u5C11", constraint: "O", category: "\u6D41\u884C\u75C5\u5B66-\u996E\u98DF" },
  { cn: "\u814C\u5236\u98DF\u54C1\u6444\u5165", en: "Pickled Food Intake", code: "DIET_PICKLE", dataType: "\u5B57\u7B26\u4E32\u578B", domain: "\u6BCF\u5929\uFF0C4-6\u5929/\u5468\uFF0C1-3\u5929/\u5468\uFF0C1-3\u5929/\u6708\uFF0C\u4E0D\u5403/\u6781\u5C11", constraint: "O", category: "\u6D41\u884C\u75C5\u5B66-\u996E\u98DF" },
  { cn: "\u70EB\u70ED\u98DF\u7269\u6444\u5165", en: "Hot Food Consumption", code: "DIET_HOT", dataType: "\u5B57\u7B26\u4E32\u578B", domain: "\u6BCF\u5929\uFF0C4-6\u5929/\u5468\uFF0C1-3\u5929/\u5468\uFF0C1-3\u5929/\u6708\uFF0C\u4ECE\u4E0D/\u6781\u5C11", constraint: "O", category: "\u6D41\u884C\u75C5\u5B66-\u996E\u98DF" },
  { cn: "\u6CB9\u70B8\u98DF\u7269\u6444\u5165", en: "Fried Food Consumption", code: "DIET_FRIED", dataType: "\u5B57\u7B26\u4E32\u578B", domain: "\u6BCF\u5929\uFF0C4-6\u5929/\u5468\uFF0C1-3\u5929/\u5468\uFF0C1-3\u5929/\u6708\uFF0C\u4ECE\u4E0D/\u6781\u5C11", constraint: "O", category: "\u6D41\u884C\u75C5\u5B66-\u996E\u98DF" },
  { cn: "\u9709\u53D8\u98DF\u7269\u6444\u5165", en: "Moldy Food Consumption", code: "DIET_MOLD", dataType: "\u5B57\u7B26\u4E32\u578B", domain: "\u6BCF\u5929\uFF0C4-6\u5929/\u5468\uFF0C1-3\u5929/\u5468\uFF0C1-3\u5929/\u6708\uFF0C\u4ECE\u4E0D/\u6781\u5C11", constraint: "O", category: "\u6D41\u884C\u75C5\u5B66-\u996E\u98DF" },
  { cn: "\u98DF\u7269\u77ED\u7F3A\u53F2", en: "Food Shortage History", code: "FOOD_SHORTAGE", dataType: "\u5E03\u5C14\u578B", domain: "\u662F\uFF0C\u5426", constraint: "O", category: "\u6D41\u884C\u75C5\u5B66-\u996E\u98DF" },
  { cn: "\u70F9\u996A\u71C3\u6599", en: "Cooking Fuel", code: "COOK_FUEL", dataType: "\u5B57\u7B26\u4E32\u578B", domain: "\u7164\u6C14/\u5929\u7136\u6C14\uFF0C\u7164/\u7164\u7403\uFF0C\u67F4/\u70AD\uFF0C\u7535\uFF0C\u5176\u4ED6", constraint: "O", category: "\u73AF\u5883\u66B4\u9732" },
  { cn: "\u804C\u4E1A\u4F53\u529B\u5F3A\u5EA6", en: "Occupational Physical Activity", code: "PA_OCC", dataType: "\u5B57\u7B26\u4E32\u578B", domain: "\u9759\u5750\u4E3A\u4E3B\uFF0C\u7AD9\u7ACB\u4E3A\u4E3B\uFF0C\u4E00\u822C\u4F53\u529B\u6D3B\uFF0C\u91CD\u4F53\u529B\u52B3\u52A8\uFF0C\u79BB\u9000\u4F11/\u65E0\u6CD5\u52B3\u52A8", constraint: "O", category: "\u4F53\u529B\u6D3B\u52A8" },
  { cn: "\u4F53\u80B2\u953B\u70BC\u9891\u7387", en: "Exercise Frequency", code: "EXERCISE_FREQ", dataType: "\u5B57\u7B26\u4E32\u578B", domain: "\u4ECE\u4E0D\uFF0C\u6BCF\u67081-3\u6B21\uFF0C\u6BCF\u54681-2\u6B21\uFF0C\u6BCF\u54683-5\u6B21\uFF0C\u6BCF\u5929", constraint: "O", category: "\u4F53\u529B\u6D3B\u52A8" },
  { cn: "\u8FD1\u4E00\u5E74\u4F53\u91CD\u53D8\u5316", en: "Weight Change Past Year", code: "WT_CHANGE", dataType: "\u5B57\u7B26\u4E32\u578B", domain: "\u53D8\u5316\u4E0D\u5927\uFF0C\u589E\u52A0\u22655\u65A4\uFF0C\u51CF\u5C11\u22655\u65A4", constraint: "O", category: "\u4F53\u529B\u6D3B\u52A8" },
  { cn: "\u521D\u6F6E\u5E74\u9F84", en: "Age at Menarche", code: "MENARCHE", dataType: "\u6570\u503C\u578B", domain: "\u6B63\u6574\u6570\uFF08\u5C81\uFF09\uFF0C\u65E0=0", constraint: "O", category: "\u5973\u6027\u751F\u80B2\u53F2" },
  { cn: "\u7EDD\u7ECF\u72B6\u6001", en: "Menopause Status", code: "MENOPAUSE", dataType: "\u5B57\u7B26\u4E32\u578B", domain: "\u5C1A\u672A\u95ED\u7ECF\uFF0C\u6B63\u5728\u7EDD\u7ECF\uFF0C\u5DF2\u5B8C\u5168\u95ED\u7ECF", constraint: "O", category: "\u5973\u6027\u751F\u80B2\u53F2" },
  { cn: "\u7EDD\u7ECF\u5E74\u9F84", en: "Age at Menopause", code: "MENO_AGE", dataType: "\u6570\u503C\u578B", domain: "\u6B63\u6574\u6570\uFF08\u5C81\uFF09", constraint: "O", category: "\u5973\u6027\u751F\u80B2\u53F2" },
  { cn: "\u6000\u5B55\u6B21\u6570", en: "Gravidity", code: "GRAVIDITY", dataType: "\u6570\u503C\u578B", domain: "\u975E\u8D1F\u6574\u6570", constraint: "O", category: "\u5973\u6027\u751F\u80B2\u53F2" },
  { cn: "\u6D3B\u4EA7\u6B21\u6570", en: "Parity", code: "PARITY", dataType: "\u6570\u503C\u578B", domain: "\u975E\u8D1F\u6574\u6570", constraint: "O", category: "\u5973\u6027\u751F\u80B2\u53F2" },
  { cn: "\u53E3\u670D\u907F\u5B55\u836F", en: "Oral Contraceptive Use", code: "OC_USE", dataType: "\u5B57\u7B26\u4E32\u578B", domain: "\u4ECE\u672A\uFF0C\u66FE\u7ECF\u7528\u8FC7\uFF0C\u76EE\u524D\u4ECD\u7528", constraint: "O", category: "\u5973\u6027\u751F\u80B2\u53F2" },
  { cn: "\u6FC0\u7D20\u66FF\u4EE3\u7597\u6CD5", en: "Hormone Replacement Therapy", code: "HRT", dataType: "\u5E03\u5C14\u578B", domain: "\u662F\uFF0C\u5426", constraint: "O", category: "\u5973\u6027\u751F\u80B2\u53F2" },
  { cn: "\u7761\u7720\u95EE\u9898", en: "Sleep Problems", code: "SLEEP_PROB", dataType: "\u5B57\u7B26\u4E32\u578B", domain: "\u5165\u7761\u56F0\u96BE\uFF0C\u65E9\u9192\uFF0C\u9700\u670D\u5B89\u7720\u836F\uFF0C\u767D\u5929\u56F0\u5026\uFF0C\u65E0", constraint: "O", category: "\u7761\u7720" },
  { cn: "\u7761\u7720\u65F6\u957F", en: "Sleep Duration", code: "SLEEP_DUR", dataType: "\u6570\u503C\u578B", domain: "\u5C0F\u65F6", constraint: "O", category: "\u7761\u7720" },
  { cn: "\u8F93\u8840\u53F2", en: "Blood Transfusion History", code: "TRANSFUSION", dataType: "\u6570\u503C\u578B", domain: "\u975E\u8D1F\u6574\u6570", constraint: "O", category: "\u4E2A\u4EBA\u53CA\u5BB6\u65CF\u75C5\u53F2" },
  { cn: "\u5065\u5EB7\u81EA\u8BC4", en: "Self-rated Health", code: "HEALTH_SELF", dataType: "\u5B57\u7B26\u4E32\u578B", domain: "\u826F\u597D\uFF0C\u8F83\u597D\uFF0C\u4E00\u822C\uFF0C\u8F83\u5DEE", constraint: "O", category: "\u4E2A\u4EBA\u53CA\u5BB6\u65CF\u75C5\u53F2" },
  { cn: "\u541E\u54BD\u56F0\u96BE", en: "Dysphagia", code: "DYSPHAGIA", dataType: "\u5B57\u7B26\u4E32\u578B", domain: "\u6BCF\u5929\uFF0C4-6\u5929/\u5468\uFF0C1-3\u5929/\u5468\uFF0C1-3\u5929/\u6708\uFF0C\u5076\u5C14/\u65E0", constraint: "O", category: "\u4E2A\u4EBA\u53CA\u5BB6\u65CF\u75C5\u53F2" },
  { cn: "\u80F8\u9AA8\u540E\u75BC\u75DB", en: "Retrosternal Pain", code: "RETRO_PAIN", dataType: "\u5B57\u7B26\u4E32\u578B", domain: "\u6BCF\u5929\uFF0C4-6\u5929/\u5468\uFF0C1-3\u5929/\u5468\uFF0C1-3\u5929/\u6708\uFF0C\u5076\u5C14/\u65E0", constraint: "O", category: "\u4E2A\u4EBA\u53CA\u5BB6\u65CF\u75C5\u53F2" },
  { cn: "\u70E7\u5FC3\u53CD\u9178", en: "Heartburn and Acid Reflux", code: "HEARTBURN", dataType: "\u5B57\u7B26\u4E32\u578B", domain: "\u6BCF\u5929\uFF0C4-6\u5929/\u5468\uFF0C1-3\u5929/\u5468\uFF0C1-3\u5929/\u6708\uFF0C\u5076\u5C14/\u65E0", constraint: "O", category: "\u4E2A\u4EBA\u53CA\u5BB6\u65CF\u75C5\u53F2" },
  { cn: "\u8FDB\u98DF\u54FD\u564E\u611F", en: "Food Sticking Sensation", code: "ODYNO", dataType: "\u5B57\u7B26\u4E32\u578B", domain: "\u6BCF\u5929\uFF0C4-6\u5929/\u5468\uFF0C1-3\u5929/\u5468\uFF0C1-3\u5929/\u6708\uFF0C\u5076\u5C14/\u65E0", constraint: "O", category: "\u4E2A\u4EBA\u53CA\u5BB6\u65CF\u75C5\u53F2" },
  { cn: "\u8FDB\u884C\u6027\u6D88\u7626", en: "Progressive Weight Loss", code: "WT_LOSS", dataType: "\u5E03\u5C14\u578B", domain: "\u6709\uFF0C\u65E0", constraint: "O", category: "\u4E2A\u4EBA\u53CA\u5BB6\u65CF\u75C5\u53F2" },
  { cn: "\u9ED1\u4FBF", en: "Melena", code: "MELENA", dataType: "\u5B57\u7B26\u4E32\u578B", domain: "\u6BCF\u5929\uFF0C4-6\u5929/\u5468\uFF0C1-3\u5929/\u5468\uFF0C1-3\u5929/\u6708\uFF0C\u5076\u5C14/\u65E0", constraint: "O", category: "\u4E2A\u4EBA\u53CA\u5BB6\u65CF\u75C5\u53F2" },
  { cn: "\u5E7D\u95E8\u87BA\u6746\u83CC\u611F\u67D3\u53F2", en: "Helicobacter pylori Infection History", code: "HP_INFECT", dataType: "\u5B57\u7B26\u4E32\u578B", domain: "\u6709\uFF0C\u65E0\uFF0C\u4E0D\u8BE6", constraint: "O", category: "\u4E2A\u4EBA\u53CA\u5BB6\u65CF\u75C5\u53F2" },
  { cn: "\u53CD\u6D41\u6027\u98DF\u7BA1\u708E\u53F2", en: "Reflux Esophagitis History", code: "HIS_EI", dataType: "\u5B57\u7B26\u4E32\u578B", domain: "\u662F\uFF0C\u5426\uFF0C\u4E0D\u6E05\u695A", constraint: "M", category: "\u4E2A\u4EBA\u53CA\u5BB6\u65CF\u75C5\u53F2" },
  { cn: "\u6162\u6027\u80C3\u708E\u53F2", en: "Chronic Gastritis History", code: "HIS_GI", dataType: "\u5B57\u7B26\u4E32\u578B", domain: "\u6D45\u8868\u6027\uFF0C\u840E\u7F29\u6027\uFF0C\u80A5\u539A\u6027\uFF0C\u65E0", constraint: "M", category: "\u4E2A\u4EBA\u53CA\u5BB6\u65CF\u75C5\u53F2" },
  { cn: "\u6D88\u5316\u9053\u6E83\u75A1\u53F2", en: "Peptic Ulcer History", code: "HIS_ULCER", dataType: "\u5B57\u7B26\u4E32\u578B", domain: "\u80C3\u6E83\u75A1\uFF0C\u5341\u4E8C\u6307\u80A0\u6E83\u75A1\uFF0C\u65E0", constraint: "O", category: "\u4E2A\u4EBA\u53CA\u5BB6\u65CF\u75C5\u53F2" },
  { cn: "\u6D88\u5316\u7CFB\u7EDF\u606F\u8089\u53F2", en: "GI Polyp History", code: "HIS_POLYP", dataType: "\u5B57\u7B26\u4E32\u578B", domain: "\u80C3\u606F\u8089\uFF0C\u80C6\u56CA\u606F\u8089\uFF0C\u80A0\u606F\u8089\uFF0C\u5BB6\u65CF\u6027\u817A\u7624\u6027\u606F\u8089\u75C5\uFF0C\u65E0", constraint: "O", category: "\u4E2A\u4EBA\u53CA\u5BB6\u65CF\u75C5\u53F2" },
  { cn: "\u6162\u6027\u809D\u708E\u809D\u786C\u5316\u53F2", en: "Chronic Hepatitis/Cirrhosis History", code: "HIS_LIVER", dataType: "\u5B57\u7B26\u4E32\u578B", domain: "\u6162\u6027\u4E59\u809D\uFF0C\u6162\u6027\u4E19\u809D\uFF0C\u9152\u7CBE\u6027\u809D\u708E\uFF0C\u81EA\u8EAB\u514D\u75AB\u6027\u809D\u75C5\uFF0C\u809D\u786C\u5316\uFF0C\u65E0", constraint: "O", category: "\u4E2A\u4EBA\u53CA\u5BB6\u65CF\u75C5\u53F2" },
  { cn: "\u7CD6\u5C3F\u75C5\u53F2", en: "Diabetes History", code: "HIS_DM", dataType: "\u5B57\u7B26\u4E32\u578B", domain: "\u2160\u578B\uFF0C\u2161\u578B\uFF0C\u65E0", constraint: "O", category: "\u4E2A\u4EBA\u53CA\u5BB6\u65CF\u75C5\u53F2" },
  { cn: "\u9AD8\u8840\u538B\u53F2", en: "Hypertension History", code: "HIS_HTN", dataType: "\u5E03\u5C14\u578B", domain: "\u662F\uFF0C\u5426\uFF0C\u4E0D\u6E05\u695A", constraint: "O", category: "\u4E2A\u4EBA\u53CA\u5BB6\u65CF\u75C5\u53F2" },
  { cn: "\u6076\u6027\u80BF\u7624\u53F2", en: "Malignancy History", code: "HIS_CANCER", dataType: "\u5E03\u5C14\u578B", domain: "\u662F\uFF0C\u5426", constraint: "O", category: "\u4E2A\u4EBA\u53CA\u5BB6\u65CF\u75C5\u53F2" },
  { cn: "\u6076\u6027\u80BF\u7624\u8BCA\u65AD\u65F6\u95F4", en: "Malignancy Diagnosis Date", code: "CANCER_DATE", dataType: "\u65F6\u95F4", domain: "YYYY", constraint: "O", category: "\u4E2A\u4EBA\u53CA\u5BB6\u65CF\u75C5\u53F2" },
  { cn: "\u6076\u6027\u80BF\u7624\u79CD\u7C7B", en: "Malignancy Type", code: "CANCER_TYPE", dataType: "\u5B57\u7B26\u4E32\u578B", domain: "\u89C1\u80BF\u7624\u79CD\u7C7B\u7F16\u78011-28", constraint: "O", category: "\u4E2A\u4EBA\u53CA\u5BB6\u65CF\u75C5\u53F2" },
  { cn: "\u6CBB\u7597\u53F2", en: "Treatment History", code: "HIS_TRT", dataType: "\u5B57\u7B26\u4E32\u578B", domain: "\u624B\u672F\uFF0C\u653E\u7597\uFF0C\u5316\u7597\uFF0C\u624B\u672F+\u653E\u7597\uFF0C\u624B\u672F+\u5316\u7597\uFF0C\u653E\u7597+\u5316\u7597\uFF0C\u7EFC\u5408\uFF0C\u672A\u6CBB\u7597\uFF0C\u5176\u4ED6", constraint: "M", category: "\u4E2A\u4EBA\u53CA\u5BB6\u65CF\u75C5\u53F2" },
  { cn: "\u5BB6\u65CF\u80BF\u7624\u53F2", en: "Family Cancer History", code: "HIS_FAM", dataType: "\u5B57\u7B26\u4E32\u578B", domain: "\u4EB2\u5C5E\u5173\u7CFB\u7F16\u7801+\u80BF\u7624\u79CD\u7C7B\u7F16\u7801", constraint: "M", category: "\u4E2A\u4EBA\u53CA\u5BB6\u65CF\u75C5\u53F2" },
  { cn: "\u5BB6\u65CF\u6162\u75C5\u53F2", en: "Family Chronic Disease History", code: "HIS_FAM_CD", dataType: "\u5B57\u7B26\u4E32\u578B", domain: "\u4EB2\u5C5E\u5173\u7CFB\u7F16\u7801+\u75BE\u75C5\u79CD\u7C7B\u7F16\u7801", constraint: "O", category: "\u4E2A\u4EBA\u53CA\u5BB6\u65CF\u75C5\u53F2" },
  { cn: "\u975E\u753E\u4F53\u6297\u708E\u836F\u4F7F\u7528", en: "NSAID Use", code: "MED_NSAID", dataType: "\u5B57\u7B26\u4E32\u578B", domain: "\u6BCF\u5929\uFF0C\u6BCF\u5468\uFF0C\u6BCF\u6708\uFF0C\u5076\u5C14\uFF0C\u5426", constraint: "O", category: "\u836F\u7269\u4F7F\u7528\u53F2" },
  { cn: "\u753E\u4F53\u6297\u708E\u836F\u4F7F\u7528", en: "Corticosteroid Use", code: "MED_STEROID", dataType: "\u5B57\u7B26\u4E32\u578B", domain: "\u6BCF\u5929\uFF0C\u6BCF\u5468\uFF0C\u6BCF\u6708\uFF0C\u5076\u5C14\uFF0C\u5426", constraint: "O", category: "\u836F\u7269\u4F7F\u7528\u53F2" },
  { cn: "\u6291\u9178\u836F\u7269\u4F7F\u7528", en: "Acid Suppressant Use", code: "MED_PPI", dataType: "\u5B57\u7B26\u4E32\u578B", domain: "\u6BCF\u5929\uFF0C\u6BCF\u5468\uFF0C\u6BCF\u6708\uFF0C\u5076\u5C14\uFF0C\u5426", constraint: "O", category: "\u836F\u7269\u4F7F\u7528\u53F2" },
  { cn: "\u8EAB\u9AD8", en: "Height", code: "HEIGHT", dataType: "\u6570\u503C\u578B", domain: "\u6B63\u6570", constraint: "M", category: "\u4F53\u683C\u68C0\u67E5" },
  { cn: "\u4F53\u91CD", en: "Weight", code: "WEIGHT", dataType: "\u6570\u503C\u578B", domain: "\u6B63\u6570", constraint: "M", category: "\u4F53\u683C\u68C0\u67E5" },
  { cn: "\u4F53\u8D28\u6307\u6570", en: "Body Mass Index", code: "BMI", dataType: "\u6570\u503C\u578B", domain: "\u6B63\u6570", constraint: "O", category: "\u4F53\u683C\u68C0\u67E5" },
  { cn: "\u8170\u56F4", en: "Waist Circumference", code: "WAIST", dataType: "\u6570\u503C\u578B", domain: "\u6B63\u6570", constraint: "O", category: "\u4F53\u683C\u68C0\u67E5" },
  { cn: "\u4E59\u809D\u8868\u9762\u6297\u539F", en: "Hepatitis B Surface Antigen", code: "HBSAG", dataType: "\u5B57\u7B26\u4E32\u578B", domain: "\u9634\u6027\uFF0C\u9633\u6027", constraint: "O", category: "\u5B9E\u9A8C\u5BA4\u68C0\u6D4B" },
  { cn: "\u4E19\u809D\u6297\u4F53", en: "Anti-HCV Antibody", code: "ANTI_HCV", dataType: "\u5B57\u7B26\u4E32\u578B", domain: "\u9634\u6027\uFF0C\u9633\u6027", constraint: "O", category: "\u5B9E\u9A8C\u5BA4\u68C0\u6D4B" },
  { cn: "\u5E7D\u95E8\u87BA\u6746\u83CC\u68C0\u6D4B", en: "Helicobacter pylori Test", code: "HP_TEST", dataType: "\u5B57\u7B26\u4E32\u578B", domain: "\u9634\u6027\uFF0C\u9633\u6027", constraint: "O", category: "\u5B9E\u9A8C\u5BA4\u68C0\u6D4B" },
  { cn: "\u7A7A\u8179\u8840\u7CD6", en: "Fasting Blood Glucose", code: "FBG", dataType: "\u6570\u503C\u578B", domain: "\u6B63\u6570", constraint: "O", category: "\u5B9E\u9A8C\u5BA4\u68C0\u6D4B" },
  { cn: "\u7518\u6CB9\u4E09\u916F", en: "Triglyceride", code: "TG", dataType: "\u6570\u503C\u578B", domain: "\u6B63\u6570", constraint: "O", category: "\u5B9E\u9A8C\u5BA4\u68C0\u6D4B" },
  { cn: "\u603B\u80C6\u56FA\u9187", en: "Total Cholesterol", code: "CHOL", dataType: "\u6570\u503C\u578B", domain: "\u6B63\u6570", constraint: "O", category: "\u5B9E\u9A8C\u5BA4\u68C0\u6D4B" },
  { cn: "\u9AD8\u5BC6\u5EA6\u8102\u86CB\u767D\u80C6\u56FA\u9187", en: "HDL Cholesterol", code: "HDL", dataType: "\u6570\u503C\u578B", domain: "\u6B63\u6570", constraint: "O", category: "\u5B9E\u9A8C\u5BA4\u68C0\u6D4B" },
  { cn: "\u4F4E\u5BC6\u5EA6\u8102\u86CB\u767D\u80C6\u56FA\u9187", en: "LDL Cholesterol", code: "LDL", dataType: "\u6570\u503C\u578B", domain: "\u6B63\u6570", constraint: "O", category: "\u5B9E\u9A8C\u5BA4\u68C0\u6D4B" },
  { cn: "\u80C3\u86CB\u767D\u9176\u539FI", en: "Pepsinogen I", code: "PG1", dataType: "\u6570\u503C\u578B", domain: "\u6B63\u6570", constraint: "O", category: "\u5B9E\u9A8C\u5BA4\u68C0\u6D4B" },
  { cn: "\u80C3\u86CB\u767D\u9176\u539F\u6BD4\u503C", en: "Pepsinogen I/II Ratio", code: "PGR", dataType: "\u6570\u503C\u578B", domain: "\u6B63\u6570", constraint: "O", category: "\u5B9E\u9A8C\u5BA4\u68C0\u6D4B" },
  { cn: "\u80C3\u6CCC\u7D20-17", en: "Gastrin-17", code: "G17", dataType: "\u6570\u503C\u578B", domain: "\u6B63\u6570", constraint: "O", category: "\u5B9E\u9A8C\u5BA4\u68C0\u6D4B" },
  { cn: "\u5185\u955C\u53F7", en: "Endoscopy ID", code: "ENDO_ID", dataType: "\u5B57\u7B26\u4E32\u578B", domain: "", constraint: "M", category: "\u5185\u955C\u68C0\u67E5" },
  { cn: "\u5185\u955C\u8BCA\u7597\u65E5\u671F", en: "Endoscopy Date", code: "ENDO_DATE", dataType: "\u65F6\u95F4", domain: "YYYY-MM-DD", constraint: "M", category: "\u5185\u955C\u68C0\u67E5" },
  { cn: "\u7B5B\u67E5\u7C7B\u578B", en: "Screening Type", code: "FOLLOWUP", dataType: "\u5B57\u7B26\u4E32\u578B", domain: "\u9996\u6B21\u7B5B\u67E5\uFF0C\u590D\u67E5/\u968F\u8BBF", constraint: "O", category: "\u5185\u955C\u68C0\u67E5" },
  { cn: "\u662F\u5426\u65E0\u75DB", en: "Painless Endoscopy", code: "ANESTHESIA", dataType: "\u5E03\u5C14\u578B", domain: "\u662F\uFF0C\u5426", constraint: "O", category: "\u5185\u955C\u68C0\u67E5" },
  { cn: "\u67D3\u8272\u65B9\u6CD5", en: "Chromoendoscopy Method", code: "STAIN", dataType: "\u5B57\u7B26\u4E32\u578B", domain: "\u5362\u6208\u6C0F\u7898\u67D3\u8272\uFF0C\u7535\u5B50\u67D3\u8272\uFF0C\u65E0\u67D3\u8272\uFF0C\u5176\u4ED6", constraint: "O", category: "\u5185\u955C\u68C0\u67E5" },
  { cn: "\u662F\u5426\u6D3B\u68C0", en: "Biopsy Performed", code: "BIOPSY", dataType: "\u5E03\u5C14\u578B", domain: "\u662F\uFF0C\u5426", constraint: "O", category: "\u5185\u955C\u68C0\u67E5" },
  { cn: "\u75C5\u53D8\u4F4D\u7F6E\uFF08\u5185\u955C\uFF09", en: "Endoscopic Lesion Location", code: "ENDO_LOC", dataType: "\u5B57\u7B26\u4E32\u578B", domain: "\u9888\u6BB5\uFF0C\u4E0A\u6BB5\uFF0C\u4E2D\u6BB5\uFF0C\u4E0B\u6BB5\uFF0C\u8D32\u95E8", constraint: "O", category: "\u5185\u955C\u68C0\u67E5" },
  { cn: "\u7898\u67D3\u8272\u5206\u7EA7", en: "Lugol Staining Grade", code: "LUGOL", dataType: "\u5B57\u7B26\u4E32\u578B", domain: "I\u7EA7\uFF0CII\u7EA7\uFF0CIII\u7EA7\uFF0CIV\u7EA7", constraint: "O", category: "\u5185\u955C\u68C0\u67E5" },
  { cn: "\u5185\u955C\u8BCA\u65AD", en: "Endoscopic Diagnosis", code: "DIAG_ENDO", dataType: "\u5B57\u7B26\u4E32\u578B", domain: "", constraint: "O", category: "\u5185\u955C\u68C0\u67E5" },
  { cn: "\u89C2\u5BDF\u8BB0\u5F55\u53C2\u8003\u63CF\u8FF0", en: "Endoscopy Description", code: "DIAG_ENDO_DIS", dataType: "\u5B57\u7B26\u4E32\u578B", domain: "", constraint: "O", category: "\u5185\u955C\u68C0\u67E5" },
  { cn: "\u5185\u955C\u62A5\u544A", en: "Endoscopy Report", code: "ENDO_RPT", dataType: "\u5B57\u7B26\u4E32\u578B", domain: "", constraint: "O", category: "\u5185\u955C\u68C0\u67E5" },
  { cn: "\u8D85\u58F0\u5185\u955C\u6D78\u6DA6\u6DF1\u5EA6", en: "EUS Invasion Depth", code: "EUS_DEPTH", dataType: "\u6570\u503C\u578B", domain: "mm\u6216cm", constraint: "O", category: "\u5185\u955C\u68C0\u67E5" },
  { cn: "CT\u65F6\u95F4", en: "CT Date", code: "CT_DATE", dataType: "\u65F6\u95F4", domain: "YYYY-MM-DD", constraint: "O", category: "\u5F71\u50CF\u5B66\u68C0\u67E5" },
  { cn: "CT\u7C7B\u578B", en: "CT Type", code: "CT_TYPE", dataType: "\u5B57\u7B26\u4E32\u578B", domain: "\u5E73\u626B\uFF0C\u589E\u5F3A", constraint: "O", category: "\u5F71\u50CF\u5B66\u68C0\u67E5" },
  { cn: "\u75C5\u53D8\u4F4D\u7F6E\uFF08CT\uFF09", en: "CT Lesion Location", code: "CT_LOC", dataType: "\u5B57\u7B26\u4E32\u578B", domain: "", constraint: "O", category: "\u5F71\u50CF\u5B66\u68C0\u67E5" },
  { cn: "\u8BCA\u65AD\u540D\u79F0\uFF08CT\uFF09", en: "CT Diagnosis", code: "CT_DIAG", dataType: "\u5B57\u7B26\u4E32\u578B", domain: "", constraint: "O", category: "\u5F71\u50CF\u5B66\u68C0\u67E5" },
  { cn: "M\u5206\u671F", en: "Distant Metastasis Stage", code: "cM", dataType: "\u5B57\u7B26\u4E32\u578B", domain: "M0\uFF0CM1\uFF0CMx", constraint: "O", category: "\u5F71\u50CF\u5B66\u68C0\u67E5" },
  { cn: "\u8F6C\u79FB\u90E8\u4F4D", en: "Metastasis Site", code: "MET_SITE", dataType: "\u5B57\u7B26\u4E32\u578B", domain: "\u809D\uFF0C\u80BA\uFF0C\u9AA8\uFF0C\u8FDC\u5904\u6DCB\u5DF4\u7ED3\uFF0C\u5176\u4ED6", constraint: "O", category: "\u5F71\u50CF\u5B66\u68C0\u67E5" },
  { cn: "\u75C5\u7406\u53F7", en: "Pathology ID", code: "PATH_ID", dataType: "\u5B57\u7B26\u4E32\u578B", domain: "", constraint: "M", category: "\u75C5\u7406\u68C0\u67E5" },
  { cn: "\u6807\u672C\u53F7", en: "Specimen Number", code: "SPEC_NO", dataType: "\u6570\u503C\u578B", domain: "\u6B63\u6574\u6570", constraint: "O", category: "\u75C5\u7406\u68C0\u67E5" },
  { cn: "\u75C5\u7406\u65F6\u95F4", en: "Pathology Date", code: "PATH_DATE", dataType: "\u65F6\u95F4", domain: "YYYY-MM-DD", constraint: "O", category: "\u75C5\u7406\u68C0\u67E5" },
  { cn: "\u6837\u672C\u7C7B\u578B", en: "Specimen Type", code: "PATH_TYPE", dataType: "\u5B57\u7B26\u4E32\u578B", domain: "\u6D3B\u68C0\uFF0C\u5185\u955C\u4E0B\u5207\u9664\uFF08EMR/ESD\uFF09\uFF0C\u624B\u672F", constraint: "O", category: "\u75C5\u7406\u68C0\u67E5" },
  { cn: "\u6D3B\u68C0\u4F4D\u7F6E", en: "Biopsy Location", code: "PATH_LOC", dataType: "\u5B57\u7B26\u4E32\u578B", domain: "", constraint: "O", category: "\u75C5\u7406\u68C0\u67E5" },
  { cn: "\u56FA\u6709\u819C", en: "Lamina Propria", code: "LAMINA", dataType: "\u5E03\u5C14\u578B", domain: "\u65E0\uFF0C\u6709", constraint: "O", category: "\u75C5\u7406\u68C0\u67E5" },
  { cn: "\u75C5\u7406\u98DF\u7BA1\u6700\u9AD8\u8BCA\u65AD", en: "Esophagus Top Pathology Diagnosis", code: "ES_SEVERE", dataType: "\u5B57\u7B26\u4E32\u578B", domain: "\u89C1\u75C5\u7406\u8BCA\u65AD\u7F16\u78011-99", constraint: "O", category: "\u75C5\u7406\u68C0\u67E5" },
  { cn: "\u75C5\u7406\u8D32\u95E8\u6700\u9AD8\u8BCA\u65AD", en: "Cardia Top Pathology Diagnosis", code: "CAR_SEVERE", dataType: "\u5B57\u7B26\u4E32\u578B", domain: "\u89C1\u75C5\u7406\u8BCA\u65AD\u7F16\u78011-99", constraint: "O", category: "\u75C5\u7406\u68C0\u67E5" },
  { cn: "\u75C5\u7406\u80C3\u6700\u9AD8\u8BCA\u65AD", en: "Stomach Top Pathology Diagnosis", code: "STO_SEVERE", dataType: "\u5B57\u7B26\u4E32\u578B", domain: "\u89C1\u75C5\u7406\u8BCA\u65AD\u7F16\u78011-99", constraint: "O", category: "\u75C5\u7406\u68C0\u67E5" },
  { cn: "\u75C5\u7406\u8BCA\u65AD\u7F16\u7801", en: "Pathology Diagnosis Code", code: "PATH_CODE", dataType: "\u5B57\u7B26\u4E32\u578B", domain: "1\u6B63\u5E38\u9CDE\u72B6\u4E0A\u76AE\u202615\u9CDE\u72B6\u7EC6\u80DE\u764C\u202623\u817A\u764C\u202699\u4E0D\u8DB3\u4EE5\u8BCA\u65AD", constraint: "O", category: "\u75C5\u7406\u68C0\u67E5" },
  { cn: "\u75C5\u7406\u8BCA\u65AD\u63CF\u8FF0", en: "Pathology Diagnosis Description", code: "DIAG_PATH_DIS", dataType: "\u5B57\u7B26\u4E32\u578B", domain: "", constraint: "O", category: "\u75C5\u7406\u68C0\u67E5" },
  { cn: "\u7EC4\u7EC7\u5B66\u7C7B\u578B", en: "Histological Type", code: "HISTO_TYPE", dataType: "\u5B57\u7B26\u4E32\u578B", domain: "\u9CDE\u72B6\u7EC6\u80DE\u764C\uFF0C\u817A\u764C\uFF0C\u817A\u9CDE\u764C\uFF0C\u795E\u7ECF\u5185\u5206\u6CCC\u764C\uFF0C\u795E\u7ECF\u5185\u5206\u6CCC\u80BF\u7624\uFF0C\u672A\u5206\u7C7B\u764C\uFF0C\u5176\u4ED6", constraint: "O", category: "\u75C5\u7406\u68C0\u67E5" },
  { cn: "\u7EC4\u7EC7\u5B66\u5206\u7EA7", en: "Histologic Grade", code: "GRADE", dataType: "\u5B57\u7B26\u4E32\u578B", domain: "G1\u9AD8\u5206\u5316\uFF0CG2\u4E2D\u5206\u5316\uFF0CG3\u4F4E\u5206\u5316\uFF0CGx", constraint: "O", category: "\u75C5\u7406\u68C0\u67E5" },
  { cn: "\u4E0A\u76AE\u5185\u7624\u53D8\u7EA7\u522B", en: "Intraepithelial Neoplasia Grade", code: "IEN", dataType: "\u5B57\u7B26\u4E32\u578B", domain: "\u4F4E\u7EA7\u522B\uFF0C\u9AD8\u7EA7\u522B\uFF0C\u4E0D\u80FD\u5206\u7C7B", constraint: "O", category: "\u75C5\u7406\u68C0\u67E5" },
  { cn: "\u662F\u5426\u65E9\u764C", en: "Early Cancer", code: "EARLY", dataType: "\u5E03\u5C14\u578B", domain: "\u662F\uFF0C\u5426", constraint: "O", category: "\u75C5\u7406\u68C0\u67E5" },
  { cn: "\u6D78\u6DA6\u6DF1\u5EA6", en: "Invasion Depth", code: "INV_DEPTH", dataType: "\u5B57\u7B26\u4E32\u578B", domain: "\u9ECF\u819C\u5185\uFF08M1/M2/M3\uFF09\uFF0C\u9ECF\u819C\u4E0B\uFF08SM1/SM2/SM3\uFF09\uFF0C\u56FA\u6709\u808C\u5C42\u53CA\u4EE5\u4E0A", constraint: "O", category: "\u75C5\u7406\u68C0\u67E5" },
  { cn: "\u8109\u7BA1\u4FB5\u72AF", en: "Lymphovascular Invasion", code: "LVI", dataType: "\u5B57\u7B26\u4E32\u578B", domain: "\u65E0\uFF0C\u6709", constraint: "O", category: "\u75C5\u7406\u68C0\u67E5" },
  { cn: "\u5207\u7F18\u72B6\u6001", en: "Margin Status", code: "MARGIN", dataType: "\u5B57\u7B26\u4E32\u578B", domain: "\u9634\u6027\uFF0C\u9633\u6027\uFF0C\u8DDD\u6700\u8FD1\u5207\u7F18\u8DDD\u79BB", constraint: "O", category: "\u75C5\u7406\u68C0\u67E5" },
  { cn: "T\u5206\u671F", en: "Pathologic T Stage", code: "pT", dataType: "\u5B57\u7B26\u4E32\u578B", domain: "Tis\uFF0CT1a\uFF0CT1b\uFF0CT2\uFF0CT3\uFF0CT4a\uFF0CT4b", constraint: "O", category: "\u75C5\u7406\u68C0\u67E5" },
  { cn: "N\u5206\u671F", en: "Pathologic N Stage", code: "pN", dataType: "\u5B57\u7B26\u4E32\u578B", domain: "N0\uFF0CN1\uFF0CN2\uFF0CN3", constraint: "O", category: "\u75C5\u7406\u68C0\u67E5" },
  { cn: "TNM\u603B\u5206\u671F", en: "TNM Stage Group", code: "STAGE", dataType: "\u5B57\u7B26\u4E32\u578B", domain: "0\uFF0CI\uFF0CII\uFF0CIII\uFF0CIVA\uFF0CIVB", constraint: "O", category: "\u75C5\u7406\u68C0\u67E5" },
  { cn: "\u6DCB\u5DF4\u7ED3\u68C0\u51FA\u6570", en: "Examined Lymph Nodes", code: "LN_EXAM", dataType: "\u6570\u503C\u578B", domain: "\u975E\u8D1F\u6574\u6570", constraint: "O", category: "\u75C5\u7406\u68C0\u67E5" },
  { cn: "\u6DCB\u5DF4\u7ED3\u8F6C\u79FB\u6570", en: "Positive Lymph Nodes", code: "LN_POS", dataType: "\u6570\u503C\u578B", domain: "\u975E\u8D1F\u6574\u6570", constraint: "O", category: "\u75C5\u7406\u68C0\u67E5" },
  { cn: "\u968F\u8BBF", en: "Follow-up", code: "FOLLOWUP_PATH", dataType: "\u5E03\u5C14\u578B", domain: "\u662F\uFF0C\u5426", constraint: "O", category: "\u75C5\u7406\u68C0\u67E5" },
  { cn: "\u9996\u8BCA\u65E5\u671F", en: "Diagnosis Date", code: "DIAG_DATE", dataType: "\u65F6\u95F4", domain: "YYYY-MM-DD", constraint: "M", category: "\u8BCA\u65AD\u4E0E\u5206\u671F" },
  { cn: "\u4E3B\u8BC9\u75C7\u72B6", en: "Chief Complaint", code: "CHIEF_COM", dataType: "\u5B57\u7B26\u4E32\u578B", domain: "\u541E\u54BD\u56F0\u96BE\uFF0C\u80F8\u9AA8\u540E\u75BC\u75DB\uFF0C\u8FDB\u98DF\u54FD\u564E\uFF0C\u58F0\u97F3\u5636\u54D1\uFF0C\u8FDB\u884C\u6027\u6D88\u7626\uFF0C\u65E0\u75C7\u72B6\uFF0C\u5176\u4ED6", constraint: "M", category: "\u8BCA\u65AD\u4E0E\u5206\u671F" },
  { cn: "\u75C7\u72B6\u6301\u7EED\u65F6\u95F4", en: "Symptom Duration", code: "SYM_DUR", dataType: "\u6570\u503C\u578B", domain: "\u6B63\u6570", constraint: "O", category: "\u8BCA\u65AD\u4E0E\u5206\u671F" },
  { cn: "\u53D1\u73B0\u65B9\u5F0F", en: "Detection Method", code: "DETECT_METHOD", dataType: "\u5B57\u7B26\u4E32\u578B", domain: "\u7B5B\u67E5\u53D1\u73B0\uFF0C\u75C7\u72B6\u5C31\u8BCA\uFF0C\u4F53\u68C0\u53D1\u73B0\uFF0C\u5176\u4ED6", constraint: "M", category: "\u8BCA\u65AD\u4E0E\u5206\u671F" },
  { cn: "\u4E34\u5E8AT\u5206\u671F", en: "Clinical T Stage", code: "cT", dataType: "\u5B57\u7B26\u4E32\u578B", domain: "T0\uFF0CTis\uFF0CT1a\uFF0CT1b\uFF0CT2\uFF0CT3\uFF0CT4a\uFF0CT4b\uFF0CTx", constraint: "M", category: "\u8BCA\u65AD\u4E0E\u5206\u671F" },
  { cn: "\u4E34\u5E8AN\u5206\u671F", en: "Clinical N Stage", code: "cN", dataType: "\u5B57\u7B26\u4E32\u578B", domain: "N0\uFF0CN1\uFF0CN2\uFF0CN3\uFF0CNx", constraint: "M", category: "\u8BCA\u65AD\u4E0E\u5206\u671F" },
  { cn: "\u4E34\u5E8AM\u5206\u671F", en: "Clinical M Stage", code: "cM_DIAG", dataType: "\u5B57\u7B26\u4E32\u578B", domain: "M0\uFF0CM1\uFF0CMx", constraint: "M", category: "\u8BCA\u65AD\u4E0E\u5206\u671F" },
  { cn: "\u4E34\u5E8ATNM\u603B\u5206\u671F", en: "Clinical Stage Group", code: "cSTAGE", dataType: "\u5B57\u7B26\u4E32\u578B", domain: "0\uFF0CI\uFF0CIIA\uFF0CIIB\uFF0CIII\uFF0CIVA\uFF0CIVB", constraint: "M", category: "\u8BCA\u65AD\u4E0E\u5206\u671F" },
  { cn: "\u75C5\u53D8\u957F\u5EA6", en: "Lesion Length", code: "LESION_LEN", dataType: "\u6570\u503C\u578B", domain: "\u6B63\u6570\uFF08cm\uFF09", constraint: "O", category: "\u8BCA\u65AD\u4E0E\u5206\u671F" },
  { cn: "ECOG\u4F53\u80FD\u72B6\u6001\u8BC4\u5206", en: "ECOG Performance Status", code: "ECOG", dataType: "\u5B57\u7B26\u4E32\u578B", domain: "0\uFF0C1\uFF0C2\uFF0C3\uFF0C4", constraint: "M", category: "\u8BCA\u65AD\u4E0E\u5206\u671F" },
  { cn: "KPS\u8BC4\u5206", en: "Karnofsky Performance Status", code: "KPS", dataType: "\u6570\u503C\u578B", domain: "0-100\uFF0810\u4E3A\u5355\u4F4D\uFF09", constraint: "O", category: "\u8BCA\u65AD\u4E0E\u5206\u671F" },
  { cn: "\u591A\u5B66\u79D1\u8054\u5408\u4F1A\u8BCA", en: "MDT Discussion", code: "MDT", dataType: "\u5E03\u5C14\u578B", domain: "\u662F\uFF0C\u5426", constraint: "O", category: "\u8BCA\u65AD\u4E0E\u5206\u671F" },
  { cn: "MDT\u7ED3\u8BBA", en: "MDT Conclusion", code: "MDT_CONC", dataType: "\u5B57\u7B26\u4E32\u578B", domain: "", constraint: "O", category: "\u8BCA\u65AD\u4E0E\u5206\u671F" },
  { cn: "\u521D\u59CB\u6CBB\u7597\u7B56\u7565", en: "Initial Treatment Strategy", code: "TRT_STRATEGY", dataType: "\u5B57\u7B26\u4E32\u578B", domain: "\u6839\u6CBB\u6027\u6CBB\u7597\uFF0C\u59D1\u606F\u6027\u6CBB\u7597\uFF0C\u6700\u4F73\u652F\u6301\u6CBB\u7597", constraint: "M", category: "\u8BCA\u65AD\u4E0E\u5206\u671F" },
  { cn: "Charlson\u5171\u75C5\u6307\u6570", en: "Charlson Comorbidity Index", code: "CCI", dataType: "\u6570\u503C\u578B", domain: "0-37\uFF08\u22655\u5206\u9884\u540E\u5DEE\uFF09", constraint: "O", category: "\u8BCA\u65AD\u4E0E\u5206\u671F" },
  { cn: "NRS2002\u603B\u5206", en: "NRS2002 Score", code: "NRS2002", dataType: "\u6570\u503C\u578B", domain: "0-7", constraint: "O", category: "\u8425\u517B\u8BC4\u4F30" },
  { cn: "\u8425\u517B\u98CE\u9669", en: "Nutritional Risk", code: "NUTR_RISK", dataType: "\u5E03\u5C14\u578B", domain: "\u6709\uFF08\u22653\u5206\uFF09\uFF0C\u65E0\uFF08<3\u5206\uFF09", constraint: "O", category: "\u8425\u517B\u8BC4\u4F30" },
  { cn: "PG-SGA\u5206\u7EA7", en: "PG-SGA Grade", code: "PGSGA", dataType: "\u5B57\u7B26\u4E32\u578B", domain: "A\u7EA7\uFF08\u8425\u517B\u826F\u597D\uFF09\uFF0CB\u7EA7\uFF08\u8F7B\u4E2D\u5EA6\u8425\u517B\u4E0D\u826F\uFF09\uFF0CC\u7EA7\uFF08\u91CD\u5EA6\u8425\u517B\u4E0D\u826F\uFF09", constraint: "O", category: "\u8425\u517B\u8BC4\u4F30" },
  { cn: "\u8840\u6E05\u767D\u86CB\u767D", en: "Serum Albumin", code: "ALB", dataType: "\u6570\u503C\u578B", domain: "\u6B63\u6570", constraint: "O", category: "\u8425\u517B\u8BC4\u4F30" },
  { cn: "\u524D\u767D\u86CB\u767D", en: "Prealbumin", code: "PALB", dataType: "\u6570\u503C\u578B", domain: "\u6B63\u6570", constraint: "O", category: "\u8425\u517B\u8BC4\u4F30" },
  { cn: "\u8FDB\u98DF\u72B6\u6001\uFF08\u5165\u9662\uFF09", en: "Nutritional Intake at Admission", code: "INTAKE_ADMIT", dataType: "\u5B57\u7B26\u4E32\u578B", domain: "\u6B63\u5E38\u7ECF\u53E3\uFF0C\u534A\u6D41\u8D28\uFF0C\u6D41\u8D28\uFF0C\u7BA1\u9972\uFF0C\u80A0\u5916\u8425\u517B\uFF0C\u7981\u98DF", constraint: "O", category: "\u8425\u517B\u8BC4\u4F30" },
  { cn: "\u5185\u955C\u6CBB\u7597\u5355\u53F7", en: "Endoscopic Therapy ID", code: "ET_ID", dataType: "\u5B57\u7B26\u4E32\u578B", domain: "", constraint: "M", category: "\u5185\u955C\u6CBB\u7597" },
  { cn: "\u5185\u955C\u6CBB\u7597\u65E5\u671F", en: "Endoscopic Therapy Date", code: "ET_DATE", dataType: "\u65F6\u95F4", domain: "YYYY-MM-DD", constraint: "M", category: "\u5185\u955C\u6CBB\u7597" },
  { cn: "\u5185\u955C\u6CBB\u7597\u65B9\u5F0F", en: "Endoscopic Treatment Method", code: "ET_METHOD", dataType: "\u5B57\u7B26\u4E32\u578B", domain: "EMR\uFF0CEMRC\uFF0CESD\uFF0CESTD\uFF0CAPC\uFF0C\u5C04\u9891\u6D88\u878D\uFF0C\u51B7\u51BB\uFF0C\u5176\u4ED6", constraint: "M", category: "\u5185\u955C\u6CBB\u7597" },
  { cn: "\u624B\u672F\u65F6\u957F\uFF08\u5185\u955C\uFF09", en: "ET Duration", code: "ET_DURATION", dataType: "\u6570\u503C\u578B", domain: "\u6B63\u6574\u6570\uFF08min\uFF09", constraint: "O", category: "\u5185\u955C\u6CBB\u7597" },
  { cn: "\u5207\u9664\u6807\u672C\u5927\u5C0F", en: "Resected Specimen Size", code: "ET_SPEC_SIZE", dataType: "\u5B57\u7B26\u4E32\u578B", domain: "mm\xD7mm", constraint: "O", category: "\u5185\u955C\u6CBB\u7597" },
  { cn: "\u75C5\u53D8\u73AF\u5468\u53D7\u7D2F\u6BD4\u4F8B", en: "Lesion Circumferential Extent", code: "ET_CIRC", dataType: "\u5B57\u7B26\u4E32\u578B", domain: "<1/4\u5468\uFF0C1/4-1/2\u5468\uFF0C1/2-3/4\u5468\uFF0C>3/4\u5468\uFF0C\u5168\u5468", constraint: "O", category: "\u5185\u955C\u6CBB\u7597" },
  { cn: "\u6807\u672C\u6574\u5757\u5207\u9664", en: "En Bloc Resection", code: "ET_ENBLOC", dataType: "\u5E03\u5C14\u578B", domain: "\u662F\uFF0C\u5426", constraint: "M", category: "\u5185\u955C\u6CBB\u7597" },
  { cn: "\u6CBB\u6108\u6027\u5207\u9664", en: "Curative Resection", code: "ET_CURATIV", dataType: "\u5B57\u7B26\u4E32\u578B", domain: "\u6CBB\u6108\u6027\u5207\u9664\uFF08eCura A/B\uFF09\uFF0C\u975E\u6CBB\u6108\u6027\u5207\u9664\uFF08eCura C\uFF09", constraint: "M", category: "\u5185\u955C\u6CBB\u7597" },
  { cn: "\u6C34\u5E73\u5207\u7F18\u72B6\u6001", en: "Horizontal Margin Status", code: "ET_HM", dataType: "\u5B57\u7B26\u4E32\u578B", domain: "HM0\uFF08\u9634\u6027\uFF09\uFF0CHM1\uFF08\u9633\u6027\uFF09\uFF0CHMX\uFF08\u65E0\u6CD5\u5224\u65AD\uFF09", constraint: "O", category: "\u5185\u955C\u6CBB\u7597" },
  { cn: "\u5782\u76F4\u5207\u7F18\u72B6\u6001", en: "Vertical Margin Status", code: "ET_VM", dataType: "\u5B57\u7B26\u4E32\u578B", domain: "VM0\uFF08\u9634\u6027\uFF09\uFF0CVM1\uFF08\u9633\u6027\uFF09\uFF0CVMX\uFF08\u65E0\u6CD5\u5224\u65AD\uFF09", constraint: "O", category: "\u5185\u955C\u6CBB\u7597" },
  { cn: "\u5185\u955C\u6CBB\u7597\u5E76\u53D1\u75C7", en: "Endoscopic Therapy Complication", code: "ET_COMP", dataType: "\u5B57\u7B26\u4E32\u578B", domain: "\u65E0\uFF0C\u51FA\u8840\uFF0C\u7A7F\u5B54\uFF0C\u6C14\u80F8\uFF0C\u7EB5\u9694\u6C14\u80BF\uFF0C\u5176\u4ED6", constraint: "O", category: "\u5185\u955C\u6CBB\u7597" },
  { cn: "\u672F\u540E\u98DF\u7BA1\u72ED\u7A84", en: "Post-ET Esophageal Stricture", code: "ET_STRICTURE", dataType: "\u5B57\u7B26\u4E32\u578B", domain: "\u65E0\uFF0C\u8F7B\u5EA6\uFF0C\u4E2D\u5EA6\uFF08\u9700\u6269\u5F20\uFF09\uFF0C\u91CD\u5EA6\uFF08\u9700\u53CD\u590D\u6269\u5F20/\u652F\u67B6\uFF09", constraint: "O", category: "\u5185\u955C\u6CBB\u7597" },
  { cn: "\u8FFD\u52A0\u6CBB\u7597", en: "Additional Treatment after ET", code: "ET_ADD", dataType: "\u5B57\u7B26\u4E32\u578B", domain: "\u4E0D\u9700\u8981\uFF0C\u8FFD\u52A0\u624B\u672F\uFF0C\u8FFD\u52A0\u653E\u5316\u7597\uFF0C\u89C2\u5BDF\u968F\u8BBF\uFF0C\u5176\u4ED6", constraint: "O", category: "\u5185\u955C\u6CBB\u7597" },
  { cn: "\u624B\u672F\u65E5\u671F", en: "Surgery Date", code: "SURG_DATE", dataType: "\u65F6\u95F4", domain: "YYYY-MM-DD", constraint: "M", category: "\u624B\u672F\u6CBB\u7597" },
  { cn: "\u624B\u672F\u76EE\u7684", en: "Surgery Purpose", code: "SURG_PURPOSE", dataType: "\u5B57\u7B26\u4E32\u578B", domain: "\u6839\u6CBB\u6027\u624B\u672F\uFF0C\u59D1\u606F\u6027\u624B\u672F\uFF0C\u8BCA\u65AD\u6027\u624B\u672F\uFF0C\u6025\u8BCA\u624B\u672F", constraint: "M", category: "\u624B\u672F\u6CBB\u7597" },
  { cn: "\u624B\u672F\u5165\u8DEF", en: "Surgical Approach", code: "SURG_APPROACH", dataType: "\u5B57\u7B26\u4E32\u578B", domain: "\u5F00\u653E\u624B\u672F\uFF0C\u80F8\u8154\u955C\u8F85\u52A9\uFF0C\u8179\u8154\u955C\u8F85\u52A9\uFF0C\u673A\u5668\u4EBA\u8F85\u52A9\uFF0C\u5B8C\u5168\u8154\u955C", constraint: "M", category: "\u624B\u672F\u6CBB\u7597" },
  { cn: "\u624B\u672F\u672F\u5F0F", en: "Surgical Procedure", code: "SURG_PROC", dataType: "\u5B57\u7B26\u4E32\u578B", domain: "Ivor Lewis\uFF08\u53F3\u4FA7\u5F00\u80F8\u4E8C\u5207\u53E3\uFF09\uFF0CMcKeown\uFF08\u4E09\u5207\u53E3\u9888\u543B\u5408\uFF09\uFF0C\u7ECF\u98DF\u7BA1\u88C2\u5B54\uFF0C\u9888\u6BB5\u5207\u9664\u91CD\u5EFA\uFF0C\u5176\u4ED6", constraint: "M", category: "\u624B\u672F\u6CBB\u7597" },
  { cn: "\u6DCB\u5DF4\u7ED3\u6E05\u626B\u8303\u56F4", en: "Lymphadenectomy Extent", code: "LN_DISSECT", dataType: "\u5B57\u7B26\u4E32\u578B", domain: "\u6807\u51C6\u4E8C\u91CE\u6E05\u626B\uFF0C\u6269\u5927\u4E8C\u91CE\u6E05\u626B\uFF0C\u4E09\u91CE\u6E05\u626B", constraint: "O", category: "\u624B\u672F\u6CBB\u7597" },
  { cn: "\u6D88\u5316\u9053\u91CD\u5EFA\u65B9\u5F0F", en: "Reconstruction Method", code: "RECONST", dataType: "\u5B57\u7B26\u4E32\u578B", domain: "\u7BA1\u72B6\u80C3\uFF0C\u5168\u80C3\uFF0C\u7ED3\u80A0\uFF0C\u7A7A\u80A0\uFF0C\u5176\u4ED6", constraint: "M", category: "\u624B\u672F\u6CBB\u7597" },
  { cn: "\u543B\u5408\u65B9\u5F0F", en: "Anastomosis Type", code: "ANAST", dataType: "\u5B57\u7B26\u4E32\u578B", domain: "\u624B\u5DE5\u543B\u5408\uFF0C\u5706\u5F62\u543B\u5408\u5668\uFF0C\u7EBF\u578B\u543B\u5408\u5668\uFF0C\u5176\u4ED6", constraint: "O", category: "\u624B\u672F\u6CBB\u7597" },
  { cn: "\u543B\u5408\u4F4D\u7F6E", en: "Anastomosis Site", code: "ANAST_SITE", dataType: "\u5B57\u7B26\u4E32\u578B", domain: "\u9888\u90E8\uFF0C\u80F8\u9876\uFF08\u4E3B\u52A8\u8109\u5F13\u4E0A\uFF09\uFF0C\u80F8\u8154\u5185\uFF08\u4E3B\u52A8\u8109\u5F13\u4E0B\uFF09", constraint: "O", category: "\u624B\u672F\u6CBB\u7597" },
  { cn: "\u624B\u672F\u65F6\u957F", en: "Surgery Duration", code: "SURG_DUR", dataType: "\u6570\u503C\u578B", domain: "\u6B63\u6574\u6570\uFF08min\uFF09", constraint: "O", category: "\u624B\u672F\u6CBB\u7597" },
  { cn: "\u672F\u4E2D\u51FA\u8840\u91CF", en: "Intraoperative Blood Loss", code: "BLOOD_LOSS", dataType: "\u6570\u503C\u578B", domain: "\u6B63\u6574\u6570\uFF08mL\uFF09", constraint: "O", category: "\u624B\u672F\u6CBB\u7597" },
  { cn: "\u672F\u4E2D\u8F93\u8840", en: "Intraoperative Transfusion", code: "INTRA_TRANSF", dataType: "\u5B57\u7B26\u4E32\u578B", domain: "\u65E0\uFF0C\u8F93\u6CE8\u7EA2\u7EC6\u80DE\uFF0C\u8840\u6D46\uFF0C\u5168\u8840\uFF0C\u81EA\u4F53\u8840\u56DE\u8F93", constraint: "O", category: "\u624B\u672F\u6CBB\u7597" },
  { cn: "\u672F\u4E2D\u5E76\u53D1\u75C7", en: "Intraoperative Complication", code: "INTRA_COMP", dataType: "\u5B57\u7B26\u4E32\u578B", domain: "\u65E0\uFF0C\u6C14\u7BA1\u635F\u4F24\uFF0C\u5589\u8FD4\u795E\u7ECF\u635F\u4F24\uFF0C\u80F8\u5BFC\u7BA1\u635F\u4F24\uFF0C\u8840\u7BA1\u635F\u4F24\uFF0C\u5176\u4ED6", constraint: "O", category: "\u624B\u672F\u6CBB\u7597" },
  { cn: "\u5207\u7F18R\u5206\u7EA7", en: "Resection Margin R Grade", code: "R_GRADE", dataType: "\u5B57\u7B26\u4E32\u578B", domain: "R0\uFF08\u5207\u7F18\u9634\u6027\uFF09\uFF0CR1\uFF08\u955C\u4E0B\u9633\u6027\uFF09\uFF0CR2\uFF08\u8089\u773C\u9633\u6027\uFF09", constraint: "M", category: "\u624B\u672F\u6CBB\u7597" },
  { cn: "\u672F\u540E\u4F4F\u9662\u5929\u6570", en: "Postoperative Hospital Stay", code: "POST_LOS", dataType: "\u6570\u503C\u578B", domain: "\u6B63\u6574\u6570\uFF08\u5929\uFF09", constraint: "O", category: "\u624B\u672F\u6CBB\u7597" },
  { cn: "\u672F\u540E\u5E76\u53D1\u75C7", en: "Postoperative Complication", code: "POST_COMP", dataType: "\u5E03\u5C14\u578B", domain: "\u662F\uFF0C\u5426", constraint: "O", category: "\u624B\u672F\u6CBB\u7597" },
  { cn: "Clavien-Dindo\u5206\u7EA7", en: "Clavien-Dindo Grade", code: "CD_GRADE", dataType: "\u5B57\u7B26\u4E32\u578B", domain: "I\uFF0CII\uFF0CIIIa\uFF0CIIIb\uFF0CIVa\uFF0CIVb\uFF0CV\uFF08\u6B7B\u4EA1\uFF09", constraint: "O", category: "\u624B\u672F\u6CBB\u7597" },
  { cn: "\u543B\u5408\u53E3\u7618", en: "Anastomotic Leak", code: "ANAST_LEAK", dataType: "\u5B57\u7B26\u4E32\u578B", domain: "\u65E0\uFF0CI\u578B\uFF08\u65E0\u75C7\u72B6\uFF09\uFF0CII\u578B\uFF08\u9700\u4FDD\u5B88\u6CBB\u7597\uFF09\uFF0CIII\u578B\uFF08\u9700\u624B\u672F\u5E72\u9884\uFF09", constraint: "O", category: "\u624B\u672F\u6CBB\u7597" },
  { cn: "\u80BA\u90E8\u5E76\u53D1\u75C7", en: "Pulmonary Complication", code: "PULM_COMP", dataType: "\u5B57\u7B26\u4E32\u578B", domain: "\u65E0\uFF0C\u80BA\u708E\uFF0C\u80BA\u4E0D\u5F20\uFF0C\u80F8\u8154\u79EF\u6DB2\uFF0C\u6C14\u80F8\uFF0CARDS\uFF0C\u5176\u4ED6", constraint: "O", category: "\u624B\u672F\u6CBB\u7597" },
  { cn: "\u58F0\u97F3\u5636\u54D1", en: "Hoarseness", code: "HOARSENESS", dataType: "\u5B57\u7B26\u4E32\u578B", domain: "\u65E0\uFF0C\u6682\u65F6\u6027\uFF08<3\u6708\u6062\u590D\uFF09\uFF0C\u6C38\u4E45\u6027\uFF08>3\u6708\uFF09", constraint: "O", category: "\u624B\u672F\u6CBB\u7597" },
  { cn: "\u4E73\u7CDC\u80F8", en: "Chylothorax", code: "CHYLOTHORAX", dataType: "\u5E03\u5C14\u578B", domain: "\u662F\uFF0C\u5426", constraint: "O", category: "\u624B\u672F\u6CBB\u7597" },
  { cn: "\u65B0\u8F85\u52A9\u6CBB\u7597\u964D\u671F\u6548\u679C", en: "Downstaging after Neoadjuvant", code: "DOWNSTAGE", dataType: "\u5B57\u7B26\u4E32\u578B", domain: "\u964D\u671F\uFF08ypStage<cStage\uFF09\uFF0C\u65E0\u53D8\u5316\uFF0C\u5347\u671F\uFF0C\u4E0D\u9002\u7528", constraint: "O", category: "\u624B\u672F\u6CBB\u7597" },
  { cn: "\u65B0\u8F85\u52A9\u6CBB\u7597\u65B9\u6848", en: "Neoadjuvant Treatment Regimen", code: "NEO_REGIMEN", dataType: "\u5B57\u7B26\u4E32\u578B", domain: "\u65E0\uFF0C\u65B0\u8F85\u52A9\u5316\u7597\uFF0C\u65B0\u8F85\u52A9\u653E\u5316\u7597\uFF0C\u65B0\u8F85\u52A9\u514D\u75AB+\u5316\u7597\uFF0C\u65B0\u8F85\u52A9\u514D\u75AB+\u653E\u5316\u7597\uFF0C\u5176\u4ED6", constraint: "O", category: "\u65B0\u8F85\u52A9\u6CBB\u7597" },
  { cn: "\u65B0\u8F85\u52A9\u6CBB\u7597\u5F00\u59CB\u65E5\u671F", en: "Neoadjuvant Start Date", code: "NEO_START", dataType: "\u65F6\u95F4", domain: "YYYY-MM-DD", constraint: "O", category: "\u65B0\u8F85\u52A9\u6CBB\u7597" },
  { cn: "\u65B0\u8F85\u52A9\u6CBB\u7597\u7ED3\u675F\u65E5\u671F", en: "Neoadjuvant End Date", code: "NEO_END", dataType: "\u65F6\u95F4", domain: "YYYY-MM-DD", constraint: "O", category: "\u65B0\u8F85\u52A9\u6CBB\u7597" },
  { cn: "\u65B0\u8F85\u52A9\u6CBB\u7597\u5B8C\u6210\u60C5\u51B5", en: "Neoadjuvant Completion", code: "NEO_COMPLETE", dataType: "\u5B57\u7B26\u4E32\u578B", domain: "\u8DB3\u91CF\u5B8C\u6210\uFF0C\u51CF\u91CF\u5B8C\u6210\uFF08<85%\uFF09\uFF0C\u63D0\u524D\u7EC8\u6B62", constraint: "O", category: "\u65B0\u8F85\u52A9\u6CBB\u7597" },
  { cn: "\u8F85\u52A9\u6CBB\u7597\u65B9\u6848", en: "Adjuvant Treatment Regimen", code: "ADJ_REGIMEN", dataType: "\u5B57\u7B26\u4E32\u578B", domain: "\u65E0\uFF0C\u8F85\u52A9\u5316\u7597\uFF0C\u8F85\u52A9\u653E\u5316\u7597\uFF0C\u8F85\u52A9\u514D\u75AB\u6CBB\u7597\uFF0C\u8F85\u52A9\u514D\u75AB+\u5316\u7597\uFF0C\u5176\u4ED6", constraint: "O", category: "\u8F85\u52A9\u6CBB\u7597" },
  { cn: "\u8F85\u52A9\u6CBB\u7597\u5F00\u59CB\u65E5\u671F", en: "Adjuvant Start Date", code: "ADJ_START", dataType: "\u65F6\u95F4", domain: "YYYY-MM-DD", constraint: "O", category: "\u8F85\u52A9\u6CBB\u7597" },
  { cn: "\u8F85\u52A9\u6CBB\u7597\u5B8C\u6210\u60C5\u51B5", en: "Adjuvant Completion", code: "ADJ_COMPLETE", dataType: "\u5B57\u7B26\u4E32\u578B", domain: "\u8DB3\u91CF\u5B8C\u6210\uFF0C\u51CF\u91CF\u5B8C\u6210\uFF0C\u63D0\u524D\u7EC8\u6B62", constraint: "O", category: "\u8F85\u52A9\u6CBB\u7597" },
  { cn: "\u5316\u7597\u8BB0\u5F55\u53F7", en: "Chemotherapy Record ID", code: "CHEMO_ID", dataType: "\u5B57\u7B26\u4E32\u578B", domain: "", constraint: "M", category: "\u5316\u5B66\u6CBB\u7597" },
  { cn: "\u5316\u7597\u5F00\u59CB\u65E5\u671F", en: "Chemotherapy Start Date", code: "CHEMO_START", dataType: "\u65F6\u95F4", domain: "YYYY-MM-DD", constraint: "M", category: "\u5316\u5B66\u6CBB\u7597" },
  { cn: "\u5316\u7597\u7ED3\u675F\u65E5\u671F", en: "Chemotherapy End Date", code: "CHEMO_END", dataType: "\u65F6\u95F4", domain: "YYYY-MM-DD", constraint: "O", category: "\u5316\u5B66\u6CBB\u7597" },
  { cn: "\u5316\u7597\u76EE\u7684", en: "Chemotherapy Purpose", code: "CHEMO_PURPOSE", dataType: "\u5B57\u7B26\u4E32\u578B", domain: "\u65B0\u8F85\u52A9\u5316\u7597\uFF0C\u8F85\u52A9\u5316\u7597\uFF0C\u540C\u671F\u653E\u5316\u7597\uFF0C\u59D1\u606F\u4E00\u7EBF\uFF0C\u59D1\u606F\u4E8C\u7EBF\u53CA\u4EE5\u4E0A\uFF0C\u8F6C\u5316\u6CBB\u7597", constraint: "M", category: "\u5316\u5B66\u6CBB\u7597" },
  { cn: "\u5316\u7597\u65B9\u6848\u540D\u79F0", en: "Chemotherapy Regimen", code: "CHEMO_REGIMEN", dataType: "\u5B57\u7B26\u4E32\u578B", domain: "PF\uFF08\u987A\u94C2+\u6C1F\u5C3F\u5627\u5576\uFF09\uFF0CCF\uFF0CECF\uFF0CDP\uFF0CDCF\uFF0CFLOT\uFF0CSOX\uFF0CXELOX\uFF0C\u5176\u4ED6", constraint: "M", category: "\u5316\u5B66\u6CBB\u7597" },
  { cn: "\u5316\u7597\u5177\u4F53\u836F\u7269", en: "Chemotherapy Drugs", code: "CHEMO_DRUG", dataType: "\u5B57\u7B26\u4E32\u578B", domain: "\u987A\u94C2\uFF0C\u5361\u94C2\uFF0C\u5965\u6C99\u5229\u94C2\uFF0C\u6C1F\u5C3F\u5627\u5576\uFF0C\u5361\u57F9\u4ED6\u6EE8\uFF0C\u66FF\u5409\u5965\uFF0C\u7D2B\u6749\u9187\uFF0C\u767D\u86CB\u767D\u7D2B\u6749\u9187\uFF0C\u591A\u897F\u4ED6\u8D5B\uFF0C\u4F9D\u6258\u6CCA\u82F7\uFF0C\u5176\u4ED6", constraint: "M", category: "\u5316\u5B66\u6CBB\u7597" },
  { cn: "\u5B9E\u9645\u5B8C\u6210\u5468\u671F\u6570", en: "Actual Chemotherapy Cycles", code: "CHEMO_DONE_CYC", dataType: "\u6570\u503C\u578B", domain: "\u6B63\u6574\u6570", constraint: "M", category: "\u5316\u5B66\u6CBB\u7597" },
  { cn: "\u5316\u7597\u524DECOG\u8BC4\u5206", en: "ECOG PS before Chemotherapy", code: "CHEMO_PS", dataType: "\u5B57\u7B26\u4E32\u578B", domain: "0\uFF0C1\uFF0C2\uFF0C3\uFF0C4", constraint: "O", category: "\u5316\u5B66\u6CBB\u7597" },
  { cn: "\u5316\u7597\u6700\u4F73\u7597\u6548", en: "Best Chemotherapy Response", code: "CHEMO_RESP", dataType: "\u5B57\u7B26\u4E32\u578B", domain: "CR\uFF0CPR\uFF0CSD\uFF0CPD\uFF0CNE", constraint: "O", category: "\u5316\u5B66\u6CBB\u7597" },
  { cn: "\u5316\u7597\u4E3B\u8981\u4E0D\u826F\u53CD\u5E94", en: "Chemotherapy Adverse Events", code: "CHEMO_AE", dataType: "\u5B57\u7B26\u4E32\u578B", domain: "\u4E2D\u6027\u7C92\u7EC6\u80DE\u51CF\u5C11\uFF0C\u8D2B\u8840\uFF0C\u8840\u5C0F\u677F\u51CF\u5C11\uFF0C\u6076\u5FC3\u5455\u5410\uFF0C\u8179\u6CFB\uFF0C\u53E3\u8154\u9ECF\u819C\u708E\uFF0C\u5468\u56F4\u795E\u7ECF\u75C5\u53D8\uFF0C\u8131\u53D1\uFF0C\u624B\u8DB3\u7EFC\u5408\u5F81\uFF0C\u5176\u4ED6", constraint: "O", category: "\u5316\u5B66\u6CBB\u7597" },
  { cn: "\u5316\u7597\u4E0D\u826F\u53CD\u5E94\u6700\u9AD8\u5206\u7EA7", en: "Max Chemotherapy AE Grade", code: "CHEMO_AE_MAX", dataType: "\u5B57\u7B26\u4E32\u578B", domain: "1\u7EA7\uFF0C2\u7EA7\uFF0C3\u7EA7\uFF0C4\u7EA7\uFF0C5\u7EA7", constraint: "O", category: "\u5316\u5B66\u6CBB\u7597" },
  { cn: "\u5316\u7597\u51CF\u91CF\u6216\u5EF6\u8FDF", en: "Chemo Dose Reduction/Delay", code: "CHEMO_REDUCE", dataType: "\u5E03\u5C14\u578B", domain: "\u662F\uFF0C\u5426", constraint: "O", category: "\u5316\u5B66\u6CBB\u7597" },
  { cn: "\u653E\u7597\u8BB0\u5F55\u53F7", en: "Radiotherapy Record ID", code: "RT_ID", dataType: "\u5B57\u7B26\u4E32\u578B", domain: "", constraint: "M", category: "\u653E\u5C04\u6CBB\u7597" },
  { cn: "\u653E\u7597\u5F00\u59CB\u65E5\u671F", en: "Radiotherapy Start Date", code: "RT_START", dataType: "\u65F6\u95F4", domain: "YYYY-MM-DD", constraint: "M", category: "\u653E\u5C04\u6CBB\u7597" },
  { cn: "\u653E\u7597\u7ED3\u675F\u65E5\u671F", en: "Radiotherapy End Date", code: "RT_END", dataType: "\u65F6\u95F4", domain: "YYYY-MM-DD", constraint: "O", category: "\u653E\u5C04\u6CBB\u7597" },
  { cn: "\u653E\u7597\u76EE\u7684", en: "Radiotherapy Purpose", code: "RT_PURPOSE", dataType: "\u5B57\u7B26\u4E32\u578B", domain: "\u6839\u6CBB\u6027\u653E\u7597\uFF0C\u65B0\u8F85\u52A9\u653E\u7597\uFF0C\u8F85\u52A9\u653E\u7597\uFF0C\u540C\u671F\u653E\u5316\u7597\uFF0C\u59D1\u606F\u653E\u7597", constraint: "M", category: "\u653E\u5C04\u6CBB\u7597" },
  { cn: "\u653E\u7597\u6280\u672F", en: "Radiotherapy Technique", code: "RT_TECH", dataType: "\u5B57\u7B26\u4E32\u578B", domain: "3DCRT\uFF0CIMRT\uFF0CVMAT\uFF0CTOMO\uFF0CSBRT\uFF0C\u8D28\u5B50\uFF0C\u5176\u4ED6", constraint: "M", category: "\u653E\u5C04\u6CBB\u7597" },
  { cn: "\u653E\u7597\u603B\u5242\u91CF", en: "Total Radiation Dose", code: "RT_TOTAL_DOSE", dataType: "\u6570\u503C\u578B", domain: "\u6B63\u6570\uFF08Gy\uFF09", constraint: "M", category: "\u653E\u5C04\u6CBB\u7597" },
  { cn: "\u5355\u6B21\u5206\u5272\u5242\u91CF", en: "Fraction Dose", code: "RT_FRAC_DOSE", dataType: "\u6570\u503C\u578B", domain: "\u6B63\u6570\uFF08Gy\uFF09", constraint: "O", category: "\u653E\u5C04\u6CBB\u7597" },
  { cn: "\u653E\u7597\u603B\u5206\u6B21\u6570", en: "Number of Fractions", code: "RT_FRACS", dataType: "\u6570\u503C\u578B", domain: "\u6B63\u6574\u6570", constraint: "O", category: "\u653E\u5C04\u6CBB\u7597" },
  { cn: "\u653E\u7597\u662F\u5426\u5B8C\u6210", en: "Radiotherapy Completion", code: "RT_COMPLETE", dataType: "\u5E03\u5C14\u578B", domain: "\u662F\uFF0C\u5426", constraint: "M", category: "\u653E\u5C04\u6CBB\u7597" },
  { cn: "\u53CC\u80BAV20", en: "Bilateral Lung V20", code: "RT_LUNG_V20", dataType: "\u6570\u503C\u578B", domain: "0-100\uFF08%\uFF09", constraint: "O", category: "\u653E\u5C04\u6CBB\u7597" },
  { cn: "\u5FC3\u810F\u5E73\u5747\u5242\u91CF", en: "Mean Heart Dose", code: "RT_HEART_DMEAN", dataType: "\u6570\u503C\u578B", domain: "\u6B63\u6570\uFF08Gy\uFF09", constraint: "O", category: "\u653E\u5C04\u6CBB\u7597" },
  { cn: "\u810A\u9AD3\u6700\u5927\u5242\u91CF", en: "Spinal Cord Max Dose", code: "RT_CORD_DMAX", dataType: "\u6570\u503C\u578B", domain: "\u6B63\u6570\uFF08Gy\uFF09", constraint: "O", category: "\u653E\u5C04\u6CBB\u7597" },
  { cn: "\u653E\u7597\u4E3B\u8981\u4E0D\u826F\u53CD\u5E94", en: "Radiation Adverse Events", code: "RT_AE", dataType: "\u5B57\u7B26\u4E32\u578B", domain: "\u653E\u5C04\u6027\u98DF\u7BA1\u708E\uFF0C\u653E\u5C04\u6027\u80BA\u708E\uFF0C\u9AA8\u9AD3\u6291\u5236\uFF0C\u653E\u5C04\u6027\u810A\u9AD3\u708E\uFF0C\u76AE\u80A4\u53CD\u5E94\uFF0C\u5176\u4ED6", constraint: "O", category: "\u653E\u5C04\u6CBB\u7597" },
  { cn: "\u653E\u7597\u4E0D\u826F\u53CD\u5E94\u6700\u9AD8\u5206\u7EA7", en: "Max Radiation AE Grade", code: "RT_AE_MAX", dataType: "\u5B57\u7B26\u4E32\u578B", domain: "1\u7EA7\uFF0C2\u7EA7\uFF0C3\u7EA7\uFF0C4\u7EA7\uFF0C5\u7EA7", constraint: "O", category: "\u653E\u5C04\u6CBB\u7597" },
  { cn: "\u653E\u7597\u540E\u7597\u6548\u8BC4\u4F30", en: "Post-RT Response", code: "RT_RESP", dataType: "\u5B57\u7B26\u4E32\u578B", domain: "CR\uFF0CPR\uFF0CSD\uFF0CPD\uFF0CNE", constraint: "O", category: "\u653E\u5C04\u6CBB\u7597" },
  { cn: "\u514D\u75AB\u6CBB\u7597\u8BB0\u5F55\u53F7", en: "Immunotherapy Record ID", code: "IMM_ID", dataType: "\u5B57\u7B26\u4E32\u578B", domain: "", constraint: "M", category: "\u514D\u75AB\u6CBB\u7597" },
  { cn: "\u514D\u75AB\u6CBB\u7597\u5F00\u59CB\u65E5\u671F", en: "Immunotherapy Start Date", code: "IMM_START", dataType: "\u65F6\u95F4", domain: "YYYY-MM-DD", constraint: "M", category: "\u514D\u75AB\u6CBB\u7597" },
  { cn: "\u514D\u75AB\u6CBB\u7597\u76EE\u7684", en: "Immunotherapy Purpose", code: "IMM_PURPOSE", dataType: "\u5B57\u7B26\u4E32\u578B", domain: "\u65B0\u8F85\u52A9\uFF0C\u8F85\u52A9\uFF0C\u4E00\u7EBF\uFF0C\u4E8C\u7EBF\uFF0C\u4E09\u7EBF\u53CA\u4EE5\u4E0A\uFF0C\u7EF4\u6301\u6CBB\u7597", constraint: "M", category: "\u514D\u75AB\u6CBB\u7597" },
  { cn: "\u514D\u75AB\u836F\u7269\u540D\u79F0", en: "Immunotherapy Drug", code: "IMM_DRUG", dataType: "\u5B57\u7B26\u4E32\u578B", domain: "\u7EB3\u6B66\u5229\u5C24\u5355\u6297\uFF08PD-1\uFF09\uFF0C\u5E15\u535A\u5229\u73E0\u5355\u6297\uFF08PD-1\uFF09\uFF0C\u5361\u745E\u5229\u73E0\u5355\u6297\uFF08PD-1\uFF09\uFF0C\u4FE1\u8FEA\u5229\u5355\u6297\uFF08PD-1\uFF09\uFF0C\u66FF\u96F7\u5229\u73E0\u5355\u6297\uFF08PD-1\uFF09\uFF0C\u65AF\u9C81\u5229\u5355\u6297\uFF08PD-1\uFF09\uFF0C\u5EA6\u4F10\u5229\u5C24\u5355\u6297\uFF08PD-L1\uFF09\uFF0C\u963F\u66FF\u5229\u73E0\u5355\u6297\uFF08PD-L1\uFF09\uFF0C\u5176\u4ED6", constraint: "M", category: "\u514D\u75AB\u6CBB\u7597" },
  { cn: "PD-L1 CPS\u8BC4\u5206", en: "PD-L1 CPS Score", code: "PDL1_CPS", dataType: "\u6570\u503C\u578B", domain: "0-100", constraint: "O", category: "\u514D\u75AB\u6CBB\u7597" },
  { cn: "TMB\u72B6\u6001", en: "Tumor Mutational Burden", code: "TMB_STATUS", dataType: "\u5B57\u7B26\u4E32\u578B", domain: "\u9AD8\uFF08TMB-H\uFF0C\u226510 mut/Mb\uFF09\uFF0C\u4F4E\uFF08TMB-L\uFF09\uFF0C\u672A\u68C0\u6D4B", constraint: "O", category: "\u514D\u75AB\u6CBB\u7597" },
  { cn: "MSI\u72B6\u6001", en: "Microsatellite Instability", code: "MSI_STATUS", dataType: "\u5B57\u7B26\u4E32\u578B", domain: "MSI-H\uFF0CMSI-L\uFF0CMSS\uFF0C\u672A\u68C0\u6D4B", constraint: "O", category: "\u514D\u75AB\u6CBB\u7597" },
  { cn: "\u514D\u75AB\u6CBB\u7597\u5B8C\u6210\u5468\u671F\u6570", en: "Immunotherapy Completed Cycles", code: "IMM_CYCLES", dataType: "\u6570\u503C\u578B", domain: "\u6B63\u6574\u6570", constraint: "O", category: "\u514D\u75AB\u6CBB\u7597" },
  { cn: "\u514D\u75AB\u7597\u6548\u8BC4\u4F30", en: "Immunotherapy Response", code: "IMM_RESP", dataType: "\u5B57\u7B26\u4E32\u578B", domain: "CR\uFF0CPR\uFF0CSD\uFF0CPD\uFF0CiCR\uFF0CiPR\uFF0CiSD\uFF0CiPD", constraint: "O", category: "\u514D\u75AB\u6CBB\u7597" },
  { cn: "\u514D\u75AB\u76F8\u5173\u4E0D\u826F\u53CD\u5E94\u7C7B\u578B", en: "Immune-related AE Type", code: "IRAE_TYPE", dataType: "\u5B57\u7B26\u4E32\u578B", domain: "\u65E0\uFF0C\u514D\u75AB\u6027\u80BA\u708E\uFF0C\u514D\u75AB\u6027\u80A0\u708E\uFF0C\u514D\u75AB\u6027\u809D\u708E\uFF0C\u514D\u75AB\u6027\u7532\u72B6\u817A\u708E\uFF0C\u5782\u4F53\u708E\uFF0C\u76AE\u80A4\u53CD\u5E94\uFF0C\u5176\u4ED6", constraint: "O", category: "\u514D\u75AB\u6CBB\u7597" },
  { cn: "irAE\u6700\u9AD8CTCAE\u5206\u7EA7", en: "Max irAE Grade", code: "IRAE_MAX", dataType: "\u5B57\u7B26\u4E32\u578B", domain: "1\u7EA7\uFF0C2\u7EA7\uFF0C3\u7EA7\uFF0C4\u7EA7\uFF0C5\u7EA7", constraint: "O", category: "\u514D\u75AB\u6CBB\u7597" },
  { cn: "\u662F\u5426\u56E0irAE\u6C38\u4E45\u505C\u836F", en: "Immunotherapy Discontinued", code: "IMM_STOP", dataType: "\u5E03\u5C14\u578B", domain: "\u662F\uFF0C\u5426", constraint: "O", category: "\u514D\u75AB\u6CBB\u7597" },
  { cn: "\u9776\u5411\u6CBB\u7597\u8BB0\u5F55\u53F7", en: "Targeted Therapy Record ID", code: "TGT_ID", dataType: "\u5B57\u7B26\u4E32\u578B", domain: "", constraint: "M", category: "\u9776\u5411\u6CBB\u7597" },
  { cn: "\u9776\u5411\u6CBB\u7597\u5F00\u59CB\u65E5\u671F", en: "Targeted Therapy Start Date", code: "TGT_START", dataType: "\u65F6\u95F4", domain: "YYYY-MM-DD", constraint: "M", category: "\u9776\u5411\u6CBB\u7597" },
  { cn: "\u9776\u5411\u836F\u7269\u540D\u79F0", en: "Targeted Drug Name", code: "TGT_DRUG", dataType: "\u5B57\u7B26\u4E32\u578B", domain: "\u66F2\u59A5\u73E0\u5355\u6297\uFF08HER2\uFF09\uFF0C\u7EF4\u8FEA\u897F\u59A5\u5355\u6297\uFF08HER2 ADC\uFF09\uFF0C\u4F50\u59A5\u6614\u5355\u6297\uFF08CLDN18.2\uFF09\uFF0C\u96F7\u83AB\u897F\u5C24\u5355\u6297\uFF08VEGFR2\uFF09\uFF0C\u5B89\u7F57\u66FF\u5C3C\uFF0C\u963F\u5E15\u66FF\u5C3C\uFF0C\u5176\u4ED6", constraint: "M", category: "\u9776\u5411\u6CBB\u7597" },
  { cn: "\u9776\u70B9\u7C7B\u578B", en: "Drug Target", code: "TGT_TARGET", dataType: "\u5B57\u7B26\u4E32\u578B", domain: "HER2\uFF0CVEGFR\uFF0CVEGF\uFF0CCLDN18.2\uFF0CFGFR\uFF0CEGFR\uFF0C\u5176\u4ED6", constraint: "M", category: "\u9776\u5411\u6CBB\u7597" },
  { cn: "\u9776\u5411\u6CBB\u7597\u5B8C\u6210\u5468\u671F\u6570", en: "Targeted Therapy Cycles", code: "TGT_CYCLES", dataType: "\u6570\u503C\u578B", domain: "\u6B63\u6574\u6570", constraint: "O", category: "\u9776\u5411\u6CBB\u7597" },
  { cn: "\u9776\u5411\u7597\u6548\u8BC4\u4F30", en: "Targeted Therapy Response", code: "TGT_RESP", dataType: "\u5B57\u7B26\u4E32\u578B", domain: "CR\uFF0CPR\uFF0CSD\uFF0CPD\uFF0CNE", constraint: "O", category: "\u9776\u5411\u6CBB\u7597" },
  { cn: "\u9776\u5411\u6CBB\u7597\u4E3B\u8981\u4E0D\u826F\u53CD\u5E94", en: "Targeted Therapy AE", code: "TGT_AE", dataType: "\u5B57\u7B26\u4E32\u578B", domain: "\u5FC3\u810F\u6BD2\u6027\uFF0C\u9AD8\u8840\u538B\uFF0C\u86CB\u767D\u5C3F\uFF0C\u51FA\u8840\uFF0C\u76AE\u80A4\u53CD\u5E94\uFF0C\u624B\u8DB3\u7EFC\u5408\u5F81\uFF0C\u5176\u4ED6", constraint: "O", category: "\u9776\u5411\u6CBB\u7597" },
  { cn: "\u7EFC\u5408\u7597\u6548\u8BC4\u4F30\u65E5\u671F", en: "Response Evaluation Date", code: "RESP_DATE", dataType: "\u65F6\u95F4", domain: "YYYY-MM-DD", constraint: "O", category: "\u7597\u6548\u8BC4\u4F30" },
  { cn: "\u7597\u6548\u8BC4\u4F30\u5F71\u50CF\u7C7B\u578B", en: "Imaging Modality for Response", code: "RESP_IMG_TYPE", dataType: "\u5B57\u7B26\u4E32\u578B", domain: "CT\uFF08\u589E\u5F3A\uFF09\uFF0CCT\uFF08\u5E73\u626B\uFF09\uFF0CMRI\uFF0CPET-CT\uFF0C\u5185\u955C+\u75C5\u7406\uFF0C\u4E34\u5E8A\u8BC4\u4F30", constraint: "O", category: "\u7597\u6548\u8BC4\u4F30" },
  { cn: "RECIST\u7597\u6548\u8BC4\u4F30", en: "RECIST Response", code: "RECIST_RESP", dataType: "\u5B57\u7B26\u4E32\u578B", domain: "CR\uFF08\u5B8C\u5168\u7F13\u89E3\uFF09\uFF0CPR\uFF08\u90E8\u5206\u7F13\u89E3\uFF09\uFF0CSD\uFF08\u75BE\u75C5\u7A33\u5B9A\uFF09\uFF0CPD\uFF08\u75BE\u75C5\u8FDB\u5C55\uFF09\uFF0CNE\uFF08\u65E0\u6CD5\u8BC4\u4F30\uFF09", constraint: "O", category: "\u7597\u6548\u8BC4\u4F30" },
  { cn: "\u75C5\u7406\u5B8C\u5168\u7F13\u89E3", en: "Pathological Complete Response", code: "PCR", dataType: "\u5B57\u7B26\u4E32\u578B", domain: "\u662F\uFF08pCR\uFF09\uFF0C\u5426\uFF0C\u4E0D\u9002\u7528", constraint: "O", category: "\u7597\u6548\u8BC4\u4F30" },
  { cn: "\u80BF\u7624\u9000\u7F29\u5206\u7EA7", en: "Tumor Regression Grade", code: "TRG_NEO", dataType: "\u5B57\u7B26\u4E32\u578B", domain: "TRG0\uFF08\u5B8C\u5168\u9000\u7F29/pCR\uFF09\uFF0CTRG1\uFF08<10%\u6B8B\u5B58\uFF09\uFF0CTRG2\uFF0810-50%\uFF09\uFF0CTRG3\uFF08>50%\uFF09\uFF0CTRG4\uFF08\u65E0\u9000\u7F29\uFF09", constraint: "O", category: "\u7597\u6548\u8BC4\u4F30" },
  { cn: "\u5185\u955C\u4E0B\u7597\u6548\u8BC4\u4F30", en: "Endoscopic Response", code: "ENDO_RESP", dataType: "\u5B57\u7B26\u4E32\u578B", domain: "CR\uFF0CPR\uFF0CSD\uFF0CPD", constraint: "O", category: "\u7597\u6548\u8BC4\u4F30" },
  { cn: "\u968F\u8BBF\u8BB0\u5F55\u53F7", en: "Follow-up Record ID", code: "FU_ID", dataType: "\u5B57\u7B26\u4E32\u578B", domain: "", constraint: "M", category: "\u968F\u8BBF" },
  { cn: "\u968F\u8BBF\u65E5\u671F", en: "Follow-up Date", code: "FU_DATE", dataType: "\u65F6\u95F4", domain: "YYYY-MM-DD", constraint: "M", category: "\u968F\u8BBF" },
  { cn: "\u968F\u8BBF\u6B21\u5E8F", en: "Follow-up Sequence", code: "FU_SEQ", dataType: "\u6570\u503C\u578B", domain: "\u6B63\u6574\u6570", constraint: "M", category: "\u968F\u8BBF" },
  { cn: "\u968F\u8BBF\u65B9\u5F0F", en: "Follow-up Method", code: "FU_METHOD", dataType: "\u5B57\u7B26\u4E32\u578B", domain: "\u95E8\u8BCA\u590D\u67E5\uFF0C\u7535\u8BDD\u968F\u8BBF\uFF0C\u7F51\u7EDC/\u5FAE\u4FE1\uFF0C\u5BB6\u8BBF\uFF0C\u5176\u4ED6", constraint: "M", category: "\u968F\u8BBF" },
  { cn: "\u968F\u8BBF\u72B6\u6001", en: "Follow-up Status", code: "FU_STATUS", dataType: "\u5B57\u7B26\u4E32\u578B", domain: "\u65E0\u7624\u751F\u5B58\uFF0C\u5E26\u7624\u751F\u5B58\uFF0C\u5931\u8BBF\uFF0C\u6B7B\u4EA1", constraint: "M", category: "\u968F\u8BBF" },
  { cn: "\u6B7B\u4EA1\u65E5\u671F", en: "Date of Death", code: "DEATH_DATE", dataType: "\u65F6\u95F4", domain: "YYYY-MM-DD", constraint: "O", category: "\u968F\u8BBF" },
  { cn: "\u6B7B\u4EA1\u539F\u56E0", en: "Cause of Death", code: "DEATH_CAUSE", dataType: "\u5B57\u7B26\u4E32\u578B", domain: "\u80BF\u7624\u8FDB\u5C55\uFF0C\u624B\u672F\u5E76\u53D1\u75C7\uFF0C\u6CBB\u7597\u4E0D\u826F\u53CD\u5E94\uFF0C\u5176\u4ED6\u75BE\u75C5\uFF0C\u610F\u5916\uFF0C\u4E0D\u660E\uFF0C\u5176\u4ED6", constraint: "O", category: "\u968F\u8BBF" },
  { cn: "\u590D\u53D1\u72B6\u6001", en: "Recurrence Status", code: "RECUR_STATUS", dataType: "\u5E03\u5C14\u578B", domain: "\u662F\uFF0C\u5426", constraint: "M", category: "\u968F\u8BBF" },
  { cn: "\u9996\u6B21\u590D\u53D1/\u8FDB\u5C55\u65E5\u671F", en: "Date of First Recurrence", code: "RECUR_DATE", dataType: "\u65F6\u95F4", domain: "YYYY-MM-DD", constraint: "O", category: "\u968F\u8BBF" },
  { cn: "\u590D\u53D1\u7C7B\u578B", en: "Recurrence Type", code: "RECUR_TYPE", dataType: "\u5B57\u7B26\u4E32\u578B", domain: "\u5C40\u90E8\u590D\u53D1\uFF0C\u533A\u57DF\u6DCB\u5DF4\u7ED3\u590D\u53D1\uFF0C\u8840\u884C\u8FDC\u5904\u8F6C\u79FB\uFF0C\u5C40\u90E8+\u8FDC\u5904\uFF0C\u5176\u4ED6", constraint: "O", category: "\u968F\u8BBF" },
  { cn: "\u590D\u53D1/\u8F6C\u79FB\u90E8\u4F4D", en: "Recurrence Site", code: "RECUR_SITE", dataType: "\u5B57\u7B26\u4E32\u578B", domain: "\u543B\u5408\u53E3\uFF0C\u98DF\u7BA1\u6B8B\u7AEF\uFF0C\u7EB5\u9694\uFF0C\u9888\u90E8\u6DCB\u5DF4\u7ED3\uFF0C\u8179\u8154\u6DCB\u5DF4\u7ED3\uFF0C\u809D\uFF0C\u80BA\uFF0C\u9AA8\uFF0C\u8111\uFF0C\u5176\u4ED6", constraint: "O", category: "\u968F\u8BBF" },
  { cn: "\u590D\u53D1\u540E\u6CBB\u7597\u65B9\u6848", en: "Treatment for Recurrence", code: "RECUR_TRT", dataType: "\u5B57\u7B26\u4E32\u578B", domain: "\u5316\u7597\uFF0C\u653E\u7597\uFF0C\u514D\u75AB\u6CBB\u7597\uFF0C\u9776\u5411\u6CBB\u7597\uFF0C\u624B\u672F\uFF0C\u6700\u4F73\u652F\u6301\uFF0C\u672A\u6CBB\u7597\uFF0C\u5176\u4ED6", constraint: "O", category: "\u968F\u8BBF" },
  { cn: "\u968F\u8BBF\u590D\u67E5\u5185\u955C\u7ED3\u679C", en: "Follow-up Endoscopy Result", code: "FU_ENDO_RESULT", dataType: "\u5B57\u7B26\u4E32\u578B", domain: "\u65E0\u5F02\u5E38\uFF0C\u98DF\u7BA1\u72ED\u7A84\uFF0C\u543B\u5408\u53E3\u5F02\u5E38\uFF0C\u53EF\u7591\u590D\u53D1\uFF0C\u75C5\u7406\u8BC1\u5B9E\u590D\u53D1\uFF0C\u5176\u4ED6", constraint: "O", category: "\u968F\u8BBF" },
  { cn: "\u968F\u8BBF\u590D\u67E5CT\u7ED3\u679C", en: "Follow-up CT Result", code: "FU_CT_RESULT", dataType: "\u5B57\u7B26\u4E32\u578B", domain: "\u65E0\u8FDB\u5C55\uFF0C\u5C40\u90E8\u8FDB\u5C55\uFF0C\u6DCB\u5DF4\u7ED3\u589E\u5927\uFF0C\u65B0\u53D1\u8F6C\u79FB\uFF0C\u5176\u4ED6", constraint: "O", category: "\u968F\u8BBF" },
  { cn: "\u672B\u6B21\u968F\u8BBF\u65E5\u671F", en: "Last Follow-up Date", code: "LAST_FU_DATE", dataType: "\u65F6\u95F4", domain: "YYYY-MM-DD", constraint: "M", category: "\u968F\u8BBF" },
  { cn: "\u603B\u751F\u5B58\u671F", en: "Overall Survival", code: "OS", dataType: "\u6570\u503C\u578B", domain: "\u6B63\u6570\uFF08\u6708\uFF09", constraint: "M", category: "\u751F\u5B58\u4E0E\u9884\u540E" },
  { cn: "OS\u5220\u5931\u72B6\u6001", en: "OS Censoring", code: "OS_CENSOR", dataType: "\u5E03\u5C14\u578B", domain: "0\uFF0C1", constraint: "M", category: "\u751F\u5B58\u4E0E\u9884\u540E" },
  { cn: "\u65E0\u75C5\u751F\u5B58\u671F", en: "Disease-Free Survival", code: "DFS", dataType: "\u6570\u503C\u578B", domain: "\u6B63\u6570\uFF08\u6708\uFF09", constraint: "O", category: "\u751F\u5B58\u4E0E\u9884\u540E" },
  { cn: "DFS\u5220\u5931\u72B6\u6001", en: "DFS Censoring", code: "DFS_CENSOR", dataType: "\u5E03\u5C14\u578B", domain: "0\uFF0C1", constraint: "O", category: "\u751F\u5B58\u4E0E\u9884\u540E" },
  { cn: "\u65E0\u8FDB\u5C55\u751F\u5B58\u671F", en: "Progression-Free Survival", code: "PFS", dataType: "\u6570\u503C\u578B", domain: "\u6B63\u6570\uFF08\u6708\uFF09", constraint: "O", category: "\u751F\u5B58\u4E0E\u9884\u540E" },
  { cn: "PFS\u5220\u5931\u72B6\u6001", en: "PFS Censoring", code: "PFS_CENSOR", dataType: "\u5E03\u5C14\u578B", domain: "0\uFF0C1", constraint: "O", category: "\u751F\u5B58\u4E0E\u9884\u540E" },
  { cn: "5\u5E74\u603B\u751F\u5B58\u72B6\u6001", en: "5-year Survival Status", code: "SURV_5Y", dataType: "\u5E03\u5C14\u578B", domain: "\u5B58\u6D3B\uFF0C\u6B7B\u4EA1\uFF0C\u672A\u6EE15\u5E74\u968F\u8BBF", constraint: "O", category: "\u751F\u5B58\u4E0E\u9884\u540E" },
  { cn: "\u751F\u6D3B\u8D28\u91CF\u8BC4\u4F30\u65F6\u95F4\u70B9", en: "QoL Assessment Timepoint", code: "QOL_TIME", dataType: "\u5B57\u7B26\u4E32\u578B", domain: "\u6CBB\u7597\u524D\u57FA\u7EBF\uFF0C\u6CBB\u7597\u4E2D\uFF0C\u6CBB\u7597\u7ED3\u675F\u540E3\u6708\uFF0C\u6CBB\u7597\u7ED3\u675F\u540E1\u5E74\uFF0C\u5176\u4ED6", constraint: "O", category: "\u751F\u6D3B\u8D28\u91CF" },
  { cn: "EORTC QLQ-C30\u603B\u4F53\u5065\u5EB7", en: "EORTC QLQ-C30 Global Health", code: "QLQ_C30_GH", dataType: "\u6570\u503C\u578B", domain: "0-100", constraint: "O", category: "\u751F\u6D3B\u8D28\u91CF" },
  { cn: "EORTC OES18\u8BC4\u5206", en: "EORTC QLQ-OES18 Score", code: "OES18_SCORE", dataType: "\u6570\u503C\u578B", domain: "0-100", constraint: "O", category: "\u751F\u6D3B\u8D28\u91CF" },
  { cn: "\u541E\u54BD\u529F\u80FD\u8BC4\u5206", en: "Dysphagia Score", code: "DYSPHAGIA_SCORE", dataType: "\u5B57\u7B26\u4E32\u578B", domain: "0\uFF08\u6B63\u5E38\uFF09\uFF0C1\uFF08\u53EF\u8FDB\u8F6F\u98DF\uFF09\uFF0C2\uFF08\u53EF\u8FDB\u6D41\u8D28\uFF09\uFF0C3\uFF08\u4EC5\u80FD\u559D\u6C34\uFF09\uFF0C4\uFF08\u5B8C\u5168\u4E0D\u80FD\u7ECF\u53E3\uFF09", constraint: "O", category: "\u751F\u6D3B\u8D28\u91CF" },
  { cn: "\u75BC\u75DBNRS\u8BC4\u5206", en: "Pain NRS Score", code: "PAIN_NRS", dataType: "\u6570\u503C\u578B", domain: "0-10", constraint: "O", category: "\u751F\u6D3B\u8D28\u91CF" },
  { cn: "\u968F\u8BBF\u671F\u8FDB\u98DF\u65B9\u5F0F", en: "Feeding Mode at Follow-up", code: "INTAKE_FU", dataType: "\u5B57\u7B26\u4E32\u578B", domain: "\u6B63\u5E38\u7ECF\u53E3\uFF0C\u534A\u6D41\u8D28\uFF0C\u6D41\u8D28\uFF0C\u7BA1\u9972\uFF0C\u80A0\u5916\u8425\u517B\uFF0C\u7981\u98DF", constraint: "O", category: "\u751F\u6D3B\u8D28\u91CF" },
  { cn: "\u98DF\u7BA1\u652F\u67B6\u7F6E\u5165", en: "Esophageal Stent", code: "STENT", dataType: "\u5B57\u7B26\u4E32\u578B", domain: "\u65E0\uFF0C\u81EA\u81A8\u5F0F\u91D1\u5C5E\u652F\u67B6\uFF08\u666E\u901A\uFF09\uFF0C\u81EA\u81A8\u5F0F\u91D1\u5C5E\u652F\u67B6\uFF08\u8986\u819C\uFF09\uFF0C\u5176\u4ED6", constraint: "O", category: "\u59D1\u606F\u652F\u6301\u6CBB\u7597" },
  { cn: "\u8425\u517B\u652F\u6301\u65B9\u5F0F", en: "Nutritional Support", code: "NUTR_SUPPORT", dataType: "\u5B57\u7B26\u4E32\u578B", domain: "\u53E3\u670D\u8425\u517B\u8865\u5145\uFF0C\u9F3B\u80C3\u7BA1\uFF0C\u7A7A\u80A0\u9020\u7618\u7BA1\uFF0C\u5168\u80A0\u5916\u8425\u517B\uFF0C\u65E0", constraint: "O", category: "\u59D1\u606F\u652F\u6301\u6CBB\u7597" },
  { cn: "\u9547\u75DB\u65B9\u6848", en: "Pain Management", code: "PAIN_MGMT", dataType: "\u5B57\u7B26\u4E32\u578B", domain: "\u65E0\u9700\u9547\u75DB\uFF0C\u975E\u963F\u7247\u7C7B\uFF0C\u5F31\u963F\u7247\u7C7B\uFF0C\u5F3A\u963F\u7247\u7C7B\uFF0C\u5176\u4ED6", constraint: "O", category: "\u59D1\u606F\u652F\u6301\u6CBB\u7597" },
  { cn: "\u662F\u5426\u4EC5\u6700\u4F73\u652F\u6301\u6CBB\u7597", en: "Best Supportive Care Only", code: "BSC_ONLY", dataType: "\u5E03\u5C14\u578B", domain: "\u662F\uFF0C\u5426", constraint: "O", category: "\u59D1\u606F\u652F\u6301\u6CBB\u7597" },
  { cn: "ctDNA\u68C0\u6D4B", en: "Circulating Tumor DNA", code: "CTDNA", dataType: "\u5B57\u7B26\u4E32\u578B", domain: "\u9633\u6027\uFF0C\u9634\u6027\uFF0C\u672A\u884C\u68C0\u6D4B", constraint: "O", category: "\u6DB2\u4F53\u6D3B\u68C0" },
  { cn: "ctDNA\u68C0\u6D4B\u65F6\u95F4\u70B9", en: "ctDNA Timepoint", code: "CTDNA_TIME", dataType: "\u5B57\u7B26\u4E32\u578B", domain: "\u6CBB\u7597\u524D\u57FA\u7EBF\uFF0C\u6CBB\u7597\u4E2D\uFF0C\u6CBB\u7597\u540E\uFF0C\u590D\u53D1\u65F6", constraint: "O", category: "\u6DB2\u4F53\u6D3B\u68C0" },
  { cn: "\u4E8C\u4EE3\u6D4B\u5E8F\uFF08\u7EC4\u7EC7\uFF09", en: "Tissue NGS", code: "NGS_TISSUE", dataType: "\u5E03\u5C14\u578B", domain: "\u662F\uFF0C\u5426", constraint: "O", category: "\u6DB2\u4F53\u6D3B\u68C0" },
  { cn: "\u4E8C\u4EE3\u6D4B\u5E8F\uFF08\u8840\u6DB2\uFF09", en: "Blood NGS", code: "NGS_BLOOD", dataType: "\u5E03\u5C14\u578B", domain: "\u662F\uFF0C\u5426", constraint: "O", category: "\u6DB2\u4F53\u6D3B\u68C0" },
  { cn: "\u57FA\u56E0\u7A81\u53D8\u8C31", en: "Somatic Mutation Profile", code: "MUT_PROFILE", dataType: "\u5B57\u7B26\u4E32\u578B", domain: "TP53\uFF0CNOTCH1\uFF0CPIK3CA\uFF0CCDKN2A\uFF0CNFE2L2\uFF0CKEAP1\uFF0CKMT2D\uFF0C\u5176\u4ED6\uFF0C\u65E0\u7A81\u53D8\u68C0\u51FA", constraint: "O", category: "\u6DB2\u4F53\u6D3B\u68C0" },
  { cn: "DNA\u7532\u57FA\u5316\u68C0\u6D4B", en: "DNA Methylation", code: "METHYL", dataType: "\u5B57\u7B26\u4E32\u578B", domain: "\u9633\u6027\uFF0C\u9634\u6027\uFF0C\u672A\u884C\u68C0\u6D4B", constraint: "O", category: "\u6DB2\u4F53\u6D3B\u68C0" }
];
var standardCategories = [
  "\u57FA\u672C\u4FE1\u606F",
  "\u8840\u68C0\u80BF\u7624\u6807\u5FD7\u7269",
  "\u5185\u955C\u68C0\u67E5",
  "\u5F71\u50CF\u5B66\u68C0\u67E5",
  "\u75C5\u7406\u68C0\u67E5",
  "\u8F85\u52A9\u68C0\u67E5",
  "\u6D41\u884C\u75C5\u5B66-\u5438\u70DF",
  "\u6D41\u884C\u75C5\u5B66-\u996E\u9152",
  "\u6D41\u884C\u75C5\u5B66-\u996E\u8336",
  "\u6D41\u884C\u75C5\u5B66-\u996E\u98DF",
  "\u73AF\u5883\u66B4\u9732",
  "\u4F53\u529B\u6D3B\u52A8",
  "\u5973\u6027\u751F\u80B2\u53F2",
  "\u7761\u7720",
  "\u4E2A\u4EBA\u53CA\u5BB6\u65CF\u75C5\u53F2",
  "\u836F\u7269\u4F7F\u7528\u53F2",
  "\u4F53\u683C\u68C0\u67E5",
  "\u5B9E\u9A8C\u5BA4\u68C0\u6D4B",
  "\u8BCA\u65AD\u4E0E\u5206\u671F",
  "\u8425\u517B\u8BC4\u4F30",
  "\u5185\u955C\u6CBB\u7597",
  "\u624B\u672F\u6CBB\u7597",
  "\u65B0\u8F85\u52A9\u6CBB\u7597",
  "\u8F85\u52A9\u6CBB\u7597",
  "\u5316\u5B66\u6CBB\u7597",
  "\u653E\u5C04\u6CBB\u7597",
  "\u514D\u75AB\u6CBB\u7597",
  "\u9776\u5411\u6CBB\u7597",
  "\u7597\u6548\u8BC4\u4F30",
  "\u968F\u8BBF",
  "\u751F\u5B58\u4E0E\u9884\u540E",
  "\u751F\u6D3B\u8D28\u91CF",
  "\u59D1\u606F\u652F\u6301\u6CBB\u7597",
  "\u6DB2\u4F53\u6D3B\u68C0"
];

// src/mock/orgSourceFields.ts
var orgSourceMap = {
  // ============ 国家癌症中心：传统 HIS / LIS 数据库风格（大写下划线） ============
  \u56FD\u5BB6\u764C\u75C7\u4E2D\u5FC3: {
    // 基本信息
    ID: { source: "PATIENT_ID", ruleType: "\u76F4\u63A5\u6620\u5C04", rule: "\u53BB\u9664\u524D\u5BFC\u96F6\u540E\u5199\u5165\u75C5\u6848\u53F7" },
    NAME: { source: "PATIENT_NAME", ruleType: "\u76F4\u63A5\u6620\u5C04", rule: "\u8131\u654F\u540E\u5199\u5165\uFF08\u4FDD\u7559\u59D3\uFF09" },
    SEX: { source: "SEX_CODE", ruleType: "\u503C\u57DF\u6620\u5C04", rule: "1\u2192\u7537\uFF0C2\u2192\u5973" },
    AGE: { source: "AGE", ruleType: "\u683C\u5F0F\u8F6C\u6362", rule: "\u53BB\u9664\u201C\u5C81\u201D\u5E76\u53D6\u6574" },
    UID: { source: "ID_CARD_NO", ruleType: "\u76F4\u63A5\u6620\u5C04", rule: "\u52A0\u5BC6\u8131\u654F\u540E\u5199\u5165" },
    NATIVE: { source: "NATIVE_PLACE", ruleType: "\u76F4\u63A5\u6620\u5C04", rule: "\u7701/\u5E02/\u533A\u53BF\u62FC\u63A5" },
    ADDRESS: { source: "ADDRESS", ruleType: "\u76F4\u63A5\u6620\u5C04", rule: "\u539F\u503C\u4FDD\u7559" },
    CELLPHONE: { source: "PHONE_NO", ruleType: "\u683C\u5F0F\u8F6C\u6362", rule: "\u53BB\u9664\u7A7A\u683C\u4E0E\u8FDE\u5B57\u7B26" },
    ETHNIC: { source: "NATION_CODE", ruleType: "\u7F16\u7801\u8F6C\u6362", rule: "\u6C11\u65CF\u4EE3\u7801 \u2192 \u6C11\u65CF\u540D\u79F0" },
    MARITAL: { source: "MARRIAGE_CODE", ruleType: "\u503C\u57DF\u6620\u5C04", rule: "1\u2192\u672A\u5A5A\uFF0C2\u2192\u5DF2\u5A5A\uFF0C3\u2192\u79BB\u5A5A\uFF0C4\u2192\u4E27\u5076" },
    EDU: { source: "EDU_CODE", ruleType: "\u7F16\u7801\u8F6C\u6362", rule: "\u5B66\u5386\u4EE3\u7801 \u2192 \u6559\u80B2\u7A0B\u5EA6" },
    INSURANCE: { source: "INSURANCE_TYPE", ruleType: "\u503C\u57DF\u6620\u5C04", rule: "1\u2192\u57CE\u9547\u804C\u5DE5\u533B\u4FDD\uFF0C2\u2192\u57CE\u9547\u5C45\u6C11\u533B\u4FDD\uFF0C3\u2192\u65B0\u519C\u5408" },
    // 血检肿瘤标志物
    BT_ID: { source: "LAB_NO", ruleType: "\u76F4\u63A5\u6620\u5C04", rule: "\u539F\u503C\u4FDD\u7559" },
    BT_DATE: { source: "LAB_DATE", ruleType: "\u683C\u5F0F\u8F6C\u6362", rule: "YYYYMMDD \u2192 YYYY-MM-DD" },
    CEA: { source: "CEA", ruleType: "\u5355\u4F4D\u8F6C\u6362", rule: "ng/mL \u539F\u503C\u4FDD\u7559" },
    SCC: { source: "SCC", ruleType: "\u5355\u4F4D\u8F6C\u6362", rule: "ng/mL \u539F\u503C\u4FDD\u7559" },
    CA19_9: { source: "CA199", ruleType: "\u7F16\u7801\u8F6C\u6362", rule: "CA199 \u2192 \u7CD6\u7C7B\u6297\u539F19-9" },
    CYFRA21_1: { source: "CYFRA211", ruleType: "\u7F16\u7801\u8F6C\u6362", rule: "CYFRA211 \u2192 \u7EC6\u80DE\u89D2\u86CB\u767D19\u7247\u6BB5" },
    CA72_4: { source: "CA724", ruleType: "\u7F16\u7801\u8F6C\u6362", rule: "CA724 \u2192 \u7CD6\u7C7B\u6297\u539F72-4" },
    AFP: { source: "AFP", ruleType: "\u76F4\u63A5\u6620\u5C04", rule: "ng/mL \u539F\u503C\u4FDD\u7559" },
    CA125: { source: "CA125", ruleType: "\u76F4\u63A5\u6620\u5C04", rule: "U/mL \u539F\u503C\u4FDD\u7559" },
    NSE: { source: "NSE", ruleType: "\u76F4\u63A5\u6620\u5C04", rule: "ng/mL \u539F\u503C\u4FDD\u7559" },
    // 实验室检测
    HBSAG: { source: "HBSAG", ruleType: "\u503C\u57DF\u6620\u5C04", rule: "0\u2192\u9634\u6027\uFF0C1\u2192\u9633\u6027" },
    ANTI_HCV: { source: "ANTI_HCV", ruleType: "\u503C\u57DF\u6620\u5C04", rule: "0\u2192\u9634\u6027\uFF0C1\u2192\u9633\u6027" },
    HP_TEST: { source: "HP_TEST", ruleType: "\u503C\u57DF\u6620\u5C04", rule: "0\u2192\u9634\u6027\uFF0C1\u2192\u9633\u6027" },
    FBG: { source: "GLU", ruleType: "\u5355\u4F4D\u8F6C\u6362", rule: "mg/dL \u2192 mmol/L\uFF08\xF718\uFF09" },
    TG: { source: "TG", ruleType: "\u76F4\u63A5\u6620\u5C04", rule: "mmol/L \u539F\u503C\u4FDD\u7559" },
    CHOL: { source: "CHOL", ruleType: "\u76F4\u63A5\u6620\u5C04", rule: "mmol/L \u539F\u503C\u4FDD\u7559" },
    HDL: { source: "HDL", ruleType: "\u76F4\u63A5\u6620\u5C04", rule: "mmol/L \u539F\u503C\u4FDD\u7559" },
    LDL: { source: "LDL", ruleType: "\u76F4\u63A5\u6620\u5C04", rule: "mmol/L \u539F\u503C\u4FDD\u7559" },
    PG1: { source: "PG1", ruleType: "\u76F4\u63A5\u6620\u5C04", rule: "ng/mL \u539F\u503C\u4FDD\u7559" },
    PGR: { source: "PGR", ruleType: "\u76F4\u63A5\u6620\u5C04", rule: "\u539F\u503C\u4FDD\u7559" },
    G17: { source: "G17", ruleType: "\u76F4\u63A5\u6620\u5C04", rule: "pmol/L \u539F\u503C\u4FDD\u7559" },
    // 体格检查
    HEIGHT: { source: "HEIGHT", ruleType: "\u76F4\u63A5\u6620\u5C04", rule: "cm \u539F\u503C\u4FDD\u7559" },
    WEIGHT: { source: "WEIGHT", ruleType: "\u76F4\u63A5\u6620\u5C04", rule: "kg \u539F\u503C\u4FDD\u7559" },
    BMI: { source: "BMI", ruleType: "\u76F4\u63A5\u6620\u5C04", rule: "kg/m\xB2 \u539F\u503C\u4FDD\u7559" },
    WAIST: { source: "WAIST", ruleType: "\u76F4\u63A5\u6620\u5C04", rule: "cm \u539F\u503C\u4FDD\u7559" },
    // 内镜检查
    ENDO_ID: { source: "EXAM_NO", ruleType: "\u76F4\u63A5\u6620\u5C04", rule: "\u539F\u503C\u4FDD\u7559" },
    ENDO_DATE: { source: "EXAM_DATE", ruleType: "\u683C\u5F0F\u8F6C\u6362", rule: "YYYY/MM/DD \u2192 YYYY-MM-DD" },
    ANESTHESIA: { source: "ANES_FLAG", ruleType: "\u503C\u57DF\u6620\u5C04", rule: "0\u2192\u5426\uFF0C1\u2192\u662F" },
    STAIN: { source: "STAIN_METHOD", ruleType: "\u7F16\u7801\u8F6C\u6362", rule: "01\u2192\u5362\u6208\u6C0F\u7898\u67D3\u8272\uFF0C02\u2192\u7535\u5B50\u67D3\u8272\uFF0C00\u2192\u65E0\u67D3\u8272" },
    BIOPSY: { source: "BIOPSY_FLAG", ruleType: "\u503C\u57DF\u6620\u5C04", rule: "0\u2192\u5426\uFF0C1\u2192\u662F" },
    ENDO_LOC: { source: "LESION_LOC", ruleType: "\u7F16\u7801\u8F6C\u6362", rule: "1\u2192\u9888\u6BB5\uFF0C2\u2192\u4E0A\u6BB5\uFF0C3\u2192\u4E2D\u6BB5\uFF0C4\u2192\u4E0B\u6BB5\uFF0C5\u2192\u8D32\u95E8" },
    ENDO_N: { source: "LESION_COUNT", ruleType: "\u76F4\u63A5\u6620\u5C04", rule: "\u539F\u503C\u4FDD\u7559" },
    ENDO_DIAG: { source: "ENDO_HIST_DIAG", ruleType: "\u76F4\u63A5\u6620\u5C04", rule: "\u539F\u503C\u4FDD\u7559" },
    LUGOL: { source: "LUGOL_GRADE", ruleType: "\u7F16\u7801\u8F6C\u6362", rule: "1\u2192I\u7EA7\uFF0C2\u2192II\u7EA7\uFF0C3\u2192III\u7EA7\uFF0C4\u2192IV\u7EA7" },
    DIAG_ENDO: { source: "ENDO_DIAG", ruleType: "\u76F4\u63A5\u6620\u5C04", rule: "\u539F\u503C\u4FDD\u7559" },
    ENDO_RPT: { source: "ENDO_REPORT", ruleType: "\u76F4\u63A5\u6620\u5C04", rule: "\u539F\u503C\u4FDD\u7559" },
    EUS_DEPTH: { source: "EUS_DEPTH", ruleType: "\u5355\u4F4D\u8F6C\u6362", rule: "cm \u2192 mm\uFF08\xD710\uFF09" },
    // 影像学检查
    CT_ID: { source: "CT_NO", ruleType: "\u76F4\u63A5\u6620\u5C04", rule: "\u539F\u503C\u4FDD\u7559" },
    CT_DATE: { source: "CT_DATE", ruleType: "\u683C\u5F0F\u8F6C\u6362", rule: "YYYYMMDD \u2192 YYYY-MM-DD" },
    CT_TYPE: { source: "CT_TYPE", ruleType: "\u503C\u57DF\u6620\u5C04", rule: "0\u2192\u5E73\u626B\uFF0C1\u2192\u589E\u5F3A" },
    CT_LOC: { source: "CT_LESION_LOC", ruleType: "\u76F4\u63A5\u6620\u5C04", rule: "\u539F\u503C\u4FDD\u7559" },
    CT_DIAG: { source: "CT_DIAG", ruleType: "\u76F4\u63A5\u6620\u5C04", rule: "\u539F\u503C\u4FDD\u7559" },
    CT_RPT: { source: "CT_REPORT", ruleType: "\u76F4\u63A5\u6620\u5C04", rule: "\u539F\u503C\u4FDD\u7559" },
    US_ID: { source: "US_NO", ruleType: "\u76F4\u63A5\u6620\u5C04", rule: "\u539F\u503C\u4FDD\u7559" },
    US_DATE: { source: "US_DATE", ruleType: "\u683C\u5F0F\u8F6C\u6362", rule: "YYYYMMDD \u2192 YYYY-MM-DD" },
    US_RPT: { source: "US_REPORT", ruleType: "\u76F4\u63A5\u6620\u5C04", rule: "\u539F\u503C\u4FDD\u7559" },
    US_LOC: { source: "US_LESION_LOC", ruleType: "\u76F4\u63A5\u6620\u5C04", rule: "\u539F\u503C\u4FDD\u7559" },
    US_DIAG: { source: "US_DIAG", ruleType: "\u76F4\u63A5\u6620\u5C04", rule: "\u539F\u503C\u4FDD\u7559" },
    CM: { source: "M_STAGE", ruleType: "\u7F16\u7801\u8F6C\u6362", rule: "M0/M1/Mx \u6821\u9A8C\u540E\u5199\u5165" },
    cM: { source: "CM_STAGE_C", ruleType: "\u7F16\u7801\u8F6C\u6362", rule: "M0/M1/Mx \u6821\u9A8C\u540E\u5199\u5165" },
    MET_SITE: { source: "MET_SITE", ruleType: "\u503C\u57DF\u6620\u5C04", rule: "1\u2192\u809D\uFF0C2\u2192\u80BA\uFF0C3\u2192\u9AA8\uFF0C4\u2192\u8FDC\u5904\u6DCB\u5DF4\u7ED3" },
    // 病理检查
    PATH_ID: { source: "PATH_NO", ruleType: "\u76F4\u63A5\u6620\u5C04", rule: "\u539F\u503C\u4FDD\u7559" },
    SPEC_NO: { source: "SPEC_SEQ", ruleType: "\u76F4\u63A5\u6620\u5C04", rule: "\u539F\u503C\u4FDD\u7559" },
    PATH_DATE: { source: "PATH_DATE", ruleType: "\u683C\u5F0F\u8F6C\u6362", rule: "YYYYMMDD \u2192 YYYY-MM-DD" },
    PATH_TYPE: { source: "SPEC_TYPE", ruleType: "\u503C\u57DF\u6620\u5C04", rule: "1\u2192\u6D3B\u68C0\uFF0C2\u2192\u5185\u955C\u4E0B\u5207\u9664\uFF08EMR/ESD\uFF09\uFF0C3\u2192\u624B\u672F" },
    PATH_LOC: { source: "BIOPSY_LOC", ruleType: "\u76F4\u63A5\u6620\u5C04", rule: "\u539F\u503C\u4FDD\u7559" },
    LAMINA: { source: "LAMINA_FLAG", ruleType: "\u503C\u57DF\u6620\u5C04", rule: "0\u2192\u65E0\uFF0C1\u2192\u6709" },
    PATH_CODE: { source: "PATH_DIAG_CODE", ruleType: "\u7F16\u7801\u8F6C\u6362", rule: "\u9662\u5185\u75C5\u7406\u7801 \u2192 \u6807\u51C6\u75C5\u7406\u8BCA\u65AD\u7F16\u7801" },
    DIAG_PATH_DIS: { source: "PATH_DIAG_DESC", ruleType: "\u76F4\u63A5\u6620\u5C04", rule: "\u539F\u503C\u4FDD\u7559" },
    PATH_RPT: { source: "PATH_REPORT", ruleType: "\u76F4\u63A5\u6620\u5C04", rule: "\u539F\u503C\u4FDD\u7559" },
    HISTO_TYPE: { source: "HISTO_TYPE", ruleType: "\u7F16\u7801\u8F6C\u6362", rule: "WHO \u5206\u7C7B\u7F16\u7801 \u2192 \u7EC4\u7EC7\u5B66\u7C7B\u578B" },
    GRADE: { source: "HISTO_GRADE", ruleType: "\u7F16\u7801\u8F6C\u6362", rule: "1\u2192G1\uFF0C2\u2192G2\uFF0C3\u2192G3\uFF0C9\u2192Gx" },
    IEN: { source: "IEN_GRADE", ruleType: "\u503C\u57DF\u6620\u5C04", rule: "1\u2192\u4F4E\u7EA7\u522B\uFF0C2\u2192\u9AD8\u7EA7\u522B\uFF0C3\u2192\u4E0D\u80FD\u5206\u7C7B" },
    EARLY: { source: "EARLY_FLAG", ruleType: "\u503C\u57DF\u6620\u5C04", rule: "0\u2192\u5426\uFF0C1\u2192\u662F" },
    INV_DEPTH: { source: "INVASION_DEPTH", ruleType: "\u7F16\u7801\u8F6C\u6362", rule: "M1/M2/M3/SM1/SM2/SM3 \u2192 \u6807\u51C6\u6D78\u6DA6\u6DF1\u5EA6" },
    LVI: { source: "LVI_FLAG", ruleType: "\u503C\u57DF\u6620\u5C04", rule: "0\u2192\u65E0\uFF0C1\u2192\u6709" },
    MARGIN: { source: "MARGIN_STATUS", ruleType: "\u503C\u57DF\u6620\u5C04", rule: "0\u2192\u9634\u6027\uFF0C1\u2192\u9633\u6027" },
    pT: { source: "PT_STAGE", ruleType: "\u7F16\u7801\u8F6C\u6362", rule: "AJCC \u7B2C8\u7248 pT \u6821\u9A8C" },
    pN: { source: "PN_STAGE", ruleType: "\u7F16\u7801\u8F6C\u6362", rule: "AJCC \u7B2C8\u7248 pN \u6821\u9A8C" },
    STAGE: { source: "TNM_STAGE", ruleType: "\u7F16\u7801\u8F6C\u6362", rule: "AJCC \u7B2C8\u7248\u603B\u5206\u671F\u6821\u9A8C" },
    LN_EXAM: { source: "LN_TOTAL", ruleType: "\u76F4\u63A5\u6620\u5C04", rule: "\u539F\u503C\u4FDD\u7559" },
    LN_POS: { source: "LN_POSITIVE", ruleType: "\u76F4\u63A5\u6620\u5C04", rule: "\u539F\u503C\u4FDD\u7559" },
    TRG: { source: "TRG_GRADE", ruleType: "\u7F16\u7801\u8F6C\u6362", rule: "0\u2192TRG0\uFF0C1\u2192TRG1\uFF0C2\u2192TRG2\uFF0C3\u2192TRG3" },
    // 诊断与分期
    DIAG_DATE: { source: "DIAG_DATE", ruleType: "\u683C\u5F0F\u8F6C\u6362", rule: "YYYYMMDD \u2192 YYYY-MM-DD" },
    CHIEF_COM: { source: "CHIEF_COMPLAINT", ruleType: "\u76F4\u63A5\u6620\u5C04", rule: "\u539F\u503C\u4FDD\u7559\uFF08\u591A\u503C\u7528\u9017\u53F7\u5206\u9694\uFF09" },
    SYM_DUR: { source: "SYM_DURATION", ruleType: "\u5355\u4F4D\u8F6C\u6362", rule: "\u5929 \u2192 \u6708\uFF08\xF730\uFF09" },
    DETECT_METHOD: { source: "FIND_WAY", ruleType: "\u503C\u57DF\u6620\u5C04", rule: "1\u2192\u7B5B\u67E5\u53D1\u73B0\uFF0C2\u2192\u75C7\u72B6\u5C31\u8BCA\uFF0C3\u2192\u4F53\u68C0\u53D1\u73B0" },
    cT: { source: "CT_STAGE_C", ruleType: "\u7F16\u7801\u8F6C\u6362", rule: "AJCC \u7B2C8\u7248 cT \u6821\u9A8C" },
    cN: { source: "CN_STAGE_C", ruleType: "\u7F16\u7801\u8F6C\u6362", rule: "AJCC \u7B2C8\u7248 cN \u6821\u9A8C" },
    cM_DIAG: { source: "CM_STAGE_C", ruleType: "\u7F16\u7801\u8F6C\u6362", rule: "M0/M1/Mx \u6821\u9A8C\u540E\u5199\u5165" },
    cSTAGE: { source: "CLIN_STAGE", ruleType: "\u7F16\u7801\u8F6C\u6362", rule: "AJCC \u7B2C8\u7248\u4E34\u5E8A\u5206\u671F\u6821\u9A8C" },
    LESION_LEN: { source: "LESION_LENGTH", ruleType: "\u5355\u4F4D\u8F6C\u6362", rule: "mm \u2192 cm\uFF08\xF710\uFF09" },
    ECOG: { source: "ECOG_SCORE", ruleType: "\u76F4\u63A5\u6620\u5C04", rule: "0-4 \u539F\u503C\u4FDD\u7559" },
    // 随访
    FU_ID: { source: "FU_NO", ruleType: "\u76F4\u63A5\u6620\u5C04", rule: "\u539F\u503C\u4FDD\u7559" },
    FU_DATE: { source: "FU_DATE", ruleType: "\u683C\u5F0F\u8F6C\u6362", rule: "YYYYMMDD \u2192 YYYY-MM-DD" },
    FU_SEQ: { source: "FU_TIMES", ruleType: "\u76F4\u63A5\u6620\u5C04", rule: "\u539F\u503C\u4FDD\u7559" },
    FU_STATUS: { source: "FU_STATE", ruleType: "\u503C\u57DF\u6620\u5C04", rule: "1\u2192\u5B58\u6D3B\uFF0C2\u2192\u5931\u8BBF\uFF0C3\u2192\u6B7B\u4EA1" },
    DEATH_DATE: { source: "DEATH_DATE", ruleType: "\u683C\u5F0F\u8F6C\u6362", rule: "YYYYMMDD \u2192 YYYY-MM-DD" },
    RECUR_STATUS: { source: "RECUR_FLAG", ruleType: "\u503C\u57DF\u6620\u5C04", rule: "0\u2192\u65E0\uFF0C1\u2192\u6709" },
    RECUR_DATE: { source: "RECUR_DATE", ruleType: "\u683C\u5F0F\u8F6C\u6362", rule: "YYYYMMDD \u2192 YYYY-MM-DD" },
    LAST_FU_DATE: { source: "LAST_FU_DATE", ruleType: "\u683C\u5F0F\u8F6C\u6362", rule: "YYYYMMDD \u2192 YYYY-MM-DD" },
    // 生存与预后
    OS: { source: "OS_DAYS", ruleType: "\u76F4\u63A5\u6620\u5C04", rule: "\u5929\uFF0C\u539F\u503C\u4FDD\u7559" },
    OS_CENSOR: { source: "OS_CENSOR", ruleType: "\u503C\u57DF\u6620\u5C04", rule: "0\u2192\u5220\u5931\uFF0C1\u2192\u6B7B\u4EA1" },
    DFS: { source: "DFS_DAYS", ruleType: "\u76F4\u63A5\u6620\u5C04", rule: "\u5929\uFF0C\u539F\u503C\u4FDD\u7559" },
    DFS_CENSOR: { source: "DFS_CENSOR", ruleType: "\u503C\u57DF\u6620\u5C04", rule: "0\u2192\u5220\u5931\uFF0C1\u2192\u8FDB\u5C55/\u6B7B\u4EA1" },
    SURV_5Y: { source: "SURV_5Y", ruleType: "\u503C\u57DF\u6620\u5C04", rule: "0\u2192\u672A\u8FBE5\u5E74\uFF0C1\u2192\u5B58\u6D3B\u6EE15\u5E74" }
  },
  // ============ 首都医科大学附属医院：业务系统 / JSON 接口风格（小驼峰） ============
  \u9996\u90FD\u533B\u79D1\u5927\u5B66\u9644\u5C5E\u533B\u9662: {
    // 基本信息
    ID: { source: "patientNo", ruleType: "\u76F4\u63A5\u6620\u5C04", rule: "\u539F\u503C\u4FDD\u7559" },
    NAME: { source: "patientName", ruleType: "\u76F4\u63A5\u6620\u5C04", rule: "\u8131\u654F\u540E\u5199\u5165\uFF08\u4FDD\u7559\u59D3\uFF09" },
    SEX: { source: "gender", ruleType: "\u503C\u57DF\u6620\u5C04", rule: "\u7537\u2192\u7537\uFF0C\u5973\u2192\u5973\uFF0CM\u2192\u7537\uFF0CF\u2192\u5973" },
    AGE: { source: "patientAge", ruleType: "\u683C\u5F0F\u8F6C\u6362", rule: "\u6D6E\u70B9\u53D6\u6574" },
    NATIVE: { source: "nativePlace", ruleType: "\u76F4\u63A5\u6620\u5C04", rule: "\u539F\u503C\u4FDD\u7559" },
    ADDRESS: { source: "address", ruleType: "\u76F4\u63A5\u6620\u5C04", rule: "\u539F\u503C\u4FDD\u7559" },
    ETHNIC: { source: "nation", ruleType: "\u7F16\u7801\u8F6C\u6362", rule: "\u6C11\u65CF\u4EE3\u7801 \u2192 \u6C11\u65CF\u540D\u79F0" },
    MARITAL: { source: "marriage", ruleType: "\u503C\u57DF\u6620\u5C04", rule: "10\u2192\u672A\u5A5A\uFF0C20\u2192\u5DF2\u5A5A\uFF0C30\u2192\u79BB\u5F02\uFF0C40\u2192\u4E27\u5076" },
    EDU: { source: "education", ruleType: "\u7F16\u7801\u8F6C\u6362", rule: "\u5B66\u5386\u4EE3\u7801 \u2192 \u6559\u80B2\u7A0B\u5EA6" },
    INSURANCE: { source: "insuranceType", ruleType: "\u503C\u57DF\u6620\u5C04", rule: "URBAN_EMP\u2192\u57CE\u9547\u804C\u5DE5\u533B\u4FDD\uFF0CNCMS\u2192\u65B0\u519C\u5408" },
    // 血检肿瘤标志物
    BT_ID: { source: "labNo", ruleType: "\u76F4\u63A5\u6620\u5C04", rule: "\u539F\u503C\u4FDD\u7559" },
    BT_DATE: { source: "labDate", ruleType: "\u683C\u5F0F\u8F6C\u6362", rule: "\u65F6\u95F4\u6233 \u2192 YYYY-MM-DD" },
    CEA: { source: "cea", ruleType: "\u5355\u4F4D\u8F6C\u6362", rule: "\u7EDF\u4E00\u4E3A ng/mL" },
    SCC: { source: "scc", ruleType: "\u5355\u4F4D\u8F6C\u6362", rule: "\u7EDF\u4E00\u4E3A ng/mL" },
    CA19_9: { source: "ca199", ruleType: "\u7F16\u7801\u8F6C\u6362", rule: "ca199 \u2192 \u7CD6\u7C7B\u6297\u539F19-9" },
    CYFRA21_1: { source: "cyfra211", ruleType: "\u7F16\u7801\u8F6C\u6362", rule: "cyfra211 \u2192 \u7EC6\u80DE\u89D2\u86CB\u767D19\u7247\u6BB5" },
    CA72_4: { source: "ca724", ruleType: "\u7F16\u7801\u8F6C\u6362", rule: "ca724 \u2192 \u7CD6\u7C7B\u6297\u539F72-4" },
    AFP: { source: "afp", ruleType: "\u76F4\u63A5\u6620\u5C04", rule: "ng/mL \u539F\u503C\u4FDD\u7559" },
    CA125: { source: "ca125", ruleType: "\u76F4\u63A5\u6620\u5C04", rule: "U/mL \u539F\u503C\u4FDD\u7559" },
    NSE: { source: "nse", ruleType: "\u76F4\u63A5\u6620\u5C04", rule: "ng/mL \u539F\u503C\u4FDD\u7559" },
    // 实验室检测
    HBSAG: { source: "hbsag", ruleType: "\u503C\u57DF\u6620\u5C04", rule: "NEG\u2192\u9634\u6027\uFF0CPOS\u2192\u9633\u6027" },
    ANTI_HCV: { source: "antiHcv", ruleType: "\u503C\u57DF\u6620\u5C04", rule: "NEG\u2192\u9634\u6027\uFF0CPOS\u2192\u9633\u6027" },
    HP_TEST: { source: "hpTest", ruleType: "\u503C\u57DF\u6620\u5C04", rule: "NEG\u2192\u9634\u6027\uFF0CPOS\u2192\u9633\u6027" },
    FBG: { source: "fbg", ruleType: "\u76F4\u63A5\u6620\u5C04", rule: "mmol/L \u539F\u503C\u4FDD\u7559" },
    TG: { source: "tg", ruleType: "\u76F4\u63A5\u6620\u5C04", rule: "mmol/L \u539F\u503C\u4FDD\u7559" },
    CHOL: { source: "chol", ruleType: "\u76F4\u63A5\u6620\u5C04", rule: "mmol/L \u539F\u503C\u4FDD\u7559" },
    HDL: { source: "hdl", ruleType: "\u76F4\u63A5\u6620\u5C04", rule: "mmol/L \u539F\u503C\u4FDD\u7559" },
    LDL: { source: "ldl", ruleType: "\u76F4\u63A5\u6620\u5C04", rule: "mmol/L \u539F\u503C\u4FDD\u7559" },
    // 体格检查
    HEIGHT: { source: "height", ruleType: "\u76F4\u63A5\u6620\u5C04", rule: "cm \u539F\u503C\u4FDD\u7559" },
    WEIGHT: { source: "weight", ruleType: "\u76F4\u63A5\u6620\u5C04", rule: "kg \u539F\u503C\u4FDD\u7559" },
    BMI: { source: "bmi", ruleType: "\u76F4\u63A5\u6620\u5C04", rule: "kg/m\xB2 \u539F\u503C\u4FDD\u7559" },
    WAIST: { source: "waist", ruleType: "\u76F4\u63A5\u6620\u5C04", rule: "cm \u539F\u503C\u4FDD\u7559" },
    // 内镜检查
    ENDO_ID: { source: "endoId", ruleType: "\u76F4\u63A5\u6620\u5C04", rule: "\u539F\u503C\u4FDD\u7559" },
    ENDO_DATE: { source: "endoDate", ruleType: "\u683C\u5F0F\u8F6C\u6362", rule: "YYYY/MM/DD \u2192 YYYY-MM-DD" },
    ANESTHESIA: { source: "anesthesia", ruleType: "\u503C\u57DF\u6620\u5C04", rule: "false\u2192\u5426\uFF0Ctrue\u2192\u662F" },
    STAIN: { source: "stainMethod", ruleType: "\u7F16\u7801\u8F6C\u6362", rule: "LUGOL\u2192\u5362\u6208\u6C0F\u7898\u67D3\u8272\uFF0CNBI\u2192\u7535\u5B50\u67D3\u8272" },
    BIOPSY: { source: "biopsy", ruleType: "\u503C\u57DF\u6620\u5C04", rule: "false\u2192\u5426\uFF0Ctrue\u2192\u662F" },
    ENDO_LOC: { source: "lesionLoc", ruleType: "\u7F16\u7801\u8F6C\u6362", rule: "UPPER\u2192\u4E0A\u6BB5\uFF0CMIDDLE\u2192\u4E2D\u6BB5\uFF0CLOWER\u2192\u4E0B\u6BB5" },
    ENDO_N: { source: "lesionCount", ruleType: "\u76F4\u63A5\u6620\u5C04", rule: "\u539F\u503C\u4FDD\u7559" },
    DIAG_ENDO: { source: "endoDiag", ruleType: "\u76F4\u63A5\u6620\u5C04", rule: "\u539F\u503C\u4FDD\u7559" },
    ENDO_RPT: { source: "endoReport", ruleType: "\u76F4\u63A5\u6620\u5C04", rule: "\u539F\u503C\u4FDD\u7559" },
    // 影像学检查
    CT_ID: { source: "ctNo", ruleType: "\u76F4\u63A5\u6620\u5C04", rule: "\u539F\u503C\u4FDD\u7559" },
    CT_DATE: { source: "ctDate", ruleType: "\u683C\u5F0F\u8F6C\u6362", rule: "YYYY/MM/DD \u2192 YYYY-MM-DD" },
    CT_TYPE: { source: "ctType", ruleType: "\u503C\u57DF\u6620\u5C04", rule: "PLAIN\u2192\u5E73\u626B\uFF0CENHANCE\u2192\u589E\u5F3A" },
    CT_DIAG: { source: "ctDiag", ruleType: "\u76F4\u63A5\u6620\u5C04", rule: "\u539F\u503C\u4FDD\u7559" },
    CT_RPT: { source: "ctReport", ruleType: "\u76F4\u63A5\u6620\u5C04", rule: "\u539F\u503C\u4FDD\u7559" },
    CM: { source: "mStage", ruleType: "\u7F16\u7801\u8F6C\u6362", rule: "M0/M1/Mx \u6821\u9A8C\u540E\u5199\u5165" },
    // 病理检查
    PATH_ID: { source: "pathNo", ruleType: "\u76F4\u63A5\u6620\u5C04", rule: "\u539F\u503C\u4FDD\u7559" },
    PATH_DATE: { source: "pathDate", ruleType: "\u683C\u5F0F\u8F6C\u6362", rule: "YYYY/MM/DD \u2192 YYYY-MM-DD" },
    PATH_TYPE: { source: "specType", ruleType: "\u503C\u57DF\u6620\u5C04", rule: "BIOPSY\u2192\u6D3B\u68C0\uFF0CESD\u2192\u5185\u955C\u4E0B\u5207\u9664\uFF08EMR/ESD\uFF09\uFF0CSURGERY\u2192\u624B\u672F" },
    HISTO_TYPE: { source: "histoType", ruleType: "\u7F16\u7801\u8F6C\u6362", rule: "WHO \u5206\u7C7B\u7F16\u7801 \u2192 \u7EC4\u7EC7\u5B66\u7C7B\u578B" },
    GRADE: { source: "grade", ruleType: "\u7F16\u7801\u8F6C\u6362", rule: "G1/G2/G3/Gx \u6821\u9A8C\u540E\u5199\u5165" },
    pT: { source: "ptStage", ruleType: "\u7F16\u7801\u8F6C\u6362", rule: "AJCC \u7B2C8\u7248 pT \u6821\u9A8C" },
    pN: { source: "pnStage", ruleType: "\u7F16\u7801\u8F6C\u6362", rule: "AJCC \u7B2C8\u7248 pN \u6821\u9A8C" },
    STAGE: { source: "tnmStage", ruleType: "\u7F16\u7801\u8F6C\u6362", rule: "AJCC \u7B2C8\u7248\u603B\u5206\u671F\u6821\u9A8C" },
    LN_EXAM: { source: "lnExam", ruleType: "\u76F4\u63A5\u6620\u5C04", rule: "\u539F\u503C\u4FDD\u7559" },
    LN_POS: { source: "lnPos", ruleType: "\u76F4\u63A5\u6620\u5C04", rule: "\u539F\u503C\u4FDD\u7559" },
    PATH_CODE: { source: "pathDiag", ruleType: "\u7F16\u7801\u8F6C\u6362", rule: "\u9662\u5185\u75C5\u7406\u7801 \u2192 \u6807\u51C6\u75C5\u7406\u8BCA\u65AD\u7F16\u7801" },
    // 诊断与分期
    DIAG_DATE: { source: "diagDate", ruleType: "\u683C\u5F0F\u8F6C\u6362", rule: "YYYY/MM/DD \u2192 YYYY-MM-DD" },
    CHIEF_COM: { source: "chiefComplaint", ruleType: "\u76F4\u63A5\u6620\u5C04", rule: "\u539F\u503C\u4FDD\u7559\uFF08\u591A\u503C\u7528\u9017\u53F7\u5206\u9694\uFF09" },
    DETECT_METHOD: { source: "findWay", ruleType: "\u503C\u57DF\u6620\u5C04", rule: "SCREEN\u2192\u7B5B\u67E5\u53D1\u73B0\uFF0CSYMPTOM\u2192\u75C7\u72B6\u5C31\u8BCA\uFF0CCHECKUP\u2192\u4F53\u68C0\u53D1\u73B0" },
    cT: { source: "ct", ruleType: "\u7F16\u7801\u8F6C\u6362", rule: "AJCC \u7B2C8\u7248 cT \u6821\u9A8C" },
    cN: { source: "cn", ruleType: "\u7F16\u7801\u8F6C\u6362", rule: "AJCC \u7B2C8\u7248 cN \u6821\u9A8C" },
    cM_DIAG: { source: "cm", ruleType: "\u7F16\u7801\u8F6C\u6362", rule: "M0/M1/Mx \u6821\u9A8C\u540E\u5199\u5165" },
    cSTAGE: { source: "clinStage", ruleType: "\u7F16\u7801\u8F6C\u6362", rule: "AJCC \u7B2C8\u7248\u4E34\u5E8A\u5206\u671F\u6821\u9A8C" },
    LESION_LEN: { source: "lesionLength", ruleType: "\u76F4\u63A5\u6620\u5C04", rule: "cm \u539F\u503C\u4FDD\u7559" },
    ECOG: { source: "ecog", ruleType: "\u76F4\u63A5\u6620\u5C04", rule: "0-4 \u539F\u503C\u4FDD\u7559" },
    // 随访
    FU_ID: { source: "fuNo", ruleType: "\u76F4\u63A5\u6620\u5C04", rule: "\u539F\u503C\u4FDD\u7559" },
    FU_DATE: { source: "fuDate", ruleType: "\u683C\u5F0F\u8F6C\u6362", rule: "YYYY/MM/DD \u2192 YYYY-MM-DD" },
    FU_SEQ: { source: "fuTimes", ruleType: "\u76F4\u63A5\u6620\u5C04", rule: "\u539F\u503C\u4FDD\u7559" },
    FU_STATUS: { source: "fuStatus", ruleType: "\u503C\u57DF\u6620\u5C04", rule: "ALIVE\u2192\u5B58\u6D3B\uFF0CLOST\u2192\u5931\u8BBF\uFF0CDEAD\u2192\u6B7B\u4EA1" },
    RECUR_STATUS: { source: "recurFlag", ruleType: "\u503C\u57DF\u6620\u5C04", rule: "false\u2192\u65E0\uFF0Ctrue\u2192\u6709" },
    RECUR_DATE: { source: "recurDate", ruleType: "\u683C\u5F0F\u8F6C\u6362", rule: "YYYY/MM/DD \u2192 YYYY-MM-DD" },
    LAST_FU_DATE: { source: "lastFuDate", ruleType: "\u683C\u5F0F\u8F6C\u6362", rule: "YYYY/MM/DD \u2192 YYYY-MM-DD" },
    // 生存与预后
    OS: { source: "osDays", ruleType: "\u76F4\u63A5\u6620\u5C04", rule: "\u5929\uFF0C\u539F\u503C\u4FDD\u7559" },
    OS_CENSOR: { source: "osCensor", ruleType: "\u503C\u57DF\u6620\u5C04", rule: "0\u2192\u5220\u5931\uFF0C1\u2192\u6B7B\u4EA1" }
  },
  // ============ 某市立医院：FHIR 标准接口风格（下划线 + 语义化编码） ============
  \u67D0\u5E02\u7ACB\u533B\u9662: {
    // 基本信息
    ID: { source: "patient_id", ruleType: "\u76F4\u63A5\u6620\u5C04", rule: "\u539F\u503C\u4FDD\u7559" },
    NAME: { source: "patient_name", ruleType: "\u76F4\u63A5\u6620\u5C04", rule: "\u8131\u654F\u540E\u5199\u5165\uFF08\u4FDD\u7559\u59D3\uFF09" },
    SEX: { source: "sex_at_birth", ruleType: "\u503C\u57DF\u6620\u5C04", rule: "male\u2192\u7537\uFF0Cfemale\u2192\u5973" },
    AGE: { source: "age", ruleType: "\u76F4\u63A5\u6620\u5C04", rule: "\u539F\u503C\u4FDD\u7559" },
    UID: { source: "national_id", ruleType: "\u76F4\u63A5\u6620\u5C04", rule: "\u52A0\u5BC6\u8131\u654F\u540E\u5199\u5165" },
    NATIVE: { source: "birth_place", ruleType: "\u76F4\u63A5\u6620\u5C04", rule: "\u7701/\u5E02/\u533A\u53BF\u62FC\u63A5" },
    ADDRESS: { source: "address_line", ruleType: "\u76F4\u63A5\u6620\u5C04", rule: "\u539F\u503C\u4FDD\u7559" },
    CELLPHONE: { source: "telecom", ruleType: "\u683C\u5F0F\u8F6C\u6362", rule: "\u53BB\u9664 tel: \u524D\u7F00\u4E0E\u5206\u9694\u7B26" },
    ETHNIC: { source: "ethnicity", ruleType: "\u7F16\u7801\u8F6C\u6362", rule: "\u6C11\u65CF\u4EE3\u7801 \u2192 \u6C11\u65CF\u540D\u79F0" },
    MARITAL: { source: "marital_status", ruleType: "\u7F16\u7801\u8F6C\u6362", rule: "U\u2192\u672A\u5A5A\uFF0CM\u2192\u5DF2\u5A5A\uFF0CD\u2192\u79BB\u5A5A\uFF0CW\u2192\u4E27\u5076" },
    EDU: { source: "education_level", ruleType: "\u7F16\u7801\u8F6C\u6362", rule: "\u5B66\u5386\u4EE3\u7801 \u2192 \u6559\u80B2\u7A0B\u5EA6" },
    INSURANCE: { source: "insurance", ruleType: "\u7F16\u7801\u8F6C\u6362", rule: "\u533B\u4FDD\u4EE3\u7801 \u2192 \u533B\u7597\u4FDD\u969C\u7C7B\u578B" },
    // 血检肿瘤标志物
    BT_ID: { source: "lab_id", ruleType: "\u76F4\u63A5\u6620\u5C04", rule: "\u539F\u503C\u4FDD\u7559" },
    BT_DATE: { source: "lab_date", ruleType: "\u76F4\u63A5\u6620\u5C04", rule: "ISO 8601 \u76F4\u63A5\u5199\u5165" },
    CEA: { source: "obs_cea", ruleType: "\u7F16\u7801\u8F6C\u6362", rule: "LOINC 2039-6 \u53D6\u503C\uFF0C\u7EDF\u4E00 ng/mL" },
    SCC: { source: "obs_scc", ruleType: "\u7F16\u7801\u8F6C\u6362", rule: "LOINC 6088-6 \u53D6\u503C\uFF0C\u7EDF\u4E00 ng/mL" },
    CA19_9: { source: "obs_ca199", ruleType: "\u7F16\u7801\u8F6C\u6362", rule: "LOINC 24108-4 \u53D6\u503C\uFF0C\u7EDF\u4E00 U/mL" },
    CYFRA21_1: { source: "obs_cyfra211", ruleType: "\u7F16\u7801\u8F6C\u6362", rule: "LOINC 47357-5 \u53D6\u503C\uFF0C\u7EDF\u4E00 ng/mL" },
    CA72_4: { source: "obs_ca724", ruleType: "\u7F16\u7801\u8F6C\u6362", rule: "LOINC 24108-4 \u53D6\u503C\uFF0C\u7EDF\u4E00 U/mL" },
    AFP: { source: "obs_afp", ruleType: "\u7F16\u7801\u8F6C\u6362", rule: "LOINC 1834-0 \u53D6\u503C\uFF0C\u7EDF\u4E00 ng/mL" },
    CA125: { source: "obs_ca125", ruleType: "\u7F16\u7801\u8F6C\u6362", rule: "LOINC 14879-7 \u53D6\u503C\uFF0C\u7EDF\u4E00 U/mL" },
    NSE: { source: "obs_nse", ruleType: "\u7F16\u7801\u8F6C\u6362", rule: "LOINC 19607-1 \u53D6\u503C\uFF0C\u7EDF\u4E00 ng/mL" },
    // 实验室检测
    HBSAG: { source: "obs_hbsag", ruleType: "\u503C\u57DF\u6620\u5C04", rule: "negative\u2192\u9634\u6027\uFF0Cpositive\u2192\u9633\u6027" },
    ANTI_HCV: { source: "obs_anti_hcv", ruleType: "\u503C\u57DF\u6620\u5C04", rule: "negative\u2192\u9634\u6027\uFF0Cpositive\u2192\u9633\u6027" },
    HP_TEST: { source: "obs_hp", ruleType: "\u503C\u57DF\u6620\u5C04", rule: "negative\u2192\u9634\u6027\uFF0Cpositive\u2192\u9633\u6027" },
    FBG: { source: "obs_glu", ruleType: "\u5355\u4F4D\u8F6C\u6362", rule: "mg/dL \u2192 mmol/L\uFF08\xF718\uFF09" },
    TG: { source: "obs_tg", ruleType: "\u76F4\u63A5\u6620\u5C04", rule: "mmol/L \u539F\u503C\u4FDD\u7559" },
    CHOL: { source: "obs_chol", ruleType: "\u76F4\u63A5\u6620\u5C04", rule: "mmol/L \u539F\u503C\u4FDD\u7559" },
    HDL: { source: "obs_hdl", ruleType: "\u76F4\u63A5\u6620\u5C04", rule: "mmol/L \u539F\u503C\u4FDD\u7559" },
    LDL: { source: "obs_ldl", ruleType: "\u76F4\u63A5\u6620\u5C04", rule: "mmol/L \u539F\u503C\u4FDD\u7559" },
    PG1: { source: "obs_pg1", ruleType: "\u76F4\u63A5\u6620\u5C04", rule: "ng/mL \u539F\u503C\u4FDD\u7559" },
    PGR: { source: "obs_pgr", ruleType: "\u76F4\u63A5\u6620\u5C04", rule: "\u539F\u503C\u4FDD\u7559" },
    G17: { source: "obs_g17", ruleType: "\u76F4\u63A5\u6620\u5C04", rule: "pmol/L \u539F\u503C\u4FDD\u7559" },
    // 体格检查
    HEIGHT: { source: "body_height", ruleType: "\u76F4\u63A5\u6620\u5C04", rule: "cm \u539F\u503C\u4FDD\u7559" },
    WEIGHT: { source: "body_weight", ruleType: "\u76F4\u63A5\u6620\u5C04", rule: "kg \u539F\u503C\u4FDD\u7559" },
    BMI: { source: "bmi", ruleType: "\u76F4\u63A5\u6620\u5C04", rule: "kg/m\xB2 \u539F\u503C\u4FDD\u7559" },
    WAIST: { source: "waist_circum", ruleType: "\u76F4\u63A5\u6620\u5C04", rule: "cm \u539F\u503C\u4FDD\u7559" },
    // 内镜检查
    ENDO_ID: { source: "endoscopy_id", ruleType: "\u76F4\u63A5\u6620\u5C04", rule: "\u539F\u503C\u4FDD\u7559" },
    ENDO_DATE: { source: "endoscopy_date", ruleType: "\u76F4\u63A5\u6620\u5C04", rule: "ISO 8601 \u76F4\u63A5\u5199\u5165" },
    ANESTHESIA: { source: "anesthesia_flag", ruleType: "\u503C\u57DF\u6620\u5C04", rule: "false\u2192\u5426\uFF0Ctrue\u2192\u662F" },
    STAIN: { source: "staining_method", ruleType: "\u7F16\u7801\u8F6C\u6362", rule: "LUGOL\u2192\u5362\u6208\u6C0F\u7898\u67D3\u8272\uFF0CNBI\u2192\u7535\u5B50\u67D3\u8272\uFF0CNONE\u2192\u65E0\u67D3\u8272" },
    BIOPSY: { source: "biopsy_flag", ruleType: "\u503C\u57DF\u6620\u5C04", rule: "false\u2192\u5426\uFF0Ctrue\u2192\u662F" },
    ENDO_LOC: { source: "lesion_location", ruleType: "\u7F16\u7801\u8F6C\u6362", rule: "\u4F4D\u7F6E\u4EE3\u7801 \u2192 \u9888\u6BB5/\u4E0A\u6BB5/\u4E2D\u6BB5/\u4E0B\u6BB5/\u8D32\u95E8" },
    ENDO_N: { source: "lesion_count", ruleType: "\u76F4\u63A5\u6620\u5C04", rule: "\u539F\u503C\u4FDD\u7559" },
    DIAG_ENDO: { source: "endoscopy_diagnosis", ruleType: "\u76F4\u63A5\u6620\u5C04", rule: "\u539F\u503C\u4FDD\u7559" },
    ENDO_RPT: { source: "endoscopy_report", ruleType: "\u76F4\u63A5\u6620\u5C04", rule: "\u539F\u503C\u4FDD\u7559" },
    EUS_DEPTH: { source: "eus_depth", ruleType: "\u76F4\u63A5\u6620\u5C04", rule: "mm \u539F\u503C\u4FDD\u7559" },
    // 影像学检查
    CT_ID: { source: "ct_exam_id", ruleType: "\u76F4\u63A5\u6620\u5C04", rule: "\u539F\u503C\u4FDD\u7559" },
    CT_DATE: { source: "ct_exam_date", ruleType: "\u76F4\u63A5\u6620\u5C04", rule: "ISO 8601 \u76F4\u63A5\u5199\u5165" },
    CT_TYPE: { source: "ct_scan_type", ruleType: "\u503C\u57DF\u6620\u5C04", rule: "plain\u2192\u5E73\u626B\uFF0Ccontrast\u2192\u589E\u5F3A" },
    CT_LOC: { source: "ct_lesion_location", ruleType: "\u76F4\u63A5\u6620\u5C04", rule: "\u539F\u503C\u4FDD\u7559" },
    CT_DIAG: { source: "ct_diagnosis", ruleType: "\u76F4\u63A5\u6620\u5C04", rule: "\u539F\u503C\u4FDD\u7559" },
    CT_RPT: { source: "ct_report", ruleType: "\u76F4\u63A5\u6620\u5C04", rule: "\u539F\u503C\u4FDD\u7559" },
    CM: { source: "m_stage", ruleType: "\u7F16\u7801\u8F6C\u6362", rule: "M0/M1/Mx \u6821\u9A8C\u540E\u5199\u5165" },
    cM: { source: "clinical_m_stage", ruleType: "\u7F16\u7801\u8F6C\u6362", rule: "M0/M1/Mx \u6821\u9A8C\u540E\u5199\u5165" },
    MET_SITE: { source: "metastasis_site", ruleType: "\u7F16\u7801\u8F6C\u6362", rule: "\u8F6C\u79FB\u90E8\u4F4D\u4EE3\u7801 \u2192 \u6807\u51C6\u540D\u79F0" },
    // 病理检查
    PATH_ID: { source: "pathology_id", ruleType: "\u76F4\u63A5\u6620\u5C04", rule: "\u539F\u503C\u4FDD\u7559" },
    PATH_DATE: { source: "pathology_date", ruleType: "\u76F4\u63A5\u6620\u5C04", rule: "ISO 8601 \u76F4\u63A5\u5199\u5165" },
    PATH_TYPE: { source: "specimen_type", ruleType: "\u7F16\u7801\u8F6C\u6362", rule: "\u6807\u672C\u7C7B\u578B\u4EE3\u7801 \u2192 \u6807\u51C6\u6837\u672C\u7C7B\u578B" },
    PATH_LOC: { source: "biopsy_location", ruleType: "\u76F4\u63A5\u6620\u5C04", rule: "\u539F\u503C\u4FDD\u7559" },
    PATH_CODE: { source: "pathology_code", ruleType: "\u7F16\u7801\u8F6C\u6362", rule: "\u9662\u5185\u75C5\u7406\u7801 \u2192 \u6807\u51C6\u75C5\u7406\u8BCA\u65AD\u7F16\u7801" },
    PATH_RPT: { source: "pathology_report", ruleType: "\u76F4\u63A5\u6620\u5C04", rule: "\u539F\u503C\u4FDD\u7559" },
    HISTO_TYPE: { source: "histology_type", ruleType: "\u7F16\u7801\u8F6C\u6362", rule: "WHO \u5206\u7C7B\u7F16\u7801 \u2192 \u7EC4\u7EC7\u5B66\u7C7B\u578B" },
    GRADE: { source: "histologic_grade", ruleType: "\u7F16\u7801\u8F6C\u6362", rule: "G1/G2/G3/Gx \u6821\u9A8C\u540E\u5199\u5165" },
    EARLY: { source: "early_cancer", ruleType: "\u503C\u57DF\u6620\u5C04", rule: "false\u2192\u5426\uFF0Ctrue\u2192\u662F" },
    INV_DEPTH: { source: "invasion_depth", ruleType: "\u7F16\u7801\u8F6C\u6362", rule: "\u6D78\u6DA6\u6DF1\u5EA6\u4EE3\u7801 \u2192 \u6807\u51C6\u503C\u57DF" },
    LVI: { source: "lvi_flag", ruleType: "\u503C\u57DF\u6620\u5C04", rule: "false\u2192\u65E0\uFF0Ctrue\u2192\u6709" },
    MARGIN: { source: "margin_status", ruleType: "\u503C\u57DF\u6620\u5C04", rule: "negative\u2192\u9634\u6027\uFF0Cpositive\u2192\u9633\u6027" },
    pT: { source: "pathologic_t", ruleType: "\u7F16\u7801\u8F6C\u6362", rule: "AJCC \u7B2C8\u7248 pT \u6821\u9A8C" },
    pN: { source: "pathologic_n", ruleType: "\u7F16\u7801\u8F6C\u6362", rule: "AJCC \u7B2C8\u7248 pN \u6821\u9A8C" },
    STAGE: { source: "tnm_stage_group", ruleType: "\u7F16\u7801\u8F6C\u6362", rule: "AJCC \u7B2C8\u7248\u603B\u5206\u671F\u6821\u9A8C" },
    LN_EXAM: { source: "lymph_nodes_examined", ruleType: "\u76F4\u63A5\u6620\u5C04", rule: "\u539F\u503C\u4FDD\u7559" },
    LN_POS: { source: "lymph_nodes_positive", ruleType: "\u76F4\u63A5\u6620\u5C04", rule: "\u539F\u503C\u4FDD\u7559" },
    // 诊断与分期
    DIAG_DATE: { source: "diagnosis_date", ruleType: "\u76F4\u63A5\u6620\u5C04", rule: "ISO 8601 \u76F4\u63A5\u5199\u5165" },
    CHIEF_COM: { source: "chief_complaint", ruleType: "\u76F4\u63A5\u6620\u5C04", rule: "\u539F\u503C\u4FDD\u7559\uFF08\u591A\u503C\u7528\u9017\u53F7\u5206\u9694\uFF09" },
    SYM_DUR: { source: "symptom_duration", ruleType: "\u5355\u4F4D\u8F6C\u6362", rule: "\u5929 \u2192 \u6708\uFF08\xF730\uFF09" },
    DETECT_METHOD: { source: "detection_method", ruleType: "\u7F16\u7801\u8F6C\u6362", rule: "\u53D1\u73B0\u65B9\u5F0F\u4EE3\u7801 \u2192 \u6807\u51C6\u503C\u57DF" },
    cT: { source: "clinical_t", ruleType: "\u7F16\u7801\u8F6C\u6362", rule: "AJCC \u7B2C8\u7248 cT \u6821\u9A8C" },
    cN: { source: "clinical_n", ruleType: "\u7F16\u7801\u8F6C\u6362", rule: "AJCC \u7B2C8\u7248 cN \u6821\u9A8C" },
    cM_DIAG: { source: "clinical_m", ruleType: "\u7F16\u7801\u8F6C\u6362", rule: "M0/M1/Mx \u6821\u9A8C\u540E\u5199\u5165" },
    cSTAGE: { source: "clinical_stage_group", ruleType: "\u7F16\u7801\u8F6C\u6362", rule: "AJCC \u7B2C8\u7248\u4E34\u5E8A\u5206\u671F\u6821\u9A8C" },
    LESION_LEN: { source: "lesion_length", ruleType: "\u76F4\u63A5\u6620\u5C04", rule: "cm \u539F\u503C\u4FDD\u7559" },
    ECOG: { source: "ecog_score", ruleType: "\u76F4\u63A5\u6620\u5C04", rule: "0-4 \u539F\u503C\u4FDD\u7559" },
    // 随访
    FU_ID: { source: "followup_id", ruleType: "\u76F4\u63A5\u6620\u5C04", rule: "\u539F\u503C\u4FDD\u7559" },
    FU_DATE: { source: "followup_date", ruleType: "\u76F4\u63A5\u6620\u5C04", rule: "ISO 8601 \u76F4\u63A5\u5199\u5165" },
    FU_SEQ: { source: "followup_seq", ruleType: "\u76F4\u63A5\u6620\u5C04", rule: "\u539F\u503C\u4FDD\u7559" },
    FU_METHOD: { source: "followup_method", ruleType: "\u7F16\u7801\u8F6C\u6362", rule: "\u968F\u8BBF\u65B9\u5F0F\u4EE3\u7801 \u2192 \u6807\u51C6\u503C\u57DF" },
    FU_STATUS: { source: "vital_status", ruleType: "\u503C\u57DF\u6620\u5C04", rule: "alive\u2192\u5B58\u6D3B\uFF0Cdead\u2192\u6B7B\u4EA1" },
    DEATH_DATE: { source: "death_date", ruleType: "\u76F4\u63A5\u6620\u5C04", rule: "ISO 8601 \u76F4\u63A5\u5199\u5165" },
    RECUR_STATUS: { source: "recurrence_status", ruleType: "\u503C\u57DF\u6620\u5C04", rule: "none\u2192\u65E0\uFF0Crelapse\u2192\u6709" },
    RECUR_DATE: { source: "recurrence_date", ruleType: "\u76F4\u63A5\u6620\u5C04", rule: "ISO 8601 \u76F4\u63A5\u5199\u5165" },
    LAST_FU_DATE: { source: "last_followup_date", ruleType: "\u76F4\u63A5\u6620\u5C04", rule: "ISO 8601 \u76F4\u63A5\u5199\u5165" },
    // 生存与预后
    OS: { source: "os_days", ruleType: "\u76F4\u63A5\u6620\u5C04", rule: "\u5929\uFF0C\u539F\u503C\u4FDD\u7559" },
    OS_CENSOR: { source: "os_censor", ruleType: "\u503C\u57DF\u6620\u5C04", rule: "0\u2192\u5220\u5931\uFF0C1\u2192\u6B7B\u4EA1" },
    DFS: { source: "dfs_days", ruleType: "\u76F4\u63A5\u6620\u5C04", rule: "\u5929\uFF0C\u539F\u503C\u4FDD\u7559" },
    PFS: { source: "pfs_days", ruleType: "\u76F4\u63A5\u6620\u5C04", rule: "\u5929\uFF0C\u539F\u503C\u4FDD\u7559" }
  }
};
var disabledFields = {
  \u56FD\u5BB6\u764C\u75C7\u4E2D\u5FC3: ["UID"],
  \u9996\u90FD\u533B\u79D1\u5927\u5B66\u9644\u5C5E\u533B\u9662: ["NAME"],
  \u67D0\u5E02\u7ACB\u533B\u9662: ["CELLPHONE"]
};

// src/mock/sourceFieldRegistry.ts
var TOKEN_CN = {
  address: "\u5730\u5740",
  at: "",
  afp: "\u7532\u80CE\u86CB\u767D",
  age: "\u5E74\u9F84",
  anes: "\u9EBB\u9189",
  anesthesia: "\u9EBB\u9189",
  anti: "\u6297",
  biopsy: "\u6D3B\u68C0",
  birth: "\u51FA\u751F",
  bmi: "\u4F53\u8D28\u6307\u6570",
  body: "\u8EAB\u4F53",
  ca125: "\u7CD6\u7C7B\u6297\u539F125",
  ca199: "\u7CD6\u7C7B\u6297\u539F19-9",
  ca724: "\u7CD6\u7C7B\u6297\u539F72-4",
  cancer: "\u764C",
  card: "\u5FC3\u810F",
  cea: "\u764C\u80DA\u6297\u539F",
  censor: "\u5220\u5931",
  chief: "\u4E3B\u8BC9",
  chol: "\u603B\u80C6\u56FA\u9187",
  circum: "\u56F4\u5EA6",
  clin: "\u4E34\u5E8A",
  clinical: "\u4E34\u5E8A",
  cm: "\u4E34\u5E8AM\u5206\u671F",
  cn: "\u4E34\u5E8AN\u5206\u671F",
  code: "\u4EE3\u7801",
  complaint: "\u4E3B\u8BC9",
  count: "\u6570\u91CF",
  ct: "CT",
  cyfra211: "\u7EC6\u80DE\u89D2\u86CB\u767D19\u7247\u6BB5",
  date: "\u65E5\u671F",
  days: "\u5929",
  death: "\u6B7B\u4EA1",
  depth: "\u6DF1\u5EA6",
  desc: "\u63CF\u8FF0",
  detection: "\u68C0\u6D4B",
  dfs: "\u65E0\u8FDB\u5C55\u751F\u5B58",
  diag: "\u8BCA\u65AD",
  diagnosis: "\u8BCA\u65AD",
  duration: "\u65F6\u957F",
  early: "\u65E9\u671F",
  ecog: "\u4F53\u529B\u72B6\u51B5",
  edu: "\u6559\u80B2",
  education: "\u6559\u80B2",
  endo: "\u5185\u955C",
  endoscopy: "\u5185\u955C\u68C0\u67E5",
  ethnicity: "\u6C11\u65CF",
  eus: "\u8D85\u58F0\u5185\u955C",
  exam: "\u68C0\u67E5",
  examined: "\u68C0\u67E5",
  fbg: "\u7A7A\u8179\u8840\u7CD6",
  find: "\u53D1\u73B0",
  flag: "\u6807\u5FD7",
  followup: "\u968F\u8BBF",
  fu: "\u968F\u8BBF",
  g17: "\u80C3\u6CCC\u7D2017",
  gender: "\u6027\u522B",
  glu: "\u8840\u7CD6",
  grade: "\u5206\u7EA7",
  group: "\u5206\u7EC4",
  hbsag: "\u4E59\u578B\u809D\u708E\u8868\u9762\u6297\u539F",
  hcv: "\u4E19\u578B\u809D\u708E\u6297\u4F53",
  hdl: "\u9AD8\u5BC6\u5EA6\u8102\u86CB\u767D",
  height: "\u8EAB\u9AD8",
  hist: "\u7EC4\u7EC7\u5B66",
  histo: "\u7EC4\u7EC7\u5B66",
  histologic: "\u7EC4\u7EC7\u5B66",
  histology: "\u7EC4\u7EC7\u5B66",
  hp: "\u5E7D\u95E8\u87BA\u6746\u83CC",
  ien: "\u4E0A\u76AE\u5185\u7624\u53D8",
  id: "\u6807\u8BC6",
  insurance: "\u533B\u4FDD",
  invasion: "\u6D78\u6DA6",
  lab: "\u68C0\u9A8C",
  lamina: "\u5207\u7247",
  last: "\u6700\u8FD1",
  ldl: "\u4F4E\u5BC6\u5EA6\u8102\u86CB\u767D",
  length: "\u957F\u5EA6",
  lesion: "\u75C5\u7076",
  level: "\u7EA7\u522B",
  line: "\u9879",
  ln: "\u6DCB\u5DF4\u7ED3",
  loc: "\u4F4D\u7F6E",
  location: "\u4F4D\u7F6E",
  lugol: "\u5362\u6208\u6C0F\u7898",
  lvi: "\u8109\u7BA1\u4FB5\u72AF",
  lymph: "\u6DCB\u5DF4",
  m: "M\u5206\u671F",
  margin: "\u5207\u7F18",
  marital: "\u5A5A\u59FB",
  marriage: "\u5A5A\u59FB",
  met: "\u8F6C\u79FB",
  metastasis: "\u8F6C\u79FB",
  method: "\u65B9\u6CD5",
  n: "N\u5206\u671F",
  name: "\u59D3\u540D",
  nation: "\u6C11\u65CF",
  national: "\u8BC1\u4EF6",
  native: "\u7C4D\u8D2F",
  no: "\u7F16\u53F7",
  nodes: "\u6DCB\u5DF4\u7ED3",
  nse: "\u795E\u7ECF\u5143\u7279\u5F02\u6027\u70EF\u9187\u5316\u9176",
  obs: "\u89C2\u6D4B\u503C",
  os: "\u603B\u751F\u5B58",
  path: "\u75C5\u7406",
  pathologic: "\u75C5\u7406",
  pathology: "\u75C5\u7406",
  patient: "\u60A3\u8005",
  pfs: "\u65E0\u8FDB\u5C55\u751F\u5B58\u671F",
  pg1: "\u80C3\u86CB\u767D\u9176\u539FI",
  pgr: "\u80C3\u86CB\u767D\u9176\u539F\u6BD4\u503C",
  phone: "\u7535\u8BDD",
  place: "\u5730\u533A",
  pn: "\u75C5\u7406N\u5206\u671F",
  pos: "\u90E8\u4F4D",
  positive: "\u9633\u6027",
  pt: "\u75C5\u7406T\u5206\u671F",
  recur: "\u590D\u53D1",
  recurrence: "\u590D\u53D1",
  report: "\u62A5\u544A",
  scan: "\u626B\u63CF",
  scc: "\u9CDE\u72B6\u7EC6\u80DE\u764C\u6297\u539F",
  score: "\u8BC4\u5206",
  seq: "\u5E8F\u53F7",
  sex: "\u6027\u522B",
  site: "\u90E8\u4F4D",
  spec: "\u6807\u672C",
  specimen: "\u6807\u672C",
  stage: "\u5206\u671F",
  stain: "\u67D3\u8272",
  staining: "\u67D3\u8272",
  state: "\u72B6\u6001",
  status: "\u72B6\u6001",
  surv: "\u751F\u5B58",
  sym: "\u75C7\u72B6",
  symptom: "\u75C7\u72B6",
  t: "T\u5206\u671F",
  telecom: "\u901A\u8BAF",
  test: "\u68C0\u6D4B",
  tg: "\u7518\u6CB9\u4E09\u916F",
  times: "\u6B21",
  tnm: "\u56FD\u9645\u5206\u671F",
  total: "\u603B\u6570",
  trg: "\u80BF\u7624\u9000\u7F29\u5206\u7EA7",
  type: "\u7C7B\u578B",
  us: "\u8D85\u58F0",
  vital: "\u751F\u547D",
  waist: "\u8170\u56F4",
  way: "\u65B9\u5F0F",
  weight: "\u4F53\u91CD",
  y: "\u5E74"
};
function splitTokens(field) {
  return field.replace(/([a-z0-9])([A-Z])/g, "$1 $2").split(/[^A-Za-z0-9]+/).filter(Boolean);
}
function describe(field) {
  const parts = splitTokens(field).map((t) => TOKEN_CN[t.toLowerCase()] ?? t.toUpperCase());
  return parts.filter(Boolean).join("");
}
var BY_CODE = new Map(standardFields.map((f) => [f.code.toUpperCase(), f]));
function inferCategory(field) {
  const upper = field.toUpperCase();
  for (const token of splitTokens(field)) {
    const hit = BY_CODE.get(token.toUpperCase()) ?? BY_CODE.get(upper);
    if (hit) return hit.category;
  }
  return "";
}
var inventory = /* @__PURE__ */ new Map();
function build(org) {
  const registered = orgSourceMap[org] ?? {};
  const list = [];
  for (const [code, entry] of Object.entries(registered)) {
    const idx = list.findIndex((x) => x.field === entry.source);
    if (idx >= 0) {
      if (!list[idx].codes.includes(code)) list[idx].codes.push(code);
      continue;
    }
    const std = BY_CODE.get(code.toUpperCase());
    list.push({
      field: entry.source,
      desc: describe(entry.source),
      type: std?.dataType ?? "\u5B57\u7B26\u4E32\u578B",
      codes: [code],
      order: list.length
    });
  }
  return list.sort((a, b) => a.order - b.order);
}
function getSourceFields(org) {
  if (!inventory.has(org)) inventory.set(org, build(org));
  return inventory.get(org);
}
var sourceOrgKeys = Object.keys(orgSourceMap);

// src/mock/schemaMatching.ts
var WEIGHTS = {
  name: 0.3,
  abbr: 0.2,
  synonym: 0.16,
  semantic: 0.2,
  structure: 0.14
};
var GENERIC = /* @__PURE__ */ new Set([
  "code",
  "no",
  "num",
  "flag",
  "value",
  "desc",
  "description",
  "level",
  "type",
  "status",
  "state",
  "id",
  "name",
  "date",
  "time",
  "result",
  "unit",
  "days",
  "seq",
  "times",
  "count",
  "total",
  "pos",
  "t",
  "n",
  "m",
  "c"
]);
var SYNONYM_GROUPS = [
  ["sex", "sexcode", "gender", "sexatbirth", "biologicalsex", "\u6027\u522B", "\u751F\u7269\u5B66\u6027\u522B", "\u60A3\u8005\u6027\u522B", "\u751F\u7406\u6027\u522B"],
  ["age", "patientage", "\u5E74\u9F84", "\u60A3\u8005\u5E74\u9F84"],
  ["name", "patientname", "name", "\u59D3\u540D", "\u60A3\u8005\u59D3\u540D"],
  ["id", "patientid", "\u75C5\u6848\u53F7", "\u4F4F\u9662\u53F7", "\u60A3\u8005\u6807\u8BC6"],
  ["address", "addressline", "address", "\u5730\u5740", "\u901A\u8BAF\u5730\u5740"],
  ["phone", "telecom", "phonenumber", "mobile", "\u624B\u673A\u53F7", "\u8054\u7CFB\u7535\u8BDD"],
  ["nativeplace", "birthplace", "\u7C4D\u8D2F", "\u51FA\u751F\u5730", "\u6240\u5728\u5730\u533A"],
  ["native", "ethnicity", "nation", "nationcode", "\u6C11\u65CF", "\u6C11\u65CF\u4EE3\u7801"],
  ["marriage", "maritalstatus", "\u5A5A\u59FB\u72B6\u51B5", "\u5A5A\u59FB\u72B6\u6001"],
  ["education", "educationlevel", "edu", "\u5B66\u5386", "\u6587\u5316\u7A0B\u5EA6"],
  ["insurance", "insurancetype", "insurance", "\u533B\u7597\u4FDD\u969C", "\u533B\u4FDD\u7C7B\u578B"],
  ["cea", "carcinoembryonicantigen", "\u764C\u80DA\u6297\u539F"],
  ["scc", "squamouscellcarcino", "\u9CDE\u72B6\u7EC6\u80DE\u764C\u6297\u539F"],
  ["ca199", "carbohydrateantigen199", "\u7CD6\u7C7B\u6297\u539F199", "ca19", "ca19-9"],
  ["ca724", "carbohydrateantigen724", "\u7CD6\u7C7B\u6297\u539F724"],
  ["cyfra211", "cyfra21", "cyfra21-1", "\u7EC6\u80DE\u89D2\u86CB\u767D19\u7247\u6BB5"],
  ["afp", "alphafetoprotein", "\u7532\u80CE\u86CB\u767D"],
  ["ca125", "carbohydrateantigen125", "\u7CD6\u7C7B\u6297\u539F125", "ca12", "ca12-5"],
  ["nse", "neuronspecificenolase", "\u795E\u7ECF\u5143\u7279\u5F02\u6027\u70EF\u9187\u5316\u9176"],
  ["fbg", "glu", "fastingglucose", "\u7A7A\u8179\u8840\u7CD6", "\u8840\u7CD6"],
  ["tg", "triglyceride", "\u7518\u6CB9\u4E09\u916F"],
  ["chol", "cholesterol", "totalcholesterol", "\u603B\u80C6\u56FA\u9187"],
  ["hdl", "highdensitylipoprotein", "\u9AD8\u5BC6\u5EA6\u8102\u86CB\u767D\u80C6\u56FA\u9187"],
  ["ldl", "lowdensitylipoprotein", "\u4F4E\u5BC6\u5EA6\u8102\u86CB\u767D\u80C6\u56FA\u9187"],
  ["pg1", "pepsinogen1", "\u80C3\u86CB\u767D\u9176\u539FI"],
  ["pgr", "pepsinogenratio", "\u80C3\u86CB\u767D\u9176\u539F\u6BD4\u503C"],
  ["g17", "gastrin17", "\u80C3\u6CCC\u7D2017"],
  ["hbsag", "hepatitisbsurfaceantigen", "\u4E59\u578B\u809D\u708E\u8868\u9762\u6297\u539F"],
  ["hcv", "hepatitisccantibody", "\u4E19\u578B\u809D\u708E\u6297\u4F53"],
  ["hp", "hpv", "\u5E7D\u95E8\u87BA\u6746\u83CC", "\u5E7D\u95E8\u87BA\u65CB\u6746\u83CC"],
  ["endo", "endoscopy", "endoscopyid", "\u5185\u955C\u68C0\u67E5", "\u5185\u955C"],
  ["eus", "endoscopicultrasound", "\u8D85\u58F0\u5185\u955C"],
  ["lesion", "lesionlocation", "lesionlength", "lesioncount", "\u75C5\u7076", "\u75C5\u53D8"],
  ["biopsy", "biopsyflag", "biopsylocation", "\u6D3B\u68C0", "\u6D3B\u7EC4\u7EC7\u68C0\u67E5"],
  ["pathology", "pathologic", "path", "\u75C5\u7406"],
  ["histology", "histo", "histologicgrade", "\u7EC4\u7EC7\u5B66", "\u7EC4\u7EC7\u5B66\u7C7B\u578B"],
  ["grade", "histologicgrade", "grading", "\u5206\u7EA7"],
  ["stage", "staging", "\u5206\u671F"],
  ["invasion", "invasiondepth", "invasivedepth", "\u6D78\u6DA6\u6DF1\u5EA6"],
  ["depth", "depthofinvasion", "\u6DF1\u5EA6"],
  ["lymphnode", "lymphnodes", "lymphnodemetastasis", "\u6DCB\u5DF4\u7ED3"],
  ["margin", "marginstatus", "\u5207\u7F18"],
  ["trg", "tumorregressiongrade", "\u80BF\u7624\u9000\u7F29\u5206\u7EA7"],
  ["ecog", "ecogscore", "performancestatus", "\u4F53\u529B\u72B6\u51B5", "\u4F53\u529B\u72B6\u51B5\u8BC4\u5206"],
  ["recurrence", "recur", "recurrence", "\u590D\u53D1"],
  ["followup", "followupdate", "followupstatus", "\u968F\u8BBF"],
  ["survival", "os", "overallsurvival", "\u603B\u751F\u5B58"],
  ["dfs", "diseasefree", "diseasefreesurvival", "\u65E0\u8FDB\u5C55\u751F\u5B58"],
  ["pfs", "progressionsurvival", "progressfreesurvival", "\u65E0\u8FDB\u5C55\u751F\u5B58\u671F"],
  ["death", "deathdate", "death", "\u6B7B\u4EA1"],
  ["censor", "censoring", "\u5220\u5931"],
  ["early", "earlycancer", "earlyflag", "\u65E9\u671F\u764C", "\u65E9\u671F"],
  ["ien", "intraepithelialneoplasia", "\u4E0A\u76AE\u5185\u7624\u53D8"],
  ["lvi", "lymphovascularinvasion", "\u8109\u7BA1\u4FB5\u72AF"],
  ["height", "bodyheight", "\u8EAB\u9AD8"],
  ["weight", "bodyweight", "\u4F53\u91CD"],
  ["bmi", "bodymassindex", "\u4F53\u8D28\u6307\u6570"],
  ["waist", "waistcircum", "waistcircumference", "\u8170\u56F4"],
  ["diagnosis", "diag", "diagnosisdate", "\u8BCA\u65AD"],
  ["symptom", "symptomduration", "\u75C7\u72B6"],
  ["chiefcomplaint", "chiefcomplaint", "\u4E3B\u8BC9"],
  ["detectionmethod", "findway", "\u53D1\u73B0\u65B9\u5F0F", "\u68C0\u51FA\u65B9\u5F0F"],
  ["stain", "stainingmethod", "\u67D3\u8272\u65B9\u6CD5"],
  ["lugol", "lugolgrade", "\u5362\u6208\u6C0F\u7898\u67D3\u8272"],
  ["anesthesia", "anes", "anesflag", "\u9EBB\u9189"],
  ["ct", "ctscan", "ctscan", "\u8BA1\u7B97\u673A\u65AD\u5C42\u626B\u63CF"],
  ["mri", "magneticresonance", "\u78C1\u5171\u632F"],
  ["us", "ultrasound", "\u8D85\u58F0\u68C0\u67E5"],
  ["lab", "labno", "labdate", "\u5B9E\u9A8C\u5BA4", "\u68C0\u9A8C"],
  ["score", "\u8BC4\u5206"],
  ["occ", "occurrence", "\u51FA\u73B0\u6B21\u6570"]
];
var ROOT = {};
for (const group of SYNONYM_GROUPS) {
  const root = group[0];
  for (const term of group) ROOT[term.toLowerCase()] = root;
}
var METHOD_OF = {
  name: "\u5B57\u6BB5\u540D\u89C4\u5219",
  abbr: "\u82F1\u6587\u7F29\u5199",
  synonym: "\u540C\u4E49\u8BCD\u8BCD\u5178",
  semantic: "\u8BED\u4E49\u76F8\u4F3C\u5EA6",
  structure: "\u7ED3\u6784\u7EA6\u675F"
};
function tokenize(text) {
  const normalized = text.replace(/([a-z0-9])([A-Z])/g, "$1 $2").toLowerCase();
  return normalized.match(/[a-z0-9]+/g) ?? [];
}
function canonical(tokens) {
  return [...new Set(tokens.map((t) => ROOT[t] ?? t))];
}
function bigrams(text) {
  const chars = text.toLowerCase().replace(/[^a-z0-9一-龥]/g, "").split("");
  const out = /* @__PURE__ */ new Set();
  if (chars.length === 1) out.add(chars[0] + "#");
  for (let i = 0; i < chars.length - 1; i += 1) out.add(chars[i] + chars[i + 1]);
  return out;
}
function dice(a, b) {
  if (!a.size || !b.size) return 0;
  let hit = 0;
  for (const x of a) if (b.has(x)) hit += 1;
  return 2 * hit / (a.size + b.size);
}
var TYPE_GROUP = {
  \u6570\u503C\u578B: "\u6570\u503C",
  \u6574\u6570\u578B: "\u6570\u503C",
  \u6D6E\u70B9\u578B: "\u6570\u503C",
  \u5C0F\u6570\u578B: "\u6570\u503C",
  \u5B57\u7B26\u4E32\u578B: "\u5B57\u7B26",
  \u6587\u672C\u578B: "\u5B57\u7B26",
  \u5B57\u7B26\u578B: "\u5B57\u7B26",
  \u65F6\u95F4: "\u65F6\u95F4",
  \u65E5\u671F\u578B: "\u65F6\u95F4",
  \u65E5\u671F\u65F6\u95F4: "\u65F6\u95F4",
  \u65F6\u95F4\u6233: "\u65F6\u95F4",
  \u5E03\u5C14\u578B: "\u5E03\u5C14",
  \u679A\u4E3E\u578B: "\u679A\u4E3E",
  \u7C7B\u522B\u578B: "\u679A\u4E3E"
};
function typeGroupOf(text) {
  if (!text) return "";
  const key = text.trim();
  if (TYPE_GROUP[key]) return TYPE_GROUP[key];
  for (const [name, group] of Object.entries(TYPE_GROUP)) if (key.includes(name)) return group;
  return "";
}
function typeScore(srcType, stdType) {
  const a = typeGroupOf(srcType);
  const b = typeGroupOf(stdType);
  if (!a || !b) return 0.7;
  if (a === b) return 1;
  if (a === "\u6570\u503C" && b === "\u5B57\u7B26" || a === "\u5B57\u7B26" && b === "\u6570\u503C") return 0.5;
  return 0.2;
}
function scoreOf(input, std) {
  const srcTokens = tokenize(input.field);
  const srcCore = srcTokens.filter((t) => !GENERIC.has(t));
  const srcKey = canonical(srcCore.length ? srcCore : srcTokens);
  const srcAll = canonical(srcTokens);
  const srcText = [input.field, input.desc, input.type, input.sample].filter(Boolean).join(" ");
  const stdTokens = [.../* @__PURE__ */ new Set([...tokenize(std.code), ...tokenize(std.en)])];
  const stdKey = canonical([...stdTokens, ...tokenize(std.cn)]);
  const coreHit = srcCore.find((t) => stdTokens.includes(t)) ?? srcTokens.find((t) => stdTokens.includes(t));
  const coreHitCount = new Set(srcCore.filter((t) => stdTokens.includes(t))).size;
  const name = coreHit ? 1 : coreHitCount ? Math.min(1, coreHitCount / Math.max(1, srcCore.length) * 0.8) : 0;
  const codeTokens = tokenize(std.code);
  const abbr = srcKey.some((t) => codeTokens.includes(t)) ? 1 : srcKey.some((t) => codeTokens.some((c) => c.length >= 3 && (t.startsWith(c) || c.startsWith(t)))) || srcAll.some((t) => codeTokens.some((c) => c.length >= 3 && (t.startsWith(c) || c.startsWith(t)))) ? 0.7 : srcAll.some((t) => codeTokens.some((c) => c.length >= 4 && (t.includes(c) || c.includes(t)))) ? 0.45 : 0;
  const synonym = srcKey.some((t) => stdKey.includes(t)) ? 1 : srcKey.some((t) => stdTokens.some((s) => ROOT[t] && ROOT[s] === ROOT[t])) ? 0.8 : 0;
  const semantic = dice(bigrams(srcText), bigrams([std.cn, std.en, std.domain, std.category].join(" ")));
  const typeM = typeScore(input.type ?? "", std.dataType);
  const domainM = std.domain ? canonical(tokenize(std.domain)).some((t) => srcKey.includes(t) || srcAll.includes(t)) ? 1 : 0.55 : 0.6;
  const catM = input.category ? input.category === std.category ? 1 : 0.45 : 0.35;
  const structure = typeM * 0.4 + domainM * 0.3 + catM * 0.3;
  const breakdown = { name, abbr, synonym, semantic, structure };
  const score = Math.min(
    1,
    Object.entries(WEIGHTS).reduce((sum, [key, w]) => sum + w * breakdown[key], 0)
  );
  return { breakdown, score };
}
function dominantMethod(breakdown) {
  let best = "name";
  let bestValue = -1;
  for (const key of Object.keys(WEIGHTS)) {
    const value = breakdown[key] * WEIGHTS[key];
    if (value > bestValue) {
      bestValue = value;
      best = key;
    }
  }
  return METHOD_OF[best];
}
function matchCandidates(input, pool, topN = 3, minScore = 35) {
  const scored = pool.map((std) => {
    const { breakdown, score } = scoreOf(input, std);
    return {
      standard: std,
      score: Math.round(score * 1e3) / 10,
      method: dominantMethod(breakdown),
      breakdown
    };
  });
  return scored.filter((c) => c.score >= minScore).sort((a, b) => b.score - a.score || a.standard.code.localeCompare(b.standard.code)).slice(0, topN);
}

// src/mock/fieldMappingBuilder.ts
function emptyRule(type = "\u76F4\u63A5\u6620\u5C04") {
  return {
    type,
    valueMap: [],
    formatFrom: "",
    formatTo: "",
    unitFrom: "",
    unitTo: "",
    factor: "",
    codeMap: [],
    note: ""
  };
}
var confirmedStore = /* @__PURE__ */ new Map();
var keyOf = (org, source) => `${org}|${source}`;
function getRecord(org, source) {
  return confirmedStore.get(keyOf(org, source));
}
function defaultRuleFor(candidate) {
  const domain = candidate.standard.domain;
  const rule = emptyRule(candidate.standard.dataType === "\u65F6\u95F4" ? "\u683C\u5F0F\u8F6C\u6362" : "\u76F4\u63A5\u6620\u5C04");
  if (candidate.standard.dataType === "\u65F6\u95F4") {
    rule.formatFrom = "YYYYMMDD";
    rule.formatTo = "YYYY-MM-DD";
  }
  if (domain && domain.includes("\uFF0C") && candidate.standard.dataType === "\u5B57\u7B26\u4E32\u578B") {
    rule.type = "\u503C\u57DF\u6620\u5C04";
    rule.valueMap = domain.split("\uFF0C").map((v) => ({ src: v, dst: v }));
    rule.note = `\u6807\u51C6\u503C\u57DF\uFF1A${domain}`;
  }
  return rule;
}
function buildMappingRows(org, set2) {
  return getSourceFields(org).map((def, index) => {
    const input = {
      field: def.field,
      desc: def.desc,
      type: def.type,
      category: inferCategory(def.field)
    };
    const candidates = matchCandidates(input, set2.fields, 3, 35);
    const record = getRecord(org, def.field);
    const disabledSet = new Set(disabledFields[org] ?? []);
    const top = candidates[0];
    if (record && record.code) {
      const std = set2.fields.find((f) => f.code === record.code);
      const confirmedCandidate = std ? [
        {
          standard: std,
          score: top?.standard.code === std.code ? top?.score ?? 0 : 0,
          method: top?.standard.code === std.code ? top?.method ?? "\u5B57\u6BB5\u540D\u89C4\u5219" : "\u7ED3\u6784\u7EA6\u675F",
          breakdown: top?.breakdown ?? { name: 0, abbr: 0, synonym: 0, semantic: 0, structure: 0 }
        }
      ] : [];
      const stale = record.setId !== set2.id;
      return {
        id: `${org}|${def.field}|${set2.id}`,
        org,
        setId: set2.id,
        sourceField: def.field,
        sourceDesc: def.desc,
        sourceType: def.type,
        category: std?.category ?? (inferCategory(def.field) || top?.standard.category || "\u2014"),
        candidates: confirmedCandidate,
        selectedCode: std?.code ?? null,
        confirmed: true,
        confirmedInSet: record.setId,
        status: stale ? "\u5F85\u786E\u8BA4" : record.disabled || disabledSet.has(record.code) ? "\u5DF2\u505C\u7528" : "\u5DF2\u6620\u5C04",
        rule: record.rule,
        version: record.version,
        order: index
      };
    }
    const status = top && top.score >= 60 ? "\u5F85\u786E\u8BA4" : "\u5F85\u5339\u914D";
    return {
      id: `${org}|${def.field}|${set2.id}`,
      org,
      setId: set2.id,
      sourceField: def.field,
      sourceDesc: def.desc,
      sourceType: def.type,
      category: inferCategory(def.field) || top?.standard.category || "\u2014",
      candidates,
      selectedCode: null,
      confirmed: false,
      confirmedInSet: null,
      status,
      rule: top ? defaultRuleFor(top) : emptyRule(),
      version: 0,
      order: index
    };
  });
}

// src/mock/standardSets.ts
var coreSet = standardFields.filter((f) => f.constraint === "M");
var mdtCategories = [
  "\u57FA\u672C\u4FE1\u606F",
  "\u8840\u68C0\u80BF\u7624\u6807\u5FD7\u7269",
  "\u5185\u955C\u68C0\u67E5",
  "\u5F71\u50CF\u5B66\u68C0\u67E5",
  "\u75C5\u7406\u68C0\u67E5",
  "\u8BCA\u65AD\u4E0E\u5206\u671F",
  "\u968F\u8BBF",
  "\u751F\u5B58\u4E0E\u9884\u540E"
];
var mdtSet = standardFields.filter((f) => mdtCategories.includes(f.category));
var standardSets = [
  {
    id: "esophagus-v1",
    name: "\u98DF\u7BA1\u764C\u4E13\u75C5\u6807\u51C6 V1",
    scope: `\u5B8C\u6574\u96C6 \xB7 ${standardFields.length} \u5B57\u6BB5 \xB7 ${standardCategories.length} \u5206\u7C7B`,
    fields: standardFields
  },
  {
    id: "esophagus-v2",
    name: "\u98DF\u7BA1\u764C\u4E13\u75C5\u6807\u51C6 V2",
    scope: `\u6838\u5FC3\u5FC5\u586B\u96C6 \xB7 ${coreSet.length} \u5B57\u6BB5 \xB7 \u7EA6\u675F M`,
    fields: coreSet
  },
  {
    id: "esophagus-v3",
    name: "\u98DF\u7BA1\u764C\u4E13\u75C5\u6807\u51C6 V3",
    scope: `MDT \u7CBE\u7B80\u96C6 \xB7 ${mdtSet.length} \u5B57\u6BB5 \xB7 8 \u7C7B\u4E34\u5E8A\u5206\u7C7B`,
    fields: mdtSet
  }
];
var defaultSetId = standardSets[0].id;
function getStandardSet(id) {
  return standardSets.find((s) => s.id === id) ?? standardSets[0];
}

// scripts/mapcheck.ts
var cases = [
  ["SEX_CODE", "\u6027\u522B"],
  ["sex_at_birth", "\u6027\u522B"],
  ["gender", "\u6027\u522B"],
  ["CEA", "\u764C\u80DA\u6297\u539F"],
  ["PATIENT_ID", "\u75C5\u6848\u53F7"],
  ["PATIENT_NAME", "\u59D3\u540D"],
  ["EXAM_DATE", "\u5185\u955C\u68C0\u67E5\u65F6\u95F4"],
  ["specType", "\u6807\u672C\u7C7B\u578B"]
];
var failed = 0;
var set = getStandardSet("esophagus-v1");
var rows = buildMappingRows("\u56FD\u5BB6\u764C\u75C7\u4E2D\u5FC3", set);
for (const [field, expect] of cases) {
  const row = rows.find((r) => r.sourceField === field);
  if (!row) {
    console.log(`\u2717 ${field} \u672A\u51FA\u73B0\u5728\u6E90\u5B57\u6BB5\u6E05\u5355\u4E2D`);
    failed += 1;
    continue;
  }
  const top = row.candidates[0];
  const ok = top?.standard.cn.includes(expect.replace("\u65F6\u95F4", "")) || top?.standard.code.includes(expect.replace("\u65F6\u95F4", "").toUpperCase().slice(0, 3));
  console.log(
    `${ok ? "\u2713" : "\u2717"} ${field}(${row.sourceDesc}) \u2192 ${top ? `${top.standard.cn}\uFF08${top.standard.code}\uFF09${top.score}% [${top.method}]` : "\u65E0\u5019\u9009"} | \u671F\u671B\u2248${expect} | \u72B6\u6001 ${row.status}`
  );
  if (!ok) failed += 1;
}
var dist = rows.reduce((acc, r) => {
  acc[r.status] = (acc[r.status] ?? 0) + 1;
  return acc;
}, {});
console.log("\n\u56FD\u5BB6\u764C\u75C7\u4E2D\u5FC3 \u6E90\u5B57\u6BB5\u5206\u5E03\uFF1A", dist, "\u5408\u8BA1", rows.length);
console.log("\u6E90\u5B57\u6BB5\u6E05\u5355\u6570\uFF1A", getSourceFields("\u56FD\u5BB6\u764C\u75C7\u4E2D\u5FC3").length);
for (const s of standardSets) {
  const r = buildMappingRows("\u67D0\u5E02\u7ACB\u533B\u9662", s);
  console.log(`${s.name}\uFF1A\u6E90\u5B57\u6BB5 ${r.length} \u6761\uFF0C\u5019\u9009\u4E3A\u7A7A ${r.filter((x) => !x.candidates.length).length} \u6761`);
}
if (failed) {
  console.error(`
\u5931\u8D25 ${failed} \u9879`);
  process.exit(1);
}
console.log("\n\u81EA\u68C0\u901A\u8FC7");
