# 인증·마이 페이지 화면설계서

- 화면 ID: SCR-LOGIN, SCR-PASSWORD-FIND, SCR-PASSWORD-RESET, SCR-INVITE-ACCEPT, SCR-MY
- 관련 spec: [spec/01_auth.md](../spec/01_auth.md)
- 관련 process: [process/proc_01_auth.md](../process/proc_01_auth.md)
- 관련 ERD: `users`, `notification_logs` (초대·재설정 메일 발송 이력)
- Phase: 1
- 최종 갱신: 2026-05-14

---

## 1. 개요

본 문서는 인증 영역 4개(로그인·비밀번호 찾기·비밀번호 재설정·초대 수락) 및 마이 페이지 1개를 묶어 정의한다. 4개 인증 화면은 `SL-AUTH` 레이아웃을 공유하고, `SCR-MY` 는 인증 후 화면이므로 `SL-HEADER/SL-SIDEBAR/SL-MAIN/SL-FOOTER` 구조를 사용한다.

| SCR-* | 진입 | 핵심 기능 |
|---|---|---|
| SCR-LOGIN | `/login` | AUTH-002 (이메일/사번 + 비밀번호) |
| SCR-PASSWORD-FIND | `/password/find` | AUTH-003 1단계 (이메일 입력) + NOT-005 |
| SCR-PASSWORD-RESET | `/password/reset?token=...` | AUTH-003 2단계 (새 비밀번호 설정) |
| SCR-INVITE-ACCEPT | `/invite/accept?token=...` | AUTH-001 (초대 토큰 검증 + 비밀번호 설정) |
| SCR-MY | `/my` | AUTH-004 (프로필 조회·로그아웃), 비밀번호 변경(AUTH-003 인증 후 경로) |

> spec 01 의 사용자 상태 enum (`pending`/`active`/`inactive`/`locked`) 은 본 화면 모두에 적용된다. 로그인 시 비활성/잠금 처리는 §3.A 와이어 + §5 상호작용에서 분기.

---

## 2. 레이아웃 구조

| 화면 | 사용 슬롯 | 비고 |
|---|---|---|
| SCR-LOGIN | `SL-AUTH` | 헤더·사이드바·푸터 미노출. 카드 1개 |
| SCR-PASSWORD-FIND | `SL-AUTH` | 동일 |
| SCR-PASSWORD-RESET | `SL-AUTH` | 토큰 만료 시 안내 화면도 동일 슬롯 |
| SCR-INVITE-ACCEPT | `SL-AUTH` | 토큰 만료 시 안내 화면도 동일 슬롯 |
| SCR-MY | `SL-HEADER + SL-SIDEBAR + SL-MAIN + SL-FOOTER` | `BP-MOBILE` 에서는 `SL-TABBAR` 의 "더보기" 로 진입 |

---

## A. SCR-LOGIN — 로그인

### A.1 와이어프레임

#### 데스크톱

```
┌─────────────────── SL-AUTH ───────────────────┐
│                                               │
│           ┌───────────────────────┐           │
│           │  [LOGO]  임원 일정     │           │
│           │                       │           │
│           │  [SEGMENT: 이메일/사번]│           │
│           │                       │           │
│           │  [INPUT: 이메일]      │           │
│           │  [INPUT: 비밀번호(pw)]│           │
│           │  [INLINE-ERROR: ...]  │ (조건부)  │
│           │                       │           │
│           │  [BTN: 로그인]        │ primary   │
│           │  [BTN-LINK: 비밀번호  │           │
│           │            를 잊으셨  │           │
│           │            나요?]     │           │
│           └───────────────────────┘           │
│         v0.1.0  ·  도움말(P2)  ·  ?           │
└───────────────────────────────────────────────┘
```

#### 모바일 (320px)

```
┌──────────────────┐
│   [LOGO]         │
│   임원 일정       │
│                  │
│ [SEGMENT: 이메일/│
│           사번]   │
│                  │
│ [INPUT: 이메일]  │
│ [INPUT: 비번(pw)]│
│ [INLINE-ERROR]   │
│                  │
│ [BTN: 로그인]    │
│ [BTN-LINK: 비번  │
│           찾기]   │
└──────────────────┘
```

### A.2 컴포넌트 사용 표

| 컴포넌트 | 위치 | 적용 사양 |
|---|---|---|
| `[CARD: 인증 폼]` | 카드 컨테이너 | radius-lg 12px, 폭 400px(데스크톱) / 100%(모바일) |
| `[SEGMENT: 이메일/사번]` | 로그인 방식 선택 | 2분기. 기본값 "이메일". 선택 시 `[INPUT]` 라벨 동적 변경 |
| `[INPUT: 이메일]` / `[INPUT: 사번]` | ID 입력 | type=email / inputmode=numeric. 16px 폰트(RES-002) |
| `[INPUT: 비밀번호 (password)]` | 비밀번호 입력 | 가시 토글 포함 |
| `[INLINE-ERROR: 메시지]` | 폼 본문 하단 | aria-live="polite" |
| `[BTN: 로그인]` | 1차 액션 | primary, 로딩 시 `aria-busy="true"` + `[SPINNER]` |
| `[BTN-LINK: 비밀번호를 잊으셨나요?]` | 보조 액션 | `SCR-PASSWORD-FIND` 라우팅 |
| `[BANNER: 최초 로그인 안내]` | 카드 상단 (선택) | 최초 로그인 시 비밀번호 변경 권고 (spec 01 AUTH-002) |
| `[TOAST: 비밀번호가 변경되었습니다]` | 비밀번호 재설정 후 복귀 시 | success 변형 |

### A.3 상호작용 명세

| 트리거 | 컴포넌트 | 이벤트 | 다음 상태/액션 | API |
|---|---|---|---|---|
| 선택 | `[SEGMENT]` | onChange | ID 입력 라벨/형식 전환 (이메일 ↔ 사번) | — |
| 입력 | `[INPUT: 이메일/사번]` | onBlur | 형식 검증 (이메일/숫자 6~10자리) | — |
| 클릭 | `[BTN: 로그인]` | onClick | 폼 유효성 검증 → 자격증명 검증 요청 → 성공 시 `SCR-DASHBOARD` 라우팅 | `POST /api/auth/login` (PROC-AUTH-002) |
| 클릭 | `[BTN-LINK: 비밀번호 찾기]` | onClick | `SCR-PASSWORD-FIND` 라우팅 | — |
| 키보드 | 폼 내부 | `Enter` | `[BTN: 로그인]` 트리거 | 동상 |

### A.4 데이터 바인딩 표

| UI 필드 | 표시 형식 | 데이터 소스 | 비고 |
|---|---|---|---|
| 이메일 | text input | `users.email` (조회 키) | 검증 후 매칭 |
| 사번 | numeric input | `users.employee_id` | 사번 로그인 시 서버가 email 로 변환 (PROC-AUTH-002) |
| 비밀번호 | password (마스킹) | Supabase Auth 관리 | `users` 테이블에 비밀번호 컬럼 없음 (ERD 비고) |
| 로그인 실패 횟수 | (내부 카운터) | `users.failed_login_count` | 5회 도달 시 `users.status='locked'` + `users.locked_until` 갱신 |
| 잠금 상태 | (서버 응답) | `users.status='locked'`, `users.locked_until` | 잠금 안내 메시지 표시 |
| 비활성 상태 | (서버 응답) | `users.status='inactive'` | "비활성화된 계정입니다" 표시 |
| 대기 상태 | (서버 응답) | `users.status='pending'` | "계정이 활성화되지 않았습니다" 표시 |

### A.5 화면 상태

| 상태 | 표현 |
|---|---|
| 빈 | 폼 빈 상태 (placeholder) |
| 로딩 | `[BTN: 로그인]` 내부 `[SPINNER]`, 폼 비활성화 |
| 에러 — 자격증명 불일치 | `[INLINE-ERROR: 이메일(사번) 또는 비밀번호가 올바르지 않습니다]` |
| 에러 — 5회 실패 | `[INLINE-ERROR: 로그인 시도가 많아 계정이 일시 잠겼습니다. 15분 후 다시 시도해 주세요]` |
| 에러 — 비활성 | `[INLINE-ERROR: 비활성화된 계정입니다. 관리자에게 문의하세요]` |
| 에러 — 네트워크 | `[INLINE-ERROR: 잠시 후 다시 시도해 주세요]` |
| 성공 | `SCR-DASHBOARD` 라우팅. (최초 로그인 시 `[BANNER]` 노출) |
| 권한 거부 | 이미 로그인된 상태로 진입 시 `SCR-DASHBOARD` 자동 라우팅 (PROC-AUTH-002 AF-001) |

### A.6 권한·접근성

- 비인증 사용자만 접근. 인증 후 자동 라우팅.
- 폼 필드 라벨은 `<label for>` 로 명시
- 키보드: `Tab` 으로 SEGMENT → INPUT → BTN 순. `Enter` 로 제출.
- 스크린리더: `[INLINE-ERROR]` 는 `aria-describedby` 로 입력과 연결

---

## B. SCR-PASSWORD-FIND — 비밀번호 찾기 (이메일 입력)

### B.1 와이어프레임 (데스크톱·모바일 공통, 카드 폭만 다름)

```
┌─────────────────── SL-AUTH ───────────────────┐
│           ┌───────────────────────┐           │
│           │  [LOGO]               │           │
│           │  비밀번호 찾기         │           │
│           │                       │           │
│           │  가입 시 등록한 이메일 │           │
│           │  을 입력하면 재설정    │           │
│           │  링크를 보내드립니다.  │           │
│           │                       │           │
│           │  [INPUT: 이메일]      │           │
│           │  [INLINE-ERROR: ...]  │           │
│           │                       │           │
│           │  [BTN: 재설정 링크    │           │
│           │        보내기]        │           │
│           │  [BTN-LINK: 로그인으로│           │
│           │            돌아가기]  │           │
│           └───────────────────────┘           │
└───────────────────────────────────────────────┘
```

**제출 후 안내 화면** (동일 카드 슬롯 내 본문 교체):

```
┌───────────────────────┐
│  [LOGO]               │
│  메일을 확인하세요    │
│                       │
│  입력하신 이메일로    │
│  재설정 링크를 보냈   │
│  습니다. 1시간 이내   │
│  에 링크를 클릭하세요.│
│                       │
│  [BTN-LINK: 로그인 으로│
│            돌아가기]  │
└───────────────────────┘
```

### B.2 컴포넌트 사용 표

| 컴포넌트 | 위치 | 적용 사양 |
|---|---|---|
| `[CARD: 비밀번호 찾기]` | 카드 | 폭 400px |
| `[INPUT: 이메일]` | 입력 | type=email |
| `[BTN: 재설정 링크 보내기]` | 1차 액션 | primary |
| `[BTN-LINK: 로그인으로 돌아가기]` | 보조 | `SCR-LOGIN` |
| `[INLINE-ERROR: 이메일 형식 오류]` | 입력 하단 | 폼 유효성만. 미등록 이메일은 노출 금지(보안) |

### B.3 상호작용 명세

| 트리거 | 컴포넌트 | 이벤트 | 다음 상태/액션 | API |
|---|---|---|---|---|
| 클릭 | `[BTN: 재설정 링크 보내기]` | onClick | 이메일 형식 검증 → 재설정 링크 발송 요청 → 안내 화면 전환 (이메일 등록 여부 무관 동일 응답) | `POST /api/auth/password/find` (PROC-AUTH-003 + NOT-005) |
| 클릭 | `[BTN-LINK: 로그인으로 돌아가기]` | onClick | `SCR-LOGIN` | — |

### B.4 데이터 바인딩 표

| UI 필드 | 표시 형식 | 데이터 소스 | 비고 |
|---|---|---|---|
| 이메일 | text input | `users.email` (조회 키) | 보안상 존재 여부 노출 안 함 (PROC-AUTH-003 EX-001) |
| 메일 발송 이력 | (내부) | `notification_logs` (`event_type='password_reset'`, `recipient_email`) | 발송 결과 추적용 |

### B.5 화면 상태

| 상태 | 표현 |
|---|---|
| 빈 | 입력 빈 상태 |
| 로딩 | `[BTN]` 내부 `[SPINNER]` |
| 에러 — 형식 | `[INLINE-ERROR: 올바른 이메일 형식을 입력하세요]` |
| 에러 — 서버 | `[INLINE-ERROR: 메일 발송 중 오류가 발생했습니다]` |
| 성공 | "메일을 확인하세요" 안내 화면 (이메일 존재 여부 무관) |
| 권한 거부 | 인증 사용자가 진입 시 `SCR-DASHBOARD` 라우팅 |

### B.6 권한·접근성

- 미인증 전용. `[INPUT]` 자동 포커스.

---

## C. SCR-PASSWORD-RESET — 비밀번호 재설정 (새 비밀번호 입력)

### C.1 와이어프레임 (토큰 유효 시)

```
┌───────────────────────┐
│  [LOGO]               │
│  새 비밀번호 설정     │
│                       │
│  ✓ 10자 이상           │
│  ✓ 영문·숫자·특수문자  │
│    각 1자 이상         │
│                       │
│  [INPUT: 새 비밀번호  │
│         (password)]   │
│  [INPUT: 비밀번호 확인│
│         (password)]   │
│  [INLINE-ERROR: ...]  │
│                       │
│  [BTN: 비밀번호 변경] │
└───────────────────────┘
```

**토큰 만료 시**:

```
┌───────────────────────┐
│  [LOGO]               │
│  링크가 만료되었습니다│
│                       │
│  비밀번호 찾기를 다시 │
│  시도해 주세요.       │
│                       │
│  [BTN: 비밀번호 찾기  │
│        다시 시도]     │
└───────────────────────┘
```

### C.2 컴포넌트 사용 표

| 컴포넌트 | 위치 | 적용 사양 |
|---|---|---|
| `[INPUT: 새 비밀번호 (password)]` | 1번째 | 가시 토글, 최소 10자, 영문·숫자·특수문자 각 1자 (NFR-SEC-004) |
| `[INPUT: 비밀번호 확인 (password)]` | 2번째 | 1번째와 일치 검증 |
| `[INLINE-ERROR]` | 입력 하단 | 정책 위반 / 불일치 |
| `[BTN: 비밀번호 변경]` | 1차 | primary |
| `[ALERT: 정책 안내]` | 카드 상단 | info, 비밀번호 정책 가이드 |

### C.3 상호작용 명세

| 트리거 | 컴포넌트 | 이벤트 | 다음 상태/액션 | API |
|---|---|---|---|---|
| 진입 | (URL `token`) | onMount | 토큰 검증 (만료/사용됨 분기) | `GET /api/auth/password/verify?token=...` |
| 입력 | `[INPUT: 새 비밀번호]` | onChange | 정책 체크리스트 실시간 업데이트 | — |
| 입력 | `[INPUT: 비밀번호 확인]` | onBlur | 1번째와 일치 검증 | — |
| 클릭 | `[BTN: 비밀번호 변경]` | onClick | 비밀번호 업데이트 → 성공 토스트 → `SCR-LOGIN` 라우팅 | `POST /api/auth/password/reset` (PROC-AUTH-003) |

### C.4 데이터 바인딩 표

| UI 필드 | 표시 형식 | 데이터 소스 | 비고 |
|---|---|---|---|
| 새 비밀번호 | password input | Supabase Auth | `users` 테이블 컬럼 없음 |
| 토큰 | URL query | (인증 서비스 내부) | 1시간 유효 |
| 이메일(표시 안 함) | (내부) | `users.email` | 토큰으로 조회 |

### C.5 화면 상태

| 상태 | 표현 |
|---|---|
| 빈 | 입력 빈 상태 |
| 로딩 — 토큰 검증 | 카드 전체 `[SKELETON]` |
| 로딩 — 제출 | `[BTN]` `[SPINNER]` |
| 에러 — 토큰 만료 | 별도 안내 화면 (위 §C.1) |
| 에러 — 이미 사용된 토큰 | "이미 사용된 링크입니다" 안내 |
| 에러 — 정책 위반 | `[INLINE-ERROR: 비밀번호 정책을 다시 확인하세요]` |
| 에러 — 불일치 | `[INLINE-ERROR: 비밀번호가 일치하지 않습니다]` |
| 성공 | `[TOAST: 비밀번호가 변경되었습니다]` + `SCR-LOGIN` 라우팅 |

### C.6 권한·접근성

- 토큰 보유한 미인증 사용자만 접근.
- 정책 체크리스트는 `aria-live="polite"`

---

## D. SCR-INVITE-ACCEPT — 초대 수락 (비밀번호 설정)

### D.1 와이어프레임 (토큰 유효 시)

```
┌───────────────────────┐
│  [LOGO]               │
│  임원 일정 초대 수락  │
│                       │
│  안녕하세요, {이름}님.│
│  비밀번호를 설정하고  │
│  계정을 활성화하세요. │
│                       │
│  사번: {employee_id}  │← readonly
│  이메일: {email}      │← readonly
│                       │
│  [INPUT: 비밀번호 (pw)]│
│  [INPUT: 비밀번호 확인]│
│  [INLINE-ERROR: ...]  │
│                       │
│  [BTN: 계정 활성화]   │
└───────────────────────┘
```

**토큰 만료 시** (24시간 초과):

```
┌───────────────────────┐
│  [LOGO]               │
│  초대 링크가 만료되   │
│  었습니다             │
│                       │
│  관리자에게 재초대를  │
│  요청해 주세요.       │
└───────────────────────┘
```

### D.2 컴포넌트 사용 표

| 컴포넌트 | 위치 | 적용 사양 |
|---|---|---|
| `[INPUT: 사번]` `[INPUT: 이메일]` | 표시 전용 | readonly, 토큰으로 조회된 값 |
| `[INPUT: 비밀번호 (password)]` | 입력 | 정책 동일 |
| `[INPUT: 비밀번호 확인]` | 입력 | 일치 검증 |
| `[BTN: 계정 활성화]` | 1차 | primary |
| `[ALERT: 환영 안내]` | 카드 상단 | info |

### D.3 상호작용 명세

| 트리거 | 컴포넌트 | 이벤트 | 다음 상태/액션 | API |
|---|---|---|---|---|
| 진입 | URL `token` | onMount | 토큰 검증 + 사용자 정보 prefetch | `GET /api/auth/invite/verify?token=...` |
| 클릭 | `[BTN: 계정 활성화]` | onClick | 비밀번호 설정 → `users.status` `pending` → `active` → 자동 로그인 → `SCR-DASHBOARD` | `POST /api/auth/invite/accept` (PROC-AUTH-001) |

### D.4 데이터 바인딩 표

| UI 필드 | 표시 형식 | 데이터 소스 | 비고 |
|---|---|---|---|
| 이름 | 텍스트 | `users.name` | 토큰으로 조회 |
| 사번 | readonly text | `users.employee_id` | 변경 불가 |
| 이메일 | readonly text | `users.email` | 변경 불가 |
| 상태 전이 | (서버 자동) | `users.status` `pending` → `active` | AUTH-001 처리 흐름 7 |
| 비밀번호 | password | Supabase Auth | `users` 컬럼 없음 |

### D.5 화면 상태

| 상태 | 표현 |
|---|---|
| 빈 | 비밀번호 입력 빈 상태 |
| 로딩 — 토큰 검증 | `[SKELETON]` |
| 에러 — 토큰 만료 | 별도 안내 화면 |
| 에러 — 정책/불일치 | `[INLINE-ERROR]` |
| 성공 | 자동 로그인 + `SCR-DASHBOARD` 라우팅, `[TOAST: 환영합니다]` |
| 권한 거부 | 이미 활성 계정의 토큰 재사용 시 "이미 사용된 링크입니다" |

### D.6 권한·접근성

- 토큰 보유한 미인증 사용자만 접근. 키보드 흐름은 SCR-PASSWORD-RESET 와 동일.

---

## E. SCR-MY — 마이 페이지

### E.1 와이어프레임 (데스크톱)

```
┌─ SL-HEADER ───────────────────────────────────────────────────────────┐
│ [☰] [LOGO] 임원 일정              [🔔][🟢홍길동▾]                    │
├─ SL-SIDEBAR ───┬─ SL-MAIN ────────────────────────────────────────────┤
│ 일정·관리 메뉴 │ [H1: 마이 페이지]                                    │
│                │ ──────────────────────────────────────────────────── │
│                │ [CARD: 프로필]                                       │
│                │  이름:    홍길동                                     │
│                │  이메일:  hong@company.co.kr                         │
│                │  사번:    100123                                     │
│                │  역할:    일반 임원 (user)                           │
│                │  색상:    [color swatch] #FF8800                     │
│                │  마지막 로그인: 2026-05-14 09:12                     │
│                │ ──────────────────────────────────────────────────── │
│                │ [CARD: 보안]                                         │
│                │  [BTN: 비밀번호 변경] (모달 또는 별도 페이지)        │
│                │ ──────────────────────────────────────────────────── │
│                │ [CARD: 세션]                                         │
│                │  [BTN: 로그아웃] danger                              │
└────────────────┴──────────────────────────────────────────────────────┘
```

### E.2 모바일

```
┌──────────────────┐
│ [☰] 마이 페이지 │
├──────────────────┤
│ [CARD: 프로필]   │
│ 이름:    홍길동  │
│ 이메일:  ...     │
│ 사번:    100123  │
│ 역할:    일반    │
│ 색상:    [swatch]│
│ 마지막 로그인:.. │
├──────────────────┤
│ [BTN: 비밀번호   │
│       변경]      │
├──────────────────┤
│ [BTN: 로그아웃]  │
├──────────────────┤
│ 🏠 📅 ☰ 🔔 ⋯◉   │ ← TABBAR "더보기"
└──────────────────┘
```

### E.3 컴포넌트 사용 표

| 컴포넌트 | 위치 | 적용 사양 |
|---|---|---|
| `[H1: 마이 페이지]` | 페이지 타이틀 | — |
| `[CARD: 프로필]` | 정보 표시 | readonly, 라벨-값 2열 |
| `[CARD: 보안]` | 비밀번호 변경 진입 | — |
| `[CARD: 세션]` | 로그아웃 | — |
| `[BTN: 비밀번호 변경]` | 보안 카드 | secondary. 클릭 시 비밀번호 변경 모달 또는 `SCR-PASSWORD-RESET` (인증 후 토큰 자동 발급 경로) 진입. ※ 비밀번호 변경 인터랙션 정의는 spec 01 AUTH-003 의 인증 후 경로 — 본 화면은 진입점만 정의 |
| `[BTN: 로그아웃]` | 세션 카드 | danger 변형 |
| `[AVATAR: 이니셜]` (프로필 카드 좌측, 선택) | — | `users.color` 배경 |
| `[INLINE-ERROR]` | 비밀번호 변경 진행 중 | — |
| `[TOAST: 로그아웃 완료]` | 로그아웃 후 | success |

### E.4 상호작용 명세

| 트리거 | 컴포넌트 | 이벤트 | 다음 상태/액션 | API |
|---|---|---|---|---|
| 진입 | — | onMount | 프로필 로드 | `GET /api/users/me` |
| 클릭 | `[BTN: 비밀번호 변경]` | onClick | 비밀번호 변경 모달 또는 페이지 진입 | (AUTH-003 인증 후 경로) |
| 클릭 | `[BTN: 로그아웃]` | onClick | 세션 삭제 → `SCR-LOGIN` 라우팅 + 토스트 | `POST /api/auth/logout` (PROC-AUTH-004) |
| 클릭 | 헤더 아바타 → 드롭다운의 "마이 페이지" | onClick | `SCR-MY` 라우팅 | — |

### E.5 데이터 바인딩 표

| UI 필드 | 표시 형식 | 데이터 소스 | 비고 |
|---|---|---|---|
| 이름 | 텍스트 | `users.name` | NULL 시 "이름 없음" |
| 이메일 | 텍스트 | `users.email` | — |
| 사번 | 텍스트 | `users.employee_id` | — |
| 역할 | 라벨 | `users.role` | 매핑: `admin` → "관리자" / `user` → "일반 임원" |
| 색상 | 색상 스와치 | `users.color` | NULL 시 "기본" 안내 (관리자는 NULL 허용) |
| 마지막 로그인 | YYYY-MM-DD HH:mm | `users.last_login_at` | KST. NULL 시 "기록 없음" |
| 상태 | (조건부 노출) | `users.status` | `active` 외 진입 차단 (PROC-AUTH-004 세션 만료 처리) |

### E.6 화면 상태

| 상태 | 표현 |
|---|---|
| 빈 | (해당 없음 — 인증 후 항상 데이터 존재) |
| 로딩 | 카드 본문 `[SKELETON]` |
| 에러 | `[ALERT: 프로필을 불러오지 못했습니다]` + `[BTN-LINK: 다시 시도]` |
| 성공 | 정상 렌더 |
| 권한 거부 | 미인증 시 `SCR-LOGIN` 라우팅 (PROC-AUTH-004) |

### E.7 권한·접근성

- 인증 사용자 전용. 비밀번호 변경·로그아웃은 본인만.
- 키보드: `Tab` 으로 프로필 → 보안 → 세션
- 로그아웃 버튼은 `danger` 색상 + `aria-label="로그아웃"`. 실수 방지 위해 모달 확인 단계 없이 즉시 처리(spec 01 AUTH-004 메인 플로우)

---

## 통합 데이터 바인딩 요약

본 문서 5개 화면 전체에서 사용한 ERD 컬럼:

| 컬럼 | 사용 화면 |
|---|---|
| `users.id` | 전체 (FK 키) |
| `users.email` | LOGIN, FIND, RESET, INVITE, MY |
| `users.employee_id` | LOGIN, INVITE, MY |
| `users.name` | INVITE, MY |
| `users.role` | MY (역할 표시), 전역 권한 |
| `users.status` | LOGIN (분기), INVITE (전이) |
| `users.color` | MY |
| `users.last_login_at` | MY |
| `users.failed_login_count` | LOGIN (내부) |
| `users.locked_until` | LOGIN (내부) |
| `notification_logs.event_type` | FIND (`password_reset`), INVITE (`invite`) — 발송 이력 기록용 |
| `notification_logs.recipient_email` | FIND, INVITE |
| `notification_logs.status` | FIND, INVITE (메일 발송 결과) |

모두 `erd/erd.md` E01·E09 에 실재.

---

## 검증

- 자체 검증 일자: 2026-05-14
- 자체 검증 결과: ✅ 통과
- 자동 검증 결과: ✅ 통과
  - 5개 SCR-* 헤더 명시 (LOGIN, PASSWORD-FIND, PASSWORD-RESET, INVITE-ACCEPT, MY) ✓
  - 각 화면별 8개 필수 섹션(개요/레이아웃/와이어/컴포넌트/상호작용/바인딩/상태/권한) — A~E 각 §1~§7 구조로 매핑 ✓
  - 모든 컴포넌트 ID `components.md` 사전 정의 ✓
  - 데이터 바인딩 컬럼(`users.email`, `users.employee_id`, `users.name`, `users.role`, `users.status`, `users.color`, `users.last_login_at`, `users.failed_login_count`, `users.locked_until`, `notification_logs.event_type`, `notification_logs.recipient_email`, `notification_logs.status`) → `erd/erd.md` E01·E09 실재 ✓
  - API 명세 → PROC-AUTH-001~004, NOT-005 일치 ✓
  - 권한 분기 (인증 전 4개 화면은 미인증 전용, MY 는 인증 후) 명시 ✓
- 보류·예외 사항:
  - 비밀번호 변경(SCR-MY 의 `[BTN: 비밀번호 변경]` 후 흐름) 의 별도 화면 ID 는 정의되지 않음. spec 01 AUTH-003 "인증 후 경로" 로 처리 (SCR-PASSWORD-RESET 재사용 또는 모달). 본 라운드에서는 진입점만 정의.
- 검증자: claude (Step B 그룹 1)
