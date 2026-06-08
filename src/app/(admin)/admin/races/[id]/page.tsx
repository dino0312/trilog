import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { RaceEditForm } from './RaceEditForm'
import { EditionFormPanel } from './EditionFormPanel'
import { YearEditionBlock } from './YearEditionBlock'
import { DeleteRaceButton } from './DeleteRaceButton'

export const metadata: Metadata = { title: '賽事詳情 · Tri·log' }

const DISTANCE_LABEL: Record<string, string> = {
  sprint: 'Sprint', olympic: '51.5', '70.3': '113', full: '226',
}

export default async function RaceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: race } = await supabase
    .from('races')
    .select('id, name, slug, status, country, city, organizer, website, lat, lng')
    .eq('id', id)
    .single()

  if (!race) notFound()

  const { data: editions } = await supabase
    .from('race_editions')
    .select('id, year, race_date, race_date_end, distance_category, swim_distance_m, bike_distance_km, run_distance_km, swim_type, is_wetsuit_allowed, water_temp_c, weather_data, weather_source, finisher_count, dnf_count, total_starters, registration_url, results_url, notes')
    .eq('race_id', id)
    .order('race_date', { ascending: false })

  return (
    <main className="flex-1 p-6 max-w-4xl mx-auto w-full">
      {/* Breadcrumb */}
      <div className="mb-6 flex items-center gap-2 text-sm text-ink-4">
        <Link href="/admin/races" className="hover:text-accent transition">賽事管理</Link>
        <span>/</span>
        <span className="text-ink">{race.name}</span>
        <div className="ml-auto">
          <DeleteRaceButton raceId={race.id} raceName={race.name} />
        </div>
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
                <YearEditionBlock
                  key={year}
                  year={year}
                  editions={byYear[year]}
                  raceId={race.id}
                />
              ))}
            </div>
          )
        })()}
      </section>
    </main>
  )
}
