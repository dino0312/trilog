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

// ── 接力成績 ─────────────────────────────────────────────────

export type RelayMember = {
  name:          string
  disciplines:   string[]
  split_seconds: number | null
  is_me:         boolean
}

export async function createRelayResult(_prev: ResultState, formData: FormData): Promise<ResultState> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: '請先登入' }

  const race_edition_id = formData.get('race_edition_id') as string
  const total_seconds   = parseTime(formData.get('total') as string)
  const gender_category = formData.get('gender_category') as string
  const team_name       = (formData.get('team_name') as string) || null
  const t1_seconds      = parseTime(formData.get('t1') as string)
  const t2_seconds      = parseTime(formData.get('t2') as string)
  const is_public       = formData.getAll('is_public').includes('true')
  const notes           = (formData.get('notes') as string) || null
  const membersJson     = formData.get('members') as string

  if (!race_edition_id) return { error: '請選擇賽事' }
  if (!total_seconds)   return { error: '請輸入正確的完賽時間（HH:MM:SS）' }
  if (!gender_category) return { error: '請選擇組別' }

  let members: RelayMember[]
  try {
    members = JSON.parse(membersJson)
  } catch {
    return { error: '成員資料格式錯誤' }
  }

  if (!members.length)                            return { error: '至少需要一位成員' }
  if (members.some(m => !m.name.trim()))          return { error: '每位成員都需要填寫姓名' }
  if (members.some(m => !m.disciplines.length))   return { error: '每位成員都需要選擇負責的項目' }

  const { data: result, error: resultError } = await supabase
    .from('results')
    .insert({
      race_edition_id,
      athlete_id:         null,
      result_type:        'relay',
      source_credibility: 'self_reported',
      claim_status:       'unclaimed',
      total_seconds,
      is_public,
      notes,
      claimed_at: new Date().toISOString(),
    })
    .select('id')
    .single()

  if (resultError) return { error: resultError.message }

  const { data: team, error: teamError } = await supabase
    .from('teams')
    .insert({
      result_id:       result.id,
      team_name,
      gender_category: gender_category as 'male' | 'female' | 'mixed',
      t1_seconds,
      t2_seconds,
    })
    .select('id')
    .single()

  if (teamError) {
    await supabase.from('results').delete().eq('id', result.id)
    return { error: teamError.message }
  }

  const memberRows = members.map((m, idx) => ({
    team_id:               team.id,
    athlete_id:            m.is_me ? user.id : null,
    athlete_name_snapshot: m.name.trim(),
    disciplines:           m.disciplines,
    split_seconds:         m.split_seconds,
    source_credibility:    'self_reported' as const,
    claim_status:          m.is_me ? 'claimed' as const : 'unclaimed' as const,
    sort_order:            idx,
    claimed_at:            m.is_me ? new Date().toISOString() : null,
  }))

  const { error: membersError } = await supabase
    .from('team_members')
    .insert(memberRows)

  if (membersError) {
    await supabase.from('results').delete().eq('id', result.id)
    return { error: membersError.message }
  }

  if (members.some(m => m.is_me)) {
    await supabase
      .from('results')
      .update({ claim_status: 'claimed' })
      .eq('id', result.id)
  }

  revalidatePath('/records')
  redirect('/records')
}
