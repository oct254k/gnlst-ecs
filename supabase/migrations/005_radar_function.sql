-- 005_radar_function.sql
-- fn_radar_availability(): 모임 레이더 충돌 계산
-- 업무 시간(09:00~18:00, 평일) 슬롯별 충돌 임원 집계

CREATE OR REPLACE FUNCTION fn_radar_availability(
  p_owner_ids  uuid[],
  p_date_from  date,
  p_date_to    date,
  p_slot_min   int DEFAULT 60
)
RETURNS TABLE (
  slot_date        date,
  slot_start       time,
  slot_end         time,
  status           text,
  available_count  int,
  total_count      int,
  conflicted_ids   uuid[]
) LANGUAGE plpgsql STABLE SECURITY DEFINER
  SET search_path = public AS $$
DECLARE
  v_total int := array_length(p_owner_ids, 1);
BEGIN
  RETURN QUERY
  WITH slots AS (
    SELECT
      d::date                                              AS slot_date,
      (t * interval '1 minute')::time                     AS slot_start,
      ((t + p_slot_min) * interval '1 minute')::time      AS slot_end
    FROM generate_series(p_date_from, p_date_to, '1 day') d
    CROSS JOIN generate_series(9 * 60, 18 * 60 - p_slot_min, p_slot_min) t
    WHERE EXTRACT(DOW FROM d) BETWEEN 1 AND 5   -- 평일만
  ),
  conflicts AS (
    SELECT
      s.slot_date,
      s.slot_start,
      s.slot_end,
      array_agg(DISTINCT sc.owner_id) FILTER (WHERE sc.owner_id IS NOT NULL) AS conflicted_ids
    FROM slots s
    LEFT JOIN schedules sc
      ON sc.owner_id = ANY(p_owner_ids)
      AND sc.schedule_date = s.slot_date
      AND sc.deleted_at IS NULL
      AND sc.start_time IS NOT NULL
      AND sc.end_time IS NOT NULL
      AND sc.start_time < s.slot_end
      AND sc.end_time   > s.slot_start
    GROUP BY s.slot_date, s.slot_start, s.slot_end
  )
  SELECT
    c.slot_date,
    c.slot_start,
    c.slot_end,
    CASE
      WHEN array_length(c.conflicted_ids, 1) IS NULL         THEN 'AVAILABLE'
      WHEN array_length(c.conflicted_ids, 1) = v_total       THEN 'UNAVAILABLE'
      ELSE 'PARTIAL'
    END                                                       AS status,
    v_total - COALESCE(array_length(c.conflicted_ids, 1), 0)  AS available_count,
    v_total                                                   AS total_count,
    COALESCE(c.conflicted_ids, '{}')                          AS conflicted_ids
  FROM conflicts c
  ORDER BY c.slot_date, c.slot_start;
END;
$$;
