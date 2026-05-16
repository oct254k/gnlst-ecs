import { Suspense } from 'react'
import { createUserClient } from '@/app/_lib/supabase/server'
import { DashboardView } from '@/components/dashboard/dashboard-view'
import type { DashSchedule } from '@/components/dashboard/today-schedule-table'
import type { DashNotification } from '@/components/dashboard/upcoming-notifications'

const TODAY = new Date().toISOString().slice(0, 10)

function getWeekRange(today: string): { start: string; end: string; label: string } {
  const d = new Date(today + 'T00:00')
  const day = d.getDay() // 0=Sun
  const mon = new Date(d)
  mon.setDate(d.getDate() - ((day + 6) % 7))
  const sun = new Date(mon)
  sun.setDate(mon.getDate() + 6)
  const fmt = (x: Date) =>
    `${x.getFullYear()}.${String(x.getMonth() + 1).padStart(2, '0')}.${String(x.getDate()).padStart(2, '0')}`
  const toISO = (x: Date) =>
    `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}-${String(x.getDate()).padStart(2, '0')}`
  return {
    start: toISO(mon),
    end: toISO(sun),
    label: `${fmt(mon)} ~ ${fmt(sun).slice(5)}`,
  }
}

type ScheduleRow = {
  id: string
  type: string
  title: string
  schedule_date: string
  time_slot: string
  start_time: string | null
  end_time: string | null
  is_all_day: boolean
  location: string | null
  owner_id: string | null
}

type UserRow = { id: string; name: string; color: string | null }

type NotifRow = {
  id: string
  event_type: string
  sent_at: string | null
  read_at: string | null
  target_id: string | null
  target_type: string | null
  payload: unknown
}

// ── Page (Server Component) ──────────────────────────────────────────────────
export default async function DashboardPage() {
  let todaySchedules: DashSchedule[] = []
  let notifications: DashNotification[] = []
  let execs: { id: string; name: string; color: string | null; title: string }[] = []
  const execScheduleCounts: Record<string, number> = {}

  const { start: weekStart, end: weekEnd, label: weekLabel } = getWeekRange(TODAY)

  try {
    const supabase = await createUserClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (user) {
      // 오늘 일정
      const { data: rawSchedules } = await supabase
        .from('schedules')
        .select('id, type, title, schedule_date, time_slot, start_time, end_time, is_all_day, location, owner_id')
        .is('deleted_at', null)
        .eq('schedule_date', TODAY)
        .order('start_time', { ascending: true })

      const scheduleRows = (rawSchedules ?? []) as unknown as ScheduleRow[]

      if (scheduleRows.length > 0) {
        const ownerIds = [
          ...new Set(scheduleRows.map((r) => r.owner_id).filter((id): id is string => id !== null)),
        ]

        let ownerRows: UserRow[] = []
        if (ownerIds.length > 0) {
          const { data } = await supabase
            .from('users')
            .select('id, name, color')
            .in('id', ownerIds)
          ownerRows = (data ?? []) as unknown as UserRow[]
        }

        const ownerMap = Object.fromEntries(ownerRows.map((u) => [u.id, u]))

        todaySchedules = scheduleRows.map((r) => ({
          id: r.id,
          type: r.type as 'personal' | 'common',
          title: r.title,
          schedule_date: r.schedule_date,
          time_slot: r.time_slot as DashSchedule['time_slot'],
          start_time: r.start_time,
          end_time: r.end_time,
          is_all_day: r.is_all_day,
          location: r.location,
          owner: r.owner_id && ownerMap[r.owner_id]
            ? { id: ownerMap[r.owner_id].id, name: ownerMap[r.owner_id].name, color: ownerMap[r.owner_id].color }
            : null,
        }))
      }

      // 임원 목록
      const { data: rawExecs } = await supabase
        .from('users')
        .select('id, name, color')
        .is('deleted_at', null)
        .eq('role', 'user')
        .eq('status', 'active')

      const execRows = (rawExecs ?? []) as unknown as UserRow[]
      execs = execRows.map((u) => ({
        id: u.id,
        name: u.name,
        color: u.color,
        title: '',
      }))

      // 이번 주 임원별 일정 수
      const execIds = execs.map((e) => e.id)
      if (execIds.length > 0) {
        const { data: rawWeekRows } = await supabase
          .from('schedules')
          .select('owner_id')
          .is('deleted_at', null)
          .in('owner_id', execIds)
          .gte('schedule_date', weekStart)
          .lte('schedule_date', weekEnd)

        const weekRows = (rawWeekRows ?? []) as unknown as { owner_id: string | null }[]
        for (const row of weekRows) {
          if (row.owner_id) {
            execScheduleCounts[row.owner_id] = (execScheduleCounts[row.owner_id] ?? 0) + 1
          }
        }
      }

      // 미확인 알림
      const { data: rawNotifs } = await supabase
        .from('notification_logs')
        .select('id, event_type, sent_at, read_at, target_id, target_type, payload')
        .eq('recipient_id', user.id)
        .is('read_at', null)
        .order('sent_at', { ascending: false })
        .limit(10)

      const notifRows = (rawNotifs ?? []) as unknown as NotifRow[]
      notifications = notifRows
        .filter((n) => n.sent_at !== null)
        .map((n) => ({
          id: n.id,
          event_type: n.event_type as DashNotification['event_type'],
          sent_at: n.sent_at as string,
          read_at: n.read_at,
          target_id: n.target_id,
          target_type: n.target_type,
          payload: (n.payload ?? { title: '' }) as { title: string },
        }))
    }
  } catch {
    // Supabase 연결 실패 시 빈 데이터로 graceful fallback
  }

  return (
    <Suspense>
      <DashboardView
        today={TODAY}
        todaySchedules={todaySchedules}
        notifications={notifications}
        execs={execs}
        execScheduleCounts={execScheduleCounts}
        weekLabel={weekLabel}
      />
    </Suspense>
  )
}
