'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Badge } from '@/components/ui/badge'
import { Icon } from '@/components/ui/icon'
import { createBrowserClientInstance } from '@/app/_lib/supabase/client'

interface CurrentUser {
  name: string
  email: string
  employee_id?: string
  role: string
  color?: string | null
  created_at?: string
}

/** 비밀번호 정책: 최소 10자, 영문·숫자·특수문자 각 1자 이상 */
function validatePassword(pw: string): string | null {
  if (pw.length < 10) return '비밀번호는 최소 10자 이상이어야 합니다.'
  if (!/[A-Za-z]/.test(pw)) return '영문자를 1자 이상 포함해야 합니다.'
  if (!/[0-9]/.test(pw)) return '숫자를 1자 이상 포함해야 합니다.'
  if (!/[^A-Za-z0-9]/.test(pw)) return '특수문자를 1자 이상 포함해야 합니다.'
  return null
}

interface ApiErrorBody {
  data: null
  error: { code: string; message: string }
}

export function MyPageContent() {
  const router = useRouter()
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null)

  const [pwForm, setPwForm] = useState({
    current: '',
    next: '',
    confirm: '',
  })
  const [pwError, setPwError] = useState<string | null>(null)
  const [pwSuccess, setPwSuccess] = useState(false)

  useEffect(() => {
    fetch('/api/auth/me')
      .then(res => res.json())
      .then((json: { data: CurrentUser | null; error: null } | ApiErrorBody) => {
        if (json.data) setCurrentUser(json.data)
      })
  }, [])

  const handlePwSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setPwError(null)
    setPwSuccess(false)

    if (!pwForm.current) {
      setPwError('현재 비밀번호를 입력하세요.')
      return
    }
    const pwValidError = validatePassword(pwForm.next)
    if (pwValidError) {
      setPwError(pwValidError)
      return
    }
    if (pwForm.next !== pwForm.confirm) {
      setPwError('새 비밀번호와 확인 비밀번호가 일치하지 않습니다.')
      return
    }

    const res = await fetch('/api/auth/me', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ current_password: pwForm.current, new_password: pwForm.next }),
    })
    const json = await res.json() as ApiErrorBody | { data: { success: boolean }; error: null }
    if (!res.ok || ('error' in json && json.error)) {
      const errJson = json as ApiErrorBody
      setPwError(errJson.error?.message ?? '비밀번호 변경 중 오류가 발생했습니다.')
      return
    }
    setPwSuccess(true)
    setPwForm({ current: '', next: '', confirm: '' })
  }

  const handleLogout = async () => {
    const supabase = createBrowserClientInstance()
    await supabase.auth.signOut()
    router.push('/login')
  }

  const avatarBg = currentUser?.color ?? '#475569'
  const displayName = currentUser?.name ?? '...'

  return (
    <div className="list-wrap">
      <div className="page-hd">
        <div className="flex-col" style={{ minWidth: 0 }}>
          <h1 className="h1">마이 페이지</h1>
          <div className="sub">내 프로필 및 보안 설정</div>
        </div>
      </div>

      <div className="main-scroll">
        <div className="page-body" style={{ display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 560 }}>

          {/* 프로필 카드 */}
          <div className="card" style={{ padding: '24px 24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 20 }}>
              <div
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: '50%',
                  background: avatarBg,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 28,
                  color: '#fff',
                  fontWeight: 700,
                  flexShrink: 0,
                }}
              >
                {displayName.charAt(0)}
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <span style={{ fontSize: 18, fontWeight: 700 }}>{displayName}</span>
                  {currentUser?.role === 'admin' && <Badge tone="accent">관리자</Badge>}
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <div className="text-sm muted" style={{ marginBottom: 2 }}>이메일</div>
                <div className="fw-6">{currentUser?.email ?? '...'}</div>
              </div>
              <div>
                <div className="text-sm muted" style={{ marginBottom: 2 }}>사번</div>
                <div className="fw-6">{currentUser?.employee_id ?? '...'}</div>
              </div>
              <div>
                <div className="text-sm muted" style={{ marginBottom: 2 }}>역할</div>
                <div className="fw-6">{currentUser?.role === 'admin' ? '관리자' : '일반 사용자'}</div>
              </div>
              <div>
                <div className="text-sm muted" style={{ marginBottom: 2 }}>가입일</div>
                <div className="fw-6">{currentUser?.created_at?.slice(0, 10) ?? '...'}</div>
              </div>
            </div>
          </div>

          {/* 비밀번호 변경 */}
          <div className="card" style={{ padding: '24px 24px' }}>
            <h2 style={{ fontSize: 15, fontWeight: 600, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Icon name="shield" size={16} />
              비밀번호 변경
            </h2>

            <form onSubmit={handlePwSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label className="text-sm muted" style={{ display: 'block', marginBottom: 4 }}>현재 비밀번호</label>
                <input
                  type="password"
                  className="input"
                  style={{ width: '100%' }}
                  value={pwForm.current}
                  onChange={e => setPwForm(f => ({ ...f, current: e.target.value }))}
                  placeholder="현재 비밀번호"
                  autoComplete="current-password"
                />
              </div>
              <div>
                <label className="text-sm muted" style={{ display: 'block', marginBottom: 4 }}>새 비밀번호</label>
                <input
                  type="password"
                  className="input"
                  style={{ width: '100%' }}
                  value={pwForm.next}
                  onChange={e => setPwForm(f => ({ ...f, next: e.target.value }))}
                  placeholder="새 비밀번호 (10자 이상, 영문·숫자·특수문자 포함)"
                  autoComplete="new-password"
                />
              </div>
              <div>
                <label className="text-sm muted" style={{ display: 'block', marginBottom: 4 }}>새 비밀번호 확인</label>
                <input
                  type="password"
                  className="input"
                  style={{ width: '100%' }}
                  value={pwForm.confirm}
                  onChange={e => setPwForm(f => ({ ...f, confirm: e.target.value }))}
                  placeholder="새 비밀번호 재입력"
                  autoComplete="new-password"
                />
              </div>

              {pwError && (
                <div style={{ color: 'var(--c-danger)', fontSize: 13 }}>{pwError}</div>
              )}
              {pwSuccess && (
                <div style={{ color: 'var(--c-success)', fontSize: 13 }}>비밀번호가 변경되었습니다.</div>
              )}

              <div>
                <button type="submit" className="btn btn-primary btn-sm">
                  비밀번호 변경
                </button>
              </div>
            </form>
          </div>

          {/* 로그아웃 */}
          <div className="card" style={{ padding: '20px 24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div className="fw-6" style={{ marginBottom: 2 }}>로그아웃</div>
                <div className="muted text-sm">현재 세션에서 로그아웃합니다.</div>
              </div>
              <button
                className="btn btn-secondary btn-sm"
                onClick={handleLogout}
                style={{ display: 'flex', alignItems: 'center', gap: 6 }}
              >
                <Icon name="logout" size={14} />
                로그아웃
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
