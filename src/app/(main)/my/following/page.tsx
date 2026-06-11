import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { FollowingClient } from './FollowingClient'

export const metadata: Metadata = { title: '關注名單 · Tri·log' }

export default async function FollowingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login?redirectTo=/my/following')

  // 使用 details API（直接 DB query，不走 fetch）
  const { data: follows } = await supabase
    .from('athlete_follows')
    .select('following_id, created_at')
    .eq('follower_id', user.id)
    .order('created_at', { ascending: false })

  const ids = (follows ?? []).map(f => f.following_id)

  let athletes: Record<string, { name: string | null; nickname: string | null; nationality: string | null; avatar_url: string | null }> = {}
  let bests: Record<string, { full: number | null; '70.3': number | null; olympic: number | null; sprint: number | null }> = {}

  if (ids.length > 0) {
    const [{ data: athleteRows }, { data: resultRows }] = await Promise.all([
      supabase.from('athletes').select('id, name, nickname, nationality, avatar_url').in('id', ids),
      supabase
        .from('results')
        .select('athlete_id, total_seconds, race_editions ( distance_category )')
        .in('athlete_id', ids)
        .eq('is_public', true)
        .in('claim_status', ['claimed', 'unclaimed'])
        .eq('result_type', 'solo')
        .order('total_seconds', { ascending: true }),
    ])

    athletes = Object.fromEntries((athleteRows ?? []).map(a => [a.id, a]))

    for (const id of ids) {
      bests[id] = { full: null, '70.3': null, olympic: null, sprint: null }
    }
    for (const r of resultRows ?? []) {
      if (!r.athlete_id) continue
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const dist = (r.race_editions as any)?.distance_category as string | undefined
      if (!dist || !(dist in bests[r.athlete_id])) continue
      const cur = bests[r.athlete_id][dist as keyof typeof bests[string]]
      if (cur === null || r.total_seconds < cur) {
        bests[r.athlete_id][dist as keyof typeof bests[string]] = r.total_seconds
      }
    }
  }

  const athleteList = (follows ?? []).map(f => ({
    athlete_id:  f.following_id,
    followed_at: f.created_at,
    name:        athletes[f.following_id]?.name ?? null,
    nickname:    athletes[f.following_id]?.nickname ?? null,
    nationality: athletes[f.following_id]?.nationality ?? null,
    avatar_url:  athletes[f.following_id]?.avatar_url ?? null,
    bests:       bests[f.following_id] ?? { full: null, '70.3': null, olympic: null, sprint: null },
  }))

  return (
    <main className="flex-1 p-6 max-w-4xl mx-auto w-full">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-ink">關注名單</h1>
        <p className="mt-0.5 text-sm text-ink-3">
          你關注的選手 · 查看他們的最佳成績
          {athleteList.length > 0 && (
            <span className="ml-2 text-ink-4">（{athleteList.length} 位）</span>
          )}
        </p>
      </div>

      <FollowingClient athletes={athleteList} isLoggedIn={true} />
    </main>
  )
}
