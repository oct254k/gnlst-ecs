'use server'

import { createUserClient, createAdminClient } from '@/app/_lib/supabase/server'
import type { TablesInsert, TablesUpdate } from '@/app/_lib/supabase/types'

export async function inviteUser(input: {
  name: string
  email: string
  employee_id: string
  role: 'admin' | 'user'
  color?: string | null
}): Promise<{ success: boolean; error?: string }> {
  const supabase = await createUserClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || user.user_metadata?.role !== 'admin') {
    return { success: false, error: '권한이 없습니다' }
  }

  const adminClient = await createAdminClient()

  const { data: existing } = await adminClient
    .from('users')
    .select('id, email, employee_id')
    .is('deleted_at', null)
    .or(`email.eq.${input.email},employee_id.eq.${input.employee_id}`)
    .limit(1)

  if (existing && existing.length > 0) {
    const dup = existing[0] as unknown as { email: string; employee_id: string }
    return {
      success: false,
      error: dup.email === input.email ? '이미 사용 중인 이메일입니다' : '이미 사용 중인 사번입니다',
    }
  }

  const { data: inviteData, error: inviteError } = await adminClient.auth.admin.inviteUserByEmail(
    input.email,
    {
      data: {
        role: input.role,
        name: input.name,
        employee_id: input.employee_id,
        color: input.color ?? null,
      },
    }
  )

  if (inviteError) {
    return { success: false, error: inviteError.message }
  }

  const insertPayload = {
    id: inviteData.user.id,
    email: input.email,
    employee_id: input.employee_id,
    name: input.name,
    role: input.role,
    status: 'pending',
    color: input.color ?? null,
  } satisfies TablesInsert<'users'>

  const { error: insertError } = await adminClient
    .from('users')
    .insert(insertPayload as never)

  if (insertError) {
    return { success: false, error: insertError.message }
  }

  return { success: true }
}

export async function updateUserRole(
  userId: string,
  role: 'admin' | 'user'
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createUserClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || user.user_metadata?.role !== 'admin') {
    return { success: false, error: '권한이 없습니다' }
  }

  const adminClient = await createAdminClient()
  const updatePayload = { role } satisfies TablesUpdate<'users'>

  const { error } = await adminClient
    .from('users')
    .update(updatePayload as never)
    .eq('id', userId)
    .is('deleted_at', null)

  if (error) {
    return { success: false, error: error.message }
  }

  return { success: true }
}

export async function updateUserStatus(
  userId: string,
  status: 'active' | 'inactive'
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createUserClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || user.user_metadata?.role !== 'admin') {
    return { success: false, error: '권한이 없습니다' }
  }

  const adminClient = await createAdminClient()
  const updatePayload = { status } satisfies TablesUpdate<'users'>

  const { error } = await adminClient
    .from('users')
    .update(updatePayload as never)
    .eq('id', userId)
    .is('deleted_at', null)

  if (error) {
    return { success: false, error: error.message }
  }

  return { success: true }
}
