import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string; memberId: string }> }
) {
  const { id: teamId, memberId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: '請先登入' }, { status: 401 })

  // 確認 member 屬於此 team 且尚未被認領
  const { data: member, error: fetchError } = await supabase
    .from('team_members')
    .select('id, team_id, athlete_id, claim_status')
    .eq('id', memberId)
    .eq('team_id', teamId)
    .single()

  if (fetchError || !member) return NextResponse.json({ error: '找不到此成員' }, { status: 404 })
  if (member.claim_status === 'claimed') return NextResponse.json({ error: '此成績已被認領' }, { status: 409 })
  if (member.athlete_id && member.athlete_id !== user.id) {
    return NextResponse.json({ error: '此成績已與其他帳號關聯' }, { status: 409 })
  }

  // 更新 team_member
  const { error: updateError } = await supabase
    .from('team_members')
    .update({
      athlete_id:   user.id,
      claim_status: 'pending',
      claimed_at:   new Date().toISOString(),
    })
    .eq('id', memberId)

  if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 })

  // 若 result 還是 unclaimed，改為 pending（讓榜單顯示有人認領中）
  const { data: team } = await supabase
    .from('teams')
    .select('result_id')
    .eq('id', teamId)
    .single()

  if (team?.result_id) {
    await supabase
      .from('results')
      .update({ claim_status: 'pending' })
      .eq('id', team.result_id)
      .eq('claim_status', 'unclaimed')
  }

  return NextResponse.json({ success: true })
}
