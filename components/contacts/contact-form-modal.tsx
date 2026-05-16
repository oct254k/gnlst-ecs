'use client'

import { useState } from 'react'
import { Icon } from '@/components/ui/icon'
import type { MockContact, MockCompany } from './contacts-table'

interface ContactFormModalProps {
  contact?: MockContact
  companies: MockCompany[]
  onClose: () => void
  onSaved: () => void
}

export function ContactFormModal({ contact, companies, onClose, onSaved }: ContactFormModalProps) {
  const isEdit = !!contact

  const [name, setName] = useState(contact?.name ?? '')
  const [companyId, setCompanyId] = useState(contact?.company?.id ?? '')
  const [position, setPosition] = useState(contact?.title ?? '')
  const [email, setEmail] = useState(contact?.email ?? '')
  const [phone, setPhone] = useState(contact?.phone ?? '')
  const [status, setStatus] = useState<'auto' | 'confirmed'>(contact?.status ?? 'auto')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) { setError('이름은 필수입니다'); return }
    setSaving(true)
    setError(null)
    try {
      const body = {
        name: name.trim(),
        company_id: companyId || null,
        title: position.trim() || null,
        email: email.trim() || null,
        phone: phone.trim() || null,
        status,
      }
      const url = isEdit ? `/api/contacts/${contact.id}` : '/api/contacts'
      const method = isEdit ? 'PATCH' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const json = await res.json()
      if (!res.ok) {
        setError(json.error?.message ?? '저장에 실패했습니다')
        return
      }
      onSaved()
    } catch {
      setError('저장에 실패했습니다')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 200,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(0,0,0,0.3)',
      }}
    >
      <div
        className="card"
        style={{
          width: 440,
          maxWidth: '90vw',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: 'var(--shadow-lg)',
        }}
      >
        <div className="card-hd">
          <span className="card-hd-title">
            <Icon name="contact" size={14} />
            {' '}{isEdit ? '연락처 수정' : '새 연락처'}
          </span>
          <button type="button" className="btn btn-ghost btn-sm" onClick={onClose} aria-label="닫기">
            <Icon name="x" size={14} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'auto' }}>
          <div className="card-bd" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <label className="field-label">이름 *</label>
              <input
                type="text"
                className="input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="field-label">소속 회사</label>
              <select
                className="input"
                value={companyId}
                onChange={(e) => setCompanyId(e.target.value)}
              >
                <option value="">— 없음 —</option>
                {companies.map((co) => (
                  <option key={co.id} value={co.id}>{co.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="field-label">직책</label>
              <input
                type="text"
                className="input"
                value={position}
                onChange={(e) => setPosition(e.target.value)}
              />
            </div>
            <div>
              <label className="field-label">이메일</label>
              <input
                type="email"
                className="input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label className="field-label">전화</label>
              <input
                type="text"
                className="input"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
            <div>
              <label className="field-label">상태</label>
              <select
                className="input"
                value={status}
                onChange={(e) => setStatus(e.target.value as 'auto' | 'confirmed')}
              >
                <option value="auto">미확인</option>
                <option value="confirmed">확인됨</option>
              </select>
            </div>
            {error && (
              <div className="field-help" style={{ color: 'var(--c-warn)' }}>{error}</div>
            )}
          </div>

          <div
            style={{
              display: 'flex',
              justifyContent: 'flex-end',
              gap: 8,
              padding: '12px 16px',
              borderTop: '1px solid var(--c-divider)',
            }}
          >
            <button type="button" className="btn btn-secondary" onClick={onClose}>취소</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? '저장 중...' : '저장'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
