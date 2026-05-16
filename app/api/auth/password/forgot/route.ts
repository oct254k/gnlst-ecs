import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/app/_lib/supabase/server'

/**
 * POST /api/auth/password/forgot
 * body: { email: string }
 *
 * 이메일 존재 여부와 무관하게 동일한 200 응답을 반환한다 (계정 존재 여부 노출 방지).
 */
export async function POST(request: NextRequest) {
  const body = await request.json() as { email: string }
  const { email } = body

  if (!email) {
    return NextResponse.json(
      { data: null, error: { code: 'INVALID_INPUT', message: '이메일을 입력해 주세요.' } },
      { status: 400 }
    )
  }

  const supabase = await createAdminClient()

  // NEXT_PUBLIC_APP_URL 필수. 설정되지 않으면 재설정 링크가 잘못된 도메인으로 발송된다.
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? ''
  const resetPasswordUrl = `${appUrl}/reset-password`

  // 이메일 미등록이더라도 에러를 외부에 노출하지 않는다
  await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: resetPasswordUrl,
  })

  return NextResponse.json(
    { data: { message: '메일을 확인하세요.' } },
    { status: 200 }
  )
}
