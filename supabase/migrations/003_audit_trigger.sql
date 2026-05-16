-- 003_audit_trigger.sql
-- fn_audit_log() 트리거: INSERT/UPDATE/DELETE 시 audit_logs 자동 기록
--
-- 설계 결정:
-- - auth.uid() = NULL (Edge Function / Service Role 호출) 인 경우 감사 로그를 건너뛴다.
--   (actor_id NOT NULL 제약 + actor_name_snapshot NOT NULL 제약 준수)
-- - on_behalf_of_id: current_setting('app.on_behalf_of_id', true) 가 비어있지 않으면 사용
-- - actor_name_snapshot: users 테이블에서 auth.uid() 기준 스냅샷 조회

CREATE OR REPLACE FUNCTION fn_audit_log()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_actor_id          uuid;
  v_actor_name        text;
  v_on_behalf_of_id   uuid;
  v_on_behalf_of_name text;
  v_setting           text;
  v_changed_fields    text[];
BEGIN
  -- auth.uid() 가 NULL이면 시스템/Service Role 호출 → 감사 로그 생략
  v_actor_id := auth.uid();
  IF v_actor_id IS NULL THEN
    RETURN COALESCE(NEW, OLD);
  END IF;

  -- actor 이름 스냅샷
  SELECT name INTO v_actor_name
    FROM users WHERE id = v_actor_id;

  -- on_behalf_of_id: 트랜잭션 내 SET LOCAL app.on_behalf_of_id = ':uuid' 로 주입
  v_setting := current_setting('app.on_behalf_of_id', true);
  IF v_setting IS NOT NULL AND v_setting <> '' THEN
    v_on_behalf_of_id := v_setting::uuid;
    SELECT name INTO v_on_behalf_of_name
      FROM users WHERE id = v_on_behalf_of_id;
  END IF;

  -- UPDATE 시 변경된 컬럼명 배열 계산
  IF TG_OP = 'UPDATE' THEN
    SELECT array_agg(key) INTO v_changed_fields
    FROM jsonb_each(to_jsonb(NEW))
    WHERE to_jsonb(NEW)->>key IS DISTINCT FROM to_jsonb(OLD)->>key;
  END IF;

  -- TG_TABLE_NAME(복수) → target_type CHECK 제약(단수) 매핑
  v_setting := CASE TG_TABLE_NAME
    WHEN 'schedules'         THEN 'schedule'
    WHEN 'contacts'          THEN 'contact'
    WHEN 'companies'         THEN 'company'
    WHEN 'proxy_permissions' THEN 'proxy_permission'
    WHEN 'holidays'          THEN 'holiday'
    WHEN 'users'             THEN 'user'
    ELSE TG_TABLE_NAME
  END;

  INSERT INTO audit_logs (
    target_type,
    target_id,
    action,
    actor_id,
    actor_name_snapshot,
    on_behalf_of_id,
    on_behalf_of_name_snapshot,
    before_data,
    after_data,
    changed_fields
  ) VALUES (
    v_setting,
    COALESCE(NEW.id, OLD.id),
    CASE TG_OP
      WHEN 'INSERT' THEN 'created'
      WHEN 'UPDATE' THEN 'updated'
      ELSE 'deleted'
    END,
    v_actor_id,
    v_actor_name,
    v_on_behalf_of_id,
    v_on_behalf_of_name,
    CASE TG_OP WHEN 'INSERT' THEN NULL ELSE to_jsonb(OLD) END,
    CASE TG_OP WHEN 'DELETE' THEN NULL ELSE to_jsonb(NEW) END,
    v_changed_fields
  );

  RETURN COALESCE(NEW, OLD);
END;
$$;


-- 5개 테이블에 트리거 부착
CREATE TRIGGER trg_audit_schedules
  AFTER INSERT OR UPDATE OR DELETE ON schedules
  FOR EACH ROW EXECUTE FUNCTION fn_audit_log();

CREATE TRIGGER trg_audit_contacts
  AFTER INSERT OR UPDATE OR DELETE ON contacts
  FOR EACH ROW EXECUTE FUNCTION fn_audit_log();

CREATE TRIGGER trg_audit_companies
  AFTER INSERT OR UPDATE OR DELETE ON companies
  FOR EACH ROW EXECUTE FUNCTION fn_audit_log();

CREATE TRIGGER trg_audit_proxy_permissions
  AFTER INSERT OR UPDATE OR DELETE ON proxy_permissions
  FOR EACH ROW EXECUTE FUNCTION fn_audit_log();

CREATE TRIGGER trg_audit_holidays
  AFTER INSERT OR UPDATE OR DELETE ON holidays
  FOR EACH ROW EXECUTE FUNCTION fn_audit_log();
