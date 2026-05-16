/**
 * createServerClient<Database> returns SupabaseClient<Database, SchemaName, Schema>.
 * Due to a type parameter mismatch between @supabase/ssr and @supabase/supabase-js generics
 * (the third generic of SupabaseClient is SchemaName:string, but SSR passes Schema:object),
 * .from().update() receives `never` as its parameter type.
 *
 * Workaround applied in Route Handlers:
 * - Define update payloads as `const x = { ... } satisfies UsersUpdate` — this validates types
 * - Pass as `x as never` only at the Supabase call site — the payload itself is fully type-checked
 *
 * The AuthUserRow type below mirrors the ERD users table with ERD-accurate status values
 * (ERD has pending|active|inactive|locked; types.ts uses status: string).
 */

export type UserStatus = 'pending' | 'active' | 'inactive' | 'locked'

export interface AuthUserRow {
  id: string
  email: string
  employee_id: string
  name: string
  role: 'admin' | 'user'
  status: UserStatus
  failed_login_count: number
  locked_until: string | null
  last_login_at: string | null
}
