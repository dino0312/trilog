-- ============================================================
-- Tri·log Migration — 賽事即時資訊貢獻系統（spec §50）
-- race_edition_infos 資料表
-- ============================================================

-- ── 1. race_edition_infos 資料表 ──────────────────────────────
CREATE TABLE IF NOT EXISTS public.race_edition_infos (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  race_edition_id UUID        NOT NULL REFERENCES public.race_editions(id) ON DELETE CASCADE,
  athlete_id      UUID        NOT NULL REFERENCES public.athletes(id),
  info_type       TEXT        NOT NULL
                              CHECK (info_type IN ('route_map', 'aid_station', 'external_link', 'note')),
  title           TEXT        NOT NULL,
  content         TEXT,
  file_url        TEXT,
  file_type       TEXT        CHECK (file_type IN ('pdf', 'image')),
  is_public       BOOLEAN     NOT NULL DEFAULT true,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE  public.race_edition_infos          IS '社群貢獻的賽前即時資訊（路線圖、補給站、外部連結、備注）';
COMMENT ON COLUMN public.race_edition_infos.info_type IS 'route_map / aid_station / external_link / note';

-- ── 2. updated_at trigger ────────────────────────────────────
CREATE TRIGGER race_edition_infos_set_updated_at
  BEFORE UPDATE ON public.race_edition_infos
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ── 3. RLS ───────────────────────────────────────────────────
ALTER TABLE public.race_edition_infos ENABLE ROW LEVEL SECURITY;

-- 公開讀取（僅限 is_public = true）
CREATE POLICY rei_select ON public.race_edition_infos
  FOR SELECT USING (is_public = true);

-- 登入者可新增自己的
CREATE POLICY rei_insert ON public.race_edition_infos
  FOR INSERT WITH CHECK (auth.uid() = athlete_id);

-- 貢獻者可刪自己的
CREATE POLICY rei_delete ON public.race_edition_infos
  FOR DELETE USING (auth.uid() = athlete_id);

-- ── 4. Index ─────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_rei_edition ON public.race_edition_infos(race_edition_id);
CREATE INDEX IF NOT EXISTS idx_rei_athlete ON public.race_edition_infos(athlete_id);
