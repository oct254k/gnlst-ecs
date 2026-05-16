'use client'

import { useState } from 'react'
import { Icon } from '@/components/ui/icon'

interface HolidayFormModalProps {
  onClose: () => void
  onSaved: () => void
}

export function HolidayFormModal({ onClose, onSaved }: HolidayFormModalProps) {
  const [date, setDate] = useState('')
  const [name, setName] = useState('')
  const [reason, setReason] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!date || !name) return
    setSubmitting(true)
    setError(null)
    try {
      const res = await fetch('/api/holidays', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ holiday_date: date, name, type: 'temporary', memo: reason || null }),
      })
      const json = await res.json()
      if (!res.ok) {
        setError(json.error?.message ?? '저장에 실패했습니다.')
        return
      }
      onSaved()
    } catch {
      setError('저장 중 오류가 발생했습니다.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.4)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
      }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        className="card"
        style={{ width: 400, padding: '24px 24px 20px', background: 'var(--c-bg)', borderRadius: 12 }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <h2 className="h2" style={{ margin: 0 }}>임시 공휴일 추가</h2>
          <button className="btn btn-tertiary btn-icon btn-sm" onClick={onClose}>
            <Icon name="x" size={16} />
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="field" style={{ marginBottom: 14 }}>
            <label className="field-label">날짜 <span style={{ color: 'var(--c-danger)' }}>*</span></label>
            <input
              type="date"
              className="input"
              value={date}
              onChange={e => setDate(e.target.value)}
              required
            />
          </div>
          <div className="field" style={{ marginBottom: 14 }}>
            <label className="field-label">명칭 <span style={{ color: 'var(--c-danger)' }}>*</span></label>
            <input
              type="text"
              className="input"
              placeholder="예: 창립기념일 임시공휴일"
              value={name}
              onChange={e => setName(e.target.value)}
              required
            />
          </div>
          <div className="field" style={{ marginBottom: 20 }}>
            <label className="field-label">사유 <span className="muted text-sm">(선택)</span></label>
            <input
              type="text"
              className="input"
              placeholder="사유를 입력하세요"
              value={reason}
              onChange={e => setReason(e.target.value)}
            />
          </div>
          {error && (
            <div className="alert alert-danger" style={{ marginBottom: 14 }}>
              {error}
            </div>
          )}
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <button type="button" className="btn btn-secondary btn-sm" onClick={onClose}>
              취소
            </button>
            <button
              type="submit"
              className="btn btn-primary btn-sm"
              disabled={submitting || !date || !name}
            >
              {submitting ? '저장 중...' : '저장'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
