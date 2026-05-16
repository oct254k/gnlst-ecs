# opusplan — Claude Agent 지침

## 프로젝트 개요

임원 일정 관리 시스템. 소수 임원(5~20명)의 일정을 비서·관리자가 등록·공유하고, 모임 시간 조율·관계 히스토리 조회를 지원한다.

**스택**: Next.js 15 App Router · Supabase (PostgreSQL + Auth + Edge Functions) · Vercel · TypeScript · Tailwind CSS · shadcn/ui

---

## 문서 맵 — 작업 전 반드시 확인

| 무엇을 알고 싶을 때 | 읽을 파일 |
|---|---|
| 전체 기능 목록·역할·Phase | `docs/outputs/spec/00_overview.md` |
| 화면 목록 (25개 SCR-*) | `docs/outputs/ia/screen_list.md` |
| 특정 기능 상세 명세 | `docs/outputs/spec/01_auth.md` ~ `13_export_responsive.md` |
| REST API 엔드포인트 (36개) | `docs/outputs/spec/14_api.md` |
| Supabase 구현 레이어 (A/B/C/D) | `docs/outputs/spec/15_supabase_design.md` |
| ERD · 테이블 컬럼 정의 | `docs/outputs/erd/erd.md` |
| 화면 ↔ 스펙 ↔ ERD 매핑 | `docs/outputs/00_cross_ref.md` |
| 비즈니스 프로세스 흐름 | `docs/outputs/process/proc_00_index.md` |

> **새 기능을 구현하기 전에 반드시 해당 spec 파일을 읽는다.** 스펙 없이 추측으로 구현하지 않는다.

---

## 에이전트 팀 역할

| 역할 | 담당 영역 | 참조 우선 문서 |
|------|----------|--------------|
| **팀장** | 태스크 분해, 에이전트 배정, 스펙 해석, 충돌 조정, 행동 지침 준수 감독 | `00_cross_ref.md`, `00_overview.md` |
| **프론트엔드** | Client Components, 클라이언트 상태, UI 인터랙션, 스타일 | `spec/05~13`, `ia/screen_list.md` |
| **서버** | Server Components, Server Actions, Route Handlers, Supabase SDK 호출 | `spec/14_api.md`, `spec/15_supabase_design.md §B` |
| **DB/Supabase** | 마이그레이션 SQL, RLS 정책, PostgreSQL 함수/트리거, Edge Functions | `spec/15_supabase_design.md §C·D`, `erd/erd.md` |
| **리뷰어** | 스펙 준수 검토, RLS 누락 확인, 타입 안전성, 핵심 경로 테스트 작성 | 전체 |

### 팀장 행동 기준

태스크를 배정할 때는 **스펙 파일 참조 위치 + 완료 검증 기준**을 반드시 함께 명시한다.

```
예시)
- 작업: 일정 등록 API 구현
- 참조: spec/03_schedule.md, spec/15_supabase_design.md §2
- 검증: POST /api/schedules 호출 시 schedules 테이블에 행이 생성되고 audit_logs에 트리거 기록 확인
```

에이전트가 구현을 시작하기 전에 가정을 밝히지 않으면 팀장이 먼저 묻는다. 완료 보고를 받을 때는 **"무엇이 달라졌는가"** + **"어떻게 확인했는가"**를 확인한다.

---

## 에이전트 공통 행동 지침

> 속도보다 신중함을 우선한다. 단순한 수정은 상황에 맞게 판단한다.

### 1. 구현 전 — 가정을 먼저 밝힌다

- 스펙을 읽고 **불명확한 부분을 구체적으로 제시**한 뒤 구현한다
- 해석 방향이 여러 가지라면 임의로 선택하지 말고 대안을 제시하거나 팀장에게 묻는다
- 더 단순한 접근이 있다면 제안한다. 타당한 근거가 있으면 요청에 반대 의견을 낸다
- "이렇게 해도 되겠지"로 시작하는 구현은 하지 않는다

### 2. 최소 코드 — 스펙이 요구하는 것만

- 요청되지 않은 기능, 유틸리티, 설정값은 추가하지 않는다
- "미래에 필요할 수도 있으니"라는 이유로 추상화 계층을 만들지 않는다
- 발생 불가능한 시나리오를 위한 예외 처리를 넣지 않는다
- "시니어 개발자가 보기에 이 코드가 지나치게 복잡한가?" — 그렇다면 단순화한다

### 3. 외과적 수정 — 연관 없는 코드는 건드리지 않는다

- 변경 라인은 작업 요청과 **직접 연결된 것만**으로 한정한다
- 인접한 코드·주석·포맷을 임의로 정리하지 않는다
- 기존 데드 코드를 발견하면 **보고만 하고** 직접 삭제하지 않는다
- 자신의 수정으로 불필요해진 import·변수만 제거한다. 기존 미사용 코드는 건드리지 않는다

### 4. 검증 가능한 목표로 변환

작업을 받으면 완료 기준을 먼저 정의한다:

| 요청 표현 | 검증 기준으로 변환 |
|-----------|------------------|
| "유효성 검사 추가" | 잘못된 입력에 대해 400 반환 확인 |
| "버그 수정" | 해당 시나리오가 정상 동작하는지 재현 후 확인 |
| "컴포넌트 수정" | 수정 전후 동일한 렌더 결과 + 변경 의도 반영 확인 |

다단계 작업은 단계별 검증 기준을 팀장과 합의한 뒤 착수한다.

---

## 구현 레이어 요약 (상세: `spec/15_supabase_design.md`)

| 레이어 | 코드 | 위치 |
|--------|------|------|
| Supabase Client 직접 | **A** | Server Component / Server Action |
| Next.js Route Handler | **B** | `app/api/*/route.ts` |
| Supabase Edge Function | **C** | `supabase/functions/*/index.ts` |
| PostgreSQL 함수/트리거 | **D** | `supabase/migrations/*.sql` |

새 엔드포인트를 구현할 때는 `spec/15_supabase_design.md §2`의 매핑표에서 레이어를 먼저 확인한다.

---

## 파일 구조 (Next.js App Router 기준)

```
/
├── app/
│   ├── api/                    # Route Handlers (레이어 B)
│   │   ├── auth/
│   │   ├── users/
│   │   ├── schedules/
│   │   ├── radar/
│   │   ├── holidays/
│   │   └── export/
│   ├── (auth)/                 # 로그인·초대·비밀번호 재설정 페이지
│   ├── (app)/                  # 인증 필요 페이지 (달력, 리스트, 레이더 등)
│   │   ├── calendar/
│   │   ├── list/
│   │   ├── radar/
│   │   ├── contacts/
│   │   └── admin/
│   └── _lib/
│       └── supabase/
│           ├── server.ts       # createUserClient / createAdminClient
│           ├── client.ts       # createBrowserClient
│           └── types.ts        # Database 타입 (supabase gen types로 생성)
├── components/
│   ├── ui/                     # shadcn/ui 기본 컴포넌트
│   ├── calendar/               # 달력 관련 컴포넌트
│   ├── schedule/               # 일정 폼·상세 컴포넌트
│   └── shared/                 # 공통 컴포넌트
├── supabase/
│   ├── functions/              # Edge Functions (레이어 C)
│   │   ├── send-notification/
│   │   ├── retry-notification/
│   │   └── holiday-batch/
│   └── migrations/             # SQL 마이그레이션 (레이어 D)
│       ├── 001_schema.sql
│       ├── 002_rls_policies.sql
│       ├── 003_audit_trigger.sql
│       ├── 004_cascade_soft_delete.sql
│       ├── 005_radar_function.sql
│       └── 006_relationship_function.sql
└── CLAUDE.md
```

---

## 핵심 설계 결정 — 절대 바꾸지 않는 것

| 결정 | 내용 |
|------|------|
| **Soft delete** | 물리 삭제 금지. `deleted_at` + `deleted_by` 컬럼으로 처리 |
| **Audit log** | 트리거가 자동 기록. Route Handler에서 직접 `audit_logs` INSERT 하지 않는다 |
| **역할** | `admin` / `user` 2종만. 별도 role 추가 금지 |
| **대리 입력** | 별도 role이 아닌 `proxy_permissions` 권한으로 처리 |
| **공통 일정 수락/거절** | 없음. 임원이 직접 `schedule_participants`에 본인 추가 |
| **주말·공휴일 일정** | 등록 제한 없음. 임원은 주말·공휴일에도 미팅 가능 |
| **공휴일 표시** | 달력에 빨간 날짜 + 툴팁으로 표시만 함. 차단 로직 없음 |
| **알림** | 이메일 단일 채널. `notification_logs`에 모든 발송 이력 기록 |
| **ERD 컬럼명** | `snake_case` 통일. camelCase 사용 금지 |

---

## 코딩 컨벤션

### TypeScript
- 모든 Supabase 쿼리는 `database.types.ts`에서 생성된 타입 사용 (`any` 금지)
- Server Action은 파일 상단 `'use server'` 명시
- Client Component는 파일 상단 `'use client'` 명시 (없으면 Server Component)

### Supabase 클라이언트
```typescript
// 서버 (Server Component / Server Action / Route Handler)
import { createUserClient } from '@/lib/supabase/server'   // RLS 적용
import { createAdminClient } from '@/lib/supabase/server'  // Service Role (admin 작업만)

// 클라이언트 (Client Component)
import { createBrowserClient } from '@/lib/supabase/client'
```

> `SUPABASE_SERVICE_ROLE_KEY`는 서버 전용. 클라이언트 컴포넌트에서 절대 사용 금지.

### 에러 처리
- Route Handler: `{ data: null, error: { code, message } }` 형식으로 통일
- Server Action: `{ success: boolean, error?: string }` 형식
- 클라이언트에서 `console.error` 후 toast 표시

### 컴포넌트
- shadcn/ui 컴포넌트를 우선 사용. 없는 경우에만 직접 구현
- 색상은 Tailwind 유틸리티 클래스 사용. 임원 고유 색상(`users.color`)은 `style={{ color: user.color }}` 인라인으로만

---

## 환경 변수

| 변수 | 범위 | 설명 |
|------|------|------|
| `NEXT_PUBLIC_SUPABASE_URL` | 공개 | Supabase 프로젝트 URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | 공개 | anon 키 (RLS로 보호) |
| `SUPABASE_SERVICE_ROLE_KEY` | **서버 전용** | Service Role 키 — 클라이언트 노출 절대 금지 |
| `RESEND_API_KEY` | Edge Function | 이메일 발송 서비스 키 |
| `HOLIDAY_API_KEY` | Edge Function | 공공데이터 공휴일 API 키 |

---

## 자주 하는 실수 — 하지 말 것

- ❌ `audit_logs`에 직접 INSERT — 트리거가 자동 처리
- ❌ `users.role`을 JWT 없이 `users` 테이블 JOIN으로만 확인 — `auth.jwt()->'user_metadata'->>'role'` 사용
- ❌ `deleted_at IS NOT NULL` 행 조회에 포함 — 모든 쿼리에 `deleted_at IS NULL` 필수
- ❌ 물리 삭제 (`DELETE FROM`) — soft delete만 허용
- ❌ Service Role 클라이언트를 Client Component에서 사용
- ❌ 스펙 없는 기능 임의 추가 — 반드시 spec 파일 확인 후 구현
- ❌ 공휴일·주말 일정 등록 차단 로직 추가 — 제한 없음

---

## 로컬 개발 환경 시작

```bash
# 1. 의존성 설치
pnpm install

# 2. Supabase 로컬 실행
supabase start

# 3. 마이그레이션 적용
supabase db reset   # migrations/ 전체 적용 + seed

# 4. 타입 생성
supabase gen types typescript --local > app/_lib/supabase/types.ts

# 5. Next.js 개발 서버
pnpm dev
```

`.env.local` 파일은 `supabase start` 출력값에서 URL·anon key를 복사해 설정한다.
