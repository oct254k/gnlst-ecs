-- 002_rls_policies.sql
-- RLS 정책: admin / user 2종 역할
-- role 판별: auth.jwt()->'user_metadata'->>'role'  (users 테이블 JOIN 없이)

-- ============================================================
-- users
-- ============================================================
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- SELECT: admin은 전체, user는 자신 + 활성 임원
CREATE POLICY users_select ON users FOR SELECT
  USING (
    (auth.jwt()->'user_metadata'->>'role') = 'admin'
    OR id = auth.uid()
    OR (role = 'user' AND status = 'active' AND deleted_at IS NULL)
  );

-- INSERT/UPDATE/DELETE: Service Role (Route Handler) 전용 — anon/user 차단
CREATE POLICY users_write ON users FOR ALL
  USING (false) WITH CHECK (false);


-- ============================================================
-- schedules
-- ============================================================
ALTER TABLE schedules ENABLE ROW LEVEL SECURITY;

-- SELECT: admin 전체, user는 자신·대리입력·공통 일정
CREATE POLICY schedules_select ON schedules FOR SELECT
  USING (
    deleted_at IS NULL AND (
      (auth.jwt()->'user_metadata'->>'role') = 'admin'
      OR owner_id = auth.uid()
      OR created_by = auth.uid()
      OR type = 'common'
    )
  );

-- INSERT: 인증된 사용자 전체
CREATE POLICY schedules_insert ON schedules FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- UPDATE: 본인 또는 admin
-- WITH CHECK (true): soft delete(PATCH deleted_at) 후 PostgREST RETURNING 시
-- SELECT 정책(deleted_at IS NULL)에 걸려 500이 나지 않도록 RETURNING 체크를 통과시킴
CREATE POLICY schedules_update ON schedules FOR UPDATE
  USING (
    (auth.jwt()->'user_metadata'->>'role') = 'admin'
    OR owner_id = auth.uid()
  )
  WITH CHECK (true);

-- DELETE: 차단 (soft delete만 허용 — UPDATE로 처리)
CREATE POLICY schedules_delete ON schedules FOR DELETE USING (false);


-- ============================================================
-- schedule_participants
-- ============================================================
ALTER TABLE schedule_participants ENABLE ROW LEVEL SECURITY;

-- SELECT: 연결된 schedule 접근 권한 상속
CREATE POLICY sp_select ON schedule_participants FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM schedules s
      WHERE s.id = schedule_id
        AND s.deleted_at IS NULL
        AND (
          (auth.jwt()->'user_metadata'->>'role') = 'admin'
          OR s.owner_id = auth.uid()
          OR s.type = 'common'
        )
    )
  );

-- INSERT: 본인 추가 또는 admin
CREATE POLICY sp_insert ON schedule_participants FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
    OR (auth.jwt()->'user_metadata'->>'role') = 'admin'
  );

-- UPDATE: 본인 또는 admin (status 변경용)
CREATE POLICY sp_update ON schedule_participants FOR UPDATE
  USING (
    user_id = auth.uid()
    OR (auth.jwt()->'user_metadata'->>'role') = 'admin'
  );


-- ============================================================
-- mentions
-- ============================================================
ALTER TABLE mentions ENABLE ROW LEVEL SECURITY;

-- SELECT: 연결된 schedule 접근 권한 상속
CREATE POLICY mentions_select ON mentions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM schedules s
      WHERE s.id = schedule_id
        AND s.deleted_at IS NULL
        AND (
          (auth.jwt()->'user_metadata'->>'role') = 'admin'
          OR s.owner_id = auth.uid()
          OR s.type = 'common'
        )
    )
  );

-- INSERT/DELETE: schedule 쓰기 권한 보유자 (Route Handler에서 Service Role 사용)
CREATE POLICY mentions_write ON mentions FOR ALL USING (false) WITH CHECK (false);


-- ============================================================
-- proxy_permissions
-- ============================================================
ALTER TABLE proxy_permissions ENABLE ROW LEVEL SECURITY;

-- SELECT: admin 전체, user는 자신이 proxy이거나 target인 행
CREATE POLICY proxy_select ON proxy_permissions FOR SELECT
  USING (
    (auth.jwt()->'user_metadata'->>'role') = 'admin'
    OR proxy_user_id = auth.uid()
    OR target_user_id = auth.uid()
  );

-- INSERT: 인증 사용자 (Server Action에서 처리)
CREATE POLICY proxy_insert ON proxy_permissions FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- UPDATE: 인증 사용자 (revoked_at 갱신용)
CREATE POLICY proxy_update ON proxy_permissions FOR UPDATE
  USING (auth.uid() IS NOT NULL);


-- ============================================================
-- companies
-- ============================================================
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;

-- SELECT: 인증 사용자 전체 읽기
CREATE POLICY companies_select ON companies FOR SELECT
  USING (deleted_at IS NULL AND auth.uid() IS NOT NULL);

-- INSERT/UPDATE/DELETE: admin only
CREATE POLICY companies_write ON companies FOR ALL
  USING ((auth.jwt()->'user_metadata'->>'role') = 'admin')
  WITH CHECK ((auth.jwt()->'user_metadata'->>'role') = 'admin');


-- ============================================================
-- contacts
-- ============================================================
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;

-- SELECT: 인증 사용자 전체 읽기
CREATE POLICY contacts_select ON contacts FOR SELECT
  USING (deleted_at IS NULL AND auth.uid() IS NOT NULL);

-- INSERT/UPDATE/DELETE: admin only
CREATE POLICY contacts_write ON contacts FOR ALL
  USING ((auth.jwt()->'user_metadata'->>'role') = 'admin')
  WITH CHECK ((auth.jwt()->'user_metadata'->>'role') = 'admin');


-- ============================================================
-- holidays
-- ============================================================
ALTER TABLE holidays ENABLE ROW LEVEL SECURITY;

-- SELECT: 인증 사용자 전체 (활성 공휴일만)
CREATE POLICY holidays_select ON holidays FOR SELECT
  USING (is_active = true AND auth.uid() IS NOT NULL);

-- INSERT/UPDATE/DELETE: admin only
CREATE POLICY holidays_write ON holidays FOR ALL
  USING ((auth.jwt()->'user_metadata'->>'role') = 'admin')
  WITH CHECK ((auth.jwt()->'user_metadata'->>'role') = 'admin');


-- ============================================================
-- notification_logs
-- ============================================================
ALTER TABLE notification_logs ENABLE ROW LEVEL SECURITY;

-- SELECT: admin 전체, user 자신
CREATE POLICY notif_select ON notification_logs FOR SELECT
  USING (
    (auth.jwt()->'user_metadata'->>'role') = 'admin'
    OR recipient_id = auth.uid()
  );

-- UPDATE (read_at): 본인만
CREATE POLICY notif_update ON notification_logs FOR UPDATE
  USING (recipient_id = auth.uid())
  WITH CHECK (recipient_id = auth.uid());

-- INSERT: Edge Function / Service Role 전용 (차단)
CREATE POLICY notif_insert ON notification_logs FOR INSERT WITH CHECK (false);


-- ============================================================
-- audit_logs
-- ============================================================
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- SELECT: admin 전체, user 자신이 actor이거나 on_behalf_of인 행
CREATE POLICY audit_select ON audit_logs FOR SELECT
  USING (
    (auth.jwt()->'user_metadata'->>'role') = 'admin'
    OR actor_id = auth.uid()
    OR on_behalf_of_id = auth.uid()
  );

-- INSERT: 트리거 전용 (SECURITY DEFINER 함수가 직접 INSERT, 일반 INSERT 차단)
CREATE POLICY audit_insert ON audit_logs FOR INSERT WITH CHECK (false);

-- UPDATE/DELETE: 불변 로그 — 전면 차단
CREATE POLICY audit_no_modify ON audit_logs FOR UPDATE USING (false);
CREATE POLICY audit_no_delete ON audit_logs FOR DELETE USING (false);
