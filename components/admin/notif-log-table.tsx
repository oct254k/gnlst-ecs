'use client'

import { useState, useEffect } from 'react'
import { Avatar } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Icon } from '@/components/ui/icon'

type NotifStatus = 'sent' | 'failed' | 'retrying' | 'pending'
type EventType =
  | 'common_schedule_created'
  | 'common_schedule_updated'
  | 'schedule_updated_by_other'
  | 'invite'
  | 'password_reset'

interface NotifLog {
  id: string
  event_type: EventType
  recipient: { id: string; name: string; email: string } | null
  status: NotifStatus
  attempt_count: number
  last_attempted_at: string
  error_message: string | null
}

interface NotifSummary {
  failed_count: number
  pending_count: number
  retrying_count: number
}

const EVENT_LABEL: Record<EventType, string> = {
  common_schedule_created: '공통일정 등록',
  common_schedule_updated: '공통일정 수정',
  schedule_updated_by_other: '타인 일정 수정',
  invite: '초대',
  password_reset: '비밀번호 재설정',
}

const EVENT_TONE: Record<EventType, 'primary' | 'accent' | 'info' | 'warn' | 'neutral'> = {
  common_schedule_created: 'primary',
  common_schedule_updated: 'info',
  schedule_updated_by_other: 'warn',
  invite: 'accent',
  password_reset: 'neutral',
}

function statusBadge(status: NotifStatus) {
  switch (status) {
    case 'sent':     return <Badge tone="success" dot>sent</Badge>
    case 'failed':   return <Badge tone="danger" dot>failed</Badge>
    case 'retrying': return <Badge tone="warn" dot>retrying</Badge>
    case 'pending':  return <Badge tone="neutral" dot>pending</Badge>
  }
}

export function NotifLogTable() {
  const [logs, setLogs] = useState<NotifLog[]>([])
  const [summary, setSummary] = useState<NotifSummary>({ failed_count: 0, pending_count: 0, retrying_count: 0 })
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [eventFilter, setEventFilter] = useState<string>('all')

  useEffect(() => {
    fetch('/api/admin/notification-logs')
      .then(r => r.json())
      .then(json => {
        setLogs(json.data?.logs ?? [])
        setSummary(json.data?.summary ?? { failed_count: 0, pending_count: 0, retrying_count: 0 })
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const sentCount = logs.filter(l => l.status === 'sent').length

  const filtered = logs.filter(l => {
    const matchStatus = statusFilter === 'all' || l.status === statusFilter
    const matchEvent = eventFilter === 'all' || l.event_type === eventFilter
    return matchStatus && matchEvent
  })

  return (
    <div className="list-wrap">
      <div className="page-hd">
        <div className="flex-col" style={{ minWidth: 0 }}>
          <h1 className="h1">알림 발송 이력</h1>
          <div className="sub" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            최근 · 성공 {sentCount}건 · 실패 {summary.failed_count}건
            {summary.failed_count > 0 && (
              <span style={{ color: 'var(--c-danger)', fontWeight: 600 }}>
                ❗실패 {summary.failed_count}건
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="page-body" style={{ paddingTop: 12, paddingBottom: 12 }}>
        <div className="list-toolbar">
          <div className="input-with-icon" style={{ flex: 1 }}>
            <span className="ico"><Icon name="search" size={14} /></span>
            <input className="input" placeholder="수신 이메일·이름 검색" />
          </div>
          <select
            className="select"
            style={{ width: 160 }}
            value={eventFilter}
            onChange={e => setEventFilter(e.target.value)}
          >
            <option value="all">전체 이벤트</option>
            {(Object.keys(EVENT_LABEL) as EventType[]).map(k => (
              <option key={k} value={k}>{EVENT_LABEL[k]}</option>
            ))}
          </select>
          <select
            className="select"
            style={{ width: 120 }}
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
          >
            <option value="all">전체 상태</option>
            <option value="sent">sent</option>
            <option value="failed">failed</option>
            <option value="retrying">retrying</option>
            <option value="pending">pending</option>
          </select>
        </div>
      </div>

      <div className="main-scroll">
        <div className="page-body" style={{ paddingTop: 0 }}>
          <div className="card">
            <table className="tbl">
              <thead>
                <tr>
                  <th style={{ width: 150 }}>발송 시각</th>
                  <th style={{ width: 150 }}>이벤트</th>
                  <th>수신자</th>
                  <th>수신 메일</th>
                  <th style={{ width: 90 }}>상태</th>
                  <th style={{ width: 60 }}>시도</th>
                  <th>에러</th>
                </tr>
              </thead>
              <tbody>
                {loading && (
                  <tr>
                    <td colSpan={7}>
                      <div className="empty"><div className="msg">로딩 중...</div></div>
                    </td>
                  </tr>
                )}
                {!loading && filtered.map(l => (
                  <tr
                    key={l.id}
                    style={l.status === 'failed' ? { background: '#FFF5F5' } : undefined}
                  >
                    <td className="text-sm">{l.last_attempted_at}</td>
                    <td>
                      <Badge tone={EVENT_TONE[l.event_type]}>{EVENT_LABEL[l.event_type]}</Badge>
                    </td>
                    <td>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Avatar user={{ name: l.recipient?.name ?? '—' }} size="sm" />
                        <span>{l.recipient?.name ?? '—'}</span>
                      </span>
                    </td>
                    <td className="muted text-sm">{l.recipient?.email ?? '—'}</td>
                    <td>{statusBadge(l.status)}</td>
                    <td className="text-sm" style={{ textAlign: 'right' }}>{l.attempt_count}</td>
                    <td className="muted text-sm">{l.error_message ?? '—'}</td>
                  </tr>
                ))}
                {!loading && filtered.length === 0 && (
                  <tr>
                    <td colSpan={7}>
                      <div className="empty"><div className="msg">조회 결과가 없습니다.</div></div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
