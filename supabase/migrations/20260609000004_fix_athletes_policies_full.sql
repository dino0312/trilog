-- 完整修復：重建 helper functions + athletes 所有 RLS policies
-- 原因：migration 009 (helpers.sql) 因重複建立已存在的 policy 而失敗，
-- 造成 functions 和 policies 可能未能建立或部分遺失。

-- ── 重建 helper functions ──────────────────────────────────────

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

-- ── 重建 athletes 所有 RLS policies ───────────────────────────

DROP POLICY IF EXISTS "athletes_public_read"   ON public.athletes;
DROP POLICY IF EXISTS "athletes_self_read_own" ON public.athletes;
DROP POLICY IF EXISTS "athletes_self_update"   ON public.athletes;
DROP POLICY IF EXISTS "athletes_admin_update"  ON public.athletes;

CREATE POLICY "athletes_public_read"
  ON public.athletes FOR SELECT
  USING (deleted_at IS NULL);

CREATE POLICY "athletes_self_read_own"
  ON public.athletes FOR SELECT
  USING (id = auth.uid());

CREATE POLICY "athletes_self_update"
  ON public.athletes FOR UPDATE
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

CREATE POLICY "athletes_admin_update"
  ON public.athletes FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.athletes
      WHERE id = auth.uid()
        AND role = 'admin'
        AND deleted_at IS NULL
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.athletes
      WHERE id = auth.uid()
        AND role = 'admin'
        AND deleted_at IS NULL
    )
  );
