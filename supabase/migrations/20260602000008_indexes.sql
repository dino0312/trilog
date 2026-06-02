-- ============================================================
-- Tri·log Migration 008 — Indexes 索引
-- ============================================================

-- ── RESULTS 主要查詢路徑 ──────────────────────────────────────

-- 排行榜核心查詢：依屆次取得公開成績，按時間排序
-- 使用場景：GET /api/leaderboard
CREATE INDEX idx_results_leaderboard
  ON public.results (race_edition_id, total_seconds)
  WHERE is_public = true
    AND claim_status IN ('unclaimed', 'claimed')
    AND source_credibility IN ('official', 'certificate');

-- 全排行榜（含 self_reported）
CREATE INDEX idx_results_leaderboard_all
  ON public.results (race_edition_id, total_seconds)
  WHERE is_public = true
    AND claim_status IN ('unclaimed', 'claimed');

-- 個人成績頁查詢：依 athlete_id 取得所有成績
CREATE INDEX idx_results_athlete
  ON public.results (athlete_id, created_at DESC)
  WHERE athlete_id IS NOT NULL;

-- 未認領成績查詢（策展層未認領清單、依標記數排序）
CREATE INDEX idx_results_unclaimed
  ON public.results (source_credibility, claim_status, claim_tag_count DESC)
  WHERE claim_status IN ('unclaimed', 'unlinked');

-- 選手姓名搜尋（認領前搜尋自己的成績）
CREATE INDEX idx_results_name_snapshot
  ON public.results USING gin (to_tsvector('simple', coalesce(athlete_name_snapshot, '')))
  WHERE athlete_name_snapshot IS NOT NULL;

-- 成績類型快速篩選
CREATE INDEX idx_results_type
  ON public.results (result_type, race_edition_id);

-- ── RACES / RACE_EDITIONS ─────────────────────────────────────

-- slug 查詢（已有 UNIQUE index，額外加一個 status 過濾版本）
CREATE INDEX idx_races_slug_active
  ON public.races (slug)
  WHERE status = 'active';

-- 賽事屆次查詢：依 race_id + year
CREATE INDEX idx_race_editions_race_year
  ON public.race_editions (race_id, year DESC);

-- 距離分類查詢
CREATE INDEX idx_race_editions_distance
  ON public.race_editions (distance_category, race_date DESC);

-- ── CLAIM_TAGS ────────────────────────────────────────────────

-- 統計特定成績的標記數（備援，主要依賴 results.claim_tag_count 快取）
CREATE INDEX idx_claim_tags_result
  ON public.claim_tags (result_id, created_at);

-- 查詢特定用戶的所有標記
CREATE INDEX idx_claim_tags_user
  ON public.claim_tags (tagged_by, created_at DESC);

-- ── TEAMS / TEAM_MEMBERS ──────────────────────────────────────

-- 透過 result_id 快速找到隊伍（已有 UNIQUE，額外補一個一般索引）
CREATE INDEX idx_teams_result
  ON public.teams (result_id);

-- 成員查詢
CREATE INDEX idx_team_members_team
  ON public.team_members (team_id, sort_order);

-- 成員個人頁面：查詢某選手參與的所有接力
CREATE INDEX idx_team_members_athlete
  ON public.team_members (athlete_id)
  WHERE athlete_id IS NOT NULL;

-- ── ATHLETES ──────────────────────────────────────────────────

-- 排行榜 JOIN 時依 nickname 存在性篩選（spec 21.2）
CREATE INDEX idx_athletes_nickname
  ON public.athletes (nickname)
  WHERE nickname IS NOT NULL AND deleted_at IS NULL;

-- 國籍篩選
CREATE INDEX idx_athletes_nationality
  ON public.athletes (nationality)
  WHERE deleted_at IS NULL;

-- ── RACE_EDITORS ──────────────────────────────────────────────

CREATE INDEX idx_race_editors_race
  ON public.race_editors (race_id);

CREATE INDEX idx_race_editors_athlete
  ON public.race_editors (athlete_id);
