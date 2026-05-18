'use client'

import type { CalendarSchedule } from '@/lib/types'
import type { Holiday } from '@/lib/types'
import { buildMonthCells } from './calendar-helpers'

interface MonthViewProps {
  baseDate: string
  today: string
  schedules: CalendarSchedule[]
  holidays: Holiday[]
  onCellClick: (date: string) => void
  onEventClick: (id: string) => void
}

export function MonthView({ baseDate, today, schedules, holidays, onCellClick, onEventClick }: MonthViewProps) {
  const cells = buildMonthCells(baseDate)

  function getHoliday(date: string): Holiday | undefined {
    return holidays.find(h => h.holiday_date === date && h.is_active)
  }

  return (
    <div className="cal-month">
      <div className="cal-month-head">
        {['월', '화', '수', '목', '금', '토', '일'].map((d, i) => (
          <div key={d} className={`cal-dow ${i === 5 ? 'sat' : ''} ${i === 6 ? 'sun' : ''}`}>{d}</div>
        ))}
      </div>
      <div className="cal-month-grid">
        {cells.map((c, i) => {
          const dayScheds = schedules
            .filter(s => s.schedule_date === c.date)
            .sort((a, b) => {
              // 공통 일정 우선
              if (a.type === 'common' && b.type !== 'common') return -1
              if (a.type !== 'common' && b.type === 'common') return 1
              return (a.start_time || '99:99').localeCompare(b.start_time || '99:99')
            })
          const holiday = getHoliday(c.date)
          const isToday = c.date === today
          const dow = new Date(c.date + 'T00:00').getDay()

          return (
            <div
              key={i}
              className={[
                'cal-cell',
                c.outside ? 'outside' : '',
                isToday ? 'today' : '',
                dow === 6 ? 'sat' : '',
                dow === 0 ? 'sun' : '',
                holiday ? 'holiday' : '',
              ].filter(Boolean).join(' ')}
              onClick={() => onCellClick(c.date)}
            >
              <div className="cal-cell-hd">
                <span
                  className={`cal-cell-num${isToday ? ' badge' : ''}`}
                  title={holiday ? holiday.name : undefined}
                >
                  {c.day}
                </span>
                {holiday && (
                  <span className="cal-cell-holiday">{holiday.name}</span>
                )}
              </div>
              <div className="cal-cell-events">
                {dayScheds.slice(0, 3).map(s => {
                  const color = s.type === 'common'
                    ? 'var(--c-accent)'
                    : (s.owner?.color || 'var(--c-text-3)')
                  return (
                    <div
                      key={s.id}
                      className={`cal-event${s.type === 'common' ? ' common' : ''}`}
                      style={{ borderLeftColor: color, color }}
                      title={s.owner?.name ? `${s.owner.name} — ${s.title}` : s.title}
                      onClick={e => { e.stopPropagation(); onEventClick(s.id) }}
                    >
                      <span className="tnum">
                        {s.start_time === null ? '종일' : s.start_time.slice(0, 5)}
                      </span>
                      <span className="ellip" style={{ color: 'var(--c-text-1)' }}>
                        {s.type === 'common' && '[공통] '}{s.title}
                      </span>
                    </div>
                  )
                })}
                {dayScheds.length > 3 && (
                  <div
                    className="cal-more"
                    onClick={e => { e.stopPropagation(); onCellClick(c.date) }}
                  >
                    +{dayScheds.length - 3}건 더보기
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
