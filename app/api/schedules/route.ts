import { NextRequest, NextResponse } from 'next/server'
import { createUserClient } from '@/app/_lib/supabase/server'
import type { Tables, TablesInsert, TablesUpdate } from '@/app/_lib/supabase/types'
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
type ScheduleInsert = TablesInsert<'schedules'>
type ScheduleUpdate = TablesUpdate<'schedules'>

// ---------------------------------------------------------------------------
// GET /api/schedules
// 쿼리: date_from(필수), date_to(필수), owner_ids, type, keyword, page, per_page
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
  const date_from = searchParams.get('date_from')
  const date_to = searchParams.get('date_to')

  if (!date_from || !date_to) {
    return errorResponse(
      'INVALID_TIME_RANGE',
      'date_from, date_to는 필수 파라미터입니다.',
      400
    )
  }

  const owner_ids = searchParams.get('owner_ids')
  const type = searchParams.get('type')
  // q 파라미터 지원 (스펙), keyword는 레거시 별칭 (P4-1)
  const keyword = searchParams.get('q') ?? searchParams.get('keyword')
  const mention_ref = searchParams.get('mention_ref')
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10))
  const per_page = Math.min(
    100,
    Math.max(1, parseInt(searchParams.get('per_page') ?? '50', 10))
  )
  const from = (page - 1) * per_page
  const to = from + per_page - 1

  let query = supabase
    .from('schedules')
    .select(
      'id, type, title, schedule_date, time_slot, start_time, end_time, is_all_day, location, memo, created_at, updated_at, owner_id, created_by, on_behalf_of_id',
      { count: 'exact' }
    )
    .is('deleted_at', null)
    .gte('schedule_date', date_from)
    .lte('schedule_date', date_to)
    .order('schedule_date', { ascending: true })
    .order('start_time', { ascending: true })
    .range(from, to)

  if (owner_ids) {
    const ids = owner_ids.split(',').map((s) => s.trim()).filter(Boolean)
    if (ids.length > 0) {
      query = query.in('owner_id', ids)
    }
  }

  if (type === 'personal' || type === 'common') {
    query = query.eq('type', type)
  }

  if (keyword) {
    query = query.or(`title.ilike.%${keyword}%,location.ilike.%${keyword}%`)
  }

  // mention_ref 파라미터: mentions 테이블을 통해 해당 reference_id가 있는 schedule 필터 (P4-1)
  let mentionRefScheduleIds: string[] | null = null
  if (mention_ref) {
    const { data: mentionRefRows } = await supabase
      .from('mentions')
      .select('schedule_id')
      .eq('reference_id', mention_ref)
    mentionRefScheduleIds = mentionRefRows
      ? (mentionRefRows as unknown as Array<{ schedule_id: string }>).map((m) => m.schedule_id)
      : []
    if (mentionRefScheduleIds.length > 0) {
      query = query.in('id', mentionRefScheduleIds)
    } else {
      // mention_ref가 있지만 매칭 일정 없음 → 빈 결과
      return NextResponse.json({
        data: [],
        meta: { total: 0, page, per_page },
        error: null,
      })
    }
  }

  const { data: rawRows, error: schedulesError, count } = await query

  if (schedulesError) {
    return errorResponse('INTERNAL_ERROR', schedulesError.message, 500)
  }

  type ScheduleListRow = Pick<
    ScheduleRow,
    | 'id'
    | 'type'
    | 'title'
    | 'schedule_date'
    | 'time_slot'
    | 'start_time'
    | 'end_time'
    | 'is_all_day'
    | 'location'
    | 'memo'
    | 'created_at'
    | 'updated_at'
    | 'owner_id'
    | 'created_by'
    | 'on_behalf_of_id'
  >

  const scheduleRows = (rawRows ?? []) as unknown as ScheduleListRow[]

  if (scheduleRows.length === 0) {
    return NextResponse.json({
      data: [],
      meta: { total: 0, page, per_page },
      error: null,
    })
  }

  const scheduleIds = scheduleRows.map((r) => r.id)
  const userIds = [
    ...new Set([
      ...scheduleRows.map((r) => r.owner_id).filter((id): id is string => id !== null),
      ...scheduleRows.map((r) => r.created_by),
      ...scheduleRows
        .map((r) => r.on_behalf_of_id)
        .filter((id): id is string => id !== null),
    ]),
  ]

  type UserRow = Pick<Tables<'users'>, 'id' | 'name' | 'color'>
  type SpRow = Pick<Tables<'schedule_participants'>, 'schedule_id' | 'user_id' | 'joined_at'>
  type MentionRow = Pick<Tables<'mentions'>, 'schedule_id' | 'reference_type' | 'reference_id' | 'raw_text'>

  const [usersResult, participantsResult, mentionsResult] = await Promise.all([
    userIds.length > 0
      ? supabase.from('users').select('id, name, color').in('id', userIds)
      : Promise.resolve({ data: [] as never[], error: null }),
    supabase
      .from('schedule_participants')
      .select('schedule_id, user_id, joined_at')
      .in('schedule_id', scheduleIds)
      .eq('status', 'joined'),
    supabase
      .from('mentions')
      .select('schedule_id, reference_type, reference_id, raw_text')
      .in('schedule_id', scheduleIds),
  ])

  const userMap = Object.fromEntries(
    ((usersResult.data ?? []) as unknown as UserRow[]).map((u) => [u.id, u])
  )

  const participantRows = (participantsResult.data ?? []) as unknown as SpRow[]
  const mentionRows = (mentionsResult.data ?? []) as unknown as MentionRow[]

  // participant 유저 정보 추가 조회
  const participantUserIds = [...new Set(participantRows.map((p) => p.user_id))]
  const { data: pUserRaw } = participantUserIds.length > 0
    ? await supabase.from('users').select('id, name').in('id', participantUserIds)
    : { data: [] as never[] }
  type PUserRow = Pick<Tables<'users'>, 'id' | 'name'>
  const pUserMap = Object.fromEntries(
    ((pUserRaw ?? []) as unknown as PUserRow[]).map((u) => [u.id, u])
  )

  // schedule별 participants 그루핑
  const participantsBySchedule: Record<
    string,
    Array<{ id: string; name: string; joined_at: string }>
  > = {}
  for (const p of participantRows) {
    if (!participantsBySchedule[p.schedule_id]) {
      participantsBySchedule[p.schedule_id] = []
    }
    participantsBySchedule[p.schedule_id].push({
      id: p.user_id,
      name: pUserMap[p.user_id]?.name ?? '',
      joined_at: p.joined_at,
    })
  }

  // schedule별 mentions 그루핑
  const mentionsBySchedule: Record<
    string,
    Array<{ reference_type: 'contact' | 'company'; reference_id: string; display_name: string }>
  > = {}
  for (const m of mentionRows) {
    if (!mentionsBySchedule[m.schedule_id]) {
      mentionsBySchedule[m.schedule_id] = []
    }
    mentionsBySchedule[m.schedule_id].push({
      reference_type: m.reference_type as 'contact' | 'company',
      reference_id: m.reference_id,
      display_name: m.raw_text,
    })
  }

  const schedules = scheduleRows.map((row) => {
    const owner = row.owner_id ? (userMap[row.owner_id] as UserRow | undefined ?? null) : null
    const createdByUser = userMap[row.created_by] as UserRow | undefined ?? null
    const onBehalfOfUser = row.on_behalf_of_id
      ? (userMap[row.on_behalf_of_id] as UserRow | undefined ?? null)
      : null

    return {
      id: row.id,
      type: row.type,
      title: row.title,
      schedule_date: row.schedule_date,
      time_slot: row.time_slot,
      start_time: row.start_time,
      end_time: row.end_time,
      location: row.location,
      memo: row.memo,
      owner: owner ? { id: owner.id, name: owner.name, color: owner.color } : null,
      created_by: createdByUser
        ? { id: createdByUser.id, name: createdByUser.name }
        : { id: row.created_by, name: '' },
      on_behalf_of: onBehalfOfUser
        ? { id: onBehalfOfUser.id, name: onBehalfOfUser.name }
        : null,
      participants: participantsBySchedule[row.id] ?? [],
      mentions: mentionsBySchedule[row.id] ?? [],
      created_at: row.created_at,
      updated_at: row.updated_at,
    }
  })

  return NextResponse.json({
    data: schedules,
    meta: { total: count ?? 0, page, per_page },
    error: null,
  })
}

// ---------------------------------------------------------------------------
// POST /api/schedules
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest): Promise<NextResponse> {
  const supabase = await createUserClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return errorResponse('FORBIDDEN', '인증이 필요합니다.', 401)
  }

  let body: {
    type: string
    title: string
    schedule_date: string
    time_slot: string
    start_time?: string | null
    end_time?: string | null
    is_all_day?: boolean
    location?: string | null
    memo?: string | null
    owner_id?: string | null
    on_behalf_of_id?: string | null
    notify_user_ids?: string[]
    participant_ids?: string[]
    mentions?: Array<{ reference_type: string; reference_id: string }>
  }

  try {
    body = await request.json()
  } catch {
    return errorResponse('INTERNAL_ERROR', '유효하지 않은 요청 본문입니다.', 400)
  }

  if (!body.type || !body.title || !body.schedule_date || !body.time_slot) {
    return errorResponse(
      'INTERNAL_ERROR',
      'type, title, schedule_date, time_slot은 필수입니다.',
      400
    )
  }

  // 제목 최대 길이 초과 검증 (P3-4)
  if (body.title?.length > 200) {
    return errorResponse('INVALID_INPUT', '제목은 최대 200자까지 입력 가능합니다.', 400)
  }

  if (body.start_time && body.end_time && body.start_time >= body.end_time) {
    return errorResponse('INVALID_TIME_RANGE', '종료 시간은 시작 시간보다 이후여야 합니다.', 400)
  }

  if (body.type === 'personal' && !body.owner_id) {
    return errorResponse('INTERNAL_ERROR', 'personal 일정은 owner_id가 필수입니다.', 400)
  }

  // 공통 일정 참가자 필수 검증 (P3-5)
  if (body.type === 'common' && (!body.participant_ids || body.participant_ids.length === 0)) {
    return errorResponse('INVALID_INPUT', '공통 일정은 참가자를 1명 이상 선택해야 합니다.', 400)
  }

  if (body.on_behalf_of_id) {
    const { data: proxy } = await supabase
      .from('proxy_permissions')
      .select('id')
      .eq('proxy_user_id', user.id)
      .eq('target_user_id', body.on_behalf_of_id)
      .is('revoked_at', null)
      .maybeSingle()

    if (!proxy) {
      return errorResponse('NO_PROXY_PERMISSION', '대리 입력 권한이 없습니다.', 403)
    }
  }

  const insertData: ScheduleInsert = {
    type: body.type,
    title: body.title,
    schedule_date: body.schedule_date,
    time_slot: body.time_slot,
    start_time: body.start_time ?? null,
    end_time: body.end_time ?? null,
    is_all_day: body.is_all_day ?? false,
    location: body.location ?? null,
    memo: body.memo ?? null,
    owner_id: body.owner_id ?? null,
    on_behalf_of_id: body.on_behalf_of_id ?? null,
    created_by: user.id,
  }

  const { data: scheduleRaw, error: scheduleError } = await supabase
    .from('schedules')
    .insert(insertData as never)
    .select('id')
    .single()

  if (scheduleError || !scheduleRaw) {
    return errorResponse('INTERNAL_ERROR', scheduleError?.message ?? 'INSERT 실패', 500)
  }

  const schedule = scheduleRaw as unknown as Pick<ScheduleRow, 'id'>

  if (body.participant_ids && body.participant_ids.length > 0) {
    const { error: pError } = await supabase
      .from('schedule_participants')
      .insert(
        body.participant_ids.map((uid) => ({
          schedule_id: schedule.id,
          user_id: uid,
          added_by: user.id,
        })) as never
      )

    if (pError) {
      await supabase
        .from('schedules')
        .update({ deleted_at: new Date().toISOString(), deleted_by: user.id } as never)
        .eq('id', schedule.id)
      return errorResponse('INTERNAL_ERROR', pError.message, 500)
    }
  }

  if (body.mentions && body.mentions.length > 0) {
    const { error: mError } = await supabase
      .from('mentions')
      .insert(
        body.mentions.map((m) => ({
          schedule_id: schedule.id,
          reference_type: m.reference_type,
          reference_id: m.reference_id,
          raw_text: `@${m.reference_id}`,
        })) as never
      )

    if (mError) {
      await supabase
        .from('schedules')
        .update({ deleted_at: new Date().toISOString(), deleted_by: user.id } as never)
        .eq('id', schedule.id)
      return errorResponse('INTERNAL_ERROR', mError.message, 500)
    }
  }

  // 생성된 일정 조회해서 반환
  type ScheduleListRow = Pick<
    ScheduleRow,
    | 'id' | 'type' | 'title' | 'schedule_date' | 'time_slot' | 'start_time' | 'end_time'
    | 'is_all_day' | 'location' | 'memo' | 'created_at' | 'updated_at'
    | 'owner_id' | 'created_by' | 'on_behalf_of_id'
  >
  type UserRow = Pick<Tables<'users'>, 'id' | 'name' | 'color'>
  type SpRow = Pick<Tables<'schedule_participants'>, 'user_id' | 'joined_at'>
  type MentionRow = Pick<Tables<'mentions'>, 'reference_type' | 'reference_id' | 'raw_text'>

  const { data: createdRaw, error: fetchError } = await supabase
    .from('schedules')
    .select(
      'id, type, title, schedule_date, time_slot, start_time, end_time, is_all_day, location, memo, created_at, updated_at, owner_id, created_by, on_behalf_of_id'
    )
    .eq('id', schedule.id)
    .is('deleted_at', null)
    .single()

  if (fetchError || !createdRaw) {
    return errorResponse('INTERNAL_ERROR', fetchError?.message ?? 'FETCH 실패', 500)
  }

  const created = createdRaw as unknown as ScheduleListRow

  const userIds = [
    ...new Set(
      [created.owner_id, created.created_by, created.on_behalf_of_id].filter(
        (id): id is string => id !== null
      )
    ),
  ]

  const { data: userRawRows } = userIds.length > 0
    ? await supabase.from('users').select('id, name, color').in('id', userIds)
    : { data: [] as never[] }
  const userMap = Object.fromEntries(
    ((userRawRows ?? []) as unknown as UserRow[]).map((u) => [u.id, u])
  )

  const { data: pRawRows } = await supabase
    .from('schedule_participants')
    .select('user_id, joined_at')
    .eq('schedule_id', schedule.id)
    .eq('status', 'joined')
  const spRows = (pRawRows ?? []) as unknown as SpRow[]

  const participantUserIds = spRows.map((p) => p.user_id)
  const { data: pUserRaw } = participantUserIds.length > 0
    ? await supabase.from('users').select('id, name').in('id', participantUserIds)
    : { data: [] as never[] }
  type PUserRow = Pick<Tables<'users'>, 'id' | 'name'>
  const pUserMap = Object.fromEntries(
    ((pUserRaw ?? []) as unknown as PUserRow[]).map((u) => [u.id, u])
  )

  const { data: mRawRows } = await supabase
    .from('mentions')
    .select('reference_type, reference_id, raw_text')
    .eq('schedule_id', schedule.id)
  const mentionRows = (mRawRows ?? []) as unknown as MentionRow[]

  const owner = created.owner_id ? (userMap[created.owner_id] as UserRow | undefined ?? null) : null
  const createdByUser = userMap[created.created_by] as UserRow | undefined ?? null
  const onBehalfOfUser = created.on_behalf_of_id
    ? (userMap[created.on_behalf_of_id] as UserRow | undefined ?? null)
    : null

  const responseData = {
    id: created.id,
    type: created.type,
    title: created.title,
    schedule_date: created.schedule_date,
    time_slot: created.time_slot,
    start_time: created.start_time,
    end_time: created.end_time,
    is_all_day: created.is_all_day,
    location: created.location,
    memo: created.memo,
    owner: owner ? { id: owner.id, name: owner.name, color: owner.color } : null,
    created_by: createdByUser
      ? { id: createdByUser.id, name: createdByUser.name }
      : { id: created.created_by, name: '' },
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
    created_at: created.created_at,
    updated_at: created.updated_at,
  }

  return NextResponse.json({ data: responseData, error: null }, { status: 201 })
}
