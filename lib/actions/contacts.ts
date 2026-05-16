'use server'

import { createUserClient } from '@/app/_lib/supabase/server'

interface CreateContactInput {
  name: string
  company_id?: string | null
  title?: string | null
  email?: string | null
  phone?: string | null
}

interface UpdateContactInput {
  name?: string
  company_id?: string | null
  title?: string | null
  email?: string | null
  phone?: string | null
  status?: string
}

// createContact: 연락처 등록 (admin only)
export async function createContact(
  input: CreateContactInput
): Promise<{ success: boolean; data?: { id: string }; error?: string }> {
  const supabase = await createUserClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { success: false, error: '인증이 필요합니다' }
  }
  if (user.user_metadata?.role !== 'admin') {
    return { success: false, error: '권한이 없습니다' }
  }

  if (!input.name?.trim()) {
    return { success: false, error: '이름은 필수입니다' }
  }

  const { data, error } = await supabase
    .from('contacts')
    .insert({
      name: input.name.trim(),
      company_id: input.company_id ?? null,
      title: input.title ?? null,
      email: input.email ?? null,
      phone: input.phone ?? null,
      created_by: user.id,
    } as never)
    .select('id')
    .single()

  if (error) {
    return { success: false, error: error.message }
  }

  return { success: true, data: { id: (data as { id: string }).id } }
}

// updateContact: 연락처 수정 (admin only)
export async function updateContact(
  id: string,
  input: UpdateContactInput
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createUserClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { success: false, error: '인증이 필요합니다' }
  }
  if (user.user_metadata?.role !== 'admin') {
    return { success: false, error: '권한이 없습니다' }
  }

  const updatePayload: Record<string, unknown> = {}
  if (input.name !== undefined) updatePayload.name = input.name
  if (input.company_id !== undefined) updatePayload.company_id = input.company_id
  if (input.title !== undefined) updatePayload.title = input.title
  if (input.email !== undefined) updatePayload.email = input.email
  if (input.phone !== undefined) updatePayload.phone = input.phone
  if (input.status !== undefined) updatePayload.status = input.status

  const { error } = await supabase
    .from('contacts')
    .update(updatePayload as never)
    .eq('id', id)
    .is('deleted_at', null)

  if (error) {
    return { success: false, error: error.message }
  }

  return { success: true }
}

// deleteContact: 연락처 soft delete (admin only)
export async function deleteContact(
  id: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createUserClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { success: false, error: '인증이 필요합니다' }
  }
  if (user.user_metadata?.role !== 'admin') {
    return { success: false, error: '권한이 없습니다' }
  }

  // 활성 일정에 멘션 참조 여부 확인
  const { count: mentionCount } = await supabase
    .from('mentions')
    .select('id', { count: 'exact', head: true })
    .eq('reference_type', 'contact')
    .eq('reference_id', id)

  if (mentionCount && mentionCount > 0) {
    return { success: false, error: '활성 일정에 멘션 참조가 있습니다' }
  }

  const now = new Date().toISOString()

  const { error } = await supabase
    .from('contacts')
    .update({ deleted_at: now, deleted_by: user.id } as never)
    .eq('id', id)
    .is('deleted_at', null)

  if (error) {
    return { success: false, error: error.message }
  }

  return { success: true }
}
