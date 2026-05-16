# 멘션 및 연락처 관리 화면설계서

- 화면 ID: SCR-CONTACT, SCR-CONTACT-COMPANY, SCR-MODAL-MENTION-NEW-CONTACT
- 관련 spec: [spec/04_mention_contact.md](../spec/04_mention_contact.md)
- 관련 process: [process/proc_04_mention_contact.md](../process/proc_04_mention_contact.md)
- 관련 ERD: `contacts`, `companies`, `mentions`, `users`
- Phase: 2 (CON-* 기능군, MEN-002 자동 등록 미니 다이얼로그 포함)
- 최종 갱신: 2026-05-14

---

## 1. 개요

본 화면설계서는 다음 3개 IA 화면을 단일 라우트 (`/contacts`) 위에서 다룬다.

| SCR-* | 역할 | 진입 |
|---|---|---|
| `SCR-CONTACT` | 개인 연락처 목록·CRUD (CON-001~004) | 사이드바 "데이터 > 연락처" (admin), URL/멘션 칩 진입 (user 조회) |
| `SCR-CONTACT-COMPANY` | 회사 목록·CRUD (CON-005) | 동일 라우트 내 탭 전환 |
| `SCR-MODAL-MENTION-NEW-CONTACT` | @멘션 자동완성 검색 0건 → 새 연락처/회사 자동 등록 미니 다이얼로그 (MEN-002) | `SCR-MODAL-SCHEDULE-FORM`의 `[MENTION]` 컴포넌트에서 "새로 등록" 선택 시 |

연락처/회사는 단일 페이지의 **`[TABS]`** 로 좌우 전환한다. 새 연락처 자동 등록 모달은 별도 진입점이며, 본 페이지가 아닌 일정 등록 폼에서 호출된다.

**권한 매트릭스 (PERM-004)**

| 권한 | 메뉴 노출 | 조회 | 등록·수정·삭제 | "미확인만" 필터 |
|---|:-:|:-:|:-:|:-:|
| 미인증 | ❌ | ❌ | ❌ | ❌ |
| `user` (일반 임원) | ❌ (URL/멘션 진입 시만 본문 렌더) | ✅ (논리 삭제 제외) | ❌ (액션 버튼 미노출) | ❌ |
| `admin` | ✅ | ✅ | ✅ | ✅ |

---

## 2. 레이아웃 구조

| 슬롯 | 사용 |
|---|---|
| `SL-HEADER` | 공통 헤더 |
| `SL-SIDEBAR` | "데이터 > 연락처/회사" 메뉴 활성 (admin), user 는 미노출 |
| `SL-MAIN` | 페이지 헤더 + `[TABS: 연락처 / 회사]` + 도구바 + `[TABLE]` |
| `SL-FOOTER` | 공통 푸터 |
| `SL-OVERLAY` | 등록/수정 모달, 삭제 확인 모달, MEN-002 미니 다이얼로그 |
| `SL-TABBAR` (모바일) | "더보기" 메뉴 안에 위치 (admin), user 는 노출되지 않음 |

---

## 3. 와이어프레임

### 3.1 SCR-CONTACT (개인 연락처) — 데스크톱 / admin

```
┌─ SL-HEADER ────────────────────────────────────────────────────────┐
│ [☰] 임원 일정                          [🔔3] [🟢홍길동 ▾]            │
├─ SL-SIDEBAR ─┬─ SL-MAIN ────────────────────────────────────────────┤
│ 일정          │ [H1: 연락처 관리]                  [BTN: + 새 연락처] │
│ ├ 대시보드    │ ─────────────────────────────────────────────────── │
│ ├ 달력        │ [TABS: 연락처 (활성) / 회사]                          │
│ └ 리스트      │ ─────────────────────────────────────────────────── │
│ 협업          │ [SEARCH: 이름·소속·직책 검색]   [SELECT: 소속 회사 ▾]│
│ └ 모임레이더  │ [CHECKBOX: 미확인 항목만 (admin)]                    │
│ 데이터        │ ─────────────────────────────────────────────────── │
│ ▶ 연락처      │ [TABLE]                                              │
│   회사        │ ┌───────────────────────────────────────────────────┐ │
│ 관리자        │ │이름   소속회사  직책  등록방식  등록일      액션  │ │
│ ├ 사용자      │ ├───────────────────────────────────────────────────┤ │
│ ├ 공휴일      │ │홍길동 삼성전자  부장  수동       2026-04-01 ⋮     │ │
│ └ 알림 로그   │ │이영희 LG전자    과장  자동[BADGE:미확인] 2026-04-08 ⋮ │ │
│               │ │박철수 [—]      —    자동[BADGE:미확인] 2026-04-09 ⋮ │ │
│               │ │... (N건)                                          │ │
│               │ └───────────────────────────────────────────────────┘ │
│               │                                                       │
│               │ [PAGINATION: 1 2 3 ... 12 →]      총 234건            │
│ [BTN:+일정]   │                                                       │
└───────────────┴───────────────────────────────────────────────────────┘
```

### 3.2 SCR-CONTACT (개인 연락처) — 데스크톱 / user (조회 전용)

```
┌─ SL-MAIN ────────────────────────────────────────────────────────────┐
│ [H1: 연락처]                                       ※ 1차 액션 없음    │
│ ─────────────────────────────────────────────────────────────────── │
│ [TABS: 연락처 (활성) / 회사]                                          │
│ ─────────────────────────────────────────────────────────────────── │
│ [SEARCH: 이름·소속·직책 검색]   [SELECT: 소속 회사 ▾]                 │
│ (※ "미확인 항목만" 체크박스 미노출, 행 액션 ⋮ 미노출)                  │
│ ─────────────────────────────────────────────────────────────────── │
│ [TABLE: 이름 / 소속회사 / 직책 / 등록방식 / 등록일]   액션 컬럼 미노출 │
│ [PAGINATION]                                                         │
└──────────────────────────────────────────────────────────────────────┘
```

### 3.3 SCR-CONTACT-COMPANY (회사) — 데스크톱 / admin

```
┌─ SL-MAIN ────────────────────────────────────────────────────────────┐
│ [H1: 연락처 관리]                                 [BTN: + 새 회사]    │
│ ─────────────────────────────────────────────────────────────────── │
│ [TABS: 연락처 / 회사 (활성)]                                          │
│ ─────────────────────────────────────────────────────────────────── │
│ [SEARCH: 회사명·별칭 검색]                                            │
│ ─────────────────────────────────────────────────────────────────── │
│ [TABLE]                                                              │
│ ┌────────────────────────────────────────────────────────────────┐  │
│ │회사명     별칭                  소속연락처  등록방식  등록일 액션│  │
│ ├────────────────────────────────────────────────────────────────┤  │
│ │삼성전자   [CHIP:Samsung][CHIP:SEC]  5명     수동   2026-01-01 ⋮ │  │
│ │LG전자     [CHIP:LG]                 3명     수동   2026-01-05 ⋮ │  │
│ │미상회사   —                        0명     자동[BADGE:미확인] ⋮│  │
│ │... (N건)                                                       │  │
│ └────────────────────────────────────────────────────────────────┘  │
│ [PAGINATION]                                                         │
└──────────────────────────────────────────────────────────────────────┘
```

### 3.4 등록/수정 모달 (CON-001/CON-002) — 데스크톱

```
                ┌─ MODAL ─────────────────────────────┐
                │  새 연락처 (또는 연락처 수정)    [×]│
                │  ─────────────────────────────────  │
                │  이름 *           [INPUT: 이름     ]│
                │  소속 회사        [SELECT: 회사  ▾]│
                │  직책             [INPUT: 직책     ]│
                │  이메일           [INPUT: 이메일   ]│
                │  전화번호         [INPUT: 전화번호 ]│
                │  (수정 시: [BADGE: 미확인 - 자동 등록])│
                │  ─────────────────────────────────  │
                │                  [BTN: 취소][BTN: 저장] │
                └─────────────────────────────────────┘
```

### 3.5 회사 등록/수정 모달 (CON-005)

```
                ┌─ MODAL ─────────────────────────────┐
                │  새 회사 (또는 회사 수정)        [×]│
                │  ─────────────────────────────────  │
                │  회사명 *         [INPUT: 회사명   ]│
                │  별칭             [INPUT: 별칭 입력 (Enter/쉼표) ]│
                │                  [CHIP:Samsung ×][CHIP:SEC ×][CHIP:삼성 ×] │
                │  [INLINE-ERROR: "다른 회사([LG전자])의 별칭과 중복" — 발생 시] │
                │  ─────────────────────────────────  │
                │                  [BTN: 취소][BTN: 저장]│
                └─────────────────────────────────────┘
```

### 3.6 삭제 확인 모달 (CON-003 / CON-005 삭제) — 회사 삭제는 소속 연락처 경고 포함

```
                ┌─ MODAL ─────────────────────────────┐
                │  연락처 삭제                     [×]│
                │  ─────────────────────────────────  │
                │  '홍길동'을 삭제하면 해당 연락처를  │
                │  멘션한 기존 일정에서 이름이 표시   │
                │  되지 않을 수 있습니다.             │
                │  삭제하시겠습니까?                  │
                │  (회사 삭제 시: "이 회사를 소속으로 │
                │   하는 연락처 N명이 있습니다.")     │
                │  ─────────────────────────────────  │
                │           [BTN: 취소][BTN: 삭제 (danger)] │
                └─────────────────────────────────────┘
```

### 3.7 SCR-MODAL-MENTION-NEW-CONTACT — 미니 다이얼로그 (MEN-002)

```
        ┌─ MODAL (max-width 480px) ──────────────┐
        │  새 항목으로 등록: "@박철수"        [×]│
        │  ───────────────────────────────────── │
        │  유형 선택                              │
        │  ( ) 개인 연락처로 등록                  │
        │  ( ) 회사로 등록                         │
        │                                         │
        │  이름/회사명 *  [INPUT: 박철수 (편집가능)] │
        │  [INLINE-ERROR: "이미 등록된 ..." 시]    │
        │  ───────────────────────────────────── │
        │  ※ 등록 후 멘션 칩에 (미확인) 배지 표시  │
        │  ───────────────────────────────────── │
        │              [BTN: 취소][BTN: 등록]      │
        └─────────────────────────────────────────┘
```

### 3.8 모바일 (BP-MOBILE) — SCR-CONTACT

```
┌─ SL-HEADER ──────────────────┐
│ [☰] 연락처          [🔔3]    │
├──────────────────────────────┤
│ [SEGMENT: 연락처 / 회사]      │
│ [SEARCH: 검색]                │
│ (admin: [BTN: + 새 연락처]    │
│         [CHECKBOX: 미확인만]) │
├──────────────────────────────┤
│ [LIST]                        │
│ ─ 홍길동                      │
│   삼성전자 · 부장   [⋮]       │
│ ─ 이영희 [BADGE:미확인]       │
│   LG전자 · 과장     [⋮]       │
│ ─ ... (스크롤)                │
├──────────────────────────────┤
│ [PAGINATION: 더보기]          │
├─ SL-TABBAR ─────────────────-┤
│ 🏠 📅 ☰ 🔔 ⋯                │
└──────────────────────────────┘
```

### 3.9 상태별 와이어 (요약)

- 빈 상태 (CON-004 결과 0건): `[EMPTY: "검색 결과가 없습니다 / [BTN: 필터 초기화]"]`
- 로딩: `[SKELETON]` 행 5개 (테이블 자리)
- 에러 (조회 실패): `[ALERT: "연락처를 불러오지 못했습니다 / [BTN: 재시도]"]`
- 권한 거부 (user 가 액션 시도): 액션 버튼 자체가 노출되지 않음. 서버 차단 시 `[TOAST: "관리자만 등록할 수 있습니다"]`

---

## 4. 컴포넌트 사용 표

| 컴포넌트 ID | 본 화면 적용 |
|---|---|
| `[TABS: 연락처 / 회사]` | 상단 좌우 전환. 활성 탭 색상 강조 |
| `[H1: 연락처 관리]` | 페이지 타이틀 |
| `[SEARCH: 이름·소속·직책 검색]` | CON-004 통합 검색 (debounce 300ms) |
| `[SELECT: 소속 회사 ▾]` | 회사 필터, 옵션은 `companies.name` 정렬 |
| `[CHECKBOX: 미확인 항목만]` | admin 전용. `contacts.status='auto'` 필터 |
| `[BTN: + 새 연락처] / [BTN: + 새 회사]` | primary, admin 전용 |
| `[TABLE]` | 행 hover 시 액션 노출. 정렬 헤더는 `aria-sort` |
| `[MENU: 행 액션]` | `⋮` → 수정·삭제 (admin) |
| `[BADGE: 미확인]` | `contacts.is_auto_registered=true AND status='auto'` 시 |
| `[BADGE: 미확인 - 자동 등록]` | 수정 모달 상단 배지 |
| `[TAG]` | 등록 방식 표시 (수동/자동) |
| `[CHIP: alias]` | 회사 별칭 (removable variant), `companies.aliases` 각 원소 |
| `[MODAL]` | 등록·수정·삭제 확인·MEN-002 미니 다이얼로그 |
| `[INPUT: 이름/회사명/직책/이메일/전화/별칭]` | CON-001/002/005 폼 |
| `[RADIO: 유형 선택]` | MEN-002 다이얼로그 (개인/회사) |
| `[INLINE-ERROR]` | 중복·유효성 오류 |
| `[PAGINATION]` | 기본 20건/페이지, 최대 100 |
| `[TOAST]` | 저장·삭제·등록 완료 알림 |
| `[EMPTY]` | 0건 빈 상태 |
| `[SKELETON]` | 로딩 |
| `[ALERT]` | 조회 실패 |
| `[SEGMENT: 연락처 / 회사]` | 모바일 탭 대체 |
| `[LIST]` | 모바일 카드 리스트 |
| `[BTN-ICON: ×]` | 모달 닫기 |

신규 컴포넌트 추가 없음. 모두 `components.md` §1~§6 에 정의됨.

---

## 5. 상호작용 명세

| 트리거 | 컴포넌트 | 이벤트 | 다음 상태/액션 | API (spec/process) |
|---|---|---|---|---|
| 페이지 진입 | — | 초기 로드 | `[TABS]` 기본 "연락처" 활성, CON-004 조회 (page=1, size=20) | CON-004 |
| 탭 전환 | `[TABS]` | onChange("회사") | 회사 목록 조회, URL `?tab=company` | CON-005 (조회) |
| 검색어 입력 | `[SEARCH]` | onChange (300ms debounce) | `contacts.name`·`contacts.title`·`companies.name` 부분 일치 재조회 | CON-004 |
| 회사 필터 변경 | `[SELECT: 소속 회사]` | onChange | `contacts.company_id=?` 적용 후 재조회 | CON-004 |
| "미확인만" 체크 | `[CHECKBOX]` | onChange | `contacts.status='auto'` 필터 추가, admin only | CON-004 |
| 행 클릭 | `[TABLE]` 행 | onRowClick | 상세 미리보기 (Phase 2 디테일) — 1차에서는 액션 ⋮ 만 | — |
| `+ 새 연락처` 클릭 | `[BTN]` | onClick | 등록 모달 오픈 (admin only) | CON-001 |
| `+ 새 회사` 클릭 | `[BTN]` | onClick | 회사 등록 모달 오픈 (admin only) | CON-005 |
| 모달 "저장" 클릭 | `[BTN]` | onClick | 유효성(이름 1~50자, 이메일 형식) → 저장 → `[TOAST: 등록 완료]` | CON-001/CON-002/CON-005 |
| 이름 onBlur | `[INPUT: 이름]` | onBlur | 실시간 중복 검사 → 동명일 시 `[INLINE-ERROR: "이미 등록된 이름입니다"]` | CON-001 |
| 별칭 입력 Enter/쉼표 | `[INPUT: 별칭]` | onKeyDown | `[CHIP: alias]` 생성, 타사 별칭 중복 시 `[INLINE-ERROR]` | CON-005 |
| 별칭 칩 × | `[CHIP]` (removable) | onRemove | 배열에서 제거 | CON-005 |
| 행 ⋮ → 수정 | `[MENU]` | onSelect | 수정 모달 오픈 (값 prefill). 자동 등록건은 `[BADGE: 미확인 - 자동 등록]` | CON-002 |
| 행 ⋮ → 삭제 | `[MENU]` | onSelect | 삭제 확인 모달 오픈 | CON-003/CON-005 |
| 삭제 모달 "삭제" | `[BTN: danger]` | onClick | 논리 삭제 → 행 제거 → `[TOAST: 삭제 완료]`. 멘션 표시는 `[삭제된 연락처]` | CON-003 |
| 회사 삭제 시 소속 N명 있음 | — | 모달 표시 시 경고 | "이 회사를 소속으로 하는 연락처 N명이 있습니다…" 경고 + 진행 | CON-005 |
| `Esc` | `[MODAL]` | onKeyDown | 모달 닫기 (확인 모달은 백드롭 클릭 무시, ESC 만 허용) | — |
| (MEN-002) 일정 폼에서 "새로 등록" | `[BTN]` (멘션 드롭다운 내) | onClick | `SCR-MODAL-MENTION-NEW-CONTACT` 오픈 | MEN-002 |
| MEN-002 "등록" | `[BTN]` | onClick | 중복 검사 → 신규 저장 (`contacts.status='auto'`, `is_auto_registered=true`) → 멘션 칩 반영 → 관리자 알림 발송 | MEN-002 + PROC-MEN-002 |
| MEN-002 중복 감지 | — | — | "기존 [이름]과 연결됩니다" 안내 후 기존 ID 재사용 | MEN-002 |

---

## 6. 데이터 바인딩 표

### 6.1 SCR-CONTACT 테이블

| UI 필드 | 표시 형식 | 데이터 소스 | 비고 |
|---|---|---|---|
| 이름 | 텍스트 | `contacts.name` | 1~50자 |
| 소속 회사 | 텍스트 | `companies.name` (조인: `contacts.company_id`) | NULL 시 "—" |
| 직책 | 텍스트 | `contacts.title` | NULL 시 "—" |
| 등록 방식 | `[TAG: 수동 / 자동]` | `contacts.is_auto_registered` | true→자동 |
| 미확인 배지 | `[BADGE: 미확인]` | `contacts.status = 'auto'` | — |
| 등록일 | YYYY-MM-DD | `contacts.created_at` | KST |
| (수정 모달 필드) 이메일 | 텍스트 | `contacts.email` | 최대 100자 |
| (수정 모달 필드) 전화 | 텍스트 | `contacts.phone` | 최대 20자 |
| (필터) 소속 회사 옵션 | drop-down | `SELECT id, name FROM companies WHERE deleted_at IS NULL` | — |
| (필터) 미확인만 | 체크박스 | `contacts.status = 'auto'` AND `contacts.deleted_at IS NULL` | admin only |
| 행 액션 가시성 | — | 세션 `users.role = 'admin'` | user 는 미노출 |

### 6.2 SCR-CONTACT-COMPANY 테이블

| UI 필드 | 표시 형식 | 데이터 소스 | 비고 |
|---|---|---|---|
| 회사명 | 텍스트 | `companies.name` | 1~100자 |
| 별칭 | `[CHIP: alias]` 배열 | `companies.aliases` (TEXT[]) | 빈 배열 시 "—" |
| 소속 연락처 수 | 숫자 | `COUNT(contacts WHERE company_id = companies.id AND deleted_at IS NULL)` | 0 시 "0명" |
| 등록 방식 | `[TAG]` | `companies.is_auto_registered` | true→자동 |
| 미확인 배지 | `[BADGE: 미확인]` | `companies.is_auto_registered = true AND aliases = '{}'` (보완 전) | 회사는 status 컬럼 없음 — 이슈 메모 §10 참조 |
| 등록일 | YYYY-MM-DD | `companies.created_at` | — |

### 6.3 SCR-MODAL-MENTION-NEW-CONTACT

| UI 필드 | 표시 형식 | 데이터 소스 | 비고 |
|---|---|---|---|
| 입력값 (편집 가능) | 텍스트 | 호출자에서 전달된 원본 입력 | `mentions.raw_text` 후보 |
| 유형 라디오 | radio | `mentions.reference_type` (`contact`/`company`) | — |
| 저장 결과 (개인) | — | INSERT `contacts(name, status='auto', is_auto_registered=true, created_by=세션)` | MEN-002 |
| 저장 결과 (회사) | — | INSERT `companies(name, aliases='{}', is_auto_registered=true, created_by=세션)` | MEN-002 |
| 멘션 칩 반영 | — | INSERT `mentions(schedule_id, reference_type, reference_id, raw_text)` | 일정 저장 시점 |

---

## 7. 화면 상태

| 상태 | 트리거 | UI |
|---|---|---|
| 빈 (admin, 0건) | 등록 전 | `[EMPTY: "등록된 연락처가 없습니다 / [BTN: + 새 연락처]"]` |
| 빈 (검색 결과 0건) | 검색·필터 결과 0 | `[EMPTY: "검색 결과가 없습니다 / [BTN: 필터 초기화]"]` |
| 로딩 | CON-004 호출 중 | `[SKELETON]` 행 5개 |
| 정상 | 데이터 수신 | `[TABLE]` 렌더, `[PAGINATION]` 갱신 |
| 에러 | 조회 실패 | `[ALERT: "불러오기 실패 / [BTN: 재시도]"]` |
| 권한 거부 (user 액션 시도) | 서버 거부 | `[TOAST: "관리자만 등록할 수 있습니다"]` |
| 저장 중 (모달) | onSubmit | `[BTN]` aria-busy + `[SPINNER]` |
| 저장 성공 | API 200 | 모달 닫기 + `[TOAST: success]` + 목록 즉시 갱신 |
| 저장 실패 (유효성) | 클라이언트 검증 | `[INLINE-ERROR]` 각 필드 |
| 저장 실패 (서버) | API 4xx/5xx | `[INLINE-ERROR: "저장 실패 / 재시도"]`, 입력값 유지 |
| 중복 감지 (이름) | onBlur | `[INLINE-ERROR: "이미 등록된 이름입니다. 기존 항목을 수정하시겠습니까?"]` |
| 중복 감지 (별칭) | 별칭 추가 시 | `[INLINE-ERROR: "이미 다른 회사([회사명])의 별칭"]` |
| MEN-002 중복 일치 | 자동 검사 | 다이얼로그 닫고 `[TOAST: "기존 [이름]과 연결됩니다"]` |

---

## 8. 권한·접근성

### 8.1 권한별 노출 (PERM-004)

| 요소 | 미인증 | `user` (URL/멘션 진입) | `admin` |
|---|:-:|:-:|:-:|
| 사이드바 "데이터" 그룹 | ❌ | ❌ | ✅ |
| 페이지 본문 `[H1] [TABS] [TABLE]` | ❌ | ✅ (조회만) | ✅ |
| `[BTN: + 새 연락처/회사]` | ❌ | ❌ | ✅ |
| `[CHECKBOX: 미확인 항목만]` | ❌ | ❌ | ✅ |
| 행 액션 `[MENU: ⋮]` | ❌ | ❌ | ✅ |
| 등록·수정·삭제 모달 진입 | ❌ | ❌ | ✅ |
| 모바일 `+ 일정 등록` 빠른 액션 | ❌ | ✅ | ✅ |

### 8.2 접근성

- 모달: `role="dialog"`, `aria-modal="true"`, `aria-labelledby="modal-title"`. 포커스 트랩, `Esc` 닫기 (확인 모달은 백드롭 클릭 무시).
- 테이블 정렬 헤더: `aria-sort="ascending|descending|none"`.
- 라디오 그룹 (MEN-002): `role="radiogroup"`, 화살표 키 이동.
- `[CHIP]` (removable): `aria-label="별칭 [Samsung] 제거"`.
- `[INLINE-ERROR]`: `aria-describedby` 로 입력과 연결, `aria-invalid="true"`.
- 키보드: `Tab` 으로 폼 순회, 모달 진입 시 첫 입력 자동 포커스, 닫힘 시 트리거 버튼으로 복귀.
- 검색 입력: `role="searchbox"`, `Esc` 로 클리어.

---

## 9. 이슈 메모 (spec/process 검토 중 발견)

1. **`contacts.aliases` 컬럼 존재 안 함** — `proc_04_mention_contact.md` PROC-MEN-002 ALT-02 와 PROC-CON-001 (등록·수정·삭제) 본문에 `contacts.aliases` / `contacts.is_auto` / `contacts.confirmed` 등이 언급되어 있으나, `erd/erd.md` E03 에는 `contacts.is_auto_registered` (bool) + `contacts.status` (`auto`/`confirmed`) 두 컬럼만 존재한다. 본 설계서는 ERD 기준으로 바인딩한다. 별칭은 `companies.aliases` 만 존재.
2. **`mentions.display_name` 컬럼 존재 안 함** — `proc_04` "삭제된 연락처 표시명을 mentions 에 저장" 서술은 ERD 와 불일치. 실제로는 조회 시점에 `contacts.deleted_at IS NOT NULL` 이면 UI 에서 `[삭제된 연락처]` 라벨로 렌더링 (애플리케이션 책임).
3. **회사의 미확인 상태** — `companies` 테이블에는 `status` 컬럼이 없다. 자동 등록 회사 식별은 `is_auto_registered=true` 단일 플래그로 판정한다. 본 설계서는 "별칭 미보완 자동 등록"건만 `[BADGE: 미확인]` 표기.
4. **spec/04 의 "확정/미확정"** — boolean 어휘는 ERD 의 enum (`status='auto'|'confirmed'`) + `is_auto_registered` 조합으로 매핑한다.

상기는 spec/process 의 표현 모호성이므로, 본 화면 작성은 ERD SSOT 를 따른다 (작업지시서 §5.4).

---

## 검증

- 자체 검증 일자: 2026-05-14
- 자체 검증 결과: ⚠️ 일부 통과 (spec/process 의 컬럼명 오류 발견 — §9 이슈 메모로 기록, ERD 기준으로 바인딩)
- 자동 검증 결과: ✅ 통과
  - 8개 필수 섹션 헤더 모두 존재 ✓
  - SCR-CONTACT, SCR-CONTACT-COMPANY, SCR-MODAL-MENTION-NEW-CONTACT 식별자 ✓ (`ia/screen_list.md` 라인 42~44)
  - 데이터 바인딩 표의 모든 `테이블.컬럼` (`contacts.name/company_id/title/email/phone/status/is_auto_registered/created_at/deleted_at/created_by`, `companies.name/aliases/is_auto_registered/created_at`, `mentions.schedule_id/reference_type/reference_id/raw_text`, `users.role`) 이 `erd/erd.md` E03/E02/E06/E01 에 실재 ✓
  - 사용 컴포넌트 모두 `components.md` 에 정의됨 ✓ (`TABS/TABLE/SEARCH/SELECT/CHECKBOX/BTN/MODAL/INPUT/RADIO/CHIP/BADGE/TAG/MENU/PAGINATION/TOAST/EMPTY/SKELETON/ALERT/SEGMENT/LIST/INLINE-ERROR/H1/BTN-ICON/SPINNER` — `components.md` §8 매트릭스 일치)
  - 상호작용 표의 API 모두 spec/process 의 CON-001~005, MEN-002 에 정의됨 ✓
  - 4종 상태(빈/로딩/에러/성공) + 권한 거부 모두 §7 에 정의 ✓
  - 권한 분기 (미인증/user/admin) §1, §8 에 명시 ✓
- 보류·예외 사항: §9 의 spec/process 표기 오류는 본 화면 작성 범위에서 수정 불가 (spec 폴더 읽기 전용). 이슈 메모로 기록 후 별도 라운드 처리 예정.
- 검증자: claude (Step B 그룹 3)
