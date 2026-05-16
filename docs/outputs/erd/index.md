---
title: 임원 일정 관리 시스템 - ERD 인덱스
version: "1.1"
date: 2026-05-13
category: ERD
---

# 임원 일정 관리 시스템 - ERD 인덱스

본 문서는 `docs/outputs/erd/` 폴더의 ERD 산출물을 탐색하기 위한 네비게이션 인덱스이다. 데이터 모델 자체는 `erd.md`, 시드 데이터는 `seed.md`, DB 인덱스 전략은 본 문서의 부록(6장)에서 다룬다.

---

## 1. 개요 및 읽는 순서

### 1-1. ERD 폴더 구성

| 파일 | 역할 | 분량 | 주요 독자 |
|------|------|------|-----------|
| `index.md` (본 문서) | 네비게이션·조회 패턴·명명 규칙 요약, DB 인덱스 전략 | ~250줄 | 전체 |
| `erd.md` | 데이터 모델 본체 — 다이어그램, 10개 테이블 명세, 관계 정의, 설계결정노트 | ~645줄 | DB 설계자, 백엔드 |
| `seed.md` | 개발·테스트용 시드 데이터 (사용자·회사·연락처·일정 등) | ~415줄 | 개발자, QA |

### 1-2. 권장 읽는 순서

1. **본 문서 1~5장** — 도메인 분류와 조회 패턴, 명명 규칙 파악
2. **`erd.md` 1장 (전체 다이어그램)** — 테이블 간 관계 한눈에 보기
3. **`erd.md` 2장 (엔티티 목록표)** — 10개 테이블의 역할·상태값 요약
4. **`erd.md` 3장 (엔티티별 상세 정의)** — 컬럼·제약 정의, 필요 테이블만 부분 참조
5. **`erd.md` 4장 (관계 정의표)** — FK 카디널리티, ON DELETE 동작 확인
6. **본 문서 6장 (DB 인덱스 전략)** — 운영 단계에서 쿼리 성능 튜닝 시
7. **`seed.md`** — 로컬 개발 환경 구성, 테스트 데이터 시나리오 확인 시

---

## 2. 도메인별 테이블 분류

10개의 테이블은 4개 도메인으로 그룹화된다. 각 도메인의 상세는 `erd.md` 3장의 해당 엔티티 절을 참조한다.

| 도메인 | 테이블 | 용도 | 핵심 spec/process |
|--------|--------|------|-------------------|
| **인증·권한** | `users`, `proxy_permissions` | 관리자/임원 사용자 식별, 대리 입력 권한 부여·해제 | spec/01_auth.md, spec/02_permission.md / proc_01_auth.md, proc_02_permission.md |
| **일정** | `schedules`, `schedule_participants` | 개인/공통 일정, 공통 일정 참가자 관리 | spec/03_schedule.md, spec/07_common_schedule.md, spec/05_calendar_view.md, spec/06_list_view.md / proc_03_schedule.md |
| **멘션·연락처** | `contacts`, `companies`, `mentions` | @멘션 자동완성·자동 등록, 회사/연락처 마스터, 일정-연락처 연결 | spec/04_mention_contact.md, spec/10_relationship_history.md / proc_04_mention_contact.md, proc_07_relationship_history.md |
| **부가** | `holidays`, `notification_logs`, `audit_logs` | 공휴일 마스터, 알림 발송 이력, 범용 감사 로그 | spec/08_holiday.md, spec/11_notification.md, spec/12_audit_log.md / proc_08_holiday.md, proc_05_notification.md, proc_09_audit_log.md |

---

## 3. 핵심 조회 패턴

기능명세서·프로세스 문서에서 자주 등장하는 조회 시나리오 7건을 정리한다. 각 시나리오는 6장의 인덱스 전략과 1:1로 대응된다.

| # | 조회 시나리오 | 사용 테이블 | 핵심 인덱스 | 관련 기능 |
|---|--------------|------------|------------|-----------|
| 1 | **임원의 이번 주 개인 일정 조회** | `schedules` | `idx_schedules_owner_date_active` `(owner_id, schedule_date)` | CAL-001~003, LIS-001 |
| 2 | **달력 뷰의 공통 일정 + 참가자 조회** | `schedules`, `schedule_participants` | `idx_schedules_type_date_active`, `idx_sp_schedule_status_joined` | CAL-005, COM-002 |
| 3 | **사용자별 참가 중인 공통 일정 목록** | `schedule_participants` + `schedules` | `idx_sp_user_status_joined` `(user_id, status)` | CAL-001 사용자 화면 |
| 4 | **@멘션 자동완성 (이름·별칭 prefix/부분 일치)** | `contacts`, `companies` | `idx_contacts_name_trgm`, `idx_companies_aliases_gin`, `idx_companies_name_active` | MEN-001, MEN-002 |
| 5 | **특정 회사/사람의 미팅 이력 최신순** | `mentions` (+ `schedules` join) | `idx_mentions_ref_created_desc` `(reference_type, reference_id, created_at DESC)` | REL-001, REL-002 |
| 6 | **모임 레이더: 후보 임원들의 시간 슬롯 충돌 계산** | `schedules` | `idx_schedules_owner_date_slot_active` `(owner_id, schedule_date, time_slot)` | RAD-001, RAD-002, RAD-003 |
| 7 | **공휴일 달력 렌더링 / 알림 재시도 워커 픽업** | `holidays` / `notification_logs` | `idx_holidays_date_active` / `idx_notif_status_attempt` | CAL-006, HOL-001 / NOT-005, NOT-006 |

> 키워드 검색(LIS-003)과 대리 입력 추적(PERM-003, SCH-006, AUD-003)도 빈번한 부가 패턴이며, 6장 인덱스 목록의 `*_trgm` 및 `idx_*_on_behalf_of` 항목 참조.

---

## 4. 관련 문서 네비게이션

### 4-1. `erd.md` 내부 섹션 가이드

| `erd.md` 위치 | 내용 | 언제 보면 좋은가 |
|---------------|------|-----------------|
| 상단 "설계 결정 노트" | 입력 자료 충돌 해소 결정 사항 (holidays.type, contacts soft delete, 임원 별도 테이블 미사용 등) | 왜 이렇게 설계했는지 근거를 찾을 때 |
| 1장. ERD 전체 다이어그램 | Mermaid 다이어그램 + 테이블별 컬럼 요약 | 전체 구조 한눈에 |
| 2장. 엔티티 목록표 | 10개 테이블의 한글명·핵심 상태값 요약 | 빠른 인덱스 |
| 3장. 엔티티별 상세 정의 (E01~E10) | 컬럼 타입·NULL·기본값·제약조건·인덱스 비고 | 구현·DDL 작성 시 |
| 4장. 관계 정의표 | FK 카디널리티, 식별/비식별, N:M 관계 요약 | 조인·CASCADE 정책 확인 시 |

> 본 인덱스 6장의 인덱스 전략은 `erd.md` 3장의 각 테이블 "비고" 컬럼에 명시된 운영 인덱스 권장 사항을 통합·구조화한 것이다.

### 4-2. `seed.md` 시드 데이터 범위

`seed.md`는 다음 시드 데이터를 포함한다:
- 관리자/임원 사용자 (`users`) — 로그인 가능 계정
- 회사·연락처 마스터 (`companies`, `contacts`) — 멘션 자동완성 테스트용
- 일정 (`schedules`) — 개인/공통, 다양한 시간 슬롯
- 공통 일정 참가자 (`schedule_participants`)
- 멘션 (`mentions`) — 관계 히스토리 테스트 데이터
- 대리 입력 권한 (`proxy_permissions`)
- 공휴일 (`holidays`) — 당해 연도 법정공휴일
- 알림 로그·감사 로그는 운영 중 자동 생성 (시드 미포함)

### 4-3. 외부 폴더 링크

| 폴더 | 파일 | 본 ERD와의 관계 |
|------|------|---------------|
| `spec/` | `00_overview.md` ~ `13_export_responsive.md` | 기능별 요구사항·상태 enum·검증 규칙. ERD의 CHECK 제약과 일치 |
| `process/` | `proc_00_index.md` ~ `proc_10_export.md` | 비즈니스 프로세스 흐름. ERD의 트랜잭션·CASCADE 경계와 대응 |
| `requirement/`, `ia/` | — | 상위 요구사항·정보구조. ERD가 충족하는 비즈니스 맥락 |

도메인별 spec/process 매핑은 2장(도메인별 테이블 분류)의 우측 컬럼 참조. 각 테이블 단위의 역참조는 `erd.md` 3장 각 엔티티 헤더 직후 "**관련 기능**" 라인에서 확인 가능하다.

---

## 5. 명명 규칙 요약

`erd.md` 도입부의 규칙을 한 곳에 정리한다.

| 대상 | 규칙 | 예시 |
|------|------|------|
| 테이블명 | 영문 소문자 + `snake_case` + **복수형** | `users`, `schedules`, `schedule_participants`, `notification_logs` |
| 컬럼명 | 영문 소문자 + `snake_case` | `employee_id`, `schedule_date`, `time_slot` |
| PK | 모든 테이블에 `id uuid` (UUID v4, `gen_random_uuid()`) | `id` |
| 외래키 | `<참조 테이블 단수형>_id` | `owner_id`, `schedule_id`, `company_id`, `recipient_id` |
| 시각 컬럼 | 접미사 `_at` (타입 `timestamptz`) | `created_at`, `updated_at`, `deleted_at`, `granted_at`, `revoked_at`, `sent_at` |
| 날짜 컬럼 | 접미사 `_date` (타입 `date`) | `schedule_date`, `holiday_date` |
| 불리언 플래그 | 접두사 `is_` | `is_all_day`, `is_active`, `is_auto_registered` |
| 행위자 컬럼 | `_by` (FK→users.id) | `created_by`, `deleted_by`, `granted_by`, `revoked_by`, `added_by` |
| 상태 enum | `status` 컬럼 + CHECK 제약 (spec의 enum과 100% 일치) | `users.status`, `contacts.status`, `schedule_participants.status`, `notification_logs.status` |
| Soft delete | `deleted_at` (NULL=활성) + `deleted_by` (FK) | `users`, `companies`, `contacts`, `schedules`, `holidays` |
| 다형성 참조 | `<역할>_type` + `<역할>_id` | `mentions.reference_type/reference_id`, `audit_logs.target_type/target_id`, `notification_logs.target_type/target_id` |
| 스냅샷 컬럼 | `_snapshot` 접미사 (변경 시점 값 보존) | `audit_logs.actor_name_snapshot`, `on_behalf_of_name_snapshot` |

> 공통 컬럼: 모든 테이블은 `id`, `created_at`, `updated_at`을 가지며, soft delete 적용 테이블은 추가로 `deleted_at`, `deleted_by`를 가진다.

---

## 6. 부록 — DB 인덱스 전략

본 장은 `erd.md`에 정의된 데이터 모델에 대한 PostgreSQL 인덱스 설계를 정의한다. 인덱스는 기능명세서·프로세스 문서에서 추출한 주요 조회 패턴(3장 핵심 조회 패턴)을 기반으로 설계한다.

### 6-1. 인덱스 설계 원칙

#### 추가 기준

| 기준 | 설명 |
|------|------|
| **조회 패턴 기반** | 기능명세서(spec/)와 프로세스(process/) 문서에서 도출된 실제 쿼리 패턴에 한해 인덱스를 추가한다. 단순한 "있을 법한 쿼리"는 추가하지 않는다. |
| **PK/FK 자동 인덱스 의존** | PostgreSQL은 PK에 자동으로 인덱스를 생성한다. FK는 자동 생성되지 않으므로 조인이 자주 발생하는 FK는 명시적으로 추가한다. |
| **선택도(Selectivity) 우선** | 카디널리티가 높은(중복이 적은) 컬럼을 복합 인덱스 앞쪽에 배치한다. |
| **부분 인덱스 적극 활용** | soft delete 대상 테이블은 `WHERE deleted_at IS NULL` 부분 인덱스로 활성 행만 인덱싱하여 크기·성능을 최적화한다. |
| **JSONB는 GIN** | `audit_logs.before_data` / `after_data` 등 JSONB 검색이 필요한 경우 GIN 인덱스 사용. |
| **배열은 GIN** | `companies.aliases` (text[])는 별칭 검색을 위해 GIN 인덱스. |

#### 복합 인덱스 컬럼 순서 결정 기준

1. **등호 조건 컬럼이 범위 조건 컬럼보다 앞**: `WHERE owner_id = ? AND schedule_date BETWEEN ? AND ?` → `(owner_id, schedule_date)`
2. **선택도가 높은 컬럼이 앞**: 임원 1명에 해당하는 일정 수보다, 특정 날짜에 해당하는 일정 수가 보통 더 많으므로 `owner_id`가 앞.
3. **ORDER BY 컬럼은 인덱스 후행에 두고 정렬 방향 일치**: `ORDER BY schedule_date DESC` 패턴이 많으면 `(contact_id, schedule_date DESC)`.

#### 인덱스 추가 vs 생략 트레이드오프

| 추가 | 생략 |
|------|------|
| 읽기 빈도가 매우 높은 핫 패턴 | 데이터 양이 항상 작아 시퀀셜 스캔이 더 빠른 경우 (예: holidays 단일 연도) |
| 외래키 조인 컬럼 (FK는 자동 인덱스 안 됨) | 쓰기 빈도가 높고 읽기는 거의 없는 로그 테이블 단순 컬럼 |
| ORDER BY/GROUP BY로 자주 등장하는 컬럼 | 변경이 잦고 카디널리티가 낮은 컬럼 (status 단독 등) |
| UNIQUE 비즈니스 제약 | 중복 인덱스 (PK가 이미 커버하는 경우) |

> **쓰기 비용**: PostgreSQL은 인덱스가 N개면 쓰기 시 N개 인덱스를 모두 갱신한다. 각 테이블 인덱스는 5~7개를 넘지 않도록 관리한다.

### 6-2. 테이블별 인덱스 정의표

#### users

| 인덱스명 | 컬럼 | 유형 | 용도 | 비고 |
|----------|------|------|------|------|
| `users_pkey` | `(id)` | B-tree (PK) | PK 자동 | — |
| `idx_users_email_active` | `(LOWER(email))` `WHERE deleted_at IS NULL` | B-tree (UNIQUE, 부분) | 이메일 로그인 / 중복 검사 | AUTH-002 이메일 로그인 |
| `idx_users_employee_id_active` | `(employee_id)` `WHERE deleted_at IS NULL` | B-tree (UNIQUE, 부분) | 사번 로그인 / 중복 검사 | AUTH-002 사번 로그인 |
| `idx_users_role_status` | `(role, status)` `WHERE deleted_at IS NULL` | B-tree (부분) | 임원 목록 조회 (role='user' AND status='active'), 알림 발송 대상 조회 | RAD-001, NOT-001 |
| `idx_users_status_locked_until` | `(status, locked_until)` `WHERE status = 'locked'` | B-tree (부분) | 잠금 자동 해제 배치 | AUTH-002 |

#### companies

| 인덱스명 | 컬럼 | 유형 | 용도 | 비고 |
|----------|------|------|------|------|
| `companies_pkey` | `(id)` | B-tree (PK) | PK 자동 | — |
| `idx_companies_name_active` | `(LOWER(name))` `WHERE deleted_at IS NULL` | B-tree (UNIQUE, 부분) | 회사명 중복 검사 / 자동완성 prefix 검색 | MEN-001, CON-005 |
| `idx_companies_aliases_gin` | `(aliases)` `WHERE deleted_at IS NULL` | GIN (부분) | 별칭 배열 포함 검색 (`@>`, `&&`) | MEN-001 별칭 자동완성 |
| `idx_companies_created_by` | `(created_by)` | B-tree | 등록자별 조회 (관리 화면) | CON-005 |

#### contacts

| 인덱스명 | 컬럼 | 유형 | 용도 | 비고 |
|----------|------|------|------|------|
| `contacts_pkey` | `(id)` | B-tree (PK) | PK 자동 | — |
| `idx_contacts_name_active` | `(LOWER(name))` `WHERE deleted_at IS NULL` | B-tree (부분) | @멘션 자동완성 / 이름 중복 검사 | MEN-001, CON-001 |
| `idx_contacts_company_id_active` | `(company_id)` `WHERE deleted_at IS NULL` | B-tree (부분) | 회사별 소속 연락처 조회 | CON-005 (회사 삭제 시 영향 확인) |
| `idx_contacts_status` | `(status)` `WHERE deleted_at IS NULL AND status = 'auto'` | B-tree (부분) | 미확인(auto) 연락처 목록 조회 (관리자) | CON-004 미확인 항목 필터 |
| `idx_contacts_name_trgm` | `(name gin_trgm_ops)` `WHERE deleted_at IS NULL` | GIN (pg_trgm) | 부분 일치 검색 (이름) | MEN-001 부분 일치 |

#### schedules

| 인덱스명 | 컬럼 | 유형 | 용도 | 비고 |
|----------|------|------|------|------|
| `schedules_pkey` | `(id)` | B-tree (PK) | PK 자동 | — |
| `idx_schedules_owner_date_active` | `(owner_id, schedule_date)` `WHERE deleted_at IS NULL` | B-tree (부분) | **임원별 기간 일정 조회 (달력 뷰의 핵심 쿼리)** | CAL-001~003, LIS-001 |
| `idx_schedules_type_date_active` | `(type, schedule_date)` `WHERE deleted_at IS NULL` | B-tree (부분) | 공통 일정 필터 / 달력에서 type별 분리 조회 | CAL-005 공통 일정, LIS-006 |
| `idx_schedules_date_active` | `(schedule_date)` `WHERE deleted_at IS NULL AND type = 'common'` | B-tree (부분) | 모든 임원이 공유하는 공통 일정 날짜별 조회 | CAL-005 |
| `idx_schedules_owner_date_slot_active` | `(owner_id, schedule_date, time_slot)` `WHERE deleted_at IS NULL` | B-tree (부분) | **모임 레이더 충돌 계산 (시간 슬롯 단위)** | RAD-002 |
| `idx_schedules_created_by` | `(created_by, created_at DESC)` | B-tree | 작성자별 일정 / 빠른 입력 직후 본인 일정 표시 | LIS-002 |
| `idx_schedules_on_behalf_of` | `(on_behalf_of_id)` `WHERE on_behalf_of_id IS NOT NULL` | B-tree (부분) | 대리 입력 일정 추적 | PERM-003 |
| `idx_schedules_title_trgm` | `(title gin_trgm_ops)` `WHERE deleted_at IS NULL` | GIN (pg_trgm) | 키워드 검색 (일정 내용) | LIS-003 |
| `idx_schedules_location_trgm` | `(location gin_trgm_ops)` `WHERE deleted_at IS NULL AND location IS NOT NULL` | GIN (pg_trgm, 부분) | 장소 키워드 검색 | LIS-003 |

#### schedule_participants

| 인덱스명 | 컬럼 | 유형 | 용도 | 비고 |
|----------|------|------|------|------|
| `schedule_participants_pkey` | `(id)` | B-tree (PK) | PK 자동 | — |
| `uq_schedule_participants_pair` | `(schedule_id, user_id)` | B-tree (UNIQUE) | 중복 참가 방지 / 본인 참가 여부 즉시 확인 | COM-002 |
| `idx_sp_user_status_joined` | `(user_id, status)` `WHERE status = 'joined'` | B-tree (부분) | 사용자별 참가 중인 공통 일정 목록 (캘린더 표시용) | CAL-001 사용자 화면 |
| `idx_sp_schedule_status_joined` | `(schedule_id, status)` `WHERE status = 'joined'` | B-tree (부분) | 공통 일정의 현재 참가자 목록 | COM-002 참가자 표시 |

#### mentions

| 인덱스명 | 컬럼 | 유형 | 용도 | 비고 |
|----------|------|------|------|------|
| `mentions_pkey` | `(id)` | B-tree (PK) | PK 자동 | — |
| `uq_mentions_triple` | `(schedule_id, reference_type, reference_id)` | B-tree (UNIQUE) | 동일 일정 내 동일 대상 중복 멘션 방지 | MEN-001 |
| `idx_mentions_ref_created_desc` | `(reference_type, reference_id, created_at DESC)` | B-tree | **관계 히스토리 조회 (특정 회사/사람의 미팅 이력 최신순 집계)** | REL-002 |
| `idx_mentions_schedule_id` | `(schedule_id)` | B-tree | 일정 상세 조회 시 멘션 목록 로드 | SCH-005 |

#### proxy_permissions

| 인덱스명 | 컬럼 | 유형 | 용도 | 비고 |
|----------|------|------|------|------|
| `proxy_permissions_pkey` | `(id)` | B-tree (PK) | PK 자동 | — |
| `uq_proxy_active_pair` | `(proxy_user_id, target_user_id)` `WHERE revoked_at IS NULL` | B-tree (UNIQUE, 부분) | 동일 조합 중복 활성 권한 금지 | PERM-002 |
| `idx_proxy_proxy_active` | `(proxy_user_id)` `WHERE revoked_at IS NULL` | B-tree (부분) | "내가 대리 입력 가능한 임원 목록" 조회 (드롭다운) | PERM-003, SCH-006 |
| `idx_proxy_target_active` | `(target_user_id)` `WHERE revoked_at IS NULL` | B-tree (부분) | "이 임원의 대리인 목록" 조회 (관리자 화면) | PERM-002 |

#### holidays

| 인덱스명 | 컬럼 | 유형 | 용도 | 비고 |
|----------|------|------|------|------|
| `holidays_pkey` | `(id)` | B-tree (PK) | PK 자동 | — |
| `uq_holidays_date_type_active` | `(holiday_date, type)` `WHERE deleted_at IS NULL` | B-tree (UNIQUE, 부분) | 동일 날짜+동일 유형 중복 방지 | HOL-001, HOL-002 |
| `idx_holidays_date_active` | `(holiday_date)` `WHERE deleted_at IS NULL AND is_active = true` | B-tree (부분) | **달력 렌더링 시 기간별 공휴일 조회** | CAL-006 |
| `idx_holidays_year_type_active` | `(year, type)` `WHERE deleted_at IS NULL` | B-tree (부분) | 연간 배치 시 기존 등록 확인 (HOL-001 idempotent 처리) | HOL-001 |

#### notification_logs

| 인덱스명 | 컬럼 | 유형 | 용도 | 비고 |
|----------|------|------|------|------|
| `notification_logs_pkey` | `(id)` | B-tree (PK) | PK 자동 | — |
| `idx_notif_recipient_status_created` | `(recipient_id, status, created_at DESC)` | B-tree | **수신자별 알림 이력 조회 (관리자 조회 화면)** | NOT-006 |
| `idx_notif_status_attempt` | `(status, attempt_count, last_attempted_at)` `WHERE status IN ('pending', 'retrying')` | B-tree (부분) | 재시도 워커가 처리 대상 픽업 (지수 백오프 스케줄링) | NOT-005 |
| `idx_notif_target` | `(target_type, target_id)` `WHERE target_id IS NOT NULL` | B-tree (부분) | 특정 일정의 알림 발송 이력 추적 | NOT-006 |
| `idx_notif_event_type_created` | `(event_type, created_at DESC)` | B-tree | 이벤트 유형별 발송 통계 | 운영 모니터링 |

#### audit_logs

| 인덱스명 | 컬럼 | 유형 | 용도 | 비고 |
|----------|------|------|------|------|
| `audit_logs_pkey` | `(id)` | B-tree (PK) | PK 자동 | — |
| `idx_audit_target_created` | `(target_type, target_id, created_at DESC)` | B-tree | **특정 일정/연락처의 변경 이력 타임라인 조회** | AUD-004 |
| `idx_audit_actor_created` | `(actor_id, created_at DESC)` | B-tree | 사용자별 활동 이력 (감사) | 관리자 감사 |
| `idx_audit_on_behalf_of` | `(on_behalf_of_id, created_at DESC)` `WHERE on_behalf_of_id IS NOT NULL` | B-tree (부분) | 대리 입력 이력 추적 | AUD-003 |
| `idx_audit_changed_fields_gin` | `(changed_fields)` `WHERE changed_fields IS NOT NULL` | GIN (부분) | 특정 필드(예: 'location') 변경 이력 검색 | 운영 분석 |

### 6-3. 풀텍스트 검색 인덱스

#### pg_trgm 확장 활용

본 시스템은 한국어 일정 내용·장소·연락처 이름의 **부분 일치 검색**(`ILIKE '%키워드%'`)이 빈번하므로 `pg_trgm` 확장의 GIN 인덱스를 사용한다.

```sql
CREATE EXTENSION IF NOT EXISTS pg_trgm;
```

| 대상 인덱스 | 사용처 | 검색 패턴 예시 |
|------------|--------|---------------|
| `idx_schedules_title_trgm` | LIS-003 키워드 검색 | `WHERE title ILIKE '%회의%'` |
| `idx_schedules_location_trgm` | LIS-003 장소 검색 | `WHERE location ILIKE '%본사%'` |
| `idx_contacts_name_trgm` | MEN-001 멘션 자동완성 부분 일치 | `WHERE name ILIKE '홍%'` |

#### GIN 인덱스 (배열·JSONB)

| 대상 인덱스 | 사용처 | 비고 |
|------------|--------|------|
| `idx_companies_aliases_gin` | 회사 별칭 배열 포함 검색 | `WHERE aliases && ARRAY['삼성']::text[]` |
| `idx_audit_changed_fields_gin` | 변경 필드 배열 포함 검색 | `WHERE changed_fields @> ARRAY['location']` |

#### 미적용 (Phase 1 범위 밖)

- `tsvector` + `to_tsvector('korean', ...)` 기반 풀텍스트 검색은 한국어 형태소 분석기 도입 비용이 크므로 Phase 1에서는 도입하지 않는다. `pg_trgm` 기반 부분 일치로 충분히 처리.
- 향후 데이터량이 크게 증가하면 OpenSearch / Elasticsearch 도입을 별도 검토.

### 6-4. 인덱스 운영 체크리스트

| 항목 | 권장 |
|------|------|
| 인덱스 생성 후 통계 업데이트 | `ANALYZE table_name;` 실행 |
| 부분 인덱스 활용 비율 모니터링 | `pg_stat_user_indexes`로 idx_scan 카운트 확인 |
| 미사용 인덱스 제거 | 6개월 이상 idx_scan = 0인 인덱스 검토 후 제거 |
| 부분 인덱스 조건 일치 | `WHERE deleted_at IS NULL` 조건은 쿼리에도 반드시 명시되어야 인덱스 사용 |
| 마이그레이션 시 CONCURRENT 옵션 | 운영 중 인덱스 생성은 `CREATE INDEX CONCURRENTLY` 사용 |
