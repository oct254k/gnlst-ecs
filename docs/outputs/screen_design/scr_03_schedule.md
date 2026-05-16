# 일정 등록·수정·상세·삭제 모달 화면설계서

- 화면 ID: SCR-MODAL-SCHEDULE-FORM, SCR-MODAL-SCHEDULE-DETAIL, SCR-MODAL-CONFIRM-DELETE
- 관련 spec: [spec/03_schedule.md](../spec/03_schedule.md)
- 관련 process: [process/proc_03_schedule.md](../process/proc_03_schedule.md)
- 관련 ERD: `schedules`, `schedule_participants`, `mentions`, `proxy_permissions`, `audit_logs`, `notification_logs`, `users`
- Phase: 1
- 최종 갱신: 2026-05-14

---

## 1. 개요

본 문서는 일정 도메인의 3개 모달을 정의한다.

| 모달 ID | 용도 | 관련 기능 ID |
|---|---|---|
| `SCR-MODAL-SCHEDULE-FORM` | 일정 등록·수정 폼 (개인/공통 모드 통합). 모임 레이더 슬롯 프리필 진입 케이스 포함 | SCH-001 / SCH-002 / SCH-003 / SCH-006 / COM-001 / COM-003 / MEN-001 / RAD-004 / RES-002 |
| `SCR-MODAL-SCHEDULE-DETAIL` | 일정 상세 조회 (수정·삭제 진입점, 이력 탭) | SCH-005 / COM-002 / COM-004 / PERM-003 |
| `SCR-MODAL-CONFIRM-DELETE` | 삭제 확인 (일정/공휴일/연락처 공용. 본 문서에서는 일정 삭제 시나리오 중심으로 정의) | SCH-004 / COM-004 |

3개 모달은 모두 `SL-OVERLAY` 슬롯에서 `z-index 20` (Modal + Backdrop) 으로 렌더되며, 백드롭 클릭/ESC로 닫힌다. 단 `SCR-MODAL-CONFIRM-DELETE`는 백드롭 클릭 무시 (오작동 방지).

> 공통 일정의 폼은 본 SCR-MODAL-SCHEDULE-FORM 의 "공통 모드"이며, 공통 일정 고유 동작(참가자 자기 추가, 전체 알림 발송 등)은 [scr_07_common_schedule.md](./scr_07_common_schedule.md) 에서 보강 정의한다.

---

## 2. 레이아웃 구조

| 영역 | 사용 슬롯 (`common_layout.md`) | 비고 |
|---|---|---|
| 부모 화면 | `SL-MAIN` (SCR-CALENDAR / SCR-LIST / SCR-RADAR 위) | 모달이 떠 있어도 부모는 유지 |
| 백드롭 | `SL-OVERLAY` `BACKDROP` z-index 20 | 클릭 닫기 (Confirm-Delete 제외) |
| 모달 컨테이너 | `SL-OVERLAY` `MODAL` z-index 20 | 데스크톱 max-width 640px / 모바일 fullscreen (RES-001) |
| 토스트 (저장/삭제 결과) | `SL-OVERLAY` `TOAST` z-index 50 | 모달 닫힘 후에도 부모 위에 잔류 |
| 대리 입력 배너 | 모달 본문 상단 `BANNER` | 폼의 입력 대상이 본인 외 임원일 때만 노출 |

키보드 / 포커스:

- 진입 시 첫 입력 필드(폼) 또는 제목 닫기 버튼(상세/삭제)에 포커스
- `Esc` 닫기 (저장 진행 중에는 잠금. `aria-busy="true"`)
- 포커스 트랩 적용
- 모바일에서는 1차 액션 버튼이 화면 하단 고정 (RES-002)

---

## 3. 와이어프레임

### 3.1 SCR-MODAL-SCHEDULE-FORM — 데스크톱 (개인 모드, 일반 임원)

```
┌──────────────────────────── BACKDROP (z=20) ───────────────────────────┐
│                                                                        │
│   ┌────────────────────────── MODAL (640px) ─────────────────────────┐ │
│   │ [H2: 일정 등록]                                          [BTN-ICON: 닫기] │
│   ├──────────────────────────────────────────────────────────────────┤ │
│   │ [SEGMENT: 개인 / 공통]                  ※ 모든 인증 사용자 활성     │ │
│   │                                                                  │ │
│   │ [SELECT: 입력 대상] ▾  ← 본인 + 대리권한 보유 임원 (proxy_permissions)│ │
│   │   (단일: 본인 자동 선택, 변경 없음)                                 │ │
│   │                                                                  │ │
│   │ [INPUT: 일정 내용 *]   1~200자                                     │ │
│   │ ┌──────────────────────────────────────────────────────────────┐ │ │
│   │ │ 임원회의                                                       │ │ │
│   │ └──────────────────────────────────────────────────────────────┘ │ │
│   │                                                                  │ │
│   │ [DATE: 날짜 *]            [TOGGLE: 종일]                          │ │
│   │ ┌────────────┐            ○────  off                              │ │
│   │ │ 2026-05-11 │                                                    │ │
│   │ └────────────┘                                                    │ │
│   │                                                                  │ │
│   │ [SELECT: 시간대 *]    [TIME: 시작]   [TIME: 종료]                 │ │
│   │ ┌──────────┐         ┌────────┐   ┌────────┐                     │ │
│   │ │ 오전 ▾   │         │ 09:00  │ ~ │ 10:00  │                     │ │
│   │ └──────────┘         └────────┘   └────────┘                     │ │
│   │   (시작 시간 입력 시 시간대 자동 매핑, 수동 변경 시 덮어씀)         │ │
│   │                                                                  │ │
│   │ [INPUT: 장소]            최대 100자                                │ │
│   │                                                                  │ │
│   │ [MENTION: @멘션]         @회사 / @사람 자동완성                    │ │
│   │ [CHIP: @삼성전자] [CHIP: @홍길동 ✕]  ... (N건)                     │ │
│   │                                                                  │ │
│   │ [TEXTAREA: 비고]         최대 500자  · 글자수 카운터              │ │
│   │                                                                  │ │
│   ├──────────────────────────────────────────────────────────────────┤ │
│   │                              [BTN: 취소(보조)] [BTN: 저장(primary)] │ │
│   └──────────────────────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────────────────────┘
```

### 3.2 SCR-MODAL-SCHEDULE-FORM — 대리 입력 케이스 (입력 대상이 본인 외 임원)

```
┌── MODAL ─────────────────────────────────────────────────────────────┐
│ [H2: 일정 등록]                                          [BTN-ICON: ×] │
├──────────────────────────────────────────────────────────────────────┤
│ [BANNER (info): 김비서님이 박전무 이름으로 입력 중]                    │
│                                                                      │
│ [SEGMENT: 개인 / 공통]                                                │
│ [SELECT: 입력 대상] ▾   ← 박전무 ▾ (드롭다운에는 본인 + 대리 권한 보유 임원만)│
│                                                                      │
│ ... (이하 3.1 폼과 동일)                                              │
└──────────────────────────────────────────────────────────────────────┘
```

### 3.3 SCR-MODAL-SCHEDULE-FORM — 공통 모드 (admin)

```
┌── MODAL ─────────────────────────────────────────────────────────────┐
│ [H2: 공통 일정 등록]                                     [BTN-ICON: ×] │
├──────────────────────────────────────────────────────────────────────┤
│ [SEGMENT: ●공통 / 개인]   ※ 모든 인증 사용자 활성                     │
│                                                                      │
│ [SELECT: 알림 발송 대상 (다중)] ▾    [BTN-LINK: 전체 선택]            │
│ [CHIP: 박전무 ✕][CHIP: 이상무 ✕] ... (N명)                            │
│                                                                      │
│ [INPUT: 일정 내용 *]                                                  │
│ [DATE: 날짜 *]   [TOGGLE: 종일]   [SELECT: 시간대]                    │
│ [TIME: 시작]  ~  [TIME: 종료]                                         │
│ [INPUT: 장소]                                                         │
│ [MENTION: @멘션]                                                      │
│ [TEXTAREA: 비고]                                                      │
├──────────────────────────────────────────────────────────────────────┤
│                                       [BTN: 취소] [BTN: 저장]         │
└──────────────────────────────────────────────────────────────────────┘
```

> 공통 모드의 참가자 자기 추가 (COM-002) 는 본 폼이 아닌 `SCR-MODAL-SCHEDULE-DETAIL` 에서 처리. 폼은 알림 발송 대상만 다룬다. 자세한 분리는 [scr_07_common_schedule.md](./scr_07_common_schedule.md) §5 참조.

### 3.4 SCR-MODAL-SCHEDULE-FORM — 모임 레이더 슬롯 프리필 진입 (RAD-004)

```
SCR-RADAR 에서 [CAL-SLOT: 2026-05-14 오후] 클릭
            ↓
┌── MODAL ─────────────────────────────────────────────────────────────┐
│ [H2: 일정 등록]                                          [BTN-ICON: ×] │
├──────────────────────────────────────────────────────────────────────┤
│ [SEGMENT: 개인 / ●공통]   ← 레이더 결과(참가자 선택됨)에 따라 자동 결정 │
│                                                                      │
│ [SELECT: 알림 발송 대상]                                              │
│ [CHIP: 박전무][CHIP: 이상무]   ← 레이더 검색 시 선택 참가자 자동 프리필 │
│                                                                      │
│ [INPUT: 일정 내용 *]   (빈 값 — 사용자 입력 필요)                     │
│ [DATE: 2026-05-14]    [SELECT: 시간대: 오후]   ← 슬롯에서 자동 채움    │
│ [TIME: 14:00] ~ [TIME: 15:00]                                         │
│ ...                                                                  │
└──────────────────────────────────────────────────────────────────────┘
```

### 3.5 SCR-MODAL-SCHEDULE-FORM — 모바일 (fullscreen, RES-001/RES-002)

```
┌──────────────────────────────┐
│ [×]   일정 등록      [저장 ▣] │← 헤더 (저장 우상단)
├──────────────────────────────┤
│ [SEGMENT: 개인 / 공통]        │
│                              │
│ 일정 내용 *                   │
│ ┌──────────────────────────┐ │
│ │                          │ │
│ └──────────────────────────┘ │
│                              │
│ 날짜 *         [TOGGLE: 종일] │
│ [DATE: 2026-05-11]    ○────  │
│                              │
│ 시작     종료                 │
│ [TIME]   [TIME]               │
│                              │
│ 시간대 [SELECT: 오전 ▾]       │
│                              │
│ 입력 대상 (대리 권한 보유 시)  │
│ [BOTTOMSHEET 트리거 → 임원 ▾] │
│                              │
│ 장소 [INPUT]                  │
│                              │
│ [ACCORDION: 추가 정보 +]      │
│   └ @멘션, 비고               │
├──────────────────────────────┤
│ [BTN: 저장 (하단 고정 100%)]   │← RES-002 하단 고정
└──────────────────────────────┘
```

### 3.6 SCR-MODAL-SCHEDULE-DETAIL — 데스크톱

```
┌── BACKDROP (z=20) ──────────────────────────────────────────────────┐
│  ┌── MODAL (640px) ─────────────────────────────────────────────┐  │
│  │ [H2: 임원회의] [BADGE: 개인]              [BTN-ICON: ×]       │  │
│  │ ───────────────────────────────────────────────────────────── │  │
│  │ [TABS: 본문 / 이력]                                           │  │
│  │ ───────────────────────────────────────────────────────────── │  │
│  │ ▣ 본문                                                       │  │
│  │   📅 2026-05-11 (월)   ⏰ 오전  09:00 ~ 10:00                │  │
│  │   📍 본사 3층 대회의실                                        │  │
│  │   👤 일정 주인: 박전무  ● (users.color)                       │  │
│  │   ✍ 작성자: 김비서  [BADGE: 대리 입력]   ← admin 시에만 노출  │  │
│  │   ───────────────────────────────────────────────────────    │  │
│  │   @멘션 ([CHIP: @삼성전자] [CHIP: @홍길동 상무])               │  │
│  │   비고:                                                       │  │
│  │     "신규 계약 협의"                                          │  │
│  │   ───────────────────────────────────────────────────────    │  │
│  │   (공통 일정인 경우)                                          │  │
│  │   참가자 (3명)                                                │  │
│  │   ● 박전무  추가 2026-05-10 09:32                            │  │
│  │   ● 김상무  추가 2026-05-10 10:15                            │  │
│  │   ● (본인)  ─                                                │  │
│  │   [BTN: + 참가하기]   또는 [BTN: 참가 취소]                  │  │
│  │ ───────────────────────────────────────────────────────────── │  │
│  │           [BTN: 수정(secondary)] [BTN: 삭제(danger)] [BTN: 닫기] │  │
│  └───────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
```

이력 탭 (TABS=이력) 본문은 [scr_12_audit_log.md](./scr_12_audit_log.md) (SCR-MODAL-AUDIT-LOG) 참조. Phase 3 활성.

### 3.7 SCR-MODAL-CONFIRM-DELETE — 데스크톱

```
┌── BACKDROP ────────────────────────────────────────────────────┐
│  ┌── MODAL (440px) ───────────────────────────────────────────┐│
│  │ [H2: 일정 삭제]                                [BTN-ICON: ×]││
│  │ ───────────────────────────────────────────────────────────││
│  │  '임원회의' 일정을 삭제하시겠습니까?                         ││
│  │                                                            ││
│  │  (공통 일정인 경우)                                         ││
│  │  참가자 3명에게 취소 알림이 발송됩니다.                      ││
│  │                                                            ││
│  │  ※ 삭제 후 30초 내 토스트의 "실행 취소"로 복원 가능합니다.   ││
│  │ ───────────────────────────────────────────────────────────││
│  │              [BTN: 취소] [BTN: 삭제(danger)]                ││
│  └────────────────────────────────────────────────────────────┘│
└────────────────────────────────────────────────────────────────┘
```

### 3.8 상태별 와이어 (간략)

```
[로딩 — 폼 진입(수정 시 기존 데이터 fetch)]
┌── MODAL ──┐
│ [SKELETON] (전체 본문 영역)                                │
└───────────┘

[에러 — 저장 실패]
┌── MODAL ──┐
│ ...폼 입력값 유지...                                       │
│ [INLINE-ERROR: 종료 시간은 시작 시간 이후여야 합니다]      │
│ [BTN: 저장] (aria-busy=false, 재시도 가능)                 │
└───────────┘
[TOAST(error): 저장에 실패했습니다. 다시 시도해주세요]

[빈 — 상세 모달 진입 시 일정 미존재(이미 삭제됨)]
┌── MODAL ──┐
│ [EMPTY: 일정을 찾을 수 없습니다]                            │
│                       [BTN: 닫기]                          │
└───────────┘

[권한 거부 — 수정/삭제 권한 없는 사용자가 상세에서 시도]
[BTN: 수정], [BTN: 삭제] 자체가 렌더되지 않음.
직접 URL 요청 시 [TOAST(error): 수정 권한이 없습니다]
```

---

## 4. 컴포넌트 사용 표

`components.md` 정의 ID를 그대로 사용.

| 컴포넌트 ID | 본 화면 적용 사양 | 사용 위치 |
|---|---|---|
| `[MODAL]` | 데스크톱 640px / 모바일 fullscreen. Confirm은 440px, 백드롭 클릭 무시 | 3개 모달 컨테이너 |
| `[BACKDROP]` | z-index 20. 클릭으로 닫기 (Confirm 제외) | 모든 모달 배경 |
| `[H1]` / `[H2]` | 모달 제목. 폼 = "일정 등록/수정", 상세 = 일정 제목, 삭제 = "일정 삭제" | 모달 헤더 |
| `[BTN-ICON: 닫기]` | aria-label="닫기". ESC와 동일 효과 | 모든 모달 우상단 |
| `[SEGMENT: 개인/공통]` | 2분기. 모든 인증 사용자 활성 (2026-05-14 결정) | 폼 상단 |
| `[SELECT: 입력 대상]` | 본인 + `proxy_permissions.revoked_at IS NULL` 권한 보유 임원만 옵션. 기본값 본인. 단일 선택. 권한 없으면 단일 본인 옵션, 비활성. | 폼 (대리 입력) |
| `[SELECT: 알림 발송 대상]` | 다중 선택 (CHIP 표시). 공통 모드에서 활성. "전체 선택" 보조 액션 동반 | 폼 (공통 모드) |
| `[INPUT: 일정 내용]` | 필수, 1~200자. onBlur 유효성. 모바일 16px | 폼 |
| `[INPUT: 장소]` | 선택, ≤100자 | 폼 |
| `[TEXTAREA: 비고]` | 선택, ≤500자, 글자수 카운터 (aria-live=polite) | 폼 (데스크톱)·모바일 ACCORDION 내부 |
| `[DATE: 날짜]` | 필수. 자연어 입력 허용 (5/11, 내일 등) → 파싱 결과 인라인 표시. 파싱 실패 시 `INLINE-ERROR` | 폼 |
| `[TOGGLE: 종일]` | ON 시 TIME 비활성 + 시간대 "전일" 고정 | 폼 |
| `[SELECT: 시간대]` | enum 5개 (오전/점심/오후/저녁/전일). 시작 시간 입력 시 자동 매핑, 수동 변경 시 덮어씀 | 폼 |
| `[TIME: 시작/종료]` | 5분 단위. 종일 ON 시 비활성. 시작 < 종료 검증 | 폼 |
| `[MENTION: @멘션]` | prefix 검색 (companies.name·aliases / contacts.name). 후보 listbox, Tab/Enter 확정. no-match 시 [BTN-LINK: + 새 연락처로 등록] → SCR-MODAL-MENTION-NEW-CONTACT | 폼 |
| `[CHIP: 멘션]` | 확정된 멘션. `mention` variant. ✕로 제거 (onRemove) | 폼·상세 |
| `[BANNER: 대리 입력 중]` | info variant. "X 이름으로 입력 중" 노출 (입력 대상 != 본인) | 폼 상단 |
| `[BTN: 저장]` | primary. onClick → 유효성 → API. 비동기 중 aria-busy=true + SPINNER | 폼 푸터 / 모바일 헤더 우측 |
| `[BTN: 취소]` | tertiary. 변경 사항 있을 시 확인 후 닫기 | 폼 푸터 |
| `[BTN: 수정]` | secondary. 권한 있을 때만 렌더 | 상세 푸터 |
| `[BTN: 삭제]` | danger. 권한 있을 때만 렌더. 클릭 → Confirm 모달 | 상세 푸터 |
| `[BTN: + 참가하기]` / `[BTN: 참가 취소]` | primary / tertiary. 공통 일정 상세에서만. 본인이 참가자에 없으면 + 참가하기, 있으면 참가 취소 | 상세 (공통) |
| `[TABS: 본문 / 이력]` | 상세 모달 내 2탭. 이력 탭은 Phase 3 SCR-MODAL-AUDIT-LOG | 상세 |
| `[BADGE: 개인 / 공통]` | type 표시. 색: 공통=primary, 개인=neutral | 상세 헤더 |
| `[BADGE: 대리 입력]` | admin 에게만 노출 (`common_layout.md` §10) | 상세 본문 작성자 우측 |
| `[AVATAR: 임원 색상 도트]` | `users.color` `#RRGGBB`. color variant | 상세·참가자 목록 |
| `[INLINE-ERROR]` | 각 입력 아래. 날짜 파싱 실패, 종료<시작, 멘션 입력 오류 등 | 폼 |
| `[TOAST]` | 저장 성공/삭제 성공/실패. 삭제 성공 시 "실행 취소(30초)" 액션 포함 (proc_03 ALT-02) | 부모 화면 |
| `[ACCORDION: 추가 정보]` | 모바일에서 멘션·비고를 기본 접힘, "추가 정보 입력 +" 로 펼침 (RES-002) | 폼 모바일 |
| `[BOTTOMSHEET]` | 모바일 입력 대상·임원 선택 (RES-002) | 폼 모바일 |
| `[SPINNER]` | 저장 버튼 내부 로딩 | 폼 푸터 |
| `[SKELETON]` | 수정 모드에서 기존 데이터 fetch 시 본문 영역 | 폼 진입 로딩 |
| `[EMPTY]` | 상세 모달 진입 시 일정 미존재(deleted) | 상세 |

> 신규 컴포넌트 추가 없음. 다중 선택은 `[SELECT]` 의 multi 동작으로 흡수하고 본 표에 "다중 선택" 으로 명시한다.

---

## 5. 상호작용 명세

### 5.1 SCR-MODAL-SCHEDULE-FORM

| 트리거 | 컴포넌트 | 이벤트 | 다음 상태/액션 | API (기능 ID) |
|---|---|---|---|---|
| 진입: SCR-CALENDAR 빈 셀 클릭 | (외부) | 모달 open | 날짜 프리필 + 본인 선택 + 시간대 오전 기본값 | `SCH-001` 진입 |
| 진입: SCR-LIST [BTN: + 일정 추가] | (외부) | 모달 open | 오늘 날짜·본인 프리필 | `SCH-001` 진입 |
| 진입: SCR-MODAL-SCHEDULE-DETAIL [BTN: 수정] | (외부) | 모달 open + SKELETON | 기존 데이터 fetch 후 폼 프리필 | `SCH-003` 진입 |
| 진입: SCR-RADAR [CAL-SLOT] 클릭 | (외부) | 모달 open | 참가자·날짜·시간대 프리필, 공통 모드 강제 | `RAD-004` |
| 유형 토글 | `[SEGMENT: 개인/공통]` | onChange | "개인" → 입력 대상 1명 / "공통" → 알림 대상 N명. user 는 공통 토글 비활성 | — |
| 입력 대상 변경 | `[SELECT: 입력 대상]` | onChange | 본인 외 임원 선택 시 `[BANNER: 대리 입력 중]` 노출 | `SCH-006` 권한 재확인 (서버) |
| 알림 대상 전체 선택 | `[BTN-LINK: 전체 선택]` | onClick | `users.role='user' AND status='active'` 전원을 [CHIP] 으로 추가 | `COM-001` 보조 |
| 날짜 입력 | `[DATE: 날짜]` | onChange (debounce) | 자연어 파서 호출 (`5/11`, `내일`) → 성공 시 정규화, 실패 시 INLINE-ERROR | `SCH-001` 파싱 |
| 종일 토글 | `[TOGGLE: 종일]` | onChange(on) | TIME 2개 비활성·초기화, 시간대 "전일" 고정 | — |
| 시작 시간 입력 | `[TIME: 시작]` | onBlur | 시간대 자동 매핑 (00:00~11:59→오전 등). 사용자가 SELECT 수동 변경 시 매핑 결과 덮어씀 | — |
| 시간 유효성 | `[TIME: 시작/종료]` | 저장 시 | start_time < end_time 미충족 시 INLINE-ERROR | — |
| @ 입력 | `[MENTION]` | onChange | 후보 listbox (companies.name·aliases / contacts.name). prefix 검색 | `MEN-001` |
| 후보 선택 | `[MENTION]` 후보 항목 | onClick / Enter / Tab | `[CHIP]` 으로 변환. mentions 임시 객체 추가 | `MEN-001` |
| 후보 없음 + 새 등록 | `[BTN-LINK: + 새 연락처로 등록]` | onClick | SCR-MODAL-MENTION-NEW-CONTACT 호출 (자동 등록 contacts.is_auto_registered=true, status='auto') | `MEN-002` |
| 칩 제거 | `[CHIP: 멘션] ✕` | onRemove | 해당 mention 객체 제거 | — |
| 저장 클릭 | `[BTN: 저장]` | onClick | 유효성 → optimistic update → API → 토스트. 실패 시 롤백 | `SCH-001` / `SCH-002` / `SCH-003` / `COM-001` / `COM-003` |
| 저장 성공 | (응답) | — | `[TOAST: success]` 표시. 모달 닫기. 부모 화면(SCR-CALENDAR/LIST) 즉시 반영. 공통 모드는 `notification_logs.event_type='common_schedule_created'` 생성 | — |
| 취소 클릭 | `[BTN: 취소]` | onClick | 변경 사항 있으면 confirm("변경 사항을 버리시겠습니까?") 후 닫기 | — |
| 닫기 | `[BTN-ICON: 닫기]` / ESC / Backdrop | onClick/onKey | 동일 동작 (저장 중에는 잠금) | — |

서버 처리 후 사후 조건 (proc_03 PROC-SCH-001/002/003):
- `schedules` INSERT/UPDATE
- `mentions` INSERT (`schedule_id`, `reference_type`, `reference_id`, `raw_text`)
- `audit_logs` INSERT (`target_type='schedule'`, `action='created'|'updated'`, `actor_id`, `on_behalf_of_id`)
- 공통 모드: 알림 대상 임원 N명에 대해 `notification_logs` INSERT (`event_type='common_schedule_created'`, `status='pending'`)
- 타인 일정 수정 시: 해당 임원에게 `notification_logs.event_type='schedule_updated_by_other'`

### 5.2 SCR-MODAL-SCHEDULE-DETAIL

| 트리거 | 컴포넌트 | 이벤트 | 다음 상태/액션 | API (기능 ID) |
|---|---|---|---|---|
| 진입: CAL-EVENT 클릭 / 리스트 행 클릭 / 알림 링크 | (외부) | 모달 open + SKELETON | 일정 fetch + 멘션·참가자 fetch | `SCH-005` |
| 일정 미존재 | (응답 404 or `deleted_at IS NOT NULL`) | — | `[EMPTY: 일정을 찾을 수 없습니다]` | — |
| 권한 거부 | (응답 403) | — | TOAST(error) + 모달 닫기 | `SCH-005` |
| 본문/이력 탭 전환 | `[TABS]` | onChange | 본문 ↔ 이력 패널 전환 | (이력은 SCR-MODAL-AUDIT-LOG, Phase 3) |
| 수정 진입 | `[BTN: 수정]` | onClick | SCR-MODAL-SCHEDULE-FORM 수정 모드로 전환 (스왑) | `SCH-003` 진입 |
| 삭제 진입 | `[BTN: 삭제]` | onClick | SCR-MODAL-CONFIRM-DELETE 표시 (본 모달 위) | `SCH-004` 진입 |
| 참가 (공통 일정) | `[BTN: + 참가하기]` | onClick | 본인 user_id 를 `schedule_participants` INSERT or UPDATE (status='joined') | `COM-002` / `PROC-SCH-005` |
| 참가 취소 (공통 일정) | `[BTN: 참가 취소]` | onClick | `schedule_participants.status='cancelled'`, `cancelled_at=now()` | `COM-002 ALT-01` |
| 닫기 | `[BTN-ICON: 닫기]` / ESC / Backdrop | onClick | 부모 화면 복귀 | — |

### 5.3 SCR-MODAL-CONFIRM-DELETE

| 트리거 | 컴포넌트 | 이벤트 | 다음 상태/액션 | API (기능 ID) |
|---|---|---|---|---|
| 진입: 상세 [BTN: 삭제] | (외부) | 모달 open | 일정 제목·참가자 수 표시 | — |
| 취소 | `[BTN: 취소]` / `[BTN-ICON: ×]` / ESC | onClick | Confirm 닫기, 상세 모달 잔류 | — |
| 삭제 확정 | `[BTN: 삭제 (danger)]` | onClick | optimistic 부모 화면에서 제거 → API → `[TOAST: 삭제됨, 실행 취소(30초)]` | `SCH-004` / `COM-004` |
| 실행 취소 | TOAST 의 [BTN-LINK: 실행 취소] | onClick (30초 내) | `schedules.deleted_at=NULL, deleted_by=NULL` 복원. 부모 화면 재반영 | `PROC-SCH-004 ALT-02` |
| 삭제 실패 | (응답 403/500) | — | optimistic 롤백 + `[TOAST(error)]` | — |

> 백드롭 클릭 무시 (확인 모달 정책, `common_layout.md` §9.1).

사후 조건 (PROC-SCH-004):
- `schedules.deleted_at=now()`, `deleted_by=actor_id`
- `audit_logs` INSERT (`action='deleted'`, `before_data=` 삭제 전 스냅샷)
- 공통 일정이면 알림 대상에게 `notification_logs.event_type='common_schedule_updated'` 의 "취소" payload (spec/07 COM-004 정의)
- 부모 화면 즉시 반영 + `schedule_participants` 는 schedule CASCADE 로 함께 삭제되지 않음 (FK ON DELETE CASCADE 이나 schedules 는 soft delete 이므로 행 자체는 잔존)

---

## 6. 데이터 바인딩 표

ERD 컬럼명·타입은 `erd/erd.md` 와 100% 일치.

### 6.1 SCR-MODAL-SCHEDULE-FORM 입력 ↔ ERD

| UI 필드 | 표시 형식 | 데이터 소스 | 비고 |
|---|---|---|---|
| 일정 유형 (개인/공통) | SEGMENT | `schedules.type` (`personal` / `common`) | 모드 분기, 저장 시 enum 그대로 |
| 입력 대상 (대리 입력) | SELECT 단일 | `schedules.on_behalf_of_id` (FK→`users.id`) | 본인 선택 시 NULL. proxy_permissions.proxy_user_id=현재 사용자 AND target_user_id=선택 임원 AND revoked_at IS NULL 검증 |
| 입력 대상 옵션 목록 | SELECT 옵션 | `users.id`, `users.name`, `users.role='user'` AND `users.status='active'` AND (본인 OR proxy_permissions 매칭) | 권한 보유 임원만 |
| 실제 작성자 | (자동) | `schedules.created_by` (FK→`users.id`) | 로그인 사용자 ID |
| 일정 내용 | INPUT | `schedules.title` | CHECK 1~200자 |
| 날짜 | DATE | `schedules.schedule_date` | DATE. 자연어 파싱 후 정규화. 표시 `YYYY-MM-DD` |
| 시간대 | SELECT | `schedules.time_slot` | enum `morning|lunch|afternoon|evening|allday`. 표시 라벨: 오전/점심/오후/저녁/전일 |
| 시작 시간 | TIME | `schedules.start_time` | TIME, NULLABLE. 표시 `HH:mm` |
| 종료 시간 | TIME | `schedules.end_time` | TIME, NULLABLE. CHECK `start_time < end_time` |
| 종일 | TOGGLE | `schedules.is_all_day` | BOOL. ON 시 start/end NULL + time_slot='allday' |
| 장소 | INPUT | `schedules.location` | NULLABLE, ≤100자 |
| 비고 | TEXTAREA | `schedules.memo` | NULLABLE, ≤500자 |
| @멘션 칩 | CHIP | `mentions.reference_type` + `mentions.reference_id` + `mentions.raw_text` | reference_type ∈ {contact, company}. (schedule_id, reference_type, reference_id) UNIQUE |
| 알림 발송 대상 (공통) | SELECT 다중·CHIP | `schedule_participants.user_id` (등록 단계 — 초기 참가자가 아닌 알림 대상 임원 N명) | 저장 시 `notification_logs` 생성 시드. 참가자 자기 추가는 별도 (`schedule_participants`) |
| 일정 ID (수정 시) | (hidden) | `schedules.id` | UUID PK |

### 6.2 SCR-MODAL-SCHEDULE-DETAIL 표시 ↔ ERD

| UI 필드 | 표시 형식 | 데이터 소스 | 비고 |
|---|---|---|---|
| 일정 제목 | H2 | `schedules.title` | — |
| 유형 배지 | BADGE | `schedules.type` | 라벨: 개인/공통 |
| 날짜 | 텍스트 | `schedules.schedule_date` | `YYYY-MM-DD (요일)` |
| 시간대 | 텍스트 | `schedules.time_slot` | enum→한글 라벨 |
| 시작~종료 | 텍스트 | `schedules.start_time`, `schedules.end_time` | `HH:mm ~ HH:mm`. NULL 시 "—" |
| 종일 | 텍스트 | `schedules.is_all_day` | true 시 "종일" |
| 장소 | 텍스트 | `schedules.location` | NULL 시 "—" |
| 일정 주인 (개인) | AVATAR + 이름 | `users.name` (`users.id=schedules.owner_id`), `users.color` | color variant |
| 작성자 | 텍스트 | `users.name` (`users.id=schedules.created_by`) | — |
| 대리 입력 배지 | BADGE | `schedules.on_behalf_of_id IS NOT NULL` | admin 만 표시 (`common_layout.md` §10) |
| 비고 | 텍스트 | `schedules.memo` | — |
| 멘션 목록 | CHIP × N | `mentions.schedule_id=schedules.id` JOIN `companies` OR `contacts` | reference_type 분기 |
| 참가자 (공통) | LIST | `schedule_participants` WHERE `schedule_id=schedules.id` AND `status='joined'` JOIN `users` | `users.color`, `users.name`, `schedule_participants.joined_at` |
| 본인 참가 여부 | (제어용) | EXISTS(schedule_participants WHERE user_id=현재 사용자 AND status='joined') | + 참가하기 / 참가 취소 토글 |
| 최종 수정 시각 | 텍스트 | `schedules.updated_at` | `YYYY-MM-DD HH:mm` |
| 이력 탭 (Phase 3) | TABS | `audit_logs.target_type='schedule'` AND `target_id=schedules.id` 시간순 | SCR-MODAL-AUDIT-LOG |

### 6.3 SCR-MODAL-CONFIRM-DELETE ↔ ERD

| UI 필드 | 표시 형식 | 데이터 소스 | 비고 |
|---|---|---|---|
| 삭제 대상 제목 | 텍스트 | `schedules.title` | — |
| 참가자 수 (공통) | 텍스트 | `COUNT(schedule_participants WHERE schedule_id=… AND status='joined')` | "참가자 N명에게 취소 알림" |
| 삭제 확정 | (API) | `schedules.deleted_at=now()`, `schedules.deleted_by=actor_id` | soft delete |
| 감사 로그 | (자동) | `audit_logs (target_type='schedule', target_id, action='deleted', actor_id, before_data=스냅샷)` | 생성 |
| 취소 알림 (공통) | (자동) | `notification_logs (event_type='common_schedule_updated', recipient_id=참가자, target_type='schedule', target_id, payload={action:'deleted',...})` | N건 INSERT |

---

## 7. 화면 상태

| 상태 | SCR-MODAL-SCHEDULE-FORM | SCR-MODAL-SCHEDULE-DETAIL | SCR-MODAL-CONFIRM-DELETE |
|---|---|---|---|
| 빈 (Empty) | 등록 모드 진입 시 모든 필드 비어 있음. 본인+오늘 날짜만 프리필 | 일정 미존재(deleted) → `[EMPTY: 일정을 찾을 수 없습니다]` | (해당 없음 — 트리거 자체가 일정 존재 전제) |
| 로딩 | 수정 모드 진입 시 본문 영역 SKELETON. 저장 중 BTN aria-busy + SPINNER | 본문 영역 SKELETON | 삭제 확정 후 SPINNER (응답 대기) |
| 에러 | INLINE-ERROR (입력별) + TOAST(error)(서버 오류). 입력값 유지 | TOAST(error: 조회 실패) + 모달 닫기. fetch 실패 시 재시도 버튼 | TOAST(error: 삭제 실패) + 부모 화면 optimistic 롤백 |
| 성공 | TOAST(success: 일정이 등록되었습니다 / 수정되었습니다 / 공통 일정이 등록되었습니다. N명에게 알림 발송) + 모달 닫기 + 부모 즉시 반영 | (사용자 상호작용 결과별: 참가 추가 → TOAST "참가자로 추가되었습니다") | TOAST(success: 일정이 삭제되었습니다 / [BTN-LINK: 실행 취소(30초)]) |
| 권한 거부 | "공통" 모드: user 시 SEGMENT "공통" 비활성. 입력 대상: 권한 없는 임원 옵션 미노출. 서버 재확인 실패 시 TOAST(error) | [BTN: 수정] / [BTN: 삭제] 자체 비렌더. 직접 요청 시 403 → TOAST | 권한 없으면 진입 불가 (상세에서 버튼 비렌더) |

---

## 8. 권한·접근성

### 8.1 권한별 노출 차이 (`common_layout.md` §10, PERM-004 매트릭스)

| 요소 | 미인증 | `user` | `admin` |
|---|:-:|:-:|:-:|
| 본 3개 모달 접근 | ❌ (인증 후 부모 화면 경유) | ✅ | ✅ |
| `[SEGMENT: 공통]` | — | ❌ 비활성 | ✅ |
| `[SELECT: 입력 대상]` 옵션에 본인 외 임원 | — | proxy_permissions 보유 임원만 | 전체 임원 |
| `[BTN: 수정]` (상세) | — | 본인 작성/소유 일정 또는 대리 권한 보유 임원 일정 | 전체 |
| `[BTN: 삭제]` (상세) | — | 본인 작성/소유 일정만. 공통 일정은 ❌ | 전체 (공통 포함) |
| `[BADGE: 대리 입력]` | — | 숨김 | 표시 |
| `[BANNER: 대리 입력 중]` | — | 표시 (본인이 대리 입력자일 때) | 표시 |
| 공통 일정 등록 폼 진입 | — | ❌ (사이드바 빠른 액션 미노출) | ✅ |
| 참가자 자기 추가 [BTN: + 참가하기] | — | 공통 일정 알림 대상에 포함된 임원만 (`notification_logs.recipient_id=본인 AND target_id=공통일정`) | 동상 |

> 모든 UI 게이팅은 사용자 경험 목적이며 실제 차단은 서버에서 수행 (PERM-001, PERM-004).

### 8.2 접근성

| 항목 | 규칙 |
|---|---|
| 모달 role | `role="dialog"`, `aria-modal="true"`, `aria-labelledby` → 모달 제목 ID |
| 포커스 트랩 | 모달 열림 시 첫 입력 또는 닫기 버튼에 포커스. Tab 순환 |
| Esc | 모달 닫기 (저장 중 잠금). Confirm-Delete 도 Esc 닫기 허용 (백드롭만 무시) |
| 입력 라벨 | `<label for>` 명시. placeholder 만으로 라벨 대체 금지 (RES-002) |
| 오류 메시지 | INLINE-ERROR 는 `aria-describedby` 로 입력과 연결, 입력은 `aria-invalid="true"` |
| MENTION 후보 | `role="combobox"` + listbox + option. ↑↓ Enter Esc |
| TIME / DATE | 모바일은 네이티브 피커, 데스크톱은 커스텀 위젯 (RES-002) |
| SEGMENT | `role="tablist"`, 항목 `role="tab"`, `aria-selected` |
| 키보드 단축키 | 본 모달 내부에서는 1차 범위 외 단축키 없음. Esc 만 적용 |
| Confirm 위험 액션 | [BTN: 삭제] 는 `danger` variant + 텍스트 명시 ("삭제"). 자동 포커스는 [BTN: 취소] (보조) — 실수 방지 |
| 스크린리더 | 저장/삭제 성공 시 TOAST `role="status"` + `aria-live="polite"`. 실패 시 `role="alert"` + `aria-live="assertive"` |
| 모바일 탭 영역 | 모든 버튼·토글 최소 44×44px (RES-002) |

---

## 이슈 메모

- spec/03_schedule.md §SCH-001 "일정 내용" 컬럼은 ERD `schedules.title` 과 매칭됨. 폼 라벨은 사용자 친화적인 "일정 내용" 을 유지하되 데이터 바인딩 표에 `schedules.title` 임을 명시.
- spec/05·06 일부에서 사용된 `시간대` 한글 값(`오전/오후/종일`) 은 ERD enum (`morning/lunch/afternoon/evening/allday`) 의 라벨 표현. enum 값은 ERD 그대로, 화면 표시는 한글. 본 문서는 한글 라벨↔enum 매핑을 §6.1 비고에 명시.
- spec 03 SCH-006 "대리 입력 권한 구조" 의 컬럼명("대리 입력자", "대상 임원") 은 ERD `proxy_permissions.proxy_user_id`, `target_user_id` 와 매칭. 본 문서는 ERD 컬럼명 우선.

---

## 검증

- 자체 검증 일자: 2026-05-14
- 자체 검증 결과: ✅ 통과
- 자동 검증 결과: ✅ 통과
  - 8개 필수 섹션 헤더 모두 존재 ✓
  - SCR-MODAL-SCHEDULE-FORM / SCR-MODAL-SCHEDULE-DETAIL / SCR-MODAL-CONFIRM-DELETE 모두 ia/screen_list.md 에 존재 ✓
  - 데이터 바인딩 표의 모든 `테이블.컬럼` (`schedules.title/schedule_date/time_slot/start_time/end_time/is_all_day/location/memo/type/owner_id/on_behalf_of_id/created_by/deleted_at/deleted_by/id/updated_at`, `mentions.schedule_id/reference_type/reference_id/raw_text`, `schedule_participants.user_id/schedule_id/status/joined_at/cancelled_at`, `proxy_permissions.proxy_user_id/target_user_id/revoked_at`, `audit_logs.target_type/target_id/action/actor_id/on_behalf_of_id/before_data/after_data`, `notification_logs.event_type/recipient_id/target_type/target_id/status`, `users.id/name/color/role/status`) 모두 erd.md 에 실재 ✓
  - 사용한 컴포넌트(MODAL, BACKDROP, H1, H2, BTN-ICON, SEGMENT, SELECT, INPUT, TEXTAREA, DATE, TIME, TOGGLE, MENTION, CHIP, BANNER, BTN, BTN-LINK, BADGE, AVATAR, INLINE-ERROR, TOAST, ACCORDION, BOTTOMSHEET, SPINNER, SKELETON, EMPTY, TABS) 모두 components.md §1~§6 정의 ✓
  - 상호작용 API 가 spec/03·07 + process/proc_03 의 동작과 일치 (SCH-001~006, COM-001~004, MEN-001/002, RAD-004) ✓
  - 4종 상태(빈/로딩/에러/성공) + 권한 거부 모두 정의 ✓
  - 권한별 노출 차이 §8.1 매트릭스 명시 ✓
  - `[BTN: ...]`, `[INPUT: ...]` 등 대괄호 양식 일관 ✓
- 보류·예외 사항:
  - 이력 탭 (SCR-MODAL-AUDIT-LOG) 본문은 Phase 3, 본 문서는 진입점만 정의 (의도적 보류)
  - SCR-MODAL-MENTION-NEW-CONTACT 호출은 본 문서에서는 진입점만 정의, 본체는 그룹 1의 `scr_04_mention_contact.md` 담당 (의도적 분리)
- 검증자: claude (Step B 그룹 2)
