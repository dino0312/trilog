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

  if (error) return { error: error.message }

  redirect('/leaderboard')
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
