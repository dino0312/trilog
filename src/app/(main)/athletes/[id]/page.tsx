import type { Metadata } from 'next'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { secondsToTime } from '@/lib/utils/time'
import { FollowButton } from '@/components/athletes/FollowButton'

type Props = { params: Promise<{ id: string }> }

const DIST_LABEL: Record<string, string> = {
  full: '226', '70.3': '113', olympic: '51.5', sprint: 'Sprint',
}
const DIST_ORDER = ['full', '70.3', 'olympic', 'sprint']
const DIST_SUMMARY = ['full', '70.3', 'olympic'] // 摘要只顯示 226 / 113 / 51.5

const CREDIBILITY_LABEL: Record<string, string> = {
  official: '官方成績', self_reported: '自填',
}

const GENDER_LABEL: Record<string, string> = {
  male: '男子', female: '女子', mixed: '混合',
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const supabase = await createClient()
  const { data } = await supabase
    .from('athletes')
    .select('name, nickname')
    .eq('id', id)
    .single()
  const displayName = data?.nickname ?? data?.name ?? '選手'
  return { title: `${displayName} · Tri·log` }
}

export default async function AthletePublicPage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: athlete } = await supabase
    .from('athletes')
    .select('id, name, nickname, nationality, bio, avatar_url, created_at, suspended_at, deleted_at')
    .eq('id', id)
    .single()

  if (!athlete) {
    return (
      <main className="flex-1 p-6 max-w-2xl mx-auto w-full">
        <p className="text-ink-3">找不到此選手。</p>
      </main>
    )
  }

  if (athlete.deleted_at || athlete.suspended_at) {
    return (
      <main className="flex-1 p-6 max-w-2xl mx-auto w-full">
        <div className="rounded-xl border border-border bg-bg-card p-10 text-center">
          <p className="text-lg font-semibold text-ink-3">此帳號已停用</p>
        </div>
      </main>
    )
  }

  const isSelf = user?.id === id

  // 追蹤數 + is_following（並行）
  const [{ count: followerCount }, { data: followRow }] = await Promise.all([
    supabase
      .from('athlete_follows')
      .select('*', { count: 'exact', head: true })
      .eq('following_id', id),
    user && !isSelf
      ? supabase
          .from('athlete_follows')
          .select('following_id')
          .eq('follower_id', user.id)
          .eq('following_id', id)
          .maybeSingle()
      : Promise.resolve({ data: null }),
  ])

  const isFollowing = !!followRow

  // 個人成績
  const resultsQuery = supabase
    .from('results')
    .select(`
      id, total_seconds, is_public, claim_status, source_credibility,
      race_editions (
        id, year, distance_category,
        races ( id, name, slug )
      )
    `)
    .eq('athlete_id', id)
    .eq('result_type', 'solo')
    .order('race_editions(year)', { ascending: false })
    .order('total_seconds', { ascending: true })

  const { data: rawResults } = isSelf
    ? await resultsQuery
    : await resultsQuery.eq('is_public', true)

  // bests
  type DistKey = 'full' | '70.3' | 'olympic' | 'sprint'
  const bests: Record<DistKey, number | null> = { full: null, '70.3': null, olympic: null, sprint: null }
  for (const r of rawResults ?? []) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const dist = (r.race_editions as any)?.distance_category as DistKey | undefined
    if (!dist || !(dist in bests)) continue
    if (bests[dist] === null || r.total_seconds < (bests[dist] as number)) {
      bests[dist] = r.total_seconds
    }
  }

  // 整理成績明細
  const results = (rawResults ?? []).map(r => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const edition = r.race_editions as any
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const race = edition?.races as any
    return {
      result_id:          r.id,
      total_seconds:      r.total_seconds,
      is_public:          r.is_public,
      claim_status:       r.claim_status,
      source_credibility: r.source_credibility,
      year:               edition?.year as number | null,
      distance_category:  edition?.distance_category as DistKey | null,
      race_name:          race?.name as string | null,
      race_slug:          race?.slug as string | null,
    }
  })

  // 接力成績
  const { data: rawRelay } = await supabase
    .from('team_members')
    .select(`
      id, disciplines, split_seconds, claim_status,
      teams (
        id, team_name, gender_category,
        results (
          id,
          race_editions (
            id, year, distance_category,
            races ( id, name, slug )
          )
        )
      )
    `)
    .eq('athlete_id', id)
    .order('created_at', { ascending: false })

  const relayResults = (rawRelay ?? []).map(m => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const team   = m.teams as any
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const res    = team?.results as any
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const edition = res?.race_editions as any
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const race   = edition?.races as any
    return {
      member_id:         m.id,
      team_id:           team?.id as string | null,
      team_name:         team?.team_name as string | null,
      gender_category:   team?.gender_category as string | null,
      disciplines:       m.disciplines as string[],
      split_seconds:     m.split_seconds as number | null,
      claim_status:      m.claim_status,
      year:              edition?.year as number | null,
      distance_category: edition?.distance_category as DistKey | null,
      race_name:         race?.name as string | null,
      race_slug:         race?.slug as string | null,
    }
  })

  const displayName = athlete.nickname ?? athlete.name ?? '選手'
  const initials = displayName.charAt(0)

  return (
    <main className="flex-1 p-6 max-w-2xl mx-auto w-full">

      {/* ① Hero */}
      <div className="rounded-xl border border-border bg-bg-card p-6 mb-6">
        <div className="flex items-start gap-4">
          {/* Avatar */}
          {athlete.avatar_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={athlete.avatar_url}
              alt={displayName}
              className="w-16 h-16 rounded-full object-cover flex-shrink-0"
            />
          ) : (
            <div className="w-16 h-16 rounded-full bg-accent/20 flex items-center justify-center flex-shrink-0">
              <span className="text-accent text-2xl font-bold">{initials}</span>
            </div>
          )}

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl font-bold text-ink">{displayName}</h1>
              {!isSelf && (
                <FollowButton
                  athleteId={id}
                  athleteName={displayName}
                  initialFollowing={isFollowing}
                  isLoggedIn={!!user}
                  size="lg"
                />
              )}
            </div>

            {/* 本名（有 nickname 才補） */}
            {athlete.nickname && athlete.name && (
              <p className="text-sm text-ink-3 mt-0.5">本名：{athlete.name}</p>
            )}

            <div className="flex items-center gap-3 mt-1 flex-wrap text-sm text-ink-3">
              {athlete.nationality && <span>{athlete.nationality}</span>}
              {(followerCount ?? 0) > 0 && (
                <span className="text-ink-4">{followerCount} 人追蹤</span>
              )}
            </div>

            {athlete.bio && (
              <p className="mt-2 text-sm text-ink-3 leading-relaxed">{athlete.bio}</p>
            )}
          </div>
        </div>
      </div>

      {/* ② 成績摘要 */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {DIST_SUMMARY.map(dist => (
          <div key={dist} className="rounded-xl border border-border bg-bg-card p-4 text-center">
            <p className="text-xs text-ink-4 mb-1">{DIST_LABEL[dist]}</p>
            <p className="font-mono text-sm font-medium text-ink tabular-nums">
              {bests[dist as DistKey] !== null
                ? secondsToTime(bests[dist as DistKey]!)
                : '—'}
            </p>
          </div>
        ))}
      </div>

      {/* ③ 成績明細 */}
      {results.length > 0 && (
        <div className="rounded-xl border border-border bg-bg-card mb-6 overflow-hidden">
          <div className="px-5 py-3 border-b border-border flex items-center justify-between">
            <h2 className="text-sm font-semibold text-ink">成績紀錄</h2>
            {isSelf && (
              <Link href="/records" className="text-xs text-accent hover:underline">
                管理我的成績 →
              </Link>
            )}
          </div>
          <div className="divide-y divide-border">
            {results.map(r => (
              <div key={r.result_id} className="px-5 py-3 flex items-center gap-3">
                {/* 年份 + 賽事 */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    {r.year && (
                      <span className="text-xs text-ink-4 font-mono">{r.year}</span>
                    )}
                    {r.race_slug && r.year ? (
                      <Link
                        href={`/races/${r.race_slug}/${r.year}`}
                        className="text-sm text-ink hover:text-accent truncate"
                      >
                        {r.race_name ?? '未知賽事'}
                      </Link>
                    ) : (
                      <span className="text-sm text-ink truncate">
                        {r.race_name ?? '未知賽事'}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                    {r.distance_category && (
                      <span className="text-xs px-1.5 py-0.5 rounded bg-bg-elev text-ink-4 font-mono">
                        {DIST_LABEL[r.distance_category] ?? r.distance_category}
                      </span>
                    )}
                    {r.claim_status === 'unclaimed' && (
                      <span className="text-xs px-1.5 py-0.5 rounded border border-border text-ink-4">
                        未認領
                      </span>
                    )}
                    {r.source_credibility === 'self_reported' && (
                      <span className="text-xs px-1.5 py-0.5 rounded border border-border text-ink-4">
                        自填
                      </span>
                    )}
                    {isSelf && !r.is_public && (
                      <span className="text-xs px-1.5 py-0.5 rounded border border-border text-ink-4">
                        私人
                      </span>
                    )}
                  </div>
                </div>

                {/* 時間：該距離最快用橘色標示 + 最速徽章 */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  {r.distance_category && bests[r.distance_category] === r.total_seconds && (
                    <span className="text-xs px-1.5 py-0.5 rounded bg-[#FF6B3D] text-white font-medium">
                      最速
                    </span>
                  )}
                  <p className={`font-mono text-sm font-medium tabular-nums ${
                    r.distance_category && bests[r.distance_category] === r.total_seconds
                      ? 'text-accent'
                      : 'text-ink'
                  }`}>
                    {secondsToTime(r.total_seconds)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {results.length === 0 && (
        <div className="rounded-xl border border-border bg-bg-card p-8 text-center mb-6">
          <p className="text-ink-3 text-sm">尚無公開成績</p>
        </div>
      )}

      {/* ④ 接力成績 */}
      {relayResults.length > 0 && (
        <div className="rounded-xl border border-border bg-bg-card overflow-hidden">
          <div className="px-5 py-3 border-b border-border">
            <h2 className="text-sm font-semibold text-ink">接力成績</h2>
          </div>
          <div className="divide-y divide-border">
            {relayResults.map(r => (
              <div key={r.member_id} className="px-5 py-3 flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    {r.year && (
                      <span className="text-xs text-ink-4 font-mono">{r.year}</span>
                    )}
                    {r.race_slug && r.year ? (
                      <Link
                        href={`/races/${r.race_slug}/${r.year}`}
                        className="text-sm text-ink hover:text-accent"
                      >
                        {r.race_name ?? '未知賽事'}
                      </Link>
                    ) : (
                      <span className="text-sm text-ink">{r.race_name ?? '未知賽事'}</span>
                    )}
                    {r.team_id && (
                      <Link
                        href={`/teams/${r.team_id}`}
                        className="text-sm text-ink-3 hover:text-accent"
                      >
                        {r.team_name ?? '未知隊伍'}
                      </Link>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                    {r.distance_category && (
                      <span className="text-xs px-1.5 py-0.5 rounded bg-bg-elev text-ink-4 font-mono">
                        {DIST_LABEL[r.distance_category] ?? r.distance_category}
                      </span>
                    )}
                    {r.gender_category && (
                      <span className="text-xs text-ink-4">
                        {GENDER_LABEL[r.gender_category] ?? r.gender_category}
                      </span>
                    )}
                    {r.disciplines?.length > 0 && (
                      <span className="text-xs text-ink-4">{r.disciplines.join(' + ')}</span>
                    )}
                  </div>
                </div>
                <p className="font-mono text-sm font-medium text-ink-3 tabular-nums flex-shrink-0">
                  {r.split_seconds ? secondsToTime(r.split_seconds) : '—'}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </main>
  )
}
