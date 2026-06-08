import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { RaceInterestButtons } from '@/components/races/RaceInterestButtons'

const DISTANCE_LABEL: Record<string, string> = {
  sprint: 'Sprint', olympic: '51.5', '70.3': '113', full: '226',
}
const DISTANCE_ORDER: Record<string, number> = {
  full: 0, '70.3': 1, olympic: 2, sprint: 3,
}
const STATUS_LABEL: Record<string, string> = {
  active: '運作中', inactive: '已停辦', cancelled: '已取消',
}

export async function generateMetadata(
  { params }: { params: Promise<{ slug: string }> }
): Promise<Metadata> {
  const { slug } = await params
  const supabase = await createClient()
  const { data } = await supabase.from('races').select('name, name_zh').eq('slug', slug).single()
  const title = data ? (data.name_zh ?? data.name) : '賽事'
  return { title: `${title} · Tri·log` }
}

export default async function RaceDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const isLoggedIn = !!user

  const { data: race } = await supabase
    .from('races')
    .select('id, name, name_zh, slug, series, status, country, county, city, organizer, website')
    .eq('slug', slug)
    .single()

  if (!race) notFound()

  const { data: editionsRaw } = await supabase
    .from('race_editions')
    .select('id, year, distance_category, race_date, race_date_end, finisher_count, notes')
    .eq('race_id', race.id)
    .order('race_date', { ascending: false })

  const editions = editionsRaw ?? []
  const currentYear = new Date().getFullYear()

  // 依年份分組
  const byYear: Record<number, { distances: string[]; finisher_count: number | null; race_date: string | null; notes: string | null }> = {}
  for (const e of editions) {
    if (!byYear[e.year]) byYear[e.year] = { distances: [], finisher_count: e.finisher_count, race_date: e.race_date, notes: e.notes }
    byYear[e.year].distances.push(e.distance_category)
  }
  for (const y of Object.keys(byYear)) {
    byYear[Number(y)].distances.sort((a, b) => (DISTANCE_ORDER[a] ?? 9) - (DISTANCE_ORDER[b] ?? 9))
  }
  const yearGroups = Object.keys(byYear).map(Number).sort((a, b) => b - a)
    .map(year => ({ year, ...byYear[year] }))

  // 使用者 interests
  type IKey = string
  let wishlistSet = new Set<IKey>()
  let attendedSet = new Set<IKey>()
  if (user) {
    const { data } = await supabase
      .from('race_interest')
      .select('race_id, year, interest_type')
      .eq('athlete_id', user.id)
      .eq('race_id', race.id)
    wishlistSet = new Set((data ?? []).filter(i => i.interest_type === 'wishlist').map(i => `${i.race_id}:${i.year}`))
    attendedSet = new Set((data ?? []).filter(i => i.interest_type === 'attended').map(i => `${i.race_id}:${i.year}`))
  }

  // 計數
  const { data: countsRaw } = await supabase
    .from('race_interest')
    .select('race_id, year, interest_type')
    .eq('race_id', race.id)
  const counts: Record<IKey, { wishlist: number; attended: number }> = {}
  for (const row of countsRaw ?? []) {
    const key = `${row.race_id}:${row.year}`
    if (!counts[key]) counts[key] = { wishlist: 0, attended: 0 }
    if (row.interest_type === 'wishlist') counts[key].wishlist++
    else if (row.interest_type === 'attended') counts[key].attended++
  }

  return (
    <main className="flex-1 p-6 max-w-4xl mx-auto w-full">
      {/* Breadcrumb */}
      <div className="mb-6 flex items-center gap-2 text-sm text-ink-4">
        <Link href="/races" className="hover:text-accent transition">賽事</Link>
        <span>/</span>
        <span className="text-ink">{race.name_zh ?? race.name}</span>
      </div>

      {/* 賽事基本資料 */}
      <section className="mb-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-ink leading-tight">{race.name_zh ?? race.name}</h1>
            {race.name_zh && <p className="text-sm text-ink-4 mt-0.5">{race.name}</p>}
            <div className="mt-2 flex items-center gap-3 text-sm text-ink-3">
              {[race.county, race.city, race.country].filter(Boolean).join('・')}
              {race.organizer && <span className="text-ink-4">by {race.organizer}</span>}
            </div>
          </div>
          <div className="flex flex-col items-end gap-2 flex-shrink-0">
            <span className={`text-xs px-2 py-0.5 rounded-full border ${
              race.status === 'active' ? 'border-good/30 text-good' : 'border-border-strong text-ink-4'
            }`}>
              {STATUS_LABEL[race.status] ?? race.status}
            </span>
            {race.website && (
              <a href={race.website} target="_blank" rel="noopener noreferrer"
                className="text-xs text-accent hover:underline">
                官方網站 ↗
              </a>
            )}
          </div>
        </div>
      </section>

      {/* 屆次列表 */}
      <section>
        <h2 className="text-base font-semibold text-ink mb-3">
          歷屆紀錄
          <span className="ml-2 text-xs font-normal text-ink-4">{yearGroups.length} 屆</span>
        </h2>

        {yearGroups.length === 0 ? (
          <div className="rounded-xl border border-border bg-bg-card p-8 text-center">
            <p className="text-sm text-ink-3">尚無屆次資料</p>
          </div>
        ) : (
          <div className="rounded-xl border border-border bg-bg-card overflow-hidden">
            {yearGroups.map(({ year, distances, finisher_count, race_date, notes }, i) => {
              const key = `${race.id}:${year}`
              return (
                <div key={year} className={`px-5 py-4 flex items-center gap-4 ${
                  i < yearGroups.length - 1 ? 'border-b border-border' : ''
                }`}>
                  {/* 年份 */}
                  <span className="font-mono font-bold text-lg text-ink w-14 flex-shrink-0">{year}</span>

                  {/* 距離 tags */}
                  <div className="flex items-center gap-1.5 flex-wrap flex-1">
                    {distances.map(d => (
                      <span key={d} className="text-xs font-mono px-2 py-0.5 rounded bg-bg-elev text-ink-3">
                        {DISTANCE_LABEL[d] ?? d}
                      </span>
                    ))}
                    {race_date && (
                      <span className="text-xs text-ink-4 ml-1">
                        {new Date(race_date).toLocaleDateString('zh-TW', { month: 'long', day: 'numeric' })}
                      </span>
                    )}
                    {finisher_count != null && finisher_count > 0 && (
                      <span className="text-xs text-ink-4">{finisher_count.toLocaleString()} 人完賽</span>
                    )}
                  </div>

                  {/* 互動按鈕 */}
                  <div className="flex-shrink-0">
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
                </div>
              )
            })}
          </div>
        )}
      </section>
    </main>
  )
}
