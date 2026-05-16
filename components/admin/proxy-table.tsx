'use client'

import { useState, useEffect } from 'react'
import { Avatar } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Icon } from '@/components/ui/icon'
import type { ProxyPermission } from '@/lib/types'

interface ToastFn {
  (msg: string): void
}

interface ProxyTableProps {
  onToast?: ToastFn
}

interface UserOption {
  id: string
  name: string
  role: string
}

export function ProxyTable({ onToast }: ProxyTableProps) {
  const [items, setItems] = useState<ProxyPermission[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [proxyUserId, setProxyUserId] = useState('')
  const [targetUserId, setTargetUserId] = useState('')
  const [users, setUsers] = useState<UserOption[]>([])
  const [granting, setGranting] = useState(false)
  const [pendingRevokeId, setPendingRevokeId] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/proxy-permissions?active=true')
      .then(r => r.json())
      .then(json => setItems(json.data ?? []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    fetch('/api/users')
      .then(r => r.json())
      .then(json => setUsers(json.data ?? []))
      .catch(() => {})
  }, [])

  const activeCount = items.filter(p => p.revoked_at === null).length

  const handleRevokeConfirm = async () => {
    if (!pendingRevokeId) return
    await fetch(`/api/proxy-permissions/${pendingRevokeId}`, { method: 'DELETE' })
    setItems(prev => prev.filter(p => p.id !== pendingRevokeId))
    setPendingRevokeId(null)
    onToast?.('대리 입력 권한이 해제되었습니다.')
  }

  const handleGrant = async () => {
    if (!proxyUserId || !targetUserId) return
    setGranting(true)
    try {
      const res = await fetch('/api/proxy-permissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ proxy_user_id: proxyUserId, target_user_id: targetUserId }),
      })
      if (!res.ok) {
        const json = await res.json()
        onToast?.(json.error?.message ?? '권한 부여에 실패했습니다.')
        return
      }
      setShowForm(false)
      setProxyUserId('')
      setTargetUserId('')
      fetch('/api/proxy-permissions?active=true')
        .then(r => r.json())
        .then(json => setItems(json.data ?? []))
      onToast?.('대리 입력 권한이 부여되었습니다.')
    } catch {
      onToast?.('권한 부여에 실패했습니다.')
    } finally {
      setGranting(false)
    }
  }

  const execUsers = users.filter(u => u.role === 'user')
  const activeItems = items.filter(p => p.revoked_at === null)

  return (
    <>
    <div className="list-wrap">
      <div className="page-hd">
        <div className="flex-col" style={{ minWidth: 0 }}>
          <h1 className="h1">대리권한 관리</h1>
          <div className="sub">활성 권한 {activeCount}건</div>
        </div>
        <div className="page-hd-actions">
          <button
            className="btn btn-primary btn-sm"
            onClick={() => setShowForm(s => !s)}
          >
            <Icon name="plus" size={12} /> 대리권한 부여
          </button>
        </div>
      </div>

      {showForm && (
        <div className="page-body" style={{ paddingBottom: 0 }}>
          <div className="card card-bd" style={{ padding: '12px 16px', display: 'flex', gap: 12, alignItems: 'flex-end', flexWrap: 'wrap' }}>
            <div className="field" style={{ flex: 1, minWidth: 180 }}>
              <label className="field-label">대리입력자 (비서)</label>
              <select
                className="select"
                value={proxyUserId}
                onChange={e => setProxyUserId(e.target.value)}
              >
                <option value="">선택하세요</option>
                {users.map(u => (
                  <option key={u.id} value={u.id}>{u.name}</option>
                ))}
              </select>
            </div>
            <div className="field" style={{ flex: 1, minWidth: 180 }}>
              <label className="field-label">대상 임원</label>
              <select
                className="select"
                value={targetUserId}
                onChange={e => setTargetUserId(e.target.value)}
              >
                <option value="">선택하세요</option>
                {execUsers.map(u => (
                  <option key={u.id} value={u.id}>{u.name}</option>
                ))}
              </select>
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              <button
                className="btn btn-primary btn-sm"
                onClick={handleGrant}
                disabled={!proxyUserId || !targetUserId || granting}
              >
                {granting ? '처리 중...' : '부여'}
              </button>
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => { setShowForm(false); setProxyUserId(''); setTargetUserId('') }}
              >
                취소
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="main-scroll">
        <div className="page-body">
          <div className="alert alert-info mb-3" style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
            <Icon name="info" size={14} />
            <div>
              <b>대리권한</b>: 비서가 임원 이름으로 일정을 등록·수정할 수 있는 권한.
              권한 회수 시 즉시 효과 적용.
            </div>
          </div>

          <div className="card">
            <table className="tbl">
              <thead>
                <tr>
                  <th>대리권한자 (비서)</th>
                  <th style={{ width: 32 }}></th>
                  <th>대상 임원</th>
                  <th style={{ width: 110 }}>부여일</th>
                  <th style={{ width: 90 }}>상태</th>
                  <th style={{ width: 80 }}></th>
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
                {!loading && activeItems.map(p => (
                  <tr key={p.id}>
                    <td>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Avatar user={{ name: p.proxy_user.name }} size="sm" />
                        <span className="fw-6">{p.proxy_user.name}</span>
                      </span>
                    </td>
                    <td className="muted" style={{ textAlign: 'center' }}>→</td>
                    <td>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span className="fw-6">{p.target_user.name}</span>
                      </span>
                    </td>
                    <td className="text-sm muted">
                      {new Date(p.granted_at).toLocaleDateString('ko-KR')}
                    </td>
                    <td>
                      <Badge tone="success" dot>활성</Badge>
                    </td>
                    <td>
                      <button
                        className="btn btn-tertiary btn-sm"
                        onClick={() => setPendingRevokeId(p.id)}
                      >
                        권한 회수
                      </button>
                    </td>
                  </tr>
                ))}
                {!loading && activeItems.length === 0 && (
                  <tr>
                    <td colSpan={6}>
                      <div className="empty">
                        <div className="msg">활성 대리 권한이 없습니다.</div>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>

    {pendingRevokeId !== null && (
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
        onClick={e => { if (e.target === e.currentTarget) setPendingRevokeId(null) }}
      >
        <div
          className="card"
          style={{ width: 340, padding: '24px 24px 20px', background: 'var(--c-bg)', borderRadius: 12 }}
        >
          <h2 className="h2" style={{ margin: '0 0 12px' }}>권한 회수</h2>
          <p style={{ margin: '0 0 20px', color: 'var(--c-text-2)' }}>
            이 대리권한을 회수하시겠습니까?
          </p>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <button className="btn btn-secondary btn-sm" onClick={() => setPendingRevokeId(null)}>
              취소
            </button>
            <button className="btn btn-danger btn-sm" onClick={handleRevokeConfirm}>
              회수
            </button>
          </div>
        </div>
      </div>
    )}
    </>
  )
}
