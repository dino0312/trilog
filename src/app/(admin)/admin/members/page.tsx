import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { MemberList } from './MemberList'

export const metadata: Metadata = { title: '會員名單 · Tri·log' }

export default async function MembersPage() {
  const supabase = await createClient()

  const { data: members } = await supabase
    .from('athletes')
    .select(`
      id, email, name, nickname, gender, birth_year, nationality, bio,
      avatar_url, role, is_minor, created_at, deleted_at,
      suspended_at, suspended_by, suspend_reason
    `)
    .order('created_at', { ascending: false })

  // 每位會員的成績數
  const { data: resultCounts } = await supabase
    .from('results')
    .select('athlete_id')
    .not('athlete_id', 'is', null)
    .in('claim_status', ['claimed', 'pending'])

  const countMap: Record<string, number> = {}
  for (const r of resultCounts ?? []) {
    if (r.athlete_id) countMap[r.athlete_id] = (countMap[r.athlete_id] ?? 0) + 1
  }

  const rows = (members ?? []).map(m => ({
    ...m,
    result_count: countMap[m.id] ?? 0,
  }))

  return (
    <main className="flex-1 p-6 max-w-5xl mx-auto w-full">
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-ink">會員名單</h2>
        <p className="text-sm text-ink-3 mt-0.5">共 {rows.filter(r => !r.deleted_at).length} 位有效會員</p>
      </div>
      <MemberList members={rows} />
    </main>
  )
}
