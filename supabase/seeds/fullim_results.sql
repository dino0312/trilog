-- ============================================================
-- Tri·log Seed — 226 全距離最速榜資料
-- 策展層成績，依照 2026/02/07 快照建立
-- 在 SQL Editor 直接執行（bypass RLS）
-- ============================================================

-- ── 1. 新增賽事 ───────────────────────────────────────────────

INSERT INTO public.races (id, name, slug, status, country, city, lat, lng, organizer)
VALUES
  ('b1000000-0000-0000-0000-000000000001', '普悠瑪鐵人三項', 'puiyuma-ironman',
   'active', 'TWN', '台東縣台東市', 22.7583, 121.1444, '台東縣政府'),

  ('b1000000-0000-0000-0000-000000000002', 'IRONMAN Taiwan', 'ironman-taiwan-full',
   'inactive', 'TWN', '台東縣台東市', 22.7583, 121.1444, 'IRONMAN / WTC'),

  ('b1000000-0000-0000-0000-000000000003', '興·泉滴水湖大鐵', 'xinquan-ironman',
   'active', 'TWN', '嘉義縣水上鄉', 23.4541, 120.4048, '嘉義縣政府'),

  ('b1000000-0000-0000-0000-000000000004', '臺東超級鐵人三項', 'taitung-superironman',
   'inactive', 'TWN', '台東縣台東市', 22.7583, 121.1444, NULL),

  ('b1000000-0000-0000-0000-000000000005', 'Challenge Roth', 'challenge-roth',
   'active', 'DEU', 'Roth, Bavaria', 49.2481, 11.0989, 'Challenge Family'),

  ('b1000000-0000-0000-0000-000000000006', 'IRONMAN South Africa', 'ironman-south-africa',
   'active', 'ZAF', 'Port Elizabeth', -33.9608, 25.6022, 'IRONMAN / WTC'),

  ('b1000000-0000-0000-0000-000000000007', 'IRONMAN Frankfurt', 'ironman-frankfurt',
   'active', 'DEU', 'Frankfurt', 50.1109, 8.6821, 'IRONMAN / WTC')

ON CONFLICT (slug) DO NOTHING;

-- ── 2. 修正既有 Challenge Taiwan 距離分類 ────────────────────
-- Challenge Taiwan 為全距離（226km）賽事，原始 seed 標記為 70.3 有誤

UPDATE public.race_editions
SET
  distance_category = 'full',
  swim_distance_m   = 3800,
  bike_distance_km  = 180,
  run_distance_km   = 42.2
WHERE race_id = 'a1000000-0000-0000-0000-000000000002';

-- ── 3. 新增賽事屆次 ───────────────────────────────────────────

-- Challenge Taiwan（沿用既有 race_id，補充缺少的年份）
INSERT INTO public.race_editions (race_id, year, race_date, distance_category, swim_distance_m, bike_distance_km, run_distance_km)
VALUES
  ('a1000000-0000-0000-0000-000000000002', 2014, '2014-04-27', 'full', 3800, 180, 42.2),
  ('a1000000-0000-0000-0000-000000000002', 2017, '2017-04-23', 'full', 3800, 180, 42.2),
  ('a1000000-0000-0000-0000-000000000002', 2021, '2021-10-24', 'full', 3800, 180, 42.2),
  ('a1000000-0000-0000-0000-000000000002', 2026, '2026-04-19', 'full', 3800, 180, 42.2)
ON CONFLICT (race_id, year) DO NOTHING;

-- 普悠瑪
INSERT INTO public.race_editions (race_id, year, race_date, distance_category, swim_distance_m, bike_distance_km, run_distance_km)
VALUES
  ('b1000000-0000-0000-0000-000000000001', 2012, '2012-11-18', 'full', 3800, 180, 42.2),
  ('b1000000-0000-0000-0000-000000000001', 2017, '2017-11-19', 'full', 3800, 180, 42.2),
  ('b1000000-0000-0000-0000-000000000001', 2020, '2020-11-22', 'full', 3800, 180, 42.2),
  ('b1000000-0000-0000-0000-000000000001', 2021, '2021-11-21', 'full', 3800, 180, 42.2),
  ('b1000000-0000-0000-0000-000000000001', 2022, '2022-11-20', 'full', 3800, 180, 42.2),
  ('b1000000-0000-0000-0000-000000000001', 2023, '2023-11-19', 'full', 3800, 180, 42.2),
  ('b1000000-0000-0000-0000-000000000001', 2024, '2024-11-17', 'full', 3800, 180, 42.2),
  ('b1000000-0000-0000-0000-000000000001', 2025, '2025-11-16', 'full', 3800, 180, 42.2),
  ('b1000000-0000-0000-0000-000000000001', 2026, '2026-11-15', 'full', 3800, 180, 42.2)
ON CONFLICT (race_id, year) DO NOTHING;

-- IRONMAN Taiwan (full)
INSERT INTO public.race_editions (race_id, year, race_date, distance_category, swim_distance_m, bike_distance_km, run_distance_km)
VALUES
  ('b1000000-0000-0000-0000-000000000002', 2019, '2019-10-27', 'full', 3800, 180, 42.2),
  ('b1000000-0000-0000-0000-000000000002', 2022, '2022-10-30', 'full', 3800, 180, 42.2)
ON CONFLICT (race_id, year) DO NOTHING;

-- 興·泉滴水湖大鐵
INSERT INTO public.race_editions (race_id, year, race_date, distance_category, swim_distance_m, bike_distance_km, run_distance_km)
VALUES
  ('b1000000-0000-0000-0000-000000000003', 2025, '2025-05-18', 'full', 3800, 180, 42.2)
ON CONFLICT (race_id, year) DO NOTHING;

-- 臺東超鐵
INSERT INTO public.race_editions (race_id, year, race_date, distance_category, swim_distance_m, bike_distance_km, run_distance_km)
VALUES
  ('b1000000-0000-0000-0000-000000000004', 2012, '2012-06-17', 'full', 3800, 180, 42.2)
ON CONFLICT (race_id, year) DO NOTHING;

-- Challenge Roth
INSERT INTO public.race_editions (race_id, year, race_date, distance_category, swim_distance_m, bike_distance_km, run_distance_km)
VALUES
  ('b1000000-0000-0000-0000-000000000005', 2024, '2024-07-07', 'full', 3800, 180, 42.2)
ON CONFLICT (race_id, year) DO NOTHING;

-- IRONMAN South Africa
INSERT INTO public.race_editions (race_id, year, race_date, distance_category, swim_distance_m, bike_distance_km, run_distance_km)
VALUES
  ('b1000000-0000-0000-0000-000000000006', 2016, '2016-04-03', 'full', 3800, 180, 42.2)
ON CONFLICT (race_id, year) DO NOTHING;

-- IRONMAN Frankfurt
INSERT INTO public.race_editions (race_id, year, race_date, distance_category, swim_distance_m, bike_distance_km, run_distance_km)
VALUES
  ('b1000000-0000-0000-0000-000000000007', 2017, '2017-07-02', 'full', 3800, 180, 42.2)
ON CONFLICT (race_id, year) DO NOTHING;

-- ── 4. 策展層成績（snapshot 2026/02/07）──────────────────────
-- source_credibility = 'official'，claim_status = 'unclaimed'
-- 分項時間欄位全部留 NULL（原始資料僅有完賽總時間）

INSERT INTO public.results
  (result_type, race_edition_id, athlete_name_snapshot, source_credibility, claim_status,
   total_seconds, curated_gender, is_public)
VALUES

  -- ══ 男子組 ══

  ('solo',
   (SELECT re.id FROM public.race_editions re JOIN public.races r ON r.id = re.race_id
    WHERE r.slug = 'puiyuma-ironman' AND re.year = 2024),
   '張團畯', 'official', 'unclaimed', 29900, 'M', true),

  ('solo',
   (SELECT re.id FROM public.race_editions re JOIN public.races r ON r.id = re.race_id
    WHERE r.slug = 'puiyuma-ironman' AND re.year = 2023),
   '蕭昱', 'official', 'unclaimed', 30728, 'M', true),

  ('solo',
   (SELECT re.id FROM public.race_editions re JOIN public.races r ON r.id = re.race_id
    WHERE r.slug = 'puiyuma-ironman' AND re.year = 2023),
   '謝昇諺', 'official', 'unclaimed', 31367, 'M', true),

  ('solo',
   (SELECT re.id FROM public.race_editions re JOIN public.races r ON r.id = re.race_id
    WHERE r.slug = 'puiyuma-ironman' AND re.year = 2022),
   '許仁茂', 'official', 'unclaimed', 32356, 'M', true),

  ('solo',
   (SELECT re.id FROM public.race_editions re JOIN public.races r ON r.id = re.race_id
    WHERE r.slug = 'challenge-taiwan' AND re.year = 2024),
   '吳承泰', 'official', 'unclaimed', 32431, 'M', true),

  ('solo',
   (SELECT re.id FROM public.race_editions re JOIN public.races r ON r.id = re.race_id
    WHERE r.slug = 'puiyuma-ironman' AND re.year = 2025),
   '楊博智', 'official', 'unclaimed', 32741, 'M', true),

  ('solo',
   (SELECT re.id FROM public.race_editions re JOIN public.races r ON r.id = re.race_id
    WHERE r.slug = 'challenge-taiwan' AND re.year = 2024),
   '李瑋', 'official', 'unclaimed', 32761, 'M', true),

  ('solo',
   (SELECT re.id FROM public.race_editions re JOIN public.races r ON r.id = re.race_id
    WHERE r.slug = 'challenge-taiwan' AND re.year = 2026),
   '薛順仁', 'official', 'unclaimed', 32902, 'M', true),

  ('solo',
   (SELECT re.id FROM public.race_editions re JOIN public.races r ON r.id = re.race_id
    WHERE r.slug = 'xinquan-ironman' AND re.year = 2025),
   '何孟橋', 'official', 'unclaimed', 33055, 'M', true),

  ('solo',
   (SELECT re.id FROM public.race_editions re JOIN public.races r ON r.id = re.race_id
    WHERE r.slug = 'challenge-taiwan' AND re.year = 2026),
   '羅譽寅', 'official', 'unclaimed', 33317, 'M', true),

  ('solo',
   (SELECT re.id FROM public.race_editions re JOIN public.races r ON r.id = re.race_id
    WHERE r.slug = 'challenge-taiwan' AND re.year = 2014),
   '楊茂雍', 'official', 'unclaimed', 33367, 'M', true),

  ('solo',
   (SELECT re.id FROM public.race_editions re JOIN public.races r ON r.id = re.race_id
    WHERE r.slug = 'challenge-taiwan' AND re.year = 2021),
   '王金晴', 'official', 'unclaimed', 33575, 'M', true),

  ('solo',
   (SELECT re.id FROM public.race_editions re JOIN public.races r ON r.id = re.race_id
    WHERE r.slug = 'challenge-taiwan' AND re.year = 2026),
   '江立堯', 'official', 'unclaimed', 33944, 'M', true),

  ('solo',
   (SELECT re.id FROM public.race_editions re JOIN public.races r ON r.id = re.race_id
    WHERE r.slug = 'ironman-taiwan-full' AND re.year = 2022),
   '王志袁', 'official', 'unclaimed', 34298, 'M', true),

  ('solo',
   (SELECT re.id FROM public.race_editions re JOIN public.races r ON r.id = re.race_id
    WHERE r.slug = 'challenge-roth' AND re.year = 2024),
   '廖斌宏', 'official', 'unclaimed', 34322, 'M', true),

  ('solo',
   (SELECT re.id FROM public.race_editions re JOIN public.races r ON r.id = re.race_id
    WHERE r.slug = 'ironman-taiwan-full' AND re.year = 2019),
   '謝漢霖', 'official', 'unclaimed', 34401, 'M', true),

  ('solo',
   (SELECT re.id FROM public.race_editions re JOIN public.races r ON r.id = re.race_id
    WHERE r.slug = 'puiyuma-ironman' AND re.year = 2020),
   '陳永慶', 'official', 'unclaimed', 34592, 'M', true),

  ('solo',
   (SELECT re.id FROM public.race_editions re JOIN public.races r ON r.id = re.race_id
    WHERE r.slug = 'puiyuma-ironman' AND re.year = 2023),
   '朱昶宇', 'official', 'unclaimed', 34650, 'M', true),

  ('solo',
   (SELECT re.id FROM public.race_editions re JOIN public.races r ON r.id = re.race_id
    WHERE r.slug = 'puiyuma-ironman' AND re.year = 2026),
   '葛芃欣', 'official', 'unclaimed', 34763, 'M', true),

  ('solo',
   (SELECT re.id FROM public.race_editions re JOIN public.races r ON r.id = re.race_id
    WHERE r.slug = 'ironman-taiwan-full' AND re.year = 2022),
   '李長泰', 'official', 'unclaimed', 34810, 'M', true),

  ('solo',
   (SELECT re.id FROM public.race_editions re JOIN public.races r ON r.id = re.race_id
    WHERE r.slug = 'taitung-superironman' AND re.year = 2012),
   '徐國峰', 'official', 'unclaimed', 35055, 'M', true),

  ('solo',
   (SELECT re.id FROM public.race_editions re JOIN public.races r ON r.id = re.race_id
    WHERE r.slug = 'challenge-taiwan' AND re.year = 2017),
   '范永奕', 'official', 'unclaimed', 35178, 'M', true),

  ('solo',
   (SELECT re.id FROM public.race_editions re JOIN public.races r ON r.id = re.race_id
    WHERE r.slug = 'ironman-taiwan-full' AND re.year = 2019),
   '柯俞東', 'official', 'unclaimed', 35204, 'M', true),

  ('solo',
   (SELECT re.id FROM public.race_editions re JOIN public.races r ON r.id = re.race_id
    WHERE r.slug = 'puiyuma-ironman' AND re.year = 2017),
   '賴錦源', 'official', 'unclaimed', 35238, 'M', true),

  ('solo',
   (SELECT re.id FROM public.race_editions re JOIN public.races r ON r.id = re.race_id
    WHERE r.slug = 'puiyuma-ironman' AND re.year = 2017),
   '李高偉', 'official', 'unclaimed', 35365, 'M', true),

  ('solo',
   (SELECT re.id FROM public.race_editions re JOIN public.races r ON r.id = re.race_id
    WHERE r.slug = 'puiyuma-ironman' AND re.year = 2020),
   '李憲宗', 'official', 'unclaimed', 35417, 'M', true),

  ('solo',
   (SELECT re.id FROM public.race_editions re JOIN public.races r ON r.id = re.race_id
    WHERE r.slug = 'challenge-taiwan' AND re.year = 2026),
   '郭丁元', 'official', 'unclaimed', 35491, 'M', true),

  ('solo',
   (SELECT re.id FROM public.race_editions re JOIN public.races r ON r.id = re.race_id
    WHERE r.slug = 'ironman-taiwan-full' AND re.year = 2019),
   '林岳岡', 'official', 'unclaimed', 35585, 'M', true),

  ('solo',
   (SELECT re.id FROM public.race_editions re JOIN public.races r ON r.id = re.race_id
    WHERE r.slug = 'challenge-taiwan' AND re.year = 2023),
   '鍾瑋剛', 'official', 'unclaimed', 35645, 'M', true),

  ('solo',
   (SELECT re.id FROM public.race_editions re JOIN public.races r ON r.id = re.race_id
    WHERE r.slug = 'puiyuma-ironman' AND re.year = 2021),
   '魏冠倫', 'official', 'unclaimed', 35699, 'M', true),

  ('solo',
   (SELECT re.id FROM public.race_editions re JOIN public.races r ON r.id = re.race_id
    WHERE r.slug = 'puiyuma-ironman' AND re.year = 2025),
   '李逸軒', 'official', 'unclaimed', 35786, 'M', true),

  ('solo',
   (SELECT re.id FROM public.race_editions re JOIN public.races r ON r.id = re.race_id
    WHERE r.slug = 'challenge-taiwan' AND re.year = 2026),
   '陳遇助', 'official', 'unclaimed', 35875, 'M', true),

  ('solo',
   (SELECT re.id FROM public.race_editions re JOIN public.races r ON r.id = re.race_id
    WHERE r.slug = 'puiyuma-ironman' AND re.year = 2023),
   '梁祐榮', 'official', 'unclaimed', 35929, 'M', true),

  ('solo',
   (SELECT re.id FROM public.race_editions re JOIN public.races r ON r.id = re.race_id
    WHERE r.slug = 'ironman-taiwan-full' AND re.year = 2019),
   '梁騰瑜', 'official', 'unclaimed', 35967, 'M', true),

  ('solo',
   (SELECT re.id FROM public.race_editions re JOIN public.races r ON r.id = re.race_id
    WHERE r.slug = 'ironman-south-africa' AND re.year = 2016),
   '寇大龍', 'official', 'unclaimed', 35976, 'M', true),

  -- ══ 女子組 ══

  ('solo',
   (SELECT re.id FROM public.race_editions re JOIN public.races r ON r.id = re.race_id
    WHERE r.slug = 'ironman-frankfurt' AND re.year = 2017),
   '李筱瑜', 'official', 'unclaimed', 34630, 'F', true),

  ('solo',
   (SELECT re.id FROM public.race_editions re JOIN public.races r ON r.id = re.race_id
    WHERE r.slug = 'challenge-taiwan' AND re.year = 2023),
   '陳俐妘', 'official', 'unclaimed', 35819, 'F', true),

  ('solo',
   (SELECT re.id FROM public.race_editions re JOIN public.races r ON r.id = re.race_id
    WHERE r.slug = 'puiyuma-ironman' AND re.year = 2023),
   '郭家齊', 'official', 'unclaimed', 36552, 'F', true),

  ('solo',
   (SELECT re.id FROM public.race_editions re JOIN public.races r ON r.id = re.race_id
    WHERE r.slug = 'puiyuma-ironman' AND re.year = 2024),
   '黃怡佳', 'official', 'unclaimed', 38104, 'F', true),

  ('solo',
   (SELECT re.id FROM public.race_editions re JOIN public.races r ON r.id = re.race_id
    WHERE r.slug = 'puiyuma-ironman' AND re.year = 2025),
   '許靜怡', 'official', 'unclaimed', 38816, 'F', true),

  ('solo',
   (SELECT re.id FROM public.race_editions re JOIN public.races r ON r.id = re.race_id
    WHERE r.slug = 'puiyuma-ironman' AND re.year = 2023),
   '洪筱婷', 'official', 'unclaimed', 38959, 'F', true),

  ('solo',
   (SELECT re.id FROM public.race_editions re JOIN public.races r ON r.id = re.race_id
    WHERE r.slug = 'puiyuma-ironman' AND re.year = 2024),
   '郭慧希', 'official', 'unclaimed', 38993, 'F', true),

  ('solo',
   (SELECT re.id FROM public.race_editions re JOIN public.races r ON r.id = re.race_id
    WHERE r.slug = 'puiyuma-ironman' AND re.year = 2023),
   '鍾天晴', 'official', 'unclaimed', 39396, 'F', true);
