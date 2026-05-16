import { NextResponse } from 'next/server'
import { createUserClient, createAdminClient } from '@/app/_lib/supabase/server'
import type { TablesUpdate } from '@/app/_lib/supabase/types'

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

  // Verify the permission exists and is still active
  const { data: existing, error: fetchError } = await adminClient
    .from('proxy_permissions')
    .select('id')
    .eq('id', id)
    .is('revoked_at', null)
    .single()

  if (fetchError || !existing) {
    return NextResponse.json(
      { data: null, error: { code: 'NOT_FOUND', message: '대리 권한을 찾을 수 없습니다' } },
      { status: 404 }
    )
  }

  // Must set both revoked_at and revoked_by per ERD constraint
  const updatePayload = {
    revoked_at: new Date().toISOString(),
    revoked_by: user.id,
  } satisfies TablesUpdate<'proxy_permissions'>

  const { error } = await adminClient
    .from('proxy_permissions')
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
