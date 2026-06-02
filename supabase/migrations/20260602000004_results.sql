-- ============================================================
-- Tri·log Migration 004 — RESULT 成績記錄（核心資料表）
-- ============================================================
-- 設計原則（spec 22.1）：
--   solo  → 分項時間存於 RESULT 本身（swim/t1/bike/t2/run）
--   relay → RESULT 只保留 total_seconds；分項存 TEAM_MEMBER，T1/T2 存 TEAM

CREATE TABLE public.results (
  id                    uuid        PRIMARY KEY DEFAULT gen_random_uuid(),

  -- 成績類型（solo / relay）
  result_type           text        NOT NULL
                                    CHECK (result_type IN ('solo', 'relay')),

  -- 所屬賽事屆次
  race_edition_id       uuid        NOT NULL
                                    REFERENCES public.race_editions(id) ON DELETE RESTRICT,

  -- 選手關聯
  -- null = 未認領（策展層）；relay 時也為 null（由 TEAM 管理）
  athlete_id            uuid        REFERENCES public.athletes(id) ON DELETE SET NULL,

  -- 策展層建立時的原始姓名快照（認領後仍保留作為歷史記錄）
  -- relay 時為 null（成員姓名存 TEAM_MEMBER）
  athlete_name_snapshot text,

  -- ── 來源可信度（spec 22.2，取代舊 source_type + verification_status）──
  -- official      = 策展層助手建立，來自官方賽事結果（最高）
  -- certificate   = 選手上傳完賽證書，人工審核通過（高）
  -- self_reported = 選手自填，無附加驗證（低）
  source_credibility    text        NOT NULL
                                    CHECK (source_credibility IN ('official', 'certificate', 'self_reported')),

  -- ── 認領狀態（spec 21.4）────────────────────────────────────
  -- unclaimed = 策展層建檔，尚未被選手認領
  -- pending   = 選手已提交認領申請，待助手審核
  -- claimed   = 認領完成，與帳號關聯
  -- unlinked  = 選手申請解除關聯，成績回到公共狀態
  claim_status          text        NOT NULL DEFAULT 'unclaimed'
                                    CHECK (claim_status IN ('unclaimed', 'pending', 'claimed', 'unlinked')),

  -- ── 完賽時間（秒）────────────────────────────────────────────
  -- 所有時間以整數秒儲存，UI 負責格式化為 HH:MM:SS
  total_seconds         integer     NOT NULL CHECK (total_seconds > 0),

  -- solo 分項時間（relay 時全部為 null）
  swim_seconds          integer     CHECK (swim_seconds IS NULL OR swim_seconds > 0),
  t1_seconds            integer     CHECK (t1_seconds IS NULL OR t1_seconds >= 0),
  bike_seconds          integer     CHECK (bike_seconds IS NULL OR bike_seconds > 0),
  t2_seconds            integer     CHECK (t2_seconds IS NULL OR t2_seconds >= 0),
  run_seconds           integer     CHECK (run_seconds IS NULL OR run_seconds > 0),

  -- relay 時分項必須為 null（分項改存 TEAM_MEMBER）
  CONSTRAINT relay_splits_must_be_null CHECK (
    result_type != 'relay' OR (
      swim_seconds IS NULL AND t1_seconds IS NULL AND
      bike_seconds IS NULL AND t2_seconds IS NULL AND run_seconds IS NULL
    )
  ),

  -- 隱私設定
  is_public             boolean     NOT NULL DEFAULT true,

  -- 公證資料
  certificate_url       text,

  -- 反正規化快取：標記人數（避免排行榜查詢 JOIN claim_tags）
  claim_tag_count       integer     NOT NULL DEFAULT 0 CHECK (claim_tag_count >= 0),

  -- 官方成績欄位（可選，由策展層填入）
  overall_rank          integer     CHECK (overall_rank > 0),
  ag_rank               integer     CHECK (ag_rank > 0),
  bib_number            text,

  -- 選手備註 / 心得
  notes                 text,

  -- 時間戳
  claimed_at            timestamptz,
  verified_at           timestamptz,
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE  public.results                       IS '單筆成績記錄，為平台核心資料表';
COMMENT ON COLUMN public.results.result_type           IS 'solo（個人）/ relay（接力）';
COMMENT ON COLUMN public.results.athlete_id            IS 'null = 未認領（策展層）或接力（由 TEAM 管理）';
COMMENT ON COLUMN public.results.athlete_name_snapshot IS '策展層原始姓名快照，認領後仍保留作為歷史記錄';
COMMENT ON COLUMN public.results.source_credibility    IS 'official > certificate > self_reported（spec 22.2）';
COMMENT ON COLUMN public.results.claim_status          IS 'unclaimed / pending / claimed / unlinked（spec 21.4）';
COMMENT ON COLUMN public.results.total_seconds         IS '完賽總時間（秒），排行榜排序依據';
COMMENT ON COLUMN public.results.claim_tag_count       IS '反正規化快取，由 trigger 維護，避免排行榜 JOIN';
COMMENT ON COLUMN public.results.is_public             IS 'false = 私人成績，不納入排行榜';

CREATE TRIGGER results_set_updated_at
  BEFORE UPDATE ON public.results
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ── source_credibility 狀態轉換驗證 ──────────────────────────
-- 防止逆向降級（official 不可降為 self_reported）
CREATE OR REPLACE FUNCTION public.validate_source_credibility_transition()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  -- 可信度只能往上升，不可下降
  IF OLD.source_credibility = 'official' AND NEW.source_credibility != 'official' THEN
    RAISE EXCEPTION '官方成績（official）不可降級';
  END IF;
  IF OLD.source_credibility = 'certificate' AND NEW.source_credibility = 'self_reported' THEN
    RAISE EXCEPTION '已公證成績（certificate）不可降為自填（self_reported）';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER results_validate_credibility
  BEFORE UPDATE OF source_credibility ON public.results
  FOR EACH ROW EXECUTE FUNCTION public.validate_source_credibility_transition();

-- ── Row Level Security ────────────────────────────────────────
ALTER TABLE public.results ENABLE ROW LEVEL SECURITY;

-- 公開讀取：
-- 1. is_public = true 的成績
-- 2. 未認領的策展層成績（claim_status IN ('unclaimed','unlinked')）
-- 3. 本人的所有成績（含私人）
CREATE POLICY "results_public_read"
  ON public.results FOR SELECT
  USING (
    is_public = true
    OR claim_status IN ('unclaimed', 'unlinked')
    OR athlete_id = auth.uid()
  );

-- 登入選手可新增社群層成績（source_credibility 強制為 self_reported）
CREATE POLICY "results_athlete_insert"
  ON public.results FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND result_type = 'solo'                      -- relay 另有端點
    AND source_credibility = 'self_reported'       -- 社群層只能自填
    AND athlete_id = auth.uid()                   -- 只能建立自己的
  );

-- 本人可更新自己的社群層成績（不含 source_credibility / claim_status）
CREATE POLICY "results_athlete_update_own"
  ON public.results FOR UPDATE
  USING (
    athlete_id = auth.uid()
    AND source_credibility != 'official'           -- 策展層成績本人不可修改內容
  )
  WITH CHECK (
    athlete_id = auth.uid()
  );

-- 助手以上可更新公證狀態、認領狀態（例：審核公證申請）
CREATE POLICY "results_assistant_update_status"
  ON public.results FOR UPDATE
  USING (public.is_assistant_or_above())
  WITH CHECK (public.is_assistant_or_above());

-- 本人可刪除自己的社群層成績（策展層不可刪除）
CREATE POLICY "results_athlete_delete_own"
  ON public.results FOR DELETE
  USING (
    athlete_id = auth.uid()
    AND source_credibility = 'self_reported'
  );

-- Admin 可刪除任何成績
CREATE POLICY "results_admin_delete"
  ON public.results FOR DELETE
  USING (public.is_admin());
