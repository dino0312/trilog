import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

type Params = { params: Promise<{ infoId: string }> }

export async function DELETE(_req: NextRequest, { params }: Params) {
  const { infoId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: '未登入' }, { status: 401 })

  // 取得記錄（確認所有者 + 取得 file_url）
  const { data: info } = await supabase
    .from('race_edition_infos')
    .select('id, athlete_id, file_url')
    .eq('id', infoId)
    .maybeSingle()

  if (!info) return NextResponse.json({ error: '資料不存在' }, { status: 404 })

  // 管理員或貢獻者本人可刪除
  const { data: athlete } = await supabase
    .from('athletes')
    .select('role')
    .eq('id', user.id)
    .single()

  const isAdmin = athlete?.role === 'admin' || athlete?.role === 'assistant'
  if (info.athlete_id !== user.id && !isAdmin) {
    return NextResponse.json({ error: '無權限刪除此資料' }, { status: 403 })
  }

  // 刪除 Storage 檔案
  if (info.file_url) {
    const path = info.file_url.split('/race-info/')[1]
    if (path) {
      await supabase.storage.from('race-info').remove([`race-info/${path}`])
    }
  }

  const { error } = await supabase.from('race_edition_infos').delete().eq('id', infoId)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true })
}
