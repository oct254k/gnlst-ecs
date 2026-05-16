'use client'

import type { MockUser } from './mock-data'

interface CalendarAsideProps {
  users: MockUser[]
  layerVis: Record<string, boolean>
  onLayerToggle: (userId: string, checked: boolean) => void
  onToggleAll: () => void
}

export function CalendarAside({
  users,
  layerVis,
  onLayerToggle,
  onToggleAll,
}: CalendarAsideProps) {
  const allOn = Object.values(layerVis).every(v => v)

  return (
    <aside className="cal-aside">
      {/* 임원 레이어 */}
      <div className="cal-aside-section">
        <div className="cal-aside-title">임원 색상 레이어</div>
        <div className="cal-aside-list">
          {users.map(u => (
            <label key={u.id} className="layer-row">
              <input
                type="checkbox"
                checked={layerVis[u.id] ?? true}
                onChange={e => onLayerToggle(u.id, e.target.checked)}
                style={{ flexShrink: 0 }}
              />
              <span className="color-dot" style={{ background: u.color }} />
              <span className="layer-name">{u.name}</span>
              <span style={{ color: 'var(--c-text-3)', fontSize: 11, marginLeft: 'auto' }}>{u.title}</span>
            </label>
          ))}
        </div>
        <button className="btn btn-link btn-sm mt-2" onClick={onToggleAll}>
          {allOn ? '모두 해제' : '모두 표시'}
        </button>
      </div>

      {/* 공통 일정 — 항상 표시 */}
      <div className="cal-aside-section">
        <div className="cal-aside-title">공통 일정</div>
        <div className="layer-row">
          <span className="color-dot" style={{ background: 'var(--c-accent)' }} />
          <span className="layer-name">공통 일정</span>
          <span style={{ color: 'var(--c-text-3)', fontSize: 11, marginLeft: 'auto' }}>항상 표시</span>
        </div>
      </div>

      {/* 범례 */}
      <div className="cal-aside-section">
        <div className="cal-aside-title">범례</div>
        <div className="legend">
          <div>
            <span
              className="legend-sw"
              style={{ background: 'var(--c-today-bg)', borderColor: 'var(--c-today-line)' }}
            />
            오늘
          </div>
          <div>
            <span className="legend-sw" style={{ background: '#F5F5F5' }} />
            비업무 시간
          </div>
          <div>
            <span
              className="legend-sw"
              style={{ background: '#FBEAEA', borderColor: 'var(--c-danger)' }}
            />
            공휴일
          </div>
          <div>
            <span
              className="legend-sw"
              style={{ background: '#F0FFF0', borderColor: '#C8E6C8' }}
            />
            빈 업무시간 (주/일)
          </div>
        </div>
      </div>
    </aside>
  )
}
