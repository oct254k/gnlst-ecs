---
title: 임원 일정 관리 시스템 - 문서 cross-reference 인덱스
version: "1.0"
date: 2026-05-13
category: 메타 / 인덱스
---

# 문서 cross-reference 인덱스

## 1. 개요

본 문서는 `docs/outputs/` 하위의 5개 카테고리(`requirement/`, `ia/`, `process/`, `spec/`, `erd/`) 간 매핑을 한 곳에서 확인할 수 있도록 정리한 단일 진실 공급원(SSOT)이다.

### 1.1 목적

- 화면(IA) ↔ 기능명세(Spec) ↔ 프로세스(Process) ↔ 데이터 모델(ERD) 사이의 연관 관계를 한 표로 추적할 수 있게 한다.
- 신규 멤버 온보딩 시 "이 화면은 어떤 명세를 보면 되는가", "이 명세는 어떤 테이블을 쓰는가" 같은 질문에 즉시 답할 수 있게 한다.
- 카테고리별 문서를 수정할 때 영향 범위를 파악하는 진입점이 된다.

### 1.2 갱신 정책

- 각 카테고리 문서(요건/IA/Process/Spec/ERD)가 변경되어 식별자(SCR-/PROC-/기능 ID/테이블명) 가 추가·삭제·이름 변경되면, 본 문서도 같은 PR 내에서 갱신한다.
- 매핑이 변경되었으나 본 문서가 갱신되지 않은 경우 9장 "변경 이력"에 사후 기록한다.
- 매핑이 불확실하거나 다른 문서 간 충돌이 있는 항목은 `(검토 필요)` 표시를 유지한다.

---

## 2. 카테고리 구성 요약

| 카테고리 | 파일 수 | 핵심 식별자 체계 | 책임 범위 |
|---|---:|---|---|
| `requirement/` | 1 | (식별자 없음, 자유 서술) | 시스템 요건 원문. 다른 모든 카테고리의 출발점 |
| `ia/` | 2 | `SCR-*` (화면 ID) | 사이트맵·메뉴 구조(`ia.md`), 25개 화면 인벤토리(`screen_list.md`) |
| `process/` | 11 | `PROC-<도메인>-NNN` | 도메인별 비즈니스 프로세스 흐름 정의 |
| `spec/` | 16 | `AUTH-* PERM-* SCH-* COM-* CAL-* LIS-* MEN-* CON-* HOL-* RAD-* REL-* NOT-* AUD-* EXP-* RES-*` | 기능 단위 명세서 (`14_api.md`, `15_supabase_design.md` 포함) |
| `erd/` | 3 | `E01~E10` 테이블명 | 데이터 모델(`erd.md`), 인덱스, 시드 |

> 식별자 체계는 각 카테고리 문서 내부에서 자율적으로 관리되며, 본 문서에서는 매핑만 다룬다.

---

## 3. 화면(IA) ↔ 화면명세(Spec) 매핑

`ia/screen_list.md` 기준 25개 화면. "주요 기능 ID" 컬럼의 기능 ID가 어느 spec 파일에 정의되어 있는지를 매핑한다. 관련 Process 컬럼은 화면이 트리거하거나 직접 관여하는 프로세스만 표기한다.

| 화면 ID | 화면명 | 관련 Spec 파일 | 관련 Process |
|---|---|---|---|
| SCR-LOGIN | 로그인 | `spec/01_auth.md` | `process/proc_01_auth.md` (PROC-AUTH-002) |
| SCR-PASSWORD-FIND | 비밀번호 찾기 (이메일 입력) | `spec/01_auth.md`, `spec/11_notification.md` | `process/proc_01_auth.md` (PROC-AUTH-003), `process/proc_05_notification.md` (PROC-NOT-005) |
| SCR-PASSWORD-RESET | 비밀번호 재설정 (새 비밀번호 입력) | `spec/01_auth.md` | `process/proc_01_auth.md` (PROC-AUTH-003) |
| SCR-INVITE-ACCEPT | 초대 수락 (비밀번호 설정) | `spec/01_auth.md`, `spec/11_notification.md` | `process/proc_01_auth.md` (PROC-AUTH-001), `process/proc_05_notification.md` (PROC-NOT-004) |
| SCR-DASHBOARD | 대시보드 | `spec/01_auth.md`, `spec/02_permission.md` | `process/proc_01_auth.md` (PROC-AUTH-004), `process/proc_02_permission.md` (PROC-PERM-001) |
| SCR-CALENDAR | 달력 뷰 (월/주/일 통합) | `spec/05_calendar_view.md` | (직접 트리거 프로세스 없음 — 조회 위주) |
| SCR-PANEL-DAY-DETAIL | 날짜 상세 펼침 패널 | `spec/05_calendar_view.md` (CAL-007) | (직접 트리거 프로세스 없음) |
| SCR-LIST | 리스트 뷰 | `spec/06_list_view.md`, `spec/13_export_responsive.md` (EXP-001) | `process/proc_10_export.md` (PROC-EXP-001) |
| SCR-MODAL-SCHEDULE-FORM | 일정 등록·수정 폼 모달 | `spec/03_schedule.md`, `spec/07_common_schedule.md`, `spec/04_mention_contact.md` (MEN-001), `spec/09_meeting_radar.md` (RAD-004), `spec/13_export_responsive.md` (RES-002) | `process/proc_03_schedule.md` (PROC-SCH-001~003), `process/proc_04_mention_contact.md` (PROC-MEN-001) |
| SCR-MODAL-SCHEDULE-DETAIL | 일정 상세 모달 | `spec/03_schedule.md` (SCH-005), `spec/07_common_schedule.md` (COM-002, COM-004), `spec/02_permission.md` (PERM-003) | `process/proc_03_schedule.md` (PROC-SCH-005), `process/proc_02_permission.md` (PROC-PERM-003) |
| SCR-MODAL-CONFIRM-DELETE | 삭제 확인 모달 (일정/공휴일/연락처 공용) | `spec/03_schedule.md` (SCH-004), `spec/07_common_schedule.md` (COM-004), `spec/08_holiday.md` (HOL-003), `spec/04_mention_contact.md` (CON-003) | `process/proc_03_schedule.md` (PROC-SCH-004), `process/proc_08_holiday.md` (PROC-HOL-003), `process/proc_04_mention_contact.md` (PROC-CON-001, 삭제 분기) |
| SCR-MODAL-MENTION-NEW-CONTACT | 새 연락처 자동 등록 미니 다이얼로그 | `spec/04_mention_contact.md` (MEN-001, MEN-002) | `process/proc_04_mention_contact.md` (PROC-MEN-001, PROC-MEN-002) |
| SCR-CONTACT | 연락처 (개인) | `spec/04_mention_contact.md` (CON-001~004, MEN-002) | `process/proc_04_mention_contact.md` (PROC-CON-001, PROC-MEN-002) |
| SCR-CONTACT-COMPANY | 회사 (회사명·별칭) | `spec/04_mention_contact.md` (CON-005) | `process/proc_04_mention_contact.md` (PROC-CON-001, 회사 관리 분기) |
| SCR-ADMIN-USER | 사용자 관리 (초대·역할·활성화) | `spec/01_auth.md` (AUTH-001), `spec/02_permission.md` (PERM-001), `spec/11_notification.md` (NOT-004) | `process/proc_01_auth.md` (PROC-AUTH-001), `process/proc_02_permission.md` (PROC-PERM-001), `process/proc_05_notification.md` (PROC-NOT-004) |
| SCR-ADMIN-PROXY | 대리권한 관리 | `spec/02_permission.md` (PERM-002) | `process/proc_02_permission.md` (PROC-PERM-002) |
| SCR-ADMIN-HOLIDAY | 공휴일 관리 (법정/대체/임시) | `spec/08_holiday.md` (HOL-001~004) | `process/proc_08_holiday.md` (PROC-HOL-001~003) |
| SCR-ADMIN-NOTIFICATION-LOG | 알림 발송 이력 | `spec/11_notification.md` (NOT-006) | `process/proc_05_notification.md` (PROC-NOT-001~005, 발송 결과 기록) |
| SCR-RADAR | 모임 레이더 | `spec/09_meeting_radar.md` (RAD-001~004) | `process/proc_06_meeting_radar.md` (PROC-RAD-001) |
| SCR-POPOVER-RELATIONSHIP | 관계 히스토리 카드 (모바일은 바텀시트) | `spec/10_relationship_history.md` (REL-001~003) | `process/proc_07_relationship_history.md` (PROC-REL-001) |
| SCR-MODAL-AUDIT-LOG | 일정 이력 모달 (타임라인) | `spec/12_audit_log.md` (AUD-001~004) | `process/proc_09_audit_log.md` (PROC-AUD-001~004) |
| SCR-MY | 마이 페이지 (프로필·비밀번호 변경·로그아웃) | `spec/01_auth.md` (AUTH-004) | `process/proc_01_auth.md` (PROC-AUTH-004) |
| SCR-NOTIFICATION | 알림 센터 (벨 드롭다운 + 전체 페이지) | `spec/11_notification.md` (NOT-001~003, NOT-006) | `process/proc_05_notification.md` (PROC-NOT-001~003) |
| SCR-ERROR-403 | 권한 없음 (Forbidden) | `spec/02_permission.md` (PERM-001, PERM-004) | `process/proc_02_permission.md` (PROC-PERM-001) |
| SCR-ERROR-404 | 페이지 없음 (Not Found) | (해당 spec 없음) | (해당 process 없음) |

> 매핑 근거: `spec/` 파일 상단의 기능 ID 목록과 `screen_list.md` "주요 기능 ID" 컬럼을 1:1 대조하여 작성. `PROC-CON-001`은 `proc_04_mention_contact.md` 개요(L191)에서 "관리자가 연락처(`contacts`) 및 회사(`companies`) 데이터를 직접 등록, 수정, 삭제하는 프로세스"로 정의되어 있으며, 메인 플로우(L209~259)에서 등록/수정/삭제/회사 관리의 4개 분기를 모두 명시하므로 CON-003(삭제)와 CON-005(회사 관리) 모두 단일 PROC-CON-001 내 분기로 확정한다.

---

## 4. Process ↔ Spec 매핑

`process/` 폴더 11개 파일 기준. 각 프로세스 파일이 다루는 도메인, 대응하는 spec 파일(들), 사용하는 ERD 테이블을 정리한다.

| PROC 파일 | 다루는 도메인 | 대응 Spec 파일 | 관련 ERD 테이블 |
|---|---|---|---|
| `proc_00_index.md` | 전체 인덱스 (메타) | (전체 spec 색인) | — |
| `proc_01_auth.md` | 인증 (PROC-AUTH-001~004) | `spec/01_auth.md` | `users`, `notification_logs` |
| `proc_02_permission.md` | 권한 (PROC-PERM-001~003, PROC-AUTH-004 재참조) | `spec/02_permission.md` | `users`, `proxy_permissions`, `audit_logs` |
| `proc_03_schedule.md` | 일정 등록·수정·삭제·조회·대리 (PROC-SCH-001~005, PROC-MEN-001 보조 호출) | `spec/03_schedule.md`, `spec/05_calendar_view.md`, `spec/06_list_view.md`, `spec/07_common_schedule.md` | `schedules`, `schedule_participants`, `mentions`, `audit_logs`, `notification_logs` |
| `proc_04_mention_contact.md` | 멘션·연락처 (PROC-MEN-001~002, PROC-CON-001) | `spec/04_mention_contact.md` | `mentions`, `contacts`, `companies` |
| `proc_05_notification.md` | 알림 발송 (PROC-NOT-001~005) | `spec/11_notification.md` | `notification_logs`, `users`, `schedules` |
| `proc_06_meeting_radar.md` | 모임 레이더 (PROC-RAD-001, PROC-SCH-001 호출) | `spec/09_meeting_radar.md` | `users`, `schedules`, `schedule_participants` |
| `proc_07_relationship_history.md` | 관계 히스토리 (PROC-REL-001) | `spec/10_relationship_history.md` | `mentions`, `schedules`, `contacts`, `companies` |
| `proc_08_holiday.md` | 공휴일 (PROC-HOL-001~003) | `spec/08_holiday.md` | `holidays` |
| `proc_09_audit_log.md` | 이력 (PROC-AUD-001~004) | `spec/12_audit_log.md` | `audit_logs`, `schedules`, `users` |
| `proc_10_export.md` | 엑셀 내보내기 (PROC-EXP-001) | `spec/13_export_responsive.md` (EXP-001) | `schedules`, `schedule_participants`, `mentions` |

> `proc_03_schedule.md` 는 일정 등록·수정·삭제·조회 프로세스 전체를 다루므로, 표시 측면의 명세(달력/리스트/공통일정)인 `spec/05`, `spec/06`, `spec/07` 도 함께 참조 대상이다. `proc_00_index.md` 는 인덱스라 1:1 대응 spec 가 없다.

---

## 5. Spec ↔ ERD 테이블 매핑

`spec/` 14개 파일 기준. 각 spec 가 정의하는 주요 기능 ID 와, 그 기능이 읽고/쓰는 ERD 테이블을 매핑한다.

| Spec 파일 | 주요 기능 ID | 사용 ERD 테이블 | 비고 |
|---|---|---|---|
| `00_overview.md` | (메타: AUTH/PERM/SCH 등 전반 색인) | (전체 참조) | 카테고리·역할·Phase 정의. 직접 테이블 사용 없음 |
| `01_auth.md` | AUTH-001~004 | `users`, `notification_logs` | 초대 메일은 `notification_logs`에 기록 |
| `02_permission.md` | PERM-001~004 (+ AUTH-004 재참조) | `users`, `proxy_permissions`, `audit_logs` | 대리 입력 실행은 `audit_logs` 의 `on_behalf_of_*` 컬럼 사용 |
| `03_schedule.md` | SCH-001~006 (+ MEN-001 참조) | `schedules`, `schedule_participants`, `mentions`, `audit_logs`, `notification_logs` | 대리 입력 시 `schedules.on_behalf_of_id` 사용 |
| `04_mention_contact.md` | MEN-001~002, CON-001~005 | `mentions`, `contacts`, `companies` | 멘션 다형성: `mentions.reference_type` + `reference_id` |
| `05_calendar_view.md` | CAL-001~009 | `schedules`, `schedule_participants`, `holidays`, `users` | 표시 전용. 직접 CUD 없음 |
| `06_list_view.md` | LIS-001~007 | `schedules`, `schedule_participants`, `mentions`, `users` | 인라인 편집(LIS-007)은 `schedules` 업데이트 |
| `07_common_schedule.md` | COM-001~004 | `schedules` (type=`common`), `schedule_participants`, `notification_logs` | 수락/거절 없음, 본인이 직접 참가자 목록에 추가 |
| `08_holiday.md` | HOL-001~004 | `holidays` | HOL-001은 백그라운드 배치 (화면 없음) |
| `09_meeting_radar.md` | RAD-001~004 (+ SCH-001 호출) | `users`, `schedules`, `schedule_participants` | 충돌 계산만 수행. 일정 생성은 SCH-001로 위임 |
| `10_relationship_history.md` | REL-001~003 | `mentions`, `schedules`, `contacts`, `companies` | 멘션 기반 집계 조회 |
| `11_notification.md` | NOT-001~006 | `notification_logs`, `users`, `schedules` | NOT-006은 발송 측 이력 조회 |
| `12_audit_log.md` | AUD-001~004 | `audit_logs`, `schedules`, `users` | 불변(immutable) 로그 |
| `13_export_responsive.md` | EXP-001~002, RES-001~002 | `schedules`, `schedule_participants`, `mentions` | RES-*는 비기능 요건이라 직접 테이블 미사용 |
| `14_api.md` | (메타: AUTH~EXP 전반 API 명세) | (전체 참조) | REST 엔드포인트 정의 전문. 기존 기능 ID에 1:1 매핑. 직접 테이블 CRUD는 없음 (각 spec 위임) |
| `15_supabase_design.md` | (구현 레이어 설계) | (전체 참조) | Vercel+Supabase 구현 레이어 분류, RLS 정책, PostgreSQL 함수/트리거, Edge Function 명세 |

> 매핑 근거: 각 spec 파일 상단의 기능 ID 목록(grep으로 확인)과 `erd/erd.md` 의 10개 엔티티(`E01~E10`)를 대조. `mentions` 의 FK 미설정(다형성)은 `erd.md` 본문 명시.

---

## 6. ERD 테이블 ↔ 기능 역참조

`erd/erd.md` 의 10개 엔티티 각각이 어느 spec/process 에서 사용되는지를 역참조 형태로 정리한다.

| 테이블명 | 도메인 | 관련 Spec | 관련 Process |
|---|---|---|---|
| `users` | 인증·권한 (사용자 마스터) | `spec/01_auth.md`, `spec/02_permission.md`, `spec/05_calendar_view.md`, `spec/06_list_view.md`, `spec/09_meeting_radar.md`, `spec/11_notification.md`, `spec/12_audit_log.md` | `proc_01_auth.md`, `proc_02_permission.md`, `proc_05_notification.md`, `proc_06_meeting_radar.md`, `proc_09_audit_log.md` |
| `companies` | 멘션·연락처 | `spec/04_mention_contact.md` (CON-005), `spec/10_relationship_history.md` | `proc_04_mention_contact.md`, `proc_07_relationship_history.md` |
| `contacts` | 멘션·연락처 | `spec/04_mention_contact.md` (CON-001~004, MEN-002), `spec/10_relationship_history.md` | `proc_04_mention_contact.md`, `proc_07_relationship_history.md` |
| `schedules` | 일정 (개인/공통 통합) | `spec/03_schedule.md`, `spec/05_calendar_view.md`, `spec/06_list_view.md`, `spec/07_common_schedule.md`, `spec/09_meeting_radar.md`, `spec/10_relationship_history.md`, `spec/11_notification.md`, `spec/12_audit_log.md`, `spec/13_export_responsive.md` | `proc_03_schedule.md`, `proc_05_notification.md`, `proc_06_meeting_radar.md`, `proc_07_relationship_history.md`, `proc_09_audit_log.md`, `proc_10_export.md` |
| `schedule_participants` | 공통 일정 참가자 | `spec/05_calendar_view.md`, `spec/06_list_view.md`, `spec/07_common_schedule.md`, `spec/09_meeting_radar.md`, `spec/13_export_responsive.md` | `proc_03_schedule.md`, `proc_06_meeting_radar.md`, `proc_10_export.md` |
| `mentions` | 일정의 @태그 (다형성) | `spec/03_schedule.md`, `spec/04_mention_contact.md`, `spec/06_list_view.md`, `spec/10_relationship_history.md`, `spec/13_export_responsive.md` | `proc_03_schedule.md`, `proc_04_mention_contact.md`, `proc_07_relationship_history.md`, `proc_10_export.md` |
| `proxy_permissions` | 대리 입력 권한 | `spec/02_permission.md` (PERM-002, PERM-003) | `proc_02_permission.md` |
| `audit_logs` | 일정 이력 (불변 로그) | `spec/02_permission.md`, `spec/03_schedule.md`, `spec/12_audit_log.md` | `proc_02_permission.md`, `proc_03_schedule.md`, `proc_09_audit_log.md` |
| `holidays` | 공휴일 | `spec/05_calendar_view.md` (배경 오버레이), `spec/08_holiday.md` | `proc_08_holiday.md` |
| `notification_logs` | 알림 발송 이력 | `spec/01_auth.md` (초대/비번찾기 메일), `spec/03_schedule.md`, `spec/07_common_schedule.md`, `spec/11_notification.md` | `proc_01_auth.md`, `proc_03_schedule.md`, `proc_05_notification.md` |

> 매핑 근거: `erd.md` 의 각 엔티티 상세 정의(E01~E10)와 5장의 Spec ↔ ERD 매핑을 역집계.

---

## 7. 기능 ID 색인

spec 파일에서 정의된 기능 ID를 도메인 접두사·번호 순으로 정렬하고, 정의된 spec 파일 위치를 매핑한다. (도메인 접두사 알파벳 순)

| 기능 ID | 정의 위치 |
|---|---|
| AUD-001 ~ AUD-004 | `spec/12_audit_log.md` |
| AUTH-001 ~ AUTH-004 | `spec/01_auth.md` |
| CAL-001 ~ CAL-009 | `spec/05_calendar_view.md` |
| COM-001 ~ COM-004 | `spec/07_common_schedule.md` |
| CON-001 ~ CON-005 | `spec/04_mention_contact.md` |
| EXP-001, EXP-002 | `spec/13_export_responsive.md` |
| HOL-001 ~ HOL-004 | `spec/08_holiday.md` |
| LIS-001 ~ LIS-007 | `spec/06_list_view.md` |
| MEN-001, MEN-002 | `spec/04_mention_contact.md` (`spec/03_schedule.md` 에서 참조) |
| NOT-001 ~ NOT-006 | `spec/11_notification.md` |
| PERM-001 ~ PERM-004 | `spec/02_permission.md` |
| RAD-001 ~ RAD-004 | `spec/09_meeting_radar.md` |
| REL-001 ~ REL-003 | `spec/10_relationship_history.md` |
| RES-001, RES-002 | `spec/13_export_responsive.md` |
| SCH-001 ~ SCH-006 | `spec/03_schedule.md` (`spec/09_meeting_radar.md` 에서 SCH-001 참조) |

> `screen_list.md` 의 "주요 기능 ID" 컬럼에 표기된 모든 접두사를 망라했다. `00_overview.md` 는 색인 성격이므로 정의 위치로 잡지 않았다.

---

## 8. 불확실 매핑 / 검토 필요 항목

5장 및 본 문서 작성 과정에서 확정하지 못한 매핑 또는 다른 문서와의 충돌을 모아둔다. 본문에는 해당 행 끝에 `(검토 필요)` 표시를 유지한다.

| 항목 | 위치 | 사유 |
|---|---|---|
| (현재 없음) | — | 직전 검토 필요 2건(SCR-MODAL-CONFIRM-DELETE↔PROC-CON-001, SCR-CONTACT-COMPANY↔PROC-CON-001)은 2026-05-14 본문 정독 결과 확정됨. 아래 "해소된 항목" 참조. |

### 8.1 해소된 항목 (2026-05-14)

| 항목 | 결정 | 근거 |
|---|---|---|
| SCR-MODAL-CONFIRM-DELETE(CON-003) ↔ PROC-CON-001 | **확정 매핑** (삭제 분기로 포함) | `process/proc_04_mention_contact.md` 메인 플로우 D1~D8(L233~242)에서 "삭제 대상 선택 → 기존 멘션 수 조회 → 경고 다이얼로그 → 소프트 삭제 → mentions 표시명 갱신" 단계를 명시. 세부 처리 규칙 "연락처 삭제 (소프트 삭제)"(L271~274) 및 `spec/04_mention_contact.md` CON-003 처리 흐름 2단계 "확인 다이얼로그를 표시한다"(L362~363)와 일치. |
| SCR-CONTACT-COMPANY(CON-005) ↔ PROC-CON-001 | **확정 매핑** (회사 관리 분기로 포함) | `process/proc_04_mention_contact.md` 개요(L190~191)에서 "관리자가 연락처(`contacts`) 및 회사(`companies`) 데이터를 직접 등록, 수정, 삭제하는 프로세스"로 명시. 메인 플로우 C1~C8(L245~253) "회사 관리" 분기와 세부 처리 규칙 "회사 관리"(L276~279)에서 `companies` 테이블의 등록/수정/삭제/별칭 중복 검사를 PROC-CON-001 내부 동작으로 정의. 연관 테이블에 `companies`도 포함(L318). |

---

## 9. 변경 이력

| 날짜 | 변경 내용 | 변경자 |
|---|---|---|
| 2026-05-13 | 최초 작성 (5개 카테고리 31개 문서 기준 4-way 매핑 초안) | — |
| 2026-05-14 | 8장 불확실 매핑 2건(SCR-MODAL-CONFIRM-DELETE↔PROC-CON-001 삭제 분기, SCR-CONTACT-COMPANY↔PROC-CON-001 회사 관리 분기) 본문 정독 후 확정. 3장 11/14행 `(검토 필요)` 표기를 분기 명시로 갱신하고 8.1 "해소된 항목" 절 추가. | — |
| 2026-05-14 | screen_design 라운드 후속: spec/process 의 ERD 불일치 컬럼명 일괄 정정 (spec/08 `holidays` camelCase→snake_case 12건, spec/12 `audit_logs` 컬럼 4건+enum 1건, proc_02 `is_proxy`/`proxy_permissions`/`audit_logs` 컬럼 10건, proc_04 `contacts.aliases` 1건, proc_05 `notification_logs` 컬럼 8건+재시도 간격 spec/11 채택, proc_07 `schedules` 컬럼 2건, proc_08 `holidays.type='legal'`→`statutory` 2건+컬럼 표기, proc_09 `audit_logs`/`schedules`/`proxy_permissions` 12건, proc_10 엑셀 출력 컬럼 7건). SSOT 우선순위(§5.4 ERD > spec > process) 적용. | claude |
| 2026-05-14 | ERD 보강 라운드: `notification_logs.read_at` (timestamptz, NULLABLE) 컬럼 신설. spec/11 NOT-006 데이터 모델 + scr_00·scr_11 데이터 바인딩 정식화, 이슈 메모 §10 의 read_at 임시 정의 3건 RESOLVED. | claude |
| 2026-05-14 | Supabase 구현 레이어 설계: spec/15_supabase_design.md 신규 작성. 36개 엔드포인트 A/B/C/D 레이어 분류, 10개 테이블 RLS 정책, PostgreSQL 함수 4개+트리거 6개, Supabase Edge Function 3개, 환경 변수 목록, Next.js 파일 구조 명세. spec 파일 수 15→16, 5장 매핑 추가. | claude |
| 2026-05-14 | 화면 가시성 검토 + API 정의 라운드: spec/14_api.md 신규 작성 (REST API 엔드포인트 전체 정의, 36개 엔드포인트, 에러 코드 목록). spec/05 CAL-001 이벤트 오버플로우 규칙(최대 3개+배지) 추가. spec/06 LIS-001 컬럼 렌더링 규칙(ellipsis·임원칩 축약·sticky thead) 추가. spec/07 COM-002 참가자 목록 max-height(320px) + 카운터 표시 추가. spec/09 RAD-003 격자 sticky 헤더·모바일 5일 뷰 규칙 추가. spec/11 NOT-006 관리자 이력 화면 실패 강조 배지 규칙 추가. | claude |
| 2026-05-14 | 결정 라운드 — 공통 일정 등록 권한: **admin only → 모든 인증 사용자(user/admin)** 변경 (등록자 본인 또는 admin 만 삭제). spec/00·spec/02·spec/07·common_layout.md·ia.md §4·scr_03·scr_05·scr_06·scr_07 모두 갱신. scr_07 이슈 메모 RESOLVED. | claude |
| 2026-05-14 | 결정 라운드 — EXP-001 구현 방식 확정: **클라이언트 생성 + 13컬럼 + 날짜 범위 선택(최대 1년)**. proc_10 본문 전면 정정 (개요·플로우·예외·컬럼 정의 13컬럼·파일명 패턴). scr_13 이슈 메모 RESOLVED. | claude |
