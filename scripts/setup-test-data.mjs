#!/usr/bin/env node
/**
 * setup-test-data.mjs — 시나리오 테스트용 데이터 초기화
 * 실행: node scripts/setup-test-data.mjs
 *
 * Supabase Admin API를 통해 auth.users 생성 후 public 데이터 삽입.
 * supabase db reset 이후에 실행.
 */

const SUPABASE_URL = 'http://127.0.0.1:54321'
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0'
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU'

async function adminPost(path, body) {
  const res = await fetch(`${SUPABASE_URL}${path}`, {
    method: 'POST',
    headers: {
      apikey: SERVICE_KEY,
      Authorization: `Bearer ${SERVICE_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })
  return res.json()
}

async function rest(method, path, body, token = SERVICE_KEY) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1${path}`, {
    method,
    headers: {
      apikey: SERVICE_KEY,
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      Prefer: 'return=representation',
    },
    body: body ? JSON.stringify(body) : undefined,
  })
  const text = await res.text()
  try { return JSON.parse(text) } catch { return text }
}

async function createUser(email, password, meta) {
  const data = await adminPost('/auth/v1/admin/users', {
    email,
    password,
    email_confirm: true,
    user_metadata: meta,
  })
  if (!data.id) {
    console.error(`Failed to create ${email}:`, data)
    process.exit(1)
  }
  console.log(`✅ Created auth user: ${email} → ${data.id}`)
  return data.id
}

async function main() {
  console.log('\n=== 테스트 데이터 초기화 ===\n')

  // 1. 기존 auth 사용자 삭제 (있을 경우)
  const existing = await fetch(`${SUPABASE_URL}/auth/v1/admin/users?per_page=100`, {
    headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}` }
  }).then(r => r.json())

  for (const u of (existing.users || [])) {
    await fetch(`${SUPABASE_URL}/auth/v1/admin/users/${u.id}`, {
      method: 'DELETE',
      headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}` }
    })
    console.log(`🗑  Deleted old user: ${u.email}`)
  }

  // 2. auth.users 생성 (Admin API)
  const PASS = 'Test1234!'
  const adminId  = await createUser('admin@test.com',  PASS, { role: 'admin', name: '관리자', employee_id: '100001' })
  const exec1Id  = await createUser('exec1@test.com',  PASS, { role: 'user',  name: '홍길동', employee_id: '100002', color: '#4A90D9' })
  const exec2Id  = await createUser('exec2@test.com',  PASS, { role: 'user',  name: '이부장', employee_id: '100003', color: '#E74C3C' })
  const exec3Id  = await createUser('exec3@test.com',  PASS, { role: 'user',  name: '박전무', employee_id: '100004', color: '#27AE60' })
  const proxyId  = await createUser('proxy@test.com',  PASS, { role: 'user',  name: '김비서', employee_id: '100005' })

  // 3. public.users 삽입
  const users = [
    { id: adminId, email: 'admin@test.com', employee_id: '100001', name: '관리자', role: 'admin', status: 'active', color: null },
    { id: exec1Id, email: 'exec1@test.com', employee_id: '100002', name: '홍길동', role: 'user',  status: 'active', color: '#4A90D9' },
    { id: exec2Id, email: 'exec2@test.com', employee_id: '100003', name: '이부장', role: 'user',  status: 'active', color: '#E74C3C' },
    { id: exec3Id, email: 'exec3@test.com', employee_id: '100004', name: '박전무', role: 'user',  status: 'active', color: '#27AE60' },
    { id: proxyId, email: 'proxy@test.com', employee_id: '100005', name: '김비서', role: 'user',  status: 'active', color: null },
  ]
  const pubUsers = await rest('POST', '/users', users)
  if (Array.isArray(pubUsers)) console.log(`✅ public.users: ${pubUsers.length}명 삽입`)
  else console.error('public.users 삽입 오류:', pubUsers)

  // 4. companies
  const companies = [
    { name: '삼성전자', aliases: ['Samsung', '삼성', 'SEC'], is_auto_registered: false, created_by: adminId },
    { name: '현대차',   aliases: ['Hyundai', '현대'],        is_auto_registered: true,  created_by: adminId },
  ]
  const pubCo = await rest('POST', '/companies', companies)
  let samsungId, hyundaiId
  if (Array.isArray(pubCo)) {
    samsungId = pubCo.find(c => c.name === '삼성전자')?.id
    hyundaiId = pubCo.find(c => c.name === '현대차')?.id
    console.log(`✅ companies: ${pubCo.length}개 삽입 (samsung=${samsungId?.slice(0,8)}, hyundai=${hyundaiId?.slice(0,8)})`)
  } else {
    console.error('companies 삽입 오류:', pubCo)
    process.exit(1)
  }

  // 5. contacts
  const contacts = [
    { name: '홍철수', company_id: samsungId, title: '부장', email: 'hong@samsung.com', phone: '010-1234-5678', status: 'confirmed', is_auto_registered: false, created_by: adminId },
    { name: '박민준', company_id: null,       title: null,   email: null,              phone: null,            status: 'auto',      is_auto_registered: true,  created_by: exec1Id },
    { name: '김영희', company_id: hyundaiId,  title: '차장', email: 'kim@hyundai.com', phone: '010-9876-5432', status: 'confirmed', is_auto_registered: false, created_by: adminId },
  ]
  const pubCon = await rest('POST', '/contacts', contacts)
  let contactIds = {}
  if (Array.isArray(pubCon)) {
    pubCon.forEach(c => { contactIds[c.name] = c.id })
    console.log(`✅ contacts: ${pubCon.length}명 삽입`)
  } else console.error('contacts 삽입 오류:', pubCon)

  // 6. schedules
  const today = new Date().toISOString().split('T')[0]
  const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0]
  const dayAfter3 = new Date(Date.now() + 3 * 86400000).toISOString().split('T')[0]
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0]

  // 활성 일정 삽입 (동일 키셋)
  const activeSchedules = [
    {
      type: 'personal', owner_id: exec1Id, created_by: exec1Id,
      schedule_date: tomorrow, start_time: '09:00:00', end_time: '10:00:00', time_slot: 'morning',
      title: '삼성전자 미팅', location: '삼성 서초사옥', is_all_day: false,
      deleted_at: null, deleted_by: null
    },
    {
      type: 'common', owner_id: null, created_by: adminId,
      schedule_date: dayAfter3, start_time: '14:00:00', end_time: '15:00:00', time_slot: 'afternoon',
      title: '경영진 전체 회의', location: null, is_all_day: false,
      deleted_at: null, deleted_by: null
    },
  ]
  const pubSch = await rest('POST', '/schedules', activeSchedules)
  let schedIds = {}
  if (Array.isArray(pubSch)) {
    pubSch.forEach((s, i) => { schedIds[i] = s.id })
    console.log(`✅ schedules (활성): ${pubSch.length}건 삽입`)
  } else console.error('schedules 삽입 오류:', pubSch)

  // 삭제된 일정 별도 삽입
  const deletedSch = await rest('POST', '/schedules', [{
    type: 'personal', owner_id: exec1Id, created_by: exec1Id,
    schedule_date: yesterday, start_time: '10:00:00', end_time: '11:00:00', time_slot: 'morning',
    title: '삭제된 일정 (soft delete 테스트)', location: null, is_all_day: false,
    deleted_at: new Date().toISOString(), deleted_by: exec1Id
  }])
  if (Array.isArray(deletedSch)) {
    schedIds[2] = deletedSch[0].id
    console.log(`✅ schedules (삭제): 1건 삽입`)
  } else console.error('deleted schedule 삽입 오류:', deletedSch)

  // 7. schedule_participants (공통 일정)
  if (schedIds[1]) {
    const participants = [exec1Id, exec2Id, exec3Id].map(uid => ({
      schedule_id: schedIds[1], user_id: uid, status: 'joined', added_by: adminId
    }))
    const pubPart = await rest('POST', '/schedule_participants', participants)
    if (Array.isArray(pubPart)) console.log(`✅ schedule_participants: ${pubPart.length}명`)
    else console.error('participants 삽입 오류:', pubPart)
  }

  // 8. mentions (sched[0]에 홍철수 멘션)
  if (schedIds[0] && contactIds['홍철수']) {
    const mention = [{ schedule_id: schedIds[0], reference_type: 'contact', reference_id: contactIds['홍철수'], raw_text: '@홍철수' }]
    const pubMen = await rest('POST', '/mentions', mention)
    if (Array.isArray(pubMen)) console.log(`✅ mentions: ${pubMen.length}건`)
    else console.error('mentions 삽입 오류:', pubMen)
  }

  // 9. proxy_permissions (김비서 → 이부장)
  const proxy = [{ proxy_user_id: proxyId, target_user_id: exec2Id, granted_by: adminId }]
  const pubProxy = await rest('POST', '/proxy_permissions', proxy)
  if (Array.isArray(pubProxy)) console.log(`✅ proxy_permissions: ${pubProxy.length}건 (김비서→이부장)`)
  else console.error('proxy_permissions 삽입 오류:', pubProxy)

  // 10. holidays
  const holidays = [
    { holiday_date: '2026-01-01', name: '신정',       type: 'statutory',  year: 2026, is_active: true, created_by: adminId },
    { holiday_date: '2026-03-01', name: '삼일절',     type: 'statutory',  year: 2026, is_active: true, created_by: adminId },
    { holiday_date: '2026-05-05', name: '어린이날',   type: 'statutory',  year: 2026, is_active: true, created_by: adminId },
    { holiday_date: '2026-08-15', name: '광복절',     type: 'statutory',  year: 2026, is_active: true, created_by: adminId },
    { holiday_date: '2026-10-02', name: '임시공휴일', type: 'temporary',  year: 2026, is_active: true, created_by: adminId },
  ]
  const pubHol = await rest('POST', '/holidays', holidays)
  if (Array.isArray(pubHol)) console.log(`✅ holidays: ${pubHol.length}건`)
  else console.error('holidays 삽입 오류:', pubHol)

  // 11. notification_logs 샘플
  if (schedIds[1]) {
    const notifs = [
      { event_type: 'common_schedule_created', recipient_id: exec1Id, recipient_email: 'exec1@test.com', target_type: 'schedule', target_id: schedIds[1], status: 'sent',   sent_at: new Date().toISOString(), payload: { subject: '[공통 일정] 경영진 전체 회의' } },
      { event_type: 'common_schedule_created', recipient_id: exec2Id, recipient_email: 'exec2@test.com', target_type: 'schedule', target_id: schedIds[1], status: 'failed', sent_at: null,                      payload: { subject: '[공통 일정] 경영진 전체 회의', error: 'SMTP timeout' } },
      { event_type: 'common_schedule_created', recipient_id: exec3Id, recipient_email: 'exec3@test.com', target_type: 'schedule', target_id: schedIds[1], status: 'sent',   sent_at: new Date().toISOString(), payload: { subject: '[공통 일정] 경영진 전체 회의' } },
    ]
    const pubNotif = await rest('POST', '/notification_logs', notifs)
    if (Array.isArray(pubNotif)) console.log(`✅ notification_logs: ${pubNotif.length}건`)
    else console.error('notification_logs 삽입 오류:', pubNotif)
  }

  console.log('\n=== 테스트 데이터 준비 완료 ===')
  console.log('\n계정 목록 (모두 비밀번호: Test1234!):')
  console.log(`  admin@test.com  → 관리자 (ADMIN) [${adminId}]`)
  console.log(`  exec1@test.com  → 홍길동 임원 [${exec1Id}]`)
  console.log(`  exec2@test.com  → 이부장 임원 (대리입력 대상 B) [${exec2Id}]`)
  console.log(`  exec3@test.com  → 박전무 임원 [${exec3Id}]`)
  console.log(`  proxy@test.com  → 김비서 (대리입력자 A) [${proxyId}]`)

  // 저장: 테스트에서 참조하기 위한 UUID 파일
  const ids = { adminId, exec1Id, exec2Id, exec3Id, proxyId, samsungId, hyundaiId, contactIds, schedIds }
  const { writeFileSync } = await import('fs')
  writeFileSync('/tmp/test-ids.json', JSON.stringify(ids, null, 2))
  console.log('\n테스트 UUID → /tmp/test-ids.json 저장됨')
}

main().catch(console.error)
