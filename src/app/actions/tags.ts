'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export type TagState = {
  error: string | null
  success: boolean
  shareText?: string
  resultUrl?: string
  tagId?: string
}

export async function addTag(_prev: TagState, formData: FormData): Promise<TagState> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: '請先登入才能標記', success: false }

  const resultId = formData.get('result_id') as string
  const message  = (formData.get('message') as string) || null

  // 取得成績資料（用於產生分享文字）
  const { data: result } = await supabase
    .from('leaderboard_entries')
    .select('display_name, total_seconds, race_name, edition_year')
    .eq('result_id', resultId)
    .single()

  const { data: tag, error } = await supabase
    .from('claim_tags')
    .insert({ result_id: resultId, tagged_by: user.id, message })
    .select('id')
    .single()

  if (error) {
    if (error.code === '23505') return { error: '你已經標記過這筆成績了', success: false }
    return { error: error.message, success: false }
  }

  // 產生分享文字（spec 15.3 Phase 1）
  const name    = result?.display_name ?? '這位選手'
  const time    = result ? formatSeconds(result.total_seconds) : ''
  const race    = result ? `${result.race_name} ${result.edition_year}` : ''
  const url     = `${process.env.NEXT_PUBLIC_SITE_URL ?? 'https://trilog.run'}/results/${resultId}`
  const shareText = `我在 Tri·log 看到 ${name} 在 ${race} 的成績 ${time} 還沒被認領，快來認領吧！${url}`

  revalidatePath(`/results/${resultId}`)
  revalidatePath('/unclaimed')

  return { success: true, error: null, shareText, resultUrl: url, tagId: tag.id }
}

export async function removeTag(_prev: TagState, formData: FormData): Promise<TagState> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: '請先登入', success: false }

  const resultId = formData.get('result_id') as string

  const { error } = await supabase
    .from('claim_tags')
    .delete()
    .eq('result_id', resultId)
    .eq('tagged_by', user.id)

  if (error) return { error: error.message, success: false }

  revalidatePath(`/results/${resultId}`)
  revalidatePath('/unclaimed')
  return { success: true, error: null }
}

function formatSeconds(s: number): string {
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = s % 60
  return `${h}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
}
