-- ============================================================
-- Tri·log Migration 003 — RACE 賽事 & RACE_EDITION 屆次
-- ============================================================

CREATE TABLE IF NOT EXISTS public.races (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text        NOT NULL,
  slug        text        NOT NULL UNIQUE,
  status      text        NOT NULL DEFAULT 'active'
                          CHECK (status IN ('active', 'inactive', 'cancelled')),
  country     text,
  city        text,
  lat         numeric(9, 6),
  lng         numeric(9, 6),
  organizer   text,
  website     text,
  created_by  uuid REFERENCES public.athletes(id) ON DELETE SET NULL,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE  public.races            IS '賽事品牌實體（跨年度），如 Ironman Taiwan';
COMMENT ON COLUMN public.races.slug       IS 'URL 用唯一識別碼，如 ironman-taiwan；SEO 友善';
COMMENT ON COLUMN public.races.lat        IS 'GPS 緯度，供 Open-Meteo 天氣 API 查詢';
COMMENT ON COLUMN public.races.lng        IS 'GPS 經度，供 Open-Meteo 天氣 API 查詢';
COMMENT ON COLUMN public.races.status     IS 'active（進行中）/ inactive（已停辦屆次保留）/ cancelled（已取消）';

CREATE OR REPLACE TRIGGER races_set_updated_at
  BEFORE UPDATE ON public.races
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.races ENABLE ROW LEVEL SECURITY;

-- ── RACE_EDITION 賽事特定年份屆次 ────────────────────────────
CREATE TABLE IF NOT EXISTS public.race_editions (
  id                  uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  race_id             uuid        NOT NULL REFERENCES public.races(id) ON DELETE CASCADE,
  year                integer     NOT NULL CHECK (year >= 1970 AND year <= 2100),
  race_date           date        NOT NULL,
  distance_category   text        NOT NULL
                                  CHECK (distance_category IN ('sprint', 'olympic', '70.3', 'full')),
  swim_distance_m     integer     CHECK (swim_distance_m > 0),
  bike_distance_km    numeric(6,2) CHECK (bike_distance_km > 0),
  run_distance_km     numeric(5,2) CHECK (run_distance_km > 0),
  is_wetsuit_allowed  boolean,
  water_temp_c        numeric(4,1),
  swim_type           text        CHECK (swim_type IN ('ocean', 'lake', 'river', 'pool', 'other')),
  weather_source      text        CHECK (weather_source IN ('open-meteo', 'visual-crossing', 'manual')),
  weather_data        jsonb,
  finisher_count      integer     CHECK (finisher_count >= 0),
  dnf_count           integer     CHECK (dnf_count >= 0),
  total_starters      integer     CHECK (total_starters >= 0),
  notes               text,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now(),
  UNIQUE (race_id, year)
);

COMMENT ON TABLE  public.race_editions                    IS '賽事特定年份屆次，含天氣與路線詳細資料';
COMMENT ON COLUMN public.race_editions.distance_category IS 'sprint / olympic / 70.3 / full';
COMMENT ON COLUMN public.race_editions.weather_data      IS 'jsonb，Open-Meteo 自動抓取或人工填入';
COMMENT ON COLUMN public.race_editions.finisher_count    IS '完賽人數，由成績統計自動彙整或助手填入';

CREATE OR REPLACE TRIGGER race_editions_set_updated_at
  BEFORE UPDATE ON public.race_editions
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.race_editions ENABLE ROW LEVEL SECURITY;

-- 注意：races / race_editions RLS policies 在 009_helpers.sql 建立
