import { createClient } from '@/lib/supabase/server'
import { ReportsClient } from './ReportsClient'

export default async function AdminReportsPage() {
  const supabase = await createClient()

  const { data: reports } = await supabase
    .from('issue_reports')
    .select('*')
    .order('created_at', { ascending: false })

  // Enrich with submitter names
  const list = reports ?? []
  const athleteIds = [...new Set(list.map(r => r.submitted_by).filter(Boolean))] as string[]
  let nameMap: Record<string, string> = {}
  if (athleteIds.length) {
    const { data: athletes } = await supabase
      .from('athletes')
      .select('id, name, nickname')
      .in('id', athleteIds)
    nameMap = Object.fromEntries(
      (athletes ?? []).map(a => [a.id, a.nickname ?? a.name ?? '未知'])
    )
  }

  const enriched = list.map(r => ({
    ...r,
    submitter_name: r.submitted_by ? (nameMap[r.submitted_by] ?? '未知') : '訪客',
  }))

  return <ReportsClient initialReports={enriched} />
}
