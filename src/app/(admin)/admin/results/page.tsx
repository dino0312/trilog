import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { secondsToTime } from '@/lib/utils/time'
import { OfficialResultForm } from './OfficialResultForm'
import { DeleteOfficialButton } from './DeleteOfficialButton'

export const metadata: Metadata = { title: '官方成績管理 · Tri·log' }

const DISTANCE_LABEL: Record<string, string> = {
  sprint: 'Sprint', olympic: '51.5', '70.3': '113', full: '226',
}

type SearchParams = Promise<{ edition?: string; race?: string }>

export default async function AdminResultsPage({ searchParams }: { searchParams: SearchParams }) {
  const { edition: editionFilter, race: raceFilter } = await searchParams
  const supabase = await createClient()

  // 取所有屆次（供表單選擇）
  const { data: editions } = await supabase
    .from('race_editions')
    .select('id, year, distance_category, races ( id, name )')
    .order('year', { ascending: false })

  // 取官方成績列表
  let query = supabase
    .from('results')
    .select(`
      id, athlete_name_snapshot, total_seconds, swim_seconds, bike_seconds, run_seconds,
      claim_status, claim_tag_count, overall_rank, curated_gender,
      race_editions ( id, year, distance_category, races ( name ) )
    `)
    .eq('source_credibility', 'official')
    .order('race_editions(year)', { ascending: false })
    .order('total_seconds', { ascending: true })
    .limit(500)

  if (editionFilter) query = query.eq('race_edition_id', editionFilter)
  if (raceFilter)    query = query.eq('race_editions.races.id' as any, raceFilter)

  const { data: results } = await query

  // 取唯一賽事列表（供篩選）
  const races = Array.from(
    new Map(
      (editions ?? []).map(e => [(e.races as any)?.id, (e.races as any)?.name])
    ).entries()
  ).filter(([id]) => id).map(([id, name]) => ({ id, name }))

  const CLAIM_COLOR: Record<string, string> = {
    unclaimed: 'text-ink-4',
    pending:   'text-warn',
    claimed:   'text-good',
    unlinked:  'text-ink-3',
  }
  const CLAIM_LABEL: Record<string, string> = {
    unclaimed: '未認領', pending: '審核中', claimed: '已認領', unlinked: '解除關聯',
  }

  return (
    <main className="flex-1 p-6 max-w-5xl mx-auto w-full">
      <h1 className="text-xl font-bold text-ink mb-6">官方成績管理</h1>

      {/* 新增表單 */}
      <section className="rounded-xl border border-border bg-bg-card p-5 mb-8">
        <h2 className="text-sm font-semibold text-ink mb-4">新增官方成績</h2>
        <OfficialResultForm editions={(editions ?? []) as any} />
      </section>

      {/* 篩選 */}
      <form className="flex flex-wrap gap-3 mb-4">
        <select name="race" defaultValue={raceFilter ?? ''}
          className="rounded-lg border border-border-strong bg-bg-elev px-3 py-2 text-sm text-ink outline-none focus:border-accent">
          <option value="">所有賽事</option>
          {races.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
        </select>
        <select name="edition" defaultValue={editionFilter ?? ''}
          className="rounded-lg border border-border-strong bg-bg-elev px-3 py-2 text-sm text-ink outline-none focus:border-accent">
          <option value="">所有屆次</option>
          {(editions ?? []).map(e => (
            <option key={e.id} value={e.id}>
              {(e.races as any)?.name} {e.year} · {DISTANCE_LABEL[e.distance_category]}
            </option>
          ))}
        </select>
        <button type="submit"
          className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-accent-ink hover:brightness-110 transition">
          篩選
        </button>
      </form>

      <p className="text-xs text-ink-4 mb-3">{results?.length ?? 0} 筆官方成績</p>

      {/* 成績列表 */}
      {!results?.length ? (
        <div className="rounded-xl border border-border bg-bg-card p-10 text-center">
          <p className="text-ink-3">尚無官方成績</p>
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-bg-card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-ink-3 text-xs">
                <th className="px-3 py-2.5 text-left">姓名</th>
                <th className="px-3 py-2.5 text-left">賽事</th>
                <th className="px-3 py-2.5 text-center">性別</th>
                <th className="px-3 py-2.5 text-right font-mono">完賽</th>
                <th className="px-3 py-2.5 text-center">狀態</th>
                <th className="px-3 py-2.5 text-center">標記</th>
                <th className="px-3 py-2.5 text-right"></th>
              </tr>
            </thead>
            <tbody>
              {results.map(r => {
                const edition = r.race_editions as any
                return (
                  <tr key={r.id} className="border-b border-border last:border-0 hover:bg-bg-elev transition">
                    <td className="px-3 py-2.5 font-medium text-ink">
                      {r.athlete_name_snapshot ?? '—'}
                      {r.overall_rank && <span className="ml-1 text-xs text-ink-4">#{r.overall_rank}</span>}
                    </td>
                    <td className="px-3 py-2.5 text-ink-3 text-xs">
                      {edition?.races?.name} {edition?.year}
                      <span className="ml-1 text-ink-4">{DISTANCE_LABEL[edition?.distance_category]}</span>
                    </td>
                    <td className="px-3 py-2.5 text-center text-xs text-ink-4">
                      {r.curated_gender ?? '—'}
                    </td>
                    <td className="px-3 py-2.5 text-right font-mono font-semibold text-accent tabular-nums">
                      {secondsToTime(r.total_seconds)}
                    </td>
                    <td className={`px-3 py-2.5 text-center text-xs font-medium ${CLAIM_COLOR[r.claim_status]}`}>
                      {CLAIM_LABEL[r.claim_status]}
                    </td>
                    <td className="px-3 py-2.5 text-center text-xs text-ink-4">
                      {r.claim_tag_count > 0 ? `🔔 ${r.claim_tag_count}` : '—'}
                    </td>
                    <td className="px-3 py-2.5 text-right">
                      {r.claim_status === 'unclaimed' && (
                        <DeleteOfficialButton resultId={r.id} />
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </main>
  )
}
