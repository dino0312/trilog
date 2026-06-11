import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET /api/athletes/search?q=
// 全站選手搜尋（is_searchable=true，limit 8）
// 回傳含 is_following（登入者專屬，未登入一律 false）
export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get('q')?.trim() ?? ''
  if (!q) return NextResponse.json({ athletes: [] })

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // TODO: 補上 .eq('is_searchable', true) — 待 migration 20260611000001 套用至 Supabase 後恢復
  const { data: athletes, error } = await supabase
    .from('athletes')
    .select('id, name, nickname, nationality, avatar_url')
    .is('deleted_at', null)
    .is('suspended_at', null)
    .or(`name.ilike.%${q}%,nickname.ilike.%${q}%`)
    .limit(8)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!athletes?.length) return NextResponse.json({ athletes: [] })

  // 若已登入，批次查 is_following
  let followingSet = new Set<string>()
  if (user) {
    const ids = athletes.map(a => a.id)
    const { data: follows } = await supabase
      .from('athlete_follows')
      .select('following_id')
      .eq('follower_id', user.id)
      .in('following_id', ids)
    followingSet = new Set((follows ?? []).map(f => f.following_id))
  }

  const result = athletes.map(a => ({
    ...a,
    is_following: followingSet.has(a.id),
  }))

  return NextResponse.json({ athletes: result })
}
