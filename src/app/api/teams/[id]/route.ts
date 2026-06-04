import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: team, error } = await supabase
    .from('teams')
    .select(`
      id, team_name, gender_category, t1_seconds, t2_seconds, created_at,
      results (
        id, total_seconds, source_credibility, claim_status, is_public,
        race_editions (
          id, year, race_date, distance_category,
          races ( id, name, slug, city )
        )
      )
    `)
    .eq('id', id)
    .single()

  if (error || !team) return NextResponse.json({ error: '找不到隊伍' }, { status: 404 })

  const { data: members } = await supabase
    .from('team_members')
    .select('id, athlete_id, athlete_name_snapshot, disciplines, split_seconds, source_credibility, claim_status, sort_order, claimed_at, athletes(id, nickname, nationality, gender, avatar_url)')
    .eq('team_id', id)
    .order('sort_order')

  return NextResponse.json({ ...team, team_members: members ?? [] })
}
