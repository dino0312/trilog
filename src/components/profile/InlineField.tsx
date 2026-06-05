'use client'

import { useRef, useState } from 'react'

interface InlineFieldProps {
  label:        string
  value:        string | null
  placeholder?: string
  required?:    boolean
  onSave:       (value: string) => Promise<string | null>   // returns error msg or null
  type?:        'text' | 'number' | 'select' | 'textarea'
  options?:     { value: string; label: string }[]
  min?:         number
  max?:         number
}

export function InlineField({
  label, value, placeholder, required, onSave,
  type = 'text', options, min, max,
}: InlineFieldProps) {
  const [editing, setEditing]   = useState(false)
  const [draft, setDraft]       = useState(value ?? '')
  const [saving, setSaving]     = useState(false)
  const [error, setError]       = useState<string | null>(null)
  const [success, setSuccess]   = useState(false)
  const inputRef                = useRef<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>(null)

  function startEdit() {
    setDraft(value ?? '')
    setError(null)
    setEditing(true)
    setTimeout(() => (inputRef.current as HTMLElement)?.focus(), 0)
  }

  function cancel() {
    setEditing(false)
    setDraft(value ?? '')
    setError(null)
  }

  async function save() {
    if (saving) return
    setSaving(true)
    setError(null)
    const err = await onSave(draft)
    setSaving(false)
    if (err) { setError(err); return }
    setEditing(false)
    setSuccess(true)
    setTimeout(() => setSuccess(false), 1800)
  }

  const displayValue = (() => {
    if (!value) return null
    if (type === 'select' && options) {
      return options.find(o => o.value === value)?.label ?? value
    }
    return value
  })()

  return (
    <div className="group py-3 border-b border-border last:border-0">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <p className="text-xs text-ink-4 mb-0.5">
            {label}
            {required && <span className="ml-1 text-[#FF6B3D]">*</span>}
          </p>

          {editing ? (
            <div className="flex flex-col gap-1.5">
              {type === 'textarea' ? (
                <textarea
                  ref={inputRef as React.Ref<HTMLTextAreaElement>}
                  value={draft}
                  onChange={e => setDraft(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Escape') cancel()
                    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) save()
                  }}
                  rows={3}
                  placeholder={placeholder}
                  className="w-full rounded-lg border border-border-strong bg-bg-elev px-3 py-2 text-sm text-ink outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 resize-none"
                />
              ) : type === 'select' ? (
                <select
                  ref={inputRef as React.Ref<HTMLSelectElement>}
                  value={draft}
                  onChange={e => setDraft(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Escape') cancel() }}
                  className="w-full rounded-lg border border-border-strong bg-bg-elev px-3 py-2 text-sm text-ink outline-none focus:border-accent"
                >
                  <option value="">不填寫</option>
                  {options?.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              ) : (
                <input
                  ref={inputRef as React.Ref<HTMLInputElement>}
                  type={type}
                  value={draft}
                  onChange={e => setDraft(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Escape') cancel()
                    if (e.key === 'Enter') save()
                  }}
                  placeholder={placeholder}
                  min={min} max={max}
                  className="w-full rounded-lg border border-border-strong bg-bg-elev px-3 py-2 text-sm text-ink outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
                />
              )}

              {error && <p className="text-xs text-red">{error}</p>}

              <div className="flex items-center gap-2">
                <button
                  onClick={save}
                  disabled={saving}
                  className="rounded-md bg-accent px-3 py-1 text-xs font-semibold text-accent-ink hover:brightness-110 disabled:opacity-50"
                >
                  {saving ? '儲存中…' : '儲存'}
                </button>
                <button
                  onClick={cancel}
                  className="rounded-md px-3 py-1 text-xs text-ink-3 hover:text-ink"
                >
                  取消
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={startEdit}
              className="text-left w-full group/val"
            >
              <span className={`text-sm ${displayValue ? 'text-ink' : 'text-ink-4 italic'}`}>
                {displayValue ?? placeholder ?? '點擊填寫'}
              </span>
              {success && <span className="ml-2 text-xs text-green-400">✓ 已儲存</span>}
            </button>
          )}
        </div>

        {!editing && (
          <button
            onClick={startEdit}
            className="opacity-0 group-hover:opacity-100 flex-shrink-0 p-1 text-ink-4 hover:text-ink transition"
            aria-label={`編輯 ${label}`}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
            </svg>
          </button>
        )}
      </div>
    </div>
  )
}
