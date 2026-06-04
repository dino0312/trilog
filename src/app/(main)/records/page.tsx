import type { Metadata } from 'next'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { secondsToTime } from '@/lib/utils/time'
import { redirect } from 'next/navigation'

export const metadata: Metadata = { title: '我的紀錄' }

const DISTANCE_LABEL: Record<string, string> = {
  sprint: 'Sprint', olympic: '51.5', '70.3': '113', full: '226',
}

const CREDIBILITY_LABEL: Record<string, string> = {
  self_reported: '自填', certificate: '公證', official: '官方',
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
    .order('claimed_at', { ascending: false })

  return (
    <main className="flex-1 p-6 max-w-3xl mx-auto w-full">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-ink">我的紀錄</h1>
          <p className="mt-0.5 text-sm text-ink-3">{results?.length ?? 0} 筆成績</p>
        </div>
        <Link
          href="/records/new"
          className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-accent-ink hover:brightness-110 transition"
        >
          + 新增成績
        </Link>
      </div>

      {!results?.length ? (
        <div className="rounded-xl border border-border bg-bg-card p-12 text-center">
          <p className="text-ink-3">還沒有任何成績記錄</p>
          <Link href="/records/new" className="mt-3 inline-block text-sm text-accent hover:underline">
            新增第一筆成績
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {results.map(r => {
            const edition = r.race_editions as any
            const race = edition?.races as any
            return (
              <div key={r.id} className="rounded-xl border border-border bg-bg-card p-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-semibold text-ink">
                      {race?.name ?? '—'}{' '}
                      <span className="text-ink-3 font-normal">{edition?.year}</span>
                    </p>
                    <p className="text-xs text-ink-4 mt-0.5">
                      {race?.city} · {DISTANCE_LABEL[edition?.distance_category] ?? edition?.distance_category}
                      {' · '}{CREDIBILITY_LABEL[r.source_credibility]}
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
              </div>
            )
          })}
        </div>
      )}
    </main>
  )
}
