import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { secondsToTime } from '@/lib/utils/time'

export const metadata: Metadata = { title: '排行榜 · Tri·log' }

const DISTANCE_LABEL: Record<string, string> = {
  sprint: 'Sprint', olympic: 'Olympic', '70.3': '70.3', full: 'Full',
}

type SearchParams = Promise<{ race?: string; distance?: string; gender?: string }>

export default async function RankingsPage({ searchParams }: { searchParams: SearchParams }) {
  const { race, distance, gender } = await searchParams
  const supabase = await createClient()

  const { data: races } = await supabase
    .from('races')
    .select('id, name, slug')
    .eq('status', 'active')
    .order('name')

  let query = supabase
    .from('leaderboard_entries')
    .select('result_id, total_seconds, swim_seconds, bike_seconds, run_seconds, display_name, gender, age_group, nationality, source_credibility, claim_status, race_name, edition_year, distance_category, race_id, race_slug')
    .order('total_seconds', { ascending: true })
    .limit(200)

  if (race)     query = query.eq('race_id', race)
  if (distance) query = query.eq('distance_category', distance as 'sprint' | 'olympic' | '70.3' | 'full')
  if (gender)   query = query.eq('gender', gender as 'M' | 'F')

  const { data: entries } = await query

  return (
    <main className="flex-1 p-6 max-w-5xl mx-auto w-full">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-ink">排行榜</h1>
        <p className="mt-0.5 text-sm text-ink-3">{entries?.length ?? 0} 筆成績</p>
      </div>

      <form className="flex flex-wrap gap-3 mb-6">
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

        <select name="gender" defaultValue={gender ?? ''}
          className="rounded-lg border border-border-strong bg-bg-elev px-3 py-2 text-sm text-ink outline-none focus:border-accent">
          <option value="">男女不限</option>
          <option value="M">男子</option>
          <option value="F">女子</option>
        </select>

        <button type="submit"
          className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-accent-ink hover:brightness-110 transition">
          篩選
        </button>
      </form>

      {!entries?.length ? (
        <div className="rounded-xl border border-border bg-bg-card p-12 text-center">
          <p className="text-ink-3">目前沒有符合條件的成績</p>
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-bg-card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-ink-3 text-xs">
                <th className="px-4 py-3 text-left w-10">#</th>
                <th className="px-4 py-3 text-left">選手</th>
                <th className="px-4 py-3 text-left">賽事</th>
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
                    <p className="text-ink font-medium">{e.display_name ?? '匿名'}</p>
                    {e.age_group && <p className="text-xs text-ink-4">{e.age_group}</p>}
                  </td>
                  <td className="px-4 py-3 text-ink-3">
                    {e.race_name} {e.edition_year}
                    <span className="ml-1 text-xs text-ink-4">{DISTANCE_LABEL[e.distance_category]}</span>
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
