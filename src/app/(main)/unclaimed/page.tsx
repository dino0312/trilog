import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { secondsToTime } from '@/lib/utils/time'
import { ClaimButton } from '@/components/claims/ClaimButton'

export const metadata: Metadata = { title: '未認領成績' }

const DISTANCE_LABEL: Record<string, string> = {
  sprint: 'Sprint', olympic: '51.5', '70.3': '113', full: '226',
}

type SearchParams = Promise<{ q?: string; race?: string; distance?: string }>

export default async function UnclaimedPage({ searchParams }: { searchParams: SearchParams }) {
  const { q, race, distance } = await searchParams
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  // 取得賽事清單
  const { data: races } = await supabase
    .from('races').select('id, name').eq('status', 'active').order('name')

  // 查詢未認領成績
  let query = supabase
    .from('results')
    .select(`
      id, total_seconds, swim_seconds, bike_seconds, run_seconds,
      athlete_name_snapshot, claim_tag_count, source_credibility,
      race_editions (
        year, distance_category,
        races ( id, name )
      )
    `)
    .in('claim_status', ['unclaimed', 'unlinked'])
    .eq('result_type', 'solo')
    .order('total_seconds', { ascending: true })
    .limit(100)

  if (q) query = query.ilike('athlete_name_snapshot', `%${q}%`)
  if (distance) query = query.eq('race_editions.distance_category' as any, distance)

  const { data: results } = await query

  // 若有 race 篩選，在 JS 層過濾（nested filter 限制）
  const filtered = race
    ? results?.filter(r => (r.race_editions as any)?.races?.id === race)
    : results

  return (
    <main className="flex-1 p-6 max-w-4xl mx-auto w-full">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-ink">未認領成績</h1>
        <p className="mt-0.5 text-sm text-ink-3">搜尋你的名字，認領屬於你的成績</p>
      </div>

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

      {/* 結果列表 */}
      {!filtered?.length ? (
        <div className="rounded-xl border border-border bg-bg-card p-12 text-center">
          <p className="text-ink-3">沒有符合條件的未認領成績</p>
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-bg-card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-ink-3 text-xs">
                <th className="px-4 py-3 text-left">姓名</th>
                <th className="px-4 py-3 text-left">賽事</th>
                <th className="px-4 py-3 text-right font-mono">完賽</th>
                <th className="px-4 py-3 text-center hidden sm:table-cell">標記</th>
                <th className="px-4 py-3 text-right">{user ? '認領' : ''}</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(r => {
                const edition = r.race_editions as any
                const raceName = edition?.races?.name
                return (
                  <tr key={r.id} className="border-b border-border last:border-0 hover:bg-bg-elev transition">
                    <td className="px-4 py-3">
                      <p className="text-ink font-medium">{r.athlete_name_snapshot ?? '—'}</p>
                      <p className="text-xs text-ink-4">
                        {r.source_credibility === 'official' ? '官方成績' : '自填'}
                      </p>
                    </td>
                    <td className="px-4 py-3 text-ink-3">
                      {raceName} {edition?.year}
                      <span className="ml-1 text-xs text-ink-4">
                        {DISTANCE_LABEL[edition?.distance_category]}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-mono font-bold text-accent tabular-nums">
                      {secondsToTime(r.total_seconds)}
                    </td>
                    <td className="px-4 py-3 text-center hidden sm:table-cell">
                      {r.claim_tag_count > 0 && (
                        <span className="inline-flex items-center gap-1 text-xs text-warn">
                          🔔 {r.claim_tag_count}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {user && <ClaimButton resultId={r.id} />}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {!user && (
        <p className="mt-4 text-center text-sm text-ink-3">
          <a href="/login" className="text-accent hover:underline">登入</a> 後才能認領成績
        </p>
      )}
    </main>
  )
}
