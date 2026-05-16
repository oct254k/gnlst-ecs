import type { ScheduleType, TimeSlot } from './schedule'

export type SortKey = 'schedule_date' | 'created_at' | 'title' | 'owner_name'

export type SortOrder = 'asc' | 'desc'

export interface PaginatedResponse<T> {
  data: T[]
  meta: {
    total: number
    page: number
    per_page: number
  }
}

export interface ListFilter {
  date_from?: string
  date_to?: string
  owner_ids?: string[]
  type?: ScheduleType
  time_slot?: TimeSlot
  keyword?: string
  mention_ref?: string
  page?: number
  per_page?: number
  sort_key?: SortKey
  sort_order?: SortOrder
}

export interface NotificationFilter {
  status?: 'unread' | 'all'
  page?: number
  per_page?: number
}
