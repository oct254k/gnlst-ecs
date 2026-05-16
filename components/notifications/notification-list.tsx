'use client'

import { useEffect, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Segment } from '@/components/ui/segment'

type EventType =
  | 'common_schedule_created'
  | 'common_schedule_updated'
  | 'schedule_updated_by_other'
  | 'invite'
  | 'password_reset'

interface NotifItem {
  id: string
  event_type: EventType
  payload: { title: string; actor?: string }
  target_type: 'schedule' | 'user' | null
  target_id: string | null
  sent_at: string
  read_at: string | null
}

const EVENT_LABEL: Record<EventType, string> = {
  common_schedule_created: '공통일정 등록',
  common_schedule_updated: '공통일정 수정',
  schedule_updated_by_other: '내 일정 변경',
  invite: '초대',
  password_reset: '비밀번호',
}

const EVENT_TONE: Record<EventType, 'primary' | 'accent' | 'info' | 'warn' | 'neutral'> = {
  common_schedule_created: 'primary',
  common_schedule_updated: 'info',
  schedule_updated_by_other: 'warn',
  invite: 'accent',
  password_reset: 'neutral',
}

interface NotificationListProps {
  initialItems?: NotifItem[]
}

export function NotificationList({ initialItems }: NotificationListProps = {}) {
  const [items, setItems] = useState<NotifItem[]>(initialItems ?? [])
  const [filter, setFilter] = useState<'unread' | 'all'>('unread')

  useEffect(() => {
    if (initialItems) {
      setItems(initialItems)
      return
    }
    fetch('/api/notifications?status=all')
      .then(r => r.json())
      .then(json => setItems(json.data ?? []))
      .catch(() => {})
  }, [initialItems])

  const unreadCount = items.filter(n => n.read_at === null).length

  const displayed = filter === 'unread'
    ? items.filter(n => n.read_at === null)
    : items

  const markAllRead = () => {
    fetch('/api/notifications/read-all', { method: 'PATCH' }).catch(() => {})
    setItems(prev =>
      prev.map(n => n.read_at === null ? { ...n, read_at: new Date().toISOString() } : n)
    )
  }

  const markRead = (id: string) => {
    fetch(`/api/notifications/${id}/read`, { method: 'PATCH' }).catch(() => {})
    setItems(prev =>
      prev.map(n => n.id === id && n.read_at === null ? { ...n, read_at: new Date().toISOString() } : n)
    )
  }

  return (
    <div className="list-wrap">
      <div className="page-hd">
        <div className="flex-col" style={{ minWidth: 0 }}>
          <h1 className="h1">알림</h1>
          <div className="sub">전체 {items.length}건 · 미확인 {unreadCount}건</div>
        </div>
        <div className="page-hd-actions">
          <button className="btn btn-secondary btn-sm" onClick={markAllRead}>
            모두 읽음 처리
          </button>
        </div>
      </div>

      <div className="page-body" style={{ paddingTop: 12, paddingBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Segment
            value={filter}
            onChange={v => setFilter(v as 'unread' | 'all')}
            options={[
              { value: 'unread', label: `미확인 (${unreadCount})` },
              { value: 'all',    label: `전체 (${items.length})` },
            ]}
          />
          <select className="select" style={{ width: 160 }}>
            <option>전체 유형</option>
          </select>
          <select className="select" style={{ width: 140 }}>
            <option>최근 7일</option>
            <option>최근 30일</option>
          </select>
        </div>
      </div>

      <div className="main-scroll">
        <div className="page-body" style={{ paddingTop: 0 }}>
          <div className="card">
            {displayed.length === 0 && (
              <div className="empty">
                <div className="msg">알림이 없습니다</div>
              </div>
            )}
            {displayed.map(n => (
              <div
                key={n.id}
                onClick={() => markRead(n.id)}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 12,
                  padding: '14px 16px',
                  borderBottom: '1px solid var(--c-divider)',
                  cursor: 'pointer',
                  background: n.read_at === null ? 'var(--c-bg-2)' : 'transparent',
                  transition: 'background 0.15s',
                }}
              >
                {n.read_at === null && (
                  <span
                    style={{
                      display: 'inline-block',
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      background: 'var(--c-accent)',
                      flexShrink: 0,
                      marginTop: 6,
                    }}
                  />
                )}
                {n.read_at !== null && (
                  <span style={{ width: 8, flexShrink: 0 }} />
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                    <Badge tone={EVENT_TONE[n.event_type]}>{EVENT_LABEL[n.event_type]}</Badge>
                    <span className="muted text-sm">{n.sent_at}</span>
                  </div>
                  <div className="fw-6">{n.payload.title}</div>
                  {n.payload.actor && (
                    <div className="muted text-sm" style={{ marginTop: 4 }}>
                      변경자: {n.payload.actor}
                    </div>
                  )}
                </div>
                {n.target_type === 'schedule' && (
                  <button className="btn btn-link btn-sm" style={{ flexShrink: 0 }}>
                    일정 보기 →
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
