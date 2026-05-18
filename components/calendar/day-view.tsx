'use client'

import { useEffect, useRef, useState } from 'react'
import type { CalendarSchedule } from '@/lib/types'
import type { Holiday } from '@/lib/types'
import { weekdayKo } from './calendar-helpers'
import { Badge } from '@/components/ui/badge'

interface DayViewProps {
  baseDate: string
  today: string
  schedules: CalendarSchedule[]
  holidays: Holiday[]
  onEventClick: (id: string) => void
}

const HOUR_START = 7
const HOUR_END = 22
const HOURS = Array.from({ length: HOUR_END - HOUR_START }, (_, i) => HOUR_START + i)

export function DayView({ baseDate, today, schedules, holidays, onEventClick }: DayViewProps) {
  const daySch = schedules
    .filter(s => s.schedule_date === baseDate)
    .sort((a, b) => (a.start_time || '99:99').localeCompare(b.start_time || '99:99'))
  const allday = daySch.filter(s => s.start_time === null)
  const timed = daySch.filter(s => s.start_time !== null)

  const holiday = holidays.find(h => h.holiday_date === baseDate && h.is_active)
  const isToday = baseDate === today

  const [nowMinutes, setNowMinutes] = useState<number | null>(null)
  const rafRef = useRef<number | null>(null)

  useEffect(() => {
    if (!isToday) return
    function tick() {
      const now = new Date()
      const mins = (now.getHours() - HOUR_START) * 60 + now.getMinutes()
      setNowMinutes(mins)
      rafRef.current = window.setTimeout(tick, 60_000)
    }
    tick()
    return () => {
      if (rafRef.current !== null) clearTimeout(rafRef.current)
    }
  }, [isToday])

  return (
    <div className="cal-day">
      <div className="cal-day-aside">
        <div className="cal-day-summary">
          <div className="muted text-sm">{baseDate.replace(/-/g, '.')} ({weekdayKo(baseDate)})</div>
          <div className="fw-7 text-xl mt-1">{daySch.length}건의 일정</div>
          {holiday && <Badge tone="danger">{holiday.name}</Badge>}
        </div>
        {allday.length > 0 && (
          <div className="mt-3">
            <div className="cal-aside-title">종일 일정</div>
            {allday.map(s => {
              const color = s.type === 'common' ? 'var(--c-accent)' : (s.owner?.color || 'gray')
              return (
                <div
                  key={s.id}
                  className="day-list-item"
                  onClick={() => onEventClick(s.id)}
                  style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 0', cursor: 'pointer' }}
                >
                  <span className="color-dot" style={{ background: color }} />
                  <span style={{ fontWeight: 600 }}>{s.title}</span>
                </div>
              )
            })}
          </div>
        )}
        {daySch.length === 0 && (
          <div style={{ color: 'var(--c-text-3)', fontSize: 12, marginTop: 12 }}>일정이 없습니다</div>
        )}
      </div>

      <div className="cal-day-main">
        <div className="day-tl">
          <div className="day-tl-times">
            {HOURS.map(h => (
              <div key={h} className="day-tl-hour">
                <span>{String(h).padStart(2, '0')}:00</span>
              </div>
            ))}
          </div>
          <div className="day-tl-track">
            {HOURS.map(h => (
              <div
                key={h}
                className={[
                  'day-tl-slot',
                  h === 12 ? 'lunch' : '',
                  h < 9 || h >= 18 ? 'offwork' : '',
                ].filter(Boolean).join(' ')}
              />
            ))}
            {timed.map(s => {
              const [sh, sm] = s.start_time!.split(':').map(Number)
              const [eh, em] = s.end_time!.split(':').map(Number)
              const top = (sh - HOUR_START) * 60 + sm
              const rawHeight = (eh - sh) * 60 + (em - sm)
              const height = Math.max(rawHeight, 30)
              const color = s.type === 'common' ? 'var(--c-accent)' : (s.owner?.color || 'var(--c-text-3)')
              return (
                <div
                  key={s.id}
                  className="day-tl-event"
                  style={{ top, height, borderLeftColor: color }}
                  onClick={() => onEventClick(s.id)}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span className="color-dot" style={{ background: color }} />
                    <span style={{ fontWeight: 600 }}>
                      {s.type === 'common' && '[공통] '}{s.title}
                    </span>
                  </div>
                  <div style={{ color: 'var(--c-text-3)', fontSize: 11, fontVariantNumeric: 'tabular-nums' }}>
                    {s.start_time?.slice(0, 5)} ~ {s.end_time?.slice(0, 5)} · {s.owner ? s.owner.name : '공통'}
                  </div>
                </div>
              )
            })}
            {isToday && nowMinutes !== null && nowMinutes >= 0 && (
              <div className="cal-week-nowline" style={{ top: nowMinutes }} />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
