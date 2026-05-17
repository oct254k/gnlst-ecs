'use client'

import { useState, useEffect } from 'react'
import { Icon } from '@/components/ui/icon'
import { Badge } from '@/components/ui/badge'
import { RelationshipPopover } from '@/components/contacts/relationship-popover'
import { createBrowserClientInstance } from '@/app/_lib/supabase/client'
import type { ScheduleWithParticipants, AuditLogEntry, RelationshipHistory } from '@/lib/types'

// MOCK_SCHEDULES 는 다른 파일의 import를 깨지 않기 위해 빈 배열로 유지
export const MOCK_SCHEDULES: ScheduleWithParticipants[] = []

const TIME_SLOT_LABELS: Record<string, string> = {
  morning: '오전',
  lunch: '점심',
  afternoon: '오후',
  evening: '저녁',
  allday: '전일',
}

const WEEKDAY_KO = ['일', '월', '화', '수', '목', '금', '토']

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00')
  const w = WEEKDAY_KO[d.getDay()]
  return `${dateStr.replace(/-/g, '.')} (${w})`
}

function actionLabel(action: AuditLogEntry['action']): string {
  return action === 'created' ? '등록' : action === 'updated' ? '수정' : '삭제'
}

function actionTone(
  action: AuditLogEntry['action'],
): 'success' | 'info' | 'danger' {
  return action === 'created'
    ? 'success'
    : action === 'updated'
      ? 'info'
      : 'danger'
}

interface ScheduleDetailModalProps {
  scheduleId: string
  onClose: () => void
  onEdit: (id: string) => void
  onDelete: (id: string, scheduleType: 'personal' | 'common', participantCount: number) => void
}

export function ScheduleDetailModal({
  scheduleId,
  onClose,
  onEdit,
  onDelete,
}: ScheduleDetailModalProps) {
  const [tab, setTab] = useState<'body' | 'audit'>('body')
  const [schedule, setSchedule] = useState<ScheduleWithParticipants | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [currentUserRole, setCurrentUserRole] = useState<'admin' | 'user'>('user')
  const [participantLoading, setParticipantLoading] = useState(false)

  type MentionTarget = { id: string; name: string; type: 'contact' | 'company' }
  const [popoverTarget, setPopoverTarget] = useState<MentionTarget | null>(null)
  const [popoverRect, setPopoverRect] = useState<DOMRect | null>(null)
  const [popoverHistory, setPopoverHistory] = useState<RelationshipHistory | null>(null)
  const [popoverLoading, setPopoverLoading] = useState(false)
  const [popoverError, setPopoverError] = useState<string | null>(null)

  async function fetchMentionHistory(target: MentionTarget) {
    setPopoverLoading(true)
    setPopoverError(null)
    try {
      const res = await fetch(`/api/relationships?reference_type=${target.type}&reference_id=${target.id}`)
      if (!res.ok) throw new Error()
      const json = await res.json()
      const h = json.data as RelationshipHistory | null
      setPopoverHistory(h && h.total_count > 0 ? h : null)
    } catch {
      setPopoverError('이력을 불러오지 못했습니다')
      setPopoverHistory(null)
    } finally {
      setPopoverLoading(false)
    }
  }

  function handleMentionClick(target: MentionTarget, rect: DOMRect) {
    setPopoverTarget(target)
    setPopoverRect(rect)
    setPopoverHistory(null)
    setPopoverError(null)
    fetchMentionHistory(target)
  }

  useEffect(() => {
    const supabase = createBrowserClientInstance()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setCurrentUserId(user.id)
        setCurrentUserRole(
          user.user_metadata?.role === 'admin' ? 'admin' : 'user',
        )
      }
    })
  }, [])

  useEffect(() => {
    setLoading(true)
    setError(null)
    fetch(`/api/schedules/${scheduleId}`)
      .then((r) => r.json())
      .then((json) => {
        if (json.error) {
          setError(json.error.message ?? '일정을 불러올 수 없습니다')
        } else {
          setSchedule(json.data as ScheduleWithParticipants)
        }
      })
      .catch(() => setError('일정을 불러올 수 없습니다'))
      .finally(() => setLoading(false))
  }, [scheduleId])

  async function reloadSchedule() {
    const json = await fetch(`/api/schedules/${scheduleId}`).then((r) => r.json())
    if (!json.error) {
      setSchedule(json.data as ScheduleWithParticipants)
    }
  }

  async function handleJoin() {
    if (!currentUserId || participantLoading) return
    setParticipantLoading(true)
    try {
      await fetch(`/api/schedules/${scheduleId}/participants`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: currentUserId }),
      })
      await reloadSchedule()
    } finally {
      setParticipantLoading(false)
    }
  }

  async function handleLeave() {
    if (!currentUserId || participantLoading) return
    setParticipantLoading(true)
    try {
      await fetch(`/api/schedules/${scheduleId}/participants/me`, {
        method: 'DELETE',
      })
      await reloadSchedule()
    } finally {
      setParticipantLoading(false)
    }
  }

  if (loading) {
    return (
      <>
        <div className="backdrop" onClick={onClose} />
        <div className="modal modal-sm" role="dialog">
          <div className="modal-hd">
            <h2 className="modal-hd-title">일정 상세</h2>
            <button
              className="btn btn-tertiary btn-icon"
              onClick={onClose}
              aria-label="닫기"
            >
              <Icon name="x" />
            </button>
          </div>
          <div className="modal-bd">
            <div className="empty">
              <div className="msg">불러오는 중...</div>
            </div>
          </div>
        </div>
      </>
    )
  }

  if (error || !schedule) {
    return (
      <>
        <div className="backdrop" onClick={onClose} />
        <div className="modal modal-sm" role="dialog">
          <div className="modal-hd">
            <h2 className="modal-hd-title">일정 상세</h2>
            <button
              className="btn btn-tertiary btn-icon"
              onClick={onClose}
              aria-label="닫기"
            >
              <Icon name="x" />
            </button>
          </div>
          <div className="modal-bd">
            <div className="empty">
              <div className="msg">{error ?? '일정을 찾을 수 없습니다'}</div>
            </div>
          </div>
          <div className="modal-ft">
            <button className="btn btn-primary" onClick={onClose}>
              닫기
            </button>
          </div>
        </div>
      </>
    )
  }

  const isCommon = schedule.type === 'common'
  const isAdmin = currentUserRole === 'admin'
  const isProxy =
    schedule.on_behalf_of !== null ||
    (schedule.created_by.id !== schedule.owner?.id && !isCommon)
  const isJoined = isCommon
    ? schedule.participants.some((p) => p.id === currentUserId)
    : false

  const canEditOrDelete =
    isAdmin ||
    schedule.owner?.id === currentUserId ||
    schedule.created_by.id === currentUserId

  const auditLogs = schedule.recent_audit_logs ?? []

  return (
    <>
      <div className="backdrop" onClick={onClose} />
      <div className="modal" role="dialog" aria-labelledby="schedule-detail-title">
        {/* 헤더 */}
        <div className="modal-hd">
          <div className="flex items-center gap-2" style={{ flex: 1 }}>
            {isCommon ? (
              <Badge tone="accent">공통</Badge>
            ) : (
              <Badge tone="neutral">개인</Badge>
            )}
            <h2 className="modal-hd-title" id="schedule-detail-title">
              {schedule.title}
            </h2>
            {isAdmin && isProxy && <Badge tone="warn">대리 입력</Badge>}
          </div>
          <button
            className="btn btn-tertiary btn-icon"
            onClick={onClose}
            aria-label="닫기"
          >
            <Icon name="x" />
          </button>
        </div>

        {/* 탭 */}
        <div
          style={{
            padding: '0 var(--sp-5)',
            borderBottom: '1px solid var(--c-border)',
          }}
        >
          <div className="flex gap-1">
            <button
              className={`tab-btn ${tab === 'body' ? 'on' : ''}`}
              onClick={() => setTab('body')}
            >
              본문
            </button>
            <button
              className={`tab-btn ${tab === 'audit' ? 'on' : ''}`}
              onClick={() => setTab('audit')}
            >
              이력 ({auditLogs.length})
            </button>
          </div>
        </div>

        {/* 바디 */}
        <div className="modal-bd">
          {tab === 'body' && (
            <>
              <div className="detail-grid">
                {/* 날짜 */}
                <div className="detail-row">
                  <div className="detail-lbl">
                    <Icon name="cal" size={12} /> 날짜
                  </div>
                  <div className="detail-val tnum">
                    {formatDate(schedule.schedule_date)}
                  </div>
                </div>
                {/* 시간대 */}
                <div className="detail-row">
                  <div className="detail-lbl">시간대</div>
                  <div className="detail-val flex items-center gap-2">
                    <Badge tone="neutral">
                      {TIME_SLOT_LABELS[schedule.time_slot] ?? schedule.time_slot}
                    </Badge>
                    {!schedule.is_all_day && schedule.start_time && (
                      <span className="tnum">
                        {schedule.start_time} ~ {schedule.end_time}
                      </span>
                    )}
                  </div>
                </div>
                {/* 장소 */}
                <div className="detail-row">
                  <div className="detail-lbl">
                    <Icon name="location" size={12} /> 장소
                  </div>
                  <div className="detail-val">{schedule.location || '—'}</div>
                </div>
                {/* 일정 주인 (개인) */}
                {schedule.owner && (
                  <div className="detail-row">
                    <div className="detail-lbl">
                      <Icon name="user" size={12} /> 일정 주인
                    </div>
                    <div className="detail-val flex items-center gap-2">
                      <span
                        className="color-dot"
                        style={{ background: schedule.owner.color ?? undefined }}
                      />
                      <b>{schedule.owner.name}</b>
                    </div>
                  </div>
                )}
                {/* 참가자 (공통) */}
                {isCommon && (
                  <div className="detail-row">
                    <div className="detail-lbl">
                      <Icon name="users" size={12} /> 참가자
                    </div>
                    <div className="detail-val">
                      <div
                        className="flex gap-1"
                        style={{ flexWrap: 'wrap' }}
                      >
                        {schedule.participants.map((p) => (
                          <span key={p.id} className="chip">
                            {p.name}
                          </span>
                        ))}
                        {schedule.participants.length === 0 && (
                          <span className="muted text-sm">참가자 없음</span>
                        )}
                      </div>
                    </div>
                  </div>
                )}
                {/* 작성자 */}
                <div className="detail-row">
                  <div className="detail-lbl">
                    <Icon name="edit" size={12} /> 작성자
                  </div>
                  <div className="detail-val flex items-center gap-2">
                    {schedule.created_by.name}
                    {isProxy && isAdmin && <Badge tone="warn">대리</Badge>}
                  </div>
                </div>
              </div>

              {/* 비고 */}
              {schedule.memo && (
                <>
                  <hr className="divider" />
                  <div className="field-label mb-2">비고</div>
                  <div
                    style={{
                      padding: '10px 12px',
                      background: 'var(--c-panel-alt)',
                      borderRadius: 'var(--rd-md)',
                      fontSize: 12,
                      lineHeight: 1.6,
                    }}
                  >
                    {schedule.memo}
                  </div>
                </>
              )}

              {/* 관련 연락처 */}
              {schedule.mentions && schedule.mentions.length > 0 && (
                <>
                  <hr className="divider" />
                  <div className="field-label mb-2">관련 연락처</div>
                  <div className="flex gap-1" style={{ flexWrap: 'wrap' }}>
                    {schedule.mentions.map((m) => (
                      <button
                        key={m.reference_id}
                        type="button"
                        className="chip"
                        style={{ cursor: 'pointer', fontWeight: 400 }}
                        onClick={(e) => {
                          const rect = e.currentTarget.getBoundingClientRect()
                          handleMentionClick(
                            { id: m.reference_id, name: m.display_name, type: m.reference_type },
                            rect,
                          )
                        }}
                      >
                        @{m.display_name}
                      </button>
                    ))}
                  </div>
                </>
              )}

              {/* 공통: 참가하기 버튼 */}
              {isCommon && (
                <>
                  <hr className="divider" />
                  <div className="flex items-center gap-2">
                    {isJoined ? (
                      <button
                        className="btn btn-secondary btn-sm"
                        type="button"
                        onClick={handleLeave}
                        disabled={participantLoading}
                      >
                        <Icon name="x" size={12} /> 참가 취소
                      </button>
                    ) : (
                      <button
                        className="btn btn-primary btn-sm"
                        type="button"
                        onClick={handleJoin}
                        disabled={participantLoading}
                      >
                        <Icon name="plus" size={12} /> 참가하기
                      </button>
                    )}
                    <span className="muted text-sm">
                      {isJoined ? '참가 중' : '본인 추가 가능'}
                    </span>
                  </div>
                </>
              )}
            </>
          )}

          {/* 이력 탭 */}
          {tab === 'audit' && (
            <div className="audit-tl">
              {auditLogs.length === 0 && (
                <div className="empty">
                  <div className="msg">이력이 없습니다</div>
                </div>
              )}
              {auditLogs.map((log) => (
                <div key={log.id} className="audit-item">
                  <div className="audit-dot" data-action={log.action} />
                  <div className="audit-content">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge tone={actionTone(log.action)}>
                        {actionLabel(log.action)}
                      </Badge>
                      <span className="fw-6 text-sm">{log.actor.name}</span>
                      {log.on_behalf_of && (
                        <span className="muted text-sm">
                          → {log.on_behalf_of.name} 대리
                        </span>
                      )}
                      <span
                        className="muted text-sm tnum"
                        style={{ marginLeft: 'auto' }}
                      >
                        {log.created_at}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 푸터 */}
        <div className="modal-ft">
          {canEditOrDelete && (
            <>
              <button
                className="btn btn-tertiary"
                type="button"
                onClick={() => onDelete(schedule.id, schedule.type as 'personal' | 'common', schedule.participants.length)}
              >
                <Icon name="trash" size={12} /> 삭제
              </button>
              <div style={{ flex: 1 }} />
              <button
                className="btn btn-secondary"
                type="button"
                onClick={() => onEdit(schedule.id)}
              >
                수정
              </button>
            </>
          )}
          <button className="btn btn-primary" type="button" onClick={onClose}>
            닫기
          </button>
        </div>
      </div>

      {popoverTarget && (
        <RelationshipPopover
          target={popoverTarget}
          history={popoverHistory}
          loading={popoverLoading}
          error={popoverError}
          anchorRect={popoverRect}
          onRetry={() => fetchMentionHistory(popoverTarget)}
          onClose={() => setPopoverTarget(null)}
        />
      )}
    </>
  )
}
