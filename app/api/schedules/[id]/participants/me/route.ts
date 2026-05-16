import { NextRequest, NextResponse } from 'next/server'
import { createUserClient } from '@/app/_lib/supabase/server'
import type { TablesUpdate } from '@/app/_lib/supabase/types'
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

type SpUpdate = TablesUpdate<'schedule_participants'>

// ---------------------------------------------------------------------------
// DELETE /api/schedules/:id/participants/me
// 공통 일정 참가 취소 (status = 'cancelled' 갱신)
// ---------------------------------------------------------------------------

export async function DELETE(
  _request: NextRequest,
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

  const now = new Date().toISOString()
  const updateData: SpUpdate = {
    status: 'cancelled',
    cancelled_at: now,
    updated_at: now,
  }

  const { error } = await supabase
    .from('schedule_participants')
    .update(updateData as never)
    .eq('schedule_id', scheduleId)
    .eq('user_id', user.id)
    .eq('status', 'joined')

  if (error) {
    return errorResponse('INTERNAL_ERROR', error.message, 500)
  }

  return new NextResponse(null, { status: 204 })
}
