import { NextRequest, NextResponse } from 'next/server'
import { createUserClient } from '@/app/_lib/supabase/server'
import type { Tables } from '@/app/_lib/supabase/types'
import type { ApiResponse, ApiError } from '@/lib/types/api'

function errorResponse(
  code: ApiError['code'],
  message: string,
  status: number
): NextResponse {
  return NextResponse.json(
    { data: null, error: { code, message } } satisfies ApiResponse<never>,
    { status }
  )
}

type ScheduleRow = Tables<'schedules'>
type HolidayRow = Tables<'holidays'>
type UserRow = Pick<Tables<'users'>, 'id' | 'name' | 'color'>

type CalendarScheduleRow = Pick<
  ScheduleRow,
  'id' | 'type' | 'title' | 'schedule_date' | 'time_slot' | 'start_time' | 'end_time' | 'owner_id'
>
type CalendarHolidayRow = Pick<
  HolidayRow,
  'id' | 'holiday_date' | 'name' | 'type'
>

// ---------------------------------------------------------------------------
// GET /api/calendar
// 기간별 일정 + 공휴일 통합 조회 (달력 렌더링용 경량 응답)
// 쿼리: start(필수), end(필수), owner_ids
// ---------------------------------------------------------------------------

export async function GET(request: NextRequest): Promise<NextResponse> {
  const supabase = await createUserClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return errorResponse('FORBIDDEN', '인증이 필요합니다.', 401)
  }

  const { searchParams } = request.nextUrl
  const start = searchParams.get('start')
  const end = searchParams.get('end')

  if (!start || !end) {
    return errorResponse('INVALID_TIME_RANGE', 'start, end는 필수 파라미터입니다.', 400)
  }

  // owner_ids 파라미터 지원 (구현), user_ids는 스펙 별칭 (P4-1)
  const ownerIdsParam = searchParams.get('owner_ids') ?? searchParams.get('user_ids')
  const ownerIdList = ownerIdsParam
    ? ownerIdsParam.split(',').map((s) => s.trim()).filter(Boolean)
    : []

  // schedules + holidays 병렬 조회
  const [schedulesResult, holidaysResult] = await Promise.all([
    (() => {
      let q = supabase
        .from('schedules')
        .select('id, type, title, schedule_date, time_slot, start_time, end_time, owner_id')
        .is('deleted_at', null)
        .gte('schedule_date', start)
        .lte('schedule_date', end)
        .order('schedule_date', { ascending: true })
        .order('start_time', { ascending: true })

      if (ownerIdList.length > 0) {
        q = q.in('owner_id', ownerIdList)
      }

      return q
    })(),
    supabase
      .from('holidays')
      .select('id, holiday_date, name, type')
      .eq('is_active', true)
      .gte('holiday_date', start)
      .lte('holiday_date', end)
      .order('holiday_date', { ascending: true }),
  ])

  if (schedulesResult.error) {
    return errorResponse('INTERNAL_ERROR', schedulesResult.error.message, 500)
  }
  if (holidaysResult.error) {
    return errorResponse('INTERNAL_ERROR', holidaysResult.error.message, 500)
  }

  const scheduleRows = (schedulesResult.data ?? []) as unknown as CalendarScheduleRow[]
  const holidayRows = (holidaysResult.data ?? []) as unknown as CalendarHolidayRow[]

  // owner 정보 한번에 조회
  const ownerIds = [
    ...new Set(
      scheduleRows.map((r) => r.owner_id).filter((id): id is string => id !== null)
    ),
  ]
  const { data: ownerRaw } = ownerIds.length > 0
    ? await supabase.from('users').select('id, name, color').in('id', ownerIds)
    : { data: [] as never[] }
  const ownerMap = Object.fromEntries(
    ((ownerRaw ?? []) as unknown as UserRow[]).map((u) => [u.id, u])
  )

  const schedules = scheduleRows.map((row) => {
    const owner = row.owner_id ? (ownerMap[row.owner_id] as UserRow | undefined ?? null) : null
    return {
      id: row.id,
      type: row.type as 'personal' | 'common',
      title: row.title,
      schedule_date: row.schedule_date,
      time_slot: row.time_slot,
      start_time: row.start_time,
      end_time: row.end_time,
      owner: owner ? { id: owner.id, name: owner.name, color: owner.color } : null,
    }
  })

  const holidays = holidayRows.map((row) => ({
    id: row.id,
    holiday_date: row.holiday_date,
    name: row.name,
    type: row.type,
  }))

  return NextResponse.json({
    data: { schedules, holidays },
    error: null,
  })
}
