'use client'

import { useState } from 'react'
import Link from 'next/link'
import { secondsToTime } from '@/lib/utils/time'
import { FollowButton } from '@/components/athletes/FollowButton'
import { ClaimButton } from '@/components/claims/ClaimButton'
import { TagButton } from '@/components/claims/TagButton'

const DIST_LABEL: Record<string, string> = {
  full: '226', '70.3': '113', olympic: '51.5', sprint: 'Sprint',
}
const DIST_ORDER = ['full', '70.3', 'olympic', 'sprint']

const GENDER_LABEL: Record<string, string> = { M: '男', F: '女' }

export interface EditionResult {
  result_id:             string
  total_seconds:         number
  athlete_id:            string | null
  athlete_name_snapshot: string | null
  claim_status:          string
  overall_rank:          number | null
  curated_gender:        string | null
  distance_category:     string
  claim_tag_count:       number
}

interface Props {
  results:          EditionResult[]
  currentUserId:    string | null
  isLoggedIn:       boolean
  followingIds:     string[]
  userAthleteNameNormalized: string | null
  myTaggedResultIds: string[]
}

export function EditionResultsSection({
  results,
  currentUserId,
  isLoggedIn,
  followingIds,
  userAthleteNameNormalized,
  myTaggedResultIds,
}: Props) {
  const followingSet = new Set(followingIds)
  const myTaggedSet  = new Set(myTaggedResultIds)

  // 可用距離（依 DIST_ORDER 排序）
  const availableDistances = DIST_ORDER.filter(d =>
    results.some(r => r.distance_category === d)
  )

  // 預設顯示最長距離
  const [activeDistance, setActiveDistance] = useState(availableDistances[0] ?? '')
  const [query, setQuery] = useState('')

  const filtered = results
    .filter(r => r.distance_category === activeDistance)
    .filter(r => {
      if (!query) return true
      const name = (r.athlete_name_snapshot ?? '').toLowerCase()
      return name.includes(query.toLowerCase())
    })

  if (availableDistances.length === 0) return null

  return (
    <div className="mt-8">
      <h2 className="text-base font-semibold text-ink mb-3">成績列表</h2>

      {/* 距離頁籤 */}
      {availableDistances.length > 1 && (
        <div className="flex gap-2 mb-4">
          {availableDistances.map(d => (
            <button
              key={d}
              onClick={() => { setActiveDistance(d); setQuery('') }}
              className={`px-3 py-1.5 rounded-lg text-sm font-mono transition ${
                activeDistance === d
                  ? 'bg-accent text-bg font-medium'
                  : 'bg-bg-card border border-border text-ink-3 hover:text-ink'
              }`}
            >
              {DIST_LABEL[d] ?? d}
            </button>
          ))}
        </div>
      )}

      {/* 搜尋框 */}
      <div className="mb-3">
        <input
          type="text"
          placeholder="搜尋選手姓名…"
          value={query}
          onChange={e => setQuery(e.target.value)}
          className="w-full max-w-xs rounded-lg border border-border bg-bg-card px-3 py-2 text-sm text-ink placeholder:text-ink-4 focus:outline-none focus:ring-1 focus:ring-accent/50"
        />
      </div>

      {/* 成績表 */}
      <div className="rounded-xl border border-border bg-bg-card overflow-hidden">
        {filtered.length === 0 ? (
          <p className="px-5 py-8 text-sm text-ink-4 text-center">
            {query ? '找不到符合的選手' : '此距離尚無成績'}
          </p>
        ) : (
          <div className="divide-y divide-border">
            {filtered.map((r, idx) => {
              const displayName = r.athlete_name_snapshot ?? '—'
              const isClaimed   = r.claim_status === 'claimed'
              const isUnclaimed = r.claim_status === 'unclaimed' || r.claim_status === 'unlinked'
              const showFollow  = isClaimed && !!r.athlete_id && r.athlete_id !== currentUserId
              const normalizedSnapshot = (r.athlete_name_snapshot ?? '')
                .trim().toLowerCase().replace(/\s+/g, '')
              const canClaim = isLoggedIn &&
                isUnclaimed &&
                !!userAthleteNameNormalized &&
                normalizedSnapshot === userAthleteNameNormalized

              return (
                <div key={r.result_id} className="flex items-center gap-3 px-4 py-3">
                  {/* 名次 */}
                  <span className="text-xs text-ink-4 font-mono w-6 text-right flex-shrink-0">
                    {r.overall_rank ?? idx + 1}
                  </span>

                  {/* 姓名 */}
                  <div className="flex-1 min-w-0 flex items-center gap-1.5">
                    {isClaimed && r.athlete_id ? (
                      <Link
                        href={`/athletes/${r.athlete_id}`}
                        className="text-sm text-ink hover:text-accent truncate"
                      >
                        {displayName}
                      </Link>
                    ) : (
                      <span className="text-sm text-ink truncate">{displayName}</span>
                    )}
                    {isUnclaimed && (
                      <span className="text-xs px-1 py-0.5 rounded border border-border text-ink-4 flex-shrink-0">
                        未認領
                      </span>
                    )}
                  </div>

                  {/* 時間 */}
                  <span className="font-mono text-sm text-accent tabular-nums flex-shrink-0">
                    {secondsToTime(r.total_seconds)}
                  </span>

                  {/* 性別 */}
                  <span className="text-xs text-ink-4 w-4 flex-shrink-0">
                    {r.curated_gender ? (GENDER_LABEL[r.curated_gender] ?? r.curated_gender) : ''}
                  </span>

                  {/* ClaimButton */}
                  <div className="flex-shrink-0">
                    <ClaimButton resultId={r.result_id} visible={canClaim} />
                  </div>

                  {/* TagButton */}
                  <div className="flex-shrink-0">
                    <TagButton
                      resultId={r.result_id}
                      tagCount={r.claim_tag_count}
                      hasTagged={myTaggedSet.has(r.result_id)}
                      isLoggedIn={isLoggedIn}
                      claimStatus={r.claim_status}
                    />
                  </div>

                  {/* FollowButton */}
                  <div className="flex-shrink-0">
                    {showFollow ? (
                      <FollowButton
                        athleteId={r.athlete_id!}
                        athleteName={displayName}
                        initialFollowing={followingSet.has(r.athlete_id!)}
                        isLoggedIn={isLoggedIn}
                        size="sm"
                      />
                    ) : (
                      <div className="w-6" />
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
