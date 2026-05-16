export type HolidayType = 'statutory' | 'substitute' | 'temporary'

export interface Holiday {
  id: string
  holiday_date: string
  name: string
  type: HolidayType
  year: number
  original_holiday_name: string | null
  memo: string | null
  is_active: boolean
  created_by: string | null
  created_at: string
  updated_at: string
}

export interface HolidayInput {
  holiday_date: string
  name: string
  type: 'temporary'
  memo?: string | null
}
