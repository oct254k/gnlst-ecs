import { NextResponse } from 'next/server'
import { createUserClient, createAdminClient } from '@/app/_lib/supabase/server'
import type { TablesInsert } from '@/app/_lib/supabase/types'

export async function GET(request: Request) {
  const supabase = await createUserClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json(
      { data: null, error: { code: 'UNAUTHORIZED', message: '인증이 필요합니다' } },
      { status: 401 }
    )
  }

  const { searchParams } = new URL(request.url)
  const yearParam = searchParams.get('year')
  const typeParam = searchParams.get('type')
  const year = yearParam ? parseInt(yearParam, 10) : new Date().getFullYear()

  let query = supabase
    .from('holidays')
    .select('id, holiday_date, name, type, year, is_active')
    .is('deleted_at', null)
    .eq('year', year)

  if (typeParam) {
    query = query.eq('type', typeParam)
  }

  const { data, error } = await query

  if (error) {
    return NextResponse.json(
      { data: null, error: { code: 'INTERNAL_ERROR', message: error.message } },
      { status: 500 }
    )
  }

  return NextResponse.json({ data, error: null })
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
  const { holiday_date, name, type, memo } = body as {
    holiday_date: string
    name: string
    type: 'temporary'
    memo?: string | null
  }

  if (!holiday_date || !name || type !== 'temporary') {
    return NextResponse.json(
      { data: null, error: { code: 'INTERNAL_ERROR', message: '필수 항목이 누락되었거나 유형이 임시 공휴일이 아닙니다' } },
      { status: 400 }
    )
  }

  const year = new Date(holiday_date).getFullYear()
  const adminClient = await createAdminClient()

  // Check for duplicate holiday date (any type, active)
  const { data: existing } = await adminClient
    .from('holidays')
    .select('id')
    .is('deleted_at', null)
    .eq('holiday_date', holiday_date)
    .limit(1)

  if (existing && existing.length > 0) {
    return NextResponse.json(
      { data: null, error: { code: 'HOLIDAY_DATE_DUPLICATE', message: '해당 날짜에 이미 공휴일이 등록되어 있습니다' } },
      { status: 409 }
    )
  }

  const insertPayload = {
    holiday_date,
    name,
    type,
    year,
    memo: memo ?? null,
    created_by: user.id,
  } satisfies TablesInsert<'holidays'>

  const { data, error } = await adminClient
    .from('holidays')
    .insert(insertPayload as never)
    .select('id, holiday_date, name, type, year, is_active')
    .single()

  if (error) {
    return NextResponse.json(
      { data: null, error: { code: 'INTERNAL_ERROR', message: error.message } },
      { status: 500 }
    )
  }

  return NextResponse.json({ data, error: null }, { status: 201 })
}
