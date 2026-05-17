'use client'

import { useMemo, useRef, useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Badge } from '@/components/ui/badge'
import { Icon } from '@/components/ui/icon'
import { RelationshipPopover } from '@/components/contacts/relationship-popover'
import { createSchedule } from '@/lib/actions/schedules'
import { createBrowserClientInstance } from '@/app/_lib/supabase/client'
import type { MockSchedule, MockUser } from '@/app/(app)/list/page'
import type { RelationshipHistory } from '@/lib/types'

export type SortCol = 'schedule_date' | 'title' | 'owner'
export type SortDir = 'asc' | 'desc'

export interface SortState {
  col: SortCol
  dir: SortDir
}

const TIME_SLOT_LABEL: Record<string, string> = {
  morning: '오전', lunch: '점심', afternoon: '오후', evening: '저녁', allday: '종일',
}

const WEEKDAY_KO = ['일', '월', '화', '수', '목', '금', '토']

function weekdayKo(date: string) {
  return WEEKDAY_KO[new Date(date + 'T00:00').getDay()]
}

function formatDate(date: string) {
  return date.slice(5).replace('-', '.')
}

interface ListTableProps {
  schedules: MockSchedule[]
  users: MockUser[]
  sort: SortState
  onSortChange: (col: SortCol) => void
  onRowClick: (id: string) => void
  onClearFilters: () => void
  quickAddOpen: boolean
  onQuickAddOpen: () => void
  onQuickAddClose: () => void
  onQuickAddSubmit: () => void
}

export function ListTable({
  schedules,
  users,
  sort,
  onSortChange,
  onRowClick,
  onClearFilters,
  quickAddOpen,
  onQuickAddOpen,
  onQuickAddClose,
  onQuickAddSubmit,
}: ListTableProps) {
  const userMap = useMemo(() => {
    const map = new Map<string, MockUser>()
    users.forEach((u) => map.set(u.id, u))
    return map
  }, [users])

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

  function handleMentionClick(e: React.MouseEvent, target: MentionTarget) {
    e.stopPropagation()
    const rect = e.currentTarget.getBoundingClientRect()
    setPopoverTarget(target)
    setPopoverRect(rect)
    setPopoverHistory(null)
    setPopoverError(null)
    fetchMentionHistory(target)
  }

  // 날짜별 그룹
  const grouped = useMemo(() => {
    const groups: Record<string, MockSchedule[]> = {}
    schedules.forEach((s) => {
      if (!groups[s.schedule_date]) groups[s.schedule_date] = []
      groups[s.schedule_date].push(s)
    })
    return groups
  }, [schedules])

  function SortIcon({ col }: { col: SortCol }) {
    if (sort.col !== col) return <span className="sort-ico">⇅</span>
    return <span className="sort-ico on">{sort.dir === 'asc' ? '▲' : '▼'}</span>
  }

  const activeUsers = users.filter((u) => u.role === 'user' && u.status === 'active')

  return (
    <>
    <table className="tbl tbl-list">
      <thead>
        <tr>
          <th className="sortable c-dt" onClick={() => onSortChange('schedule_date')} style={{ width: 120 }}>
            날짜 <SortIcon col="schedule_date" />
          </th>
          <th className="c-stat" style={{ width: 70 }}>시간대</th>
          <th className="c-dt" style={{ width: 120 }}>실제 시간</th>
          <th className="sortable c-txt" onClick={() => onSortChange('title')}>
            일정 내용 <SortIcon col="title" />
          </th>
          <th className="c-txt" style={{ width: 200 }}>장소·파트너</th>
          <th className="sortable c-name" onClick={() => onSortChange('owner')} style={{ width: 140 }}>
            담당자 <SortIcon col="owner" />
          </th>
          <th className="c-stat" style={{ width: 60 }}>구분</th>
          <th className="c-act col-action" />
        </tr>
      </thead>
      <tbody>
        {schedules.length === 0 && (
          <tr>
            <td colSpan={8}>
              <div className="empty">
                <div className="emoji">📅</div>
                <div className="msg">조건에 맞는 일정이 없습니다</div>
                <button type="button" className="btn btn-link btn-sm" onClick={onClearFilters}>
                  필터 초기화
                </button>
              </div>
            </td>
          </tr>
        )}

        {Object.keys(grouped).map((date) =>
          grouped[date].map((s, idx) => {
            const owner = s.owner_id ? userMap.get(s.owner_id) : null
            const isCommon = s.type === 'common'

            return (
              <tr
                key={s.id}
                className={isCommon ? 'row-common' : ''}
                onClick={() => onRowClick(s.id)}
                style={{ cursor: 'pointer' }}
              >
                {/* 날짜 — 동일 날짜 그룹 첫 행만 표시 */}
                <td className="c-dt">
                  {idx === 0 ? (
                    <>
                      {formatDate(date)}{' '}
                      <span className="muted">({weekdayKo(date)})</span>
                    </>
                  ) : (
                    <span className="muted text-sm">↑ 동일</span>
                  )}
                </td>

                {/* 시간대 */}
                <td className="c-stat">
                  <Badge tone="neutral">{TIME_SLOT_LABEL[s.time_slot] ?? s.time_slot}</Badge>
                </td>

                {/* 실제 시간 */}
                <td className="c-dt text-sm muted-2">
                  {s.is_all_day ? '종일' : s.start_time ? `${s.start_time} ~ ${s.end_time}` : '—'}
                </td>

                {/* 일정 내용 */}
                <td className="c-txt">
                  <div className="fw-6 ellip" style={{ maxWidth: 280 }}>
                    {isCommon && <Badge tone="accent">공통</Badge>}{' '}
                    {s.title}
                  </div>
                  {s.memo && (
                    <div className="text-sm muted ellip" style={{ maxWidth: 280, marginTop: 2 }}>
                      {s.memo}
                    </div>
                  )}
                </td>

                {/* 장소·파트너 */}
                <td className="c-txt">
                  <div
                    className="ellip"
                    style={{ maxWidth: 200 }}
                    title={s.location ?? undefined}
                  >
                    <span className="muted-2 text-sm">{s.location ?? '—'}</span>
                    {s.mentions.slice(0, 2).map((m, i) => (
                      <button
                        key={i}
                        type="button"
                        className="badge badge-neutral"
                        style={{ marginLeft: 4, fontSize: 11, cursor: 'pointer' }}
                        onClick={(e) => handleMentionClick(e, { id: m.id, name: m.name, type: m.type })}
                      >
                        @{m.name}
                      </button>
                    ))}
                  </div>
                </td>

                {/* 담당자 */}
                <td className="c-name">
                  {owner ? (
                    <span className="flex items-center gap-2" style={{ justifyContent: 'center' }}>
                      <span className="color-dot" style={{ background: owner.color }} />
                      <span>{owner.name}</span>
                    </span>
                  ) : (
                    <span className="muted text-sm">
                      전체 {s.participants?.length ?? 0}명
                    </span>
                  )}
                </td>

                {/* 구분 */}
                <td className="c-stat">
                  {isCommon ? (
                    <Badge tone="accent">공통</Badge>
                  ) : (
                    <Badge tone="neutral">개인</Badge>
                  )}
                </td>

                {/* 액션 */}
                <td className="c-act col-action" onClick={(e) => e.stopPropagation()}>
                  <button
                    type="button"
                    className="btn btn-tertiary btn-icon btn-sm"
                    aria-label="더보기"
                  >
                    <Icon name="moreV" size={14} />
                  </button>
                </td>
              </tr>
            )
          }),
        )}

        {/* 빠른 추가 행 */}
        {quickAddOpen ? (
          <tr className="quick-input-row">
            <td colSpan={8}>
              <QuickAddForm
                activeUsers={activeUsers}
                onClose={onQuickAddClose}
                onSubmit={onQuickAddSubmit}
              />
            </td>
          </tr>
        ) : (
          <tr className="quick-add-row" onClick={onQuickAddOpen}>
            <td colSpan={8}>
              <div className="quick-add-trigger">
                <Icon name="plus" size={12} /> 빠른 일정 추가
              </div>
            </td>
          </tr>
        )}
      </tbody>
    </table>
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

const TIME_SLOT_OPTIONS = [
  { value: 'morning',   label: '오전' },
  { value: 'lunch',     label: '점심' },
  { value: 'afternoon', label: '오후' },
  { value: 'evening',   label: '저녁' },
  { value: 'allday',    label: '종일' },
] as const

/* 인라인 빠른 추가 폼 (테이블 내 사용) */
interface QuickAddFormProps {
  activeUsers: MockUser[]
  onClose: () => void
  onSubmit: () => void
}

function QuickAddForm({ activeUsers, onClose, onSubmit }: QuickAddFormProps) {
  const router = useRouter()
  const titleRef = useRef<HTMLInputElement>(null)
  const dateRef = useRef<HTMLInputElement>(null)
  const timeSlotRef = useRef<HTMLSelectElement>(null)
  const startTimeRef = useRef<HTMLInputElement>(null)
  const endTimeRef = useRef<HTMLInputElement>(null)
  const locationRef = useRef<HTMLInputElement>(null)
  const ownerRef = useRef<HTMLSelectElement>(null)
  const [error, setError] = useState<string | null>(null)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)

  useEffect(() => {
    titleRef.current?.focus()
    const supabase = createBrowserClientInstance()
    supabase.auth.getUser().then(({ data }) => {
      setCurrentUserId(data.user?.id ?? null)
    })
  }, [])

  function handleKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
    if (e.key === 'Escape') onClose()
    if (e.key === 'Enter') handleSave()
  }

  async function handleSave() {
    const title = titleRef.current?.value?.trim() ?? ''
    if (!title) {
      setError('일정 내용을 입력해주세요')
      titleRef.current?.focus()
      return
    }

    const ownerId = ownerRef.current?.value || currentUserId
    if (!ownerId) {
      setError('담당자를 선택해주세요')
      return
    }

    setError(null)

    const result = await createSchedule({
      type: 'personal',
      title,
      schedule_date: dateRef.current?.value ?? new Date().toISOString().slice(0, 10),
      time_slot: (timeSlotRef.current?.value ?? 'morning') as 'morning' | 'lunch' | 'afternoon' | 'evening' | 'allday',
      start_time: startTimeRef.current?.value || null,
      end_time: endTimeRef.current?.value || null,
      location: locationRef.current?.value || null,
      owner_id: ownerId,
    })

    if (result.success) {
      onSubmit()
      onClose()
      router.refresh()
    } else {
      setError(result.error ?? '저장 실패')
    }
  }

  return (
    <div className="quick-input-form" onKeyDown={handleKeyDown}>
      <input
        ref={dateRef}
        type="date"
        className="input"
        defaultValue={new Date().toISOString().slice(0, 10)}
        style={{ width: 130 }}
      />
      <select ref={timeSlotRef} className="select" style={{ width: 90 }}>
        {TIME_SLOT_OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
      <input ref={startTimeRef} type="time" className="input" defaultValue="09:00" style={{ width: 90 }} />
      <input ref={endTimeRef} type="time" className="input" defaultValue="10:00" style={{ width: 90 }} />
      <div style={{ flex: 1, minWidth: 200 }}>
        <input
          ref={titleRef}
          className={`input${error ? ' input-error' : ''}`}
          placeholder="일정 내용 *"
          maxLength={200}
          style={{ width: '100%' }}
        />
        {error && (
          <span style={{ fontSize: 11, color: 'var(--c-danger)', marginTop: 2, display: 'block' }}>
            {error}
          </span>
        )}
      </div>
      <input ref={locationRef} className="input" placeholder="장소" style={{ width: 140 }} />
      <select ref={ownerRef} className="select" style={{ width: 120 }}>
        <option value="">담당자</option>
        {activeUsers.map((u) => (
          <option key={u.id} value={u.id}>{u.name}</option>
        ))}
      </select>
      <button type="button" className="btn btn-primary btn-sm" onClick={handleSave}>
        저장 (Enter)
      </button>
      <button type="button" className="btn btn-tertiary btn-sm" onClick={onClose}>
        취소 (Esc)
      </button>
    </div>
  )
}
