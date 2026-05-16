# 화면설계서 작성 작업지시서

- 문서 버전: 0.1
- 작성일: 2026-05-14
- 범위: 임원 일정 관리 시스템 (Phase 1 ~ Phase 3)
- 산출 위치: `docs/outputs/screen_design/`

---

## 1. 개요

### 1.1 목적
`spec/` 폴더의 14개 화면 명세에 더해, 실제 구현 단계에서 활용 가능한 **화면설계서**(공통 레이아웃 + 와이어프레임 + 컴포넌트 상호작용 + ERD 데이터 바인딩)를 작성한다. 디자인 시안은 마지막 단계에서 Pencil(.pen)로 별도 진행한다.

### 1.2 산출물 범위
- 공통 레이아웃 정의 1건
- 컴포넌트 인벤토리 1건
- 화면별 와이어프레임 14건 (`spec/` 14개와 1:1)
- Pencil 디자인 시안 절차서 1건 (실제 .pen 작업은 별도 라운드)

### 1.3 비포함 (Out of Scope)
- 픽셀 단위 디자인 (Step C에서 Pencil로 별도)
- 프론트엔드 코드
- 다국어 카피라이팅

---

## 2. 진행 단계

```
Step A: 공통 레이아웃 + 컴포넌트 인벤토리 (선행, 1회)
   │
   └─→ Step B: 14개 화면 와이어프레임 (병렬 가능)
          │
          └─→ Step C: Pencil(.pen) 디자인 시안 (마지막, 별도 라운드)
```

### 2.1 Step A — 공통 레이아웃 + 컴포넌트 인벤토리

**산출물**:
| 파일 | 내용 |
|---|---|
| `screen_design/common_layout.md` | 헤더/사이드바/메인/푸터 영역, 그리드, 반응형 브레이크포인트, 권한별 UI 차이 |
| `screen_design/components.md` | 버튼·입력·셀렉트·달력·모달·드롭다운·토스트·테이블·페이지네이션 등 공통 컴포넌트 인벤토리. 각 컴포넌트의 상태(default/hover/active/focus/disabled/error)·이벤트·접근성 |

**정의 항목**:
- **레이아웃**: 데스크톱(1280+) / 태블릿(768~1279) / 모바일(<768) 3종 브레이크포인트
- **GNB**: 로고, 메뉴, 검색(Phase 2 보류), 알림 벨, 프로필 드롭다운
- **사이드바**: 임원 필터, 일정 카테고리, 빠른 액션
- **푸터**: 버전, 도움말, 단축키 안내
- **컴포넌트 명세 양식**: 용도 → 상태 → 이벤트 → 접근성(role, aria, 키보드) → 사용 화면

### 2.2 Step B — 14개 화면 와이어프레임

**산출 파일 매핑**:
| spec 파일 | screen_design 산출 파일 |
|---|---|
| `spec/00_overview.md` | `screen_design/scr_00_overview.md` (전체 화면 인덱스) |
| `spec/01_auth.md` | `screen_design/scr_01_auth.md` |
| `spec/02_permission.md` | `screen_design/scr_02_permission.md` |
| `spec/03_schedule.md` | `screen_design/scr_03_schedule.md` |
| `spec/04_mention_contact.md` | `screen_design/scr_04_mention_contact.md` |
| `spec/05_calendar_view.md` | `screen_design/scr_05_calendar_view.md` |
| `spec/06_list_view.md` | `screen_design/scr_06_list_view.md` |
| `spec/07_common_schedule.md` | `screen_design/scr_07_common_schedule.md` |
| `spec/08_holiday.md` | `screen_design/scr_08_holiday.md` |
| `spec/09_meeting_radar.md` | `screen_design/scr_09_meeting_radar.md` |
| `spec/10_relationship_history.md` | `screen_design/scr_10_relationship_history.md` |
| `spec/11_notification.md` | `screen_design/scr_11_notification.md` |
| `spec/12_audit_log.md` | `screen_design/scr_12_audit_log.md` |
| `spec/13_export_responsive.md` | `screen_design/scr_13_export_responsive.md` |

**파일별 필수 섹션** (양식 표준):
1. 개요 — 화면 ID, 관련 IA 화면(SCR-*), 관련 spec/process/ERD
2. 레이아웃 구조 — 어떤 공통 레이아웃 슬롯 사용 (common_layout 참조)
3. 와이어프레임 — 데스크톱 + 모바일 ASCII/mermaid 도면
4. 컴포넌트 사용 표 — components.md 참조 ID + 본 화면 적용 사양
5. 상호작용 명세 — 이벤트 → 동작 → 상태 변경 → API 호출
6. 데이터 바인딩 표 — UI 필드 ↔ ERD 테이블·컬럼 (`users.name`, `schedules.start_at` 등) 1:1 매핑
7. 화면 상태 — 빈/로딩/에러/성공/권한 거부
8. 권한·접근성 — 역할별 노출 차이, 키보드/스크린리더 동작

**병렬 처리 방식**:
- 14개 화면을 5~7개 묶음으로 분할하여 서브에이전트 병렬 진행 가능 (`spec/` 폴더 작업과 동일한 방식)
- 단 Step A 산출물(`common_layout.md`, `components.md`)이 먼저 완성되어 있어야 일관성 확보

### 2.3 Step C — Pencil(.pen) 디자인 시안 절차

**실제 .pen 작업은 본 라운드에서 진행하지 않고, 절차서만 작성**:

산출 파일: `screen_design/99_pencil_procedure.md`

내용:
1. Pencil MCP 초기 세팅 (`get_editor_state`, `open_document`)
2. 컴포넌트 라이브러리(.pen) 우선 생성 — components.md 기반
3. 공통 레이아웃 마스터(.pen) 생성 — common_layout.md 기반
4. 화면별 .pen 14개 생성 — 각 scr_XX_*.md 의 와이어를 기반으로
5. 변수·토큰 정의 (`get_variables`, `set_variables`) — 색상·간격·폰트
6. 검토 흐름 — `get_screenshot`, `snapshot_layout`로 리뷰
7. 변경 동기화 정책 — .md ↔ .pen 변경 시 어떤 문서가 SSOT 인가

---

## 3. 양식 표준

### 3.1 공통 헤더 (모든 scr_XX_*.md 상단)

```markdown
# [화면명] 화면설계서

- 화면 ID: SCR-XXX (ia/screen_list.md 기준)
- 관련 spec: [spec/XX_name.md](../spec/XX_name.md)
- 관련 process: [process/proc_XX_name.md](../process/proc_XX_name.md)
- 관련 ERD: users, schedules, ...
- Phase: 1 / 2 / 3
- 최종 갱신: YYYY-MM-DD
```

### 3.2 와이어프레임 표기 규칙

- 데스크톱: ASCII 박스 다이어그램
- 모바일: 단일 컬럼 ASCII (320px 기준)
- 컴포넌트 영역: `[BTN: 저장]`, `[INPUT: 제목]`, `[SELECT: 카테고리]` 등 대괄호 표기
- 반복 영역: `... (N건)` 으로 축약 표기
- 상태별 화면: 빈/로딩/에러 각각 별도 와이어 (간략화 OK)

### 3.3 데이터 바인딩 표 양식

| UI 필드 | 표시 형식 | 데이터 소스 | 비고 |
|---|---|---|---|
| 임원 이름 | 텍스트 | `users.name` | NULL 시 "이름 없음" |
| 일정 시작 | YYYY-MM-DD HH:mm | `schedules.start_at` | TZ 적용 |
| 참가자 수 | 숫자 | `COUNT(schedule_participants)` | 0 시 "참가자 없음" |

### 3.4 상호작용 표 양식

| 트리거 | 컴포넌트 | 이벤트 | 다음 상태/액션 | API |
|---|---|---|---|---|
| 클릭 | `[BTN: 저장]` | onClick | 유효성 검증 → 저장 API → 토스트 표시 | `POST /api/schedules` |

---

## 4. 진행 현황 체크리스트

| 단계 | 산출물 | 상태 | 담당 | 완료일 |
|---|---|:-:|---|---|
| A-1 | `common_layout.md` | ✅ | claude | 2026-05-14 |
| A-2 | `components.md` | ✅ | claude | 2026-05-14 |
| B-00 | `scr_00_overview.md` | ✅ | claude (그룹 1) | 2026-05-14 |
| B-01 | `scr_01_auth.md` | ✅ | claude (그룹 1) | 2026-05-14 |
| B-02 | `scr_02_permission.md` | ✅ | claude (그룹 1) | 2026-05-14 |
| B-03 | `scr_03_schedule.md` | ✅ | claude (그룹 2) | 2026-05-14 |
| B-04 | `scr_04_mention_contact.md` | ✅ | claude (그룹 3) | 2026-05-14 |
| B-05 | `scr_05_calendar_view.md` | ✅ | claude (그룹 2) | 2026-05-14 |
| B-06 | `scr_06_list_view.md` | ✅ | claude (그룹 2) | 2026-05-14 |
| B-07 | `scr_07_common_schedule.md` | ✅ | claude (그룹 2) | 2026-05-14 |
| B-08 | `scr_08_holiday.md` | ✅ | claude (그룹 3) | 2026-05-14 |
| B-09 | `scr_09_meeting_radar.md` | ✅ | claude (그룹 3) | 2026-05-14 |
| B-10 | `scr_10_relationship_history.md` | ✅ | claude (그룹 3) | 2026-05-14 |
| B-11 | `scr_11_notification.md` | ✅ | claude (그룹 1) | 2026-05-14 |
| B-12 | `scr_12_audit_log.md` | ✅ | claude (그룹 1) | 2026-05-14 |
| B-13 | `scr_13_export_responsive.md` | ✅ | claude (그룹 2) | 2026-05-14 |
| C | `99_pencil_procedure.md` | ✅ | claude | 2026-05-14 |

상태 범례: ⬜ 미착수 · 🟨 진행 중 · ✅ 완료 · ⏸ 보류

---

## 5. 의존성 및 참조 문서

### 5.1 필수 참조 (모든 화면 작업 공통)

| 문서 | 용도 | 접근 |
|---|---|:-:|
| `requirement/requirement.md` | 기능 ID(REQ-*), NFR, 용어집, 트레이서빌리티 매트릭스 | 읽기 전용 |
| `ia/screen_list.md` | 25개 IA 화면 정의 (SCR-* 식별자) | 읽기 전용 |
| `ia/ia.md` | 사이트맵, 메뉴 트리, 권한 매트릭스, URL 정책 | 읽기 전용 |
| `erd/index.md` | 10개 테이블 도메인 분류, 조회 패턴, 명명 규칙 | 읽기 전용 |
| `erd/erd.md` | 테이블 컬럼·타입·제약 (데이터 바인딩 SSOT) | 읽기 전용 |
| `erd/seed.md` | 초기/샘플 데이터 (와이어 더미값 참고용) | 읽기 전용 |
| `00_cross_ref.md` | 4-way 매핑 (IA ↔ Spec ↔ Process ↔ ERD) | 읽기 전용 |

### 5.2 화면별 참조 매트릭스

각 `scr_XX_*.md` 작성 시 아래 매핑을 따라 정확한 spec/process/ERD 섹션을 참조한다. ERD 테이블은 `00_cross_ref.md §5 Spec↔ERD` 와 `§6 ERD 역참조` 도 함께 본다.

| 산출 파일 | 참조 spec | 참조 process | 주요 ERD 테이블 |
|---|---|---|---|
| `scr_00_overview.md` | `spec/00_overview.md` | `process/proc_00_index.md` | (인덱스) |
| `scr_01_auth.md` | `spec/01_auth.md` | `process/proc_01_auth.md` | `users` |
| `scr_02_permission.md` | `spec/02_permission.md` | `process/proc_02_permission.md` | `users`, `proxy_permissions` |
| `scr_03_schedule.md` | `spec/03_schedule.md` | `process/proc_03_schedule.md` | `schedules`, `schedule_participants` |
| `scr_04_mention_contact.md` | `spec/04_mention_contact.md` | `process/proc_04_mention_contact.md` | `contacts`, `companies`, `mentions` |
| `scr_05_calendar_view.md` | `spec/05_calendar_view.md` | `process/proc_03_schedule.md` | `schedules`, `schedule_participants`, `users`, `holidays` |
| `scr_06_list_view.md` | `spec/06_list_view.md` | `process/proc_03_schedule.md` | `schedules`, `schedule_participants`, `users` |
| `scr_07_common_schedule.md` | `spec/07_common_schedule.md` | `process/proc_03_schedule.md` | `schedules`, `schedule_participants` |
| `scr_08_holiday.md` | `spec/08_holiday.md` | `process/proc_08_holiday.md` | `holidays` |
| `scr_09_meeting_radar.md` | `spec/09_meeting_radar.md` | `process/proc_06_meeting_radar.md` | `schedules`, `schedule_participants`, `mentions` |
| `scr_10_relationship_history.md` | `spec/10_relationship_history.md` | `process/proc_07_relationship_history.md` | `schedules`, `mentions`, `contacts` |
| `scr_11_notification.md` | `spec/11_notification.md` | `process/proc_05_notification.md` | `notification_logs`, `users` |
| `scr_12_audit_log.md` | `spec/12_audit_log.md` | `process/proc_09_audit_log.md` | `audit_logs`, `users` |
| `scr_13_export_responsive.md` | `spec/13_export_responsive.md` | `process/proc_10_export.md` | `schedules`, `users` |

### 5.3 접근 정책 (읽기 vs 수정)

| 폴더 | 정책 | 비고 |
|---|---|---|
| `requirement/` | 🔒 읽기 전용 | NFR 변경은 사용자 결정 필요 |
| `ia/` | 🔒 읽기 전용 | 화면 추가/제거 시 SCR-* 신규 등록 별도 절차 |
| `spec/` | 🔒 읽기 전용 (원칙) | 와이어 작업 중 spec 오류 발견 시 즉시 수정 금지, `screen_design/` 내 이슈 메모로 기록 후 일괄 처리 |
| `process/` | 🔒 읽기 전용 | 동일 |
| `erd/` | 🔒 읽기 전용 | 컬럼 추가 필요 시 별도 라운드 |
| `screen_design/` | ✏️ 쓰기 | 본 작업의 산출물 폴더 |
| `00_cross_ref.md` | ✏️ 쓰기 (제한) | 신규 SCR-* 추가 또는 매핑 변경 시에만 갱신 |

### 5.4 SSOT 우선순위 (충돌 시)

1. `erd/erd.md` (데이터 모델)
2. `spec/*.md` (기능 명세)
3. `process/*.md` (업무 흐름)
4. `screen_design/*.md` (화면 표현)

상위 SSOT 와 하위 산출물이 다르면 **하위를 상위에 맞춘다**. 상위 SSOT 자체가 틀린 것 같다면 위 §5.3 정책대로 이슈 메모만 남기고 별도 라운드에서 처리.

### 5.5 비포함 참조 (Out of Scope)

- 외부 디자인 시스템 (Material, Ant 등) — Step C(.pen)에서 결정
- 접근성 표준 본문 (WCAG 원문) — 기본 ARIA 패턴만 적용, 정합 검증은 별도 라운드
- 다국어/카피 가이드 — 한국어 기본, 영문은 미고려

---

## 6. 작업 규칙

- 각 화면 .md 작성 시 `00_cross_ref.md` 의 매핑을 확인하고 어긋남이 있으면 즉시 반영하거나 별도 이슈로 기록
- ERD 컬럼명·타입은 `erd/erd.md` 표기 그대로 사용 (자체 추측 금지)
- 컴포넌트는 가능한 한 `components.md` 의 정의된 것을 재사용. 신규 정의 시 `components.md` 에 먼저 추가하고 사용
- 와이어프레임은 ASCII로 충분. mermaid는 흐름 다이어그램에만
- Step C(.pen) 작업 전까지는 디자인 시안에 시간을 쓰지 않는다

---

## 7. 검증 절차

### 7.1 자체 검증 체크리스트 (산출물 작성 직후)

**A-1 `common_layout.md`**
- [ ] 3종 브레이크포인트(데스크톱 1280+ / 태블릿 768~1279 / 모바일 <768) 정의
- [ ] 헤더/사이드바/메인/푸터 4개 슬롯 명시
- [ ] 권한별 UI 차이 (`ia/ia.md` 권한 매트릭스와 일치)
- [ ] GNB 알림 벨, 프로필 드롭다운 등 공통 위젯 위치 확정
- [ ] 통합 검색은 "Phase 2 보류" 명시

**A-2 `components.md`**
- [ ] 컴포넌트 카테고리(입력/액션/표시/구조/피드백) 분류 명확
- [ ] 각 컴포넌트의 상태(default/hover/focus/active/disabled/error/loading) 정의
- [ ] 이벤트 명세(onClick, onChange, onBlur 등) 명시
- [ ] 접근성(role, aria-*, 키보드 단축키) 정의
- [ ] **사용 화면** 컬럼 채워짐 (역추적 가능)

**B-XX `scr_XX_*.md` (각 화면)**
- [ ] 8개 필수 섹션 헤더 모두 존재 (개요/레이아웃/와이어/컴포넌트/상호작용/데이터바인딩/상태/권한)
- [ ] 헤더에 SCR-* 식별자, 관련 spec/process/ERD, Phase 표기
- [ ] 데이터 바인딩 표의 모든 `테이블.컬럼` 이 `erd/erd.md` 에 실재
- [ ] 사용한 모든 컴포넌트가 `components.md` 에 정의됨 (또는 사전에 신규 추가)
- [ ] 상호작용 표의 모든 API 가 `spec/*.md` 또는 `process/*.md` 에 정의됨
- [ ] 상태 4종(빈/로딩/에러/성공) 모두 와이어 또는 본문에 정의
- [ ] 권한별 노출 차이 명시 (해당 화면에 권한 분기 있을 시)

### 7.2 자동 검증 (grep 기반)

각 `scr_XX_*.md` 작성 후 다음을 실행:

| 검증 항목 | 방법 | 통과 기준 |
|---|---|---|
| ERD 컬럼명 정확성 | 데이터 바인딩 표에서 `[a-z_]+\.[a-z_]+` 추출 → `erd/erd.md` 와 대조 | 100% 일치 |
| SCR-* 실재 | 헤더의 `SCR-*` → `ia/screen_list.md` 에 존재 | 100% 일치 |
| 컴포넌트 ID 정합 | 본문의 `[BTN: ...]`, `[INPUT: ...]` 등 컴포넌트 표기 → `components.md` 정의 ID 와 대조 | 100% 일치 또는 사전 등록 |
| 필수 섹션 누락 | 8개 헤더 정규식으로 grep | 모두 존재 |
| 양식 표기 일관성 | `[BTN:`, `[INPUT:` 등 대괄호 표기 규칙 준수 | 위반 0건 |

검증 스크립트화는 별도 라운드. 현재는 수동/에이전트 검증.

### 7.3 단계별 검증 게이트

| 게이트 | 시점 | 검증 내용 | 통과 기준 |
|---|---|---|---|
| **Gate A→B** | Step A 두 파일 완성 후 | §7.1 A-1, A-2 체크리스트 | 모든 항목 ✅, 게이트 통과 전 B 진입 금지 |
| **Gate B-each** | 각 화면 .md 완성 직후 | §7.1 B-XX + §7.2 자동 검증 | 통과 시 §4 체크리스트 ✅ 갱신 |
| **Gate B→C** | Step B 14개 완료 후 | 14개 일관성: 컴포넌트 사용 분포가 `components.md` 와 일치, 양식 표준 100% 준수, cross-ref 매핑 정확 | 통과 시 Pencil 작업 진입 가능 |

각 게이트에서 미통과 항목이 있으면 **다음 단계 진입을 막고** 우선 보완. 의도적 보류는 §7.4 에 명시.

### 7.4 검증 결과 기록

각 산출물 하단에 다음 섹션 추가:

```markdown
## 검증

- 자체 검증 일자: YYYY-MM-DD
- 자체 검증 결과: ✅ 통과 / ⚠️ 일부 통과 / ❌ 미통과
- 자동 검증 결과: ✅ 통과 / 발견 이슈 (목록)
- 보류·예외 사항: (의도적으로 미통과 처리한 항목과 사유)
- 검증자: 에이전트명 / 사용자
```

게이트 통과 시 본 작업지시서 §4 진행 현황 체크리스트의 해당 행을 ✅로 갱신하고, Gate B→C 통과 시 §8 변경 이력에 "Step B 완료 (YYYY-MM-DD)" 한 줄 추가.

### 7.5 검증 책임자

- **작성자 자체 검증**: 산출물 작성한 에이전트/사람이 §7.1, §7.2 1차 수행
- **교차 검증**: 다른 서브에이전트 또는 사용자가 무작위 샘플 3건 재검증 (Step B 완료 시점)
- **사용자 최종 확인**: Gate B→C 통과 후 사용자 검토

---

## 8. 변경 이력

| 버전 | 일자 | 변경 내용 | 변경자 |
|---|---|---|---|
| 0.1 | 2026-05-14 | 최초 작성 | — |
| 0.2 | 2026-05-14 | §5 참조 문서 매트릭스·접근 정책 확장, §7 검증 절차 신설 | — |
| 0.3 | 2026-05-14 | Step A 완료 (common_layout.md, components.md), Gate A→B 통과 | claude |
| 0.4 | 2026-05-14 | Step B 완료 (scr_00 ~ scr_13 14건), 서브에이전트 3그룹 병렬, Gate B→C 통과 (⚠️ 일부 통과 5건 — spec/process vs ERD 컬럼명 불일치, 모두 이슈 메모 기록·ERD 채택) | claude |
| 0.5 | 2026-05-14 | Step C 절차서 완료 (99_pencil_procedure.md). 실제 .pen 작업은 별도 라운드 | claude |
| 0.6 | 2026-05-14 | spec/process 정합 정리 라운드 완료 — 9개 파일에 약 60건 컬럼명·enum 정정. SSOT(ERD > spec > process) 적용. 00_cross_ref.md §9 기록 | claude |
| 0.7 | 2026-05-14 | ERD 보강 라운드: `notification_logs.read_at` 컬럼 신설(`erd.md` v1.1). scr_00·scr_11 이슈 메모 RESOLVED | claude |
| 0.8 | 2026-05-14 | 결정 라운드 — 공통 일정 등록 권한: 모든 인증 사용자(user/admin) 채택. 5개 SSOT(spec/00·spec/02·spec/07·common_layout·ia) + 4개 화면 .md 갱신. scr_07 이슈 메모 RESOLVED | claude |
| 0.9 | 2026-05-14 | 결정 라운드 — EXP-001: 클라이언트 생성 + 13컬럼 + 날짜 범위 선택(1년 상한). proc_10 본문 재작성. scr_13 이슈 메모 RESOLVED | claude |
