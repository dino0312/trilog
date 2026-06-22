'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export type RaceInfoState = { error: string | null }

export async function createRaceInfo(
  _prev: RaceInfoState,
  formData: FormData,
): Promise<RaceInfoState> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: '未登入' }

  const race_edition_id = formData.get('race_edition_id') as string
  const info_type = formData.get('info_type') as 'route_map' | 'aid_station' | 'external_link' | 'note'
  const title = (formData.get('title') as string)?.trim()
  const content = formData.get('content') as string | null

  if (!race_edition_id || !info_type || !title) {
    return { error: '請填寫必填欄位' }
  }

  let file_url: string | null = null
  let file_type: 'pdf' | 'image' | null = null

  const file = formData.get('file') as File | null
  if (file && file.size > 0) {
    if (file.size > 10 * 1024 * 1024) return { error: '檔案大小不可超過 10MB' }
    const ext = file.name.split('.').pop()?.toLowerCase() ?? ''
    file_type = ext === 'pdf' ? 'pdf' : 'image'
    const path = `race-info/${race_edition_id}/${crypto.randomUUID()}.${ext}`
    const { error: uploadError } = await supabase.storage
      .from('race-info')
      .upload(path, await file.arrayBuffer(), { contentType: file.type })
    if (uploadError) return { error: uploadError.message }
    const { data: urlData } = supabase.storage.from('race-info').getPublicUrl(path)
    file_url = urlData.publicUrl
  }

  const { error } = await supabase.from('race_edition_infos').insert({
    race_edition_id,
    athlete_id: user.id,
    info_type,
    title,
    content: content || null,
    file_url,
    file_type,
    is_public: true,
  })

  if (error) return { error: error.message }

  // 貢獻積分（上限 10 分 / edition）
  const { data: existingPoints } = await supabase
    .from('contribution_events')
    .select('points')
    .eq('athlete_id', user.id)
    .eq('related_edition_id', race_edition_id)
    .eq('event_type', 'add_race_info')

  const total = (existingPoints ?? []).reduce((s, e) => s + e.points, 0)
  if (total < 10) {
    await supabase.from('contribution_events').insert({
      athlete_id: user.id,
      event_type: 'add_race_info',
      related_edition_id: race_edition_id,
      points: 2,
    })
  }

  revalidatePath(`/races`)
  return { error: null }
}
