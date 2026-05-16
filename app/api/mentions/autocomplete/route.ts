import { NextResponse } from 'next/server'
import { createUserClient } from '@/app/_lib/supabase/server'
import type { Tables } from '@/app/_lib/supabase/types'

type CompanyRow = Pick<Tables<'companies'>, 'id' | 'name'>
type ContactWithCompany = Pick<Tables<'contacts'>, 'id' | 'name'> & {
  companies: CompanyRow | null
}

// GET /api/mentions/autocomplete
// @멘션 자동완성: contacts.name + companies.name + companies.aliases 검색
// P95 ≤ 500ms 목표
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
  const type = searchParams.get('type') ?? 'all'
  const limit = Math.min(parseInt(searchParams.get('limit') ?? '10', 10), 50)

  if (!q || q.trim().length === 0) {
    return NextResponse.json(
      { data: null, error: { code: 'INVALID_INPUT', message: '검색어(q)는 필수입니다' } },
      { status: 400 }
    )
  }

  const results: Array<{
    reference_type: 'contact' | 'company'
    reference_id: string
    display_name: string
  }> = []

  // contacts 검색 (name ILIKE)
  if (type === 'all' || type === 'contact') {
    const { data: contactsRaw } = await supabase
      .from('contacts')
      .select('id, name, companies(id, name)')
      .ilike('name', `%${q}%`)
      .is('deleted_at', null)
      .limit(limit)

    const contacts = (contactsRaw ?? []) as unknown as ContactWithCompany[]

    for (const c of contacts) {
      const companyName = c.companies?.name ?? null
      results.push({
        reference_type: 'contact',
        reference_id: c.id,
        display_name: companyName ? `${c.name} (${companyName})` : c.name,
      })
    }
  }

  // companies 검색 (name ILIKE + aliases contains)
  if (type === 'all' || type === 'company') {
    const companyIds = new Set<string>()

    // name ILIKE 검색
    const { data: byNameRaw } = await supabase
      .from('companies')
      .select('id, name')
      .ilike('name', `%${q}%`)
      .is('deleted_at', null)
      .limit(limit)

    const byName = (byNameRaw ?? []) as unknown as CompanyRow[]
    for (const c of byName) {
      if (!companyIds.has(c.id)) {
        companyIds.add(c.id)
        results.push({
          reference_type: 'company',
          reference_id: c.id,
          display_name: c.name,
        })
      }
    }

    // aliases 정확 포함 검색 (contains 연산자 사용)
    const { data: byAliasRaw } = await supabase
      .from('companies')
      .select('id, name')
      .contains('aliases', [q])
      .is('deleted_at', null)
      .limit(limit)

    const byAlias = (byAliasRaw ?? []) as unknown as CompanyRow[]
    for (const c of byAlias) {
      if (!companyIds.has(c.id)) {
        companyIds.add(c.id)
        results.push({
          reference_type: 'company',
          reference_id: c.id,
          display_name: c.name,
        })
      }
    }
  }

  return NextResponse.json({ data: results.slice(0, limit), error: null })
}
