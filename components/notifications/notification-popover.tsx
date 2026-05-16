'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Badge } from '@/components/ui/badge'

type EventType =
  | 'common_schedule_created'
  | 'common_schedule_updated'
  | 'schedule_updated_by_other'
  | 'invite'
  | 'password_reset'

interface NotifPreview {
  id: string
  event_type: EventType
  payload: { title: string }
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

const EVENT_TONE: Record<EventType, 'primary' | 'info' | 'warn' | 'accent' | 'neutral'> = {
  common_schedule_created: 'primary',
  common_schedule_updated: 'info',
  schedule_updated_by_other: 'warn',
  invite: 'accent',
  password_reset: 'neutral',
}

interface NotificationPopoverProps {
  open: boolean
  onClose: () => void
}

export function NotificationPopover({ open, onClose }: NotificationPopoverProps) {
  const router = useRouter()
  const ref = useRef<HTMLDivElement>(null)
  const [unread, setUnread] = useState<NotifPreview[]>([])
  const [count, setCount] = useState(0)

  useEffect(() => {
    if (!open) return
    fetch('/api/notifications?status=unread&per_page=5')
      .then(r => r.json())
      .then(json => {
        setUnread(json.data ?? [])
        setCount(json.meta?.unread_count ?? 0)
      })
      .catch(() => {})
  }, [open])

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose()
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open, onClose])

  const markRead = (id: string) => {
    fetch(`/api/notifications/${id}/read`, { method: 'PATCH' }).catch(() => {})
    setUnread(prev => prev.map(n => n.id === id ? { ...n, read_at: new Date().toISOString() } : n))
    setCount(prev => Math.max(0, prev - 1))
  }

  if (!open) return null

  return (
    <div
      ref={ref}
      style={{
        position: 'absolute',
        top: '100%',
        right: 0,
        marginTop: 8,
        width: 360,
        background: 'var(--c-bg)',
        border: '1px solid var(--c-divider)',
        borderRadius: 8,
        boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
        zIndex: 200,
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 16px',
          borderBottom: '1px solid var(--c-divider)',
        }}
      >
        <span className="fw-6">알림</span>
        {count > 0 && (
          <span
            style={{
              fontSize: 12,
              color: '#fff',
              background: 'var(--c-danger)',
              borderRadius: 10,
              padding: '1px 7px',
              fontWeight: 600,
            }}
          >
            {count}
          </span>
        )}
      </div>

      <div>
        {unread.length === 0 && (
          <div style={{ padding: '24px 16px', textAlign: 'center', color: 'var(--c-text-3)' }}>
            새 알림이 없습니다.
          </div>
        )}
        {unread.map(n => (
          <div
            key={n.id}
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 4,
              padding: '12px 16px',
              borderBottom: '1px solid var(--c-divider)',
              background: 'var(--c-bg-2)',
              cursor: 'pointer',
            }}
            onClick={() => { markRead(n.id); onClose() }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: '50%',
                  background: 'var(--c-accent)',
                  display: 'inline-block',
                  flexShrink: 0,
                }}
              />
              <Badge tone={EVENT_TONE[n.event_type]}>{EVENT_LABEL[n.event_type]}</Badge>
              <span className="muted text-sm" style={{ marginLeft: 'auto' }}>{n.sent_at.slice(5, 16)}</span>
            </div>
            <div className="fw-6" style={{ paddingLeft: 14 }}>{n.payload.title}</div>
          </div>
        ))}
      </div>

      <div
        style={{
          padding: '10px 16px',
          textAlign: 'center',
          borderTop: '1px solid var(--c-divider)',
        }}
      >
        <button
          className="btn btn-link btn-sm"
          onClick={() => {
            onClose()
            router.push('/notifications')
          }}
        >
          전체 알림 보기 →
        </button>
      </div>
    </div>
  )
}
