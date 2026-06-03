'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export type AdminActionState = {
  error: string | null
  success: boolean
}

export async function approveClaim(_prev: AdminActionState, formData: FormData): Promise<AdminActionState> {
  const supabase = await createClient()
  const resultId = formData.get('result_id') as string

  const { error } = await supabase.rpc('approve_claim', {
    p_result_id: resultId,
    p_approve: true,
  })

  if (error) return { error: error.message, success: false }

  revalidatePath('/admin')
  revalidatePath('/leaderboard')
  return { error: null, success: true }
}

export async function rejectClaim(_prev: AdminActionState, formData: FormData): Promise<AdminActionState> {
  const supabase = await createClient()
  const resultId = formData.get('result_id') as string

  const { error } = await supabase.rpc('approve_claim', {
    p_result_id: resultId,
    p_approve: false,
  })

  if (error) return { error: error.message, success: false }

  revalidatePath('/admin')
  return { error: null, success: true }
}

export async function resetClaim(_prev: AdminActionState, formData: FormData): Promise<AdminActionState> {
  const supabase = await createClient()
  const resultId = formData.get('result_id') as string

  // 強制重設為 unclaimed（處理誤認領的策展層成績）
  const { error } = await supabase
    .from('results')
    .update({
      athlete_id:   null,
      claim_status: 'unclaimed',
      claimed_at:   null,
    })
    .eq('id', resultId)

  if (error) return { error: error.message, success: false }

  revalidatePath('/admin')
  revalidatePath('/leaderboard')
  return { error: null, success: true }
}
