-- ============================================================
-- Tri·log Migration — results.created_by 欄位
-- 記錄是誰新增這筆成績（策展助手或一般選手）
-- ============================================================

ALTER TABLE public.results
  ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES public.athletes(id) ON DELETE SET NULL;

COMMENT ON COLUMN public.results.created_by IS '新增此筆成績的使用者（auth.uid()），可為 null（系統批次匯入或舊資料）';
