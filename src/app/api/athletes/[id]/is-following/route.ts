import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

type Params = { params: Promise<{ id: string }> }

// GET /api/athletes/:id/is-following
export async function GET(_req: NextRequest, { params }: Params) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ following: false })

  const { id: following_id } = await params

  const { data } = await supabase
    .from('athlete_follows')
    .select('follower_id')
    .eq('follower_id', user.id)
    .eq('following_id', following_id)
    .maybeSingle()

  return NextResponse.json({ following: !!data })
}
