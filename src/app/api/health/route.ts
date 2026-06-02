import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase.from('athletes').select('count').limit(1)

    if (error) {
      return NextResponse.json(
        { ok: false, error: error.message, hint: error.hint ?? null },
        { status: 500 }
      )
    }

    return NextResponse.json({ ok: true, data })
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: String(err) },
      { status: 500 }
    )
  }
}
