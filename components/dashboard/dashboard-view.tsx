'use client'

import { KpiCards } from './kpi-cards'
import { TodayScheduleTable } from './today-schedule-table'
import type { DashSchedule } from './today-schedule-table'
import { ExecActivityBars } from './exec-activity-bars'
import { UpcomingNotifications } from './upcoming-notifications'
import type { DashNotification } from './upcoming-notifications'
import { useScheduleModals } from '@/lib/hooks/use-schedule-modals'

interface ExecUser {
  id: string
  name: string
  color: string | null
  title: string
}

interface DashboardViewProps {
  today: string
  todaySchedules: DashSchedule[]
  notifications: DashNotification[]
  execs: ExecUser[]
  execScheduleCounts: Record<string, number>
  weekLabel: string
}

export function DashboardView({
  today,
  todaySchedules,
  notifications,
  execs,
  execScheduleCounts,
  weekLabel,
}: DashboardViewProps) {
  const modals = useScheduleModals()

  const todayTotal = todaySchedules.length
  const todayCommon = todaySchedules.filter((s) => s.type === 'common').length
  const unreadNotifs = notifications.length
  const execCount = execs.length

  const execCounts = execs.map((u) => ({
    id: u.id,
    name: u.name,
    color: u.color,
    title: u.title,
    count: execScheduleCounts[u.id] ?? 0,
  }))

  return (
    <div className="dash">
      <div className="page-hd">
        <div className="flex-col" style={{ minWidth: 0 }}>
          <h1 className="h1">대시보드</h1>
          <div className="sub">
            {today.replace(/-/g, '.')} · 오늘 {todayTotal}건
          </div>
        </div>
      </div>

      <div className="main-scroll">
        <div className="page-body">
          <KpiCards
            data={{ todayTotal, todayCommon, unreadNotifs, execCount }}
          />

          <div className="dash-grid" style={{ marginTop: 'var(--sp-5)' }}>
            <TodayScheduleTable
              today={today}
              schedules={todaySchedules}
              onRowClick={(id) => modals.openDetail(id)}
              onAddClick={() => modals.openForm({ date: today })}
            />

            <UpcomingNotifications
              notifications={notifications}
              onItemClick={(id) => modals.openDetail(id)}
            />

            <ExecActivityBars execCounts={execCounts} weekLabel={weekLabel} />
          </div>
        </div>
      </div>
    </div>
  )
}
