import { createClient } from '@/lib/supabase/server'
import { GlobalVerifyBannerClient } from './GlobalVerifyBannerClient'

export async function GlobalVerifyBanner() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // 只在已登入、但 email 尚未驗證時顯示
  if (!user || user.email_confirmed_at) return null

  return <GlobalVerifyBannerClient email={user.email ?? ''} />
}
