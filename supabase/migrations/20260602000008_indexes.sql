-- ============================================================
-- Tri·log Migration 008 — Indexes 索引
-- ============================================================

-- ── RESULTS ──────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_results_leaderboard
  ON public.results (race_edition_id, total_seconds)
  WHERE is_public = true
    AND claim_status IN ('unclaimed', 'claimed')
    AND source_credibility IN ('official', 'certificate');

CREATE INDEX IF NOT EXISTS idx_results_leaderboard_all
  ON public.results (race_edition_id, total_seconds)
  WHERE is_public = true
    AND claim_status IN ('unclaimed', 'claimed');

CREATE INDEX IF NOT EXISTS idx_results_athlete
  ON public.results (athlete_id, created_at DESC)
  WHERE athlete_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_results_unclaimed
  ON public.results (source_credibility, claim_status, claim_tag_count DESC)
  WHERE claim_status IN ('unclaimed', 'unlinked');

CREATE INDEX IF NOT EXISTS idx_results_name_snapshot
  ON public.results USING gin (to_tsvector('simple', coalesce(athlete_name_snapshot, '')))
  WHERE athlete_name_snapshot IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_results_type
  ON public.results (result_type, race_edition_id);

-- ── RACES / RACE_EDITIONS ─────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_races_slug_active
  ON public.races (slug)
  WHERE status = 'active';

CREATE INDEX IF NOT EXISTS idx_race_editions_race_year
  ON public.race_editions (race_id, year DESC);

CREATE INDEX IF NOT EXISTS idx_race_editions_distance
  ON public.race_editions (distance_category, race_date DESC);

-- ── CLAIM_TAGS ────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_claim_tags_result
  ON public.claim_tags (result_id, created_at);

CREATE INDEX IF NOT EXISTS idx_claim_tags_user
  ON public.claim_tags (tagged_by, created_at DESC);

-- ── TEAMS / TEAM_MEMBERS ──────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_teams_result
  ON public.teams (result_id);

CREATE INDEX IF NOT EXISTS idx_team_members_team
  ON public.team_members (team_id, sort_order);

CREATE INDEX IF NOT EXISTS idx_team_members_athlete
  ON public.team_members (athlete_id)
  WHERE athlete_id IS NOT NULL;

-- ── ATHLETES ──────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_athletes_nickname
  ON public.athletes (nickname)
  WHERE nickname IS NOT NULL AND deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_athletes_nationality
  ON public.athletes (nationality)
  WHERE deleted_at IS NULL;

-- ── RACE_EDITORS ──────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_race_editors_race
  ON public.race_editors (race_id);

CREATE INDEX IF NOT EXISTS idx_race_editors_athlete
  ON public.race_editors (athlete_id);
