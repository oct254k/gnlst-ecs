# 대시보드·전체 화면 인덱스 화면설계서

- 화면 ID: SCR-DASHBOARD (+ 전체 25개 SCR-* 인덱스)
- 관련 spec: [spec/00_overview.md](../spec/00_overview.md)
- 관련 process: [process/proc_00_index.md](../process/proc_00_index.md)
- 관련 ERD: (인덱스 문서이므로 직접 바인딩 없음. 대시보드 위젯은 `schedules`, `notification_logs`, `users` 를 읽기 전용으로 사용)
- Phase: 1 (대시보드 본체), 1~3 (인덱스 전체)
- 최종 갱신: 2026-05-14

---

## 1. 개요

본 문서는 두 가지 역할을 동시에 수행한다.

1. **SCR-DASHBOARD 화면설계서** — 로그인 후 진입하는 기본 화면(대시보드). 오늘 일정·미확인 알림·빠른 액션을 카드 위젯으로 노출.
2. **전체 화면 인덱스** — `ia/screen_list.md` 의 25개 화면(SCR-*) 과 본 폴더의 13개 `scr_XX_*.md` 사이의 매핑·진입 동선 정리.

| 항목 | 내용 |
|---|---|
| 화면명 | 대시보드 (Dashboard) |
| URL | `/` (인증 후 기본 진입) |
| 핵심 사용자 | 일반 임원(`user`), 관리자(`admin`) |
| 1차 목표 | "지금 내가 봐야 할 것" 을 1화면에 요약 |
| 2차 목표 | 빠른 액션(일정 등록, 알림 확인)으로 즉시 분기 |

> 본 화면은 spec 에서 별도 기능 ID 가 부여되지 않은 **요약 위젯 화면**이다. 위젯 자체는 다른 spec(`spec/05_calendar_view.md`, `spec/06_list_view.md`, `spec/11_notification.md`) 의 데이터 조회 기능을 재사용한다.

---

## 2. 레이아웃 구조

`common_layout.md` §1.1 슬롯 모델 기준.

| 슬롯 ID | 사용 여부 | 용도 |
|---|:-:|---|
| `SL-HEADER` | ✅ | GNB. 알림 벨(`SCR-NOTIFICATION` 드롭다운), 사용자 메뉴(`SCR-MY` 진입) |
| `SL-SIDEBAR` | ✅ | LNB. 사이드바 빠른 액션 (`+ 일정 등록`) |
| `SL-MAIN` | ✅ | 페이지 헤더 + 위젯 그리드 |
| `SL-FOOTER` | ✅ | 버전·도움말 |
| `SL-TABBAR` | ✅ (모바일 전용) | 5개 탭 (대시보드 활성) |
| `SL-OVERLAY` | — | 모달·패널은 사용하지 않음 (위젯 클릭 시 다른 화면으로 이동) |

브레이크포인트: `BP-DESKTOP` 3컬럼 그리드 / `BP-TABLET` 2컬럼 / `BP-MOBILE` 1컬럼 (수직 카드 스택).

---

## 3. 와이어프레임

### 3.1 데스크톱 (`BP-DESKTOP`)

```
┌─ SL-HEADER ────────────────────────────────────────────────────────────┐
│ [☰] [LOGO 임원 일정]            [통합 검색*(P2)]    [🔔3][🟢홍길동▾]   │
├─ SL-SIDEBAR ──┬─ SL-MAIN ──────────────────────────────────────────────┤
│ 일정          │ [H1: 대시보드]                  [BTN: + 일정 등록]      │
│ • 대시보드◉   │ ──────────────────────────────────────────────────── │
│ • 달력        │ ┌────────────────────┬────────────────────────────┐   │
│ • 리스트      │ │ [CARD: 오늘 일정]  │ [CARD: 다가오는 일정 (7일)] │  │
│ 협업          │ │ 14:00 임원 회의    │ 05/15 09:00 IR 발표        │   │
│ • 모임 레이더 │ │ 16:00 김전무 미팅  │ 05/16 14:00 이사회        │   │
│ 데이터(admin) │ │ ... (N건)          │ ... (N건)                  │   │
│ • 연락처      │ │ [LINK: 달력 보기]  │ [LINK: 리스트 보기]        │   │
│ • 회사        │ └────────────────────┴────────────────────────────┘   │
│ 관리자(admin) │ ┌────────────────────┬────────────────────────────┐   │
│ ───           │ │ [CARD: 미확인 알림]│ [CARD: 빠른 액션]          │   │
│ [BTN: + 일정] │ │ [BADGE: 3건]       │ [BTN: + 일정 등록]         │   │
│ [BTN: + 공통] │ │ • 일정 변경 알림   │ [BTN: + 공통 일정]*admin   │   │
│ (admin only)  │ │ • ... (N건)        │ [BTN: + 사용자 초대]*admin │   │
│               │ │ [LINK: 전체 보기]  │                            │   │
│               │ └────────────────────┴────────────────────────────┘   │
│               │ ┌────────────────────────────────────────────────┐   │
│               │ │ [ALERT: 시스템 공지/배너] (있을 때만)          │   │
│               │ └────────────────────────────────────────────────┘   │
├───────────────┴────────────────────────────────────────────────────────┤
│ SL-FOOTER: v0.1.0 · 도움말 · ?                                         │
└────────────────────────────────────────────────────────────────────────┘
```

### 3.2 모바일 (`BP-MOBILE`, 320px)

```
┌────────────────────────┐
│ [☰] 임원 일정    [🔔3] │ ← SL-HEADER (높이 56)
├────────────────────────┤
│ [H1: 대시보드]         │
├────────────────────────┤
│ [CARD: 오늘 일정]      │
│ 14:00 임원 회의        │
│ 16:00 김전무 미팅      │
│ ... (N건)              │
│ [LINK: 달력 보기]      │
├────────────────────────┤
│ [CARD: 다가오는 일정]  │
│ 05/15 09:00 IR 발표    │
│ ... (N건)              │
│ [LINK: 리스트 보기]    │
├────────────────────────┤
│ [CARD: 미확인 알림]    │
│ [BADGE: 3건]           │
│ • ... (N건)            │
│ [LINK: 전체 보기]      │
├────────────────────────┤
│ [CARD: 빠른 액션]      │
│ [BTN: + 일정 등록]     │
├────────────────────────┤
│ ... (스크롤)           │
├────────────────────────┤
│ 🏠 📅 ☰ 🔔3 ⋯         │ ← SL-TABBAR
└────────────────────────┘
```

---

## 4. 컴포넌트 사용 표

`components.md` ID 인용.

| 컴포넌트 ID | 사용 위치 | 본 화면 적용 사양 |
|---|---|---|
| `[H1: 대시보드]` | 페이지 타이틀 | 데스크톱 28px / 모바일 22px |
| `[CARD: 오늘 일정]` | 위젯 #1 | 헤더(제목+카운트) + 본문(최대 5건) + 푸터(LINK) |
| `[CARD: 다가오는 일정]` | 위젯 #2 | 헤더 + 본문(향후 7일, 최대 5건) + 푸터 |
| `[CARD: 미확인 알림]` | 위젯 #3 | 헤더(제목+BADGE) + 본문(최근 5건) + 푸터 |
| `[CARD: 빠른 액션]` | 위젯 #4 | BTN 묶음 (역할별 노출 차이) |
| `[LIST: 일정/알림]` | 위젯 본문 | 카드 내부 리스트 |
| `[BADGE: 미확인]` | 알림 위젯 헤더, 헤더 벨 | count 변형 |
| `[LINK: 달력 보기]` `[LINK: 리스트 보기]` `[LINK: 전체 보기]` | 위젯 푸터 | 화면 간 이동 |
| `[BTN: + 일정 등록]` | 페이지 헤더 1차 액션, 빠른 액션 카드 | primary 변형 |
| `[BTN: + 공통 일정]` | 빠른 액션 카드 | `admin` 한정 노출 |
| `[BTN: + 사용자 초대]` | 빠른 액션 카드 | `admin` 한정 노출, `SCR-ADMIN-USER` 초대 모달 호출 |
| `[ALERT: 시스템 공지]` | 본문 하단(조건부) | warn / info 변형. 0건이면 미노출 |
| `[SKELETON]` | 위젯 로딩 | 카드 본문 4행 회색 |
| `[EMPTY: 메시지]` | 0건 상태 | 위젯별 별도 카피 |

> 위 컴포넌트 모두 `components.md` 에 사전 정의됨 (신규 추가 없음).

---

## 5. 상호작용 명세

| 트리거 | 컴포넌트 | 이벤트 | 다음 상태/액션 | API |
|---|---|---|---|---|
| 페이지 진입 | — | onMount | 위젯 4종 병렬 로딩 → `[SKELETON]` → 데이터 | `GET /api/dashboard/overview` (4개 위젯 합본) 또는 위젯별 분할 호출 |
| 클릭 | `[CARD: 오늘 일정]` 항목 | onClick | `SCR-MODAL-SCHEDULE-DETAIL` 열기 (해당 `schedules.id`) | `GET /api/schedules/:id` |
| 클릭 | `[LINK: 달력 보기]` | onClick | `SCR-CALENDAR` 으로 라우팅 (오늘 날짜 선택) | — |
| 클릭 | `[LINK: 리스트 보기]` | onClick | `SCR-LIST` 으로 라우팅 (필터: 향후 7일) | — |
| 클릭 | `[LINK: 전체 보기]` (알림) | onClick | `SCR-NOTIFICATION` 전체 페이지 라우팅 | — |
| 클릭 | `[BADGE: 3건]` / 헤더 `🔔` | onClick | `SCR-NOTIFICATION` 드롭다운 토글 (오버레이) | `GET /api/notifications?unread=true` |
| 클릭 | `[BTN: + 일정 등록]` | onClick | `SCR-MODAL-SCHEDULE-FORM` 열기 | — (모달 내 저장 시 `POST /api/schedules`) |
| 클릭 | `[BTN: + 공통 일정]` (admin) | onClick | `SCR-MODAL-SCHEDULE-FORM` 열기 (type=common 프리셋) | — |
| 클릭 | `[BTN: + 사용자 초대]` (admin) | onClick | `SCR-ADMIN-USER` 의 초대 모달 호출 | — |
| 키보드 | 헤더 `🔔` 포커스 | `Enter`/`Space` | 알림 드롭다운 토글 | 동상 |

API 명명은 본 문서가 처음 정의하는 통합 엔드포인트(`/api/dashboard/overview`)외에는 `spec/*.md` 또는 `process/*.md` 의 기존 기능 ID(NOT-001~006, SCH-001~005, AUD-004) 와 연관된 동작과 일치한다.

---

## 6. 데이터 바인딩 표

| UI 필드 | 표시 형식 | 데이터 소스 | 비고 |
|---|---|---|---|
| 오늘 일정 — 시각 | HH:mm | `schedules.start_time` | NULL 또는 `is_all_day=true` 시 "종일" |
| 오늘 일정 — 제목 | 텍스트 | `schedules.title` | 최대 30자, 초과 시 ellipsis |
| 오늘 일정 — 임원명 | 텍스트 (badge) | `users.name` (FK: `schedules.owner_id`) | `users.color` 로 좌측 색상 띠 (CAL-004) |
| 오늘 일정 — 공통 표지 | 라벨 | `schedules.type` (`personal`/`common`) | `common` 일 때 `[TAG: 공통]` |
| 다가오는 일정 — 날짜 | MM/DD | `schedules.schedule_date` | KST 기준 |
| 다가오는 일정 — 시각 | HH:mm | `schedules.start_time` | NULL 시 시각 미표시 |
| 다가오는 일정 — 제목 | 텍스트 | `schedules.title` | — |
| 미확인 알림 — 카운트 | 숫자 | `COUNT(notification_logs)` `WHERE recipient_id = :me AND status = 'sent' AND read_at IS NULL` | 99+ 시 "99+" 표기 |
| 미확인 알림 — 이벤트 | 라벨 | `notification_logs.event_type` | 매핑: `common_schedule_created` → "공통 일정 등록", `common_schedule_updated` → "공통 일정 수정", `schedule_updated_by_other` → "내 일정 변경" |
| 미확인 알림 — 시각 | 상대 시각 | `notification_logs.sent_at` | "3분 전", "1시간 전" |
| 빠른 액션 — `+ 공통 일정` 노출 | boolean | `users.role = 'admin'` | 권한 분기 |
| 빠른 액션 — `+ 사용자 초대` 노출 | boolean | `users.role = 'admin'` | 권한 분기 |

> 모든 컬럼은 `erd/erd.md` E01·E04·E09 에 실재한다. `notification_logs.read_at` 은 2026-05-14 ERD 보강 라운드에서 정식 추가됨.

---

## 7. 화면 상태

| 상태 | 표현 |
|---|---|
| **로딩** | 각 위젯 본문에 `[SKELETON]` 4행 (제목 1, 본문 3). 헤더 카운트도 회색 점 |
| **빈 (오늘 일정 0건)** | `[EMPTY: 오늘 등록된 일정이 없습니다]` + `[BTN: + 일정 등록]` |
| **빈 (다가오는 일정 0건)** | `[EMPTY: 향후 7일 일정이 없습니다]` |
| **빈 (미확인 알림 0건)** | `[EMPTY: 새 알림이 없습니다]`, 헤더 `🔔` 배지 미노출 |
| **에러** | 위젯 본문에 `[ALERT: 일정을 불러오지 못했습니다]` + `[BTN-LINK: 다시 시도]`. 다른 위젯은 정상 표시 (위젯별 독립 fallback) |
| **성공** | 위젯별 데이터 정상 렌더. 새 일정 등록 후 복귀 시 `[TOAST: 일정이 등록되었습니다]` |
| **권한 거부** | 본 화면은 인증된 모든 사용자가 접근 가능. 세션 만료 시 `SCR-LOGIN` 으로 리다이렉트 (PROC-AUTH-004). 비활성 계정(`users.status IN ('inactive','locked')`) 진입 시 즉시 로그아웃 |

---

## 8. 권한·접근성

### 8.1 역할별 노출 차이

| 요소 | `user` | `admin` |
|---|:-:|:-:|
| 헤더 `🔔` 알림 벨 | ✅ | ✅ |
| `[CARD: 오늘 일정]` | ✅ (전체 임원 일정 조회 가능, PERM-001) | ✅ |
| `[BTN: + 일정 등록]` | ✅ (본인 명의) | ✅ |
| `[BTN: + 공통 일정]` (빠른 액션 카드) | ❌ 미노출 | ✅ |
| `[BTN: + 사용자 초대]` (빠른 액션 카드) | ❌ 미노출 | ✅ |
| 사이드바 "관리자" 그룹 | ❌ 그룹 자체 미노출 | ✅ (4개 메뉴) |
| 사이드바 "데이터" 그룹 (연락처·회사) | ❌ 메뉴 미노출 | ✅ |

### 8.2 키보드·스크린리더

- `Tab` 이동 순서: 헤더(`☰` → 로고 → 검색(P2 비활성) → 🔔 → 사용자메뉴) → 페이지 헤더 1차 액션 → 사이드바 → 위젯 카드 (각 카드 안에서 항목 → LINK)
- 각 카드는 `<section aria-labelledby="card-title-N">`
- 위젯 카드 제목은 `<h2>` (페이지 `<h1>` 의 하위)
- 알림 위젯 카운트는 `aria-label="미확인 N건"`
- `[EMPTY]` 영역은 `role="status"` (보조 정보)

---

## 9. 전체 화면 인덱스 (Step B 13개 + IA 25개)

본 섹션은 `ia/screen_list.md` 의 25개 SCR-* 와 본 폴더의 13개 화면 .md 매핑을 한 표로 정리. 동선 메모는 대시보드(SCR-DASHBOARD)에서의 진입 경로 중심.

| SCR-* | 화면명 | 화면설계서 파일 | Phase | 대시보드에서의 진입 |
|---|---|---|:-:|---|
| SCR-LOGIN | 로그인 | [scr_01_auth.md](./scr_01_auth.md) §A | 1 | (인증 전) |
| SCR-PASSWORD-FIND | 비밀번호 찾기 | [scr_01_auth.md](./scr_01_auth.md) §B | 1 | (인증 전) |
| SCR-PASSWORD-RESET | 비밀번호 재설정 | [scr_01_auth.md](./scr_01_auth.md) §C | 1 | (인증 전, 메일 링크) |
| SCR-INVITE-ACCEPT | 초대 수락 | [scr_01_auth.md](./scr_01_auth.md) §D | 1 | (인증 전, 메일 링크) |
| SCR-DASHBOARD | 대시보드 | **본 문서** | 1 | (진입점) |
| SCR-CALENDAR | 달력 뷰 | [scr_05_calendar_view.md](./scr_05_calendar_view.md) | 1 | 오늘 일정 카드 → "달력 보기" / 사이드바 |
| SCR-PANEL-DAY-DETAIL | 날짜 상세 패널 | [scr_05_calendar_view.md](./scr_05_calendar_view.md) (내부) | 1 | SCR-CALENDAR 의 셀 클릭 |
| SCR-LIST | 리스트 뷰 | [scr_06_list_view.md](./scr_06_list_view.md) | 1 | 다가오는 일정 카드 → "리스트 보기" / 사이드바 |
| SCR-MODAL-SCHEDULE-FORM | 일정 등록·수정 폼 모달 | [scr_03_schedule.md](./scr_03_schedule.md) | 1 | `+ 일정 등록` 버튼 / 일정 셀 더블클릭 |
| SCR-MODAL-SCHEDULE-DETAIL | 일정 상세 모달 | [scr_03_schedule.md](./scr_03_schedule.md) | 1 | 일정 카드 항목 클릭 |
| SCR-MODAL-CONFIRM-DELETE | 삭제 확인 모달 | [scr_03_schedule.md](./scr_03_schedule.md) / 공통 | 1 | 상세 모달 `[BTN: 삭제]` |
| SCR-MODAL-MENTION-NEW-CONTACT | 새 연락처 등록 미니 다이얼로그 | [scr_04_mention_contact.md](./scr_04_mention_contact.md) | 2 | 일정 폼 멘션 입력 중 `+ 새 연락처` |
| SCR-CONTACT | 연락처 | [scr_04_mention_contact.md](./scr_04_mention_contact.md) | 2 | 사이드바 → 데이터 → 연락처 (admin) |
| SCR-CONTACT-COMPANY | 회사 | [scr_04_mention_contact.md](./scr_04_mention_contact.md) | 2 | 사이드바 → 데이터 → 회사 (admin) |
| SCR-ADMIN-USER | 사용자 관리 | [scr_02_permission.md](./scr_02_permission.md) §A | 1 | 사이드바 → 관리자 → 사용자 관리 (admin) |
| SCR-ADMIN-PROXY | 대리권한 관리 | [scr_02_permission.md](./scr_02_permission.md) §B | 2 | 사이드바 → 관리자 → 대리권한 관리 (admin) |
| SCR-ADMIN-HOLIDAY | 공휴일 관리 | [scr_08_holiday.md](./scr_08_holiday.md) | 2 | 사이드바 → 관리자 → 공휴일 관리 (admin) |
| SCR-ADMIN-NOTIFICATION-LOG | 알림 발송 이력 | [scr_11_notification.md](./scr_11_notification.md) §B | 2 | 사이드바 → 관리자 → 알림 발송 이력 (admin) |
| SCR-RADAR | 모임 레이더 | [scr_09_meeting_radar.md](./scr_09_meeting_radar.md) | 3 | 사이드바 → 협업 → 모임 레이더 |
| SCR-POPOVER-RELATIONSHIP | 관계 히스토리 카드 | [scr_10_relationship_history.md](./scr_10_relationship_history.md) | 3 | 일정 상세의 멘션 칩 클릭 |
| SCR-MODAL-AUDIT-LOG | 일정 이력 모달 | [scr_12_audit_log.md](./scr_12_audit_log.md) | 3 | 일정 상세 모달의 "이력" 탭 |
| SCR-MY | 마이 페이지 | [scr_01_auth.md](./scr_01_auth.md) §E | 1 | 헤더 사용자 아바타 → 마이 페이지 |
| SCR-NOTIFICATION | 알림 센터 | [scr_11_notification.md](./scr_11_notification.md) §A | 2 | 헤더 🔔 / 미확인 알림 카드 → "전체 보기" |
| SCR-ERROR-403 | 권한 없음 | [scr_02_permission.md](./scr_02_permission.md) §C | 1 | (직접 URL 접근 시) |
| SCR-ERROR-404 | 페이지 없음 | (별도 파일 없음 — 작업 범위 외, scr_02 권한 외 화면) | 1 | (직접 URL 접근 시) |

> SCR-ERROR-404 는 본 작업 그룹 1 범위 외. 다른 그룹 또는 별도 라운드에서 처리 예정 — §10 이슈 메모 참조.

---

## 10. 이슈 메모 (spec 측 정의 vs ERD 충돌)

| 항목 | spec/process 표기 | ERD 정의 (SSOT) | 본 화면 처리 |
|---|---|---|---|
| ~~알림 "읽음" 여부~~ ✅ **RESOLVED 2026-05-14** | ~~NOT-006 데이터 모델에 명시 없음~~ | ✅ `notification_logs.read_at` 컬럼 추가 (ERD 보강 라운드) | 미확인 카운트는 `recipient_id=:me AND status='sent' AND read_at IS NULL` 로 정식화. 임시 정의 제거 |
| SCR-ERROR-404 | screen_list 에 정의됨 | — | 본 작업 그룹(1) 범위 외. `scr_02_permission.md` 의 §C 와 동일 패턴(`SL-AUTH` 레이아웃)으로 추후 작성 가능. |

---

## 검증

- 자체 검증 일자: 2026-05-14 (ERD 보강 라운드 갱신)
- 자체 검증 결과: ✅ 통과 (read_at 정식화로 ⚠️ 해소)
- 자동 검증 결과: ✅ 통과
  - 데이터 바인딩 컬럼 (`users.name`, `users.color`, `users.role`, `users.status`, `schedules.start_time`, `schedules.title`, `schedules.owner_id`, `schedules.type`, `schedules.schedule_date`, `schedules.is_all_day`, `notification_logs.event_type`, `notification_logs.sent_at`, `notification_logs.status`, `notification_logs.recipient_id`, `notification_logs.read_at`) → `erd/erd.md` 실재 ✓
  - 컴포넌트 ID 모두 `components.md` 사전 정의 ✓
  - SCR-DASHBOARD 등 모든 SCR-* → `ia/screen_list.md` 실재 ✓
  - 8개 필수 섹션 헤더(§1~§8) + 인덱스(§9) + 이슈 메모(§10) + 검증 ✓
- 보류·예외 사항:
  1. SCR-ERROR-404 화면설계서는 본 그룹 범위 외 (§9, §10)
- 검증자: claude (Step B 그룹 1 + ERD 보강 라운드)
