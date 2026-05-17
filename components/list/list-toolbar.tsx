'use client'

import { Icon } from '@/components/ui/icon'
import type { MockUser } from '@/app/(app)/list/page'

interface ListToolbarProps {
  search: string
  dateStart: string
  dateEnd: string
  filterOwner: string
  filterType: string
  users: MockUser[]
  onSearchChange: (v: string) => void
  onDateStartChange: (v: string) => void
  onDateEndChange: (v: string) => void
  onOwnerChange: (v: string) => void
  onTypeChange: (v: string) => void
}

export function ListToolbar({
  search,
  dateStart,
  dateEnd,
  filterOwner,
  filterType,
  users,
  onSearchChange,
  onDateStartChange,
  onDateEndChange,
  onOwnerChange,
  onTypeChange,
}: ListToolbarProps) {
  const activeUsers = users.filter((u) => u.role === 'user' && u.status === 'active')

  return (
    <div className="list-toolbar">
      <div className="input-with-icon" style={{ flex: 1, minWidth: 200 }}>
        <span className="ico">
          <Icon name="search" size={14} />
        </span>
        <input
          className={`input${search ? ' has-clear' : ''}`}
          placeholder="제목·장소 검색"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
        />
        {search && (
          <button
            type="button"
            className="btn btn-tertiary btn-icon btn-sm btn-clear"
            onClick={() => onSearchChange('')}
            aria-label="검색 초기화"
          >
            <Icon name="x" size={12} />
          </button>
        )}
      </div>

      <div className="field-row" style={{ gap: 6 }}>
        <input
          type="date"
          className="input"
          style={{ width: 140 }}
          value={dateStart}
          onChange={(e) => onDateStartChange(e.target.value)}
        />
        <span className="muted" style={{ alignSelf: 'center' }}>~</span>
        <input
          type="date"
          className="input"
          style={{ width: 140 }}
          value={dateEnd}
          onChange={(e) => onDateEndChange(e.target.value)}
        />
      </div>

      <select
        className="select"
        style={{ width: 148 }}
        value={filterOwner}
        onChange={(e) => onOwnerChange(e.target.value)}
      >
        <option value="all">전체 담당자</option>
        <option value="common">━ 공통 일정</option>
        {activeUsers.map((u) => (
          <option key={u.id} value={u.id}>
            {u.name} ({u.title})
          </option>
        ))}
      </select>

      <select
        className="select"
        style={{ width: 100 }}
        value={filterType}
        onChange={(e) => onTypeChange(e.target.value)}
      >
        <option value="all">전체 구분</option>
        <option value="personal">개인</option>
        <option value="common">공통</option>
      </select>
    </div>
  )
}
