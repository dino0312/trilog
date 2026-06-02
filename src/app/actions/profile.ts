'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export type ProfileState = {
  error: string | null
  success: boolean
}

export async function updateProfile(_prev: ProfileState, formData: FormData): Promise<ProfileState> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: '請先登入', success: false }

  const nickname   = (formData.get('nickname') as string).trim() || null
  const gender     = formData.get('gender') as 'M' | 'F' | null || null
  const birth_year = formData.get('birth_year') ? Number(formData.get('birth_year')) : null
  const nationality = (formData.get('nationality') as string).trim() || null
  const bio        = (formData.get('bio') as string).trim() || null

  if (birth_year && (birth_year < 1900 || birth_year > new Date().getFullYear())) {
    return { error: '出生年份不合理', success: false }
  }

  const { error } = await supabase
    .from('athletes')
    .update({ nickname, gender, birth_year, nationality, bio })
    .eq('id', user.id)

  if (error) return { error: error.message, success: false }

  revalidatePath('/profile')
  revalidatePath('/leaderboard')
  return { error: null, success: true }
}
