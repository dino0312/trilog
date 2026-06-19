import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { secondsToTime } from '@/lib/utils/time'
import { ManageResultsClient } from './ManageResultsClient'

export const metadata: Metadata = { title: '成績維護 · Tri·log' }

type SearchParams = Promise<{ q?: string; type?: string }>

export default async function ManageResultsPage({ searchParams }: { searchParams: SearchParams }) {
  const { q, type: typeFilter } = await searchParams
  const supabase = await createClient()

  const resultType = typeFilter === 'relay' ? 'relay' : typeFilter === 'solo' ? 'solo' : null

  // solo 成績
  let soloQuery = supabase
    .from('results')
    .select(`
      id, athlete_name_snapshot, total_seconds, claim_status, source_credibility,
      created_at, athlete_id,
      athletes ( name ),
      race_editions ( year, distance_category, races ( name ) )
    `)
    .eq('result_type', 'solo')
    .order('created_at', { ascending: false })
    .limit(50)

  if (q) soloQuery = soloQuery.ilike('athlete_name_snapshot', `%${q}%`)

  // relay 成績（透過 teams）
  let relayQuery = supabase
    .from('teams')
    .select(`
      id, team_name, created_at,
      results ( id, total_seconds, claim_status, source_credibility, created_at,
        race_editions ( year, distance_category, races ( name ) )
      ),
      team_members ( id, athlete_name_snapshot, claim_status, disciplines )
    `)
    .order('created_at', { ascending: false })
    .limit(50)

  if (q) relayQuery = relayQuery.ilike('team_name', `%${q}%`)

  const [{ data: soloResults }, { data: relayTeams }] = await Promise.all([
    resultType === 'relay' ? { data: [] } : soloQuery,
    resultType === 'solo'  ? { data: [] } : relayQuery,
  ])

  const solo = (soloResults ?? []).map(r => {
    const edition = r.race_editions as any
    const race    = edition?.races as any
    return {
      id:           r.id,
      name:         r.athlete_name_snapshot ?? (r.athletes as any)?.name ?? '—',
      total:        r.total_seconds ? secondsToTime(r.total_seconds) : '—',
      race:         `${race?.name ?? '—'} ${edition?.year ?? ''}`.trim(),
      distance:     edition?.distance_category ?? '—',
      claim_status: r.claim_status,
      source:       r.source_credibility,
      claimed:      !!r.athlete_id,
      created_at:   r.created_at,
    }
  })

  const relay = (relayTeams ?? []).map(t => {
    const team   = t as any
    const result = team.results as any
    const edition = result?.race_editions as any
    const race    = edition?.races as any
    const members = (team.team_members ?? []) as any[]
    return {
      id:           team.id as string,
      result_id:    result?.id as string,
      name:         team.team_name ?? '（未命名）',
      total:        result?.total_seconds ? secondsToTime(result.total_seconds) : '—',
      race:         `${race?.name ?? '—'} ${edition?.year ?? ''}`.trim(),
      distance:     edition?.distance_category ?? '—',
      claim_status: result?.claim_status,
      source:       result?.source_credibility,
      member_names: members.map((m: any) => m.athlete_name_snapshot).join('、'),
      member_count: members.length,
      created_at:   team.created_at as string,
    }
  })

  return (
    <main className="mx-auto max-w-4xl px-4 py-6">
      <ManageResultsClient solo={solo} relay={relay} initialQ={q ?? ''} initialType={typeFilter ?? ''} />
    </main>
  )
}
