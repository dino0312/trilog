ALTER TABLE race_editions
  DROP CONSTRAINT IF EXISTS race_editions_swim_type_check;

ALTER TABLE race_editions
  ADD CONSTRAINT race_editions_swim_type_check
  CHECK (swim_type IN ('ocean', 'lake', 'open_water_lake', 'river', 'pool', 'other'));
