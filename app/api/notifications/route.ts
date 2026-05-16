import { NextResponse } from 'next/server'
import { createUserClient } from '@/app/_lib/supabase/server'

// GET /api/notifications
// 내 알림 목록 조회 (status='sent' AND recipient_id=현재유저)
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
  const status = searchParams.get('status') ?? 'all'
  const page = parseInt(searchParams.get('page') ?? '1', 10)
  const per_page = parseInt(searchParams.get('per_page') ?? '50', 10)

  let query = supabase
    .from('notification_logs')
    .select(
      'id, event_type, target_type, target_id, status, read_at, created_at, payload',
      { count: 'exact' }
    )
    .eq('recipient_id', user.id)
    .eq('status', 'sent')
    .order('created_at', { ascending: false })

  if (status === 'unread') {
    query = query.is('read_at', null)
  }

  const from = (page - 1) * per_page
  query = query.range(from, from + per_page - 1)

  const { data, error, count } = await query

  if (error) {
    return NextResponse.json(
      { data: null, error: { code: 'INTERNAL_ERROR', message: error.message } },
      { status: 500 }
    )
  }

  // 미확인 수 집계
  const { count: unreadCount } = await supabase
    .from('notification_logs')
    .select('id', { count: 'exact', head: true })
    .eq('recipient_id', user.id)
    .eq('status', 'sent')
    .is('read_at', null)

  return NextResponse.json({
    data,
    meta: { total: count ?? 0, page, per_page, unread_count: unreadCount ?? 0 },
    error: null,
  })
}
