import { describe, it, expect } from 'vitest'
import { formatDate, isWeekend, addDays } from '@/lib/utils/date'

describe('formatDate', () => {
  it('날짜 문자열을 한국식으로 포맷한다', () => {
    expect(formatDate('2026-05-15')).toBe('2026. 5. 15.')
  })

  it('한 자리 월·일도 처리한다', () => {
    expect(formatDate('2026-01-03')).toBe('2026. 1. 3.')
  })
})

describe('isWeekend', () => {
  it('토요일을 주말로 판별한다', () => {
    expect(isWeekend('2026-05-16')).toBe(true)
  })

  it('일요일을 주말로 판별한다', () => {
    expect(isWeekend('2026-05-17')).toBe(true)
  })

  it('월요일을 평일로 판별한다', () => {
    expect(isWeekend('2026-05-18')).toBe(false)
  })

  it('금요일을 평일로 판별한다', () => {
    expect(isWeekend('2026-05-15')).toBe(false)
  })
})

describe('addDays', () => {
  it('7일을 더한 날짜를 반환한다', () => {
    expect(addDays('2026-05-15', 7)).toBe('2026-05-22')
  })

  it('월말 경계를 넘어 계산한다', () => {
    expect(addDays('2026-05-28', 5)).toBe('2026-06-02')
  })

  it('음수를 빼는 계산도 된다', () => {
    expect(addDays('2026-05-15', -1)).toBe('2026-05-14')
  })
})
