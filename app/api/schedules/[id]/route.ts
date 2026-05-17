import { NextRequest, NextResponse } from 'next/server'
import { createUserClient, createServiceRoleClient } from '@/app/_lib/supabase/server'
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
type ScheduleUpdate = TablesUpdate<'schedules'>
type UserRow = Pick<Tables<'users'>, 'id' | 'name' | 'color'>
type PUserRow = Pick<Tables<'users'>, 'id' | 'name'>
type SpRow = Pick<Tables<'schedule_participants'>, 'user_id' | 'joined_at'>
type MentionRow = Pick<Tables<'mentions'>, 'reference_type' | 'reference_id' | 'raw_text'>
type AuditRow = Pick<
  Tables<'audit_logs'>,
  | 'id'
  | 'action'
  | 'actor_id'
  | 'actor_name_snapshot'
  | 'on_behalf_of_id'
  | 'on_behalf_of_name_snapshot'
  | 'before_data'
  | 'after_data'
  | 'created_at'
>
type ScheduleListRow = Pick<
  ScheduleRow,
  | 'id' | 'type' | 'title' | 'schedule_date' | 'time_slot' | 'start_time' | 'end_time'
  | 'is_all_day' | 'location' | 'memo' | 'created_at' | 'updated_at'
  | 'owner_id' | 'created_by' | 'on_behalf_of_id'
>

async function fetchScheduleWithRelations(
  supabase: Awaited<ReturnType<typeof createUserClient>>,
  id: string
) {
  const { data: rawSchedule, error } = await supabase
    .from('schedules')
    .select(
      'id, type, title, schedule_date, time_slot, start_time, end_time, is_all_day, location, memo, created_at, updated_at, owner_id, created_by, on_behalf_of_id'
    )
    .eq('id', id)
    .is('deleted_at', null)
    .single()

  if (error || !rawSchedule) return null

  const schedule = rawSchedule as unknown as ScheduleListRow

  const userIds = [
    ...new Set(
      [schedule.owner_id, schedule.created_by, schedule.on_behalf_of_id].filter(
        (v): v is string => v !== null
      )
    ),
  ]

  const { data: userRaw } = userIds.length > 0
    ? await supabase.from('users').select('id, name, color').in('id', userIds)
    : { data: [] as never[] }
  const userMap = Object.fromEntries(
    ((userRaw ?? []) as unknown as UserRow[]).map((u) => [u.id, u])
  )

  const { data: spRaw } = await supabase
    .from('schedule_participants')
    .select('user_id, joined_at')
    .eq('schedule_id', id)
    .eq('status', 'joined')
  const spRows = (spRaw ?? []) as unknown as SpRow[]

  const pUserIds = spRows.map((p) => p.user_id)
  const { data: pUserRaw } = pUserIds.length > 0
    ? await supabase.from('users').select('id, name').in('id', pUserIds)
    : { data: [] as never[] }
  const pUserMap = Object.fromEntries(
    ((pUserRaw ?? []) as unknown as PUserRow[]).map((u) => [u.id, u])
  )

  const { data: mentionRaw } = await supabase
    .from('mentions')
    .select('reference_type, reference_id, raw_text')
    .eq('schedule_id', id)
  const mentionRows = (mentionRaw ?? []) as unknown as MentionRow[]

  const owner = schedule.owner_id ? (userMap[schedule.owner_id] as UserRow | undefined ?? null) : null
  const createdByUser = userMap[schedule.created_by] as UserRow | undefined ?? null
  const onBehalfOfUser = schedule.on_behalf_of_id
    ? (userMap[schedule.on_behalf_of_id] as UserRow | undefined ?? null)
    : null

  return {
    id: schedule.id,
    type: schedule.type,
    title: schedule.title,
    schedule_date: schedule.schedule_date,
    time_slot: schedule.time_slot,
    start_time: schedule.start_time,
    end_time: schedule.end_time,
    is_all_day: schedule.is_all_day,
    location: schedule.location,
    memo: schedule.memo,
    owner: owner ? { id: owner.id, name: owner.name, color: owner.color } : null,
    created_by: createdByUser
      ? { id: createdByUser.id, name: createdByUser.name }
      : { id: schedule.created_by, name: '' },
    on_behalf_of: onBehalfOfUser
      ? { id: onBehalfOfUser.id, name: onBehalfOfUser.name }
      : null,
    participants: spRows.map((p) => ({
      id: p.user_id,
      name: pUserMap[p.user_id]?.name ?? '',
      joined_at: p.joined_at,
    })),
    mentions: mentionRows.map((m) => ({
      reference_type: m.reference_type as 'contact' | 'company',
      reference_id: m.reference_id,
      display_name: m.raw_text,
    })),
    created_at: schedule.created_at,
    updated_at: schedule.updated_at,
  }
}

// ---------------------------------------------------------------------------
// GET /api/schedules/:id
// 일정 상세 + recent_audit_logs 최근 5건
// audit_logs.target_type = 'schedule' (TG_TABLE_NAME→단수 변환, 003_audit_trigger.sql)
// ---------------------------------------------------------------------------

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const { id } = await params
  const supabase = await createUserClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return errorResponse('FORBIDDEN', '인증이 필요합니다.', 401)
  }

  const scheduleData = await fetchScheduleWithRelations(supabase, id)
  if (!scheduleData) {
    return errorResponse('SCHEDULE_NOT_FOUND', '일정을 찾을 수 없습니다.', 404)
  }

  // audit_logs 최근 5건 (target_type = 'schedule' — TG_TABLE_NAME→단수 변환)
  const { data: auditRaw } = await supabase
    .from('audit_logs')
    .select(
      'id, action, actor_id, actor_name_snapshot, on_behalf_of_id, on_behalf_of_name_snapshot, before_data, after_data, created_at'
    )
    .eq('target_type', 'schedule')
    .eq('target_id', id)
    .order('created_at', { ascending: false })
    .limit(5)

  const auditRows = (auditRaw ?? []) as unknown as AuditRow[]

  const auditUserIds = [
    ...new Set([
      ...auditRows.map((a) => a.actor_id).filter((v): v is string => v !== null),
      ...auditRows.map((a) => a.on_behalf_of_id).filter((v): v is string => v !== null),
    ]),
  ]
  const { data: auditUserRaw } = auditUserIds.length > 0
    ? await supabase.from('users').select('id, name').in('id', auditUserIds)
    : { data: [] as never[] }
  const auditUserMap = Object.fromEntries(
    ((auditUserRaw ?? []) as unknown as PUserRow[]).map((u) => [u.id, u])
  )

  const recent_audit_logs = auditRows.map((row) => {
    const actorUser = row.actor_id ? (auditUserMap[row.actor_id] ?? null) : null
    const onBehalfUser = row.on_behalf_of_id
      ? (auditUserMap[row.on_behalf_of_id] ?? null)
      : null
    return {
      id: row.id,
      action: row.action as 'created' | 'updated' | 'deleted',
      actor: actorUser ?? { id: row.actor_id ?? '', name: row.actor_name_snapshot ?? '' },
      on_behalf_of: onBehalfUser
        ? { id: onBehalfUser.id, name: onBehalfUser.name }
        : row.on_behalf_of_id
          ? { id: row.on_behalf_of_id, name: row.on_behalf_of_name_snapshot ?? '' }
          : null,
      before_data: (row.before_data as Record<string, unknown> | null) ?? null,
      after_data: (row.after_data as Record<string, unknown> | null) ?? null,
      created_at: row.created_at,
    }
  })

  return NextResponse.json({
    data: { ...scheduleData, recent_audit_logs },
    error: null,
  })
}

// ---------------------------------------------------------------------------
// PATCH /api/schedules/:id
// partial update — 변경할 필드만 포함
// ---------------------------------------------------------------------------

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const { id } = await params
  const supabase = await createUserClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return errorResponse('FORBIDDEN', '인증이 필요합니다.', 401)
  }

  let body: {
    title?: string
    schedule_date?: string
    time_slot?: string
    start_time?: string | null
    end_time?: string | null
    location?: string | null
    memo?: string | null
    participant_ids?: string[]
    mentions?: Array<{ reference_type: string; reference_id: string; display_name?: string }>
  }

  try {
    body = await request.json()
  } catch {
    return errorResponse('INTERNAL_ERROR', '유효하지 않은 요청 본문입니다.', 400)
  }

  if (body.start_time && body.end_time && body.start_time >= body.end_time) {
    return errorResponse('INVALID_TIME_RANGE', '종료 시간은 시작 시간보다 이후여야 합니다.', 400)
  }

  const { data: existingRaw, error: fetchError } = await supabase
    .from('schedules')
    .select('id, type')
    .eq('id', id)
    .is('deleted_at', null)
    .single()

  if (fetchError || !existingRaw) {
    return errorResponse('SCHEDULE_NOT_FOUND', '일정을 찾을 수 없습니다.', 404)
  }

  const existing = existingRaw as unknown as Pick<ScheduleRow, 'id' | 'type'>

  const patch: ScheduleUpdate = {}
  if (body.title !== undefined) patch.title = body.title
  if (body.schedule_date !== undefined) patch.schedule_date = body.schedule_date
  if (body.time_slot !== undefined) patch.time_slot = body.time_slot
  if (body.start_time !== undefined) patch.start_time = body.start_time
  if (body.end_time !== undefined) patch.end_time = body.end_time
  if (body.location !== undefined) patch.location = body.location
  if (body.memo !== undefined) patch.memo = body.memo

  if (Object.keys(patch).length > 0) {
    patch.updated_at = new Date().toISOString()
    const { error: updateError } = await supabase
      .from('schedules')
      .update(patch as never)
      .eq('id', id)
      .is('deleted_at', null)

    if (updateError) {
      return errorResponse('INTERNAL_ERROR', updateError.message, 500)
    }
  }

  // participant_ids 처리 (공통 일정)
  if (body.participant_ids !== undefined && existing.type === 'common') {
    await supabase
      .from('schedule_participants')
      .update({
        status: 'cancelled',
        cancelled_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      } as never)
      .eq('schedule_id', id)
      .eq('status', 'joined')

    if (body.participant_ids.length > 0) {
      await supabase
        .from('schedule_participants')
        .upsert(
          body.participant_ids.map((uid) => ({
            schedule_id: id,
            user_id: uid,
            added_by: user.id,
            status: 'joined',
            joined_at: new Date().toISOString(),
          })) as never,
          { onConflict: 'schedule_id,user_id' }
        )
    }
  }

  // mentions 처리 (전체 교체, mentions는 soft delete 미적용 — ERD §E06)
  if (body.mentions !== undefined) {
    await supabase.from('mentions').delete().eq('schedule_id', id)

    if (body.mentions.length > 0) {
      await supabase
        .from('mentions')
        .insert(
          body.mentions.map((m) => ({
            schedule_id: id,
            reference_type: m.reference_type,
            reference_id: m.reference_id,
            raw_text: m.display_name ?? m.reference_id,
          })) as never
        )
    }
  }

  // 알림 발송 (notification_logs INSERT — Service Role 필요, RLS WITH CHECK (false))
  if (Object.keys(patch).length > 0) {
    const adminSupabase = createServiceRoleClient()

    if (existing.type === 'common') {
      // 공통 일정 수정: 전체 활성 임원(role='user', status='active')에게 알림
      const { data: executives } = await adminSupabase
        .from('users')
        .select('id, email')
        .eq('role', 'user')
        .eq('status', 'active')
        .is('deleted_at', null)

      if (executives && executives.length > 0) {
        const notifRows = executives.map((exec) => ({
          recipient_id: exec.id,
          recipient_email: exec.email,
          event_type: 'common_schedule_updated',
          target_type: 'schedule',
          target_id: id,
          status: 'pending',
        }))
        await adminSupabase.from('notification_logs').insert(notifRows as never)
      }
    } else {
      // 개인 일정을 타인이 수정한 경우: 일정 소유자에게만 알림
      const { data: fetchedSchedule } = await adminSupabase
        .from('schedules')
        .select('owner_id')
        .eq('id', id)
        .is('deleted_at', null)
        .single()

      const ownerId = (fetchedSchedule as unknown as { owner_id: string | null } | null)?.owner_id
      if (ownerId && ownerId !== user.id) {
        const { data: ownerUser } = await adminSupabase
          .from('users')
          .select('id, email')
          .eq('id', ownerId)
          .single()

        if (ownerUser) {
          const ownerRow = ownerUser as unknown as { id: string; email: string }
          await adminSupabase.from('notification_logs').insert({
            recipient_id: ownerRow.id,
            recipient_email: ownerRow.email,
            event_type: 'schedule_updated_by_other',
            target_type: 'schedule',
            target_id: id,
            status: 'pending',
          } as never)
        }
      }
    }
  }

  const updatedData = await fetchScheduleWithRelations(supabase, id)
  if (!updatedData) {
    return errorResponse('INTERNAL_ERROR', 'FETCH 실패', 500)
  }

  return NextResponse.json({ data: updatedData, error: null })
}

// ---------------------------------------------------------------------------
// DELETE /api/schedules/:id
// Soft delete: deleted_at, deleted_by 갱신
// cascade는 DB 트리거(004_cascade_soft_delete.sql)가 자동 처리
// ---------------------------------------------------------------------------

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const { id } = await params
  const supabase = await createUserClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return errorResponse('FORBIDDEN', '인증이 필요합니다.', 401)
  }

  const { data: existingRaw, error: fetchError } = await supabase
    .from('schedules')
    .select('id, type')
    .eq('id', id)
    .is('deleted_at', null)
    .single()

  if (fetchError || !existingRaw) {
    return errorResponse('SCHEDULE_NOT_FOUND', '일정을 찾을 수 없습니다.', 404)
  }

  const existing = existingRaw as unknown as Pick<ScheduleRow, 'id' | 'type'>

  const updateData: ScheduleUpdate = {
    deleted_at: new Date().toISOString(),
    deleted_by: user.id,
  }

  // soft delete는 Service Role로 수행 — deleted_at IS NULL SELECT 정책 우회
  const srSupabase = createServiceRoleClient()
  const { error } = await srSupabase
    .from('schedules')
    .update(updateData as never)
    .eq('id', id)
    .is('deleted_at', null)

  if (error) {
    return errorResponse('INTERNAL_ERROR', error.message, 500)
  }

  // 공통 일정 삭제 시 전체 활성 임원에게 취소 알림 발송
  if (existing.type === 'common') {
    const { data: executives } = await srSupabase
      .from('users')
      .select('id, email')
      .eq('role', 'user')
      .eq('status', 'active')
      .is('deleted_at', null)

    if (executives && executives.length > 0) {
      const notifRows = executives.map((exec) => ({
        recipient_id: exec.id,
        recipient_email: exec.email,
        event_type: 'common_schedule_deleted',
        target_type: 'schedule',
        target_id: id,
        status: 'pending',
      }))
      await srSupabase.from('notification_logs').insert(notifRows as never)
    }
  }

  return new NextResponse(null, { status: 204 })
}
