'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export type InterestType = 'wishlist' | 'attended'
export type InterestState = { error: string | null; active: boolean }

/** Toggle 一個屆次（race_id + year）的互動意願 */
export async function toggleRaceInterest(
  _prev: InterestState,
  formData: FormData,
): Promise<InterestState> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: '未登入', active: false }

  const race_id      = formData.get('race_id')      as string
  const year         = parseInt(formData.get('year') as string)
  const interest_type = formData.get('interest_type') as InterestType

  const { data: existing } = await supabase
    .from('race_interest')
    .select('id')
    .eq('athlete_id', user.id)
    .eq('race_id', race_id)
    .eq('year', year)
    .eq('interest_type', interest_type)
    .maybeSingle()

  if (existing) {
    const { error } = await supabase.from('race_interest').delete().eq('id', existing.id)
    if (error) return { error: error.message, active: true }
    revalidatePath('/races')
    revalidatePath('/my/wishlist')
    return { error: null, active: false }
  } else {
    const { error } = await supabase
      .from('race_interest')
      .insert({ athlete_id: user.id, race_id, year, interest_type })
    if (error) return { error: error.message, active: false }
    revalidatePath('/races')
    revalidatePath('/my/wishlist')
    return { error: null, active: true }
  }
}
