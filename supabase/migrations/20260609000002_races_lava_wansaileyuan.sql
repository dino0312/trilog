-- 明確更新 LAVA 玩賽樂園系列賽事
UPDATE public.races
SET series = 'WANSAILEYUAN'
WHERE (name ILIKE '%LAVA%' AND (name ILIKE '%玩賽%' OR name_zh ILIKE '%玩賽%'))
   OR name ILIKE '%玩賽樂園%'
   OR name_zh ILIKE '%玩賽樂園%';
