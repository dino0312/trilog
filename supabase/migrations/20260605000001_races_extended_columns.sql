-- ============================================================
-- Tri·log Migration — 擴充 races & race_editions 欄位
-- 對應 JSON 資料格式，支援多語言名稱、系列、組織資訊
-- ============================================================

-- ── races 新增欄位 ───────────────────────────────────────────
ALTER TABLE public.races
  ADD COLUMN IF NOT EXISTS name_zh      text,
  ADD COLUMN IF NOT EXISTS name_en      text,
  ADD COLUMN IF NOT EXISTS series       text,
  ADD COLUMN IF NOT EXISTS county       text,
  ADD COLUMN IF NOT EXISTS organizer_co text[],
  ADD COLUMN IF NOT EXISTS operator     text;

COMMENT ON COLUMN public.races.name_zh      IS '中文賽事名稱';
COMMENT ON COLUMN public.races.name_en      IS '英文賽事名稱';
COMMENT ON COLUMN public.races.series       IS '系列代碼，如 CHALLENGE / IRONMAN_TAIWAN / IRONMAN_70_3 / FORCE / LOCAL_EVENT';
COMMENT ON COLUMN public.races.county       IS '縣市，如 臺東縣';
COMMENT ON COLUMN public.races.organizer_co IS '協辦單位（陣列）';
COMMENT ON COLUMN public.races.operator     IS '執行 / 承辦單位';

-- ── race_editions 新增欄位 ───────────────────────────────────
ALTER TABLE public.race_editions
  ADD COLUMN IF NOT EXISTS venue            text,
  ADD COLUMN IF NOT EXISTS registration_url text;

COMMENT ON COLUMN public.race_editions.venue            IS '場地名稱，如 臺東活水湖';
COMMENT ON COLUMN public.race_editions.registration_url IS '報名頁面連結';
