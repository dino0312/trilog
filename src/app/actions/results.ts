'use server'

import { redirect } from 'next/navigation'
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
  const isPublic      = formData.get('is_public') !== 'false'
  const notes         = formData.get('notes') as string | null

  const totalSeconds = parseTime(totalStr)
  if (!totalSeconds || totalSeconds <= 0) return { error: '請輸入正確的完賽時間（HH:MM:SS）' }
  if (!raceEditionId) return { error: '請選擇賽事' }

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
