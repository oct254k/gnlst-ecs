'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

type LoginMode = 'email' | 'employee_id'

interface ApiErrorBody {
  data: null
  error: { code: string; message: string }
}

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [mode, setMode] = useState<LoginMode>('email')
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  // 비밀번호 재설정 완료 후 리다이렉트 시 성공 메시지 표시
  useEffect(() => {
    if (searchParams.get('message') === 'password_reset') {
      setSuccessMessage('비밀번호가 변경되었습니다. 다시 로그인해 주세요.')
    }
  }, [searchParams])

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setErrorMessage('')
    setSuccessMessage('')
    setIsLoading(true)

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, password, mode }),
      })

      const json = await res.json() as ApiErrorBody | { data: { user: unknown; session: unknown }; error?: never }

      if (!res.ok || ('error' in json && json.error)) {
        const errJson = json as ApiErrorBody
        setErrorMessage(errJson.error?.message ?? '로그인 중 오류가 발생했습니다.')
        return
      }

      // redirect 파라미터가 있으면 해당 경로로, 없으면 /dashboard
      const rawRedirect = searchParams.get('redirect') ?? ''
      const isSafeRedirect =
        rawRedirect.startsWith('/') &&
        !rawRedirect.startsWith('//') &&
        !rawRedirect.includes('://')
      router.push(isSafeRedirect ? rawRedirect : '/dashboard')
      router.refresh()
    } catch {
      setErrorMessage('네트워크 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="auth-card">
      <div className="auth-brand">
        <div style={{ fontSize: 28, fontWeight: 700, color: '#003876', letterSpacing: '-0.02em' }}>
          GNLST
        </div>
        <div className="auth-title">일정관리 시스템</div>
        <div className="auth-sub">EXECUTIVE SCHEDULE MANAGEMENT</div>
      </div>

      {/* 로그인 방식 탭 */}
      <div style={{ display: 'flex', gap: 0, marginBottom: 20, borderBottom: '1px solid #e5e7eb' }}>
        <button
          type="button"
          onClick={() => { setMode('email'); setIdentifier(''); setErrorMessage('') }}
          style={{
            flex: 1,
            padding: '8px 0',
            background: 'none',
            border: 'none',
            borderBottom: mode === 'email' ? '2px solid #003876' : '2px solid transparent',
            color: mode === 'email' ? '#003876' : '#6b7280',
            fontWeight: mode === 'email' ? 600 : 400,
            cursor: 'pointer',
            fontSize: 14,
            transition: 'all 0.15s',
          }}
        >
          이메일로 로그인
        </button>
        <button
          type="button"
          onClick={() => { setMode('employee_id'); setIdentifier(''); setErrorMessage('') }}
          style={{
            flex: 1,
            padding: '8px 0',
            background: 'none',
            border: 'none',
            borderBottom: mode === 'employee_id' ? '2px solid #003876' : '2px solid transparent',
            color: mode === 'employee_id' ? '#003876' : '#6b7280',
            fontWeight: mode === 'employee_id' ? 600 : 400,
            cursor: 'pointer',
            fontSize: 14,
            transition: 'all 0.15s',
          }}
        >
          사번으로 로그인
        </button>
      </div>

      {successMessage && (
        <div style={{ color: '#16a34a', fontSize: 13, marginBottom: 12, padding: '8px 12px', background: '#f0fdf4', borderRadius: 6 }}>
          {successMessage}
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div className="field">
          <label className="field-label">
            {mode === 'email' ? '이메일' : '사번'}{' '}
            <span className="req">*</span>
          </label>
          <input
            type={mode === 'email' ? 'email' : 'text'}
            className="input"
            placeholder={mode === 'email' ? '이메일을 입력하세요' : '사번을 입력하세요'}
            autoComplete={mode === 'email' ? 'email' : 'username'}
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            required
          />
        </div>

        <div className="field">
          <label className="field-label">
            비밀번호 <span className="req">*</span>
          </label>
          <input
            type="password"
            className="input"
            placeholder="비밀번호를 입력하세요"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        {errorMessage && (
          <div style={{ color: '#dc2626', fontSize: 13, marginTop: -4 }}>
            {errorMessage}
          </div>
        )}

        <button
          type="submit"
          className="btn btn-primary btn-lg"
          style={{ marginTop: 4, width: '100%', justifyContent: 'center' }}
          disabled={isLoading}
        >
          {isLoading ? '로그인 중...' : '로그인'}
        </button>
      </form>

      <div style={{ marginTop: 16, textAlign: 'center' }}>
        <a
          href="/reset-password"
          style={{ fontSize: 13, color: '#6b7280', textDecoration: 'none' }}
        >
          비밀번호를 잊으셨나요?
        </a>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <div className="auth-bg">
      <div className="auth-bg-deco" />
      <Suspense fallback={
        <div className="auth-card">
          <div style={{ textAlign: 'center', color: '#6b7280' }}>로딩 중...</div>
        </div>
      }>
        <LoginForm />
      </Suspense>
      <div className="auth-foot">© 2026 GNLST Co., Ltd. · v0.1.0</div>
    </div>
  )
}
