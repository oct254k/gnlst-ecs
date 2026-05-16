-- 008_radar_fn_v2.sql
-- fn_radar_availability 재설계
-- - 종일 일정 있는 사람이 한 명이라도 있으면 그날 전체 제외
-- - 선택 인원 모두 아무 일정 없는 날 → allday 1개 반환
-- - 전원 가능한 슬롯만 반환 (AVAILABLE only), 최대 30개

DROP FUNCTION IF EXISTS fn_radar_availability(uuid[], date, date, int);

CREATE OR REPLACE FUNCTION fn_radar_availability(
  p_owner_ids  uuid[],
  p_date_from  date,
  p_date_to    date
)
RETURNS TABLE (
  slot_date    date,
  slot_key     text,
  slot_start   time,
  slot_end     time,
  total_count  int
) LANGUAGE plpgsql STABLE SECURITY DEFINER
  SET search_path = public AS $$
DECLARE
  v_total int := array_length(p_owner_ids, 1);
BEGIN
  RETURN QUERY
  WITH
  -- 조회 기간 평일 목록
  weekdays AS (
    SELECT d::date AS day
    FROM generate_series(p_date_from, p_date_to, '1 day') d
    WHERE EXTRACT(DOW FROM d) BETWEEN 1 AND 5
  ),
  -- 종일 일정이 하나라도 있는 날 → 완전 제외
  allday_blocked AS (
    SELECT DISTINCT sc.schedule_date AS day
    FROM schedules sc
    WHERE sc.owner_id = ANY(p_owner_ids)
      AND sc.deleted_at IS NULL
      AND sc.is_all_day = true
  ),
  -- 종일 차단 없는 유효한 평일
  valid_days AS (
    SELECT w.day FROM weekdays w
    WHERE NOT EXISTS (
      SELECT 1 FROM allday_blocked ab WHERE ab.day = w.day
    )
  ),
  -- 유효한 날 중 선택 인원의 시간 기반 일정이 하나라도 있는 날
  has_schedule AS (
    SELECT DISTINCT sc.schedule_date AS day
    FROM schedules sc
    WHERE sc.owner_id = ANY(p_owner_ids)
      AND sc.deleted_at IS NULL
      AND sc.is_all_day = false
  ),
  -- 4개 고정 슬롯 정의
  fixed_slots (slot_key, slot_start, slot_end) AS (
    VALUES
      ('morning'::text,   '09:00'::time, '12:00'::time),
      ('lunch'::text,     '12:00'::time, '14:00'::time),
      ('afternoon'::text, '14:00'::time, '18:00'::time),
      ('evening'::text,   '18:00'::time, '22:00'::time)
  ),
  -- 슬롯별 충돌 수 (시간 기반 일정만)
  slot_conflicts AS (
    SELECT
      vd.day,
      fs.slot_key,
      fs.slot_start,
      fs.slot_end,
      COUNT(DISTINCT sc.owner_id) AS conflict_count
    FROM valid_days vd
    CROSS JOIN fixed_slots fs
    LEFT JOIN schedules sc
      ON sc.owner_id = ANY(p_owner_ids)
      AND sc.schedule_date = vd.day
      AND sc.deleted_at IS NULL
      AND sc.is_all_day = false
      AND sc.start_time IS NOT NULL
      AND sc.end_time IS NOT NULL
      AND sc.start_time < fs.slot_end
      AND sc.end_time   > fs.slot_start
    GROUP BY vd.day, fs.slot_key, fs.slot_start, fs.slot_end
  ),
  results AS (
    -- 아무 일정도 없는 날 → 종일 1개
    SELECT
      vd.day       AS slot_date,
      'allday'     AS slot_key,
      '00:00'::time AS slot_start,
      '23:59'::time AS slot_end,
      v_total      AS total_count
    FROM valid_days vd
    WHERE NOT EXISTS (
      SELECT 1 FROM has_schedule hs WHERE hs.day = vd.day
    )

    UNION ALL

    -- 일정이 있는 날 중 전원 가능한 슬롯
    SELECT
      sc2.day      AS slot_date,
      sc2.slot_key,
      sc2.slot_start,
      sc2.slot_end,
      v_total      AS total_count
    FROM slot_conflicts sc2
    WHERE sc2.conflict_count = 0
      AND EXISTS (
        SELECT 1 FROM has_schedule hs WHERE hs.day = sc2.day
      )
  )
  SELECT slot_date, slot_key, slot_start, slot_end, total_count
  FROM results
  ORDER BY
    slot_date,
    CASE slot_key
      WHEN 'allday'    THEN 0
      WHEN 'morning'   THEN 1
      WHEN 'lunch'     THEN 2
      WHEN 'afternoon' THEN 3
      WHEN 'evening'   THEN 4
    END
  LIMIT 30;
END;
$$;
