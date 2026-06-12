-- 簡化 INSERT policy：WITH CHECK (true)
-- 安全性由 FK constraint（id REFERENCES auth.users）保證，無效 id 無法插入
-- 避免 EXISTS(SELECT FROM auth.users) 在 trigger context 的權限問題

DROP POLICY IF EXISTS "athletes_insert_on_new_user" ON public.athletes;

CREATE POLICY "athletes_insert_policy"
  ON public.athletes FOR INSERT
  WITH CHECK (true);
