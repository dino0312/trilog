-- ============================================================
-- Tri·log Migration — 補充 results 表 assistant INSERT policy
-- 允許 assistant 以上角色新增官方成績（策展層）
-- ============================================================

DROP POLICY IF EXISTS "results_assistant_insert" ON public.results;

CREATE POLICY "results_assistant_insert"
  ON public.results FOR INSERT
  WITH CHECK (
    public.is_assistant_or_above()
    AND source_credibility = 'official'
    AND result_type        = 'solo'
    AND athlete_id         IS NULL
  );
