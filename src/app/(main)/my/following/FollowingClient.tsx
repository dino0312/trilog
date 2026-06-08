'use client'

import { useState } from 'react'
import Link from 'next/link'
import { secondsToTime } from '@/lib/utils/time'
import { FollowButton } from '@/components/athletes/FollowButton'

const DISTANCES = ['full', '70.3', 'olympic', 'sprint'] as const
const DIST_LABEL: Record<string, string> = { full: '226', '70.3': '113', olympic: '51.5', sprint: 'Sprint' }

type Bests = { full: number | null; '70.3': number | null; olympic: number | null; sprint: number | null }

interface Athlete {
  athlete_id:  string
  name:        string | null
  nickname:    string | null
  nationality: string | null
  avatar_url:  string | null
  followed_at: string
  bests:       Bests
}

interface Props {
  athletes: Athlete[]
}

export function FollowingClient({ athletes }: Props) {
  const [query, setQuery] = useState('')

  const filtered = athletes.filter(a => {
    if (!query) return true
    const name = (a.nickname ?? a.name ?? '').toLowerCase()
    return name.includes(query.toLowerCase())
  })

  if (athletes.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-bg-card p-10 text-center">
        <p className="text-lg font-semibold text-ink mb-2">你還沒有關注任何選手</p>
        <p className="text-sm text-ink-3 mb-6">在最速榜上點擊選手旁的 ☆，開始關注他們的成績動態</p>
        <Link
          href="/leaderboard"
          className="inline-flex items-center gap-1.5 rounded-lg border border-accent/30 bg-accent/10 px-4 py-2 text-sm font-medium text-accent hover:bg-accent/20 transition"
        >
          前往最速榜 →
        </Link>
      </div>
    )
  }

  return (
    <div>
      {/* 搜尋框 */}
      <div className="mb-4">
        <input
          type="text"
          placeholder="搜尋選手姓名…"
          value={query}
          onChange={e => setQuery(e.target.value)}
          className="w-full max-w-xs rounded-lg border border-border bg-bg-card px-3 py-2 text-sm text-ink placeholder:text-ink-4 focus:outline-none focus:ring-1 focus:ring-accent/50"
        />
      </div>

      {/* 選手卡片列表 */}
      <div className="flex flex-col gap-3">
        {filtered.map(a => {
          const displayName = a.nickname ?? a.name ?? '—'
          return (
            <div
              key={a.athlete_id}
              className="flex items-center gap-4 rounded-xl border border-border bg-bg-card px-4 py-3"
            >
              {/* Avatar */}
              <div className="h-10 w-10 flex-shrink-0 rounded-full bg-bg-elev flex items-center justify-center text-sm font-bold text-ink-3">
                {a.avatar_url
                  ? <img src={a.avatar_url} alt={displayName} className="h-10 w-10 rounded-full object-cover" />
                  : displayName[0]?.toUpperCase() ?? '?'}
              </div>

              {/* 姓名 + 國籍 */}
              <div className="w-40 flex-shrink-0 min-w-0">
                <p className="font-semibold text-ink text-sm truncate">{displayName}</p>
                {a.nationality && (
                  <p className="text-xs text-ink-4">{a.nationality}</p>
                )}
              </div>

              {/* 各距離最佳 */}
              <div className="flex-1 grid grid-cols-4 gap-2 min-w-0">
                {DISTANCES.map(dist => (
                  <div key={dist} className="text-center">
                    <p className="text-[10px] text-ink-4 mb-0.5">{DIST_LABEL[dist]}</p>
                    <p className="font-mono text-sm text-accent">
                      {a.bests[dist] != null ? secondsToTime(a.bests[dist]!) : '—'}
                    </p>
                  </div>
                ))}
              </div>

              {/* 追蹤按鈕（取消） */}
              <div className="flex-shrink-0">
                <FollowButton
                  athleteId={a.athlete_id}
                  athleteName={displayName}
                  initialFollowing={true}
                  isLoggedIn={true}
                  size="md"
                />
              </div>
            </div>
          )
        })}

        {filtered.length === 0 && query && (
          <p className="text-center text-sm text-ink-4 py-8">找不到符合「{query}」的選手</p>
        )}
      </div>
    </div>
  )
}
