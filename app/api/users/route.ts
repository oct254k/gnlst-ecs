import { NextResponse } from 'next/server'
import { createUserClient } from '@/app/_lib/supabase/server'
import type { TablesUpdate } from '@/app/_lib/supabase/types'

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
  const role = searchParams.get('role')
  const status = searchParams.get('status')
  const page = parseInt(searchParams.get('page') ?? '1', 10)
  const per_page = parseInt(searchParams.get('per_page') ?? '50', 10)

  let query = supabase
    .from('users')
    .select('id, name, email, employee_id, role, user_type, status, color, last_login_at', { count: 'exact' })
    .is('deleted_at', null)

  if (role) query = query.eq('role', role)
  if (status) query = query.eq('status', status)

  const from = (page - 1) * per_page
  query = query.range(from, from + per_page - 1)

  const { data, error, count } = await query

  if (error) {
    return NextResponse.json(
      { data: null, error: { code: 'INTERNAL_ERROR', message: error.message } },
      { status: 500 }
    )
  }

  return NextResponse.json({
    data,
    meta: { total: count ?? 0, page, per_page },
    error: null,
  })
}
