-- race_interest: 選手對賽事的互動意願（想參加 / 參加過）

CREATE TABLE IF NOT EXISTS public.race_interest (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  athlete_id    uuid        NOT NULL REFERENCES public.athletes(id) ON DELETE CASCADE,
  race_id       uuid        NOT NULL REFERENCES public.races(id)    ON DELETE CASCADE,
  interest_type text        NOT NULL CHECK (interest_type IN ('wishlist', 'attended')),
  created_at    timestamptz NOT NULL DEFAULT now(),
  UNIQUE (athlete_id, race_id, interest_type)
);

COMMENT ON TABLE  public.race_interest                    IS '選手對賽事的互動意願，wishlist = 想參加，attended = 參加過';
COMMENT ON COLUMN public.race_interest.interest_type     IS 'wishlist | attended';

ALTER TABLE public.race_interest ENABLE ROW LEVEL SECURITY;

-- 任何人可讀（統計用）
CREATE POLICY "race_interest: public read"
  ON public.race_interest FOR SELECT
  USING (true);

-- 本人可新增
CREATE POLICY "race_interest: insert own"
  ON public.race_interest FOR INSERT
  WITH CHECK (athlete_id = auth.uid());

-- 本人可刪除（取消）
CREATE POLICY "race_interest: delete own"
  ON public.race_interest FOR DELETE
  USING (athlete_id = auth.uid());
