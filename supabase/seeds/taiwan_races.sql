-- ============================================================
-- Tri·log Seed — 台灣主要鐵人三項賽事
-- 在 SQL Editor 直接執行（bypass RLS）
-- 更新於 2026-06-05：對應 JSON 資料格式
-- ============================================================

-- ── RACES（品牌層，跨年度）────────────────────────────────────
-- 既有記錄：直接 UPDATE（保留 slug / id）
-- 新賽事：INSERT，ON CONFLICT(slug) DO NOTHING 防重複執行

-- Challenge Taiwan（舊 slug: challenge-taiwan）
UPDATE public.races SET
  name         = 'Challenge Taiwan',
  name_zh      = 'Challenge Taiwan 國際鐵人三項賽',
  name_en      = 'Challenge Taiwan Triathlon',
  series       = 'CHALLENGE',
  country      = 'TW',
  county       = '臺東縣',
  city         = '臺東市',
  lat          = 22.7583,
  lng          = 121.1444,
  organizer    = '台灣鐵人三項運動發展協會',
  organizer_co = ARRAY['臺東縣政府'],
  operator     = '威整合運動股份有限公司',
  website      = 'https://www.challenge-taiwan.com',
  updated_at   = now()
WHERE slug = 'challenge-taiwan';

-- IRONMAN 70.3 Kenting（舊 slug: ironman-703-taiwan）
UPDATE public.races SET
  name         = 'IRONMAN 70.3 Kenting',
  name_zh      = 'IRONMAN 70.3 Kenting 墾丁國際鐵人三項賽',
  name_en      = 'IRONMAN 70.3 Kenting',
  series       = 'IRONMAN_70_3',
  country      = 'TW',
  county       = '屏東縣',
  city         = '恆春鎮',
  lat          = 21.9442,
  lng          = 120.8008,
  organizer    = 'LAVA Sports 台灣鐵人三項公司',
  organizer_co = ARRAY[]::text[],
  operator     = NULL,
  website      = NULL,
  updated_at   = now()
WHERE slug = 'ironman-703-taiwan';

-- IRONMAN Taiwan Penghu（舊 slug: penghu-triathlon）
UPDATE public.races SET
  name         = 'IRONMAN Taiwan Penghu',
  name_zh      = 'IRONMAN Taiwan 澎湖國際鐵人三項賽',
  name_en      = 'IRONMAN Taiwan Penghu',
  series       = 'IRONMAN_TAIWAN',
  country      = 'TW',
  county       = '澎湖縣',
  city         = '馬公市',
  lat          = 23.5654,
  lng          = 119.5795,
  organizer    = NULL,
  organizer_co = ARRAY[]::text[],
  operator     = NULL,
  website      = 'https://www.ironmanstoretw.com/',
  updated_at   = now()
WHERE slug = 'penghu-triathlon';

-- 全國鐵人三項錦標賽（舊 slug: taiwan-national-triathlon）
UPDATE public.races SET
  name         = '全國鐵人三項錦標賽',
  name_zh      = '全國鐵人三項錦標賽',
  name_en      = 'National Triathlon Championships',
  series       = 'CTTA_NATIONALS',
  country      = 'TW',
  county       = '臺南市',
  city         = '安平區',
  lat          = 22.9909,
  lng          = 120.1641,
  organizer    = '中華民國鐵人三項運動協會',
  organizer_co = ARRAY[]::text[],
  operator     = NULL,
  website      = 'http://www.ctta.org.tw',
  updated_at   = now()
WHERE slug = 'taiwan-national-triathlon';

-- 新賽事 INSERT
INSERT INTO public.races (
  id, slug, status, country, county, city, lat, lng, website,
  name, name_zh, name_en, series, organizer, organizer_co, operator
)
VALUES
  -- 普悠瑪鐵人三項
  (
    'a1000000-0000-0000-0000-000000000009',
    'puyuma-triathlon', 'active', 'TW',
    '臺東縣', '臺東市', 22.7583, 121.1444, NULL,
    '普悠瑪鐵人三項',
    '普悠瑪鐵人三項',
    'Puyuma Triathlon',
    'PUYUMA',
    NULL, ARRAY[]::text[], NULL
  ),
  -- FORCE 蘭陽鐵人三項
  (
    'a1000000-0000-0000-0000-000000000010',
    'force-lanyang', 'active', 'TW',
    '宜蘭縣', '冬山鄉', 24.6580, 121.7860,
    'https://fun3sport.com/match/',
    'FORCE 蘭陽鐵人三項',
    'FORCE 蘭陽鐵人三項',
    'FORCE Lanyang Triathlon',
    'FORCE',
    '中華民國越野鐵人三項協會', ARRAY[]::text[], NULL
  ),
  -- FORCE x TriFactor 台南
  (
    'a1000000-0000-0000-0000-000000000011',
    'force-trifactor-tainan', 'active', 'TW',
    '臺南市', '臺南市', 22.9973, 120.2195,
    'https://fun3sport.com/match/',
    'FORCE x TriFactor 台南鐵人三項',
    'FORCE x TriFactor 台南鐵人三項賽',
    'FORCE x TriFactor Tainan Triathlon',
    'FORCE',
    NULL, ARRAY[]::text[], NULL
  ),
  -- 秀姑巒溪泛舟鐵人三項
  (
    'a1000000-0000-0000-0000-000000000012',
    'xiuguluan-rafting-tri', 'active', 'TW',
    '花蓮縣', '瑞穗鄉', 23.5056, 121.4259,
    'https://www.eastcoast-nsa.gov.tw/zh-tw/event/activity/5635/',
    '秀姑巒溪泛舟鐵人三項',
    '秀姑巒溪泛舟鐵人三項競賽',
    'Xiuguluan River Rafting Triathlon',
    'LOCAL_EVENT',
    '交通部觀光署東部海岸國家風景區管理處', ARRAY[]::text[], NULL
  )
ON CONFLICT (slug) DO NOTHING;


-- ── RACE EDITIONS（屆次層，逐年資料）────────────────────────
-- 修正舊 seed 中 Challenge Taiwan 的距離分類（全程，非 70.3）
-- 先刪除錯誤的 70.3 版本
DELETE FROM public.race_editions
WHERE race_id = (SELECT id FROM public.races WHERE slug = 'challenge-taiwan')
  AND distance_category = '70.3';

-- 同樣修正 IRONMAN 70.3 Kenting 舊的錯誤日期資料（整批刪除重寫）
DELETE FROM public.race_editions
WHERE race_id = (SELECT id FROM public.races WHERE slug = 'ironman-703-taiwan')
  AND year IN (2022, 2023, 2024);

-- 同樣修正 penghu 舊的佔位資料（JSON 沒有 2023/2024，刪掉）
DELETE FROM public.race_editions
WHERE race_id = (SELECT id FROM public.races WHERE slug = 'penghu-triathlon')
  AND year IN (2023, 2024);

-- 全國錦標賽舊的佔位資料
DELETE FROM public.race_editions
WHERE race_id = (SELECT id FROM public.races WHERE slug = 'taiwan-national-triathlon')
  AND year IN (2023, 2024);

-- FORCE 蘭陽舊的單一距離佔位資料（重新以兩個距離組別寫入）
DELETE FROM public.race_editions
WHERE race_id = (SELECT id FROM public.races WHERE slug = 'force-lanyang')
  AND year IN (2024, 2026);

-- Upsert 所有屆次
-- UNIQUE constraint: (race_id, year, distance_category)  [migration 20260604000001]

INSERT INTO public.race_editions (
  race_id, year, race_date, race_date_end,
  distance_category, swim_distance_m, bike_distance_km, run_distance_km,
  venue, registration_url
)
VALUES

  -- ── Challenge Taiwan（全程）─────────────────────────────────
  ((SELECT id FROM public.races WHERE slug = 'challenge-taiwan'),
   2022, '2022-04-23', '2022-04-24', 'full', 3800, 180, 42.2,
   '臺東活水湖', NULL),
  ((SELECT id FROM public.races WHERE slug = 'challenge-taiwan'),
   2023, '2023-04-22', '2023-04-23', 'full', 3800, 180, 42.2,
   '臺東活水湖', NULL),
  ((SELECT id FROM public.races WHERE slug = 'challenge-taiwan'),
   2024, '2024-04-27', '2024-04-28', 'full', 3800, 180, 42.2,
   '臺東活水湖', NULL),
  ((SELECT id FROM public.races WHERE slug = 'challenge-taiwan'),
   2025, '2025-04-26', '2025-04-27', 'full', 3800, 180, 42.2,
   '臺東活水湖', NULL),
  ((SELECT id FROM public.races WHERE slug = 'challenge-taiwan'),
   2026, '2026-04-25', '2026-04-26', 'full', 3800, 180, 42.2,
   '臺東活水湖', NULL),

  -- ── IRONMAN Taiwan Penghu（全程）────────────────────────────
  ((SELECT id FROM public.races WHERE slug = 'penghu-triathlon'),
   2022, '2022-04-10', '2022-04-10', 'full', 3800, 180, 42.2,
   '嵵裡沙灘', NULL),
  ((SELECT id FROM public.races WHERE slug = 'penghu-triathlon'),
   2025, '2025-04-13', '2025-04-13', 'full', 3800, 180, 42.2,
   NULL, NULL),
  ((SELECT id FROM public.races WHERE slug = 'penghu-triathlon'),
   2026, '2026-04-12', '2026-04-12', 'full', 3800, 180, 42.2,
   '嵵裡沙灘及澎湖本島路線', 'https://reurl.cc/yOmrYE'),

  -- ── IRONMAN 70.3 Kenting ────────────────────────────────────
  ((SELECT id FROM public.races WHERE slug = 'ironman-703-taiwan'),
   2023, '2023-10-28', '2023-10-29', '70.3', 1900, 90, 21.1,
   '墾丁半島（含小灣及周邊路線）', NULL),
  ((SELECT id FROM public.races WHERE slug = 'ironman-703-taiwan'),
   2024, '2024-10-06', '2024-10-06', '70.3', 1900, 90, 21.1,
   '墾丁小灣沙灘', 'https://www.soonnet.org/eventview/8624'),
  ((SELECT id FROM public.races WHERE slug = 'ironman-703-taiwan'),
   2025, '2025-11-01', '2025-11-02', '70.3', 1900, 90, 21.1,
   '墾丁福華飯店及周邊路線', NULL),
  ((SELECT id FROM public.races WHERE slug = 'ironman-703-taiwan'),
   2026, '2026-11-01', '2026-11-01', '70.3', 1900, 90, 21.1,
   '墾丁福華飯店及周邊路線',
   'https://www.marathonsworld.com/artapp/racedetail.php?rid=23751'),

  -- ── 普悠瑪鐵人三項（sprint + olympic + 70.3）───────────────
  ((SELECT id FROM public.races WHERE slug = 'puyuma-triathlon'),
   2024, '2024-03-23', '2024-03-23', 'sprint', 750, 20, 5,
   '台東森林公園活水湖',
   'https://www.runbase.tw/blogs/road-run/71013'),
  ((SELECT id FROM public.races WHERE slug = 'puyuma-triathlon'),
   2024, '2024-03-23', '2024-03-23', 'olympic', 1500, 40, 10,
   '台東森林公園活水湖',
   'https://www.runbase.tw/blogs/road-run/71013'),
  ((SELECT id FROM public.races WHERE slug = 'puyuma-triathlon'),
   2024, '2024-03-23', '2024-03-23', '70.3', 1900, 90, 21.1,
   '台東森林公園活水湖',
   'https://www.runbase.tw/blogs/road-run/71013'),
  -- 2025
  ((SELECT id FROM public.races WHERE slug = 'puyuma-triathlon'),
   2025, '2025-03-29', '2025-03-30', 'sprint', 750, 20, 5,
   '台東森林公園活水湖',
   'https://bhuntr.com/tw/competitions/e9ogwq191lzkggm692'),
  ((SELECT id FROM public.races WHERE slug = 'puyuma-triathlon'),
   2025, '2025-03-29', '2025-03-30', 'olympic', 1500, 40, 10,
   '台東森林公園活水湖',
   'https://bhuntr.com/tw/competitions/e9ogwq191lzkggm692'),
  ((SELECT id FROM public.races WHERE slug = 'puyuma-triathlon'),
   2025, '2025-03-29', '2025-03-30', '70.3', 1900, 90, 21.1,
   '台東森林公園活水湖',
   'https://bhuntr.com/tw/competitions/e9ogwq191lzkggm692'),

  -- ── 全國鐵人三項錦標賽（臺南）──────────────────────────────
  ((SELECT id FROM public.races WHERE slug = 'taiwan-national-triathlon'),
   2023, '2023-05-06', '2023-05-06', 'olympic', 1500, 40, 10,
   '觀夕平台及周邊路線', NULL),
  ((SELECT id FROM public.races WHERE slug = 'taiwan-national-triathlon'),
   2024, '2024-04-13', '2024-04-14', 'olympic', 1500, 40, 10,
   '觀夕平台及周邊路線',
   'https://bhuntr.com/tw/competitions/pppdufodd22zn3314i'),

  -- ── FORCE 蘭陽鐵人三項（51.5km + 113km）───────────────────
  ((SELECT id FROM public.races WHERE slug = 'force-lanyang'),
   2024, '2024-05-18', '2024-05-19', 'olympic', 1500, 40, 10,
   '冬山河生態綠洲', 'https://fun3sport.com/match/'),
  ((SELECT id FROM public.races WHERE slug = 'force-lanyang'),
   2024, '2024-05-18', '2024-05-19', '70.3', 1900, 90, 21.1,
   '冬山河生態綠洲', 'https://fun3sport.com/match/'),
  ((SELECT id FROM public.races WHERE slug = 'force-lanyang'),
   2026, '2026-06-28', '2026-06-28', 'olympic', 1500, 40, 10,
   '冬山河生態綠舟', 'https://fun3sport.com/match/'),
  ((SELECT id FROM public.races WHERE slug = 'force-lanyang'),
   2026, '2026-06-28', '2026-06-28', '70.3', 1900, 90, 21.1,
   '冬山河生態綠舟', 'https://fun3sport.com/match/'),

  -- ── FORCE x TriFactor 台南（51.5km + 113km）────────────────
  ((SELECT id FROM public.races WHERE slug = 'force-trifactor-tainan'),
   2026, '2026-11-22', '2026-11-22', 'olympic', 1500, 40, 10,
   NULL, 'https://fun3sport.com/match/'),
  ((SELECT id FROM public.races WHERE slug = 'force-trifactor-tainan'),
   2026, '2026-11-22', '2026-11-22', '70.3', 1900, 90, 21.1,
   NULL, 'https://fun3sport.com/match/'),

  -- ── 秀姑巒溪泛舟鐵人三項 ────────────────────────────────────
  ((SELECT id FROM public.races WHERE slug = 'xiuguluan-rafting-tri'),
   2025, '2025-06-08', '2025-06-08', 'olympic', 1500, 40, 10,
   '秀姑巒溪遊客中心至豐濱鄉新長虹橋下廣場', NULL)

ON CONFLICT (race_id, year, distance_category) DO UPDATE SET
  race_date        = EXCLUDED.race_date,
  race_date_end    = EXCLUDED.race_date_end,
  venue            = EXCLUDED.venue,
  registration_url = EXCLUDED.registration_url,
  updated_at       = now();
