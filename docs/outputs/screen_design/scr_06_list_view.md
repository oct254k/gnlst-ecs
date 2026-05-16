# 리스트 뷰 화면설계서

- 화면 ID: SCR-LIST
- 관련 spec: [spec/06_list_view.md](../spec/06_list_view.md), [spec/13_export_responsive.md](../spec/13_export_responsive.md) (EXP-001)
- 관련 process: [process/proc_03_schedule.md](../process/proc_03_schedule.md), [process/proc_10_export.md](../process/proc_10_export.md)
- 관련 ERD: `schedules`, `schedule_participants`, `users`, `mentions`, `companies`, `contacts`
- Phase: 1 (LIS-001~007, EXP-001)
- 최종 갱신: 2026-05-14

---

## 1. 개요

리스트 뷰는 일정 데이터를 테이블 형태로 표시하고, 빠른 입력 행(LIS-002), 인라인 편집(LIS-007), 키워드 검색(LIS-003), @멘션 필터(LIS-004), 날짜 범위 필터(LIS-005), 담당자 필터(LIS-006), 엑셀 다운로드(EXP-001) 까지 한 화면에서 처리한다.

| 화면 ID | 용도 | 관련 기능 ID |
|---|---|---|
| `SCR-LIST` | 일정 리스트 (테이블) + 필터 + 빠른 입력 + 인라인 편집 + 엑셀 다운로드 | LIS-001, LIS-002, LIS-003, LIS-004, LIS-005, LIS-006, LIS-007, EXP-001 |

진입: 사이드바 메뉴 "리스트" (`/list`). 모바일은 SL-TABBAR ☰ 항목.

---

## 2. 레이아웃 구조

| 영역 | 사용 슬롯 | 비고 |
|---|---|---|
| 헤더 | `SL-HEADER` | 공통 |
| 좌측 사이드바 | `SL-SIDEBAR` | 데스크톱 |
| 메인 | `SL-MAIN` | 페이지 헤더 + 도구바(필터+검색+엑셀) + 활성 필터 칩 + 테이블 + 페이지네이션 |
| 모바일 | `SL-TABBAR` | 모바일 |
| 인라인 편집 행 / 빠른 입력 행 | 테이블 내부 | LIS-002, LIS-007 |
| 토스트 | `SL-OVERLAY TOAST` | 저장·삭제·다운로드 결과 |
| 행 케밥 메뉴 | `SL-OVERLAY POPOVER` (Phase: `MENU`) | 행 액션 (수정/삭제/이력) |

---

## 3. 와이어프레임

### 3.1 SCR-LIST — 데스크톱

```
┌── SL-HEADER ──────────────────────────────────────────────────────────────┐
│ [☰][LOGO] [SEARCH(Phase2)]                          [🔔(3)][🟢 홍길동 ▾] │
├──────┬────────────────────────────── SL-MAIN ─────────────────────────────┤
│ SL-  │ ◀ 뒤로  [H1: 리스트]                       [BTN: + 일정 등록] [⋮] │
│ SIDE │ ─────────────────────────────────────────────────────────────────  │
│ BAR  │ ┌── 도구바 ───────────────────────────────────────────────────┐  │
│      │ │ [SEARCH: 검색 (제목·장소·@멘션)]   [DATE-RANGE: 시작~종료]  │  │
│ 일정 │ │ [SELECT: 담당자 ▾(N명)]  [SELECT: 구분 ▾]                 │  │
│ ▸대시│ │                              [BTN: 엑셀 다운로드 ⬇] [⋯]    │  │
│ ▸달력│ └─────────────────────────────────────────────────────────────┘  │
│ ▸리스│ ┌── 활성 필터 칩 ────────────────────────────────────────────┐  │
│ ▸레이│ │ [CHIP: @삼성전자 ✕] [CHIP: 2026.05.01~05.31 ✕]            │  │
│ 데이 │ │ [CHIP: 박전무 ✕]   [BTN-LINK: 모두 초기화]                  │  │
│      │ └─────────────────────────────────────────────────────────────┘  │
│      │ [n건의 일정]                              [SELECT: 50건씩 ▾]      │
│      │ ┌── TABLE ───────────────────────────────────────────────────┐  │
│      │ │ ☐ │ 날짜 ▲ │ 시간대 │ 실제시간 │ 일정 내용 │ 장소·파트너 │담당자│구분│⋮│
│      │ ├───┼────────┼────────┼──────────┼───────────┼─────────────┼─────┼───┼──┤
│      │ │ ☐ │ 05.11  │ 오전   │ 09:00~10 │ 임원회의  │ 본사 3층    │ ● 박│개인│⋮│
│      │ │   │ (월)   │        │          │           │             │ 전무│    │  │
│      │ ├───┼────────┼────────┼──────────┼───────────┼─────────────┼─────┼───┼──┤
│      │ │ ☐ │  ↑동일 │ 오후   │ 14:00~15 │ 고객사 미팅│ 양재 사옥   │ 전체│공통│⋮│ ← 행 배경: #FFF5F5
│      │ │   │ (그룹) │        │          │ [공통]    │             │     │    │  │
│      │ ├───┼────────┼────────┼──────────┼───────────┼─────────────┼─────┼───┼──┤
│      │ │ ☐ │ 05.12  │ 종일   │   —      │ 어린이날  │     —       │  —  │ 휴 │  │ ← Phase: 공휴일 표시는 캘린더만 (참고)
│      │ │   │ (화)   │        │          │           │             │     │    │  │
│      │ ├───┼────────┼────────┼──────────┼───────────┼─────────────┼─────┼───┼──┤
│      │ │ ... (50건/페이지) ...                                       │  │
│      │ ├────────────────────────────────────────────────────────────┤  │
│      │ │ + 일정 추가 (클릭 시 빠른 입력 행 슬라이드 다운)             │  │
│      │ └────────────────────────────────────────────────────────────┘  │
│      │              [PAGINATION: ◀ 1 2 3 ... N ▶]                     │
└──────┴──────────────────────────────────────────────────────────────────┘
[SL-FOOTER]
```

### 3.2 빠른 입력 행 (LIS-002) — 펼침 상태

```
└── 테이블 하단 ──────────────────────────────────────────────────────┐
   [DATE: 날짜] [SELECT: 시간대▾] [TIME: 시작][TIME: 종료]            │
   [INPUT: 일정 내용 *]                                                │
   [INPUT: 장소]                                                       │
   [SELECT: 담당자 ▾ (다중)]   [SELECT: 구분▾]                         │
                              [BTN: 저장][BTN: 취소(Esc)]              │
   [INLINE-ERROR (필드별)]                                             │
─────────────────────────────────────────────────────────────────────┘
```

- 펼침/접힘: `[ACCORDION]` 또는 슬라이드다운. 첫 필드(날짜)로 자동 포커스
- Enter 저장, Esc 취소
- 저장 성공 시 행 1.5초 하이라이트 (`#FFFDE7`)

### 3.3 인라인 편집 행 (LIS-007) — 편집 모드

```
편집 전:
│ ☐ │ 05.11(월) │ 오전 │ 09:00~10:00 │ 임원회의 │ 본사 3층 │ ● 박전무 │ 개인 │ ⋮ │

행 클릭 (권한 보유) →

편집 후 (행 배경: #FFFDE7):
│ ☐ │[DATE]│[SELECT▾]│[TIME~TIME]│[INPUT: 일정내용]│[INPUT: 장소]│[SELECT▾(다중)]│[SELECT▾]│ [BTN:저장][BTN:취소] │
   ↓ [INLINE-ERROR (필드 아래)]
```

### 3.4 SCR-LIST — 모바일 (RES-001: 카드형 리스트)

```
┌──────────────────────────────┐
│ [☰] 리스트          [🔔(3)] │
├──────────────────────────────┤
│ [SEARCH: 검색]               │
│ [BTN-ICON: 필터 ⏷]  3 개 적용│ ← 탭 시 BOTTOMSHEET (필터 모음)
│ [CHIP: @삼성전자 ✕] (가로스크롤)│
├──────────────────────────────┤
│ 2026.05.11 (월) ───────────  │ ← 날짜 그룹 헤더
│ ┌──────────────────────────┐ │
│ │ 오전 09:00~10:00           │ │
│ │ 임원회의                   │ │
│ │ 📍 본사 3층                │ │
│ │ ● 박전무  [TAG: 개인]      │ │
│ │                       [⋮]  │ │
│ └──────────────────────────┘ │
│ ┌──────────────────────────┐ │
│ │ 오후 14:00~15:30           │ │
│ │ 고객사 미팅 [TAG: 공통]    │ │
│ │ 📍 양재 사옥               │ │
│ │                       [⋮]  │ │
│ └──────────────────────────┘ │
│ 2026.05.12 (화) ───────────  │
│ ...                          │
├──────────────────────────────┤
│ [BTN: + 일정 추가 (FAB)]     │
├──────────────────────────────┤
│ 🏠 📅 ☰ 🔔(3) ⋯              │← SL-TABBAR (리스트 활성)
└──────────────────────────────┘
```

- 인라인 편집: 카드 탭 → 모바일 fullscreen 모달(SCR-MODAL-SCHEDULE-FORM 수정 모드)
- 빠른 입력: 우하단 FAB 또는 ⋮ → "+ 일정 추가"
- 엑셀 다운로드: 우상단 [⋮] → "엑셀 다운로드" 메뉴 (BOTTOMSHEET / DROPDOWN)

### 3.5 엑셀 다운로드 액션 (EXP-001) — 데스크톱 트리거

```
도구바 우측:
[BTN: 엑셀 다운로드 ⬇]
            ↓ onClick (현재 필터 상태 그대로)
[PROGRESS: 엑셀 생성 중...]  (행 1,000건 초과 시 노출, ALERT(warn) 동반)
            ↓ 완료
[TOAST(success): 일정_홍길동_20260511.xlsx 다운로드 완료]
```

- 필터 결과 0건 → [BTN] 비활성 + 툴팁 "다운로드할 데이터가 없습니다"
- 1,000건 초과 → [ALERT(warn): 데이터가 많아 생성에 시간이 걸릴 수 있습니다] 사전 안내 후 진행

### 3.6 도구바 우측 케밥 메뉴 — 데스크톱

```
[⋯] →
┌──────────────────────────┐
│ 엑셀 다운로드 ⬇          │  ← EXP-001
│ Google 캘린더 동기화 🔒  │  ← EXP-002 비활성 (1차 범위 제외, 호버 툴팁: "2차 진행 예정")
│ ───────────────────────  │
│ 컬럼 표시·숨김 (Phase 2)  │
│ 도움말                   │
└──────────────────────────┘
```

### 3.7 상태별 와이어

```
[로딩]
도구바 + [SKELETON: 테이블 행 8개]

[빈 — 필터 결과 0건]
도구바 + 활성 필터 칩
[EMPTY: 검색 결과가 없습니다 [BTN-LINK: 필터 초기화]]

[빈 — 일정 0건 (초기)]
도구바
[EMPTY: 등록된 일정이 없습니다 [BTN: + 일정 등록]]

[에러 — 조회 실패]
[ALERT(error): 일정을 불러오지 못했습니다 [BTN-LINK: 다시 시도]]

[권한 거부]
일반 행은 표시. user 가 본인 외 일정 행 클릭 시 편집 모드 미전환 + [TOOLTIP: 수정 권한이 없습니다]
```

---

## 4. 컴포넌트 사용 표

| 컴포넌트 ID | 본 화면 적용 사양 | 사용 위치 |
|---|---|---|
| `[H1: 리스트]` | 페이지 제목 | 페이지 헤더 |
| `[BTN: + 일정 등록]` | primary. SCR-MODAL-SCHEDULE-FORM | 페이지 헤더 / 모바일 FAB |
| `[DROPDOWN: 더보기 ⋮]` | 페이지 헤더 보조 액션 | 페이지 헤더 |
| `[SEARCH: 검색]` | placeholder "제목·장소·@멘션 검색". debounce 300ms. `/` 키 포커스 (Phase 2) | 도구바 |
| `[DATE-RANGE: 시작~종료]` | 빠른 선택(오늘/이번주/이번달/다음달). 시작>종료 시 INLINE-ERROR | 도구바 |
| `[SELECT: 담당자 다중]` | 임원 목록 (`users.role='user'`). 체크박스 다중, OR 결합. 색상 도트 + 이름 | 도구바 |
| `[SELECT: 구분]` | enum: 전체/개인/공통 | 도구바 |
| `[BTN: 엑셀 다운로드]` | secondary + ⬇ 아이콘. 0건 시 비활성, 1000건+ 시 ALERT(warn) 동반 | 도구바 |
| `[CHIP: 필터]` | 활성 필터 표지. ✕ 클릭 onRemove | 활성 필터 영역 |
| `[BTN-LINK: 모두 초기화]` | 모든 필터 해제 | 활성 필터 영역 |
| `[TABLE]` | 7컬럼 + 체크박스 + 케밥. 정렬 헤더 aria-sort. 행 hover, row-selected, row-editing 상태 | 본문 |
| `[CHECKBOX: 선택]` | 행 다중 선택 (Phase 2 일괄 작업 대비). 헤더 체크박스로 전체 선택 | 테이블 |
| `[BADGE: 개인/공통]` | TAG variant. 색상 매핑: 공통=primary, 개인=neutral | 구분 컬럼 |
| `[AVATAR: 임원 색상]` | color variant | 담당자 컬럼 |
| `[MENU: ⋮]` | 행 액션 (수정/삭제/상세/이력). 권한 없을 시 비활성 | 행 우측 |
| `[BTN: + 일정 추가]` | tertiary. 빠른 입력 행 펼치기 | 테이블 하단 |
| `[ACCORDION: 빠른 입력]` | 슬라이드 다운, 첫 필드 자동 포커스 | 테이블 하단 |
| `[INPUT: 인라인 편집]` | 셀 인플레이스 입력. 행 배경 #FFFDE7. Esc 취소, Enter 저장 | 편집 모드 행 |
| `[DATE]` (인라인) | 인라인 편집 행의 날짜 셀 | 편집 모드 |
| `[TIME]` (인라인) | 인라인 편집 행의 시간 셀 | 편집 모드 |
| `[SELECT]` (인라인) | 시간대·구분·담당자 셀 | 편집 모드 |
| `[INLINE-ERROR]` | 인라인/빠른 입력 필드 아래 | 편집·빠른 입력 |
| `[PAGINATION]` | numbered + loadmore 토글 (Phase: numbered 기본). 50/100건 옵션 | 본문 하단 |
| `[EMPTY]` | 결과 0건. 초기 0건은 + 일정 등록 액션 동반 | 본문 |
| `[ALERT: warn/error]` | 1,000건 경고 / 조회 실패 | 본문 상단 |
| `[PROGRESS]` | 엑셀 생성 중 (대량) | 본문 상단 / 토스트 |
| `[TOAST]` | 저장·삭제·다운로드 결과 | SL-OVERLAY |
| `[BANNER]` | EXP-002 비활성 안내 (1차 범위 제외) — 케밥 메뉴 내부 툴팁으로 대체 | 케밥 메뉴 |
| `[BOTTOMSHEET]` | 모바일 필터·케밥 | 모바일 |
| `[MENU-OVERFLOW]` | 모바일 도구바 액션 묶음 | 모바일 도구바 |
| `[TAG: 공통/개인]` | display | 모바일 카드 |
| `[SKELETON]` | 테이블 행 골격 | 로딩 |
| `[TOOLTIP]` | 권한 없음 안내, 엑셀 0건 비활성 등 | 행 / 버튼 |

> 신규 컴포넌트 추가 없음. 모바일 카드는 `[LIST: 일정 카드]` (components.md §4.2) 의 일정 카드 변형.

---

## 5. 상호작용 명세

### 5.1 조회·필터 (LIS-001, LIS-003, LIS-004, LIS-005, LIS-006)

| 트리거 | 컴포넌트 | 이벤트 | 다음 상태/액션 | API (기능 ID) |
|---|---|---|---|---|
| 진입 | URL `/list` | mount | 기본 필터(현재 월) + 50건 페이지네이션 fetch | `LIS-001` |
| 컬럼 헤더 클릭 | `[TABLE]` 헤더 | onSort | URL `?sort=date.asc|desc` 갱신, 재조회 | `LIS-001` |
| 검색어 입력 | `[SEARCH]` | onChange (debounce 300ms) | URL `?q=...` 갱신, 재조회. `schedules.title`·`schedules.location` 부분 일치. 매칭 텍스트 하이라이트 | `LIS-003` |
| @멘션 입력 | `[SEARCH]` "@" prefix | onChange | 임원 자동완성 listbox. 선택 시 [CHIP] 으로 변환 | `LIS-004` |
| @멘션 칩 | `[CHIP]` | onRemove | 필터 해제, 재조회 | `LIS-004` |
| 날짜 범위 선택 | `[DATE-RANGE]` | onChange | URL `?start=...&end=...` 갱신, 재조회. 빠른 선택 버튼 (오늘/이번주/이번달/다음달) | `LIS-005` |
| 담당자 선택 | `[SELECT: 담당자]` | onChange | URL `?owner=...` 갱신 (다중 OR). 색상 도트 + 이름 | `LIS-006` |
| 구분 선택 | `[SELECT: 구분]` | onChange | URL `?type=common|personal` 갱신 | — |
| 필터 칩 제거 | `[CHIP]` | onRemove | 해당 필터 해제, 재조회 | `LIS-003~006` |
| 모두 초기화 | `[BTN-LINK: 모두 초기화]` | onClick | 모든 필터 해제, 기본 상태(현재 월)로 복귀 | — |
| 페이지 이동 | `[PAGINATION]` | onChange | URL `?page=N` 갱신, 재조회 | `LIS-001` |
| 페이지당 행 수 | `[SELECT: 50건씩]` | onChange | URL `?pageSize=50|100` | — |
| 가상 스크롤 (1000+) | `[TABLE]` | scroll | 화면 영역만 렌더 (성능). 1000건+ 자동 활성화 | `LIS-001` 예외 |
| 조회 오류 | (응답 오류) | — | `[ALERT(error)]` + 재시도 | `LIS-001` |

### 5.2 빠른 입력 (LIS-002)

| 트리거 | 컴포넌트 | 이벤트 | 다음 상태/액션 | API |
|---|---|---|---|---|
| 추가 행 펼치기 | `[BTN: + 일정 추가]` | onClick | ACCORDION 슬라이드 다운, 첫 필드(날짜)로 포커스 | — |
| 필드 입력 | 각 인라인 컴포넌트 | onChange / onBlur | 로컬 상태 보관. 유효성 inline | — |
| 저장 | `[BTN: 저장]` / Enter | onClick / Enter | 유효성 → optimistic 행 추가 → API → 토스트 + 1.5초 하이라이트 | `SCH-001` |
| 취소 | `[BTN: 취소]` / Esc | onClick / Esc | 행 접힘, 입력 초기화 | — |
| 저장 실패 | (응답 오류) | — | INLINE-ERROR 또는 TOAST(error). 입력값 유지 | — |
| 중복 일정 경고 | (서버 응답 warn) | — | TOAST(warn: 동일 시간대 일정이 있습니다. 저장은 완료되었습니다) | `LIS-002` 예외 |

유효성:
- 날짜 필수
- 일정 내용 1~200자
- 시작 < 종료 (TIME 입력 시)
- 담당자 1명 이상

### 5.3 인라인 수정 (LIS-007)

| 트리거 | 컴포넌트 | 이벤트 | 다음 상태/액션 | API |
|---|---|---|---|---|
| 행 클릭 | `[TABLE]` 행 | onRowClick | 권한 검증 → 편집 모드 전환 (행 배경 #FFFDE7) | (클라이언트 권한 가드) |
| 다른 행 클릭 (편집 중) | `[TABLE]` 행 | onRowClick | 저장 여부 확인 모달 → 저장 또는 취소 후 다음 행 편집 | — |
| 저장 | `[BTN: 저장]` / Enter | onClick / Enter | 유효성 → API → 행 데이터 갱신 → 편집 모드 해제 | `SCH-003` |
| 취소 | `[BTN: 취소]` / Esc | onClick / Esc | 변경 사항 롤백, 편집 모드 해제 | — |
| 권한 없는 행 클릭 | (가드) | onRowClick | 편집 모드 미전환, `[TOOLTIP: 수정 권한이 없습니다]` | — |
| 동시 수정 충돌 | (응답 409) | — | TOAST(warn: 다른 사용자가 수정했습니다) + 최신 데이터 로드 | `LIS-007` 예외 |

### 5.4 행 액션 (케밥 메뉴)

| 트리거 | 컴포넌트 | 이벤트 | 다음 상태/액션 | API |
|---|---|---|---|---|
| 케밥 클릭 | `[MENU: ⋮]` | onClick | DROPDOWN 열림: 상세 / 수정 / 삭제 / 이력(Phase3) | — |
| 상세 | DROPDOWN item | onSelect | SCR-MODAL-SCHEDULE-DETAIL | `SCH-005` |
| 수정 | DROPDOWN item | onSelect | SCR-MODAL-SCHEDULE-FORM 수정 모드 | `SCH-003` |
| 삭제 | DROPDOWN item | onSelect | SCR-MODAL-CONFIRM-DELETE | `SCH-004` / `COM-004` |
| 이력 (Phase 3) | DROPDOWN item | onSelect | SCR-MODAL-AUDIT-LOG | `AUD-004` |

### 5.5 엑셀 다운로드 (EXP-001)

| 트리거 | 컴포넌트 | 이벤트 | 다음 상태/액션 | API |
|---|---|---|---|---|
| 다운로드 클릭 | `[BTN: 엑셀 다운로드]` | onClick | 현재 필터 적용 데이터 수집 → xlsx 생성 → 브라우저 다운로드 | `EXP-001` |
| 0건 클릭 (비활성) | (비활성) | — | TOOLTIP "다운로드할 데이터가 없습니다" | `EXP-001` 예외 |
| 1,000건 초과 | (감지) | — | ALERT(warn) 사전 안내 + PROGRESS 표시 | `EXP-001` 예외 |
| 완료 | (xlsx 생성 완료) | — | TOAST(success) "일정_{filterLabel}_{YYYYMMDD}.xlsx" 다운로드 안내 | — |
| 실패 | (예외) | — | TOAST(error) | `EXP-001` 예외 |

> 본 화면의 엑셀 다운로드는 spec/13 EXP-001 의 "브라우저 직접 생성" 정책을 1차 채택한다. 단, 횡단 정의·이슈 메모는 [scr_13_export_responsive.md](./scr_13_export_responsive.md) 에 통합 기술.

---

## 6. 데이터 바인딩 표

### 6.1 테이블 컬럼 ↔ ERD

| UI 컬럼 | 표시 형식 | 데이터 소스 | 비고 |
|---|---|---|---|
| 선택 | CHECKBOX | (클라이언트 상태) | Phase 2 일괄 작업용 |
| 날짜 | `YYYY.MM.DD (요일)` | `schedules.schedule_date` | 동일 날짜 행은 그룹 헤더로 묶음 |
| 시간대 | 한글 라벨 | `schedules.time_slot` (enum→한글) | morning→오전, lunch→점심, afternoon→오후, evening→저녁, allday→종일 |
| 실제 시간 | `HH:mm~HH:mm` | `schedules.start_time`, `schedules.end_time` | NULL 시 "—" |
| 일정 내용 | 텍스트 | `schedules.title` | 검색 매칭 하이라이트. 인라인 편집 가능 |
| 장소·파트너 | 텍스트 | `schedules.location` + 멘션 칩 (`mentions` 조인) | NULL 시 "—". @멘션은 라벨 옆에 CHIP |
| 담당자 | AVATAR + 이름 | `users.color`, `users.name` (`users.id=schedules.owner_id`) | 공통 일정은 "전체" 또는 `schedule_participants` count |
| 구분 | BADGE | `schedules.type` ('personal'→개인, 'common'→공통) | 공통 행은 배경 #FFF5F5 |
| 케밥 | MENU | — | 권한별 메뉴 항목 분기 |

### 6.2 필터 ↔ ERD / 쿼리

| 필터 | 데이터 소스 | 쿼리 적용 |
|---|---|---|
| 검색어 (`q`) | `schedules.title`, `schedules.location` | ILIKE `%q%` |
| @멘션 | `users.name` | `schedules.owner_id IN (...)` (LIS-004는 임원 멘션). 회사·연락처 멘션은 `mentions.reference_id` JOIN |
| 날짜 범위 | `schedules.schedule_date` | BETWEEN start AND end. 최대 1년 (proc_10) |
| 담당자 | `schedules.owner_id` | IN (...) (다중 OR) |
| 구분 | `schedules.type` | = 'personal' | 'common' |
| 공통 필터: `deleted_at IS NULL` | `schedules.deleted_at` | 항상 적용 |

### 6.3 빠른 입력 / 인라인 편집 ↔ ERD

| UI 필드 | 데이터 소스 | 비고 |
|---|---|---|
| 날짜 | `schedules.schedule_date` | 자연어 파싱 지원 |
| 시간대 | `schedules.time_slot` | enum |
| 시작 시간 | `schedules.start_time` | NULLABLE |
| 종료 시간 | `schedules.end_time` | NULLABLE, start<end |
| 일정 내용 | `schedules.title` | 1~200자 |
| 장소 | `schedules.location` | ≤100자 |
| 담당자 (개인) | `schedules.owner_id` (FK→`users.id`) | 단일. 권한 검증 (대리 권한 또는 본인) |
| 구분 | `schedules.type` | personal 기본. 공통은 모든 인증 사용자 등록 가능 (2026-05-14 결정) |
| 작성자 (자동) | `schedules.created_by` | 로그인 사용자 |
| 감사 로그 (자동) | `audit_logs.action='created'\|'updated'`, `target_type='schedule'` | 자동 생성 |

### 6.4 엑셀 다운로드 컬럼 ↔ ERD (EXP-001)

본 화면의 다운로드는 spec/13 EXP-001 표 (12컬럼) 를 따르되, 실제 컬럼은 ERD 기준으로 매핑한다. 횡단 컬럼 정의는 [scr_13_export_responsive.md](./scr_13_export_responsive.md) §6 참조.

| 순서 | 헤더 | ERD 컬럼 | 포맷 |
|---|---|---|---|
| 1 | 날짜 | `schedules.schedule_date` | `YYYY-MM-DD` |
| 2 | 시작 시각 | `schedules.start_time` | `HH:mm` |
| 3 | 종료 시각 | `schedules.end_time` | `HH:mm` |
| 4 | 구분 | `schedules.type` | 공통/개인 |
| 5 | 제목 | `schedules.title` | 텍스트 |
| 6 | 담당 임원 | `users.name` (`users.id=schedules.owner_id`) | 텍스트 |
| 7 | 장소 | `schedules.location` | 텍스트 |
| 8 | 회사 / 연락처 | `mentions` JOIN `companies.name` / `contacts.name` | 콤마 구분 |
| 9 | 비고 | `schedules.memo` | 텍스트 |
| 10 | 작성자 | `users.name` (`users.id=schedules.created_by`) | 텍스트 |
| 11 | 대리 입력 명의 | `users.name` (`users.id=schedules.on_behalf_of_id`) | NULL 시 빈칸 |
| 12 | 등록 일시 | `schedules.created_at` | `YYYY-MM-DD HH:mm` |

파일명: `일정_{filterLabel}_{YYYYMMDD}.xlsx`

---

## 7. 화면 상태

| 상태 | 표현 |
|---|---|
| 빈 — 초기 0건 | `[EMPTY: 등록된 일정이 없습니다]` + `[BTN: + 일정 등록]` |
| 빈 — 필터 결과 0건 | `[EMPTY: 검색 결과가 없습니다]` + `[BTN-LINK: 필터 초기화]` |
| 빈 — 날짜 범위 내 0건 | `[EMPTY: 해당 기간에 일정이 없습니다]` (LIS-005 예외) |
| 로딩 | `[SKELETON]` 테이블 8행. 도구바·필터는 유지 |
| 로딩 — 엑셀 생성 (대량) | `[PROGRESS]` + `[ALERT(warn)]` |
| 에러 — 조회 실패 | `[ALERT(error): 일정을 불러오지 못했습니다]` + 재시도 버튼 |
| 에러 — 빠른 입력/편집 저장 실패 | INLINE-ERROR + TOAST(error). 입력값 유지 |
| 에러 — 동시 수정 충돌 | TOAST(warn) + 최신 데이터 자동 로드 |
| 성공 — 일정 저장 | TOAST(success) + 행 하이라이트 1.5초 |
| 성공 — 엑셀 다운로드 | TOAST(success: "{파일명} 다운로드 완료") |
| 권한 거부 — 행 편집 | `[MENU]` 의 수정/삭제 비활성 + `[TOOLTIP: 수정 권한이 없습니다]`. 행 클릭은 상세 모달만 오픈 |
| 권한 거부 — 페이지 접근 | user/admin 공통 접근. 미인증 시 SCR-LOGIN 리다이렉트 |

---

## 8. 권한·접근성

### 8.1 권한별 노출 차이

| 요소 | `user` | `admin` |
|---|:-:|:-:|
| 페이지 접근 | ✅ | ✅ |
| `[BTN: + 일정 등록]` | ✅ (개인만 등록 가능) | ✅ |
| 빠른 입력 — 구분=공통 | ❌ 옵션 비활성 | ✅ |
| 인라인 편집 — 본인 일정 | ✅ | ✅ |
| 인라인 편집 — 타인 개인 일정 | ❌ (대리권한 보유 시만) | ✅ |
| 인라인 편집 — 공통 일정 | ❌ | ✅ |
| 행 삭제 — 본인 일정 | ✅ | ✅ |
| 행 삭제 — 타인/공통 | ❌ | ✅ |
| 엑셀 다운로드 | ✅ | ✅ |
| Google 캘린더 동기화 | ❌ (메뉴 비활성, 1차 범위 제외) | ❌ (동상) |
| 케밥 → 이력 (Phase 3) | 본인 일정만 | 전체 |

### 8.2 접근성

| 항목 | 규칙 |
|---|---|
| 테이블 | `<table>` + `<thead>` + `<tbody>`. 정렬 헤더 `aria-sort="ascending|descending|none"` |
| 행 키보드 | `Tab` 행 이동, `Enter` 편집 모드 (권한 있을 때) |
| 체크박스 | `<input type="checkbox">` + 헤더의 전체 선택은 `aria-label="모든 행 선택"` |
| 빠른 입력 행 | ACCORDION `aria-expanded`, 펼쳐지면 첫 필드(날짜)로 포커스 |
| 인라인 편집 | 편집 모드 진입 시 `aria-live="polite"` 안내 |
| 케밥 메뉴 | `role="menu"`, 항목 `role="menuitem"`, `↑↓ Enter Esc` |
| 검색 | `role="searchbox"`, Esc 클리어. 자동완성 listbox `role="listbox"` |
| 날짜 범위 | 시작/종료 각 DATE 와 동일. 오류 시 INLINE-ERROR 연결 |
| 페이지네이션 | `role="navigation"`, `aria-label="페이지 이동"` |
| 빈/에러 상태 | EMPTY/ALERT 는 `role="status"` 또는 `role="alert"` |
| 색상 단독 사용 금지 | 공통 행은 배경 + TAG 텍스트 라벨 병기 |
| 모바일 탭 영역 | 카드·FAB·필터 버튼 모두 44×44px 이상 (RES-002) |
| 검색 입력 폰트 | 16px 이상 (모바일 자동 확대 방지) |

---

## 이슈 메모

- spec/06 컬럼 정의의 `title`, `executive`, `type` 등은 spec 표기로 화면 컬럼명 (한글: 일정 내용/담당자/구분) 으로 옮긴다. ERD 컬럼은 `schedules.title`, `schedules.owner_id` (참조 `users.name`), `schedules.type` 임. 데이터 바인딩 표에서 ERD 컬럼 명시.
- spec/13 EXP-001 의 컬럼 8 (회사) 은 ERD `mentions` 의 다형성 참조를 JOIN 해야 표시 가능. 회사/연락처 분기는 `mentions.reference_type` 으로 처리하고, 본 화면 표 §6.4 에 "회사 / 연락처" 통합 컬럼으로 정의.
- spec/13 EXP-001 "현재 필터 상태 그대로, 추가 서버 요청 없이 브라우저 생성" 과 proc_10 "서버 측 워크북 생성, 최대 1년" 이 충돌. **1차는 spec/13 의 클라이언트 생성 정책 채택** (이미 화면에 로드된 데이터만 사용, 별도 서버 요청 없음). 1년 제한은 날짜 범위 필터 단계에서 검증. 횡단 상세는 scr_13 에 기록.
- LIS-001 의 페이지네이션 50건 단위는 `[PAGINATION]` numbered 방식 1차 채택. 무한 스크롤은 1,000건+ 가상 스크롤로 대체.

---

## 검증

- 자체 검증 일자: 2026-05-14
- 자체 검증 결과: ✅ 통과
- 자동 검증 결과: ✅ 통과
  - 8개 필수 섹션 헤더 모두 존재 ✓
  - SCR-LIST 가 ia/screen_list.md 에 존재 ✓
  - 데이터 바인딩 표의 모든 `테이블.컬럼` (`schedules.schedule_date/time_slot/start_time/end_time/title/location/type/owner_id/memo/created_by/on_behalf_of_id/created_at/deleted_at`, `users.color/name/id/role`, `mentions.reference_type/reference_id`, `companies.name`, `contacts.name`, `audit_logs.action/target_type`) 모두 erd.md 에 실재 ✓
  - 사용 컴포넌트(H1, BTN, BTN-LINK, BTN-ICON, DROPDOWN, SEARCH, DATE-RANGE, SELECT, CHIP, TABLE, CHECKBOX, BADGE, AVATAR, MENU, ACCORDION, INPUT, DATE, TIME, INLINE-ERROR, PAGINATION, EMPTY, ALERT, PROGRESS, TOAST, BANNER, BOTTOMSHEET, MENU-OVERFLOW, TAG, SKELETON, TOOLTIP, LIST) 모두 components.md 정의 ✓
  - 상호작용 API 가 spec/06 LIS-001~007 + spec/13 EXP-001 + process/proc_03·10 와 일치 ✓
  - 4종 상태 + 권한 분기 정의 ✓
- 보류·예외 사항:
  - 행 다중 선택·일괄 작업 (체크박스) 은 Phase 2 (의도적 보류)
  - 컬럼 표시·숨김 사용자 설정은 Phase 2 (의도적 보류)
  - 무한 스크롤은 1000건+ 가상 스크롤로 대체 (numbered pagination 우선)
  - spec/13 vs proc_10 클라이언트 vs 서버 생성 충돌: 1차는 클라이언트 생성 채택. 횡단 상세는 scr_13 에 위임 (의도적 보류)
- 검증자: claude (Step B 그룹 2)
