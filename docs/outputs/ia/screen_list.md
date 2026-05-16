---
title: 임원 일정 관리 시스템 - 화면 인벤토리
version: "1.0"
date: 2026-05-11
category: IA
---

# 임원 일정 관리 시스템 — 화면 인벤토리 (Screen List)

본 문서는 시스템 전체 화면을 단일 표로 나열한 인벤토리이다. 사이트맵·메뉴 구조는 [`ia.md`](./ia.md) 참조. 권한은 "미인증 / 일반 임원 / 관리자" 3분류이며, 대리 입력 권한은 일반 임원에게 부여되는 추가 권한이므로 별도 컬럼으로 분리하지 않는다. Phase는 `00_overview.md` 정의를 따른다.

---

## 표 범례

| 컬럼 | 설명 |
|---|---|
| 화면 ID | SCR-* 식별자. 모달/패널/팝오버 포함 |
| 화면명 | 사용자 노출 명칭 |
| 화면군 | 인증 / 대시보드·일정 / 협업 / 관리자·데이터 / 공통 / 모달·패널 |
| 주요 기능 ID | 기능명세서의 기능 ID 매핑 (AUTH-*, SCH-*, COM-*, CAL-*, LIS-*, MEN-*, CON-*, HOL-*, RAD-*, REL-*, NOT-*, AUD-*, EXP-*, PERM-*) |
| 권한 | 미인증 / 일반 임원 / 관리자 |
| Phase | 1 (MVP) / 2 (협업) / 3 (분석·내보내기) |

---

## 화면 인벤토리

| 화면 ID | 화면명 | 화면군 | 주요 기능 ID | 권한 | Phase |
|---|---|---|---|---|:---:|
| SCR-LOGIN | 로그인 | 인증 | AUTH-002, AUTH-004 | 미인증 | 1 |
| SCR-PASSWORD-FIND | 비밀번호 찾기 (이메일 입력) | 인증 | AUTH-003, NOT-005 | 미인증 | 1 |
| SCR-PASSWORD-RESET | 비밀번호 재설정 (새 비밀번호 입력) | 인증 | AUTH-003 | 미인증 (토큰) | 1 |
| SCR-INVITE-ACCEPT | 초대 수락 (비밀번호 설정) | 인증 | AUTH-001, NOT-004 | 미인증 (토큰) | 1 |
| SCR-DASHBOARD | 대시보드 | 대시보드·일정 | AUTH-004, PERM-004 | 일반 임원 / 관리자 | 1 |
| SCR-CALENDAR | 달력 뷰 (월/주/일 통합) | 대시보드·일정 | CAL-001, CAL-002, CAL-003, CAL-004, CAL-005, CAL-006, CAL-008, CAL-009 | 일반 임원 / 관리자 | 1 |
| SCR-PANEL-DAY-DETAIL | 날짜 상세 펼침 패널 | 모달·패널 | CAL-007 | 일반 임원 / 관리자 | 1 |
| SCR-LIST | 리스트 뷰 | 대시보드·일정 | LIS-001, LIS-002, LIS-003, LIS-004, LIS-005, LIS-006, LIS-007, EXP-001 | 일반 임원 / 관리자 | 1 |
| SCR-MODAL-SCHEDULE-FORM | 일정 등록·수정 폼 모달 | 모달·패널 | SCH-001, SCH-003, SCH-006, COM-001, COM-003, MEN-001, RAD-004, RES-002 | 일반 임원 / 관리자 | 1 |
| SCR-MODAL-SCHEDULE-DETAIL | 일정 상세 모달 | 모달·패널 | SCH-005, COM-002, COM-004, PERM-003 | 일반 임원 / 관리자 | 1 |
| SCR-MODAL-CONFIRM-DELETE | 삭제 확인 모달 (일정/공휴일/연락처 공용) | 모달·패널 | SCH-004, COM-004, HOL-003, CON-003 | 일반 임원 / 관리자 (권한 범위 내) | 1 |
| SCR-MODAL-MENTION-NEW-CONTACT | 새 연락처 자동 등록 미니 다이얼로그 | 모달·패널 | MEN-001, MEN-002 | 일반 임원 / 관리자 | 2 |
| SCR-CONTACT | 연락처 (개인) | 관리자·데이터 | CON-001, CON-002, CON-003, CON-004, MEN-002 | 관리자 (CRUD) / 일반 임원 (조회) | 2 |
| SCR-CONTACT-COMPANY | 회사 (회사명·별칭) | 관리자·데이터 | CON-005 | 관리자 (CRUD) / 일반 임원 (조회) | 2 |
| SCR-ADMIN-USER | 사용자 관리 (초대·역할·활성화) | 관리자·데이터 | AUTH-001, PERM-001, NOT-004 | 관리자 | 1 |
| SCR-ADMIN-PROXY | 대리권한 관리 | 관리자·데이터 | PERM-002 | 관리자 | 2 |
| SCR-ADMIN-HOLIDAY | 공휴일 관리 (법정/대체/임시) | 관리자·데이터 | HOL-001, HOL-002, HOL-003, HOL-004 | 관리자 | 2 |
| SCR-ADMIN-NOTIFICATION-LOG | 알림 발송 이력 | 관리자·데이터 | NOT-006 | 관리자 | 2 |
| SCR-RADAR | 모임 레이더 | 협업 | RAD-001, RAD-002, RAD-003, RAD-004 | 일반 임원 / 관리자 | 3 |
| SCR-POPOVER-RELATIONSHIP | 관계 히스토리 카드 (모바일은 바텀시트) | 협업 | REL-001, REL-002, REL-003 | 일반 임원 / 관리자 | 3 |
| SCR-MODAL-AUDIT-LOG | 일정 이력 모달 (타임라인) | 모달·패널 | AUD-001, AUD-002, AUD-003, AUD-004 | 일반 임원 (본인 일정만) / 관리자 (전체) | 3 |
| SCR-MY | 마이 페이지 (프로필·비밀번호 변경·로그아웃) | 공통 | AUTH-004 | 일반 임원 / 관리자 | 1 |
| SCR-NOTIFICATION | 알림 센터 (벨 드롭다운 + 전체 페이지) | 공통 | NOT-001, NOT-002, NOT-003, NOT-006 | 일반 임원 / 관리자 | 2 |
| SCR-ERROR-403 | 권한 없음 (Forbidden) | 공통 | PERM-001, PERM-004 | 모두 | 1 |
| SCR-ERROR-404 | 페이지 없음 (Not Found) | 공통 | — | 모두 | 1 |

---

## 보충 설명

### 화면 단위 식별 원칙

- **단일 화면 내 뷰 토글**은 별도 화면으로 분리하지 않는다. 예: SCR-CALENDAR 내부의 월/주/일 뷰는 동일 화면 상태 변경.
- **인라인 모드 전환**은 별도 화면으로 분리하지 않는다. 예: SCR-LIST의 빠른 입력(LIS-002), 인라인 편집(LIS-007)은 SCR-LIST 내부 상태.
- **모달/패널/팝오버**는 사용자가 식별 가능한 독립 UI이므로 SCR-MODAL-* / SCR-PANEL-* / SCR-POPOVER-* 접두사로 별도 식별한다.
- **엑셀 다운로드(EXP-001)는 화면이 아니라 SCR-LIST 내부 액션**으로 처리한다.

### 기능 ID와의 매핑 주의 사항

- 일정 등록·수정 폼은 개인(SCH-001, SCH-003)과 공통(COM-001, COM-003)이 같은 SCR-MODAL-SCHEDULE-FORM 안에서 일정 유형 토글로 구분된다.
- 대리 입력(SCH-006, PERM-003)은 별도 화면이 아니라 SCR-MODAL-SCHEDULE-FORM 내부에 "입력 대상" 드롭다운으로 노출되며, 권한 보유자에게만 활성화된다.
- 알림 발송 이력(NOT-006)과 일정 이력(AUD-001~004)은 서로 다른 데이터를 다룬다.
  - NOT-006 → SCR-ADMIN-NOTIFICATION-LOG (관리자 전용 별도 화면)
  - AUD-001~004 → SCR-MODAL-AUDIT-LOG (개별 일정 상세 모달의 하위 탭)
- 알림 표시 측면에서 NOT-001~003은 SCR-NOTIFICATION에 사용자 노출되고, NOT-006은 발송 측 이력으로 SCR-ADMIN-NOTIFICATION-LOG에 노출된다.
- HOL-001 (법정 공휴일 자동 등록 배치)은 화면 없이 백그라운드 실행되며, 결과만 SCR-ADMIN-HOLIDAY에서 확인한다.
- 반응형 명세(RES-001, RES-002)는 전 화면에 횡적으로 적용되는 비기능 요건이므로 본 인벤토리에서는 SCR-MODAL-SCHEDULE-FORM(RES-002 입력 폼) 등 강하게 결합된 화면에만 표기한다.

### Phase 산정 기준

화면의 Phase는 "그 화면이 처음 의미를 갖는 시점"으로 잡는다.

- SCR-CONTACT, SCR-CONTACT-COMPANY → Phase 2 (CON-* 기능이 Phase 2)
- SCR-ADMIN-PROXY → Phase 2 (PERM-002가 Phase 2)
- SCR-ADMIN-HOLIDAY → Phase 2 (HOL-* 기능이 Phase 2)
- SCR-RADAR, SCR-POPOVER-RELATIONSHIP, SCR-MODAL-AUDIT-LOG → Phase 3 (분석 기능군)
- SCR-NOTIFICATION → Phase 2 (알림 기능 NOT-*이 Phase 2)
- SCR-ADMIN-NOTIFICATION-LOG → Phase 2 (NOT-006 이력 기록)

---
