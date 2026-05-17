import { NextResponse } from 'next/server'
import { createUserClient, createServiceRoleClient } from '@/app/_lib/supabase/server'
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
  const { role, user_type } = body as { role?: 'admin' | 'user'; user_type?: 'executive' | 'staff' }

  if (!role && !user_type) {
    return NextResponse.json(
      { data: null, error: { code: 'INTERNAL_ERROR', message: '변경할 항목이 없습니다' } },
      { status: 400 }
    )
  }
  if (role && !['admin', 'user'].includes(role)) {
    return NextResponse.json(
      { data: null, error: { code: 'INTERNAL_ERROR', message: '유효하지 않은 역할입니다' } },
      { status: 400 }
    )
  }
  if (user_type && !['executive', 'staff'].includes(user_type)) {
    return NextResponse.json(
      { data: null, error: { code: 'INTERNAL_ERROR', message: '유효하지 않은 사용자 유형입니다' } },
      { status: 400 }
    )
  }

  const adminClient = createServiceRoleClient()

  const updatePayload: Record<string, unknown> = {}
  if (role) {
    updatePayload.role = role
    updatePayload.user_type = role === 'admin' ? null : (user_type ?? 'executive')
  } else if (user_type) {
    updatePayload.user_type = user_type
  }

  let query = adminClient
    .from('users')
    .update(updatePayload as never)
    .eq('id', id)
    .is('deleted_at', null)

  // user_type만 변경할 때는 role='user'인 사용자만 허용
  if (!role && user_type) query = query.eq('role', 'user')

  const { data, error } = await query
    .select('id, name, email, employee_id, role, user_type, status, color')
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

  // role이 바뀐 경우 JWT user_metadata도 동기화 (RLS는 JWT role 기준)
  if (role) {
    await adminClient.auth.admin.updateUserById(id, {
      user_metadata: { role },
    })
  }

  return NextResponse.json({ data, error: null })
}
