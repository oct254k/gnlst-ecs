import { Badge } from '@/components/ui/badge'
import { Icon } from '@/components/ui/icon'
import type { ScheduleType, TimeSlot } from '@/lib/types'

export interface DashSchedule {
  id: string
  type: ScheduleType
  title: string
  schedule_date: string
  time_slot: TimeSlot
  start_time: string | null
  end_time: string | null
  is_all_day: boolean
  location: string | null
  owner: { id: string; name: string; color: string | null } | null
}

const TIME_SLOT_LABEL: Record<TimeSlot, string> = {
  morning: '오전',
  lunch: '점심',
  afternoon: '오후',
  evening: '저녁',
  allday: '종일',
}

interface TodayScheduleTableProps {
  today: string
  schedules: DashSchedule[]
  onRowClick: (id: string) => void
  onAddClick: () => void
}

export function TodayScheduleTable({
  today,
  schedules,
  onRowClick,
  onAddClick,
}: TodayScheduleTableProps) {
  const weekdays = ['일', '월', '화', '수', '목', '금', '토']
  const weekday = weekdays[new Date(today + 'T00:00').getDay()]
  const displayDate = today.replace(/-/g, '.') + ` (${weekday})`

  return (
    <div className="card" style={{ gridColumn: 'span 2' }}>
      <div className="card-hd">
        <span className="card-hd-title">
          <Icon name="cal" size={14} stroke="var(--c-primary)" />
          오늘 일정 — {displayDate}
        </span>
        <span className="card-hd-meta">{schedules.length}건</span>
        <button className="btn btn-primary btn-sm" onClick={onAddClick}>
          <Icon name="plus" size={12} />
          일정 등록
        </button>
      </div>

      {schedules.length === 0 ? (
        <div className="empty">
          <div className="emoji">📅</div>
          <div className="msg">오늘 등록된 일정이 없습니다</div>
        </div>
      ) : (
        <table className="tbl tbl-dash">
          <tbody>
            {schedules.map((s) => (
              <tr key={s.id} onClick={() => onRowClick(s.id)}>
                <td className="c-dt tbl-time">
                  <div className="time-row">
                    <span className="ts">{TIME_SLOT_LABEL[s.time_slot]}</span>
                    {s.start_time && <span className="num">{s.start_time}</span>}
                  </div>
                  {s.start_time && (
                    <span className="num muted text-sm">~ {s.end_time}</span>
                  )}
                </td>
                <td className="c-txt">
                  <div className="flex items-center gap-2 mb-2">
                    {s.type === 'common' ? (
                      <Badge tone="accent">공통</Badge>
                    ) : s.owner ? (
                      <span className="flex items-center gap-1">
                        <span
                          className="color-dot"
                          style={{ background: s.owner.color ?? undefined }}
                        />
                        <span className="text-sm">{s.owner.name}</span>
                      </span>
                    ) : null}
                  </div>
                  <div className="fw-6">{s.title}</div>
                </td>
                <td className="c-txt">
                  <div className="flex items-center gap-1 muted text-sm">
                    <Icon name="location" size={11} />
                    {s.location ?? '—'}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
