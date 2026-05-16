---
title: 기능명세서 - API 엔드포인트 정의
version: "1.0"
date: 2026-05-14
category: spec
---

# 14. API 엔드포인트 정의

**관련 문서**: `erd/erd.md`, `00_cross_ref.md`, `ia/screen_list.md`

---

## 1. 설계 원칙

| 항목 | 규칙 |
|------|------|
| Base URL | `/api/v1` |
| 인증 방식 | `Authorization: Bearer <JWT>` (Supabase Auth 토큰) |
| 응답 래퍼 | `{ "data": ..., "meta": {...}, "error": null }` (성공) / `{ "data": null, "error": { "code": "...", "message": "..." } }` (실패) |
| Soft delete | 모든 조회는 `deleted_at IS NULL` 조건 자동 적용 |
| 페이지네이션 | `?page=1&per_page=50` (기본값), 응답 `meta.total`, `meta.page`, `meta.per_page` 포함 |
| 날짜 포맷 | `YYYY-MM-DD` (date), `YYYY-MM-DDTHH:mm:ssZ` (datetime, KST 기준) |
| 시간 포맷 | `HH:mm` (로컬 KST) |
| UUID | 모든 `id` 필드는 UUID v4 |
| HTTP 상태 코드 | 200 성공, 201 생성, 204 삭제, 400 유효성, 401 인증, 403 권한, 404 없음, 409 충돌, 500 서버오류 |

---

## 2. 공통 타입 정의

### 2-1. 역할 (users.role)
| 값 | 의미 |
|----|------|
| `admin` | 관리자 |
| `user` | 임원 |

### 2-2. 일정 유형 (schedules.type)
| 값 | 의미 |
|----|------|
| `personal` | 개인 일정 |
| `common` | 공통 일정 |

### 2-3. 시간대 (schedules.time_slot)
| 값 | 의미 | 기본 시간 |
|----|------|-----------|
| `morning` | 오전 | 09:00~12:00 |
| `afternoon` | 오후 | 13:00~18:00 |
| `evening` | 저녁 | 18:00~ |
| `lunch` | 점심 | 12:00~13:00 |
| `allday` | 종일 | — |

### 2-4. 알림 상태 (notification_logs.status)
| 값 | 의미 |
|----|------|
| `pending` | 발송 대기 |
| `retrying` | 재시도 중 |
| `sent` | 발송 성공 |
| `failed` | 최종 실패 (3회 소진) |
| `skipped` | 발송 생략 |

### 2-5. 공휴일 유형 (holidays.type)
| 값 | 의미 |
|----|------|
| `statutory` | 법정 공휴일 |
| `substitute` | 대체 공휴일 |
| `temporary` | 임시 공휴일 |

---

## 3. 인증 (spec/01_auth.md)

### POST `/auth/login`
- **기능 ID**: AUTH-002
- **설명**: 이메일 또는 사번으로 로그인
- **인증 필요**: 없음

**요청 Body**
```json
{
  "login_type": "email | employee_id",
  "identifier": "user@example.com",
  "password": "string"
}
```

**응답 200**
```json
{
  "data": {
    "access_token": "string",
    "refresh_token": "string",
    "user": {
      "id": "uuid",
      "name": "string",
      "email": "string",
      "role": "admin | user",
      "color": "#RRGGBB | null"
    }
  }
}
```

**오류**
| 상태 | code | 설명 |
|------|------|------|
| 401 | `INVALID_CREDENTIALS` | 이메일/사번 또는 비밀번호 불일치 |
| 403 | `ACCOUNT_LOCKED` | 계정 잠금 (5회 실패) |
| 403 | `ACCOUNT_INACTIVE` | 비활성 또는 삭제된 계정 |

---

### POST `/auth/logout`
- **기능 ID**: AUTH-004
- **설명**: 세션 무효화
- **인증 필요**: 있음

**응답 204** (본문 없음)

---

### POST `/auth/password/forgot`
- **기능 ID**: AUTH-003
- **설명**: 비밀번호 재설정 메일 발송
- **인증 필요**: 없음

**요청 Body**
```json
{ "email": "user@example.com" }
```

**응답 200**
```json
{ "data": { "message": "이메일을 확인하세요" } }
```
> 미등록 이메일도 동일 응답 반환 (보안 — 존재 여부 노출 방지)

---

### POST `/auth/password/reset`
- **기능 ID**: AUTH-003
- **설명**: 토큰으로 새 비밀번호 설정
- **인증 필요**: 없음

**요청 Body**
```json
{
  "token": "string",
  "new_password": "string"
}
```

**응답 200**
```json
{ "data": { "message": "비밀번호가 변경되었습니다" } }
```

**오류**
| 상태 | code | 설명 |
|------|------|------|
| 400 | `TOKEN_EXPIRED` | 링크 만료 (60분) |
| 400 | `TOKEN_INVALID` | 잘못된 토큰 |

---

### POST `/auth/invite/accept`
- **기능 ID**: AUTH-001
- **설명**: 초대 링크 수락 및 비밀번호 설정
- **인증 필요**: 없음

**요청 Body**
```json
{
  "token": "string",
  "new_password": "string"
}
```

**응답 200**
```json
{
  "data": {
    "access_token": "string",
    "user": { "id": "uuid", "name": "string", "role": "user" }
  }
}
```

---

### GET `/auth/me`
- **기능 ID**: AUTH-004
- **설명**: 내 프로필 조회
- **인증 필요**: 있음

**응답 200**
```json
{
  "data": {
    "id": "uuid",
    "name": "string",
    "email": "string",
    "employee_id": "string",
    "role": "admin | user",
    "color": "#RRGGBB | null",
    "status": "active"
  }
}
```

---

### PATCH `/auth/me`
- **기능 ID**: AUTH-004
- **설명**: 내 프로필 수정 (이름, 비밀번호)
- **인증 필요**: 있음

**요청 Body** (partial update)
```json
{
  "name": "string",
  "current_password": "string",
  "new_password": "string"
}
```

**응답 200** — 갱신된 프로필 반환

---

## 4. 사용자·권한 (spec/01_auth.md, spec/02_permission.md)

### GET `/users`
- **기능 ID**: PERM-001
- **설명**: 사용자 목록 조회
- **인증 필요**: admin only

**쿼리 파라미터**
| 파라미터 | 타입 | 설명 |
|----------|------|------|
| `role` | `admin \| user` | 역할 필터 |
| `status` | `pending \| active \| inactive \| locked` | 상태 필터 |
| `page` | int | 페이지 번호 |
| `per_page` | int | 페이지 크기 (기본 50) |

**응답 200**
```json
{
  "data": [
    {
      "id": "uuid",
      "name": "string",
      "email": "string",
      "employee_id": "string",
      "role": "user",
      "status": "active",
      "color": "#4A90D9"
    }
  ],
  "meta": { "total": 10, "page": 1, "per_page": 50 }
}
```

---

### GET `/users/executives`
- **기능 ID**: CAL-004, RAD-001
- **설명**: 임원(role=user) 목록 + 색상 (달력 체크박스, 레이더 참석자 선택용)
- **인증 필요**: 있음

**응답 200**
```json
{
  "data": [
    { "id": "uuid", "name": "string", "color": "#4A90D9" }
  ]
}
```
> `deleted_at IS NULL AND status = 'active' AND role = 'user'` 조건 적용. 페이지네이션 없음 (임원 수 소규모 전제).

---

### POST `/users/invite`
- **기능 ID**: AUTH-001
- **설명**: 신규 사용자 초대 (초대 메일 발송 + 레코드 생성)
- **인증 필요**: admin only

**요청 Body**
```json
{
  "name": "string",
  "email": "string",
  "employee_id": "string",
  "role": "admin | user",
  "color": "#RRGGBB"
}
```

**응답 201**
```json
{
  "data": { "id": "uuid", "name": "string", "email": "string", "status": "pending" }
}
```

**오류**
| 상태 | code | 설명 |
|------|------|------|
| 409 | `EMAIL_DUPLICATE` | 이메일 중복 |
| 409 | `EMPLOYEE_ID_DUPLICATE` | 사번 중복 |

---

### PATCH `/users/:id/role`
- **기능 ID**: PERM-001
- **설명**: 역할 변경
- **인증 필요**: admin only

**요청 Body**
```json
{ "role": "admin | user" }
```

**응답 200** — 갱신된 사용자 반환

---

### PATCH `/users/:id/status`
- **기능 ID**: PERM-001
- **설명**: 계정 활성화/비활성화
- **인증 필요**: admin only

**요청 Body**
```json
{ "status": "active | inactive" }
```

**응답 200** — 갱신된 사용자 반환

---

## 5. 대리 권한 (spec/02_permission.md)

### GET `/proxy-permissions`
- **기능 ID**: PERM-002
- **설명**: 대리 권한 목록 (활성 + 해제 포함)
- **인증 필요**: admin only

**쿼리 파라미터**
| 파라미터 | 타입 | 설명 |
|----------|------|------|
| `active` | `true \| false` | 활성 권한만 조회 (`revoked_at IS NULL`) |

**응답 200**
```json
{
  "data": [
    {
      "id": "uuid",
      "proxy_user": { "id": "uuid", "name": "string" },
      "target_user": { "id": "uuid", "name": "string" },
      "granted_by": { "id": "uuid", "name": "string" },
      "granted_at": "2026-05-01T09:00:00+09:00",
      "revoked_at": null
    }
  ]
}
```

---

### POST `/proxy-permissions`
- **기능 ID**: PERM-002
- **설명**: 대리 권한 부여
- **인증 필요**: admin only

**요청 Body**
```json
{
  "proxy_user_id": "uuid",
  "target_user_id": "uuid"
}
```

**응답 201**
```json
{ "data": { "id": "uuid", "proxy_user_id": "uuid", "target_user_id": "uuid" } }
```

**오류**
| 상태 | code | 설명 |
|------|------|------|
| 409 | `PERMISSION_DUPLICATE` | 이미 활성 권한 존재 |

---

### DELETE `/proxy-permissions/:id`
- **기능 ID**: PERM-002
- **설명**: 대리 권한 해제 (`revoked_at` 갱신)
- **인증 필요**: admin only

**응답 204** (본문 없음)

---

## 6. 일정 (spec/03_schedule.md, spec/07_common_schedule.md)

### GET `/schedules`
- **기능 ID**: LIS-001
- **설명**: 일정 목록 조회 (리스트 뷰용, 풀 응답)
- **인증 필요**: 있음

**쿼리 파라미터**
| 파라미터 | 타입 | 설명 |
|----------|------|------|
| `date_from` | `YYYY-MM-DD` | 기간 시작 (필수) |
| `date_to` | `YYYY-MM-DD` | 기간 종료 (필수) |
| `owner_ids` | `uuid,uuid,...` | 담당 임원 필터 (OR) |
| `type` | `personal \| common` | 일정 유형 필터 |
| `keyword` | string | 제목·장소 부분 일치 검색 |
| `mention_ref` | `contact:<uuid> \| company:<uuid>` | @멘션 필터 |
| `page` | int | 페이지 번호 |
| `per_page` | int | 페이지 크기 (기본 50) |

**응답 200**
```json
{
  "data": [
    {
      "id": "uuid",
      "type": "personal | common",
      "title": "string",
      "schedule_date": "2026-05-14",
      "time_slot": "morning | afternoon | evening | lunch | allday",
      "start_time": "09:00",
      "end_time": "10:00",
      "location": "string | null",
      "memo": "string | null",
      "owner": { "id": "uuid", "name": "string", "color": "#4A90D9" },
      "created_by": { "id": "uuid", "name": "string" },
      "on_behalf_of": { "id": "uuid", "name": "string" } ,
      "participants": [
        { "id": "uuid", "name": "string", "joined_at": "datetime" }
      ],
      "mentions": [
        { "reference_type": "contact | company", "reference_id": "uuid", "display_name": "string" }
      ],
      "created_at": "datetime",
      "updated_at": "datetime"
    }
  ],
  "meta": { "total": 120, "page": 1, "per_page": 50 }
}
```

---

### POST `/schedules`
- **기능 ID**: SCH-001, COM-001
- **설명**: 일정 등록 (개인 또는 공통)
- **인증 필요**: 있음
  - 대리 입력 시 `on_behalf_of_id` 포함, `proxy_permissions` 검증 후 처리

**요청 Body**
```json
{
  "type": "personal | common",
  "title": "string",
  "schedule_date": "2026-05-14",
  "time_slot": "morning",
  "start_time": "09:00",
  "end_time": "10:00",
  "location": "string | null",
  "memo": "string | null",
  "owner_id": "uuid",
  "on_behalf_of_id": "uuid | null",
  "notify_user_ids": ["uuid"],
  "participant_ids": ["uuid"],
  "mentions": [
    { "reference_type": "contact | company", "reference_id": "uuid" }
  ]
}
```

**응답 201** — 등록된 일정 전체 반환

**오류**
| 상태 | code | 설명 |
|------|------|------|
| 403 | `NO_PROXY_PERMISSION` | 대리 입력 권한 없음 |
| 400 | `INVALID_TIME_RANGE` | 종료 시간 ≤ 시작 시간 |

---

### GET `/schedules/:id`
- **기능 ID**: SCH-005
- **설명**: 일정 상세 조회
- **인증 필요**: 있음

**응답 200** — POST `/schedules` 응답과 동일 구조 + `audit_logs` 최근 5건 포함

```json
{
  "data": {
    "...일정 필드...",
    "recent_audit_logs": [
      {
        "id": "uuid",
        "action": "created | updated | deleted",
        "actor": { "id": "uuid", "name": "string" },
        "on_behalf_of": { "id": "uuid", "name": "string" } ,
        "before_data": {},
        "after_data": {},
        "created_at": "datetime"
      }
    ]
  }
}
```

---

### PATCH `/schedules/:id`
- **기능 ID**: SCH-002, SCH-003
- **설명**: 일정 수정 (partial update)
- **인증 필요**: 있음
  - 본인 일정 또는 admin 또는 대리 권한 보유자

**요청 Body** — 변경할 필드만 포함
```json
{
  "title": "string",
  "schedule_date": "2026-05-15",
  "time_slot": "afternoon",
  "start_time": "14:00",
  "end_time": "15:30",
  "location": "string | null",
  "memo": "string | null",
  "participant_ids": ["uuid"],
  "mentions": [
    { "reference_type": "contact", "reference_id": "uuid" }
  ]
}
```

**응답 200** — 갱신된 일정 전체 반환

**부수 효과**
- `audit_logs`에 변경 이력 기록 (before_data / after_data)
- 타인의 일정 수정 시 NOT-003 알림 발송
- 공통 일정 수정 시 NOT-002 알림 발송

---

### DELETE `/schedules/:id`
- **기능 ID**: SCH-004
- **설명**: 일정 삭제 (soft delete)
- **인증 필요**: 있음
  - 본인 일정 또는 admin

**응답 204** (본문 없음)

**부수 효과**
- `deleted_at`, `deleted_by` 갱신
- `schedule_participants`, `mentions` cascade soft delete
- `audit_logs`에 삭제 이력 기록

---

## 7. 공통 일정 참가자 (spec/07_common_schedule.md)

### POST `/schedules/:id/participants`
- **기능 ID**: COM-002, COM-003
- **설명**: 공통 일정 참가 (본인을 참가자 목록에 추가)
- **인증 필요**: 있음

**요청 Body**
```json
{ "user_id": "uuid" }
```
> `user_id`는 본인 ID와 동일해야 함 (서버에서 검증). admin은 타인 추가 가능.

**응답 201**
```json
{
  "data": {
    "id": "uuid",
    "schedule_id": "uuid",
    "user_id": "uuid",
    "status": "joined",
    "joined_at": "datetime"
  }
}
```

**오류**
| 상태 | code | 설명 |
|------|------|------|
| 409 | `ALREADY_PARTICIPANT` | 이미 참가 중 |
| 404 | `SCHEDULE_NOT_FOUND` | 일정 없음 또는 공통 일정 아님 |

---

### DELETE `/schedules/:id/participants/me`
- **기능 ID**: COM-002 (참가 취소)
- **설명**: 공통 일정 참가 취소 (`status = cancelled` 갱신)
- **인증 필요**: 있음

**응답 204** (본문 없음)

---

## 8. 달력 전용 조회 (spec/05_calendar_view.md)

### GET `/calendar`
- **기능 ID**: CAL-001, CAL-002, CAL-003
- **설명**: 기간별 일정 + 공휴일 통합 조회 (달력 렌더링용 경량 응답)
- **인증 필요**: 있음

**쿼리 파라미터**
| 파라미터 | 타입 | 필수 | 설명 |
|----------|------|------|------|
| `start` | `YYYY-MM-DD` | Y | 기간 시작 |
| `end` | `YYYY-MM-DD` | Y | 기간 종료 |
| `owner_ids` | `uuid,...` | N | 임원 필터 (미입력 시 전체) |

**응답 200**
```json
{
  "data": {
    "schedules": [
      {
        "id": "uuid",
        "type": "personal | common",
        "title": "string",
        "schedule_date": "2026-05-14",
        "time_slot": "morning",
        "start_time": "09:00",
        "end_time": "10:00",
        "owner": { "id": "uuid", "name": "string", "color": "#4A90D9" }
      }
    ],
    "holidays": [
      {
        "id": "uuid",
        "holiday_date": "2026-05-05",
        "name": "어린이날",
        "type": "statutory"
      }
    ]
  }
}
```

> **달력 vs 리스트 응답 차이**: `/calendar`는 렌더링에 필요한 최소 필드만 반환 (mentions, memo, audit_logs 제외). 상세 조회는 `GET /schedules/:id` 사용.

---

### GET `/calendar/day/:date`
- **기능 ID**: CAL-007
- **설명**: 특정 날짜 일 상세 (일 상세 패널용)
- **인증 필요**: 있음
- **파라미터**: `:date` = `YYYY-MM-DD`

**쿼리 파라미터**
| 파라미터 | 타입 | 설명 |
|----------|------|------|
| `owner_ids` | `uuid,...` | 임원 필터 |

**응답 200**
```json
{
  "data": {
    "date": "2026-05-14",
    "holiday": { "name": "string", "type": "statutory" },
    "schedules": [
      {
        "id": "uuid",
        "title": "string",
        "time_slot": "morning",
        "start_time": "09:00",
        "end_time": "10:00",
        "location": "string | null",
        "owner": { "id": "uuid", "name": "string", "color": "#4A90D9" },
        "type": "personal | common"
      }
    ]
  }
}
```

---

## 9. 공휴일 (spec/08_holiday.md)

### GET `/holidays`
- **기능 ID**: HOL-002, HOL-004
- **설명**: 공휴일 목록 조회
- **인증 필요**: 있음

**쿼리 파라미터**
| 파라미터 | 타입 | 설명 |
|----------|------|------|
| `year` | int | 연도 (기본: 현재 연도) |
| `type` | `statutory \| substitute \| temporary` | 유형 필터 |

**응답 200**
```json
{
  "data": [
    {
      "id": "uuid",
      "holiday_date": "2026-05-05",
      "name": "어린이날",
      "type": "statutory",
      "year": 2026,
      "is_active": true
    }
  ]
}
```

---

### POST `/holidays`
- **기능 ID**: HOL-002 (임시 공휴일 수동 등록)
- **설명**: 임시 공휴일 수동 등록
- **인증 필요**: admin only

**요청 Body**
```json
{
  "holiday_date": "2026-08-17",
  "name": "임시 공휴일",
  "type": "temporary"
}
```

**응답 201** — 등록된 공휴일 반환

**오류**
| 상태 | code | 설명 |
|------|------|------|
| 409 | `HOLIDAY_DATE_DUPLICATE` | 동일 날짜 공휴일 이미 존재 |

---

### DELETE `/holidays/:id`
- **기능 ID**: HOL-003
- **설명**: 공휴일 삭제 (임시 공휴일만, soft delete)
- **인증 필요**: admin only

**응답 204** (본문 없음)

**오류**
| 상태 | code | 설명 |
|------|------|------|
| 403 | `CANNOT_DELETE_STATUTORY` | 법정/대체 공휴일은 삭제 불가 |

---

### POST `/holidays/batch`
- **기능 ID**: HOL-001
- **설명**: 법정·대체 공휴일 일괄 등록 배치 트리거
- **인증 필요**: admin only

**요청 Body**
```json
{ "year": 2027 }
```

**응답 200**
```json
{
  "data": { "inserted": 19, "year": 2027 }
}
```

---

## 10. 모임 레이더 (spec/09_meeting_radar.md)

### POST `/radar/availability`
- **기능 ID**: RAD-002
- **설명**: 임원 일정 충돌 계산 (시간 슬롯별 가용성 반환)
- **인증 필요**: 있음

**요청 Body**
```json
{
  "owner_ids": ["uuid", "uuid"],
  "date_from": "2026-05-14",
  "date_to": "2026-05-20",
  "slot_minutes": 60
}
```

> `date_to - date_from` 최대 30일. `slot_minutes` 기본값 60.

**응답 200**
```json
{
  "data": {
    "slots": [
      {
        "date": "2026-05-14",
        "start_time": "09:00",
        "end_time": "10:00",
        "status": "AVAILABLE | PARTIAL | UNAVAILABLE",
        "available_count": 3,
        "total_count": 3,
        "conflicted_users": [
          { "id": "uuid", "name": "string" }
        ]
      }
    ]
  }
}
```

> - `AVAILABLE`: `conflicted_users` 길이 = 0
> - `PARTIAL`: 0 < `conflicted_users` 길이 < `total_count`
> - `UNAVAILABLE`: `conflicted_users` 길이 = `total_count`
> - 업무 시간(09:00~18:00) 평일만 포함

---

## 11. 관계 히스토리 (spec/10_relationship_history.md)

### GET `/relationships`
- **기능 ID**: REL-001, REL-002, REL-003
- **설명**: @회사/@사람 태그 클릭 시 미팅 이력 집계 조회
- **인증 필요**: 있음

**쿼리 파라미터**
| 파라미터 | 타입 | 필수 | 설명 |
|----------|------|------|------|
| `reference_type` | `contact \| company` | Y | 대상 유형 |
| `reference_id` | `uuid` | Y | contacts 또는 companies의 id |
| `limit` | int | N | 미팅 목록 최대 건수 (기본 10) |

**응답 200**
```json
{
  "data": {
    "entity_type": "contact | company",
    "entity_name": "삼성전자",
    "total_count": 12,
    "last_meeting_date": "2026-04-30",
    "last_executive": "홍길동",
    "meetings": [
      {
        "schedule_id": "uuid",
        "date": "2026-04-30",
        "executive_name": "홍길동",
        "location": "본사 회의실 | null",
        "title": "string"
      }
    ]
  }
}
```

---

## 12. 연락처·회사·@멘션 자동완성 (spec/04_mention_contact.md)

### GET `/contacts`
- **기능 ID**: CON-001
- **설명**: 연락처 목록 조회
- **인증 필요**: 있음

**쿼리 파라미터**
| 파라미터 | 타입 | 설명 |
|----------|------|------|
| `q` | string | 이름 부분 일치 검색 |
| `company_id` | uuid | 회사 필터 |
| `status` | `auto \| confirmed` | 등록 상태 필터 |
| `page` / `per_page` | int | 페이지네이션 |

**응답 200**
```json
{
  "data": [
    {
      "id": "uuid",
      "name": "string",
      "title": "string | null",
      "email": "string | null",
      "phone": "string | null",
      "company": { "id": "uuid", "name": "string" },
      "status": "auto | confirmed",
      "is_auto_registered": false
    }
  ],
  "meta": { "total": 30, "page": 1, "per_page": 50 }
}
```

---

### POST `/contacts`
- **기능 ID**: CON-001
- **설명**: 연락처 등록 (admin only)
- **인증 필요**: admin only

**요청 Body**
```json
{
  "name": "string",
  "company_id": "uuid | null",
  "title": "string | null",
  "email": "string | null",
  "phone": "string | null"
}
```

**응답 201** — 등록된 연락처 반환

---

### PATCH `/contacts/:id`
- **기능 ID**: CON-002
- **설명**: 연락처 수정 (admin only)
- **인증 필요**: admin only

**요청 Body** — 변경할 필드만 포함

**응답 200** — 갱신된 연락처 반환

---

### DELETE `/contacts/:id`
- **기능 ID**: CON-003
- **설명**: 연락처 삭제 (soft delete, admin only)
- **인증 필요**: admin only

**응답 204** (본문 없음)

**오류**
| 상태 | code | 설명 |
|------|------|------|
| 409 | `HAS_ACTIVE_MENTIONS` | 활성 일정에 멘션 참조 있음 (경고 후 삭제 가능) |

---

### GET `/companies`
- **기능 ID**: CON-005
- **설명**: 회사 목록 조회
- **인증 필요**: 있음

**쿼리 파라미터**
| 파라미터 | 타입 | 설명 |
|----------|------|------|
| `q` | string | 이름·별칭 검색 |
| `page` / `per_page` | int | 페이지네이션 |

**응답 200**
```json
{
  "data": [
    {
      "id": "uuid",
      "name": "삼성전자",
      "aliases": ["Samsung", "삼성"],
      "is_auto_registered": false
    }
  ]
}
```

---

### POST `/companies`
- **기능 ID**: CON-005
- **설명**: 회사 등록 (admin only)
- **인증 필요**: admin only

**요청 Body**
```json
{
  "name": "string",
  "aliases": ["string"]
}
```

**응답 201** — 등록된 회사 반환

**오류**
| 상태 | code | 설명 |
|------|------|------|
| 409 | `COMPANY_NAME_DUPLICATE` | 회사명 또는 별칭 중복 |

---

### PATCH `/companies/:id`
- **기능 ID**: CON-005
- **설명**: 회사 수정 (이름, 별칭, admin only)
- **인증 필요**: admin only

**요청 Body**
```json
{
  "name": "string",
  "aliases": ["string"]
}
```

**응답 200** — 갱신된 회사 반환

---

### DELETE `/companies/:id`
- **기능 ID**: CON-005
- **설명**: 회사 삭제 (soft delete, admin only). 연결된 contacts의 `company_id`는 NULL로 갱신 (SET NULL).
- **인증 필요**: admin only

**응답 204** (본문 없음)

---

### GET `/mentions/autocomplete`
- **기능 ID**: MEN-001
- **설명**: @멘션 자동완성 (일정 입력 폼에서 `@` 입력 시 호출)
- **인증 필요**: 있음

**쿼리 파라미터**
| 파라미터 | 타입 | 필수 | 설명 |
|----------|------|------|------|
| `q` | string | Y | 검색어 (최소 1자) |
| `type` | `contact \| company \| all` | N | 검색 대상 (기본 `all`) |
| `limit` | int | N | 최대 결과 수 (기본 10) |

**응답 200**
```json
{
  "data": [
    {
      "reference_type": "contact | company",
      "reference_id": "uuid",
      "display_name": "홍길동 (삼성전자) | 삼성전자"
    }
  ]
}
```

> `contacts.name`, `companies.name`, `companies.aliases`(GIN 인덱스) 대상 ILIKE 검색. P95 ≤ 500ms 목표.

---

## 13. 알림 (spec/11_notification.md)

### GET `/notifications`
- **기능 ID**: NOT-001 (수신자 뷰)
- **설명**: 내 알림 목록 조회
- **인증 필요**: 있음

**쿼리 파라미터**
| 파라미터 | 타입 | 설명 |
|----------|------|------|
| `status` | `unread \| all` | 미확인(`read_at IS NULL`)만 또는 전체 |
| `page` / `per_page` | int | 페이지네이션 |

**응답 200**
```json
{
  "data": [
    {
      "id": "uuid",
      "event_type": "common_schedule_created | common_schedule_updated | schedule_updated_by_other | invite | password_reset",
      "target_type": "schedule | user | null",
      "target_id": "uuid | null",
      "status": "sent",
      "read_at": "datetime | null",
      "created_at": "datetime",
      "payload": {
        "title": "string",
        "schedule_date": "2026-05-14"
      }
    }
  ],
  "meta": {
    "total": 15,
    "unread_count": 3
  }
}
```

---

### PATCH `/notifications/:id/read`
- **기능 ID**: NOT-002
- **설명**: 알림 읽음 처리 (`read_at` 갱신)
- **인증 필요**: 있음 (본인 알림만)

**응답 200**
```json
{ "data": { "id": "uuid", "read_at": "datetime" } }
```

---

### PATCH `/notifications/read-all`
- **기능 ID**: NOT-003
- **설명**: 내 전체 알림 읽음 처리
- **인증 필요**: 있음

**응답 200**
```json
{ "data": { "updated_count": 5 } }
```

---

### GET `/admin/notification-logs`
- **기능 ID**: NOT-006
- **설명**: 알림 발송 이력 전체 조회 (관리자 모니터링)
- **인증 필요**: admin only

**쿼리 파라미터**
| 파라미터 | 타입 | 설명 |
|----------|------|------|
| `status` | `pending \| retrying \| sent \| failed \| skipped` | 상태 필터 |
| `event_type` | string | 이벤트 유형 필터 |
| `date_from` | `YYYY-MM-DD` | 기간 필터 시작 |
| `date_to` | `YYYY-MM-DD` | 기간 필터 종료 |
| `page` / `per_page` | int | 페이지네이션 |

**응답 200**
```json
{
  "data": {
    "summary": {
      "failed_count": 2,
      "pending_count": 0,
      "retrying_count": 1
    },
    "logs": [
      {
        "id": "uuid",
        "event_type": "string",
        "recipient": { "id": "uuid", "name": "string", "email": "string" },
        "status": "sent | failed | ...",
        "attempt_count": 3,
        "last_attempted_at": "datetime",
        "sent_at": "datetime | null",
        "error_message": "string | null",
        "created_at": "datetime"
      }
    ]
  },
  "meta": { "total": 50, "page": 1, "per_page": 50 }
}
```

> `summary.failed_count`는 관리자 화면 상단 `❗실패 n건` 배지 렌더링에 사용.

---

## 14. 감사 로그 (spec/12_audit_log.md)

### GET `/audit-logs`
- **기능 ID**: AUD-001
- **설명**: 일정 이력 타임라인 조회 (불변 로그)
- **인증 필요**: 있음

**쿼리 파라미터**
| 파라미터 | 타입 | 필수 | 설명 |
|----------|------|------|------|
| `target_type` | `schedule \| contact \| company \| proxy_permission \| holiday` | Y | 대상 유형 |
| `target_id` | `uuid` | Y | 대상 ID |
| `page` / `per_page` | int | N | 페이지네이션 |

**응답 200**
```json
{
  "data": [
    {
      "id": "uuid",
      "target_type": "schedule",
      "target_id": "uuid",
      "action": "created | updated | deleted",
      "actor": { "id": "uuid", "name": "string" },
      "on_behalf_of": { "id": "uuid", "name": "string" },
      "before_data": {},
      "after_data": {},
      "created_at": "datetime"
    }
  ],
  "meta": { "total": 5 }
}
```

---

## 15. 내보내기 (spec/13_export_responsive.md)

### POST `/export/schedules`
- **기능 ID**: EXP-001
- **설명**: 일정 엑셀 다운로드용 데이터 반환 (클라이언트에서 xlsx 파일 생성)
- **인증 필요**: 있음

**요청 Body**
```json
{
  "date_from": "2026-01-01",
  "date_to": "2026-12-31",
  "owner_ids": ["uuid"],
  "type": "personal | common | null",
  "keyword": "string | null"
}
```

> `date_to - date_from` 최대 365일.

**응답 200**
```json
{
  "data": [
    {
      "date": "2026-05-14",
      "start_time": "09:00",
      "end_time": "10:00",
      "type": "personal",
      "title": "string",
      "executive": "홍길동",
      "location": "string | null",
      "company": "string | null",
      "contact": "string | null",
      "memo": "string | null",
      "created_by": "string",
      "created_at": "2026-05-01 09:00"
    }
  ],
  "meta": { "total": 250 }
}
```

> 응답 데이터를 클라이언트에서 `xlsx` 형식으로 변환. 13개 컬럼은 `proc_10_export.md` 컬럼 정의 기준.

---

## 16. 에러 코드 목록

| code | HTTP | 설명 |
|------|------|------|
| `INVALID_CREDENTIALS` | 401 | 로그인 정보 불일치 |
| `ACCOUNT_LOCKED` | 403 | 계정 잠금 |
| `ACCOUNT_INACTIVE` | 403 | 비활성 계정 |
| `TOKEN_EXPIRED` | 400 | 토큰/링크 만료 |
| `TOKEN_INVALID` | 400 | 잘못된 토큰 |
| `NO_PROXY_PERMISSION` | 403 | 대리 입력 권한 없음 |
| `INVALID_TIME_RANGE` | 400 | 시간 범위 오류 |
| `EMAIL_DUPLICATE` | 409 | 이메일 중복 |
| `EMPLOYEE_ID_DUPLICATE` | 409 | 사번 중복 |
| `PERMISSION_DUPLICATE` | 409 | 대리 권한 중복 |
| `HOLIDAY_DATE_DUPLICATE` | 409 | 공휴일 날짜 중복 |
| `CANNOT_DELETE_STATUTORY` | 403 | 법정/대체 공휴일 삭제 불가 |
| `ALREADY_PARTICIPANT` | 409 | 이미 참가 중 |
| `SCHEDULE_NOT_FOUND` | 404 | 일정 없음 |
| `HAS_ACTIVE_MENTIONS` | 409 | 활성 멘션 참조 있음 |
| `COMPANY_NAME_DUPLICATE` | 409 | 회사명·별칭 중복 |
| `DATE_RANGE_TOO_LARGE` | 400 | 날짜 범위 초과 (레이더 30일, 내보내기 1년) |
| `FORBIDDEN` | 403 | 권한 없음 (일반) |
| `NOT_FOUND` | 404 | 리소스 없음 (일반) |
| `INTERNAL_ERROR` | 500 | 서버 오류 |
