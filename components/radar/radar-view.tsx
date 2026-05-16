'use client'

import { useState, useMemo } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Icon } from '@/components/ui/icon'
import { Badge } from '@/components/ui/badge'
import { ExecSelector } from './exec-selector'
import { AvailabilityGrid } from './availability-grid'

export interface RadarExec {
  id: string
  name: string
  color: string
  title: string
}

export type SlotKey = 'morning' | 'lunch' | 'afternoon' | 'evening'

interface ApiSlot {
  date: string
  start_time: string
  end_time: string
  status: 'AVAILABLE' | 'PARTIAL' | 'UNAVAILABLE'
  available_count: number
  total_count: number
  conflicted_users: { id: string; name: string }[]
}

function startTimeToSlotKey(startTime: string): SlotKey {
  const hour = parseInt(startTime.slice(0, 2), 10)
  if (hour < 12) return 'morning'
  if (hour < 13) return 'lunch'
  if (hour < 18) return 'afternoon'
  return 'evening'
}

export interface GridSlot {
  slot: SlotKey
  available: number
  total: number
  conflicts: RadarExec[]
}

export interface GridRow {
  date: string
  weekend: boolean
  slots: GridSlot[]
}

const SLOT_KEYS: SlotKey[] = ['morning', 'lunch', 'afternoon', 'evening']

const SLOT_LABEL: Record<SlotKey, string> = {
  morning: '오전',
  lunch: '점심',
  afternoon: '오후',
  evening: '저녁',
}

const WEEKDAY_KO = ['일', '월', '화', '수', '목', '금', '토']

function addDays(dateStr: string, n: number): string {
  const d = new Date(dateStr + 'T00:00:00')
  d.setDate(d.getDate() + n)
  return d.toISOString().slice(0, 10)
}

function daysBetween(start: string, end: string): string[] {
  const days: string[] = []
  let cur = start
  while (cur <= end) {
    days.push(cur)
    cur = addDays(cur, 1)
  }
  return days
}

interface RadarViewProps {
  execs: RadarExec[]
  defaultStart: string
  defaultEnd: string
}

export function RadarView({ execs, defaultStart, defaultEnd }: RadarViewProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [selected, setSelected] = useState<Set<string>>(new Set(execs.map((e) => e.id)))
  const [start, setStart] = useState(defaultStart)
  const [end, setEnd] = useState(defaultEnd)
  const [showGrid, setShowGrid] = useState(false)
  const [apiSlots, setApiSlots] = useState<ApiSlot[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const dateRangeError: string | null = (() => {
    if (end < start) return '종료일이 시작일보다 앞섭니다'
    const diffMs = new Date(end + 'T00:00').getTime() - new Date(start + 'T00:00').getTime()
    const diffDays = diffMs / 86400000
    if (diffDays > 30) return '최대 30일까지 조회 가능합니다'
    return null
  })()

  const canSearch = selected.size >= 1 && !dateRangeError

  const execMap = useMemo(
    () => new Map(execs.map((e) => [e.id, e])),
    [execs]
  )

  const grid: GridRow[] | null = useMemo(() => {
    if (!showGrid || selected.size < 1) return null
    const days = daysBetween(start, end)
    return days.map((date) => {
      const dow = new Date(date + 'T00:00').getDay()
      const isWeekend = dow === 0 || dow === 6
      const slots: GridSlot[] = SLOT_KEYS.map((slotKey) => {
        if (isWeekend) return { slot: slotKey, available: 0, total: selected.size, conflicts: [] }
        const daySlots = apiSlots.filter(
          (s) => s.date === date && startTimeToSlotKey(s.start_time) === slotKey
        )
        if (daySlots.length === 0) {
          return { slot: slotKey, available: selected.size, total: selected.size, conflicts: [] }
        }
        const conflictedIds = new Set(daySlots.flatMap((s) => s.conflicted_users.map((u) => u.id)))
        const conflicts = [...conflictedIds]
          .filter((id) => selected.has(id))
          .map((id) => execMap.get(id) ?? { id, name: '', color: '#64748B', title: '' })
        const minAvailable = Math.min(...daySlots.map((s) => s.available_count))
        return {
          slot: slotKey,
          available: minAvailable,
          total: selected.size,
          conflicts,
        }
      })
      return { date, weekend: isWeekend, slots }
    })
  }, [showGrid, selected, start, end, apiSlots, execMap])

  async function handleSearch() {
    if (!canSearch) return
    setLoading(true)
    setShowGrid(false)
    setError(null)
    try {
      const res = await fetch('/api/radar/availability', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          owner_ids: [...selected],
          date_from: start,
          date_to: end,
          slot_minutes: 60,
        }),
      })
      const json = await res.json()
      if (res.ok && json.data?.slots) {
        setApiSlots(json.data.slots)
        setShowGrid(true)
      } else {
        setError('가용성 조회에 실패했습니다. 다시 시도해주세요.')
      }
    } catch {
      setError('가용성 조회에 실패했습니다. 다시 시도해주세요.')
    } finally {
      setLoading(false)
    }
  }

  function handleSlotClick(date: string, slot: SlotKey) {
    const params = new URLSearchParams(searchParams.toString())
    params.set('modal', 'form')
    params.set('date', date)
    params.set('time_slot', slot)
    params.set('participant_ids', [...selected].join(','))
    router.replace(`?${params.toString()}`)
  }

  function handleQuickRange(i: number) {
    const today = new Date().toISOString().slice(0, 10)
    const dow = new Date(today + 'T00:00:00').getDay()
    // 월요일 기준 이번 주 시작 (한국식)
    const diffToMonday = (dow + 6) % 7
    const thisMonday = addDays(today, -diffToMonday)
    const thisSunday = addDays(thisMonday, 6)
    const nextMonday = addDays(thisMonday, 7)
    const nextSunday = addDays(thisMonday, 13)
    const firstOfMonth = today.slice(0, 8) + '01'
    const lastOfMonth = (() => {
      const d = new Date(today + 'T00:00:00')
      d.setMonth(d.getMonth() + 1, 0)
      return d.toISOString().slice(0, 10)
    })()
    if (i === 0) { setStart(today); setEnd(addDays(today, 7)) }
    else if (i === 1) { setStart(thisMonday); setEnd(thisSunday) }
    else if (i === 2) { setStart(nextMonday); setEnd(nextSunday) }
    else { setStart(firstOfMonth); setEnd(lastOfMonth) }
    setShowGrid(false)
    setApiSlots([])
    setError(null)
  }

  return (
    <div className="radar-wrap">
      <div className="page-hd">
        <div className="flex-col" style={{ minWidth: 0 }}>
          <h1 className="h1">모임 레이더</h1>
          <div className="sub">참석자와 기간을 선택하면 가능한 시간대를 분석합니다</div>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto' }}>
        <div className="page-body">
          <div className="radar-grid">
            {/* 좌측: 참석자 + 기간 */}
            <div className="card">
              <div className="card-hd">
                <span className="card-hd-title">
                  <Icon name="users" size={14} /> 참석자 선택
                </span>
                <Badge tone="primary">{selected.size}명 선택됨</Badge>
              </div>

              <ExecSelector execs={execs} selected={selected} onChange={setSelected} />

              <div style={{ padding: 14, borderTop: '1px solid var(--c-divider)' }}>
                <div className="field-label mb-2">조회 기간 (최대 30일)</div>
                <div className="field-row" style={{ marginBottom: 8 }}>
                  <input
                    type="date"
                    className="input"
                    value={start}
                    onChange={(e) => { setStart(e.target.value); setShowGrid(false); setApiSlots([]) }}
                  />
                  <span style={{ alignSelf: 'center', color: 'var(--c-text-3)' }}>~</span>
                  <input
                    type="date"
                    className="input"
                    value={end}
                    onChange={(e) => { setEnd(e.target.value); setShowGrid(false); setApiSlots([]) }}
                  />
                </div>
                {dateRangeError && (
                  <div className="field-help" style={{ color: 'var(--c-warn)', marginBottom: 8 }}>
                    {dateRangeError}
                  </div>
                )}
                <div className="flex gap-2" style={{ flexWrap: 'wrap' }}>
                  {['오늘부터 1주', '이번 주', '다음 주', '이번 달'].map((lbl, i) => (
                    <button
                      key={i}
                      type="button"
                      className="btn btn-tertiary btn-sm"
                      onClick={() => handleQuickRange(i)}
                    >
                      {lbl}
                    </button>
                  ))}
                </div>
                <button
                  type="button"
                  className="btn btn-primary btn-lg mt-3"
                  style={{ width: '100%' }}
                  disabled={!canSearch || loading}
                  onClick={handleSearch}
                >
                  <Icon name="radar" size={14} /> {loading ? '조회 중...' : '가능 시간 조회'}
                </button>
                {selected.size < 1 && (
                  <div className="field-help mt-2" style={{ color: 'var(--c-warn)' }}>
                    1명 이상 선택해주세요
                  </div>
                )}
              </div>
            </div>

            {/* 우측: 격자 */}
            <div className="card" style={{ minHeight: 520 }}>
              <div className="card-hd">
                <span className="card-hd-title">
                  <Icon name="dashboard" size={14} /> 가용성 격자
                </span>
                <div className="radar-legend">
                  <span><span className="legend-sw r-ok" /> 전원 가능</span>
                  <span><span className="legend-sw r-mid" /> 일부 충돌</span>
                  <span><span className="legend-sw r-bad" /> 전원 불가</span>
                  <span><span className="legend-sw r-weekend" /> 주말</span>
                </div>
              </div>

              {!grid && !error && (
                <div className="empty" style={{ padding: 80 }}>
                  <div className="emoji">🎯</div>
                  <div className="msg">
                    참석자와 기간을 선택한 후<br />&apos;가능 시간 조회&apos;를 눌러주세요
                  </div>
                </div>
              )}

              {error && (
                <div className="empty" style={{ padding: 80 }}>
                  <div className="msg" style={{ color: 'var(--c-warn)', marginBottom: 12 }}>{error}</div>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={handleSearch}
                  >
                    다시 시도
                  </button>
                </div>
              )}

              {grid && (
                <AvailabilityGrid
                  grid={grid}
                  slotKeys={SLOT_KEYS}
                  slotLabel={SLOT_LABEL}
                  weekdayKo={WEEKDAY_KO}
                  onSlotClick={handleSlotClick}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
