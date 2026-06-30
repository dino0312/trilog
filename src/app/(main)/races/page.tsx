import type { Metadata } from 'next'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { RaceInterestButtons } from '@/components/races/RaceInterestButtons'

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
  IRONMAN_TAIWAN:  'IRONMAN',
  IRONMAN_70_3:    'IRONMAN',
  CHALLENGE:       'CHALLENGE',
  PUYUMA:          'PUYUMA',
  WANSAILEYUAN:    'WANSAILEYUAN',
  CTTA_NATIONALS:  'CTTA_NATIONALS',
  FORCE:           'FORCE',
  LOCAL_EVENT:     'LOCAL_EVENT',
}

/* 群組顯示名稱 */
const GROUP_LABEL: Record<string, string> = {
  IRONMAN:        'IRONMAN',
  CHALLENGE:      'Challenge',
  PUYUMA:         '普悠瑪',
  WANSAILEYUAN:   '玩賽樂園',
  CTTA_NATIONALS: '全國錦標賽',
  FORCE:          'FORCE',
  LOCAL_EVENT:    '地方賽事',
}

const GROUP_COLOR: Record<string, string> = {
  IRONMAN:        'border-[#FF6B3D]/40 text-[#FF6B3D]',
  CHALLENGE:      'border-[#22C9C9]/40 text-[#22C9C9]',
  PUYUMA:         'border-[#A8E063]/40 text-[#A8E063]',
  WANSAILEYUAN:   'border-[#C084FC]/40 text-[#C084FC]',
  CTTA_NATIONALS: 'border-border-strong text-ink-3',
  FORCE:          'border-[#F5C842]/40 text-[#F5C842]',
  LOCAL_EVENT:    'border-border-strong text-ink-4',
}

export default async function RacesPage() {
  const currentYear = new Date().getFullYear()
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const isLoggedIn = !!user

  // 登入者的 race_interest（以 race_id+year 為 key）
  type InterestKey = string  // `${race_id}:${year}`
  let wishlistSet = new Set<InterestKey>()
  let attendedSet = new Set<InterestKey>()
  if (user) {
    const { data } = await supabase
      .from('race_interest')
      .select('race_id, year, interest_type')
      .eq('athlete_id', user.id)
    wishlistSet = new Set((data ?? []).filter(i => i.interest_type === 'wishlist').map(i => `${i.race_id}:${i.year}`))
    attendedSet = new Set((data ?? []).filter(i => i.interest_type === 'attended').map(i => `${i.race_id}:${i.year}`))
  }

  // 所有人計數（按 race_id+year+type 分組）
  const { data: countsRaw } = await supabase
    .from('race_interest')
    .select('race_id, year, interest_type')
  const counts: Record<InterestKey, { wishlist: number; attended: number }> = {}
  for (const row of countsRaw ?? []) {
    const key = `${row.race_id}:${row.year}`
    if (!counts[key]) counts[key] = { wishlist: 0, attended: 0 }
    if (row.interest_type === 'wishlist') counts[key].wishlist++
    else if (row.interest_type === 'attended') counts[key].attended++
  }

  const { data: races } = await supabase
    .from('races')
    .select(`
      id, name, name_zh, slug, series, status,
      country, county, city, website,
      race_editions (
        id, year, distance_category, race_date, weather_data
      )
    `)
    .eq('status', 'active')
    .order('name')

  if (!races) return null

  // 整理每個 race：最近年份、按年份分組的屆次
  const enriched = races.map(race => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const editions = ((race as any).race_editions ?? []) as {
      id: string; year: number; distance_category: string; race_date: string
      weather_data: { temp_c: number; humidity_pct: number; wind_speed_ms: number; precipitation_mm: number } | null
    }[]

    const latestYear = editions.length
      ? Math.max(...editions.map(e => e.year))
      : null

    // 依年份分組，同年的距離收在一起
    const byYear: Record<number, { distances: string[]; race_date: string | null; weather_data: { temp_c: number; precipitation_mm: number } | null }> = {}
    for (const e of editions) {
      if (!byYear[e.year]) byYear[e.year] = { distances: [], race_date: e.race_date ?? null, weather_data: null }
      byYear[e.year].distances.push(e.distance_category)
      if (!byYear[e.year].weather_data && e.weather_data) {
        byYear[e.year].weather_data = { temp_c: e.weather_data.temp_c, precipitation_mm: e.weather_data.precipitation_mm }
      }
    }
    // 距離排序
    for (const y of Object.keys(byYear)) {
      byYear[Number(y)].distances.sort((a, b) => (DISTANCE_ORDER[a] ?? 9) - (DISTANCE_ORDER[b] ?? 9))
    }
    const yearGroups = Object.keys(byYear).map(Number).sort((a, b) => b - a)
      .map(year => ({ year, ...byYear[year] }))

    return { ...race, latestYear, yearGroups }
  })

  // 依群組分組（IRONMAN_TAIWAN + IRONMAN_70_3 → IRONMAN）
  const groups: Record<string, typeof enriched> = {}
  const ORDER = ['CHALLENGE', 'IRONMAN', 'PUYUMA', 'FORCE', 'CTTA_NATIONALS', 'LOCAL_EVENT', 'WANSAILEYUAN']
  for (const race of enriched) {
    const key = SERIES_GROUP[race.series ?? ''] ?? 'LOCAL_EVENT'
    if (!groups[key]) groups[key] = []
    groups[key].push(race)
  }

  const sortedKeys = [
    ...ORDER.filter(k => groups[k]),
    ...Object.keys(groups).filter(k => !ORDER.includes(k)),
  ]

  // 各群組內：台灣（country = 'TW'）優先，其次依名稱排
  for (const key of sortedKeys) {
    groups[key].sort((a, b) => {
      const aTW = a.country === 'TWN' ? 0 : 1
      const bTW = b.country === 'TWN' ? 0 : 1
      if (aTW !== bTW) return aTW - bTW
      return (a.name_zh ?? a.name).localeCompare(b.name_zh ?? b.name, 'zh-Hant')
    })
  }

  return (
    <main className="flex-1 p-6 max-w-4xl mx-auto w-full">

      <div className="mb-6 flex items-center justify-between">
        <p className="text-sm text-ink-4">
          {races.length} 個賽事系列 · {enriched.reduce((s, r) => s + r.yearGroups.length, 0)} 個屆次
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
                      {/* 名稱（連到詳情頁） */}
                      <Link href={`/races/${race.slug}`} className="hover:text-accent transition">
                        <p className="font-semibold text-ink text-sm leading-tight">
                          {race.name_zh ?? race.name}
                        </p>
                      </Link>
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

                    </div>

                    {/* 最近年份 + 官網 */}
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

                  {/* 屆次列表（年份分組，同年多距離顯示為 tag） */}
                  {race.yearGroups.length > 0 && (
                    <div className="mt-3 border-t border-border/50 pt-2.5 flex flex-col gap-1.5">
                      {race.yearGroups.map(({ year, distances, race_date, weather_data }) => {
                        const key = `${race.id}:${year}`
                        const dateStr = race_date
                          ? new Date(race_date).toLocaleDateString('zh-TW', { month: 'numeric', day: 'numeric' })
                          : null
                        return (
                          <div key={year} className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-xs font-mono text-ink-3">
                                {year}{dateStr && <span className="text-ink-4"> · {dateStr}</span>}
                              </span>
                              {distances.map(d => (
                                <span key={d} className="text-xs font-mono px-1.5 py-0.5 rounded bg-bg-elev text-ink-4">
                                  {DISTANCE_LABEL[d] ?? d}
                                </span>
                              ))}
                              {weather_data && (
                                <span className="text-xs text-ink-4 flex items-center gap-1">
                                  <span>{weather_data.temp_c}°C</span>
                                  {weather_data.precipitation_mm > 0 && (
                                    <span className="text-swim">☂ {weather_data.precipitation_mm}mm</span>
                                  )}
                                </span>
                              )}
                            </div>
                            <RaceInterestButtons
                              raceId={race.id}
                              year={year}
                              isLoggedIn={isLoggedIn}
                              initialWishlist={wishlistSet.has(key)}
                              initialAttended={attendedSet.has(key)}
                              wishlistCount={counts[key]?.wishlist ?? 0}
                              attendedCount={counts[key]?.attended ?? 0}
                              showWishlist={year >= currentYear}
                              showAttended={year <= currentYear}
                            />
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>

    </main>
  )
}
