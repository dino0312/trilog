-- ============================================================
-- Tri·log Migration 004 — RESULT 成績記錄（核心資料表）
-- ============================================================

CREATE TABLE IF NOT EXISTS public.results (
  id                    uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  result_type           text        NOT NULL CHECK (result_type IN ('solo', 'relay')),
  race_edition_id       uuid        NOT NULL REFERENCES public.race_editions(id) ON DELETE RESTRICT,
  athlete_id            uuid        REFERENCES public.athletes(id) ON DELETE SET NULL,
  athlete_name_snapshot text,
  source_credibility    text        NOT NULL
                                    CHECK (source_credibility IN ('official', 'certificate', 'self_reported')),
  claim_status          text        NOT NULL DEFAULT 'unclaimed'
                                    CHECK (claim_status IN ('unclaimed', 'pending', 'claimed', 'unlinked')),
  total_seconds         integer     NOT NULL CHECK (total_seconds > 0),
  swim_seconds          integer     CHECK (swim_seconds IS NULL OR swim_seconds > 0),
  t1_seconds            integer     CHECK (t1_seconds IS NULL OR t1_seconds >= 0),
  bike_seconds          integer     CHECK (bike_seconds IS NULL OR bike_seconds > 0),
  t2_seconds            integer     CHECK (t2_seconds IS NULL OR t2_seconds >= 0),
  run_seconds           integer     CHECK (run_seconds IS NULL OR run_seconds > 0),
  CONSTRAINT relay_splits_must_be_null CHECK (
    result_type != 'relay' OR (
      swim_seconds IS NULL AND t1_seconds IS NULL AND
      bike_seconds IS NULL AND t2_seconds IS NULL AND run_seconds IS NULL
    )
  ),
  is_public             boolean     NOT NULL DEFAULT true,
  certificate_url       text,
  claim_tag_count       integer     NOT NULL DEFAULT 0 CHECK (claim_tag_count >= 0),
  overall_rank          integer     CHECK (overall_rank > 0),
  ag_rank               integer     CHECK (ag_rank > 0),
  bib_number            text,
  notes                 text,
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

CREATE OR REPLACE TRIGGER results_set_updated_at
  BEFORE UPDATE ON public.results
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE FUNCTION public.validate_source_credibility_transition()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF OLD.source_credibility = 'official' AND NEW.source_credibility != 'official' THEN
    RAISE EXCEPTION '官方成績（official）不可降級';
  END IF;
  IF OLD.source_credibility = 'certificate' AND NEW.source_credibility = 'self_reported' THEN
    RAISE EXCEPTION '已公證成績（certificate）不可降為自填（self_reported）';
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER results_validate_credibility
  BEFORE UPDATE OF source_credibility ON public.results
  FOR EACH ROW EXECUTE FUNCTION public.validate_source_credibility_transition();

ALTER TABLE public.results ENABLE ROW LEVEL SECURITY;

-- 注意：results RLS policies 在 009_helpers.sql 建立
