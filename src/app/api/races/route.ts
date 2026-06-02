import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('race_editions')
    .select(`
      id,
      year,
      race_date,
      distance_category,
      races ( id, name, slug, city )
    `)
    .order('race_date', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json(data)
}
