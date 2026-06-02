-- ============================================================
-- Tri·log Migration 005 — CLAIM_TAG 知情人標記
-- ============================================================

CREATE TABLE IF NOT EXISTS public.claim_tags (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  result_id   uuid        NOT NULL REFERENCES public.results(id) ON DELETE CASCADE,
  tagged_by   uuid        NOT NULL REFERENCES public.athletes(id) ON DELETE CASCADE,
  message     text        CHECK (message IS NULL OR length(message) <= 100),
  created_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (result_id, tagged_by)
);

COMMENT ON TABLE  public.claim_tags           IS '知情人標記「我已通知本人」的記錄';
COMMENT ON COLUMN public.claim_tags.result_id IS '只能標記 claim_status = unclaimed 的成績';
COMMENT ON COLUMN public.claim_tags.tagged_by IS '標記人帳號，需登入';
COMMENT ON COLUMN public.claim_tags.message   IS '知情人留言，上限 100 字元（spec 15.2）';

CREATE OR REPLACE FUNCTION public.handle_claim_tag_insert()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public AS $$
DECLARE
  v_count        integer;
  v_claim_status text;
BEGIN
  SELECT claim_status, claim_tag_count
  INTO   v_claim_status, v_count
  FROM   public.results
  WHERE  id = NEW.result_id
  FOR UPDATE;

  IF v_claim_status NOT IN ('unclaimed', 'unlinked') THEN
    RAISE EXCEPTION '只能標記未認領的成績（claim_status 必須為 unclaimed 或 unlinked）';
  END IF;

  IF v_count >= 5 THEN
    RAISE EXCEPTION '此成績已達標記上限（5 人），不再接受新標記';
  END IF;

  UPDATE public.results
  SET    claim_tag_count = claim_tag_count + 1
  WHERE  id = NEW.result_id;

  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER claim_tags_on_insert
  BEFORE INSERT ON public.claim_tags
  FOR EACH ROW EXECUTE FUNCTION public.handle_claim_tag_insert();

CREATE OR REPLACE FUNCTION public.handle_claim_tag_delete()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public AS $$
BEGIN
  UPDATE public.results
  SET    claim_tag_count = GREATEST(0, claim_tag_count - 1)
  WHERE  id = OLD.result_id;
  RETURN OLD;
END;
$$;

CREATE OR REPLACE TRIGGER claim_tags_on_delete
  AFTER DELETE ON public.claim_tags
  FOR EACH ROW EXECUTE FUNCTION public.handle_claim_tag_delete();

ALTER TABLE public.claim_tags ENABLE ROW LEVEL SECURITY;

-- 注意：claim_tags RLS policies 在 009_helpers.sql 建立
