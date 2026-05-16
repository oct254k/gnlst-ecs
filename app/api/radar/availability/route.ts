import { NextResponse } from 'next/server'
import { createUserClient } from '@/app/_lib/supabase/server'
import type { Database } from '@/app/_lib/supabase/types'

type RadarRow = Database['public']['Functions']['fn_radar_availability']['Returns'][number]

export async function POST(request: Request) {
  const supabase = await createUserClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json(
      { data: null, error: { code: 'UNAUTHORIZED', message: '인증이 필요합니다' } },
      { status: 401 }
    )
  }

  const body = await request.json()
  const { owner_ids, date_from, date_to, slot_minutes } = body as {
    owner_ids: string[]
    date_from: string
    date_to: string
    slot_minutes?: number
  }

  if (!owner_ids?.length || !date_from || !date_to) {
    return NextResponse.json(
      { data: null, error: { code: 'INTERNAL_ERROR', message: '필수 항목이 누락되었습니다' } },
      { status: 400 }
    )
  }

  // Validate date range (max 30 days)
  const diffMs = new Date(date_to).getTime() - new Date(date_from).getTime()
  const diffDays = diffMs / (1000 * 60 * 60 * 24)
  if (diffDays > 30) {
    return NextResponse.json(
      { data: null, error: { code: 'DATE_RANGE_TOO_LARGE', message: '날짜 범위는 최대 30일입니다' } },
      { status: 400 }
    )
  }

  // Call fn_radar_availability RPC (function name from types.ts)
  const { data: rpcData, error: rpcError } = await (supabase.rpc as Function)(
    'fn_radar_availability',
    {
      p_owner_ids: owner_ids,
      p_date_from: date_from,
      p_date_to: date_to,
      p_slot_min: slot_minutes ?? 60,
    }
  )

  if (rpcError) {
    return NextResponse.json(
      { data: null, error: { code: 'INTERNAL_ERROR', message: rpcError.message } },
      { status: 500 }
    )
  }

  const rows = (rpcData ?? []) as RadarRow[]

  // Collect all conflicted_ids for a single name-lookup query
  const allConflictedIds = [...new Set(rows.flatMap((r) => r.conflicted_ids ?? []))]

  let userMap: Map<string, string> = new Map()
  if (allConflictedIds.length > 0) {
    const { data: rawUsers } = await supabase
      .from('users')
      .select('id, name')
      .in('id', allConflictedIds)
      .is('deleted_at', null)

    const users = (rawUsers ?? []) as unknown as Array<{ id: string; name: string }>
    userMap = new Map(users.map((u) => [u.id, u.name]))
  }

  const slots = rows.map((row) => ({
    date: row.slot_date,
    start_time: row.slot_start,
    end_time: row.slot_end,
    status: row.status as 'AVAILABLE' | 'PARTIAL' | 'UNAVAILABLE',
    available_count: row.available_count,
    total_count: row.total_count,
    conflicted_users: (row.conflicted_ids ?? []).map((id) => ({
      id,
      name: userMap.get(id) ?? '',
    })),
  }))

  return NextResponse.json({ data: { slots }, error: null })
}
