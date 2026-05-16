# 모임 레이더 화면설계서

- 화면 ID: SCR-RADAR
- 관련 spec: [spec/09_meeting_radar.md](../spec/09_meeting_radar.md)
- 관련 process: [process/proc_06_meeting_radar.md](../process/proc_06_meeting_radar.md)
- 관련 ERD: `schedules`, `schedule_participants`, `users`, `mentions` (참고)
- Phase: 3
- 최종 갱신: 2026-05-14

---

## 1. 개요

참석자(임원) 다중 선택 + 날짜 범위 입력 → 시스템이 각 임원의 기존 일정을 조회·충돌 계산 → 날짜×시간대(time_slot) 격자에 가용성(✅/🟡/❌) 표시 → 슬롯 클릭 시 `SCR-MODAL-SCHEDULE-FORM` 으로 위임하여 일정 등록.

| 기능 | 처리 |
|---|---|
| RAD-001 (참석자 선택) | 좌측/상단 영역: `[CHECKBOX]` 리스트 + `[DATE-RANGE]` + `[BTN: 가능 시간 조회]` |
| RAD-002 (충돌 계산 엔진) | 백엔드 호출 — UI 는 `[SKELETON]`/`[SPINNER]` |
| RAD-003 (가능 슬롯 표시) | 결과 영역: 날짜(행) × 시간대(열) `[CAL-SLOT]` 격자, 가로 스크롤 가능 |
| RAD-004 (슬롯 → 일정 등록) | `SCR-MODAL-SCHEDULE-FORM` 위임 (참석자·시작/종료 자동 prefill, PARTIAL 시 경고 배너) |

**시간대 슬롯 정의 (proc_06 + ERD `schedules.time_slot` 일치 채택)**: `morning`(00:00~11:59) / `lunch`(12:00~13:59) / `afternoon`(14:00~17:59) / `evening`(18:00~23:59). `allday` 일정은 4개 슬롯 전체에 영향.

> spec/09 RAD-002 의 "1시간 단위 09:00~18:00" 슬롯 정의는 proc_06·ERD enum 과 불일치. 본 설계서는 4개 슬롯 모델 채택 (§9 이슈 메모).

**참석자 최소 인원**: 2명 (proc_06 메인 플로우 C 분기). spec/09 의 "1명 이상" 은 proc 와 불일치 — proc 기준 채택 (§9 이슈 메모).

**권한**: `user` / `admin` 양쪽 모두 사용 가능 (`ia/screen_list.md`).

---

## 2. 레이아웃 구조

| 슬롯 | 사용 |
|---|---|
| `SL-HEADER` | 공통 헤더 |
| `SL-SIDEBAR` | "협업 > 모임 레이더" 메뉴 활성 |
| `SL-MAIN` | 페이지 헤더 + 좌측 입력 패널 + 우측 결과 격자 (데스크톱 2열) |
| `SL-FOOTER` | 공통 푸터 |
| `SL-OVERLAY` | `SCR-MODAL-SCHEDULE-FORM` (RAD-004) — 본 화면이 호출자 |
| `SL-TABBAR` (모바일) | "더보기 → 모임 레이더" |

---

## 3. 와이어프레임

### 3.1 SCR-RADAR — 데스크톱 (조회 전, 초기 상태)

```
┌─ SL-HEADER ────────────────────────────────────────────────────────┐
│ [☰] 임원 일정                          [🔔3] [🟢홍길동 ▾]            │
├─ SL-SIDEBAR ─┬─ SL-MAIN ─────────────────────────────────────────────────────┐
│ 일정          │ [H1: 모임 레이더]                                              │
│ 협업          │ ─────────────────────────────────────────────────────────────│
│ ▶ 모임레이더  │ ┌──────────── 입력 (좌) ──────┐┌──────── 결과 (우) ─────────┐│
│ 데이터        │ │ [H2: 참석자 선택]            ││                            ││
│ 관리자        │ │ [CHECKBOX: 전체 선택]        ││  [EMPTY: "참석자와 날짜를  ││
│               │ │ ─────────────────────────── ││   선택한 후 [BTN: 가능     ││
│               │ │ [CHECKBOX] 김철수 부사장     ││   시간 조회]를 눌러주세요"]││
│               │ │ [CHECKBOX] 이영희 전무       ││                            ││
│               │ │ [CHECKBOX] 박철수 상무       ││                            ││
│               │ │ [CHECKBOX] 홍길동 본부장     ││                            ││
│               │ │ ... (N명, 스크롤)            ││                            ││
│               │ │ [BADGE: 0명 선택됨]          ││                            ││
│               │ │ ─────────────────────────── ││                            ││
│               │ │ [H2: 조회 기간]              ││                            ││
│               │ │ [DATE-RANGE: 2026-05-14 ~   ││                            ││
│               │ │              2026-05-21]    ││                            ││
│               │ │ (※ 최대 30일)                ││                            ││
│               │ │ ─────────────────────────── ││                            ││
│               │ │ [BTN: 가능 시간 조회 (disabled)]                            ││
│               │ │                                                            ││
│ [BTN:+일정]   │ └──────────────────────────────┘└────────────────────────────┘│
└───────────────┴────────────────────────────────────────────────────────────────┘
```

### 3.2 SCR-RADAR — 데스크톱 (결과 표시)

```
┌─ SL-MAIN ───────────────────────────────────────────────────────────────┐
│ [H1: 모임 레이더]                                                        │
│ ───────────────────────────────────────────────────────────────────── │
│ ┌─ 입력 (요약 표시 모드) ──┐ ┌─ 결과 ───────────────────────────────────┐│
│ │ 참석자: 김철수, 이영희,  │ │ 범례: ✅ 전원 가능  🟡 일부 일정 있음     ││
│ │        박철수 [BADGE:3명]│ │       ❌ 전원 불가  (회색=과거)          ││
│ │ 기간: 2026-05-14         │ │ ───────────────────────────────────── ││
│ │      ~ 2026-05-21        │ │ ◀── 가로 스크롤 가능 ──▶                ││
│ │ [BTN: 조건 변경]         │ │                                          ││
│ │                          │ │ [CAL-SLOT 격자]                          ││
│ │                          │ │ ┌─────────┬───────┬───────┬───────┬───┐ ││
│ │                          │ │ │날짜      │오전☀️│점심🍱│오후💼│저녁🌙│ ││
│ │                          │ │ ├─────────┼───────┼───────┼───────┼───┤ ││
│ │                          │ │ │05-14(수)│✅ 3/3│🟡 2/3│✅ 3/3│❌ 0/3│ ││
│ │                          │ │ │05-15(목)│❌ 0/3│✅ 3/3│🟡 2/3│✅ 3/3│ ││
│ │                          │ │ │05-16(금)│✅ 3/3│✅ 3/3│✅ 3/3│🟡 2/3│ ││
│ │                          │ │ │05-17(토)│  주말  │  주말  │  주말  │ 주말 │ ││
│ │                          │ │ │05-18(일)│  주말  │  주말  │  주말  │ 주말 │ ││
│ │                          │ │ │05-19(월)│🟡 2/3│✅ 3/3│✅ 3/3│✅ 3/3│ ││
│ │                          │ │ │05-20(화)│✅ 3/3│🟡 2/3│✅ 3/3│✅ 3/3│ ││
│ │                          │ │ │05-21(수)│✅ 3/3│✅ 3/3│✅ 3/3│❌ 0/3│ ││
│ │                          │ │ └─────────┴───────┴───────┴───────┴───┘ ││
│ │                          │ │                                          ││
│ │                          │ │ [TOOLTIP] hover 시:                       ││
│ │                          │ │   "충돌: 박철수(분기 리뷰)"               ││
│ └──────────────────────────┘ └──────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────────────┘
```

### 3.3 SCR-RADAR — 데스크톱 (전 슬롯 ❌ 상태)

```
┌─ SL-MAIN ───────────────────────────────────────────────────────────────┐
│ [ALERT: warn] 선택된 기간에 전원 가능한 시간이 없습니다.                  │
│ ───────────────────────────────────────────────────────────────────── │
│ [CAL-SLOT 격자] (모든 셀 ❌ 표시, 클릭 불가)                              │
└─────────────────────────────────────────────────────────────────────────┘
```

### 3.4 슬롯 클릭 → SCR-MODAL-SCHEDULE-FORM 호출 (RAD-004)

```
                ┌─ MODAL: 일정 등록 (scr_03 위임) ──────┐
                │  새 일정 등록                       [×]│
                │  ───────────────────────────────────  │
                │  [BANNER: warn] (PARTIAL 슬롯인 경우)  │
                │    "박철수에게 기존 일정이 있습니다.   │
                │     계속 등록하시겠습니까?"            │
                │  ───────────────────────────────────  │
                │  유형: ( ) 개인 (●) 공통              │
                │  날짜 *      [DATE: 2026-05-14] (prefill)│
                │  시간대 *    [SELECT: 점심 ▾] (prefill)│
                │  참석자 *    [MENTION: 김철수, 이영희, 박철수] (prefill)│
                │  제목 *      [INPUT: 제목]            │
                │  ... (이하 scr_03_schedule 명세)      │
                │  ───────────────────────────────────  │
                │              [BTN: 취소][BTN: 저장]   │
                └────────────────────────────────────────┘
```

### 3.5 모바일 (BP-MOBILE)

```
┌─ SL-HEADER ──────────────────┐
│ [☰] 모임 레이더      [🔔3]   │
├──────────────────────────────┤
│ [ACCORDION: 조건 입력 ▾]      │
│   [CHECKBOX: 전체 선택]       │
│   [CHECKBOX] 김철수 부사장    │
│   [CHECKBOX] 이영희 전무      │
│   ... (스크롤)                │
│   [DATE-RANGE: 시작 ~ 종료]   │
│   [BTN: 가능 시간 조회]       │
├──────────────────────────────┤
│ 범례: ✅ 🟡 ❌                │
│                              │
│ ◀── 가로 스크롤 ──▶          │
│ ┌─────────┬───┬───┬───┬───┐ │
│ │날짜      │오전│점심│오후│저녁│ │
│ ├─────────┼───┼───┼───┼───┤ │
│ │05-14(수)│ ✅ │ 🟡 │ ✅ │ ❌ │ │
│ │... (N행) │   │   │   │   │ │
│ └─────────┴───┴───┴───┴───┘ │
│                              │
│ (셀 탭 → 일정 등록 풀스크린  │
│  모달 — scr_03 위임)         │
├─ SL-TABBAR ─────────────────-┤
│ 🏠 📅 ☰ 🔔 ⋯                │
└──────────────────────────────┘
```

### 3.6 상태별 와이어 (요약)

- 초기 (조회 전): 결과 영역 `[EMPTY: "참석자와 날짜를 선택한 후 조회"]`
- 로딩 (RAD-002 계산 중): `[SKELETON]` 격자 (행 N × 열 4) + 상단 `[SPINNER]` "충돌 계산 중…"
- 정상: 격자 + `[TOOLTIP]` 호버
- 빈 (업무일·슬롯 0건): `[EMPTY: "해당 기간에 조회 가능한 시간대가 없습니다 (주말만 포함된 범위입니다)"]`
- 전 슬롯 ❌: `[ALERT: warn]` "선택된 기간에 전원 가능한 시간이 없습니다"
- 에러 (RAD-002 실패): `[ALERT: error]` "충돌 계산에 실패했습니다 / [BTN: 재시도]"
- 권한 거부 (선택 임원이 DB 미존재): `[ALERT: warn]` "일부 임원을 찾을 수 없어 결과에서 제외했습니다 (1명)" + 격자는 정상 표시

---

## 4. 컴포넌트 사용 표

| 컴포넌트 ID | 본 화면 적용 |
|---|---|
| `[H1: 모임 레이더]` | 페이지 타이틀 |
| `[H2: 참석자 선택] / [H2: 조회 기간]` | 좌측 패널 섹션 헤더 |
| `[CHECKBOX: 전체 선택]` | 모든 활성 임원 토글 |
| `[CHECKBOX] 임원명` | 개별 참석자 선택 — proc_06 명시 "체크박스 리스트" |
| `[DATE-RANGE: 시작 ~ 종료]` | 조회 기간, 최대 30일 제약 |
| `[BADGE: N명 선택됨]` | 선택 인원 수, RAD-001 |
| `[BTN: 가능 시간 조회]` | primary, 0명 또는 1명 선택 시 disabled |
| `[BTN: 조건 변경]` | secondary, 결과 표시 시 입력 패널을 다시 펼침 |
| `[CAL-SLOT: 시간대]` | 격자 셀. 상태 `available`/`partial-conflict`/`full-conflict` (components.md §7.3) |
| `[TOOLTIP]` | 셀 hover 시 충돌 임원명 목록 |
| `[BANNER: warn]` | PARTIAL 슬롯 클릭 시 모달 상단 경고 (scr_03 모달 내부) |
| `[ALERT: warn]` | 전 슬롯 ❌ 상태 / 일부 임원 미존재 |
| `[ALERT: error]` | 충돌 계산 실패 |
| `[EMPTY]` | 초기 상태 / 슬롯 0건 |
| `[SKELETON]` | 계산 중 |
| `[SPINNER]` | 진행 표시 |
| `[INLINE-ERROR]` | 날짜 범위 30일 초과, 종료<시작 등 |
| `[ACCORDION]` | 모바일에서 조건 입력 영역 접기 |
| `[CARD]` | (선택) 결과 요약 카드 — proc/spec 외 부가 |
| `[MENTION]` | 참석자 prefill (RAD-004 위임 후, scr_03 폼) |
| `[MODAL]` | `SCR-MODAL-SCHEDULE-FORM` (scr_03 위임) |

신규 컴포넌트 추가 없음. `[CAL-SLOT]` 의 `selected` 상태는 components.md §7.3 에 기 정의됨.

---

## 5. 상호작용 명세

| 트리거 | 컴포넌트 | 이벤트 | 다음 상태/액션 | API (spec/process) |
|---|---|---|---|---|
| 페이지 진입 | — | 초기 로드 | 활성 임원 목록 조회 (`users WHERE role='user' AND status='active' AND deleted_at IS NULL`) | RAD-001 |
| 임원 체크 | `[CHECKBOX]` | onChange | 선택 배열 갱신, `[BADGE]` 카운트 갱신, 2명 이상 + 유효 기간 시 `[BTN: 가능 시간 조회]` 활성 | RAD-001 |
| 전체 선택 | `[CHECKBOX: 전체]` | onChange | 모든 임원 체크/해제 | RAD-001 |
| 날짜 변경 | `[DATE-RANGE]` | onChange | 30일 초과/종료<시작 검증 → `[INLINE-ERROR]` 또는 통과 | RAD-001 |
| "가능 시간 조회" | `[BTN]` | onClick | RAD-002 호출 → `[SKELETON]` → 결과 격자 렌더 | RAD-002 (`POST /api/radar/availability` 가정) |
| 결과 격자 호버 (PARTIAL/UNAVAILABLE) | `[CAL-SLOT]` | onHover | `[TOOLTIP]` 충돌 임원명 표시 | RAD-003 |
| 슬롯 클릭 (AVAILABLE) | `[CAL-SLOT]` | onClick | `SCR-MODAL-SCHEDULE-FORM` 오픈, `schedule_date`/`time_slot`/참석자 prefill | RAD-004 → SCH-001/COM-001 (scr_03 위임) |
| 슬롯 클릭 (PARTIAL) | `[CAL-SLOT]` | onClick | 위와 동일 + 모달 상단 `[BANNER: warn]` "N명에게 기존 일정 있음" | RAD-004 |
| 슬롯 클릭 (UNAVAILABLE) | `[CAL-SLOT]` | onClick | 무시 (클릭 비활성, `aria-disabled="true"`) | RAD-004 |
| 슬롯 클릭 (과거) | `[CAL-SLOT]` | onClick | 무시 (회색 처리, `aria-disabled="true"`) | proc 예외 처리 |
| 등록 완료 후 모달 닫힘 | — | onSuccess | 모달 닫기 + 격자 재계산 (RAD-002 재호출) → `[TOAST: success]` | RAD-004 사후 |
| "조건 변경" | `[BTN]` | onClick | 입력 패널 펼침, 결과 영역 초기화 | — |
| 권한·세션 만료 | — | API 401 | 로그인 페이지 리다이렉트 | AUTH-002 |

---

## 6. 데이터 바인딩 표

| UI 필드 | 표시 형식 | 데이터 소스 | 비고 |
|---|---|---|---|
| 참석자 체크리스트 | 이름·역할 | `users.name`, `users.role` | `users.role='user' AND users.status='active' AND users.deleted_at IS NULL` |
| 임원 색상 (보조 표시) | `#RRGGBB` | `users.color` | 체크박스 옆 색상 점 (CAL-004) |
| 선택 카운트 배지 | 숫자 | 클라이언트 상태 (선택된 `user.id` 배열 길이) | — |
| 조회 기간 | YYYY-MM-DD ~ YYYY-MM-DD | 클라이언트 입력 → 서버 전달 | 최대 30일 |
| 격자 행 (날짜) | YYYY-MM-DD (요일) | 조회 기간 generate_series | 주말은 회색·비활성 |
| 격자 열 (시간대) | morning/lunch/afternoon/evening | `schedules.time_slot` enum 값 | `allday` 는 4 슬롯 전체에 충돌로 반영 |
| 셀 상태 | ✅/🟡/❌ | RAD-002 결과: 충돌 임원 수 vs 전체 (계산 입력: `schedules.owner_id IN (...) OR schedule_participants.user_id IN (...)`, `schedules.schedule_date BETWEEN start AND end`, `schedules.deleted_at IS NULL`) | — |
| 셀 카운트 | `가용/전체` | `(전체 - 충돌) / 전체` | 예: ✅ 3/3 |
| 충돌 임원 툴팁 | 임원명 + 일정 제목 | `users.name`, `schedules.title` | hover 시 |
| 슬롯 클릭 prefill (날짜) | YYYY-MM-DD | 클릭한 셀의 `schedule_date` | RAD-004 → `schedules.schedule_date` |
| 슬롯 클릭 prefill (시간대) | enum | 클릭한 셀의 열 | RAD-004 → `schedules.time_slot` |
| 슬롯 클릭 prefill (참석자) | 사용자 ID 배열 | 좌측 패널 선택 임원 | RAD-004 → `schedule_participants.user_id` |

---

## 7. 화면 상태

| 상태 | 트리거 | UI |
|---|---|---|
| 초기 (입력 전) | 페이지 진입 | 좌측 입력 패널 + 우측 `[EMPTY: "참석자와 날짜를 선택한 후 조회"]` |
| 입력 진행 중 | 임원/날짜 입력 중 | `[BTN: 가능 시간 조회]` disabled 또는 활성 (2명 이상 + 유효 기간 시 활성) |
| 입력 오류 | 날짜 30일 초과 / 종료<시작 / 1명 선택 | `[INLINE-ERROR]` + `[BTN]` disabled |
| 로딩 (계산 중) | "조회" 클릭 후 | `[SKELETON]` 격자 + `[SPINNER]` "충돌 계산 중…" |
| 정상 결과 | RAD-002 응답 | `[CAL-SLOT]` 격자 렌더, 셀별 상태 표시 |
| 빈 (조회 기간에 업무일 0) | 주말만 포함 | `[EMPTY: "해당 기간에 조회 가능한 시간대가 없습니다"]` |
| 전 슬롯 ❌ | 모든 셀 UNAVAILABLE | 상단 `[ALERT: warn]` "전원 가능 시간 없음" + 격자는 표시 |
| 일부 임원 미존재 | 선택 임원 ID 가 DB 에 없음 | `[ALERT: warn]` "일부 임원을 찾을 수 없어 결과에서 제외했습니다 (1명)" + 격자는 부분 결과 |
| 에러 (계산 실패) | RAD-002 5xx/타임아웃 | `[ALERT: error]` "충돌 계산에 실패했습니다 / [BTN: 재시도]" |
| 슬롯 선택 (모달 열림) | AVAILABLE/PARTIAL 클릭 | `SCR-MODAL-SCHEDULE-FORM` 오픈 (PARTIAL 시 경고 배너) |
| 일정 등록 완료 | 모달 onSuccess | 모달 닫기 + RAD-002 재호출 (격자 갱신) + `[TOAST: success]` |
| 권한 거부 (세션 만료) | API 401 | 로그인 페이지 리다이렉트 |

---

## 8. 권한·접근성

### 8.1 권한별 노출

| 요소 | 미인증 | `user` | `admin` |
|---|:-:|:-:|:-:|
| 사이드바 "협업 > 모임 레이더" | ❌ | ✅ | ✅ |
| 페이지 본문 | ❌ | ✅ | ✅ |
| 참석자 체크리스트 | ❌ | ✅ (모든 활성 임원) | ✅ |
| 슬롯 클릭 → 모달 | ❌ | ✅ (`SCR-MODAL-SCHEDULE-FORM` 권한 위임) | ✅ |
| 대리 입력 (입력 대상 드롭다운) | ❌ | 권한 보유 시 모달에 노출 (PERM-003) | ✅ |

> 일반 임원이라도 모임 레이더 자체는 사용 가능. 일정 등록 시 권한 분기는 `SCR-MODAL-SCHEDULE-FORM` (scr_03) 에 위임.

### 8.2 접근성

- `[CAL-SLOT]` 셀: `role="gridcell"`, `aria-label="2026-05-14 점심 — 일부 가능 (2/3)"`, `aria-disabled="true"` (UNAVAILABLE/과거).
- 격자 컨테이너: `role="grid"`, 키보드 화살표 키로 셀 이동 (←→↑↓), `Enter`/`Space` 로 클릭.
- 가로 스크롤 컨테이너: `tabindex="0"` + `aria-label="시간대 격자, 가로 스크롤"`.
- `[CHECKBOX]`: `<label>` 연결, `Space` 토글. "전체 선택" 은 `aria-controls` 로 하위 체크박스 연결.
- `[DATE-RANGE]`: 종료<시작 시 `aria-invalid="true"` + `[INLINE-ERROR]`.
- `[TOOLTIP]`: `aria-describedby` 로 셀과 연결, `role="tooltip"`. 키보드 포커스 시에도 표시.
- 결과 영역 비주얼 색상(녹/노/빨)만으로 상태 전달 금지 — 아이콘(✅/🟡/❌) 과 텍스트(`3/3`) 병행.
- 모달 열림 시 포커스 트랩, `Esc` 닫기 (scr_03 명세 위임).

---

## 9. 이슈 메모 (spec/process 검토 중 발견)

1. **슬롯 정의 불일치** — `spec/09_meeting_radar.md` RAD-002 는 "업무 시간 09:00~18:00 을 1시간 단위 슬롯" 으로 정의. 반면 `process/proc_06_meeting_radar.md` 와 ERD `schedules.time_slot` enum 은 `morning/lunch/afternoon/evening/allday` 4종. 본 설계서는 **proc + ERD 4종 슬롯** 모델 채택 (SSOT 우선순위 §5.4: ERD > spec).
2. **최소 참석자 수 불일치** — spec/09 RAD-001 "1명 이상" vs proc_06 "최소 2명". "모임" 의 의미상 2명 이상이 합리적 — proc 기준 채택.
3. **`schedules.date`·`schedules.content` 표기 오류** — 일부 문서가 `date`/`content` 로 표기하나 ERD 는 `schedule_date`/`title` (memo 는 별도). 본 설계서는 ERD 기준.
4. **공통 일정 충돌 처리** — RAD-002 본문은 `schedules.owner_id` 기준만 명시하지만, 공통 일정(type=common, owner_id NULL)의 경우 `schedule_participants.user_id` 도 함께 조회해야 정확. 본 설계서는 양쪽 조회로 명시.
5. **components.md §8 의 `SCR-RADAR` 참석자 컴포넌트** — `[SELECT]` 로 기재되어 있으나 spec/proc 는 "체크박스 리스트" 로 명시. 본 설계서는 `[CHECKBOX]` 사용 (components.md §8 표기는 추후 정정 권장).

---

## 검증

- 자체 검증 일자: 2026-05-14
- 자체 검증 결과: ⚠️ 일부 통과 (spec/09 와 proc_06 사이 슬롯 정의 불일치 발견 — §9 이슈 메모로 기록, ERD+proc 기준 채택)
- 자동 검증 결과: ✅ 통과
  - 8개 필수 섹션 헤더 모두 존재 ✓
  - SCR-RADAR 식별자 ✓ (`ia/screen_list.md` 라인 49)
  - 데이터 바인딩 표의 모든 `테이블.컬럼` (`users.name/role/status/color/deleted_at`, `schedules.owner_id/schedule_date/time_slot/title/deleted_at`, `schedule_participants.user_id`) 이 `erd/erd.md` E01/E04/E05 에 실재 ✓
  - 사용 컴포넌트 모두 `components.md` 에 정의됨 ✓ (`H1/H2/CHECKBOX/DATE-RANGE/BADGE/BTN/CAL-SLOT/TOOLTIP/BANNER/ALERT/EMPTY/SKELETON/SPINNER/INLINE-ERROR/ACCORDION/CARD/MENTION/MODAL`)
  - 상호작용 표의 API 모두 spec/process 의 RAD-001~004 + scr_03 위임에 정의됨 ✓
  - 4종 상태(초기/로딩/정상/에러) + 권한 거부 모두 §7 에 정의 ✓
  - 권한 분기 §8 에 명시 ✓
- 보류·예외 사항:
  - §9 (1) 슬롯 정의 불일치는 spec/09 본문 수정이 필요한 사안 — 본 화면은 ERD+proc 기준으로 작성 (의도적 이슈 메모 기록).
  - §9 (2) 최소 참석자 수 불일치 동일.
  - §9 (5) `components.md` §8 의 `SCR-RADAR` 컴포넌트 표기 정정 권장 — 그룹 1/2 와 동시 편집 충돌 위험으로 본 라운드에서는 변경하지 않고 이슈 기록.
- 검증자: claude (Step B 그룹 3)
