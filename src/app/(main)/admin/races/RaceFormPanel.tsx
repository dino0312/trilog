'use client'

import { useState } from 'react'
import { RaceForm } from './RaceForm'

export function RaceFormPanel() {
  const [open, setOpen] = useState(false)

  return (
    <div className="rounded-xl border border-border bg-bg-card overflow-hidden">
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-bg-elev/30 transition"
      >
        <div className="flex items-center gap-2">
          <span className="text-accent font-mono text-lg leading-none">{open ? '−' : '+'}</span>
          <span className="text-sm font-semibold text-ink">新增系列賽</span>
        </div>
        <span className="text-xs text-ink-4">{open ? '收合' : '展開'}</span>
      </button>

      {open && (
        <div className="px-5 pb-5 border-t border-border">
          <div className="pt-5">
            <RaceForm onSuccess={() => setOpen(false)} />
          </div>
        </div>
      )}
    </div>
  )
}
