'use client'

import { useState } from 'react'
import type { IssueCategory, IssueStatus } from '@/types/database'

interface Report {
  id:              string
  category:        IssueCategory
  message:         string
  submitter_name:  string
  submitter_email: string | null
  context_url:     string | null
  context_data:    Record<string, unknown> | null
  status:          IssueStatus
  admin_note:      string | null
  created_at:      string
}

const CATEGORY_LABEL: Record<IssueCategory, string> = {
  add_race:     '新增賽事',
  result_error: '成績錯誤',
  other:        '其他問題',
}
const STATUS_LABEL: Record<IssueStatus, string> = {
  unread:    '未讀',
  read:      '已讀',
  resolved:  '已解決',
  dismissed: '已忽略',
}
const STATUS_COLOR: Record<IssueStatus, string> = {
  unread:    'text-run border-run/40',
  read:      'text-ink-3 border-border',
  resolved:  'text-good border-good/40',
  dismissed: 'text-ink-4 border-border',
}

export function ReportsClient({ initialReports }: { initialReports: Report[] }) {
  const [reports,        setReports]        = useState(initialReports)
  const [statusFilter,   setStatusFilter]   = useState<string>('unread')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [expandedId,     setExpandedId]     = useState<string | null>(null)
  const [noteEdits,      setNoteEdits]      = useState<Record<string, string>>({})
  const [saving,         setSaving]         = useState<string | null>(null)

  const filtered = reports.filter(r => {
    if (statusFilter !== 'all'   && r.status   !== statusFilter)   return false
    if (categoryFilter !== 'all' && r.category !== categoryFilter) return false
    return true
  })

  const unreadCount = reports.filter(r => r.status === 'unread').length

  async function updateStatus(id: string, status: IssueStatus) {
    setSaving(id)
    const res = await fetch(`/api/admin/reports/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    if (res.ok) {
      setReports(rs => rs.map(r => r.id === id ? { ...r, status } : r))
    }
    setSaving(null)
  }

  async function saveNote(id: string) {
    const note = noteEdits[id] ?? ''
    setSaving(id)
    const res = await fetch(`/api/admin/reports/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ admin_note: note }),
    })
    if (res.ok) {
      setReports(rs => rs.map(r => r.id === id ? { ...r, admin_note: note } : r))
    }
    setSaving(null)
  }

  function toggleExpand(id: string) {
    setExpandedId(prev => prev === id ? null : id)
    // 展開時自動標記已讀
    const r = reports.find(x => x.id === id)
    if (r && r.status === 'unread') updateStatus(id, 'read')
  }

  function copyEmail(email: string) {
    navigator.clipboard.writeText(email)
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-lg font-semibold text-ink">
          問題回報
          {unreadCount > 0 && (
            <span className="ml-2 text-xs px-1.5 py-0.5 rounded-full bg-run text-white font-bold">
              {unreadCount}
            </span>
          )}
        </h1>
      </div>

      {/* 篩選列 */}
      <div className="flex flex-wrap gap-3 mb-5 text-sm">
        <div className="flex items-center gap-2">
          <span className="text-ink-4 text-xs">狀態</span>
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="rounded-lg border border-border bg-bg px-2 py-1 text-sm text-ink"
          >
            <option value="all">全部</option>
            <option value="unread">未讀</option>
            <option value="read">已讀</option>
            <option value="resolved">已解決</option>
            <option value="dismissed">已忽略</option>
          </select>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-ink-4 text-xs">類別</span>
          <select
            value={categoryFilter}
            onChange={e => setCategoryFilter(e.target.value)}
            className="rounded-lg border border-border bg-bg px-2 py-1 text-sm text-ink"
          >
            <option value="all">全部</option>
            <option value="add_race">新增賽事</option>
            <option value="result_error">成績錯誤</option>
            <option value="other">其他問題</option>
          </select>
        </div>
      </div>

      {/* 回報列表 */}
      {filtered.length === 0 ? (
        <p className="text-sm text-ink-4 py-10 text-center">無符合條件的回報</p>
      ) : (
        <div className="flex flex-col gap-2">
          {filtered.map(r => (
            <div
              key={r.id}
              className="rounded-xl border border-border bg-bg-card overflow-hidden"
            >
              {/* 摘要列（可點擊展開）*/}
              <button
                onClick={() => toggleExpand(r.id)}
                className="w-full text-left px-4 py-3 flex items-start gap-3 hover:bg-bg-elev transition"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <span className={`text-xs px-1.5 py-0.5 rounded border ${STATUS_COLOR[r.status]}`}>
                      {STATUS_LABEL[r.status]}
                    </span>
                    <span className="text-xs px-1.5 py-0.5 rounded border border-accent/40 text-accent">
                      {CATEGORY_LABEL[r.category]}
                    </span>
                    <span className="text-xs text-ink-4">
                      {r.submitter_name}
                      {r.submitter_email && ` · ${r.submitter_email}`}
                    </span>
                    <span className="text-xs text-ink-4 ml-auto">
                      {new Date(r.created_at).toLocaleDateString('zh-TW')}
                    </span>
                  </div>
                  <p className="text-sm text-ink-3 truncate">{r.message}</p>
                </div>
                <span className="text-ink-4 text-xs mt-0.5 flex-shrink-0">
                  {expandedId === r.id ? '▲' : '▼'}
                </span>
              </button>

              {/* 展開內容 */}
              {expandedId === r.id && (
                <div className="px-4 pb-4 border-t border-border pt-3 flex flex-col gap-3">
                  {/* 完整訊息 */}
                  <p className="text-sm text-ink whitespace-pre-wrap">{r.message}</p>

                  {/* 情境資訊 */}
                  {(r.context_url || r.context_data) && (
                    <div className="text-xs text-ink-4 flex flex-wrap gap-3">
                      {r.context_url && (
                        <a
                          href={r.context_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="underline hover:text-ink"
                        >
                          {r.context_url}
                        </a>
                      )}
                      {r.context_data && (
                        <span className="font-mono bg-bg px-2 py-0.5 rounded">
                          {JSON.stringify(r.context_data)}
                        </span>
                      )}
                    </div>
                  )}

                  {/* 助手備注 */}
                  <div>
                    <label className="text-xs text-ink-4 block mb-1">助手備注</label>
                    <textarea
                      value={noteEdits[r.id] ?? r.admin_note ?? ''}
                      onChange={e => setNoteEdits(n => ({ ...n, [r.id]: e.target.value }))}
                      rows={2}
                      placeholder="內部備注（不顯示給用戶）"
                      className="w-full rounded-lg border border-border bg-bg px-3 py-2 text-sm text-ink placeholder-ink-4 focus:outline-none focus:border-accent resize-none"
                    />
                  </div>

                  {/* 操作按鈕列 */}
                  <div className="flex flex-wrap items-center gap-2">
                    {r.status !== 'resolved' && (
                      <button
                        onClick={() => updateStatus(r.id, 'resolved')}
                        disabled={saving === r.id}
                        className="text-xs px-3 py-1.5 rounded-lg bg-good/20 text-good hover:bg-good/30 transition disabled:opacity-50"
                      >
                        標記已解決
                      </button>
                    )}
                    {r.status !== 'dismissed' && (
                      <button
                        onClick={() => updateStatus(r.id, 'dismissed')}
                        disabled={saving === r.id}
                        className="text-xs px-3 py-1.5 rounded-lg border border-border text-ink-4 hover:text-ink transition disabled:opacity-50"
                      >
                        忽略
                      </button>
                    )}
                    {r.status === 'dismissed' && (
                      <button
                        onClick={() => updateStatus(r.id, 'unread')}
                        disabled={saving === r.id}
                        className="text-xs px-3 py-1.5 rounded-lg border border-border text-ink-4 hover:text-ink transition disabled:opacity-50"
                      >
                        還原未讀
                      </button>
                    )}
                    <button
                      onClick={() => saveNote(r.id)}
                      disabled={saving === r.id}
                      className="text-xs px-3 py-1.5 rounded-lg bg-accent/20 text-accent hover:bg-accent/30 transition disabled:opacity-50"
                    >
                      儲存備注
                    </button>
                    {r.submitter_email && (
                      <button
                        onClick={() => copyEmail(r.submitter_email!)}
                        className="text-xs px-3 py-1.5 rounded-lg border border-border text-ink-4 hover:text-ink transition"
                      >
                        複製 Email
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
