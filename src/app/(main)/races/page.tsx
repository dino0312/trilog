import type { Metadata } from 'next'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

export const metadata: Metadata = { title: '賽事資料庫' }

/* 距離標示 */
const DISTANCE_LABEL: Record<string, string> = {
  sprint:  'Sprint',
  olympic: '51.5',
  '70.3':  '113',
  full:    '226',
}

const DISTANCE_ORDER: Record<string, number> = {
  full: 0, '70.3': 1, olympic: 2, sprint: 3,
}

/* DB series → 顯示群組 key（IRONMAN_TAIWAN / IRONMAN_70_3 合併為 IRONMAN）*/
const SERIES_GROUP: Record<string, string> = {
  IRONMAN_TAIWAN: 'IRONMAN',
  IRONMAN_70_3:   'IRONMAN',
  CHALLENGE:      'CHALLENGE',
  PUYUMA:         'PUYUMA',
  CTTA_NATIONALS: 'CTTA_NATIONALS',
  FORCE:          'FORCE',
  LOCAL_EVENT:    'LOCAL_EVENT',
}

/* 群組顯示名稱 */
const GROUP_LABEL: Record<string, string> = {
  IRONMAN:        'IRONMAN',
  CHALLENGE:      'Challenge',
  PUYUMA:         '普悠瑪',
  CTTA_NATIONALS: '全國錦標賽',
  FORCE:          'FORCE',
  LOCAL_EVENT:    '地方賽事',
}

const GROUP_COLOR: Record<string, string> = {
  IRONMAN:        'border-[#FF6B3D]/40 text-[#FF6B3D]',
  CHALLENGE:      'border-[#22C9C9]/40 text-[#22C9C9]',
  PUYUMA:         'border-[#A8E063]/40 text-[#A8E063]',
  CTTA_NATIONALS: 'border-border-strong text-ink-3',
  FORCE:          'border-[#F5C842]/40 text-[#F5C842]',
  LOCAL_EVENT:    'border-border-strong text-ink-4',
}

export default async function RacesPage() {
  const supabase = await createClient()

  const { data: races } = await supabase
    .from('races')
    .select(`
      id, name, name_zh, slug, series, status,
      county, city, website,
      race_editions (
        year, distance_category, race_date
      )
    `)
    .eq('status', 'active')
    .order('name')

  if (!races) return null

  // 整理每個 race：最近年份、涵蓋距離（去重排序）
  const enriched = races.map(race => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const editions = ((race as any).race_editions ?? []) as {
      year: number; distance_category: string; race_date: string
    }[]

    const latestYear = editions.length
      ? Math.max(...editions.map(e => e.year))
      : null

    const distances = [...new Set(editions.map(e => e.distance_category))]
      .sort((a, b) => (DISTANCE_ORDER[a] ?? 9) - (DISTANCE_ORDER[b] ?? 9))

    const editionYears = [...new Set(editions.map(e => e.year))].sort((a, b) => b - a)

    return { ...race, latestYear, distances, editionYears }
  })

  // 依群組分組（IRONMAN_TAIWAN + IRONMAN_70_3 → IRONMAN）
  const groups: Record<string, typeof enriched> = {}
  const ORDER = ['IRONMAN', 'CHALLENGE', 'PUYUMA', 'FORCE', 'CTTA_NATIONALS', 'LOCAL_EVENT']
  for (const race of enriched) {
    const key = SERIES_GROUP[race.series ?? ''] ?? 'LOCAL_EVENT'
    if (!groups[key]) groups[key] = []
    groups[key].push(race)
  }

  const sortedKeys = [
    ...ORDER.filter(k => groups[k]),
    ...Object.keys(groups).filter(k => !ORDER.includes(k)),
  ]

  return (
    <main className="flex-1 p-6 max-w-4xl mx-auto w-full">

      <div className="mb-6 flex items-center justify-between">
        <p className="text-sm text-ink-4">
          {races.length} 個賽事系列 · {enriched.reduce((s, r) => s + r.editionYears.length, 0)} 個屆次
        </p>
      </div>

      <div className="space-y-8">
        {sortedKeys.map(seriesKey => (
          <section key={seriesKey}>
            {/* 系列標頭 */}
            <div className="flex items-center gap-3 mb-3">
              <span className={`text-xs px-2.5 py-0.5 rounded-full border font-mono tracking-wide ${GROUP_COLOR[seriesKey] ?? 'border-border text-ink-4'}`}>
                {GROUP_LABEL[seriesKey] ?? seriesKey}
              </span>
              <span className="text-xs text-ink-4">{groups[seriesKey].length} 個賽事</span>
            </div>

            {/* 賽事卡片 */}
            <div className="grid gap-3">
              {groups[seriesKey].map(race => (
                <div
                  key={race.id}
                  className="rounded-xl border border-border bg-bg-card p-4 hover:bg-bg-elev/40 transition"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      {/* 名稱 */}
                      <p className="font-semibold text-ink text-sm leading-tight">
                        {race.name_zh ?? race.name}
                      </p>
                      {race.name_zh && race.name && (
                        <p className="text-xs text-ink-4 mt-0.5">{race.name}</p>
                      )}

                      {/* 地點 */}
                      <p className="mt-1.5 text-xs text-ink-3 flex items-center gap-1">
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                          <circle cx="12" cy="10" r="3"/>
                        </svg>
                        {[race.county, race.city].filter(Boolean).join(' ')}
                      </p>

                      {/* 距離 + 屆次年份 */}
                      <div className="mt-2 flex flex-wrap items-center gap-1.5">
                        {race.distances.map(d => (
                          <span key={d} className="text-xs font-mono px-1.5 py-0.5 rounded bg-bg-elev text-ink-3">
                            {DISTANCE_LABEL[d] ?? d}
                          </span>
                        ))}
                        {race.editionYears.slice(0, 5).map(y => (
                          <span key={y} className="text-xs font-mono text-ink-4">{y}</span>
                        ))}
                        {race.editionYears.length > 5 && (
                          <span className="text-xs text-ink-4">+{race.editionYears.length - 5}</span>
                        )}
                      </div>
                    </div>

                    {/* 最近年份 */}
                    <div className="flex-shrink-0 text-right">
                      {race.latestYear && (
                        <span className="text-2xl font-mono font-bold text-ink-4">
                          {race.latestYear}
                        </span>
                      )}
                      {race.website && (
                        <a
                          href={race.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-1 block text-xs text-ink-4 hover:text-accent transition"
                        >
                          官網 ↗
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>

      {/* Phase 2 預告 */}
      <div className="mt-10 rounded-xl border border-dashed border-border p-6 text-center">
        <p className="text-sm text-ink-4">路線資訊、天氣資料、歷屆成績分佈 — 即將推出</p>
      </div>

    </main>
  )
}
