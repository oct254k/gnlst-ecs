-- 009_radar_fn_fix.sql
-- fn_radar_availability: 반환 컬럼명 ambiguous 오류 수정
-- 최종 SELECT에 CTE 별칭(r.) 명시

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
  weekdays AS (
    SELECT d::date AS day
    FROM generate_series(p_date_from, p_date_to, '1 day') d
    WHERE EXTRACT(DOW FROM d) BETWEEN 1 AND 5
  ),
  allday_blocked AS (
    SELECT DISTINCT sc.schedule_date AS day
    FROM schedules sc
    WHERE sc.owner_id = ANY(p_owner_ids)
      AND sc.deleted_at IS NULL
      AND sc.is_all_day = true
  ),
  valid_days AS (
    SELECT w.day FROM weekdays w
    WHERE NOT EXISTS (
      SELECT 1 FROM allday_blocked ab WHERE ab.day = w.day
    )
  ),
  has_schedule AS (
    SELECT DISTINCT sc.schedule_date AS day
    FROM schedules sc
    WHERE sc.owner_id = ANY(p_owner_ids)
      AND sc.deleted_at IS NULL
      AND sc.is_all_day = false
  ),
  fixed_slots (fs_key, fs_start, fs_end) AS (
    VALUES
      ('morning'::text,   '09:00'::time, '12:00'::time),
      ('lunch'::text,     '12:00'::time, '14:00'::time),
      ('afternoon'::text, '14:00'::time, '18:00'::time),
      ('evening'::text,   '18:00'::time, '22:00'::time)
  ),
  slot_conflicts AS (
    SELECT
      vd.day,
      fs.fs_key,
      fs.fs_start,
      fs.fs_end,
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
      AND sc.start_time < fs.fs_end
      AND sc.end_time   > fs.fs_start
    GROUP BY vd.day, fs.fs_key, fs.fs_start, fs.fs_end
  ),
  results AS (
    SELECT
      vd.day        AS r_date,
      'allday'::text AS r_key,
      '00:00'::time  AS r_start,
      '23:59'::time  AS r_end,
      v_total        AS r_total
    FROM valid_days vd
    WHERE NOT EXISTS (
      SELECT 1 FROM has_schedule hs WHERE hs.day = vd.day
    )
    UNION ALL
    SELECT
      sc2.day       AS r_date,
      sc2.fs_key    AS r_key,
      sc2.fs_start  AS r_start,
      sc2.fs_end    AS r_end,
      v_total       AS r_total
    FROM slot_conflicts sc2
    WHERE sc2.conflict_count = 0
      AND EXISTS (
        SELECT 1 FROM has_schedule hs WHERE hs.day = sc2.day
      )
  )
  SELECT
    r.r_date,
    r.r_key,
    r.r_start,
    r.r_end,
    r.r_total
  FROM results r
  ORDER BY
    r.r_date,
    CASE r.r_key
      WHEN 'allday'    THEN 0
      WHEN 'morning'   THEN 1
      WHEN 'lunch'     THEN 2
      WHEN 'afternoon' THEN 3
      WHEN 'evening'   THEN 4
    END
  LIMIT 30;
END;
$$;
