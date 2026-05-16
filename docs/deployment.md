# GNLST 배포 가이드

## 인프라 구성

| 항목 | 값 |
|------|-----|
| GitHub | https://github.com/oct254k/gnlst-ecs |
| Vercel 프로젝트 | gnlst-ecs (aniviaflying-6474s-projects) |
| 프로덕션 URL | https://gnlst-ecs.vercel.app |
| Supabase 프로젝트 ref | ahvsuhyciuveftuuydho |

---

## 환경변수

Vercel 프로젝트에 등록된 환경변수:

| 변수 | 설명 | Sensitive |
|------|------|-----------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase 프로젝트 URL | N |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase Publishable key | N |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase Secret key (서버 전용) | Y |

> Supabase 키 확인: https://supabase.com/dashboard/project/ahvsuhyciuveftuuydho/settings/api-keys

---

## 최초 배포 절차 (재현용)

### 1. GitHub push

```bash
git init
git remote add origin https://github.com/oct254k/gnlst-ecs.git
git add <files>
git commit -m "커밋 메시지"
git push -u origin main
```

### 2. Vercel 환경변수 등록

```bash
npx vercel env add NEXT_PUBLIC_SUPABASE_URL
npx vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
npx vercel env add SUPABASE_SERVICE_ROLE_KEY   # sensitive: yes
```

### 3. Supabase 마이그레이션

```bash
supabase link --project-ref ahvsuhyciuveftuuydho
supabase db push
```

migrations/ 폴더의 SQL 7개가 순서대로 적용됨:
- 001_schema.sql
- 002_rls_policies.sql
- 003_audit_trigger.sql
- 004_cascade_soft_delete.sql
- 005_radar_function.sql
- 006_relationship_function.sql
- 007_notification_event_types.sql

### 4. Vercel 배포

```bash
npx vercel --prod --yes
```

---

## 이후 배포 (코드 변경 시)

```bash
git add <변경파일>
git commit -m "커밋 메시지"
git push origin main
# GitHub 연동으로 Vercel 자동 재배포됨
```

DB 스키마 변경이 있을 경우:

```bash
supabase db push
npx vercel --prod --yes
```

---

## 첫 admin 계정 생성

1. Supabase 대시보드 → **Authentication → Users → Add user**
   - Email / Password 입력
   - `Auto Confirm User` 체크

2. SQL Editor에서 users 테이블에 등록:

```sql
-- 생성된 유저 UUID 확인
SELECT id, email FROM auth.users;

-- admin으로 등록 (employee_id는 6~10자리 숫자)
INSERT INTO public.users (id, email, name, role, employee_id)
VALUES ('<uuid>', '이메일', '이름', 'admin', '000001');
```

3. https://gnlst-ecs.vercel.app/login 에서 로그인

---

## 추가 설정 (미완료)

- [ ] `RESEND_API_KEY` — 이메일 알림 발송용 (Resend 가입 후 등록)
- [ ] `HOLIDAY_API_KEY` — 공공데이터 공휴일 API (data.go.kr)
- [ ] Edge Functions 배포: `supabase functions deploy send-notification`
