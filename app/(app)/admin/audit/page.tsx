// app/(app)/admin/audit/page.tsx — Server Component
import { AuditLogTimeline } from '@/components/admin/audit-log-timeline'
import type { AuditLogItem } from '@/components/admin/audit-log-timeline'
import { createUserClient } from '@/app/_lib/supabase/server'
import type { Tables } from '@/app/_lib/supabase/types'

type AuditRow = Pick<
  Tables<'audit_logs'>,
  | 'id'
  | 'target_type'
  | 'target_id'
  | 'action'
  | 'actor_name_snapshot'
  | 'on_behalf_of_name_snapshot'
  | 'before_data'
  | 'after_data'
  | 'changed_fields'
  | 'created_at'
>

export default async function AuditLogPage() {
  const supabase = await createUserClient()
  const { data: rawData } = await supabase
    .from('audit_logs')
    .select('id, target_type, target_id, action, actor_name_snapshot, on_behalf_of_name_snapshot, before_data, after_data, changed_fields, created_at')
    .order('created_at', { ascending: false })
    .limit(50)

  const rows = (rawData ?? []) as unknown as AuditRow[]

  const auditLogs: AuditLogItem[] = rows.map(row => {
    const afterData = row.after_data as Record<string, unknown> | null
    const beforeData = row.before_data as Record<string, unknown> | null
    // 삭제 이력은 after_data에 title이 없을 수 있으므로 before_data도 참조
    const targetTitle = String(
      afterData?.title ?? beforeData?.title ??
      afterData?.name ?? beforeData?.name ??
      row.target_id
    )
    return {
      id: row.id,
      action: row.action as AuditLogItem['action'],
      target_type: row.target_type as AuditLogItem['target_type'],
      target_title: targetTitle,
      actor_name: row.actor_name_snapshot ?? '',
      on_behalf_of_name: row.on_behalf_of_name_snapshot ?? null,
      before_data: beforeData,
      after_data: afterData,
      changed_fields: row.changed_fields ?? null,
      created_at: row.created_at,
    }
  })

  return (
    <div className="list-wrap">
      <div className="page-hd">
        <div className="flex-col" style={{ minWidth: 0 }}>
          <h1 className="h1">이력 관리</h1>
          <div className="sub">시스템 전체 변경 이력</div>
        </div>
      </div>

      <div className="main-scroll">
        <div className="page-body">
          <div className="card">
            <div className="card-hd">
              <span className="card-hd-title">변경 이력 타임라인</span>
              <span className="card-hd-meta muted text-sm">최신순</span>
            </div>
            <div className="card-bd">
              <AuditLogTimeline items={auditLogs} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
