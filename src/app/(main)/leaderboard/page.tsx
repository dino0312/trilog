import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { secondsToTime } from '@/lib/utils/time'

export const metadata: Metadata = { title: '最速榜 · Tri·log' }

// 分界線門檻（秒）
const MALE_THRESHOLD   = 32400  // 9:00:00
const FEMALE_THRESHOLD = 36000  // 10:00:00

type Entry = {
  result_id:          string
  total_seconds:      number
  display_name:       string | null
  race_name:          string
  edition_year:       number
  claim_status:       string
  source_credibility: string
  claim_tag_count:    number
}

function RankBadge({ rank }: { rank: number }) {
  if (rank === 1) return <span style={{ color: '#F5C842', fontSize: 17, fontFamily: 'var(--font-dm)', fontWeight: 500 }}>1</span>
  if (rank === 2) return <span style={{ color: '#A0A0A0', fontSize: 16, fontFamily: 'var(--font-dm)' }}>2</span>
  if (rank === 3) return <span style={{ color: '#CD9660', fontSize: 16, fontFamily: 'var(--font-dm)' }}>3</span>
  return <span style={{ color: '#4A5568', fontSize: 14, fontFamily: 'var(--font-dm)' }}>{rank}</span>
}

function TimeCell({ seconds, rank, gender }: { seconds: number; rank: number; gender: 'M' | 'F' }) {
  let color = '#F0EDE6'
  if (gender === 'M') {
    if (rank === 1) color = '#F5C842'
    else if (seconds < MALE_THRESHOLD) color = '#FF6B3D'
  } else {
    if (rank === 1) color = '#E870A0'
    else if (seconds < FEMALE_THRESHOLD) color = '#D4537E'
  }
  return (
    <span style={{ color, fontFamily: 'var(--font-dm)', fontSize: 17, fontWeight: 500, letterSpacing: '0.02em' }}>
      {secondsToTime(seconds)}
    </span>
  )
}

function StatusBadge({ claimStatus }: { claimStatus: string }) {
  if (claimStatus === 'unclaimed') {
    return (
      <span style={{
        fontSize: 11, fontFamily: 'var(--font-dm)', letterSpacing: '0.1em',
        color: '#4A5568', border: '1px solid rgba(255,255,255,0.08)',
        padding: '1px 6px', borderRadius: 100,
      }}>未認領</span>
    )
  }
  return null
}

function GenderSection({ entries, gender, updatedAt }: {
  entries: Entry[]
  gender: 'M' | 'F'
  updatedAt: string
}) {
  const label     = gender === 'M' ? '男子組' : '女子組'
  const labelColor = gender === 'M' ? '#22C9C9' : '#D4537E'
  const threshold  = gender === 'M' ? MALE_THRESHOLD : FEMALE_THRESHOLD
  let crossedThreshold = false

  return (
    <>
      {/* 性別標頭 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '16px 24px 12px' }}>
        <span style={{
          fontFamily: 'var(--font-dm)', fontSize: 13, letterSpacing: '0.12em',
          color: labelColor, borderLeft: `2px solid ${labelColor}`, paddingLeft: 10,
        }}>{label}</span>
        <span style={{
          fontFamily: 'var(--font-dm)', fontSize: 11, color: '#4A5568',
          padding: '2px 8px', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 100,
        }}>{updatedAt} 更新</span>
        <span style={{ fontFamily: 'var(--font-dm)', fontSize: 11, color: '#4A5568', marginLeft: 'auto' }}>
          {entries.length} 筆
        </span>
      </div>

      {/* 榜單列 */}
      {entries.map((e, i) => {
        const rank       = i + 1
        const showDivider = !crossedThreshold && e.total_seconds >= threshold
        if (showDivider) crossedThreshold = true

        return (
          <div key={e.result_id}>
            {showDivider && (
              <div style={{ height: 1, background: 'rgba(255,255,255,0.04)', margin: '4px 0' }} />
            )}
            <div className="tlb-row" style={{
              display: 'grid',
              gridTemplateColumns: '44px minmax(0,1fr) 130px 1fr',
              alignItems: 'center',
              padding: '12px 24px',
              borderTop: '1px solid rgba(255,255,255,0.05)',
              cursor: 'pointer',
            }}
            >
              <div style={{ width: 44 }}><RankBadge rank={rank} /></div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                <span style={{
                  fontSize: 16, fontWeight: 500,
                  color: e.claim_status === 'unclaimed' ? '#8A96A8' : '#F0EDE6',
                  whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                  fontFamily: "'Noto Sans TC', sans-serif",
                }}>
                  {e.display_name ?? '—'}
                </span>
                <StatusBadge claimStatus={e.claim_status} />
              </div>

              <div style={{ textAlign: 'right' }}>
                <TimeCell seconds={e.total_seconds} rank={rank} gender={gender} />
              </div>

              <div style={{
                fontSize: 13, color: '#4A5568', textAlign: 'right', paddingLeft: 12,
                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                fontFamily: 'var(--font-dm)',
              }}>
                {e.edition_year} {e.race_name}
              </div>
            </div>
          </div>
        )
      })}
    </>
  )
}

export default async function LeaderboardPage() {
  const supabase = await createClient()

  const [{ data: maleRaw }, { data: femaleRaw }] = await Promise.all([
    supabase
      .from('leaderboard_entries')
      .select('result_id, total_seconds, display_name, race_name, edition_year, claim_status, source_credibility, claim_tag_count')
      .eq('distance_category', 'full')
      .eq('gender', 'M')
      .order('total_seconds', { ascending: true })
      .limit(100),
    supabase
      .from('leaderboard_entries')
      .select('result_id, total_seconds, display_name, race_name, edition_year, claim_status, source_credibility, claim_tag_count')
      .eq('distance_category', 'full')
      .eq('gender', 'F')
      .order('total_seconds', { ascending: true })
      .limit(100),
  ])

  const male   = (maleRaw   ?? []) as Entry[]
  const female = (femaleRaw ?? []) as Entry[]

  return (
    <main style={{ maxWidth: 860, margin: '0 auto', padding: '2.5rem 2rem 4rem' }}>
      <style>{`.tlb-row:hover { background: rgba(255,255,255,0.025); transition: background 0.1s; }`}</style>

      {/* 頁面標題 */}
      <div style={{ padding: '2rem 0 1.5rem' }}>
        <p style={{
          fontFamily: 'var(--font-dm)', fontSize: 11, color: '#22C9C9',
          letterSpacing: '0.15em', display: 'flex', alignItems: 'center', gap: 8,
          marginBottom: 10,
        }}>
          <span style={{ display: 'block', width: 20, height: 1, background: '#22C9C9' }} />
          台灣選手
        </p>
        <h1 style={{
          fontFamily: 'var(--font-syne)', fontWeight: 800,
          fontSize: 'clamp(2.8rem, 6vw, 4.5rem)', letterSpacing: '-0.03em',
          lineHeight: 1, color: '#F0EDE6', marginBottom: 8,
        }}>
          最<span style={{ color: '#FF6B3D' }}>速</span>榜
        </h1>
        <p style={{ fontSize: 15, color: '#4A5568' }}>各選手個人最佳完賽時間，跨賽事排列</p>
      </div>

      {/* 最速榜卡片 — 液態玻璃 */}
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
            fontFamily: 'var(--font-syne)', fontWeight: 800, fontSize: 140,
            color: 'rgba(255,255,255,0.03)', lineHeight: 1,
            pointerEvents: 'none', userSelect: 'none', letterSpacing: -6,
          }}>226</span>

          {/* 標籤膠囊 */}
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            fontFamily: 'var(--font-dm)', fontSize: 10, color: '#FF6B3D',
            letterSpacing: '0.14em',
            border: '1px solid rgba(255,107,61,0.3)',
            padding: '3px 10px', borderRadius: 100, marginBottom: 12,
          }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#FF6B3D', display: 'inline-block' }} />
            最速榜
          </div>

          <div style={{
            fontFamily: 'var(--font-syne)', fontWeight: 800, fontSize: 36,
            color: '#F0EDE6', letterSpacing: '-0.03em', lineHeight: 1, marginBottom: 6,
          }}>
            台灣鐵人 <span style={{ color: '#FF6B3D' }}>226</span>
          </div>
          <div style={{
            fontSize: 14, color: '#4A5568', fontFamily: 'var(--font-dm)',
            letterSpacing: '0.04em', marginBottom: '1.5rem',
          }}>
            各選手個人最佳成績 · 跨賽事排列 · 僅供參考
          </div>

          {/* 距離頁籤 */}
          <div style={{
            display: 'flex', borderTop: '1px solid rgba(255,255,255,0.04)',
            margin: '0 -2rem',
          }}>
            {[
              { label: '226 全距離', active: true },
              { label: '113 半程',   active: false },
              { label: '51.5 奧林匹克', active: false },
              { label: '25.75 衝刺',  active: false },
            ].map(tab => (
              <div key={tab.label} style={{
                padding: '12px 22px', fontSize: 14, fontWeight: 500,
                color: tab.active ? '#F0EDE6' : '#4A5568',
                borderBottom: tab.active ? '2px solid #FF6B3D' : '2px solid transparent',
                opacity: tab.active ? 1 : 0.35,
                cursor: tab.active ? 'pointer' : 'not-allowed',
                whiteSpace: 'nowrap',
                fontFamily: "'Noto Sans TC', sans-serif",
              }}>{tab.label}</div>
            ))}
          </div>
        </div>

        {/* 男子組 */}
        {male.length > 0 && (
          <GenderSection entries={male} gender="M" updatedAt="2026/02/07" />
        )}

        {/* 性別分隔 */}
        <div style={{ height: 8, background: 'rgba(255,255,255,0.02)' }} />

        {/* 女子組 */}
        {female.length > 0 && (
          <GenderSection entries={female} gender="F" updatedAt="2026/02/07" />
        )}

        {/* 底部說明 */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '12px 20px',
          borderTop: '1px solid rgba(255,255,255,0.07)',
        }}>
          <span style={{ fontSize: 13, color: '#4A5568', fontFamily: 'var(--font-dm)' }}>
            未認領成績來自官方賽事成績；認領後成為個人紀錄
          </span>
          <a href="/unclaimed" style={{
            marginLeft: 'auto', fontSize: 13, color: '#FF6B3D',
            fontFamily: 'var(--font-dm)', cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 4,
            border: '1px solid rgba(255,107,61,0.25)', padding: '4px 10px',
            borderRadius: 100, textDecoration: 'none',
          }}>
            認領我的成績 →
          </a>
        </div>
      </div>
    </main>
  )
}
