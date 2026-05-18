import { NextResponse } from 'next/server'
import { createUserClient } from '@/app/_lib/supabase/server'

// GET /api/companies
// 회사 목록 조회 (인증 필요)
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
  const page = parseInt(searchParams.get('page') ?? '1', 10)
  const per_page = parseInt(searchParams.get('per_page') ?? '50', 10)

  let query = supabase
    .from('companies')
    .select('id, name, aliases, is_auto_registered', { count: 'exact' })
    .is('deleted_at', null)
    .order('name', { ascending: true })

  if (q) {
    // 이름 ILIKE 또는 aliases 배열에 q 포함 (spec §12: 이름·별칭 검색)
    query = query.or(`name.ilike.%${q}%,aliases.cs.{${q}}`)
  }

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

// POST /api/companies
// 회사 등록 (admin only)
export async function POST(request: Request) {
  const supabase = await createUserClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json(
      { data: null, error: { code: 'UNAUTHORIZED', message: '인증이 필요합니다' } },
      { status: 401 }
    )
  }
  const body = await request.json() as {
    name: string
    aliases?: string[]
  }

  if (!body.name?.trim()) {
    return NextResponse.json(
      { data: null, error: { code: 'INVALID_INPUT', message: '회사명은 필수입니다' } },
      { status: 400 }
    )
  }

  // 회사명 또는 별칭 중복 확인 (spec: COMPANY_NAME_DUPLICATE — 회사명 또는 별칭 중복)
  const { data: existing } = await supabase
    .from('companies')
    .select('id')
    .or(`name.ilike.${body.name.trim()},aliases.cs.{${body.name.trim()}}`)
    .is('deleted_at', null)
    .limit(1)

  if (existing && existing.length > 0) {
    return NextResponse.json(
      { data: null, error: { code: 'COMPANY_NAME_DUPLICATE', message: '이미 존재하는 회사명 또는 별칭입니다' } },
      { status: 409 }
    )
  }

  const { data, error } = await supabase
    .from('companies')
    .insert({
      name: body.name.trim(),
      aliases: body.aliases ?? [],
      created_by: user.id,
    } as never)
    .select('id, name, aliases, is_auto_registered')
    .single()

  if (error) {
    return NextResponse.json(
      { data: null, error: { code: 'INTERNAL_ERROR', message: error.message } },
      { status: 500 }
    )
  }

  return NextResponse.json({ data, error: null }, { status: 201 })
}
