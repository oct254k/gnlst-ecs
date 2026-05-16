---
title: 기능명세서 - Supabase 구현 레이어 설계
version: "1.0"
date: 2026-05-14
category: spec
---

# 15. Supabase 구현 레이어 설계

**관련 문서**: `spec/14_api.md`, `erd/erd.md`

opusplan은 **Vercel(Next.js App Router) + Supabase** 단독으로 운영한다. 별도 백엔드 서버는 없으며, `14_api.md`에서 정의한 36개 엔드포인트를 아래 4개 레이어로 분산 구현한다.

---

## 1. 구현 레이어 정의

| 레이어 | 코드 | 위치 | 역할 |
|--------|------|------|------|
| Supabase Client 직접 호출 | **A** | Next.js Server Component / Server Action | RLS로 권한 제어 가능한 단순 CRUD. Route Handler 불필요 |
| Next.js Route Handler | **B** | `app/api/*/route.ts` (Vercel 실행) | 복잡한 트랜잭션, Service Role 키 필요, 연산 집약 |
| Supabase Edge Function | **C** | `supabase/functions/*/index.ts` (Deno 런타임) | DB 이벤트 웹훅(알림 발송), 배치(공휴일 upsert), Cron |
| PostgreSQL 함수/트리거 | **D** | `supabase/migrations/*.sql` | audit_log 자동 기록, 집계 쿼리, cascade soft-delete |

### 레이어 선택 기준

```
단순 SELECT/INSERT/UPDATE → A (RLS로 충분)
  └─ Admin API 필요 or 멀티테이블 트랜잭션 → B
       └─ DB 이벤트 반응 or 배치/Cron → C
            └─ DB 내부 집계·자동화 → D
```

---

## 2. 엔드포인트 → 레이어 매핑 (36개)

### 2-1. 인증

| 엔드포인트 | 레이어 | 구현 근거 |
|-----------|--------|----------|
| POST `/auth/login` | **B** | `signInWithPassword` + `failed_login_count`/`locked_until` 체크 로직 필요 |
| POST `/auth/logout` | **A** (Server Action) | `supabase.auth.signOut()` |
| POST `/auth/password/forgot` | **B** | Admin API `resetPasswordForEmail` — Service Role 필요 |
| POST `/auth/password/reset` | **B** | Admin API `updateUser` — Service Role 필요 |
| POST `/auth/invite/accept` | **B** | `verifyOtp` → `updateUser` — Admin API |
| GET `/auth/me` | **A** (Server Component) | `auth.getUser()` — RLS 자동 |
| PATCH `/auth/me` | **B** | 비밀번호 변경은 Admin API, 이름 변경은 `users` UPDATE |

### 2-2. 사용자·권한

| 엔드포인트 | 레이어 | 구현 근거 |
|-----------|--------|----------|
| GET `/users` | **A** | RLS admin policy로 충분 |
| GET `/users/executives` | **A** | `role='user' AND status='active'` 단순 SELECT |
| POST `/users/invite` | **B** | `auth.admin.inviteUserByEmail` + `users` INSERT + metadata 설정 |
| PATCH `/users/:id/role` | **B** | `auth.admin.updateUserById` (JWT claims 갱신) + `users` UPDATE |
| PATCH `/users/:id/status` | **B** | `users` UPDATE (Service Role) |
| GET `/proxy-permissions` | **A** | RLS admin policy |
| POST `/proxy-permissions` | **A** (Server Action) | 단순 INSERT + 중복 검사 (`revoked_at IS NULL`) |
| DELETE `/proxy-permissions/:id` | **A** (Server Action) | `revoked_at = now()` UPDATE |

### 2-3. 일정

| 엔드포인트 | 레이어 | 구현 근거 |
|-----------|--------|----------|
| GET `/schedules` | **A** | 복잡 필터지만 Supabase client `.filter()` 체이닝으로 처리 |
| POST `/schedules` | **B** | 트랜잭션: `schedules` INSERT → `participants` INSERT → `mentions` INSERT → `notification_logs` INSERT (알림 C 트리거용) |
| GET `/schedules/:id` | **A** | RLS + `.select()` JOIN |
| PATCH `/schedules/:id` | **B** | UPDATE + 알림 INSERT → audit_log는 D 트리거가 자동 기록 |
| DELETE `/schedules/:id` | **B** | `deleted_at = now()` UPDATE → D 트리거가 cascade + audit_log 처리 |
| POST `/schedules/:id/participants` | **A** (Server Action) | 단순 INSERT (`schedule_participants`) |
| DELETE `/schedules/:id/participants/me` | **A** (Server Action) | `status = 'cancelled'` UPDATE |

### 2-4. 달력·공휴일

| 엔드포인트 | 레이어 | 구현 근거 |
|-----------|--------|----------|
| GET `/calendar` | **A** | `schedules` + `holidays` 경량 SELECT, RLS |
| GET `/calendar/day/:date` | **A** | 단일 날짜 SELECT |
| GET `/holidays` | **A** | 단순 SELECT |
| POST `/holidays` | **A** (Server Action) | admin RLS + INSERT |
| DELETE `/holidays/:id` | **A** (Server Action) | admin RLS + `deleted_at` UPDATE |
| POST `/holidays/batch` | **B → C** | Route Handler가 Edge Function `holiday-batch` HTTP 호출 |

### 2-5. 분석·협업

| 엔드포인트 | 레이어 | 구현 근거 |
|-----------|--------|----------|
| POST `/radar/availability` | **D → B** | PostgreSQL 함수 `fn_radar_availability()` → Route Handler가 `.rpc()` 호출 |
| GET `/relationships` | **D → A** | PostgreSQL 함수 `fn_relationship_summary()` → Server Component가 `.rpc()` 호출 |

### 2-6. 연락처·회사·멘션

| 엔드포인트 | 레이어 | 구현 근거 |
|-----------|--------|----------|
| GET `/contacts` | **A** | RLS (전체 인증 사용자 읽기) |
| POST `/contacts` | **A** (Server Action) | admin RLS |
| PATCH `/contacts/:id` | **A** (Server Action) | admin RLS |
| DELETE `/contacts/:id` | **A** (Server Action) | admin RLS + `deleted_at` UPDATE |
| GET `/companies` | **A** | RLS (전체 인증 사용자 읽기) |
| POST `/companies` | **A** (Server Action) | admin RLS |
| PATCH `/companies/:id` | **A** (Server Action) | admin RLS |
| DELETE `/companies/:id` | **A** (Server Action) | admin RLS + `deleted_at` UPDATE (contacts.company_id SET NULL은 FK ON DELETE SET NULL) |
| GET `/mentions/autocomplete` | **A** | `contacts.name`/`companies.name`/`companies.aliases` GIN 인덱스 ILIKE |

### 2-7. 알림·감사·내보내기

| 엔드포인트 | 레이어 | 구현 근거 |
|-----------|--------|----------|
| GET `/notifications` | **A** | RLS: `recipient_id = auth.uid()` |
| PATCH `/notifications/:id/read` | **A** (Server Action) | `read_at = now()` UPDATE |
| PATCH `/notifications/read-all` | **A** (Server Action) | bulk UPDATE WHERE `recipient_id = auth.uid() AND read_at IS NULL` |
| GET `/admin/notification-logs` | **A** | admin RLS |
| GET `/audit-logs` | **A** | RLS |
| POST `/export/schedules` | **B** | 최대 1년 데이터 집계 (Service Role로 RLS 우회 허용) |

---

## 3. B — Next.js Route Handlers

파일 위치 기준: `app/api/`

### 파일 목록

| 파일 | 메서드 | 엔드포인트 | 핵심 처리 |
|------|--------|-----------|----------|
| `auth/login/route.ts` | POST | `/auth/login` | `signInWithPassword` + 잠금 체크 (`failed_login_count`, `locked_until`) |
| `auth/password/forgot/route.ts` | POST | `/auth/password/forgot` | `resetPasswordForEmail` (이메일 존재 여부 노출 차단) |
| `auth/password/reset/route.ts` | POST | `/auth/password/reset` | Admin `updateUser({ password })` |
| `auth/invite/accept/route.ts` | POST | `/auth/invite/accept` | `verifyOtp` → Admin `updateUser({ password })` |
| `auth/me/route.ts` | PATCH | `/auth/me` | Admin `updateUser` (비밀번호) + `users` UPDATE (이름) |
| `users/invite/route.ts` | POST | `/users/invite` | Admin `inviteUserByEmail` + `users` INSERT + JWT metadata 설정 |
| `users/[id]/role/route.ts` | PATCH | `/users/:id/role` | Admin `updateUserById` (JWT claims) + `users` UPDATE |
| `users/[id]/status/route.ts` | PATCH | `/users/:id/status` | `users` UPDATE (Service Role) |
| `schedules/route.ts` | POST | `/schedules` | 트랜잭션: schedules + participants + mentions INSERT + notification_logs INSERT |
| `schedules/[id]/route.ts` | PATCH | `/schedules/:id` | UPDATE + notification_logs INSERT |
| `schedules/[id]/route.ts` | DELETE | `/schedules/:id` | `deleted_at` UPDATE (D 트리거가 cascade 처리) |
| `radar/availability/route.ts` | POST | `/radar/availability` | `.rpc('fn_radar_availability', {...})` |
| `holidays/batch/route.ts` | POST | `/holidays/batch` | Edge Function `holiday-batch` HTTP 호출 (`fetch`) |
| `export/schedules/route.ts` | POST | `/export/schedules` | Service Role client로 대용량 SELECT, JSON 반환 |

### 공통 패턴

```typescript
// app/api/_lib/supabase-server.ts
import { createClient } from '@supabase/supabase-js'

// 일반 요청용 (RLS 적용)
export function createUserClient(cookieStore: ReadonlyRequestCookies) {
  return createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, { cookies: ... })
}

// Admin 작업용 (RLS 우회, Service Role)
export function createAdminClient() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
}
```

### 환경 변수 목록

| 변수명 | 설명 |
|--------|------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase 프로젝트 URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | anon (public) 키 |
| `SUPABASE_SERVICE_ROLE_KEY` | Service Role 키 (서버 전용, 클라이언트 노출 금지) |

---

## 4. C — Supabase Edge Functions

파일 위치: `supabase/functions/`

### 4-1. `send-notification`

| 항목 | 내용 |
|------|------|
| **트리거** | Supabase DB Webhook — `notification_logs` INSERT (status=`pending`) |
| **런타임** | Deno (Supabase Edge Function 기본) |
| **역할** | 이메일 발송 서비스(Resend) 호출 → 발송 결과에 따라 `status`, `sent_at`, `attempt_count` 갱신 |
| **환경 변수** | `RESEND_API_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_URL` |

**처리 흐름**
```
DB Webhook → send-notification 함수 실행
  → notification_logs WHERE id = :id AND status = 'pending' 조회
  → payload에서 메일 본문 구성
  → Resend API 호출
  → 성공: status = 'sent', sent_at = now()
  → 실패: attempt_count += 1
    → attempt_count < 3: status = 'retrying', next_retry_at = now() + backoff
    → attempt_count >= 3: status = 'failed', error_message = 사유
```

**지수 백오프 간격**
| 재시도 | 대기 |
|--------|------|
| 1회 | 1분 |
| 2회 | 5분 |
| 3회 | 15분 |

---

### 4-2. `retry-notification`

| 항목 | 내용 |
|------|------|
| **트리거** | Supabase Cron — 매 1분 실행 |
| **역할** | `status='retrying' AND next_retry_at <= now()` 건 조회 → `send-notification` 동일 로직으로 재발송 |
| **환경 변수** | `RESEND_API_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_URL` |

---

### 4-3. `holiday-batch`

| 항목 | 내용 |
|------|------|
| **트리거** | HTTP 호출 — `app/api/holidays/batch/route.ts`에서 `fetch` |
| **역할** | 공공 API(data.go.kr 특일 정보 API) 조회 → `holidays` 테이블 upsert (`statutory`, `substitute`) |
| **환경 변수** | `HOLIDAY_API_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_URL` |

**처리 흐름**
```
Route Handler POST /holidays/batch { year }
  → Edge Function HTTP 호출
  → 공공 API GET /B090041/openapi/service/SpcdeInfoService/getRestDeInfo?year=:year
  → 응답 파싱 (법정공휴일/대체공휴일 분류)
  → holidays UPSERT ON CONFLICT (holiday_date) DO UPDATE
  → { inserted: n, year } 반환
```

---

## 5. D — PostgreSQL 함수/트리거

마이그레이션 파일 위치: `supabase/migrations/`

### 5-1. `fn_audit_log()` + 트리거 (5개 테이블)

**역할**: INSERT/UPDATE/DELETE 발생 시 `audit_logs`에 자동으로 변경 이력 기록.

```sql
-- supabase/migrations/003_audit_trigger.sql

CREATE OR REPLACE FUNCTION fn_audit_log()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO audit_logs (
    target_type, target_id, action,
    actor_id, on_behalf_of_id,
    before_data, after_data
  ) VALUES (
    TG_TABLE_NAME,
    COALESCE(NEW.id, OLD.id),
    CASE TG_OP WHEN 'INSERT' THEN 'created' WHEN 'UPDATE' THEN 'updated' ELSE 'deleted' END,
    auth.uid(),
    NULL,   -- Route Handler에서 on_behalf_of_id 별도 주입 필요 시 app_settings 활용
    CASE TG_OP WHEN 'INSERT' THEN NULL ELSE to_jsonb(OLD) END,
    CASE TG_OP WHEN 'DELETE' THEN NULL ELSE to_jsonb(NEW) END
  );
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- 5개 테이블에 트리거 생성
CREATE TRIGGER trg_audit_schedules
  AFTER INSERT OR UPDATE OR DELETE ON schedules
  FOR EACH ROW EXECUTE FUNCTION fn_audit_log();

CREATE TRIGGER trg_audit_contacts
  AFTER INSERT OR UPDATE OR DELETE ON contacts
  FOR EACH ROW EXECUTE FUNCTION fn_audit_log();

CREATE TRIGGER trg_audit_companies
  AFTER INSERT OR UPDATE OR DELETE ON companies
  FOR EACH ROW EXECUTE FUNCTION fn_audit_log();

CREATE TRIGGER trg_audit_proxy_permissions
  AFTER INSERT OR UPDATE OR DELETE ON proxy_permissions
  FOR EACH ROW EXECUTE FUNCTION fn_audit_log();

CREATE TRIGGER trg_audit_holidays
  AFTER INSERT OR UPDATE OR DELETE ON holidays
  FOR EACH ROW EXECUTE FUNCTION fn_audit_log();
```

> `on_behalf_of_id`: 대리 입력 상황에서 Route Handler가 `SET LOCAL app.on_behalf_of_id = ':uuid'` 를 트랜잭션 내에 실행하면, 함수에서 `current_setting('app.on_behalf_of_id', true)::uuid`로 읽는다.

---

### 5-2. `fn_soft_delete_cascade()` + 트리거

**역할**: `schedules.deleted_at`이 갱신되면 연결된 `schedule_participants`, `mentions`도 cascade soft-delete.

```sql
-- supabase/migrations/004_cascade_soft_delete.sql

CREATE OR REPLACE FUNCTION fn_soft_delete_cascade()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF NEW.deleted_at IS NOT NULL AND OLD.deleted_at IS NULL THEN
    UPDATE schedule_participants
      SET deleted_at = NEW.deleted_at, deleted_by = NEW.deleted_by
      WHERE schedule_id = NEW.id AND deleted_at IS NULL;

    UPDATE mentions
      SET deleted_at = NEW.deleted_at
      WHERE schedule_id = NEW.id AND deleted_at IS NULL;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_schedule_cascade_delete
  AFTER UPDATE OF deleted_at ON schedules
  FOR EACH ROW EXECUTE FUNCTION fn_soft_delete_cascade();
```

---

### 5-3. `fn_radar_availability()`

**역할**: 모임 레이더 충돌 계산. 업무 시간(09:00~18:00, 평일) 슬롯별 충돌 임원 집계.

```sql
-- supabase/migrations/005_radar_function.sql

CREATE OR REPLACE FUNCTION fn_radar_availability(
  p_owner_ids  uuid[],
  p_date_from  date,
  p_date_to    date,
  p_slot_min   int DEFAULT 60
)
RETURNS TABLE (
  slot_date        date,
  slot_start       time,
  slot_end         time,
  status           text,
  available_count  int,
  total_count      int,
  conflicted_ids   uuid[]
) LANGUAGE plpgsql STABLE AS $$
DECLARE
  v_total int := array_length(p_owner_ids, 1);
BEGIN
  RETURN QUERY
  WITH slots AS (
    SELECT
      d::date                              AS slot_date,
      (t * interval '1 minute')::time     AS slot_start,
      ((t + p_slot_min) * interval '1 minute')::time AS slot_end
    FROM generate_series(p_date_from, p_date_to, '1 day') d
    CROSS JOIN generate_series(9 * 60, 18 * 60 - p_slot_min, p_slot_min) t
    WHERE EXTRACT(DOW FROM d) BETWEEN 1 AND 5   -- 평일만
  ),
  conflicts AS (
    SELECT
      s.slot_date,
      s.slot_start,
      s.slot_end,
      array_agg(DISTINCT sc.owner_id) FILTER (WHERE sc.owner_id IS NOT NULL) AS conflicted_ids
    FROM slots s
    LEFT JOIN schedules sc
      ON sc.owner_id = ANY(p_owner_ids)
      AND sc.schedule_date = s.slot_date
      AND sc.deleted_at IS NULL
      AND sc.start_time IS NOT NULL
      AND sc.end_time IS NOT NULL
      AND sc.start_time < s.slot_end
      AND sc.end_time   > s.slot_start
    GROUP BY s.slot_date, s.slot_start, s.slot_end
  )
  SELECT
    c.slot_date,
    c.slot_start,
    c.slot_end,
    CASE
      WHEN array_length(c.conflicted_ids, 1) IS NULL         THEN 'AVAILABLE'
      WHEN array_length(c.conflicted_ids, 1) = v_total       THEN 'UNAVAILABLE'
      ELSE 'PARTIAL'
    END                                     AS status,
    v_total - COALESCE(array_length(c.conflicted_ids, 1), 0) AS available_count,
    v_total                                 AS total_count,
    COALESCE(c.conflicted_ids, '{}')        AS conflicted_ids
  FROM conflicts c
  ORDER BY c.slot_date, c.slot_start;
END;
$$;
```

**Route Handler 호출 예시**:
```typescript
// app/api/radar/availability/route.ts
const { data } = await supabase.rpc('fn_radar_availability', {
  p_owner_ids: ownerIds,
  p_date_from: dateFrom,
  p_date_to: dateTo,
  p_slot_min: slotMinutes,
})
```

---

### 5-4. `fn_relationship_summary()`

**역할**: @회사/@사람 태그의 미팅 이력 집계.

```sql
-- supabase/migrations/006_relationship_function.sql

CREATE OR REPLACE FUNCTION fn_relationship_summary(
  p_ref_type  text,   -- 'contact' | 'company'
  p_ref_id    uuid,
  p_limit     int DEFAULT 10
)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER AS $$
DECLARE
  v_result jsonb;
BEGIN
  SELECT jsonb_build_object(
    'entity_type',      p_ref_type,
    'entity_name',      CASE p_ref_type
                          WHEN 'contact' THEN (SELECT name FROM contacts WHERE id = p_ref_id)
                          ELSE               (SELECT name FROM companies WHERE id = p_ref_id)
                        END,
    'total_count',      COUNT(*),
    'last_meeting_date', MAX(s.schedule_date),
    'last_executive',   (
                          SELECT u.name FROM schedules s2
                          JOIN users u ON u.id = s2.owner_id
                          WHERE s2.id = (SELECT id FROM schedules WHERE schedule_date = MAX(s.schedule_date) LIMIT 1)
                        ),
    'meetings',         jsonb_agg(
                          jsonb_build_object(
                            'schedule_id', s.id,
                            'date',        s.schedule_date,
                            'executive_name', u.name,
                            'location',    s.location,
                            'title',       s.title
                          ) ORDER BY s.schedule_date DESC
                        ) FILTER (WHERE row_number() OVER (ORDER BY s.schedule_date DESC) <= p_limit)
  )
  INTO v_result
  FROM mentions m
  JOIN schedules s ON s.id = m.schedule_id AND s.deleted_at IS NULL
  JOIN users u ON u.id = s.owner_id
  WHERE m.reference_type = p_ref_type
    AND m.reference_id = p_ref_id
    AND m.deleted_at IS NULL;

  RETURN v_result;
END;
$$;
```

---

## 6. RLS 정책 정의

마이그레이션 파일: `supabase/migrations/002_rls_policies.sql`

> **role 판별**: `users` 테이블 JOIN 없이 `(auth.jwt()->'user_metadata'->>'role')` 사용. 초대(`/users/invite`) 시 Route Handler가 `auth.admin.updateUserById({ user_metadata: { role } })`로 JWT metadata에 role을 저장.

### `users`

```sql
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- SELECT: admin은 전체, user는 자신 + 활성 임원
CREATE POLICY users_select ON users FOR SELECT
  USING (
    (auth.jwt()->'user_metadata'->>'role') = 'admin'
    OR id = auth.uid()
    OR (role = 'user' AND status = 'active' AND deleted_at IS NULL)
  );

-- INSERT/UPDATE/DELETE: Service Role (Route Handler) 전용 — anon/user 차단
CREATE POLICY users_write ON users FOR ALL
  USING (false) WITH CHECK (false);
-- Route Handler는 SUPABASE_SERVICE_ROLE_KEY 사용으로 RLS 우회
```

---

### `schedules`

```sql
ALTER TABLE schedules ENABLE ROW LEVEL SECURITY;

-- SELECT: admin 전체, user는 자신 또는 공통 일정
CREATE POLICY schedules_select ON schedules FOR SELECT
  USING (
    deleted_at IS NULL AND (
      (auth.jwt()->'user_metadata'->>'role') = 'admin'
      OR owner_id = auth.uid()
      OR type = 'common'
    )
  );

-- INSERT: 인증된 사용자 전체 (담당자 선택은 앱 레이어)
CREATE POLICY schedules_insert ON schedules FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- UPDATE: 본인 또는 admin
CREATE POLICY schedules_update ON schedules FOR UPDATE
  USING (
    (auth.jwt()->'user_metadata'->>'role') = 'admin'
    OR owner_id = auth.uid()
  );

-- DELETE: 차단 (soft delete만 허용 — UPDATE로 처리)
CREATE POLICY schedules_delete ON schedules FOR DELETE USING (false);
```

---

### `schedule_participants`

```sql
ALTER TABLE schedule_participants ENABLE ROW LEVEL SECURITY;

-- SELECT: 연결된 schedule 접근 권한 상속
CREATE POLICY sp_select ON schedule_participants FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM schedules s
      WHERE s.id = schedule_id
        AND s.deleted_at IS NULL
        AND (
          (auth.jwt()->'user_metadata'->>'role') = 'admin'
          OR s.owner_id = auth.uid()
          OR s.type = 'common'
        )
    )
  );

-- INSERT: 본인 추가 또는 admin
CREATE POLICY sp_insert ON schedule_participants FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
    OR (auth.jwt()->'user_metadata'->>'role') = 'admin'
  );

-- UPDATE: 본인 또는 admin (status 변경용)
CREATE POLICY sp_update ON schedule_participants FOR UPDATE
  USING (
    user_id = auth.uid()
    OR (auth.jwt()->'user_metadata'->>'role') = 'admin'
  );
```

---

### `mentions`

```sql
ALTER TABLE mentions ENABLE ROW LEVEL SECURITY;

-- SELECT: 연결된 schedule 접근 권한 상속
CREATE POLICY mentions_select ON mentions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM schedules s
      WHERE s.id = schedule_id
        AND s.deleted_at IS NULL
        AND (
          (auth.jwt()->'user_metadata'->>'role') = 'admin'
          OR s.owner_id = auth.uid()
          OR s.type = 'common'
        )
    )
  );

-- INSERT/DELETE: schedule 쓰기 권한 보유자 (Route Handler에서 Service Role 사용)
CREATE POLICY mentions_write ON mentions FOR ALL USING (false) WITH CHECK (false);
```

---

### `proxy_permissions`

```sql
ALTER TABLE proxy_permissions ENABLE ROW LEVEL SECURITY;

-- SELECT: admin 전체, user는 자신이 proxy이거나 target인 행
CREATE POLICY proxy_select ON proxy_permissions FOR SELECT
  USING (
    (auth.jwt()->'user_metadata'->>'role') = 'admin'
    OR proxy_user_id = auth.uid()
    OR target_user_id = auth.uid()
  );

-- INSERT/UPDATE: 인증 사용자 (Server Action에서 처리, 추가 검증은 앱 레이어)
CREATE POLICY proxy_insert ON proxy_permissions FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY proxy_update ON proxy_permissions FOR UPDATE
  USING (auth.uid() IS NOT NULL);
```

---

### `companies` / `contacts`

```sql
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts  ENABLE ROW LEVEL SECURITY;

-- SELECT: 인증 사용자 전체 읽기
CREATE POLICY companies_select ON companies FOR SELECT
  USING (deleted_at IS NULL AND auth.uid() IS NOT NULL);
CREATE POLICY contacts_select ON contacts FOR SELECT
  USING (deleted_at IS NULL AND auth.uid() IS NOT NULL);

-- INSERT/UPDATE: admin only (Server Action에서 role 검증)
CREATE POLICY companies_write ON companies FOR ALL
  USING ((auth.jwt()->'user_metadata'->>'role') = 'admin')
  WITH CHECK ((auth.jwt()->'user_metadata'->>'role') = 'admin');
CREATE POLICY contacts_write ON contacts FOR ALL
  USING ((auth.jwt()->'user_metadata'->>'role') = 'admin')
  WITH CHECK ((auth.jwt()->'user_metadata'->>'role') = 'admin');
```

---

### `holidays`

```sql
ALTER TABLE holidays ENABLE ROW LEVEL SECURITY;

-- SELECT: 인증 사용자 전체
CREATE POLICY holidays_select ON holidays FOR SELECT
  USING (is_active = true AND auth.uid() IS NOT NULL);

-- INSERT/UPDATE/DELETE: admin only
CREATE POLICY holidays_write ON holidays FOR ALL
  USING ((auth.jwt()->'user_metadata'->>'role') = 'admin')
  WITH CHECK ((auth.jwt()->'user_metadata'->>'role') = 'admin');
```

---

### `notification_logs`

```sql
ALTER TABLE notification_logs ENABLE ROW LEVEL SECURITY;

-- SELECT: admin 전체, user 자신
CREATE POLICY notif_select ON notification_logs FOR SELECT
  USING (
    (auth.jwt()->'user_metadata'->>'role') = 'admin'
    OR recipient_id = auth.uid()
  );

-- UPDATE (read_at): 본인만
CREATE POLICY notif_update ON notification_logs FOR UPDATE
  USING (recipient_id = auth.uid())
  WITH CHECK (recipient_id = auth.uid());

-- INSERT: Edge Function / Service Role 전용 (차단)
CREATE POLICY notif_insert ON notification_logs FOR INSERT WITH CHECK (false);
```

---

### `audit_logs`

```sql
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- SELECT: admin 전체, user 자신이 actor이거나 on_behalf_of인 행
CREATE POLICY audit_select ON audit_logs FOR SELECT
  USING (
    (auth.jwt()->'user_metadata'->>'role') = 'admin'
    OR actor_id = auth.uid()
    OR on_behalf_of_id = auth.uid()
  );

-- INSERT: 트리거 전용 (SECURITY DEFINER 함수가 직접 INSERT, 일반 INSERT 차단)
CREATE POLICY audit_insert ON audit_logs FOR INSERT WITH CHECK (false);

-- UPDATE/DELETE: 불변 로그 — 전면 차단
CREATE POLICY audit_no_modify ON audit_logs FOR UPDATE USING (false);
CREATE POLICY audit_no_delete ON audit_logs FOR DELETE USING (false);
```

---

## 7. 파일 구조 요약

```
project/
├── app/
│   ├── api/
│   │   ├── auth/
│   │   │   ├── login/route.ts          (B)
│   │   │   ├── password/forgot/route.ts (B)
│   │   │   ├── password/reset/route.ts  (B)
│   │   │   ├── invite/accept/route.ts   (B)
│   │   │   └── me/route.ts              (B - PATCH only)
│   │   ├── users/
│   │   │   ├── invite/route.ts          (B)
│   │   │   └── [id]/
│   │   │       ├── role/route.ts        (B)
│   │   │       └── status/route.ts      (B)
│   │   ├── schedules/
│   │   │   ├── route.ts                 (B - POST)
│   │   │   └── [id]/route.ts            (B - PATCH, DELETE)
│   │   ├── radar/availability/route.ts  (B)
│   │   ├── holidays/batch/route.ts      (B)
│   │   └── export/schedules/route.ts   (B)
│   ├── (pages)/                         레이어 A는 Server Component/Action으로 직접 처리
│   └── _lib/
│       └── supabase/
│           ├── server.ts               (createUserClient, createAdminClient)
│           └── types.ts                (Database 타입 정의)
│
├── supabase/
│   ├── functions/
│   │   ├── send-notification/index.ts  (C)
│   │   ├── retry-notification/index.ts (C)
│   │   └── holiday-batch/index.ts      (C)
│   └── migrations/
│       ├── 001_schema.sql              ERD 테이블 + 인덱스
│       ├── 002_rls_policies.sql        RLS 정책 (6장)
│       ├── 003_audit_trigger.sql       fn_audit_log + 5개 트리거 (D)
│       ├── 004_cascade_soft_delete.sql fn_soft_delete_cascade (D)
│       ├── 005_radar_function.sql      fn_radar_availability (D)
│       └── 006_relationship_function.sql fn_relationship_summary (D)
```

---

## 8. 환경 변수 전체 목록

| 변수명 | 사용처 | 보안 |
|--------|--------|------|
| `NEXT_PUBLIC_SUPABASE_URL` | Next.js (클라이언트/서버) | 공개 가능 |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Next.js (클라이언트/서버) | 공개 가능 (RLS로 보호) |
| `SUPABASE_SERVICE_ROLE_KEY` | Route Handler 서버 전용 | **비공개** — 절대 클라이언트 노출 금지 |
| `RESEND_API_KEY` | Edge Function (`send-notification`, `retry-notification`) | **비공개** |
| `HOLIDAY_API_KEY` | Edge Function (`holiday-batch`) | **비공개** |

> Vercel에서는 `SUPABASE_SERVICE_ROLE_KEY` 등을 **Environment Variables > Server** 항목에만 등록.  
> Supabase Edge Function에서는 `supabase secrets set KEY=VALUE` 명령으로 주입.
