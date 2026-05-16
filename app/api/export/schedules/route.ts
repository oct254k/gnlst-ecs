import { NextResponse } from 'next/server'
import { createUserClient } from '@/app/_lib/supabase/server'
import type { Tables } from '@/app/_lib/supabase/types'

type UserSnap = Pick<Tables<'users'>, 'id' | 'name'>
type MentionSnap = Pick<Tables<'mentions'>, 'reference_type' | 'reference_id'>

interface ScheduleExportRow {
  id: string
  type: string
  title: string
  schedule_date: string
  start_time: string | null
  end_time: string | null
  location: string | null
  memo: string | null
  created_at: string
  owner: UserSnap | null
  creator: UserSnap | null
  mentions: MentionSnap[]
}

// POST /api/export/schedules
// 일정 엑셀 다운로드용 데이터 반환 (클라이언트에서 xlsx 파일 생성)
// 최대 365일 범위
export async function POST(request: Request) {
  const supabase = await createUserClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json(
      { data: null, error: { code: 'UNAUTHORIZED', message: '인증이 필요합니다' } },
      { status: 401 }
    )
  }

  const body = await request.json() as {
    date_from: string
    date_to: string
    owner_ids?: string[]
    type?: 'personal' | 'common' | null
    keyword?: string | null
  }

  if (!body.date_from || !body.date_to) {
    return NextResponse.json(
      { data: null, error: { code: 'INVALID_INPUT', message: 'date_from과 date_to는 필수입니다' } },
      { status: 400 }
    )
  }

  // 날짜 범위 365일 초과 확인
  const fromDate = new Date(body.date_from)
  const toDate = new Date(body.date_to)
  const diffDays = (toDate.getTime() - fromDate.getTime()) / (1000 * 60 * 60 * 24)
  if (diffDays > 365) {
    return NextResponse.json(
      { data: null, error: { code: 'DATE_RANGE_TOO_LARGE', message: '내보내기 기간은 최대 365일입니다' } },
      { status: 400 }
    )
  }

  let query = supabase
    .from('schedules')
    .select(
      `id, type, title, schedule_date, start_time, end_time, location, memo, created_at,
       owner:users!schedules_owner_id_fkey(id, name),
       creator:users!schedules_created_by_fkey(id, name),
       mentions(reference_type, reference_id)`,
      { count: 'exact' }
    )
    .is('deleted_at', null)
    .gte('schedule_date', body.date_from)
    .lte('schedule_date', body.date_to)
    .order('schedule_date', { ascending: true })
    .order('start_time', { ascending: true })

  if (body.owner_ids && body.owner_ids.length > 0) {
    query = query.in('owner_id', body.owner_ids)
  }
  if (body.type) {
    query = query.eq('type', body.type)
  }
  if (body.keyword) {
    query = query.or(`title.ilike.%${body.keyword}%,location.ilike.%${body.keyword}%`)
  }

  const { data: rawSchedules, error, count } = await query

  if (error) {
    return NextResponse.json(
      { data: null, error: { code: 'INTERNAL_ERROR', message: error.message } },
      { status: 500 }
    )
  }

  const schedules = (rawSchedules ?? []) as unknown as ScheduleExportRow[]

  // 멘션에서 contact/company 이름 조회
  const allMentions = schedules.flatMap((s) => s.mentions ?? [])

  const contactIds = [...new Set(
    allMentions.filter((m) => m.reference_type === 'contact').map((m) => m.reference_id)
  )]

  const companyIds = [...new Set(
    allMentions.filter((m) => m.reference_type === 'company').map((m) => m.reference_id)
  )]

  let contactMap: Record<string, string> = {}
  let companyMap: Record<string, string> = {}

  if (contactIds.length > 0) {
    const { data: contactsRaw } = await supabase
      .from('contacts')
      .select('id, name')
      .in('id', contactIds)
    const contacts = (contactsRaw ?? []) as unknown as Pick<Tables<'contacts'>, 'id' | 'name'>[]
    contactMap = Object.fromEntries(contacts.map((c) => [c.id, c.name]))
  }

  if (companyIds.length > 0) {
    const { data: companiesRaw } = await supabase
      .from('companies')
      .select('id, name')
      .in('id', companyIds)
    const companies = (companiesRaw ?? []) as unknown as Pick<Tables<'companies'>, 'id' | 'name'>[]
    companyMap = Object.fromEntries(companies.map((c) => [c.id, c.name]))
  }

  const formatted = schedules.map((s) => {
    const mentions = s.mentions ?? []
    const contactMentions = mentions
      .filter((m) => m.reference_type === 'contact')
      .map((m) => contactMap[m.reference_id])
      .filter(Boolean)
      .join(', ')
    const companyMentions = mentions
      .filter((m) => m.reference_type === 'company')
      .map((m) => companyMap[m.reference_id])
      .filter(Boolean)
      .join(', ')

    return {
      date: s.schedule_date,
      start_time: s.start_time,
      end_time: s.end_time,
      type: s.type,
      title: s.title,
      executive: s.owner?.name ?? '',
      location: s.location,
      company: companyMentions || null,
      contact: contactMentions || null,
      memo: s.memo,
      created_by: s.creator?.name ?? '',
      created_at: s.created_at
        ? new Intl.DateTimeFormat('sv-SE', {
            timeZone: 'Asia/Seoul',
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            hour12: false,
          }).format(new Date(s.created_at)).replace('T', ' ')
        : '',
    }
  })

  return NextResponse.json({
    data: formatted,
    meta: { total: count ?? 0 },
    error: null,
  })
}
