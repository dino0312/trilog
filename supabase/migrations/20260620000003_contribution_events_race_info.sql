-- ============================================================
-- Tri·log Migration — contribution_events 支援 add_race_info（spec §50）
-- ============================================================

-- ── 1. result_id 改為可 NULL（race_info 貢獻無對應 result）────
ALTER TABLE public.contribution_events
  ALTER COLUMN result_id DROP NOT NULL;

-- ── 2. 新增 related_edition_id 欄位 ──────────────────────────
ALTER TABLE public.contribution_events
  ADD COLUMN IF NOT EXISTS related_edition_id UUID REFERENCES public.race_editions(id) ON DELETE CASCADE;

COMMENT ON COLUMN public.contribution_events.related_edition_id IS 'add_race_info 事件對應的 race_edition_id';

-- ── 3. 更新 event_type CHECK constraint ──────────────────────
ALTER TABLE public.contribution_events
  DROP CONSTRAINT IF EXISTS contribution_events_event_type_check;

ALTER TABLE public.contribution_events
  ADD CONSTRAINT contribution_events_event_type_check
  CHECK (event_type IN ('add_self', 'add_other', 'other_claimed', 'add_race_info'));

-- ── 4. Index ─────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_contribution_events_edition
  ON public.contribution_events(athlete_id, related_edition_id)
  WHERE related_edition_id IS NOT NULL;
