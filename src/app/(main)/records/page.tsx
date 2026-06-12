import type { Metadata } from 'next'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { secondsToTime } from '@/lib/utils/time'
import { redirect } from 'next/navigation'
import { RecordActions } from '@/components/results/RecordActions'
import { UnlinkButton } from '@/components/results/UnlinkButton'
import { DisciplineIcon } from '@/components/ui/DisciplineIcon'

export const metadata: Metadata = { title: '我的紀錄' }

const DISTANCE_LABEL: Record<string, string> = {
  sprint: 'Sprint', olympic: '51.5', '70.3': '113', full: '226',
}

const CREDIBILITY_LABEL: Record<string, string> = {
  self_reported: '自填', official: '官方',
}

export default async function RecordsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login?redirectTo=/records')

  const { data: results } = await supabase
    .from('results')
    .select(`
      id, total_seconds, swim_seconds, t1_seconds, bike_seconds, t2_seconds, run_seconds,
      source_credibility, claim_status, is_public, notes, claimed_at,
      race_editions (
        year, race_date, distance_category,
        races ( name, city )
      )
    `)
    .eq('athlete_id', user.id)
    .eq('result_type', 'solo')
    .order('race_editions(race_date)', { ascending: false, nullsFirst: false })
    .order('created_at', { ascending: false })

  // relay：從 team_members 找出使用者參與的接力成績
  const { data: relayMembers } = await supabase
    .from('team_members')
    .select(`
      id, disciplines, split_seconds, claim_status,
      teams (
        id, team_name, gender_category, t1_seconds, t2_seconds,
        results (
          id, total_seconds, source_credibility, claim_status, is_public, notes, claimed_at,
          race_editions (
            year, race_date, distance_category,
            races ( name, city )
          )
        )
      )
    `)
    .eq('athlete_id', user.id)
    .order('created_at', { ascending: false })

  const totalCount = (results?.length ?? 0) + (relayMembers?.length ?? 0)

  return (
    <main className="flex-1 p-6 max-w-3xl mx-auto w-full">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-ink">我的紀錄</h1>
          <p className="mt-0.5 text-sm text-ink-3">{totalCount} 筆成績</p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/records/relay/new"
            className="rounded-lg border border-border px-4 py-2 text-sm text-ink-3 hover:text-ink hover:bg-bg-elev transition"
          >
            + 接力成績
          </Link>
          <Link
            href="/records/new"
            className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-accent-ink hover:brightness-110 transition"
          >
            + 新增成績
          </Link>
        </div>
      </div>

      {/* Solo 成績 */}
      {!!results?.length && (
        <h2 className="text-xs font-semibold text-ink-4 uppercase tracking-widest mb-3">個人成績</h2>
      )}

      {!totalCount ? (
        <div className="rounded-xl border border-border bg-bg-card p-12 text-center">
          <p className="text-ink-3">還沒有任何成績記錄</p>
          <Link href="/records/new" className="mt-3 inline-block text-sm text-accent hover:underline">
            新增第一筆成績
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {results?.map((r, idx) => {
            const edition = r.race_editions as any
            const race = edition?.races as any
            const year = edition?.year as number | undefined
            const prevYear = idx > 0 ? (results[idx - 1].race_editions as any)?.year : null
            const showYearHeader = (results.length ?? 0) >= 5 && year && year !== prevYear
            return (
              <div key={r.id}>
              {showYearHeader && (
                <p className="text-xs font-semibold text-ink-4 uppercase tracking-widest mb-2 mt-1">{year}</p>
              )}
              <div className="rounded-xl border border-border bg-bg-card p-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-semibold text-ink">
                      {race?.name ?? '—'}{' '}
                      <span className="text-ink-3 font-normal">{edition?.year}</span>
                    </p>
                    <p className="text-xs text-ink-4 mt-0.5">
                      {race?.city} · {DISTANCE_LABEL[edition?.distance_category] ?? edition?.distance_category}
                      {' · '}{CREDIBILITY_LABEL[r.source_credibility] ?? '自填'}
                      {!r.is_public && ' · 私人'}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <p className="font-mono text-xl font-bold text-accent tabular-nums">
                      {secondsToTime(r.total_seconds)}
                    </p>
                    {r.claim_status === 'pending' && (
                      <span className="text-xs text-warn font-medium">⏳ 待審核</span>
                    )}
                    {r.claim_status === 'claimed' && r.source_credibility !== 'self_reported' && (
                      <span className="text-xs text-good font-medium">✓ 已認領</span>
                    )}
                  </div>
                </div>

                {/* 分項時間 */}
                {(r.swim_seconds || r.bike_seconds || r.run_seconds) && (
                  <div className="mt-3 grid grid-cols-5 gap-1 text-center text-xs">
                    {[
                      { label: '游泳', val: r.swim_seconds, color: 'text-swim' },
                      { label: 'T1',   val: r.t1_seconds,   color: 'text-ink-3' },
                      { label: '騎車', val: r.bike_seconds,  color: 'text-bike' },
                      { label: 'T2',   val: r.t2_seconds,   color: 'text-ink-3' },
                      { label: '跑步', val: r.run_seconds,   color: 'text-run' },
                    ].map(({ label, val, color }) => (
                      <div key={label} className="rounded bg-bg-elev p-1.5">
                        <p className="text-ink-4">{label}</p>
                        <p className={`font-mono font-medium ${color}`}>
                          {val ? secondsToTime(val) : '—'}
                        </p>
                      </div>
                    ))}
                  </div>
                )}

                {r.notes && (
                  <p className="mt-2 text-xs text-ink-3 line-clamp-2">{r.notes}</p>
                )}

                {r.source_credibility === 'self_reported' && (
                  <RecordActions
                    id={r.id}
                    totalSeconds={r.total_seconds}
                    swimSeconds={r.swim_seconds}
                    t1Seconds={r.t1_seconds}
                    bikeSeconds={r.bike_seconds}
                    t2Seconds={r.t2_seconds}
                    runSeconds={r.run_seconds}
                    isPublic={r.is_public}
                    notes={r.notes}
                  />
                )}

                {/* 21.4：已認領的官方成績可申請解除關聯 */}
                {r.source_credibility === 'official' && r.claim_status === 'claimed' && (
                  <div className="mt-3 flex justify-end">
                    <UnlinkButton resultId={r.id} />
                  </div>
                )}
              </div>
              </div>
            )
          })}
        </div>
      )}

      {/* 接力成績 */}
      {!!relayMembers?.length && (
        <div className="mt-8">
          <h2 className="text-xs font-semibold text-ink-4 uppercase tracking-widest mb-3">接力成績</h2>
          <div className="flex flex-col gap-3">
            {relayMembers.map(member => {
              const team   = member.teams as any
              const result = team?.results as any
              const edition = result?.race_editions as any
              const race    = edition?.races as any
              if (!result) return null

              return (
                <div key={member.id} className="relative">
                <Link
                  href={`/teams/${team.id}`}
                  className="rounded-xl border border-border bg-bg-card p-4 hover:bg-bg-elev/30 transition block"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-semibold text-ink">
                        {race?.name ?? '—'}{' '}
                        <span className="text-ink-3 font-normal">{edition?.year}</span>
                      </p>
                      <p className="text-xs text-ink-4 mt-0.5">
                        {race?.city} · {DISTANCE_LABEL[edition?.distance_category] ?? edition?.distance_category}
                        {' · '}{team.team_name ? `「${team.team_name}」` : '未命名隊伍'}
                        {!result.is_public && ' · 私人'}
                      </p>
                      {/* 成員負責的分項 */}
                      <div className="flex items-center gap-1 mt-2">
                        {(member.disciplines as string[]).map((d: string) => (
                          <DisciplineIcon key={d} discipline={d as 'swim' | 'bike' | 'run'} className="w-4 h-4" />
                        ))}
                        {member.split_seconds && (
                          <span className="ml-1 font-mono text-sm text-ink-3">
                            {secondsToTime(member.split_seconds)}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <p className="font-mono text-xl font-bold text-accent tabular-nums">
                        {secondsToTime(result.total_seconds)}
                      </p>
                      {member.claim_status === 'pending' && (
                        <span className="text-xs text-warn font-medium">⏳ 待審核</span>
                      )}
                      {member.claim_status === 'claimed' && (
                        <span className="text-xs text-good font-medium">✓ 已認領</span>
                      )}
                      {member.claim_status === 'unclaimed' && (
                        <span className="text-xs text-ink-4">未認領</span>
                      )}
                    </div>
                  </div>
                </Link>
                <Link
                  href={`/records/relay/${team.id}/edit`}
                  className="absolute top-3 right-3 text-xs text-ink-4 hover:text-ink px-2 py-1 rounded hover:bg-bg-elev transition"
                >
                  編輯
                </Link>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </main>
  )
}
