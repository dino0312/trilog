'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export type ActionState = { error: string | null }

export async function deleteAdminResult(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: '請先登入' }

  const { data: isAdmin } = await supabase.rpc('is_assistant_or_above')
  if (!isAdmin) return { error: '權限不足' }

  const id = formData.get('id') as string

  // 官方成績不可刪除
  const { data: result } = await supabase
    .from('results')
    .select('source_credibility')
    .eq('id', id)
    .single()

  if (result?.source_credibility === 'official') {
    return { error: '官方成績不可刪除' }
  }

  const { error } = await supabase.from('results').delete().eq('id', id)
  if (error) return { error: error.message }

  revalidatePath('/admin/manage-results')
  return { error: null }
}

export async function deleteAdminRelay(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: '請先登入' }

  const { data: isAdmin } = await supabase.rpc('is_assistant_or_above')
  if (!isAdmin) return { error: '權限不足' }

  const teamId = formData.get('team_id') as string

  // 取 result_id 以便刪除 results（cascade 會刪 teams + team_members）
  const { data: team } = await supabase
    .from('teams')
    .select('result_id')
    .eq('id', teamId)
    .single()

  if (!team) return { error: '找不到此隊伍' }

  const { error } = await supabase.from('results').delete().eq('id', team.result_id)
  if (error) return { error: error.message }

  revalidatePath('/admin/manage-results')
  return { error: null }
}
