import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { TrilogLogo } from '@/components/ui/TrilogLogo'
import { NavLinks } from './NavLinks'
import { NavAuthButtons } from './NavAuthButtons'
import { AvatarDropdown } from './AvatarDropdown'
import { AddDropdown } from './AddDropdown'
import { PageContextStrip } from './PageContextStrip'

export async function Nav() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let athleteName: string | null = null
  let isAssistant = false

  let followingCount = 0
  let contributionBadge = 0
  let athleteAvatarUrl: string | null = null

  if (user) {
    const [{ data: athlete }, { data: assistant }, { count: fCount }, { count: cCount }] = await Promise.all([
      supabase.from('athletes').select('nickname, name, avatar_url').eq('id', user.id).single(),
      supabase.rpc('is_assistant_or_above'),
      supabase.from('athlete_follows').select('*', { count: 'exact', head: true }).eq('follower_id', user.id),
      supabase.from('results').select('*', { count: 'exact', head: true })
        .eq('created_by', user.id).eq('claim_status', 'unclaimed').neq('athlete_id', user.id),
    ])
    athleteName        = athlete?.nickname ?? athlete?.name ?? null
    athleteAvatarUrl   = athlete?.avatar_url ?? null
    isAssistant        = assistant ?? false
    followingCount     = fCount ?? 0
    contributionBadge  = cCount ?? 0
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
            <NavLinks isLoggedIn={!!user} />
          </nav>

          {/* 右側：新增成績 + Avatar / 登入 */}
          <div className="ml-auto flex items-center gap-1">
            {user ? (
              <>
                {/* 新增下拉選單 */}
                <AddDropdown isAssistant={isAssistant} />

                {/* Avatar 下拉選單 */}
                <AvatarDropdown
                  email={user.email!}
                  name={athleteName}
                  avatarUrl={athleteAvatarUrl}
                  userId={user.id}
                  isAssistant={isAssistant}
                  followingCount={followingCount}
                  contributionBadge={contributionBadge}
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
