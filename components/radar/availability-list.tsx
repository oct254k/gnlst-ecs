'use client'

export type SlotKey = 'allday' | 'morning' | 'lunch' | 'afternoon' | 'evening'

export interface SlotResult {
  date: string
  slot: SlotKey
  start_time: string
  end_time: string
  total: number
}

const SLOT_LABEL: Record<SlotKey, string> = {
  allday:    '종일',
  morning:   '오전',
  lunch:     '점심',
  afternoon: '오후',
  evening:   '저녁',
}

const SLOT_TIME: Record<SlotKey, string> = {
  allday:    '하루 종일',
  morning:   '09:00 ~ 12:00',
  lunch:     '12:00 ~ 14:00',
  afternoon: '14:00 ~ 18:00',
  evening:   '18:00 ~ 22:00',
}

const WEEKDAY_KO = ['일', '월', '화', '수', '목', '금', '토']

interface AvailabilityListProps {
  slots: SlotResult[]
  onSlotClick: (date: string, slot: SlotKey) => void
}

export function AvailabilityList({ slots, onSlotClick }: AvailabilityListProps) {
  if (slots.length === 0) {
    return (
      <div className="empty" style={{ padding: 80 }}>
        <div className="emoji">😔</div>
        <div className="msg">선택한 기간에 전원 가능한 시간이 없습니다</div>
      </div>
    )
  }

  return (
    <div style={{ padding: 14 }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {slots.map((s) => {
          const dow = new Date(s.date + 'T00:00').getDay()
          const dayLabel = WEEKDAY_KO[dow]
          const dateDisplay = s.date.slice(5).replace('-', '.')
          const isAllDay = s.slot === 'allday'

          return (
            <button
              key={`${s.date}-${s.slot}`}
              type="button"
              className="layer-row"
              style={{
                padding: '12px 16px',
                borderRadius: 8,
                border: '1px solid var(--c-divider)',
                cursor: 'pointer',
                textAlign: 'left',
                background: 'var(--c-surface)',
                width: '100%',
              }}
              onClick={() => onSlotClick(s.date, s.slot)}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ minWidth: 88 }}>
                  <span className="fw-6 tnum">{dateDisplay}</span>
                  <span className="muted text-sm" style={{ marginLeft: 4 }}>({dayLabel})</span>
                </div>

                <span
                  className={`badge ${isAllDay ? 'badge-primary' : 'badge-ok'}`}
                  style={{ minWidth: 40, textAlign: 'center' }}
                >
                  {SLOT_LABEL[s.slot]}
                </span>

                <span className="muted text-sm">{SLOT_TIME[s.slot]}</span>

                <span style={{ marginLeft: 'auto', color: 'var(--c-ok)', fontSize: 13, whiteSpace: 'nowrap' }}>
                  ✓ {s.total}명 전원 가능
                </span>
              </div>
            </button>
          )
        })}
      </div>
      <div className="alert alert-info mt-3">
        슬롯을 클릭하면 해당 시간으로 일정 등록 모달이 열립니다
      </div>
    </div>
  )
}
