'use client'

import { useState, useEffect } from 'react'
import type { IssueCategory } from '@/types/database'

export interface ReportModalProps {
  open: boolean
  onClose: () => void
  /** 預帶類別 */
  defaultCategory?: IssueCategory
  /** 說明欄 placeholder 覆寫 */
  messagePlaceholder?: string
  /** 情境資料（自動帶入） */
  contextData?: Record<string, unknown>
  /** 使用者 email（已登入時預填） */
  userEmail?: string
}

const CATEGORY_OPTIONS: { value: IssueCategory; label: string }[] = [
  { value: 'add_race',     label: '新增賽事' },
  { value: 'result_error', label: '成績錯誤' },
  { value: 'other',        label: '其他問題' },
]

const DEFAULT_PLACEHOLDER: Record<IssueCategory, string> = {
  add_race:     '請描述你想新增的賽事名稱、舉辦地點與大約日期',
  result_error: '請描述哪一場成績有問題，以及錯誤的地方',
  other:        '請說明你遇到的問題或建議',
}

export function ReportModal({
  open,
  onClose,
  defaultCategory = 'other',
  messagePlaceholder,
  contextData,
  userEmail,
}: ReportModalProps) {
  const [category, setCategory] = useState<IssueCategory>(defaultCategory)
  const [message,  setMessage]  = useState('')
  const [email,    setEmail]    = useState(userEmail ?? '')
  const [loading,  setLoading]  = useState(false)
  const [done,     setDone]     = useState(false)
  const [error,    setError]    = useState('')

  // 外部更改 defaultCategory 時同步
  useEffect(() => { setCategory(defaultCategory) }, [defaultCategory])
  // 登入 email 更新時同步
  useEffect(() => { setEmail(userEmail ?? '') }, [userEmail])

  // 關閉時重置
  function handleClose() {
    if (loading) return
    setMessage(''); setError(''); setDone(false)
    onClose()
  }

  // Esc 關閉
  useEffect(() => {
    if (!open) return
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') handleClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, loading])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!message.trim()) { setError('請填寫說明'); return }
    setLoading(true); setError('')
    try {
      const res = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category,
          message,
          email:        email.trim() || undefined,
          context_url:  typeof window !== 'undefined' ? window.location.pathname : undefined,
          context_data: contextData,
        }),
      })
      const json = await res.json()
      if (!res.ok) { setError(json.error ?? '提交失敗，請稍後再試'); return }
      setDone(true)
    } catch {
      setError('網路錯誤，請稍後再試')
    } finally {
      setLoading(false)
    }
  }

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={handleClose}
    >
      {/* 遮罩 */}
      <div className="absolute inset-0 bg-black/60" />

      <div
        className="relative z-10 w-full max-w-md rounded-2xl border border-border bg-bg-card p-6 shadow-xl"
        onClick={e => e.stopPropagation()}
      >
        {/* 標題列 */}
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-semibold text-ink">回報問題</h2>
          <button
            onClick={handleClose}
            className="text-ink-4 hover:text-ink transition text-xl leading-none"
            aria-label="關閉"
          >
            ✕
          </button>
        </div>

        {done ? (
          <div className="py-6 text-center">
            <p className="text-3xl mb-3">✓</p>
            <p className="text-sm text-ink mb-1 font-medium">感謝你的回報！</p>
            <p className="text-xs text-ink-3 mb-5">我們的團隊會盡快查看。</p>
            <button
              onClick={handleClose}
              className="px-4 py-2 rounded-lg bg-accent text-accent-ink text-sm font-medium"
            >
              關閉
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {/* 類別 */}
            <div>
              <label className="block text-xs text-ink-3 mb-1.5">類別</label>
              <select
                value={category}
                onChange={e => setCategory(e.target.value as IssueCategory)}
                className="w-full rounded-lg border border-border bg-bg px-3 py-2 text-sm text-ink focus:outline-none focus:border-accent"
              >
                {CATEGORY_OPTIONS.map(o => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>

            {/* 說明 */}
            <div>
              <label className="block text-xs text-ink-3 mb-1.5">
                說明 <span className="text-run">*</span>
              </label>
              <textarea
                value={message}
                onChange={e => setMessage(e.target.value)}
                maxLength={500}
                rows={4}
                placeholder={messagePlaceholder ?? DEFAULT_PLACEHOLDER[category]}
                className="w-full rounded-lg border border-border bg-bg px-3 py-2 text-sm text-ink placeholder-ink-4 focus:outline-none focus:border-accent resize-none"
              />
              <p className="text-xs text-ink-4 text-right mt-0.5">{message.length} / 500</p>
            </div>

            {/* 聯絡 Email */}
            <div>
              <label className="block text-xs text-ink-3 mb-1.5">
                聯絡 Email <span className="text-ink-4">（選填，方便我們回覆）</span>
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="your@email.com"
                className="w-full rounded-lg border border-border bg-bg px-3 py-2 text-sm text-ink placeholder-ink-4 focus:outline-none focus:border-accent"
              />
            </div>

            {error && <p className="text-xs text-run">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-lg bg-accent text-accent-ink text-sm font-semibold disabled:opacity-50 transition"
            >
              {loading ? '送出中…' : '送出回報'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
