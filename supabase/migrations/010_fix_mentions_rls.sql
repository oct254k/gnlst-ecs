-- 010_fix_mentions_rls.sql
-- mentions 테이블 RLS 정책 수정
--
-- 기존 mentions_write (ALL, USING false / WITH CHECK false) 가 INSERT/DELETE 를 전부 차단.
-- 일정 소유자·작성자(및 admin)가 자기 일정의 멘션을 INSERT/DELETE 할 수 있도록 교체.

-- 기존 전체 차단 정책 제거
DROP POLICY IF EXISTS mentions_write ON mentions;

-- INSERT: 해당 schedule 의 owner 또는 created_by 이거나 admin
CREATE POLICY mentions_insert ON mentions FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM schedules s
      WHERE s.id = schedule_id
        AND s.deleted_at IS NULL
        AND (
          (auth.jwt()->'user_metadata'->>'role') = 'admin'
          OR s.owner_id   = auth.uid()
          OR s.created_by = auth.uid()
        )
    )
  );

-- DELETE: INSERT 와 동일 기준 (PATCH 핸들러가 mentions 전체 교체 시 DELETE 사용)
CREATE POLICY mentions_delete ON mentions FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM schedules s
      WHERE s.id = schedule_id
        AND s.deleted_at IS NULL
        AND (
          (auth.jwt()->'user_metadata'->>'role') = 'admin'
          OR s.owner_id   = auth.uid()
          OR s.created_by = auth.uid()
        )
    )
  );
