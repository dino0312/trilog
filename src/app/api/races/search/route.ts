import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

// GET /api/races/search?q=...
// 搜尋賽事品牌（name_zh / name_en ILIKE），最多 8 筆
export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get('q')?.trim() ?? ''
  const supabase = await createClient()

  const query = supabase.from('races').select('id, name, city').order('name')
  const { data, error } = q && q !== '*'
    ? await query.ilike('name', `%${q}%`).limit(8)
    : await query

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json(data ?? [])
}
