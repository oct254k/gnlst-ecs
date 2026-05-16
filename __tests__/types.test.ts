import { describe, it, expect } from 'vitest'
import type {
  TimeSlot,
  ScheduleType,
  UserRole,
  HolidayType,
  ApiResponse,
  ApiError,
  PaginatedResponse,
} from '@/lib/types'

describe('TimeSlot 유효값', () => {
  const valid: TimeSlot[] = ['morning', 'lunch', 'afternoon', 'evening', 'allday']

  it('모든 유효한 TimeSlot 값이 정의된다', () => {
    expect(valid).toHaveLength(5)
    expect(valid).toContain('morning')
    expect(valid).toContain('allday')
  })
})

describe('ScheduleType 유효값', () => {
  const valid: ScheduleType[] = ['personal', 'common']

  it('personal/common 두 가지만 존재한다', () => {
    expect(valid).toHaveLength(2)
  })
})

describe('UserRole 유효값', () => {
  const valid: UserRole[] = ['admin', 'user']

  it('admin/user 두 가지만 존재한다', () => {
    expect(valid).toHaveLength(2)
  })
})

describe('HolidayType 유효값', () => {
  const valid: HolidayType[] = ['statutory', 'substitute', 'temporary']

  it('3가지 공휴일 유형이 정의된다', () => {
    expect(valid).toHaveLength(3)
    expect(valid).toContain('statutory')
    expect(valid).toContain('substitute')
    expect(valid).toContain('temporary')
  })
})

describe('ApiResponse<T> 구조', () => {
  it('성공 응답은 data를 가진다', () => {
    const res: ApiResponse<{ id: string }> = { data: { id: 'abc' }, error: null }
    expect(res.data).toEqual({ id: 'abc' })
    expect(res.error).toBeNull()
  })

  it('실패 응답은 error를 가진다', () => {
    const err: ApiError = { code: 'NOT_FOUND', message: '리소스를 찾을 수 없습니다' }
    const res: ApiResponse<never> = { data: null, error: err }
    expect(res.data).toBeNull()
    expect(res.error?.code).toBe('NOT_FOUND')
  })
})

describe('PaginatedResponse<T> 구조', () => {
  it('data 배열과 meta 페이지 정보를 가진다', () => {
    const res: PaginatedResponse<{ id: string }> = {
      data: [{ id: '1' }, { id: '2' }],
      meta: { total: 2, page: 1, per_page: 50 },
    }
    expect(res.data).toHaveLength(2)
    expect(res.meta.total).toBe(2)
    expect(res.meta.page).toBe(1)
  })
})
