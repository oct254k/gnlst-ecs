'use server'

import { createUserClient, createServiceRoleClient } from '@/app/_lib/supabase/server'
import type { Tables, TablesInsert, TablesUpdate } from '@/app/_lib/supabase/types'
import type { ScheduleFormInput } from '@/lib/types/schedule'

export interface ActionResult {
  success: boolean
  error?: string
}

type ScheduleRow = Tables<'schedules'>
type ScheduleInsert = TablesInsert<'schedules'>
type ScheduleUpdate = TablesUpdate<'schedules'>
type ScheduleParticipantInsert = TablesInsert<'schedule_participants'>
type MentionInsert = TablesInsert<'mentions'>

// ---------------------------------------------------------------------------
// createSchedule — 일정 생성 Server Action
// ---------------------------------------------------------------------------

export async function createSchedule(
  input: ScheduleFormInput
): Promise<ActionResult> {
  const supabase = await createUserClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return { success: false, error: '인증이 필요합니다.' }
  }

  if (input.start_time && input.end_time && input.start_time >= input.end_time) {
    return { success: false, error: 'INVALID_TIME_RANGE' }
  }

  if (input.type === 'personal' && !input.owner_id) {
    return { success: false, error: 'owner_id는 개인 일정에 필수입니다.' }
  }

  if (input.on_behalf_of_id) {
    const { data: proxy } = await supabase
      .from('proxy_permissions')
      .select('id')
      .eq('proxy_user_id', user.id)
      .eq('target_user_id', input.on_behalf_of_id)
      .is('revoked_at', null)
      .maybeSingle()

    if (!proxy) {
      return { success: false, error: 'NO_PROXY_PERMISSION' }
    }
  }

  const insertData: ScheduleInsert = {
    type: input.type,
    title: input.title,
    schedule_date: input.schedule_date,
    time_slot: input.time_slot,
    is_all_day: input.is_all_day ?? false,
    start_time: input.is_all_day ? null : (input.start_time ?? null),
    end_time: input.is_all_day ? null : (input.end_time ?? null),
    location: input.location ?? null,
    memo: input.memo ?? null,
    owner_id: input.owner_id ?? null,
    on_behalf_of_id: input.on_behalf_of_id ?? null,
    created_by: user.id,
  }

  const { data: schedule, error: scheduleError } = await supabase
    .from('schedules')
    .insert(insertData as never)
    .select('id')
    .single()

  if (scheduleError || !schedule) {
    return { success: false, error: scheduleError?.message ?? 'INTERNAL_ERROR' }
  }

  const scheduleRow = schedule as unknown as Pick<ScheduleRow, 'id'>

  if (input.participant_ids && input.participant_ids.length > 0) {
    const participants: ScheduleParticipantInsert[] = input.participant_ids.map((uid) => ({
      schedule_id: scheduleRow.id,
      user_id: uid,
      added_by: user.id,
    }))

    const { error: pError } = await supabase
      .from('schedule_participants')
      .insert(participants as never)

    if (pError) {
      const updateData: ScheduleUpdate = {
        deleted_at: new Date().toISOString(),
        deleted_by: user.id,
      }
      await supabase
        .from('schedules')
        .update(updateData as never)
        .eq('id', scheduleRow.id)
      return { success: false, error: pError.message }
    }
  }

  if (input.mentions && input.mentions.length > 0) {
    const mentions: MentionInsert[] = input.mentions.map((m) => ({
      schedule_id: scheduleRow.id,
      reference_type: m.reference_type,
      reference_id: m.reference_id,
      raw_text: `@${m.reference_id}`,
    }))

    const { error: mError } = await supabase
      .from('mentions')
      .insert(mentions as never)

    if (mError) {
      const updateData: ScheduleUpdate = {
        deleted_at: new Date().toISOString(),
        deleted_by: user.id,
      }
      await supabase
        .from('schedules')
        .update(updateData as never)
        .eq('id', scheduleRow.id)
      return { success: false, error: mError.message }
    }
  }

  return { success: true }
}

// ---------------------------------------------------------------------------
// updateSchedule — 일정 수정 Server Action
// ---------------------------------------------------------------------------

export async function updateSchedule(
  id: string,
  patch: Partial<
    Pick<
      ScheduleFormInput,
      | 'title'
      | 'schedule_date'
      | 'time_slot'
      | 'start_time'
      | 'end_time'
      | 'location'
      | 'memo'
    >
  >
): Promise<ActionResult> {
  const supabase = await createUserClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return { success: false, error: '인증이 필요합니다.' }
  }

  if (patch.start_time && patch.end_time && patch.start_time >= patch.end_time) {
    return { success: false, error: 'INVALID_TIME_RANGE' }
  }

  const updateData: ScheduleUpdate = {
    updated_at: new Date().toISOString(),
  }
  if (patch.title !== undefined) updateData.title = patch.title
  if (patch.schedule_date !== undefined) updateData.schedule_date = patch.schedule_date
  if (patch.time_slot !== undefined) updateData.time_slot = patch.time_slot
  if (patch.start_time !== undefined) updateData.start_time = patch.start_time ?? null
  if (patch.end_time !== undefined) updateData.end_time = patch.end_time ?? null
  if (patch.location !== undefined) updateData.location = patch.location ?? null
  if (patch.memo !== undefined) updateData.memo = patch.memo ?? null

  const { error } = await supabase
    .from('schedules')
    .update(updateData as never)
    .eq('id', id)
    .is('deleted_at', null)

  if (error) {
    return { success: false, error: error.message }
  }

  return { success: true }
}

// ---------------------------------------------------------------------------
// deleteSchedule — 일정 삭제 Server Action (soft delete)
// cascade는 DB 트리거(004_cascade_soft_delete.sql)가 자동 처리
// ---------------------------------------------------------------------------

export async function deleteSchedule(id: string): Promise<ActionResult> {
  const supabase = await createUserClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return { success: false, error: '인증이 필요합니다.' }
  }

  // 삭제 전 전체 데이터 조회 (audit before_data용)
  const { data: beforeRaw, error: fetchError } = await supabase
    .from('schedules')
    .select('*')
    .eq('id', id)
    .is('deleted_at', null)
    .single()

  if (fetchError || !beforeRaw) {
    return { success: false, error: '일정을 찾을 수 없습니다.' }
  }

  const deletedAt = new Date().toISOString()
  const updateData: ScheduleUpdate = {
    deleted_at: deletedAt,
    deleted_by: user.id,
  }

  const srSupabase = createServiceRoleClient()
  const { error } = await srSupabase
    .from('schedules')
    .update(updateData as never)
    .eq('id', id)
    .is('deleted_at', null)

  if (error) {
    return { success: false, error: error.message }
  }

  // service role 호출 시 auth.uid() = NULL → 트리거가 감사 로그 스킵
  // → 직접 insert
  const { data: actorRow } = await srSupabase
    .from('users')
    .select('name')
    .eq('id', user.id)
    .single()

  await srSupabase.from('audit_logs').insert({
    target_type: 'schedule',
    target_id: id,
    action: 'deleted',
    actor_id: user.id,
    actor_name_snapshot: (actorRow as unknown as { name: string } | null)?.name ?? '',
    before_data: beforeRaw,
    after_data: { ...(beforeRaw as object), ...updateData },
    changed_fields: ['deleted_at', 'deleted_by'],
  } as never)

  return { success: true }
}
