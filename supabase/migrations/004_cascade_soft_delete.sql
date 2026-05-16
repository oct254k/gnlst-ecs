-- 004_cascade_soft_delete.sql
-- schedules soft delete 시 연관 테이블 연쇄 처리
--
-- ERD 기준 적용:
-- - schedule_participants: deleted_at 컬럼 없음 → status = 'cancelled', cancelled_at 갱신
-- - mentions: deleted_at 컬럼 없음 → 물리 삭제 (CASCADE 의미, 이력 보존 불필요)

CREATE OR REPLACE FUNCTION fn_soft_delete_cascade()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF NEW.deleted_at IS NOT NULL AND OLD.deleted_at IS NULL THEN
    -- 참가자 상태를 cancelled 로 변경 (soft delete 대신 status 사용)
    UPDATE schedule_participants
      SET status = 'cancelled', cancelled_at = NEW.deleted_at
      WHERE schedule_id = NEW.id AND status = 'joined';

    -- 멘션 물리 삭제 (mentions 테이블에 deleted_at 없음, CASCADE 의미)
    DELETE FROM mentions WHERE schedule_id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_schedule_cascade_delete
  AFTER UPDATE OF deleted_at ON schedules
  FOR EACH ROW EXECUTE FUNCTION fn_soft_delete_cascade();
