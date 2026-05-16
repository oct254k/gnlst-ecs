'use client'

import { useState } from 'react'
import { Icon } from '@/components/ui/icon'
import { Badge } from '@/components/ui/badge'
import { Segment } from '@/components/ui/segment'
import { RelationshipPopover } from './relationship-popover'
import type { ContactStatus } from '@/lib/types'
import type { RelationshipHistory } from '@/lib/types'

export interface MockContact {
  id: string
  name: string
  company: { id: string; name: string } | null
  title: string | null
  email: string | null
  phone: string | null
  status: ContactStatus
  created_at: string
}

export interface MockCompany {
  id: string
  name: string
  aliases: string[]
  contact_count: number
  status: 'active' | 'deleted'
  created_at: string
}

interface ContactsTableProps {
  contacts: MockContact[]
  companies: MockCompany[]
  samsungHistory: RelationshipHistory
}

type TabValue = 'contacts' | 'companies'

export function ContactsTable({ contacts, companies, samsungHistory }: ContactsTableProps) {
  const [tab, setTab] = useState<TabValue>('contacts')
  const [search, setSearch] = useState('')
  const [popoverTarget, setPopoverTarget] = useState<{ id: string; name: string; type: 'contact' | 'company' } | null>(null)

  const filteredContacts = contacts.filter((c) => {
    if (!search) return true
    const q = search.toLowerCase()
    return (
      c.name.toLowerCase().includes(q) ||
      (c.company?.name.toLowerCase().includes(q) ?? false) ||
      (c.title?.toLowerCase().includes(q) ?? false)
    )
  })

  const filteredCompanies = companies.filter((c) => {
    if (!search) return true
    const q = search.toLowerCase()
    return (
      c.name.toLowerCase().includes(q) ||
      c.aliases.some((a) => a.toLowerCase().includes(q))
    )
  })

  function getHistory(_id: string): RelationshipHistory | null {
    return samsungHistory.total_count > 0 ? samsungHistory : null
  }

  return (
    <div className="list-wrap">
      <div className="page-hd">
        <div className="flex-col" style={{ minWidth: 0 }}>
          <h1 className="h1">연락처·회사</h1>
          <div className="sub">외부 연락처 및 회사 관리</div>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto' }}>
        <div className="page-body">
          {/* 탭 + 검색 */}
          <div className="list-toolbar" style={{ marginBottom: 16 }}>
            <Segment
              value={tab}
              onChange={(v) => { setTab(v as TabValue); setSearch('') }}
              options={[
                { value: 'contacts', label: `연락처 (${contacts.length})` },
                { value: 'companies', label: `회사 (${companies.length})` },
              ]}
            />
            <div className="search-box" style={{ marginLeft: 'auto' }}>
              <Icon name="search" size={14} />
              <input
                type="text"
                className="input input-sm"
                placeholder={tab === 'contacts' ? '이름·소속·직책 검색' : '회사명·별칭 검색'}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          {/* 연락처 탭 */}
          {tab === 'contacts' && (
            <div style={{ overflowX: 'auto' }}>
              <table className="tbl">
                <thead>
                  <tr>
                    <th>이름</th>
                    <th>소속 회사</th>
                    <th>직책</th>
                    <th>이메일</th>
                    <th>전화</th>
                    <th>상태</th>
                    <th>등록일</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredContacts.length === 0 && (
                    <tr>
                      <td colSpan={7} style={{ textAlign: 'center', padding: 32, color: 'var(--c-text-3)' }}>
                        검색 결과가 없습니다
                      </td>
                    </tr>
                  )}
                  {filteredContacts.map((c) => (
                    <tr key={c.id}>
                      <td className="fw-6">{c.name}</td>
                      <td>
                        {c.company ? (
                          <button
                            type="button"
                            className="btn btn-link"
                            style={{ padding: 0, fontWeight: 400 }}
                            onClick={() =>
                              setPopoverTarget({ id: c.company!.id, name: c.company!.name, type: 'company' })
                            }
                          >
                            @{c.company.name}
                          </button>
                        ) : (
                          <span className="muted">—</span>
                        )}
                      </td>
                      <td>{c.title ?? <span className="muted">—</span>}</td>
                      <td className="text-sm">{c.email ?? <span className="muted">—</span>}</td>
                      <td className="text-sm">{c.phone ?? <span className="muted">—</span>}</td>
                      <td>
                        {c.status === 'auto' ? (
                          <Badge tone="warn">미확인</Badge>
                        ) : (
                          <Badge tone="success">확인됨</Badge>
                        )}
                      </td>
                      <td className="text-sm muted">{c.created_at}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* 회사 탭 */}
          {tab === 'companies' && (
            <div style={{ overflowX: 'auto' }}>
              <table className="tbl">
                <thead>
                  <tr>
                    <th>회사명</th>
                    <th>별칭</th>
                    <th style={{ textAlign: 'center' }}>소속 연락처</th>
                    <th>등록일</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCompanies.length === 0 && (
                    <tr>
                      <td colSpan={4} style={{ textAlign: 'center', padding: 32, color: 'var(--c-text-3)' }}>
                        검색 결과가 없습니다
                      </td>
                    </tr>
                  )}
                  {filteredCompanies.map((co) => (
                    <tr key={co.id}>
                      <td className="fw-6">
                        <button
                          type="button"
                          className="btn btn-link"
                          style={{ padding: 0, fontWeight: 600 }}
                          onClick={() =>
                            setPopoverTarget({ id: co.id, name: co.name, type: 'company' })
                          }
                        >
                          {co.name}
                        </button>
                      </td>
                      <td className="text-sm muted">
                        {co.aliases.length > 0
                          ? co.aliases.join(', ')
                          : <span>—</span>}
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <Badge tone="neutral">{co.contact_count}명</Badge>
                      </td>
                      <td className="text-sm muted">{co.created_at}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* 관계 히스토리 팝오버 */}
      {popoverTarget && (
        <RelationshipPopover
          target={popoverTarget}
          history={getHistory(popoverTarget.id)}
          onClose={() => setPopoverTarget(null)}
        />
      )}
    </div>
  )
}
