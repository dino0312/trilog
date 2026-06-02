-- ============================================================
-- Tri·log Migration 001 — Helper Functions & Triggers
-- ============================================================
-- 共用工具函式，供後續 migration 使用

-- ── updated_at 自動更新 trigger ──────────────────────────────
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- ── 取得目前登入者的角色 ──────────────────────────────────────
-- SECURITY DEFINER 讓 RLS policy 可安全查詢 athletes 表
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS TEXT
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public AS $$
  SELECT role
  FROM public.athletes
  WHERE id = auth.uid()
    AND deleted_at IS NULL;
$$;

-- ── 判斷目前登入者是否為 assistant 以上 ─────────────────────
CREATE OR REPLACE FUNCTION public.is_assistant_or_above()
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public AS $$
  SELECT COALESCE(
    (SELECT role IN ('assistant', 'admin')
     FROM public.athletes
     WHERE id = auth.uid() AND deleted_at IS NULL),
    false
  );
$$;

-- ── 判斷目前登入者是否為 admin ────────────────────────────────
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public AS $$
  SELECT COALESCE(
    (SELECT role = 'admin'
     FROM public.athletes
     WHERE id = auth.uid() AND deleted_at IS NULL),
    false
  );
$$;

-- ── 判斷目前登入者是否為特定賽事的 editor ────────────────────
CREATE OR REPLACE FUNCTION public.is_race_editor(p_race_id uuid)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.race_editors
    WHERE race_id = p_race_id
      AND athlete_id = auth.uid()
  ) OR public.is_assistant_or_above();
$$;
