-- Migration: relax "insert solo result for others" policy
-- 原本限制 assistant+，改為所有已登入用戶皆可

DROP POLICY IF EXISTS "assistant can insert solo result for others" ON public.results;

CREATE POLICY "authenticated can insert solo result for others"
  ON public.results
  FOR INSERT
  TO authenticated
  WITH CHECK (
    result_type = 'solo'
    AND athlete_id IS NULL
    AND source_credibility = 'self_reported'
    AND claim_status = 'unclaimed'
  );
