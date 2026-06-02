-- ============================================================
-- Tri·log Migration 009 — Role Helper Functions + All RLS Policies
-- （需在所有 table 建立後執行）
-- ============================================================

-- ── Helper functions ──────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS TEXT
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public AS $$
  SELECT role FROM public.athletes
  WHERE id = auth.uid() AND deleted_at IS NULL;
$$;

CREATE OR REPLACE FUNCTION public.is_assistant_or_above()
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public AS $$
  SELECT COALESCE(
    (SELECT role IN ('assistant', 'admin') FROM public.athletes
     WHERE id = auth.uid() AND deleted_at IS NULL),
    false
  );
$$;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public AS $$
  SELECT COALESCE(
    (SELECT role = 'admin' FROM public.athletes
     WHERE id = auth.uid() AND deleted_at IS NULL),
    false
  );
$$;

CREATE OR REPLACE FUNCTION public.is_race_editor(p_race_id uuid)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.race_editors
    WHERE race_id = p_race_id AND athlete_id = auth.uid()
  ) OR public.is_assistant_or_above();
$$;

-- ── athletes policies ─────────────────────────────────────────

DROP POLICY IF EXISTS "athletes_public_read"   ON public.athletes;
DROP POLICY IF EXISTS "athletes_self_read_own" ON public.athletes;
DROP POLICY IF EXISTS "athletes_self_update"   ON public.athletes;
DROP POLICY IF EXISTS "athletes_admin_update"  ON public.athletes;

CREATE POLICY "athletes_public_read"
  ON public.athletes FOR SELECT USING (deleted_at IS NULL);

CREATE POLICY "athletes_self_read_own"
  ON public.athletes FOR SELECT USING (id = auth.uid());

CREATE POLICY "athletes_self_update"
  ON public.athletes FOR UPDATE
  USING (id = auth.uid()) WITH CHECK (id = auth.uid());

CREATE POLICY "athletes_admin_update"
  ON public.athletes FOR UPDATE
  USING (public.is_admin()) WITH CHECK (public.is_admin());

-- ── races policies ────────────────────────────────────────────

DROP POLICY IF EXISTS "races_public_read"      ON public.races;
DROP POLICY IF EXISTS "races_assistant_insert" ON public.races;
DROP POLICY IF EXISTS "races_editor_update"    ON public.races;
DROP POLICY IF EXISTS "races_admin_delete"     ON public.races;

CREATE POLICY "races_public_read"
  ON public.races FOR SELECT USING (true);

CREATE POLICY "races_assistant_insert"
  ON public.races FOR INSERT WITH CHECK (public.is_assistant_or_above());

CREATE POLICY "races_editor_update"
  ON public.races FOR UPDATE
  USING (public.is_race_editor(id)) WITH CHECK (public.is_race_editor(id));

CREATE POLICY "races_admin_delete"
  ON public.races FOR DELETE USING (public.is_admin());

-- ── race_editions policies ────────────────────────────────────

DROP POLICY IF EXISTS "race_editions_public_read"      ON public.race_editions;
DROP POLICY IF EXISTS "race_editions_assistant_insert" ON public.race_editions;
DROP POLICY IF EXISTS "race_editions_editor_update"    ON public.race_editions;
DROP POLICY IF EXISTS "race_editions_admin_delete"     ON public.race_editions;

CREATE POLICY "race_editions_public_read"
  ON public.race_editions FOR SELECT USING (true);

CREATE POLICY "race_editions_assistant_insert"
  ON public.race_editions FOR INSERT WITH CHECK (public.is_assistant_or_above());

CREATE POLICY "race_editions_editor_update"
  ON public.race_editions FOR UPDATE
  USING (public.is_race_editor(race_id)) WITH CHECK (public.is_race_editor(race_id));

CREATE POLICY "race_editions_admin_delete"
  ON public.race_editions FOR DELETE USING (public.is_admin());

-- ── results policies ──────────────────────────────────────────

DROP POLICY IF EXISTS "results_public_read"             ON public.results;
DROP POLICY IF EXISTS "results_athlete_insert"          ON public.results;
DROP POLICY IF EXISTS "results_athlete_update_own"      ON public.results;
DROP POLICY IF EXISTS "results_assistant_update_status" ON public.results;
DROP POLICY IF EXISTS "results_athlete_delete_own"      ON public.results;
DROP POLICY IF EXISTS "results_admin_delete"            ON public.results;

CREATE POLICY "results_public_read"
  ON public.results FOR SELECT
  USING (is_public = true OR claim_status IN ('unclaimed', 'unlinked') OR athlete_id = auth.uid());

CREATE POLICY "results_athlete_insert"
  ON public.results FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND result_type = 'solo'
    AND source_credibility = 'self_reported'
    AND athlete_id = auth.uid()
  );

CREATE POLICY "results_athlete_update_own"
  ON public.results FOR UPDATE
  USING (athlete_id = auth.uid() AND source_credibility != 'official')
  WITH CHECK (athlete_id = auth.uid());

CREATE POLICY "results_assistant_update_status"
  ON public.results FOR UPDATE
  USING (public.is_assistant_or_above()) WITH CHECK (public.is_assistant_or_above());

CREATE POLICY "results_athlete_delete_own"
  ON public.results FOR DELETE
  USING (athlete_id = auth.uid() AND source_credibility = 'self_reported');

CREATE POLICY "results_admin_delete"
  ON public.results FOR DELETE USING (public.is_admin());

-- ── claim_tags policies ───────────────────────────────────────

DROP POLICY IF EXISTS "claim_tags_public_read"        ON public.claim_tags;
DROP POLICY IF EXISTS "claim_tags_athlete_insert"     ON public.claim_tags;
DROP POLICY IF EXISTS "claim_tags_athlete_delete_own" ON public.claim_tags;
DROP POLICY IF EXISTS "claim_tags_admin_delete"       ON public.claim_tags;

CREATE POLICY "claim_tags_public_read"
  ON public.claim_tags FOR SELECT USING (true);

CREATE POLICY "claim_tags_athlete_insert"
  ON public.claim_tags FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL AND tagged_by = auth.uid());

CREATE POLICY "claim_tags_athlete_delete_own"
  ON public.claim_tags FOR DELETE USING (tagged_by = auth.uid());

CREATE POLICY "claim_tags_admin_delete"
  ON public.claim_tags FOR DELETE USING (public.is_admin());

-- ── teams policies ────────────────────────────────────────────

DROP POLICY IF EXISTS "teams_public_read"                ON public.teams;
DROP POLICY IF EXISTS "teams_athlete_insert"             ON public.teams;
DROP POLICY IF EXISTS "teams_member_or_assistant_update" ON public.teams;
DROP POLICY IF EXISTS "teams_admin_delete"               ON public.teams;

CREATE POLICY "teams_public_read"
  ON public.teams FOR SELECT USING (true);

CREATE POLICY "teams_athlete_insert"
  ON public.teams FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "teams_member_or_assistant_update"
  ON public.teams FOR UPDATE
  USING (
    public.is_assistant_or_above()
    OR EXISTS (
      SELECT 1 FROM public.team_members tm
      WHERE tm.team_id = teams.id
        AND tm.athlete_id = auth.uid()
        AND tm.claim_status = 'claimed'
    )
  );

CREATE POLICY "teams_admin_delete"
  ON public.teams FOR DELETE USING (public.is_admin());

-- ── team_members policies ─────────────────────────────────────

DROP POLICY IF EXISTS "team_members_public_read"      ON public.team_members;
DROP POLICY IF EXISTS "team_members_athlete_insert"   ON public.team_members;
DROP POLICY IF EXISTS "team_members_self_update"      ON public.team_members;
DROP POLICY IF EXISTS "team_members_assistant_update" ON public.team_members;
DROP POLICY IF EXISTS "team_members_admin_delete"     ON public.team_members;

CREATE POLICY "team_members_public_read"
  ON public.team_members FOR SELECT USING (true);

CREATE POLICY "team_members_athlete_insert"
  ON public.team_members FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "team_members_self_update"
  ON public.team_members FOR UPDATE
  USING (athlete_id = auth.uid()) WITH CHECK (athlete_id = auth.uid());

CREATE POLICY "team_members_assistant_update"
  ON public.team_members FOR UPDATE
  USING (public.is_assistant_or_above()) WITH CHECK (public.is_assistant_or_above());

CREATE POLICY "team_members_admin_delete"
  ON public.team_members FOR DELETE USING (public.is_admin());

-- ── race_editors policies ─────────────────────────────────────

DROP POLICY IF EXISTS "race_editors_public_read"      ON public.race_editors;
DROP POLICY IF EXISTS "race_editors_assistant_insert" ON public.race_editors;
DROP POLICY IF EXISTS "race_editors_admin_update"     ON public.race_editors;
DROP POLICY IF EXISTS "race_editors_admin_delete"     ON public.race_editors;

CREATE POLICY "race_editors_public_read"
  ON public.race_editors FOR SELECT USING (true);

CREATE POLICY "race_editors_assistant_insert"
  ON public.race_editors FOR INSERT WITH CHECK (public.is_assistant_or_above());

CREATE POLICY "race_editors_admin_update"
  ON public.race_editors FOR UPDATE
  USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY "race_editors_admin_delete"
  ON public.race_editors FOR DELETE USING (public.is_admin());
