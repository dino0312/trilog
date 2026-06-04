-- 修改 race_editions 的 unique constraint
-- 原本：UNIQUE(race_id, year)          → 同賽事同年只能有一筆
-- 改為：UNIQUE(race_id, year, distance_category) → 同賽事同年可有多個距離組別

ALTER TABLE race_editions
  DROP CONSTRAINT race_editions_race_id_year_key;

ALTER TABLE race_editions
  ADD CONSTRAINT race_editions_race_id_year_distance_key
  UNIQUE (race_id, year, distance_category);
