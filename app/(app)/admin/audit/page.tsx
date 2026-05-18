// /admin/audit → /history로 이전됨
import { redirect } from 'next/navigation'

export default function AuditRedirect() {
  redirect('/history')
}
