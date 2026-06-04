import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { signOut } from '@/app/actions/auth'
import { AdminDropdown } from './AdminDropdown'

const NAV_LINKS = [
  { href: '/leaderboard', label: '最速榜' },
  { href: '/rankings',    label: '排行榜' },
  { href: '/relay',       label: '接力榜' },
  { href: '/unclaimed',   label: '未認領' },
]

export async function Nav() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: isAssistant } = user
    ? await supabase.rpc('is_assistant_or_above')
    : { data: false }

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-bg/80 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
        {/* Logo */}
        <Link href="/leaderboard" className="flex items-center gap-2 font-bold text-ink hover:text-accent transition">
          <span className="text-accent font-mono text-lg">▲</span>
          Tri·log
        </Link>

        {/* 主選單 */}
        <nav className="flex items-center gap-1">
          {NAV_LINKS.map(({ href, label }) => (
            <Link
              key={href} href={href}
              className="rounded-lg px-3 py-1.5 text-sm text-ink-3 hover:text-ink hover:bg-bg-elev transition"
            >
              {label}
            </Link>
          ))}

          {user ? (
            <>
              {isAssistant && <AdminDropdown />}
              <Link href="/records"
                className="rounded-lg px-3 py-1.5 text-sm text-ink-3 hover:text-ink hover:bg-bg-elev transition">
                我的紀錄
              </Link>
              <Link href="/records/new"
                className="ml-1 rounded-lg bg-accent px-3 py-1.5 text-sm font-semibold text-accent-ink hover:brightness-110 transition">
                + 新增
              </Link>
              <Link href="/profile"
                className="ml-1 flex h-8 w-8 items-center justify-center rounded-full bg-bg-elev text-sm font-bold text-ink hover:bg-border-strong transition"
                title="個人資料">
                {user.email?.[0].toUpperCase()}
              </Link>
            </>
          ) : (
            <>
              <Link href="/login"
                className="rounded-lg px-3 py-1.5 text-sm text-ink-3 hover:text-ink hover:bg-bg-elev transition">
                登入
              </Link>
              <Link href="/register"
                className="ml-1 rounded-lg bg-accent px-3 py-1.5 text-sm font-semibold text-accent-ink hover:brightness-110 transition">
                註冊
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  )
}
