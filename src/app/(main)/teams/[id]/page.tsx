import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { secondsToTime } from '@/lib/utils/time'

export const metadata: Metadata = { title: '隊伍成績 · Tri·log' }

const DISTANCE_LABEL: Record<string, string> = {
  sprint: 'Sprint', olympic: '51.5', '70.3': '113', full: '226',
}
const GENDER_LABEL: Record<string, string> = {
  male: '男子組', female: '女子組', mixed: '混合組',
}
const DISC_LABEL: Record<string, string> = {
  swim: '游泳', bike: '自行車', run: '跑步',
}
const CLAIM_LABEL: Record<string, string> = {
  unclaimed: '未認領', pending: '審核中', claimed: '已認領', unlinked: '已解除',
}

export default async function TeamPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // 取登入者 name，用於比對成員姓名
  const { data: myProfile } = user
    ? await supabase.from('athletes').select('name').eq('id', user.id).single()
    : { data: null }

  const { data: team } = await supabase
    .from('teams')
    .select(`
      id, team_name, gender_category, t1_seconds, t2_seconds, created_at,
      results (
        id, total_seconds, source_credibility, claim_status, is_public, notes,
        race_editions (
          id, year, race_date, distance_category,
          races ( id, name, slug, city, country )
        )
      ),
      team_members (
        id, athlete_id, athlete_name_snapshot, disciplines, split_seconds,
        source_credibility, claim_status, sort_order, claimed_at,
        athletes ( id, name, nickname, nationality, gender, avatar_url )
      )
    `)
    .eq('id', id)
    .single()

  if (!team) notFound()

  const result  = team.results as unknown as {
    id: string; total_seconds: number; source_credibility: string; claim_status: string;
    is_public: boolean; notes: string | null;
    race_editions: {
      id: string; year: number; race_date: string; distance_category: string;
      races: { id: string; name: string; slug: string; city: string | null; country: string | null } | null
    } | null
  } | null
  const edition = result?.race_editions
  const race    = edition?.races

  const members = (team.team_members as unknown as Array<{
    id: string; athlete_id: string | null; athlete_name_snapshot: string;
    disciplines: string[]; split_seconds: number | null;
    source_credibility: string; claim_status: string; sort_order: number;
    claimed_at: string | null;
    athletes: { id: string; name: string | null; nickname: string | null; nationality: string | null; gender: string | null } | null
  }>).sort((a, b) => a.sort_order - b.sort_order)

  // 已透過 athlete_id 認領的成員
  const myMember = user ? members.find(m => m.athlete_id === user.id) : null

  // 姓名比對：name 與 athlete_name_snapshot 正規化後相符
  const normalize = (s: string) => s.trim().toLowerCase().replace(/\s+/g, '')
  const myName = myProfile?.name ?? ''
  const nameMatchedMembers = (user && myName && !myMember)
    ? members.filter(m =>
        m.claim_status === 'unclaimed' &&
        !m.athlete_id &&
        normalize(m.athlete_name_snapshot) === normalize(myName)
      )
    : []

  return (
    <main className="flex-1 p-6 max-w-2xl mx-auto w-full">
      {/* 標頭 */}
      <div className="mb-1">
        <p className="text-sm text-ink-4 mb-1">
          {race?.name} {edition?.year}
          {edition && ` · ${DISTANCE_LABEL[edition.distance_category] ?? edition.distance_category}`}
          {race?.city && ` · ${race.city}`}
        </p>
        <h1 className="text-2xl font-bold text-ink">
          {team.team_name ?? '未命名隊伍'}
        </h1>
        <div className="flex items-center gap-2 mt-2">
          <span className="text-xs px-2 py-0.5 rounded-full border border-border text-ink-4">
            {GENDER_LABEL[team.gender_category] ?? team.gender_category}
          </span>
          {result && (
            <span className={`text-xs px-2 py-0.5 rounded-full border ${
              result.source_credibility === 'official' ? 'border-accent/40 text-accent' : 'border-border text-ink-4'
            }`}>
              {result.source_credibility === 'official' ? '官方成績' : '自填'}
            </span>
          )}
        </div>
      </div>

      {/* 完賽時間 */}
      {result && (
        <div className="mt-6 rounded-xl border border-border bg-bg-card p-5">
          <p className="text-xs text-ink-4 mb-1">完賽總時間</p>
          <p className="text-3xl font-bold font-mono text-ink">
            {secondsToTime(result.total_seconds)}
          </p>

          {/* 分項時間（T1/T2 隊伍層級） */}
          {(team.t1_seconds || team.t2_seconds) && (
            <div className="flex gap-4 mt-3 pt-3 border-t border-border/50">
              {team.t1_seconds != null && (
                <div className="text-xs text-ink-3">
                  <span className="text-ink-4">T1 </span>
                  <span className="font-mono">{secondsToTime(team.t1_seconds)}</span>
                </div>
              )}
              {team.t2_seconds != null && (
                <div className="text-xs text-ink-3">
                  <span className="text-ink-4">T2 </span>
                  <span className="font-mono">{secondsToTime(team.t2_seconds)}</span>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* 成員列表 */}
      <div className="mt-6">
        <h2 className="text-sm font-semibold text-ink-3 mb-3">成員</h2>
        <div className="flex flex-col gap-3">
          {members.map(m => {
            const displayName = m.athletes?.nickname ?? m.athletes?.name ?? m.athlete_name_snapshot
            const isMe        = user && m.athlete_id === user.id
            const unclaimed   = m.claim_status === 'unclaimed'

            return (
              <div key={m.id} className="rounded-xl border border-border bg-bg-card p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-ink">{displayName}</span>
                      {isMe && <span className="text-xs text-accent">（我）</span>}
                      <span className="text-xs text-ink-4">
                        {CLAIM_LABEL[m.claim_status] ?? m.claim_status}
                      </span>
                    </div>
                    <div className="mt-1 flex gap-2 flex-wrap">
                      {m.disciplines.map(d => (
                        <span key={d} className={`text-xs px-2 py-0.5 rounded border ${
                          d === 'swim' ? 'border-swim/40 text-swim' :
                          d === 'bike' ? 'border-bike/40 text-bike' :
                          'border-run/40 text-run'
                        }`}>
                          {DISC_LABEL[d] ?? d}
                        </span>
                      ))}
                    </div>
                  </div>
                  {m.split_seconds != null && (
                    <span className="font-mono text-ink text-sm">{secondsToTime(m.split_seconds)}</span>
                  )}
                </div>

                {/* 認領按鈕：姓名與登入者 nickname 相符才顯示 */}
                {unclaimed && nameMatchedMembers.some(nm => nm.id === m.id) && (
                  <form
                    action={`/api/teams/${team.id}/members/${m.id}/claim`}
                    method="POST"
                    className="mt-3"
                  >
                    <button
                      type="submit"
                      className="text-xs px-3 py-1.5 rounded-lg bg-accent text-accent-ink hover:brightness-110 transition"
                    >
                      這是我的成績
                    </button>
                  </form>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {result?.notes && (
        <div className="mt-4 rounded-xl border border-border bg-bg-card p-4">
          <p className="text-xs text-ink-4 mb-1">備注</p>
          <p className="text-sm text-ink-3">{result.notes}</p>
        </div>
      )}

      <div className="mt-6">
        <Link href="/relay" className="text-sm text-accent hover:underline">← 接力榜</Link>
      </div>
    </main>
  )
}
