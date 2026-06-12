-- 修復：athletes_admin_update 的 inline 自我參照子查詢造成 deadlock
-- athletes policy 中的 EXISTS(SELECT FROM athletes) 在 INSERT 時產生鎖死，導致 signup 504
-- 改回使用 SECURITY DEFINER 函式（is_admin），其內部查詢繞過 RLS，不產生遞迴鎖

DROP POLICY IF EXISTS "athletes_admin_update" ON public.athletes;

CREATE POLICY "athletes_admin_update"
  ON public.athletes FOR UPDATE
  USING (public.is_admin())
  WITH CHECK (public.is_admin());
