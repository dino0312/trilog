-- ============================================================
-- Tri·log Migration 007 — RACE_EDITOR 賽事編輯權限
-- ============================================================

CREATE TABLE IF NOT EXISTS public.race_editors (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  race_id     uuid        NOT NULL REFERENCES public.races(id) ON DELETE CASCADE,
  athlete_id  uuid        NOT NULL REFERENCES public.athletes(id) ON DELETE CASCADE,
  role        text        NOT NULL DEFAULT 'editor'
                          CHECK (role IN ('editor', 'organizer')),
  granted_by  uuid        REFERENCES public.athletes(id) ON DELETE SET NULL,
  created_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (race_id, athlete_id)
);

COMMENT ON TABLE  public.race_editors            IS '賽事編輯權限表，由 admin/assistant 授予';
COMMENT ON COLUMN public.race_editors.role       IS 'editor（助手）/ organizer（賽事方官方代表）';
COMMENT ON COLUMN public.race_editors.granted_by IS '授權人帳號';

ALTER TABLE public.race_editors ENABLE ROW LEVEL SECURITY;

-- 注意：race_editors RLS policies 在 009_helpers.sql 建立
