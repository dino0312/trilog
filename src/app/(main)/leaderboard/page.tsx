import type { Metadata } from 'next'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { secondsToTime } from '@/lib/utils/time'
import { DistanceTabs } from '@/components/leaderboard/DistanceTabs'
import { FollowButton } from '@/components/athletes/FollowButton'

export const metadata: Metadata = { title: '最速榜 · Tri·log' }

// Sub 分界線門檻（秒）
const SUB: Record<string, { M: number; F: number }> = {
  full:    { M: 36000, F: 36000 },  // Sub 10
  '70.3':  { M: 18000, F: 19800 },  // Sub 5 / Sub 5.5
  olympic: { M:  7200, F:  9000 },  // Sub 2 / Sub 2.5
  sprint:  { M:  3600, F:  4320 },  // Sub 1 / Sub 1.2
}

const DISTANCE_TITLE: Record<string, string> = {
  full: '226', '70.3': '113', olympic: '51.5', sprint: 'Sprint',
}

const DISTANCE_LABEL: Record<string, string> = {
  full: '226 全距離', '70.3': '113 半程', olympic: '51.5 奧林匹克', sprint: '25.75 衝刺',
}

type Entry = {
  result_id:          string
  total_seconds:      number
  display_name:       string | null
  athlete_id:         string | null
  race_name:          string
  edition_year:       number
  race_date:          string | null
  claim_status:       string
  source_credibility: string
  claim_tag_count:    number
}

/** Best-per-athlete 去重：同一選手只取最快一筆 */
function deduplicateBest(entries: Entry[]): Entry[] {
  const best = new Map<string, Entry>()
  for (const e of entries) {
    // key：有帳號用 athlete_id，未認領用 display_name
    const key = e.athlete_id ?? `__unclaimed__${e.display_name}`
    const prev = best.get(key)
    if (!prev || e.total_seconds < prev.total_seconds) {
      best.set(key, e)
    }
  }
  return Array.from(best.values()).sort((a, b) => a.total_seconds - b.total_seconds)
}

function RankBadge({ rank }: { rank: number }) {
  if (rank === 1) return <span style={{ color: '#F5C842', fontSize: 17, fontFamily: 'var(--font-dm)', fontWeight: 500 }}>1</span>
  if (rank === 2) return <span style={{ color: '#A0A0A0', fontSize: 16, fontFamily: 'var(--font-dm)' }}>2</span>
  if (rank === 3) return <span style={{ color: '#CD9660', fontSize: 16, fontFamily: 'var(--font-dm)' }}>3</span>
  return <span style={{ color: 'var(--ink-3)', fontSize: 14, fontFamily: 'var(--font-dm)' }}>{rank}</span>
}

function TimeCell({ seconds, rank, gender }: { seconds: number; rank: number; gender: 'M' | 'F'; distance: string }) {
  let color = 'var(--ink)'
  if (gender === 'M') {
    if (rank === 1) color = '#F5C842'
  } else {
    if (rank === 1) color = '#E870A0'
    else color = '#D4537E'
  }
  // sub 10 / sub 5 等用橘色（男子，非第一名）
  if (gender === 'M' && rank > 1) color = '#FF6B3D'

  return (
    <span style={{ color, fontFamily: 'var(--font-dm)', fontSize: 17, fontWeight: 500, letterSpacing: '0.02em' }}>
      {secondsToTime(seconds)}
    </span>
  )
}

function GenderSection({
  entries, gender, updatedAt, distance, currentUserId, followingIds, isLoggedIn,
}: {
  entries: Entry[]
  gender: 'M' | 'F'
  updatedAt: string
  distance: string
  currentUserId: string | null
  followingIds: Set<string>
  isLoggedIn: boolean
}) {
  const label      = gender === 'M' ? '男子組' : '女子組'
  const labelColor = gender === 'M' ? '#22C9C9' : '#D4537E'
  const threshold  = SUB[distance]?.[gender] ?? Infinity
  let   crossed    = false

  return (
    <>
      {/* 性別標頭 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '16px 24px 12px' }}>
        <span style={{
          fontFamily: 'var(--font-dm)', fontSize: 13, letterSpacing: '0.12em',
          color: labelColor, borderLeft: `2px solid ${labelColor}`, paddingLeft: 10,
        }}>{label}</span>
        <span style={{ fontFamily: 'var(--font-dm)', fontSize: 11, color: 'var(--ink-3)', marginLeft: 'auto' }}>
          {entries.length} 人
        </span>
      </div>

      {entries.map((e, i) => {
        const rank        = i + 1
        const showDivider = !crossed && e.total_seconds >= threshold
        if (showDivider) crossed = true

        return (
          <div key={e.result_id}>
            {showDivider && (
              <div style={{ height: 1, background: 'rgba(255,255,255,0.06)', margin: '4px 0' }} />
            )}
            <div className="tlb-row" style={{
              display: 'grid',
              alignItems: 'center',
              padding: '12px 24px',
              borderTop: '1px solid rgba(255,255,255,0.05)',
              cursor: 'pointer',
            }}>
              <div><RankBadge rank={rank} /></div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                {e.athlete_id && e.claim_status === 'claimed' ? (
                  <Link
                    href={`/athletes/${e.athlete_id}`}
                    style={{
                      fontSize: 15, fontWeight: 500,
                      color: 'var(--ink)',
                      whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                      fontFamily: "'Noto Sans TC', sans-serif",
                      textDecoration: 'none',
                    }}
                    className="hover:text-accent transition-colors"
                  >
                    {e.display_name ?? '—'}
                  </Link>
                ) : (
                  <span style={{
                    fontSize: 15, fontWeight: 500,
                    color: e.claim_status === 'unclaimed' ? 'var(--ink-3)' : 'var(--ink)',
                    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                    fontFamily: "'Noto Sans TC', sans-serif",
                  }}>
                    {e.display_name ?? '—'}
                  </span>
                )}
                {e.claim_status === 'unclaimed' && (
                  <span style={{
                    flexShrink: 0,
                    fontSize: 11, fontFamily: 'var(--font-dm)', letterSpacing: '0.1em',
                    color: 'var(--ink-3)', border: '1px solid var(--border)',
                    padding: '1px 6px', borderRadius: 100,
                  }}>未認領</span>
                )}
              </div>

              <div style={{ textAlign: 'right' }}>
                <TimeCell seconds={e.total_seconds} rank={rank} gender={gender} distance={distance} />
              </div>

              <div className="tlb-race" style={{
                fontSize: 13, color: 'var(--ink-3)', textAlign: 'right', paddingLeft: 12,
                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                fontFamily: 'var(--font-dm)',
              }}>
                {e.edition_year} {e.race_name}
              </div>

              {/* 追蹤按鈕（已認領且非自己） */}
              <div className="tlb-follow" style={{ display: 'flex', justifyContent: 'center' }}>
                {e.athlete_id && e.athlete_id !== currentUserId ? (
                  <FollowButton
                    athleteId={e.athlete_id}
                    athleteName={e.display_name ?? ''}
                    initialFollowing={followingIds.has(e.athlete_id)}
                    isLoggedIn={isLoggedIn}
                    size="sm"
                  />
                ) : null}
              </div>
            </div>
          </div>
        )
      })}
    </>
  )
}

type SearchParams = Promise<{ distance?: string }>

export default async function LeaderboardPage({ searchParams }: { searchParams: SearchParams }) {
  const { distance: rawDistance } = await searchParams
  const distance = rawDistance ?? 'full'

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // 取得追蹤列表（未登入則空）
  let followingIds = new Set<string>()
  if (user) {
    const { data: follows } = await supabase
      .from('athlete_follows')
      .select('following_id')
      .eq('follower_id', user.id)
    followingIds = new Set((follows ?? []).map(f => f.following_id))
  }

  const [{ data: maleRaw }, { data: femaleRaw }] = await Promise.all([
    supabase
      .from('leaderboard_entries')
      .select('result_id, total_seconds, display_name, athlete_id, race_name, edition_year, race_date, claim_status, source_credibility, claim_tag_count')
      .eq('distance_category', distance as 'sprint' | 'olympic' | '70.3' | 'full')
      .eq('gender', 'M')
      .order('total_seconds', { ascending: true })
      .limit(500),
    supabase
      .from('leaderboard_entries')
      .select('result_id, total_seconds, display_name, athlete_id, race_name, edition_year, race_date, claim_status, source_credibility, claim_tag_count')
      .eq('distance_category', distance as 'sprint' | 'olympic' | '70.3' | 'full')
      .eq('gender', 'F')
      .order('total_seconds', { ascending: true })
      .limit(500),
  ])

  const male   = deduplicateBest((maleRaw   ?? []) as Entry[])
  const female = deduplicateBest((femaleRaw ?? []) as Entry[])

  // 最新賽事日期作為「更新時間」
  const allDates = [...(maleRaw ?? []), ...(femaleRaw ?? [])]
    .map(e => e.race_date)
    .filter(Boolean)
    .sort()
  const updatedAt = allDates.length
    ? new Date(allDates[allDates.length - 1]!).toLocaleDateString('zh-TW', { year: 'numeric', month: '2-digit', day: '2-digit' }).replace(/\//g, '/')
    : '—'

  const distTitle = DISTANCE_TITLE[distance] ?? distance
  const distLabel = DISTANCE_LABEL[distance] ?? distance

  return (
    <main style={{ maxWidth: 860, margin: '0 auto', padding: 'clamp(1rem, 4vw, 2.5rem) clamp(1rem, 4vw, 2rem) 4rem' }}>
      <style>{`
        .tlb-row:hover { background: rgba(255,255,255,0.025); transition: background 0.1s; }
        .tlb-row { grid-template-columns: 36px minmax(0,1fr) 110px minmax(0,1fr) 32px; }
        .tlb-race { display: block; }
        .tlb-follow { display: flex; }
        @media (max-width: 600px) {
          .tlb-row { grid-template-columns: 36px minmax(0,1fr) 100px; }
          .tlb-race { display: none; }
          .tlb-follow { display: none; }
        }
      `}</style>

      {/* 頁面標題 */}
      <div style={{ padding: '1.5rem 0 1.5rem' }}>
        <p style={{
          fontFamily: 'var(--font-syne)', fontWeight: 800,
          fontSize: 'clamp(1.4rem, 3vw, 2.4rem)', color: 'var(--ink-3)',
          letterSpacing: '-0.03em', lineHeight: 1, marginBottom: 6,
        }}>
          台灣選手
        </p>
        <h1 style={{
          fontFamily: 'var(--font-syne)', fontWeight: 800,
          fontSize: 'clamp(2.8rem, 6vw, 4.5rem)', letterSpacing: '-0.03em',
          lineHeight: 1, color: 'var(--ink)',
        }}>
          最<span style={{ color: '#FF6B3D' }}>速</span>榜
        </h1>
      </div>

      {/* 最速榜卡片 */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 100%)',
        backdropFilter: 'blur(24px) saturate(160%)',
        WebkitBackdropFilter: 'blur(24px) saturate(160%)',
        border: '1px solid rgba(255,255,255,0.12)',
        borderTop: '1px solid rgba(255,255,255,0.2)',
        borderRadius: 20,
        overflow: 'hidden',
        boxShadow: '0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.1)',
      }}>

        {/* 英雄區 */}
        <div style={{ padding: '2rem 2rem 0', position: 'relative', overflow: 'hidden' }}>
          {/* 浮水印 */}
          <span aria-hidden style={{
            position: 'absolute', right: -8, top: -20,
            fontFamily: 'var(--font-syne)', fontWeight: 800, fontSize: 'clamp(60px, 30vw, 140px)',
            color: 'rgba(255,255,255,0.03)', lineHeight: 1,
            pointerEvents: 'none', userSelect: 'none', letterSpacing: -6,
          }}>{distTitle}</span>

          <div style={{
            fontFamily: 'var(--font-syne)', fontWeight: 800, fontSize: 'clamp(1.4rem, 8vw, 2.5rem)',
            color: 'var(--ink)', letterSpacing: '-0.03em', lineHeight: 1, marginBottom: 8,
          }}>
            {distLabel}
          </div>
          <div style={{
            fontSize: 13, color: 'var(--ink-3)', fontFamily: 'var(--font-dm)',
            letterSpacing: '0.04em', marginBottom: '1.5rem',
          }}>
            個人最佳 · 跨賽事 · 僅供參考
          </div>

          {/* 距離頁籤 */}
          <DistanceTabs current={distance} />
        </div>

        {/* 男子組 */}
        {male.length > 0 && (
          <GenderSection entries={male} gender="M" updatedAt={updatedAt} distance={distance}
            currentUserId={user?.id ?? null} followingIds={followingIds} isLoggedIn={!!user} />
        )}

        {male.length === 0 && female.length === 0 && (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--ink-3)', fontFamily: 'var(--font-dm)' }}>
            尚無成績資料
          </div>
        )}

        {/* 性別分隔 */}
        {male.length > 0 && female.length > 0 && (
          <div style={{ height: 8, background: 'rgba(255,255,255,0.02)' }} />
        )}

        {/* 女子組 */}
        {female.length > 0 && (
          <GenderSection entries={female} gender="F" updatedAt={updatedAt} distance={distance}
            currentUserId={user?.id ?? null} followingIds={followingIds} isLoggedIn={!!user} />
        )}

        {/* 底部說明 */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '12px 20px',
          borderTop: '1px solid rgba(255,255,255,0.07)',
        }}>
          <span style={{ fontSize: 13, color: 'var(--ink-3)', fontFamily: 'var(--font-dm)' }}>
            未認領成績來自官方賽事成績；認領後成為個人紀錄
          </span>
          <a href="/records/new" style={{
            marginLeft: 'auto', fontSize: 13, color: '#FF6B3D',
            fontFamily: 'var(--font-dm)', cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 4,
            border: '1px solid rgba(255,107,61,0.25)', padding: '4px 10px',
            borderRadius: 100, textDecoration: 'none', whiteSpace: 'nowrap',
          }}>
            登錄我的成績 →
          </a>
        </div>
      </div>
    </main>
  )
}
