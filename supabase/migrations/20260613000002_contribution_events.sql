-- ============================================================
-- Tri·log Migration — 貢獻積分系統（spec §46）
-- contribution_events 資料表 + athletes.contribution_score
-- ============================================================

-- ── 1. athletes 新增 contribution_score ──────────────────────
ALTER TABLE public.athletes
  ADD COLUMN IF NOT EXISTS contribution_score int NOT NULL DEFAULT 0;

COMMENT ON COLUMN public.athletes.contribution_score IS '快取總積分，由 trigger 維護（新增/撤銷 contribution_events 時同步更新）';

-- ── 2. contribution_events 資料表 ────────────────────────────
CREATE TABLE IF NOT EXISTS public.contribution_events (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  athlete_id    uuid        NOT NULL REFERENCES public.athletes(id) ON DELETE CASCADE,
  event_type    text        NOT NULL
                            CHECK (event_type IN ('add_self', 'add_other', 'other_claimed')),
  result_id     uuid        NOT NULL REFERENCES public.results(id) ON DELETE CASCADE,
  points        int         NOT NULL CHECK (points > 0),
  revoke_reason text,
  created_at    timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE  public.contribution_events              IS '貢獻積分事件流水帳，刪除即撤銷（trigger 自動扣回 contribution_score）';
COMMENT ON COLUMN public.contribution_events.event_type   IS 'add_self(+1) / add_other(+3) / other_claimed(+2)';
COMMENT ON COLUMN public.contribution_events.revoke_reason IS '管理員撤銷時填寫原因';

ALTER TABLE public.contribution_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "contribution_events_public_read"
  ON public.contribution_events FOR SELECT USING (true);

CREATE POLICY "contribution_events_admin_delete"
  ON public.contribution_events FOR DELETE USING (public.is_admin());

-- ── 3. Trigger：同步 contribution_score ──────────────────────
CREATE OR REPLACE FUNCTION public.sync_contribution_score()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.athletes
    SET contribution_score = contribution_score + NEW.points
    WHERE id = NEW.athlete_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.athletes
    SET contribution_score = GREATEST(0, contribution_score - OLD.points)
    WHERE id = OLD.athlete_id;
    RETURN OLD;
  END IF;
END;
$$;

CREATE TRIGGER contribution_events_sync_score
  AFTER INSERT OR DELETE ON public.contribution_events
  FOR EACH ROW EXECUTE FUNCTION public.sync_contribution_score();

-- ── 4. Trigger：results INSERT → 產生 add_self / add_other ───
CREATE OR REPLACE FUNCTION public.handle_result_contribution()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public AS $$
DECLARE
  v_event_type text;
  v_points     int;
BEGIN
  -- 官方成績不計積分
  IF NEW.source_credibility = 'official' THEN RETURN NEW; END IF;
  -- 無新增者，跳過
  IF NEW.created_by IS NULL THEN RETURN NEW; END IF;

  IF NEW.athlete_id IS NOT NULL AND NEW.athlete_id = NEW.created_by THEN
    v_event_type := 'add_self';
    v_points     := 1;
  ELSE
    v_event_type := 'add_other';
    v_points     := 3;
  END IF;

  INSERT INTO public.contribution_events (athlete_id, event_type, result_id, points)
  VALUES (NEW.created_by, v_event_type, NEW.id, v_points);

  RETURN NEW;
END;
$$;

CREATE TRIGGER results_on_insert_contribution
  AFTER INSERT ON public.results
  FOR EACH ROW EXECUTE FUNCTION public.handle_result_contribution();

-- ── 5. Trigger：results claim_status → 'claimed' → other_claimed ─
CREATE OR REPLACE FUNCTION public.handle_claim_contribution()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public AS $$
BEGIN
  -- 只在 claim_status 變成 'claimed' 時觸發
  IF OLD.claim_status = NEW.claim_status THEN RETURN NEW; END IF;
  IF NEW.claim_status != 'claimed'       THEN RETURN NEW; END IF;
  -- 官方成績不計
  IF NEW.source_credibility = 'official' THEN RETURN NEW; END IF;
  -- 需要有新增者，且新增者不是認領者本人
  IF NEW.created_by IS NULL              THEN RETURN NEW; END IF;
  IF NEW.created_by = NEW.athlete_id     THEN RETURN NEW; END IF;

  INSERT INTO public.contribution_events (athlete_id, event_type, result_id, points)
  VALUES (NEW.created_by, 'other_claimed', NEW.id, 2);

  RETURN NEW;
END;
$$;

CREATE TRIGGER results_on_claim_contribution
  AFTER UPDATE OF claim_status ON public.results
  FOR EACH ROW EXECUTE FUNCTION public.handle_claim_contribution();

-- ── 6. Index ─────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_contribution_events_athlete
  ON public.contribution_events (athlete_id, created_at DESC);
