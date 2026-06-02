-- ============================================================
-- Tri·log Migration 002 — ATHLETE 選手帳號
-- ============================================================

CREATE TABLE public.athletes (
  -- 主鍵與 auth 對應
  id              uuid        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,

  -- 登入資訊（從 auth.users 同步，不直接修改）
  email           text        NOT NULL,

  -- 公開 Profile
  nickname        text        CHECK (nickname IS NULL OR length(trim(nickname)) > 0),
  gender          text        CHECK (gender IN ('M', 'F')),
  birth_year      integer     CHECK (birth_year IS NULL OR (birth_year >= 1900 AND birth_year <= 2100)),
  nationality     text,                    -- ISO 3166-1 alpha-3，如 'TWN'
  bio             text,
  avatar_url      text,

  -- 自動計算：未成年驅動隱私預設（依出生年份，每年重算）
  -- 由應用層或排程更新；新帳號建立時由 handle_new_user trigger 設定
  is_minor        boolean     NOT NULL DEFAULT false,

  -- 權限角色
  role            text        NOT NULL DEFAULT 'athlete'
                              CHECK (role IN ('athlete', 'assistant', 'admin')),

  -- 時間戳
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),

  -- 軟刪除（1 個月後永久清除，由排程觸發）
  deleted_at      timestamptz
);

COMMENT ON TABLE  public.athletes                IS '選手帳號與個人資料，id 與 auth.users 一對一對應';
COMMENT ON COLUMN public.athletes.nickname       IS '排行榜顯示名稱，null 表示匿名，不納入排行榜（spec 21.2）';
COMMENT ON COLUMN public.athletes.is_minor       IS '未成年標記，依 birth_year 計算；驅動新成績的隱私預設';
COMMENT ON COLUMN public.athletes.role           IS 'athlete（一般選手）/ assistant（認證助手）/ admin（管理員）';
COMMENT ON COLUMN public.athletes.deleted_at     IS '軟刪除時間，非 null 表示已申請刪除帳號，1 個月後排程清除';

-- updated_at 自動更新
CREATE TRIGGER athletes_set_updated_at
  BEFORE UPDATE ON public.athletes
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ── 新用戶註冊自動建立 athlete 列 ─────────────────────────────
-- 此函式以 SECURITY DEFINER 執行，繞過 RLS，由 auth.users 觸發
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public AS $$
DECLARE
  v_birth_year integer;
  v_is_minor   boolean;
BEGIN
  -- 嘗試從 raw_user_meta_data 取得 birth_year（Google/Apple OAuth 可能有值）
  v_birth_year := (NEW.raw_user_meta_data->>'birth_year')::integer;
  v_is_minor   := v_birth_year IS NOT NULL
                  AND (EXTRACT(YEAR FROM now()) - v_birth_year) < 18;

  INSERT INTO public.athletes (id, email, is_minor)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(v_is_minor, false)
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ── Row Level Security ────────────────────────────────────────
ALTER TABLE public.athletes ENABLE ROW LEVEL SECURITY;

-- 公開讀取：任何人可查看非刪除選手的公開資料
CREATE POLICY "athletes_public_read"
  ON public.athletes FOR SELECT
  USING (deleted_at IS NULL);

-- 本人可讀取自己的完整資料（含 deleted 緩衝期）
CREATE POLICY "athletes_self_read_own"
  ON public.athletes FOR SELECT
  USING (id = auth.uid());

-- 本人更新自己的 Profile（不允許修改 role、id、email、deleted_at）
CREATE POLICY "athletes_self_update"
  ON public.athletes FOR UPDATE
  USING (id = auth.uid())
  WITH CHECK (
    id = auth.uid()
    -- role 欄位不可自行升級（由 admin 操作）
  );

-- Admin 可更新任何選手（包含修改 role、軟刪除等）
CREATE POLICY "athletes_admin_update"
  ON public.athletes FOR UPDATE
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- 不允許任何人直接 INSERT（由 handle_new_user trigger SECURITY DEFINER 處理）
-- 不允許任何人直接 DELETE（只做軟刪除）
