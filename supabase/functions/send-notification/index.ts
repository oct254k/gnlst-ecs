// @ts-nocheck
// Supabase Edge Function — Deno 런타임 전용
// Next.js TypeScript 컴파일러 대상에서 제외되어야 함 (Deno 모듈 import 불호환)
// 실제 배포: supabase functions deploy send-notification

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

// send-notification Edge Function
// 알림 발송 stub — 실제 Resend 연동 없이 payload 로깅만 수행

interface NotificationPayload {
  notification_log_id: string
  event_type: string
  recipient_email: string
  recipient_id?: string
  target_type?: string
  target_id?: string
  payload?: Record<string, unknown>
}

serve(async (req: Request) => {
  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method Not Allowed' }),
      { status: 405, headers: { 'Content-Type': 'application/json' } }
    )
  }

  let body: NotificationPayload
  try {
    body = await req.json()
  } catch {
    return new Response(
      JSON.stringify({ error: 'Invalid JSON body' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    )
  }

  const { notification_log_id, event_type, recipient_email, payload } = body

  if (!notification_log_id || !event_type || !recipient_email) {
    return new Response(
      JSON.stringify({ error: 'notification_log_id, event_type, recipient_email are required' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    )
  }

  // 실제 이메일 발송 로직 없이 payload 로깅만 수행
  console.log('[send-notification] Received:', {
    notification_log_id,
    event_type,
    recipient_email,
    payload,
  })

  // TODO: 실제 운영 시 아래 주석을 해제하고 Resend API 연동
  // const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
  // await fetch('https://api.resend.com/emails', {
  //   method: 'POST',
  //   headers: {
  //     'Authorization': `Bearer ${RESEND_API_KEY}`,
  //     'Content-Type': 'application/json',
  //   },
  //   body: JSON.stringify({
  //     from: 'noreply@example.com',
  //     to: recipient_email,
  //     subject: payload?.title ?? event_type,
  //     html: `<p>${JSON.stringify(payload)}</p>`,
  //   }),
  // })

  console.log('[send-notification] Stub: would send to', recipient_email, 'for event', event_type)

  return new Response(
    JSON.stringify({
      success: true,
      notification_log_id,
      message: 'Notification stub processed (no actual email sent)',
    }),
    { status: 200, headers: { 'Content-Type': 'application/json' } }
  )
})
