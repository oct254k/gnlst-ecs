'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Avatar } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Icon } from '@/components/ui/icon'
import { InviteUserModal } from './invite-user-modal'
import type { UserProfile } from '@/lib/types'

function statusBadge(status: UserProfile['status']) {
  switch (status) {
    case 'active':   return <Badge tone="success" dot>활성</Badge>
    case 'inactive': return <Badge tone="neutral" dot>비활성</Badge>
    case 'locked':   return <Badge tone="danger" dot>잠김</Badge>
    case 'pending':  return <Badge tone="warn" dot>대기</Badge>
  }
}

export function UserTable() {
  const [users, setUsers] = useState<UserProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [inviteOpen, setInviteOpen] = useState(false)
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null)
  const menuRef = useRef<HTMLDivElement | null>(null)

  const fetchUsers = useCallback(() => {
    setLoading(true)
    fetch('/api/users')
      .then(r => r.json())
      .then(json => setUsers(json.data ?? []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    fetchUsers()
  }, [fetchUsers])

  useEffect(() => {
    if (!activeMenuId) return
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setActiveMenuId(null)
      }
    }
    document.addEventListener('click', handleClick)
    return () => document.removeEventListener('click', handleClick)
  }, [activeMenuId])

  const handleRoleChange = async (id: string, role: 'admin' | 'user') => {
    setActiveMenuId(null)
    await fetch(`/api/users/${id}/role`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role }),
    })
    fetchUsers()
  }

  const handleStatusChange = async (id: string, status: 'active' | 'inactive') => {
    setActiveMenuId(null)
    await fetch(`/api/users/${id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    fetchUsers()
  }

  const filtered = users.filter(u => {
    const matchSearch =
      u.name.includes(search) ||
      u.email.includes(search) ||
      u.employee_id.includes(search)
    const matchRole = roleFilter === 'all' || u.role === roleFilter
    const matchStatus = statusFilter === 'all' || u.status === statusFilter
    return matchSearch && matchRole && matchStatus
  })

  const activeCount = users.filter(u => u.status === 'active').length
  const adminCount = users.filter(u => u.role === 'admin').length

  return (
    <>
    <div className="list-wrap">
      <div className="page-hd">
        <div className="flex-col" style={{ minWidth: 0 }}>
          <h1 className="h1">사용자 관리</h1>
          <div className="sub">
            전체 {users.length}명 · 활성 {activeCount}명 · 관리자 {adminCount}명
          </div>
        </div>
        <div className="page-hd-actions">
          <button className="btn btn-primary btn-sm" onClick={() => setInviteOpen(true)}>
            <Icon name="plus" size={12} /> 사용자 초대
          </button>
        </div>
      </div>

      <div className="page-body" style={{ paddingBottom: 12, paddingTop: 12 }}>
        <div className="list-toolbar">
          <div className="input-with-icon" style={{ flex: 1 }}>
            <span className="ico"><Icon name="search" size={14} /></span>
            <input
              className="input"
              placeholder="이름·이메일·사번 검색"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <select
            className="select"
            style={{ width: 120 }}
            value={roleFilter}
            onChange={e => setRoleFilter(e.target.value)}
          >
            <option value="all">전체 역할</option>
            <option value="user">임원</option>
            <option value="admin">관리자</option>
          </select>
          <select
            className="select"
            style={{ width: 120 }}
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
          >
            <option value="all">전체 상태</option>
            <option value="active">활성</option>
            <option value="inactive">비활성</option>
            <option value="pending">대기</option>
          </select>
        </div>
      </div>

      <div className="main-scroll">
        <div className="page-body" style={{ paddingTop: 0 }}>
          <div className="card">
            <table className="tbl">
              <thead>
                <tr>
                  <th style={{ width: 44 }}></th>
                  <th>이름</th>
                  <th>사번</th>
                  <th>이메일</th>
                  <th style={{ width: 90 }}>역할</th>
                  <th style={{ width: 70 }}>색상</th>
                  <th style={{ width: 90 }}>상태</th>
                  <th style={{ width: 150 }}>마지막 로그인</th>
                  <th style={{ width: 44 }}></th>
                </tr>
              </thead>
              <tbody>
                {loading && (
                  <tr>
                    <td colSpan={9}>
                      <div className="empty"><div className="msg">로딩 중...</div></div>
                    </td>
                  </tr>
                )}
                {!loading && filtered.map(u => (
                  <tr key={u.id}>
                    <td><Avatar user={{ name: u.name, color: u.color ?? undefined }} size="sm" /></td>
                    <td className="fw-6">{u.name}</td>
                    <td className="muted">{u.employee_id}</td>
                    <td className="muted">{u.email}</td>
                    <td>
                      {u.role === 'admin'
                        ? <Badge tone="accent">관리자</Badge>
                        : <Badge tone="primary">임원</Badge>}
                    </td>
                    <td>
                      <span
                        style={{
                          display: 'inline-block',
                          width: 16,
                          height: 16,
                          borderRadius: '50%',
                          background: u.color ?? '#999',
                        }}
                      />
                    </td>
                    <td>{statusBadge(u.status)}</td>
                    <td className="muted text-sm">{u.last_login_at ?? '—'}</td>
                    <td style={{ position: 'relative' }}>
                      <button
                        className="btn btn-tertiary btn-icon btn-sm"
                        onClick={e => {
                          e.stopPropagation()
                          setActiveMenuId(prev => prev === u.id ? null : u.id)
                        }}
                      >
                        <Icon name="moreV" size={14} />
                      </button>
                      {activeMenuId === u.id && (
                        <div
                          ref={menuRef}
                          style={{
                            position: 'absolute',
                            right: 0,
                            top: '100%',
                            zIndex: 100,
                            background: 'var(--c-bg)',
                            border: '1px solid var(--c-border)',
                            borderRadius: 8,
                            boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
                            minWidth: 160,
                            overflow: 'hidden',
                          }}
                        >
                          <button
                            className="btn btn-tertiary"
                            style={{ width: '100%', textAlign: 'left', borderRadius: 0, padding: '8px 14px' }}
                            onClick={() => handleRoleChange(u.id, u.role === 'admin' ? 'user' : 'admin')}
                          >
                            {u.role === 'admin' ? '임원으로 변경' : '관리자로 변경'}
                          </button>
                          <button
                            className="btn btn-tertiary"
                            style={{ width: '100%', textAlign: 'left', borderRadius: 0, padding: '8px 14px' }}
                            onClick={() => handleStatusChange(u.id, u.status === 'active' ? 'inactive' : 'active')}
                          >
                            {u.status === 'active' ? '비활성화' : '활성화'}
                          </button>
                        </div>
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

    {inviteOpen && (
      <InviteUserModal
        onClose={() => setInviteOpen(false)}
        onInvited={() => {
          setInviteOpen(false)
          fetchUsers()
        }}
      />
    )}
    </>
  )
}
