---
title: 임원 일정 관리 시스템 - 시스템 개요
version: "1.0"
date: 2026-05-11
category: 기능명세서
---

# 임원 일정 관리 시스템 — 시스템 개요

**관련 프로세스**: [process/proc_00_index.md](../process/proc_00_index.md)

## 1. 시스템 목적

임원 일정 관리 시스템은 기업 임원의 개인 일정, 공통 일정, 외부 약속 등을 통합 관리하고, 비서/담당자가 임원을 대신해 일정을 등록·수정할 수 있는 **대리 입력 기능**을 갖춘 내부 웹 애플리케이션이다.

### 핵심 목표

| 목표 | 설명 |
|------|------|
| 일정 중앙화 | 임원별 일정을 단일 플랫폼에서 관리 |
| 접근 제어 | 역할(관리자/일반)에 따른 조회·수정 권한 분리 |
| 대리 입력 | 비서가 임원 명의로 일정 등록, 이중 감사 로그 유지 |
| 알림·연동 | 공휴일 자동 연동, 관계자 멘션, 이메일 알림 |
| 데이터 활용 | 모임 레이더, 관계 히스토리, 엑셀 내보내기 |

---

## 2. 사용자 역할 정의

### 2.1 역할 목록

| 역할 코드 | 역할명 | 설명 |
|-----------|--------|------|
| `ADMIN` | 관리자 | 시스템 전반을 관리하는 운영 담당자 (IT 관리자, 수석 비서 등) |
| `USER` | 일반 사용자 | 임원 본인 또는 일반 비서. 본인 일정 등록/수정, 전체 일정 조회 가능 |
| `PROXY` | 대리 입력자 | 관리자로부터 특정 임원의 일정 대리 입력 권한을 부여받은 사용자 |

> **주의:** `PROXY`는 별도 역할이 아니라 `USER`에 대한 추가 권한이다.  
> 한 사용자가 여러 임원에 대해 대리 입력 권한을 가질 수 있다.

### 2.2 역할별 권한 요약

| 기능 | 관리자 (`ADMIN`) | 일반 (`USER`) | 대리 입력 (`PROXY`) |
|------|:---:|:---:|:---:|
| 전체 일정 조회 | ✅ | ✅ | ✅ |
| 본인 일정 등록/수정 | ✅ | ✅ | ✅ |
| 타인 일정 수정 | ✅ | ❌ | 지정 대상만 |
| 공통 일정 등록/수정 | ✅ | ✅ | ✅ |
| 사용자 초대 | ✅ | ❌ | ❌ |
| 대리 입력 권한 부여 | ✅ | ❌ | ❌ |
| 공휴일 관리 | ✅ | ❌ | ❌ |
| 연락처 관리 | ✅ | ❌ | ❌ |
| 엑셀 다운로드 | ✅ | ✅ | ✅ |

---

## 3. Phase별 기능 범위

### Phase 1 — 핵심 기능 (MVP)

| 기능 ID | 기능명 | 설명 |
|---------|--------|------|
| SCH-001 | 일정 CRUD | 일정 생성, 조회, 수정, 삭제 |
| SCH-002 | 달력 뷰 | 월간/주간/일간 뷰 |
| SCH-003 | 리스트 뷰 | 날짜순 일정 목록 조회 |
| SCH-004 | 공통 일정 | 전직원 공유 일정 (관리자 등록) |
| AUTH-001 | 관리자 초대 | 초대 메일 → 링크 → 비밀번호 설정 |
| AUTH-002 | 로그인 | 메일+비번 / 사번+비번 |
| AUTH-003 | 비밀번호 찾기 | 메일 인증 후 재설정 |
| AUTH-004 | 세션 관리 | 인증 기반 세션 유지 |
| PERM-001 | 역할 기반 접근 제어 | 관리자/일반 권한 분리 |
| PERM-004 | 권한별 UI 제어 | 역할에 따른 메뉴/버튼 노출 |

### Phase 2 — 협업 기능

| 기능 ID | 기능명 | 설명 |
|---------|--------|------|
| COLLAB-001 | @ 멘션 | 일정 상세에서 관계자 멘션 |
| COLLAB-002 | 연락처 관리 | 외부 인물 연락처 DB (관리자) |
| COLLAB-003 | 공휴일 연동 | 공공 API 연동 또는 수동 등록 |
| PERM-002 | 대리 입력 권한 부여 | 관리자가 A→B 대리 입력 권한 설정 |
| PERM-003 | 대리 입력 실행 | A가 B 이름으로 일정 등록 |
| NOTI-001 | 알림 | 일정 등록·변경 시 이메일 알림 |

### Phase 3 — 분석 / 내보내기

| 기능 ID | 기능명 | 설명 |
|---------|--------|------|
| ANAL-001 | 모임 레이더 | 임원별 외부 미팅 빈도·인물 분석 |
| ANAL-002 | 관계 히스토리 | 특정 인물과의 과거 일정 이력 |
| ANAL-003 | 변경 이력 | 일정 수정·삭제 감사 로그 |
| EXPORT-001 | 엑셀 다운로드 | 기간별 일정 xlsx 내보내기 |

---

## 4. 데이터 모델 개요

### 주요 테이블

| 테이블 | 설명 |
|--------|------|
| `users` | 시스템 사용자 프로필 (사번, 이름, 역할 포함) |
| `proxy_permissions` | 대리 입력 권한 매핑 (권한 부여자·수여자·대상 임원) |
| `schedules` | 일정 원장 (명의 임원, 실제 작성자, 공통 여부 등) |
| `schedule_audit_logs` | 감사 로그 (등록·수정·삭제 이력, 대리 입력 분리 기록) |

### `schedules` 주요 필드

| 필드 | 설명 |
|------|------|
| 명의 임원 | 일정의 소유 임원 |
| 실제 작성자 | 일정을 입력한 사용자 (대리 입력 시 비서 등) |
| 공통 일정 여부 | 전체 공유 일정인지 개인 일정인지 구분 |
| 종일 여부 | 시각 없이 하루 종일 표시하는 일정 여부 |

---

## 5. 화면별 기능명세서 매핑

본 디렉터리(`spec/`)는 1개의 개요 문서와 13개의 화면/도메인 기능명세서로 구성된다. 각 spec은 대응되는 프로세스(`process/`) 문서 및 ERD(`erd/erd.md`) 테이블과 다음과 같이 연결된다.

| 파일명 | 주요 기능군 | 핵심 기능ID | 관련 process | 관련 ERD 테이블 | Phase |
|--------|-------------|-------------|--------------|----------------|:-----:|
| `00_overview.md` | 시스템 개요 (역할·Phase·데이터 모델) | — | [proc_00_index](../process/proc_00_index.md) | (전체) | 1~3 |
| `01_auth.md` | 인증 (초대·로그인·비번찾기·세션) | AUTH-001~004 | [proc_01_auth](../process/proc_01_auth.md) | `users` | 1 |
| `02_permission.md` | 권한 (RBAC·대리 입력·UI 게이팅) | PERM-001~004 | [proc_02_permission](../process/proc_02_permission.md) | `users`, `proxy_permissions` | 1~2 |
| `03_schedule.md` | 일정 CRUD·빠른 입력·자연어 파싱 | SCH-001~006 | [proc_03_schedule](../process/proc_03_schedule.md) | `schedules`, `schedule_participants` | 1 |
| `04_mention_contact.md` | @멘션·연락처(회사/인물) 관리 | MEN-001, CON-001~005 | [proc_04_mention_contact](../process/proc_04_mention_contact.md) | `companies`, `contacts`, `mentions` | 2 |
| `05_calendar_view.md` | 달력 뷰 (월/주/일·공휴일 오버레이) | CAL-001~006 | [proc_03_schedule](../process/proc_03_schedule.md) (일정 도메인) | `schedules`, `holidays` | 1 |
| `06_list_view.md` | 리스트 뷰 (테이블·필터·검색·인라인 편집) | LIS-001~006 | [proc_03_schedule](../process/proc_03_schedule.md) (일정 도메인) | `schedules` | 1 |
| `07_common_schedule.md` | 공통 일정 (전체 공유·참가자 자율 등록) | COM-001~003 | [proc_03_schedule](../process/proc_03_schedule.md) (일정 도메인) | `schedules`, `schedule_participants` | 1 |
| `08_holiday.md` | 공휴일 (배치 수집·수동 등록·달력 노출) | HOL-001~003 | [proc_08_holiday](../process/proc_08_holiday.md) | `holidays` | 2 |
| `09_meeting_radar.md` | 모임 레이더 (충돌 계산·가용 슬롯) | RAD-001~004 | [proc_06_meeting_radar](../process/proc_06_meeting_radar.md) | `schedules`, `users` | 3 |
| `10_relationship_history.md` | 관계 히스토리 (@태그 → 미팅 이력 카드) | REL-001~003 | [proc_07_relationship_history](../process/proc_07_relationship_history.md) | `mentions`, `schedules` | 3 |
| `11_notification.md` | 알림 (이벤트 트리거·이메일·재시도) | NOT-001~006 | [proc_05_notification](../process/proc_05_notification.md) | `notification_logs` | 2 |
| `12_audit_log.md` | 이력 관리 (등록·수정·삭제 감사) | AUD-001~004 | [proc_09_audit_log](../process/proc_09_audit_log.md) | `audit_logs` | 3 |
| `13_export_responsive.md` | 엑셀 내보내기·반응형 레이아웃 | EXP-001, RES-001~002 | [proc_10_export](../process/proc_10_export.md) | `schedules` | 3 |

> **EXP-002 (Google Calendar 연동)** 은 `13_export_responsive.md` 내에 명세가 작성되어 있으나 **2차(Phase 2 이후) 진행 예정으로 1차 범위에서 제외**된다. 자세한 내용은 해당 문서 EXP-002 섹션 참조.

---

## 6. 비기능 요구사항

| 항목 | 요구사항 |
|------|---------|
| 성능 | 일정 목록 조회 응답 1초 이내 |
| 보안 | 행 수준 접근 제어 적용, HTTPS 필수 |
| 가용성 | 클라우드 서비스 SLA 기준 (99.9%) |
| 브라우저 지원 | Chrome 120+, Edge 120+, Safari 17+ |
| 반응형 | 데스크탑 우선, 태블릿 대응 |
| 감사 로그 | 모든 일정 등록·수정·삭제 작업 이력 필수 |
| 소셜 로그인 | 지원하지 않음 |
