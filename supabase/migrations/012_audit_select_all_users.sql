-- 012_audit_select_all_users.sql
-- 변경 이력을 임원/직원 포함 전체 인증 사용자가 조회할 수 있도록 정책 확대

DROP POLICY IF EXISTS audit_select ON audit_logs;

CREATE POLICY audit_select ON audit_logs FOR SELECT
  USING (auth.uid() IS NOT NULL);
