# Pencil(.pen) 디자인 시안 작성 절차서

- 문서 ID: SCRDSGN-C
- 최종 갱신: 2026-05-14
- 적용 범위: 본 폴더의 `common_layout.md` + `components.md` + `scr_*.md` 14건을 기반으로 Pencil(.pen) 디자인 시안을 작성하는 별도 라운드의 작업 절차
- **본 라운드에서 실제 .pen 작업은 수행하지 않음** — 본 문서는 절차 정의만

> Pencil MCP 의 접근 정책: `.pen` 파일은 암호화 저장. `Read`/`Grep` 으로 직접 접근 불가. 반드시 Pencil MCP 도구(`get_editor_state`, `open_document`, `batch_get`, `batch_design`, `get_guidelines`, `get_screenshot`, `snapshot_layout`, `get_variables`, `set_variables`, `export_nodes`, `find_empty_space_on_canvas` 등)만 사용한다.

---

## 1. 산출 .pen 파일 구조

본 라운드 종료 시점에 생성될 `.pen` 파일은 다음과 같다. 위치는 `docs/design/pencil/` 권장 (별도 라운드에서 사용자 결정).

| .pen 파일 | 내용 | 의존성 |
|---|---|---|
| `library_components.pen` | 본 폴더 `components.md` 의 ~50개 컴포넌트 (BTN, INPUT, MODAL, CAL-EVENT 등) 마스터 인스턴스 | (없음) |
| `master_layout.pen` | `common_layout.md` 의 4개 슬롯(SL-HEADER, SL-SIDEBAR, SL-MAIN, SL-FOOTER) 마스터 + `SL-TABBAR`, `SL-AUTH` 변형 | `library_components.pen` |
| `tokens.pen` 또는 `master_layout.pen` 내 변수 | `common_layout.md §11` 디자인 토큰 (`space-*`, `radius-*`, `font-*`, `color-*`) | (없음) |
| `scr_00_overview.pen` ~ `scr_13_export_responsive.pen` | 14개 화면 .md 의 데스크톱·모바일 와이어를 .pen 으로 옮긴 시안. 모달·패널·팝오버는 다건 통합 화면 내 보조 페이지로 | `master_layout.pen`, `library_components.pen` |
| `index.pen` (선택) | 14개 화면 썸네일 인덱스 보드 | 전체 |

> 다건 통합 화면(`scr_01_auth.md`, `scr_02_permission.md`, `scr_11_notification.md`)은 `.pen` 파일 1개 안에 A/B/C/D/E 페이지 또는 프레임으로 분리.

---

## 2. 사전 준비 (별도 라운드 시작 시)

### 2.1 Pencil MCP 초기 상태 확인

```
get_editor_state({ include_schema: true })
```

목적:
- 현재 열린 .pen 이 있는지 확인
- 사용자 선택, 현재 활성 페이지·프레임 확인
- 노드 스키마 (지원되는 노드 종류·속성) 확인

### 2.2 가이드라인 로드

```
get_guidelines()            // 전체 카테고리 목록
get_guidelines("components") // 컴포넌트 작성 가이드
get_guidelines("layout")    // 레이아웃 가이드 (있다면)
```

목적: Pencil 측의 컴포넌트·레이아웃 작성 베스트 프랙티스, 노드 구조 표준 확보.

### 2.3 SSOT 파일 사전 읽기 (Pencil MCP 외)

별도 라운드의 에이전트가 작업 시작 전 반드시 읽어야 할 파일:

- `screen_design/common_layout.md` (레이아웃 슬롯, 브레이크포인트, 권한별 UI)
- `screen_design/components.md` (컴포넌트 ID, 상태, 이벤트, 접근성)
- `screen_design/scr_*.md` 14건 (와이어 + 상호작용 + 데이터 바인딩)
- 각 화면의 이슈 메모 섹션 — 디자인 시점에 임시 처리된 항목 (예: `notification_logs.read_at` 부재) 확인

---

## 3. Step C-1: 디자인 토큰 정의

`common_layout.md §11` 가안을 기준으로 색상값을 확정하고 Pencil 변수로 등록한다.

### 3.1 변수 현황 조회

```
get_variables()
```

### 3.2 토큰 등록

```
set_variables({
  "space-1": "4",
  "space-2": "8",
  "space-3": "16",
  "space-4": "24",
  "space-5": "32",
  "radius-sm": "4",
  "radius-md": "8",
  "radius-lg": "12",
  "font-body-size": "14",
  "font-body-lh": "1.5",
  "font-h1-size": "28",
  "font-h1-mobile-size": "22",
  "color-primary": "#????",        // 확정 필요
  "color-bg": "#????",             // 확정 필요
  "color-border": "#????",         // 확정 필요
  "color-text-1": "#????",         // 확정 필요
  "color-text-2": "#????",         // 확정 필요
  "color-error": "#????",          // 확정 필요
  "color-success": "#????",        // 확정 필요
  "color-warn": "#????"            // 확정 필요
})
```

> 색상 결정은 사용자와 협의. 사내 브랜드 컬러가 있다면 그것을 1차 색으로 채택. 없다면 중립 청록(예: `#0066CC` primary, `#F5F5F5` bg, `#E5E5E5` border) 기본안 제시.

### 3.3 임원별 색상

`users.color` 는 사용자 지정값 (`#RRGGBB`). 토큰화하지 않고 데이터 바인딩으로 처리. `[CAL-EVENT]`, `[AVATAR]` 컴포넌트 내부 색상 슬롯에 변수 대신 `data-color` 속성 매핑.

---

## 4. Step C-2: 컴포넌트 라이브러리(.pen) 생성

`components.md` 의 카테고리 7종, ~50개 컴포넌트를 마스터 인스턴스로 작성.

### 4.1 .pen 파일 생성

```
open_document('new')
// 또는 기존 .pen 이 있다면 그 경로
// 이후 파일명/저장 위치는 Pencil UI 에서 확정
```

### 4.2 우선순위 (작성 순서)

라이브러리는 의존성 적은 것부터:

1. **표시·기본**: `H1`, `H2`, `DIVIDER`, `TAG`, `BADGE`, `CHIP`, `AVATAR`, `KBD`, `TOOLTIP`
2. **입력 기본**: `INPUT`, `INPUT(password)`, `TEXTAREA`, `SELECT`, `SEARCH`, `CHECKBOX`, `RADIO`, `TOGGLE`, `SEGMENT`, `DATE`, `DATE-RANGE`, `TIME`, `COLOR`
3. **액션**: `BTN`(변형 5종: primary/secondary/tertiary/danger/ghost), `BTN-ICON`, `BTN-LINK`, `LINK`, `DROPDOWN`, `MENU`
4. **피드백**: `TOAST`(4변형), `BANNER`(3변형), `INLINE-ERROR`, `SPINNER`, `SKELETON`, `PROGRESS`, `ALERT`(3변형)
5. **구조**: `TABLE`, `LIST`, `CARD`, `TABS`, `PAGINATION`, `BREADCRUMB`, `EMPTY`, `ACCORDION`, `STEPPER`
6. **고급 입력**: `MENTION` (자동완성 드롭다운 포함)
7. **오버레이**: `MODAL`, `PANEL`, `POPOVER`, `BOTTOMSHEET`, `BACKDROP`, `MENU-OVERFLOW`
8. **달력 전용**: `CAL-CELL`, `CAL-EVENT`, `CAL-SLOT`, `CAL-HEADER`, `CAL-VIEWSWITCH`
9. **기타**: `TIMELINE` (감사 로그)

### 4.3 컴포넌트 작성 작업 단위

각 컴포넌트는 `batch_design` 1~수회 호출로 작성. 상태별 변형(default/hover/focus/active/disabled/error/loading) 을 동일 마스터 내 변형(variants)으로 등록.

예시 (BTN primary):

```
batch_design([
  // 마스터 노드 생성
  btn_primary = I("page-actions", { type: "component", name: "BTN-primary",
    width: 120, height: 40,
    fills: ["color-primary"],
    cornerRadius: "radius-sm",
    children: [
      { type: "text", text: "라벨", font: "font-body-size", color: "white" }
    ]
  }),
  // hover 변형
  btn_primary_hover = C(btn_primary.id, "page-actions", {
    name: "BTN-primary/hover", fills: ["color-primary-hover"]
  }),
  // disabled 변형
  ...
])
```

> 정확한 노드 스키마는 `get_editor_state({ include_schema: true })` 결과로 확정. 위 예시는 개념적 형식.

### 4.4 컴포넌트별 작성 체크리스트

- [ ] 상태별 변형 (default + 해당 컴포넌트의 상태 모두)
- [ ] 자식 슬롯 (`라벨`, `아이콘`, `값` 등) 노출
- [ ] 변수 바인딩 (`color-*`, `space-*`, `radius-*`, `font-*`)
- [ ] 접근성 메타데이터 (Pencil 측 `aria-role` 필드가 있다면 채움)
- [ ] 데스크톱 / 모바일 사이즈 변형 (필요 시)

### 4.5 검증

```
get_screenshot()          // 시각 확인
snapshot_layout()         // 노드 트리 스냅샷
search_all_unique_properties()  // 변수 미바인딩 확인
```

---

## 5. Step C-3: 공통 레이아웃 마스터(.pen) 생성

`common_layout.md` 의 4개 슬롯 + 변형 2종을 마스터로 작성.

### 5.1 작성 단위

1. **데스크톱 마스터** (BP-DESKTOP, 1280×800 프레임)
   - `SL-HEADER` (56px, sticky)
   - `SL-SIDEBAR` (240px, 펼침)
   - `SL-MAIN` (가변)
   - `SL-FOOTER` (48px)
2. **태블릿 마스터** (BP-TABLET, 1024×768 프레임)
   - `SL-HEADER` (56px)
   - `SL-SIDEBAR` (60px, 아이콘 only)
   - `SL-MAIN`
   - `SL-FOOTER` (48px)
3. **모바일 마스터** (BP-MOBILE, 375×812 프레임)
   - `SL-HEADER` (56px)
   - `SL-MAIN`
   - `SL-TABBAR` (56px, fixed bottom)
4. **인증 전용 레이아웃** (`SL-AUTH`)
   - 카드 폭 400px (데스크톱) / 100% (모바일)

### 5.2 슬롯 내부 정의

- `SL-HEADER`: 로고·사이드바 토글·통합검색(placeholder, disabled — Phase 2)·알림 벨·아바타 드롭다운 — `library_components.pen` 의 `BTN`, `BTN-ICON`, `INPUT`, `BADGE`, `AVATAR` 인스턴스 사용
- `SL-SIDEBAR`: 메뉴 트리, 권한별 노출 변형 2개(`user`/`admin`) — Pencil 변형으로
- `SL-MAIN`: 페이지 헤더 슬롯(타이틀 + 1차 액션 + 2차 액션 + 도구바) + 본문 영역
- `SL-FOOTER`: 버전·도움말·단축키
- `SL-TABBAR`: 5개 탭, 활성 변형

### 5.3 z-index 스택 검증

`common_layout.md §9.2` z-index 표 그대로 채택. Pencil 측 레이어 순서를 통해 표현.

---

## 6. Step C-4: 화면별 .pen 14개 생성

각 `scr_XX_*.md` 의 와이어를 .pen 으로 옮긴다. 데스크톱 1프레임 + 모바일 1프레임을 기본으로, 화면별 상태(빈/로딩/에러/성공) 는 보조 프레임으로 추가.

### 6.1 작업 순서

화면 ID 순서가 아닌 **의존성·복잡도** 기준 권장:

1. **단순 단일 화면 (먼저)**
   - `scr_12_audit_log.md` (모달 1개)
   - `scr_08_holiday.md` (테이블 1개)
   - `scr_10_relationship_history.md` (팝오버 1개)
   - `scr_00_overview.md` (대시보드 + 인덱스 보드)
2. **중간 복잡도**
   - `scr_05_calendar_view.md` (월/주/일 3개 변형 + 패널)
   - `scr_06_list_view.md` (테이블 + 인라인 편집 + 빠른 입력)
   - `scr_09_meeting_radar.md` (슬롯 격자)
   - `scr_04_mention_contact.md` (탭 2개 + 모달 1개)
3. **다건 통합 화면**
   - `scr_01_auth.md` (5개 인증 화면 — A/B/C/D/E)
   - `scr_02_permission.md` (3개 화면 — A/B/C)
   - `scr_11_notification.md` (3개 화면 — A/B/C)
4. **모달 중심 화면 (의존성 많음)**
   - `scr_03_schedule.md` (폼 + 상세 + 삭제 확인 모달 — `MENTION`, `BANNER`, `MODAL` 정확도 중요)
   - `scr_07_common_schedule.md` (폼 변형 + 참가자 토글)
5. **횡단 문서 (마지막)**
   - `scr_13_export_responsive.md` (액션 + 반응형 규칙 — 별도 페이지에 규칙 카드로)

### 6.2 화면별 .pen 작성 절차 (공통)

각 화면마다:

1. 새 .pen 파일 생성 또는 기존 통합 파일 내 새 페이지 추가
2. 데스크톱 프레임 (1280×800 또는 화면별 권장)
   - `master_layout.pen` 데스크톱 마스터 인스턴스화
   - `SL-MAIN` 본문 슬롯에 화면 .md §3 와이어 그대로 옮김
   - 컴포넌트는 `library_components.pen` 인스턴스 사용
3. 모바일 프레임 (375×812)
   - 동일 절차, `SL-TABBAR` 마스터 사용
4. 상태별 보조 프레임
   - 빈 상태 (`[EMPTY]` 인스턴스)
   - 로딩 상태 (`[SKELETON]` 인스턴스)
   - 에러 상태 (`[ALERT: error]`)
   - (성공 상태는 토스트로 표현 — 별도 프레임 불필요)
5. 권한 분기 변형
   - 해당 화면에 권한 분기가 있으면 `user` / `admin` 변형 별도 프레임
6. 데이터 바인딩 메타
   - Pencil 노드에 `data-binding` 속성 또는 노트로 `테이블.컬럼` 메모 (별도 라운드의 개발자가 참조)

### 6.3 와이어 → .pen 변환 시 주의

- ASCII 와이어의 `[BTN: 저장]` 등 표기는 라이브러리 컴포넌트로 1:1 치환
- 박스 그리기(`┌─┐`)는 Pencil 의 컨테이너 노드로 변환
- `... (N건)` 축약은 .pen 에서는 실제 N건(기본 3건) 렌더링, 더미 데이터는 `erd/seed.md` 참조
- 컬러는 임원별 컬러(`users.color`)와 일정 유형 컬러(공통/개인) 모두 변수 바인딩

---

## 7. Step C-5: 검토 흐름

### 7.1 작성 직후 자체 검토

```
get_screenshot({ frameId: "..." })   // 시각 확인
snapshot_layout({ rootId: "..." })   // 노드 트리 확인
```

체크:
- [ ] 컴포넌트 인스턴스가 마스터를 참조 (직접 그리지 않음)
- [ ] 변수 바인딩 누락 없음 (`search_all_unique_properties` 결과에 토큰명이 떠야 함)
- [ ] 와이어 .md 의 컴포넌트와 .pen 의 컴포넌트 1:1 대응
- [ ] 데스크톱·모바일 두 프레임 모두 존재

### 7.2 횡단 검토 (전체 14개 완료 후)

```
batch_get({ patterns: ["scr_*"] })   // 모든 화면 프레임 메타 수집
```

체크:
- [ ] 14개 .pen (또는 통합 파일의 14개 페이지·프레임) 모두 작성
- [ ] 라이브러리 미사용 컴포넌트 없음 (모두 마스터 인스턴스 사용)
- [ ] 토큰 사용률 (색상·간격·폰트 변수 미바인딩 인스턴스 0건)

### 7.3 사용자 검토

- Pencil 공유 링크 또는 PNG/PDF 내보내기(`export_nodes`)
- 사용자 피드백 반영 라운드

---

## 8. 변경 동기화 정책 (.md ↔ .pen)

### 8.1 SSOT 우선순위 (디자인 라운드)

작업지시서 §5.4 의 SSOT 우선순위를 디자인 라운드에 확장 적용:

1. `erd/erd.md` (데이터 모델)
2. `spec/*.md` (기능 명세)
3. `process/*.md` (업무 흐름)
4. `screen_design/scr_*.md`, `common_layout.md`, `components.md` (화면 표현 — 텍스트 SSOT)
5. **`.pen` 파일 (시각 시안 — 5번째, 가장 하위)**

> 즉, `.pen` 과 `.md` 가 충돌하면 **항상 `.md` 가 우선**. `.pen` 을 `.md` 에 맞춰 갱신한다.

### 8.2 변경 시 절차

| 변경 출발점 | 절차 |
|---|---|
| `.md` 변경 → `.pen` 영향 | (a) `.md` 수정 → (b) 영향 받는 `.pen` 파일 식별 → (c) 라이브러리 컴포넌트 우선 갱신 → (d) 마스터 레이아웃 갱신 → (e) 화면 .pen 인스턴스 자동 반영 확인 → (f) 수동 패치 |
| `.pen` 시안 작업 중 발견된 .md 오류 | (a) .md 즉시 수정 또는 이슈 메모 → (b) .pen 작업 일시 중단 → (c) .md 수정 반영 후 재개. **단순히 .pen 만 고치고 .md 를 두면 안 됨** |
| ERD/spec/process 변경 | (a) 상위 .md 수정 → (b) `screen_design/scr_*.md` 영향 분석·수정 → (c) `.pen` 반영. .pen 을 ERD 변경에 먼저 맞추면 안 됨 |

### 8.3 .pen 단독 변경 가능 항목

- 색상값(`color-*`) — 토큰 정의 라운드 외에도 사용자 시각 피드백으로 조정 가능
- 간격·radius 의 미세 조정 — 토큰 변경이 아니라 인스턴스 override 인 경우 (단, 누적되면 토큰 갱신 권장)
- 시각적 정렬·여백 (텍스트 SSOT 에 명시 안 된 디테일)

### 8.4 동기화 검증 체크리스트 (라운드 종료 시)

- [ ] `scr_*.md` 의 8개 필수 섹션 변경 없음 (있다면 .pen 반영)
- [ ] `components.md` 의 컴포넌트 ID·상태 목록과 `.pen` 라이브러리 컴포넌트 1:1 매핑
- [ ] `common_layout.md` 의 슬롯·브레이크포인트·z-index 와 `.pen` 마스터 레이아웃 일치
- [ ] 이슈 메모 섹션의 보류·임시 처리 항목이 .pen 에 시각적 marker(주석 또는 비활성 상태)로 표시

---

## 9. 작업 분량 추정 (별도 라운드 계획용)

| Step | 산출물 | 추정 |
|---|---|---|
| C-1 | 토큰 정의 (`set_variables`) | 0.5인일 |
| C-2 | 컴포넌트 라이브러리 ~50개 | 3~5인일 (상태 변형 포함) |
| C-3 | 마스터 레이아웃 3종 (데스크톱·태블릿·모바일) + `SL-AUTH` | 1~2인일 |
| C-4 | 14개 화면 .pen (각 데스크톱+모바일+상태 변형 포함) | 7~10인일 |
| C-5 | 검토·수정 반영 | 2~3인일 |
| **합계** | | **13~20인일** |

> Pencil 측 자동화(컴포넌트 변형 자동 생성, `batch_design` 효율) 정도에 따라 큰 폭 변동.

---

## 10. 본 라운드에서 진행하지 않는 항목

작업지시서 §1.3 비포함 + §2.3 명시:

- **실제 `.pen` 파일 생성** (본 라운드는 절차서만)
- **색상 토큰 확정** (사용자 결정 필요)
- **Pencil 도구 호출** (`get_editor_state`, `set_variables`, `batch_design` 등 모두 별도 라운드)
- **디자인 시스템(Material, Ant 등) 채택 결정**
- **프론트엔드 코드 출력** (별도 개발 라운드)

---

## 11. 별도 라운드 진입 체크리스트

별도 라운드를 시작하기 전 확인:

- [ ] `screen_design/scr_*.md` 14건 모두 ✅ (Gate B→C 통과 — 본 라운드에서 통과 확인됨)
- [ ] 본 폴더의 이슈 메모 섹션 처리 방향 결정 (특히 `notification_logs.read_at`, `mentions.display_name`, spec/proc 측 컬럼명 정정 등 — 별도 ERD/spec 갱신 라운드 우선 권장)
- [ ] 색상 토큰 9종 확정 (사용자 협의)
- [ ] Pencil 작업 디렉토리 결정 (`docs/design/pencil/` 권장)
- [ ] 통합 파일 vs 화면별 파일 분리 방침 결정 (14개 별도 .pen vs 1개 .pen 14페이지)

---

## 검증

- 자체 검증 일자: 2026-05-14
- 자체 검증 결과: ✅ 통과
- 자동 검증 결과: ✅ 통과 (§2~§7 작업지시서 §2.3 의 7개 항목 — Pencil MCP 초기 세팅, 컴포넌트 라이브러리, 공통 레이아웃 마스터, 화면별 .pen 14개, 변수·토큰, 검토 흐름, 변경 동기화 정책 — 모두 포함)
- 보류·예외 사항: 색상 토큰 9종 값은 사용자 결정 필요 (의도적 보류)
- 검증자: claude (Step C 절차서)
