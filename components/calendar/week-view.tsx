'use client'

import { useEffect, useRef, useState } from 'react'
import type { CalendarSchedule } from '@/lib/types'
import type { Holiday } from '@/lib/types'
import { buildWeekDays, weekdayKo } from './calendar-helpers'

interface WeekViewProps {
  baseDate: string
  today: string
  schedules: CalendarSchedule[]
  holidays: Holiday[]
  onEventClick: (id: string) => void
}

const HOUR_START = 7
const HOUR_END = 22
const HOURS = Array.from({ length: HOUR_END - HOUR_START }, (_, i) => HOUR_START + i)
const PX_PER_MIN = 1 // 60px/hour = 1px/min

export function WeekView({ baseDate, today, schedules, holidays, onEventClick }: WeekViewProps) {
  const days = buildWeekDays(baseDate)
  const [nowMinutes, setNowMinutes] = useState<number | null>(null)
  const rafRef = useRef<number | null>(null)

  useEffect(() => {
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
  }, [])

  function getHoliday(date: string): Holiday | undefined {
    return holidays.find(h => h.holiday_date === date && h.is_active)
  }

  return (
    <div className="cal-week">
      {/* 헤더 */}
      <div className="cal-week-head">
        <div className="cal-week-corner">시간</div>
        {days.map(d => {
          const isToday = d === today
          const dow = new Date(d + 'T00:00').getDay()
          const holiday = getHoliday(d)
          return (
            <div
              key={d}
              className={[
                'cal-week-day-hd',
                isToday ? 'today' : '',
                dow === 6 ? 'sat' : '',
                dow === 0 ? 'sun' : '',
              ].filter(Boolean).join(' ')}
            >
              <div className="dow-lbl">{weekdayKo(d)}</div>
              <div className={`dow-num${isToday ? ' badge' : ''}`}>{d.slice(8)}</div>
              {holiday && <div className="dow-holi">{holiday.name}</div>}
            </div>
          )
        })}
      </div>

      {/* 종일 영역 */}
      <div className="cal-week-body">
        <div className="cal-week-allday">
          <div className="cal-week-corner sm">종일</div>
          {days.map(d => {
            const allday = schedules.filter(s => s.schedule_date === d && s.start_time === null)
            return (
              <div key={d} className="cal-week-allday-cell">
                {allday.map(s => {
                  const color = s.type === 'common' ? 'var(--c-accent)' : (s.owner?.color || 'gray')
                  return (
                    <div
                      key={s.id}
                      className="allday-event"
                      style={{ background: color }}
                      onClick={() => onEventClick(s.id)}
                    >
                      {s.type === 'common' && '[공통] '}{s.title}
                    </div>
                  )
                })}
              </div>
            )
          })}
        </div>

        {/* 시간 그리드 */}
        <div className="cal-week-grid">
          <div className="cal-week-times">
            {HOURS.map(h => (
              <div key={h} className="cal-week-hour">
                <span>{String(h).padStart(2, '0')}:00</span>
              </div>
            ))}
          </div>
          {days.map(d => {
            const isToday = d === today
            const daySch = schedules.filter(s => s.schedule_date === d && s.start_time !== null)
            return (
              <div key={d} className={`cal-week-col${isToday ? ' today' : ''}`}>
                {HOURS.map(h => (
                  <div
                    key={h}
                    className={[
                      'cal-week-slot',
                      h === 12 ? 'lunch' : '',
                      h < 9 || h >= 18 ? 'offwork' : '',
                    ].filter(Boolean).join(' ')}
                  />
                ))}
                {daySch.map(s => {
                  const [sh, sm] = s.start_time!.split(':').map(Number)
                  const [eh, em] = s.end_time!.split(':').map(Number)
                  const top = (sh - HOUR_START) * 60 + sm
                  const rawHeight = (eh - sh) * 60 + (em - sm)
                  const height = Math.max(rawHeight, 30) // 최소 30px
                  const color = s.type === 'common' ? 'var(--c-accent)' : (s.owner?.color || 'var(--c-text-3)')
                  return (
                    <div
                      key={s.id}
                      className="cal-week-event"
                      style={{ top, height, background: color }}
                      onClick={() => onEventClick(s.id)}
                    >
                      <div className="we-time tnum">{s.start_time}~{s.end_time}</div>
                      <div className="we-title">{s.type === 'common' && '[공통] '}{s.title}</div>
                    </div>
                  )
                })}
                {isToday && nowMinutes !== null && nowMinutes >= 0 && (
                  <div className="cal-week-nowline" style={{ top: nowMinutes * PX_PER_MIN }}>
                    <span className="nowlabel">
                      {String(HOUR_START + Math.floor(nowMinutes / 60)).padStart(2, '0')}:{String(nowMinutes % 60).padStart(2, '0')}
                    </span>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
