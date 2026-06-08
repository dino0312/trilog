import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { secondsToTime } from '@/lib/utils/time'
import { ClaimButton } from '@/components/claims/ClaimButton'
import { TagButton } from '@/components/claims/TagButton'
import { FollowButton } from '@/components/athletes/FollowButton'

export const metadata: Metadata = { title: '成績詳情 · Tri·log' }

const DISTANCE_LABEL: Record<string, string> = {
  sprint: 'Sprint', olympic: '51.5', '70.3': '113', full: '226',
}
const CREDIBILITY_LABEL: Record<string, string> = {
  official: '官方成績', certificate: '已公證', self_reported: '自填',
}
const CLAIM_LABEL: Record<string, string> = {
  unclaimed: '未認領', pending: '審核中', claimed: '已認領', unlinked: '已解除關聯',
}

export default async function ResultPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = user
    ? await supabase.from('athletes').select('name').eq('id', user.id).single()
    : { data: null }

  const { data: result } = await supabase
    .from('results')
    .select(`
      id, total_seconds, swim_seconds, t1_seconds, bike_seconds, t2_seconds, run_seconds,
      athlete_name_snapshot, source_credibility, claim_status, claim_tag_count,
      is_public, notes, claimed_at, overall_rank, bib_number,
      athlete_id,
      race_editions (
        id, year, race_date, distance_category,
        races ( name, city, country )
      )
    `)
    .eq('id', id)
    .single()

  if (!result) notFound()

  const edition = result.race_editions as any
  const race    = edition?.races as any

  // 取標記列表
  const { data: tags } = await supabase
    .from('claim_tags')
    .select('id, message, created_at, tagged_by')
    .eq('result_id', id)
    .order('created_at', { ascending: true })

  let myTaggedIds = new Set<string>()
  if (user) {
    const { data: myTags } = await supabase
      .from('claim_tags').select('result_id').eq('tagged_by', user.id)
    myTaggedIds = new Set((myTags ?? []).map(t => t.result_id))
  }

  const isUnclaimed = result.claim_status === 'unclaimed' || result.claim_status === 'unlinked'

  // 追蹤狀態（已認領 + 非自己才查詢）
  let isFollowing = false
  const showFollow = !!result.athlete_id && result.athlete_id !== user?.id
  if (user && showFollow) {
    const { data: followRow } = await supabase
      .from('athlete_follows')
      .select('follower_id')
      .eq('follower_id', user.id)
      .eq('following_id', result.athlete_id!)
      .maybeSingle()
    isFollowing = !!followRow
  }

  return (
    <main className="flex-1 p-6 max-w-2xl mx-auto w-full">
      {/* 標頭 */}
      <div className="mb-6">
        <p className="text-sm text-ink-4 mb-1">
          {race?.name} {edition?.year}
          {' · '}{DISTANCE_LABEL[edition?.distance_category] ?? edition?.distance_category}
          {race?.city && ` · ${race.city}`}
        </p>
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold text-ink">
            {result.athlete_name_snapshot ?? '匿名選手'}
          </h1>
          {showFollow && (
            <FollowButton
              athleteId={result.athlete_id!}
              athleteName={result.athlete_name_snapshot ?? ''}
              initialFollowing={isFollowing}
              isLoggedIn={!!user}
              size="md"
            />
          )}
        </div>
        <div className="flex items-center gap-3 mt-2">
          <span className={`text-xs px-2 py-0.5 rounded-full border ${
            result.source_credibility === 'official' ? 'border-accent/40 text-accent' :
            result.source_credibility === 'certificate' ? 'border-good/40 text-good' :
            'border-border text-ink-4'
          }`}>
            {CREDIBILITY_LABEL[result.source_credibility]}
          </span>
          <span className="text-xs text-ink-4">
            {CLAIM_LABEL[result.claim_status]}
          </span>
          {result.overall_rank && (
            <span className="text-xs text-ink-4">第 {result.overall_rank} 名</span>
          )}
        </div>
      </div>

      {/* 完賽時間卡片 */}
      <div className="rounded-xl border border-border bg-bg-card p-6 mb-4">
        <p className="text-xs text-ink-4 mb-1">完賽時間</p>
        <p className="font-mono text-4xl font-bold text-accent tabular-nums">
          {secondsToTime(result.total_seconds)}
        </p>

        {/* 分項時間 */}
        {(result.swim_seconds || result.bike_seconds || result.run_seconds) && (
          <div className="mt-4 grid grid-cols-5 gap-2 text-center text-xs">
            {[
              { label: '游泳', val: result.swim_seconds, color: 'text-swim' },
              { label: 'T1',   val: result.t1_seconds,   color: 'text-ink-3' },
              { label: '騎車', val: result.bike_seconds,  color: 'text-bike' },
              { label: 'T2',   val: result.t2_seconds,   color: 'text-ink-3' },
              { label: '跑步', val: result.run_seconds,   color: 'text-run' },
            ].map(({ label, val, color }) => (
              <div key={label} className="rounded-lg bg-bg-elev p-2">
                <p className="text-ink-4">{label}</p>
                <p className={`font-mono font-medium ${color}`}>
                  {val ? secondsToTime(val) : '—'}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 認領 / 標記 區塊 */}
      {isUnclaimed && (
        <div className="rounded-xl border border-border bg-bg-card p-5 mb-4">
          <h2 className="text-sm font-semibold text-ink mb-3">這是你的成績嗎？</h2>
          <div className="flex flex-col gap-3">
            <ClaimButton
              resultId={result.id}
              visible={
                !!profile?.name &&
                !!result.athlete_name_snapshot &&
                result.athlete_name_snapshot.trim().toLowerCase().replace(/\s+/g, '') ===
                profile.name.trim().toLowerCase().replace(/\s+/g, '')
              }
            />
            <div className="border-t border-border pt-3">
              <p className="text-xs text-ink-4 mb-2">認識這位選手？幫忙通知他來認領</p>
              <TagButton
                resultId={result.id}
                tagCount={result.claim_tag_count ?? 0}
                hasTagged={myTaggedIds.has(result.id)}
                isLoggedIn={!!user}
                claimStatus={result.claim_status}
              />
            </div>
          </div>
        </div>
      )}

      {/* 標記留言列表 */}
      {(tags?.length ?? 0) > 0 && (
        <div className="rounded-xl border border-border bg-bg-card p-5 mb-4">
          <h2 className="text-sm font-semibold text-ink mb-3">
            知情人留言 · {tags!.length} 則
          </h2>
          <div className="flex flex-col gap-2">
            {tags!.map(t => (
              <div key={t.id} className="text-sm">
                <span className="text-ink-3">
                  {t.message || '（已通知本人，無留言）'}
                </span>
                <span className="ml-2 text-xs text-ink-4">
                  {new Date(t.created_at).toLocaleDateString('zh-TW')}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {result.notes && (
        <div className="rounded-xl border border-border bg-bg-card p-5">
          <h2 className="text-sm font-semibold text-ink mb-2">備註</h2>
          <p className="text-sm text-ink-3">{result.notes}</p>
        </div>
      )}
    </main>
  )
}
