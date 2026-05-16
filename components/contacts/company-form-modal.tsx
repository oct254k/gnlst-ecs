'use client'

import { useState } from 'react'
import { Icon } from '@/components/ui/icon'
import type { MockCompany } from './contacts-table'

interface CompanyFormModalProps {
  company?: MockCompany
  onClose: () => void
  onSaved: () => void
}

export function CompanyFormModal({ company, onClose, onSaved }: CompanyFormModalProps) {
  const isEdit = !!company

  const [name, setName] = useState(company?.name ?? '')
  // aliases stored as newline-separated string for easy editing
  const [aliasText, setAliasText] = useState(company?.aliases.join('\n') ?? '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) { setError('회사명은 필수입니다'); return }
    setSaving(true)
    setError(null)
    try {
      const aliases = aliasText
        .split('\n')
        .map((s) => s.trim())
        .filter(Boolean)
      const body = { name: name.trim(), aliases }
      const url = isEdit ? `/api/companies/${company.id}` : '/api/companies'
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
          width: 400,
          maxWidth: '90vw',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: 'var(--shadow-lg)',
        }}
      >
        <div className="card-hd">
          <span className="card-hd-title">
            <Icon name="company" size={14} />
            {' '}{isEdit ? '회사 수정' : '새 회사'}
          </span>
          <button type="button" className="btn btn-ghost btn-sm" onClick={onClose} aria-label="닫기">
            <Icon name="x" size={14} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'auto' }}>
          <div className="card-bd" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <label className="field-label">회사명 *</label>
              <input
                type="text"
                className="input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="field-label">별칭 (줄바꿈으로 구분)</label>
              <textarea
                className="input"
                rows={3}
                value={aliasText}
                onChange={(e) => setAliasText(e.target.value)}
                placeholder="삼성&#10;SAMSUNG"
              />
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
