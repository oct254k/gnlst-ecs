'use client'

import { useState } from 'react'
import { Badge } from '@/components/ui/badge'

type AuditAction = 'created' | 'updated' | 'deleted'

type TargetType = 'schedule' | 'contact' | 'company' | 'proxy_permission' | 'holiday' | 'user'

export interface AuditLogItem {
  id: string
  action: AuditAction
  target_type: TargetType
  target_title: string
  actor_name: string
  on_behalf_of_name: string | null
  before_data: Record<string, unknown> | null
  after_data: Record<string, unknown> | null
  changed_fields: string[] | null
  created_at: string
}

const ACTION_LABEL: Record<AuditAction, string> = {
  created: '등록',
  updated: '수정',
  deleted: '삭제',
}

const ACTION_TONE: Record<AuditAction, 'success' | 'info' | 'danger'> = {
  created: 'success',
  updated: 'info',
  deleted: 'danger',
}

const TARGET_TYPE_LABEL: Record<TargetType, string> = {
  schedule: '일정',
  contact: '연락처',
  company: '회사',
  proxy_permission: '대리권한',
  holiday: '공휴일',
  user: '사용자',
}

function formatDateTime(iso: string): string {
  const d = new Date(iso)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function ChangedFieldsTable({
  before,
  after,
  fields,
}: {
  before: Record<string, unknown> | null
  after: Record<string, unknown> | null
  fields: string[]
}) {
  if (fields.length === 0) {
    return (
      <div className="muted text-sm" style={{ marginTop: 4 }}>
        변경 내용 없음 (동일 값으로 재저장)
      </div>
    )
  }

  return (
    <table className="tbl" style={{ marginTop: 8, fontSize: 11 }}>
      <thead>
        <tr>
          <th className="c-txt" style={{ width: 120 }}>필드</th>
          <th className="c-txt">수정 전</th>
          <th className="c-txt">수정 후</th>
        </tr>
      </thead>
      <tbody>
        {fields.map((field) => (
          <tr key={field}>
            <td className="c-txt" style={{ color: 'var(--c-text-2)', fontWeight: 600 }}>{field}</td>
            <td className="c-txt muted">{String(before?.[field] ?? '—')}</td>
            <td className="c-txt">{String(after?.[field] ?? '—')}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

function AuditItem({ item }: { item: AuditLogItem }) {
  const [expanded, setExpanded] = useState(false)
  const isUpdated = item.action === 'updated'

  return (
    <div className="audit-item">
      <div className="audit-dot" data-action={item.action} />
      <div className="audit-content">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <Badge tone={ACTION_TONE[item.action]}>{ACTION_LABEL[item.action]}</Badge>
          <span className="badge badge-neutral">{TARGET_TYPE_LABEL[item.target_type]}</span>
          <span className="fw-6" style={{ fontSize: 13 }}>{item.target_title}</span>
        </div>

        <div className="muted text-sm" style={{ marginTop: 4 }}>
          {formatDateTime(item.created_at)}
          {' · '}
          {item.on_behalf_of_name
            ? `${item.on_behalf_of_name} 명의 (입력: ${item.actor_name})`
            : item.actor_name}
        </div>

        {item.action === 'created' && item.after_data && (
          <div className="audit-change muted" style={{ marginTop: 4 }}>
            {Object.entries(item.after_data)
              .filter(([, v]) => v !== null && v !== '')
              .slice(0, 3)
              .map(([k, v]) => `${k}: ${String(v)}`)
              .join(' · ')}
          </div>
        )}

        {isUpdated && (
          <div style={{ marginTop: 6 }}>
            <button
              className="btn btn-link btn-sm"
              onClick={() => setExpanded((p) => !p)}
              style={{ fontSize: 11 }}
            >
              변경 항목 {expanded ? '▲ 접기' : '▼ 펼치기'}
            </button>
            {expanded && (
              <ChangedFieldsTable
                before={item.before_data}
                after={item.after_data}
                fields={item.changed_fields ?? []}
              />
            )}
          </div>
        )}
      </div>
    </div>
  )
}

interface AuditLogTimelineProps {
  items: AuditLogItem[]
}

export function AuditLogTimeline({ items }: AuditLogTimelineProps) {
  const [filterTargetType, setFilterTargetType] = useState<string>('')
  const [filterAction, setFilterAction] = useState<string>('')

  const filtered = items.filter((item) => {
    if (filterTargetType && item.target_type !== filterTargetType) return false
    if (filterAction && item.action !== filterAction) return false
    return true
  })

  return (
    <div>
      {/* 필터 바 */}
      <div className="list-toolbar" style={{ marginBottom: 12 }}>
        <div className="field" style={{ flex: 1 }}>
          <label className="field-label">대상 유형</label>
          <select
            className="select"
            value={filterTargetType}
            onChange={(e) => setFilterTargetType(e.target.value)}
          >
            <option value="">전체</option>
            <option value="schedule">일정</option>
            <option value="contact">연락처</option>
            <option value="company">회사</option>
            <option value="proxy_permission">대리권한</option>
            <option value="holiday">공휴일</option>
            <option value="user">사용자</option>
          </select>
        </div>
        <div className="field" style={{ flex: 1 }}>
          <label className="field-label">액션</label>
          <select
            className="select"
            value={filterAction}
            onChange={(e) => setFilterAction(e.target.value)}
          >
            <option value="">전체</option>
            <option value="created">등록</option>
            <option value="updated">수정</option>
            <option value="deleted">삭제</option>
          </select>
        </div>
        <div className="field" style={{ flex: 0, alignSelf: 'flex-end' }}>
          <span className="muted text-sm">{filtered.length}건</span>
        </div>
      </div>

      {/* 타임라인 */}
      {filtered.length === 0 ? (
        <div className="empty">
          <div className="msg">이력이 없습니다</div>
        </div>
      ) : (
        <div className="audit-tl">
          {filtered.map((item) => (
            <AuditItem key={item.id} item={item} />
          ))}
        </div>
      )}
    </div>
  )
}
