import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { secondsToTime } from '@/lib/utils/time'
import { RankingsFilters } from '@/components/rankings/RankingsFilters'

export const metadata: Metadata = { title: '排行榜 · Tri·log' }

const DISTANCE_LABEL: Record<string, string> = {
  sprint: 'Sprint', olympic: '51.5', '70.3': '113', full: '226',
}

type SearchParams = Promise<{ race?: string; distance?: string; gender?: string }>

export default async function RankingsPage({ searchParams }: { searchParams: SearchParams }) {
  const { race, distance, gender } = await searchParams

  // 距離為必選，無參數時 redirect 至 226
  if (!distance) {
    const params = new URLSearchParams()
    params.set('distance', 'full')
    if (race)   params.set('race', race)
    if (gender) params.set('gender', gender)
    redirect(`/rankings?${params.toString()}`)
  }

  const supabase = await createClient()

  const { data: races } = await supabase
    .from('races')
    .select('id, name, slug')
    .eq('status', 'active')
    .order('name')

  let query = supabase
    .from('leaderboard_entries')
    .select('result_id, total_seconds, swim_seconds, bike_seconds, run_seconds, display_name, gender, age_group, nationality, source_credibility, claim_status, race_name, edition_year, distance_category, race_id, race_slug')
    .eq('distance_category', distance as 'sprint' | 'olympic' | '70.3' | 'full')
    .order('total_seconds', { ascending: true })
    .limit(200)

  if (race)   query = query.eq('race_id', race)
  if (gender) query = query.eq('gender', gender as 'M' | 'F')

  const { data: entries } = await query

  return (
    <main className="flex-1 p-6 max-w-5xl mx-auto w-full">
      <p className="text-sm text-ink-3 mb-6">{DISTANCE_LABEL[distance] ?? distance} · {entries?.length ?? 0} 筆成績</p>

      <RankingsFilters
        races={races ?? []}
        currentDistance={distance}
        currentRace={race ?? ''}
        currentGender={gender ?? ''}
      />

      {!entries?.length ? (
        <div className="rounded-xl border border-border bg-bg-card p-12 text-center">
          <p className="text-ink-3">目前沒有符合條件的成績</p>
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-bg-card overflow-x-auto">
          <table className="w-full text-sm min-w-[480px]">
            <thead>
              <tr className="border-b border-border text-ink-3 text-xs">
                <th className="px-4 py-3 text-left w-10">#</th>
                <th className="px-4 py-3 text-left">選手</th>
                <th className="px-4 py-3 text-left hidden sm:table-cell">賽事</th>
                <th className="px-4 py-3 text-right font-mono">完賽</th>
                <th className="px-4 py-3 text-right font-mono hidden sm:table-cell text-swim">游</th>
                <th className="px-4 py-3 text-right font-mono hidden sm:table-cell text-bike">騎</th>
                <th className="px-4 py-3 text-right font-mono hidden sm:table-cell text-run">跑</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((e, i) => (
                <tr key={e.result_id}
                  className="border-b border-border last:border-0 hover:bg-bg-elev transition">
                  <td className="px-4 py-3 text-ink-4 tabular-nums">{i + 1}</td>
                  <td className="px-4 py-3">
                    <p className="text-ink font-medium whitespace-nowrap">{e.display_name ?? '匿名'}</p>
                    {e.age_group && <p className="text-xs text-ink-4">{e.age_group}</p>}
                  </td>
                  <td className="px-4 py-3 text-ink-3 hidden sm:table-cell">
                    {e.race_name} {e.edition_year}
                  </td>
                  <td className="px-4 py-3 text-right font-mono font-bold text-accent tabular-nums">
                    {secondsToTime(e.total_seconds)}
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-swim tabular-nums hidden sm:table-cell">
                    {e.swim_seconds ? secondsToTime(e.swim_seconds) : '—'}
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-bike tabular-nums hidden sm:table-cell">
                    {e.bike_seconds ? secondsToTime(e.bike_seconds) : '—'}
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-run tabular-nums hidden sm:table-cell">
                    {e.run_seconds ? secondsToTime(e.run_seconds) : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  )
}
