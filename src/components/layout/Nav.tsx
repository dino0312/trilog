import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { AdminDropdown } from './AdminDropdown'
import { NavAuthButtons } from './NavAuthButtons'
import { TrilogLogo } from '@/components/ui/TrilogLogo'

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
    <header className="sticky top-0 z-50 border-b border-border bg-bg/90 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
        {/* Logo */}
        <Link href="/leaderboard" aria-label="Tri·log 首頁">
          <TrilogLogo size="sm" context="nav" />
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
                className="ml-2 flex items-center gap-1.5 rounded-lg border border-[#FF6B3D] bg-[rgba(255,107,61,0.08)] px-3 py-1.5 text-sm font-medium text-[#FF6B3D] transition hover:bg-[#FF6B3D] hover:text-white">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <line x1="12" y1="5" x2="12" y2="19"/>
                  <line x1="5"  y1="12" x2="19" y2="12"/>
                </svg>
                新增成績
              </Link>
              <Link href="/profile"
                className="ml-1 flex h-8 w-8 items-center justify-center rounded-full bg-bg-elev text-sm font-bold text-ink hover:bg-border-strong transition"
                title="個人資料">
                {user.email?.[0].toUpperCase()}
              </Link>
            </>
          ) : (
            /* Client Component：登入 Modal + 新增成績 Modal */
            <NavAuthButtons />
          )}
        </nav>
      </div>
    </header>
  )
}
