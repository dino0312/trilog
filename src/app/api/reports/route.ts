import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// POST /api/reports — 提交問題回報（無需登入）
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null)
  if (!body) return NextResponse.json({ error: '無效的請求格式' }, { status: 400 })

  const { category, message, email, context_url, context_data } = body
  if (!category || !message?.trim()) {
    return NextResponse.json({ error: '類別與說明為必填' }, { status: 400 })
  }
  if (!['add_race', 'result_error', 'other'].includes(category)) {
    return NextResponse.json({ error: '無效的類別' }, { status: 400 })
  }
  if (message.length > 500) {
    return NextResponse.json({ error: '說明不可超過 500 字' }, { status: 400 })
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { error } = await supabase.from('issue_reports').insert({
    category,
    message:         message.trim(),
    submitted_by:    user?.id ?? null,
    submitter_email: email?.trim() || null,
    context_url:     context_url || null,
    context_data:    context_data || null,
  })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
