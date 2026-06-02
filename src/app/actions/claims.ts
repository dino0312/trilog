'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export type ClaimState = {
  error: string | null
  success: boolean
  message?: string
}

export async function claimResult(_prev: ClaimState, formData: FormData): Promise<ClaimState> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: '請先登入', success: false }

  const resultId = formData.get('result_id') as string

  const { data, error } = await supabase.rpc('claim_result', {
    p_result_id: resultId,
  })

  if (error) return { error: error.message, success: false }

  revalidatePath('/records')
  revalidatePath('/unclaimed')

  return {
    success: true,
    error: null,
    message: (data as any)?.message ?? '認領申請已提交，待助手審核',
  }
}
