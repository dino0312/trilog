import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { DeleteRelayForm } from './DeleteRelayForm'

export const metadata: Metadata = { title: '編輯接力成績 · Tri·log' }

export default async function RelayEditPage({ params }: { params: Promise<{ teamId: string }> }) {
  const { teamId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login?redirectTo=/records')

  const { data: team } = await supabase
    .from('teams')
    .select('id, team_name, results ( race_editions ( year, distance_category, races ( name ) ) )')
    .eq('id', teamId)
    .single()

  if (!team) redirect('/records')

  // Verify user is a member
  const { data: member } = await supabase
    .from('team_members')
    .select('id')
    .eq('team_id', teamId)
    .eq('athlete_id', user.id)
    .maybeSingle()

  if (!member) redirect('/records')

  const result = (team.results as any)
  const edition = result?.race_editions as any
  const race = edition?.races as any
  const subtitle = [race?.name, edition?.year].filter(Boolean).join(' ')

  return (
    <main className="flex-1 p-6 max-w-lg mx-auto w-full">
      <h1 className="text-xl font-bold text-ink mb-1">編輯接力成績</h1>
      {subtitle && <p className="text-sm text-ink-3 mb-6">{subtitle}</p>}

      <DeleteRelayForm teamId={teamId} teamName={team.team_name} />

      <div className="mt-4 text-center">
        <a href="/records" className="text-sm text-ink-3 hover:text-ink transition">← 返回我的紀錄</a>
      </div>
    </main>
  )
}
