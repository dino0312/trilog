import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { RaceInterestButtons } from '@/components/races/RaceInterestButtons'
import { EditionResultsSection } from '@/components/races/EditionResultsSection'
import { RaceReportButton } from '@/components/reports/RaceReportButton'
import { RaceFollowButtons } from '@/components/races/RaceFollowButtons'
import { RaceEditionInfos } from '@/components/races/RaceEditionInfos'

const DISTANCE_LABEL: Record<string, string> = {
  sprint: 'Sprint', olympic: '51.5', '70.3': '113', full: '226',
}
const DISTANCE_ORDER: Record<string, number> = {
  full: 0, '70.3': 1, olympic: 2, sprint: 3,
}
const SWIM_TYPE_LABEL: Record<string, string> = {
  ocean: '海洋', lake: '湖泊', river: '河川', pool: '泳池', other: '其他',
}

export async function generateMetadata(
  { params }: { params: Promise<{ slug: string; year: string }> }
): Promise<Metadata> {
  const { slug, year } = await params
  const supabase = await createClient()
  const { data } = await supabase.from('races').select('name, name_zh').eq('slug', slug).single()
  const name = data ? (data.name_zh ?? data.name) : '賽事'
  return { title: `${name} ${year} · Tri·log` }
}

export default async function EditionPage({
  params,
}: {
  params: Promise<{ slug: string; year: string }>
}) {
  const { slug, year: yearStr } = await params
  const year = parseInt(yearStr)
  if (isNaN(year)) notFound()

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const isLoggedIn = !!user
  const currentYear = new Date().getFullYear()

  // 賽事基本資料
  const { data: race } = await supabase
    .from('races')
    .select('id, name, name_zh, slug, county, city')
    .eq('slug', slug)
    .single()
  if (!race) notFound()

  // 該年所有距離的屆次
  const { data: editionsRaw } = await supabase
    .from('race_editions')
    .select(`
      id, year, distance_category, race_date, race_date_end,
      venue, registration_url, results_url, notes,
      swim_distance_m, bike_distance_km, run_distance_km,
      swim_type, is_wetsuit_allowed, water_temp_c,
      weather_data, weather_source,
      finisher_count, dnf_count, total_starters
    `)
    .eq('race_id', race.id)
    .eq('year', year)
    .order('distance_category')

  const editions = (editionsRaw ?? []).sort(
    (a, b) => (DISTANCE_ORDER[a.distance_category] ?? 9) - (DISTANCE_ORDER[b.distance_category] ?? 9)
  )
  if (editions.length === 0) notFound()

  // 共用欄位取第一筆（同年各距離共用報名/場地/天氣）
  const primary = editions[0]
  const distances = editions.map(e => e.distance_category)

  // 天氣 JSON
  const wx = primary.weather_data as {
    temp_c?: number
    humidity_pct?: number
    wind_speed_ms?: number
    wind_direction?: string
    precipitation_mm?: number
  } | null

  // 使用者 interest
  let wishlistActive = false
  let attendedActive = false
  if (user) {
    const { data } = await supabase
      .from('race_interest')
      .select('interest_type')
      .eq('athlete_id', user.id)
      .eq('race_id', race.id)
      .eq('year', year)
    wishlistActive = (data ?? []).some(i => i.interest_type === 'wishlist')
    attendedActive = (data ?? []).some(i => i.interest_type === 'attended')
  }

  // 追蹤狀態（每個 edition 各一）— 取第一個 edition 的追蹤作為代表
  let initialFollow: { id: string; status: string } | null = null
  if (user && editions.length > 0) {
    const { data: followData } = await supabase
      .from('race_follows')
      .select('id, status')
      .eq('athlete_id', user.id)
      .eq('race_edition_id', editions[0].id)
      .maybeSingle()
    initialFollow = followData ?? null
  }

  // 計數
  const { data: countsRaw } = await supabase
    .from('race_interest')
    .select('interest_type')
    .eq('race_id', race.id)
    .eq('year', year)
  const wishlistCount = (countsRaw ?? []).filter(i => i.interest_type === 'wishlist').length
  const attendedCount = (countsRaw ?? []).filter(i => i.interest_type === 'attended').length

  // 成績列表
  const editionIds = editions.map(e => e.id)
  const { data: rawResults } = await supabase
    .from('results')
    .select(`
      id, total_seconds, athlete_id, athlete_name_snapshot,
      claim_status, overall_rank, curated_gender, race_edition_id,
      claim_tag_count,
      race_editions ( distance_category )
    `)
    .in('race_edition_id', editionIds)
    .eq('result_type', 'solo')
    .eq('is_public', true)
    .in('claim_status', ['unclaimed', 'claimed', 'unlinked'])
    .order('overall_rank', { ascending: true, nullsFirst: false })
    .order('total_seconds', { ascending: true })

  const editionResults = (rawResults ?? []).map(r => ({
    result_id:             r.id,
    total_seconds:         r.total_seconds,
    athlete_id:            r.athlete_id,
    athlete_name_snapshot: r.athlete_name_snapshot,
    claim_status:          r.claim_status,
    overall_rank:          r.overall_rank,
    curated_gender:        r.curated_gender,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    distance_category:     (r.race_editions as any)?.distance_category ?? '',
    claim_tag_count:       r.claim_tag_count ?? 0,
  }))

  // 登入者追蹤清單 + 已標記清單 + 姓名（供 ClaimButton 比對）
  let followingIds: string[] = []
  let myTaggedResultIds: string[] = []
  let userAthleteNameNormalized: string | null = null
  if (user) {
    const athleteIds = editionResults
      .filter(r => r.athlete_id)
      .map(r => r.athlete_id!)
      .filter((v, i, a) => a.indexOf(v) === i)

    const [followsRes, tagsRes, profileRes] = await Promise.all([
      athleteIds.length > 0
        ? supabase.from('athlete_follows').select('following_id').eq('follower_id', user.id).in('following_id', athleteIds)
        : Promise.resolve({ data: [] }),
      supabase.from('claim_tags').select('result_id').eq('tagged_by', user.id).in('result_id', editionResults.map(r => r.result_id)),
      supabase.from('athletes').select('name').eq('id', user.id).single(),
    ])
    followingIds = (followsRes.data ?? []).map((f: { following_id: string }) => f.following_id)
    myTaggedResultIds = (tagsRes.data ?? []).map((t: { result_id: string }) => t.result_id)
    if (profileRes.data?.name) {
      userAthleteNameNormalized = profileRes.data.name.trim().toLowerCase().replace(/\s+/g, '')
    }
  }

  // 日期格式化
  const formatDate = (d: string | null) =>
    d ? new Date(d).toLocaleDateString('zh-TW', { year: 'numeric', month: 'long', day: 'numeric' }) : null
  const dateStr = primary.race_date
    ? primary.race_date_end && primary.race_date_end !== primary.race_date
      ? `${formatDate(primary.race_date)} – ${formatDate(primary.race_date_end)}`
      : formatDate(primary.race_date)
    : null

  return (
    <main className="flex-1 p-6 max-w-3xl mx-auto w-full">
      {/* Breadcrumb */}
      <div className="mb-6 flex items-center gap-2 text-sm text-ink-4">
        <Link href="/races" className="hover:text-accent transition">賽事</Link>
        <span>/</span>
        <Link href={`/races/${slug}`} className="hover:text-accent transition">{race.name_zh ?? race.name}</Link>
        <span>/</span>
        <span className="text-ink">{year}</span>
      </div>

      {/* 標題列 */}
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-ink">
            {race.name_zh ?? race.name}
            <span className="ml-3 text-ink-4 font-mono">{year}</span>
          </h1>
          {dateStr && <p className="mt-1 text-sm text-ink-3">{dateStr}</p>}
        </div>
        <div className="flex flex-col items-end gap-2">
          <RaceInterestButtons
            raceId={race.id}
            year={year}
            isLoggedIn={isLoggedIn}
            initialWishlist={wishlistActive}
            initialAttended={attendedActive}
            wishlistCount={wishlistCount}
            attendedCount={attendedCount}
            showWishlist={year >= currentYear}
            showAttended={year <= currentYear}
          />
          {isLoggedIn && editions.length > 0 && (
            <RaceFollowButtons
              raceEditionId={editions[0].id}
              initialFollow={initialFollow as any}
              raceDate={editions[0].race_date}
            />
          )}
        </div>
      </div>

      {/* 資訊卡 */}
      <div className="rounded-xl border border-border bg-bg-card divide-y divide-border">

        {/* 距離 */}
        <Row label="距離">
          <div className="flex gap-2 flex-wrap">
            {distances.map(d => (
              <span key={d} className="text-xs font-mono px-2 py-0.5 rounded bg-bg-elev text-ink-3">
                {DISTANCE_LABEL[d] ?? d}
              </span>
            ))}
          </div>
        </Row>

        {/* 場地 */}
        {primary.venue && (
          <Row label="場地">{primary.venue}</Row>
        )}

        {/* 地點 */}
        {(race.county || race.city) && (
          <Row label="地點">{[race.county, race.city].filter(Boolean).join(' ')}</Row>
        )}

        {/* 報名 */}
        {primary.registration_url && (
          <Row label="報名">
            <a href={primary.registration_url} target="_blank" rel="noopener noreferrer"
              className="text-accent hover:underline text-sm">
              報名頁面 ↗
            </a>
          </Row>
        )}

        {/* 成績查詢 */}
        {primary.results_url && (
          <Row label="成績查詢">
            <a href={primary.results_url} target="_blank" rel="noopener noreferrer"
              className="text-accent hover:underline text-sm">
              官方成績 ↗
            </a>
          </Row>
        )}

        {/* 三項規格（每個距離各一列） */}
        {editions.map(e => (
          <Row key={e.id} label={`規格 ${DISTANCE_LABEL[e.distance_category] ?? e.distance_category}`}>
            <span className="text-sm text-ink-3">
              {[
                e.swim_distance_m ? `游泳 ${e.swim_distance_m} m` : null,
                e.bike_distance_km ? `騎車 ${e.bike_distance_km} km` : null,
                e.run_distance_km ? `跑步 ${e.run_distance_km} km` : null,
              ].filter(Boolean).join('　')}
            </span>
          </Row>
        ))}

        {/* 游泳環境 */}
        {(primary.swim_type || primary.is_wetsuit_allowed != null || primary.water_temp_c != null) && (
          <Row label="游泳">
            <span className="text-sm text-ink-3">
              {[
                primary.swim_type ? SWIM_TYPE_LABEL[primary.swim_type] ?? primary.swim_type : null,
                primary.water_temp_c != null ? `水溫 ${primary.water_temp_c}°C` : null,
                primary.is_wetsuit_allowed === true ? '允許防寒衣' :
                primary.is_wetsuit_allowed === false ? '禁止防寒衣' : null,
              ].filter(Boolean).join('　')}
            </span>
          </Row>
        )}

        {/* 天氣 */}
        {wx && (
          <Row label="賽事天氣">
            <span className="text-sm text-ink-3">
              {[
                wx.temp_c != null ? `${wx.temp_c}°C` : null,
                wx.humidity_pct != null ? `濕度 ${wx.humidity_pct}%` : null,
                wx.wind_speed_ms != null ? `風速 ${wx.wind_speed_ms} m/s${wx.wind_direction ? ` ${wx.wind_direction}` : ''}` : null,
                wx.precipitation_mm != null ? `降雨 ${wx.precipitation_mm} mm` : null,
              ].filter(Boolean).join('　')}
            </span>
          </Row>
        )}

        {/* 完賽人數 */}
        {(primary.finisher_count != null || primary.total_starters != null) && (
          <Row label="完賽">
            <span className="text-sm text-ink-3">
              {[
                primary.finisher_count != null ? `完賽 ${primary.finisher_count.toLocaleString()} 人` : null,
                primary.dnf_count != null && primary.dnf_count > 0 ? `未完賽 ${primary.dnf_count} 人` : null,
                primary.total_starters != null ? `起跑 ${primary.total_starters.toLocaleString()} 人` : null,
              ].filter(Boolean).join('　')}
            </span>
          </Row>
        )}

        {/* 備注 */}
        {primary.notes && (
          <Row label="備注">
            <span className="text-sm text-ink-3">{primary.notes}</span>
          </Row>
        )}

      </div>

      {/* 賽事資訊（社群貢獻） */}
      <div className="mt-6">
        <RaceEditionInfos raceEditionId={editions[0].id} isLoggedIn={isLoggedIn} />
      </div>

      {/* ④ 成績列表 */}
      <div className="mt-6 mb-4 text-center">
        <RaceReportButton raceId={race.id} />
      </div>

      <EditionResultsSection
        results={editionResults}
        currentUserId={user?.id ?? null}
        isLoggedIn={isLoggedIn}
        followingIds={followingIds}
        userAthleteNameNormalized={userAthleteNameNormalized}
        myTaggedResultIds={myTaggedResultIds}
      />

    </main>
  )
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-baseline gap-4 px-5 py-3.5">
      <span className="text-xs text-ink-4 w-20 flex-shrink-0">{label}</span>
      <div className="flex-1">{children}</div>
    </div>
  )
}
