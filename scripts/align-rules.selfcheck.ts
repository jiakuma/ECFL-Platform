// 对齐规则引擎自检测试（兜底方案：Node 内置 TS 运行，无需 vitest）
// 运行：node --experimental-strip-types scripts/align-rules.selfcheck.ts
import assert from 'node:assert/strict'
import {
  mapSex,
  mapBirth,
  mapSmoking,
  mapMPI,
  detectConflict,
  alignRules,
  mapPassthrough,
  mapAge,
  mapDiseaseName,
  mapPathType,
  mapTnm,
  mapHistoryYesNo,
  mapAllergy,
} from '../src/mock/alignRules.ts'

let pass = 0
function check(name: string, fn: () => void) {
  fn()
  pass++
  console.log(`  ✓ ${name}`)
}

console.log('出生日期：精度保留，禁止补日')
check('年月精度原样保留', () => {
  const r = mapBirth('1968-03')
  assert.equal(r.status, '对齐成功')
  assert.equal(r.standardValue, '1968-03')
})
check('年月日精度原样保留', () => {
  assert.equal(mapBirth('1965-07-12').standardValue, '1965-07-12')
})
check('月份越界判定为对齐失败', () => {
  assert.equal(mapBirth('1968-13').status, '对齐失败')
})
check('非法格式判定为对齐失败', () => {
  assert.equal(mapBirth('上世纪六十年代').status, '对齐失败')
})

console.log('吸烟包年：缺量/年限禁止推算')
check('同时具备年限与日吸烟量可计算', () => {
  const r = mapSmoking('吸烟30年，1包/天')
  assert.equal(r.status, '对齐成功')
  assert.equal(r.standardValue, '30 包年')
  assert.match(r.formula || '', /30/)
})
check('仅年限、缺日吸烟量 → 待人工确认，不杜撰数值', () => {
  const r = mapSmoking('吸烟40年')
  assert.equal(r.status, '待人工确认')
  assert.equal(r.standardValue, '')
})
check('仅日吸烟量、缺年限 → 待人工确认', () => {
  const r = mapSmoking('2包/天')
  assert.equal(r.status, '待人工确认')
  assert.equal(r.standardValue, '')
})

console.log('性别：跨中心编码歧义不默认通过')
check('标准值可映射', () => {
  assert.equal(mapSex('男').standardValue, '男性')
  assert.equal(mapSex('M').standardValue, '男性')
  assert.equal(mapSex('1').code, '1')
})
check('未知编码含义 → 待人工确认，不直接转换', () => {
  const r = mapSex('X')
  assert.equal(r.status, '待人工确认')
  assert.equal(r.standardValue, '')
})

console.log('患者身份：病案号不直接等同患者')
check('唯一候选 → 对齐成功', () => {
  const r = mapMPI({ localId: 'NCC-2026-0831', org: '国家癌症中心', candidates: ['P-0001'] })
  assert.equal(r.status, '对齐成功')
  assert.equal(r.standardValue, 'P-0001')
})
check('多候选 → 待人工确认，禁止自动合并', () => {
  const r = mapMPI({ localId: 'ST-2026-0427', org: '省肿瘤医院', candidates: ['P-0001', 'P-0002'] })
  assert.equal(r.status, '待人工确认')
  assert.equal(r.standardValue, '')
})
check('无候选 → 待人工确认', () => {
  assert.equal(mapMPI({ localId: '??', org: '未知', candidates: [] }).status, '待人工确认')
})

console.log('跨中心冲突检测')
check('多中心值不一致 → 冲突', () => {
  const r = detectConflict({
    field: '出生日期',
    values: [
      { org: '国家癌症中心', value: '1968-03' },
      { org: '省肿瘤医院', value: '1965-07-12' },
    ],
  })
  assert.equal(r.conflict, true)
})
check('多中心值一致 → 无冲突', () => {
  const r = detectConflict({
    field: '性别',
    values: [
      { org: '国家癌症中心', value: '男性' },
      { org: '省肿瘤医院', value: '男性' },
    ],
  })
  assert.equal(r.conflict, false)
})

console.log('规则可查：每条规则带标准依据')
check('性别规则引用 GB/T 2261.1', () => {
  assert.match(alignRules.SEX_GBT2261.basis, /GB\/T 2261\.1/)
})
check('出生日期规则明确禁止补日', () => {
  assert.match(alignRules.BIRTH_PRECISION.scope, /不得补/)
})
check('吸烟规则要求量与年限同时存在', () => {
  assert.match(alignRules.SMOKING_PACKYEAR.scope, /禁止推算/)
})

console.log('新增字段规则：出生年份 / 年龄 / 病理编号 / 疾病 / 病理类型 / TNM / 既往史 / 过敏')

check('出生年份仅保留年精度，禁止补月/补日', () => {
  const r = mapBirth('1968')
  assert.equal(r.status, '对齐成功')
  assert.equal(r.standardValue, '1968')
  assert.match(r.issue || '', /未补月|未补日|保留年份/)
})
check('病理编号源标识原值保留不重编码', () => {
  const r = mapPassthrough('P-2024-118')
  assert.equal(r.status, '对齐成功')
  assert.equal(r.standardValue, 'P-2024-118')
})
check('年龄超范围判定为对齐失败', () => {
  assert.equal(mapAge('200').status, '对齐失败')
})
check('年龄正常折算为确诊时快照', () => {
  const r = mapAge('58')
  assert.equal(r.status, '对齐成功')
  assert.match(r.standardValue, /确诊时/)
})
check('疾病名称别称归一为标准术语', () => {
  const r = mapDiseaseName('食管鳞癌')
  assert.equal(r.status, '对齐成功')
  assert.equal(r.standardValue, '食管鳞状细胞癌')
  assert.equal(r.code, 'C15(ICD-10)')
})
check('疾病名称未命中字典 → 待人工确认，不臆造编码', () => {
  const r = mapDiseaseName('神秘综合征')
  assert.equal(r.status, '待人工确认')
  assert.equal(r.standardValue, '')
})
check('病理类型简称归一并赋 ICD-O-3', () => {
  const r = mapPathType('鳞癌')
  assert.equal(r.status, '对齐成功')
  assert.equal(r.standardValue, '鳞状细胞癌')
  assert.equal(r.code, '8070/3')
})
check('TNM 缺版本自动补标 AJCC 第8版', () => {
  const r = mapTnm('cT2N0M0')
  assert.equal(r.status, '对齐成功')
  assert.match(r.standardValue, /AJCC 第8版/)
})
check('TNM 已注版本原样保留', () => {
  assert.equal(mapTnm('cT2N0M0（AJCC 第8版）').standardValue, 'cT2N0M0（AJCC 第8版）')
})
check('既往史有/无标准化为阳性/阴性', () => {
  assert.equal(mapHistoryYesNo('有').standardValue, '阳性')
  assert.equal(mapHistoryYesNo('无').standardValue, '阴性')
})
check('既往史未命中取值 → 待人工确认', () => {
  assert.equal(mapHistoryYesNo('大概有').status, '待人工确认')
})
check('过敏史无 → 阴性', () => {
  assert.equal(mapAllergy('无').standardValue, '阴性（无已知过敏）')
})
check('过敏史有过敏原 → 结构化记录', () => {
  const r = mapAllergy('青霉素过敏')
  assert.equal(r.status, '对齐成功')
  assert.match(r.standardValue, /过敏原：青霉素/)
})

console.log(`\n全部通过：${pass} 项断言 ✅`)
