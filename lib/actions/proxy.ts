'use server'

import { createUserClient, createAdminClient } from '@/app/_lib/supabase/server'
import type { TablesInsert, TablesUpdate } from '@/app/_lib/supabase/types'

export async function grantProxy(input: {
  proxy_user_id: string
  target_user_id: string
}): Promise<{ success: boolean; error?: string }> {
  const supabase = await createUserClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || user.user_metadata?.role !== 'admin') {
    return { success: false, error: '권한이 없습니다' }
  }

  const adminClient = await createAdminClient()

  // Check for existing active permission
  const { data: existing } = await adminClient
    .from('proxy_permissions')
    .select('id')
    .eq('proxy_user_id', input.proxy_user_id)
    .eq('target_user_id', input.target_user_id)
    .is('revoked_at', null)
    .limit(1)

  if (existing && existing.length > 0) {
    return { success: false, error: '이미 활성 대리 권한이 존재합니다' }
  }

  const insertPayload = {
    proxy_user_id: input.proxy_user_id,
    target_user_id: input.target_user_id,
    granted_by: user.id,
  } satisfies TablesInsert<'proxy_permissions'>

  const { error } = await adminClient
    .from('proxy_permissions')
    .insert(insertPayload as never)

  if (error) {
    return { success: false, error: error.message }
  }

  return { success: true }
}

export async function revokeProxy(
  permissionId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createUserClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || user.user_metadata?.role !== 'admin') {
    return { success: false, error: '권한이 없습니다' }
  }

  const adminClient = await createAdminClient()

  const { data: existing } = await adminClient
    .from('proxy_permissions')
    .select('id')
    .eq('id', permissionId)
    .is('revoked_at', null)
    .single()

  if (!existing) {
    return { success: false, error: '대리 권한을 찾을 수 없습니다' }
  }

  // Must set both revoked_at and revoked_by per ERD CHECK constraint
  const updatePayload = {
    revoked_at: new Date().toISOString(),
    revoked_by: user.id,
  } satisfies TablesUpdate<'proxy_permissions'>

  const { error } = await adminClient
    .from('proxy_permissions')
    .update(updatePayload as never)
    .eq('id', permissionId)

  if (error) {
    return { success: false, error: error.message }
  }

  return { success: true }
}
