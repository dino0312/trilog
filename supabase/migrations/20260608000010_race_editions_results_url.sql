-- 新增 results_url 欄位至 race_editions
-- 用於連結官方成績查詢頁面

ALTER TABLE public.race_editions
  ADD COLUMN IF NOT EXISTS results_url text DEFAULT NULL;

COMMENT ON COLUMN public.race_editions.results_url IS '官方成績查詢頁面連結';
