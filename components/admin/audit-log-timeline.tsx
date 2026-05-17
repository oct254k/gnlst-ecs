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

// 필드명 → 한국어 레이블
const FIELD_LABEL: Record<string, string> = {
  title: '제목',
  schedule_date: '날짜',
  time_slot: '시간대',
  start_time: '시작',
  end_time: '종료',
  is_all_day: '종일',
  location: '장소',
  memo: '메모',
  type: '구분',
  status: '상태',
  role: '역할',
  user_type: '사용자 유형',
  name: '이름',
  email: '이메일',
  employee_id: '사번',
  color: '색상',
  date: '날짜',
  description: '설명',
  deleted_at: '삭제 일시',
  deleted_by: '삭제자',
}

// 노이즈 필드 (표시 불필요)
const HIDDEN_FIELDS = new Set([
  'id', 'created_at', 'updated_at',
  'owner_id', 'created_by', 'on_behalf_of_id',
  'deleted_at', 'deleted_by',
])

// 수정 시에도 숨기는 노이즈 (updated_at 변경은 의미없음)
const HIDDEN_ON_UPDATE = new Set([...HIDDEN_FIELDS, 'updated_at'])

// 값 포매터
function formatValue(field: string, value: unknown): string {
  if (value === null || value === undefined || value === '') return '—'
  if (field === 'is_all_day') return value ? '예' : '아니오'
  if (field === 'type') {
    if (value === 'personal') return '개인'
    if (value === 'common') return '공통'
  }
  if (field === 'time_slot') {
    const map: Record<string, string> = {
      allday: '종일', morning: '오전', lunch: '점심', afternoon: '오후', evening: '저녁',
    }
    return map[String(value)] ?? String(value)
  }
  if (field === 'role') {
    if (value === 'admin') return '관리자'
    if (value === 'user') return '임원/직원'
  }
  if (field === 'user_type') {
    if (value === 'executive') return '임원'
    if (value === 'staff') return '직원'
  }
  if (field === 'status') {
    const map: Record<string, string> = {
      active: '활성', inactive: '비활성', pending: '대기', locked: '잠김',
    }
    return map[String(value)] ?? String(value)
  }
  return String(value)
}

function fieldLabel(field: string): string {
  return FIELD_LABEL[field] ?? field
}

function formatDateTime(iso: string): string {
  const d = new Date(iso)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

// 등록/삭제 시 주요 필드 목록 (보여줄 순서)
const KEY_FIELDS = [
  'title', 'name', 'schedule_date', 'time_slot', 'start_time', 'end_time',
  'is_all_day', 'location', 'memo', 'type', 'date', 'description',
  'role', 'user_type', 'email', 'employee_id', 'status', 'color',
]

function DataTable({
  data,
  hideFields = HIDDEN_FIELDS,
}: {
  data: Record<string, unknown>
  hideFields?: Set<string>
}) {
  const entries = KEY_FIELDS
    .filter(f => !hideFields.has(f) && f in data && data[f] !== null && data[f] !== '')
    .map(f => [f, data[f]] as [string, unknown])

  // KEY_FIELDS에 없는 나머지 필드도 추가
  const extra = Object.entries(data).filter(
    ([k]) => !hideFields.has(k) && !KEY_FIELDS.includes(k) && data[k] !== null && data[k] !== ''
  )

  const all = [...entries, ...extra]

  if (all.length === 0) return <div className="muted text-sm" style={{ marginTop: 4 }}>내용 없음</div>

  return (
    <table className="tbl" style={{ marginTop: 8, fontSize: 11 }}>
      <tbody>
        {all.map(([k, v]) => (
          <tr key={k}>
            <td style={{ width: 100, color: 'var(--c-text-2)', fontWeight: 600 }}>{fieldLabel(k)}</td>
            <td>{formatValue(k, v)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

function DiffTable({
  before,
  after,
  fields,
}: {
  before: Record<string, unknown> | null
  after: Record<string, unknown> | null
  fields: string[]
}) {
  const visible = fields.filter(f => !HIDDEN_ON_UPDATE.has(f))

  if (visible.length === 0) {
    return <div className="muted text-sm" style={{ marginTop: 4 }}>변경 내용 없음 (동일 값으로 재저장)</div>
  }

  return (
    <table className="tbl" style={{ marginTop: 8, fontSize: 11 }}>
      <thead>
        <tr>
          <th style={{ width: 90 }}>필드</th>
          <th style={{ width: '45%' }}>수정 전</th>
          <th>수정 후</th>
        </tr>
      </thead>
      <tbody>
        {visible.map((field) => (
          <tr key={field}>
            <td style={{ color: 'var(--c-text-2)', fontWeight: 600 }}>{fieldLabel(field)}</td>
            <td className="muted">{formatValue(field, before?.[field])}</td>
            <td style={{ fontWeight: 500 }}>{formatValue(field, after?.[field])}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

function AuditItem({ item }: { item: AuditLogItem }) {
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

        {/* 등록: after_data 전체 표시 */}
        {item.action === 'created' && item.after_data && (
          <DataTable data={item.after_data} />
        )}

        {/* 수정: 변경 전/후 항상 표시 */}
        {item.action === 'updated' && (
          <DiffTable
            before={item.before_data}
            after={item.after_data}
            fields={item.changed_fields ?? []}
          />
        )}

        {/* 삭제: before_data에서 주요 항목 표시 */}
        {item.action === 'deleted' && item.before_data && (
          <DataTable data={item.before_data} />
        )}
      </div>
    </div>
  )
}

interface AuditLogTimelineProps {
  items: AuditLogItem[]
}

export function AuditLogTimeline({ items }: AuditLogTimelineProps) {
  const [filterType, setFilterType] = useState('')
  const [filterAction, setFilterAction] = useState('')

  const filtered = items.filter(item => {
    if (filterType && item.target_type !== filterType) return false
    if (filterAction && item.action !== filterAction) return false
    return true
  })

  return (
    <div>
      <div className="list-toolbar" style={{ marginBottom: 12 }}>
        <select className="select" style={{ width: 130 }} value={filterType} onChange={e => setFilterType(e.target.value)}>
          <option value="">전체 대상</option>
          <option value="schedule">일정</option>
          <option value="contact">연락처</option>
          <option value="company">회사</option>
          <option value="proxy_permission">대리권한</option>
          <option value="holiday">공휴일</option>
          <option value="user">사용자</option>
        </select>
        <select className="select" style={{ width: 110 }} value={filterAction} onChange={e => setFilterAction(e.target.value)}>
          <option value="">전체 액션</option>
          <option value="created">등록</option>
          <option value="updated">수정</option>
          <option value="deleted">삭제</option>
        </select>
        <span className="muted text-sm" style={{ alignSelf: 'center' }}>{filtered.length}건</span>
      </div>

      {filtered.length === 0 ? (
        <div className="empty"><div className="msg">이력이 없습니다</div></div>
      ) : (
        <div className="audit-tl">
          {filtered.map(item => <AuditItem key={item.id} item={item} />)}
        </div>
      )}
    </div>
  )
}
