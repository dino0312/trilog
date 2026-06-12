'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import type { Gender, Role } from '@/types/database'

// ── 工具：確認操作者是 assistant 以上 ────────────────────────
async function requireAssistant() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { supabase, user: null, error: '請先登入' }
  const { data: isAssistant } = await supabase.rpc('is_assistant_or_above')
  if (!isAssistant) return { supabase, user: null, error: '權限不足' }
  return { supabase, user, error: null }
}

async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { supabase, user: null, error: '請先登入' }
  const { data: myAthlete } = await supabase
    .from('athletes').select('role').eq('id', user.id).single()
  if (myAthlete?.role !== 'admin') return { supabase, user: null, error: '此操作需要 admin 權限' }
  return { supabase, user, error: null }
}

// ── 編輯會員資料 ──────────────────────────────────────────────
export interface MemberProfilePatch {
  name?:        string | null
  nickname?:    string | null
  gender?:      string | null
  birth_year?:  number | null
  nationality?: string | null
  bio?:         string | null
}

export async function updateMemberProfile(
  athleteId: string,
  patch: MemberProfilePatch,
): Promise<{ error: string | null }> {
  const { supabase, user, error } = await requireAssistant()
  if (error || !user) return { error: error ?? '未知錯誤' }

  const { error: dbErr } = await supabase
    .from('athletes')
    .update({
      name:        patch.name        !== undefined ? (patch.name        ?? null) : undefined,
      nickname:    patch.nickname    !== undefined ? (patch.nickname    ?? null) : undefined,
      gender:      patch.gender      !== undefined ? ((patch.gender as Gender) ?? null) : undefined,
      birth_year:  patch.birth_year  !== undefined ? (patch.birth_year  ?? null) : undefined,
      nationality: patch.nationality !== undefined ? (patch.nationality ?? null) : undefined,
      bio:         patch.bio         !== undefined ? (patch.bio         ?? null) : undefined,
    })
    .eq('id', athleteId)
    .is('deleted_at', null)

  return { error: dbErr?.message ?? null }
}

// ── 角色變更 ──────────────────────────────────────────────────
export async function updateMemberRole(
  athleteId: string,
  newRole: string,
): Promise<{ error: string | null }> {
  if (!['athlete', 'assistant'].includes(newRole)) return { error: '無效的角色值' }

  const { supabase, user, error } = await requireAssistant()
  if (error || !user) return { error: error ?? '未知錯誤' }

  if (user.id === athleteId && newRole !== 'assistant') return { error: '不能降低自己的角色' }

  const { error: dbErr } = await supabase
    .from('athletes')
    .update({ role: newRole as Role })
    .eq('id', athleteId)

  return { error: dbErr?.message ?? null }
}

// ── 停權 ─────────────────────────────────────────────────────
export async function suspendMember(
  athleteId: string,
  reason: string,
): Promise<{ error: string | null }> {
  const { supabase, user, error } = await requireAssistant()
  if (error || !user) return { error: error ?? '未知錯誤' }

  if (user.id === athleteId) return { error: '不能停權自己' }

  const { error: dbErr } = await supabase
    .from('athletes')
    .update({
      suspended_at:   new Date().toISOString(),
      suspended_by:   user.id,
      suspend_reason: reason || null,
    })
    .eq('id', athleteId)
    .is('deleted_at', null)

  return { error: dbErr?.message ?? null }
}

// ── 解除停權 ─────────────────────────────────────────────────
export async function unsuspendMember(
  athleteId: string,
): Promise<{ error: string | null }> {
  const { supabase, user, error } = await requireAssistant()
  if (error || !user) return { error: error ?? '未知錯誤' }

  const { error: dbErr } = await supabase
    .from('athletes')
    .update({ suspended_at: null, suspended_by: null, suspend_reason: null })
    .eq('id', athleteId)

  return { error: dbErr?.message ?? null }
}

// ── 刪除（軟刪除，admin only）────────────────────────────────
export async function deleteMember(
  athleteId: string,
  confirmEmail: string,
): Promise<{ error: string | null }> {
  const { supabase, user, error } = await requireAdmin()
  if (error || !user) return { error: error ?? '未知錯誤' }

  if (user.id === athleteId) return { error: '不能刪除自己' }

  // 確認 email 一致
  const { data: target } = await supabase
    .from('athletes').select('email').eq('id', athleteId).single()
  if (!target) return { error: '找不到此會員' }
  if (confirmEmail.trim() !== target.email) return { error: '確認 Email 不符' }

  // 軟刪除（透過 SECURITY DEFINER 函式繞過 RLS）
  const { error: dbErr } = await supabase
    .rpc('admin_soft_delete_athlete', { target_id: athleteId })

  if (dbErr) return { error: dbErr.message }

  // claimed 成績 → unlinked
  await supabase
    .from('results')
    .update({ claim_status: 'unlinked', athlete_id: null })
    .eq('athlete_id', athleteId)
    .eq('claim_status', 'claimed')

  // auth.users 硬刪除（需 service role）
  const adminClient = createAdminClient()
  const { error: authErr } = await adminClient.auth.admin.deleteUser(athleteId)
  if (authErr) return { error: `帳號資料已刪除，但 auth 清除失敗：${authErr.message}` }

  return { error: null }
}

// ── 復原（30 天內，admin only）───────────────────────────────
export async function restoreMember(
  athleteId: string,
): Promise<{ error: string | null }> {
  const { supabase, user, error } = await requireAdmin()
  if (error || !user) return { error: error ?? '未知錯誤' }

  // 確認在 30 天內
  const { data: target } = await supabase
    .from('athletes').select('deleted_at').eq('id', athleteId).single()
  if (!target?.deleted_at) return { error: '此帳號未被刪除' }

  const deletedAt = new Date(target.deleted_at)
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
  if (deletedAt < thirtyDaysAgo) return { error: '已超過 30 天，無法復原' }

  const { error: dbErr } = await supabase
    .from('athletes')
    .update({ deleted_at: null })
    .eq('id', athleteId)

  return { error: dbErr?.message ?? null }
}
