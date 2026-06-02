import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ProfileForm } from '@/components/profile/ProfileForm'
import { signOut } from '@/app/actions/auth'

export const metadata: Metadata = { title: '個人資料' }

export default async function ProfilePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login?redirectTo=/profile')

  const { data: athlete } = await supabase
    .from('athletes')
    .select('nickname, gender, birth_year, nationality, bio, role, created_at')
    .eq('id', user.id)
    .single()

  return (
    <main className="flex-1 p-6 max-w-lg mx-auto w-full">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-ink">個人資料</h1>
        <p className="mt-0.5 text-sm text-ink-3">{user.email}</p>
      </div>

      <div className="rounded-xl border border-border bg-bg-card p-6 mb-4">
        <ProfileForm athlete={{
          nickname:    athlete?.nickname    ?? null,
          gender:      athlete?.gender      ?? null,
          birth_year:  athlete?.birth_year  ?? null,
          nationality: athlete?.nationality ?? null,
          bio:         athlete?.bio         ?? null,
        }} />
      </div>

      {/* 登出 */}
      <form action={signOut}>
        <button type="submit"
          className="w-full rounded-lg border border-border px-4 py-2.5 text-sm font-medium text-ink-3 hover:text-red hover:border-red transition">
          登出
        </button>
      </form>
    </main>
  )
}
