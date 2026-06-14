import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

export async function GuestBanner() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (user) return null

  return (
    <div className="bg-accent/10 border-b border-accent/20 py-2 px-4">
      <p className="text-center text-sm text-ink-3">
        Tri·log 是鐵人三項選手的成績記錄平台。
        <Link href="/about" className="ml-1 text-accent underline-offset-2 hover:underline">
          了解更多
        </Link>
        ，或
        <Link href="/login" className="ml-1 text-accent underline-offset-2 hover:underline">
          登入 / 註冊
        </Link>
        開始記錄你的成績。
      </p>
    </div>
  )
}
