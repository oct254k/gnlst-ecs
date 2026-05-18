import { Suspense } from 'react'
import { createUserClient } from '@/app/_lib/supabase/server'
import { RadarView } from '@/components/radar/radar-view'
import type { RadarExec } from '@/components/radar/radar-view'

// 기본 날짜 범위: 오늘부터 6일
function getDefaultRange(): { start: string; end: string } {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const start = today.toISOString().slice(0, 10)
  const end = new Date(today.getTime() + 6 * 86400000).toISOString().slice(0, 10)
  return { start, end }
}

type UserRow = { id: string; name: string; color: string | null }

export default async function RadarPage() {
  let execs: RadarExec[] = []
  const { start: DEFAULT_START, end: DEFAULT_END } = getDefaultRange()

  try {
    const supabase = await createUserClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (user) {
      const { data: rawExecs } = await supabase
        .from('users')
        .select('id, name, color')
        .is('deleted_at', null)
        .eq('status', 'active')
        .ilike('email', '%@gnlst.com')

      const execRows = (rawExecs ?? []) as unknown as UserRow[]
      execs = execRows.map((u) => ({
        id: u.id,
        name: u.name,
        color: u.color ?? '#64748B',
        title: '',
      }))
    }
  } catch {
    // Supabase 연결 실패 시 빈 데이터로 graceful fallback
  }

  return (
    <Suspense>
      <RadarView
        execs={execs}
        defaultStart={DEFAULT_START}
        defaultEnd={DEFAULT_END}
      />
    </Suspense>
  )
}
