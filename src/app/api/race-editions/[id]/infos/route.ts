import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

type Params = { params: Promise<{ id: string }> }

export async function GET(req: NextRequest, { params }: Params) {
  const { id } = await params
  const supabase = await createClient()

  const url = new URL(req.url)
  const infoType = url.searchParams.get('info_type')

  let query = supabase
    .from('race_edition_infos')
    .select(`
      id, info_type, title, content, file_url, file_type, is_public, created_at,
      athletes ( id, name, nickname, avatar_url )
    `)
    .eq('race_edition_id', id)
    .eq('is_public', true)
    .order('created_at', { ascending: false })

  const validInfoTypes = ['route_map', 'aid_station', 'external_link', 'note']
  if (infoType && validInfoTypes.includes(infoType)) {
    query = query.eq('info_type', infoType as 'route_map' | 'aid_station' | 'external_link' | 'note')
  }

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ data })
}

export async function POST(req: NextRequest, { params }: Params) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: '未登入' }, { status: 401 })

  const formData = await req.formData()
  const info_type = formData.get('info_type') as string
  const title = formData.get('title') as string
  const content = formData.get('content') as string | null
  const file = formData.get('file') as File | null

  if (!info_type || !title) {
    return NextResponse.json({ error: '缺少必填欄位' }, { status: 400 })
  }

  let file_url: string | null = null
  let file_type: 'pdf' | 'image' | null = null

  if (file && file.size > 0) {
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: '檔案大小不可超過 10MB' }, { status: 400 })
    }

    const ext = file.name.split('.').pop()?.toLowerCase() ?? ''
    file_type = ext === 'pdf' ? 'pdf' : 'image'

    const uuid = crypto.randomUUID()
    const path = `race-info/${id}/${uuid}.${ext}`
    const arrayBuffer = await file.arrayBuffer()

    const { error: uploadError } = await supabase.storage
      .from('race-info')
      .upload(path, arrayBuffer, { contentType: file.type })

    if (uploadError) return NextResponse.json({ error: uploadError.message }, { status: 500 })

    const { data: urlData } = supabase.storage.from('race-info').getPublicUrl(path)
    file_url = urlData.publicUrl
  }

  const { data, error } = await supabase
    .from('race_edition_infos')
    .insert({
      race_edition_id: id,
      athlete_id: user.id,
      info_type: info_type as 'route_map' | 'aid_station' | 'external_link' | 'note',
      title,
      content: content || null,
      file_url,
      file_type,
      is_public: true,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  // 貢獻積分（上限 10 分 / 同一 edition）
  const { data: existingPoints } = await supabase
    .from('contribution_events')
    .select('points')
    .eq('athlete_id', user.id)
    .eq('related_edition_id', id)
    .eq('event_type', 'add_race_info')

  const totalPoints = (existingPoints ?? []).reduce((sum, e) => sum + e.points, 0)

  if (totalPoints < 10) {
    await supabase.from('contribution_events').insert({
      athlete_id: user.id,
      event_type: 'add_race_info',
      related_edition_id: id,
      points: 2,
    })
  }

  return NextResponse.json({ data }, { status: 201 })
}
