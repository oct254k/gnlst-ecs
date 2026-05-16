-- 006_relationship_function.sql
-- fn_relationship_summary(): @회사/@사람 태그의 미팅 이력 집계
--
-- spec §5-4의 SQL은 window 함수를 FILTER절 안에 사용하는 등 유효하지 않은 구문을 포함.
-- 동일한 의미(entity 정보, 총 미팅 수, 최근 미팅일, 최근 미팅 임원, 최근 N건 미팅 목록)를
-- CTE 기반으로 올바르게 재작성.
-- 주의: mentions 테이블에 deleted_at 컬럼이 없으므로 해당 조건 제거.

CREATE OR REPLACE FUNCTION fn_relationship_summary(
  p_ref_type  text,   -- 'contact' | 'company'
  p_ref_id    uuid,
  p_limit     int DEFAULT 10
)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER AS $$
DECLARE
  v_entity_name       text;
  v_total_count       bigint;
  v_last_meeting_date date;
  v_last_executive    text;
  v_meetings          jsonb;
  v_result            jsonb;
BEGIN
  -- entity 이름 조회
  IF p_ref_type = 'contact' THEN
    SELECT name INTO v_entity_name FROM contacts WHERE id = p_ref_id;
  ELSE
    SELECT name INTO v_entity_name FROM companies WHERE id = p_ref_id;
  END IF;

  -- 총 미팅 수 + 최근 미팅일
  SELECT
    COUNT(*),
    MAX(s.schedule_date)
  INTO v_total_count, v_last_meeting_date
  FROM mentions m
  JOIN schedules s ON s.id = m.schedule_id AND s.deleted_at IS NULL
  WHERE m.reference_type = p_ref_type
    AND m.reference_id = p_ref_id;

  -- 최근 미팅의 임원 이름
  IF v_last_meeting_date IS NOT NULL THEN
    SELECT u.name INTO v_last_executive
    FROM mentions m
    JOIN schedules s ON s.id = m.schedule_id AND s.deleted_at IS NULL
    JOIN users u     ON u.id = s.owner_id
    WHERE m.reference_type = p_ref_type
      AND m.reference_id = p_ref_id
      AND s.schedule_date = v_last_meeting_date
    ORDER BY s.created_at DESC
    LIMIT 1;
  END IF;

  -- 최근 N건 미팅 목록
  SELECT jsonb_agg(
    jsonb_build_object(
      'schedule_id',     t.id,
      'date',            t.schedule_date,
      'executive_name',  t.exec_name,
      'location',        t.location,
      'title',           t.title
    ) ORDER BY t.schedule_date DESC
  )
  INTO v_meetings
  FROM (
    SELECT
      s.id,
      s.schedule_date,
      u.name AS exec_name,
      s.location,
      s.title
    FROM mentions m
    JOIN schedules s ON s.id = m.schedule_id AND s.deleted_at IS NULL
    JOIN users u     ON u.id = s.owner_id
    WHERE m.reference_type = p_ref_type
      AND m.reference_id = p_ref_id
    ORDER BY s.schedule_date DESC
    LIMIT p_limit
  ) t;

  v_result := jsonb_build_object(
    'entity_type',       p_ref_type,
    'entity_name',       v_entity_name,
    'total_count',       v_total_count,
    'last_meeting_date', v_last_meeting_date,
    'last_executive',    v_last_executive,
    'meetings',          COALESCE(v_meetings, '[]'::jsonb)
  );

  RETURN v_result;
END;
$$;
