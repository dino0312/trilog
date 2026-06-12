import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

async function requireAssistant() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { supabase, error: '請先登入', status: 401 }
  const { data: ok } = await supabase.rpc('is_assistant_or_above')
  if (!ok) return { supabase, error: '權限不足', status: 403 }
  return { supabase, error: null, status: 200 }
}

// GET /api/admin/reports/:id
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { supabase, error, status } = await requireAssistant()
  if (error) return NextResponse.json({ error }, { status })

  const { data, error: dbErr } = await supabase
    .from('issue_reports').select('*').eq('id', id).single()
  if (dbErr || !data) return NextResponse.json({ error: '找不到此回報' }, { status: 404 })

  return NextResponse.json({ report: data })
}

// PUT /api/admin/reports/:id — 更新狀態 / admin_note
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { supabase, error, status } = await requireAssistant()
  if (error) return NextResponse.json({ error }, { status })

  const body = await req.json().catch(() => null)
  if (!body) return NextResponse.json({ error: '無效的請求格式' }, { status: 400 })

  const { data: { user } } = await supabase.auth.getUser()
  const { error: dbErr } = await supabase
    .from('issue_reports')
    .update({
      ...(body.status     !== undefined && { status:     body.status }),
      ...(body.admin_note !== undefined && { admin_note: body.admin_note }),
      ...(body.status === 'resolved'    && { resolved_by: user!.id, resolved_at: new Date().toISOString() }),
    })
    .eq('id', id)
  if (dbErr) return NextResponse.json({ error: dbErr.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}
