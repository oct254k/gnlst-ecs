'use client'

import { useState, useEffect, useCallback } from 'react'
import { Badge } from '@/components/ui/badge'
import { Icon } from '@/components/ui/icon'
import { HolidayFormModal } from './holiday-form-modal'
import type { Holiday } from '@/lib/types'

const KO_WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토']

function weekdayOf(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00')
  return KO_WEEKDAYS[d.getDay()]
}

function typeBadge(type: Holiday['type']) {
  switch (type) {
    case 'statutory':  return <Badge tone="danger">법정</Badge>
    case 'substitute': return <Badge tone="warn">대체</Badge>
    case 'temporary':  return <Badge tone="neutral">임시</Badge>
  }
}

interface HolidayTableProps {
  onToast?: (msg: string) => void
}

export function HolidayTable({ onToast }: HolidayTableProps) {
  const [items, setItems] = useState<Holiday[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null)

  const currentYear = new Date().getFullYear()

  const fetchHolidays = useCallback(() => {
    setLoading(true)
    fetch(`/api/holidays?year=${currentYear}`)
      .then(r => r.json())
      .then(json => setItems(json.data ?? []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [currentYear])

  useEffect(() => {
    fetchHolidays()
  }, [fetchHolidays])

  const handleToggleActive = async (id: string, current: boolean) => {
    await fetch(`/api/holidays/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_active: !current }),
    })
    setItems(prev => prev.map(h => h.id === id ? { ...h, is_active: !current } : h))
  }

  const handleDeleteConfirm = async () => {
    if (!pendingDeleteId) return
    await fetch(`/api/holidays/${pendingDeleteId}`, { method: 'DELETE' })
    setItems(prev => prev.filter(h => h.id !== pendingDeleteId))
    setPendingDeleteId(null)
    onToast?.('공휴일이 삭제되었습니다.')
  }

  return (
    <>
    <div className="list-wrap">
      <div className="page-hd">
        <div className="flex-col" style={{ minWidth: 0 }}>
          <h1 className="h1">공휴일 관리</h1>
          <div className="sub">{currentYear}년 등록 {items.length}건</div>
        </div>
        <div className="page-hd-actions">
          <button
            className="btn btn-primary btn-sm"
            onClick={() => setShowAddModal(true)}
          >
            <Icon name="plus" size={12} /> 공휴일 추가
          </button>
        </div>
      </div>

      <div className="main-scroll">
        <div className="page-body">
          <div className="card">
            <table className="tbl">
              <thead>
                <tr>
                  <th style={{ width: 160 }}>날짜</th>
                  <th>공휴일명</th>
                  <th style={{ width: 100 }}>유형</th>
                  <th>비고</th>
                  <th style={{ width: 80 }}>활성</th>
                  <th style={{ width: 44 }}></th>
                </tr>
              </thead>
              <tbody>
                {loading && (
                  <tr>
                    <td colSpan={6}>
                      <div className="empty"><div className="msg">로딩 중...</div></div>
                    </td>
                  </tr>
                )}
                {!loading && items.map(h => (
                  <tr key={h.id}>
                    <td className="text-sm">
                      {h.holiday_date} ({weekdayOf(h.holiday_date)})
                    </td>
                    <td className="fw-6">{h.name}</td>
                    <td>{typeBadge(h.type)}</td>
                    <td className="muted text-sm">{h.memo ?? '—'}</td>
                    <td>
                      <input
                        type="checkbox"
                        checked={h.is_active}
                        onChange={() => handleToggleActive(h.id, h.is_active)}
                        style={{ cursor: 'pointer' }}
                      />
                    </td>
                    <td>
                      {h.type === 'temporary' && (
                        <button
                          className="btn btn-tertiary btn-icon btn-sm"
                          onClick={() => setPendingDeleteId(h.id)}
                          title="삭제"
                        >
                          <Icon name="trash" size={14} />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>

    {showAddModal && (
      <HolidayFormModal
        onClose={() => setShowAddModal(false)}
        onSaved={() => { setShowAddModal(false); fetchHolidays() }}
      />
    )}

    {pendingDeleteId !== null && (
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
        onClick={e => { if (e.target === e.currentTarget) setPendingDeleteId(null) }}
      >
        <div
          className="card"
          style={{ width: 340, padding: '24px 24px 20px', background: 'var(--c-bg)', borderRadius: 12 }}
        >
          <h2 className="h2" style={{ margin: '0 0 12px' }}>공휴일 삭제</h2>
          <p style={{ margin: '0 0 20px', color: 'var(--c-text-2)' }}>
            이 임시 공휴일을 삭제하시겠습니까?
          </p>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <button className="btn btn-secondary btn-sm" onClick={() => setPendingDeleteId(null)}>
              취소
            </button>
            <button className="btn btn-danger btn-sm" onClick={handleDeleteConfirm}>
              삭제
            </button>
          </div>
        </div>
      </div>
    )}
    </>
  )
}
