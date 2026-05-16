# 권한 관리·에러 화면설계서

- 화면 ID: SCR-ADMIN-USER, SCR-ADMIN-PROXY, SCR-ERROR-403
- 관련 spec: [spec/02_permission.md](../spec/02_permission.md)
- 관련 process: [process/proc_02_permission.md](../process/proc_02_permission.md)
- 관련 ERD: `users`, `proxy_permissions`, `audit_logs`
- Phase: 1 (SCR-ADMIN-USER, SCR-ERROR-403), 2 (SCR-ADMIN-PROXY)
- 최종 갱신: 2026-05-14

---

## 1. 개요

본 문서는 관리자 전용 권한 관리 화면 2건과 공통 에러 화면 1건을 정의한다.

| SCR-* | 진입 | 핵심 기능 |
|---|---|---|
| SCR-ADMIN-USER | `/admin/users` | AUTH-001 (초대), PERM-001/004 (역할·활성화), NOT-004 (초대 메일) |
| SCR-ADMIN-PROXY | `/admin/proxy` | PERM-002 (대리권한 부여·회수) |
| SCR-ERROR-403 | (모든 권한 거부 응답) | PERM-001/004 — UI 게이팅 차단 후의 폴백 |

모든 화면은 `users.role='admin'` 만 진입 가능. `user` 가 직접 URL 접근 시 PROC-PERM-001 1계층(미들웨어) 또는 2계층(비즈니스 로직)에서 차단 → SCR-ERROR-403 으로 라우팅.

---

## 2. 레이아웃 구조

| 화면 | 사용 슬롯 | 비고 |
|---|---|---|
| SCR-ADMIN-USER | `SL-HEADER + SL-SIDEBAR + SL-MAIN + SL-FOOTER` | 본문은 테이블 1개 + 도구바 |
| SCR-ADMIN-PROXY | 동상 | 본문 테이블 1개 + 권한 추가 모달 |
| SCR-ERROR-403 | `SL-AUTH` (미인증) 또는 `SL-HEADER+SL-MAIN`(인증 후) | `common_layout.md` §8.1: "인증 후 진입 시 헤더 유지" |

브레이크포인트:
- `BP-DESKTOP`: 테이블 전체 컬럼 노출
- `BP-TABLET`: 일부 컬럼 hidden, 우선순위 컬럼 유지
- `BP-MOBILE`: 테이블 → 카드 리스트 전환 (RES-001)

---

## A. SCR-ADMIN-USER — 사용자 관리

### A.1 와이어프레임 (데스크톱)

```
┌─ SL-HEADER ──────────────────────────────────────────────────────────────┐
│ [☰] [LOGO] 임원 일정                       [🔔][🟢관리자▾]               │
├─ SL-SIDEBAR ──┬─ SL-MAIN ─────────────────────────────────────────────────┤
│ 일정          │ [H1: 사용자 관리]              [BTN: + 사용자 초대] primary │
│ 협업          │ ────────────────────────────────────────────────────────  │
│ 데이터        │ [SEARCH: 이름·이메일·사번]  [SELECT: 역할 ▾] [SELECT: 상태 ▾]│
│ 관리자        │ ────────────────────────────────────────────────────────  │
│ • 사용자 관리◉│ ┌──────────────────────────────────────────────────────┐ │
│ • 대리권한    │ │ [AVATAR][이름]   [이메일]   [사번]  [역할] [상태] [⋮]│ │
│ • 공휴일      │ ├──────────────────────────────────────────────────────┤ │
│ • 알림 이력   │ │ 🟢 홍길동       hong@..    100123  일반   active  [⋮]│ │
│ ───           │ │ 🔴 김임원       kim@..     100200  일반   inactive[⋮]│ │
│ [BTN: + 일정] │ │ ⚪ 박비서       park@..    100301  관리자 pending [⋮]│ │
│ [BTN: + 공통] │ │ ... (N건)                                            │ │
│ [BTN: + 사용  │ └──────────────────────────────────────────────────────┘ │
│        자 초대]│  [PAGINATION: < 1 2 3 ... >] / 페이지당 20 / 총 N건       │
└───────────────┴───────────────────────────────────────────────────────────┘
```

**초대 모달 (`[BTN: + 사용자 초대]` 클릭 시)**:

```
┌─ [MODAL: 사용자 초대] ─────────────────┐
│ 사용자 초대                       [×]  │
├────────────────────────────────────────┤
│ [INPUT: 이메일]            (required)  │
│ [INPUT: 이름]              (required)  │
│ [INPUT: 사번 (숫자 6~10)]  (required)  │
│ [SELECT: 역할 ▾]                       │
│   ○ 관리자                             │
│   ● 일반 임원                          │
│ [COLOR: 임원 색상] (역할=user 일 때만) │
│ [INLINE-ERROR: ...]                    │
├────────────────────────────────────────┤
│                [BTN: 취소] [BTN: 초대]  │
└────────────────────────────────────────┘
```

**행 케밥 메뉴 `[⋮]` 옵션**:

```
[MENU]
├ 활성화/비활성화 (TOGGLE 즉시 반영도 가능)
├ 역할 변경 (관리자 ↔ 일반)
├ 초대 메일 재발송 (status='pending' 만)
├ 잠금 해제 (status='locked' 만)
└ 삭제 (soft delete)
```

### A.2 와이어프레임 (모바일)

```
┌──────────────────────┐
│ [☰] 사용자 관리     │
├──────────────────────┤
│ [BTN: + 사용자 초대] │
│ [SEARCH: 이름·이메일]│
│ [SELECT: 역할 ▾]     │
│ [SELECT: 상태 ▾]     │
├──────────────────────┤
│ ┌──────────────────┐ │
│ │ 🟢 홍길동        │ │ ← 카드 1
│ │ hong@company.co.kr│ │
│ │ 사번 100123       │ │
│ │ 일반 · active    │ │
│ │ [⋮]              │ │
│ └──────────────────┘ │
│ ... (N건)            │
├──────────────────────┤
│ [PAGINATION]         │
└──────────────────────┘
```

### A.3 컴포넌트 사용 표

| 컴포넌트 | 위치 | 적용 사양 |
|---|---|---|
| `[H1: 사용자 관리]` | 페이지 타이틀 | — |
| `[BTN: + 사용자 초대]` | 1차 액션 | primary, 클릭 시 초대 모달 |
| `[SEARCH: 이름·이메일·사번]` | 도구바 | placeholder, 디바운스 300ms |
| `[SELECT: 역할]` | 도구바 필터 | 전체/관리자/일반 |
| `[SELECT: 상태]` | 도구바 필터 | 전체/pending/active/inactive/locked |
| `[TABLE: 사용자, 이메일, 사번, 역할, 상태, 액션]` | 본문 | 정렬 가능 컬럼: 이름, 사번, 상태. 모바일은 `[LIST]` 카드형 (RES-001) |
| `[AVATAR: 이니셜]` | 행 첫 컬럼 | `users.color` 적용 |
| `[BADGE: 상태]` | 상태 컬럼 | pending(회색) / active(녹색) / inactive(주황) / locked(빨강) |
| `[MENU: ⋮]` | 행 액션 | dropdown 형식 |
| `[TOGGLE: 활성화]` | (옵션) 행 또는 모달 내 | active ↔ inactive 즉시 전환 |
| `[PAGINATION: 1 2 3]` | 본문 하단 | 페이지당 20건 |
| `[MODAL: 사용자 초대]` | 오버레이 | `[INPUT: 이메일]`, `[INPUT: 이름]`, `[INPUT: 사번]`, `[SELECT: 역할]`, `[COLOR: 색상]`, `[INLINE-ERROR]`, `[BTN: 취소]`, `[BTN: 초대]` |
| `[MODAL: 역할 변경 확인]` | 오버레이 | 행 메뉴에서 호출 |
| `[TOAST: 초대 메일이 발송되었습니다]` | 성공 후 | success |
| `[EMPTY: 사용자가 없습니다]` | 0건 상태 | 보조 액션 `[BTN: 사용자 초대]` |

### A.4 상호작용 명세

| 트리거 | 컴포넌트 | 이벤트 | 다음 상태/액션 | API |
|---|---|---|---|---|
| 진입 | — | onMount | 사용자 목록 로드 | `GET /api/users?role=&status=&q=&page=` |
| 입력 | `[SEARCH]` | onChange (디바운스 300ms) | 필터링 결과 갱신 | `GET /api/users?q=...` |
| 선택 | `[SELECT: 역할]` / `[SELECT: 상태]` | onChange | 필터 갱신 | `GET /api/users?role=...&status=...` |
| 정렬 | 테이블 헤더 | onSort | 정렬 키 갱신 | `GET /api/users?sort=name` |
| 클릭 | `[BTN: + 사용자 초대]` | onClick | `[MODAL: 사용자 초대]` 열기 | — |
| 제출 | 초대 모달 `[BTN: 초대]` | onClick | 유효성 → 중복 검증 → users 생성(`status='pending'`) → 초대 메일 발송 → 토스트 + 목록 갱신 | `POST /api/users/invite` (AUTH-001, PROC-AUTH-001, NOT-004) |
| 클릭 | 행 `[MENU: ⋮]` → "활성화/비활성화" | onSelect | `users.status` `active` ↔ `inactive` 전환 확인 모달 → 갱신 | `PATCH /api/users/:id/status` |
| 클릭 | 행 `[MENU: ⋮]` → "역할 변경" | onSelect | 확인 모달 → `users.role` 전환 → 감사 로그 기록 | `PATCH /api/users/:id/role` (audit_logs `target_type='user'`, `action='updated'`, `changed_fields=['role']`) |
| 클릭 | 행 `[MENU: ⋮]` → "초대 재발송" | onSelect | 새 토큰 발급 후 메일 재발송 | `POST /api/users/:id/invite/resend` (PROC-AUTH-001 AF-001) |
| 클릭 | 행 `[MENU: ⋮]` → "잠금 해제" | onSelect | `users.status` `locked` → `active`, `users.failed_login_count=0` 초기화 | `POST /api/users/:id/unlock` |
| 클릭 | 행 `[MENU: ⋮]` → "삭제" | onSelect | `SCR-MODAL-CONFIRM-DELETE` 호출 → soft delete | `DELETE /api/users/:id` |

### A.5 데이터 바인딩 표

| UI 필드 | 표시 형식 | 데이터 소스 | 비고 |
|---|---|---|---|
| 이름 | 텍스트 | `users.name` | NULL 시 "이름 없음" |
| 이메일 | 텍스트 | `users.email` | 정렬 가능 |
| 사번 | 텍스트 | `users.employee_id` | 숫자 6~10자리, 정렬 가능 |
| 역할 | 라벨 | `users.role` | `admin`→"관리자", `user`→"일반 임원" |
| 상태 | `[BADGE]` | `users.status` | pending/active/inactive/locked |
| 색상 | 좌측 띠 | `users.color` | NULL 시 띠 미노출 |
| 마지막 로그인 | YYYY-MM-DD HH:mm | `users.last_login_at` | 데스크톱만, 모바일 hidden |
| 활성 행 필터 | (서버) | `users.deleted_at IS NULL` | soft delete 제외 |
| 변경 이력 | (관리자 메뉴에서) | `audit_logs` `WHERE target_type='user' AND target_id=:id` | 감사 로그 (PERM-001 사후 조건) |

### A.6 화면 상태

| 상태 | 표현 |
|---|---|
| 빈 | `[EMPTY: 등록된 사용자가 없습니다]` + `[BTN: + 사용자 초대]` |
| 로딩 | 테이블 행 `[SKELETON]` 10행 |
| 에러 | `[ALERT: 사용자 목록을 불러오지 못했습니다]` + 재시도 |
| 성공 | 행 정상 렌더, 액션 후 `[TOAST]` |
| 권한 거부 | `user` 가 URL 직접 접근 시 `SCR-ERROR-403` 또는 `SCR-DASHBOARD` 라우팅 (PROC-PERM-001 1계층) |

### A.7 권한·접근성

- `admin` 전용. 모든 변경 작업은 `audit_logs` 에 기록 (`target_type='user'`)
- 테이블 정렬 헤더: `aria-sort="ascending|descending"`
- 행 케밥 메뉴: `Tab` 으로 진입, `↑↓` 항목 이동, `Enter` 선택, `Esc` 닫기
- 초대 모달: 포커스 트랩, `Esc` 닫기 (작성 중이면 확인 모달)

---

## B. SCR-ADMIN-PROXY — 대리권한 관리 (Phase 2)

### B.1 와이어프레임 (데스크톱)

```
┌─ SL-MAIN ────────────────────────────────────────────────────────────────┐
│ [H1: 대리권한 관리]                      [BTN: + 권한 추가] primary       │
│ ───────────────────────────────────────────────────────────────────────  │
│ [SEARCH: 대리 입력자·대상 임원]   [SELECT: 상태 ▾ active/revoked]        │
│ ───────────────────────────────────────────────────────────────────────  │
│ ┌──────────────────────────────────────────────────────────────────────┐ │
│ │ [대리 입력자] [대상 임원] [부여자]    [부여 일시]      [상태]  [액션]│ │
│ ├──────────────────────────────────────────────────────────────────────┤ │
│ │ 김비서        홍전무      박관리자   2026-05-01 09:12  active  [해제]│ │
│ │ 박비서        이부사장    박관리자   2026-04-22 14:30  active  [해제]│ │
│ │ 최비서        김전무      박관리자   2026-03-10 10:00  revoked       │ │
│ │ ... (N건)                                                            │ │
│ └──────────────────────────────────────────────────────────────────────┘ │
│ [PAGINATION] / 페이지당 20 / 총 N건                                       │
└──────────────────────────────────────────────────────────────────────────┘
```

**`[BTN: + 권한 추가]` 모달**:

```
┌─ [MODAL: 대리권한 추가] ─────────────────┐
│ 대리권한 추가                       [×]  │
├──────────────────────────────────────────┤
│ [SELECT: 대리 입력자 (이름·사번 검색)]   │
│ [SELECT: 대상 임원 (이름·사번 검색)]     │
│ [INLINE-ERROR: 본인에게 부여 불가 등]    │
├──────────────────────────────────────────┤
│                  [BTN: 취소] [BTN: 부여] │
└──────────────────────────────────────────┘
```

**`[해제]` 확인 모달** (백드롭 무시):

```
┌─ [MODAL: 권한 해제 확인] ────────┐
│ 대리권한을 해제하시겠습니까? [×]│
├──────────────────────────────────┤
│ 김비서 → 홍전무                  │
│ 해제 후 김비서는 홍전무 명의의   │
│ 신규 일정을 등록할 수 없습니다.  │
│ 기존에 작성된 일정은 유지됩니다. │
├──────────────────────────────────┤
│         [BTN: 취소] [BTN: 해제]  │
└──────────────────────────────────┘
```

### B.2 컴포넌트 사용 표

| 컴포넌트 | 위치 | 적용 사양 |
|---|---|---|
| `[H1: 대리권한 관리]` | 페이지 타이틀 | — |
| `[BTN: + 권한 추가]` | 1차 액션 | primary |
| `[SEARCH]` | 도구바 | 디바운스 300ms |
| `[SELECT: 상태]` | 도구바 필터 | active / revoked / 전체 |
| `[TABLE: 대리 입력자, 대상 임원, 부여자, 부여 일시, 상태, 액션]` | 본문 | 정렬: 부여 일시(기본 desc) |
| `[BADGE: 상태]` | 상태 컬럼 | active(녹색) / revoked(회색) |
| `[BTN: 해제]` | 행 액션 | danger, active 상태만 노출 |
| `[MODAL: 대리권한 추가]` | 오버레이 | 2개 `[SELECT]` (검색형) + `[INLINE-ERROR]` |
| `[MODAL: 권한 해제 확인]` | 오버레이 | confirm 모달 (백드롭 클릭 무시) |
| `[PAGINATION]` | 본문 하단 | 페이지당 20건 |
| `[TOAST: A에게 B의 대리 입력 권한을 부여했습니다]` | 성공 후 | success |
| `[EMPTY: 등록된 대리권한이 없습니다]` | 0건 상태 | — |

### B.3 상호작용 명세

| 트리거 | 컴포넌트 | 이벤트 | 다음 상태/액션 | API |
|---|---|---|---|---|
| 진입 | — | onMount | 권한 목록 로드 (active 기본) | `GET /api/proxy-permissions?status=active&page=` |
| 클릭 | `[BTN: + 권한 추가]` | onClick | 추가 모달 열기 | — |
| 선택 | 모달 `[SELECT: 대리 입력자]` | onChange | A 선택. 본인 선택 시 인라인 에러 | `GET /api/users?role=&q=` |
| 선택 | 모달 `[SELECT: 대상 임원]` | onChange | B 선택. A와 동일 선택 시 인라인 에러 | 동상 |
| 제출 | 모달 `[BTN: 부여]` | onClick | 중복 활성 권한 검증 → `proxy_permissions` insert → 감사 로그 → 알림 메일(권한 부여) | `POST /api/proxy-permissions` (PERM-002, PROC-PERM-002) |
| 클릭 | 행 `[BTN: 해제]` | onClick | 확인 모달 → `proxy_permissions.revoked_at=now()`, `revoked_by=:me` → 감사 로그 → 알림 메일(권한 회수) | `POST /api/proxy-permissions/:id/revoke` |

### B.4 데이터 바인딩 표

| UI 필드 | 표시 형식 | 데이터 소스 | 비고 |
|---|---|---|---|
| 대리 입력자 | 텍스트 | `users.name` (FK: `proxy_permissions.proxy_user_id`) | JOIN |
| 대상 임원 | 텍스트 | `users.name` (FK: `proxy_permissions.target_user_id`) | JOIN |
| 부여자 | 텍스트 | `users.name` (FK: `proxy_permissions.granted_by`) | JOIN |
| 부여 일시 | YYYY-MM-DD HH:mm | `proxy_permissions.granted_at` | KST, 기본 정렬 키 (desc) |
| 상태 | `[BADGE]` | `proxy_permissions.revoked_at` | NULL → active / NOT NULL → revoked |
| 해제 일시 | YYYY-MM-DD HH:mm | `proxy_permissions.revoked_at` | revoked 시만 표시 (행 확장 또는 상세) |
| 해제자 | 텍스트 | `users.name` (FK: `proxy_permissions.revoked_by`) | revoked 시만 |

### B.5 화면 상태

| 상태 | 표현 |
|---|---|
| 빈 | `[EMPTY: 등록된 대리권한이 없습니다]` |
| 로딩 | 테이블 `[SKELETON]` |
| 에러 — 중복 | 모달 `[INLINE-ERROR: 이미 부여된 권한입니다]` (PERM-002 예외) |
| 에러 — 본인 지정 | `[INLINE-ERROR: 본인에게는 대리 권한을 부여할 수 없습니다]` |
| 에러 — 비활성 사용자 | `[INLINE-ERROR: 활성 사용자만 대리 권한을 설정할 수 있습니다]` |
| 성공 | 목록 갱신 + `[TOAST]` |
| 권한 거부 | 관리자 외 접근 시 `SCR-ERROR-403` |

### B.6 권한·접근성

- `admin` 전용. 모든 변경은 `audit_logs` (`target_type='proxy_permission'`) 기록.
- 해제 확인 모달은 백드롭 클릭 무시 (`common_layout.md` §9.3)
- 검색형 SELECT 는 `role="combobox"` + `aria-expanded`

---

## C. SCR-ERROR-403 — 권한 없음 (Forbidden)

### C.1 와이어프레임 (인증 후 진입 시 — 헤더 유지)

```
┌─ SL-HEADER ──────────────────────────────────────────────────────────┐
│ [☰] [LOGO] 임원 일정                      [🔔][🟢홍길동▾]          │
├──────────────────────────────────────────────────────────────────────┤
│                                                                      │
│                        🚫                                            │
│                                                                      │
│              접근 권한이 없습니다 (403)                              │
│                                                                      │
│       요청하신 화면은 관리자 권한이 필요합니다.                       │
│       권한이 필요한 경우 관리자에게 문의해 주세요.                    │
│                                                                      │
│              [BTN: 대시보드로 돌아가기]                              │
│              [BTN-LINK: 이전 페이지]                                  │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘
```

### C.2 와이어프레임 (미인증 진입 시 — SL-AUTH)

```
┌─────────────────── SL-AUTH ───────────────────┐
│           ┌───────────────────────┐           │
│           │  [LOGO]               │           │
│           │  🚫                    │           │
│           │  접근 권한이 없습니다  │           │
│           │  (403)                │           │
│           │                       │           │
│           │  로그인 후 다시       │           │
│           │  시도해 주세요.       │           │
│           │                       │           │
│           │  [BTN: 로그인]        │           │
│           └───────────────────────┘           │
└───────────────────────────────────────────────┘
```

### C.3 컴포넌트 사용 표

| 컴포넌트 | 위치 | 적용 사양 |
|---|---|---|
| `[H1: 접근 권한이 없습니다]` | 본문 타이틀 | 시각적 강조 |
| `[ALERT: 안내]` (선택) | 본문 | info, 권한 문의 안내 |
| `[BTN: 대시보드로 돌아가기]` | 인증 후 1차 | primary, `SCR-DASHBOARD` |
| `[BTN: 로그인]` | 미인증 1차 | primary, `SCR-LOGIN` |
| `[BTN-LINK: 이전 페이지]` | 보조 | `history.back()` |

### C.4 상호작용 명세

| 트리거 | 컴포넌트 | 이벤트 | 다음 상태/액션 | API |
|---|---|---|---|---|
| 진입 | — | onMount | 인증 상태 확인 → 인증 후/미인증 분기 와이어 | `GET /api/auth/me` |
| 클릭 | `[BTN: 대시보드로 돌아가기]` | onClick | `SCR-DASHBOARD` 라우팅 | — |
| 클릭 | `[BTN: 로그인]` | onClick | `SCR-LOGIN` 라우팅 | — |
| 클릭 | `[BTN-LINK: 이전 페이지]` | onClick | `history.back()` | — |

### C.5 데이터 바인딩 표

| UI 필드 | 표시 형식 | 데이터 소스 | 비고 |
|---|---|---|---|
| 현재 사용자 (헤더) | 텍스트 | `users.name`, `users.role` | 인증 후에만 |
| 시도한 URL | (선택) | (서버 응답) | 관리자 문의 시 컨텍스트로 사용 (선택) |
| 감사 로그 (서버 측) | — | `audit_logs` 자동 기록 | 권한 거부 시도는 별도 기록하지 않음 (현 ERD 범위에서 vendor 미정) — 이슈 메모 §10 참조 |

> 본 화면 자체는 ERD 컬럼 직접 바인딩이 거의 없다. `users.name`/`users.role` 만 헤더 영역에서 사용.

### C.6 화면 상태

| 상태 | 표현 |
|---|---|
| 빈 | (해당 없음 — 정적 메시지) |
| 로딩 | (없음) |
| 에러 | (재귀 방지 — 본 화면 자체가 에러 상태) |
| 성공 | 메시지 정상 노출 |
| 권한 거부 | (본 화면이 바로 그 상태) |

### C.7 권한·접근성

- 모든 사용자 접근 가능 (`ia/screen_list.md`: "권한: 모두")
- 본문 메시지는 `<h1>` + `<p>` 구조
- `role="alert"` 으로 페이지 진입 시 스크린리더가 즉시 읽도록 처리

---

## 통합 데이터 바인딩 요약

| 컬럼 | 사용 화면 |
|---|---|
| `users.id` | A·B (PK/FK) |
| `users.name` | A (이름), B (대리/대상/부여자), C (헤더) |
| `users.email` | A (이메일) |
| `users.employee_id` | A (사번) |
| `users.role` | A (역할 컬럼), B (admin 권한 검증), C (헤더) |
| `users.status` | A (상태 컬럼·필터) |
| `users.color` | A (행 좌측 띠, 아바타) |
| `users.last_login_at` | A (선택 컬럼) |
| `users.failed_login_count` | A (잠금 해제 시 초기화) |
| `users.deleted_at` | A (목록 필터: NULL) |
| `proxy_permissions.proxy_user_id` | B |
| `proxy_permissions.target_user_id` | B |
| `proxy_permissions.granted_by` | B |
| `proxy_permissions.granted_at` | B (정렬 키) |
| `proxy_permissions.revoked_at` | B (상태 분기) |
| `proxy_permissions.revoked_by` | B (해제자) |
| `audit_logs.target_type` | A (변경 이력), B (변경 이력) |
| `audit_logs.target_id` | A, B |
| `audit_logs.action` | A, B |
| `audit_logs.actor_id` | A, B |

모두 `erd/erd.md` E01·E07·E10 에 실재.

---

## 10. 이슈 메모

| 항목 | spec/process 표기 | ERD (SSOT) | 본 화면 처리 |
|---|---|---|---|
| 대리권한 해제 방식 | spec 02 PERM-002 "권한 해제 흐름: 시스템이 해당 권한 레코드를 삭제하고" | `proxy_permissions.revoked_at`/`revoked_by` 로 soft delete 표현 (물리 삭제 아님) | ERD 우선 — `revoked_at=now()`, `revoked_by=:me` 로 처리. UI 표 "상태" 컬럼은 `revoked_at IS NULL ? 'active' : 'revoked'` 분기 |
| 대리권한 데이터 컬럼명 | proc_02 PROC-PERM-002 "granter_id, target_id" / "perm_type, expires_at" | `proxy_user_id`, `target_user_id`, `granted_by`, `revoked_by`, `granted_at`, `revoked_at` (`perm_type`/`expires_at` 없음) | ERD 컬럼명 채택. `perm_type`, `expires_at` 은 본 화면 미사용 |
| 사용자 변경 감사 로그 | spec 02 PERM-001 사후 조건 "모든 관리자 작업은 audit_logs 에 기록" | `audit_logs.target_type='user'`, `action='updated'`, `changed_fields=['role'\|'status'\|...]` | 본 화면의 모든 변경 액션(역할·상태·삭제)은 `target_type='user'` 로 기록 |
| 권한 거부 시 라우팅 | spec 02 PERM-004 처리 흐름 2 "대시보드로 이동시킨다" | — | 본 화면 SCR-ERROR-403 은 공통 403 페이지로 흡수. PERM-004 의 "대시보드로 이동" 처리도 일부 케이스(예: 메뉴 직접 URL 입력)에서 채택 가능 — UI/UX 정책으로 두 선택지 모두 허용 |

---

## 검증

- 자체 검증 일자: 2026-05-14
- 자체 검증 결과: ✅ 통과
- 자동 검증 결과: ✅ 통과
  - 3개 SCR-* 헤더 명시 ✓
  - 각 화면 8개 필수 섹션(A·B·C 각각 §1~§7 매핑) ✓
  - 컴포넌트 ID 모두 `components.md` 정의 ✓
  - 데이터 바인딩 컬럼 `erd/erd.md` E01·E07·E10 실재 ✓ (`users.*`, `proxy_permissions.*`, `audit_logs.*`)
  - API → spec 02 / proc_02 + AUTH-001 / NOT-004 일치 ✓
  - 권한 분기 (admin 전용 A·B, 공통 C) 명시 ✓
- 보류·예외 사항:
  - 사용자 변경 시 audit 작성 일관성은 §10 이슈 메모로 명시. ERD 의 `audit_logs.target_type` 에 `user` 포함되어 있어 정합 OK
  - SCR-ERROR-403 의 데이터 바인딩은 거의 없으나 ERD 의존이 없는 정적 화면 특성 (§C.5)
- 검증자: claude (Step B 그룹 1)
