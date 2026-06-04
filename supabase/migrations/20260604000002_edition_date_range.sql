-- 新增屆次結束日期，支援連續多天的賽事
ALTER TABLE race_editions
  ADD COLUMN IF NOT EXISTS race_date_end date NULL;
