-- 修復：athletes_admin_update policy 因 migration 009 中途失敗而遺失
-- helpers.sql 在 DROP athletes_admin_update 後嘗試重建已存在的其他 policy，
-- 導致 transaction 中斷，athletes_admin_update 被刪除但未重建。

DROP POLICY IF EXISTS "athletes_admin_update" ON public.athletes;

CREATE POLICY "athletes_admin_update"
  ON public.athletes FOR UPDATE
  USING (public.is_admin())
  WITH CHECK (public.is_admin());
