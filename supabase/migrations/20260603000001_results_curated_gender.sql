-- ============================================================
-- Tri·log Migration — 新增 results.curated_gender 欄位
-- 策展層（claim_status = 'unclaimed'）的性別標記
-- 已認領成績的性別從 athletes.gender 取得
-- ============================================================

ALTER TABLE public.results
  ADD COLUMN IF NOT EXISTS curated_gender text
    CHECK (curated_gender IN ('M', 'F'));

COMMENT ON COLUMN public.results.curated_gender IS
  '策展層性別標記（M/F），僅用於 unclaimed 成績；已認領成績的性別從 athletes.gender 取得';
