import { NextRequest, NextResponse } from 'next/server'
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { createAdminClient } from '@/app/_lib/supabase/server'
import type { Database } from '@/app/_lib/supabase/types'

// createAdminClient returns SupabaseClient<Database, SchemaName, Schema>.
// Due to a type parameter mismatch between @supabase/ssr and @supabase/supabase-js generics,
// `.from().update()` receives `never` as its parameter type.
// Update payloads are validated with `satisfies` and cast with `as never` only at the call site.
type UsersUpdate = Database['public']['Tables']['users']['Update']

/**
 * POST /api/auth/invite/accept
 * body: { token_hash: string, type: string, password: string }
 *
 * - type === 'invite': 초대 수락 + 비밀번호 설정 + users.status = 'active' + 세션 쿠키 설정
 * - type === 'recovery': 비밀번호 재설정 (users.status는 변경하지 않음)
 *
 * 세션 쿠키: anon key로 생성한 SSR 클라이언트가 verifyOtp 결과를 쿠키에 자동 저장.
 * users 테이블 업데이트는 RLS를 우회하기 위해 admin 클라이언트를 별도로 사용.
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

  // SSR 클라이언트 (anon key): verifyOtp + updateUser → 세션 쿠키 설정
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

  // OTP 검증으로 사용자 확인 + 세션 생성
  const { data: verifyData, error: verifyErr } = await supabase.auth.verifyOtp({
    token_hash,
    type: type as 'invite' | 'recovery',
  })

  if (verifyErr || !verifyData.user) {
    return NextResponse.json(
      { data: null, error: { code: 'INVALID_TOKEN', message: '초대(재설정) 링크가 만료되었거나 유효하지 않습니다.' } },
      { status: 400 }
    )
  }

  const userId = verifyData.user.id

  // 비밀번호 설정 (세션 보유 SSR 클라이언트 사용)
  const { error: updateAuthErr } = await supabase.auth.updateUser({ password })

  if (updateAuthErr) {
    return NextResponse.json(
      { data: null, error: { code: 'PASSWORD_UPDATE_FAILED', message: '비밀번호 설정 중 오류가 발생했습니다.' } },
      { status: 400 }
    )
  }

  // 초대 수락인 경우에만 users.status를 active로 전환 (RLS 우회를 위해 admin 클라이언트 사용)
  if (type === 'invite') {
    const adminClient = await createAdminClient()
    const activatePayload = { status: 'active' } satisfies UsersUpdate
    await adminClient.from('users').update(activatePayload as never).eq('id', userId).is('deleted_at', null)
  }

  const message =
    type === 'invite'
      ? '계정이 활성화되었습니다.'
      : '비밀번호가 변경되었습니다. 다시 로그인해 주세요.'

  // 세션 쿠키를 JSON 응답에 복사
  const successResponse = NextResponse.json(
    { data: { message } },
    { status: 200 }
  )
  supabaseResponse.cookies.getAll().forEach(({ name, value, ...rest }) => {
    successResponse.cookies.set(name, value, rest)
  })

  return successResponse
}
