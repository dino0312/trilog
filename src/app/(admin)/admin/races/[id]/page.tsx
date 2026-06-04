import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { RaceEditForm } from './RaceEditForm'
import { EditionFormPanel } from './EditionFormPanel'

export const metadata: Metadata = { title: '賽事詳情 · Tri·log' }

const DISTANCE_LABEL: Record<string, string> = {
  sprint: 'Sprint', olympic: '51.5', '70.3': '113', full: '226',
}

const SWIM_LABEL: Record<string, string> = {
  ocean: '海洋', lake: '湖泊', river: '河川', pool: '泳池', other: '其他',
}

export default async function RaceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: race } = await supabase
    .from('races')
    .select('id, name, slug, status, country, city, organizer, website')
    .eq('id', id)
    .single()

  if (!race) notFound()

  const { data: editions } = await supabase
    .from('race_editions')
    .select('id, year, race_date, race_date_end, distance_category, swim_distance_m, bike_distance_km, run_distance_km, swim_type, finisher_count, dnf_count, total_starters, notes')
    .eq('race_id', id)
    .order('race_date', { ascending: false })

  return (
    <main className="flex-1 p-6 max-w-4xl mx-auto w-full">
      {/* Breadcrumb */}
      <div className="mb-6 flex items-center gap-2 text-sm text-ink-4">
        <Link href="/admin/races" className="hover:text-accent transition">賽事管理</Link>
        <span>/</span>
        <span className="text-ink">{race.name}</span>
      </div>

      {/* 系列賽基本資料 */}
      <section className="mb-8">
        <h2 className="text-base font-semibold text-ink mb-4">系列賽資料</h2>
        <div className="rounded-xl border border-border bg-bg-card p-5">
          <RaceEditForm race={race} />
        </div>
      </section>

      {/* 屆次列表 */}
      <section>
        <div className="flex items-center gap-3 mb-4">
          <h2 className="text-base font-semibold text-ink">屆次紀錄</h2>
          <span className="text-xs text-ink-4">{editions?.length ?? 0} 屆</span>
        </div>

        {/* 新增屆次 */}
        <div className="mb-4">
          <EditionFormPanel raceId={race.id} />
        </div>

        {!editions?.length ? (
          <div className="rounded-xl border border-border bg-bg-card p-8 text-center">
            <p className="text-ink-3 text-sm">尚無屆次資料，請點上方「新增屆次」</p>
          </div>
        ) : (() => {
          // 依年份分組
          const byYear = editions.reduce<Record<number, typeof editions>>((acc, e) => {
            ;(acc[e.year] ??= []).push(e)
            return acc
          }, {})
          const years = Object.keys(byYear).map(Number).sort((a, b) => b - a)

          return (
            <div className="flex flex-col gap-4">
              {years.map(year => (
                <div key={year} className="rounded-xl border border-border bg-bg-card overflow-hidden">
                  {/* 年份標頭 */}
                  <div className="px-4 py-2.5 bg-bg-elev border-b border-border flex items-center gap-2">
                    <span className="text-sm font-semibold text-ink">{year}</span>
                    <span className="text-xs text-ink-4">{byYear[year][0].race_date}{byYear[year][0].race_date_end ? ` – ${byYear[year][0].race_date_end}` : ''}</span>
                  </div>
                  {/* 該年的各距離 */}
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border text-ink-3 text-xs">
                        <th className="px-4 py-2 text-left">距離</th>
                        <th className="px-4 py-2 text-left">游泳</th>
                        <th className="px-4 py-2 text-right">完賽／出發</th>
                        <th className="px-4 py-2 text-left">備註</th>
                      </tr>
                    </thead>
                    <tbody>
                      {byYear[year].map(e => (
                        <tr key={e.id} className="border-b border-border last:border-0">
                          <td className="px-4 py-3">
                            <span className="text-accent font-medium">{DISTANCE_LABEL[e.distance_category] ?? e.distance_category}</span>
                            <p className="text-xs text-ink-4">
                              {[
                                e.swim_distance_m  ? `${e.swim_distance_m}m`  : null,
                                e.bike_distance_km ? `${e.bike_distance_km}km` : null,
                                e.run_distance_km  ? `${e.run_distance_km}km`  : null,
                              ].filter(Boolean).join(' / ')}
                            </p>
                          </td>
                          <td className="px-4 py-3 text-xs text-ink-3">
                            {e.swim_type ? SWIM_LABEL[e.swim_type] : '—'}
                          </td>
                          <td className="px-4 py-3 text-right text-xs text-ink-3">
                            {e.finisher_count != null
                              ? `${e.finisher_count} / ${e.total_starters ?? '?'}`
                              : '—'}
                          </td>
                          <td className="px-4 py-3 text-xs text-ink-4 max-w-[180px] truncate">
                            {e.notes || '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ))}
            </div>
          )
        })()}
      </section>
    </main>
  )
}
