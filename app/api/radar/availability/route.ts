import { NextResponse } from 'next/server'
import { createUserClient } from '@/app/_lib/supabase/server'

type SlotKey = 'allday' | 'morning' | 'lunch' | 'afternoon' | 'evening'

interface RadarRow {
  slot_date: string
  slot_key: SlotKey
  slot_start: string
  slot_end: string
  total_count: number
}

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
  const { owner_ids, date_from, date_to } = body as {
    owner_ids: string[]
    date_from: string
    date_to: string
  }

  if (!owner_ids?.length || !date_from || !date_to) {
    return NextResponse.json(
      { data: null, error: { code: 'BAD_REQUEST', message: '필수 항목이 누락되었습니다' } },
      { status: 400 }
    )
  }

  const diffDays = (new Date(date_to).getTime() - new Date(date_from).getTime()) / 86400000
  if (diffDays < 0 || diffDays > 30) {
    return NextResponse.json(
      { data: null, error: { code: 'BAD_REQUEST', message: '날짜 범위는 1~30일이어야 합니다' } },
      { status: 400 }
    )
  }

  const { data: rpcData, error: rpcError } = await (supabase.rpc as Function)(
    'fn_radar_availability',
    { p_owner_ids: owner_ids, p_date_from: date_from, p_date_to: date_to }
  )

  if (rpcError) {
    return NextResponse.json(
      { data: null, error: { code: 'INTERNAL_ERROR', message: rpcError.message } },
      { status: 500 }
    )
  }

  const slots = ((rpcData ?? []) as RadarRow[]).map((row) => ({
    date: row.slot_date,
    slot: row.slot_key,
    start_time: row.slot_start,
    end_time: row.slot_end,
    total: row.total_count,
  }))

  return NextResponse.json({ data: { slots }, error: null })
}
