-- ============================================================
-- Tri·log Migration 005 — CLAIM_TAG 知情人標記
-- ============================================================
-- 功能：登入用戶可對未認領成績標記「我已通知本人」
-- 規格（spec 15.2）：
--   - 同一用戶對同一筆成績只能標記一次（UNIQUE constraint）
--   - 同一成績達 5 人標記後鎖定
--   - 標記後 result.claim_tag_count 自動更新（trigger）

CREATE TABLE public.claim_tags (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),

  -- 被標記的成績（只能標記未認領的成績）
  result_id   uuid        NOT NULL REFERENCES public.results(id) ON DELETE CASCADE,

  -- 標記人帳號
  tagged_by   uuid        NOT NULL REFERENCES public.athletes(id) ON DELETE CASCADE,

  -- 知情人留言（選填，上限 100 字元）
  message     text        CHECK (message IS NULL OR length(message) <= 100),

  created_at  timestamptz NOT NULL DEFAULT now(),

  -- 同一人對同一成績只能標記一次
  UNIQUE (result_id, tagged_by)
);

COMMENT ON TABLE  public.claim_tags           IS '知情人標記「我已通知本人」的記錄';
COMMENT ON COLUMN public.claim_tags.result_id IS '只能標記 claim_status = unclaimed 的成績';
COMMENT ON COLUMN public.claim_tags.tagged_by IS '標記人帳號，需登入';
COMMENT ON COLUMN public.claim_tags.message   IS '知情人留言，上限 100 字元（spec 15.2）';

-- ── trigger：新增標記時驗證上限並更新 claim_tag_count ─────────
CREATE OR REPLACE FUNCTION public.handle_claim_tag_insert()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public AS $$
DECLARE
  v_count       integer;
  v_claim_status text;
BEGIN
  -- 取得目前該成績的狀態與標記數
  SELECT claim_status, claim_tag_count
  INTO   v_claim_status, v_count
  FROM   public.results
  WHERE  id = NEW.result_id
  FOR UPDATE;  -- 鎖定列，避免 race condition

  -- 只能標記未認領的成績
  IF v_claim_status NOT IN ('unclaimed', 'unlinked') THEN
    RAISE EXCEPTION '只能標記未認領的成績（claim_status 必須為 unclaimed 或 unlinked）';
  END IF;

  -- 達 5 人標記後鎖定
  IF v_count >= 5 THEN
    RAISE EXCEPTION '此成績已達標記上限（5 人），不再接受新標記';
  END IF;

  -- 更新快取計數
  UPDATE public.results
  SET    claim_tag_count = claim_tag_count + 1
  WHERE  id = NEW.result_id;

  RETURN NEW;
END;
$$;

CREATE TRIGGER claim_tags_on_insert
  BEFORE INSERT ON public.claim_tags
  FOR EACH ROW EXECUTE FUNCTION public.handle_claim_tag_insert();

-- ── trigger：刪除標記時更新 claim_tag_count ───────────────────
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

CREATE TRIGGER claim_tags_on_delete
  AFTER DELETE ON public.claim_tags
  FOR EACH ROW EXECUTE FUNCTION public.handle_claim_tag_delete();

-- ── Row Level Security ────────────────────────────────────────
ALTER TABLE public.claim_tags ENABLE ROW LEVEL SECURITY;

-- 公開讀取：任何人可查看標記列表（排行榜顯示標記數 + 知情人）
CREATE POLICY "claim_tags_public_read"
  ON public.claim_tags FOR SELECT
  USING (true);

-- 登入用戶可新增標記（trigger 會驗證業務規則）
CREATE POLICY "claim_tags_athlete_insert"
  ON public.claim_tags FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND tagged_by = auth.uid()
  );

-- 本人可刪除自己的標記（撤銷）
CREATE POLICY "claim_tags_athlete_delete_own"
  ON public.claim_tags FOR DELETE
  USING (tagged_by = auth.uid());

-- Admin 可刪除任何標記
CREATE POLICY "claim_tags_admin_delete"
  ON public.claim_tags FOR DELETE
  USING (public.is_admin());
