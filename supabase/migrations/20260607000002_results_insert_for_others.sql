-- Migration: allow any authenticated user to insert solo results on behalf of others
-- (athlete_id = null, claim_status = unclaimed, for claiming later)

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
