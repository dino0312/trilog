import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ProfileInlineForm } from '@/components/profile/ProfileInlineForm'

export const metadata: Metadata = { title: '個人資料' }

export default async function MyProfilePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login?redirectTo=/my/profile')

  const { data: athlete } = await supabase
    .from('athletes')
    .select('nickname, gender, birth_year, nationality, bio')
    .eq('id', user.id)
    .single()

  return (
    <main className="flex-1 p-6 max-w-lg mx-auto w-full">
      <div className="mb-4">
        <p className="text-sm text-ink-4">{user.email}</p>
      </div>
      <ProfileInlineForm athlete={{
        nickname:    athlete?.nickname    ?? null,
        gender:      athlete?.gender      ?? null,
        birth_year:  athlete?.birth_year  ?? null,
        nationality: athlete?.nationality ?? null,
        bio:         athlete?.bio         ?? null,
      }} />
    </main>
  )
}
