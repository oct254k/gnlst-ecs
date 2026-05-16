'use client'

import type { GridRow, GridSlot, SlotKey } from './radar-view'

type CellStatus = 'ok' | 'mid' | 'bad'

function cellStatus(slot: GridSlot): CellStatus {
  if (slot.available === slot.total) return 'ok'
  if (slot.available === 0) return 'bad'
  return 'mid'
}

interface AvailabilityGridProps {
  grid: GridRow[]
  slotKeys: SlotKey[]
  slotLabel: Record<SlotKey, string>
  weekdayKo: string[]
  onSlotClick: (date: string, slot: SlotKey) => void
}

export function AvailabilityGrid({
  grid,
  slotKeys,
  slotLabel,
  weekdayKo,
  onSlotClick,
}: AvailabilityGridProps) {
  return (
    <div style={{ padding: 14, overflowX: 'auto' }}>
      <table className="tbl tbl-radar" style={{ minWidth: 480 }}>
        <thead>
          <tr>
            <th className="c-dt" style={{ width: 110, position: 'sticky', left: 0, background: 'var(--c-surface)' }}>
              날짜
            </th>
            {slotKeys.map((sk) => (
              <th key={sk} className="c-stat">
                {slotLabel[sk]}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {grid.map((row) => {
            const dow = new Date(row.date + 'T00:00').getDay()
            const dayLabel = weekdayKo[dow]
            return (
              <tr key={row.date}>
                <td
                  className="c-dt"
                  style={{ position: 'sticky', left: 0, background: 'var(--c-surface)' }}
                >
                  <div className="fw-6 tnum">{row.date.slice(5).replace('-', '.')}</div>
                  <div className="muted text-sm">({dayLabel})</div>
                </td>
                {row.slots.map((s) => {
                  if (row.weekend) {
                    return (
                      <td key={s.slot} className="slot-weekend">
                        주말
                      </td>
                    )
                  }
                  const status = cellStatus(s)
                  const clickable = status !== 'bad'
                  const conflictNames = s.conflicts.map((c) => c.name).join(', ')
                  const title =
                    s.conflicts.length > 0
                      ? `충돌: ${conflictNames}`
                      : '전원 가능'
                  return (
                    <td
                      key={s.slot}
                      className={`slot slot-${status}`}
                      title={title}
                      style={{ cursor: clickable ? 'pointer' : 'default' }}
                      onClick={() => {
                        if (clickable) onSlotClick(row.date, s.slot)
                      }}
                    >
                      <div className="slot-ico">
                        {status === 'ok' ? '✓' : status === 'bad' ? '✗' : '!'}
                      </div>
                      <div className="slot-num tnum">
                        {s.available}/{s.total}
                      </div>
                      {s.conflicts.length > 0 && (
                        <div className="slot-conflict">
                          {s.conflicts
                            .slice(0, 2)
                            .map((c) => c.name)
                            .join(', ')}
                          {s.conflicts.length > 2 && ` +${s.conflicts.length - 2}`}
                        </div>
                      )}
                    </td>
                  )
                })}
              </tr>
            )
          })}
        </tbody>
      </table>

      <div className="alert alert-info mt-3">
        <div>
          <b>슬롯 클릭</b>: 해당 시간대로 일정 등록 모달이 열립니다. 일부 충돌 슬롯은 경고가
          표시됩니다.
        </div>
      </div>
    </div>
  )
}
