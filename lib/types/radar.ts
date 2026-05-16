export type SlotStatus = 'ok' | 'mid' | 'bad' | 'weekend'

export type RadarSlotStatus = 'AVAILABLE' | 'PARTIAL' | 'UNAVAILABLE'

export interface RadarSlot {
  date: string
  start_time: string
  end_time: string
  status: RadarSlotStatus
  available_count: number
  total_count: number
  conflicted_users: Array<{ id: string; name: string }>
}

export interface ExecAvailability {
  slots: RadarSlot[]
}

export interface RadarRequest {
  owner_ids: string[]
  date_from: string
  date_to: string
  slot_minutes?: number
}
