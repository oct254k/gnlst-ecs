'use server'

import { createUserClient } from '@/app/_lib/supabase/server'

// markAsRead: 단건 알림 읽음 처리
export async function markAsRead(
  notificationId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createUserClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { success: false, error: '인증이 필요합니다' }
  }

  const now = new Date().toISOString()

  const { error } = await supabase
    .from('notification_logs')
    .update({ read_at: now } as never)
    .eq('id', notificationId)
    .eq('recipient_id', user.id)
    .eq('status', 'sent')
    .is('read_at', null)

  if (error) {
    return { success: false, error: error.message }
  }

  return { success: true }
}

// markAllAsRead: 내 전체 알림 읽음 처리
export async function markAllAsRead(): Promise<{ success: boolean; error?: string }> {
  const supabase = await createUserClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { success: false, error: '인증이 필요합니다' }
  }

  const now = new Date().toISOString()

  const { error } = await supabase
    .from('notification_logs')
    .update({ read_at: now } as never)
    .eq('recipient_id', user.id)
    .eq('status', 'sent')
    .is('read_at', null)

  if (error) {
    return { success: false, error: error.message }
  }

  return { success: true }
}
