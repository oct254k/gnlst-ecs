import { NextResponse } from 'next/server'
import { createUserClient } from '@/app/_lib/supabase/server'

// PATCH /api/notifications/read-all
// 내 전체 알림 읽음 처리
export async function PATCH() {
  const supabase = await createUserClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json(
      { data: null, error: { code: 'UNAUTHORIZED', message: '인증이 필요합니다' } },
      { status: 401 }
    )
  }

  const now = new Date().toISOString()

  const { data, error } = await supabase
    .from('notification_logs')
    .update({ read_at: now } as never)
    .eq('recipient_id', user.id)
    .eq('status', 'sent')
    .is('read_at', null)
    .select('id')

  if (error) {
    return NextResponse.json(
      { data: null, error: { code: 'INTERNAL_ERROR', message: error.message } },
      { status: 500 }
    )
  }

  return NextResponse.json({
    data: { updated_count: data?.length ?? 0 },
    error: null,
  })
}
