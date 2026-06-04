'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export type ResultState = {
  error: string | null
}

function parseTime(val: string): number | null {
  if (!val) return null
  const parts = val.split(':').map(Number)
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2]
  if (parts.length === 2) return parts[0] * 60 + parts[1]
  return null
}

export async function createResult(_prev: ResultState, formData: FormData): Promise<ResultState> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: '請先登入' }

  const raceEditionId = formData.get('race_edition_id') as string
  const totalStr      = formData.get('total') as string
  const swimStr       = formData.get('swim') as string
  const t1Str         = formData.get('t1') as string
  const bikeStr       = formData.get('bike') as string
  const t2Str         = formData.get('t2') as string
  const runStr        = formData.get('run') as string
  const isPublic      = formData.getAll('is_public').includes('true')
  const notes         = formData.get('notes') as string | null

  const totalSeconds = parseTime(totalStr)
  if (!totalSeconds || totalSeconds <= 0) return { error: '請輸入正確的完賽時間（HH:MM:SS）' }
  if (!raceEditionId) return { error: '請選擇賽事' }

  // ── 21.3：公開成績需要完整 profile ────────────────────────
  if (isPublic) {
    const nickname    = (formData.get('nickname') as string | null)?.trim() || null
    const gender      = (formData.get('gender') as string | null) || null
    const birth_year  = formData.get('birth_year') ? Number(formData.get('birth_year')) : null
    const nationality = (formData.get('nationality') as string | null) || null

    // 若表單帶了 profile 欄位，先更新
    if (nickname || gender || birth_year || nationality) {
      const { error: profileError } = await supabase
        .from('athletes')
        .update({ nickname, gender: gender as 'M' | 'F' | null, birth_year, nationality })
        .eq('id', user.id)
      if (profileError) return { error: profileError.message }
    }

    // 再次確認 profile 完整
    const { data: athlete } = await supabase
      .from('athletes')
      .select('nickname, gender, birth_year, nationality')
      .eq('id', user.id)
      .single()

    if (!athlete?.nickname || !athlete?.gender || !athlete?.birth_year || !athlete?.nationality) {
      return { error: '公開成績需填寫暱稱、性別、出生年份及國籍，才能進入排行榜' }
    }
  }

  const { error } = await supabase.from('results').insert({
    race_edition_id:       raceEditionId,
    athlete_id:            user.id,
    result_type:           'solo',
    source_credibility:    'self_reported',
    claim_status:          'claimed',
    total_seconds:         totalSeconds,
    swim_seconds:          parseTime(swimStr),
    t1_seconds:            parseTime(t1Str),
    bike_seconds:          parseTime(bikeStr),
    t2_seconds:            parseTime(t2Str),
    run_seconds:           parseTime(runStr),
    is_public:             isPublic,
    notes:                 notes || null,
    claimed_at:            new Date().toISOString(),
  })

  if (error) return { error: error.message }

  redirect('/records')
}

export async function unlinkResult(_prev: ResultState, formData: FormData): Promise<ResultState> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: '請先登入' }

  const id = formData.get('id') as string
  const { error } = await supabase.rpc('unlink_result', { p_result_id: id })

  if (error) return { error: error.message }

  revalidatePath('/records')
  return { error: null }
}

export async function updateResult(_prev: ResultState, formData: FormData): Promise<ResultState> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: '請先登入' }

  const id         = formData.get('id') as string
  const totalStr   = formData.get('total') as string
  const swimStr    = formData.get('swim') as string
  const t1Str      = formData.get('t1') as string
  const bikeStr    = formData.get('bike') as string
  const t2Str      = formData.get('t2') as string
  const runStr     = formData.get('run') as string
  const isPublic   = formData.getAll('is_public').includes('true')
  const notes      = formData.get('notes') as string | null

  const totalSeconds = parseTime(totalStr)
  if (!totalSeconds || totalSeconds <= 0) return { error: '請輸入正確的完賽時間（HH:MM:SS）' }

  const { error } = await supabase
    .from('results')
    .update({
      total_seconds: totalSeconds,
      swim_seconds:  parseTime(swimStr),
      t1_seconds:    parseTime(t1Str),
      bike_seconds:  parseTime(bikeStr),
      t2_seconds:    parseTime(t2Str),
      run_seconds:   parseTime(runStr),
      is_public:     isPublic,
      notes:         notes || null,
    })
    .eq('id', id)
    .eq('athlete_id', user.id)
    .eq('source_credibility', 'self_reported')

  if (error) return { error: error.message }

  revalidatePath('/records')
  return { error: null }
}

export async function deleteResult(_prev: ResultState, formData: FormData): Promise<ResultState> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: '請先登入' }

  const id = formData.get('id') as string

  const { error } = await supabase
    .from('results')
    .delete()
    .eq('id', id)
    .eq('athlete_id', user.id)
    .eq('source_credibility', 'self_reported')

  if (error) return { error: error.message }

  revalidatePath('/records')
  return { error: null }
}
