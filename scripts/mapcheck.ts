/* 混合 Schema Matching 自检：校验候选排序与状态划分 */
import { buildMappingRows } from '../src/mock/fieldMappingBuilder'
import { getStandardSet, standardSets } from '../src/mock/standardSets'
import { getSourceFields } from '../src/mock/sourceFieldRegistry'

type Case = [org: string, field: string, expect: string]

const cases: Case[] = [
  ['国家癌症中心', 'SEX_CODE', '性别'],
  ['国家癌症中心', 'CEA', '癌胚抗原'],
  ['国家癌症中心', 'PATIENT_ID', '病案号'],
  ['国家癌症中心', 'PATIENT_NAME', '姓名'],
  ['国家癌症中心', 'EXAM_DATE', '内镜'],
  ['国家癌症中心', 'AGE', '年龄'],
  ['首都医科大学附属医院', 'gender', '性别'],
  ['首都医科大学附属医院', 'patientNo', '病案号'],
  ['首都医科大学附属医院', 'cea', '癌胚抗原'],
  ['首都医科大学附属医院', 'lesionLoc', '位置'],
  ['某市立医院', 'sex_at_birth', '性别'],
  ['某市立医院', 'obs_cea', '癌胚抗原'],
  ['某市立医院', 'diagnosis_date', '首诊日期'],
  ['某市立医院', 'vital_status', '随访'],
]

let failed = 0
const set = getStandardSet('esophagus-v1')
const allRows = ['国家癌症中心', '首都医科大学附属医院', '某市立医院'].flatMap((org) =>
  buildMappingRows(org, set),
)

for (const [org, field, expect] of cases) {
  const row = allRows.find((r) => r.org === org && r.sourceField === field)
  if (!row) {
    console.log(`✗ ${org}/${field} 未出现在源字段清单中`)
    failed += 1
    continue
  }
  const top = row.candidates[0]
  const ok = top?.standard.cn.includes(expect) || top?.standard.code.toUpperCase().includes(expect.toUpperCase())
  console.log(
    `${ok ? '✓' : '✗'} ${org}/${field}(${row.sourceDesc}) → ${top ? `${top.standard.cn}（${top.standard.code}）${top.score}% [${top.method}]` : '无候选'} | 期望≈${expect} | 状态 ${row.status}`,
  )
  if (!ok) failed += 1
}

for (const org of ['国家癌症中心', '首都医科大学附属医院', '某市立医院']) {
  const rows = buildMappingRows(org, set)
  const dist = rows.reduce<Record<string, number>>((acc, r) => {
    acc[r.status] = (acc[r.status] ?? 0) + 1
    return acc
  }, {})
  console.log(`\n${org}：源字段 ${rows.length} 条，状态分布`, dist)
}

for (const s of standardSets) {
  const r = buildMappingRows('某市立医院', s)
  console.log(`${s.name}：源字段 ${r.length} 条，无候选 ${r.filter((x) => !x.candidates.length).length} 条`)
}

if (failed) {
  console.error(`\n失败 ${failed} 项`)
  process.exit(1)
}
console.log('\n自检通过 · 源字段清单合计', allRows.length, getSourceFields('国家癌症中心').length >= 0 ? '✓' : '')
