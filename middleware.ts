import { NextRequest, NextResponse } from 'next/server'
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import type { Database } from '@/app/_lib/supabase/types'

// 인증 없이 접근 가능한 경로 (페이지 + 해당 페이지가 호출하는 API 엔드포인트)
const PUBLIC_PATHS = [
  '/login',
  '/invite',
  '/reset-password',
  // 로그인·초대·비밀번호 찾기 API는 미인증 상태에서 호출된다
  '/api/auth/login',
  '/api/auth/password',
  '/api/auth/invite',
]

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // response를 먼저 생성하여 쿠키 갱신(토큰 자동 갱신)을 response에 반영
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          // request 쿠키를 먼저 갱신한 뒤 response에도 쓴다
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value)
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options)
          })
        },
      },
    }
  )

  // getUser()로 세션 유효성 검증 (getSession()보다 안전)
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const isPublicPath = PUBLIC_PATHS.some((p) => pathname.startsWith(p))

  // 미인증 사용자가 보호된 경로에 접근 → /login으로 리다이렉트
  if (!user && !isPublicPath) {
    const loginUrl = new URL('/login', request.url)
    return NextResponse.redirect(loginUrl)
  }

  // 인증된 사용자가 /login에 접근 → /dashboard로 리다이렉트
  if (user && pathname.startsWith('/login')) {
    const dashboardUrl = new URL('/dashboard', request.url)
    return NextResponse.redirect(dashboardUrl)
  }

  // admin 전용 경로 보호
  if (user && pathname.startsWith('/admin')) {
    const userRole = user.user_metadata?.role
    if (userRole !== 'admin') {
      const dashboardUrl = new URL('/dashboard', request.url)
      return NextResponse.redirect(dashboardUrl)
    }
  }

  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|assets/).*)'],
}
