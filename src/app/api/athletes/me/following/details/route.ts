import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET /api/athletes/me/following/details
// 回傳追蹤選手的完整資料 + 各距離最佳成績
export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: '請先登入' }, { status: 401 })

  // 取得追蹤列表（含 followed_at）
  const { data: follows, error: followsError } = await supabase
    .from('athlete_follows')
    .select('following_id, created_at')
    .eq('follower_id', user.id)
    .order('created_at', { ascending: false })

  if (followsError) return NextResponse.json({ error: followsError.message }, { status: 500 })
  if (!follows?.length) return NextResponse.json({ athletes: [] })

  const ids = follows.map(f => f.following_id)

  // 取得選手基本資料
  const { data: athletes } = await supabase
    .from('athletes')
    .select('id, name, nickname, nationality, avatar_url')
    .in('id', ids)

  // 取得各距離最佳成績（public + claimed/unclaimed）
  const { data: results } = await supabase
    .from('results')
    .select(`
      athlete_id, total_seconds,
      race_editions ( distance_category )
    `)
    .in('athlete_id', ids)
    .eq('is_public', true)
    .in('claim_status', ['claimed', 'unclaimed'])
    .eq('result_type', 'solo')
    .order('total_seconds', { ascending: true })

  // 整理每位選手各距離最佳
  const DISTANCES = ['full', '70.3', 'olympic', 'sprint'] as const
  type DistKey = typeof DISTANCES[number]

  const bestsByAthlete: Record<string, Record<DistKey, number | null>> = {}
  for (const id of ids) {
    bestsByAthlete[id] = { full: null, '70.3': null, olympic: null, sprint: null }
  }
  for (const r of results ?? []) {
    if (!r.athlete_id) continue
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const dist = (r.race_editions as any)?.distance_category as DistKey | undefined
    if (!dist || !DISTANCES.includes(dist)) continue
    const cur = bestsByAthlete[r.athlete_id]?.[dist]
    if (cur === null || r.total_seconds < cur) {
      bestsByAthlete[r.athlete_id][dist] = r.total_seconds
    }
  }

  const athleteMap = Object.fromEntries((athletes ?? []).map(a => [a.id, a]))

  const result = follows.map(f => ({
    athlete_id:  f.following_id,
    followed_at: f.created_at,
    ...(athleteMap[f.following_id] ?? {}),
    bests: bestsByAthlete[f.following_id] ?? { full: null, '70.3': null, olympic: null, sprint: null },
  }))

  return NextResponse.json({ athletes: result })
}
