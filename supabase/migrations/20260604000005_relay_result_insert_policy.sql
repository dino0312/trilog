-- ============================================================
-- Migration 20260604000005 — relay result INSERT policy
-- 允許登入用戶建立 relay 成績（athlete_id = null，由 team_members 管理成員）
-- ============================================================

DROP POLICY IF EXISTS "results_relay_insert" ON public.results;

CREATE POLICY "results_relay_insert"
  ON public.results FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND result_type = 'relay'
    AND source_credibility = 'self_reported'
    AND athlete_id IS NULL
  );
