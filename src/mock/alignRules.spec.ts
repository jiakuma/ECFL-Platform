import { describe, it, expect } from 'vitest'
import {
  mapSex,
  mapBirth,
  mapSmoking,
  mapMPI,
  detectConflict,
  alignRules,
} from '@/mock/alignRules'

describe('出生日期：精度保留，禁止补日', () => {
  it('年月精度原样保留，不补日为 01', () => {
    const r = mapBirth('1968-03')
    expect(r.status).toBe('对齐成功')
    expect(r.standardValue).toBe('1968-03')
  })

  it('年月日精度原样保留', () => {
    const r = mapBirth('1965-07-12')
    expect(r.status).toBe('对齐成功')
    expect(r.standardValue).toBe('1965-07-12')
  })

  it('月份越界判定为对齐失败', () => {
    const r = mapBirth('1968-13')
    expect(r.status).toBe('对齐失败')
  })

  it('非法格式判定为对齐失败', () => {
    const r = mapBirth('上世纪六十年代')
    expect(r.status).toBe('对齐失败')
  })
})

describe('吸烟包年：缺量/年限禁止推算', () => {
  it('同时具备年限与日吸烟量可计算', () => {
    const r = mapSmoking('吸烟30年，1包/天')
    expect(r.status).toBe('对齐成功')
    expect(r.standardValue).toBe('30 包年')
    expect(r.formula).toContain('30')
  })

  it('仅年限、缺日吸烟量 → 待人工确认，不得推算', () => {
    const r = mapSmoking('吸烟40年')
    expect(r.status).toBe('待人工确认')
    expect(r.standardValue).toBe('') // 关键：不杜撰数值
  })

  it('仅日吸烟量、缺年限 → 待人工确认', () => {
    const r = mapSmoking('2包/天')
    expect(r.status).toBe('待人工确认')
    expect(r.standardValue).toBe('')
  })
})

describe('性别：跨中心编码歧义不默认通过', () => {
  it('标准值可映射', () => {
    expect(mapSex('男').standardValue).toBe('男性')
    expect(mapSex('M').standardValue).toBe('男性')
    expect(mapSex('1').code).toBe('1')
  })

  it('未知编码含义 → 待人工确认，不直接转换', () => {
    const r = mapSex('X')
    expect(r.status).toBe('待人工确认')
    expect(r.standardValue).toBe('')
  })

  it('字段名不同（gender）仍按值映射，不靠字段名判定语义', () => {
    expect(mapSex('F').standardValue).toBe('女性')
  })
})

describe('患者身份：病案号不直接等同患者', () => {
  it('唯一候选 → 对齐成功', () => {
    const r = mapMPI({ localId: 'NCC-2026-0831', org: '国家癌症中心', candidates: ['P-0001'] })
    expect(r.status).toBe('对齐成功')
    expect(r.standardValue).toBe('P-0001')
  })

  it('多候选 → 待人工确认，禁止自动合并', () => {
    const r = mapMPI({ localId: 'ST-2026-0427', org: '省肿瘤医院', candidates: ['P-0001', 'P-0002'] })
    expect(r.status).toBe('待人工确认')
    expect(r.standardValue).toBe('')
  })

  it('无候选 → 待人工确认', () => {
    const r = mapMPI({ localId: '??', org: '未知', candidates: [] })
    expect(r.status).toBe('待人工确认')
  })
})

describe('跨中心冲突检测', () => {
  it('多中心值不一致 → 冲突', () => {
    const r = detectConflict({
      field: '出生日期',
      values: [
        { org: '国家癌症中心', value: '1968-03' },
        { org: '省肿瘤医院', value: '1965-07-12' },
      ],
    })
    expect(r.conflict).toBe(true)
  })

  it('多中心值一致 → 无冲突', () => {
    const r = detectConflict({
      field: '性别',
      values: [
        { org: '国家癌症中心', value: '男性' },
        { org: '省肿瘤医院', value: '男性' },
      ],
    })
    expect(r.conflict).toBe(false)
  })
})

describe('规则可查：每条规则带标准依据', () => {
  it('性别规则引用 GB/T 2261.1', () => {
    expect(alignRules.SEX_GBT2261.basis).toContain('GB/T 2261.1')
  })
  it('出生日期规则明确禁止补日', () => {
    expect(alignRules.BIRTH_PRECISION.scope).toContain('不得补')
  })
  it('吸烟规则要求量与年限同时存在', () => {
    expect(alignRules.SMOKING_PACKYEAR.scope).toContain('禁止推算')
  })
})
