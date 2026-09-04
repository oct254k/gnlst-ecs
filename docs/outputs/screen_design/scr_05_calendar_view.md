# 달력 뷰 (월/주/일) 및 날짜 상세 패널 화면설계서

- 화면 ID: SCR-CALENDAR, SCR-PANEL-DAY-DETAIL
- 관련 spec: [spec/05_calendar_view.md](../spec/05_calendar_view.md)
- 관련 process: [process/proc_03_schedule.md](../process/proc_03_schedule.md)
- 관련 ERD: `schedules`, `schedule_participants`, `users`, `holidays`, `mentions`
- Phase: 1 (CAL-001~009)
- 최종 갱신: 2026-05-14

---

## 1. 개요

| 화면 ID | 용도 | 관련 기능 ID |
|---|---|---|
| `SCR-CALENDAR` | 월/주/일 통합 달력 뷰. 임원별 색상 레이어, 공통 일정 별도 색, 공휴일 표시, 오늘 하이라이트, 빈 시간대 시각화 | CAL-001, CAL-002, CAL-003, CAL-004, CAL-005, CAL-006, CAL-008, CAL-009 |
| `SCR-PANEL-DAY-DETAIL` | 날짜 셀 클릭 시 우측 슬라이드 패널. 해당 날짜 일정 목록 | CAL-007 |

본 화면은 사이드바 메뉴 "달력" 으로 진입한다 (`/calendar`). 모바일에서는 하단 탭바의 📅 달력 항목이 동일 화면을 연다.

---

## 2. 레이아웃 구조

| 영역 | 사용 슬롯 | 비고 |
|---|---|---|
| 헤더 | `SL-HEADER` | 공통 |
| 좌측 사이드바 | `SL-SIDEBAR` (메뉴 트리) | 데스크톱 240px |
| 메인 컨텐츠 | `SL-MAIN` | 페이지 헤더 + 도구바 + 달력 본문 |
| 페이지 헤더 1차 액션 | `SL-MAIN` 페이지 헤더 슬롯 | `[BTN: + 일정 등록]` + `[BTN: + 공통 일정 등록]` (모든 인증 사용자) |
| 우측 도구 사이드 | `SL-MAIN` 우측 280px (데스크톱 only) | 임원 색상 레이어 체크박스 (CAL-004) |
| 날짜 상세 패널 | `SL-OVERLAY` `PANEL` (우측 슬라이드 400px) | CAL-007 트리거 시 |
| 모바일 탭바 | `SL-TABBAR` | 모바일 |
| 푸터 | `SL-FOOTER` | 데스크톱만 |

---

## 3. 와이어프레임

### 3.1 SCR-CALENDAR — 데스크톱 (월간 뷰)

```
┌── SL-HEADER ─────────────────────────────────────────────────────────────────┐
│ [☰][LOGO 임원 일정]  [SEARCH(Phase2)]        [🔔(3)][🟢 홍길동 ▾]            │
├──────┬──────────────────────────── SL-MAIN ────────────┬──────────────────┤
│ SL-  │ ◀ 뒤로  [H1: 달력]              [BTN: + 일정 등록] [⋮]            │ │
│ SIDE │ ─────────────────────────────────────────────────────────────── │ │
│ BAR  │ [CAL-HEADER:                                                     │ │
│      │   [BTN: ◀][BTN: 오늘][BTN: ▶]   2026년 5월   [CAL-VIEWSWITCH: 월/주/일]] │
│ 일정 │ ─────────────────────────────────────────────────────────────── │ │
│ ▸대시│ ┌─일──┬─월──┬─화──┬─수──┬─목──┬─금──┬─토──┐                      │ 임원 색상 레이어 │
│ ▸달력│ │ 28  │ 29  │ 30  │ 1   │ 2   │ 3   │ 4    │ ← 첫 칸(일) 빨강       │ [TOGGLE]         │
│ ▸리스│ │     │     │     │ [CAL│ [CAL│     │     │                      │ ● 박전무 ✅      │
│ ▸레이│ │     │     │     │-EVT │-EVT │     │     │                      │ ● 이상무 ✅      │
│ 데이 │ ├─────┼─────┼─────┼─────┼─────┼─────┼─────┤                      │ ● 김전무 ✅      │
│ 관리(a)│ │ 5   │ 6   │ 7   │ 8   │ 9   │ 10  │ 11(빨)│                  │ ● 최상무 ⬜      │
│      │ │     │     │     │     │     │     │     │                      │ ─────            │
│ + 일정│ │ [CAL-EVENT: 임원회의](박전무색) [CAL-EVENT: [공통] 워크숍](공통색) │ ● 공통(red) 강제│
│ +공통(a)│ ├─────┼─────┼─────┼─────┼─────┼─────┼─────┤                  │ 표시            │
│ +초대(a)│ │ 12  │ 13  │ 14[오늘]│ 15(빨 어린이날🎏)│ 16 │ 17 │ 18  │   │ ─────            │
│      │ │     │     │ ●●●(점)│ [TOOLTIP: 어린이날]│ │ │   │           │ [BTN-LINK: 전체  │
│      │ ├─────┼─────┼─────┼─────┼─────┼─────┼─────┤                      │  표시]          │
│      │ │ ... 5주차 ...                                                  │                  │
│      │ └─────┴─────┴─────┴─────┴─────┴─────┴─────┘                      │                  │
└──────┴────────────────────────────────────────────────────────────────────┴──────────────────┘
[SL-FOOTER: v0.1.0 · 도움말 · ?]
```

- 오늘(14일) 셀은 배경 `#EBF5FB`, 날짜 숫자에 파란 원형 배지 (CAL-008)
- 공휴일(15일 어린이날) 셀의 날짜 숫자는 빨강, hover 시 [TOOLTIP] (CAL-006)
- 일정이 4건 이상이면 "+N more" 표시
- 주 시작 요일: **일요일** (요일 헤더 일→토)
- 일/토요일은 보조 배경. out-of-month 일자는 회색 dim

### 3.2 SCR-CALENDAR — 데스크톱 (주간 뷰)

```
[CAL-HEADER: ◀ 오늘 ▶  2026.05.10~16  [CAL-VIEWSWITCH: 월/●주/일]]
────────────────────────────────────────────────────────────────────
       │ 일 10 │ 월 11 │ 화 12 │ 수 13 │ 목 14[오늘]│ 금 15(빨)│ 토 16 │
종일   │              [CAL-EVENT: [공통] 워크숍 (전 주 span)]            │
────────────────────────────────────────────────────────────────────
09:00  │       │ [CAL-EVENT │       │       │       │       │       │
       │       │  임원회의  │       │       │       │ 공휴일│       │
10:00  │       │  (박전무)] │ (빈 업무│       │       │ (음영)│       │
       │       │            │  시간 │       │       │       │       │
11:00  │       │            │  녹색)│       │       │       │       │
12:00  │       │ (점심 음영)│       │       │       │       │       │
14:00  │       │            │       │ [CAL-EVENT: 미팅               │
15:00  │       │            │       │  (이상무)] │   │       │       │
... 18:00 이후 비업무 시간 (회색 음영) ...
────────────────────────────────────────────────────────────────────
              ───── 현재 시각 선 (빨강) 14:35 ─────
```

- 빈 업무 시간 (09:00~18:00 내) 슬롯은 연녹색 `#F0FFF0` (CAL-009)
- 비업무 시간은 연회색 `#F5F5F5`
- 30분 단위 그리드. 중복 시 좌우 분할
- 종일 일정은 상단 종일 띠에 별도 표시

### 3.3 SCR-CALENDAR — 데스크톱 (일간 뷰)

```
[CAL-HEADER: ◀ 오늘 ▶  2026.05.14 (목)  [CAL-VIEWSWITCH: 월/주/●일]]
────────────────────────────────────────────────
시간     │ 일정
종일     │ (없음)
─────────┼──────────────────────────────────────
07:00    │ (비업무 시간 음영)
...
09:00    │ ┌─[CAL-EVENT: 임원회의]──┐
         │ │ ● 박전무                │
10:00    │ │ 09:00 ~ 10:00          │
         │ └─────────────────────────┘
10:00    │ (빈 업무 시간 연녹색)
...
12:00    │ (점심 음영)
14:00    │ ┌─[CAL-EVENT: 미팅]──────┐
15:00    │ │ ● 이상무  ⓘ            │
         │ └─────────────────────────┘
... 18:00 이후 비업무 시간 ...
─────────┴──────────────────────────────────────
              현재 시각 선 ───── 14:35
```

- 15분 단위 그리드 (CAL-003)
- 이미 일간 뷰에서 동일 날짜 클릭 → 패널 토글 (닫기)

### 3.4 SCR-CALENDAR — 모바일 (월간)

```
┌──────────────────────────────┐
│ [☰] 달력             [🔔(3)] │← SL-HEADER 56px
├──────────────────────────────┤
│ [CAL-HEADER:                  │
│   ◀ 2026.05 ▶               │
│   [SEGMENT: 월/주/일]]        │
├──────────────────────────────┤
│ 일월화수목금토                │
│ 28 29 30 1  2  3  4(빨)      │
│              ··  ··           │
│ 5  6  7  8  9  10 11(빨)     │
│ ··           ··               │
│ 12 13 14 15 16 17 18         │
│       ●  ●●               (오늘 14: 파랑 배지) │
│           (15 빨: 어린이날)   │
│ 19 20 21 22 23 24 25         │
│ 26 27 28 29 30 31 1          │
├──────────────────────────────┤
│ [BTN: + 일정 등록 (FAB 또는 하단 고정)] │
├──────────────────────────────┤
│ 🏠 📅 ☰  🔔(3) ⋯            │← SL-TABBAR (달력 활성)
└──────────────────────────────┘
```

- 월간 셀에는 일정 도트만 (최대 3개). 셀 탭 → 모바일 fullscreen 으로 SCR-PANEL-DAY-DETAIL
- 임원 색상 레이어는 SL-TABBAR ⋯ → "필터" 진입 또는 [BTN-ICON: 필터] 토글로 BOTTOMSHEET 노출

### 3.5 SCR-PANEL-DAY-DETAIL — 데스크톱 (우측 슬라이드 패널)

```
부모(SCR-CALENDAR 월간 뷰) 위에 우측에서 슬라이드 인
┌── SL-OVERLAY PANEL (400px, z=30) ──┐
│ [H2: 2026년 5월 14일 (목)]   [×]    │
│ ───────────────────────────────────  │
│ [BADGE: 오늘]                       │
│ (공휴일이면 [BADGE: 어린이날])      │
│ ───────────────────────────────────  │
│ 일정 (3건)                          │
│ ┌────────────────────────────────┐ │
│ │ 09:00 ~ 10:00  ● 박전무        │ │
│ │ 임원회의                        │ │ ← 클릭 → SCR-MODAL-SCHEDULE-DETAIL
│ │ 📍 본사 3층                     │ │
│ ├────────────────────────────────┤ │
│ │ 14:00 ~ 15:30  ● 이상무        │ │
│ │ [공통] 워크숍                   │ │
│ │ 📍 양재 사옥                    │ │
│ ├────────────────────────────────┤ │
│ │ 종일           ● 김전무        │ │
│ │ 출장 (서울→부산)                │ │
│ └────────────────────────────────┘ │
│ ───────────────────────────────────  │
│ [BTN: 일간 뷰로 이동][BTN: + 등록]   │
└─────────────────────────────────────┘
```

### 3.6 상태별 와이어

```
[로딩]
[CAL-HEADER]
[SKELETON: 달력 그리드 (셀 35개)]

[에러 — 일정 조회 실패]
[CAL-HEADER]
[ALERT(error): 일정을 불러오지 못했습니다 [BTN-LINK: 다시 시도]]
달력은 빈 셀로 렌더 (CAL-001 예외 처리)

[빈 — 전체 임원 레이어 OFF]
[CAL-HEADER]
달력 그리드는 표시. 일정 0건.
[ALERT(info): 표시 중인 일정이 없습니다. 우측에서 임원을 선택해주세요.]  (CAL-004 예외)

[빈 — 일간 뷰 일정 없음]
[CAL-HEADER (일간 모드)]
시간표 렌더.
[EMPTY: 이 날 일정이 없습니다]

[권한 거부]
달력은 user/admin 모두 접근. 권한 거부 케이스 없음 (PERM-004).
미인증 시 자동 리다이렉트 → SCR-LOGIN.
```

---

## 4. 컴포넌트 사용 표

| 컴포넌트 ID | 본 화면 적용 사양 | 사용 위치 |
|---|---|---|
| `[CAL-HEADER]` | 좌측: 이전/오늘/다음, 중앙: 월·연 표시, 우측: 뷰 토글 | 메인 상단 |
| `[CAL-VIEWSWITCH: 월/주/일]` | SEGMENT 의 달력 특수 케이스. URL 쿼리 `?view=month|week|day` 동기 | 헤더 우측 |
| `[CAL-CELL: 날짜]` | 상태: default/today/selected/weekend/holiday/out-of-month. 클릭 → PANEL (월간), 일간이면 토글 닫기 | 월간 그리드 |
| `[CAL-EVENT: 제목]` | variant: dot(월간 종일·요약), chip(월간 시간형), bar(주/일 시간형). 색: `users.color` (공통은 시스템 색 #E74C3C) | 월/주/일 |
| `[TOOLTIP]` | 공휴일명, 일정 풀텍스트(말줄임 시) | 공휴일 날짜·CAL-EVENT hover |
| `[TOGGLE: 임원 색상 레이어]` | 임원별 on/off, 브라우저 저장 (localStorage). 공통 일정은 영향 없음 | 우측 사이드 |
| `[AVATAR: 임원 색상 도트]` | color variant, 임원 필터 좌측 | 우측 사이드 |
| `[TAG: 공통 / 개인]` | 색: 공통=primary, 개인=neutral | CAL-EVENT 라벨 |
| `[BTN: ◀ / ▶ / 오늘]` | secondary | CAL-HEADER |
| `[BTN: + 일정 등록]` | primary. SCR-MODAL-SCHEDULE-FORM 호출 (오늘 또는 선택 날짜 프리필) | 페이지 헤더 / 모바일 FAB |
| `[BTN: + 공통 일정 등록]` | primary. 폼 공통 모드로 진입. 모든 인증 사용자 가능 (2026-05-14 결정) | 페이지 헤더 |
| `[DROPDOWN: 더보기 ⋮]` | 인쇄(Phase2), 도움말 등 | 페이지 헤더 우측 |
| `[PANEL: 날짜 상세]` | 우측 400px (데스크톱), 모바일 fullscreen. role="dialog" (CAL-007) | SL-OVERLAY |
| `[BADGE: 오늘 / 공휴일]` | 패널 헤더 | 패널 |
| `[LIST: 일정 카드]` | 시간순. 카드 형식. 각 카드 클릭 → SCR-MODAL-SCHEDULE-DETAIL | 패널 본문 |
| `[EMPTY: 이 날 일정이 없습니다]` | 패널 본문 (일정 0건) | 패널 |
| `[BTN-ICON: 닫기 ×]` | aria-label="닫기" | 패널 우상단 |
| `[BTN: 일간 뷰로 이동]` | secondary. 패널 → 부모 달력 view=day 로 전환 | 패널 푸터 |
| `[BTN: + 등록]` (패널) | primary. 해당 날짜 프리필로 SCR-MODAL-SCHEDULE-FORM | 패널 푸터 |
| `[SEGMENT: 월/주/일]` (모바일) | CAL-VIEWSWITCH 의 모바일 대체 | 모바일 헤더 |
| `[BOTTOMSHEET: 임원 필터]` | 모바일에서 임원 레이어 토글 | 모바일 |
| `[SKELETON]` | 달력 그리드 / 시간표 초기 로딩 | 본문 |
| `[ALERT: 메시지]` | 조회 실패 / 전체 OFF 안내 | 본문 |
| `[TOAST]` | 일정 등록·삭제 직후 (부모 화면 연쇄) | SL-OVERLAY |

> 신규 컴포넌트 추가 없음. `[CAL-CELL]`, `[CAL-EVENT]`, `[CAL-HEADER]`, `[CAL-VIEWSWITCH]` 는 components.md §7 정의 활용.

---

## 5. 상호작용 명세

### 5.1 SCR-CALENDAR

| 트리거 | 컴포넌트 | 이벤트 | 다음 상태/액션 | API (기능 ID) |
|---|---|---|---|---|
| 진입 | URL `/calendar?view=month&date=2026-05-14` | mount | 해당 월/주/일 데이터 fetch | `CAL-001` / `CAL-002` / `CAL-003` |
| 뷰 전환 | `[CAL-VIEWSWITCH]` / `[SEGMENT]` | onChange | URL 쿼리 갱신, 재조회 | `CAL-001~003` |
| 이전/다음 | `[BTN: ◀]` / `[BTN: ▶]` | onClick | 기준 날짜 ±1 단위 (월/주/일별), 재조회 | — |
| 오늘 | `[BTN: 오늘]` | onClick | 기준 날짜 = 시스템 오늘. 재조회. 자정 전환 감지 | `CAL-008` |
| 임원 토글 | `[TOGGLE: 임원 색상]` | onChange | localStorage 저장 + 클라이언트 필터 (재조회 없음, 같은 데이터로 화면만 필터링) | `CAL-004` |
| 전체 표시 | `[BTN-LINK: 전체 표시]` | onClick | 모든 임원 ON | — |
| 셀 클릭 (월간) | `[CAL-CELL]` | onClick | SCR-PANEL-DAY-DETAIL 열기 (해당 날짜) | `CAL-007` |
| 셀 클릭 (일간 동일 날짜) | `[CAL-CELL]` | onClick | 패널 토글 (닫기) | `CAL-003` 5단계 |
| 이벤트 클릭 | `[CAL-EVENT]` | onClick | SCR-MODAL-SCHEDULE-DETAIL 열기 (해당 `schedules.id`) | `SCH-005` |
| 공휴일 hover | 공휴일 날짜 숫자 | onMouseEnter | `[TOOLTIP]` 공휴일명. `holidays.name`/`original_holiday_name` 분기 | `CAL-006` |
| 일정 등록 | `[BTN: + 일정 등록]` | onClick | SCR-MODAL-SCHEDULE-FORM. 현재 선택 날짜 프리필 | `SCH-001` |
| 공통 일정 등록 | `[BTN: + 공통 일정]` | onClick | SCR-MODAL-SCHEDULE-FORM 공통 모드. 모든 인증 사용자 가능 | `COM-001` |
| 데이터 조회 실패 | (응답 오류) | — | `[ALERT(error)]` + 빈 달력 + 재시도 버튼. 10초 후 자동 1회 재시도 | `CAL-001` 예외 |
| 시간 흐름 (자정) | (시간) | tick | 오늘 셀 재계산, 강조 위치 갱신 | `CAL-008` |

### 5.2 SCR-PANEL-DAY-DETAIL

| 트리거 | 컴포넌트 | 이벤트 | 다음 상태/액션 | API (기능 ID) |
|---|---|---|---|---|
| 진입 | 부모의 `[CAL-CELL]` 클릭 | (외부) | 패널 슬라이드 인, 해당 날짜 일정 fetch 또는 캐시 필터 | `CAL-007` |
| 일정 카드 클릭 | `[LIST: 일정 카드 항목]` | onClick | SCR-MODAL-SCHEDULE-DETAIL 열기 | `SCH-005` |
| 일간 뷰 이동 | `[BTN: 일간 뷰로 이동]` | onClick | 부모 SCR-CALENDAR view=day, date=해당 날짜로 전환. 패널 닫기 | `CAL-003` |
| 등록 | `[BTN: + 등록]` | onClick | SCR-MODAL-SCHEDULE-FORM. 해당 날짜 프리필 | `SCH-001` |
| 닫기 | `[BTN-ICON: ×]` / ESC / Backdrop 클릭 | onClick | 패널 닫기. 부모 달력 잔류 | — |
| 다른 날짜 클릭 (패널 열린 상태) | 부모 `[CAL-CELL]` | onClick | 패널 내용 즉시 교체 (재마운트 없음) | `CAL-007` 예외 |

---

## 6. 데이터 바인딩 표

### 6.1 달력 그리드 ↔ ERD

| UI 필드 | 표시 형식 | 데이터 소스 | 비고 |
|---|---|---|---|
| 월/주/일 기준 날짜 | URL 쿼리 | (URL `date`) | `YYYY-MM-DD` |
| 날짜 셀 | CAL-CELL | (날짜 범위 계산, 화면 측) | — |
| 오늘 표시 | CAL-CELL state=today | 시스템 시각 | CAL-008 |
| 일정 마커 (월간) | CAL-EVENT variant=dot/chip | `schedules` WHERE `schedule_date BETWEEN range AND deleted_at IS NULL` | — |
| 일정 바 (주/일간) | CAL-EVENT variant=bar | `schedules.start_time`, `schedules.end_time`, `schedules.is_all_day` | 종일은 상단 띠 |
| 이벤트 색상 | (스타일) | `users.color` (`users.id=schedules.owner_id`) | 공통(`schedules.type='common'`) 은 시스템 색 #E74C3C 강제 (CAL-005) |
| 이벤트 라벨 | 텍스트 | `schedules.title` | 길이 초과 시 말줄임 + 툴팁 |
| 임원별 레이어 필터 | TOGGLE | (클라이언트 상태, localStorage) | `users.id` 별 표시 여부 |
| 공통 일정 라벨 | TAG | `schedules.type='common'` | "[공통]" 프리픽스 |
| 공휴일 날짜 색 | 스타일 | `holidays.holiday_date` WHERE `is_active=true AND deleted_at IS NULL` AND year 매칭 | 색: red |
| 공휴일 툴팁 | TOOLTIP | `holidays.name`, `holidays.type`, `holidays.original_holiday_name` | 유형별 포맷 (`statutory` → "{name}", `substitute` → "대체 {original_holiday_name}", `temporary` → "임시 공휴일: {name}") |
| 빈 업무 시간 슬롯 | 배경색 | (계산: 09:00~18:00 내 30분 슬롯 중 schedules 비매칭) | CAL-009. 월간 뷰는 미적용 |
| 비업무 시간 | 배경색 | (계산: 슬롯 ∉ 09:00~18:00) | 회색 |
| 현재 시각 선 | 빨강 수평선 | 시스템 시각 | 주/일 뷰만 |

### 6.2 SCR-PANEL-DAY-DETAIL ↔ ERD

| UI 필드 | 표시 형식 | 데이터 소스 | 비고 |
|---|---|---|---|
| 날짜·요일 | H2 | (URL/선택 날짜) | `YYYY년 M월 D일 (요일)` |
| 오늘 배지 | BADGE | 시스템 시각 비교 | "오늘" |
| 공휴일 배지 | BADGE | `holidays` 매칭 | `holidays.name` |
| 일정 카드 시간 | 텍스트 | `schedules.start_time`, `schedules.end_time` | NULL 시 "종일" 또는 시간대 라벨 |
| 일정 카드 임원 도트 | AVATAR color | `users.color` (`users.id=schedules.owner_id`) — 공통은 시스템 색 | — |
| 일정 카드 제목 | 텍스트 | `schedules.title` | — |
| 일정 카드 장소 | 텍스트 | `schedules.location` | NULL 시 미표시 |
| 공통 일정 배지 | TAG | `schedules.type='common'` | "[공통]" |
| 일정 카드 멘션 (옵션) | CHIP | `mentions.schedule_id=…` | 모바일은 생략 가능 |
| 일정 건수 | 텍스트 | `COUNT(schedules WHERE schedule_date=… AND deleted_at IS NULL)` | "일정 (3건)" |
| 빈 상태 | EMPTY | (count=0) | "이 날 일정이 없습니다" |

### 6.3 임원 필터 옵션 ↔ ERD

| UI 필드 | 데이터 소스 | 비고 |
|---|---|---|
| 임원 목록 | `users` WHERE `role='user' AND status='active' AND deleted_at IS NULL` ORDER BY `name` | — |
| 임원 색상 | `users.color` | NULL 시 시스템 기본 색 (회색) |
| 임원 이름 | `users.name` | — |
| ON/OFF 상태 | (localStorage `calendar_layer_visibility`) | 사용자 id 별 boolean 맵 |

---

## 7. 화면 상태

| 상태 | 표현 |
|---|---|
| 빈 — 일정 0건 (월간/주간) | 달력 그리드는 정상 렌더. 셀에 마커 없음. 별도 EMPTY 표시 없음. |
| 빈 — 일정 0건 (일간) | 시간표 정상 렌더. `[EMPTY: 일정이 없습니다]` 본문 영역에 안내. |
| 빈 — 전체 임원 레이어 OFF | `[ALERT(info): 표시 중인 일정이 없습니다]` (CAL-004 예외) |
| 빈 — 날짜 패널 0건 | 패널에 `[EMPTY: 이 날 일정이 없습니다]` |
| 로딩 | `[SKELETON]` 달력 그리드 (35셀) 또는 시간표 골격. 10초 초과 시 재시도 1회 |
| 에러 | `[ALERT(error): 일정을 불러오지 못했습니다 [BTN-LINK: 다시 시도]]`. 달력 그리드는 빈 셀로 렌더 |
| 성공 | 일반 표시. 일정 변경 직후 부모로 복귀하면 즉시 반영 (낙관적 업데이트). `[TOAST]` 상위에서 처리 |
| 권한 거부 | 본 화면은 user/admin 공통 접근. 미인증 시 SCR-LOGIN 으로 리다이렉트 (PERM-004) |
| 공휴일 데이터 로드 실패 | 날짜 색상 기본값 유지, 오류 로그 (CAL-006 예외). 사용자 알림 없음 |

---

## 8. 권한·접근성

### 8.1 권한별 노출 차이

| 요소 | `user` | `admin` |
|---|:-:|:-:|
| 본 화면 접근 | ✅ | ✅ |
| `[BTN: + 일정 등록]` | ✅ (개인만) | ✅ |
| `[BTN: + 공통 일정 등록]` | ❌ (페이지 헤더 미노출) | ✅ |
| 임원 색상 레이어 목록 | 전체 임원 표시 | 전체 임원 표시 |
| 공통 일정 셀 클릭 → 상세 | ✅ | ✅ |
| 공통 일정 상세에서 [수정][삭제] | ❌ | ✅ |
| 개인 일정 상세에서 [수정][삭제] | 본인 일정만 + 대리권한 보유 임원 일정 | 전체 |

### 8.2 접근성

| 항목 | 규칙 |
|---|---|
| 달력 그리드 | `role="grid"`, 셀 `role="gridcell"`, 헤더 `role="columnheader"` |
| 셀 키보드 | ↑↓←→ 셀 이동, Enter 패널 열기, Space 동일 |
| 오늘 셀 | `aria-current="date"` |
| 공휴일 셀 | `aria-label="2026년 5월 15일, 어린이날"` |
| 이벤트 | `aria-label="09:00 임원회의, 박전무"`, Enter 시 상세 모달 |
| 임원 토글 | `role="switch"`, `aria-checked`, `aria-label="박전무 일정 표시"` |
| 뷰 토글 | `role="tablist"`, 각 `role="tab"`, `aria-selected` |
| 패널 (PANEL) | `role="dialog"`, `aria-labelledby` → 날짜 H2 ID, ESC 닫기, 포커스 트랩 |
| 모바일 BOTTOMSHEET | 동일 dialog role, 핸들 영역 swipe down 닫기 |
| 색상 정보 단독 사용 금지 | 공통 일정은 색 + "[공통]" 텍스트 라벨 병기 (CAL-005) |
| 색약 대응 | 공통 색상 #E74C3C 외에 텍스트 라벨로 식별 가능 |

---

## 이슈 메모

- spec/05 CAL-001~009 의 색상 hex (`#4A90D9`, `#E74C3C` 등) 는 예시이며, 실제 임원 색상은 ERD `users.color` 가 SSOT. 공통 일정 시스템 색만 상수로 고정.
- spec/05 의 임원별 체크박스 ON/OFF "브라우저 저장" 은 localStorage 사용을 의도하며, 본 문서에서 명시. (DB 컬럼 없음.)
- spec/05 CAL-009 "업무 시간대 설정 페이지" 는 1차 범위 외(기본값 09:00~18:00 고정). 본 문서에서 기본값만 적용.

---

## 검증

- 자체 검증 일자: 2026-05-14
- 자체 검증 결과: ✅ 통과
- 자동 검증 결과: ✅ 통과
  - 8개 필수 섹션 헤더 모두 존재 ✓
  - SCR-CALENDAR, SCR-PANEL-DAY-DETAIL 둘 다 ia/screen_list.md 에 존재 ✓
  - 데이터 바인딩 표의 모든 `테이블.컬럼` (`schedules.schedule_date/start_time/end_time/is_all_day/title/location/type/owner_id/deleted_at/id`, `users.color/name/id/role/status/deleted_at`, `holidays.holiday_date/name/type/year/original_holiday_name/is_active/deleted_at`, `mentions.schedule_id`) 모두 erd.md 에 실재 ✓
  - 사용 컴포넌트(CAL-HEADER, CAL-VIEWSWITCH, CAL-CELL, CAL-EVENT, TOOLTIP, TOGGLE, AVATAR, TAG, BTN, BTN-LINK, BTN-ICON, DROPDOWN, PANEL, BADGE, LIST, EMPTY, SEGMENT, BOTTOMSHEET, SKELETON, ALERT, TOAST) 모두 components.md 정의 ✓
  - 상호작용 API 가 spec/05 CAL-001~009 및 process/proc_03 와 일치 ✓
  - 4종 상태 + 권한 분기 정의 ✓
- 보류·예외 사항:
  - 업무 시간 변경 설정 화면(spec/05 CAL-009 의 "설정 페이지에서 변경 가능") 은 1차 범위 외. 기본값 09:00~18:00 고정 (의도적 보류)
  - 인쇄·iCal 내보내기는 Phase 2 이후 (보류)
- 검증자: claude (Step B 그룹 2)
