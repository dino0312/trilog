-- ============================================================
-- Tri·log Migration — 賽事追蹤系統（spec §49）
-- race_follows 資料表 + race_editions.registration_deadline
-- ============================================================

-- ── 1. race_editions 新增報名截止日 ──────────────────────────
ALTER TABLE public.race_editions
  ADD COLUMN IF NOT EXISTS registration_deadline DATE;

COMMENT ON COLUMN public.race_editions.registration_deadline IS '報名截止日，用於 Watching 卡片倒數顯示';

-- ── 2. race_follows 資料表 ────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.race_follows (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  athlete_id        UUID        NOT NULL REFERENCES public.athletes(id) ON DELETE CASCADE,
  race_edition_id   UUID        NOT NULL REFERENCES public.race_editions(id) ON DELETE CASCADE,
  status            TEXT        NOT NULL
                                CHECK (status IN ('watching', 'registered', 'completed', 'dns', 'dnf')),
  completion_source TEXT        CHECK (completion_source IN ('auto', 'manual')),
  result_id         UUID        REFERENCES public.results(id) ON DELETE SET NULL,
  dns_dnf_reason    TEXT,
  dns_dnf_public    BOOLEAN     NOT NULL DEFAULT false,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (athlete_id, race_edition_id)
);

COMMENT ON TABLE  public.race_follows         IS '選手對特定屆次的追蹤狀態（私人資料）';
COMMENT ON COLUMN public.race_follows.status  IS 'watching → registered → completed/dns/dnf（單向，完賽後不可回退）';

-- ── 3. updated_at trigger ────────────────────────────────────
CREATE TRIGGER race_follows_set_updated_at
  BEFORE UPDATE ON public.race_follows
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ── 4. RLS ───────────────────────────────────────────────────
ALTER TABLE public.race_follows ENABLE ROW LEVEL SECURITY;

CREATE POLICY race_follows_select ON public.race_follows
  FOR SELECT USING (auth.uid() = athlete_id);

CREATE POLICY race_follows_insert ON public.race_follows
  FOR INSERT WITH CHECK (auth.uid() = athlete_id);

CREATE POLICY race_follows_update ON public.race_follows
  FOR UPDATE USING (auth.uid() = athlete_id);

CREATE POLICY race_follows_delete ON public.race_follows
  FOR DELETE USING (auth.uid() = athlete_id);

-- ── 5. Index ─────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_race_follows_athlete ON public.race_follows(athlete_id);
CREATE INDEX IF NOT EXISTS idx_race_follows_edition ON public.race_follows(race_edition_id);
