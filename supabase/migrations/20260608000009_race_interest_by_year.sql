-- 1. 修正 race_editions unique constraint：(race_id, year) → (race_id, year, distance_category)
ALTER TABLE public.race_editions
  DROP CONSTRAINT IF EXISTS race_editions_race_id_year_key,
  ADD CONSTRAINT race_editions_race_id_year_distance_key
    UNIQUE (race_id, year, distance_category);

-- 2. 重建 race_interest：改以 (race_id, year) 為互動單位（不綁定特定距離）
DROP TABLE IF EXISTS public.race_interest;

CREATE TABLE public.race_interest (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  athlete_id    uuid        NOT NULL REFERENCES public.athletes(id) ON DELETE CASCADE,
  race_id       uuid        NOT NULL REFERENCES public.races(id)    ON DELETE CASCADE,
  year          integer     NOT NULL CHECK (year >= 1970 AND year <= 2100),
  interest_type text        NOT NULL CHECK (interest_type IN ('wishlist', 'attended')),
  created_at    timestamptz NOT NULL DEFAULT now(),
  UNIQUE (athlete_id, race_id, year, interest_type)
);

COMMENT ON TABLE  public.race_interest               IS '選手對賽事屆次的互動意願（年份層級）：wishlist = 想參加，attended = 參加過';
COMMENT ON COLUMN public.race_interest.interest_type IS 'wishlist | attended';
COMMENT ON COLUMN public.race_interest.year          IS '對應 race_editions.year';

ALTER TABLE public.race_interest ENABLE ROW LEVEL SECURITY;

CREATE POLICY "race_interest: public read"
  ON public.race_interest FOR SELECT USING (true);

CREATE POLICY "race_interest: insert own"
  ON public.race_interest FOR INSERT
  WITH CHECK (athlete_id = auth.uid());

CREATE POLICY "race_interest: delete own"
  ON public.race_interest FOR DELETE
  USING (athlete_id = auth.uid());
