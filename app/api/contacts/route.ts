import { NextResponse } from 'next/server'
import { createUserClient } from '@/app/_lib/supabase/server'
import type { Tables } from '@/app/_lib/supabase/types'

type ContactRow = Tables<'contacts'>
type CompanyRow = Pick<Tables<'companies'>, 'id' | 'name'>

// GET /api/contacts
// 연락처 목록 조회 (인증 필요)
export async function GET(request: Request) {
  const supabase = await createUserClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json(
      { data: null, error: { code: 'UNAUTHORIZED', message: '인증이 필요합니다' } },
      { status: 401 }
    )
  }

  const { searchParams } = new URL(request.url)
  const q = searchParams.get('q')
  const company_id = searchParams.get('company_id')
  const statusFilter = searchParams.get('status')
  const page = parseInt(searchParams.get('page') ?? '1', 10)
  const per_page = parseInt(searchParams.get('per_page') ?? '50', 10)

  let query = supabase
    .from('contacts')
    .select(
      'id, name, title, email, phone, status, is_auto_registered, company_id, companies(id, name)',
      { count: 'exact' }
    )
    .is('deleted_at', null)
    .order('name', { ascending: true })

  if (q) query = query.ilike('name', `%${q}%`)
  if (company_id) query = query.eq('company_id', company_id)
  if (statusFilter) query = query.eq('status', statusFilter)

  const from = (page - 1) * per_page
  query = query.range(from, from + per_page - 1)

  const { data, error, count } = await query

  if (error) {
    return NextResponse.json(
      { data: null, error: { code: 'INTERNAL_ERROR', message: error.message } },
      { status: 500 }
    )
  }

  type ContactWithCompany = Pick<ContactRow, 'id' | 'name' | 'title' | 'email' | 'phone' | 'status' | 'is_auto_registered' | 'company_id'> & {
    companies: CompanyRow | null
  }

  const rows = (data ?? []) as unknown as ContactWithCompany[]

  const formatted = rows.map((c) => ({
    id: c.id,
    name: c.name,
    title: c.title,
    email: c.email,
    phone: c.phone,
    company: c.companies ? { id: c.companies.id, name: c.companies.name } : null,
    status: c.status,
    is_auto_registered: c.is_auto_registered,
  }))

  return NextResponse.json({
    data: formatted,
    meta: { total: count ?? 0, page, per_page },
    error: null,
  })
}

// POST /api/contacts
// 연락처 등록 (admin only)
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

  const body = await request.json() as {
    name: string
    company_id?: string | null
    title?: string | null
    email?: string | null
    phone?: string | null
    status?: string
  }

  if (!body.name?.trim()) {
    return NextResponse.json(
      { data: null, error: { code: 'INVALID_INPUT', message: '이름은 필수입니다' } },
      { status: 400 }
    )
  }

  const trimmedName = body.name.trim()

  // 이름 중복 체크 (P3-6)
  const { data: sameName } = await supabase
    .from('contacts')
    .select('id')
    .eq('name', trimmedName)
    .is('deleted_at', null)
    .limit(1)
  if (sameName && sameName.length > 0) {
    return NextResponse.json(
      { data: null, error: { code: 'NAME_DUPLICATE', message: '동일한 이름의 연락처가 존재합니다' } },
      { status: 409 }
    )
  }

  // 이메일 형식 사전 검증 (P3-4)
  if (body.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email)) {
    return NextResponse.json(
      { data: null, error: { code: 'INVALID_EMAIL', message: '올바른 이메일 형식이 아닙니다' } },
      { status: 400 }
    )
  }

  const { data, error: insertError } = await supabase
    .from('contacts')
    .insert({
      name: trimmedName,
      company_id: body.company_id ?? null,
      title: body.title ?? null,
      email: body.email ?? null,
      phone: body.phone ?? null,
      status: body.status ?? 'auto',
      created_by: user.id,
    } as never)
    .select('id, name, title, email, phone, status, is_auto_registered, company_id')
    .single()

  if (insertError) {
    // DB constraint 에러(check_violation)도 400으로 변환 (P3-4)
    if (insertError.code === '23514' || insertError.message?.includes('email')) {
      return NextResponse.json(
        { data: null, error: { code: 'INVALID_EMAIL', message: '올바른 이메일 형식이 아닙니다' } },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { data: null, error: { code: 'INTERNAL_ERROR', message: insertError.message } },
      { status: 500 }
    )
  }

  return NextResponse.json({ data, error: null }, { status: 201 })
}
