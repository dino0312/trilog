-- 將玩賽樂園旗下賽事的 series 設為 WANSAILEYUAN（獨立分類）
UPDATE public.races
SET series = 'WANSAILEYUAN'
WHERE name ILIKE '%玩賽樂園%'
   OR name_zh ILIKE '%玩賽樂園%';

COMMENT ON COLUMN public.races.series IS '系列代碼，如 CHALLENGE / IRONMAN_TAIWAN / IRONMAN_70_3 / FORCE / PUYUMA / WANSAILEYUAN / LOCAL_EVENT';
