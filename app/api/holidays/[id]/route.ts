import { NextResponse } from 'next/server'
import { createUserClient, createAdminClient } from '@/app/_lib/supabase/server'
import type { TablesUpdate } from '@/app/_lib/supabase/types'

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
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

  const { id } = await params
  const body = await request.json()
  const { is_active } = body as { is_active: boolean }

  if (typeof is_active !== 'boolean') {
    return NextResponse.json(
      { data: null, error: { code: 'INVALID_PARAMS', message: 'is_active 필드가 필요합니다' } },
      { status: 400 }
    )
  }

  const adminClient = await createAdminClient()

  const updatePayload = { is_active } satisfies TablesUpdate<'holidays'>

  const { data, error } = await adminClient
    .from('holidays')
    .update(updatePayload as never)
    .eq('id', id)
    .is('deleted_at', null)
    .select('id, holiday_date, name, type, year, is_active')
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      return NextResponse.json(
        { data: null, error: { code: 'NOT_FOUND', message: '공휴일을 찾을 수 없습니다' } },
        { status: 404 }
      )
    }
    return NextResponse.json(
      { data: null, error: { code: 'INTERNAL_ERROR', message: error.message } },
      { status: 500 }
    )
  }

  return NextResponse.json({ data, error: null })
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
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

  const { id } = await params
  const adminClient = await createAdminClient()

  const { data: rawHoliday, error: fetchError } = await adminClient
    .from('holidays')
    .select('id, type')
    .eq('id', id)
    .is('deleted_at', null)
    .single()

  const holiday = rawHoliday as unknown as { id: string; type: string } | null

  if (fetchError || !holiday) {
    return NextResponse.json(
      { data: null, error: { code: 'NOT_FOUND', message: '공휴일을 찾을 수 없습니다' } },
      { status: 404 }
    )
  }

  if (holiday.type !== 'temporary') {
    return NextResponse.json(
      { data: null, error: { code: 'CANNOT_DELETE_STATUTORY', message: '법정·대체 공휴일은 삭제할 수 없습니다' } },
      { status: 403 }
    )
  }

  const updatePayload = {
    deleted_at: new Date().toISOString(),
    deleted_by: user.id,
    is_active: false,
  } satisfies TablesUpdate<'holidays'>

  const { error } = await adminClient
    .from('holidays')
    .update(updatePayload as never)
    .eq('id', id)

  if (error) {
    return NextResponse.json(
      { data: null, error: { code: 'INTERNAL_ERROR', message: error.message } },
      { status: 500 }
    )
  }

  return new NextResponse(null, { status: 204 })
}
