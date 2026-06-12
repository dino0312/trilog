import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

// GET /api/races/:id/editions
// 回傳該賽事所有年份屆次與距離 tags，依年份降冪排序
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('race_editions')
    .select('id, year, race_date, distance_category')
    .eq('race_id', id)
    .order('year', { ascending: false })
    .order('distance_category', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // 依年份分組，每年附上所有距離 tags
  const grouped = Object.values(
    (data ?? []).reduce<Record<number, { year: number; race_date: string | null; editions: { id: string; distance_category: string }[] }>>(
      (acc, row) => {
        if (!acc[row.year]) {
          acc[row.year] = { year: row.year, race_date: row.race_date, editions: [] }
        }
        acc[row.year].editions.push({ id: row.id, distance_category: row.distance_category })
        return acc
      },
      {}
    )
  ).sort((a, b) => b.year - a.year)

  return NextResponse.json(grouped)
}
