import { describe, it, expect } from 'vitest'
import {
  buildMonthCells,
  buildWeekDays,
  navigateDate,
  weekdayKo,
} from '@/components/calendar/calendar-helpers'

const KO = ['일', '월', '화', '수', '목', '금', '토']
const dowOf = (date: string) => KO[new Date(date + 'T00:00').getDay()]

describe('buildMonthCells', () => {
  it('항상 42칸을 반환한다', () => {
    expect(buildMonthCells('2026-09-04')).toHaveLength(42)
    expect(buildMonthCells('2026-02-01')).toHaveLength(42)
  })

  it('각 주의 첫 칸은 일요일이다', () => {
    for (const base of ['2026-09-04', '2026-02-01', '2026-03-01', '2028-10-01']) {
      const cells = buildMonthCells(base)
      const firsts = [0, 7, 14, 21, 28, 35].map(i => dowOf(cells[i].date))
      expect(firsts).toEqual(['일', '일', '일', '일', '일', '일'])
    }
  })

  it('당월 날짜를 하루도 빠뜨리지 않는다', () => {
    const cells = buildMonthCells('2026-02-10')
    const inside = cells.filter(c => !c.outside)
    expect(inside).toHaveLength(28)
    expect(inside[0].date).toBe('2026-02-01')
    expect(inside[27].date).toBe('2026-02-28')
  })

  it('앞뒤 달 날짜는 outside 로 표시한다', () => {
    const cells = buildMonthCells('2026-05-11')
    expect(cells[0].outside).toBe(true)
    expect(cells.filter(c => !c.outside)[0].date).toBe('2026-05-01')
  })
})

describe('buildWeekDays', () => {
  it('일요일부터 토요일까지 7일을 반환한다', () => {
    const days = buildWeekDays('2026-09-04')
    expect(days).toHaveLength(7)
    expect(days.map(dowOf)).toEqual(KO)
    expect(days[0]).toBe('2026-08-30')
    expect(days[6]).toBe('2026-09-05')
  })

  it('기준일이 일요일이면 그 주(당일 시작)를 반환한다', () => {
    const days = buildWeekDays('2026-09-06')
    expect(days[0]).toBe('2026-09-06')
    expect(days[6]).toBe('2026-09-12')
  })

  it('기준일이 토요일이면 그 주(당일 종료)를 반환한다', () => {
    const days = buildWeekDays('2026-09-12')
    expect(days[0]).toBe('2026-09-06')
    expect(days[6]).toBe('2026-09-12')
  })

  it('반환한 주는 항상 기준일을 포함한다', () => {
    for (const base of ['2026-09-04', '2026-09-06', '2026-12-31', '2027-01-01']) {
      expect(buildWeekDays(base)).toContain(base)
    }
  })

  it('연말 경계를 넘어가도 연도를 올바르게 계산한다', () => {
    expect(buildWeekDays('2026-12-31')).toEqual([
      '2026-12-27', '2026-12-28', '2026-12-29', '2026-12-30',
      '2026-12-31', '2027-01-01', '2027-01-02',
    ])
  })
})

describe('navigateDate', () => {
  it('월간 이동 시 말일 기준에서도 달을 건너뛰지 않는다', () => {
    let d = '2026-01-31'
    const seq = [d]
    for (let i = 0; i < 3; i++) {
      d = navigateDate(d, 'month', 1)
      seq.push(d)
    }
    expect(seq).toEqual(['2026-01-31', '2026-02-28', '2026-03-28', '2026-04-28'])
  })

  it('주간 이동은 정확히 7일씩 움직인다', () => {
    expect(navigateDate('2026-09-04', 'week', 1)).toBe('2026-09-11')
    expect(navigateDate('2026-09-04', 'week', -1)).toBe('2026-08-28')
  })

  it('일간 이동은 하루씩 움직이며 월 경계를 넘는다', () => {
    expect(navigateDate('2026-02-28', 'day', 1)).toBe('2026-03-01')
    expect(navigateDate('2026-03-01', 'day', -1)).toBe('2026-02-28')
  })

  it('역방향 월간 이동도 달을 건너뛰지 않는다', () => {
    expect(navigateDate('2026-03-31', 'month', -1)).toBe('2026-02-28')
  })
})

describe('weekdayKo', () => {
  it('날짜의 한글 요일을 반환한다', () => {
    expect(weekdayKo('2026-09-06')).toBe('일')
    expect(weekdayKo('2026-09-04')).toBe('금')
  })
})
