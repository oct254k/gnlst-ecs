import { NextResponse } from 'next/server'
import { createUserClient } from '@/app/_lib/supabase/server'

export async function GET() {
  const supabase = await createUserClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json(
      { data: null, error: { code: 'UNAUTHORIZED', message: '인증이 필요합니다' } },
      { status: 401 }
    )
  }

  const { data, error } = await supabase
    .from('users')
    .select('id, name, color')
    .is('deleted_at', null)
    .eq('role', 'user')
    .eq('status', 'active')

  if (error) {
    return NextResponse.json(
      { data: null, error: { code: 'INTERNAL_ERROR', message: error.message } },
      { status: 500 }
    )
  }

  return NextResponse.json({ data, error: null })
}
