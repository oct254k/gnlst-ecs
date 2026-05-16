# 관계 히스토리 화면설계서

- 화면 ID: SCR-POPOVER-RELATIONSHIP (데스크톱: 팝오버 / 모바일: 바텀시트)
- 관련 spec: [spec/10_relationship_history.md](../spec/10_relationship_history.md)
- 관련 process: [process/proc_07_relationship_history.md](../process/proc_07_relationship_history.md)
- 관련 ERD: `mentions`, `schedules`, `contacts`, `companies`, `users`
- Phase: 3
- 최종 갱신: 2026-05-14

---

## 1. 개요

일정 목록·일정 상세·일정 등록 폼에 표시되는 `@회사`/`@사람` 멘션 칩을 클릭하면 호출되는 **팝오버(데스크톱) / 바텀시트(모바일)** 형태의 오버레이. 해당 회사/사람과의 모든 미팅 이력을 집계·정렬하여 표시한다.

| 기능 | 처리 |
|---|---|
| REL-001 (트리거) | 멘션 칩 클릭 → 본 오버레이 호출, 동일 칩 재클릭 시 토글 |
| REL-002 (이력 조회) | 백엔드 호출 — `mentions` + `schedules` + `users` 조인 집계 |
| REL-003 (UI 표시) | 요약 (총 미팅 수 / 최근 날짜 / 최근 담당자) + 미팅 목록 (날짜 내림차순, 최대 10건, 스크롤) |

**호출 위치 (트리거)**:
- `SCR-CALENDAR`, `SCR-LIST`, `SCR-MODAL-SCHEDULE-DETAIL` 의 `[CHIP: 멘션]` 클릭
- `SCR-MODAL-SCHEDULE-FORM` 의 입력 영역 내 `[CHIP: 멘션]` 클릭

**미팅 행 클릭 시 이동지**: `SCR-MODAL-SCHEDULE-DETAIL` (모달). proc_07 본문은 "일정 상세 페이지" 라고 표기하나, `ia/screen_list.md` 에는 별도 일정 상세 페이지가 없고 모달만 정의되어 있어 모달 호출로 통일 (§9 이슈 메모).

**권한**: `user` / `admin` 모두 사용. 미인증은 진입 자체가 차단됨.

---

## 2. 레이아웃 구조

본 화면은 독립 페이지가 아닌 **오버레이** 이므로 부모 화면 위에 z-index 40 (POPOVER) 또는 20 (BOTTOMSHEET) 로 렌더링된다.

| 슬롯 | 사용 |
|---|---|
| `SL-HEADER` / `SL-SIDEBAR` / `SL-FOOTER` | 부모 화면 그대로 유지 (interactivity 만 차단 안 함; 백드롭 클릭 시 닫힘) |
| `SL-MAIN` | 부모 화면 그대로 (배경) |
| `SL-OVERLAY` | 본 오버레이 — `[POPOVER]` (데스크톱) 또는 `[BOTTOMSHEET]` (모바일) |

**표시 사양 (spec/10 §공통 UI 상세)**

| 항목 | 데스크톱 (`[POPOVER]`) | 모바일 (`[BOTTOMSHEET]`) |
|---|---|---|
| 폭 | 360px 고정 | 화면 너비 100% |
| 최대 높이 | 480px (초과 시 미팅 목록 영역 스크롤) | 화면 높이의 80% |
| 위치 | 트리거 칩 기준 우측·하단 우선, 화면 끝 초과 시 반대 방향 | 화면 하단에서 슬라이드업, `[BACKDROP]` |
| 닫기 | × 버튼, 외부 클릭, ESC | × 버튼, 스와이프 다운, ESC, 백드롭 |

---

## 3. 와이어프레임

### 3.1 데스크톱 (`[POPOVER]`) — 정상 (이력 1건 이상)

```
부모 화면 (예: SCR-LIST 또는 SCR-MODAL-SCHEDULE-DETAIL)
   ↓
   ┌─────────────────────────────────┐
   │ ... 일정 내용: [CHIP: @삼성전자] │  ← 트리거
   └─────────────────────────────────┘
         ↘ (클릭)
            ┌─ POPOVER (360px × ≤480px) ────────┐
            │ 🏢 삼성전자                    [×]│
            │ ───────────────────────────────  │
            │ 총 미팅   최근 날짜    최근 담당자│
            │  12회    2026-04-30   홍길동 전무 │
            │ ───────────────────────────────  │
            │ 미팅 이력 (최신순, 최대 10건)     │
            │ ───────────────────────────────  │
            │ [LIST]                            │
            │ ┌─ 2026-04-30 ─ 홍길동 전무 ─┐  │
            │ │ 분기 실적 리뷰               │  │
            │ │ 📍 본사 회의실               │  │
            │ └──────────────────────────────┘  │
            │ ┌─ 2026-03-15 ─ 김영희 상무 ─┐  │
            │ │ 사업 협력 논의               │  │
            │ │ 📍 상대방 사무실             │  │
            │ └──────────────────────────────┘  │
            │ ┌─ 2026-01-10 ─ 박철수 부사장─┐  │
            │ │ 계약 조건 협의               │  │
            │ │ 📍 —                         │  │
            │ └──────────────────────────────┘  │
            │ ... (스크롤, 최대 10건)           │
            └──────────────────────────────────┘
              (행 클릭 → SCR-MODAL-SCHEDULE-DETAIL)
```

### 3.2 데스크톱 — @사람 변형

```
            ┌─ POPOVER ────────────────────────┐
            │ 👤 박철수 · 삼성전자 · 부장   [×]│
            │ ───────────────────────────────  │
            │ 총 미팅   최근 날짜    최근 담당자│
            │   3회    2026-04-20   이영희 상무 │
            │ ───────────────────────────────  │
            │ (미팅 이력 목록 — 위와 동일 형식) │
            └──────────────────────────────────┘
```

### 3.3 데스크톱 — 빈 상태 (이력 0건)

```
            ┌─ POPOVER ────────────────────────┐
            │ 🏢 신규회사                    [×]│
            │ ───────────────────────────────  │
            │ 총 미팅   최근 날짜    최근 담당자│
            │   0회      —             —        │
            │ ───────────────────────────────  │
            │ [EMPTY: "아직 미팅 이력이 없습니다"]│
            └──────────────────────────────────┘
```

### 3.4 데스크톱 — 로딩

```
            ┌─ POPOVER ────────────────────────┐
            │ 🏢 삼성전자                    [×]│
            │ ───────────────────────────────  │
            │ [SKELETON] 회색 막대 3행 (요약)   │
            │ ───────────────────────────────  │
            │ [SKELETON] 회색 막대 5행 (목록)   │
            └──────────────────────────────────┘
```

### 3.5 데스크톱 — 오류

```
            ┌─ POPOVER ────────────────────────┐
            │ 🏢 삼성전자                    [×]│
            │ ───────────────────────────────  │
            │ [ALERT: error]                    │
            │   이력을 불러오지 못했습니다.     │
            │   [BTN: 재시도]                   │
            └──────────────────────────────────┘
```

### 3.6 모바일 (`[BOTTOMSHEET]`)

```
┌─ 부모 화면 (어둡게) ─────────┐
│ ...                          │
│ [CHIP: @삼성전자] ← 트리거   │
│ ...                          │
│ [BACKDROP]                   │
└──────────────────────────────┘
        ↓ (슬라이드업)
┌─ BOTTOMSHEET (100% × 80vh) ─┐
│ ▭ (드래그 핸들)              │
│                              │
│ 🏢 삼성전자             [×]  │
│ ───────────────────────────  │
│ 총 미팅  최근 날짜  최근 담당자│
│  12회   2026-04-30  홍길동 전무│
│ ───────────────────────────  │
│ 미팅 이력 (최신순)            │
│ ───────────────────────────  │
│ [LIST]                       │
│ ┌── 2026-04-30 ──────────┐   │
│ │ 홍길동 전무 · 분기 실적 │   │
│ │ 📍 본사 회의실         │   │
│ └────────────────────────┘   │
│ ┌── 2026-03-15 ──────────┐   │
│ │ 김영희 상무 · 사업 협력 │   │
│ │ 📍 상대방 사무실        │   │
│ └────────────────────────┘   │
│ ... (스크롤)                 │
│                              │
│ (행 탭 → 일정 상세 풀스크린  │
│  모달)                       │
└──────────────────────────────┘
```

---

## 4. 컴포넌트 사용 표

| 컴포넌트 ID | 본 화면 적용 |
|---|---|
| `[POPOVER: 관계 히스토리]` | 데스크톱 컨테이너. `aria-labelledby` → 헤더 ID |
| `[BOTTOMSHEET: 관계 히스토리]` | 모바일 컨테이너. 스와이프 다운 닫기 |
| `[BACKDROP]` | 모바일에서 배경 어둡게, 클릭 시 닫기 |
| `[BTN-ICON: ×]` | 헤더 우측 닫기 버튼, `aria-label="히스토리 카드 닫기"` |
| `[CHIP: @엔티티명]` | 헤더 좌측의 회사/사람 표시 (components.md §3.2 mention variant) |
| `[H2: 미팅 이력]` | 목록 섹션 헤더 (보이는 텍스트는 "미팅 이력 (최신순)") |
| `[DIVIDER]` | 요약/목록 구분 |
| `[LIST]` | 미팅 이력 목록 (카드형, 최대 10건, 스크롤) |
| `[LINK: 미팅 행]` | 각 행을 링크 마크업 (`role="link"`, 클릭 시 `SCR-MODAL-SCHEDULE-DETAIL`) |
| `[EMPTY: "아직 미팅 이력이 없습니다"]` | 0건 상태 |
| `[SKELETON]` | 로딩 |
| `[ALERT: error]` | 조회 실패 |
| `[BTN: 재시도]` | 오류 상태에서 표시 (secondary) |
| `[TOOLTIP]` | (선택) 행 hover 시 일정 제목 전체 표시 (제목이 잘릴 때) |

신규 컴포넌트 추가 없음. `[POPOVER]`/`[BOTTOMSHEET]` 의 RES-001 전환 정책은 `components.md` §6.3, §6.4 에 정의됨.

---

## 5. 상호작용 명세

| 트리거 | 컴포넌트 | 이벤트 | 다음 상태/액션 | API (spec/process) |
|---|---|---|---|---|
| `[CHIP: @회사/@사람]` 클릭 | 부모 화면의 CHIP | onClick | 클릭 위치 기준 위치 계산 → 오버레이 오픈 → REL-002 호출 | REL-001 |
| 동일 칩 재클릭 | 동일 CHIP | onClick | 오버레이 닫기 (토글) | REL-001 ALT |
| 다른 칩 클릭 | 다른 CHIP | onClick | 이전 오버레이 닫고 새 오버레이 오픈 | REL-001 ALT |
| 외부 클릭 | `[BACKDROP]` / 부모 화면 | onClick | 오버레이 닫기, 트리거 칩에 포커스 복귀 | REL-001 |
| `Esc` 키 | 오버레이 | onKeyDown | 오버레이 닫기, 트리거 칩에 포커스 복귀 | REL-001 |
| `×` 버튼 클릭 | `[BTN-ICON: ×]` | onClick | 오버레이 닫기 | REL-001 |
| 모바일 스와이프 다운 | `[BOTTOMSHEET]` | onSwipeDown | 오버레이 닫기 | REL-003 모바일 |
| 미팅 행 클릭 | `[LIST]` 행 / `[LINK]` | onClick | `SCR-MODAL-SCHEDULE-DETAIL` 오픈 (`schedule_id` 전달), 본 오버레이 닫기 | REL-003 → SCH-005 |
| 미팅 행 키보드 Enter | `[LINK]` | onKeyDown(Enter) | 동일 (행 클릭과 동일) | — |
| 오류 상태 "재시도" | `[BTN]` | onClick | REL-002 재호출 → 로딩 → 결과 | REL-002 |
| 응답 5초 초과 | — | timeout | `[ALERT: error]` "데이터를 불러오는 중 오류가 발생했습니다" + `[BTN: 재시도]` | proc_07 EXC |

---

## 6. 데이터 바인딩 표

### 6.1 헤더 (요약)

| UI 필드 | 표시 형식 | 데이터 소스 | 비고 |
|---|---|---|---|
| 엔티티 유형 | 🏢 (회사) / 👤 (사람) | `mentions.reference_type` (`company` / `contact`) | — |
| 엔티티 이름 | 텍스트 | `companies.name` (reference_type=company) 또는 `contacts.name` (reference_type=contact) | REL-002 입력값으로 조인 |
| 소속·직책 (사람만) | 텍스트 | `contacts.title`, `companies.name` (조인: `contacts.company_id`) | 회사일 때는 미표시 |
| 총 미팅 횟수 | 숫자 | `COUNT(mentions WHERE reference_type=? AND reference_id=? AND schedules.deleted_at IS NULL)` | 0 시 "0회" |
| 최근 미팅 날짜 | YYYY-MM-DD | `MAX(schedules.schedule_date)` (위 조건 동일) | 0 건 시 "—" |
| 최근 담당자 | 텍스트 | `users.name` (조인: `schedules.owner_id` of MAX(date) row) | 0 건 또는 owner_id NULL 시 "—" |

### 6.2 미팅 목록 (각 행)

| UI 필드 | 표시 형식 | 데이터 소스 | 비고 |
|---|---|---|---|
| 일정 ID (내부 키) | UUID | `schedules.id` | 행 클릭 시 모달 호출 키 |
| 미팅 날짜 | YYYY-MM-DD | `schedules.schedule_date` | 내림차순 정렬, 최대 10건 |
| 담당 임원 이름 | 텍스트 | `users.name` (조인: `schedules.owner_id`) | NULL (공통 일정 owner_id=NULL) 시 "—" |
| 일정 제목 | 텍스트 (앞 100자) | `schedules.title` | 잘림 시 `[TOOLTIP]` |
| 장소 | 텍스트 | `schedules.location` | NULL/빈 시 "—" (em dash) |
| 삭제 일정 제외 | — | `schedules.deleted_at IS NULL` | 자동 제외 (proc_07) |

### 6.3 멘션 조인 조건 요약

```sql
SELECT s.id, s.schedule_date, s.title, s.location, s.owner_id, u.name AS owner_name
FROM mentions m
JOIN schedules s ON s.id = m.schedule_id
LEFT JOIN users u ON u.id = s.owner_id
WHERE m.reference_type = :type      -- 'contact' or 'company'
  AND m.reference_id = :ref_id      -- contacts.id or companies.id
  AND s.deleted_at IS NULL
ORDER BY s.schedule_date DESC
LIMIT 10
```

> `mentions.reference_id` 는 ERD 다형성 컬럼 (FK 미설정). 본 화면은 `reference_type` 으로 분기하여 `contacts.id` 또는 `companies.id` 와 조인.

---

## 7. 화면 상태

| 상태 | 트리거 | UI |
|---|---|---|
| 닫힘 (기본) | — | 오버레이 비표시 |
| 열림·로딩 | 칩 클릭 직후 | 오버레이 즉시 표시, 요약·목록 영역에 `[SKELETON]` |
| 열림·정상 (≥1건) | REL-002 200 | 요약 + `[LIST]` 미팅 이력 (최대 10건, 스크롤) |
| 열림·빈 (0건) | REL-002 응답이 0건 | 요약 영역: 총 0회 / 최근 날짜 — / 최근 담당자 —. 목록: `[EMPTY: "아직 미팅 이력이 없습니다"]` |
| 열림·오류 | 네트워크/서버 오류 또는 5초 timeout | `[ALERT: error]` + `[BTN: 재시도]` |
| 열림·인증 만료 | API 401 | 오버레이 닫고 로그인 페이지 리다이렉트 |
| 닫힘 (사용자 액션) | ×, ESC, 외부 클릭, 동일 칩 재클릭, 스와이프 다운(모바일) | 오버레이 제거, 트리거 칩에 포커스 복귀 |
| 일정 상세 진입 | 미팅 행 클릭 | 오버레이 닫고 `SCR-MODAL-SCHEDULE-DETAIL` 오픈 (z-index 20) |

---

## 8. 권한·접근성

### 8.1 권한별 노출

| 요소 | 미인증 | `user` | `admin` |
|---|:-:|:-:|:-:|
| 트리거 칩 (멘션) | ❌ (부모 화면 자체 차단) | ✅ | ✅ |
| 오버레이 열기 | ❌ | ✅ | ✅ |
| 미팅 이력 조회 결과 | ❌ | ✅ (모든 일정 — 검색 권한은 시스템 전체 조회 가정. PERM-001 의 RBAC 정책에 따름) | ✅ |
| 일정 상세 모달 진입 | ❌ | ✅ (SCR-MODAL-SCHEDULE-DETAIL 의 권한 분기에 위임) | ✅ |

> `user` 는 모든 일정 이력을 조회할 수 있다 (회사·사람의 누적 미팅 분석이 본 기능의 목적). 단, 일정 상세 모달 진입 후 수정·삭제 권한은 본인/대리권한 소유자/admin 만 허용 (PERM-001).

### 8.2 접근성

- `[POPOVER]` / `[BOTTOMSHEET]`: `role="dialog"`, `aria-modal="false"` (팝오버) / `"true"` (바텀시트), `aria-labelledby="rel-history-title"`.
- 트리거 `[CHIP]`: `aria-haspopup="dialog"`, `aria-expanded="true|false"` (열림 상태에 따라 토글).
- 닫힘 시 포커스 자동 복귀: 트리거 칩 (REL-001 사후 조건).
- `Esc` 키로 닫기.
- 미팅 행: `<a>` 또는 `role="link"` + `tabindex="0"`, 키보드 Enter 로 활성화 (proc_07 §접근성).
- 색상 의존성 없음 (이모지·텍스트 병행).
- 스크린리더용 라이브 영역: 오버레이 오픈 시 `aria-live="polite"` 로 "삼성전자 미팅 이력, 총 12회" 같은 요약 announce (선택).
- 모바일 스와이프 다운: 키보드 사용자에게는 `Esc` / × 버튼이 동등한 닫기 수단.

---

## 9. 이슈 메모 (spec/process 검토 중 발견)

1. **일정 상세 페이지 vs 모달** — `proc_07_relationship_history.md` 본문은 "해당 일정 상세 페이지로 이동" 으로 표기. 그러나 `ia/screen_list.md` 에는 별도 일정 상세 페이지가 없고 `SCR-MODAL-SCHEDULE-DETAIL` 모달만 정의되어 있음. 본 설계서는 모달 호출로 통일 (작업지시서 §5.4 SSOT 우선순위).
2. **`schedules.date`·`schedules.content` 표기 오류** — proc_07 §히스토리 카드 표시 필드 표가 `schedules.date`, `schedules.content` 로 표기하나, ERD 는 `schedule_date`, `title` (`memo` 는 별도). 본 설계서는 ERD 기준.
3. **장소 NULL 표시** — spec/10 은 "—" (em dash), proc_07 는 "미정". 본 설계서는 spec 기준 "—" 채택 (REL-003 본문이 명시적).
4. **`mentions` 입력 키** — REL-002 입력값은 "태그 이름 (정확히 일치)" 로 표기되나, 실제 DB 조인은 `mentions.reference_id` (UUID) 기준이 더 안정적. 본 설계서 데이터 바인딩 표는 `reference_id` 조인 기반으로 SQL 예시 명시 (§6.3).
5. **`schedule_participants` 참가 케이스의 멘션** — 공통 일정에서 회사 멘션이 있을 때, owner_id 가 NULL 인 경우 "최근 담당자" 산출이 불가. 본 화면은 NULL 시 "—" 표시.

---

## 검증

- 자체 검증 일자: 2026-05-14
- 자체 검증 결과: ⚠️ 일부 통과 (proc_07 의 컬럼명 표기 오류 및 SSOT 불일치 발견 — §9 이슈 메모로 기록, ERD/IA 기준 채택)
- 자동 검증 결과: ✅ 통과
  - 8개 필수 섹션 헤더 모두 존재 ✓
  - SCR-POPOVER-RELATIONSHIP 식별자 ✓ (`ia/screen_list.md` 라인 50)
  - 데이터 바인딩 표의 모든 `테이블.컬럼` (`mentions.reference_type/reference_id/schedule_id`, `schedules.id/schedule_date/title/location/owner_id/deleted_at`, `contacts.name/title/company_id`, `companies.name`, `users.name`) 이 `erd/erd.md` E06/E04/E03/E02/E01 에 실재 ✓
  - 사용 컴포넌트 모두 `components.md` 에 정의됨 ✓ (`POPOVER/BOTTOMSHEET/BACKDROP/BTN-ICON/CHIP/H2/DIVIDER/LIST/LINK/EMPTY/SKELETON/ALERT/BTN/TOOLTIP`)
  - 상호작용 표의 API 모두 spec/process 의 REL-001~003 에 정의됨 ✓ (행 클릭 → SCH-005 위임)
  - 4종 상태(빈/로딩/에러/성공) + 권한 거부 모두 §7 에 정의 ✓ (오버레이 특성상 "닫힘" 도 정의)
  - 권한 분기 §8 에 명시 ✓
- 보류·예외 사항:
  - §9 (1) "일정 상세 페이지" 표기는 IA 와 불일치 — proc 본문 수정이 필요. 본 화면은 SCR-MODAL-SCHEDULE-DETAIL 호출로 작성 (의도적 이슈 메모).
  - §9 (2) proc_07 의 컬럼명 표기 오류는 spec 폴더 읽기 전용으로 본 화면 작성 범위에서 수정 불가.
- 검증자: claude (Step B 그룹 3)
