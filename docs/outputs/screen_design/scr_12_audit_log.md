# 일정 이력 모달 화면설계서

- 화면 ID: SCR-MODAL-AUDIT-LOG
- 관련 spec: [spec/12_audit_log.md](../spec/12_audit_log.md)
- 관련 process: [process/proc_09_audit_log.md](../process/proc_09_audit_log.md)
- 관련 ERD: `audit_logs`, `users`, `schedules`
- Phase: 3
- 최종 갱신: 2026-05-14

---

## 1. 개요

| 항목 | 내용 |
|---|---|
| 화면명 | 일정 이력 모달 (Audit Log Modal) |
| 형태 | 모달 (`SL-OVERLAY`) — 모바일은 전체 화면 모달 |
| 진입 경로 | `SCR-MODAL-SCHEDULE-DETAIL` 의 "이력" 탭 클릭 또는 ⋮ 메뉴 "변경 이력 보기" |
| 핵심 기능 | AUD-004 이력 조회 UI — 특정 일정의 등록·수정·삭제 이력을 시간순(오름차순) 타임라인으로 표시 |
| 데이터 | `audit_logs` `WHERE target_type='schedule' AND target_id=:schedule_id` |

> 본 화면은 `SCR-MODAL-SCHEDULE-DETAIL` 의 하위 탭/모달이지만, `ia/screen_list.md` 에서 별도 SCR-* 로 식별되어 있다. 본 문서는 모달 단독 사양만 정의한다.

---

## 2. 레이아웃 구조

| 슬롯 | 사용 |
|---|---|
| `SL-OVERLAY` (Modal) | 부모 화면 위 z-index 20 + `[BACKDROP]` |
| `SL-MAIN` 외 | 부모 화면 유지 |

모달 크기:
- `BP-DESKTOP`: max-width 720px, max-height 80vh
- `BP-MOBILE`: 전체 화면 모달 (RES-001)

---

## 3. 와이어프레임

### 3.1 데스크톱

```
┌─ SL-OVERLAY ─────────────────────────────────────────────────────┐
│                            [BACKDROP]                            │
│              ┌─ [MODAL: 일정 이력] ────────────┐                 │
│              │ 일정 이력                  [×]  │                 │
│              ├──────────────────────────────────┤                │
│              │ [TABS: 본문 | 이력◉]            │                 │
│              ├──────────────────────────────────┤                │
│              │ [SELECT: 행위 ▾]  [SELECT: 행위자│                 │
│              │ ▾]  [DATE-RANGE: 기간]           │                 │
│              ├──────────────────────────────────┤                │
│              │ [TIMELINE: 이력 항목]            │                 │
│              │                                  │                 │
│              │ ┌─ 2026-05-11 09:00 ─────────┐  │                 │
│              │ │ ✅ [BADGE: 등록]           │  │                 │
│              │ │ 홍길동 전무 (직접 입력)    │  │                 │
│              │ │ 제목: 삼성전자 미팅        │  │                 │
│              │ │ 일시: 05/11 14:00~15:00    │  │                 │
│              │ │ 장소: 본사 회의실 A         │  │                 │
│              │ └────────────────────────────┘  │                 │
│              │                                  │                 │
│              │ ┌─ 2026-05-11 10:30 ─────────┐  │                 │
│              │ │ ✏️ [BADGE: 수정]            │  │                 │
│              │ │ 홍길동 전무 명의            │  │                 │
│              │ │ (입력: 김비서 — 대리 입력) │  │                 │
│              │ │ 변경 항목: 장소             │  │                 │
│              │ │ [BTN-LINK: ▼ 펼치기]       │  │                 │
│              │ │   ┌──────┬──────┬──────┐  │  │                 │
│              │ │   │필드  │이전  │이후  │  │  │                 │
│              │ │   │장소  │회의실│회의실│  │  │                 │
│              │ │   │      │A     │B     │  │  │                 │
│              │ │   └──────┴──────┴──────┘  │  │                 │
│              │ └────────────────────────────┘  │                 │
│              │ ... (N건)                       │                 │
│              ├──────────────────────────────────┤                 │
│              │ [PAGINATION] (이력 30건 이상)   │                 │
│              ├──────────────────────────────────┤                 │
│              │              [BTN: 닫기]         │                 │
│              └──────────────────────────────────┘                 │
└──────────────────────────────────────────────────────────────────┘
```

### 3.2 모바일 (320px, 전체 화면 모달)

```
┌──────────────────────┐
│ ◀ 일정 이력      [×]│
├──────────────────────┤
│ [TABS: 본문|이력◉]   │
├──────────────────────┤
│ [SELECT: 행위 ▾]     │
│ [SELECT: 행위자 ▾]   │
│ [DATE-RANGE: 기간]   │
├──────────────────────┤
│ 2026-05-11 09:00     │
│ ✅ [BADGE: 등록]     │
│ 홍길동 전무 직접 입력│
│ ─                    │
│ 2026-05-11 10:30     │
│ ✏️ [BADGE: 수정]      │
│ 홍길동 전무 명의     │
│ (대리: 김비서)        │
│ 변경: 장소           │
│ [BTN-LINK: ▼ 상세]   │
│ ─                    │
│ ... (N건)            │
├──────────────────────┤
│ [PAGINATION]         │
└──────────────────────┘
```

---

## 4. 컴포넌트 사용 표

| 컴포넌트 | 위치 | 적용 사양 |
|---|---|---|
| `[MODAL: 일정 이력]` | 오버레이 | `role="dialog"`, `aria-modal="true"`, 포커스 트랩, `Esc` 닫기 |
| `[TABS: 본문 / 이력]` | 모달 본문 상단 | 본문(`SCR-MODAL-SCHEDULE-DETAIL`) 과 이력(본 화면) 전환. 본 화면은 "이력" 활성 |
| `[SELECT: 행위]` | 도구바 필터 | 전체 / 등록(created) / 수정(updated) / 삭제(deleted) |
| `[SELECT: 행위자]` | 도구바 필터 | 일정에 관여한 사용자 목록 (자동 채움) |
| `[DATE-RANGE: 기간]` | 도구바 필터 | created_at 기준 |
| `[TIMELINE: 이력 항목]` | 모달 본문 | **신규 추가 컴포넌트** (components.md §4.11 참조). 각 항목 = 시각 + 아이콘 + 행위자 + 변경 요약 + 상세 토글 |
| `[BADGE: 행위]` | 항목 좌측 | created(녹색) / updated(파랑) / deleted(빨강) |
| `[BTN-LINK: ▼ 펼치기]` | 항목 푸터 | 변경 상세 토글. updated 항목만 노출 |
| `[TABLE: 필드, 이전, 이후]` | 변경 상세 펼침 영역 | 3컬럼. 모바일은 행 단위 카드 |
| `[PAGINATION]` | 모달 하단 (이력 30건 이상 시) | loadmore 또는 페이지 번호 |
| `[BTN: 닫기]` | 모달 푸터 | secondary |
| `[BTN-ICON: ×]` | 모달 우상단 | `aria-label="닫기"` |
| `[EMPTY: 이력이 없습니다]` | 0건 | AUD-004 예외 처리 "이력 0건" |
| `[ALERT: 변경 내용 없음]` | updated 이고 `changed_fields=[]` | AUD-002 대안 플로우 "동일 값으로 재저장" |

> `[TIMELINE]` 은 components.md §4.11 에 신규 정의됨 (본 라운드에서 추가).

---

## 5. 상호작용 명세

| 트리거 | 컴포넌트 | 이벤트 | 다음 상태/액션 | API |
|---|---|---|---|---|
| 진입 (탭 클릭) | `[TABS]` "이력" | onChange | 이력 로드 | `GET /api/audit-logs?target_type=schedule&target_id=:id&page=` (PROC-AUD-004) |
| 선택 | `[SELECT: 행위]` | onChange | 필터 갱신 | `GET /api/audit-logs?...&action=created\|updated\|deleted` |
| 선택 | `[SELECT: 행위자]` | onChange | 필터 갱신 | `...&actor_id=...` |
| 선택 | `[DATE-RANGE]` | onChange | 필터 갱신 | `...&from=&to=` |
| 클릭 | 항목 `[BTN-LINK: 펼치기]` | onClick | 변경 상세 영역 표시 (`before_data` vs `after_data` 비교 테이블) | (이미 로드된 데이터 사용, 추가 API 불필요) |
| 클릭 | `[BTN: 닫기]` 또는 `[×]` 또는 `Esc` | onClick / keyDown | 모달 닫기 → 부모 화면 복귀 | — |
| 외부 클릭 | `[BACKDROP]` | onClick | 모달 닫기 (작성 중 아님이므로 즉시) | — |

---

## 6. 데이터 바인딩 표

| UI 필드 | 표시 형식 | 데이터 소스 | 비고 |
|---|---|---|---|
| 타임라인 항목 시각 | YYYY-MM-DD HH:mm | `audit_logs.created_at` | KST. 오름차순 정렬 (AUD-004 처리 흐름 2) |
| 행위 아이콘 + 라벨 | 아이콘 + `[BADGE]` | `audit_logs.action` | `created`→✅등록 / `updated`→✏️수정 / `deleted`→🗑삭제 |
| 행위자 이름 | 텍스트 | `audit_logs.actor_name_snapshot` (스냅샷) | `actor_id` FK 도 보유. 이름 변경 대비 스냅샷 사용 |
| 대리 입력 여부 | 라벨 | `audit_logs.on_behalf_of_id IS NOT NULL` | NOT NULL 이면 "대리 입력" 표기 |
| 명의 임원 이름 | 텍스트 | `audit_logs.on_behalf_of_name_snapshot` | 대리 입력 시만 표시 |
| 표시 형식 | 합성 | "{actor_name} 직접 입력" / "{on_behalf_of_name} 명의 (입력: {actor_name})" | AUD-003 이력 표시 예시 |
| 변경 항목 요약 | 라벨 배열 | `audit_logs.changed_fields` (text[]) | `updated` 시만. 한글 매핑(예: `title`→"제목", `start_time`→"시작 시각") |
| 변경 전 값 | 객체 | `audit_logs.before_data` (jsonb) | `created` 시 NULL |
| 변경 후 값 | 객체 | `audit_logs.after_data` (jsonb) | `deleted` 시 NULL |
| IP 주소 (선택) | 텍스트 | `audit_logs.ip_address` | 관리자 권한 시만 노출 (선택) |
| 권한 분기 — 행위자 자기 일정 | (서버) | `schedules.owner_id = :me OR schedules.on_behalf_of_id = :me` | spec 12 AUD-004 접근 권한: 임원은 본인 명의 일정 이력만 |
| 권한 분기 — admin | (서버) | `users.role = 'admin'` | 전체 일정 이력 조회 가능 |
| 행위자 정보 (확장) | JOIN | `users.name` (FK: `audit_logs.actor_id`) | 스냅샷과 비교용 (이름 변경 시 현재 이름 추가 표시 선택) |

> 모든 컬럼은 `erd/erd.md` E10 (`audit_logs`), E01 (`users`), E04 (`schedules`) 에 실재.

---

## 7. 화면 상태

| 상태 | 표현 |
|---|---|
| 빈 | `[EMPTY: 이력이 없습니다]` (AUD-004 예외 처리) |
| 로딩 | `[SKELETON]` 5행 (모달 본문) |
| 에러 | `[ALERT: 이력을 불러오지 못했습니다]` + `[BTN-LINK: 다시 시도]` |
| 성공 | 타임라인 정상 렌더 |
| 권한 거부 | `user` 가 타인 명의 일정의 이력 모달 진입 시 모달 자체 열리지 않음 (부모 화면에서 차단) 또는 모달 본문에 `[ALERT: 접근 권한이 없습니다]` (AUD-004 예외) |
| 특수 — 변경 내용 없음 | `updated` 이고 `changed_fields=[]` 인 항목은 항목 본문에 `[ALERT: 변경 내용 없음 (동일 값으로 재저장)]` (AUD-004 처리) |

---

## 8. 권한·접근성

### 8.1 역할별 접근

| 역할 | 조회 범위 |
|---|---|
| `user` | 본인 명의 일정의 이력만 (`schedules.owner_id=:me` OR `schedules.on_behalf_of_id` 가 본인) |
| `admin` | 전체 일정의 이력 |

서버에서 행 수준 접근 제어로 강제 (PERM-001 + AUD-004). UI 게이팅은 사용자 경험 목적.

### 8.2 키보드·스크린리더

- 모달 열리면 `[BTN-ICON: ×]` 에 자동 포커스
- `Esc` 닫기, `Tab` 으로 도구바 → 타임라인 항목 → `BTN: 닫기` 순환
- 포커스 트랩 적용 (`role="dialog"` + `aria-modal="true"` + `aria-labelledby="audit-log-title"`)
- 타임라인은 `role="list"` + 항목 `role="listitem"` + 시각은 `<time datetime>`
- 변경 상세 토글 버튼: `aria-expanded`, `aria-controls`
- `[BADGE: 등록/수정/삭제]` 는 색상 외 텍스트도 함께 노출 (색맹 고려)

---

## 9. 이슈 메모

| 항목 | spec/process 표기 | ERD (SSOT) | 본 화면 처리 |
|---|---|---|---|
| audit_logs 컬럼명 | spec 12: `before_values`/`after_values`/`actor_name`/`on_behalf_of_name`/`schedule_id` | ERD E10: `before_data`/`after_data`/`actor_name_snapshot`/`on_behalf_of_name_snapshot`/`target_type+target_id` | ERD 컬럼명 100% 채택. 본 화면의 일정 이력 조회는 `target_type='schedule' AND target_id=:schedule_id` 로 처리 |
| 행위 enum | spec 12: `'created'` / `'updated'` 만 명시. proc_02: `'proxy_create'` 임의 사용 | ERD: `'created'` / `'updated'` / `'deleted'` 3종 | ERD 채택. 대리 입력은 별도 action 이 아니라 `on_behalf_of_id IS NOT NULL` 로 판별 (AUD-003 판별 기준과 일치) |
| 대리 입력 판별 | spec 12 AUD-003 "실제 입력자 ≠ 일정의 명의 임원" | ERD: `on_behalf_of_id` NOT NULL 여부 | ERD 채택. 본 화면 표시 로직은 §6 데이터 바인딩 표 "대리 입력 여부" 행 참조 |
| 일정 본문 ↔ 이력 탭 구조 | spec 12 AUD-004 "일정 상세 페이지에서 변경 이력 탭" | ia/screen_list.md: `SCR-MODAL-AUDIT-LOG` 가 독립 SCR-* | 본 화면은 `SCR-MODAL-SCHEDULE-DETAIL` 의 [TABS: 본문/이력] 중 "이력" 탭에 해당. 모달 자체는 부모 모달과 별도 SCR-* 로 식별되지만 시각적으로는 동일 모달의 다른 탭 |
| 이력 조회 정렬 | spec 12 AUD-004 처리 흐름 2 "시간 오름차순" / proc_09 PROC-AUD-004 "등록 시각 오름차순 정렬" | — | 오름차순 채택 (등록 → 수정 1 → 수정 2 ... 순서로 변천사 추적) |

---

## 검증

- 자체 검증 일자: 2026-05-14
- 자체 검증 결과: ✅ 통과
- 자동 검증 결과: ✅ 통과
  - SCR-MODAL-AUDIT-LOG 헤더 명시 ✓
  - 8개 필수 섹션(개요/레이아웃/와이어/컴포넌트/상호작용/바인딩/상태/권한) ✓
  - 컴포넌트 ID 모두 `components.md` 정의 ✓ (신규 `[TIMELINE]` 은 §4.11 에 사전 추가됨)
  - 데이터 바인딩 컬럼 `erd/erd.md` E10·E01·E04 실재 ✓ (`audit_logs.target_type`, `target_id`, `action`, `actor_id`, `actor_name_snapshot`, `on_behalf_of_id`, `on_behalf_of_name_snapshot`, `before_data`, `after_data`, `changed_fields`, `ip_address`, `created_at`, `users.name`, `users.role`, `schedules.owner_id`, `schedules.on_behalf_of_id`)
  - API → spec 12 AUD-004 / proc_09 PROC-AUD-004 일치 ✓
  - 권한 분기 (user 본인 명의만, admin 전체) 명시 ✓
- 보류·예외 사항:
  - spec 12 의 구버전 컬럼명(`before_values`, `actor_name`, `schedule_id` 등) 은 §9 이슈 메모로 기록, 본 화면은 ERD SSOT 채택
  - "변경 내용 없음" 항목(`updated` + `changed_fields=[]`) 의 UI 처리 추가 (`[ALERT]`)
- 검증자: claude (Step B 그룹 1)
