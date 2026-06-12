'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export type AuthState = {
  error: string | null
}

export async function signUp(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const email    = formData.get('email') as string
  const password = formData.get('password') as string
  const confirm  = formData.get('confirm') as string

  if (password !== confirm) return { error: '兩次密碼不一致' }
  if (password.length < 8)  return { error: '密碼至少 8 個字元' }

  const supabase = await createClient()
  const { error } = await supabase.auth.signUp({ email, password })

  if (error) {
    const msg = error.message
    if (!msg || msg === '{}' || msg.startsWith('{')) return { error: '此 Email 已被註冊，請直接登入' }
    if (msg.toLowerCase().includes('already registered') || msg.toLowerCase().includes('already exists')) return { error: '此 Email 已被註冊，請直接登入' }
    return { error: msg }
  }

  redirect(`/register/verify?email=${encodeURIComponent(email)}`)
}

export async function signIn(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const email      = formData.get('email') as string
  const password   = formData.get('password') as string
  const redirectTo = formData.get('redirectTo') as string | null

  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) return { error: '電子郵件或密碼錯誤' }

  const dest = redirectTo && redirectTo.startsWith('/') ? redirectTo : '/leaderboard'
  redirect(dest)
}

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}
