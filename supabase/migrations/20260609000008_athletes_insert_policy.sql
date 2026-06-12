-- 修復：athletes 表缺少 INSERT policy
-- Supabase 新版 postgres 角色不再有 BYPASSRLS，handle_new_user trigger 被 RLS 擋住導致 signup 504
-- 允許 insert 當 id 對應到 auth.users 中存在的用戶（trigger 觸發時 auth.users 已建立）

CREATE POLICY "athletes_insert_on_new_user"
  ON public.athletes FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM auth.users WHERE id = athletes.id)
  );
