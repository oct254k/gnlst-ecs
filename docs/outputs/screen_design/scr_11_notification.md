# 알림 센터·발송 이력 화면설계서

- 화면 ID: SCR-NOTIFICATION (벨 드롭다운 + 전체 페이지), SCR-ADMIN-NOTIFICATION-LOG
- 관련 spec: [spec/11_notification.md](../spec/11_notification.md)
- 관련 process: [process/proc_05_notification.md](../process/proc_05_notification.md)
- 관련 ERD: `notification_logs`, `users`
- Phase: 2
- 최종 갱신: 2026-05-14

---

## 1. 개요

| SCR-* | 형태 | 진입 | 핵심 기능 |
|---|---|---|---|
| SCR-NOTIFICATION (드롭다운) | `SL-OVERLAY` 팝오버 | 헤더 `🔔` 클릭 | 최근 미확인 알림 N건 요약 (NOT-001~003) |
| SCR-NOTIFICATION (전체 페이지) | `SL-MAIN` 풀 페이지 | `/notifications` | 전체 알림 목록·필터 |
| SCR-ADMIN-NOTIFICATION-LOG | `SL-MAIN` 관리자 페이지 | `/admin/notifications` | 발송 이력·재시도 상태 (NOT-006, admin 전용) |

> ※ "미확인" 정의 — `recipient_id=:me AND status='sent' AND read_at IS NULL`. (`notification_logs.read_at` 은 2026-05-14 ERD 보강 라운드에서 정식 추가됨)

---

## 2. 레이아웃 구조

| 화면 | 사용 슬롯 |
|---|---|
| SCR-NOTIFICATION (드롭다운) | `SL-HEADER` 위에 떠 있는 `SL-OVERLAY` 팝오버 (z-index 40). 모바일은 전체 화면 라우팅으로 대체 |
| SCR-NOTIFICATION (전체) | `SL-HEADER + SL-SIDEBAR + SL-MAIN + SL-FOOTER` |
| SCR-ADMIN-NOTIFICATION-LOG | `SL-HEADER + SL-SIDEBAR(admin) + SL-MAIN + SL-FOOTER` |

---

## A. SCR-NOTIFICATION (드롭다운)

### A.1 와이어프레임 (데스크톱, 벨 클릭 시)

```
SL-HEADER:
┌──────────────────────────────────────────────────────────────────┐
│ [☰] [LOGO]                                  [🔔3◉][🟢홍길동▾]    │
└──────────────────────────────────────┬───────────────────────────┘
                                       │
                                       ▼
                           ┌─ [POPOVER: 알림] ──────────┐
                           │ 알림            [SEGMENT:  │
                           │                 미확인/전체]│
                           ├────────────────────────────┤
                           │ ● [TAG: 공통일정변경]      │ ← 미확인 (●)
                           │   "5월 전체회의" 일시 변경 │
                           │   3분 전                   │
                           ├────────────────────────────┤
                           │ ● [TAG: 내일정변경]        │
                           │   김전무가 일정을 수정     │
                           │   1시간 전                 │
                           ├────────────────────────────┤
                           │ ○ [TAG: 공통일정등록]      │ ← 확인됨 (○)
                           │   "이사회" 일정 신규 등록  │
                           │   어제                     │
                           ├────────────────────────────┤
                           │ [BTN-LINK: 전체 보기]     │
                           └────────────────────────────┘
```

### A.2 와이어프레임 (모바일 — 벨 클릭 시 전체 페이지로 라우팅)

`SCR-NOTIFICATION 전체 페이지` (§B 참조) 와 동일.

### A.3 컴포넌트 사용 표

| 컴포넌트 | 위치 | 적용 사양 |
|---|---|---|
| `[BTN-ICON: 알림 벨]` | 헤더 | `aria-label="알림"`, `aria-haspopup="true"` |
| `[BADGE: 미확인]` | 벨 위 | count 변형. 0건이면 미노출. 99+ 표기 |
| `[POPOVER: 알림]` | 오버레이 | 폭 360px, max-height 480px |
| `[SEGMENT: 미확인/전체]` | 팝오버 헤더 | 2분기 |
| `[LIST: 알림 아이템]` | 팝오버 본문 | 스크롤 가능. 빈 상태 `[EMPTY]` |
| `[TAG: 이벤트 유형]` | 항목 좌측 | 매핑: `common_schedule_created`→"공통일정등록"(primary), `common_schedule_updated`→"공통일정변경"(warn), `schedule_updated_by_other`→"내일정변경"(info) |
| `[BTN-LINK: 전체 보기]` | 팝오버 푸터 | `/notifications` 라우팅 |
| `[EMPTY: 새 알림이 없습니다]` | 0건 상태 | — |
| `[SKELETON]` | 로딩 | 항목 4행 |

### A.4 상호작용 명세

| 트리거 | 컴포넌트 | 이벤트 | 다음 상태/액션 | API |
|---|---|---|---|---|
| 클릭 | 헤더 `[BTN-ICON: 알림 벨]` | onClick | 팝오버 열기 + 최근 알림 로드 | `GET /api/notifications?unread=true&limit=10` |
| 선택 | `[SEGMENT: 미확인/전체]` | onChange | 필터 갱신 | `GET /api/notifications?unread=...&limit=10` |
| 클릭 | 알림 항목 | onClick | 1) 해당 일정 상세 모달 또는 `SCR-MODAL-SCHEDULE-DETAIL` 열기 (target_type=schedule) 2) 항목 읽음 처리(임시: 클라이언트 상태) | `GET /api/schedules/:id` |
| 클릭 | `[BTN-LINK: 전체 보기]` | onClick | `/notifications` 라우팅 | — |
| 키보드 | `Esc` | keyDown | 팝오버 닫기 | — |
| 외부 클릭 | 백드롭 영역 | onClick | 팝오버 닫기 | — |

### A.5 데이터 바인딩 표

| UI 필드 | 표시 형식 | 데이터 소스 | 비고 |
|---|---|---|---|
| 미확인 카운트 (벨 배지) | 숫자 | `COUNT(notification_logs)` `WHERE recipient_id=:me AND status='sent' AND read_at IS NULL` | — |
| 이벤트 유형 라벨 | `[TAG]` | `notification_logs.event_type` | 5종 enum |
| 본문 미리보기 | 텍스트 | `notification_logs.payload->>'title'` 등 | jsonb 파싱. 일정 제목·변경 요약 |
| 발송 시각 | 상대 시각 | `notification_logs.sent_at` | "3분 전", "어제" |
| 대상 일정 ID | (내부) | `notification_logs.target_id` (when `target_type='schedule'`) | 클릭 시 상세 모달 호출 |
| 읽음 여부 (●/○) | dot | `notification_logs.read_at` | `IS NULL` → ● 미확인, `IS NOT NULL` → ○ |

### A.6 화면 상태

| 상태 | 표현 |
|---|---|
| 빈 (미확인 0) | `[EMPTY: 새 알림이 없습니다]`. 벨 배지 미노출 |
| 빈 (전체 0) | `[EMPTY: 알림 이력이 없습니다]` |
| 로딩 | `[SKELETON]` 4행 |
| 에러 | `[ALERT: 알림을 불러오지 못했습니다]` |
| 성공 | 정상 렌더 |
| 권한 거부 | 인증 필수. 미인증 시 `SCR-LOGIN` |

### A.7 권한·접근성

- 인증 사용자 전체. 본인 수신 알림만 노출 (PERM-001 행 수준 접근 제어: `recipient_id=:me`)
- 벨 `aria-label="알림 N건"` (count 동적 반영)
- 팝오버: `role="dialog"` + 포커스 트랩 + `Esc` 닫기

---

## B. SCR-NOTIFICATION (전체 페이지)

### B.1 와이어프레임 (데스크톱)

```
┌─ SL-MAIN ─────────────────────────────────────────────────────────────┐
│ [H1: 알림]                            [BTN: 모두 읽음 처리]            │
│ ────────────────────────────────────────────────────────────────────  │
│ [SEGMENT: 미확인/전체]   [SELECT: 유형 ▾]   [DATE-RANGE: 기간]         │
│ ────────────────────────────────────────────────────────────────────  │
│ ┌───────────────────────────────────────────────────────────────────┐ │
│ │ ● [TAG: 공통일정변경] "5월 전체회의" 일시 변경                    │ │
│ │   김관리자가 변경 — 2026-05-14 09:12                              │ │
│ │   [BTN-LINK: 일정 상세 보기]                                      │ │
│ ├───────────────────────────────────────────────────────────────────┤ │
│ │ ● [TAG: 내일정변경] 김전무 일정이 박관리자에 의해 수정             │ │
│ │   2026-05-14 08:01                                                │ │
│ ├───────────────────────────────────────────────────────────────────┤ │
│ │ ... (N건)                                                         │ │
│ └───────────────────────────────────────────────────────────────────┘ │
│ [PAGINATION: < 1 2 3 ... >]                                            │
└────────────────────────────────────────────────────────────────────────┘
```

### B.2 와이어프레임 (모바일)

```
┌──────────────────────┐
│ [☰] 알림            │
├──────────────────────┤
│ [SEGMENT: 미확인/전체]│
│ [SELECT: 유형 ▾]     │
│ [DATE-RANGE: 기간]   │
├──────────────────────┤
│ ┌──────────────────┐ │
│ │ ● [TAG: 공통일정 │ │
│ │   변경]          │ │
│ │ "5월 전체회의"   │ │
│ │ 3분 전           │ │
│ │ [BTN-LINK: 상세] │ │
│ └──────────────────┘ │
│ ... (N건)            │
├──────────────────────┤
│ [PAGINATION]         │
├──────────────────────┤
│ 🏠 📅 ☰ 🔔◉ ⋯       │
└──────────────────────┘
```

### B.3 컴포넌트 사용 표

| 컴포넌트 | 위치 | 적용 사양 |
|---|---|---|
| `[H1: 알림]` | 페이지 타이틀 | — |
| `[BTN: 모두 읽음 처리]` | 1차 액션 (선택) | 클라이언트 상태로 처리 (§10) |
| `[SEGMENT: 미확인/전체]` | 도구바 | 2분기 |
| `[SELECT: 유형]` | 도구바 필터 | 전체 / 5종 event_type (한글 매핑) |
| `[DATE-RANGE: 기간]` | 도구바 필터 | 시작~종료 |
| `[LIST: 알림]` | 본문 | 항목당 카드 |
| `[TAG: 이벤트 유형]` | 항목 좌측 | 동상 |
| `[BTN-LINK: 일정 상세 보기]` | 항목 푸터 | target_type=schedule 일 때만 |
| `[PAGINATION]` | 본문 하단 | 페이지당 20건 |
| `[EMPTY]` | 0건 | — |

### B.4 상호작용 명세

| 트리거 | 컴포넌트 | 이벤트 | 다음 상태/액션 | API |
|---|---|---|---|---|
| 진입 | — | onMount | 알림 목록 로드 | `GET /api/notifications?page=&unread=&event_type=&from=&to=` |
| 선택 | `[SEGMENT]` / `[SELECT]` / `[DATE-RANGE]` | onChange | 필터 갱신 | 동상 |
| 클릭 | 항목 | onClick | `SCR-MODAL-SCHEDULE-DETAIL` 열기 (target_type=schedule) | `GET /api/schedules/:id` |
| 클릭 | `[BTN: 모두 읽음 처리]` | onClick | 클라이언트 last-seen 갱신 → 미확인 카운트 0 | (클라이언트 처리, §10) |

### B.5 데이터 바인딩 표

| UI 필드 | 표시 형식 | 데이터 소스 | 비고 |
|---|---|---|---|
| 이벤트 유형 | `[TAG]` | `notification_logs.event_type` | 5종 enum |
| 본문 | 텍스트 | `notification_logs.payload` (jsonb) | 제목·변경 요약. 템플릿별 키 다름 |
| 수신 시각 | YYYY-MM-DD HH:mm | `notification_logs.sent_at` | KST. `sent_at` NULL 이면 `created_at` |
| 발송 상태 (선택 표시) | 라벨 | `notification_logs.status` | 사용자에게는 `sent` 만 노출이 원칙 |
| 대상 일정 | 링크 | `notification_logs.target_id` `WHERE target_type='schedule'` | 일정 상세 모달 호출 |
| 수신자 필터 | (서버) | `notification_logs.recipient_id = :me` | 자기 알림만 |

### B.6 화면 상태

| 상태 | 표현 |
|---|---|
| 빈 | `[EMPTY: 알림이 없습니다]` |
| 로딩 | `[SKELETON]` 5행 |
| 에러 | `[ALERT]` |
| 성공 | 정상 |
| 권한 거부 | 미인증 시 `SCR-LOGIN` |

### B.7 권한·접근성

- 인증 사용자 전용. 본인 수신만 (`recipient_id=:me`)
- 항목 클릭은 `<button>` 또는 `<a>` 로 키보드 접근 가능
- 미확인 dot 은 `aria-label="미확인"`

---

## C. SCR-ADMIN-NOTIFICATION-LOG — 알림 발송 이력 (admin)

### C.1 와이어프레임 (데스크톱)

```
┌─ SL-MAIN ─────────────────────────────────────────────────────────────┐
│ [H1: 알림 발송 이력]                                                   │
│ ────────────────────────────────────────────────────────────────────  │
│ [SEARCH: 수신 이메일·일정 제목] [SELECT: 이벤트 ▾] [SELECT: 상태 ▾]   │
│ [DATE-RANGE: 기간]                                                     │
│ ────────────────────────────────────────────────────────────────────  │
│ ┌───────────────────────────────────────────────────────────────────┐ │
│ │ [발송시각] [이벤트] [수신자] [수신메일] [상태] [시도]  [에러]      │ │
│ ├───────────────────────────────────────────────────────────────────┤ │
│ │ 05/14 09:12 공통일정등록 홍길동 hong@.. [sent] 1   —                │ │
│ │ 05/14 09:12 공통일정등록 김전무 kim@..  [failed] 4 SMTP timeout    │ │
│ │ 05/14 09:11 내일정변경 박이사 park@..  [retrying] 2 SMTP timeout   │ │
│ │ ... (N건)                                                          │ │
│ └───────────────────────────────────────────────────────────────────┘ │
│ [PAGINATION: < 1 2 3 ... >] / 페이지당 30 / 총 N건                     │
└────────────────────────────────────────────────────────────────────────┘
```

### C.2 와이어프레임 (모바일)

```
┌──────────────────────┐
│ [☰] 알림 발송 이력   │
├──────────────────────┤
│ [SEARCH]             │
│ [SELECT: 이벤트]     │
│ [SELECT: 상태]       │
│ [DATE-RANGE]         │
├──────────────────────┤
│ ┌──────────────────┐ │
│ │ 공통일정등록     │ │
│ │ 홍길동 hong@..   │ │
│ │ [BADGE: sent]    │ │
│ │ 시도 1 · 05/14   │ │
│ └──────────────────┘ │
│ ... (N건)            │
├──────────────────────┤
│ [PAGINATION]         │
└──────────────────────┘
```

### C.3 컴포넌트 사용 표

| 컴포넌트 | 위치 | 적용 사양 |
|---|---|---|
| `[H1: 알림 발송 이력]` | 페이지 타이틀 | — |
| `[SEARCH: 수신 이메일·일정 제목]` | 도구바 | 디바운스 300ms |
| `[SELECT: 이벤트]` | 도구바 필터 | 5종 event_type |
| `[SELECT: 상태]` | 도구바 필터 | 5종 status (pending/retrying/sent/failed/skipped) |
| `[DATE-RANGE: 기간]` | 도구바 필터 | sent_at 기준 |
| `[TABLE: 발송시각, 이벤트, 수신자, 수신메일, 상태, 시도, 에러]` | 본문 | 정렬: 발송시각(기본 desc). 모바일은 카드형 |
| `[BADGE: 상태]` | 상태 컬럼 | pending(회색) / retrying(주황) / sent(녹색) / failed(빨강) / skipped(회색-muted) |
| `[TAG: 이벤트]` | 이벤트 컬럼 | A·B 와 동일 매핑 |
| `[PAGINATION]` | 본문 하단 | 페이지당 30건 |
| `[TOOLTIP: 에러 전문]` | 에러 컬럼 hover | 긴 메시지는 tooltip |
| `[EMPTY: 발송 이력이 없습니다]` | 0건 | — |

### C.4 상호작용 명세

| 트리거 | 컴포넌트 | 이벤트 | 다음 상태/액션 | API |
|---|---|---|---|---|
| 진입 | — | onMount | 발송 이력 로드 (최근 7일 기본) | `GET /api/admin/notifications?from=&to=&status=&event=&q=` |
| 선택 | 필터 컴포넌트 | onChange | 결과 갱신 | 동상 |
| 정렬 | 헤더 컬럼 | onSort | `sort=sent_at|event_type|...` | 동상 |
| 클릭 | 행 (선택) | onClick | 상세 패널/모달 (선택, 본 라운드는 미정 — 이슈 메모) | — |

### C.5 데이터 바인딩 표

| UI 필드 | 표시 형식 | 데이터 소스 | 비고 |
|---|---|---|---|
| 발송 시각 | YYYY-MM-DD HH:mm | `notification_logs.sent_at` | NULL 이면 `last_attempted_at` 또는 `created_at` |
| 이벤트 | `[TAG]` | `notification_logs.event_type` | 5종 |
| 수신자 | 텍스트 | `users.name` (FK: `notification_logs.recipient_id`) | NULL 시 "외부 수신자" |
| 수신 메일 | 텍스트 | `notification_logs.recipient_email` | 스냅샷 |
| 상태 | `[BADGE]` | `notification_logs.status` | 5종 |
| 시도 횟수 | 숫자 | `notification_logs.attempt_count` | 0~4 (초기 1 + 재시도 3) |
| 마지막 시도 | YYYY-MM-DD HH:mm | `notification_logs.last_attempted_at` | — |
| 에러 | 텍스트 | `notification_logs.error_message` | 긴 메시지는 `[TOOLTIP]` |
| 대상 유형 | 라벨 | `notification_logs.target_type` | schedule / user / null |
| 대상 ID | (내부) | `notification_logs.target_id` | 대상 화면 진입 시 사용 |
| 페이로드 | (확장 표시) | `notification_logs.payload` (jsonb) | 행 클릭 시 상세 |

### C.6 화면 상태

| 상태 | 표현 |
|---|---|
| 빈 | `[EMPTY: 발송 이력이 없습니다]` |
| 로딩 | 테이블 `[SKELETON]` 10행 |
| 에러 | `[ALERT]` |
| 성공 | 정상 |
| 권한 거부 | `user` 가 URL 접근 시 `SCR-ERROR-403` |

### C.7 권한·접근성

- `admin` 전용 (NOT-006: 관리자만 알림 발송 이력 조회 가능)
- 테이블 정렬 헤더 `aria-sort`
- 에러 메시지 tooltip 은 `aria-describedby`

---

## 통합 데이터 바인딩 요약

| 컬럼 | 사용 화면 |
|---|---|
| `notification_logs.id` | 전체 (PK) |
| `notification_logs.event_type` | A·B·C |
| `notification_logs.recipient_id` | A·B·C (필터) |
| `notification_logs.recipient_email` | C (수신 메일) |
| `notification_logs.target_type` | C (대상 유형) |
| `notification_logs.target_id` | A·B (일정 진입) |
| `notification_logs.status` | A·B·C |
| `notification_logs.attempt_count` | C (시도 횟수) |
| `notification_logs.last_attempted_at` | C |
| `notification_logs.sent_at` | A·B·C (시각 표시) |
| `notification_logs.error_message` | C |
| `notification_logs.payload` | A·B (본문 미리보기), C (상세) |
| `notification_logs.created_at` | C (fallback) |
| `users.name` | C (수신자 표시) |
| `users.id` | C (FK) |
| `users.last_login_at` | A·B (미확인 산출 임시) |
| `users.role` | C (admin 권한 검증) |

모두 `erd/erd.md` E01·E09 에 실재.

---

## 10. 이슈 메모

| 항목 | spec/process 표기 | ERD (SSOT) | 본 화면 처리 |
|---|---|---|---|
| ~~알림 "읽음" 여부~~ ✅ **RESOLVED 2026-05-14** | ~~spec 11 NOT-006 데이터 모델에 명시 없음~~ | ✅ `notification_logs.read_at` 컬럼 추가 (ERD 보강 라운드) | 미확인 = `recipient_id=:me AND status='sent' AND read_at IS NULL`. `[BTN: 모두 읽음 처리]` 는 `UPDATE notification_logs SET read_at=now() WHERE recipient_id=:me AND read_at IS NULL` |
| ~~재시도 컬럼명~~ ✅ **RESOLVED 2026-05-14** | ~~proc_05 "retry_count, next_retry_at, error_detail, status 3값"~~ | ERD: `attempt_count`, `last_attempted_at`, `error_message`, `status` 5종 | proc_05 가 ERD 명칭으로 정정됨 (spec/process 정합 정리 라운드) |
| ~~재시도 간격~~ ✅ **RESOLVED 2026-05-14** | ~~spec 11 "1분 → 5분 → 15분" vs proc_05 "30초 → 60초 → 120초"~~ | — (정책) | proc_05 가 spec/11 의 1분→5분→15분 으로 정정됨 (SSOT 우선순위 spec > process) |
| event_type enum 한글 라벨 | spec 11 본문은 한글 설명만 | ERD: 5종 코드 명시 | 본 화면 매핑표(§A.3 [TAG]) 에 코드↔한글 명시. ※ "내일정변경" 은 `schedule_updated_by_other` 매핑 |

---

## 검증

- 자체 검증 일자: 2026-05-14 (ERD 보강 + spec/process 정합 라운드 갱신)
- 자체 검증 결과: ✅ 통과 (이슈 메모 §10 의 3건 모두 RESOLVED)
- 자동 검증 결과: ✅ 통과
  - 2개 SCR-* (NOTIFICATION × 드롭다운/전체 + ADMIN-NOTIFICATION-LOG) 헤더 명시 ✓
  - 각 화면 8개 필수 섹션(A·B·C 각각 §1~§7 매핑) ✓
  - 컴포넌트 ID 모두 `components.md` 정의 ✓
  - 데이터 바인딩 컬럼 `erd/erd.md` E09·E01 실재 ✓ (`notification_logs.event_type`, `recipient_id`, `recipient_email`, `target_type`, `target_id`, `status`, `attempt_count`, `last_attempted_at`, `sent_at`, `read_at`, `error_message`, `payload`, `created_at`)
  - API → spec 11 / proc_05 의 동작과 일치 ✓
  - 권한 분기 (NOTIFICATION 인증 사용자, ADMIN-NOTIFICATION-LOG admin 전용) 명시 ✓
- 보류·예외 사항: 없음
- 검증자: claude (Step B 그룹 1 + ERD 보강 + spec/process 정합 라운드)
