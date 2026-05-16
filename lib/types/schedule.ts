export type ScheduleType = 'personal' | 'common'

export type TimeSlot = 'morning' | 'lunch' | 'afternoon' | 'evening' | 'allday'

export interface ScheduleParticipant {
  id: string
  name: string
  joined_at: string
}

export interface ScheduleMention {
  reference_type: 'contact' | 'company'
  reference_id: string
  display_name: string
}

export interface AuditLogEntry {
  id: string
  action: 'created' | 'updated' | 'deleted'
  actor: { id: string; name: string }
  on_behalf_of: { id: string; name: string } | null
  before_data: Record<string, unknown> | null
  after_data: Record<string, unknown> | null
  created_at: string
}

export interface Schedule {
  id: string
  type: ScheduleType
  title: string
  schedule_date: string
  time_slot: TimeSlot
  start_time: string | null
  end_time: string | null
  is_all_day: boolean
  location: string | null
  memo: string | null
  owner: { id: string; name: string; color: string | null } | null
  created_by: { id: string; name: string }
  on_behalf_of: { id: string; name: string } | null
  created_at: string
  updated_at: string
}

export interface ScheduleWithParticipants extends Schedule {
  participants: ScheduleParticipant[]
  mentions: ScheduleMention[]
  recent_audit_logs?: AuditLogEntry[]
}

export interface ScheduleFormInput {
  type: ScheduleType
  title: string
  schedule_date: string
  time_slot: TimeSlot
  is_all_day?: boolean
  start_time?: string | null
  end_time?: string | null
  location?: string | null
  memo?: string | null
  owner_id: string
  on_behalf_of_id?: string | null
  notify_user_ids?: string[]
  participant_ids?: string[]
  mentions?: Array<{ reference_type: 'contact' | 'company'; reference_id: string }>
}

export interface CalendarSchedule {
  id: string
  type: ScheduleType
  title: string
  schedule_date: string
  time_slot: TimeSlot
  start_time: string | null
  end_time: string | null
  owner: { id: string; name: string; color: string | null } | null
}
