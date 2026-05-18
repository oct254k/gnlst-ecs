-- 013_all_users_see_all_schedules.sql
-- 일정 전체 공개: 인증된 사용자는 모든 일정 조회 가능
-- 사용자 목록 공개: 인증된 사용자는 활성 사용자 전체 조회 가능 (관리자 포함)

-- schedules: 인증된 사용자 전체 조회 허용
DROP POLICY IF EXISTS schedules_select ON schedules;
CREATE POLICY schedules_select ON schedules FOR SELECT
  USING (deleted_at IS NULL AND auth.uid() IS NOT NULL);

-- users: 활성 사용자는 role 관계없이 전체 조회 허용 (관리자 계정 포함)
DROP POLICY IF EXISTS users_select ON users;
CREATE POLICY users_select ON users FOR SELECT
  USING (
    (auth.jwt()->'user_metadata'->>'role') = 'admin'
    OR id = auth.uid()
    OR (status = 'active' AND deleted_at IS NULL)
  );

-- schedule_participants: 비삭제 일정의 참가자 정보 전체 조회 허용
DROP POLICY IF EXISTS sp_select ON schedule_participants;
CREATE POLICY sp_select ON schedule_participants FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM schedules s
      WHERE s.id = schedule_id
        AND s.deleted_at IS NULL
        AND auth.uid() IS NOT NULL
    )
  );

-- mentions: 비삭제 일정의 멘션 정보 전체 조회 허용
DROP POLICY IF EXISTS mentions_select ON mentions;
CREATE POLICY mentions_select ON mentions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM schedules s
      WHERE s.id = schedule_id
        AND s.deleted_at IS NULL
        AND auth.uid() IS NOT NULL
    )
  );
