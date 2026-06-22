'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export type RaceFollowStatus = 'watching' | 'registered' | 'completed' | 'dns' | 'dnf'

export type RaceFollowState = {
  error: string | null
  data?: { id: string; status: RaceFollowStatus } | null
}

const TERMINAL = new Set<RaceFollowStatus>(['completed', 'dns', 'dnf'])

export async function createRaceFollow(
  raceEditionId: string,
  status: 'watching' | 'registered',
): Promise<RaceFollowState> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: '未登入' }

  const { data, error } = await supabase
    .from('race_follows')
    .insert({ athlete_id: user.id, race_edition_id: raceEditionId, status })
    .select('id, status')
    .single()

  if (error) return { error: error.message }

  // 若 status = 'registered'，將對應 race_interest wishlist 升級為 attended
  if (status === 'registered') {
    const { data: edition } = await supabase
      .from('race_editions')
      .select('race_id, year')
      .eq('id', raceEditionId)
      .single()

    if (edition) {
      await supabase
        .from('race_interest')
        .update({ interest_type: 'attended' })
        .eq('athlete_id', user.id)
        .eq('race_id', edition.race_id)
        .eq('year', edition.year)
        .eq('interest_type', 'wishlist')
    }
  }

  revalidatePath('/my/races')
  return { error: null, data: data as { id: string; status: RaceFollowStatus } }
}

export async function updateRaceFollow(
  raceFollowId: string,
  updates: {
    status: RaceFollowStatus
    dns_dnf_reason?: string | null
    dns_dnf_public?: boolean
  },
): Promise<RaceFollowState> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: '未登入' }

  const { data: existing } = await supabase
    .from('race_follows')
    .select('id, status')
    .eq('id', raceFollowId)
    .eq('athlete_id', user.id)
    .maybeSingle()

  if (!existing) return { error: '追蹤記錄不存在' }
  if (TERMINAL.has(existing.status as RaceFollowStatus)) {
    return { error: '完賽/DNS/DNF 狀態不可再更改' }
  }

  const { data, error } = await supabase
    .from('race_follows')
    .update(updates)
    .eq('id', raceFollowId)
    .select('id, status')
    .single()

  if (error) return { error: error.message }

  revalidatePath('/my/races')
  return { error: null, data: data as { id: string; status: RaceFollowStatus } }
}

export async function deleteRaceFollow(raceFollowId: string): Promise<RaceFollowState> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: '未登入' }

  const { data: existing } = await supabase
    .from('race_follows')
    .select('id, status')
    .eq('id', raceFollowId)
    .eq('athlete_id', user.id)
    .maybeSingle()

  if (!existing) return { error: '追蹤記錄不存在' }
  if (TERMINAL.has(existing.status as RaceFollowStatus)) {
    return { error: '完賽/DNS/DNF 狀態不可取消追蹤' }
  }

  const { error } = await supabase.from('race_follows').delete().eq('id', raceFollowId)
  if (error) return { error: error.message }

  revalidatePath('/my/races')
  return { error: null }
}

/** 自動完賽觸發（由 createResult / claimResult 呼叫） */
export async function autoCompleteRaceFollow(
  athleteId: string,
  raceEditionId: string,
  resultId: string,
): Promise<void> {
  const supabase = await createClient()

  const { data: existing } = await supabase
    .from('race_follows')
    .select('id, status')
    .eq('athlete_id', athleteId)
    .eq('race_edition_id', raceEditionId)
    .maybeSingle()

  if (!existing) {
    // 從未追蹤過此屆次，直接建一筆 completed
    await supabase.from('race_follows').insert({
      athlete_id: athleteId,
      race_edition_id: raceEditionId,
      status: 'completed',
      result_id: resultId,
      completion_source: 'auto',
    })
    return
  }

  if (existing.status !== 'registered') return

  await supabase
    .from('race_follows')
    .update({ status: 'completed', result_id: resultId, completion_source: 'auto' })
    .eq('id', existing.id)
}
