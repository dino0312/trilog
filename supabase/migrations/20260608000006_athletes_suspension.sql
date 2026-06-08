-- Migration 000006: 新增會員停權欄位
-- features.md §2.6 會員名單

ALTER TABLE public.athletes
  ADD COLUMN IF NOT EXISTS suspended_at   timestamptz,
  ADD COLUMN IF NOT EXISTS suspended_by   uuid REFERENCES public.athletes(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS suspend_reason text;

COMMENT ON COLUMN public.athletes.suspended_at   IS '停權時間（null = 正常）';
COMMENT ON COLUMN public.athletes.suspended_by   IS '執行停權的管理員 athlete.id';
COMMENT ON COLUMN public.athletes.suspend_reason IS '停權原因（選填）';
