import { NextRequest, NextResponse } from 'next/server'
import { createUserClient } from '@/app/_lib/supabase/server'

/**
 * GET /api/auth/me
 * 현재 로그인 사용자의 프로필 조회
 */
export async function GET() {
  const supabase = await createUserClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json(
      { data: null, error: { code: 'UNAUTHORIZED', message: '로그인이 필요합니다.' } },
      { status: 401 }
    )
  }

  const { data, error } = await supabase
    .from('users')
    .select('id, name, email, employee_id, role, user_type, status, color, created_at')
    .eq('id', user.id)
    .is('deleted_at', null)
    .single()

  if (error || !data) {
    return NextResponse.json(
      { data: null, error: { code: 'USER_NOT_FOUND', message: '사용자 정보를 찾을 수 없습니다.' } },
      { status: 404 }
    )
  }

  return NextResponse.json({ data, error: null })
}

/**
 * PATCH /api/auth/me
 * body: { current_password: string, new_password: string }
 * 현재 비밀번호 검증 후 새 비밀번호로 변경
 */
export async function PATCH(request: NextRequest) {
  const supabase = await createUserClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json(
      { data: null, error: { code: 'UNAUTHORIZED', message: '로그인이 필요합니다.' } },
      { status: 401 }
    )
  }

  const { current_password, new_password } = await request.json() as {
    current_password: string
    new_password: string
  }

  if (!current_password || !new_password) {
    return NextResponse.json(
      { data: null, error: { code: 'INVALID_INPUT', message: '필수 입력값이 누락되었습니다.' } },
      { status: 400 }
    )
  }

  // 현재 비밀번호 검증: 재로그인 시도
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: user.email!,
    password: current_password,
  })

  if (signInError) {
    return NextResponse.json(
      { data: null, error: { code: 'INVALID_PASSWORD', message: '현재 비밀번호가 올바르지 않습니다.' } },
      { status: 400 }
    )
  }

  // 새 비밀번호 설정
  const { error: updateError } = await supabase.auth.updateUser({ password: new_password })

  if (updateError) {
    return NextResponse.json(
      { data: null, error: { code: 'UPDATE_FAILED', message: updateError.message } },
      { status: 500 }
    )
  }

  return NextResponse.json({ data: { success: true }, error: null })
}
