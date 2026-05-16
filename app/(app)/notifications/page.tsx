import { createUserClient } from '@/app/_lib/supabase/server'
import { NotificationList } from '@/components/notifications/notification-list'

type NotifRow = {
  id: string
  event_type: string
  payload: unknown
  target_type: string | null
  target_id: string | null
  sent_at: string | null
  read_at: string | null
}

const KNOWN_EVENT_TYPES = new Set([
  'common_schedule_created',
  'common_schedule_updated',
  'schedule_updated_by_other',
  'invite',
  'password_reset',
])

type KnownEventType = 'common_schedule_created' | 'common_schedule_updated' | 'schedule_updated_by_other' | 'invite' | 'password_reset'

export default async function NotificationsPage() {
  type NotifItem = {
    id: string
    event_type: KnownEventType
    payload: { title: string; actor?: string }
    target_type: 'schedule' | 'user' | null
    target_id: string | null
    sent_at: string
    read_at: string | null
  }

  let initialItems: NotifItem[] | undefined = undefined

  try {
    const supabase = await createUserClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (user) {
      const { data: rawNotifs } = await supabase
        .from('notification_logs')
        .select('id, event_type, payload, target_type, target_id, sent_at, read_at')
        .eq('recipient_id', user.id)
        .not('sent_at', 'is', null)
        .order('sent_at', { ascending: false })
        .limit(50)

      const notifRows = (rawNotifs ?? []) as unknown as NotifRow[]

      initialItems = notifRows
        .filter((n) => n.sent_at !== null && KNOWN_EVENT_TYPES.has(n.event_type))
        .map((n): NotifItem => ({
          id: n.id,
          event_type: n.event_type as KnownEventType,
          payload: (n.payload ?? { title: '' }) as { title: string; actor?: string },
          target_type: n.target_type === 'schedule' ? 'schedule'
            : n.target_type === 'user' ? 'user'
            : null,
          target_id: n.target_id,
          sent_at: n.sent_at as string,
          read_at: n.read_at,
        }))
    }
  } catch {
    // Supabase 연결 실패 시 컴포넌트 내부 mock 데이터로 fallback
  }

  return <NotificationList initialItems={initialItems} />
}
