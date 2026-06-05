import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { TrilogLogo } from '@/components/ui/TrilogLogo'
import { NavLinks } from './NavLinks'
import { NavAuthButtons } from './NavAuthButtons'
import { AvatarDropdown } from './AvatarDropdown'
import { PageContextStrip } from './PageContextStrip'

export async function Nav() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let athleteName: string | null = null
  let isAssistant = false

  if (user) {
    const [{ data: athlete }, { data: assistant }] = await Promise.all([
      supabase.from('athletes').select('nickname').eq('id', user.id).single(),
      supabase.rpc('is_assistant_or_above'),
    ])
    athleteName = athlete?.nickname ?? null
    isAssistant = assistant ?? false
  }

  return (
    <>
      <header className="sticky top-0 z-50 bg-bg/90 backdrop-blur-md"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
        <div className="mx-auto flex h-14 max-w-5xl items-center px-4">
          {/* Logo */}
          <Link href="/leaderboard" aria-label="Tri·log 首頁" className="mr-4 flex-shrink-0">
            <TrilogLogo size="sm" context="nav" />
          </Link>

          {/* 主選單連結（含 active state）*/}
          <nav className="flex h-14 items-center">
            <NavLinks />
          </nav>

          {/* 右側：新增成績 + Avatar / 登入 */}
          <div className="ml-auto flex items-center gap-1">
            {user ? (
              <>
                {/* 新增成績 */}
                <Link
                  href="/records/new"
                  className="flex items-center gap-1.5 rounded-lg border border-[#FF6B3D] bg-[rgba(255,107,61,0.08)] px-3 py-1.5 text-sm font-medium text-[#FF6B3D] transition hover:bg-[#FF6B3D] hover:text-white"
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <line x1="12" y1="5" x2="12" y2="19"/>
                    <line x1="5"  y1="12" x2="19" y2="12"/>
                  </svg>
                  新增成績
                </Link>

                {/* Avatar 下拉選單 */}
                <AvatarDropdown
                  email={user.email!}
                  name={athleteName}
                  isAssistant={isAssistant}
                />
              </>
            ) : (
              <NavAuthButtons />
            )}
          </div>
        </div>

        {/* 頁面標題條帶 */}
        <PageContextStrip />
      </header>
    </>
  )
}
