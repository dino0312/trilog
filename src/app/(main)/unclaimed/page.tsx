import type { Metadata } from 'next'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { secondsToTime } from '@/lib/utils/time'
import { ClaimButton } from '@/components/claims/ClaimButton'
import { TagButton } from '@/components/claims/TagButton'

export const metadata: Metadata = { title: '未認領成績 · Tri·log' }

const DISTANCE_LABEL: Record<string, string> = {
  sprint: 'Sprint', olympic: '51.5', '70.3': '113', full: '226',
}

type SearchParams = Promise<{ q?: string; race?: string; distance?: string }>

export default async function UnclaimedPage({ searchParams }: { searchParams: SearchParams }) {
  const { q, race, distance } = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: races } = await supabase
    .from('races').select('id, name').eq('status', 'active').order('name')

  // 查詢未認領成績，依標記數降冪、時間升冪
  let query = supabase
    .from('results')
    .select(`
      id, total_seconds, swim_seconds, bike_seconds, run_seconds,
      athlete_name_snapshot, claim_tag_count, source_credibility, claim_status,
      race_editions (
        year, distance_category,
        races ( id, name )
      )
    `)
    .in('claim_status', ['unclaimed', 'unlinked'])
    .eq('result_type', 'solo')
    .order('claim_tag_count', { ascending: false })
    .order('total_seconds', { ascending: true })
    .limit(200)

  if (q) query = query.ilike('athlete_name_snapshot', `%${q}%`)

  const { data: results } = await query

  const filtered = (() => {
    let list = results ?? []
    if (race)     list = list.filter(r => (r.race_editions as any)?.races?.id === race)
    if (distance) list = list.filter(r => (r.race_editions as any)?.distance_category === distance)
    return list
  })()

  // 搜尋名字時，同時查未認領的接力隊員
  let relayMembers: Array<{
    id: string
    athlete_name_snapshot: string
    disciplines: string[]
    split_seconds: number | null
    team_id: string
    team_name: string | null
    race_name: string | null
    year: number | null
    distance_category: string | null
  }> = []
  if (q) {
    const { data: rawRelay } = await supabase
      .from('team_members')
      .select(`
        id, athlete_name_snapshot, disciplines, split_seconds,
        teams (
          id, team_name,
          results (
            race_editions (
              year, distance_category,
              races ( name )
            )
          )
        )
      `)
      .is('athlete_id', null)
      .eq('claim_status', 'unclaimed')
      .ilike('athlete_name_snapshot', `%${q}%`)
      .limit(50)
    relayMembers = (rawRelay ?? []).map(m => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const team    = m.teams as any
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const res     = team?.results as any
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const edition = res?.race_editions as any
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const race    = edition?.races as any
      return {
        id:                   m.id,
        athlete_name_snapshot: m.athlete_name_snapshot,
        disciplines:           m.disciplines as string[],
        split_seconds:         m.split_seconds as number | null,
        team_id:               team?.id as string,
        team_name:             team?.team_name as string | null,
        race_name:             race?.name as string | null,
        year:                  edition?.year as number | null,
        distance_category:     edition?.distance_category as string | null,
      }
    })
  }

  // 已登入者：取出 name + 已標記的 result_id
  let myTaggedIds = new Set<string>()
  let myName = ''
  if (user) {
    const [{ data: myTags }, { data: profile }] = await Promise.all([
      supabase.from('claim_tags').select('result_id').eq('tagged_by', user.id),
      supabase.from('athletes').select('name').eq('id', user.id).single(),
    ])
    myTaggedIds = new Set((myTags ?? []).map(t => t.result_id))
    myName = profile?.name ?? ''
  }

  const normalize = (s: string) => s.trim().toLowerCase().replace(/\s+/g, '')
  const nameMatches = (snapshot: string | null) =>
    !!myName && !!snapshot && normalize(snapshot) === normalize(myName)

  return (
    <main className="flex-1 p-6 max-w-4xl mx-auto w-full">

      {/* 搜尋與篩選 */}
      <form className="flex flex-wrap gap-3 mb-6">
        <input
          name="q" defaultValue={q ?? ''}
          placeholder="搜尋姓名…"
          className="flex-1 min-w-48 rounded-lg border border-border-strong bg-bg-elev px-3.5 py-2 text-sm text-ink placeholder:text-ink-4 outline-none focus:border-accent"
        />
        <select name="race" defaultValue={race ?? ''}
          className="rounded-lg border border-border-strong bg-bg-elev px-3 py-2 text-sm text-ink outline-none focus:border-accent">
          <option value="">所有賽事</option>
          {races?.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
        </select>
        <select name="distance" defaultValue={distance ?? ''}
          className="rounded-lg border border-border-strong bg-bg-elev px-3 py-2 text-sm text-ink outline-none focus:border-accent">
          <option value="">所有距離</option>
          {(['sprint', 'olympic', '70.3', 'full'] as const).map(d => (
            <option key={d} value={d}>{DISTANCE_LABEL[d]}</option>
          ))}
        </select>
        <button type="submit"
          className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-accent-ink hover:brightness-110 transition">
          搜尋
        </button>
      </form>

      {!filtered.length ? (
        <div className="rounded-xl border border-border bg-bg-card p-12 text-center">
          <p className="text-ink-3">沒有符合條件的未認領成績</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {filtered.map(r => {
            const edition = r.race_editions as any
            const raceName = edition?.races?.name
            return (
              <div key={r.id} className="rounded-xl border border-border bg-bg-card p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <Link href={`/results/${r.id}`}
                      className="font-semibold text-ink hover:text-accent transition">
                      {r.athlete_name_snapshot ?? '—'}
                    </Link>
                    <p className="text-xs text-ink-4 mt-0.5">
                      {raceName} {edition?.year}
                      {' · '}{DISTANCE_LABEL[edition?.distance_category] ?? edition?.distance_category}
                      {' · '}{r.source_credibility === 'official' ? '官方成績' : '自填'}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <p className="font-mono text-xl font-bold text-accent tabular-nums">
                      {secondsToTime(r.total_seconds)}
                    </p>
                    {r.claim_tag_count > 0 && (
                      <span className="text-xs text-ink-4">🔔 {r.claim_tag_count} 人已通知</span>
                    )}
                  </div>
                </div>

                {(r.swim_seconds || r.bike_seconds || r.run_seconds) && (
                  <div className="mt-2 flex gap-3 text-xs font-mono">
                    {r.swim_seconds && <span className="text-swim">{secondsToTime(r.swim_seconds)}</span>}
                    {r.bike_seconds && <span className="text-bike">{secondsToTime(r.bike_seconds)}</span>}
                    {r.run_seconds  && <span className="text-run">{secondsToTime(r.run_seconds)}</span>}
                  </div>
                )}

                <div className="mt-3 flex items-center gap-4 flex-wrap">
                  <ClaimButton resultId={r.id} visible={nameMatches(r.athlete_name_snapshot)} />
                  <TagButton
                    resultId={r.id}
                    tagCount={r.claim_tag_count ?? 0}
                    hasTagged={myTaggedIds.has(r.id)}
                    isLoggedIn={!!user}
                    claimStatus={r.claim_status}
                  />
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* 未認領接力隊員（僅在搜尋名字時顯示） */}
      {relayMembers.length > 0 && (
        <div className="mt-6">
          <h2 className="text-sm font-semibold text-ink-3 mb-3">接力成績</h2>
          <div className="flex flex-col gap-3">
            {relayMembers.map(m => (
              <div key={m.id} className="rounded-xl border border-border bg-bg-card p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <span className="font-semibold text-ink">{m.athlete_name_snapshot}</span>
                    <p className="text-xs text-ink-4 mt-0.5">
                      {m.race_name} {m.year}
                      {m.distance_category && ` · ${DISTANCE_LABEL[m.distance_category] ?? m.distance_category}`}
                      {' · '}{m.team_name ?? '未命名隊伍'}
                      {' · 接力'}
                    </p>
                    <div className="flex gap-1.5 mt-1.5 flex-wrap">
                      {m.disciplines.map(d => (
                        <span key={d} className={`text-xs px-1.5 py-0.5 rounded border ${
                          d === 'swim' ? 'border-swim/40 text-swim' :
                          d === 'bike' ? 'border-bike/40 text-bike' :
                          'border-run/40 text-run'
                        }`}>
                          {d === 'swim' ? '游泳' : d === 'bike' ? '自行車' : '跑步'}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2 shrink-0">
                    {m.split_seconds != null && (
                      <span className="font-mono text-sm text-ink">{secondsToTime(m.split_seconds)}</span>
                    )}
                    <Link
                      href={`/teams/${m.team_id}`}
                      className="text-xs px-3 py-1.5 rounded-lg border border-accent/40 text-accent hover:bg-accent/10 transition"
                    >
                      前往認領 →
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {!user && (
        <p className="mt-4 text-center text-sm text-ink-3">
          <Link href="/login" className="text-accent hover:underline">登入</Link> 後才能認領或標記成績
        </p>
      )}
    </main>
  )
}
