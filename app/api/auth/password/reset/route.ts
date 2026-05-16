import { NextRequest, NextResponse } from 'next/server'
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import type { Database } from '@/app/_lib/supabase/types'

/**
 * POST /api/auth/password/reset
 * body: { token_hash: string, type: 'recovery', password: string }
 *
 * - verifyOtp으로 복구 토큰 검증
 * - 새 비밀번호 설정
 * - 성공 시 200, 실패 시 400/500
 */
export async function POST(request: NextRequest) {
  const body = await request.json() as {
    token_hash: string
    type: string
    password: string
  }

  const { token_hash, type, password } = body

  if (!token_hash || !type || !password) {
    return NextResponse.json(
      { data: null, error: { code: 'INVALID_INPUT', message: '필수 입력값이 누락되었습니다.' } },
      { status: 400 }
    )
  }

  // Route Handler에서 세션 쿠키를 설정하기 위해 response를 미리 생성
  let supabaseResponse = NextResponse.next()

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          cookiesToSet.forEach(({ name, value, options }) => {
            supabaseResponse.cookies.set(name, value, options)
          })
        },
      },
    }
  )

  // OTP 검증
  const { data: verifyData, error: verifyErr } = await supabase.auth.verifyOtp({
    token_hash,
    type: type as 'recovery',
  })

  if (verifyErr || !verifyData.user) {
    return NextResponse.json(
      { data: null, error: { code: 'INVALID_TOKEN', message: '링크가 만료되었거나 유효하지 않습니다.' } },
      { status: 400 }
    )
  }

  // 새 비밀번호 설정
  const { error: updateErr } = await supabase.auth.updateUser({ password })

  if (updateErr) {
    return NextResponse.json(
      { data: null, error: { code: 'UPDATE_FAILED', message: '비밀번호 변경 중 오류가 발생했습니다.' } },
      { status: 500 }
    )
  }

  const successResponse = NextResponse.json(
    { data: { message: '비밀번호가 변경되었습니다. 다시 로그인해 주세요.' }, error: null },
    { status: 200 }
  )
  supabaseResponse.cookies.getAll().forEach(({ name, value, ...rest }) => {
    successResponse.cookies.set(name, value, rest)
  })

  return successResponse
}
