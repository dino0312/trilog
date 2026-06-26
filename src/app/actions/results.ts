'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { autoCompleteRaceFollow } from './race-follows'

export type ResultState = {
  error:   string | null
  warning?: string | null
}

function formatSeconds(s: number): string {
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = s % 60
  return [h, m, sec].map(n => String(n).padStart(2, '0')).join(':')
}

function parseTime(val: string): number | null {
  if (!val) return null
  const parts = val.split(':').map(Number)
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2]
  if (parts.length === 2) return parts[0] * 60 + parts[1]
  return null
}

// 各距離世界紀錄下限（秒），低於此值視為不合理
const DISTANCE_MIN_SECONDS: Record<string, number> = {
  'sprint': 2880,   // 48:00 — 衝刺距離世界紀錄約 49 分
  'olympic': 6300,  // 1:45:00 — 奧林匹克世界紀錄約 1:46
  '70.3':   12420,  // 3:27:00 — 113 世界紀錄約 3:27
  'full':   27000,  // 7:30:00 — 226 世界紀錄約 7:35
}

const DISTANCE_LABEL: Record<string, string> = {
  'sprint':  '衝刺距離（25.75）',
  'olympic': '奧林匹克（51.5）',
  '70.3':    '半程（113）',
  'full':    '全程（226）',
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
  const forOther      = formData.get('for_other') === 'true'
  const bibNumber     = (formData.get('bib_number') as string | null)?.trim() || null

  const totalSeconds = parseTime(totalStr)
  if (!totalSeconds || totalSeconds <= 0) return { error: '請輸入正確的完賽時間（HH:MM:SS）' }
  if (!raceEditionId) return { error: '請選擇賽事' }

  const forceSubmit = formData.get('force_submit') === 'true'

  // ── 合理性檢查：查距離類別 ────────────────────────────────
  const { data: edition } = await supabase
    .from('race_editions')
    .select('distance_category')
    .eq('id', raceEditionId)
    .single()

  if (edition?.distance_category) {
    const distLabel = DISTANCE_LABEL[edition.distance_category] ?? edition.distance_category

    // 硬擋：低於世界紀錄
    const minSec = DISTANCE_MIN_SECONDS[edition.distance_category]
    if (minSec && totalSeconds < minSec) {
      return { error: `${distLabel} 完賽時間不可低於 ${formatSeconds(minSec)}（低於世界紀錄，請確認輸入是否正確）` }
    }

    // 軟警告：比資料庫最快還快（需使用者二次確認才送出）
    if (!forceSubmit) {
      const { data: editionIds } = await supabase
        .from('race_editions')
        .select('id')
        .eq('distance_category', edition.distance_category)

      const ids = (editionIds ?? []).map(e => e.id)

      if (ids.length > 0) {
        const { data: fastest } = await supabase
          .from('results')
          .select('total_seconds')
          .in('race_edition_id', ids)
          .eq('is_public', true)
          .not('total_seconds', 'is', null)
          .order('total_seconds', { ascending: true })
          .limit(1)
          .maybeSingle()

        const dbFastest = fastest?.total_seconds ?? null
        if (dbFastest && totalSeconds < dbFastest) {
          return {
            error: null,
            warning: `你填入的成績（${formatSeconds(totalSeconds)}）比目前 ${distLabel} 資料庫最快紀錄（${formatSeconds(dbFastest)}）還快，請確認時間是否正確。若確認無誤，請按「確認送出」。`,
          }
        }
      }
    }
  }

  // ── 幫他人新增成績 ─────────────────────────────────────────
  if (forOther) {
    const athleteNameSnapshot = (formData.get('athlete_name_snapshot') as string | null)?.trim()
    if (!athleteNameSnapshot) return { error: '請填寫成績歸屬人姓名' }

    const curatedGender = (formData.get('curated_gender') as string | null) || null
    if (!curatedGender) return { error: '請選擇成績歸屬人的性別（排行榜分組必填）' }

    const { error } = await supabase.from('results').insert({
      race_edition_id:           raceEditionId,
      athlete_id:                null,
      athlete_name_snapshot:     athleteNameSnapshot,
      curated_gender:            curatedGender as 'M' | 'F',
      result_type:               'solo',
      source_credibility:        'self_reported',
      claim_status:              'unclaimed',
      total_seconds:             totalSeconds,
      swim_seconds:              parseTime(swimStr),
      t1_seconds:                parseTime(t1Str),
      bike_seconds:              parseTime(bikeStr),
      t2_seconds:                parseTime(t2Str),
      run_seconds:               parseTime(runStr),
      is_public:                 isPublic,
      notes:                     notes || null,
      bib_number:                bibNumber,
      created_by:                user.id,
      contributor_consented_at:  new Date().toISOString(),
    })

    if (error) return { error: error.message }
    redirect('/unclaimed')
  }

  // ── 21.3：公開成績需要完整 profile ────────────────────────
  if (isPublic) {
    const name        = (formData.get('name') as string | null)?.trim() || null
    const gender      = (formData.get('gender') as string | null) || null
    const birth_year  = formData.get('birth_year') ? Number(formData.get('birth_year')) : null
    const nationality = (formData.get('nationality') as string | null) || null

    // 若表單帶了 profile 欄位，先更新
    if (name || gender || birth_year || nationality) {
      const { error: profileError } = await supabase
        .from('athletes')
        .update({ name, gender: gender as 'M' | 'F' | null, birth_year, nationality })
        .eq('id', user.id)
      if (profileError) return { error: profileError.message }
    }

    // 再次確認 profile 完整
    const { data: athlete } = await supabase
      .from('athletes')
      .select('name, gender, birth_year, nationality')
      .eq('id', user.id)
      .single()

    if (!athlete?.name || !athlete?.gender || !athlete?.birth_year || !athlete?.nationality) {
      return { error: '公開成績需填寫姓名、性別、出生年份及國籍，才能進入排行榜' }
    }
  }

  const { data: newResult, error } = await supabase.from('results').insert({
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
    bib_number:            bibNumber,
    created_by:            user.id,
  }).select('id').single()

  if (error) return { error: error.message }

  // 自動完賽：若已追蹤此屆次（status = 'registered'），標記為 completed
  if (newResult) {
    await autoCompleteRaceFollow(user.id, raceEditionId, newResult.id)
  }

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

  // 刪成績前先查對應的 race_follow
  const { data: follow } = await supabase
    .from('race_follows')
    .select('id, completion_source')
    .eq('athlete_id', user.id)
    .eq('result_id', id)
    .maybeSingle()

  const { error } = await supabase
    .from('results')
    .delete()
    .eq('id', id)
    .eq('athlete_id', user.id)
    .eq('source_credibility', 'self_reported')

  if (error) return { error: error.message }

  // 同步處理 race_follow
  if (follow) {
    if (follow.completion_source === 'auto') {
      // 系統自動建立的 → 整筆刪除
      await supabase.from('race_follows').delete().eq('id', follow.id)
    } else {
      // 手動標記的 → 只清除 result_id 連結，保留完賽狀態
      await supabase.from('race_follows').update({ result_id: null }).eq('id', follow.id)
    }
  }

  revalidatePath('/records')
  revalidatePath('/my/races')
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
      claimed_at:  new Date().toISOString(),
      created_by:  user.id,
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

export async function updateRelayResult(_prev: ResultState, formData: FormData): Promise<ResultState> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: '請先登入' }

  const teamId   = formData.get('team_id') as string
  const teamName = (formData.get('team_name') as string | null)?.trim() || null

  // 確認使用者是隊伍成員
  const { data: member } = await supabase
    .from('team_members')
    .select('id')
    .eq('team_id', teamId)
    .eq('athlete_id', user.id)
    .maybeSingle()
  if (!member) return { error: '你不是此接力隊伍的成員' }

  const { error: teamError } = await supabase
    .from('teams')
    .update({ team_name: teamName })
    .eq('id', teamId)
  if (teamError) return { error: teamError.message }

  // 更新各成員（格式：member_{id}_name / member_{id}_split）
  const entries = [...formData.entries()]
  for (const [key, value] of entries) {
    const nameMatch  = key.match(/^member_(.+)_name$/)
    const splitMatch = key.match(/^member_(.+)_split$/)
    if (nameMatch) {
      const memberId = nameMatch[1]
      await supabase
        .from('team_members')
        .update({ athlete_name_snapshot: (value as string).trim() })
        .eq('id', memberId)
        .eq('team_id', teamId)
        .is('athlete_id', null) // 只允許更新未認領成員的姓名
    }
    if (splitMatch) {
      const memberId = splitMatch[1]
      const seconds  = parseTime(value as string)
      await supabase
        .from('team_members')
        .update({ split_seconds: seconds })
        .eq('id', memberId)
        .eq('team_id', teamId)
    }
  }

  revalidatePath('/records')
  redirect('/records')
}

export async function deleteRelayResult(_prev: ResultState, formData: FormData): Promise<ResultState> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: '請先登入' }

  const teamId = formData.get('team_id') as string

  // 確認使用者是隊伍成員之一
  const { data: member } = await supabase
    .from('team_members')
    .select('id')
    .eq('team_id', teamId)
    .eq('athlete_id', user.id)
    .maybeSingle()

  if (!member) return { error: '你不是此接力隊伍的成員' }

  // 刪除 team_members（cascade 會刪 teams + results）
  const { error } = await supabase
    .from('teams')
    .delete()
    .eq('id', teamId)

  if (error) return { error: error.message }

  revalidatePath('/records')
  redirect('/records')
}

export async function deleteContribution(_prev: ResultState, formData: FormData): Promise<ResultState> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: '請先登入' }

  const id = formData.get('id') as string

  // 只能刪自己新增、尚未認領、athlete_id 為 null 的成績
  const { error } = await supabase
    .from('results')
    .delete()
    .eq('id', id)
    .eq('created_by', user.id)
    .is('athlete_id', null)
    .eq('claim_status', 'unclaimed')
    .eq('source_credibility', 'self_reported')

  if (error) return { error: error.message }

  revalidatePath('/my/contributions')
  revalidatePath('/unclaimed')
  revalidatePath('/leaderboard')
  revalidatePath('/rankings')
  redirect('/my/contributions')
}
