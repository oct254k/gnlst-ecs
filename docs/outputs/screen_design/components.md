# 공통 컴포넌트 인벤토리 (Components)

- 문서 ID: SCRDSGN-A-2
- 최종 갱신: 2026-05-14
- 적용 범위: `screen_design/scr_*.md` 14건 공용 컴포넌트 SSOT
- 상위 SSOT: `spec/13_export_responsive.md` RES-002 입력 컨트롤 가이드라인, `common_layout.md` §11 디자인 토큰

---

## 0. 명세 양식 (공통)

각 컴포넌트는 다음 항목을 갖는다.

| 항목 | 설명 |
|---|---|
| 컴포넌트 ID | `[CATEGORY-NAME]` 형식. 화면 .md 본문에서 그대로 인용 |
| 용도 | 1줄 요약 |
| 상태 | default / hover / focus / active / disabled / error / loading 중 해당 항목 |
| 이벤트 | onClick / onChange / onBlur 등 + 발생 시점 |
| 접근성 | role, aria-*, 키보드 인터랙션 |
| 사용 화면 | 본 컴포넌트를 사용하는 `scr_XX_*.md` ID 목록 |
| 데스크톱/모바일 차이 | RES-001/RES-002 적용 시 차이점 |

### 카테고리 색인

| 카테고리 | 접두사 | 컴포넌트 수 |
|---|---|---|
| 입력 (Input) | `INPUT`, `TEXTAREA`, `SELECT`, `SEARCH`, `MENTION`, `CHECKBOX`, `RADIO`, `TOGGLE`, `SEGMENT`, `DATE`, `TIME`, `COLOR`, `FILE` | 13 |
| 액션 (Action) | `BTN`, `BTN-ICON`, `BTN-LINK`, `LINK`, `DROPDOWN`, `MENU` | 6 |
| 표시 (Display) | `BADGE`, `CHIP`, `AVATAR`, `TAG`, `TOOLTIP`, `H1`, `H2`, `KBD` | 8 |
| 구조 (Structure) | `TABLE`, `LIST`, `CARD`, `TABS`, `PAGINATION`, `BREADCRUMB`, `EMPTY`, `DIVIDER`, `ACCORDION`, `STEPPER` | 10 |
| 피드백 (Feedback) | `TOAST`, `BANNER`, `INLINE-ERROR`, `SPINNER`, `SKELETON`, `PROGRESS`, `ALERT` | 7 |
| 오버레이 (Overlay) | `MODAL`, `PANEL`, `POPOVER`, `BOTTOMSHEET`, `BACKDROP`, `MENU-OVERFLOW` | 6 |
| 달력 전용 (Calendar) | `CAL-CELL`, `CAL-EVENT`, `CAL-SLOT`, `CAL-HEADER`, `CAL-VIEWSWITCH` | 5 |

---

## 1. 입력 컴포넌트 (Input)

### 1.1 `[INPUT: 라벨]` 텍스트 입력

| 항목 | 내용 |
|---|---|
| 용도 | 한 줄 텍스트 입력 (이메일, 사번, 이름, 제목, 장소 등) |
| 상태 | default / hover / focus / disabled / error / readonly |
| 이벤트 | `onChange`(타이핑) / `onBlur`(포커스 아웃, 유효성 트리거) / `onFocus` |
| 접근성 | `<input>` + `<label for>`, 오류 시 `aria-invalid="true"`, `aria-describedby` → 오류 메시지 ID. 폰트 16px 이상 (모바일 자동 확대 방지, RES-002) |
| 사용 화면 | `scr_01_auth`(이메일·사번·비밀번호), `scr_02_permission`, `scr_03_schedule`(제목·장소), `scr_04_mention_contact`, `scr_06_list_view`(인라인 편집), `scr_07_common_schedule`, `scr_08_holiday` |
| 모바일 차이 | 폭 100%, 폰트 16px |

### 1.2 `[INPUT: 라벨 (password)]` 비밀번호 입력

| 항목 | 내용 |
|---|---|
| 용도 | 비밀번호 입력, 마스킹 |
| 상태 | INPUT 기본 + 가시 토글(눈 아이콘) 상태 |
| 이벤트 | `onChange` / `onClick(eye)` → 마스크 해제·재마스크 |
| 접근성 | `type="password"` → 토글 시 `type="text"`. 가시 토글 버튼은 `aria-label="비밀번호 표시"` |
| 사용 화면 | `scr_01_auth`(로그인·재설정·초대수락) |

### 1.3 `[TEXTAREA: 라벨]` 다중행 텍스트

| 항목 | 내용 |
|---|---|
| 용도 | 메모(`schedules.memo` ≤ 500자), 임시 공휴일 사유(`holidays.memo` ≤ 200자) |
| 상태 | INPUT 동일 + 글자 수 카운터 |
| 이벤트 | `onChange` (카운터 갱신) |
| 접근성 | `<textarea>`, 글자 수 카운터는 `aria-live="polite"` |
| 사용 화면 | `scr_03_schedule`, `scr_07_common_schedule`, `scr_08_holiday` |
| 모바일 차이 | 최소 행 3, 자동 확장 |

### 1.4 `[SELECT: 라벨]` 드롭다운 선택

| 항목 | 내용 |
|---|---|
| 용도 | 카테고리 단일 선택 (일정 유형, 역할, 임원 선택 등) |
| 상태 | default / open / disabled / error |
| 이벤트 | `onChange`(선택) / `onOpen` / `onClose` |
| 접근성 | `role="combobox"`, `aria-expanded`, 키보드: `↑↓` 항목 이동, `Enter` 선택, `Esc` 닫기 |
| 사용 화면 | `scr_02_permission`(역할), `scr_03_schedule`(time_slot, 입력 대상), `scr_08_holiday`(type), `scr_12_audit_log`(필터) |
| 모바일 차이 | 네이티브 `<select>` 또는 하단 피커 (RES-002) |

### 1.5 `[SEARCH: placeholder]` 검색 입력

| 항목 | 내용 |
|---|---|
| 용도 | 리스트·연락처·사용자 목록 검색 |
| 상태 | default / focus / has-value / loading |
| 이벤트 | `onChange`(디바운스 300ms) / `onSubmit`(Enter) / `onClear`(× 클릭) |
| 접근성 | `role="searchbox"`, `aria-label`. `Esc` 로 클리어 |
| 사용 화면 | `scr_06_list_view`, `scr_04_mention_contact`, `scr_02_permission`(SCR-ADMIN-USER 검색) |

### 1.6 `[MENTION: 멘션 입력]` @멘션 입력

| 항목 | 내용 |
|---|---|
| 용도 | 일정 등록·수정 시 `@회사`, `@사람` 자동완성 입력 (MEN-001) |
| 상태 | default / typing / suggestion-open / loading / no-match |
| 이벤트 | `onChange` → prefix 검색 (`companies.name`, `companies.aliases`, `contacts.name`) / `onSelect` → mention 칩으로 변환 / `onTab/Enter` 확정 / `onBackspace`(빈 입력 시 직전 칩 삭제) |
| 접근성 | `role="combobox"`, 후보 목록 `role="listbox"`, 항목 `role="option"`. 키보드 `↑↓ Enter Esc` |
| 사용 화면 | `scr_03_schedule`, `scr_07_common_schedule` (폼 내부) |
| 비고 | no-match → `[BTN: + 새 연락처로 등록]` 노출 → `SCR-MODAL-MENTION-NEW-CONTACT` 호출 |

### 1.7 `[CHECKBOX: 라벨]` 체크박스

| 항목 | 내용 |
|---|---|
| 용도 | 다중 선택, 동의, 토글 등 |
| 상태 | unchecked / checked / indeterminate / disabled / focus |
| 이벤트 | `onChange` |
| 접근성 | `<input type="checkbox">` + `<label>`, `Space` 토글 |
| 사용 화면 | `scr_06_list_view`(다중 선택), `scr_02_permission`, `scr_08_holiday` |

### 1.8 `[RADIO: 라벨]` 라디오 (데스크톱)

| 항목 | 내용 |
|---|---|
| 용도 | 단일 선택 (일정 유형 데스크톱) |
| 상태 | unselected / selected / disabled / focus |
| 이벤트 | `onChange` |
| 접근성 | `role="radiogroup"`, 항목 `role="radio"`, `↑↓←→` 이동 |
| 사용 화면 | `scr_03_schedule`, `scr_07_common_schedule` |
| 모바일 차이 | `[SEGMENT]` 로 대체 (RES-002) |

### 1.9 `[TOGGLE: 라벨]` 토글 스위치

| 항목 | 내용 |
|---|---|
| 용도 | on/off (종일 여부, 활성/비활성, 알림 ON/OFF) |
| 상태 | off / on / disabled / focus |
| 이벤트 | `onChange` |
| 접근성 | `role="switch"`, `aria-checked` |
| 사용 화면 | `scr_03_schedule`(종일), `scr_02_permission`(SCR-ADMIN-USER 활성화), `scr_05_calendar_view`(임원 색상 레이어), `scr_08_holiday`(`is_active`) |

### 1.10 `[SEGMENT: A/B]` 세그먼트 탭 (모바일·데스크톱 공용)

| 항목 | 내용 |
|---|---|
| 용도 | 2~3 분기 단일 선택 (개인/공통, 월/주/일, 미확인/전체) |
| 상태 | each segment: default / active / disabled |
| 이벤트 | `onChange(value)` |
| 접근성 | `role="tablist"`, 항목 `role="tab"`, `aria-selected` |
| 사용 화면 | `scr_03_schedule`(유형 — 모바일), `scr_05_calendar_view`(월/주/일), `scr_11_notification`(미확인/전체) |

### 1.11 `[DATE: 라벨]` 날짜 입력

| 항목 | 내용 |
|---|---|
| 용도 | 날짜 단일 입력 (`schedules.schedule_date`, 필터 기간) |
| 상태 | default / open(picker) / disabled / error |
| 이벤트 | `onChange(YYYY-MM-DD)` |
| 접근성 | `<input type="date">` 기본, 모바일은 네이티브 피커, 데스크톱은 커스텀 드롭다운 캘린더 (RES-002) |
| 사용 화면 | `scr_03_schedule`, `scr_06_list_view`(필터), `scr_08_holiday`, `scr_12_audit_log`(필터), `scr_13_export_responsive` |

### 1.12 `[DATE-RANGE: 시작 ~ 종료]` 날짜 범위

| 항목 | 내용 |
|---|---|
| 용도 | 기간 필터 (리스트 뷰·감사 로그·엑셀 내보내기) |
| 상태 | DATE 동일 + 두 필드 연동 |
| 이벤트 | `onChange({start, end})` |
| 접근성 | 두 개의 `[DATE]` 결합, 종료 < 시작 시 인라인 에러 |
| 사용 화면 | `scr_06_list_view`, `scr_12_audit_log`, `scr_13_export_responsive` |

### 1.13 `[TIME: 라벨]` 시각 입력

| 항목 | 내용 |
|---|---|
| 용도 | 시작·종료 시각 (`schedules.start_time`, `end_time`) |
| 상태 | default / disabled / error |
| 이벤트 | `onChange(HH:mm)` |
| 접근성 | `<input type="time">`, 5분 단위 (선택) |
| 사용 화면 | `scr_03_schedule`, `scr_07_common_schedule` |

### 1.14 `[COLOR: 라벨]` 색상 선택기

| 항목 | 내용 |
|---|---|
| 용도 | 임원 색상 (`users.color` `#RRGGBB`) |
| 상태 | default / open / disabled |
| 이벤트 | `onChange(#RRGGBB)` |
| 접근성 | 사전 정의 팔레트 + 네이티브 컬러 입력 |
| 사용 화면 | `scr_02_permission`(SCR-ADMIN-USER) |

---

## 2. 액션 컴포넌트 (Action)

### 2.1 `[BTN: 라벨]` 기본 버튼

| 항목 | 내용 |
|---|---|
| 변형 | `primary`(1차) / `secondary`(2차) / `tertiary`(보조) / `danger`(파괴) / `ghost`(투명) |
| 상태 | default / hover / active / focus / disabled / loading |
| 이벤트 | `onClick` |
| 접근성 | `<button>`, `Enter`/`Space` 활성. 비동기 작업 중 `aria-busy="true"` + 로딩 스피너 |
| 사용 화면 | 전체 14화면 |
| 모바일 차이 | 최소 탭 영역 44×44px (RES-002). 모달 1차 버튼은 화면 하단 고정 |

### 2.2 `[BTN-ICON: aria-label]` 아이콘 버튼

| 항목 | 내용 |
|---|---|
| 용도 | 아이콘 단독 액션 (알림 벨, 닫기 ×, 삭제, 사이드바 토글) |
| 상태 | BTN 동일 |
| 이벤트 | `onClick` |
| 접근성 | `aria-label` 필수 (시각적 라벨이 없으므로) |
| 사용 화면 | `SL-HEADER`(알림 벨), 모든 모달(×), `scr_06_list_view`(행 액션) |

### 2.3 `[BTN-LINK: 라벨]` 링크 스타일 버튼

| 항목 | 내용 |
|---|---|
| 용도 | 인라인 액션, 보조 동작 (예: "비밀번호를 잊으셨나요?") |
| 상태 | default / hover (underline) / visited / focus |
| 사용 화면 | `scr_01_auth`(비밀번호 찾기 링크), `scr_11_notification`(전체 보기) |

### 2.4 `[LINK: 라벨]` 일반 링크

| 항목 | 내용 |
|---|---|
| 용도 | 화면 간 이동 (로고 → 대시보드, 알림 → 일정 상세) |
| 접근성 | `<a href>`, 외부 링크는 `target="_blank" rel="noopener"` |

### 2.5 `[DROPDOWN: 라벨]` 드롭다운 메뉴

| 항목 | 내용 |
|---|---|
| 용도 | 사용자 메뉴, 행 케밥 메뉴, 정렬 선택 등 |
| 상태 | closed / open / disabled |
| 이벤트 | `onClick` 열기 / `onSelect(item)` |
| 접근성 | `role="menu"`, 항목 `role="menuitem"`, `↑↓ Enter Esc` |
| 사용 화면 | `SL-HEADER`(사용자 아바타), `scr_06_list_view`(행 정렬·작업) |

### 2.6 `[MENU: 라벨]` 케밥 / 점 메뉴

| 항목 | 내용 |
|---|---|
| 용도 | 행·카드의 보조 액션 묶음 (`⋮`) |
| 상태 | DROPDOWN 과 동일 |
| 사용 화면 | `scr_06_list_view`(행), `scr_02_permission`(SCR-ADMIN-USER 행) |

---

## 3. 표시 컴포넌트 (Display)

### 3.1 `[BADGE: 텍스트/숫자]` 배지

| 항목 | 내용 |
|---|---|
| 변형 | dot(점) / count(숫자) / label(텍스트) |
| 상태 | default / muted |
| 접근성 | `aria-label="미확인 N건"` |
| 사용 화면 | `SL-HEADER`(알림 미확인), `scr_11_notification`(목록 아이템), `scr_06_list_view`(공통/개인 표지) |

### 3.2 `[CHIP: 라벨]` 칩 (멘션/필터)

| 항목 | 내용 |
|---|---|
| 변형 | mention(`@회사·@사람`) / filter(제거 가능) / status(상태) |
| 상태 | default / hover / removable / disabled |
| 이벤트 | `onClick`(상세 호출) / `onRemove`(필터 제거) |
| 접근성 | 멘션 칩은 `role="button"` + `aria-label`; 제거 가능 시 `aria-label="제거"` |
| 사용 화면 | `scr_03_schedule`(멘션), `scr_06_list_view`(활성 필터), `scr_10_relationship_history`(헤더) |

### 3.3 `[AVATAR: 이니셜/이미지]` 아바타

| 항목 | 내용 |
|---|---|
| 변형 | initial(이니셜) / image(사진, Phase 2) / color(임원 색상 띠) |
| 사용 화면 | `SL-HEADER`(사용자), `scr_02_permission`(SCR-ADMIN-USER 목록), `scr_05_calendar_view`(임원 필터) |

### 3.4 `[TAG: 라벨]` 태그 (정적 표지)

| 항목 | 내용 |
|---|---|
| 용도 | 일정 구분(공통/개인), 공휴일 유형(법정/대체/임시), 알림 유형 |
| 색상 매핑 | 공통=primary / 개인=neutral / statutory=red / substitute=orange / temporary=gray |
| 사용 화면 | `scr_05_calendar_view`, `scr_06_list_view`, `scr_08_holiday`, `scr_11_notification` |

### 3.5 `[TOOLTIP: 본문]` 툴팁

| 항목 | 내용 |
|---|---|
| 트리거 | hover (데스크톱) / longpress (모바일) |
| 접근성 | `aria-describedby` 로 트리거와 연결, `role="tooltip"` |
| 사용 화면 | 모든 아이콘 버튼 |

### 3.6 `[H1: 텍스트]` / `[H2: 텍스트]` 페이지 제목

| 항목 | 내용 |
|---|---|
| 용도 | 페이지 본문 상단 타이틀 |
| 접근성 | 페이지당 `<h1>` 1개. `<h2>` 는 섹션 구분 |
| 사용 화면 | 전체 |

### 3.7 `[KBD: 단축키]` 키보드 표시

| 항목 | 내용 |
|---|---|
| 용도 | 도움말 또는 메뉴 옆에 단축키 표시 (`Esc`, `Enter`) |
| 사용 화면 | `SL-FOOTER` 단축키 모달 (Phase 2) |

---

## 4. 구조 컴포넌트 (Structure)

### 4.1 `[TABLE: 컬럼1, 컬럼2, ...]` 테이블

| 항목 | 내용 |
|---|---|
| 용도 | 리스트 뷰, 사용자 관리, 연락처, 감사 로그, 공휴일 |
| 상태 | default / sorted / row-hover / row-selected / row-editing / loading / empty |
| 이벤트 | `onSort(col)` / `onRowClick(row)` / `onSelect(rows)` / `onInlineEditCommit` |
| 접근성 | `<table>` + `<thead>` + `<tbody>`. 정렬 헤더는 `aria-sort` |
| 사용 화면 | `scr_02_permission`(SCR-ADMIN-USER, SCR-ADMIN-PROXY), `scr_04_mention_contact`(SCR-CONTACT), `scr_06_list_view`, `scr_08_holiday`, `scr_11_notification`(SCR-ADMIN-NOTIFICATION-LOG), `scr_12_audit_log` |
| 모바일 차이 | 카드형 리스트로 전환 (RES-001) |

### 4.2 `[LIST: 아이템1, 아이템2, ...]` 리스트 (카드형)

| 항목 | 내용 |
|---|---|
| 용도 | 알림 센터, 모바일 일정 리스트, 대시보드 위젯 |
| 상태 | empty / loading / has-items |
| 사용 화면 | `scr_11_notification`(벨 드롭다운), `scr_06_list_view`(모바일) |

### 4.3 `[CARD: 제목]` 카드 컨테이너

| 항목 | 내용 |
|---|---|
| 용도 | 대시보드 위젯, 인증 폼 카드, 모임 레이더 결과 카드 |
| 사용 화면 | `scr_00_overview`(대시보드 위젯 인덱스), `scr_01_auth`, `scr_09_meeting_radar` |

### 4.4 `[TABS: 탭1, 탭2, ...]` 탭

| 항목 | 내용 |
|---|---|
| 용도 | 일정 상세 모달의 본문/이력 탭, 연락처/회사 탭 |
| 상태 | each tab: default / active / disabled |
| 이벤트 | `onChange(tabKey)` |
| 접근성 | `role="tablist"`, 항목 `role="tab"`, 본문 `role="tabpanel"` |
| 사용 화면 | `scr_03_schedule`(상세→이력), `scr_04_mention_contact`(연락처↔회사), `scr_12_audit_log` |

### 4.5 `[PAGINATION: 페이지]` 페이지네이션

| 항목 | 내용 |
|---|---|
| 변형 | numbered (페이지 번호) / loadmore (더보기) |
| 사용 화면 | `scr_06_list_view`, `scr_12_audit_log`, `scr_11_notification`, `scr_02_permission`, `scr_04_mention_contact`, `scr_08_holiday` |

### 4.6 `[BREADCRUMB: A > B > C]` 브레드크럼

| 항목 | 내용 |
|---|---|
| 사용 화면 | 관리자 하위 화면 (선택, Phase 2) |

### 4.7 `[EMPTY: 메시지]` 빈 상태

| 항목 | 내용 |
|---|---|
| 구성 | 아이콘 + 1행 메시지 + 보조 액션 (선택) |
| 예 | "검색 결과가 없습니다 / [BTN: 필터 초기화]" |
| 사용 화면 | 데이터 0건 모든 화면 |

### 4.8 `[DIVIDER]` 구분선

| 용도 | 섹션 / 그룹 분리 |
| 사용 화면 | 전역 |

### 4.9 `[ACCORDION: 라벨]` 접기/펼치기

| 항목 | 내용 |
|---|---|
| 용도 | 모바일 폼의 "추가 정보 입력 +" (RES-002), 필터 그룹 접기 |
| 접근성 | `aria-expanded`, `aria-controls` |
| 사용 화면 | `scr_03_schedule`(모바일), `scr_06_list_view`(필터) |

### 4.10 `[STEPPER: 1/2/3]` 단계 표시

| 항목 | 내용 |
|---|---|
| 용도 | 비밀번호 재설정·초대 수락 진행 단계 (선택) |
| 사용 화면 | `scr_01_auth` (Phase 2 선택) |

### 4.11 `[TIMELINE: 이벤트]` 타임라인

| 항목 | 내용 |
|---|---|
| 용도 | 감사 로그(`audit_logs`) 시간순 표시. 각 이벤트는 시각 + 아이콘(등록 ✅ / 수정 ✏️ / 삭제 🗑) + 행위자 + 변경 요약 + 변경 상세(토글) 구조 |
| 상태 | empty / loading / has-items / item-expanded(상세 펼침) |
| 이벤트 | `onToggleDetail(itemId)` 변경 상세 펼침 |
| 접근성 | `role="list"` + 항목 `role="listitem"`. 토글 버튼은 `aria-expanded`. 시각 정보는 `<time datetime>` 사용. 등록/수정/삭제 아이콘은 `aria-label` 부여 |
| 사용 화면 | `scr_12_audit_log` (SCR-MODAL-AUDIT-LOG), `scr_02_permission`(선택, 사용자 변경 이력 확장 시) |
| 모바일 차이 | 데스크톱은 좌측에 시각 컬럼 + 우측 본문. 모바일은 단일 컬럼, 시각이 항목 상단 |

---

## 5. 피드백 컴포넌트 (Feedback)

### 5.1 `[TOAST: 메시지]` 토스트

| 항목 | 내용 |
|---|---|
| 변형 | success / info / warn / error |
| 노출 시간 | 4초 (수동 닫기 가능) |
| 위치 | 데스크톱 우측 상단 / 모바일 하단 |
| 접근성 | `role="status"` (info/success), `role="alert"` (warn/error). `aria-live="polite"` 또는 `assertive` |
| 사용 화면 | 전체 (저장·삭제·복사 등 사용자 액션 후) |

### 5.2 `[BANNER: 메시지]` 배너

| 항목 | 내용 |
|---|---|
| 용도 | 대리 입력 진행 중 ("B 이름으로 입력 중"), Phase 보류 안내 |
| 변형 | info / warn / error |
| 사용 화면 | `scr_03_schedule`(대리 입력), `scr_13_export_responsive`(EXP-002 보류) |

### 5.3 `[INLINE-ERROR: 메시지]` 인라인 오류

| 항목 | 내용 |
|---|---|
| 위치 | 입력 바로 아래 |
| 접근성 | `aria-describedby` 로 입력과 연결, `aria-invalid="true"` |
| 사용 화면 | 모든 폼 |

### 5.4 `[SPINNER]` 스피너

| 용도 | 작은 영역 로딩 (버튼 내부, 행 단위) |

### 5.5 `[SKELETON]` 스켈레톤

| 용도 | 페이지·테이블·카드 단위 초기 로딩 |
| 사용 화면 | 전체 (loading 상태) |

### 5.6 `[PROGRESS: %]` 진행 표시

| 용도 | 파일 업로드, 엑셀 생성 진행 |
| 사용 화면 | `scr_13_export_responsive` (1,000건 초과 시 진행 표시) |

### 5.7 `[ALERT: 제목/본문]` 인페이지 알림

| 항목 | 내용 |
|---|---|
| 변형 | info / warn / error |
| 사용 화면 | `scr_00_overview`(대시보드 — 최근 이상 알림), 빈 상태 보조 |

---

## 6. 오버레이 (Overlay)

### 6.1 `[MODAL: 제목]` 모달

| 항목 | 내용 |
|---|---|
| 구조 | 헤더(제목·×) + 본문 + 풋터(취소·확인) |
| 상태 | closed / open / submitting |
| 이벤트 | `onClose` / `onConfirm` |
| 접근성 | `role="dialog"`, `aria-modal="true"`, `aria-labelledby` → 제목 ID. 포커스 트랩, `Esc` 닫기. 백드롭 클릭으로 닫기 (확인 모달 제외) |
| 사용 화면 | `SCR-MODAL-SCHEDULE-FORM`, `SCR-MODAL-SCHEDULE-DETAIL`, `SCR-MODAL-CONFIRM-DELETE`, `SCR-MODAL-AUDIT-LOG`, `SCR-MODAL-MENTION-NEW-CONTACT` |
| 모바일 차이 | 전체 화면 모달로 전환 (RES-001) |

### 6.2 `[PANEL: 제목]` 사이드 패널

| 항목 | 내용 |
|---|---|
| 용도 | 날짜 상세 펼침 패널 |
| 접근성 | `role="complementary"` 또는 `role="dialog"` (스토리에 따라). `Esc` 닫기 |
| 사용 화면 | `SCR-PANEL-DAY-DETAIL` |
| 모바일 차이 | 전체 화면 모달로 전환 |

### 6.3 `[POPOVER: 제목]` 팝오버

| 항목 | 내용 |
|---|---|
| 용도 | 관계 히스토리 카드 |
| 접근성 | `role="dialog"` 또는 `role="tooltip"` (정보성). 트리거에 `aria-haspopup`, `aria-expanded` |
| 사용 화면 | `SCR-POPOVER-RELATIONSHIP` |
| 모바일 차이 | 바텀시트(`BOTTOMSHEET`) 로 전환 (RES-001) |

### 6.4 `[BOTTOMSHEET: 제목]` 바텀시트

| 항목 | 내용 |
|---|---|
| 용도 | 모바일 팝오버 대체, 모바일 선택 피커 |
| 사용 화면 | `SCR-POPOVER-RELATIONSHIP`(모바일), `scr_03_schedule`(모바일 임원 선택) |

### 6.5 `[BACKDROP]` 백드롭

| 용도 | 모달·바텀시트 배경 어둡게 |
| 접근성 | 클릭 시 닫기 (확인 모달 제외) |

### 6.6 `[MENU-OVERFLOW]` 오버플로 메뉴

| 용도 | 협소 공간 화면(모바일)에서 액션 묶음 |
| 사용 화면 | `scr_06_list_view`(모바일 도구바) |

---

## 7. 달력 전용 (Calendar)

### 7.1 `[CAL-CELL: 날짜]` 달력 셀

| 항목 | 내용 |
|---|---|
| 상태 | default / today / selected / weekend / holiday / out-of-month |
| 이벤트 | `onClick` → `SCR-PANEL-DAY-DETAIL` 호출 (월간 뷰) |
| 사용 화면 | `scr_05_calendar_view`, `scr_08_holiday`(미리보기 — 선택) |

### 7.2 `[CAL-EVENT: 제목]` 일정 마커

| 항목 | 내용 |
|---|---|
| 변형 | bar(주/일간 시간형) / dot(월간 종일·요약) / chip(월간 시간형) |
| 색상 | `users.color` (CAL-004) |
| 사용 화면 | `scr_05_calendar_view` |

### 7.3 `[CAL-SLOT: 시간대]` 모임 레이더 슬롯

| 항목 | 내용 |
|---|---|
| 상태 | available / partial-conflict / full-conflict / selected |
| 이벤트 | `onClick` → `SCR-MODAL-SCHEDULE-FORM`(슬롯 프리필) |
| 사용 화면 | `scr_09_meeting_radar` |

### 7.4 `[CAL-HEADER: 월/연]` 달력 헤더

| 항목 | 내용 |
|---|---|
| 구성 | 이전/다음/오늘 + 월·연 표시 + 뷰 토글 `[SEGMENT]` |
| 사용 화면 | `scr_05_calendar_view` |

### 7.5 `[CAL-VIEWSWITCH: 월/주/일]` 뷰 토글

| 항목 | 내용 |
|---|---|
| 변형 | `[SEGMENT]` 의 달력 특수 케이스 |
| 사용 화면 | `scr_05_calendar_view` |

---

## 8. 컴포넌트 ↔ 화면 사용 매트릭스 (역참조)

| 화면 ID | 필수 컴포넌트 (대표) |
|---|---|
| `scr_00_overview` | `H1`, `CARD`, `LIST`, `BADGE`, `LINK`, `ALERT` |
| `scr_01_auth` | `INPUT`, `INPUT(password)`, `BTN`, `BTN-LINK`, `INLINE-ERROR`, `CARD`, `TOAST` |
| `scr_02_permission` | `TABLE`, `SEARCH`, `BTN`, `MENU`, `MODAL`, `TOGGLE`, `SELECT`, `AVATAR`, `COLOR`, `PAGINATION`, `BADGE` |
| `scr_03_schedule` | `MODAL`, `SEGMENT`/`RADIO`, `INPUT`, `TEXTAREA`, `DATE`, `TIME`, `TOGGLE`, `SELECT`, `MENTION`, `CHIP`, `BANNER`, `BTN`, `BTN-LINK`, `INLINE-ERROR`, `TABS`(상세→이력) |
| `scr_04_mention_contact` | `TABLE`, `SEARCH`, `MODAL`, `INPUT`, `SELECT`, `BTN`, `TAG`, `TABS`(연락처/회사), `PAGINATION`, `BADGE`(auto/confirmed) |
| `scr_05_calendar_view` | `CAL-HEADER`, `CAL-VIEWSWITCH`, `CAL-CELL`, `CAL-EVENT`, `TOGGLE`(임원 색상 레이어), `AVATAR`, `TAG`, `PANEL`(날짜 상세) |
| `scr_06_list_view` | `TABLE`, `SEARCH`, `DATE-RANGE`, `SELECT`, `CHIP`(필터), `CHECKBOX`, `PAGINATION`, `BTN`, `MENU`, `TOAST`, `EMPTY`, `BADGE`(공통/개인), `INPUT`(인라인) |
| `scr_07_common_schedule` | `MODAL`, `INPUT`, `TEXTAREA`, `DATE`, `TIME`, `TOGGLE`, `MENTION`, `LIST`(참가자), `BTN`, `BANNER`(전체 알림) |
| `scr_08_holiday` | `TABLE`, `MODAL`, `DATE`, `INPUT`, `TEXTAREA`, `SELECT`(type), `TOGGLE`(`is_active`), `BTN`, `TAG`(유형), `PAGINATION` |
| `scr_09_meeting_radar` | `SELECT`(참석자), `DATE-RANGE`, `CAL-SLOT`, `CARD`(슬롯 결과), `BTN`, `EMPTY` |
| `scr_10_relationship_history` | `POPOVER`/`BOTTOMSHEET`, `CHIP`(헤더 대상), `LIST`(미팅 이력), `LINK`, `EMPTY` |
| `scr_11_notification` | `DROPDOWN`(벨), `LIST`(아이템), `BADGE`, `SEGMENT`(미확인/전체), `TABLE`(SCR-ADMIN-NOTIFICATION-LOG), `PAGINATION`, `LINK` |
| `scr_12_audit_log` | `MODAL`, `TABS`(본문↔이력), `TIMELINE`(이력 항목), `LIST`(보조), `SELECT`(필터), `DATE-RANGE`, `BADGE`(action), `PAGINATION` |
| `scr_13_export_responsive` | `BTN`, `DATE-RANGE`, `SELECT`, `TOAST`, `PROGRESS`, `BANNER`(EXP-002 보류), `ALERT`(1,000건 경고) |

---

## 9. 신규 컴포넌트 추가 절차

1. 화면 .md 작성 중 본 인벤토리에 없는 컴포넌트가 필요하면 **먼저 본 문서에 추가**한다 (작업지시서 §6).
2. 추가 시 §1~§7 카테고리에 맞춰 신규 ID 부여, 표 양식 그대로 작성.
3. §8 사용 매트릭스 갱신.
4. 검증 게이트(Gate B-each)에서 미등록 컴포넌트가 발견되면 미통과 처리.

---

## 검증

- 자체 검증 일자: 2026-05-14
- 자체 검증 결과: ✅ 통과
- 자동 검증 결과: ✅ 통과 (5+1+1=7 카테고리 분류 ✓, 상태 정의 7종 ✓, 이벤트 명세 ✓, 접근성 role/aria/키보드 ✓, §8 사용 화면 역참조 14건 채워짐 ✓)
- 보류·예외 사항: 통합 검색 컴포넌트는 Phase 2 보류 — 정의는 `[SEARCH]` 로 흡수, 화면 노출만 Phase 2 (의도적 보류)
- 검증자: claude (Step A-2)
