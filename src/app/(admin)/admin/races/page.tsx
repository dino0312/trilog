import type { Metadata } from 'next'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { RaceFormPanel } from './RaceFormPanel'
import { RacePicker } from './RacePicker'
import { RaceEditForm } from './[id]/RaceEditForm'
import { EditionFormPanel } from './[id]/EditionFormPanel'
import { YearEditionBlock } from './[id]/YearEditionBlock'
import { DeleteRaceButton } from './[id]/DeleteRaceButton'

export const metadata: Metadata = { title: '賽事管理 · Tri·log' }

const STATUS_LABEL: Record<string, string> = {
  active:    '運作中',
  inactive:  '已停辦',
  cancelled: '已取消',
}

export default async function AdminRacesPage({
  searchParams,
}: {
  searchParams: Promise<{ raceId?: string }>
}) {
  const { raceId } = await searchParams
  const supabase = await createClient()

  const { data: races } = await supabase
    .from('races')
    .select(`
      id, name, slug, status, country, city, organizer, website, created_at,
      race_editions ( id )
    `)
    .order('name')

  // 若有選定賽事，載入其完整資料與屆次
  let selectedRace: {
    id: string; name: string; slug: string; status: string; series: string | null
    country: string | null; city: string | null; organizer: string | null
    website: string | null; lat: number | null; lng: number | null
  } | null = null

  let editions: {
    id: string; year: number; race_date: string; race_date_end: string | null
    distance_category: string; swim_distance_m: number | null
    bike_distance_km: number | null; run_distance_km: number | null
    swim_type: string | null; is_wetsuit_allowed: boolean | null
    water_temp_c: number | null; weather_data: Record<string, unknown> | null
    weather_source: string | null; finisher_count: number | null
    dnf_count: number | null; total_starters: number | null
    registration_url: string | null; results_url: string | null; notes: string | null
  }[] | null = null

  if (raceId) {
    const [{ data: raceData }, { data: editionData }] = await Promise.all([
      supabase
        .from('races')
        .select('id, name, slug, status, series, country, city, organizer, website, lat, lng')
        .eq('id', raceId)
        .single(),
      supabase
        .from('race_editions')
        .select('id, year, race_date, race_date_end, distance_category, swim_distance_m, bike_distance_km, run_distance_km, swim_type, is_wetsuit_allowed, water_temp_c, weather_data, weather_source, finisher_count, dnf_count, total_starters, registration_url, results_url, notes')
        .eq('race_id', raceId)
        .order('race_date', { ascending: false }),
    ])
    selectedRace = raceData
    editions = editionData
  }

  const pickerRaces = (races ?? []).map(r => ({ id: r.id, name: r.name, city: r.city }))

  // 依年份分組
  const byYear = (editions ?? []).reduce<Record<number, NonNullable<typeof editions>>>((acc, e) => {
    ;(acc[e.year] ??= []).push(e)
    return acc
  }, {})
  const years = Object.keys(byYear).map(Number).sort((a, b) => b - a)

  return (
    <main className="flex-1 p-6 max-w-4xl mx-auto w-full">
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-ink">賽事管理</h1>
          <p className="mt-0.5 text-sm text-ink-3">系列賽與屆次資料維護</p>
        </div>
      </div>

      {/* 新增系列賽 */}
      <RaceFormPanel />

      {/* 屆次管理 */}
      <section className="mt-8">
        <h2 className="text-base font-semibold text-ink mb-4">屆次管理</h2>

        <RacePicker races={pickerRaces} selectedId={raceId ?? null} />

        {selectedRace && (
          <div className="mt-6 flex flex-col gap-6">
            {/* 系列賽基本資料 */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-ink-2">系列賽資料</h3>
                <DeleteRaceButton raceId={selectedRace.id} raceName={selectedRace.name} />
              </div>
              <div className="rounded-xl border border-border bg-bg-card p-5">
                <RaceEditForm race={selectedRace} />
              </div>
            </div>

            {/* 屆次列表 */}
            <div>
              <div className="flex items-center gap-3 mb-3">
                <h3 className="text-sm font-semibold text-ink-2">屆次紀錄</h3>
                <span className="text-xs text-ink-4">{editions?.length ?? 0} 屆</span>
              </div>

              <div className="mb-4">
                <EditionFormPanel raceId={selectedRace.id} />
              </div>

              {years.length === 0 ? (
                <div className="rounded-xl border border-border bg-bg-card p-8 text-center">
                  <p className="text-ink-3 text-sm">尚無屆次資料，請點上方「新增屆次」</p>
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  {years.map(year => (
                    <YearEditionBlock
                      key={year}
                      year={year}
                      editions={byYear[year]}
                      raceId={selectedRace!.id}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </section>

      {/* 所有系列賽一覽 */}
      <section className="mt-10">
        <h2 className="text-base font-semibold text-ink mb-4">
          所有系列賽
          <span className="ml-2 text-xs font-normal text-ink-4">{races?.length ?? 0} 個</span>
        </h2>

        {!races?.length ? (
          <div className="rounded-xl border border-border bg-bg-card p-8 text-center">
            <p className="text-ink-3 text-sm">尚無系列賽資料</p>
          </div>
        ) : (
          <div className="rounded-xl border border-border bg-bg-card overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-ink-3 text-xs">
                  <th className="px-4 py-3 text-left">系列名稱</th>
                  <th className="px-4 py-3 text-left">地點</th>
                  <th className="px-4 py-3 text-left">主辦</th>
                  <th className="px-4 py-3 text-center">屆次</th>
                  <th className="px-4 py-3 text-center">狀態</th>
                  <th className="px-4 py-3 text-right">操作</th>
                </tr>
              </thead>
              <tbody>
                {races.map(race => {
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  const editionCount = (race.race_editions as any as { id: string }[])?.length ?? 0
                  const isSelected = race.id === raceId
                  return (
                    <tr key={race.id} className={`border-b border-border last:border-0 transition ${isSelected ? 'bg-accent/5' : 'hover:bg-bg-elev/30'}`}>
                      <td className="px-4 py-3">
                        <p className="font-medium text-ink">{race.name}</p>
                        <p className="text-xs text-ink-4 font-mono">{race.slug}</p>
                      </td>
                      <td className="px-4 py-3 text-ink-3 text-xs">
                        {[race.city, race.country].filter(Boolean).join('，') || '—'}
                      </td>
                      <td className="px-4 py-3 text-ink-3 text-xs">
                        {race.organizer || '—'}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="font-mono text-accent">{editionCount}</span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`text-xs px-2 py-0.5 rounded-full border whitespace-nowrap ${
                          race.status === 'active'
                            ? 'border-good/30 text-good'
                            : 'border-border-strong text-ink-4'
                        }`}>
                          {STATUS_LABEL[race.status] ?? race.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        {isSelected ? (
                          <span className="text-xs text-accent font-semibold">管理中</span>
                        ) : (
                          <Link
                            href={`/admin/races?raceId=${race.id}`}
                            className="text-xs text-accent hover:underline"
                          >
                            管理 →
                          </Link>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  )
}
