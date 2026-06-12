-- Admin 軟刪除函式（SECURITY DEFINER 繞過 RLS，內部自行驗證 admin 權限）
CREATE OR REPLACE FUNCTION public.admin_soft_delete_athlete(target_id uuid)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public AS $$
BEGIN
  -- 確認呼叫者是 admin
  IF NOT EXISTS (
    SELECT 1 FROM public.athletes
    WHERE id = auth.uid()
      AND role = 'admin'
      AND deleted_at IS NULL
  ) THEN
    RAISE EXCEPTION 'permission denied: admin required';
  END IF;

  -- 不能刪除自己
  IF target_id = auth.uid() THEN
    RAISE EXCEPTION 'cannot delete own account';
  END IF;

  UPDATE public.athletes
  SET deleted_at = now()
  WHERE id = target_id;
END;
$$;

-- 只允許已認證用戶呼叫
REVOKE ALL ON FUNCTION public.admin_soft_delete_athlete(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_soft_delete_athlete(uuid) TO authenticated;
