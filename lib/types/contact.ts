export type ContactStatus = 'auto' | 'confirmed'

export interface Company {
  id: string
  name: string
  aliases: string[]
  is_auto_registered: boolean
  created_at: string
  updated_at: string
}

export interface Contact {
  id: string
  name: string
  company: { id: string; name: string } | null
  title: string | null
  email: string | null
  phone: string | null
  status: ContactStatus
  is_auto_registered: boolean
  created_at: string
  updated_at: string
}

export interface RelationshipHistory {
  entity_type: 'contact' | 'company'
  entity_name: string
  total_count: number
  last_meeting_date: string | null
  last_executive: string | null
  meetings: Array<{
    schedule_id: string
    date: string
    executive_name: string
    location: string | null
    title: string
  }>
}

export interface MentionAutocompleteResult {
  reference_type: 'contact' | 'company'
  reference_id: string
  display_name: string
}

export interface ContactInput {
  name: string
  company_id?: string | null
  title?: string | null
  email?: string | null
  phone?: string | null
}

export interface CompanyInput {
  name: string
  aliases?: string[]
}
