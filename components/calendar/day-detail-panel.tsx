'use client'

import { useEffect, useState } from 'react'
import type { ScheduleType, TimeSlot } from '@/lib/types'

interface DayScheduleItem {
  id: string
  type: ScheduleType
  title: string
  time_slot: TimeSlot
  start_time: string | null
  end_time: string | null
  location: string | null
  owner: { id: string; name: string; color: string | null } | null
}

interface DayDetailData {
  date: string
  holiday: { name: string; type: string } | null
  schedules: DayScheduleItem[]
}

interface DayDetailPanelProps {
  date: string | null
  onClose: () => void
  onCreateSchedule: (date: string) => void
  onScheduleClick: (id: string) => void
}

export function DayDetailPanel({
  date,
  onClose,
  onCreateSchedule,
  onScheduleClick,
}: DayDetailPanelProps) {
  const [data, setData] = useState<DayDetailData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(false)

  useEffect(() => {
    if (!date) {
      setData(null)
      return
    }
    setLoading(true)
    setError(false)
    fetch(`/api/calendar/day/${date}`)
      .then(res => res.json())
      .then(json => {
        if (json.error) {
          setError(true)
        } else {
          setData(json.data as DayDetailData)
        }
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false))
  }, [date])

  const isOpen = date !== null

  return (
    <>
      {isOpen && (
        <div
          className="backdrop"
          onClick={onClose}
          style={{ zIndex: 49 }}
        />
      )}
      <div className={`panel${isOpen ? ' open' : ''}`} style={{ zIndex: 50 }}>
        <div className="panel-hd">
          <span className="panel-hd-title">
            {date ? `${date} 일정` : '일 상세'}
          </span>
          <button
            className="btn btn-ghost btn-sm"
            onClick={onClose}
            aria-label="닫기"
          >
            ✕
          </button>
        </div>

        <div className="panel-bd">
          {loading && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[1, 2, 3].map(i => (
                <div
                  key={i}
                  className="skel"
                  style={{ height: 48, borderRadius: 6 }}
                />
              ))}
            </div>
          )}

          {!loading && error && (
            <p style={{ color: 'var(--c-danger)', fontSize: 13 }}>
              불러오지 못했습니다.
            </p>
          )}

          {!loading && !error && data && (
            <>
              {data.holiday && (
                <div
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 4,
                    background: '#FBEAEA',
                    color: 'var(--c-danger)',
                    borderRadius: 4,
                    padding: '2px 8px',
                    fontSize: 12,
                    fontWeight: 600,
                    marginBottom: 12,
                  }}
                >
                  🎌 {data.holiday.name}
                </div>
              )}

              {data.schedules.length === 0 && (
                <p style={{ color: 'var(--c-text-3)', fontSize: 13 }}>
                  일정이 없습니다.
                </p>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {data.schedules.map(s => {
                  const color =
                    s.type === 'common'
                      ? 'var(--c-accent)'
                      : s.owner?.color || 'var(--c-text-3)'
                  return (
                    <button
                      key={s.id}
                      className="cal-event"
                      style={{
                        borderLeftColor: color,
                        color,
                        textAlign: 'left',
                        width: '100%',
                        cursor: 'pointer',
                        padding: '6px 8px',
                      }}
                      onClick={() => onScheduleClick(s.id)}
                    >
                      <span className="tnum" style={{ fontSize: 11 }}>
                        {s.start_time ? s.start_time.slice(0, 5) : '종일'}
                      </span>
                      <span
                        className="ellip"
                        style={{ color: 'var(--c-text-1)', marginLeft: 6 }}
                      >
                        {s.type === 'common' && '[공통] '}
                        {s.title}
                      </span>
                      {s.owner && (
                        <span
                          style={{
                            color: 'var(--c-text-3)',
                            fontSize: 11,
                            marginLeft: 'auto',
                          }}
                        >
                          {s.owner.name}
                        </span>
                      )}
                    </button>
                  )
                })}
              </div>
            </>
          )}
        </div>

        <div className="panel-ft">
          {date && (
            <button
              className="btn btn-primary btn-sm"
              onClick={() => {
                onCreateSchedule(date)
              }}
            >
              + 일정 등록
            </button>
          )}
        </div>
      </div>
    </>
  )
}
