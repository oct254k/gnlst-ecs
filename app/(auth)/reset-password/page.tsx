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

function ResetPasswordContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const tokenHash = searchParams.get('token_hash')

  // 1단계: 이메일 입력 (token_hash 없을 때)
  const [email, setEmail] = useState('')
  const [step1Done, setStep1Done] = useState(false)

  // 2단계: 새 비밀번호 입력 (token_hash 있을 때)
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')

  const [errorMessage, setErrorMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  // token_hash가 URL에 있으면 바로 2단계 (비밀번호 재설정)
  const isStep2 = !!tokenHash

  async function handleStep1(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setErrorMessage('')
    setIsLoading(true)

    try {
      const res = await fetch('/api/auth/password/forgot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })

      // 서버는 이메일 존재 여부와 무관하게 200을 반환하지만, 네트워크 오류는 처리
      if (!res.ok) {
        const json = await res.json() as ApiErrorBody
        setErrorMessage(json.error?.message ?? '오류가 발생했습니다. 잠시 후 다시 시도해 주세요.')
        return
      }

      setStep1Done(true)
    } catch {
      setErrorMessage('네트워크 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.')
    } finally {
      setIsLoading(false)
    }
  }

  async function handleStep2(e: React.FormEvent<HTMLFormElement>) {
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
      const res = await fetch('/api/auth/password/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token_hash: tokenHash, type: 'recovery', password }),
      })

      const json = await res.json() as ApiErrorBody | { data: { message: string }; error?: never }

      if (!res.ok || ('error' in json && json.error)) {
        const errJson = json as ApiErrorBody
        setErrorMessage(errJson.error?.message ?? '비밀번호 재설정 중 오류가 발생했습니다.')
        return
      }

      // 성공: 로그인 페이지로 이동 (성공 메시지는 URL 파라미터로 전달)
      router.push('/login?message=password_reset')
    } catch {
      setErrorMessage('네트워크 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.')
    } finally {
      setIsLoading(false)
    }
  }

  // 1단계 완료 (이메일 발송) 안내 화면
  if (step1Done) {
    return (
      <div className="auth-card">
        <div className="auth-brand">
          <div style={{ fontSize: 28, fontWeight: 700, color: '#003876', letterSpacing: '-0.02em' }}>GNLST</div>
          <div className="auth-title">임원 일정관리 시스템</div>
        </div>
        <div style={{ textAlign: 'center', padding: '24px 0' }}>
          <div style={{ fontSize: 15, color: '#111827', marginBottom: 8 }}>메일을 확인하세요.</div>
          <div style={{ fontSize: 13, color: '#6b7280' }}>
            {email} 으로 비밀번호 재설정 링크를 발송했습니다.
            <br />
            링크 유효 시간은 1시간입니다.
          </div>
        </div>
        <div style={{ marginTop: 8, textAlign: 'center' }}>
          <a href="/login" style={{ fontSize: 13, color: '#003876' }}>로그인으로 돌아가기</a>
        </div>
      </div>
    )
  }

  // 2단계: 새 비밀번호 입력 (token_hash 있음)
  if (isStep2) {
    return (
      <div className="auth-card">
        <div className="auth-brand">
          <div style={{ fontSize: 28, fontWeight: 700, color: '#003876', letterSpacing: '-0.02em' }}>GNLST</div>
          <div className="auth-title">임원 일정관리 시스템</div>
          <div className="auth-sub">새 비밀번호 설정</div>
        </div>

        <form onSubmit={handleStep2} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className="field">
            <label className="field-label">
              새 비밀번호 <span className="req">*</span>
            </label>
            <input
              type="password"
              className="input"
              placeholder="새 비밀번호를 입력하세요 (10자 이상)"
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
            {isLoading ? '처리 중...' : '비밀번호 변경'}
          </button>
        </form>
      </div>
    )
  }

  // 1단계: 이메일 입력
  return (
    <div className="auth-card">
      <div className="auth-brand">
        <div style={{ fontSize: 28, fontWeight: 700, color: '#003876', letterSpacing: '-0.02em' }}>GNLST</div>
        <div className="auth-title">임원 일정관리 시스템</div>
        <div className="auth-sub">비밀번호 찾기</div>
      </div>

      <div style={{ fontSize: 13, color: '#6b7280', marginBottom: 16 }}>
        가입 시 등록한 이메일 주소를 입력하면 비밀번호 재설정 링크를 보내드립니다.
      </div>

      <form onSubmit={handleStep1} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div className="field">
          <label className="field-label">
            이메일 <span className="req">*</span>
          </label>
          <input
            type="email"
            className="input"
            placeholder="이메일을 입력하세요"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
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
          {isLoading ? '발송 중...' : '재설정 링크 보내기'}
        </button>
      </form>

      <div style={{ marginTop: 16, textAlign: 'center' }}>
        <a href="/login" style={{ fontSize: 13, color: '#6b7280' }}>로그인으로 돌아가기</a>
      </div>
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <div className="auth-bg">
      <div className="auth-bg-deco" />
      <Suspense fallback={
        <div className="auth-card">
          <div style={{ textAlign: 'center', color: '#6b7280' }}>로딩 중...</div>
        </div>
      }>
        <ResetPasswordContent />
      </Suspense>
      <div className="auth-foot">© 2026 GNLST Co., Ltd. · v0.1.0</div>
    </div>
  )
}
