'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export type OfficialResultState = {
  error: string | null
  success: boolean
}

function parseTime(val: string): number | null {
  if (!val?.trim()) return null
  const parts = val.trim().split(':').map(Number)
  if (parts.some(isNaN)) return null
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2]
  if (parts.length === 2) return parts[0] * 60 + parts[1]
  return null
}

export async function addOfficialResult(
  _prev: OfficialResultState,
  formData: FormData,
): Promise<OfficialResultState> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: '請先登入', success: false }

  const editionId  = formData.get('edition_id') as string
  const name       = (formData.get('name') as string)?.trim()
  const gender     = formData.get('gender') as string
  const totalStr   = formData.get('total') as string
  const swimStr    = formData.get('swim') as string
  const t1Str      = formData.get('t1') as string
  const bikeStr    = formData.get('bike') as string
  const t2Str      = formData.get('t2') as string
  const runStr     = formData.get('run') as string
  const overallRank = formData.get('overall_rank') ? parseInt(formData.get('overall_rank') as string) : null

  if (!name) return { error: '請填入選手姓名', success: false }
  const totalSeconds = parseTime(totalStr)
  if (!totalSeconds || totalSeconds <= 0) return { error: '請輸入正確的完賽時間', success: false }

  const { error } = await supabase.from('results').insert({
    race_edition_id:       editionId,
    athlete_id:            null,
    athlete_name_snapshot: name,
    curated_gender:        (gender as 'M' | 'F') || null,
    result_type:           'solo',
    source_credibility:    'official',
    claim_status:          'unclaimed',
    is_public:             true,
    total_seconds:         totalSeconds,
    swim_seconds:          parseTime(swimStr),
    t1_seconds:            parseTime(t1Str),
    bike_seconds:          parseTime(bikeStr),
    t2_seconds:            parseTime(t2Str),
    run_seconds:           parseTime(runStr),
    overall_rank:          overallRank,
  })

  if (error) return { error: error.message, success: false }

  revalidatePath('/leaderboard')
  revalidatePath('/unclaimed')
  return { error: null, success: true }
}

export async function deleteOfficialResult(
  _prev: OfficialResultState,
  formData: FormData,
): Promise<OfficialResultState> {
  const supabase = await createClient()

  const id = formData.get('id') as string

  // admin-only delete via RLS
  const { error } = await supabase.from('results').delete().eq('id', id)
  if (error) return { error: error.message, success: false }

  revalidatePath('/leaderboard')
  revalidatePath('/unclaimed')
  return { error: null, success: true }
}
