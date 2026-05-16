1. 인증 / 회원

관리자 초대 → 메일 링크 → 비밀번호 설정
로그인 — 메일 + 비밀번호 / 사번 + 비밀번호
비밀번호 찾기 — 메일 인증
소셜 로그인 ❌


2. 권한
구분권한관리자공휴일 관리, 연락처 관리, 전체 일정 수정, 초대, 대리입력 권한 부여일반전체 일정 조회, 본인 일정 등록/수정

대리 입력 — 관리자가 "A가 B 이름으로 입력" 권한 부여
대리 입력 시 실제 작성자 + 일정 주인 둘 다 로그 저장


3. 일정
입력 필드

날짜 — 자유 형식 (2026-05-11, 5/11, 내일, 다음주 월요일 등)
시간대 — 오전 / 점심 / 오후 / 저녁 / 전일 (실제 시간 입력 시 자동 매핑)
실제 시간 — 직접 입력 (13:00~14:00), 선택사항

실제 시간자동 매핑 시간대~11:59오전12:00~13:59점심14:00~17:59오후18:00~저녁종일전일

일정 내용 — 자유 텍스트
장소 — 자유 텍스트
비고 — 추가 메모
@ 멘션 — 고객/회사 태그 (복수 가능)

일정 유형
유형설명개인 일정특정 임원 1명공통 일정복수 임원, 참가자 직접 이름 추가공휴일시스템 자동/수동

4. @ 멘션 / 연락처

@이름 / @회사명 실시간 자동완성 드롭다운
처음 등장 시 자동으로 연락처 DB 등록
연락처 — 이름 / 소속 회사 / 직책
회사 — 회사명 / 별칭(alias)
연락처 CRUD — 관리자


5. 달력 뷰

월간 / 주간 / 일간 전환
임원별 색상 레이어 + 체크박스로 ON/OFF
공통 일정 별도 색상 항상 표시
공휴일 빨간 날짜 + 툴팁
날짜 클릭 → 해당 일 상세 펼침
오늘 날짜 하이라이트
빈 시간대 눈으로 파악 가능


6. 리스트 뷰

테이블 형태 (날짜 / 시간대 / 실제시간 / 일정내용 / 장소·파트너)
빠른 입력
검색 — 키워드 / @멘션 / 날짜범위 / 담당자 필터
인라인 수정 (행 클릭 → 바로 편집)


7. 공통 일정

등록 → 참석 임원 전체 알림 발송
참가 의사 있으면 본인이 직접 참가자에 이름 추가
수락/거절 프로세스 ❌


8. 공휴일

법정 공휴일 자동 등록 (연간, 대체공휴일 포함)
임시 공휴일 수동 등록/삭제 — 관리자


9. 모임 레이더 🆕
참석자 선택 (체크박스)
      ↓
선택된 임원들 일정 자동 조회
      ↓
시간대별 충돌 계산
      ↓
가능/불가능 슬롯 자동 분류

전원 가능 ✅ / 일부 일정 있음 🟡 / 불가 ❌ 로 표시
추가 라이브러리 없음 — date-fns + Supabase Query로 구현


10. 관계 히스토리 🆕

@회사 or @사람 클릭 시 미팅 히스토리 카드 표시
표시 항목 — 날짜 / 담당자 / 장소 / 총 미팅 횟수 / 최근 담당자
날짜순 정렬
추가 라이브러리 없음 — Supabase Query + SQL 집계함수로 구현


11. 알림
트리거대상공통 일정 등록전체 임원공통 일정 수정전체 임원내 일정 타인이 수정해당 임원
메일 발송 설계
케이스담당초대 메일Supabase Auth 내장비밀번호 찾기Supabase Auth 내장일정 알림 메일Supabase Edge Function + Resend

12. 이력

일정 등록 / 수정 이력 저장
누가 언제 뭘 바꿨는지 기록
대리 입력 시 실제 작성자 별도 기록


13. 내보내기

엑셀 다운로드 — 필터 적용 상태 그대로
구글 캘린더 연동 ❌


14. 반응형

모바일 우선 설계
입력 폼 단순하게 (탭/드롭다운 위주)


15. 기술 스택
핵심 프레임워크
패키지버전비고Next.js16.2App Router, TurbopackReact19.xNext.js 16.2 기본 탑재Node.js22.xLTS 안정화 버전
Supabase
패키지버전용도@supabase/supabase-js2.105.4DB + Auth + Realtimesupabase CLI2.98.2로컬 개발
UI / 스타일링
패키지버전용도Tailwind CSSv4.x스타일링shadcn/ui최신UI 컴포넌트FullCalendar6.x달력 뷰
주요 라이브러리
패키지용도@tanstack/react-query서버 상태 관리zustand클라이언트 상태 관리react-hook-form폼 관리zod유효성 검사xlsx엑셀 다운로드date-fns날짜 파싱/포맷 + 모임 레이더 충돌 계산@tiptap/react@ 멘션 입력 에디터resend알림 메일 발송
배포
서비스용도VercelNext.js 호스팅Supabase CloudDB + Auth + Realtime
초기 세팅 (Mac 기준)
bash# Node.js 22 설치
brew install nvm
nvm install 22
nvm use 22

# 프로젝트 생성
npx create-next-app@latest exec-schedule \
  --typescript \
  --tailwind \
  --eslint \
  --app \
  --src-dir \
  --turbopack

# Supabase CLI 설치
brew install supabase/tap/supabase

# 주요 패키지 설치
npm i @supabase/supabase-js @tanstack/react-query \
  zustand react-hook-form zod xlsx date-fns \
  @tiptap/react @tiptap/extension-mention \
  @fullcalendar/react @fullcalendar/daygrid \
  @fullcalendar/timegrid @fullcalendar/interaction \
  resend

Phase 정리
Phase기능1일정 CRUD, 달력 뷰, 리스트 뷰, 공통 일정, 인증/권한2@ 멘션, 연락처 관리, 공휴일 연동, 대리입력, 알림3모임 레이더, 관계 히스토리, 이력, 엑셀 다운로드

---

## 16. 비기능 요구사항 (NFR)

> 본 섹션의 수치는 임원 일정 관리라는 도메인 특성(소규모 사용자, 사내 업무 시간 중심)을 기반으로 산정한 **합리적 기본값**이다. 실제 사용 패턴 측정 전에는 **(검토 필요)** 표기 값은 가정으로 간주한다.

### 16.1 성능 (Performance)

| ID | 항목 | 목표값 | 비고 |
|---|---|---|---|
| NFR-PERF-001 | 일정 조회 (월간 달력, 임원 5명 기준) 응답시간 | P95 ≤ 1.5s, P99 ≤ 3.0s | 클라이언트 렌더 포함, Supabase 일반 인덱스 가정 |
| NFR-PERF-002 | 일정 등록·수정 API 응답시간 | P95 ≤ 800ms | Edge Function 콜드스타트 제외 |
| NFR-PERF-003 | 리스트 뷰 검색 응답시간 (조건 1개 + 키워드) | P95 ≤ 1.0s | 인덱스 기반 ILIKE 또는 FTS |
| NFR-PERF-004 | 모임 레이더 슬롯 계산 (10명 × 30일) | P95 ≤ 2.0s | date-fns 클라이언트 계산 |
| NFR-PERF-005 | 동시 접속 사용자 수 | 30명 동시 활성 (검토 필요) | 임원 15명 + 비서·관리자 15명 가정 |
| NFR-PERF-006 | 알림 메일 발송 지연 | 트리거 후 ≤ 60s | Resend + Edge Function |

### 16.2 보안 (Security)

| ID | 항목 | 요구 |
|---|---|---|
| NFR-SEC-001 | 전송 구간 암호화 | 모든 통신 HTTPS/TLS 1.2 이상 |
| NFR-SEC-002 | 저장 데이터 암호화 | Supabase Postgres 기본 저장 암호화(at-rest) 사용. 개인정보 컬럼(전화·이메일)은 마스킹 정책 별도 검토 |
| NFR-SEC-003 | 인증 | Supabase Auth (이메일+비밀번호, 사번 매핑). 소셜 로그인 미사용 |
| NFR-SEC-004 | 비밀번호 정책 | 최소 10자, 영문·숫자·특수문자 각 1자 이상 조합 (확정 2026-05-14, 사용자 확정) |
| NFR-SEC-005 | 세션 정책 | JWT 만료 8시간, refresh 토큰 30일 (확정 2026-05-14, 사용자 확정) |
| NFR-SEC-006 | 접근제어 | RLS(Row-Level Security)로 임원 본인 일정·공통 일정만 조회·수정. 관리자 role bypass |
| NFR-SEC-007 | 감사로그 보존 | 일정·연락처 CRUD, 권한 변경, 대리입력 행위 전체 기록. 보존 3년 (확정 2026-05-14, 사용자 확정) |
| NFR-SEC-008 | 대리입력 추적 | `audit_logs`에 실제 작성자(actor_id) + 일정 주인(owner_id) 이중 기록 (요구사항 §2와 연동) |
| NFR-SEC-009 | 개인정보 다운로드 통제 | 엑셀 내보내기는 권한 검증 + 감사로그 기록 |

### 16.3 확장성·용량 (Scalability)

| ID | 항목 | 기준 |
|---|---|---|
| NFR-SCL-001 | 예상 임원 수 | 초기 10–15명, 3년 내 30명까지 확장 (검토 필요) |
| NFR-SCL-002 | 일정 건수 | 임원 1인당 연간 500건 가정 → 3년 누적 22,500건 |
| NFR-SCL-003 | 연락처 수 | 누적 5,000건 (검토 필요) |
| NFR-SCL-004 | 데이터 보관기한 | 일정 본문 무기한, 감사로그 5년, 알림 발송 이력 1년 (검토 필요) |
| NFR-SCL-005 | 첨부 파일 | MVP 미지원. 향후 도입 시 Supabase Storage 사용 가정 |

### 16.4 가용성 (Availability)

| ID | 항목 | 목표 |
|---|---|---|
| NFR-AVL-001 | 운영시간 | 평일·주말 24/7 (사용은 평일 08:00–22:00 KST 집중) |
| NFR-AVL-002 | 월간 가용성 | ≥ 99.5% (Vercel + Supabase Cloud SLA에 의존) |
| NFR-AVL-003 | 장애 복구 목표 | RTO ≤ 4h, RPO ≤ 24h (Supabase PITR 기본 정책 가정) |
| NFR-AVL-004 | 유지보수 윈도 | 사전 공지 후 평일 22:00 이후 또는 주말 |

### 16.5 접근성·호환성 (Accessibility / Compatibility)

| ID | 항목 | 요구 |
|---|---|---|
| NFR-COM-001 | 지원 브라우저 | Chrome / Edge / Safari 최신 2개 메이저 버전, Firefox 최신 1개 |
| NFR-COM-002 | 모바일 지원 | iOS Safari 16+, Android Chrome 최신. 모바일 우선 설계 (요구사항 §14) |
| NFR-COM-003 | 최소 해상도 | 모바일 360×640, 데스크톱 1280×800 |
| NFR-COM-004 | 접근성 | WCAG 2.1 AA 일부 준수 — 키보드 포커스 가시화, 색대비 4.5:1, ARIA 라벨 (검토 필요) |
| NFR-COM-005 | 다국어 | 한국어 단일 (i18n 구조는 향후 확장 대비 폴더만 마련) |
| NFR-COM-006 | 시간대 | KST(Asia/Seoul) 고정. 해외 출장 일정도 KST 표기 |

---

## 17. 제약사항 및 가정

### 17.1 시스템 제약

| ID | 제약 |
|---|---|
| CON-SYS-001 | 동시 접속 사용자 수 30명 상한 (NFR-PERF-005). 초과 시 별도 부하 테스트 필요 |
| CON-SYS-002 | 일정 1건당 참가자(`schedule_participants`) 최대 50명 (검토 필요) |
| CON-SYS-003 | 일정 1건당 멘션(`mentions`) 최대 30건 (검토 필요) |
| CON-SYS-004 | 일정 본문 길이 5,000자, 비고 2,000자, 장소 200자 (검토 필요) |
| CON-SYS-005 | 첨부 파일 MVP 미지원 |
| CON-SYS-006 | 모임 레이더 동시 비교 임원 수 최대 15명 (UI 가독성·계산 비용 고려) |
| CON-SYS-007 | 엑셀 내보내기 1회 최대 10,000행 (검토 필요) |

### 17.2 외부 시스템 의존 가정

| ID | 가정 |
|---|---|
| ASM-EXT-001 | Supabase Cloud(서울 리전) 가용성·SLA에 가용성 목표 의존 |
| ASM-EXT-002 | 이메일 발송은 Resend 단일 채널. 도메인 인증(SPF/DKIM/DMARC) 완료 전제 |
| ASM-EXT-003 | 법정 공휴일 데이터는 공공데이터포털 또는 수동 입력 (자동 연동 API 미확정 — `proc_08_holiday.md` 참조) |
| ASM-EXT-004 | 배포는 Vercel 단일 환경 (Production / Preview 분리) |
| ASM-EXT-005 | 클라이언트 단말의 네트워크는 회사망 또는 LTE/5G. 오프라인 모드 미지원 |

### 17.3 비즈니스 가정

| ID | 가정 |
|---|---|
| ASM-BIZ-001 | 주 사용자는 임원(C-level). 직접 입력 또는 비서·관리자에 의한 대리입력 병행 |
| ASM-BIZ-002 | 비서·대리 입력 인원 5–10명 규모 (검토 필요) |
| ASM-BIZ-003 | 외부 인사·고객사 정보는 회사 CRM과 별도. 본 시스템 내 `contacts`·`companies`에 자체 관리 |
| ASM-BIZ-004 | 일정 공유 대상은 사내 임원·관리자로 한정. 외부 캘린더 연동(구글 캘린더 등) 미제공 |
| ASM-BIZ-005 | 감사·내부통제 요건은 사내 감사팀 검토 후 보존기한 확정 |

---

## 18. 용어집 (Glossary)

| 용어 | 정의 |
|---|---|
| 임원 | 시스템 사용자 중 일정의 주체가 되는 인물. `users.role = 'executive'` |
| 관리자 | 사용자·연락처·공휴일 관리 및 대리입력 권한 부여 권한 보유. `users.role = 'admin'` |
| 비서 | 임원의 일정을 대신 등록·수정하는 역할. 본 시스템에서 별도 role이 아니라 "대리입력 권한을 부여받은 일반 임원" 또는 관리자로 운영됨 |
| 개인 일정 | 단일 임원이 주체인 일정. 일정 유형 `personal` |
| 공통 일정 | 복수 임원이 참여하는 일정. 등록 시 참석 임원 전체에 알림 발송. 일정 유형 `common` |
| 대리입력 (Proxy Input) | 관리자가 부여한 권한에 따라 A가 B를 owner로 하는 일정을 등록·수정하는 행위. 실제 작성자와 일정 주인을 모두 로그에 기록 |
| @ 멘션 | 일정 본문 또는 전용 필드에서 `@이름`/`@회사명`으로 외부 인사·회사를 태그하는 기능. 처음 등장하면 `contacts`/`companies`에 자동 등록 |
| 시간대 (Time Slot, TZ slot) | 오전/점심/오후/저녁/전일의 5단계 추상 시간대. 실제 시간 입력 시 자동 매핑 (요구사항 §3) |
| 시간대 (Timezone) | 시스템 운영 시간대. KST(Asia/Seoul) 고정 (NFR-COM-006) |
| 모임 레이더 | 복수 임원의 일정을 동시 비교해 가용 슬롯을 자동 분류하는 기능 (요구사항 §9) |
| 관계 히스토리 | 특정 회사·인물과의 과거 미팅 누적 카드. `schedules` × `mentions` 집계 (요구사항 §10) |
| 감사로그 (Audit Log) | 등록·수정·삭제·권한변경·대리입력 등 모든 변경 행위 기록. `audit_logs` 테이블 |
| Phase | 기능 출시 단계. Phase 1=MVP, Phase 2=협업·관리, Phase 3=분석·내보내기 |
| MVP | Minimum Viable Product. 본 프로젝트의 Phase 1 산출물 |
| NFR | Non-Functional Requirement. 성능·보안·가용성 등 비기능 요구사항 |
| RLS | Row-Level Security. Supabase Postgres의 행 단위 접근제어 |
| RTO / RPO | Recovery Time Objective / Recovery Point Objective. 장애 복구 시간·데이터 손실 한계 목표 |
| MoSCoW | 우선순위 분류법 — Must(필수)/Should(권장)/Could(선택)/Won't(이번 범위 외) |
| Acceptance Criteria | 수용기준. 요구사항이 충족되었는지 객관적으로 판정 가능한 조건 |

---

## 19. 요구사항 우선순위 매트릭스 (MoSCoW × Phase)

| ID | 요구사항 | 본문 §  | 우선순위 | Phase |
|---|---|---|:---:|:---:|
| REQ-001 | 관리자 초대 → 메일 → 비밀번호 설정 | §1 | Must | 1 |
| REQ-002 | 이메일+비밀번호 / 사번+비밀번호 로그인 | §1 | Must | 1 |
| REQ-003 | 비밀번호 찾기 (메일 인증) | §1 | Must | 1 |
| REQ-004 | 소셜 로그인 | §1 | Won't | – |
| REQ-005 | 관리자/일반 역할 분리 및 권한 차등 | §2 | Must | 1 |
| REQ-006 | 대리입력 권한 부여·사용 | §2 | Should | 2 |
| REQ-007 | 일정 CRUD (개인 일정) | §3 | Must | 1 |
| REQ-008 | 자유형식 날짜 입력 파싱 | §3 | Should | 1 |
| REQ-009 | 추상 시간대(오전/점심/오후/저녁/전일) ↔ 실제 시간 자동 매핑 | §3 | Must | 1 |
| REQ-010 | 일정 유형(개인/공통/공휴일) | §3 | Must | 1 |
| REQ-011 | @ 멘션 자동완성 + 자동 등록 | §4 | Should | 2 |
| REQ-012 | 연락처·회사 CRUD (관리자) | §4 | Should | 2 |
| REQ-013 | 달력 뷰 (월/주/일 + 임원 레이어) | §5 | Must | 1 |
| REQ-014 | 리스트 뷰 (검색·인라인 수정·빠른 입력) | §6 | Must | 1 |
| REQ-015 | 공통 일정 등록 + 알림 | §7 | Must | 1 |
| REQ-016 | 공통 일정 수락/거절 프로세스 | §7 | Won't | – |
| REQ-017 | 법정 공휴일 자동 등록 | §8 | Should | 2 |
| REQ-018 | 임시 공휴일 수동 관리 | §8 | Should | 2 |
| REQ-019 | 모임 레이더 (가용 슬롯 자동 분류) | §9 | Could | 3 |
| REQ-020 | 관계 히스토리 카드 | §10 | Could | 3 |
| REQ-021 | 공통 일정 등록·수정 메일 알림 | §11 | Must | 1 |
| REQ-022 | 본인 일정 타인 수정 알림 | §11 | Should | 2 |
| REQ-023 | 일정 등록·수정 이력 저장 (감사로그) | §12 | Must | 1 |
| REQ-024 | 엑셀 다운로드 (필터 적용 상태) | §13 | Could | 3 |
| REQ-025 | 구글 캘린더 연동 | §13 | Won't | – |
| REQ-026 | 모바일 우선 반응형 | §14 | Must | 1 |
| REQ-NFR-PERF | 성능 목표 (NFR-PERF-001~006) | §16.1 | Must | 1 |
| REQ-NFR-SEC | 보안 정책 (NFR-SEC-001~009) | §16.2 | Must | 1 |
| REQ-NFR-AVL | 가용성 목표 (NFR-AVL-001~004) | §16.4 | Should | 2 |
| REQ-NFR-COM | 접근성·호환성 (NFR-COM-001~006) | §16.5 | Should | 1–2 |

---

## 20. 트레이서빌리티 매트릭스

> 각 요구사항이 IA 화면 / 프로세스 / 기능 명세 / ERD 테이블 중 어디로 이어지는지 추적한다. 화면 ID는 `ia/screen_list.md`, 프로세스는 `process/proc_*`, 명세는 `spec/*`, ERD 테이블은 `erd/erd.md` 정의를 따른다. 빈 칸은 해당 카테고리에 직접 매핑이 없음을 의미한다.

| REQ ID | 요구사항 | IA 화면 | Process | Spec 파일 | ERD 테이블 |
|---|---|---|---|---|---|
| REQ-001 | 초대 → 비밀번호 설정 | SCR-ADMIN-USER, SCR-INVITE-ACCEPT | proc_01_auth, proc_05_notification | 01_auth, 11_notification | users, notification_logs |
| REQ-002 | 로그인 (메일/사번) | SCR-LOGIN | proc_01_auth | 01_auth | users |
| REQ-003 | 비밀번호 찾기 | SCR-PASSWORD-FIND, SCR-PASSWORD-RESET | proc_01_auth, proc_05_notification | 01_auth, 11_notification | users, notification_logs |
| REQ-004 | 소셜 로그인 (Won't) | – | – | – | – |
| REQ-005 | 역할 기반 권한 | SCR-DASHBOARD, SCR-ADMIN-USER | proc_02_permission | 02_permission | users |
| REQ-006 | 대리입력 권한 | SCR-ADMIN-PROXY, SCR-MODAL-SCHEDULE-FORM | proc_02_permission, proc_09_audit_log | 02_permission, 12_audit_log | proxy_permissions, audit_logs |
| REQ-007 | 일정 CRUD | SCR-MODAL-SCHEDULE-FORM, SCR-MODAL-SCHEDULE-DETAIL, SCR-MODAL-CONFIRM-DELETE | proc_03_schedule | 03_schedule | schedules, schedule_participants |
| REQ-008 | 자유형식 날짜 파싱 | SCR-MODAL-SCHEDULE-FORM | proc_03_schedule | 03_schedule | schedules |
| REQ-009 | 시간대 자동 매핑 | SCR-MODAL-SCHEDULE-FORM, SCR-CALENDAR | proc_03_schedule | 03_schedule, 05_calendar_view | schedules |
| REQ-010 | 일정 유형 | SCR-MODAL-SCHEDULE-FORM | proc_03_schedule, proc_08_holiday | 03_schedule, 07_common_schedule, 08_holiday | schedules, schedule_participants, holidays |
| REQ-011 | @ 멘션 자동완성·등록 | SCR-MODAL-SCHEDULE-FORM, SCR-MODAL-MENTION-NEW-CONTACT | proc_04_mention_contact | 04_mention_contact | mentions, contacts, companies |
| REQ-012 | 연락처·회사 CRUD | SCR-CONTACT, SCR-CONTACT-COMPANY | proc_04_mention_contact | 04_mention_contact | contacts, companies |
| REQ-013 | 달력 뷰 | SCR-CALENDAR, SCR-PANEL-DAY-DETAIL | proc_03_schedule | 05_calendar_view | schedules, holidays, users |
| REQ-014 | 리스트 뷰 | SCR-LIST | proc_03_schedule | 06_list_view | schedules, mentions |
| REQ-015 | 공통 일정 + 알림 | SCR-MODAL-SCHEDULE-FORM, SCR-MODAL-SCHEDULE-DETAIL | proc_03_schedule, proc_05_notification | 07_common_schedule, 11_notification | schedules, schedule_participants, notification_logs |
| REQ-016 | 수락/거절 (Won't) | – | – | – | – |
| REQ-017 | 법정 공휴일 자동 등록 | SCR-ADMIN-HOLIDAY | proc_08_holiday | 08_holiday | holidays |
| REQ-018 | 임시 공휴일 관리 | SCR-ADMIN-HOLIDAY, SCR-MODAL-CONFIRM-DELETE | proc_08_holiday | 08_holiday | holidays |
| REQ-019 | 모임 레이더 | SCR-RADAR | proc_06_meeting_radar | 09_meeting_radar | schedules, schedule_participants, users |
| REQ-020 | 관계 히스토리 | SCR-POPOVER-RELATIONSHIP | proc_07_relationship_history | 10_relationship_history | schedules, mentions, contacts, companies |
| REQ-021 | 공통 일정 메일 알림 | SCR-ADMIN-NOTIFICATION-LOG | proc_05_notification | 11_notification | notification_logs |
| REQ-022 | 본인 일정 타인 수정 알림 | SCR-ADMIN-NOTIFICATION-LOG | proc_05_notification, proc_09_audit_log | 11_notification, 12_audit_log | notification_logs, audit_logs |
| REQ-023 | 감사로그 | SCR-ADMIN-NOTIFICATION-LOG, SCR-MODAL-SCHEDULE-DETAIL | proc_09_audit_log | 12_audit_log | audit_logs |
| REQ-024 | 엑셀 다운로드 | SCR-LIST | proc_10_export | 13_export_responsive | schedules, mentions |
| REQ-025 | 구글 캘린더 (Won't) | – | – | – | – |
| REQ-026 | 모바일 반응형 | (전 화면 공통) | – | 13_export_responsive | – |

---

## 21. 모호 표현 명확화 (Acceptance Criteria)

본문에서 사용된 정성적·모호한 표현을 객관 판정 가능한 수용기준으로 재정의한다. 본문 원문은 보존하되, 본 섹션을 우선 해석 기준으로 삼는다.

| 본문 위치 | 원문 표현 | 재정의 (Acceptance Criteria) |
|---|---|---|
| §3 일정 — 날짜 | "자유 형식 (2026-05-11, 5/11, 내일, 다음주 월요일 등)" | (a) ISO `YYYY-MM-DD`, `M/D`, `M월 D일` 형식 파싱 (b) 상대 표현 `오늘/내일/모레/다음주 [요일]/이번주 [요일]` 파싱 (c) 파싱 실패 시 인라인 에러 표시 + 원문 보존 (d) 파싱 라이브러리: `date-fns` + 자체 한국어 규칙 |
| §5 달력 뷰 — "빈 시간대 눈으로 파악 가능" | "빈 시간대 눈으로 파악 가능" | (a) 주간/일간 뷰에서 일정 없는 시간대는 빈 셀로 표시 (b) 임원별 레이어 색상이 없는 셀이 빈 슬롯 (c) 모임 레이더 진입 시 동일 색상 규칙 재사용 |
| §6 리스트 뷰 — 빠른 입력 | "빠른 입력" | (a) 리스트 상단 1행짜리 입력 행 제공 (b) 필수 필드(날짜·일정내용) 입력 후 Enter로 저장 (c) 저장 후 입력 행은 초기화 (d) 응답 시간 NFR-PERF-002 |
| §6 리스트 뷰 — 인라인 수정 | "인라인 수정 (행 클릭 → 바로 편집)" | (a) 행 셀 클릭 시 해당 셀이 입력 가능 상태로 전환 (b) Enter 또는 포커스 아웃 시 저장 (c) ESC로 취소 (d) 권한 없는 행은 클릭해도 편집 모드 진입 불가 |
| §11 알림 — "전체 임원" | "전체 임원" | "전체 임원" = 해당 공통 일정 `schedule_participants` 행 보유 임원 + 등록 시 선택된 추가 임원. 단, 비활성(`users.is_active = false`) 임원 제외 |
| §14 반응형 — "단순하게 (탭/드롭다운 위주)" | "입력 폼 단순하게 (탭/드롭다운 위주)" | (a) 모바일(≤768px)에서 일정 등록 폼은 4단계 탭(기본·시간·참가자·메모)로 분할 (b) 멀티셀렉트는 드롭다운 + 검색 패턴 사용 (c) 모달은 화면 하단 시트 형태 |
| §2 권한 — "대리 입력" | "관리자가 'A가 B 이름으로 입력' 권한 부여" | (a) `proxy_permissions(grantor_id=B, grantee_id=A, scope, valid_from, valid_to)` 행 생성 시점부터 유효 (b) 일정 등록·수정 시 `audit_logs.actor_id=A`, `audit_logs.owner_id=B` 이중 기록 (c) 권한 회수는 행 soft-delete 또는 `valid_to` 갱신 |
| §9 모임 레이더 — "충돌 계산" | "시간대별 충돌 계산" | (a) 비교 단위 = 5단계 추상 시간대(오전/점심/오후/저녁/전일) (b) 실제 시간 입력된 일정은 시간 단위 겹침 우선 판정 (c) 결과 3분류: 전원 가능(0건) / 일부 일정 있음(1–N-1건) / 불가(N건) 이때 N=선택 임원 수 |

---

## 22. 변경 이력 (Revision)

| 버전 | 일자 | 변경 |
|---|---|---|
| 0.1 | 2026-05-11 | 기능 요구사항 초안 (§1–§15) |
| 0.2 | 2026-05-13 | NFR(§16), 제약·가정(§17), 용어집(§18), 우선순위(§19), 트레이서빌리티(§20), 모호표현 명확화(§21) 추가 |
| 0.3 | 2026-05-14 | 보안 NFR 확정 — NFR-SEC-004(비밀번호 10자), NFR-SEC-005(JWT 8h/refresh 30d), NFR-SEC-007(감사로그 보존 3년). spec/01_auth.md, process/proc_01_auth.md 정합성 동기화 |
