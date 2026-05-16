import { NextResponse } from 'next/server'
import { createUserClient } from '@/app/_lib/supabase/server'

// PATCH /api/contacts/:id
// 연락처 수정 (admin only)
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
  if (user.user_metadata?.role !== 'admin') {
    return NextResponse.json(
      { data: null, error: { code: 'FORBIDDEN', message: '권한이 없습니다' } },
      { status: 403 }
    )
  }

  const { id } = await params
  const body = await request.json() as {
    name?: string
    company_id?: string | null
    title?: string | null
    email?: string | null
    phone?: string | null
    status?: string
  }

  // confirmed → auto 다운그레이드 방지 (P3-2)
  if (body.status === 'auto') {
    const { data: existing } = await supabase
      .from('contacts')
      .select('status')
      .eq('id', id)
      .is('deleted_at', null)
      .single()

    const existingRow = existing as unknown as { status: string } | null
    if (existingRow?.status === 'confirmed') {
      return NextResponse.json(
        { data: null, error: { code: 'INVALID_STATUS', message: '확인 완료된 연락처는 auto 상태로 되돌릴 수 없습니다' } },
        { status: 400 }
      )
    }
  }

  const updatePayload: Record<string, unknown> = {}
  if (body.name !== undefined) updatePayload.name = body.name
  if (body.company_id !== undefined) updatePayload.company_id = body.company_id
  if (body.title !== undefined) updatePayload.title = body.title
  if (body.email !== undefined) updatePayload.email = body.email
  if (body.phone !== undefined) updatePayload.phone = body.phone
  if (body.status !== undefined) updatePayload.status = body.status

  const { data, error } = await supabase
    .from('contacts')
    .update(updatePayload as never)
    .eq('id', id)
    .is('deleted_at', null)
    .select('id, name, title, email, phone, status, is_auto_registered, company_id')
    .single()

  if (error) {
    return NextResponse.json(
      { data: null, error: { code: 'NOT_FOUND', message: '연락처를 찾을 수 없습니다' } },
      { status: 404 }
    )
  }

  return NextResponse.json({ data, error: null })
}

// DELETE /api/contacts/:id
// 연락처 soft delete (admin only)
// ?force=true 파라미터가 있으면 활성 멘션이 있어도 삭제 진행
export async function DELETE(
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
  if (user.user_metadata?.role !== 'admin') {
    return NextResponse.json(
      { data: null, error: { code: 'FORBIDDEN', message: '권한이 없습니다' } },
      { status: 403 }
    )
  }

  const { id } = await params
  const { searchParams } = new URL(request.url)
  const force = searchParams.get('force') === 'true'

  // 활성 일정에 멘션 참조 여부 확인 (force=true면 건너뜀)
  if (!force) {
    const { count: mentionCount } = await supabase
      .from('mentions')
      .select('id', { count: 'exact', head: true })
      .eq('reference_type', 'contact')
      .eq('reference_id', id)

    if (mentionCount && mentionCount > 0) {
      return NextResponse.json(
        { data: null, error: { code: 'HAS_ACTIVE_MENTIONS', message: '활성 일정에 멘션 참조가 있습니다' } },
        { status: 409 }
      )
    }
  }

  const now = new Date().toISOString()
  const { error } = await supabase
    .from('contacts')
    .update({ deleted_at: now, deleted_by: user.id } as never)
    .eq('id', id)
    .is('deleted_at', null)

  if (error) {
    return NextResponse.json(
      { data: null, error: { code: 'NOT_FOUND', message: '연락처를 찾을 수 없습니다' } },
      { status: 404 }
    )
  }

  return new NextResponse(null, { status: 204 })
}
