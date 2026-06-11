'use client'

import { useState, useEffect, useRef } from 'react'
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

interface SearchResult {
  id:           string
  name:         string | null
  nickname:     string | null
  nationality:  string | null
  avatar_url:   string | null
  is_following: boolean
}

interface Props {
  athletes:  Athlete[]
  isLoggedIn: boolean
}

function AthleteAvatar({ avatarUrl, displayName, size = 10 }: {
  avatarUrl: string | null
  displayName: string
  size?: number
}) {
  const cls = `h-${size} w-${size} flex-shrink-0 rounded-full`
  if (avatarUrl) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={avatarUrl} alt={displayName} className={`${cls} object-cover`} />
  }
  return (
    <div className={`${cls} bg-accent/20 flex items-center justify-center text-accent font-bold`}>
      {displayName.charAt(0).toUpperCase()}
    </div>
  )
}

export function FollowingClient({ athletes, isLoggedIn }: Props) {
  // 搜尋框 A：全站搜尋
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // 篩選框 B：已追蹤清單 client-side 篩選
  const [filterQuery, setFilterQuery] = useState('')

  useEffect(() => {
    if (searchTimer.current) clearTimeout(searchTimer.current)
    if (!searchQuery.trim()) {
      setSearchResults([])
      return
    }
    setIsSearching(true)
    searchTimer.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/athletes/search?q=${encodeURIComponent(searchQuery.trim())}`)
        const data = await res.json()
        setSearchResults(data.athletes ?? [])
      } catch {
        setSearchResults([])
      } finally {
        setIsSearching(false)
      }
    }, 300)
    return () => { if (searchTimer.current) clearTimeout(searchTimer.current) }
  }, [searchQuery])

  const filteredAthletes = athletes.filter(a => {
    if (!filterQuery) return true
    const name = (a.nickname ?? a.name ?? '').toLowerCase()
    return name.includes(filterQuery.toLowerCase())
  })

  return (
    <div className="space-y-8">

      {/* ① 選手搜尋區 */}
      <div>
        <h2 className="text-sm font-semibold text-ink mb-2">搜尋選手</h2>
        <div className="relative">
          <input
            type="text"
            placeholder="輸入姓名或暱稱…"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full max-w-sm rounded-lg border border-border bg-bg-card px-3 py-2 text-sm text-ink placeholder:text-ink-4 focus:outline-none focus:ring-1 focus:ring-accent/50"
          />
          {isSearching && (
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-ink-4">搜尋中…</span>
          )}
        </div>

        {/* 搜尋結果卡片 */}
        {searchQuery.trim() && (
          <div className="mt-3 flex flex-col gap-2 max-w-2xl">
            {searchResults.length === 0 && !isSearching ? (
              <p className="text-sm text-ink-4 py-2">找不到符合的選手</p>
            ) : (
              searchResults.map(a => {
                const displayName = a.nickname ?? a.name ?? '—'
                return (
                  <div
                    key={a.id}
                    className="flex items-center gap-3 rounded-xl border border-border bg-bg-card px-4 py-3"
                  >
                    <AthleteAvatar avatarUrl={a.avatar_url} displayName={displayName} size={10} />
                    <div className="flex-1 min-w-0">
                      <Link href={`/athletes/${a.id}`} className="text-sm font-semibold text-ink hover:text-accent truncate block">
                        {displayName}
                      </Link>
                      {a.nationality && <p className="text-xs text-ink-4">{a.nationality}</p>}
                    </div>
                    <FollowButton
                      athleteId={a.id}
                      athleteName={displayName}
                      initialFollowing={a.is_following}
                      isLoggedIn={isLoggedIn}
                      size="md"
                    />
                  </div>
                )
              })
            )}
          </div>
        )}
      </div>

      {/* ② 清單頁首 + 篩選框 B */}
      <div>
        <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
          <p className="text-sm text-ink-3">
            你關注了 <span className="text-ink font-semibold">{athletes.length}</span> 位選手
          </p>
          {athletes.length > 0 && (
            <input
              type="text"
              placeholder="篩選已關注選手…"
              value={filterQuery}
              onChange={e => setFilterQuery(e.target.value)}
              className="w-full max-w-xs rounded-lg border border-border bg-bg-card px-3 py-2 text-sm text-ink placeholder:text-ink-4 focus:outline-none focus:ring-1 focus:ring-accent/50"
            />
          )}
        </div>

        {/* ③ 空狀態 */}
        {athletes.length === 0 && (
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
        )}

        {/* ③ 選手卡片列表 */}
        {athletes.length > 0 && (
          <div className="flex flex-col gap-3">
            {filteredAthletes.map(a => {
              const displayName = a.nickname ?? a.name ?? '—'
              return (
                <div
                  key={a.athlete_id}
                  className="flex items-center gap-4 rounded-xl border border-border bg-bg-card px-4 py-3"
                >
                  <AthleteAvatar avatarUrl={a.avatar_url} displayName={displayName} size={10} />

                  {/* 姓名 + 國籍 */}
                  <div className="w-36 flex-shrink-0 min-w-0">
                    <Link
                      href={`/athletes/${a.athlete_id}`}
                      className="font-semibold text-ink text-sm truncate block hover:text-accent transition-colors"
                    >
                      {displayName}
                    </Link>
                    {a.nationality && (
                      <p className="text-xs text-ink-4">{a.nationality}</p>
                    )}
                  </div>

                  {/* 各距離最佳 */}
                  <div className="flex-1 grid grid-cols-4 gap-2 min-w-0">
                    {DISTANCES.map(dist => (
                      <div key={dist} className="text-center">
                        <p className="text-[10px] text-ink-4 mb-0.5">{DIST_LABEL[dist]}</p>
                        <p className="font-mono text-sm text-accent tabular-nums">
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

            {filteredAthletes.length === 0 && filterQuery && (
              <p className="text-center text-sm text-ink-4 py-8">
                找不到符合「{filterQuery}」的選手
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
