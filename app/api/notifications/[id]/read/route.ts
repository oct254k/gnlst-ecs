import { NextResponse } from 'next/server'
import { createUserClient } from '@/app/_lib/supabase/server'

// PATCH /api/notifications/:id/read
// 단건 알림 읽음 처리 (read_at = now(), 본인 알림만)
export async function PATCH(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createUserClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json(
      { data: null, error: { code: 'UNAUTHORIZED', message: '인증이 필요합니다' } },
      { status: 401 }
    )
  }

  const { id } = await params
  const now = new Date().toISOString()

  const { data, error } = await supabase
    .from('notification_logs')
    .update({ read_at: now } as never)
    .eq('id', id)
    .eq('recipient_id', user.id)
    .eq('status', 'sent')
    .is('read_at', null)
    .select('id, read_at')
    .single()

  if (error) {
    return NextResponse.json(
      { data: null, error: { code: 'NOT_FOUND', message: '알림을 찾을 수 없습니다' } },
      { status: 404 }
    )
  }

  return NextResponse.json({ data, error: null })
}
