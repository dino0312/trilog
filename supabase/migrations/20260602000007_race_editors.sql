-- ============================================================
-- Tri·log Migration 007 — RACE_EDITOR 賽事編輯權限
-- ============================================================
-- 賽事方（選配角色）管理該賽事的官方資訊
-- 由建立者 / admin 授予特定選手對某賽事的編輯權

CREATE TABLE public.race_editors (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),

  -- 被授權的賽事
  race_id     uuid        NOT NULL REFERENCES public.races(id) ON DELETE CASCADE,

  -- 被授權的選手（通常是助手或賽事方代表）
  athlete_id  uuid        NOT NULL REFERENCES public.athletes(id) ON DELETE CASCADE,

  -- 角色
  -- editor    = 可編輯賽事資料（助手角色）
  -- organizer = 賽事方官方代表，可加入官方認證標章
  role        text        NOT NULL DEFAULT 'editor'
                          CHECK (role IN ('editor', 'organizer')),

  -- 授權人（誰給予此權限）
  granted_by  uuid        REFERENCES public.athletes(id) ON DELETE SET NULL,

  created_at  timestamptz NOT NULL DEFAULT now(),

  -- 同一選手對同一賽事只有一筆編輯權記錄
  UNIQUE (race_id, athlete_id)
);

COMMENT ON TABLE  public.race_editors            IS '賽事編輯權限表，由 admin/assistant 授予';
COMMENT ON COLUMN public.race_editors.role       IS 'editor（助手）/ organizer（賽事方官方代表）';
COMMENT ON COLUMN public.race_editors.granted_by IS '授權人帳號';

-- ── Row Level Security ────────────────────────────────────────
ALTER TABLE public.race_editors ENABLE ROW LEVEL SECURITY;

-- 公開讀取（讓任何人看到哪些人是賽事編輯）
CREATE POLICY "race_editors_public_read"
  ON public.race_editors FOR SELECT
  USING (true);

-- 只有助手以上可授予編輯權
CREATE POLICY "race_editors_assistant_insert"
  ON public.race_editors FOR INSERT
  WITH CHECK (public.is_assistant_or_above());

-- 只有 admin 可修改或刪除編輯權
CREATE POLICY "race_editors_admin_update"
  ON public.race_editors FOR UPDATE
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "race_editors_admin_delete"
  ON public.race_editors FOR DELETE
  USING (public.is_admin());
