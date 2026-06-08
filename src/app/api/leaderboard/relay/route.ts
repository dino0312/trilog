import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const distance        = searchParams.get('distance') ?? 'full'
  const gender_category = searchParams.get('gender_category')
  const race_id         = searchParams.get('race_id')

  const supabase = await createClient()

  let query = supabase
    .from('relay_leaderboard_entries')
    .select('*')
    .eq('distance_category', distance as 'sprint' | 'olympic' | '70.3' | 'full')
    .order('total_seconds', { ascending: true })
    .limit(200)

  if (gender_category) query = query.eq('gender_category', gender_category as 'male' | 'female' | 'mixed')
  if (race_id)         query = query.eq('race_id', race_id)

  const { data: entries, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  if (!entries?.length) return NextResponse.json({ entries: [], members: {} })

  // 一次拉取所有成員
  const teamIds = [...new Set(entries.map(e => e.team_id))]
  const { data: members } = await supabase
    .from('team_members')
    .select('id, team_id, athlete_id, athlete_name_snapshot, disciplines, split_seconds, claim_status, sort_order, athletes(id, name, nickname, nationality, gender, avatar_url)')
    .in('team_id', teamIds)
    .order('sort_order')

  // 依 team_id 分組
  const membersByTeam: Record<string, typeof members> = {}
  for (const m of members ?? []) {
    if (!membersByTeam[m.team_id]) membersByTeam[m.team_id] = []
    membersByTeam[m.team_id]!.push(m)
  }

  return NextResponse.json({ entries, members: membersByTeam })
}
