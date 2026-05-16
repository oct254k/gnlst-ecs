'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Icon } from '@/components/ui/icon'
import { Badge } from '@/components/ui/badge'
import { Segment } from '@/components/ui/segment'
import { RelationshipPopover } from './relationship-popover'
import { ContactFormModal } from './contact-form-modal'
import { CompanyFormModal } from './company-form-modal'
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
  isAdmin: boolean
}

type TabValue = 'contacts' | 'companies'
type PopoverTarget = { id: string; name: string; type: 'contact' | 'company' }

export function ContactsTable({ contacts: initialContacts, companies: initialCompanies, isAdmin }: ContactsTableProps) {
  const router = useRouter()
  const [tab, setTab] = useState<TabValue>('contacts')
  const [search, setSearch] = useState('')

  // 팝오버 상태
  const [popoverTarget, setPopoverTarget] = useState<PopoverTarget | null>(null)
  const [popoverHistory, setPopoverHistory] = useState<RelationshipHistory | null>(null)
  const [popoverLoading, setPopoverLoading] = useState(false)
  const [popoverError, setPopoverError] = useState<string | null>(null)

  // 연락처 모달 상태
  const [contactModal, setContactModal] = useState<{ open: boolean; contact?: MockContact }>({ open: false })

  // 회사 모달 상태
  const [companyModal, setCompanyModal] = useState<{ open: boolean; company?: MockCompany }>({ open: false })

  const filteredContacts = initialContacts.filter((c) => {
    if (!search) return true
    const q = search.toLowerCase()
    return (
      c.name.toLowerCase().includes(q) ||
      (c.company?.name.toLowerCase().includes(q) ?? false) ||
      (c.title?.toLowerCase().includes(q) ?? false)
    )
  })

  const filteredCompanies = initialCompanies.filter((c) => {
    if (!search) return true
    const q = search.toLowerCase()
    return (
      c.name.toLowerCase().includes(q) ||
      c.aliases.some((a) => a.toLowerCase().includes(q))
    )
  })

  async function handlePopoverOpen(target: PopoverTarget) {
    setPopoverTarget(target)
    setPopoverLoading(true)
    setPopoverError(null)
    setPopoverHistory(null)
    await fetchHistory(target)
  }

  async function fetchHistory(target: PopoverTarget) {
    setPopoverLoading(true)
    setPopoverError(null)
    try {
      const res = await fetch(
        `/api/relationships?reference_type=${target.type}&reference_id=${target.id}`
      )
      if (!res.ok) throw new Error()
      const json = await res.json()
      const history = json.data as RelationshipHistory | null
      // total_count === 0이면 빈 상태로 표시
      setPopoverHistory(history && history.total_count > 0 ? history : null)
    } catch {
      setPopoverError('이력을 불러오지 못했습니다')
      setPopoverHistory(null)
    } finally {
      setPopoverLoading(false)
    }
  }

  async function handleDeleteContact(id: string, name: string) {
    if (!confirm(`"${name}" 연락처를 삭제하시겠습니까?`)) return
    const res = await fetch(`/api/contacts/${id}`, { method: 'DELETE' })
    if (res.status === 409) {
      const json = await res.json()
      if (json.error?.code === 'HAS_ACTIVE_MENTIONS') {
        if (!confirm('활성 멘션이 있습니다. 그래도 삭제하시겠습니까?')) return
        const res2 = await fetch(`/api/contacts/${id}?force=true`, { method: 'DELETE' })
        if (!res2.ok && res2.status !== 204) {
          alert('삭제에 실패했습니다')
          return
        }
      } else {
        alert('삭제할 수 없습니다')
        return
      }
    } else if (!res.ok && res.status !== 204) {
      alert('삭제에 실패했습니다')
      return
    }
    router.refresh()
  }

  async function handleDeleteCompany(id: string, name: string) {
    if (!confirm(`"${name}" 회사를 삭제하시겠습니까?`)) return
    const res = await fetch(`/api/companies/${id}`, { method: 'DELETE' })
    if (!res.ok && res.status !== 204) {
      alert('삭제에 실패했습니다')
      return
    }
    router.refresh()
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
          {/* 탭 + 검색 + 관리자 버튼 */}
          <div className="list-toolbar" style={{ marginBottom: 16 }}>
            <Segment
              value={tab}
              onChange={(v) => { setTab(v as TabValue); setSearch('') }}
              options={[
                { value: 'contacts', label: `연락처 (${initialContacts.length})` },
                { value: 'companies', label: `회사 (${initialCompanies.length})` },
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
            {isAdmin && tab === 'contacts' && (
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={() => setContactModal({ open: true })}
              >
                <Icon name="plus" size={14} /> 새 연락처
              </button>
            )}
            {isAdmin && tab === 'companies' && (
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={() => setCompanyModal({ open: true })}
              >
                <Icon name="plus" size={14} /> 새 회사
              </button>
            )}
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
                    {isAdmin && <th style={{ width: 80 }} />}
                  </tr>
                </thead>
                <tbody>
                  {filteredContacts.length === 0 && (
                    <tr>
                      <td colSpan={isAdmin ? 8 : 7} style={{ textAlign: 'center', padding: 32, color: 'var(--c-text-3)' }}>
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
                              handlePopoverOpen({ id: c.company!.id, name: c.company!.name, type: 'company' })
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
                      {isAdmin && (
                        <td>
                          <div className="flex gap-1">
                            <button
                              type="button"
                              className="btn btn-ghost btn-sm"
                              onClick={() => setContactModal({ open: true, contact: c })}
                              aria-label="수정"
                            >
                              <Icon name="edit" size={13} />
                            </button>
                            <button
                              type="button"
                              className="btn btn-ghost btn-sm"
                              style={{ color: 'var(--c-danger)' }}
                              onClick={() => handleDeleteContact(c.id, c.name)}
                              aria-label="삭제"
                            >
                              <Icon name="trash" size={13} />
                            </button>
                          </div>
                        </td>
                      )}
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
                    {isAdmin && <th style={{ width: 80 }} />}
                  </tr>
                </thead>
                <tbody>
                  {filteredCompanies.length === 0 && (
                    <tr>
                      <td colSpan={isAdmin ? 5 : 4} style={{ textAlign: 'center', padding: 32, color: 'var(--c-text-3)' }}>
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
                            handlePopoverOpen({ id: co.id, name: co.name, type: 'company' })
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
                      {isAdmin && (
                        <td>
                          <div className="flex gap-1">
                            <button
                              type="button"
                              className="btn btn-ghost btn-sm"
                              onClick={() => setCompanyModal({ open: true, company: co })}
                              aria-label="수정"
                            >
                              <Icon name="edit" size={13} />
                            </button>
                            <button
                              type="button"
                              className="btn btn-ghost btn-sm"
                              style={{ color: 'var(--c-danger)' }}
                              onClick={() => handleDeleteCompany(co.id, co.name)}
                              aria-label="삭제"
                            >
                              <Icon name="trash" size={13} />
                            </button>
                          </div>
                        </td>
                      )}
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
          history={popoverHistory}
          loading={popoverLoading}
          error={popoverError}
          onRetry={() => fetchHistory(popoverTarget)}
          onClose={() => setPopoverTarget(null)}
        />
      )}

      {/* 연락처 신규/수정 모달 */}
      {contactModal.open && (
        <ContactFormModal
          contact={contactModal.contact}
          companies={initialCompanies}
          onClose={() => setContactModal({ open: false })}
          onSaved={() => { setContactModal({ open: false }); router.refresh() }}
        />
      )}

      {/* 회사 신규/수정 모달 */}
      {companyModal.open && (
        <CompanyFormModal
          company={companyModal.company}
          onClose={() => setCompanyModal({ open: false })}
          onSaved={() => { setCompanyModal({ open: false }); router.refresh() }}
        />
      )}
    </div>
  )
}
