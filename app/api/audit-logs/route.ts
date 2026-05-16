import { NextResponse } from 'next/server'
import { createUserClient } from '@/app/_lib/supabase/server'
import type { Tables } from '@/app/_lib/supabase/types'

type AuditRow = Tables<'audit_logs'>
type UserSnap = Pick<Tables<'users'>, 'id' | 'name'>

// GET /api/audit-logs
// 일정 이력 타임라인 조회 (불변 로그)
export async function GET(request: Request) {
  const supabase = await createUserClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json(
      { data: null, error: { code: 'UNAUTHORIZED', message: '인증이 필요합니다' } },
      { status: 401 }
    )
  }

  const { searchParams } = new URL(request.url)
  const target_type = searchParams.get('target_type')
  const target_id = searchParams.get('target_id')
  const page = parseInt(searchParams.get('page') ?? '1', 10)
  const per_page = parseInt(searchParams.get('per_page') ?? '50', 10)

  if (!target_type || !target_id) {
    return NextResponse.json(
      { data: null, error: { code: 'INVALID_INPUT', message: 'target_type과 target_id는 필수입니다' } },
      { status: 400 }
    )
  }

  const validTypes = ['schedule', 'contact', 'company', 'proxy_permission', 'holiday', 'user']
  if (!validTypes.includes(target_type)) {
    return NextResponse.json(
      { data: null, error: { code: 'INVALID_INPUT', message: `target_type은 ${validTypes.join(', ')} 중 하나여야 합니다` } },
      { status: 400 }
    )
  }

  const from = (page - 1) * per_page

  const { data: rawData, error, count } = await supabase
    .from('audit_logs')
    .select(
      'id, target_type, target_id, action, actor_id, actor_name_snapshot, on_behalf_of_id, on_behalf_of_name_snapshot, before_data, after_data, created_at',
      { count: 'exact' }
    )
    .eq('target_type', target_type)
    .eq('target_id', target_id)
    .order('created_at', { ascending: false })
    .range(from, from + per_page - 1)

  if (error) {
    return NextResponse.json(
      { data: null, error: { code: 'INTERNAL_ERROR', message: error.message } },
      { status: 500 }
    )
  }

  type AuditRowPick = Pick<AuditRow, 'id' | 'target_type' | 'target_id' | 'action' | 'actor_id' | 'actor_name_snapshot' | 'on_behalf_of_id' | 'on_behalf_of_name_snapshot' | 'before_data' | 'after_data' | 'created_at'>
  const logs = (rawData ?? []) as unknown as AuditRowPick[]

  // actor 및 on_behalf_of 정보 조회
  const actorIds = logs
    .map((l) => l.actor_id)
    .filter((id): id is string => id !== null)

  const onBehalfIds = logs
    .map((l) => l.on_behalf_of_id)
    .filter((id): id is string => id !== null)

  const allUserIds = [...new Set([...actorIds, ...onBehalfIds])]

  let userMap: Record<string, UserSnap> = {}
  if (allUserIds.length > 0) {
    const { data: usersRaw } = await supabase
      .from('users')
      .select('id, name')
      .in('id', allUserIds)
    const users = (usersRaw ?? []) as unknown as UserSnap[]
    userMap = Object.fromEntries(users.map((u) => [u.id, u]))
  }

  const formatted = logs.map((log) => ({
    id: log.id,
    target_type: log.target_type,
    target_id: log.target_id,
    action: log.action,
    actor: log.actor_id
      ? userMap[log.actor_id] ?? { id: log.actor_id, name: log.actor_name_snapshot ?? '' }
      : null,
    on_behalf_of: log.on_behalf_of_id
      ? userMap[log.on_behalf_of_id] ?? { id: log.on_behalf_of_id, name: log.on_behalf_of_name_snapshot ?? '' }
      : null,
    before_data: log.before_data,
    after_data: log.after_data,
    created_at: log.created_at,
  }))

  return NextResponse.json({
    data: formatted,
    meta: { total: count ?? 0 },
    error: null,
  })
}
