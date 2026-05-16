import { Badge } from '@/components/ui/badge'
import { Icon } from '@/components/ui/icon'

type EventType =
  | 'common_schedule_created'
  | 'common_schedule_updated'
  | 'schedule_updated_by_other'
  | 'invite'
  | 'password_reset'

export interface DashNotification {
  id: string
  event_type: EventType
  sent_at: string
  read_at: string | null
  target_id: string | null
  target_type: string | null
  payload: { title: string }
}

const EVENT_TYPE_LABEL: Record<EventType, string> = {
  common_schedule_created: '공통일정 등록',
  common_schedule_updated: '공통일정 변경',
  schedule_updated_by_other: '내일정 변경',
  invite: '계정 초대',
  password_reset: '비밀번호 재설정',
}

type BadgeTone = 'primary' | 'accent' | 'neutral' | 'success' | 'warn' | 'danger' | 'info'

const EVENT_TYPE_TONE: Record<EventType, BadgeTone> = {
  common_schedule_created: 'primary',
  common_schedule_updated: 'warn',
  schedule_updated_by_other: 'info',
  invite: 'neutral',
  password_reset: 'neutral',
}

function relativeTime(sentAt: string, now: Date): string {
  const t = new Date(sentAt.replace(' ', 'T'))
  const diff = (now.getTime() - t.getTime()) / 1000
  if (diff < 60) return '방금'
  if (diff < 3600) return `${Math.floor(diff / 60)}분 전`
  if (diff < 86400) return `${Math.floor(diff / 3600)}시간 전`
  if (diff < 86400 * 2) return '어제'
  return `${Math.floor(diff / 86400)}일 전`
}

interface UpcomingNotificationsProps {
  notifications: DashNotification[]
  onItemClick: (targetId: string) => void
  now?: Date
}

export function UpcomingNotifications({
  notifications,
  onItemClick,
  now = new Date(),
}: UpcomingNotificationsProps) {
  return (
    <div className="card">
      <div className="card-hd">
        <span className="card-hd-title">
          <Icon name="bell" size={14} stroke="var(--c-accent)" />
          미확인 알림
        </span>
        <Badge tone="accent">{notifications.length}건</Badge>
      </div>
      <div className="card-bd" style={{ padding: 0 }}>
        {notifications.length === 0 ? (
          <div className="empty">
            <div className="msg">새 알림이 없습니다</div>
          </div>
        ) : (
          <ul className="dash-list">
            {notifications.map((n) => (
              <li
                key={n.id}
                onClick={() => {
                  if (n.target_type === 'schedule' && n.target_id) {
                    onItemClick(n.target_id)
                  }
                }}
              >
                <div className="flex gap-2 items-center mb-2">
                  <Badge tone={EVENT_TYPE_TONE[n.event_type]} dot>
                    {EVENT_TYPE_LABEL[n.event_type]}
                  </Badge>
                  <span className="text-sm muted-2" style={{ marginLeft: 'auto' }}>
                    {relativeTime(n.sent_at, now)}
                  </span>
                </div>
                <div className="text-sm" style={{ color: 'var(--c-text-1)' }}>
                  {n.payload.title}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
      <div className="card-ft">
        <button className="btn btn-link btn-sm">전체 알림 보기 →</button>
      </div>
    </div>
  )
}
