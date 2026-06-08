import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

type Params = { params: Promise<{ id: string }> }

// POST /api/athletes/:id/follow
export async function POST(_req: NextRequest, { params }: Params) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: '請先登入' }, { status: 401 })

  const { id: following_id } = await params
  if (following_id === user.id)
    return NextResponse.json({ error: '不能追蹤自己' }, { status: 400 })

  const { error } = await supabase
    .from('athlete_follows')
    .insert({ follower_id: user.id, following_id })

  if (error) {
    if (error.code === '23505')
      return NextResponse.json({ error: '已追蹤' }, { status: 409 })
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true }, { status: 201 })
}

// DELETE /api/athletes/:id/follow
export async function DELETE(_req: NextRequest, { params }: Params) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: '請先登入' }, { status: 401 })

  const { id: following_id } = await params

  const { error, count } = await supabase
    .from('athlete_follows')
    .delete({ count: 'exact' })
    .eq('follower_id', user.id)
    .eq('following_id', following_id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (count === 0) return NextResponse.json({ error: '未追蹤' }, { status: 404 })

  return NextResponse.json({ ok: true })
}
