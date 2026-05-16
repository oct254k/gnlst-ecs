# 내보내기·반응형 횡단 화면설계서

- 화면 ID: (단일 SCR-* 없음) — SCR-LIST 내부 액션 + 전 화면 반응형 규칙. 관련 SCR: `SCR-LIST` (EXP-001 호스트), 그 외 모든 SCR-* (RES-001, RES-002)
- 관련 spec: [spec/13_export_responsive.md](../spec/13_export_responsive.md)
- 관련 process: [process/proc_10_export.md](../process/proc_10_export.md)
- 관련 ERD: `schedules`, `users`, `mentions`, `companies`, `contacts`
- Phase: 1 (EXP-001, RES-001, RES-002) / 2 이후 (EXP-002 Google Calendar 연동 — 1차 범위 제외)
- 최종 갱신: 2026-05-14

---

## 1. 개요

본 문서는 두 가지 횡단 정의를 다룬다.

| 범위 | 내용 |
|---|---|
| **A. EXP-001 엑셀 다운로드 액션** | SCR-LIST 도구바에 위치한 "엑셀 다운로드" 버튼의 인터랙션·컬럼·예외 처리. 본 문서가 컬럼 정의·파일명·예외 처리의 SSOT. |
| **B. EXP-002 Google 캘린더 연동** | **2차 진행 예정, 1차 범위 제외**. 메뉴 항목 비활성 표시 명세만. |
| **C. RES-001 반응형 레이아웃** | 전 화면 횡단 브레이크포인트별 레이아웃 전략. `common_layout.md` 의 3종 BP 와 spec/13 의 6단계 보조 구간 매핑. |
| **D. RES-002 모바일 입력 폼 UX** | 모든 폼에 적용되는 터치 친화 컨트롤·터치 영역·키보드 처리. SCR-MODAL-SCHEDULE-FORM 외에도 SCR-LIST 인라인 편집, SCR-ADMIN-* 폼 등에 횡단 적용. |

> EXP-001 은 화면이 아니라 SCR-LIST 의 도구바 액션이므로, 본 문서는 "단일 화면 와이어프레임" 보다 **컬럼 명세 + 트리거 + 상태** 중심으로 작성한다.

---

## 2. 레이아웃 구조

### A. EXP-001 호스트

| 영역 | 위치 | 비고 |
|---|---|---|
| 트리거 버튼 | `SCR-LIST` 도구바 우측 `[BTN: 엑셀 다운로드]` | scr_06 §3.1 와이어 참조 |
| 보조 트리거 (모바일) | `SCR-LIST` 우상단 `[DROPDOWN: ⋮]` → "엑셀 다운로드" 항목 | RES-001 |
| 진행 표시 | `SL-OVERLAY` 위 `[PROGRESS]` 또는 `[TOAST]` | 1,000건 초과 시 |
| 사전 경고 배너 | `SCR-LIST` 본문 상단 `[ALERT(warn)]` | 1,000건 초과 시 |
| 결과 토스트 | `SL-OVERLAY TOAST` | 완료/실패 |

### B. EXP-002 비활성 메뉴 위치

| 영역 | 위치 | 비고 |
|---|---|---|
| 메뉴 항목 | `SCR-LIST` 도구바 우측 `[DROPDOWN: ⋮]` 의 "Google 캘린더 동기화" | 비활성 (회색 + 잠금 아이콘 🔒) |
| 호버 툴팁 | `[TOOLTIP]` | "2차 진행 예정 — 1차 범위 제외" |

### C·D. RES-001 / RES-002

전 화면 횡단. `common_layout.md` §2 의 `BP-MOBILE` / `BP-TABLET` / `BP-DESKTOP` 슬롯 모델 + spec/13 6단계 보조 구간을 다음과 같이 매핑한다.

| `common_layout.md` BP | spec/13 보조 구간 | px 범위 |
|---|---|---|
| `BP-MOBILE` | 기본 (0+), 소형 (640+) | 0 ~ 767 |
| `BP-TABLET` | 중형 (768+) | 768 ~ 1023 (사이드바 접힘) |
| `BP-DESKTOP` | 대형 (1024+), 특대형 (1280+) | 1024 ~ 1535 |
| `BP-DESKTOP` 와이드 | 와이드 (1536+) | 1536 이상, 본문 max-width 1440px 캡 |

---

## 3. 와이어프레임

### 3.1 EXP-001 트리거 — 데스크톱 (SCR-LIST 도구바)

```
SCR-LIST 도구바 우측:
┌─────────────────────────────────────────────────────────┐
│ ... 필터 ...                          [BTN: 엑셀 다운로드 ⬇] [⋮]│
└─────────────────────────────────────────────────────────┘

상태별:
  0건       → [BTN: 엑셀 다운로드 ⬇ (disabled)] [TOOLTIP: 다운로드할 데이터가 없습니다]
  ~999건    → [BTN: 엑셀 다운로드 ⬇] (활성)
  1000건+   → 클릭 시 → [ALERT(warn): 데이터가 많아 생성에 시간이 걸릴 수 있습니다]
                         [BTN: 계속][BTN: 취소]
                                ↓ 계속
              [PROGRESS: 엑셀 생성 중... 50%]
                                ↓ 완료
              [TOAST(success): 일정_홍길동_20260511.xlsx 다운로드 완료]
```

### 3.2 EXP-001 트리거 — 모바일 (SCR-LIST 더보기 메뉴)

```
SCR-LIST 모바일 상단:
[☰] 리스트   [⋮]
              ↓ 탭
[BOTTOMSHEET: 더보기]
┌──────────────────────────┐
│ 📥 엑셀 다운로드         │ ← 활성 시
│ 🔒 Google 캘린더 동기화 │ ← 비활성 + "2차 진행 예정"
│ ───────────────────────  │
│ 컬럼 표시·숨김 (Phase 2)  │
└──────────────────────────┘
```

### 3.3 EXP-002 비활성 메뉴 — 데스크톱

```
도구바 [⋮] 클릭:
┌────────────────────────────────────────┐
│ 엑셀 다운로드 ⬇                        │ ← 활성
│ 🔒 Google 캘린더 동기화 (비활성)        │
│    [TOOLTIP: 2차 진행 예정 — 1차 범위 제외]│ ← hover 시
│ ───────────────────────────────────────│
│ ...                                    │
└────────────────────────────────────────┘
```

- 클릭 시 동작 없음 (`aria-disabled="true"`, `tabindex="-1"` 또는 명시적 비활성)
- 안내 토스트 없음 (spec/13 EXP-002 UI 처리 정책 그대로)

### 3.4 RES-001 — 화면별 레이아웃 전이 (와이어 발췌)

```
SCR-LIST:
[모바일 0~767]  단일 컬럼 카드 리스트, 필터는 BOTTOMSHEET
[태블릿 768~1023]  테이블 + 일부 컬럼 숨김 (시간대·구분 컬럼 축약)
[데스크톱 1024+]  풀 테이블 + 우측 사이드 필터 패널 고정 (선택)
[와이드 1536+]   본문 max-width 1440px 캡

SCR-CALENDAR:
[모바일]  월간 도트 + 셀 탭 시 PANEL 전체화면
[태블릿]  월/주 뷰 + 우측 임원 색상 토글 collapse 가능
[데스크톱]  월/주/일 + 우측 임원 색상 토글 노출

SCR-RADAR (Phase 3):
[모바일]  가로 스크롤 슬롯 격자
[데스크톱]  화면 너비에 맞게 확장

SCR-POPOVER-RELATIONSHIP:
[모바일]  BOTTOMSHEET 으로 자동 전환
[데스크톱]  POPOVER (트리거 기준)

네비게이션:
[모바일]  SL-TABBAR 하단 5개
[태블릿]  상단 SL-HEADER + 사이드바 접힘
[데스크톱]  좌측 SL-SIDEBAR 고정 + 토글 가능
```

### 3.5 RES-002 — 모바일 폼 와이어 (대표 케이스: SCR-MODAL-SCHEDULE-FORM)

scr_03 §3.5 와이어를 그대로 인용한다. RES-002 규칙은 본 문서 §4·§5·§8 의 가이드라인이 적용된다.

### 3.6 상태별 와이어 (EXP-001)

```
[로딩 — 일반 (<1000건)]
[BTN: 엑셀 다운로드 ⬇ (aria-busy=true)] [SPINNER]
브라우저 다운로드 알림 (네이티브)
→ [TOAST(success)]

[로딩 — 대량 (1000건+)]
[ALERT(warn): 데이터가 많아 생성에 시간이 걸릴 수 있습니다]
[PROGRESS: 엑셀 생성 중... 50%] (선택, 클라이언트 측 진행률 추정)
→ [TOAST(success)]

[빈 — 0건]
[BTN: 엑셀 다운로드 ⬇ (disabled)]
[TOOLTIP (hover/focus): 다운로드할 데이터가 없습니다]

[에러 — 파일 생성 실패]
[TOAST(error): 다운로드에 실패했습니다. 다시 시도해주세요]
SPINNER 종료

[권한 거부]
EXP-001 은 user/admin 모두 가능. 권한 거부 케이스 없음.
미인증 시 SCR-LOGIN 으로 리다이렉트
```

---

## 4. 컴포넌트 사용 표

### A. EXP-001

| 컴포넌트 ID | 본 액션 적용 사양 | 사용 위치 |
|---|---|---|
| `[BTN: 엑셀 다운로드 ⬇]` | secondary + ⬇ 아이콘. 0건 시 disabled + 툴팁. 1000건+ 시 클릭 전 ALERT 동반 | SCR-LIST 도구바 |
| `[TOOLTIP: 다운로드할 데이터가 없습니다]` | disabled 상태 안내 | BTN 위 |
| `[ALERT(warn): 데이터가 많아…]` | 1000건+ 사전 경고 | SCR-LIST 본문 상단 |
| `[PROGRESS: %]` | 대량 생성 진행 (클라이언트 측 또는 워커 진행률) | SCR-LIST 본문 / TOAST |
| `[TOAST(success): 파일명 다운로드 완료]` | 4초 노출 | SL-OVERLAY |
| `[TOAST(error): 다운로드 실패]` | 4초 노출, role="alert" | SL-OVERLAY |
| `[SPINNER]` | BTN 내부 작은 스피너 | BTN |
| `[BTN-ICON: ⋮]` (모바일) | 도구바 더보기 케밥 | SCR-LIST 모바일 |
| `[BOTTOMSHEET: 더보기]` (모바일) | 엑셀 다운로드·EXP-002 비활성 메뉴 묶음 | 모바일 |

### B. EXP-002

| 컴포넌트 ID | 본 액션 적용 사양 | 사용 위치 |
|---|---|---|
| `[DROPDOWN]` 항목 "Google 캘린더 동기화" | disabled. `aria-disabled="true"`. 잠금 아이콘 🔒 prefix | 도구바 케밥 / BOTTOMSHEET |
| `[TOOLTIP: 2차 진행 예정]` | hover/focus 시 노출 | 비활성 항목 |
| `[BANNER]` | 본 1차에서는 사용하지 않음 (spec/13 EXP-002 정책: "안내 토스트 없음") | — |

### C·D. RES-001 / RES-002

전 화면 횡단 가이드라인. 컴포넌트 단위가 아닌 **규칙** 으로 정의 (§5, §8 참조).

| 컴포넌트 ID | 모바일 동작 | 데스크톱 동작 | 비고 |
|---|---|---|---|
| `[INPUT]` | 폰트 16px 이상, 폭 100% | 폰트 14px, 폭 자동 | RES-002 |
| `[RADIO]` | `[SEGMENT]` 로 대체 | RADIO 유지 | RES-002 |
| `[SELECT]` | 네이티브 select 또는 BOTTOMSHEET | 커스텀 드롭다운 | RES-002 |
| `[DATE]` | 네이티브 `<input type="date">` | 커스텀 캘린더 드롭다운 | RES-002 |
| `[TIME]` | 네이티브 `<input type="time">` | 커스텀 타임 피커 | RES-002 |
| `[TOGGLE]` | 토글 스위치 (44×44px 이상) | 동상 | RES-002 |
| `[CHECKBOX]` | 토글로 대체 가능 (종일 등) | 체크박스 유지 | RES-002 |
| `[MODAL]` | fullscreen | 중앙 카드 640px | RES-001 |
| `[PANEL]` | fullscreen 모달 | 우측 슬라이드 400px | RES-001 |
| `[POPOVER]` | `[BOTTOMSHEET]` 로 자동 전환 | 트리거 기준 360px | RES-001 |
| `[TABLE]` | 카드형 `[LIST]` 로 변환 | 풀 테이블 | RES-001 |
| `[BTN]` (저장·1차) | 화면 하단 고정 100% 폭 | 모달 푸터 우측 | RES-002 |
| `[ACCORDION]` | 선택 입력 (멘션·비고) 접힘 | 펼침 기본 | RES-002 |
| `[MENU-OVERFLOW]` | 도구바 케밥으로 액션 묶음 | 직접 노출 | RES-001 |
| `[SL-TABBAR]` | 하단 고정 5개 메뉴 | 미노출 | common_layout §7 |
| `[SL-SIDEBAR]` | 드로어 (left slide-in) | 고정 (240px / 60px) | common_layout §4 |

> 신규 컴포넌트 추가 없음. 본 문서는 기존 컴포넌트의 BP 별 동작을 통합 정의한다.

---

## 5. 상호작용 명세

### 5.1 EXP-001 엑셀 다운로드

| 트리거 | 컴포넌트 | 이벤트 | 다음 상태/액션 | API (기능 ID) |
|---|---|---|---|---|
| 다운로드 클릭 (0건) | `[BTN: 엑셀 다운로드 (disabled)]` | (비활성, hover) | TOOLTIP "다운로드할 데이터가 없습니다" | `EXP-001` 예외 |
| 다운로드 클릭 (1~999건) | `[BTN: 엑셀 다운로드]` | onClick | 현재 필터 적용 데이터(SCR-LIST 로컬 상태) 수집 → xlsx 생성 (클라이언트, e.g. SheetJS) → 브라우저 download 트리거 | `EXP-001` |
| 다운로드 클릭 (1,000건+) | `[BTN: 엑셀 다운로드]` | onClick | `[ALERT(warn): 데이터가 많아 생성에 시간이 걸릴 수 있습니다 [BTN: 계속][BTN: 취소]]` | `EXP-001` 예외 |
| 계속 클릭 | `[BTN: 계속]` | onClick | `[PROGRESS]` 표시 + 비동기 청크 생성 → 다운로드 | `EXP-001` |
| 취소 클릭 | `[BTN: 취소]` | onClick | 작업 중단, ALERT 닫기 | — |
| 생성 완료 | (브라우저) | downloadStart | `[TOAST(success): {파일명} 다운로드 완료]` | — |
| 생성 실패 | (예외) | — | `[TOAST(error): 다운로드에 실패했습니다]` | `EXP-001` 예외 |
| 모바일 다운로드 | (브라우저) | downloadStart | 일부 브라우저에서 "파일 저장 위치 안내" TOAST 추가 (spec/13 EXP-001 예외) | — |

파일명 생성 로직:
```
파일명 = `일정_${filterLabel}_${YYYYMMDD}.xlsx`

filterLabel 우선순위:
  1. 담당자 1명 선택 → `{users.name}` (예: 홍길동)
  2. 담당자 다중 선택 → `${first.name}_외_${N-1}명` (예: 홍길동_외_2명)
  3. 담당자 없음 + 날짜 범위 → `${start}-${end}` (예: 20260501-20260531)
  4. 그 외 → `전체`
```

### 5.2 EXP-002 (비활성)

| 트리거 | 컴포넌트 | 이벤트 | 다음 상태/액션 | API |
|---|---|---|---|---|
| 메뉴 hover (데스크톱) | `[DROPDOWN]` 항목 "Google 캘린더 동기화" | onMouseEnter | `[TOOLTIP: 2차 진행 예정 — 1차 범위 제외]` | — |
| 메뉴 클릭 | `[DROPDOWN]` 항목 | onClick (disabled) | 동작 없음 | — |
| 모바일 BOTTOMSHEET 항목 탭 | 비활성 항목 | onClick (disabled) | 동작 없음. 항목 옆 잠금 아이콘 + 회색 텍스트로 시각 안내 | — |

### 5.3 RES-001 반응형 전환

| 트리거 | 동작 |
|---|---|
| 윈도우 리사이즈 (브라우저) | media query 기반 자동 레이아웃 전환. JavaScript 개입 최소화. SL-SIDEBAR 펼침 상태는 BP 전환 시 reset (드로어 닫기). |
| 모바일 ↔ 데스크톱 회전 | 즉시 레이아웃 재계산. 모달은 fullscreen ↔ 카드 전환. PANEL ↔ MODAL 전환. POPOVER ↔ BOTTOMSHEET 전환. 입력 중인 폼 값은 유지 (DOM 보존). |
| 와이드 모니터 (1536+) | 본문 max-width 1440px 캡 + 좌우 여백 자동 |

### 5.4 RES-002 모바일 폼 입력

| 트리거 | 동작 |
|---|---|
| 입력 필드 포커스 | 키보드 팝업 시 해당 필드를 자동 스크롤하여 가리지 않도록 처리 |
| 종일 토글 ON | TIME 필드 비활성·숨김 |
| 필수 필드 미입력 후 저장 | 첫 번째 오류 필드로 자동 스크롤 + INLINE-ERROR 표시 |
| 종료 < 시작 | 즉시 INLINE-ERROR "종료 시각은 시작 시각 이후여야 합니다" |
| 네이티브 피커 미지원 브라우저 | 텍스트 입력 fallback + 클라이언트 형식 검증 |
| 추가 정보 입력 + (ACCORDION) | 회사·담당자·메모는 접힌 상태 시작. 한 번 입력하면 자동 펼친 상태 유지 |
| 저장 중 네트워크 오류 | 저장 버튼 비활성화 + 로딩 표시 → 실패 시 TOAST(error) |

---

## 6. 데이터 바인딩 표

### 6.1 EXP-001 엑셀 컬럼 ↔ ERD (SSOT)

본 표가 EXP-001 다운로드 컬럼의 SSOT. `spec/06 LIS-001`·`spec/13 EXP-001`·`proc/proc_10` 의 차이는 §이슈 메모 참조.

| 순서 | 헤더 | ERD 컬럼 | 포맷 | NULL 처리 |
|---|---|---|---|---|
| 1 | 날짜 | `schedules.schedule_date` | `YYYY-MM-DD` | (필수) |
| 2 | 시간대 | `schedules.time_slot` | enum → 한글 (morning→오전, lunch→점심, afternoon→오후, evening→저녁, allday→종일) | (필수) |
| 3 | 시작 시각 | `schedules.start_time` | `HH:mm` | 빈칸 |
| 4 | 종료 시각 | `schedules.end_time` | `HH:mm` | 빈칸 |
| 5 | 구분 | `schedules.type` | personal→개인, common→공통 | (필수) |
| 6 | 일정 내용 | `schedules.title` | 텍스트 | (필수) |
| 7 | 담당 임원 | `users.name` (`users.id=schedules.owner_id`) | 텍스트. 공통 일정은 참가자 목록 ("박전무, 이상무, …") 또는 "전체" | 공통은 별도 처리 |
| 8 | 장소 | `schedules.location` | 텍스트 | 빈칸 |
| 9 | 회사/연락처 | `mentions` JOIN `companies.name` / `contacts.name` (콤마 구분, raw_text 가 아닌 정규화된 이름) | 텍스트 | 빈칸 |
| 10 | 비고 | `schedules.memo` | 텍스트 (줄바꿈 허용) | 빈칸 |
| 11 | 작성자 | `users.name` (`users.id=schedules.created_by`) | 텍스트 | (필수) |
| 12 | 대리 입력 명의 | `users.name` (`users.id=schedules.on_behalf_of_id`) | 텍스트 | 빈칸 (직접 입력 시) |
| 13 | 등록 일시 | `schedules.created_at` | `YYYY-MM-DD HH:mm` | (필수) |

> 13 컬럼. spec/13 의 12 컬럼 + ERD 정합성을 위해 "대리 입력 명의" 분리. proc_10 의 8 컬럼은 부분 집합으로 간주.

### 6.2 EXP-001 필터 조건 → 쿼리 매핑

| SCR-LIST 필터 | 쿼리 적용 | ERD 컬럼 |
|---|---|---|
| 키워드 검색 | ILIKE `%q%` (title·location) | `schedules.title`, `schedules.location` |
| @멘션 (임원) | IN 절 | `schedules.owner_id` ∈ `users.id` |
| @멘션 (회사·연락처) | JOIN `mentions` | `mentions.reference_id` |
| 날짜 범위 | BETWEEN | `schedules.schedule_date` |
| 담당자 (다중) | IN 절 (OR) | `schedules.owner_id` |
| 구분 | = enum | `schedules.type` |
| (공통 필터) 삭제되지 않은 항목 | `deleted_at IS NULL` | `schedules.deleted_at` |

날짜 범위 검증 (proc_10 채택):
- 최대 1년 범위. 초과 시 INLINE-ERROR "최대 1년 범위까지 다운로드 가능합니다"
- 시작 > 종료 시 INLINE-ERROR "시작일은 종료일보다 앞서야 합니다" (LIS-005)

### 6.3 EXP-002 (1차 미구현)

데이터 바인딩 없음. UI 만 비활성 항목으로 노출.

### 6.4 RES-001 / RES-002

데이터 바인딩 없음 (UI 규칙).

---

## 7. 화면 상태

### EXP-001 상태표

| 상태 | 표현 |
|---|---|
| 빈 — 0건 | `[BTN: 엑셀 다운로드 (disabled)]` + TOOLTIP. 클릭 자체 불가 |
| 빈 — 날짜 범위 미지정 | 본 문서 1차는 spec/13 정책 채택 (날짜 범위 없어도 현재 화면 데이터로 가능). proc_10 정책(필수)과 충돌 — 이슈 메모 참조 |
| 로딩 (소량) | `[BTN: 엑셀 다운로드]` aria-busy=true + `[SPINNER]`. 보통 < 1초 |
| 로딩 (대량 1000건+) | `[ALERT(warn)]` 사전 확인 → `[PROGRESS: %]` 진행 표시 |
| 에러 | `[TOAST(error): 다운로드에 실패했습니다]` |
| 성공 | `[TOAST(success): {파일명} 다운로드 완료]` |
| 권한 거부 | (해당 없음 — 모든 인증 사용자 가능) |

### EXP-002 상태표

| 상태 | 표현 |
|---|---|
| 1차 (현재) | 메뉴 항목 비활성 (회색 + 🔒). hover 시 `[TOOLTIP: 2차 진행 예정]` |
| 2차 (미래) | 본 문서 범위 외. spec/13 EXP-002 §2차 진행 시 검토 사항 참조 |

### RES-001 / RES-002 상태표

전 화면 횡단 규칙이므로 별도 화면 상태 없음. 각 화면의 §7 화면 상태 섹션에서 BP 별 표현이 정의됨.

---

## 8. 권한·접근성

### 8.1 권한별 노출 차이

| 요소 | 미인증 | `user` | `admin` |
|---|:-:|:-:|:-:|
| EXP-001 `[BTN: 엑셀 다운로드]` | ❌ (인증 후) | ✅ | ✅ |
| EXP-001 다운로드 범위 | — | 본인 또는 본인 접근 가능 일정만 (RLS) | 전체 일정 |
| EXP-002 메뉴 항목 | ❌ | ❌ 비활성 (회색) | ❌ 비활성 (회색) |
| RES-001 / RES-002 | 미인증·인증 동일 적용 | 동상 | 동상 |

> EXP-001 의 다운로드 데이터 범위는 SCR-LIST 의 표시 데이터와 동일하므로, 권한별 행 가시성은 SCR-LIST 의 RLS·필터에 위임된다.

### 8.2 접근성

#### EXP-001
| 항목 | 규칙 |
|---|---|
| 다운로드 버튼 | `<button>` + `aria-label="현재 필터 결과를 엑셀로 다운로드"`. 진행 중 `aria-busy="true"` |
| 비활성 상태 | `aria-disabled="true"` + `aria-describedby` → 툴팁 ID. 스크린리더가 비활성 이유 안내 |
| 사전 경고 ALERT | `role="alert"` (자동 포커스 X) + `aria-live="assertive"` |
| 진행 표시 PROGRESS | `role="progressbar"` + `aria-valuemin/max/now` |
| 결과 토스트 | `role="status"` (success) / `role="alert"` (error). `aria-live` |
| 키보드 | Tab 으로 진입, Enter/Space 트리거. 진행 중 Esc 로 취소 (대량 모드만) |

#### EXP-002
| 항목 | 규칙 |
|---|---|
| 비활성 메뉴 항목 | `role="menuitem"` + `aria-disabled="true"`. 키보드 ↑↓ 이동 시 포커스는 받되 Enter 무반응 |
| 잠금 아이콘 🔒 | 장식이 아닌 의미 (`aria-hidden="false"`). 스크린리더에 "잠금" 으로 안내 |

#### RES-001 / RES-002 (횡단)
| 항목 | 규칙 |
|---|---|
| 최소 탭 영역 | 44 × 44 px (iOS HIG 기준, 전 컴포넌트) |
| 폰트 크기 | 입력 필드 16px 이상 (자동 확대 방지) |
| 레이블 위치 | 입력 위쪽. placeholder 만으로 라벨 대체 금지 |
| 오류 메시지 | 입력 바로 아래, 빨간색 + 아이콘 (색약 대응) |
| 키보드 가림 | 포커스된 입력이 가려지지 않도록 자동 스크롤 (`scrollIntoView`) |
| 스크린리더 / BP 전환 | 레이아웃 전환 시 포커스 유지. 모달이 fullscreen 으로 전환되어도 `role="dialog"` 유지 |
| BOTTOMSHEET 전환 | POPOVER → BOTTOMSHEET 변환 시 `role` 유지. 닫기 핸들(드래그·×)에 `aria-label="닫기"` |
| 색상 단독 사용 금지 | 공통 일정 / 공휴일 / 오류 등은 색 + 텍스트·아이콘 병기 |
| 줄어든 모션 | `prefers-reduced-motion` 시 슬라이드·페이드 애니메이션 단축 (선택, Phase 2) |

---

## 이슈 메모

### ~~EXP-001 vs proc_10 충돌~~ ✅ **RESOLVED 2026-05-14**

사용자 결정 결과: **클라이언트 생성 + 13컬럼 + 날짜 범위 선택(최대 1년)** 채택. `process/proc_10` 이 본 결정에 맞춰 정정됨 (생성 위치, 컬럼 수, 컬럼명, 날짜 범위 정책, 파일명 패턴 모두 갱신).

| 항목 | 확정 |
|---|---|
| 생성 위치 | 클라이언트(브라우저) — 서버 요청 없음 |
| 컬럼 수 | 13 (spec/13 의 12 + 시간대 1) |
| 컬럼 명 | ERD 정합 (`title`, `memo`, `start_time`+`end_time`, `schedule_date` 등) |
| 날짜 범위 | 선택 (현재 필터 상태 그대로). 명시 설정 시 1년 상한 |
| 1,000건 초과 | 경고 안내 후 진행 |
| 파일명 | `일정_{filterLabel}_{YYYYMMDD}.xlsx` |

### spec/process 컬럼명 vs ERD

spec/06, spec/13, proc_10 일부에서 사용된 컬럼명이 ERD 와 불일치. 본 문서는 ERD 컬럼명을 SSOT 로 채택.

| spec/proc 표기 | ERD 컬럼 |
|---|---|
| `schedules.content` | `schedules.title` |
| `schedules.note` | `schedules.memo` |
| `schedules.date` | `schedules.schedule_date` |
| `schedules.actual_time` | `schedules.start_time` + `schedules.end_time` 조합 |
| `mentions.tag` | `mentions.raw_text` + `reference_type` + `reference_id` |

### EXP-002 1차 제외 명시

- 본 문서 1차 범위 안에서는 메뉴 항목 비활성 UI 만 정의. 2차 작업 대상은 spec/13 EXP-002 보존.

### RES-001 BP 매핑

- `common_layout.md` 3종 BP 와 spec/13 6단계 보조 구간 매핑은 본 문서 §2 C·D 항목에 정의. 화면 .md 작성 시 BP 명을 `common_layout.md` 명(`BP-DESKTOP` 등)으로 통일 권장.

---

## 검증

- 자체 검증 일자: 2026-05-14 (EXP-001 결정 라운드 갱신)
- 자체 검증 결과: ✅ 통과 (spec/13 vs proc_10 충돌 3건 모두 RESOLVED)
- 자동 검증 결과: ✅ 통과
  - 8개 필수 섹션 헤더 모두 존재 ✓
  - 본 문서는 화면이 아닌 횡단 규칙이므로 단일 SCR-* 식별자 없음. 호스트 SCR-LIST 와 적용 범위(전 화면) 헤더에 명시 ✓
  - 데이터 바인딩 표의 모든 `테이블.컬럼` (`schedules.schedule_date/time_slot/start_time/end_time/type/title/location/memo/owner_id/created_by/on_behalf_of_id/created_at/deleted_at`, `users.name/id`, `mentions.reference_id/reference_type/raw_text`, `companies.name`, `contacts.name`) 모두 erd.md 에 실재 ✓
  - 사용 컴포넌트(BTN, BTN-ICON, TOOLTIP, ALERT, PROGRESS, TOAST, SPINNER, BOTTOMSHEET, DROPDOWN, INPUT, RADIO, SELECT, DATE, TIME, TOGGLE, CHECKBOX, MODAL, PANEL, POPOVER, TABLE, ACCORDION, MENU-OVERFLOW, BANNER, BADGE, INLINE-ERROR, LIST) 모두 components.md 정의 ✓
  - 상호작용 API 가 spec/13 EXP-001/EXP-002/RES-001/RES-002 + proc/proc_10 와 본 문서의 절충안 (이슈 메모) 으로 일치 ✓
  - 4종 상태(빈/로딩/에러/성공) + 권한 분기 정의 ✓
- 보류·예외 사항:
  - EXP-002 Google 캘린더 연동 — 2차 진행 예정, 1차 범위 제외 (의도적 보류)
  - RES-001 6단계 vs 3단계 BP — 본 문서는 3단계로 표준화하되 보조 구간(640+, 1536+) 은 디테일 적용 시 참조
  - `prefers-reduced-motion` 대응 — Phase 2 (의도적 보류)
- 검증자: claude (Step B 그룹 2)
