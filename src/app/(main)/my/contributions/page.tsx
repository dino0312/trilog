import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { IconUser, IconUsers } from '@tabler/icons-react'

export const metadata: Metadata = { title: '我的貢獻 · Tri·log' }

type ClaimStatus = 'unclaimed' | 'claimed' | 'partial' | 'pending'

type ContribItem = {
  type: 'solo' | 'relay'
  id: string
  name: string
  member_count?: number
  race_name: string
  race_year: number
  claim_status: ClaimStatus
  created_at: string
}

const STATUS_LABEL: Record<string, string> = {
  unclaimed: '待認領',
  partial:   '部分認領',
  claimed:   '已認領',
  pending:   '待審核',
}

const STATUS_STYLE: Record<string, string> = {
  unclaimed: 'bg-warn/10 text-warn',
  partial:   'bg-warn/10 text-warn',
  claimed:   'bg-good/10 text-good',
  pending:   'bg-warn/10 text-warn',
}

export default async function ContributionsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login?redirectTo=/my/contributions')

  const uid = user.id

  // solo：我新增的、非自己的成績
  const { data: soloResults } = await supabase
    .from('results')
    .select(`
      id, athlete_name_snapshot, claim_status, created_at,
      race_editions ( year, races ( name, name_zh ) )
    `)
    .eq('created_by', uid)
    .eq('result_type', 'solo')
    .neq('athlete_id', uid)
    .order('created_at', { ascending: false })

  // relay step 1：我新增的接力 result + 賽事資訊
  const { data: relayResultRows } = await supabase
    .from('results')
    .select(`id, created_at, race_editions ( year, races ( name, name_zh ) )`)
    .eq('created_by', uid)
    .eq('result_type', 'relay')
    .order('created_at', { ascending: false })

  // relay step 2：對應 teams + team_members
  const relayResultIds = (relayResultRows ?? []).map(r => r.id)
  const { data: teamsRows } = relayResultIds.length
    ? await supabase
        .from('teams')
        .select('id, team_name, result_id, team_members ( id, claim_status )')
        .in('result_id', relayResultIds)
    : { data: [] as any[] }

  // 統計
  const [
    { data: athlete },
    { count: unclaimedCount },
    { count: claimedCount },
  ] = await Promise.all([
    supabase.from('athletes').select('contribution_score').eq('id', uid).single(),
    supabase.from('results').select('*', { count: 'exact', head: true })
      .eq('created_by', uid).eq('claim_status', 'unclaimed').neq('athlete_id', uid),
    supabase.from('results').select('*', { count: 'exact', head: true })
      .eq('created_by', uid).eq('claim_status', 'claimed').neq('athlete_id', uid),
  ])

  // 整理 solo items
  const soloItems: ContribItem[] = (soloResults ?? []).map(r => {
    const edition = r.race_editions as any
    const race    = edition?.races as any
    return {
      type:         'solo',
      id:           r.id,
      name:         r.athlete_name_snapshot ?? '（未知）',
      race_name:    (race?.name_zh ?? race?.name ?? '—') as string,
      race_year:    (edition?.year ?? 0) as number,
      claim_status: r.claim_status as ClaimStatus,
      created_at:   r.created_at,
    }
  })

  // 整理 relay items（以 team 為單位）
  const relayResultMap = new Map((relayResultRows ?? []).map(r => [r.id, r]))
  const relayItems: ContribItem[] = (teamsRows ?? []).map(t => {
    const team      = t as any
    const resultRow = relayResultMap.get(team.result_id)
    const edition   = resultRow?.race_editions as any
    const race      = edition?.races as any
    const members   = (team.team_members ?? []) as Array<{ claim_status: string }>
    const claimed   = members.filter(m => m.claim_status === 'claimed').length
    const unclaimed = members.filter(m => m.claim_status === 'unclaimed').length
    const cs: ClaimStatus = claimed === 0 ? 'unclaimed' : unclaimed === 0 ? 'claimed' : 'partial'
    return {
      type:         'relay',
      id:           team.id as string,
      name:         (team.team_name ?? '（未命名隊伍）') as string,
      member_count: members.length,
      race_name:    (race?.name_zh ?? race?.name ?? '—') as string,
      race_year:    (edition?.year ?? 0) as number,
      claim_status: cs,
      created_at:   resultRow?.created_at ?? '',
    }
  })

  const items = [...soloItems, ...relayItems].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  )

  const contributionScore = athlete?.contribution_score ?? 0

  return (
    <main className="flex-1 p-6 max-w-2xl mx-auto w-full">
      {/* 統計卡 */}
      <div className="grid grid-cols-3 gap-3 mb-8">
        <StatCard label="貢獻積分" value={`${contributionScore} 分`} />
        <StatCard label="待認領" value={`${unclaimedCount ?? 0} 筆`} highlight={!!(unclaimedCount && unclaimedCount > 0)} />
        <StatCard label="已認領" value={`${claimedCount ?? 0} 筆`} />
      </div>

      {/* 成績列表 */}
      {items.length === 0 ? (
        <div className="rounded-xl border border-border bg-bg-card p-12 text-center">
          <p className="text-ink-3 mb-1">還沒有幫別人新增過成績</p>
          <p className="text-sm text-ink-4 mt-1">
            從 Nav「+」→「新增成績」→「他人成績」Tab 開始新增
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {items.map(item => {
            const isClaimed = item.claim_status === 'claimed'
            return (
              <div
                key={`${item.type}-${item.id}`}
                className={`rounded-xl border border-border bg-bg-card px-4 py-3 flex items-center gap-3 transition ${isClaimed ? 'opacity-60' : ''}`}
              >
                {/* icon */}
                <span className="shrink-0 text-ink-4">
                  {item.type === 'relay'
                    ? <IconUsers size={18} stroke={1.5} />
                    : <IconUser  size={18} stroke={1.5} />
                  }
                </span>

                {/* 主內容 */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-ink truncate">
                    {item.name}
                    {item.type === 'relay' && item.member_count != null && (
                      <span className="ml-2 text-xs text-ink-4 font-normal">
                        接力 · {item.member_count} 人
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-ink-4 mt-0.5">
                    {item.race_name} · {item.race_year}
                  </p>
                </div>

                {/* badge */}
                <span className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold ${STATUS_STYLE[item.claim_status] ?? 'bg-ink-4/10 text-ink-4'}`}>
                  {STATUS_LABEL[item.claim_status] ?? item.claim_status}
                </span>

                {/* 編輯 / 不可編輯 */}
                {!isClaimed ? (
                  <Link
                    href={item.type === 'relay'
                      ? `/records/relay/${item.id}/edit`
                      : `/records`
                    }
                    className="shrink-0 text-xs text-ink-4 hover:text-ink px-2 py-1 rounded hover:bg-bg-elev transition"
                  >
                    編輯
                  </Link>
                ) : (
                  <span className="shrink-0 text-xs text-ink-4 px-2 py-1">不可編輯</span>
                )}
              </div>
            )
          })}
        </div>
      )}
    </main>
  )
}

function StatCard({ label, value, highlight = false }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="rounded-xl border border-border bg-bg-card p-4 text-center">
      <p className="text-xs text-ink-4 mb-1">{label}</p>
      <p className={`text-xl font-bold tabular-nums ${highlight ? 'text-warn' : 'text-ink'}`}>
        {value}
      </p>
    </div>
  )
}
