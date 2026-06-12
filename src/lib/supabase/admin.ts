import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

// Service Role client — 僅限 server-side 使用，絕對不可暴露到前端
// 繞過 RLS，擁有完整資料庫權限
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!
  if (!key) throw new Error('SUPABASE_SERVICE_ROLE_KEY is not set')
  return createClient<Database>(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}
