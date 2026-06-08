-- ============================================================
-- Tri·log Migration — athletes 新增 name 欄位
-- spec v2.2（2026-06-07）
--
-- 設計說明：
--   nickname  選填，純顯示用暱稱，優先於 name 顯示在排行榜
--   name      真實姓名，進榜必填，用於認領成績的姓名比對
-- ============================================================

-- 1. 新增 name 欄位
ALTER TABLE public.athletes
  ADD COLUMN IF NOT EXISTS name text
    CHECK (name IS NULL OR length(trim(name)) > 0);

COMMENT ON COLUMN public.athletes.name IS '真實姓名，進榜必填；用於認領成績比對 athlete_name_snapshot（spec v2.2）';

-- 1b. 一次性將現有 nickname 複製到 name（現有會員無感遷移）
UPDATE public.athletes SET name = nickname WHERE nickname IS NOT NULL AND name IS NULL;

-- 2. 建立索引
CREATE INDEX IF NOT EXISTS idx_athletes_name
  ON public.athletes (name)
  WHERE name IS NOT NULL AND deleted_at IS NULL;

-- 3. 重建 leaderboard_entries View
--    display_name：COALESCE(nickname, name, athlete_name_snapshot)
--    進榜條件：已認領成績需有 name（取代原本的 nickname）
DROP VIEW IF EXISTS public.leaderboard_entries;
CREATE VIEW public.leaderboard_entries AS
SELECT
  r.id                        AS result_id,
  r.result_type,
  r.total_seconds,
  r.swim_seconds,
  r.t1_seconds,
  r.bike_seconds,
  r.t2_seconds,
  r.run_seconds,
  r.source_credibility,
  r.claim_status,
  r.claim_tag_count,
  r.overall_rank,
  r.ag_rank,
  r.bib_number,

  -- 顯示名稱：nickname 優先，其次 name，最後 snapshot（未認領策展層）
  COALESCE(a.nickname, a.name, r.athlete_name_snapshot) AS display_name,
  COALESCE(a.nationality, NULL)                          AS nationality,
  COALESCE(a.gender, r.curated_gender)                   AS gender,
  COALESCE(a.birth_year, NULL)                           AS birth_year,
  CASE
    WHEN a.gender IS NOT NULL AND a.birth_year IS NOT NULL THEN
      a.gender || (
        (FLOOR((EXTRACT(YEAR FROM CURRENT_DATE) - a.birth_year) / 5) * 5)::integer
      )::text || '-' ||
      ((FLOOR((EXTRACT(YEAR FROM CURRENT_DATE) - a.birth_year) / 5) * 5 + 4)::integer)::text
    ELSE NULL
  END                                                    AS age_group,
  a.avatar_url,
  r.athlete_id,

  re.id                       AS edition_id,
  re.year                     AS edition_year,
  re.race_date,
  re.distance_category,
  re.weather_data,

  rc.id                       AS race_id,
  rc.name                     AS race_name,
  rc.slug                     AS race_slug,
  rc.country                  AS race_country,

  r.created_at

FROM public.results r
JOIN public.race_editions re ON re.id = r.race_edition_id
JOIN public.races rc          ON rc.id = re.race_id
LEFT JOIN public.athletes a   ON a.id = r.athlete_id AND a.deleted_at IS NULL

WHERE
  r.is_public = true
  AND r.claim_status IN ('unclaimed', 'claimed')
  AND (
    r.claim_status = 'unclaimed'        -- 策展層未認領：用 athlete_name_snapshot 顯示
    OR a.name IS NOT NULL               -- 已認領：需有真實姓名才能進榜
  )
  AND r.result_type = 'solo';

COMMENT ON VIEW public.leaderboard_entries IS '排行榜基礎 View；已認領成績需有 name 才進榜；display_name = COALESCE(nickname, name, snapshot)';

-- 4. 重建 athlete_public_profiles View（條件改為 name IS NOT NULL，並回傳 name 與 nickname）
-- DROP 再重建，因為 CREATE OR REPLACE 不允許改欄位名稱
DROP VIEW IF EXISTS public.athlete_public_profiles;
CREATE VIEW public.athlete_public_profiles AS
SELECT
  a.id,
  a.name,
  a.nickname,
  a.nationality,
  a.gender,
  a.birth_year,
  a.bio,
  a.avatar_url,
  a.created_at,
  COUNT(DISTINCT r.id) FILTER (WHERE r.is_public = true) AS public_result_count
FROM public.athletes a
LEFT JOIN public.results r ON r.athlete_id = a.id AND r.result_type = 'solo'
WHERE a.deleted_at IS NULL
  AND a.name IS NOT NULL
GROUP BY a.id;

COMMENT ON VIEW public.athlete_public_profiles IS '選手公開頁面所需資料；需有 name 才出現';
