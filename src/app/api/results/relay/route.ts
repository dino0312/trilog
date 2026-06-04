import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

function parseTime(val: string | null | undefined): number | null {
  if (!val) return null
  const parts = val.split(':').map(Number)
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2]
  if (parts.length === 2) return parts[0] * 60 + parts[1]
  return null
}

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: '請先登入' }, { status: 401 })

  const body = await req.json()
  const {
    race_edition_id,
    total_seconds,
    is_public = true,
    notes,
    team_name,
    gender_category,
    t1_seconds,
    t2_seconds,
    members,  // { name: string, disciplines: string[], split_seconds?: number | null }[]
  } = body

  if (!race_edition_id)  return NextResponse.json({ error: '請選擇賽事' }, { status: 400 })
  if (!total_seconds)    return NextResponse.json({ error: '請輸入完賽時間' }, { status: 400 })
  if (!gender_category)  return NextResponse.json({ error: '請選擇組別' }, { status: 400 })
  if (!members?.length)  return NextResponse.json({ error: '至少需要一位成員' }, { status: 400 })

  // ── 建立 relay result ───────────────────────────────────────
  const { data: result, error: resultError } = await supabase
    .from('results')
    .insert({
      race_edition_id,
      athlete_id:         null,  // relay: 用 team_members 管理成員
      result_type:        'relay',
      source_credibility: 'self_reported',
      claim_status:       'unclaimed',
      total_seconds,
      is_public,
      notes: notes || null,
      claimed_at: new Date().toISOString(),
    })
    .select('id')
    .single()

  if (resultError) return NextResponse.json({ error: resultError.message }, { status: 500 })

  // ── 建立 team ───────────────────────────────────────────────
  const { data: team, error: teamError } = await supabase
    .from('teams')
    .insert({
      result_id:       result.id,
      team_name:       team_name || null,
      gender_category,
      t1_seconds:      t1_seconds ?? null,
      t2_seconds:      t2_seconds ?? null,
    })
    .select('id')
    .single()

  if (teamError) {
    // rollback result
    await supabase.from('results').delete().eq('id', result.id)
    return NextResponse.json({ error: teamError.message }, { status: 500 })
  }

  // ── 建立 team_members ───────────────────────────────────────
  const memberRows = members.map((m: { name: string; disciplines: string[]; split_seconds?: number | null; is_me?: boolean }, idx: number) => ({
    team_id:               team.id,
    athlete_id:            m.is_me ? user.id : null,
    athlete_name_snapshot: m.name,
    disciplines:           m.disciplines,
    split_seconds:         m.split_seconds ?? null,
    source_credibility:    'self_reported' as const,
    claim_status:          m.is_me ? 'claimed' as const : 'unclaimed' as const,
    sort_order:            idx,
    claimed_at:            m.is_me ? new Date().toISOString() : null,
  }))

  const { error: membersError } = await supabase
    .from('team_members')
    .insert(memberRows)

  if (membersError) {
    await supabase.from('results').delete().eq('id', result.id)
    return NextResponse.json({ error: membersError.message }, { status: 500 })
  }

  // 若建立者為成員之一（is_me），將 result claim_status 更新為 claimed
  if (members.some((m: { is_me?: boolean }) => m.is_me)) {
    await supabase
      .from('results')
      .update({ claim_status: 'claimed', athlete_id: null })
      .eq('id', result.id)
  }

  return NextResponse.json({ result_id: result.id, team_id: team.id })
}
