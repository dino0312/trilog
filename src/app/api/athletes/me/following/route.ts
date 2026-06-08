import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET /api/athletes/me/following — 回傳我追蹤的選手 id 列表
export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ ids: [] })

  const { data } = await supabase
    .from('athlete_follows')
    .select('following_id')
    .eq('follower_id', user.id)

  return NextResponse.json({ ids: (data ?? []).map(r => r.following_id) })
}
