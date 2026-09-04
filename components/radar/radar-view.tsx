'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Icon } from '@/components/ui/icon'
import { Badge } from '@/components/ui/badge'
import { ExecSelector } from './exec-selector'
import { AvailabilityList } from './availability-list'
import type { SlotKey, SlotResult } from './availability-list'

export interface RadarExec {
  id: string
  name: string
  color: string
  title: string
}

function addDays(dateStr: string, n: number): string {
  const d = new Date(dateStr + 'T00:00:00')
  d.setDate(d.getDate() + n)
  return d.toISOString().slice(0, 10)
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
  const [slots, setSlots] = useState<SlotResult[]>([])
  const [showResult, setShowResult] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const dateRangeError: string | null = (() => {
    if (end < start) return '종료일이 시작일보다 앞섭니다'
    const diffDays = (new Date(end + 'T00:00').getTime() - new Date(start + 'T00:00').getTime()) / 86400000
    if (diffDays > 30) return '최대 30일까지 조회 가능합니다'
    return null
  })()

  const canSearch = selected.size >= 1 && !dateRangeError

  async function handleSearch() {
    if (!canSearch) return
    setLoading(true)
    setShowResult(false)
    setError(null)
    try {
      const res = await fetch('/api/radar/availability', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ owner_ids: [...selected], date_from: start, date_to: end }),
      })
      const json = await res.json()
      if (res.ok && json.data?.slots) {
        setSlots(json.data.slots)
        setShowResult(true)
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
    if (slot !== 'allday') params.set('time_slot', slot)
    params.set('participant_ids', [...selected].join(','))
    router.replace(`?${params.toString()}`)
  }

  function handleQuickRange(i: number) {
    const today = new Date().toISOString().slice(0, 10)
    const dow = new Date(today + 'T00:00:00').getDay()
    const thisSunday = addDays(today, -dow)
    const nextSunday = addDays(thisSunday, 7)
    const firstOfMonth = today.slice(0, 8) + '01'
    const lastOfMonth = (() => {
      const d = new Date(today + 'T00:00:00')
      d.setMonth(d.getMonth() + 1, 0)
      return d.toISOString().slice(0, 10)
    })()

    const ranges: [string, string][] = [
      [today,       addDays(today, 7)],
      [thisSunday,  addDays(thisSunday, 6)],
      [nextSunday,  addDays(nextSunday, 6)],
      [firstOfMonth, lastOfMonth],
    ]
    const [s, e] = ranges[i]
    setStart(s)
    setEnd(e)
    setShowResult(false)
    setSlots([])
    setError(null)
  }

  return (
    <div className="radar-wrap">
      <div className="page-hd">
        <div className="flex-col" style={{ minWidth: 0 }}>
          <h1 className="h1">모임 레이더</h1>
          <div className="sub">참석자와 기간을 선택하면 전원 가능한 시간을 찾아줍니다</div>
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
                    onChange={(e) => { setStart(e.target.value); setShowResult(false); setSlots([]) }}
                  />
                  <span style={{ alignSelf: 'center', color: 'var(--c-text-3)' }}>~</span>
                  <input
                    type="date"
                    className="input"
                    value={end}
                    onChange={(e) => { setEnd(e.target.value); setShowResult(false); setSlots([]) }}
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

            {/* 우측: 결과 리스트 */}
            <div className="card" style={{ minHeight: 520 }}>
              <div className="card-hd">
                <span className="card-hd-title">
                  <Icon name="dashboard" size={14} /> 가능한 시간
                </span>
                {showResult && (
                  <span className="muted text-sm">최대 30개</span>
                )}
              </div>

              {!showResult && !error && (
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
                  <button type="button" className="btn btn-secondary btn-sm" onClick={handleSearch}>
                    다시 시도
                  </button>
                </div>
              )}

              {showResult && (
                <AvailabilityList slots={slots} onSlotClick={handleSlotClick} />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
