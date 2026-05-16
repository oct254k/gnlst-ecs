import { NextResponse } from 'next/server'
import { createUserClient, createAdminClient } from '@/app/_lib/supabase/server'
import type { TablesInsert } from '@/app/_lib/supabase/types'

type PermRow = {
  id: string
  proxy_user_id: string
  target_user_id: string
  granted_by: string
  granted_at: string
  revoked_at: string | null
}

export async function GET(request: Request) {
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

  const { searchParams } = new URL(request.url)
  const activeOnly = searchParams.get('active') === 'true'

  let query = supabase
    .from('proxy_permissions')
    .select('id, proxy_user_id, target_user_id, granted_by, granted_at, revoked_at')

  if (activeOnly) {
    query = query.is('revoked_at', null)
  }

  const { data: rawPerms, error } = await query

  if (error) {
    return NextResponse.json(
      { data: null, error: { code: 'INTERNAL_ERROR', message: error.message } },
      { status: 500 }
    )
  }

  const perms = (rawPerms ?? []) as unknown as PermRow[]

  if (perms.length === 0) {
    return NextResponse.json({ data: [], error: null })
  }

  // Collect all user IDs we need to look up
  const userIds = [
    ...new Set([
      ...perms.map((p) => p.proxy_user_id),
      ...perms.map((p) => p.target_user_id),
      ...perms.map((p) => p.granted_by),
    ]),
  ]

  const { data: rawUsers } = await supabase
    .from('users')
    .select('id, name')
    .in('id', userIds)

  const users = (rawUsers ?? []) as unknown as Array<{ id: string; name: string }>
  const userMap = new Map(users.map((u) => [u.id, u.name]))

  const shaped = perms.map((p) => ({
    id: p.id,
    proxy_user: { id: p.proxy_user_id, name: userMap.get(p.proxy_user_id) ?? '' },
    target_user: { id: p.target_user_id, name: userMap.get(p.target_user_id) ?? '' },
    granted_by: { id: p.granted_by, name: userMap.get(p.granted_by) ?? '' },
    granted_at: p.granted_at,
    revoked_at: p.revoked_at,
  }))

  return NextResponse.json({ data: shaped, error: null })
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
  const { proxy_user_id, target_user_id } = body as {
    proxy_user_id: string
    target_user_id: string
  }

  if (!proxy_user_id || !target_user_id) {
    return NextResponse.json(
      { data: null, error: { code: 'INTERNAL_ERROR', message: '필수 항목이 누락되었습니다' } },
      { status: 400 }
    )
  }

  // 본인에게 대리 권한 부여 방지 (P3-4)
  if (proxy_user_id === target_user_id) {
    return NextResponse.json(
      { data: null, error: { code: 'SELF_PROXY_NOT_ALLOWED', message: '본인에게 대리 입력 권한을 부여할 수 없습니다' } },
      { status: 400 }
    )
  }

  const adminClient = await createAdminClient()

  // Check for existing active permission
  const { data: existing } = await adminClient
    .from('proxy_permissions')
    .select('id')
    .eq('proxy_user_id', proxy_user_id)
    .eq('target_user_id', target_user_id)
    .is('revoked_at', null)
    .limit(1)

  if (existing && existing.length > 0) {
    return NextResponse.json(
      { data: null, error: { code: 'PERMISSION_DUPLICATE', message: '이미 활성 대리 권한이 존재합니다' } },
      { status: 409 }
    )
  }

  const insertPayload = {
    proxy_user_id,
    target_user_id,
    granted_by: user.id,
  } satisfies TablesInsert<'proxy_permissions'>

  const { data: rawNew, error } = await adminClient
    .from('proxy_permissions')
    .insert(insertPayload as never)
    .select('id, proxy_user_id, target_user_id')
    .single()

  if (error) {
    return NextResponse.json(
      { data: null, error: { code: 'INTERNAL_ERROR', message: error.message } },
      { status: 500 }
    )
  }

  const newPerm = rawNew as unknown as { id: string; proxy_user_id: string; target_user_id: string }

  return NextResponse.json({ data: newPerm, error: null }, { status: 201 })
}
