import { NextResponse } from 'next/server'
import { createUserClient } from '@/app/_lib/supabase/server'

// PATCH /api/companies/:id
// 회사 수정 (admin only)
export async function PATCH(
  request: Request,
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
  const { id } = await params
  const body = await request.json() as {
    name?: string
    aliases?: string[]
  }

  // alias 중복 검사 (P2-15): 변경되는 aliases가 다른 회사에 이미 사용 중인지 확인
  if (body.aliases !== undefined) {
    for (const alias of body.aliases) {
      if (!alias.trim()) continue
      const { data: dup } = await supabase
        .from('companies')
        .select('id')
        .neq('id', id)
        .or(`name.ilike.${alias.trim()},aliases.cs.{${alias.trim()}}`)
        .is('deleted_at', null)
        .limit(1)
      if (dup && dup.length > 0) {
        return NextResponse.json(
          { data: null, error: { code: 'COMPANY_NAME_DUPLICATE', message: `별칭 "${alias}"이 이미 다른 회사에 사용 중입니다` } },
          { status: 409 }
        )
      }
    }
  }

  const updatePayload: Record<string, unknown> = {}
  if (body.name !== undefined) updatePayload.name = body.name
  if (body.aliases !== undefined) updatePayload.aliases = body.aliases

  const { data, error } = await supabase
    .from('companies')
    .update(updatePayload as never)
    .eq('id', id)
    .is('deleted_at', null)
    .select('id, name, aliases, is_auto_registered')
    .single()

  if (error) {
    return NextResponse.json(
      { data: null, error: { code: 'NOT_FOUND', message: '회사를 찾을 수 없습니다' } },
      { status: 404 }
    )
  }

  return NextResponse.json({ data, error: null })
}

// DELETE /api/companies/:id
// 회사 soft delete (admin only)
// 연결된 contacts의 company_id는 NULL로 갱신 (DB trigger 또는 여기서 처리)
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
  const { id } = await params
  const now = new Date().toISOString()

  // 연결된 contacts의 company_id를 NULL로 갱신 (ERD 명세: SET NULL)
  await supabase
    .from('contacts')
    .update({ company_id: null } as never)
    .eq('company_id', id)
    .is('deleted_at', null)

  const { error } = await supabase
    .from('companies')
    .update({ deleted_at: now, deleted_by: user.id } as never)
    .eq('id', id)
    .is('deleted_at', null)

  if (error) {
    return NextResponse.json(
      { data: null, error: { code: 'NOT_FOUND', message: '회사를 찾을 수 없습니다' } },
      { status: 404 }
    )
  }

  return new NextResponse(null, { status: 204 })
}
