import { NextResponse } from 'next/server'
import { createUserClient, createServiceRoleClient } from '@/app/_lib/supabase/server'

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
  const { color } = body as { color: string }

  if (!color || !/^#[0-9A-Fa-f]{6}$/.test(color)) {
    return NextResponse.json(
      { data: null, error: { code: 'INTERNAL_ERROR', message: '유효하지 않은 색상입니다' } },
      { status: 400 }
    )
  }

  const adminClient = createServiceRoleClient()

  const { data, error } = await adminClient
    .from('users')
    .update({ color } as never)
    .eq('id', id)
    .is('deleted_at', null)
    .select('id, name, color')
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      return NextResponse.json(
        { data: null, error: { code: 'NOT_FOUND', message: '사용자를 찾을 수 없습니다' } },
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
