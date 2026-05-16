import { NextResponse } from 'next/server'
import { createUserClient } from '@/app/_lib/supabase/server'

// GET /api/relationships
// @회사/@사람 태그 클릭 시 미팅 이력 집계 조회
// fn_relationship_summary(p_ref_id, p_ref_type, p_limit) RPC 사용
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
  const reference_type = searchParams.get('reference_type') as 'contact' | 'company' | null
  const reference_id = searchParams.get('reference_id')
  const limit = parseInt(searchParams.get('limit') ?? '10', 10)

  if (!reference_type || !reference_id) {
    return NextResponse.json(
      { data: null, error: { code: 'INVALID_INPUT', message: 'reference_type과 reference_id는 필수입니다' } },
      { status: 400 }
    )
  }

  if (reference_type !== 'contact' && reference_type !== 'company') {
    return NextResponse.json(
      { data: null, error: { code: 'INVALID_INPUT', message: 'reference_type은 contact 또는 company여야 합니다' } },
      { status: 400 }
    )
  }

  // 다중 스키마 타입 추론 이슈로 인해 as never 캐스팅 사용 (login route 주석 참조)
  const { data, error } = await supabase.rpc('fn_relationship_summary', {
    p_ref_id: reference_id,
    p_ref_type: reference_type,
    p_limit: limit,
  } as never)

  if (error) {
    return NextResponse.json(
      { data: null, error: { code: 'INTERNAL_ERROR', message: error.message } },
      { status: 500 }
    )
  }

  return NextResponse.json({ data, error: null })
}
