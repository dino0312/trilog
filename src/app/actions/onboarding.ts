'use server'

import { createClient } from '@/lib/supabase/server'

export async function completeOnboarding(): Promise<{ error: string | null }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: '請先登入' }

  const { error } = await supabase
    .from('athletes')
    .update({ has_completed_onboarding: true })
    .eq('id', user.id)

  return { error: error?.message ?? null }
}
