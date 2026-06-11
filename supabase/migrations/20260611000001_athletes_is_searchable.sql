-- Migration: athletes.is_searchable 欄位
-- 控制選手是否出現在全站搜尋結果（/api/athletes/search）
-- 未成年選手（is_minor=true）由應用層強制 false，DB 欄位預設 true

ALTER TABLE public.athletes
  ADD COLUMN IF NOT EXISTS is_searchable BOOLEAN NOT NULL DEFAULT TRUE;

-- 未成年選手預設關閉
UPDATE public.athletes SET is_searchable = FALSE WHERE is_minor = TRUE;
