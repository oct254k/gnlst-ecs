import { NextResponse } from 'next/server'
import { createUserClient, createServiceRoleClient } from '@/app/_lib/supabase/server'
import type { TablesInsert } from '@/app/_lib/supabase/types'

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
  const { name, email, employee_id, role, color } = body as {
    name: string
    email: string
    employee_id: string
    role: 'admin' | 'user'
    color?: string | null
  }

  if (!name || !email || !employee_id || !role) {
    return NextResponse.json(
      { data: null, error: { code: 'INTERNAL_ERROR', message: '필수 항목이 누락되었습니다' } },
      { status: 400 }
    )
  }

  const adminClient = createServiceRoleClient()

  // Check duplicates
  const { data: existing } = await adminClient
    .from('users')
    .select('id, email, employee_id')
    .is('deleted_at', null)
    .or(`email.eq.${email},employee_id.eq.${employee_id}`)
    .limit(1)

  if (existing && existing.length > 0) {
    const dup = existing[0] as unknown as { email: string; employee_id: string }
    if (dup.email === email) {
      return NextResponse.json(
        { data: null, error: { code: 'EMAIL_DUPLICATE', message: '이미 사용 중인 이메일입니다' } },
        { status: 409 }
      )
    }
    return NextResponse.json(
      { data: null, error: { code: 'EMPLOYEE_ID_DUPLICATE', message: '이미 사용 중인 사번입니다' } },
      { status: 409 }
    )
  }

  // Send invite email via Supabase Auth
  const { data: inviteData, error: inviteError } = await adminClient.auth.admin.inviteUserByEmail(
    email,
    { data: { role, name, employee_id, color: color ?? null } }
  )

  if (inviteError) {
    return NextResponse.json(
      { data: null, error: { code: 'INTERNAL_ERROR', message: inviteError.message } },
      { status: 500 }
    )
  }

  const authUserId = inviteData.user.id

  // Insert into public.users
  const insertPayload = {
    id: authUserId,
    email,
    employee_id,
    name,
    role,
    status: 'pending',
    color: color ?? null,
  } satisfies TablesInsert<'users'>

  const { data: newUser, error: insertError } = await adminClient
    .from('users')
    .insert(insertPayload as never)
    .select('id, name, email, status')
    .single()

  if (insertError) {
    return NextResponse.json(
      { data: null, error: { code: 'INTERNAL_ERROR', message: insertError.message } },
      { status: 500 }
    )
  }

  return NextResponse.json({ data: newUser, error: null }, { status: 201 })
}
