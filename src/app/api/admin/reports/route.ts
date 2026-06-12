import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { IssueStatus, IssueCategory } from '@/types/database'

// GET /api/admin/reports?status=&category= — 取得回報列表（assistant+）
export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: '請先登入' }, { status: 401 })

  const { data: isAssistant } = await supabase.rpc('is_assistant_or_above')
  if (!isAssistant) return NextResponse.json({ error: '權限不足' }, { status: 403 })

  const status   = req.nextUrl.searchParams.get('status')
  const category = req.nextUrl.searchParams.get('category')

  let query = supabase
    .from('issue_reports')
    .select('*')
    .order('created_at', { ascending: false })

  if (status && status !== 'all')   query = query.eq('status',   status as IssueStatus)
  if (category && category !== 'all') query = query.eq('category', category as IssueCategory)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // 加入 submitted_by athlete name（若有）
  const reports = data ?? []
  const athleteIds = [...new Set(reports.map(r => r.submitted_by).filter(Boolean))]
  let nameMap: Record<string, string> = {}
  if (athleteIds.length) {
    const { data: athletes } = await supabase
      .from('athletes')
      .select('id, name, nickname')
      .in('id', athleteIds as string[])
    nameMap = Object.fromEntries(
      (athletes ?? []).map(a => [a.id, a.nickname ?? a.name ?? '未知'])
    )
  }

  const enriched = reports.map(r => ({
    ...r,
    submitter_name: r.submitted_by ? (nameMap[r.submitted_by] ?? '未知') : '訪客',
  }))

  return NextResponse.json({ reports: enriched })
}
