import { createUserClient } from '@/app/_lib/supabase/server'
import { ContactsTable } from '@/components/contacts/contacts-table'
import type { MockContact, MockCompany } from '@/components/contacts/contacts-table'

type RawContact = {
  id: string
  name: string
  title: string | null
  email: string | null
  phone: string | null
  status: string
  created_at: string
  company_id: string | null
  companies: { id: string; name: string } | null
}

type RawCompany = {
  id: string
  name: string
  aliases: string[]
  created_at: string
}

export default async function ContactsPage() {
  let contacts: MockContact[] = []
  let companies: MockCompany[] = []
  let isAdmin = false

  try {
    const supabase = await createUserClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (user) {
      isAdmin = user.user_metadata?.role === 'admin'

      const [contactsResult, companiesResult] = await Promise.all([
        supabase
          .from('contacts')
          .select('id, name, title, email, phone, status, created_at, company_id, companies(id, name)')
          .is('deleted_at', null)
          .order('name', { ascending: true })
          .limit(100),
        supabase
          .from('companies')
          .select('id, name, aliases, created_at')
          .is('deleted_at', null)
          .order('name', { ascending: true })
          .limit(100),
      ])

      const contactRows = (contactsResult.data ?? []) as unknown as RawContact[]
      const companyRows = (companiesResult.data ?? []) as unknown as RawCompany[]

      contacts = contactRows.map((c) => ({
        id: c.id,
        name: c.name,
        company: c.companies ? { id: c.companies.id, name: c.companies.name } : null,
        title: c.title,
        email: c.email,
        phone: c.phone,
        status: c.status as MockContact['status'],
        created_at: c.created_at,
      }))

      // 회사별 연락처 수 계산
      const countMap: Record<string, number> = {}
      for (const c of contacts) {
        if (c.company) {
          countMap[c.company.id] = (countMap[c.company.id] ?? 0) + 1
        }
      }

      companies = companyRows.map((c) => ({
        id: c.id,
        name: c.name,
        aliases: c.aliases ?? [],
        contact_count: countMap[c.id] ?? 0,
        status: 'active' as const,
        created_at: c.created_at,
      }))
    }
  } catch {
    // Supabase 연결 실패 시 빈 데이터로 graceful fallback
  }

  return (
    <ContactsTable
      contacts={contacts}
      companies={companies}
      isAdmin={isAdmin}
    />
  )
}
