import { NextRequest, NextResponse } from 'next/server'
import { createUserClient } from '@/app/_lib/supabase/server'
import type { Tables, TablesUpdate } from '@/app/_lib/supabase/types'
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
type SpRow = Tables<'schedule_participants'>
type SpUpdate = TablesUpdate<'schedule_participants'>

// ---------------------------------------------------------------------------
// POST /api/schedules/:id/participants
// 공통 일정 참가 추가 (본인 또는 admin이 타인)
// ---------------------------------------------------------------------------

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const { id: scheduleId } = await params
  const supabase = await createUserClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return errorResponse('FORBIDDEN', '인증이 필요합니다.', 401)
  }

  let body: { user_id: string }
  try {
    body = await request.json()
  } catch {
    return errorResponse('INTERNAL_ERROR', '유효하지 않은 요청 본문입니다.', 400)
  }

  if (!body.user_id) {
    return errorResponse('INTERNAL_ERROR', 'user_id는 필수입니다.', 400)
  }

  const role = user.user_metadata?.role as string | undefined

  if (role !== 'admin' && body.user_id !== user.id) {
    return errorResponse('FORBIDDEN', '본인만 참가할 수 있습니다.', 403)
  }

  // 공통 일정 존재 확인
  const { data: scheduleRaw, error: scheduleError } = await supabase
    .from('schedules')
    .select('id, type')
    .eq('id', scheduleId)
    .is('deleted_at', null)
    .maybeSingle()

  if (scheduleError || !scheduleRaw) {
    return errorResponse('SCHEDULE_NOT_FOUND', '일정을 찾을 수 없습니다.', 404)
  }

  const schedule = scheduleRaw as unknown as Pick<ScheduleRow, 'id' | 'type'>

  if (schedule.type !== 'common') {
    return errorResponse('SCHEDULE_NOT_FOUND', '공통 일정에만 참가할 수 있습니다.', 404)
  }

  // 이미 joined 상태인지 확인
  const { data: existingRaw } = await supabase
    .from('schedule_participants')
    .select('id, status')
    .eq('schedule_id', scheduleId)
    .eq('user_id', body.user_id)
    .maybeSingle()

  if (existingRaw) {
    const existing = existingRaw as unknown as Pick<SpRow, 'id' | 'status'>
    if (existing.status === 'joined') {
      return errorResponse('ALREADY_PARTICIPANT', '이미 참가 중입니다.', 409)
    }
    // cancelled → 재참가
    const now = new Date().toISOString()
    const updateData: SpUpdate = {
      status: 'joined',
      cancelled_at: null,
      joined_at: now,
      added_by: user.id,
      updated_at: now,
    }
    const { data: updatedRaw, error: updateError } = await supabase
      .from('schedule_participants')
      .update(updateData as never)
      .eq('id', existing.id)
      .select('id, schedule_id, user_id, status, joined_at')
      .single()

    if (updateError || !updatedRaw) {
      return errorResponse('INTERNAL_ERROR', updateError?.message ?? 'UPDATE 실패', 500)
    }

    return NextResponse.json({ data: updatedRaw, error: null }, { status: 201 })
  }

  // 신규 참가 INSERT
  const { data: insertedRaw, error: insertError } = await supabase
    .from('schedule_participants')
    .insert({
      schedule_id: scheduleId,
      user_id: body.user_id,
      added_by: user.id,
    } as never)
    .select('id, schedule_id, user_id, status, joined_at')
    .single()

  if (insertError || !insertedRaw) {
    return errorResponse('INTERNAL_ERROR', insertError?.message ?? 'INSERT 실패', 500)
  }

  return NextResponse.json({ data: insertedRaw, error: null }, { status: 201 })
}
