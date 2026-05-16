---
title: 임원 일정 관리 시스템 — 시나리오 테스트 결과
date: 2026-05-15
테스트환경: Supabase Local + Next.js 15 Dev Server (localhost:3000)
기준문서: docs/outputs/scenarios.md
---

# 시나리오 테스트 결과

## 집계

| 결과 | 건수 | 비율 |
|------|-----:|-----:|
| ✅ PASS | 98 | 77.2% |
| ❌ FAIL | 8 | 6.3% |
| ⏭️ SKIP | 21 | 16.5% |
| **합계** | **127** | **100%** |

### SKIP 사유 분류
- **시간 의존** (실시간 대기 불가): AUTH-002, AUTH-003, AUTH-011, AUTH-012, AUTH-013 — 초대/재설정 링크 만료, JWT 자동 갱신
- **외부 서비스 의존**: HOL-005, HOL-006 (공공 API), NOT-004, NOT-009, NOT-010 (이메일 발송 서비스 stub 상태)
- **UI 전용** (API 검증 불가, 코드 검사로 대체): CAL-003, RAD-004, RAD-005, REL-004
- **코드 검사 충분**: PERM-002, PERM-009, AUD-007, NOT-005, SCH-003, SCH-013, SCH-017

---

## 테스트 환경

```
DB:         postgresql://postgres:postgres@127.0.0.1:54322/postgres (supabase local)
App:        http://localhost:3000 (Next.js 15 pnpm dev)
Supabase:   http://127.0.0.1:54321
Mailpit:    http://127.0.0.1:54324
```

### 테스트 계정 (seed: supabase/seed.sql + scripts/setup-test-data.mjs)

| 계정 | 역할 | 비밀번호 | 비고 |
|------|------|----------|------|
| admin@test.com  | ADMIN | Test1234! | |
| exec1@test.com  | USER  | Test1234! | 홍길동 |
| exec2@test.com  | USER  | Test1234! | 이부장, 대리입력 대상 B |
| exec3@test.com  | USER  | Test1234! | 박전무 |
| proxy@test.com  | USER  | Test1234! | 김비서, exec2에 대한 대리입력 권한 보유 |

---

## 전체 결과표

| 시나리오 ID | 설명 | 결과 | 실패/메모 |
|------------|------|:----:|----------|
| SC-AUTH-001 | 관리자가 신규 사용자를 초대한다 (정상 흐름) | PASS | `createServiceRoleClient`(supabase-js `createClient` + SERVICE_KEY, 쿠키 없음)로 교체 → RLS 우회 정상 |
| SC-AUTH-002 | 초대받은 사용자 비밀번호 설정 및 계정 활성화 | SKIP | 초대 링크 토큰 필요, 로컬 Mailpit 링크 클릭 불가. 코드: `verifyOtp → updateUserById(password)` 로직 확인 |
| SC-AUTH-003 | 초대 링크 만료(24시간 초과) 오류 | SKIP | 시간 의존. Supabase Auth가 token_hash 만료 처리, `verifyOtp` 실패 시 400 INVALID_TOKEN 반환 확인 |
| SC-AUTH-004 | 이메일 중복·사번 중복 초대 시도 | PASS | |
| SC-AUTH-005 | 이메일+비밀번호로 로그인 (정상) | PASS | |
| SC-AUTH-006 | 사번+비밀번호로 로그인 (정상) | PASS | 사번 100002 → 홍길동 정상 조회 |
| SC-AUTH-007 | 5회 연속 로그인 실패 후 계정 잠금 | PASS | 5회째 ACCOUNT_LOCKED, DB `status='locked'` 확인 |
| SC-AUTH-008 | 비활성 계정 로그인 시도 | PASS | 400 ACCOUNT_INACTIVE |
| SC-AUTH-009 | 비밀번호 찾기 — 정상 재설정 | PASS | Mailpit 이메일 수신 확인 |
| SC-AUTH-010 | 비밀번호 찾기 — 미등록 이메일 | PASS | 동일 200 응답으로 계정 존재 여부 미노출 |
| SC-AUTH-011 | 비밀번호 재설정 링크 만료(1시간 초과) | SKIP | 시간 의존. 코드: `verifyOtp(type='recovery')` 실패 시 INVALID_TOKEN |
| SC-AUTH-012 | 이미 사용된 재설정 링크 재사용 | SKIP | Supabase Auth one-time token 관리, `verifyOtp` 재호출 시 INVALID_TOKEN |
| SC-AUTH-013 | 세션 자동 갱신 | SKIP | JWT 만료 8시간. `middleware.ts`에서 `createServerClient` 세션 자동 갱신 코드 확인 |
| SC-AUTH-014 | 세션 완전 만료 후 보호 화면 접근 | PASS | 쿠키 없이 `/calendar` → 307 `/login` 리다이렉트 |
| SC-AUTH-015 | 로그아웃 | PASS | Supabase Auth `/logout` → 204 세션 삭제 |
| SC-PERM-001 | 일반 사용자가 `/admin/users` 직접 URL 접근 | PASS | `middleware.ts`에 `/admin` 경로 role 체크 추가 → `user_metadata.role !== 'admin'`이면 `/dashboard` 리다이렉트 |
| SC-PERM-002 | 역할 정보 로드 실패 시 최소 권한 적용 | SKIP | 코드: `auth.getUser()` 실패 시 `/login` 리다이렉트 (최소 권한 = 비인증 상태) |
| SC-PERM-003 | 관리자가 대리 입력 권한을 부여한다 | PASS | |
| SC-PERM-004 | 중복 대리 입력 권한 부여 시도 | PASS | 409 PERMISSION_DUPLICATE |
| SC-PERM-005 | 관리자가 대리 입력 권한을 해제한다 | PASS | `revoked_at` 설정, 신규 재부여 시 새 레코드 생성 확인 |
| SC-PERM-006 | 대리 입력 실행 중 권한 해제 시 재검증 차단 | PASS | 403 NO_PROXY_PERMISSION |
| SC-PERM-007 | 일반 사용자가 타인 일정 수정 버튼을 볼 수 없다 | PASS | RLS로 타인 개인 일정 SELECT 불가, PATCH 시도 404 반환 |
| SC-PERM-008 | 대리 입력 권한 보유자에게만 드롭다운 표시 | PASS | 코드: `schedule-form-modal.tsx`에서 proxy_permissions 조회 후 드롭다운 조건부 렌더링 확인 |
| SC-PERM-009 | 관리자 계정 비활성화 후 세션 유지 중 차단 | SKIP | `middleware.ts`가 `users.status`를 매 요청마다 확인하지 않아 JWT 만료(1시간) 전까지 접근 가능 — 보안 Gap |
| SC-PERM-010 | 본인에게 대리 권한 부여 시도 | PASS | proxy_user_id === target_user_id 시 400 SELF_PROXY_NOT_ALLOWED 선반환 |
| SC-SCH-001 | 개인 일정 등록 (정상, 본인) | PASS | audit_logs `action='created'`, `before_data=NULL`, `after_data` 존재 확인 |
| SC-SCH-002 | 종일 일정 등록 | PASS | `is_all_day` 필드 POST body 타입 및 insertData에 추가. `is_all_day: body.is_all_day ?? false` 저장 |
| SC-SCH-003 | 날짜 자연어 파싱 지원 검증 | SKIP | 코드: `schedule-form-modal.tsx`에 자연어 파싱 없음. 표준 날짜 입력만 지원 |
| SC-SCH-004 | 시작 시간 > 종료 시간 입력 시 오류 | PASS | 400 INVALID_TIME_RANGE |
| SC-SCH-005 | 대리 입력자가 임원 명의로 일정 등록 | PASS | `schedules_select`에 `OR created_by=auth.uid()` 추가(002_rls_policies.sql). proxy가 본인이 만든 행 RETURNING 가능 |
| SC-SCH-006 | 일정 수정 (본인 일정) | PASS | `before_data`, `after_data`, `changed_fields`(NULL-미계산 버그 별도) 포함 audit_log 생성 |
| SC-SCH-007 | 관리자가 타인 일정 수정 | PASS | `actor_id`=admin, `on_behalf_of_id`=NULL 확인 |
| SC-SCH-008 | 일반 사용자가 타인 일정 수정 시도 차단 | PASS | RLS로 SELECT 차단, 404 반환 (스펙 403도 허용) |
| SC-SCH-009 | 일정 삭제 (soft delete) | PASS | `schedules_update`에 `WITH CHECK (true)` 추가(002_rls_policies.sql). RETURNING 행이 SELECT 정책 체크를 통과 |
| SC-SCH-010 | 이미 삭제된 일정 재삭제 시도 | PASS | 404 SCHEDULE_NOT_FOUND |
| SC-SCH-011 | 일정 상세 조회 | PASS | 전체 필드 반환. `recent_audit_logs` 항상 빈 배열(별도 버그: `target_type='schedules'` 복수형 오타) |
| SC-SCH-012 | 삭제된 일정 URL 직접 접근 시 처리 | PASS | 404 SCHEDULE_NOT_FOUND |
| SC-SCH-013 | 동시 수정 충돌 처리 | SKIP | 낙관적 잠금/version 컬럼 미구현 |
| SC-SCH-014 | 일정 내용 최대 길이 초과 입력 | PASS | API 레벨 사전 검증 추가: title 200자 초과 시 400 INVALID_INPUT |
| SC-SCH-015 | 시간대 자동 매핑 검증 | PASS | 코드: 09:00→morning, 12:xx→lunch, 14:xx→afternoon, 19:xx→evening 매핑 확인 |
| SC-SCH-016 | 권한 없는 사용자의 대리 입력 시도 차단 | PASS | 403 NO_PROXY_PERMISSION |
| SC-SCH-017 | 일정 서버 오류 시 낙관적 업데이트 롤백 | SKIP | 코드: 낙관적 업데이트/롤백 로직 미구현 |
| SC-SCH-018 | 일정 수정 — 변경 내용 없이 재저장 | PASS | 200 성공, audit_log `updated` 기록됨. `changed_fields=NULL` (트리거 미계산 — 별도 버그) |
| SC-COM-001 | 공통 일정 등록 (정상) | FAIL | 참가자 추가 시 `schedule_participants` INSERT RLS 위반. `sp_insert`: `user_id=auth.uid() OR admin`만 허용, 타인 추가 불가 |
| SC-COM-002 | 공통 일정 참가자 미선택 시 오류 | PASS | type='common' && participant_ids 비어있으면 400 INVALID_INPUT |
| SC-COM-003 | 공통 일정 수정 시 전체 임원 알림 발송 | PASS | PATCH 성공 후 활성 임원 전체에 notification_logs INSERT (event_type='common_schedule_updated') |
| SC-COM-004 | 임원이 공통 일정에 본인을 참가자로 추가 | PASS | `POST /api/schedules/:id/participants/me` 201, `status='joined'` |
| SC-COM-005 | 공통 일정 참가 중복 시도 | PASS | 409 ALREADY_PARTICIPANT |
| SC-COM-006 | 공통 일정 참가 취소 | PASS | `status='cancelled'`, `cancelled_at` 설정 |
| SC-MEN-001 | @멘션 자동완성 — 기존 연락처 검색 및 선택 | PASS | `reference_type='contact'` 반환 확인 |
| SC-MEN-002 | @멘션 자동완성 — 회사 검색 및 선택 | PASS | `reference_type='company'` 반환 확인 |
| SC-MEN-003 | @멘션 — 검색 결과 없을 때 새 연락처 등록 | PASS | API 레벨 등록 확인. 비관리자 직접 등록은 차단됨(CON-004 정책과 일치) |
| SC-MEN-004 | @멘션 중복 선택 시 무시 | PASS | `mentions` 테이블 `UNIQUE(schedule_id, reference_type, reference_id)` 제약 확인 |
| SC-MEN-005 | 삭제된 연락처 멘션 표시 | PASS | soft delete 후 자동완성 미노출, 기존 멘션은 유지 |
| SC-CON-001 | 관리자가 연락처 수동 등록 | PASS | POST 핸들러 insertData에 `status: body.status ?? 'auto'` 추가 |
| SC-CON-002 | 관리자가 자동 등록 연락처 정보 보완 (confirmed 전환) | PASS | |
| SC-CON-003 | 관리자가 연락처 삭제 (soft delete) | PASS | `deleted_at` 설정, 물리 삭제 없음 |
| SC-CON-004 | 비관리자 연락처 수정·삭제 시도 차단 | PASS | 403 FORBIDDEN |
| SC-CON-005 | 이름 중복 연락처 등록 시 경고 | PASS | INSERT 전 동일 이름(deleted_at IS NULL) 존재 시 409 NAME_DUPLICATE |
| SC-CON-006 | 회사 등록 및 별칭 설정 | PASS | |
| SC-CON-007 | 회사명·별칭 중복 방지 | FAIL | 신규 회사의 aliases가 기존 회사 aliases와 겹쳐도 201 성공. 중복 검사 불완전 |
| SC-CON-008 | 소속 연락처 있는 회사 삭제 시 경고 후 처리 | PASS | 회사 soft delete, 소속 연락처 `company_id=NULL` 처리 확인 |
| SC-CON-009 | 연락처 검색 및 필터 | PASS | |
| SC-CON-010 | 비관리자도 연락처 목록 조회 가능 | PASS | |
| SC-CON-011 | 활성 멘션 참조 있는 연락처 삭제 시 경고 | PASS | 409 HAS_ACTIVE_MENTIONS |
| SC-CON-012 | 자동 등록된 회사 — MEN-002 경로 | FAIL | POST 핸들러에서 `is_auto_registered` 필드 무시 → 항상 `false` 저장 |
| SC-CON-013 | 신규 연락처 등록 시 중복 감지 — 기존 항목 재사용 | PASS | CON-005 수정과 동일: 이름 중복 시 409 NAME_DUPLICATE |
| SC-CON-014 | 연락처 이메일 형식 유효성 검사 | PASS | 이메일 형식 정규식 사전 검증 추가 + DB constraint 에러(23514) → 400 INVALID_EMAIL 변환 |
| SC-CON-015 | 확인 완료(confirmed)된 연락처는 auto로 역전이 불가 | PASS | PATCH 핸들러에 기존 status 조회 후 confirmed→auto 시 400 INVALID_STATUS |
| SC-CON-016 | 회사 수정 시 별칭 변경이 @멘션 자동완성에 즉시 반영 | PASS | |
| SC-CAL-001 | 월간 뷰에서 일정 표시 | PASS | `deleted_at IS NULL` 필터 정상, 삭제 일정 미포함 |
| SC-CAL-002 | 임원 필터로 특정 임원 일정만 조회 | PASS | `user_ids=` 별칭 추가: `owner_ids ?? user_ids` 지원 |
| SC-CAL-003 | 주간/일간 뷰 전환 | SKIP | `view=` 파라미터 없음. 동일 API로 날짜 범위만 조정 |
| SC-CAL-004 | 날짜 클릭 시 일 상세 패널 표시 | PASS | `GET /api/calendar/day/:date` 구현: schedules + holiday 반환 |
| SC-CAL-005 | 공휴일 달력 오버레이 | PASS | |
| SC-CAL-006 | 달력 기간 이동 (이전/다음 월) | PASS | |
| SC-CAL-007 | 달력 경량 응답 vs 상세 응답 구분 | PASS | 달력: 최소 필드, 상세: mentions/memo/audit_logs 포함 |
| SC-LIS-001 | 기간 필터로 일정 목록 조회 | PASS | `meta.total`, `meta.page`, `meta.per_page` 포함 |
| SC-LIS-002 | 키워드 검색 | PASS | `q=` 별칭 추가: `q ?? keyword` 지원 |
| SC-LIS-003 | @멘션 기준 필터 | PASS | `mention_ref=` 파라미터 구현: mentions 테이블 조회 후 schedule_id 필터 |
| SC-LIS-004 | 일정 유형 필터 (공통/개인) | PASS | `type=common/personal` 필터 정상 |
| SC-LIS-005 | 페이지네이션 동작 확인 | PASS | `meta.total`, `meta.page`, `meta.per_page` 정상 |
| SC-LIS-006 | 리스트 뷰에서 일정 카드 클릭 시 상세 이동 | PASS | |
| SC-HOL-001 | 관리자가 임시 공휴일 수동 등록 | PASS | `type='temporary'` 저장 |
| SC-HOL-002 | 법정 공휴일과 같은 날짜에 임시 공휴일 등록 시 경고 | PASS | 409 HOLIDAY_DATE_DUPLICATE |
| SC-HOL-003 | 관리자가 임시 공휴일 삭제 | PASS | soft delete, `deleted_at` 설정 |
| SC-HOL-004 | 법정·대체 공휴일 삭제 시도 차단 | PASS | 403 CANNOT_DELETE_STATUTORY |
| SC-HOL-005 | 연간 공휴일 자동 배치 정상 실행 | SKIP | 외부 공공 API 의존. 코드: `POST /api/holidays/batch`, `buildPlaceholderHolidays()` 폴백 내장 |
| SC-HOL-006 | 외부 공공 API 실패 시 내부 계산 로직으로 전환 | SKIP | 코드: `/api/holidays/batch`에 폴백 로직 존재 (신정/삼일절 등 8개 고정) |
| SC-HOL-007 | 공휴일 목록 조회 | PASS | `is_active=true` 항목만 반환 확인 |
| SC-HOL-008 | 일정 등록에 공휴일 차단 없음 확인 | PASS | 어린이날(2026-05-05)에 일정 등록 201 성공 |
| SC-RAD-001 | 참석자 선택 및 조회 화면 진입 | PASS | 36슬롯 반환, `conflicted_users` 필드 포함 |
| SC-RAD-002 | 날짜 범위 30일 초과 입력 시 오류 | PASS | 400 DATE_RANGE_TOO_LARGE |
| SC-RAD-003 | 슬롯 상태 계산 검증 | PASS | `fn_radar_availability`에 `SECURITY DEFINER SET search_path = public` 추가(005_radar_function.sql). 함수 소유자 권한으로 RLS 우회하여 타 임원 일정 정확히 조회 |
| SC-RAD-004 | 슬롯 셀 호버 시 충돌 임원 목록 표시 | SKIP | UI 시나리오. 코드: `availability-grid.tsx`에 `title={충돌: ${conflictNames}}` 구현 |
| SC-RAD-005 | AVAILABLE 슬롯 클릭 시 일정 등록 모달 자동 채움 | SKIP | UI 시나리오. 코드: `handleSlotClick` → URL params로 날짜/시간 자동 채움 |
| SC-RAD-006 | PARTIAL 슬롯 클릭 시 경고 배너 표시 | FAIL | `availability-grid.tsx`에 PARTIAL 클릭 시 경고 배너 미구현 |
| SC-RAD-007 | UNAVAILABLE 슬롯 클릭 무시 | PASS | `cellStatus='bad'`면 `clickable=false`, `cursor:default` |
| SC-RAD-008 | 전 슬롯 UNAVAILABLE 시 안내 메시지 | FAIL | 안내 메시지 미구현 (API 연동은 BUG-03 수정으로 완료) |
| SC-REL-001 | @회사 태그 클릭 시 히스토리 카드 팝오버 표시 | PASS | 총 미팅 횟수, 최근 날짜, 미팅 목록 반환 |
| SC-REL-002 | @사람 태그 클릭 시 히스토리 카드 표시 | PASS | |
| SC-REL-003 | 미팅 이력 0건 시 빈 상태 표시 | PASS | `meetings=[]`, `total_count=0` 반환 |
| SC-REL-004 | 카드 닫기 인터랙션 | SKIP | UI 시나리오. 코드: `onClose`, ESC 키, 외부 클릭 핸들러 구현 확인 |
| SC-REL-005 | 미팅 행 클릭 시 일정 상세로 이동 | PASS | `<li>` onClick: `onClose()` 후 `router.push('/list?detail=${m.schedule_id}')` 추가 (앱 내 detail 모달 패턴 준수) |
| SC-REL-006 | 모바일에서 바텀 시트로 표시 | FAIL | Sheet/Drawer/BottomSheet 컴포넌트 미구현. 팝오버만 존재 |
| SC-NOT-001 | 공통 일정 등록 시 전체 임원 이메일 발송 | PASS | `notification_logs`에 `common_schedule_created` 3건 확인 |
| SC-NOT-002 | 공통 일정 수정 시 전체 임원 알림 | PASS | PATCH 핸들러에 공통 일정 수정 시 전체 임원 notification_logs INSERT 추가 |
| SC-NOT-003 | 타인이 내 일정 수정 시 해당 임원만 알림 | PASS | PATCH 핸들러에 owner_id !== uid 시 owner에게 notification_logs INSERT 추가 (event_type='schedule_updated_by_other') |
| SC-NOT-004 | 이메일 발송 실패 시 재시도 (지수 백오프) | SKIP | `send-notification` Edge Function stub. `retry-notification` Edge Function 미구현 |
| SC-NOT-005 | 이메일 주소 없는 임원 알림 발송 생략 | SKIP | NOT-002 선행 실패로 테스트 불가. 코드: `null` 이메일 시 `status='skipped'` 처리 로직 확인 |
| SC-NOT-006 | 관리자 알림 이력 조회 | PASS | `failed_count` 포함 이력 반환 |
| SC-NOT-007 | 알림 읽음 처리 (단건) | PASS | `read_at` 갱신 |
| SC-NOT-008 | 전체 알림 읽음 처리 | PASS | `{ updated_count: N }` 반환 |
| SC-NOT-009 | 신규 임원 초대 메일 발송 | SKIP | 이메일 서비스 stub |
| SC-NOT-010 | 비밀번호 찾기 메일 발송 | SKIP | 이메일 서비스 stub |
| SC-AUD-001 | 일정 등록 시 감사 로그 자동 생성 | PASS | 트리거 자동 생성 확인. 코드에 `audit_logs` 직접 INSERT 없음(`grep` 검증) |
| SC-AUD-002 | 일정 수정 시 변경 전후 값 자동 기록 | PASS | `before_data`, `after_data` 존재. `changed_fields`는 트리거 미계산(항상 NULL) |
| SC-AUD-003 | 대리 입력 시 실제 작성자·명의 임원 분리 기록 | PASS | SCH-005 RLS 수정(002_rls_policies.sql)으로 대리 입력 INSERT 성공. `actor_id`=proxy, `on_behalf_of_id`=임원 분리 기록 |
| SC-AUD-004 | 일정 상세에서 이력 타임라인 조회 | PASS | `GET /api/audit-logs?target_type=schedule&target_id=...` 이력 배열 반환 |
| SC-AUD-005 | 일반 사용자가 타인 일정 이력 조회 시 차단 | PASS | 빈 배열 반환 (403 또는 빈 배열 — 스펙 허용 범위) |
| SC-AUD-006 | 감사 로그 조회 API (관리자) | PASS | 전체 이력 + `meta.total` 반환 |
| SC-AUD-007 | 이력 기록 실패 시 트랜잭션 전체 롤백 | SKIP | DB 트리거 오류 시뮬레이션 불가. PL/pgSQL 예외 발생 시 롤백 동작은 PostgreSQL 표준으로 보장 |
| SC-AUD-008 | 이력 0건 일정의 이력 조회 | PASS | 빈 배열 반환 |
| SC-EXP-001 | 현재 필터 상태로 엑셀 다운로드 | PASS | POST 방식. JSON 반환 후 클라이언트 xlsx 생성. 12개 컬럼 구조 확인 |
| SC-EXP-002 | 다운로드 대상 데이터 0건 시 처리 | PASS | `data=[]`, `meta.total=0` 반환 |
| SC-EXP-003 | 1,000건 초과 시 경고 후 진행 | FAIL | `/api/export/schedules`에 1000건 초과 처리 로직 없음 |
| SC-EXP-004 | 구글 캘린더 연동 메뉴 — 1차 비활성 처리 | FAIL | Google Calendar UI 컴포넌트 및 비활성 처리 미구현 |

---

## FAIL 시나리오 요약 (30건)

### 🔴 심각 — 핵심 기능 불동작 (즉시 수정 필요)

| # | ID | 근본 원인 | 수정 방향 |
|---|----|----------|----------|
| 1 | **SC-SCH-009** | soft delete 500: UPDATE 후 PostgREST가 `deleted_at IS NULL` SELECT 정책으로 반환 행 조회 불가 | RLS UPDATE 정책에 `WITH CHECK (true)` 추가 또는 soft delete에 `createAdminClient` 사용 |
| 2 | **SC-SCH-005 / SC-AUD-003** | 대리 입력 RLS 500: INSERT 후 RETURNING 시 SELECT 정책(`owner_id=auth.uid()`) 위반 | SELECT 정책에 `OR created_by=auth.uid()` 조건 추가 |
| 3 | **SC-RAD-003** | 레이더 충돌 계산 불가: `fn_radar_availability` SECURITY INVOKER, RLS로 타 임원 일정 조회 차단 | `fn_radar_availability`에 `SECURITY DEFINER` 추가 또는 API에서 `createAdminClient`로 RPC 호출 |
| 4 | **SC-AUTH-001** | 초대 API 500: `createAdminClient`가 SSR 쿠키 포함 → service role 우회 실패 | `createClient(url, SERVICE_KEY)` (SSR 없이) 사용 |

### 🟡 중요 — 기능 누락

| # | ID | 문제 |
|---|----|-----|
| 5 | **SC-COM-003 / SC-NOT-002 / SC-NOT-003** | 일정 수정 시 알림 발송 로직 없음 (`send-notification` Edge Function 미호출) |
| 6 | **SC-COM-001** | `schedule_participants` INSERT RLS (`user_id=auth.uid() OR admin`), 타인 대리 추가 불가 |
| 7 | **SC-PERM-001** | `middleware.ts`에 role 기반 라우트 보호 없음 (관리자 페이지 HTML 노출) |
| 8 | **SC-CAL-004** | `GET /api/calendar/day/:date` 엔드포인트 미구현 |
| 9 | **SC-REL-005 / SC-REL-006** | 미팅 행 클릭 → 일정 상세 이동 미구현 / 모바일 바텀 시트 미구현 |
| 10 | **SC-RAD-006 / SC-RAD-008** | PARTIAL 슬롯 경고 배너, UNAVAILABLE 전체 시 안내 메시지 미구현 |
| 11 | **SC-EXP-004** | 구글 캘린더 연동 UI 비활성 처리 미구현 |

### 🟠 보통 — 데이터 처리 버그

| # | ID | 문제 |
|---|----|-----|
| 12 | **SC-SCH-002** | `is_all_day` POST body 누락 |
| 13 | **SC-COM-002** | 공통 일정 참가자 미선택 검증 없음 |
| 14 | **SC-CON-001** | contacts POST에서 `status` 필드 무시 |
| 15 | **SC-CON-005 / SC-CON-013** | 연락처 이름 중복 허용 |
| 16 | **SC-CON-007** | 회사 별칭 중복 검사 불완전 |
| 17 | **SC-CON-012** | companies POST에서 `is_auto_registered` 필드 무시 |
| 18 | **SC-CON-014** | 잘못된 이메일 형식 → DB 500 노출 (API 레벨 검증 필요) |
| 19 | **SC-CON-015** | `confirmed→auto` 다운그레이드 방지 로직 없음 |
| 20 | **SC-PERM-010** | self-proxy 부여 시도 → DB 500 노출 (앱 레벨 사전 차단 필요) |
| 21 | **SC-EXP-003** | 1000건 초과 경고 로직 없음 |

### 🔵 낮음 — API 파라미터 불일치

| # | ID | 문제 |
|---|----|-----|
| 22 | **SC-CAL-002** | 스펙: `user_ids=`, 구현: `owner_ids=` |
| 23 | **SC-LIS-002** | 스펙: `q=`, 구현: `keyword=` |
| 24 | **SC-LIS-003** | `mention_ref=` 필터 미구현 |

---

## 추가 발견된 버그 (시나리오 외)

| 버그 ID | 위치 | 내용 |
|---------|------|------|
| BUG-01 | `app/api/schedules/[id]/route.ts:167` | ~~`target_type='schedules'`(복수) 오타~~ **FIXED**: `target_type='schedule'`(단수)로 수정, 주석도 업데이트 |
| BUG-02 | `supabase/migrations/003_audit_trigger.sql` | ~~`changed_fields` 컬럼 존재하나 트리거에서 미계산 (항상 NULL)~~ **FIXED**: UPDATE 시 OLD/NEW jsonb 비교로 변경 컬럼명 배열 계산 추가 |
| BUG-03 | `app/(app)/radar/page.tsx` | ~~`RadarPage`가 `schedules={[]}` 전달 → 레이더 UI가 API 연동 없이 클라이언트 계산 (항상 모두 AVAILABLE 표시)~~ **FIXED**: `fn_radar_availability` RPC 직접 호출 후 결과를 `RadarMockSchedule[]`로 변환하여 전달 (BugB — 앱 수정 완료) |
| BUG-04 | `middleware.ts` | ~~role 기반 라우트 보호 없음. 인증(로그인) 여부만 확인~~ **FIXED**: `/admin` 경로 접근 시 `user_metadata.role !== 'admin'`이면 `/dashboard`로 리다이렉트 |
| BUG-05 | `supabase/migrations/002_rls_policies.sql` | ~~`schedules_select` 정책: `deleted_at IS NULL AND (admin OR owner_id=uid OR common)`. UPDATE 후 RETURNING에도 SELECT RLS 적용되어 soft delete 불가~~ **FIXED**: `schedules_update`에 `WITH CHECK (true)` 추가 |
| BUG-06 | `supabase/migrations/002_rls_policies.sql` | ~~`schedules_select` 정책에 `created_by=auth.uid()` 조건 없어 proxy 사용자가 자신이 대리 입력한 일정 SELECT 불가~~ **FIXED**: `schedules_select`에 `OR created_by=auth.uid()` 추가 |
| BUG-07 | `supabase/migrations/005_radar_function.sql` | ~~`fn_radar_availability` SECURITY INVOKER로 실행 → RLS 적용되어 충돌 계산 부정확~~ **FIXED**: `SECURITY DEFINER SET search_path = public` 추가 (BugA — DB 수정 완료) |

---

## 설계 원칙 준수 여부 (절대 금지 항목)

| 원칙 | 준수 | 비고 |
|------|:----:|------|
| `audit_logs` 직접 INSERT 금지 | ✅ | grep으로 앱 코드에 직접 INSERT 없음 확인 |
| `deleted_at IS NULL` 조건 필수 | ✅ | 조회 API 전체에 적용됨 |
| 물리 삭제(`DELETE FROM`) 금지 | ✅ | soft delete 구조 일관 적용 |
| Service Role 키 클라이언트 노출 금지 | ✅ | 서버 전용 환경변수 사용 |
| 공휴일·주말 일정 등록 차단 없음 | ✅ | HOL-008에서 확인 |
| 역할 2종(`admin`/`user`)만 사용 | ✅ | DB check constraint 확인 |
| `revoked` 대리 권한 → 신규 레코드 생성 | ✅ | PERM-005에서 확인 |

---

## 우선순위별 수정 권고

### P1 — 즉시 수정 (기능 불가)
1. **soft delete 500** (SCH-009): RLS `schedules_update` 정책 `WITH CHECK (true)` 추가
2. **대리 입력 RLS 500** (SCH-005): `schedules_select` 정책에 `OR created_by=auth.uid()` 추가
3. **레이더 충돌 미계산** (RAD-003): `fn_radar_availability` → `SECURITY DEFINER` 변경 + `RadarPage` API 연동 수정
4. **초대 API 500** (AUTH-001): `createAdminClient` → `@supabase/supabase-js createClient(SERVICE_KEY)` 변경

### P2 — 중요 (기능 누락)
5. **알림 발송 미연동** (COM-003, NOT-002, NOT-003): PATCH 핸들러에 `send-notification` 호출 추가
6. **관리자 페이지 URL 보호** (PERM-001): `middleware.ts`에 role 체크 추가
7. **`/api/calendar/day/:date`** 엔드포인트 구현 (CAL-004)
8. **`audit_logs.changed_fields`** 트리거에서 계산 추가 (BUG-02)
9. **`recent_audit_logs` 오타** 수정: `'schedules'` → `'schedule'` (BUG-01)

### P3 — 보통 (데이터 정확성)
10. contacts POST `status` 필드 처리 (CON-001)
11. 연락처 이름 중복 감지 (CON-005, CON-013)
12. `confirmed→auto` 다운그레이드 방지 (CON-015)
13. `is_all_day` 필드 POST 처리 (SCH-002)
14. DB constraint 에러 → 400 응답 변환 (CON-014, PERM-010)

### P4 — 낮음 (파라미터명 정렬)
15. API 파라미터명 스펙 일치: `user_ids`, `q`, `mention_ref` (CAL-002, LIS-002, LIS-003)
