// app/(app)/calendar/page.tsx — Server Component
import { Suspense } from 'react'
import { createUserClient } from '@/app/_lib/supabase/server'
import { CalendarView } from '@/components/calendar/calendar-view'
import type { MockUser } from '@/components/calendar/mock-data'
import type { CalendarSchedule, Holiday } from '@/lib/types'

// Next.js 15+: searchParams is a Promise
interface PageProps {
  searchParams: Promise<{ view?: string; year?: string; month?: string; date?: string }>
}

const TODAY = new Date().toISOString().slice(0, 10)

function getInitialDate(params: { view?: string; year?: string; month?: string; date?: string }): string {
  if (params.date) return params.date
  if (params.year && params.month) {
    return `${params.year}-${String(params.month).padStart(2, '0')}-01`
  }
  return TODAY
}

function getInitialView(params: { view?: string }): 'month' | 'week' | 'day' {
  if (params.view === 'week' || params.view === 'day') return params.view
  return 'month'
}

type UserRow = { id: string; name: string; color: string | null }

type ScheduleRow = {
  id: string
  type: string
  title: string
  schedule_date: string
  time_slot: string
  start_time: string | null
  end_time: string | null
  owner_id: string | null
}

export default async function CalendarPage({ searchParams }: PageProps) {
  const params = await searchParams
  const initialView = getInitialView(params)
  const initialDate = getInitialDate(params)

  let users: MockUser[] = []
  let schedules: CalendarSchedule[] = []
  let holidays: Holiday[] = []

  try {
    const supabase = await createUserClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (user) {
      // 현재 달 기준 (±1개월 여유)
      const refDate = new Date(initialDate + 'T00:00')
      const dateFrom = new Date(refDate.getFullYear(), refDate.getMonth() - 1, 1)
        .toISOString().slice(0, 10)
      const dateTo = new Date(refDate.getFullYear(), refDate.getMonth() + 2, 0)
        .toISOString().slice(0, 10)

      const currentYear = new Date().getFullYear()

      const [usersResult, schedulesResult, holidaysResult] = await Promise.all([
        supabase
          .from('users')
          .select('id, name, color')
          .is('deleted_at', null)
          .eq('role', 'user')
          .eq('status', 'active'),
        supabase
          .from('schedules')
          .select('id, type, title, schedule_date, time_slot, start_time, end_time, owner_id')
          .is('deleted_at', null)
          .gte('schedule_date', dateFrom)
          .lte('schedule_date', dateTo)
          .order('schedule_date', { ascending: true }),
        supabase
          .from('holidays')
          .select('id, holiday_date, name, type, year, original_holiday_name, memo, is_active, created_by, created_at, updated_at')
          .is('deleted_at', null)
          .eq('is_active', true)
          .in('year', [currentYear, currentYear + 1]),
      ])

      const userRows = (usersResult.data ?? []) as unknown as UserRow[]
      const scheduleRows = (schedulesResult.data ?? []) as unknown as ScheduleRow[]

      holidays = (holidaysResult.data ?? []) as unknown as Holiday[]

      users = userRows.map((u) => ({
        id: u.id,
        name: u.name,
        color: u.color ?? '#64748B',
        title: '',
      }))

      const ownerMap: Record<string, UserRow> = {}
      for (const u of userRows) {
        ownerMap[u.id] = u
      }

      // Fetch any missing owners (e.g. admin users who own schedules)
      const ownerIds = [...new Set(scheduleRows.map((r) => r.owner_id).filter((id): id is string => id !== null))]
      const missingIds = ownerIds.filter((id) => !ownerMap[id])
      if (missingIds.length > 0) {
        const { data: extraRaw } = await supabase
          .from('users')
          .select('id, name, color')
          .in('id', missingIds)
        const extra = (extraRaw ?? []) as unknown as UserRow[]
        for (const u of extra) {
          ownerMap[u.id] = u
        }
      }

      schedules = scheduleRows.map((r) => ({
        id: r.id,
        type: r.type as CalendarSchedule['type'],
        title: r.title,
        schedule_date: r.schedule_date,
        time_slot: r.time_slot as CalendarSchedule['time_slot'],
        start_time: r.start_time,
        end_time: r.end_time,
        owner: r.owner_id && ownerMap[r.owner_id]
          ? { id: ownerMap[r.owner_id].id, name: ownerMap[r.owner_id].name, color: ownerMap[r.owner_id].color }
          : null,
      }))
    }
  } catch {
    // Supabase 연결 실패 시 빈 데이터로 graceful fallback
  }

  return (
    <Suspense fallback={null}>
      <CalendarView
        users={users}
        schedules={schedules}
        holidays={holidays}
        today={TODAY}
        initialView={initialView}
        initialDate={initialDate}
      />
    </Suspense>
  )
}
