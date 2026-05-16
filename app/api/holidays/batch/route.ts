import { NextResponse } from 'next/server'
import { createUserClient, createAdminClient } from '@/app/_lib/supabase/server'
import type { TablesInsert } from '@/app/_lib/supabase/types'

// Placeholder statutory holidays for a given year.
// Real data is fetched by the Edge Function (holiday-batch).
// This Route Handler only inserts placeholder rows to trigger the batch.
function buildPlaceholderHolidays(year: number): TablesInsert<'holidays'>[] {
  const entries: Array<{ date: string; name: string; type: 'statutory' | 'substitute' }> = [
    { date: `${year}-01-01`, name: '신정', type: 'statutory' },
    { date: `${year}-03-01`, name: '삼일절', type: 'statutory' },
    { date: `${year}-05-05`, name: '어린이날', type: 'statutory' },
    { date: `${year}-06-06`, name: '현충일', type: 'statutory' },
    { date: `${year}-08-15`, name: '광복절', type: 'statutory' },
    { date: `${year}-10-03`, name: '개천절', type: 'statutory' },
    { date: `${year}-10-09`, name: '한글날', type: 'statutory' },
    { date: `${year}-12-25`, name: '성탄절', type: 'statutory' },
  ]

  return entries.map(({ date, name, type }) => ({
    holiday_date: date,
    name,
    type,
    year,
  }))
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
  if (user.user_metadata?.role !== 'admin') {
    return NextResponse.json(
      { data: null, error: { code: 'FORBIDDEN', message: '권한이 없습니다' } },
      { status: 403 }
    )
  }

  const body = await request.json()
  const { year } = body as { year: number }

  if (!year || typeof year !== 'number') {
    return NextResponse.json(
      { data: null, error: { code: 'INTERNAL_ERROR', message: '연도가 필요합니다' } },
      { status: 400 }
    )
  }

  const adminClient = await createAdminClient()
  const placeholders = buildPlaceholderHolidays(year)

  // Use upsert to avoid duplicates (holiday_date + type unique partial index)
  const { data, error } = await adminClient
    .from('holidays')
    .upsert(placeholders as never, { onConflict: 'holiday_date', ignoreDuplicates: true })
    .select('id')

  if (error) {
    return NextResponse.json(
      { data: null, error: { code: 'INTERNAL_ERROR', message: error.message } },
      { status: 500 }
    )
  }

  return NextResponse.json({
    data: { inserted: (data ?? []).length, year },
    error: null,
  })
}
