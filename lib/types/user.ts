export type UserRole = 'admin' | 'user'

export type UserStatus = 'pending' | 'active' | 'inactive' | 'locked'

export interface UserProfile {
  id: string
  name: string
  email: string
  employee_id: string
  role: UserRole
  status: UserStatus
  color: string | null
  last_login_at: string | null
  created_at: string
  updated_at: string
}

export interface ExecSummary {
  id: string
  name: string
  color: string | null
}

export interface ProxyPermission {
  id: string
  proxy_user: { id: string; name: string }
  target_user: { id: string; name: string }
  granted_by: { id: string; name: string }
  granted_at: string
  revoked_at: string | null
}

export interface ProxyPermissionInput {
  proxy_user_id: string
  target_user_id: string
}

export interface InviteUserInput {
  name: string
  email: string
  employee_id: string
  role: UserRole
  color?: string | null
}
