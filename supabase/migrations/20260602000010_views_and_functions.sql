-- ============================================================
-- Tri·log Migration 009 — Views & Business Logic Functions
-- ============================================================

-- ── View：leaderboard_entries 排行榜基礎 View ─────────────────
-- 將 results + race_editions + races + athletes 組合成排行榜所需欄位
-- 業務層再加上 RANK() window function
CREATE OR REPLACE VIEW public.leaderboard_entries AS
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

  -- 選手資訊（未認領成績用 snapshot，已認領用帳號資料）
  COALESCE(a.nickname, r.athlete_name_snapshot)   AS display_name,
  COALESCE(a.nationality, NULL)                    AS nationality,
  -- 未認領成績以 curated_gender 作為性別來源，已認領則用帳號 gender
  COALESCE(a.gender, r.curated_gender)             AS gender,
  COALESCE(a.birth_year, NULL)                     AS birth_year,
  -- 年齡組自動計算（如 'M30-34'）
  CASE
    WHEN a.gender IS NOT NULL AND a.birth_year IS NOT NULL THEN
      a.gender || (
        (FLOOR((EXTRACT(YEAR FROM CURRENT_DATE) - a.birth_year) / 5) * 5)::integer
      )::text || '-' ||
      ((FLOOR((EXTRACT(YEAR FROM CURRENT_DATE) - a.birth_year) / 5) * 5 + 4)::integer)::text
    ELSE NULL
  END                                               AS age_group,
  a.avatar_url,
  r.athlete_id,

  -- 賽事屆次資訊
  re.id                       AS edition_id,
  re.year                     AS edition_year,
  re.race_date,
  re.distance_category,
  re.weather_data,

  -- 賽事品牌資訊
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
  -- 僅顯示有顯示名稱的成績（spec 21.2）
  -- 未認領策展層成績用 athlete_name_snapshot，社群層成績需要 nickname
  AND (
    r.claim_status = 'unclaimed'                   -- 策展層未認領：用 snapshot 顯示
    OR COALESCE(a.nickname, '') != ''              -- 已認領：需有 nickname
  )
  AND r.result_type = 'solo';                      -- 接力排行榜另有 View

COMMENT ON VIEW public.leaderboard_entries IS '排行榜基礎 View，業務層加 RANK() window function；不含接力成績';

-- ── View：relay_leaderboard_entries 接力排行榜 View ──────────
CREATE OR REPLACE VIEW public.relay_leaderboard_entries AS
SELECT
  r.id                        AS result_id,
  r.total_seconds,
  r.source_credibility,
  r.claim_status,
  r.claim_tag_count,

  -- 隊伍資訊
  t.id                        AS team_id,
  t.team_name,
  t.gender_category,
  t.t1_seconds,
  t.t2_seconds,

  -- 賽事屆次
  re.id                       AS edition_id,
  re.year                     AS edition_year,
  re.race_date,
  re.distance_category,

  -- 賽事品牌
  rc.id                       AS race_id,
  rc.name                     AS race_name,
  rc.slug                     AS race_slug,

  r.created_at

FROM public.results r
JOIN public.race_editions re ON re.id = r.race_edition_id
JOIN public.races rc          ON rc.id = re.race_id
JOIN public.teams t           ON t.result_id = r.id

WHERE
  r.is_public = true
  AND r.claim_status IN ('unclaimed', 'claimed')
  AND r.result_type = 'relay';

COMMENT ON VIEW public.relay_leaderboard_entries IS '接力排行榜基礎 View';

-- ── View：athlete_public_profile 選手公開頁 View ─────────────
CREATE OR REPLACE VIEW public.athlete_public_profiles AS
SELECT
  a.id,
  a.nickname,
  a.nationality,
  a.gender,
  a.birth_year,
  a.bio,
  a.avatar_url,
  a.created_at,
  -- 統計公開成績數
  COUNT(DISTINCT r.id) FILTER (WHERE r.is_public = true) AS public_result_count
FROM public.athletes a
LEFT JOIN public.results r ON r.athlete_id = a.id AND r.result_type = 'solo'
WHERE a.deleted_at IS NULL
  AND a.nickname IS NOT NULL
GROUP BY a.id;

COMMENT ON VIEW public.athlete_public_profiles IS '選手公開頁面所需資料，含公開成績計數';

-- ── Function：claim_result 選手認領成績 ──────────────────────
-- 將未認領成績與帳號關聯，更新 claim_status 為 pending（待助手審核）
CREATE OR REPLACE FUNCTION public.claim_result(
  p_result_id     uuid,
  p_certificate_url text DEFAULT NULL
)
RETURNS json
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public AS $$
DECLARE
  v_result   public.results%ROWTYPE;
  v_athlete  public.athletes%ROWTYPE;
BEGIN
  -- 驗證登入
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION '請先登入才能認領成績';
  END IF;

  -- 取得成績（鎖定）
  SELECT * INTO v_result
  FROM public.results
  WHERE id = p_result_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION '找不到此成績';
  END IF;

  -- 只能認領 unclaimed 或 unlinked 的成績
  IF v_result.claim_status NOT IN ('unclaimed', 'unlinked') THEN
    RAISE EXCEPTION '此成績目前狀態（%）無法認領', v_result.claim_status;
  END IF;

  -- 取得選手資料
  SELECT * INTO v_athlete
  FROM public.athletes
  WHERE id = auth.uid();

  -- 更新認領狀態
  UPDATE public.results
  SET
    athlete_id        = auth.uid(),
    claim_status      = 'pending',
    certificate_url   = COALESCE(p_certificate_url, certificate_url),
    claimed_at        = now()
  WHERE id = p_result_id;

  RETURN json_build_object(
    'success', true,
    'result_id', p_result_id,
    'claim_status', 'pending',
    'message', '認領申請已提交，待認證助手審核'
  );
END;
$$;

-- ── Function：approve_claim 助手審核認領申請 ─────────────────
CREATE OR REPLACE FUNCTION public.approve_claim(
  p_result_id  uuid,
  p_approve    boolean
)
RETURNS json
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public AS $$
BEGIN
  -- 只有助手以上可執行
  IF NOT public.is_assistant_or_above() THEN
    RAISE EXCEPTION '只有認證助手以上可審核認領申請';
  END IF;

  IF p_approve THEN
    UPDATE public.results
    SET
      claim_status       = 'claimed',
      source_credibility = CASE
        WHEN source_credibility = 'official' THEN 'official'  -- official 維持不變
        ELSE 'certificate'                                      -- self_reported 升級
      END,
      verified_at        = now()
    WHERE id = p_result_id
      AND claim_status = 'pending';

    RETURN json_build_object('success', true, 'action', 'approved', 'result_id', p_result_id);
  ELSE
    -- 拒絕：恢復為 unclaimed 並清除申請資料
    UPDATE public.results
    SET
      athlete_id   = NULL,
      claim_status = 'unclaimed',
      claimed_at   = NULL
    WHERE id = p_result_id
      AND claim_status = 'pending';

    RETURN json_build_object('success', true, 'action', 'rejected', 'result_id', p_result_id);
  END IF;
END;
$$;

-- ── Function：unlink_result 解除關聯（spec 21.4）────────────────
CREATE OR REPLACE FUNCTION public.unlink_result(p_result_id uuid)
RETURNS json
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public AS $$
DECLARE
  v_result public.results%ROWTYPE;
BEGIN
  SELECT * INTO v_result FROM public.results WHERE id = p_result_id FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION '找不到此成績';
  END IF;

  -- 只有本人或 admin 可解除關聯
  IF v_result.athlete_id != auth.uid() AND NOT public.is_admin() THEN
    RAISE EXCEPTION '只能解除自己的成績關聯';
  END IF;

  -- 只有 claimed 狀態可解除
  IF v_result.claim_status != 'claimed' THEN
    RAISE EXCEPTION '只有已認領成績可申請解除關聯（目前狀態：%）', v_result.claim_status;
  END IF;

  UPDATE public.results
  SET
    athlete_id   = NULL,
    claim_status = 'unlinked'
    -- athlete_name_snapshot 保留（公共紀錄）
    -- certificate_url 保留（備查）
  WHERE id = p_result_id;

  RETURN json_build_object(
    'success', true,
    'result_id', p_result_id,
    'message', '已解除與帳號的關聯，成績以公共資料保留'
  );
END;
$$;

-- ── Function：generate_claim_share_text 產生分享文字（spec 15.3）──
CREATE OR REPLACE FUNCTION public.generate_claim_share_text(p_result_id uuid)
RETURNS json
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public AS $$
DECLARE
  v_result     public.results%ROWTYPE;
  v_edition    public.race_editions%ROWTYPE;
  v_race       public.races%ROWTYPE;
  v_time_str   text;
  v_share_text text;
  v_url        text;
BEGIN
  SELECT r.* INTO v_result FROM public.results r WHERE r.id = p_result_id;
  IF NOT FOUND THEN RAISE EXCEPTION '找不到此成績'; END IF;

  SELECT re.* INTO v_edition FROM public.race_editions re WHERE re.id = v_result.race_edition_id;
  SELECT rc.* INTO v_race    FROM public.races rc          WHERE rc.id = v_edition.race_id;

  -- 將秒數轉為 H:MM:SS 格式
  v_time_str := to_char(
    make_interval(secs => v_result.total_seconds),
    'FMHH24:MI:SS'
  );

  v_url := 'https://trilog.run/results/' || p_result_id::text;

  v_share_text := '我在 Tri·log 看到你在 ' ||
    v_race.name || ' ' || v_edition.year::text ||
    ' 的成績 ' || v_time_str ||
    ' 還沒被認領，快來認領吧！' || v_url;

  RETURN json_build_object(
    'share_text', v_share_text,
    'url', v_url,
    'athlete_name', v_result.athlete_name_snapshot,
    'race_name', v_race.name,
    'year', v_edition.year,
    'total_time', v_time_str
  );
END;
$$;
