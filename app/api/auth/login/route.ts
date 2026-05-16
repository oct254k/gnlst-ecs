import { NextRequest, NextResponse } from 'next/server'
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import type { Database } from '@/app/_lib/supabase/types'
import type { AuthUserRow } from '../_types'

// `createServerClient<Database>` returns `SupabaseClient<Database, SchemaName, Schema>`.
// Due to a type parameter mismatch between @supabase/ssr and @supabase/supabase-js generics,
// `.from().update()` receives `never` as its parameter type.
// We validate update payloads with `satisfies` at definition and cast with `as never`
// only at the Supabase call site — the payload itself is fully type-checked.
type UsersUpdate = Database['public']['Tables']['users']['Update']

/**
 * POST /api/auth/login
 * body: { identifier: string, password: string, mode: 'email' | 'employee_id' }
 *
 * 처리 흐름:
 * 1. mode === 'employee_id' 이면 users 테이블에서 email 조회
 * 2. users 테이블에서 status, locked_until, failed_login_count 확인
 * 3. signInWithPassword 시도
 * 4. 성공/실패에 따라 failed_login_count 업데이트
 * 5. SSR 쿠키 패턴으로 세션 쿠키 설정
 */
export async function POST(request: NextRequest) {
  const body = await request.json() as {
    identifier: string
    password: string
    mode: 'email' | 'employee_id'
  }

  const { identifier, password, mode } = body

  if (!identifier || !password || !mode) {
    return NextResponse.json(
      { data: null, error: { code: 'INVALID_INPUT', message: '필수 입력값이 누락되었습니다.' } },
      { status: 400 }
    )
  }

  // Route Handler에서 세션 쿠키를 설정하기 위해 response를 미리 생성하고
  // createServerClient의 setAll 핸들러로 쿠키를 response에 쓴다.
  let supabaseResponse = NextResponse.next()

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
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

  // 1. 사번 로그인이면 email 조회
  let email = identifier
  if (mode === 'employee_id') {
    const { data: userByEmpId, error: empErr } = await supabase
      .from('users')
      .select('email')
      .eq('employee_id', identifier)
      .is('deleted_at', null)
      .single()

    if (empErr || !userByEmpId) {
      return NextResponse.json(
        { data: null, error: { code: 'USER_NOT_FOUND', message: '등록되지 않은 계정입니다.' } },
        { status: 400 }
      )
    }
    email = (userByEmpId as { email: string }).email
  }

  // 2. users 테이블에서 상태 조회
  // select 반환 타입이 multi-schema 타입 추론으로 인해 복잡할 수 있으므로 AuthUserRow로 단언
  const { data: rawUserData, error: userErr } = await supabase
    .from('users')
    .select('id, email, employee_id, name, role, status, failed_login_count, locked_until, last_login_at')
    .eq('email', email)
    .is('deleted_at', null)
    .single()

  if (userErr || !rawUserData) {
    return NextResponse.json(
      { data: null, error: { code: 'USER_NOT_FOUND', message: '등록되지 않은 계정입니다.' } },
      { status: 400 }
    )
  }

  const user = rawUserData as unknown as AuthUserRow

  // 비활성 계정 차단
  if (user.status === 'inactive') {
    return NextResponse.json(
      { data: null, error: { code: 'ACCOUNT_INACTIVE', message: '비활성화된 계정입니다. 관리자에게 문의하세요.' } },
      { status: 403 }
    )
  }

  // pending 상태(초대 미수락) 차단
  if (user.status === 'pending') {
    return NextResponse.json(
      { data: null, error: { code: 'ACCOUNT_PENDING', message: '계정 활성화가 필요합니다. 초대 메일을 확인해 주세요.' } },
      { status: 403 }
    )
  }

  // 잠금 상태 확인
  if (user.status === 'locked') {
    const now = new Date()
    const lockedUntil = user.locked_until ? new Date(user.locked_until) : null

    if (lockedUntil && lockedUntil > now) {
      return NextResponse.json(
        { data: null, error: { code: 'ACCOUNT_LOCKED', message: '계정이 잠겼습니다. 잠시 후 다시 시도해 주세요.' } },
        { status: 403 }
      )
    }

    // 잠금 시간 경과 → 자동 해제
    const unlockPayload = { status: 'active', failed_login_count: 0, locked_until: null } satisfies UsersUpdate
    await supabase.from('users').update(unlockPayload as never).eq('id', user.id)
  }

  // 3. signInWithPassword
  const { data: authData, error: authErr } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (authErr || !authData.session) {
    // 4. 로그인 실패: failed_login_count 증가
    const newCount = (user.failed_login_count ?? 0) + 1

    if (newCount >= 5) {
      // 5회 이상 실패 → 계정 잠금
      const lockedUntilDate = new Date(Date.now() + 15 * 60 * 1000).toISOString()
      const lockPayload = { status: 'locked', failed_login_count: newCount, locked_until: lockedUntilDate } satisfies UsersUpdate
      await supabase.from('users').update(lockPayload as never).eq('id', user.id)

      return NextResponse.json(
        { data: null, error: { code: 'ACCOUNT_LOCKED', message: '로그인 5회 연속 실패로 계정이 잠겼습니다. 15분 후 다시 시도해 주세요.' } },
        { status: 403 }
      )
    }

    const failPayload = { failed_login_count: newCount } satisfies UsersUpdate
    await supabase.from('users').update(failPayload as never).eq('id', user.id)

    return NextResponse.json(
      { data: null, error: { code: 'INVALID_CREDENTIALS', message: '이메일(사번) 또는 비밀번호가 올바르지 않습니다.' } },
      { status: 401 }
    )
  }

  // 4. 로그인 성공: failed_login_count 초기화, last_login_at 갱신
  const successUpdatePayload = { failed_login_count: 0, last_login_at: new Date().toISOString() } satisfies UsersUpdate
  await supabase.from('users').update(successUpdatePayload as never).eq('id', user.id)

  // supabaseResponse에 이미 setAll을 통해 세션 쿠키가 설정되어 있다.
  // JSON body를 응답에 포함시키기 위해 새 response를 만들고 쿠키를 복사한다.
  const successResponse = NextResponse.json(
    { data: { user: authData.user, session: authData.session } },
    { status: 200 }
  )
  supabaseResponse.cookies.getAll().forEach(({ name, value, ...rest }) => {
    successResponse.cookies.set(name, value, rest)
  })

  return successResponse
}
