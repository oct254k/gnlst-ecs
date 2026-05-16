import { describe, it, expect, vi, beforeEach } from 'vitest'

// Supabase 클라이언트 mock
const mockFrom = vi.fn()
const mockAuth = {
  getUser: vi.fn(),
}

vi.mock('@/app/_lib/supabase/server', () => ({
  createUserClient: vi.fn().mockResolvedValue({
    from: mockFrom,
    auth: mockAuth,
  }),
}))

// 빌더 체인 헬퍼
function buildChain(resolvedValue: unknown) {
  const chain: Record<string, unknown> = {}
  const methods = ['select', 'eq', 'is', 'neq', 'insert', 'update', 'delete',
    'maybeSingle', 'single', 'limit', 'order', 'gte', 'lte', 'or', 'ilike', 'contains']
  methods.forEach((m) => {
    chain[m] = vi.fn().mockReturnValue(chain)
  })
  ;(chain as Record<string, unknown>).maybeSingle = vi.fn().mockResolvedValue(resolvedValue)
  ;(chain as Record<string, unknown>).single = vi.fn().mockResolvedValue(resolvedValue)
  ;(chain as Record<string, unknown>).insert = vi.fn().mockReturnValue({
    select: vi.fn().mockReturnValue({
      single: vi.fn().mockResolvedValue(resolvedValue),
    }),
  })
  ;(chain as Record<string, unknown>).update = vi.fn().mockReturnValue({
    eq: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue(resolvedValue),
      }),
    }),
  })
  return chain
}

describe('createSchedule Server Action', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('미인증 사용자에게 에러를 반환한다', async () => {
    mockAuth.getUser.mockResolvedValue({ data: { user: null }, error: new Error('no user') })
    mockFrom.mockReturnValue(buildChain({ data: null, error: null }))

    const { createSchedule } = await import('@/lib/actions/schedules')
    const result = await createSchedule({
      type: 'personal',
      title: '테스트 일정',
      schedule_date: '2026-05-15',
      time_slot: 'morning',
      owner_id: 'owner-1',
    })

    expect(result.success).toBe(false)
    expect(result.error).toContain('인증')
  })

  it('start_time >= end_time 이면 INVALID_TIME_RANGE 오류를 반환한다', async () => {
    mockAuth.getUser.mockResolvedValue({
      data: { user: { id: 'user-1', user_metadata: { role: 'user' } } },
      error: null,
    })

    const { createSchedule } = await import('@/lib/actions/schedules')
    const result = await createSchedule({
      type: 'personal',
      title: '테스트 일정',
      schedule_date: '2026-05-15',
      time_slot: 'morning',
      owner_id: 'owner-1',
      start_time: '10:00',
      end_time: '09:00',
    })

    expect(result.success).toBe(false)
    expect(result.error).toBe('INVALID_TIME_RANGE')
  })

  it('personal 일정에 owner_id가 없으면 오류를 반환한다', async () => {
    mockAuth.getUser.mockResolvedValue({
      data: { user: { id: 'user-1', user_metadata: { role: 'user' } } },
      error: null,
    })

    const { createSchedule } = await import('@/lib/actions/schedules')
    const result = await createSchedule({
      type: 'personal',
      title: '테스트 일정',
      schedule_date: '2026-05-15',
      time_slot: 'morning',
      owner_id: '',
    })

    expect(result.success).toBe(false)
  })
})

describe('deleteSchedule Server Action', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('미인증 사용자에게 에러를 반환한다', async () => {
    mockAuth.getUser.mockResolvedValue({ data: { user: null }, error: new Error('no user') })

    const { deleteSchedule } = await import('@/lib/actions/schedules')
    const result = await deleteSchedule('schedule-id-1')

    expect(result.success).toBe(false)
    expect(result.error).toContain('인증')
  })
})
