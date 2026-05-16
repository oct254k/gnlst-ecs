'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Icon } from '@/components/ui/icon'
import { Segment } from '@/components/ui/segment'
import { createBrowserClientInstance } from '@/app/_lib/supabase/client'
import { createSchedule, updateSchedule } from '@/lib/actions/schedules'
import type { ScheduleType, TimeSlot } from '@/lib/types'

interface ExecUser {
  id: string
  name: string
  color: string
}

interface ProxyTarget {
  id: string
  name: string
}

interface ScheduleFormModalProps {
  /** 수정 시 기존 일정 ID */
  editId?: string
  initialType?: ScheduleType
  initialDate?: string
  onClose: () => void
  onSaved?: () => void
}

export function ScheduleFormModal({
  editId,
  initialType,
  initialDate,
  onClose,
  onSaved,
}: ScheduleFormModalProps) {
  const router = useRouter()
  const isEdit = !!editId

  const [currentUserId, setCurrentUserId] = useState('')
  useEffect(() => {
    const supabase = createBrowserClientInstance()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) setCurrentUserId(user.id)
    })
  }, [])

  // 폼 필드 상태
  const [type, setType] = useState<ScheduleType>(initialType ?? 'personal')
  const [ownerId, setOwnerId] = useState<string>('')
  const [title, setTitle] = useState('')
  const [date, setDate] = useState(initialDate ?? '2026-05-15')
  const [isAllDay, setIsAllDay] = useState(false)
  const [slot, setSlot] = useState<TimeSlot>('morning')
  const [startTime, setStartTime] = useState('09:00')
  const [endTime, setEndTime] = useState('10:00')
  const [location, setLocation] = useState('')
  const [memo, setMemo] = useState('')
  const [participantIds, setParticipantIds] = useState<string[]>([])
  const [toast, setToast] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  // 임원 목록 + 대리 권한 목록
  const [execUsers, setExecUsers] = useState<ExecUser[]>([])
  const [proxyTargets, setProxyTargets] = useState<ProxyTarget[]>([])

  // 임원 목록 + 대리 권한 fetch
  useEffect(() => {
    fetch('/api/users/executives')
      .then((r) => r.json())
      .then((json) => setExecUsers(json.data ?? []))
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (!currentUserId) return
    fetch('/api/proxy-permissions?active=true')
      .then((r) => r.json())
      .then((json) => {
        const targets = (json.data ?? [])
          .filter((p: { proxy_user: { id: string }; target_user: ProxyTarget }) =>
            p.proxy_user?.id === currentUserId,
          )
          .map((p: { target_user: ProxyTarget }) => p.target_user)
        setProxyTargets(targets)
      })
      .catch(() => {})
  }, [currentUserId])

  // currentUserId 로드되면 ownerId 기본값 설정 (수정 모드가 아닐 때)
  useEffect(() => {
    if (!isEdit && currentUserId && !ownerId) setOwnerId(currentUserId)
  }, [currentUserId, isEdit, ownerId])

  // 수정 모드: 기존 일정 데이터 fetch
  useEffect(() => {
    if (!editId) return
    fetch(`/api/schedules/${editId}`)
      .then((r) => r.json())
      .then((json) => {
        if (json.error || !json.data) return
        const s = json.data
        setType(s.type ?? 'personal')
        setOwnerId(s.owner?.id ?? '')
        setTitle(s.title ?? '')
        setDate(s.schedule_date ?? '')
        setIsAllDay(s.is_all_day ?? false)
        setSlot(s.time_slot ?? 'morning')
        setStartTime(s.start_time ?? '09:00')
        setEndTime(s.end_time ?? '10:00')
        setLocation(s.location ?? '')
        setMemo(s.memo ?? '')
        setParticipantIds(s.participants?.map((p: { id: string }) => p.id) ?? [])
      })
      .catch(() => {})
  }, [editId])

  // 시간 입력 시 시간대 자동 매핑
  useEffect(() => {
    if (isAllDay || !startTime) return
    const [h] = startTime.split(':').map(Number)
    if (h < 12) setSlot('morning')
    else if (h < 14) setSlot('lunch')
    else if (h < 18) setSlot('afternoon')
    else setSlot('evening')
  }, [startTime, isAllDay])

  // 종일 토글 시 시간대 전일 고정
  useEffect(() => {
    if (isAllDay) setSlot('allday')
  }, [isAllDay])

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(null), 2500)
  }

  function validate(): string | null {
    if (!title.trim()) return '일정 내용을 입력해주세요'
    if (title.trim().length > 200) return '일정 내용은 200자 이내로 입력해주세요'
    if (!date) return '날짜를 선택해주세요'
    if (!isAllDay && startTime && endTime && startTime >= endTime)
      return '종료 시간은 시작 시간 이후여야 합니다'
    if (type === 'common' && participantIds.length === 0)
      return '알림 발송 대상을 1명 이상 선택해주세요'
    return null
  }

  async function handleSave() {
    if (saving) return
    const err = validate()
    if (err) {
      showToast(err)
      return
    }
    setSaving(true)

    if (isEdit && editId) {
      const result = await updateSchedule(editId, {
        title: title.trim(),
        schedule_date: date,
        time_slot: isAllDay ? 'allday' : slot,
        start_time: isAllDay ? null : startTime || null,
        end_time: isAllDay ? null : endTime || null,
        location: location.trim() || null,
        memo: memo.trim() || null,
      })
      if (!result.success) {
        setSaving(false)
        showToast(result.error ?? '저장에 실패했습니다')
        return
      }
    } else {
      const result = await createSchedule({
        type,
        title: title.trim(),
        schedule_date: date,
        time_slot: isAllDay ? 'allday' : slot,
        is_all_day: isAllDay,
        start_time: isAllDay ? null : startTime || null,
        end_time: isAllDay ? null : endTime || null,
        location: location.trim() || null,
        memo: memo.trim() || null,
        owner_id: ownerId,
        on_behalf_of_id: ownerId !== currentUserId ? ownerId : null,
        participant_ids: type === 'common' ? participantIds : [],
      })
      if (!result.success) {
        setSaving(false)
        showToast(result.error ?? '저장에 실패했습니다')
        return
      }
    }

    showToast(isEdit ? '일정이 수정되었습니다' : '일정이 등록되었습니다')
    setTimeout(() => {
      onSaved?.()
      onClose()
      router.refresh()
    }, 600)
  }

  const isProxy =
    type === 'personal' && !!currentUserId && ownerId !== currentUserId
  const proxyTargetUser = proxyTargets.find((u) => u.id === ownerId)

  return (
    <>
      <div className="backdrop" onClick={onClose} />
      <div className="modal" role="dialog" aria-labelledby="schedule-form-title">
        {/* 헤더 */}
        <div className="modal-hd">
          <h2 className="modal-hd-title" id="schedule-form-title">
            {isEdit
              ? '일정 수정'
              : type === 'common'
                ? '공통 일정 등록'
                : '일정 등록'}
          </h2>
          <button
            className="btn btn-tertiary btn-icon"
            onClick={onClose}
            aria-label="닫기"
          >
            <Icon name="x" />
          </button>
        </div>

        {/* 바디 */}
        <div className="modal-bd">
          {/* 대리 입력 배너 */}
          {isProxy && proxyTargetUser && (
            <div className="alert alert-info mb-3">
              <Icon name="info" size={14} />
              <div>
                내 계정으로 <b>{proxyTargetUser.name}</b> 이름 대리 입력 중
              </div>
            </div>
          )}

          {/* 유형 */}
          <div className="field mb-3">
            <div className="field-label">유형</div>
            <Segment
              value={type}
              onChange={(v) => setType(v as ScheduleType)}
              options={[
                { value: 'personal', label: '개인' },
                { value: 'common', label: '공통' },
              ]}
            />
          </div>

          {/* 개인: 입력 대상 */}
          {type === 'personal' && (
            <div className="field mb-3">
              <div className="field-label">입력 대상</div>
              <select
                className="select"
                value={ownerId}
                onChange={(e) => setOwnerId(e.target.value)}
              >
                <option value={currentUserId}>
                  본인 (내 일정)
                </option>
                {proxyTargets.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} · 대리권한
                  </option>
                ))}
              </select>
              <div className="field-help">
                대리권한이 부여된 임원만 표시됩니다
              </div>
            </div>
          )}

          {/* 공통: 알림 발송 대상 */}
          {type === 'common' && (
            <div className="field mb-3">
              <div className="field-label">알림 발송 대상 (다중)</div>
              <div
                className="flex gap-1"
                style={{
                  flexWrap: 'wrap',
                  padding: 6,
                  border: '1px solid var(--c-border)',
                  borderRadius: 'var(--rd-md)',
                  background: 'var(--c-panel)',
                  minHeight: 36,
                }}
              >
                {participantIds.map((pid) => {
                  const u = execUsers.find((x) => x.id === pid)
                  return (
                    <span
                      key={pid}
                      className="chip"
                      style={{
                        background: 'var(--c-primary-soft)',
                        color: 'var(--c-primary)',
                        borderColor: 'transparent',
                      }}
                    >
                      <span
                        className="color-dot"
                        style={{ background: u?.color }}
                      />
                      {u?.name}
                      <button
                        className="x"
                        type="button"
                        onClick={() =>
                          setParticipantIds((ids) =>
                            ids.filter((id) => id !== pid),
                          )
                        }
                        aria-label={`${u?.name} 제거`}
                      >
                        <Icon name="x" size={10} />
                      </button>
                    </span>
                  )
                })}
              </div>
              <div className="flex gap-2 mt-2">
                <button
                  className="btn btn-link btn-sm"
                  type="button"
                  onClick={() =>
                    setParticipantIds(execUsers.map((u) => u.id))
                  }
                >
                  전체 선택
                </button>
                <button
                  className="btn btn-link btn-sm"
                  type="button"
                  onClick={() => setParticipantIds([])}
                >
                  모두 해제
                </button>
                <span
                  className="muted text-sm"
                  style={{ marginLeft: 'auto' }}
                >
                  {participantIds.length}명 선택됨
                </span>
              </div>
              {/* 임원 선택 버튼 */}
              <div className="flex gap-1 mt-2" style={{ flexWrap: 'wrap' }}>
                {execUsers.filter(
                  (u) => !participantIds.includes(u.id),
                ).map((u) => (
                  <button
                    key={u.id}
                    type="button"
                    className="btn btn-tertiary btn-sm"
                    onClick={() =>
                      setParticipantIds((ids) => [...ids, u.id])
                    }
                  >
                    <span
                      className="color-dot"
                      style={{ background: u.color }}
                    />
                    {u.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 일정 내용 */}
          <div className="field mb-3">
            <div className="field-label">
              일정 내용 <span className="req">*</span>
            </div>
            <input
              className="input"
              placeholder="제목 입력 (1~200자)"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={200}
            />
          </div>

          {/* 날짜 + 종일 */}
          <div className="field-row mb-3">
            <div className="field" style={{ flex: 1 }}>
              <div className="field-label">
                날짜 <span className="req">*</span>
              </div>
              <input
                type="date"
                className="input"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
            <div className="field" style={{ width: 140 }}>
              <div className="field-label">종일</div>
              <label
                className="flex items-center gap-2"
                style={{ height: 30 }}
              >
                <input
                  type="checkbox"
                  className="switch"
                  checked={isAllDay}
                  onChange={(e) => setIsAllDay(e.target.checked)}
                />
                <span className="text-sm muted">
                  {isAllDay ? '종일' : '시간 지정'}
                </span>
              </label>
            </div>
          </div>

          {/* 시간대 + 시간 */}
          {!isAllDay && (
            <div className="field-row mb-3">
              <div className="field" style={{ flex: 1 }}>
                <div className="field-label">시간대</div>
                <select
                  className="select"
                  value={slot}
                  onChange={(e) => setSlot(e.target.value as TimeSlot)}
                >
                  <option value="morning">오전 (00-12)</option>
                  <option value="lunch">점심 (12-14)</option>
                  <option value="afternoon">오후 (14-18)</option>
                  <option value="evening">저녁 (18-24)</option>
                </select>
              </div>
              <div className="field" style={{ flex: 1 }}>
                <div className="field-label">시작 시간</div>
                <input
                  type="time"
                  className="input"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                />
              </div>
              <div className="field" style={{ flex: 1 }}>
                <div className="field-label">종료 시간</div>
                <input
                  type="time"
                  className="input"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                />
              </div>
            </div>
          )}

          {/* 장소 */}
          <div className="field mb-3">
            <div className="field-label">장소</div>
            <input
              className="input"
              placeholder="장소 (선택, 100자 이내)"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              maxLength={100}
            />
          </div>

          {/* 비고 */}
          <div className="field mb-3">
            <div className="field-label">
              비고{' '}
              <span className="muted text-sm">({memo.length}/500)</span>
            </div>
            <textarea
              className="textarea"
              placeholder="추가 정보 (선택)"
              maxLength={500}
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
            />
          </div>
        </div>

        {/* 푸터 */}
        <div className="modal-ft">
          {toast && (
            <span className="text-sm muted" style={{ flex: 1 }}>
              {toast}
            </span>
          )}
          <button className="btn btn-tertiary" onClick={onClose}>
            취소
          </button>
          <button
            className="btn btn-primary"
            onClick={handleSave}
            disabled={!title.trim() || saving || !currentUserId}
          >
            {saving ? '저장 중...' : isEdit ? '수정' : '저장'}
          </button>
        </div>
      </div>
    </>
  )
}
