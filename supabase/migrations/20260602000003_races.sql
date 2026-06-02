-- ============================================================
-- Tri·log Migration 003 — RACE 賽事 & RACE_EDITION 屆次
-- ============================================================

-- ── RACE 賽事品牌實體 ─────────────────────────────────────────
-- 代表一個賽事品牌（如 Ironman Taiwan），跨年度保持同一 id
CREATE TABLE public.races (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),

  -- 賽事識別
  name        text        NOT NULL,
  slug        text        NOT NULL UNIQUE,    -- URL 用，如 ironman-taiwan
  status      text        NOT NULL DEFAULT 'active'
                          CHECK (status IN ('active', 'inactive', 'cancelled')),

  -- 地理資訊
  country     text,                           -- ISO 3166-1 alpha-3
  city        text,
  lat         numeric(9, 6),                  -- GPS 緯度，天氣 API 查詢用
  lng         numeric(9, 6),                  -- GPS 經度

  -- 附加資訊
  organizer   text,
  website     text,

  -- 建立者（助手帳號）
  created_by  uuid REFERENCES public.athletes(id) ON DELETE SET NULL,

  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE  public.races            IS '賽事品牌實體（跨年度），如 Ironman Taiwan';
COMMENT ON COLUMN public.races.slug       IS 'URL 用唯一識別碼，如 ironman-taiwan；SEO 友善';
COMMENT ON COLUMN public.races.lat        IS 'GPS 緯度，供 Open-Meteo 天氣 API 查詢';
COMMENT ON COLUMN public.races.lng        IS 'GPS 經度，供 Open-Meteo 天氣 API 查詢';
COMMENT ON COLUMN public.races.status     IS 'active（進行中）/ inactive（已停辦屆次保留）/ cancelled（已取消）';

CREATE TRIGGER races_set_updated_at
  BEFORE UPDATE ON public.races
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ── RACE_EDITION 賽事特定年份屆次 ────────────────────────────
CREATE TABLE public.race_editions (
  id                  uuid        PRIMARY KEY DEFAULT gen_random_uuid(),

  -- 所屬賽事
  race_id             uuid        NOT NULL REFERENCES public.races(id) ON DELETE CASCADE,

  -- 屆次資訊
  year                integer     NOT NULL CHECK (year >= 1970 AND year <= 2100),
  race_date           date        NOT NULL,
  distance_category   text        NOT NULL
                                  CHECK (distance_category IN ('sprint', 'olympic', '70.3', 'full')),

  -- 賽事距離（細節，可選填）
  swim_distance_m     integer     CHECK (swim_distance_m > 0),
  bike_distance_km    numeric(6,2) CHECK (bike_distance_km > 0),
  run_distance_km     numeric(5,2) CHECK (run_distance_km > 0),

  -- 環境資訊
  is_wetsuit_allowed  boolean,
  water_temp_c        numeric(4,1),
  swim_type           text        CHECK (swim_type IN ('ocean', 'lake', 'river', 'pool', 'other')),

  -- 天氣資料（Open-Meteo / Visual Crossing 自動抓取）
  weather_source      text        CHECK (weather_source IN ('open-meteo', 'visual-crossing', 'manual')),
  weather_data        jsonb,
  -- weather_data 預期結構：
  -- { "temp_c": 26, "humidity_pct": 74, "wind_speed_ms": 8,
  --   "wind_direction": "NE", "precipitation_mm": 0 }

  -- 成績統計（系統自動彙整或助手填入）
  finisher_count      integer     CHECK (finisher_count >= 0),
  dnf_count           integer     CHECK (dnf_count >= 0),
  total_starters      integer     CHECK (total_starters >= 0),

  -- 附加說明
  notes               text,

  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now(),

  -- 同一賽事同一年只有一個屆次
  UNIQUE (race_id, year)
);

COMMENT ON TABLE  public.race_editions                    IS '賽事特定年份屆次，含天氣與路線詳細資料';
COMMENT ON COLUMN public.race_editions.distance_category IS 'sprint / olympic / 70.3 / full';
COMMENT ON COLUMN public.race_editions.weather_data      IS 'jsonb，Open-Meteo 自動抓取或人工填入';
COMMENT ON COLUMN public.race_editions.finisher_count    IS '完賽人數，由成績統計自動彙整或助手填入';

CREATE TRIGGER race_editions_set_updated_at
  BEFORE UPDATE ON public.race_editions
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ── Row Level Security：races ─────────────────────────────────
ALTER TABLE public.races ENABLE ROW LEVEL SECURITY;

-- 公開讀取
CREATE POLICY "races_public_read"
  ON public.races FOR SELECT
  USING (true);

-- 助手以上可新增賽事
CREATE POLICY "races_assistant_insert"
  ON public.races FOR INSERT
  WITH CHECK (public.is_assistant_or_above());

-- 助手 / 賽事編輯 / admin 可更新賽事
CREATE POLICY "races_editor_update"
  ON public.races FOR UPDATE
  USING (public.is_race_editor(id))
  WITH CHECK (public.is_race_editor(id));

-- 只有 admin 可刪除賽事
CREATE POLICY "races_admin_delete"
  ON public.races FOR DELETE
  USING (public.is_admin());

-- ── Row Level Security：race_editions ────────────────────────
ALTER TABLE public.race_editions ENABLE ROW LEVEL SECURITY;

-- 公開讀取
CREATE POLICY "race_editions_public_read"
  ON public.race_editions FOR SELECT
  USING (true);

-- 助手以上可新增屆次
CREATE POLICY "race_editions_assistant_insert"
  ON public.race_editions FOR INSERT
  WITH CHECK (public.is_assistant_or_above());

-- 助手 / 賽事編輯 / admin 可更新屆次
CREATE POLICY "race_editions_editor_update"
  ON public.race_editions FOR UPDATE
  USING (public.is_race_editor(race_id))
  WITH CHECK (public.is_race_editor(race_id));

-- 只有 admin 可刪除屆次
CREATE POLICY "race_editions_admin_delete"
  ON public.race_editions FOR DELETE
  USING (public.is_admin());
