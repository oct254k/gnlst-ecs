'use client'

import { useRef, useState, useEffect } from 'react'
import { Icon } from '@/components/ui/icon'
import type { MockUser } from '@/app/(app)/list/page'

interface QuickAddRowProps {
  open: boolean
  users: MockUser[]
  onOpen: () => void
  onClose: () => void
  onSubmit: () => void
}

const TIME_SLOT_OPTIONS = [
  { value: 'morning',   label: '오전' },
  { value: 'lunch',     label: '점심' },
  { value: 'afternoon', label: '오후' },
  { value: 'evening',   label: '저녁' },
  { value: 'allday',    label: '종일' },
] as const

export function QuickAddRow({ open, users, onOpen, onClose, onSubmit }: QuickAddRowProps) {
  const titleRef = useRef<HTMLInputElement>(null)
  const [errors, setErrors] = useState<{ title?: string; date?: string }>({})

  const activeUsers = users.filter((u) => u.role === 'user' && u.status === 'active')

  useEffect(() => {
    if (open) titleRef.current?.focus()
  }, [open])

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Escape') onClose()
  }

  function handleSave() {
    const title = titleRef.current?.value?.trim() ?? ''
    if (!title) {
      setErrors({ title: '일정 내용을 입력해주세요' })
      titleRef.current?.focus()
      return
    }
    setErrors({})
    onSubmit()
    onClose()
  }

  if (!open) {
    return (
      <tr className="quick-add-row" onClick={onOpen}>
        <td colSpan={9}>
          <div className="quick-add-trigger">
            <Icon name="plus" size={12} /> 빠른 일정 추가
          </div>
        </td>
      </tr>
    )
  }

  return (
    <tr className="quick-input-row" onKeyDown={handleKeyDown}>
      <td colSpan={9}>
        <div className="quick-input-form">
          <input
            type="date"
            className="input"
            defaultValue={new Date().toISOString().slice(0, 10)}
            style={{ width: 130 }}
          />
          <select className="select" style={{ width: 90 }}>
            {TIME_SLOT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
          <input type="time" className="input" defaultValue="09:00" style={{ width: 90 }} />
          <input type="time" className="input" defaultValue="10:00" style={{ width: 90 }} />
          <div style={{ flex: 1, minWidth: 200 }}>
            <input
              ref={titleRef}
              className={`input${errors.title ? ' input-error' : ''}`}
              placeholder="일정 내용 *"
              maxLength={200}
              style={{ width: '100%' }}
            />
            {errors.title && (
              <span style={{ fontSize: 11, color: 'var(--c-danger)', marginTop: 2, display: 'block' }}>
                {errors.title}
              </span>
            )}
          </div>
          <input className="input" placeholder="장소" style={{ width: 140 }} />
          <select className="select" style={{ width: 130 }}>
            <option value="">담당자 선택</option>
            {activeUsers.map((u) => (
              <option key={u.id} value={u.id}>{u.name}</option>
            ))}
          </select>
          <button type="button" className="btn btn-primary btn-sm" onClick={handleSave}>
            저장
          </button>
          <button type="button" className="btn btn-tertiary btn-sm" onClick={onClose}>
            취소
          </button>
        </div>
      </td>
    </tr>
  )
}
