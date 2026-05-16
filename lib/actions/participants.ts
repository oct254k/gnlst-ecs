'use server'

import { createUserClient } from '@/app/_lib/supabase/server'
import type { Tables, TablesUpdate } from '@/app/_lib/supabase/types'
import type { ActionResult } from '@/lib/actions/schedules'

type ScheduleParticipantRow = Tables<'schedule_participants'>
type ScheduleParticipantUpdate = TablesUpdate<'schedule_participants'>

// ---------------------------------------------------------------------------
// addParticipant — 공통 일정 참가 추가 Server Action
// ---------------------------------------------------------------------------

export async function addParticipant(
  scheduleId: string,
  userId: string
): Promise<ActionResult> {
  const supabase = await createUserClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return { success: false, error: '인증이 필요합니다.' }
  }

  const role = user.user_metadata?.role as string | undefined

  if (role !== 'admin' && userId !== user.id) {
    return { success: false, error: 'FORBIDDEN' }
  }

  // 공통 일정 존재 확인
  const { data: schedule, error: scheduleError } = await supabase
    .from('schedules')
    .select('id, type')
    .eq('id', scheduleId)
    .is('deleted_at', null)
    .maybeSingle()

  if (scheduleError || !schedule) {
    return { success: false, error: 'SCHEDULE_NOT_FOUND' }
  }

  const scheduleRow = schedule as unknown as Pick<Tables<'schedules'>, 'id' | 'type'>

  if (scheduleRow.type !== 'common') {
    return { success: false, error: 'SCHEDULE_NOT_FOUND' }
  }

  // 이미 joined 상태인지 확인
  const { data: existing } = await supabase
    .from('schedule_participants')
    .select('id, status')
    .eq('schedule_id', scheduleId)
    .eq('user_id', userId)
    .maybeSingle()

  if (existing) {
    const existingRow = existing as unknown as Pick<ScheduleParticipantRow, 'id' | 'status'>
    if (existingRow.status === 'joined') {
      return { success: false, error: 'ALREADY_PARTICIPANT' }
    }
    // cancelled → 재참가
    const now = new Date().toISOString()
    const updateData: ScheduleParticipantUpdate = {
      status: 'joined',
      cancelled_at: null,
      joined_at: now,
      added_by: user.id,
      updated_at: now,
    }
    const { error: updateError } = await supabase
      .from('schedule_participants')
      .update(updateData as never)
      .eq('id', existingRow.id)

    if (updateError) {
      return { success: false, error: updateError.message }
    }
    return { success: true }
  }

  // 신규 참가
  const { error: insertError } = await supabase
    .from('schedule_participants')
    .insert({
      schedule_id: scheduleId,
      user_id: userId,
      added_by: user.id,
    } as never)

  if (insertError) {
    return { success: false, error: insertError.message }
  }

  return { success: true }
}

// ---------------------------------------------------------------------------
// removeParticipant — 공통 일정 참가 취소 Server Action
// ---------------------------------------------------------------------------

export async function removeParticipant(
  scheduleId: string
): Promise<ActionResult> {
  const supabase = await createUserClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return { success: false, error: '인증이 필요합니다.' }
  }

  const now = new Date().toISOString()
  const updateData: ScheduleParticipantUpdate = {
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
    return { success: false, error: error.message }
  }

  return { success: true }
}
