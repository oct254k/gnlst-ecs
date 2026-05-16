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

type DayScheduleRow = Pick<
  ScheduleRow,
  'id' | 'type' | 'title' | 'time_slot' | 'start_time' | 'end_time' | 'location' | 'owner_id'
>
type DayHolidayRow = Pick<HolidayRow, 'name' | 'type'>

// ---------------------------------------------------------------------------
// GET /api/calendar/day/:date
// 특정 날짜 일 상세 (일 상세 패널용)
// ---------------------------------------------------------------------------

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ date: string }> }
): Promise<NextResponse> {
  const { date } = await params
  const supabase = await createUserClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return errorResponse('FORBIDDEN', '인증이 필요합니다.', 401)
  }

  const { searchParams } = request.nextUrl
  const owner_ids = searchParams.get('owner_ids')
  const ownerIdList = owner_ids
    ? owner_ids.split(',').map((s) => s.trim()).filter(Boolean)
    : []

  // schedules + holidays 병렬 조회
  const [schedulesResult, holidaysResult] = await Promise.all([
    (() => {
      let q = supabase
        .from('schedules')
        .select('id, type, title, time_slot, start_time, end_time, location, owner_id')
        .is('deleted_at', null)
        .eq('schedule_date', date)
        .order('start_time', { ascending: true })

      if (ownerIdList.length > 0) {
        q = q.in('owner_id', ownerIdList)
      }

      return q
    })(),
    supabase
      .from('holidays')
      .select('name, type')
      .eq('holiday_date', date)
      .eq('is_active', true)
      .limit(1)
      .maybeSingle(),
  ])

  if (schedulesResult.error) {
    return errorResponse('INTERNAL_ERROR', schedulesResult.error.message, 500)
  }
  if (holidaysResult.error) {
    return errorResponse('INTERNAL_ERROR', holidaysResult.error.message, 500)
  }

  const scheduleRows = (schedulesResult.data ?? []) as unknown as DayScheduleRow[]
  const holidayRow = holidaysResult.data as unknown as DayHolidayRow | null

  // owner 정보 조회
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
      time_slot: row.time_slot,
      start_time: row.start_time,
      end_time: row.end_time,
      location: row.location,
      owner: owner ? { id: owner.id, name: owner.name, color: owner.color } : null,
    }
  })

  return NextResponse.json({
    data: {
      date,
      holiday: holidayRow ? { name: holidayRow.name, type: holidayRow.type } : null,
      schedules,
    },
    error: null,
  })
}
