import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

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

  // relay step 1：我新增的接力 result IDs + 賽事資訊
  const { data: relayResultRows } = await supabase
    .from('results')
    .select(`id, created_at, race_editions ( year, races ( name, name_zh ) )`)
    .eq('created_by', uid)
    .eq('result_type', 'relay')
    .order('created_at', { ascending: false })

  // relay step 2：對應的 teams + team_members
  const relayResultIds = (relayResultRows ?? []).map(r => r.id)
  const { data: teamsRows } = relayResultIds.length
    ? await supabase
        .from('teams')
        .select('id, team_name, result_id, team_members ( id, claim_status )')
        .in('result_id', relayResultIds)
    : { data: [] }

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
  const soloItems = (soloResults ?? []).map(r => {
    const edition = r.race_editions as any
    const race    = edition?.races as any
    return {
      type:         'solo' as const,
      id:           r.id,
      name:         r.athlete_name_snapshot ?? '（未知）',
      race_name:    (race?.name_zh ?? race?.name ?? '—') as string,
      race_year:    (edition?.year ?? 0) as number,
      claim_status: r.claim_status as 'unclaimed' | 'claimed' | 'pending',
      created_at:   r.created_at,
    }
  })

  // 整理 relay items（以 team 為單位）
  const relayResultMap = new Map((relayResultRows ?? []).map(r => [r.id, r]))
  const relayItems = (teamsRows ?? []).map(t => {
    const resultRow = relayResultMap.get((t as any).result_id)
    const edition   = (resultRow?.race_editions as any)
    const race      = edition?.races as any
    const members   = ((t as any).team_members ?? []) as Array<{ claim_status: string }>
    const claimed   = members.filter(m => m.claim_status === 'claimed').length
    const unclaimed = members.filter(m => m.claim_status === 'unclaimed').length
    const claimStatus = claimed === 0 ? 'unclaimed' : unclaimed === 0 ? 'claimed' : 'partial'

    return {
      type:         'relay' as const,
      id:           (t as any).id as string,
      name:         ((t as any).team_name ?? '（未命名隊伍）') as string,
      member_count: members.length,
      race_name:    (race?.name_zh ?? race?.name ?? '—') as string,
      race_year:    (edition?.year ?? 0) as number,
      claim_status: claimStatus as 'unclaimed' | 'claimed' | 'partial',
      created_at:   resultRow?.created_at ?? '',
    }
  })

  const items = [...soloItems, ...relayItems].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  )

  return NextResponse.json({
    contribution_score: athlete?.contribution_score ?? 0,
    unclaimed_count:    unclaimedCount ?? 0,
    claimed_count:      claimedCount ?? 0,
    items,
  })
}
