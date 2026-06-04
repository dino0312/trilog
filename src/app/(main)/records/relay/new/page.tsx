import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { NewRelayResultForm } from '@/components/relay/NewRelayResultForm'

export const metadata: Metadata = { title: '新增接力成績 · Tri·log' }

export default async function NewRelayResultPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login?redirectTo=/records/relay/new')

  return (
    <main className="flex-1 p-6 max-w-lg mx-auto w-full">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-ink">新增接力成績</h1>
        <p className="mt-0.5 text-sm text-ink-3">登錄接力隊伍成績與成員</p>
      </div>
      <NewRelayResultForm />
    </main>
  )
}
