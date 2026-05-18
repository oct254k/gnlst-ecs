'use client'

import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

interface ApiErrorBody {
  data: null
  error: { code: string; message: string }
}

/** 비밀번호 정책: 최소 10자, 영문·숫자·특수문자 각 1자 이상 */
function validatePassword(pw: string): string | null {
  if (pw.length < 10) return '비밀번호는 최소 10자 이상이어야 합니다.'
  if (!/[A-Za-z]/.test(pw)) return '영문자를 1자 이상 포함해야 합니다.'
  if (!/[0-9]/.test(pw)) return '숫자를 1자 이상 포함해야 합니다.'
  if (!/[^A-Za-z0-9]/.test(pw)) return '특수문자를 1자 이상 포함해야 합니다.'
  return null
}

function InviteForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const tokenHash = searchParams.get('token_hash')
  const type = searchParams.get('type') ?? 'invite'

  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isDone, setIsDone] = useState(false)

  // 토큰 없으면 만료/무효 안내
  if (!tokenHash) {
    return (
      <div className="auth-card">
        <div className="auth-brand">
          <div style={{ fontSize: 28, fontWeight: 700, color: '#003876', letterSpacing: '-0.02em' }}>GNLST</div>
          <div className="auth-title">일정관리 시스템</div>
        </div>
        <div style={{ textAlign: 'center', padding: '24px 0', color: '#dc2626', fontSize: 15 }}>
          초대 링크가 만료되었습니다.
        </div>
        <div style={{ textAlign: 'center', fontSize: 13, color: '#6b7280' }}>
          관리자에게 재초대를 요청해 주세요.
        </div>
        <div style={{ marginTop: 20, textAlign: 'center' }}>
          <a href="/login" style={{ fontSize: 13, color: '#003876' }}>로그인으로 돌아가기</a>
        </div>
      </div>
    )
  }

  if (isDone) {
    return (
      <div className="auth-card">
        <div className="auth-brand">
          <div style={{ fontSize: 28, fontWeight: 700, color: '#003876', letterSpacing: '-0.02em' }}>GNLST</div>
          <div className="auth-title">일정관리 시스템</div>
        </div>
        <div style={{ textAlign: 'center', padding: '24px 0', color: '#16a34a', fontSize: 15 }}>
          계정이 활성화되었습니다.
        </div>
        <div style={{ marginTop: 8, textAlign: 'center', fontSize: 13, color: '#6b7280' }}>
          대시보드로 이동합니다...
        </div>
      </div>
    )
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setErrorMessage('')

    const pwError = validatePassword(password)
    if (pwError) {
      setErrorMessage(pwError)
      return
    }

    if (password !== confirm) {
      setErrorMessage('비밀번호가 일치하지 않습니다.')
      return
    }

    setIsLoading(true)

    try {
      const res = await fetch('/api/auth/invite/accept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token_hash: tokenHash, type, password }),
      })

      const json = await res.json() as ApiErrorBody | { data: { message: string }; error?: never }

      if (!res.ok || ('error' in json && json.error)) {
        const errJson = json as ApiErrorBody
        setErrorMessage(errJson.error?.message ?? '계정 활성화 중 오류가 발생했습니다.')
        return
      }

      setIsDone(true)
      window.location.href = '/dashboard'
    } catch {
      setErrorMessage('네트워크 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="auth-card">
      <div className="auth-brand">
        <div style={{ fontSize: 28, fontWeight: 700, color: '#003876', letterSpacing: '-0.02em' }}>GNLST</div>
        <div className="auth-title">일정관리 시스템</div>
        <div className="auth-sub">비밀번호 설정</div>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div className="field">
          <label className="field-label">
            비밀번호 <span className="req">*</span>
          </label>
          <input
            type="password"
            className="input"
            placeholder="비밀번호를 입력하세요 (10자 이상)"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 4 }}>
            최소 10자, 영문·숫자·특수문자 각 1자 이상
          </div>
        </div>

        <div className="field">
          <label className="field-label">
            비밀번호 확인 <span className="req">*</span>
          </label>
          <input
            type="password"
            className="input"
            placeholder="비밀번호를 다시 입력하세요"
            autoComplete="new-password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
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
          {isLoading ? '처리 중...' : '비밀번호 설정 완료'}
        </button>
      </form>
    </div>
  )
}

export default function InvitePage() {
  return (
    <div className="auth-bg">
      <div className="auth-bg-deco" />
      <Suspense fallback={
        <div className="auth-card">
          <div style={{ textAlign: 'center', color: '#6b7280' }}>로딩 중...</div>
        </div>
      }>
        <InviteForm />
      </Suspense>
      <div className="auth-foot">© 2026 GNLST Co., Ltd. · v0.1.0</div>
    </div>
  )
}
