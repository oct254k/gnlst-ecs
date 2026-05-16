import { NextResponse } from 'next/server'
import { createUserClient } from '@/app/_lib/supabase/server'
import type { Tables } from '@/app/_lib/supabase/types'

type NotifRow = Tables<'notification_logs'>
type UserRow = Pick<Tables<'users'>, 'id' | 'name' | 'email'>

// GET /api/admin/notification-logs
// 알림 발송 이력 전체 조회 (admin only)
export async function GET(request: Request) {
  const supabase = await createUserClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json(
      { data: null, error: { code: 'UNAUTHORIZED', message: '인증이 필요합니다' } },
      { status: 401 }
    )
  }
  if (user.user_metadata?.role !== 'admin') {
    return NextResponse.json(
      { data: null, error: { code: 'FORBIDDEN', message: '권한이 없습니다' } },
      { status: 403 }
    )
  }

  const { searchParams } = new URL(request.url)
  const statusFilter = searchParams.get('status')
  const eventTypeFilter = searchParams.get('event_type')
  const dateFrom = searchParams.get('date_from')
  const dateTo = searchParams.get('date_to')
  const page = parseInt(searchParams.get('page') ?? '1', 10)
  const per_page = parseInt(searchParams.get('per_page') ?? '50', 10)

  let query = supabase
    .from('notification_logs')
    .select(
      'id, event_type, status, attempt_count, last_attempted_at, sent_at, error_message, created_at, recipient_id, recipient_email',
      { count: 'exact' }
    )
    .order('created_at', { ascending: false })

  if (statusFilter) query = query.eq('status', statusFilter)
  if (eventTypeFilter) query = query.eq('event_type', eventTypeFilter)
  if (dateFrom) query = query.gte('created_at', dateFrom)
  if (dateTo) query = query.lte('created_at', dateTo + 'T23:59:59Z')

  const from = (page - 1) * per_page
  query = query.range(from, from + per_page - 1)

  const { data: logsRaw, error, count } = await query

  if (error) {
    return NextResponse.json(
      { data: null, error: { code: 'INTERNAL_ERROR', message: error.message } },
      { status: 500 }
    )
  }

  type LogRow = Pick<NotifRow, 'id' | 'event_type' | 'status' | 'attempt_count' | 'last_attempted_at' | 'sent_at' | 'error_message' | 'created_at' | 'recipient_id' | 'recipient_email'>
  const logs = (logsRaw ?? []) as unknown as LogRow[]

  // 요약 집계
  const [failedResult, pendingResult, retryingResult] = await Promise.all([
    supabase.from('notification_logs').select('id', { count: 'exact', head: true }).eq('status', 'failed'),
    supabase.from('notification_logs').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
    supabase.from('notification_logs').select('id', { count: 'exact', head: true }).eq('status', 'retrying'),
  ])

  // recipient 정보를 별도 조회하여 병합
  const recipientIds = logs
    .map((l) => l.recipient_id)
    .filter((id): id is string => id !== null)

  let recipientMap: Record<string, UserRow> = {}
  if (recipientIds.length > 0) {
    const { data: usersRaw } = await supabase
      .from('users')
      .select('id, name, email')
      .in('id', recipientIds)
    const users = (usersRaw ?? []) as unknown as UserRow[]
    recipientMap = Object.fromEntries(users.map((u) => [u.id, u]))
  }

  const formattedLogs = logs.map((log) => ({
    id: log.id,
    event_type: log.event_type,
    recipient: log.recipient_id ? recipientMap[log.recipient_id] ?? null : null,
    status: log.status,
    attempt_count: log.attempt_count,
    last_attempted_at: log.last_attempted_at,
    sent_at: log.sent_at,
    error_message: log.error_message,
    created_at: log.created_at,
  }))

  return NextResponse.json({
    data: {
      summary: {
        failed_count: failedResult.count ?? 0,
        pending_count: pendingResult.count ?? 0,
        retrying_count: retryingResult.count ?? 0,
      },
      logs: formattedLogs,
    },
    meta: { total: count ?? 0, page, per_page },
    error: null,
  })
}
