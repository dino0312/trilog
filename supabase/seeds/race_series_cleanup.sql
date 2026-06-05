-- ============================================================
-- Tri·log Seed — 賽事系列欄位補齊與普悠瑪資料合併
-- 在 SQL Editor 以 service role 執行
-- ============================================================

-- ── 1. 補齊缺少 series 的已知賽事 ───────────────────────────

-- IRONMAN 系列（全程）
UPDATE public.races SET series = 'IRONMAN_TAIWAN'
WHERE slug IN ('ironman-taiwan-full', 'ironman-frankfurt', 'ironman-south-africa', 'taitung-superironman');

-- Challenge 系列（含海外站）
UPDATE public.races SET series = 'CHALLENGE'
WHERE slug = 'challenge-roth';

-- 台灣本地賽事
UPDATE public.races SET series = 'LOCAL_EVENT'
WHERE slug IN (
  'formosa-triathlon',
  'taitung-triathlon',
  'sun-moon-lake-triathlon',
  'taroko-triathlon',
  'xinquan-ironman'
);

-- 全國錦標賽（舊 slug）
UPDATE public.races SET series = 'CTTA_NATIONALS'
WHERE slug = 'taiwan-national-triathlon';

-- 普悠瑪主檔（舊 slug 仍沿用）
UPDATE public.races SET series = 'PUYUMA'
WHERE slug = 'puiyuma-ironman';

-- ── 2. 普悠瑪合併：puyuma-triathlon → puiyuma-ironman ────────
-- puyuma-triathlon 是 seed 新建的重複記錄
-- 把它的 editions 移到 puiyuma-ironman（僅移不衝突的年份 + 距離組合）

DO $$
DECLARE
  old_id uuid;
  new_id uuid;
BEGIN
  SELECT id INTO old_id FROM public.races WHERE slug = 'puyuma-triathlon';
  SELECT id INTO new_id FROM public.races WHERE slug = 'puiyuma-ironman';

  IF old_id IS NULL OR new_id IS NULL THEN
    RAISE NOTICE 'puyuma merge: one or both records not found, skipping';
    RETURN;
  END IF;

  -- 移轉沒有衝突的 editions
  UPDATE public.race_editions
  SET race_id = new_id
  WHERE race_id = old_id
    AND NOT EXISTS (
      SELECT 1 FROM public.race_editions e2
      WHERE e2.race_id = new_id
        AND e2.year = race_editions.year
        AND e2.distance_category = race_editions.distance_category
    );

  -- 刪除仍殘留（衝突）的 editions
  DELETE FROM public.race_editions WHERE race_id = old_id;

  -- 刪除重複的 race 記錄
  DELETE FROM public.races WHERE id = old_id;

  RAISE NOTICE 'puyuma merge completed: % → %', old_id, new_id;
END $$;

-- ── 3. 確認 ──────────────────────────────────────────────────
SELECT slug, name, series FROM public.races ORDER BY series NULLS LAST, name;
