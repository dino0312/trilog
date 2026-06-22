import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

type Params = { params: Promise<{ id: string }> }

const TERMINAL = new Set(['completed', 'dns', 'dnf'])

export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ data: null })

  const { data } = await supabase
    .from('race_follows')
    .select('*')
    .eq('athlete_id', user.id)
    .eq('race_edition_id', id)
    .maybeSingle()

  return NextResponse.json({ data })
}

export async function POST(req: NextRequest, { params }: Params) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: '未登入' }, { status: 401 })

  const body = await req.json()
  const statusRaw = body.status as string
  if (!['watching', 'registered'].includes(statusRaw)) {
    return NextResponse.json({ error: '初始狀態只允許 watching 或 registered' }, { status: 400 })
  }
  const status = statusRaw as 'watching' | 'registered'

  const { data, error } = await supabase
    .from('race_follows')
    .insert({ athlete_id: user.id, race_edition_id: id, status })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ data }, { status: 201 })
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: '未登入' }, { status: 401 })

  const { data: existing } = await supabase
    .from('race_follows')
    .select('id, status')
    .eq('athlete_id', user.id)
    .eq('race_edition_id', id)
    .maybeSingle()

  if (!existing) return NextResponse.json({ error: '尚未追蹤此賽事' }, { status: 404 })
  if (TERMINAL.has(existing.status)) {
    return NextResponse.json({ error: '完賽/DNS/DNF 狀態不可再更改' }, { status: 409 })
  }

  const body = await req.json()
  const { status, dns_dnf_reason, dns_dnf_public } = body

  const { data, error } = await supabase
    .from('race_follows')
    .update({ status, dns_dnf_reason, dns_dnf_public })
    .eq('id', existing.id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ data })
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: '未登入' }, { status: 401 })

  const { data: existing } = await supabase
    .from('race_follows')
    .select('id, status')
    .eq('athlete_id', user.id)
    .eq('race_edition_id', id)
    .maybeSingle()

  if (!existing) return NextResponse.json({ error: '尚未追蹤此賽事' }, { status: 404 })
  if (TERMINAL.has(existing.status)) {
    return NextResponse.json({ error: '完賽/DNS/DNF 狀態不可取消追蹤' }, { status: 409 })
  }

  const { error } = await supabase.from('race_follows').delete().eq('id', existing.id)
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ success: true })
}
