import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

type Params = { params: Promise<{ id: string }> }

const DISTANCES = ['full', '70.3', 'olympic', 'sprint'] as const
type DistKey = typeof DISTANCES[number]

// GET /api/athletes/:id
// 選手公開頁所需資料：基本資料、追蹤數、bests、成績明細、接力成績
export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // 選手基本資料
  const { data: athlete, error } = await supabase
    .from('athletes')
    .select('id, name, nickname, nationality, bio, avatar_url, created_at, suspended_at, deleted_at')
    .eq('id', id)
    .single()

  if (error || !athlete) return NextResponse.json({ error: 'not_found' }, { status: 404 })
  if (athlete.deleted_at) return NextResponse.json({ error: 'deleted' })
  if (athlete.suspended_at) return NextResponse.json({ error: 'suspended' })

  // 追蹤人數 + is_following（並行）
  const [{ count: followerCount }, followResult] = await Promise.all([
    supabase
      .from('athlete_follows')
      .select('*', { count: 'exact', head: true })
      .eq('following_id', id),
    user
      ? supabase.from('athlete_follows').select('following_id').eq('follower_id', user.id).eq('following_id', id).maybeSingle()
      : Promise.resolve({ data: null }),
  ])

  const is_following = !!followResult.data

  // 個人成績（solo，依年份降序）
  // 本人看到全部，其他人只看 is_public=true
  const resultsQuery = supabase
    .from('results')
    .select(`
      id, total_seconds, is_public, claim_status, source_credibility,
      race_editions (
        id, year, distance_category,
        races ( id, name, slug )
      )
    `)
    .eq('athlete_id', id)
    .eq('result_type', 'solo')
    .order('race_editions(year)', { ascending: false })
    .order('total_seconds', { ascending: true })

  const { data: rawResults } = user?.id === id
    ? await resultsQuery
    : await resultsQuery.eq('is_public', true)

  // bests 計算
  const bests: Record<DistKey, number | null> = { full: null, '70.3': null, olympic: null, sprint: null }
  for (const r of rawResults ?? []) {
    if (!r.is_public && user?.id !== id) continue
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const dist = (r.race_editions as any)?.distance_category as DistKey | undefined
    if (!dist || !DISTANCES.includes(dist)) continue
    if (bests[dist] === null || r.total_seconds < (bests[dist] as number)) {
      bests[dist] = r.total_seconds
    }
  }

  // 整理成績明細
  const results = (rawResults ?? []).map(r => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const edition = r.race_editions as any
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const race = edition?.races as any
    return {
      result_id:          r.id,
      total_seconds:      r.total_seconds,
      is_public:          r.is_public,
      claim_status:       r.claim_status,
      source_credibility: r.source_credibility,
      year:               edition?.year ?? null,
      distance_category:  edition?.distance_category ?? null,
      race_name:          race?.name ?? null,
      race_slug:          race?.slug ?? null,
    }
  })

  // 接力成績（team_members.athlete_id = id）
  const { data: rawRelay } = await supabase
    .from('team_members')
    .select(`
      id, disciplines, split_seconds, claim_status,
      teams (
        id, team_name, gender_category,
        results (
          id,
          race_editions (
            id, year, distance_category,
            races ( id, name, slug )
          )
        )
      )
    `)
    .eq('athlete_id', id)
    .order('created_at', { ascending: false })

  const relay_results = (rawRelay ?? []).map(m => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const team = m.teams as any
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = team?.results as any
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const edition = result?.race_editions as any
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const race = edition?.races as any
    return {
      member_id:         m.id,
      team_id:           team?.id ?? null,
      team_name:         team?.team_name ?? null,
      gender_category:   team?.gender_category ?? null,
      disciplines:       m.disciplines,
      split_seconds:     m.split_seconds,
      claim_status:      m.claim_status,
      year:              edition?.year ?? null,
      distance_category: edition?.distance_category ?? null,
      race_name:         race?.name ?? null,
      race_slug:         race?.slug ?? null,
    }
  })

  return NextResponse.json({
    id:             athlete.id,
    name:           athlete.name,
    nickname:       athlete.nickname,
    nationality:    athlete.nationality,
    bio:            athlete.bio,
    avatar_url:     athlete.avatar_url,
    created_at:     athlete.created_at,
    follower_count: followerCount ?? 0,
    is_following,
    bests,
    results,
    relay_results,
  })
}
