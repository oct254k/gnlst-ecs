'use client'

import { Icon } from '@/components/ui/icon'

export interface FilterChip {
  key: string
  label: string
}

interface ActiveFilterChipsProps {
  filters: FilterChip[]
  onRemove: (key: string) => void
  onClearAll: () => void
}

export function ActiveFilterChips({ filters, onRemove, onClearAll }: ActiveFilterChipsProps) {
  if (filters.length === 0) return null

  return (
    <div className="list-active-filters">
      {filters.map((f) => (
        <span key={f.key} className="badge badge-neutral" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
          {f.label}
          <button
            type="button"
            onClick={() => onRemove(f.key)}
            style={{ display: 'inline-flex', alignItems: 'center', background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: 'inherit' }}
            aria-label={`${f.label} 필터 제거`}
          >
            <Icon name="x" size={10} />
          </button>
        </span>
      ))}
      <button type="button" className="btn btn-link btn-sm" onClick={onClearAll}>
        모두 초기화
      </button>
    </div>
  )
}
