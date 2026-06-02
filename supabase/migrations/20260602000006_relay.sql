-- ============================================================
-- Tri·log Migration 006 — TEAM & TEAM_MEMBER 接力
-- ============================================================

CREATE TABLE IF NOT EXISTS public.teams (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  result_id       uuid        NOT NULL UNIQUE REFERENCES public.results(id) ON DELETE CASCADE,
  team_name       text,
  gender_category text        NOT NULL CHECK (gender_category IN ('male', 'female', 'mixed')),
  t1_seconds      integer     CHECK (t1_seconds IS NULL OR t1_seconds >= 0),
  t2_seconds      integer     CHECK (t2_seconds IS NULL OR t2_seconds >= 0),
  created_at      timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE  public.teams                  IS '接力隊伍，與 RESULT(result_type=relay) 一對一';
COMMENT ON COLUMN public.teams.result_id        IS '對應的接力整體成績（RESULT）';
COMMENT ON COLUMN public.teams.gender_category  IS 'male / female / mixed';
COMMENT ON COLUMN public.teams.t1_seconds       IS 'T1 換區時間，隊伍層級，無法歸屬個別成員';
COMMENT ON COLUMN public.teams.t2_seconds       IS 'T2 換區時間，隊伍層級';

CREATE TABLE IF NOT EXISTS public.team_members (
  id                    uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id               uuid        NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  athlete_id            uuid        REFERENCES public.athletes(id) ON DELETE SET NULL,
  athlete_name_snapshot text        NOT NULL,
  disciplines           text[]      NOT NULL
                                    CHECK (array_length(disciplines, 1) BETWEEN 1 AND 3),
  split_seconds         integer     CHECK (split_seconds IS NULL OR split_seconds > 0),
  source_credibility    text        NOT NULL DEFAULT 'official'
                                    CHECK (source_credibility IN ('official', 'certificate', 'self_reported')),
  claim_status          text        NOT NULL DEFAULT 'unclaimed'
                                    CHECK (claim_status IN ('unclaimed', 'pending', 'claimed', 'unlinked')),
  certificate_url       text,
  sort_order            integer     NOT NULL DEFAULT 0,
  claimed_at            timestamptz,
  verified_at           timestamptz,
  created_at            timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE  public.team_members                    IS '接力隊伍成員，認領狀態獨立';
COMMENT ON COLUMN public.team_members.disciplines        IS '負責的分項，如 {swim} 或 {bike,run}';
COMMENT ON COLUMN public.team_members.split_seconds      IS '個人分項合計時間（純運動，不含換區）';
COMMENT ON COLUMN public.team_members.claim_status       IS '成員獨立認領，互不影響其他成員';
COMMENT ON COLUMN public.team_members.source_credibility IS '繼承自隊伍策展層設定，或成員自行上傳公證';

CREATE OR REPLACE FUNCTION public.validate_team_result_type()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.results
    WHERE id = NEW.result_id AND result_type = 'relay'
  ) THEN
    RAISE EXCEPTION 'TEAM 只能對應 result_type = relay 的成績';
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER teams_validate_result_type
  BEFORE INSERT ON public.teams
  FOR EACH ROW EXECUTE FUNCTION public.validate_team_result_type();

ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;

-- 注意：teams / team_members RLS policies 在 009_helpers.sql 建立
