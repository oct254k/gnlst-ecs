---
title: 프로세스 문서 인덱스
version: "1.0"
date: 2026-05-11
category: 프로세스
---

# 프로세스 문서 인덱스

**관련 화면 명세**: [spec/00_overview.md](../spec/00_overview.md)

임원 일정 관리 시스템의 전체 프로세스 정의 문서 목록 및 연관 관계를 정리한 인덱스 파일이다.

---

## 1. 전체 프로세스 목록

| 프로세스 ID | 프로세스명 | 파일 | Phase | 참여자 요약 |
|---|---|---|:---:|---|
| PROC-AUTH-001 | 관리자 초대 프로세스 | proc_01_auth.md | 인증 | 관리자, 피초대자, 인증 서비스, 이메일 발송 서비스 |
| PROC-AUTH-002 | 로그인 프로세스 | proc_01_auth.md | 인증 | 사용자, 인증 서비스 |
| PROC-AUTH-003 | 비밀번호 재설정 프로세스 | proc_01_auth.md | 인증 | 사용자, 인증 서비스 |
| PROC-AUTH-004 | 세션 관리 프로세스 | proc_01_auth.md | 인증 | 사용자, 미들웨어, 인증 서비스 |
| PROC-PERM-001 | 역할 기반 접근 제어 프로세스 | proc_02_permission.md | 권한 | 사용자, 미들웨어, 비즈니스 로직 계층, 데이터 접근 제어 계층 |
| PROC-PERM-002 | 대리 입력 권한 부여 프로세스 | proc_02_permission.md | 권한 | 관리자, 피권한자, 권한 대상 임원 |
| PROC-PERM-003 | 대리 입력 실행 프로세스 | proc_02_permission.md | 권한 | 대리 입력자, 일정 주인 |
| PROC-SCH-001 | 개인 일정 등록 프로세스 | proc_03_schedule.md | 일정 관리 | 임원, 시스템 |
| PROC-SCH-002 | 공통 일정 등록 프로세스 | proc_03_schedule.md | 일정 관리 | 임원/관리자, 전체 임원, 시스템 |
| PROC-SCH-003 | 일정 수정 프로세스 | proc_03_schedule.md | 일정 관리 | 임원(본인)/관리자, 시스템 |
| PROC-SCH-004 | 일정 삭제 프로세스 | proc_03_schedule.md | 일정 관리 | 임원(본인)/관리자, 시스템 |
| PROC-SCH-005 | 공통 일정 참가자 자기 추가 프로세스 | proc_03_schedule.md | 일정 관리 | 임원, 시스템 |
| PROC-MEN-001 | @멘션 자동완성 프로세스 | proc_04_mention_contact.md | 멘션 | 임원, 에디터, 시스템 |
| PROC-MEN-002 | 새 연락처 자동 등록 프로세스 | proc_04_mention_contact.md | 멘션 | 임원, 시스템, 관리자 |
| PROC-CON-001 | 연락처 CRUD 프로세스 | proc_04_mention_contact.md | 연락처 | 관리자, 시스템 |
| PROC-NOT-001 | 공통 일정 등록 알림 프로세스 | proc_05_notification.md | 알림 | 시스템, 알림 처리 서비스, 이메일 발송 서비스 |
| PROC-NOT-002 | 공통 일정 수정 알림 프로세스 | proc_05_notification.md | 알림 | 시스템, 알림 처리 서비스, 이메일 발송 서비스 |
| PROC-NOT-003 | 타인 일정 수정 알림 프로세스 | proc_05_notification.md | 알림 | 시스템, 알림 처리 서비스, 이메일 발송 서비스 |
| PROC-NOT-004 | 초대 메일 발송 프로세스 | proc_05_notification.md | 알림 | 관리자, 시스템, 인증 서비스 |
| PROC-NOT-005 | 알림 실패 재시도 프로세스 | proc_05_notification.md | 알림 | 알림 처리 서비스, 관리자 |
| PROC-RAD-001 | 모임 레이더 조회 프로세스 | proc_06_meeting_radar.md | 레이더 | 사용자, 시스템 |
| PROC-REL-001 | 관계 히스토리 조회 프로세스 | proc_07_relationship_history.md | 레이더 | 사용자, 시스템 |
| PROC-HOL-001 | 연간 법정 공휴일 자동 등록 프로세스 | proc_08_holiday.md | 공휴일 | 스케줄러, 시스템, 공공데이터포털 |
| PROC-HOL-002 | 임시 공휴일 수동 등록 프로세스 | proc_08_holiday.md | 공휴일 | 관리자, 시스템 |
| PROC-HOL-003 | 임시 공휴일 삭제 프로세스 | proc_08_holiday.md | 공휴일 | 관리자, 시스템 |
| PROC-AUD-001 | 일정 등록 이력 저장 프로세스 | proc_09_audit_log.md | 이력 | 사용자, 시스템 |
| PROC-AUD-002 | 일정 수정 이력 저장 프로세스 | proc_09_audit_log.md | 이력 | 사용자, 시스템 |
| PROC-AUD-003 | 대리 입력 이력 구분 저장 프로세스 | proc_09_audit_log.md | 이력 | 대리 입력자, 임원, 시스템 |
| PROC-AUD-004 | 이력 조회 프로세스 | proc_09_audit_log.md | 이력 | 관리자/임원, 시스템 |
| PROC-EXP-001 | 엑셀 다운로드 프로세스 | proc_10_export.md | 내보내기 | 사용자, 시스템 |

---

## 2. 프로세스 간 연관 관계 다이어그램

```mermaid
graph LR
    %% 인증 영역
    AUTH001[PROC-AUTH-001\n관리자 초대]
    AUTH002[PROC-AUTH-002\n로그인]
    AUTH003[PROC-AUTH-003\n비밀번호 재설정]
    AUTH004[PROC-AUTH-004\n세션 관리]

    %% 권한 영역
    PERM001[PROC-PERM-001\n역할 기반 접근제어]
    PERM002[PROC-PERM-002\n대리 입력 권한 부여]
    PERM003[PROC-PERM-003\n대리 입력 실행]

    %% 일정 영역
    SCH001[PROC-SCH-001\n개인 일정 등록]
    SCH002[PROC-SCH-002\n공통 일정 등록]
    SCH003[PROC-SCH-003\n일정 수정]
    SCH004[PROC-SCH-004\n일정 삭제]
    SCH005[PROC-SCH-005\n참가자 자기 추가]

    %% 멘션 영역
    MEN001[PROC-MEN-001\n멘션 자동완성]
    MEN002[PROC-MEN-002\n연락처 자동 등록]

    %% 연락처
    CON001[PROC-CON-001\n연락처 관리]

    %% 알림 영역
    NOT001[PROC-NOT-001\n공통 일정 등록 알림]
    NOT002[PROC-NOT-002\n공통 일정 수정 알림]
    NOT003[PROC-NOT-003\n타인 일정 수정 알림]
    NOT004[PROC-NOT-004\n초대 메일 발송]
    NOT005[PROC-NOT-005\n알림 재시도]

    %% 레이더
    RAD001[PROC-RAD-001\n모임 레이더]
    REL001[PROC-REL-001\n관계 히스토리]

    %% 공휴일
    HOL001[PROC-HOL-001\n법정공휴일 자동등록]
    HOL002[PROC-HOL-002\n임시공휴일 등록]
    HOL003[PROC-HOL-003\n임시공휴일 삭제]

    %% 이력
    AUD001[PROC-AUD-001\n등록 이력 저장]
    AUD002[PROC-AUD-002\n수정 이력 저장]
    AUD003[PROC-AUD-003\n대리 이력 구분]
    AUD004[PROC-AUD-004\n이력 조회]

    %% 내보내기
    EXP001[PROC-EXP-001\n엑셀 다운로드]

    %% 연관 관계
    AUTH001 --> AUTH002
    AUTH002 --> PERM001
    PERM001 --> SCH001
    PERM001 --> SCH002
    PERM001 --> SCH003
    PERM001 --> SCH004
    PERM002 --> AUD003
    PERM003 --> AUD003

    SCH001 --> MEN001
    SCH001 --> AUD001
    SCH001 --> NOT001
    SCH002 --> AUD001
    SCH002 --> NOT001
    SCH003 --> AUD002
    SCH003 --> NOT002
    SCH003 --> NOT003

    MEN001 --> MEN002
    MEN001 --> SCH001
    CON001 --> MEN001
    CON001 --> RAD001
    CON001 --> REL001

    NOT001 --> NOT005
    NOT002 --> NOT005
    NOT003 --> NOT005

    HOL001 --> SCH001
    HOL002 --> SCH001

    AUD001 --> AUD003
    AUD002 --> AUD003
    AUD003 --> AUD004

    SCH001 --> EXP001
    SCH001 --> RAD001
    SCH001 --> REL001
```

---

## 3. 데이터 흐름 개요

```mermaid
flowchart LR
    subgraph Actor["참여자 (사용자 / 관리자 / 시스템)"]
        U[사용자]
        A[관리자]
        C[스케줄러]
    end

    subgraph System["시스템 처리 영역"]
        AuthSys[인증 처리]
        PermSys[권한 처리]
        SchSys[일정 처리]
        NotSys[알림 처리]
        HolSys[공휴일 처리]
        AudSys[이력 처리]
        ExpSys[내보내기 처리]
    end

    subgraph DB["데이터베이스"]
        UsersT[(users)]
        SchedT[(schedules)]
        AuditT[(audit_logs)]
        HolT[(holidays)]
        MenT[(mentions)]
        NotT[(notification_logs)]
        ConT[(contacts)]
    end

    subgraph Notify["외부 알림"]
        Email[이메일 발송 서비스]
    end

    subgraph Output["출력"]
        CalUI[달력 UI]
        ListUI[리스트 UI]
        XlsxFile[엑셀 파일]
        Timeline[이력 타임라인 UI]
    end

    U --> AuthSys --> UsersT
    A --> AuthSys
    A --> PermSys --> UsersT
    U --> SchSys --> SchedT
    U --> SchSys --> MenT
    SchSys --> AuditT
    SchSys --> NotSys --> Email
    C --> HolSys --> HolT
    A --> HolSys
    SchedT --> CalUI
    SchedT --> ListUI
    AuditT --> Timeline
    ListUI --> ExpSys --> XlsxFile
    ConT --> SchSys
```

---

## 4. Phase별 프로세스 분류

| Phase | 설명 | 포함 프로세스 수 | 주요 프로세스 ID |
|---|---|:---:|---|
| **인증** | 사용자 계정 생성·로그인·로그아웃·세션 관리 | 4 | PROC-AUTH-001 ~ 004 |
| **권한/대리입력** | 역할 기반 접근 제어 및 대리 입력 권한 관리·실행 | 3 | PROC-PERM-001 ~ 003 |
| **일정 관리** | 임원 개인·공통 일정 등록·수정·삭제·참가 | 5 | PROC-SCH-001 ~ 005 |
| **멘션** | 일정 내 @멘션 자동완성·연락처 자동 등록 | 2 | PROC-MEN-001 ~ 002 |
| **연락처** | 파트너·인물 연락처 관리 | 1 | PROC-CON-001 |
| **알림** | 이메일 알림 및 재시도 | 5 | PROC-NOT-001 ~ 005 |
| **레이더/관계** | 모임 레이더 및 관계 히스토리 조회 | 2 | PROC-RAD-001, PROC-REL-001 |
| **공휴일** | 법정·임시 공휴일 등록·삭제 | 3 | PROC-HOL-001 ~ 003 |
| **이력** | 일정 변경 이력 저장·조회 | 4 | PROC-AUD-001 ~ 004 |
| **내보내기** | 엑셀 다운로드 | 1 | PROC-EXP-001 |
| **합계** | | **30** | |

---

## 5. 핵심 테이블 — 프로세스 매핑

| 테이블 | 주요 연관 프로세스 |
|---|---|
| `users` | AUTH-001~004, PERM-001~003, AUD-003 |
| `schedules` | SCH-001~005, AUD-001~002, NOT-001~004, EXP-001 |
| `audit_logs` | AUD-001~004 |
| `holidays` | HOL-001~003 |
| `mentions` | MEN-001~002, SCH-001, EXP-001 |
| `proxy_permissions` | PERM-002~003, AUD-003 |
| `contacts` | CON-001, RAD-001, REL-001 |
| `companies` | CON-001, MEN-001~002, REL-001 |
| `notification_logs` | NOT-001~005 |
| `schedule_participants` | SCH-002, SCH-005 |

---

## 6. 문서 파일 목록

| 파일명 | 제목 | 포함 프로세스 수 |
|---|---|:---:|
| `proc_00_index.md` | 프로세스 문서 인덱스 (현재 파일) | — |
| `proc_01_auth.md` | 인증 프로세스 정의서 | 4 |
| `proc_02_permission.md` | 권한/대리입력 프로세스 정의서 | 3 |
| `proc_03_schedule.md` | 일정 관리 프로세스 정의서 | 5 |
| `proc_04_mention_contact.md` | 멘션 및 연락처 프로세스 정의서 | 3 |
| `proc_05_notification.md` | 알림 프로세스 정의서 | 5 |
| `proc_06_meeting_radar.md` | 모임 레이더 프로세스 정의서 | 1 |
| `proc_07_relationship_history.md` | 관계 히스토리 프로세스 정의서 | 1 |
| `proc_08_holiday.md` | 공휴일 관리 프로세스 정의서 | 3 |
| `proc_09_audit_log.md` | 이력 저장 프로세스 정의서 | 4 |
| `proc_10_export.md` | 엑셀 내보내기 프로세스 정의서 | 1 |
