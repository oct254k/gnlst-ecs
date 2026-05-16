'use client'

import { useState } from 'react'
import { Icon } from '@/components/ui/icon'

const PRESET_COLORS = [
  '#3B82F6', '#EF4444', '#10B981', '#F59E0B',
  '#8B5CF6', '#EC4899', '#06B6D4', '#475569',
]

interface InviteUserModalProps {
  onClose: () => void
  onInvited: () => void
}

export function InviteUserModal({ onClose, onInvited }: InviteUserModalProps) {
  const [form, setForm] = useState({
    name: '',
    email: '',
    employee_id: '',
    role: 'user' as 'admin' | 'user',
    color: PRESET_COLORS[0],
  })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const canSubmit = form.name.trim() && form.email.trim() && form.employee_id.trim()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!canSubmit || submitting) return
    if (!/^\d{6,10}$/.test(form.employee_id.trim())) {
      setError('사번은 6~10자리 숫자여야 합니다')
      return
    }
    setSubmitting(true)
    setError(null)
    try {
      const res = await fetch('/api/users/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name.trim(),
          email: form.email.trim(),
          employee_id: form.employee_id.trim(),
          role: form.role,
          color: form.color,
        }),
      })
      const json = await res.json()
      if (!res.ok) {
        setError(json.error?.message ?? '초대에 실패했습니다')
        return
      }
      onInvited()
    } catch {
      setError('네트워크 오류가 발생했습니다')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <div className="backdrop" onClick={onClose} />
      <div className="modal" role="dialog" aria-labelledby="invite-modal-title">
        <div className="modal-hd">
          <h2 className="modal-hd-title" id="invite-modal-title">사용자 초대</h2>
          <button className="btn btn-icon btn-tertiary" onClick={onClose} aria-label="닫기">
            <Icon name="x" size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-bd">
            <div className="field-row mb-3">
              <div className="field" style={{ flex: 1 }}>
                <label className="field-label">이름 *</label>
                <input
                  className="input"
                  placeholder="홍길동"
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  required
                />
              </div>
              <div className="field" style={{ width: 120 }}>
                <label className="field-label">역할 *</label>
                <select
                  className="select"
                  value={form.role}
                  onChange={e => setForm(f => ({ ...f, role: e.target.value as 'admin' | 'user' }))}
                >
                  <option value="user">임원</option>
                  <option value="admin">관리자</option>
                </select>
              </div>
            </div>

            <div className="field mb-3">
              <label className="field-label">이메일 *</label>
              <input
                className="input"
                type="email"
                placeholder="hong@company.com"
                value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                required
              />
            </div>

            <div className="field mb-3">
              <label className="field-label">사번 *</label>
              <input
                className="input"
                placeholder="100001"
                value={form.employee_id}
                onChange={e => setForm(f => ({ ...f, employee_id: e.target.value }))}
                required
              />
              <div style={{ fontSize: 12, color: 'var(--c-text-3)', marginTop: 4 }}>6~10자리 숫자</div>
            </div>

            <div className="field mb-3">
              <label className="field-label">색상</label>
              <div className="flex gap-2" style={{ flexWrap: 'wrap' }}>
                {PRESET_COLORS.map(c => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setForm(f => ({ ...f, color: c }))}
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: '50%',
                      background: c,
                      border: form.color === c ? '3px solid var(--c-text-1)' : '2px solid transparent',
                      outline: form.color === c ? '2px solid var(--c-bg-1)' : 'none',
                      cursor: 'pointer',
                    }}
                    aria-label={c}
                  />
                ))}
              </div>
            </div>

            {error && (
              <div className="field-help" style={{ color: 'var(--c-danger)' }}>{error}</div>
            )}
          </div>

          <div className="modal-ft">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              취소
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={!canSubmit || submitting}
            >
              {submitting ? '초대 중...' : '초대 보내기'}
            </button>
          </div>
        </form>
      </div>
    </>
  )
}
