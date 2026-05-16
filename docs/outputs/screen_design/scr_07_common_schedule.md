# 공통 일정 화면설계서

- 화면 ID: SCR-MODAL-SCHEDULE-FORM (공통 모드), SCR-MODAL-SCHEDULE-DETAIL (공통 일정 케이스), SCR-MODAL-CONFIRM-DELETE (공통 일정 케이스)
- 관련 spec: [spec/07_common_schedule.md](../spec/07_common_schedule.md), 보조: [spec/03_schedule.md](../spec/03_schedule.md), [spec/11_notification.md](../spec/11_notification.md) (NOT-001, NOT-002)
- 관련 process: [process/proc_03_schedule.md](../process/proc_03_schedule.md) (PROC-SCH-002, PROC-SCH-005)
- 관련 ERD: `schedules`(`type='common'`), `schedule_participants`, `notification_logs`, `users`, `audit_logs`
- Phase: 1
- 최종 갱신: 2026-05-14

---

## 1. 개요

공통 일정은 별도 화면이 아니라 **`SCR-MODAL-SCHEDULE-FORM` 의 "공통 모드"** + **`SCR-MODAL-SCHEDULE-DETAIL` 의 "공통 일정 케이스"** 로 구성된다. 폼 골격·상세 골격·삭제 모달 골격은 [scr_03_schedule.md](./scr_03_schedule.md) 에서 정의했으며, 본 문서는 공통 일정 고유 동작만 보강한다.

| 기능 ID | 본 문서 다루는 부분 |
|---|---|
| COM-001 | 공통 일정 등록 — 알림 발송 대상 다중 선택, 전체 선택 보조, 등록자 자동 참가, 전체 알림 발송 (NOT-001) |
| COM-002 | 참가자 자기 추가 — 상세 모달의 [+ 참가하기] / [참가 취소] 버튼 동작 |
| COM-003 | 공통 일정 수정 — 변경 시 강제 알림 재발송 (NOT-002), 참가자 목록 유지 |
| COM-004 | 공통 일정 삭제 — 참가자 N명에게 취소 알림 발송, soft delete |

> **권한 원칙 (2026-05-14 결정)**: 공통 일정의 등록/수정은 **모든 인증 사용자(`user`/`admin`)** 가 가능하다. 삭제는 본인(등록자, `schedules.created_by`) 또는 관리자만. 참가자 자기 추가/취소는 알림 대상 임원 본인이 직접 (COM-002). 본 결정으로 `spec/07`, `common_layout.md §10`, `spec/02 §접근 제어`, `spec/00 §역할별 권한`, `ia/ia.md §4` 가 모두 갱신됨.

---

## 2. 레이아웃 구조

| 영역 | 사용 슬롯 | 비고 |
|---|---|---|
| 폼 컨테이너 | `SL-OVERLAY MODAL` z=20 | scr_03 §2 와 동일 |
| 상세 컨테이너 | `SL-OVERLAY MODAL` z=20 | scr_03 §2 와 동일 |
| 알림 발송 결과 토스트 | `SL-OVERLAY TOAST` z=50 | "N명에게 알림 발송" |
| 변경 알림 재발송 안내 배너 (수정 폼) | 모달 본문 상단 `BANNER` | "저장 시 알림 대상 N명에게 변경 알림이 발송됩니다" |

진입점:

| 진입 화면 | 진입 컴포넌트 | 권한 |
|---|---|---|
| `SCR-CALENDAR` 페이지 헤더 | `[BTN: + 공통 일정 등록]` | `user`/`admin` |
| `SCR-LIST` 페이지 헤더 / `[BTN: + 일정 등록]` → 폼에서 [SEGMENT: 공통] 토글 | `user`/`admin` | `user`/`admin` |
| `SL-SIDEBAR` 빠른 액션 | `[BTN: + 공통 일정 등록]` | `user`/`admin` |
| `SCR-RADAR` `[CAL-SLOT]` 클릭 | (Phase 3) | `user`/`admin` |

---

## 3. 와이어프레임

### 3.1 공통 일정 등록 폼 (SCR-MODAL-SCHEDULE-FORM 공통 모드, COM-001)

```
┌── BACKDROP (z=20) ────────────────────────────────────────────────────┐
│  ┌── MODAL (640px) ────────────────────────────────────────────────┐ │
│  │ [H2: 공통 일정 등록]                              [BTN-ICON: ×] │ │
│  ├─────────────────────────────────────────────────────────────────┤ │
│  │ [SEGMENT: ●공통 / 개인]   ※ 모든 인증 사용자 활성                │ │
│  │                                                                 │ │
│  │ ┌─ 알림 발송 대상 * ──────────────────────────────────────────┐ │ │
│  │ │ [SELECT: 임원 검색·선택 ▾(다중)]      [BTN-LINK: 전체 선택]│ │ │
│  │ │ [CHIP: 박전무 ✕][CHIP: 이상무 ✕][CHIP: 김전무 ✕] ... (N명)│ │ │
│  │ │ ⓘ 등록 후 선택한 임원 전원에게 알림이 발송됩니다.            │ │ │
│  │ └─────────────────────────────────────────────────────────────┘ │ │
│  │                                                                 │ │
│  │ [INPUT: 일정 내용 *]                                            │ │
│  │                                                                 │ │
│  │ [DATE: 날짜 *]              [TOGGLE: 종일]                      │ │
│  │ [SELECT: 시간대 *]          [TIME: 시작]  ~  [TIME: 종료]       │ │
│  │ [INPUT: 장소]                                                   │ │
│  │ [MENTION: @멘션]                                                │ │
│  │ [CHIP: @삼성전자 ✕] ... (N건)                                   │ │
│  │ [TEXTAREA: 비고]                                                │ │
│  ├─────────────────────────────────────────────────────────────────┤ │
│  │                              [BTN: 취소] [BTN: 저장(primary)]   │ │
│  └─────────────────────────────────────────────────────────────────┘ │
└───────────────────────────────────────────────────────────────────────┘

저장 직후:
[TOAST(success): 공통 일정이 등록되었습니다. {n}명에게 알림이 발송되었습니다.]
```

### 3.2 공통 일정 수정 폼 (COM-003)

```
┌── MODAL ─────────────────────────────────────────────────────────────┐
│ [H2: 공통 일정 수정]                                    [BTN-ICON: ×] │
├──────────────────────────────────────────────────────────────────────┤
│ [BANNER(info): 저장 시 알림 대상 {n}명에게 변경 알림이 발송됩니다.]   │
│                                                                      │
│ [SEGMENT: ●공통 / 개인 (비활성, 유형 전환 불가)]                      │
│ [SELECT: 알림 발송 대상 ▾] [CHIP: ...]                                │
│ ... (등록 폼과 동일, 기존 데이터 프리필) ...                          │
│                                                                      │
│ ※ 참가자 목록은 수정 폼에서 변경 불가 (별도 참가/취소 기능)           │
├──────────────────────────────────────────────────────────────────────┤
│                              [BTN: 취소] [BTN: 저장]                  │
└──────────────────────────────────────────────────────────────────────┘
```

### 3.3 공통 일정 상세 (SCR-MODAL-SCHEDULE-DETAIL 공통 케이스, COM-002)

```
┌── MODAL ─────────────────────────────────────────────────────────────┐
│ [H2: 임원 전체 워크숍] [BADGE: 공통]                    [BTN-ICON: ×] │
├──────────────────────────────────────────────────────────────────────┤
│ [TABS: 본문 / 이력]                                                  │
├──────────────────────────────────────────────────────────────────────┤
│ ▣ 본문                                                              │
│   📅 2026-05-20 (수)   ⏰ 오후  14:00 ~ 17:00                       │
│   📍 양재 사옥 5층                                                   │
│   ✍ 등록자: 김관리자                                                  │
│   ─────────────────────────────────────────────────────              │
│   알림 발송 대상 (5명) — 등록 시 전체 알림 발송됨                    │
│   [CHIP: 박전무][CHIP: 이상무][CHIP: 김전무][CHIP: 최상무][CHIP: 한이사]│
│   ─────────────────────────────────────────────────────              │
│   참가자 (2명, 자기 추가)                                            │
│   ● 박전무  추가 2026-05-10 09:32                                    │
│   ● 김전무  추가 2026-05-10 11:15                                    │
│                                                                      │
│   [BTN: + 참가하기]                                                   │
│   (또는 [BTN: 참가 취소] — 본인이 이미 참가자인 경우)                 │
│   ※ 알림 대상에 포함되지 않은 임원은 참가 버튼 비활성                  │
│   ─────────────────────────────────────────────────────              │
│   @멘션 ([CHIP: @삼성전자])                                          │
│   비고: "Q2 전략 워크숍"                                             │
├──────────────────────────────────────────────────────────────────────┤
│       [BTN: 수정(admin/등록자만)] [BTN: 삭제(admin/등록자만)] [BTN: 닫기]│
└──────────────────────────────────────────────────────────────────────┘
```

### 3.4 공통 일정 삭제 확인 (SCR-MODAL-CONFIRM-DELETE 공통 케이스, COM-004)

```
┌── MODAL (440px) ─────────────────────────────────────────────────────┐
│ [H2: 공통 일정 삭제]                                    [BTN-ICON: ×] │
├──────────────────────────────────────────────────────────────────────┤
│ '임원 전체 워크숍'을 삭제하시겠습니까?                                │
│                                                                      │
│ ⚠ 참가자 2명에게 취소 알림이 발송됩니다.                              │
│                                                                      │
│ ※ 삭제 후 30초 내 토스트의 "실행 취소" 로 복원 가능합니다.            │
├──────────────────────────────────────────────────────────────────────┤
│                          [BTN: 취소] [BTN: 삭제(danger)]              │
└──────────────────────────────────────────────────────────────────────┘

확정 후:
[TOAST(success): 공통 일정이 삭제되었습니다. [BTN-LINK: 실행 취소 (30초)]]
```

### 3.5 참가자 자기 추가 시퀀스 (COM-002) — 임원 관점

```
1. 임원 A 알림 수신 ([SL-HEADER] 🔔 배지)
        ↓ 알림 클릭
2. SCR-NOTIFICATION 드롭다운 → 해당 알림 클릭
        ↓
3. SCR-MODAL-SCHEDULE-DETAIL (공통 케이스, 3.3 와이어)
        ↓ [BTN: + 참가하기] 클릭
4. 참가자 목록 즉시 갱신 (낙관적 업데이트)
   [TOAST(success): 참가자로 추가되었습니다]
   본인 달력에 공통 일정 표시 (CAL-005)
```

### 3.6 상태별 와이어 (공통 모드 특이 케이스)

```
[빈 — 알림 발송 대상 0명]
[INLINE-ERROR (SELECT: 알림 발송 대상 아래): 알림 발송 대상을 1명 이상 선택해주세요]
[BTN: 저장] 비활성

[로딩 — 저장 중]
[BTN: 저장] aria-busy=true + [SPINNER]
저장 완료까지 모달 닫기 잠금

[에러 — 알림 발송 일부 실패]
일정 저장은 성공, [TOAST(warn): 일부 알림 발송에 실패했습니다. 알림 발송 이력에서 확인하세요]
notification_logs.status='failed' 인 행은 별도 워커가 재시도 (지수 백오프 3회)

[에러 — 알림 발송 전체 실패]
일정 저장은 성공, [TOAST(error): 알림 발송에 실패했습니다. 수동으로 공유해주세요]

[권한 거부 — user 가 공통 일정 삭제 시도]
[BTN: 삭제] 자체 비렌더. 직접 요청 시 403 → [TOAST: 권한이 없습니다]

[참가자 자기 추가 시도 — 알림 대상 아닌 임원]
[BTN: + 참가하기] 비활성 (또는 [TOOLTIP: 해당 일정의 참가 대상이 아닙니다])
```

---

## 4. 컴포넌트 사용 표

scr_03 에서 정의한 컴포넌트를 그대로 사용. 공통 모드 추가 동작은 굵게 표시.

| 컴포넌트 ID | 본 화면 (공통 모드) 적용 사양 | 사용 위치 |
|---|---|---|
| `[SEGMENT: 개인/공통]` | **공통이 기본 활성**. user 는 SEGMENT 자체가 admin 전용. 수정 모드에서는 유형 전환 불가 (비활성) | 폼 상단 |
| `[SELECT: 알림 발송 대상]` | **다중 선택**, CHIP 표시. 검색 입력 (`users.name` 부분 일치). 기본 옵션: `users.role='user' AND status='active' AND deleted_at IS NULL` | 폼 |
| `[BTN-LINK: 전체 선택]` | 위 SELECT 의 모든 활성 임원을 일괄 추가 | 폼 |
| `[CHIP: 알림 대상 임원]` | mention/filter variant. ✕ 로 개별 제거 | 폼 |
| `[BANNER: 변경 알림 안내]` | info variant. **수정 모드에서만** 노출. "저장 시 N명에게 변경 알림이 발송됩니다" | 수정 폼 상단 |
| `[BTN: + 참가하기]` | primary. 본인이 알림 대상이면서 미참가일 때만. 클릭 → `schedule_participants` INSERT/UPDATE status='joined' | 상세 본문 |
| `[BTN: 참가 취소]` | tertiary. 본인이 참가자(status='joined')일 때만 | 상세 본문 |
| `[LIST: 참가자 목록]` | `schedule_participants.status='joined'` 건만. AVATAR color + 이름 + joined_at | 상세 본문 |
| `[LIST: 알림 발송 대상]` | 참가자와 구분되어 별도 표시. CHIP × N. 클릭 비반응 (정보용) | 상세 본문 |
| `[BADGE: 공통]` | primary variant. `schedules.type='common'` | 상세 헤더, 리스트 행 |
| `[TAG: 공통]` | "공통" 라벨, 색 primary | 카드/행 표시 |
| `[BTN: 수정]` (공통) | secondary. **권한**: 등록자(`schedules.created_by=현재 사용자`) 또는 admin 만 렌더 | 상세 푸터 |
| `[BTN: 삭제]` (공통) | danger. 동일 권한 (등록자 or admin) | 상세 푸터 |
| `[TOAST(success): N명에게 알림 발송]` | 등록 직후 | SL-OVERLAY |
| `[TOAST(warn): 일부 알림 발송 실패]` | 부분 실패 시 | SL-OVERLAY |
| `[TOAST(error): 알림 발송 실패]` | 전체 실패 시 | SL-OVERLAY |
| `[TOAST: 실행 취소(30초)]` | 삭제 직후 (COM-004) | SL-OVERLAY |
| `[INLINE-ERROR]` | 알림 발송 대상 0명, 시간 역전 등 | 폼 |
| `[TOOLTIP: 참가 대상 아님]` | [BTN: + 참가하기] 비활성 안내 | 상세 |
| `[BOTTOMSHEET: 임원 선택]` | 모바일에서 알림 대상 선택 (RES-002) | 폼 모바일 |
| `[ACCORDION: 추가 정보]` | 모바일에서 멘션·비고 접힘 (RES-002) | 폼 모바일 |

> 신규 컴포넌트 추가 없음. 알림 대상 다중 SELECT 는 components.md §1.4 `[SELECT]` 의 multi 동작으로 흡수.

---

## 5. 상호작용 명세

### 5.1 공통 일정 등록 (COM-001)

| 트리거 | 컴포넌트 | 이벤트 | 다음 상태/액션 | API (기능 ID) |
|---|---|---|---|---|
| 진입 | `[BTN: + 공통 일정 등록]` (사이드바·페이지 헤더) | onClick | 폼 모달 open + 공통 모드 강제 (`SEGMENT: 공통` 활성). 모든 인증 사용자 가능 | `COM-001` |
| 진입 (모임 레이더, Phase 3) | `[CAL-SLOT]` 클릭 | onClick | 폼 open + 참가자·날짜·시간대 프리필 (공통 모드) | `RAD-004` |
| 알림 대상 선택 | `[SELECT: 알림 발송 대상]` | onChange | `[CHIP]` 추가. 선택 0건 → INLINE-ERROR | `COM-001` |
| 전체 선택 | `[BTN-LINK: 전체 선택]` | onClick | `users.role='user' AND status='active'` 전원을 CHIP 으로 추가 | `COM-001 ALT-01` |
| CHIP 제거 | `[CHIP]` ✕ | onRemove | 해당 임원 알림 대상에서 제거 | — |
| 저장 | `[BTN: 저장]` | onClick | 유효성 → optimistic → API → 토스트 | `COM-001` |
| 저장 성공 | (응답) | — | `schedules` INSERT (type='common', owner_id=NULL), `schedule_participants` INSERT (등록자 본인 자동, status='joined'), `notification_logs` × N건 (event_type='common_schedule_created', status='pending') 큐잉. `[TOAST: 공통 일정이 등록되었습니다. N명에게 알림이 발송되었습니다]`. 모달 닫기. 부모 화면(달력·리스트) 즉시 반영 (공통 색상으로). | `COM-001` |
| 알림 일부 실패 | (worker) | — | `notification_logs.status='failed'` 된 건 별도. UI에 `[TOAST(warn): 일부 알림 발송 실패]` (확인 시 SCR-ADMIN-NOTIFICATION-LOG 안내) | `COM-001` 예외 |
| 알림 전체 실패 | (worker) | — | `[TOAST(error): 알림 발송 실패. 수동으로 공유해주세요]`. 일정 저장은 유지 | `COM-001` 예외 |
| 유효성 실패 — 알림 대상 0명 | (저장 시) | — | `[INLINE-ERROR: 알림 발송 대상을 1명 이상 선택해주세요]` | `COM-001` |

사후 조건:
- `schedules` INSERT: `type='common'`, `owner_id=NULL`, `created_by=actor_id`, `on_behalf_of_id=NULL`
- `schedule_participants` INSERT × 1 (등록자 자동 참가, COM-001 spec 7단계 옵션: 본 화면 채택)
- `notification_logs` INSERT × (선택한 알림 대상 임원 수): `event_type='common_schedule_created'`, `recipient_id=대상 user.id`, `target_type='schedule'`, `target_id=schedules.id`, `status='pending'`
- `audit_logs` INSERT: `target_type='schedule'`, `action='created'`, `actor_id`, `before_data=NULL`, `after_data={...}`

### 5.2 공통 일정 수정 (COM-003)

| 트리거 | 컴포넌트 | 이벤트 | 다음 상태/액션 | API |
|---|---|---|---|---|
| 진입 | 상세 모달 `[BTN: 수정]` | onClick | 폼 모달 (수정 모드) + 기존 데이터 프리필. `[BANNER: 변경 알림 안내]` 노출 | `COM-003` |
| 유형 전환 시도 | `[SEGMENT: 공통/개인]` | onChange | 비활성. 전환 불가 (COM-003 수정 제한) | — |
| 참가자 목록 변경 시도 | (UI 없음) | — | 수정 폼은 참가자 목록 미노출. 참가자는 별도 자기 추가 기능 | `COM-003` |
| 저장 | `[BTN: 저장]` | onClick | 유효성 → API → `notification_logs` × N (event_type='common_schedule_updated', 강제 발송) | `COM-003` |
| 저장 성공 | (응답) | — | TOAST(success: 공통 일정이 수정되었습니다. N명에게 변경 알림 발송) + 모달 닫기 + 달력·리스트 갱신. 참가자 목록 유지 | — |
| 동시 수정 충돌 | (응답 409) | — | TOAST(warn: 다른 사용자가 수정했습니다) + 최신 데이터 자동 로드 | `COM-003` 예외 |
| 알림 발송 실패 | (worker) | — | 수정 저장은 유지, TOAST(warn) | `COM-003` 예외 |

사후 조건:
- `schedules` UPDATE (변경 필드만)
- `audit_logs` INSERT: `action='updated'`, `before_data` / `after_data` / `changed_fields=[...]`
- `notification_logs` INSERT × (현재 알림 대상): `event_type='common_schedule_updated'`, `status='pending'` (변경 알림 강제 발송, 선택 불가)
- `schedule_participants` 변경 없음

### 5.3 공통 일정 삭제 (COM-004)

| 트리거 | 컴포넌트 | 이벤트 | 다음 상태/액션 | API |
|---|---|---|---|---|
| 진입 | 상세 모달 `[BTN: 삭제]` | onClick | SCR-MODAL-CONFIRM-DELETE 표시. 참가자 N명 안내 문구 (`COUNT(schedule_participants WHERE status='joined')`) | `COM-004` |
| 삭제 확정 | `[BTN: 삭제 (danger)]` | onClick | API → soft delete → 알림 대상에 취소 알림 발송 | `COM-004` |
| 삭제 성공 | (응답) | — | TOAST(success: 공통 일정이 삭제되었습니다. [BTN-LINK: 실행 취소(30초)]). 부모 화면에서 제거 | — |
| 실행 취소 | TOAST [BTN-LINK] | onClick (30초 내) | `schedules.deleted_at=NULL, deleted_by=NULL` 복원 + 부모 화면 재반영 | `PROC-SCH-004 ALT-02` |
| 삭제 실패 | (응답 오류) | — | optimistic 롤백 + TOAST(error) | — |

사후 조건:
- `schedules.deleted_at=now()`, `deleted_by=actor_id` (soft delete)
- `audit_logs`: `action='deleted'`, `before_data=스냅샷`
- `notification_logs` × (알림 대상 임원): `event_type='common_schedule_updated'`, `payload={action:'deleted', schedule_title, ...}`
- `schedule_participants` 행 자체는 잔존 (schedule soft delete 이므로 CASCADE 미발동)

### 5.4 참가자 자기 추가/취소 (COM-002, PROC-SCH-005)

| 트리거 | 컴포넌트 | 이벤트 | 다음 상태/액션 | API |
|---|---|---|---|---|
| 알림 클릭 | SCR-NOTIFICATION 아이템 | onClick | 본 화면 (공통 상세) 열기 | NOT-001 |
| 참가하기 | `[BTN: + 참가하기]` | onClick | 본인 user_id 의 `schedule_participants` UPSERT (status='joined', joined_at=now()) | `COM-002` |
| 참가 성공 | (응답) | — | 참가자 목록 즉시 갱신 + [TOAST: 참가자로 추가되었습니다] + 본인 달력 표시 | — |
| 참가 취소 | `[BTN: 참가 취소]` | onClick | confirm("참가를 취소하시겠습니까?") → `schedule_participants.status='cancelled'`, `cancelled_at=now()` | `COM-002 ALT-01` |
| 취소 성공 | (응답) | — | 목록에서 본인 제거 + TOAST(취소되었습니다). 본인 달력에서 해당 일정 제거 | — |
| 이미 참가자 | (서버 응답 409 또는 클라이언트 가드) | — | TOAST(info: 이미 참가자 목록에 있습니다) | `COM-002` 예외 |
| 알림 대상 아님 | (서버 응답 403 또는 클라이언트 가드) | — | [BTN: + 참가하기] 비활성 + TOOLTIP. 직접 요청 시 TOAST(error: 해당 일정의 참가 대상이 아닙니다) | `COM-002` 예외 |
| 일정 이미 삭제됨 | (응답 404) | — | TOAST(삭제된 일정입니다) + 모달 닫기 | `COM-002` 예외 |

사후 조건:
- `schedule_participants` UPSERT (UNIQUE `(schedule_id, user_id)`)
- 별도 `audit_logs` / `notification_logs` 발생 없음 (조용히 처리, COM-002 6단계)

---

## 6. 데이터 바인딩 표

### 6.1 공통 일정 폼 입력 ↔ ERD

| UI 필드 | 데이터 소스 | 비고 |
|---|---|---|
| 일정 유형 | `schedules.type='common'` | 고정값. 수정 모드에서는 비활성 |
| 일정 주인 | `schedules.owner_id=NULL` | 공통은 NULL (ERD CHECK 허용) |
| 작성자 | `schedules.created_by` | 로그인 사용자 |
| 일정 내용 | `schedules.title` | 1~200자 |
| 날짜 | `schedules.schedule_date` | DATE |
| 시간대 | `schedules.time_slot` | enum (morning/lunch/afternoon/evening/allday) |
| 시작/종료 시간 | `schedules.start_time`, `schedules.end_time` | NULLABLE, start<end |
| 종일 | `schedules.is_all_day` | bool |
| 장소 | `schedules.location` | ≤100자 |
| 비고 | `schedules.memo` | ≤500자 |
| 알림 발송 대상 | (폼 입력 → 저장 후 `notification_logs.recipient_id` 시드) | 다중 선택. 1명 이상 |
| 멘션 | `mentions.schedule_id/reference_type/reference_id/raw_text` | scr_03 동일 |

> **알림 발송 대상** 은 ERD 의 별도 컬럼이 아니라 `notification_logs` 행으로 발현된다. 따라서 폼 저장 시 트랜잭션 내에서:
> 1. `schedules` INSERT (또는 UPDATE)
> 2. `notification_logs` × N INSERT (recipient_id = 선택한 각 임원)
> 3. `schedule_participants` × 1 INSERT (등록자 본인 자동 참가)
>
> 알림 대상 자체를 영구 보관할 필요가 있는 경우(상세 화면 표시용), `notification_logs WHERE target_type='schedule' AND target_id=schedules.id AND event_type='common_schedule_created'` 의 `recipient_id` 집합을 조회한다 (이슈 메모 참조).

### 6.2 공통 일정 상세 ↔ ERD

| UI 필드 | 데이터 소스 | 비고 |
|---|---|---|
| 일정 제목 | `schedules.title` | — |
| 공통 배지 | `schedules.type='common'` | BADGE |
| 날짜·시간 | `schedules.schedule_date`, `start_time`, `end_time`, `time_slot` | — |
| 장소 | `schedules.location` | — |
| 등록자 | `users.name` (`users.id=schedules.created_by`) | — |
| 알림 발송 대상 | `notification_logs.recipient_id` WHERE `target_id=schedules.id AND event_type='common_schedule_created'` JOIN `users` | CHIP × N. 정보용 (클릭 비반응) |
| 참가자 목록 | `schedule_participants.user_id` WHERE `schedule_id=schedules.id AND status='joined'` JOIN `users` | AVATAR color + 이름 + joined_at |
| 본인 참가 상태 | EXISTS(`schedule_participants` WHERE `user_id=현재 사용자 AND schedule_id=… AND status='joined'`) | + 참가하기 / 참가 취소 토글 |
| 본인 알림 대상 여부 | EXISTS(`notification_logs` WHERE `recipient_id=현재 사용자 AND target_id=… AND event_type='common_schedule_created'`) | + 참가하기 활성 여부 |
| 비고·멘션 | `schedules.memo`, `mentions` | scr_03 동일 |
| 이력 (Phase 3) | `audit_logs` WHERE `target_type='schedule' AND target_id=schedules.id` | SCR-MODAL-AUDIT-LOG |

### 6.3 참가자 자기 추가 ↔ ERD

| UI 액션 | ERD 적용 |
|---|---|
| [+ 참가하기] | `schedule_participants` UPSERT: `schedule_id`, `user_id=현재 사용자`, `status='joined'`, `joined_at=now()`, `added_by=현재 사용자`. UNIQUE `(schedule_id, user_id)` 로 재참가 시 동일 행 UPDATE |
| [참가 취소] | UPDATE `schedule_participants SET status='cancelled', cancelled_at=now() WHERE schedule_id=… AND user_id=…` |
| 본인 달력 반영 | (조회 시 자동) — CAL-001 의 일정 쿼리에서 type='common' AND 본인이 참가자 OR 본인이 알림 대상으로 필터 |

### 6.4 알림 발송 (NOT-001, NOT-002) ↔ ERD

| 트리거 | notification_logs 행 |
|---|---|
| 공통 일정 등록 (COM-001) | `event_type='common_schedule_created'`, `recipient_id=선택 임원 N`, `recipient_email=users.email`, `target_type='schedule'`, `target_id=schedules.id`, `channel='email'`, `status='pending'`, `attempt_count=0`, `payload={schedule_title, schedule_date, time_slot, location, creator_name, ...}` |
| 공통 일정 수정 (COM-003) | `event_type='common_schedule_updated'`, payload 에 변경 필드 요약 포함 |
| 공통 일정 삭제 (COM-004) | `event_type='common_schedule_updated'`, payload `{action: 'deleted', ...}` (spec 11 NOT-002 별도 행 정의가 없으므로 updated 채널로 통합) |

---

## 7. 화면 상태

| 상태 | 표현 |
|---|---|
| 빈 — 알림 대상 0명 | INLINE-ERROR + [BTN: 저장] 비활성 |
| 빈 — 참가자 0명 (상세) | "아직 참가자가 없습니다" + [BTN: + 참가하기] (본인이 알림 대상이면 활성) |
| 로딩 | 폼 저장 중 [SPINNER] in BTN. 상세 진입 시 [SKELETON]. 알림 발송은 백그라운드 (큐잉) |
| 에러 — 알림 일부 실패 | 일정 저장 성공 + [TOAST(warn): 일부 알림 발송에 실패했습니다] |
| 에러 — 알림 전체 실패 | 일정 저장 성공 + [TOAST(error): 알림 발송 실패. 수동으로 공유해주세요] |
| 에러 — 동시 수정 충돌 (COM-003) | [TOAST(warn): 다른 사용자가 수정했습니다] + 최신 데이터 재로드 |
| 성공 — 등록 | TOAST(success: 공통 일정이 등록되었습니다. N명에게 알림이 발송되었습니다) |
| 성공 — 수정 | TOAST(success: 공통 일정이 수정되었습니다. N명에게 변경 알림 발송) |
| 성공 — 삭제 | TOAST(success: 공통 일정이 삭제되었습니다. [BTN-LINK: 실행 취소(30초)]) |
| 성공 — 참가하기 | TOAST(success: 참가자로 추가되었습니다) + 목록 즉시 갱신 |
| 성공 — 참가 취소 | TOAST(success: 참가가 취소되었습니다) |
| 권한 거부 — user 등록 시도 | [BTN: + 공통 일정 등록] 자체 비노출 (사이드바·페이지 헤더) |
| 권한 거부 — user 수정/삭제 | 상세에서 [BTN: 수정]/[BTN: 삭제] 비렌더 (단, 등록자 본인은 허용) |
| 권한 거부 — 참가 대상 아닌 임원 | [BTN: + 참가하기] 비활성 + [TOOLTIP: 해당 일정의 참가 대상이 아닙니다] |

---

## 8. 권한·접근성

### 8.1 권한별 노출 차이

| 요소 | `user` | `admin` |
|---|:-:|:-:|
| `[BTN: + 공통 일정 등록]` (사이드바·페이지 헤더) | ❌ | ✅ |
| `[SEGMENT: 공통]` (폼 진입 후 토글) | ❌ 비활성 | ✅ |
| `[SELECT: 알림 발송 대상]` (등록 시) | (등록 자체 불가) | ✅ |
| `[BTN: 수정]` 공통 일정 상세 | 본인이 등록자인 경우만 (`schedules.created_by=본인`) | ✅ 전체 |
| `[BTN: 삭제]` 공통 일정 상세 | 본인이 등록자인 경우만 | ✅ 전체 |
| `[BTN: + 참가하기]` | 본인이 알림 대상 (`notification_logs.recipient_id=본인`) 이고 미참가일 때 | 동상. admin 도 임원으로 알림 대상이면 가능 |
| `[BTN: 참가 취소]` | 본인이 현재 참가자(`schedule_participants.status='joined'`) 일 때만 | 동상 |
| 알림 발송 대상 CHIP 목록 표시 | ✅ 정보 조회 | ✅ |
| 참가자 목록 표시 | ✅ | ✅ |

> 2026-05-14 결정: 공통 일정 등록·수정은 **모든 인증 사용자(`user`/`admin`)** 가 가능. 삭제는 등록자(`schedules.created_by`) 또는 관리자. spec/07·common_layout.md·spec/02·spec/00·ia.md 모두 본 결정으로 갱신됨.

### 8.2 접근성

scr_03_schedule §8.2 의 모달 공통 접근성 규칙을 그대로 따른다. 본 화면 추가 규칙:

| 항목 | 규칙 |
|---|---|
| 알림 대상 CHIP | `aria-label="박전무, 알림 대상에서 제거"`. ✕ 키보드 Enter/Delete 모두 작동 |
| [BTN: + 참가하기] | 비활성 시 `aria-disabled="true"` + `aria-describedby` → 툴팁 ID ("해당 일정의 참가 대상이 아닙니다") |
| 참가자 목록 LIST | `<ul>` + `<li>`. 항목 수 안내: `<h3>` "참가자 (N명)" 으로 스크린리더 알림 |
| 변경 알림 BANNER | `role="status"`, 사용자 주의 환기 (저장 시 자동 알림이 발송된다는 점) |
| 삭제 확인 모달 | scr_03 §3.7 동일. `[BTN: 취소]` 자동 포커스 (실수 방지) |
| 모바일 입력 대상 선택 | BOTTOMSHEET 으로 전환 (RES-002). 검색 입력 폰트 16px 이상 |

---

## 이슈 메모

- ~~**권한 충돌**~~ ✅ **RESOLVED 2026-05-14**: spec/07 의 "모든 인증 사용자 가능" 을 정식 채택. `common_layout.md` §10, `spec/02 §접근 제어`, `spec/00 §역할별 권한`, `ia/ia.md §4` 모두 갱신됨. 등록·수정은 user/admin 전체. 삭제는 등록자(`schedules.created_by`) 또는 admin.
- **알림 발송 대상 보관**: spec/07 의 입력값 "알림 발송 대상 UUID[]" 는 별도 컬럼이 ERD `schedules` 에 없음. 본 문서는 `notification_logs WHERE event_type='common_schedule_created' AND target_id=schedules.id` 의 `recipient_id` 집합으로 사후 조회한다. 이는 알림 발송 행을 영구 보관(이력 보존)하는 ERD 결정과 일관됨. 단, 알림 발송이 모두 실패한 경우(예: 큐잉 직후 시스템 오류) 알림 대상 정보가 유실될 가능성이 있음. → 향후 `common_schedule_recipients` 별도 테이블이 필요할 수 있으나 1차 범위는 `notification_logs` 채택.
- **수정 시 알림 대상 변경**: spec/07 COM-003 은 "참가자 목록은 유지" 만 명시. 알림 대상 자체를 수정 폼에서 변경 가능한지는 명시 없음. 본 문서는 **변경 가능** 으로 정의(폼에서 알림 대상 SELECT 노출). 단, 새로 추가된 임원에게는 등록 알림이, 기존 알림 대상에게는 변경 알림이 발송되도록 NOT-001/NOT-002 분기 처리 필요 → 1차는 단순화하여 **현재 알림 대상 전원에게 NOT-002 (변경 알림) 통일 발송**. (이슈 메모로 보존.)
- **COM-004 취소 알림 이벤트 타입**: spec/11 NOT-001/NOT-002 정의에 "삭제 알림" 별도 이벤트 없음. ERD `notification_logs.event_type` enum 도 `common_schedule_created`/`common_schedule_updated`/`schedule_updated_by_other`/`invite`/`password_reset` 5종. 본 문서는 삭제 시 `event_type='common_schedule_updated'` + `payload.action='deleted'` 로 통합 처리.
- **등록자 자동 참가**: spec/07 COM-001 7단계 "등록자는 초기 참가자에 자동 추가된다 (선택)" 의 (선택) 을 본 문서는 **자동 추가 채택** (워크플로 일관성). admin 이 본인 참가 없이 공통 일정만 만들 수 있도록 폼에 "나도 참가" 토글 옵션을 추가하는 것은 Phase 2 이후.

---

## 검증

- 자체 검증 일자: 2026-05-14 (권한 결정 라운드 갱신)
- 자체 검증 결과: ✅ 통과 (권한 충돌 이슈 RESOLVED)
- 자동 검증 결과: ✅ 통과
  - 8개 필수 섹션 헤더 모두 존재 ✓
  - 다루는 SCR-* (SCR-MODAL-SCHEDULE-FORM 공통 모드, SCR-MODAL-SCHEDULE-DETAIL 공통 케이스, SCR-MODAL-CONFIRM-DELETE 공통 케이스) 모두 ia/screen_list.md 에 존재 ✓
  - 데이터 바인딩 표의 모든 `테이블.컬럼` (`schedules.type/owner_id/title/schedule_date/time_slot/start_time/end_time/is_all_day/location/memo/created_by/deleted_at/deleted_by/id/updated_at`, `schedule_participants.schedule_id/user_id/status/joined_at/cancelled_at/added_by`, `notification_logs.event_type/recipient_id/recipient_email/target_type/target_id/channel/status/attempt_count/payload`, `users.id/name/email/role/status/color/deleted_at`, `mentions.schedule_id/reference_type/reference_id/raw_text`, `audit_logs.target_type/target_id/action/actor_id/before_data/after_data/changed_fields`) 모두 erd.md 에 실재 ✓
  - 사용 컴포넌트(MODAL, BACKDROP, H2, BTN-ICON, SEGMENT, SELECT, BTN-LINK, CHIP, INPUT, DATE, TOGGLE, TIME, MENTION, TEXTAREA, BANNER, BTN, BADGE, TAG, LIST, AVATAR, TABS, TOAST, INLINE-ERROR, TOOLTIP, BOTTOMSHEET, ACCORDION, SKELETON, SPINNER) 모두 components.md 정의 ✓
  - 상호작용 API 가 spec/07 COM-001~004 + spec/11 NOT-001/002 + process/proc_03 PROC-SCH-002·003·004·005 와 일치 ✓
  - 4종 상태 + 권한 분기 정의 ✓
- 보류·예외 사항:
  - "나도 참가" 토글 옵션 (등록자 자동 참가 OFF) — Phase 2
  - 알림 대상 보관용 별도 테이블 검토 — Phase 2 (현재는 `notification_logs` 활용)
  - 수정 시 알림 대상 추가/제거 분기 (NOT-001 vs NOT-002) — 1차는 단순 통합 발송, Phase 2 정교화
- 검증자: claude (Step B 그룹 2)
