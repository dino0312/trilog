-- Migration: athlete_follows 表
-- 追蹤功能，不做快取計數欄位（follower_count/following_count 改為即時 COUNT）

CREATE TABLE public.athlete_follows (
  follower_id  uuid NOT NULL REFERENCES public.athletes(id) ON DELETE CASCADE,
  following_id uuid NOT NULL REFERENCES public.athletes(id) ON DELETE CASCADE,
  created_at   timestamptz NOT NULL DEFAULT now(),

  PRIMARY KEY (follower_id, following_id),
  CONSTRAINT no_self_follow CHECK (follower_id <> following_id)
);

-- Index for reverse lookup（被追蹤者查詢追蹤者數）
CREATE INDEX idx_athlete_follows_following ON public.athlete_follows (following_id);

-- RLS
ALTER TABLE public.athlete_follows ENABLE ROW LEVEL SECURITY;

-- 所有人可讀（供 follower_count 即時 COUNT 用）
CREATE POLICY "anyone can read follows"
  ON public.athlete_follows FOR SELECT
  USING (true);

-- 已登入可追蹤（只能追蹤別人）
CREATE POLICY "authenticated can follow"
  ON public.athlete_follows FOR INSERT TO authenticated
  WITH CHECK (follower_id = auth.uid());

-- 只能取消自己的追蹤
CREATE POLICY "authenticated can unfollow"
  ON public.athlete_follows FOR DELETE TO authenticated
  USING (follower_id = auth.uid());
