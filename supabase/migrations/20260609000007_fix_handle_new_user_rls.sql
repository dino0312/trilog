-- 修復：handle_new_user trigger 在 Supabase 新版需明確設定 row_security = off
-- 否則即使 SECURITY DEFINER 也可能被 RLS 擋住，導致 signup 504 timeout

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
SET row_security = off
AS $$
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
