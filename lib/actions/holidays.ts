'use server'

import { createUserClient, createAdminClient } from '@/app/_lib/supabase/server'
import type { TablesInsert, TablesUpdate } from '@/app/_lib/supabase/types'

export async function createHoliday(input: {
  holiday_date: string
  name: string
  memo?: string | null
}): Promise<{ success: boolean; error?: string }> {
  const supabase = await createUserClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || user.user_metadata?.role !== 'admin') {
    return { success: false, error: '권한이 없습니다' }
  }

  const adminClient = await createAdminClient()

  const { data: existing } = await adminClient
    .from('holidays')
    .select('id')
    .is('deleted_at', null)
    .eq('holiday_date', input.holiday_date)
    .limit(1)

  if (existing && existing.length > 0) {
    return { success: false, error: '해당 날짜에 이미 공휴일이 등록되어 있습니다' }
  }

  const year = new Date(input.holiday_date).getFullYear()

  const insertPayload = {
    holiday_date: input.holiday_date,
    name: input.name,
    type: 'temporary' as const,
    year,
    memo: input.memo ?? null,
    created_by: user.id,
  } satisfies TablesInsert<'holidays'>

  const { error } = await adminClient
    .from('holidays')
    .insert(insertPayload as never)

  if (error) {
    return { success: false, error: error.message }
  }

  return { success: true }
}

export async function deleteHoliday(
  holidayId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createUserClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || user.user_metadata?.role !== 'admin') {
    return { success: false, error: '권한이 없습니다' }
  }

  const adminClient = await createAdminClient()

  const { data: rawHoliday } = await adminClient
    .from('holidays')
    .select('id, type')
    .eq('id', holidayId)
    .is('deleted_at', null)
    .single()

  const holiday = rawHoliday as unknown as { id: string; type: string } | null

  if (!holiday) {
    return { success: false, error: '공휴일을 찾을 수 없습니다' }
  }

  if (holiday.type !== 'temporary') {
    return { success: false, error: '법정·대체 공휴일은 삭제할 수 없습니다' }
  }

  const updatePayload = {
    deleted_at: new Date().toISOString(),
    deleted_by: user.id,
    is_active: false,
  } satisfies TablesUpdate<'holidays'>

  const { error } = await adminClient
    .from('holidays')
    .update(updatePayload as never)
    .eq('id', holidayId)

  if (error) {
    return { success: false, error: error.message }
  }

  return { success: true }
}
