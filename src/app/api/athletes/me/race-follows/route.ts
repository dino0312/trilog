import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: '未登入' }, { status: 401 })

  const url = new URL(req.url)
  const statusParam = url.searchParams.get('status')
  const statuses = statusParam ? statusParam.split(',') : null

  let query = supabase
    .from('race_follows')
    .select(`
      id, status, completion_source, result_id, dns_dnf_reason, dns_dnf_public, created_at, updated_at,
      race_editions (
        id, year, distance_category, race_date, race_date_end, registration_deadline, registration_url,
        races ( id, name, name_zh, slug, county )
      )
    `)
    .eq('athlete_id', user.id)

  type RaceFollowStatus = 'watching' | 'registered' | 'completed' | 'dns' | 'dnf'
  const validStatuses = ['watching', 'registered', 'completed', 'dns', 'dnf']
  const filteredStatuses = statuses?.filter(s => validStatuses.includes(s)) as RaceFollowStatus[] | undefined

  if (filteredStatuses && filteredStatuses.length > 0) {
    query = query.in('status', filteredStatuses)
  }

  // 排序：registered 升序（倒數天數），其餘降序（最近的在前）
  const isRegisteredOnly = statuses?.length === 1 && statuses[0] === 'registered'
  query = query.order('race_editions(race_date)', { ascending: isRegisteredOnly })

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ data })
}
