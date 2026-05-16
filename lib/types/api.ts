export interface ApiError {
  code: string
  message: string
}

export interface ApiMeta {
  total: number
  page: number
  per_page: number
}

export type ApiResponse<T> =
  | { data: T; meta?: ApiMeta; error: null }
  | { data: null; error: ApiError }

export type ApiErrorCode =
  | 'INVALID_CREDENTIALS'
  | 'ACCOUNT_LOCKED'
  | 'ACCOUNT_INACTIVE'
  | 'TOKEN_EXPIRED'
  | 'TOKEN_INVALID'
  | 'NO_PROXY_PERMISSION'
  | 'INVALID_TIME_RANGE'
  | 'EMAIL_DUPLICATE'
  | 'EMPLOYEE_ID_DUPLICATE'
  | 'PERMISSION_DUPLICATE'
  | 'HOLIDAY_DATE_DUPLICATE'
  | 'CANNOT_DELETE_STATUTORY'
  | 'ALREADY_PARTICIPANT'
  | 'SCHEDULE_NOT_FOUND'
  | 'HAS_ACTIVE_MENTIONS'
  | 'COMPANY_NAME_DUPLICATE'
  | 'DATE_RANGE_TOO_LARGE'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'INTERNAL_ERROR'
