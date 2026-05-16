import { Suspense } from 'react'
import { createUserClient } from '@/app/_lib/supabase/server'
import { ListView } from '@/components/list/list-view'

/* ── 타입 정의 (ListView가 이 파일에서 import함) ───────────────────── */

export type MockMention =
  | { type: 'company'; id: string; name: string }
  | { type: 'contact'; id: string; name: string }

export interface MockSchedule {
  id: string
  schedule_date: string
  time_slot: 'morning' | 'lunch' | 'afternoon' | 'evening' | 'allday'
  start_time: string | null
  end_time: string | null
  is_all_day: boolean
  title: string
  location: string | null
  type: 'personal' | 'common'
  owner_id: string | null
  memo: string | null
  mentions: MockMention[]
  participants?: string[]
}

export interface MockUser {
  id: string
  name: string
  color: string
  title: string
  role: 'admin' | 'user'
  status: 'active' | 'inactive'
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
  memo: string | null
  owner_id: string | null
}

type UserRow = { id: string; name: string; color: string | null; role: string; status: string }
type MentionRow = { schedule_id: string; reference_type: string; reference_id: string; raw_text: string }
type ParticipantRow = { schedule_id: string; user_id: string }

// ── Server Component ─────────────────────────────────────────────────────────
export default async function ListPage() {
  let initialSchedules: MockSchedule[] = []
  let users: MockUser[] = []

  try {
    const supabase = await createUserClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (user) {
      // 현재 달 기준 일정 조회
      const now = new Date()
      const dateFrom = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`
      const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()
      const dateTo = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`

      const [schedulesResult, usersResult] = await Promise.all([
        supabase
          .from('schedules')
          .select('id, type, title, schedule_date, time_slot, start_time, end_time, is_all_day, location, memo, owner_id')
          .is('deleted_at', null)
          .gte('schedule_date', dateFrom)
          .lte('schedule_date', dateTo)
          .order('schedule_date', { ascending: true })
          .order('start_time', { ascending: true }),
        supabase
          .from('users')
          .select('id, name, color, role, status')
          .is('deleted_at', null),
      ])

      const scheduleRows = (schedulesResult.data ?? []) as unknown as ScheduleRow[]
      const userRows = (usersResult.data ?? []) as unknown as UserRow[]

      if (scheduleRows.length > 0) {
        const scheduleIds = scheduleRows.map((r) => r.id)

        const [mentionsResult, participantsResult] = await Promise.all([
          supabase
            .from('mentions')
            .select('schedule_id, reference_type, reference_id, raw_text')
            .in('schedule_id', scheduleIds),
          supabase
            .from('schedule_participants')
            .select('schedule_id, user_id')
            .in('schedule_id', scheduleIds)
            .eq('status', 'joined'),
        ])

        const mentionRows = (mentionsResult.data ?? []) as unknown as MentionRow[]
        const participantRows = (participantsResult.data ?? []) as unknown as ParticipantRow[]

        const mentionsBySchedule: Record<string, MockMention[]> = {}
        for (const m of mentionRows) {
          if (!mentionsBySchedule[m.schedule_id]) mentionsBySchedule[m.schedule_id] = []
          if (m.reference_type === 'company' || m.reference_type === 'contact') {
            mentionsBySchedule[m.schedule_id].push({
              type: m.reference_type,
              id: m.reference_id,
              name: m.raw_text,
            })
          }
        }

        const participantsBySchedule: Record<string, string[]> = {}
        for (const p of participantRows) {
          if (!participantsBySchedule[p.schedule_id]) participantsBySchedule[p.schedule_id] = []
          participantsBySchedule[p.schedule_id].push(p.user_id)
        }

        initialSchedules = scheduleRows.map((r) => ({
          id: r.id,
          schedule_date: r.schedule_date,
          time_slot: r.time_slot as MockSchedule['time_slot'],
          start_time: r.start_time,
          end_time: r.end_time,
          is_all_day: r.is_all_day,
          title: r.title,
          location: r.location,
          type: r.type as 'personal' | 'common',
          owner_id: r.owner_id,
          memo: r.memo,
          mentions: mentionsBySchedule[r.id] ?? [],
          participants: participantsBySchedule[r.id],
        }))
      }

      users = userRows.map((u) => ({
        id: u.id,
        name: u.name,
        color: u.color ?? '#64748B',
        title: '',
        role: u.role as 'admin' | 'user',
        status: (u.status === 'active' ? 'active' : 'inactive') as 'active' | 'inactive',
      }))
    }
  } catch {
    // Supabase 연결 실패 시 빈 데이터로 graceful fallback
  }

  return (
    <Suspense fallback={<div className="page-body"><div className="muted">불러오는 중...</div></div>}>
      <ListView
        initialSchedules={initialSchedules}
        users={users}
      />
    </Suspense>
  )
}
