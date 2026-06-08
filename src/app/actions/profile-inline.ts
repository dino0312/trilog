'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import type { Gender } from '@/types/database'

type Field = 'name' | 'nickname' | 'gender' | 'birth_year' | 'nationality' | 'bio'

export async function updateProfileField(
  field: Field,
  raw: string,
): Promise<{ error: string | null }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: '請先登入' }

  let value: string | number | null = raw.trim() || null

  if (field === 'birth_year') {
    const n = value ? Number(value) : null
    if (n !== null && (n < 1930 || n > 2010)) return { error: '出生年份不合理（1930–2010）' }
    value = n
  }

  if (field === 'gender' && value && !['M', 'F'].includes(value as string)) {
    return { error: '性別值無效' }
  }

  // 用具名欄位更新，避免 Supabase 型別的 dynamic key 限制
  const patch =
    field === 'name'        ? { name: value as string | null } :
    field === 'nickname'    ? { nickname: value as string | null } :
    field === 'gender'      ? { gender: value as Gender | null } :
    field === 'birth_year'  ? { birth_year: value as number | null } :
    field === 'nationality' ? { nationality: value as string | null } :
                              { bio: value as string | null }

  const { error } = await supabase
    .from('athletes')
    .update(patch)
    .eq('id', user.id)

  if (error) return { error: error.message }

  revalidatePath('/my/profile')
  revalidatePath('/profile')
  revalidatePath('/leaderboard')
  return { error: null }
}
