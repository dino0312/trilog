-- ============================================================
-- Tri·log Migration 002 — ATHLETE 選手帳號
-- ============================================================

CREATE TABLE IF NOT EXISTS public.athletes (
  id              uuid        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email           text        NOT NULL,
  nickname        text        CHECK (nickname IS NULL OR length(trim(nickname)) > 0),
  gender          text        CHECK (gender IN ('M', 'F')),
  birth_year      integer     CHECK (birth_year IS NULL OR (birth_year >= 1900 AND birth_year <= 2100)),
  nationality     text,
  bio             text,
  avatar_url      text,
  is_minor        boolean     NOT NULL DEFAULT false,
  role            text        NOT NULL DEFAULT 'athlete'
                              CHECK (role IN ('athlete', 'assistant', 'admin')),
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  deleted_at      timestamptz
);

COMMENT ON TABLE  public.athletes                IS '選手帳號與個人資料，id 與 auth.users 一對一對應';
COMMENT ON COLUMN public.athletes.nickname       IS '排行榜顯示名稱，null 表示匿名，不納入排行榜（spec 21.2）';
COMMENT ON COLUMN public.athletes.is_minor       IS '未成年標記，依 birth_year 計算；驅動新成績的隱私預設';
COMMENT ON COLUMN public.athletes.role           IS 'athlete（一般選手）/ assistant（認證助手）/ admin（管理員）';
COMMENT ON COLUMN public.athletes.deleted_at     IS '軟刪除時間，非 null 表示已申請刪除帳號，1 個月後排程清除';

CREATE OR REPLACE TRIGGER athletes_set_updated_at
  BEFORE UPDATE ON public.athletes
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ── 新用戶註冊自動建立 athlete 列 ─────────────────────────────
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public AS $$
DECLARE
  v_birth_year integer;
  v_is_minor   boolean;
BEGIN
  v_birth_year := (NEW.raw_user_meta_data->>'birth_year')::integer;
  v_is_minor   := v_birth_year IS NOT NULL
                  AND (EXTRACT(YEAR FROM now()) - v_birth_year) < 18;

  INSERT INTO public.athletes (id, email, is_minor)
  VALUES (NEW.id, NEW.email, COALESCE(v_is_minor, false))
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ── Row Level Security ────────────────────────────────────────
ALTER TABLE public.athletes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "athletes_public_read"    ON public.athletes;
DROP POLICY IF EXISTS "athletes_self_read_own"  ON public.athletes;
DROP POLICY IF EXISTS "athletes_self_update"    ON public.athletes;

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

-- 注意：athletes_admin_update policy 在 009_helpers.sql 建立（is_admin() 依賴 athletes table，須後置）
