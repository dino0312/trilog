'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'

interface Props {
  isAssistant: boolean
}

export function AddDropdown({ isAssistant }: Props) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  /* 點擊外部關閉 */
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    if (open) document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  /* Escape 關閉 */
  useEffect(() => {
    function handler(e: KeyboardEvent) { if (e.key === 'Escape') setOpen(false) }
    if (open) window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open])

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(v => !v)}
        aria-expanded={open}
        aria-haspopup="true"
        className="flex items-center gap-1 rounded-lg border border-[#FF6B3D] bg-[rgba(255,107,61,0.08)] px-3 py-1.5 text-sm font-medium text-[#FF6B3D] transition hover:bg-[#FF6B3D] hover:text-white"
      >
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <line x1="12" y1="5" x2="12" y2="19"/>
          <line x1="5"  y1="12" x2="19" y2="12"/>
        </svg>
        新增
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className={`transition-transform ${open ? 'rotate-180' : ''}`}>
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </button>

      {open && (
        <div
          className="absolute right-0 top-full mt-2 w-44 rounded-xl border border-border bg-bg-card shadow-2xl z-50"
          style={{ animation: 'dropdown-in 100ms ease-out' }}
        >
          <div className="py-1">
            <Item href="/records/new" onClick={() => setOpen(false)}>
              <IconSolo /> 自己的成績
            </Item>
            <Item href="/records/new?for=other" onClick={() => setOpen(false)}>
              <IconOther /> 他人成績
            </Item>
            {isAssistant && (
              <>
                <div className="my-1 border-t border-border" />
                <Item href="/admin/races" onClick={() => setOpen(false)}>
                  <IconRace /> 新增賽事
                </Item>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function Item({ href, onClick, children }: { href: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className="flex items-center gap-2.5 px-4 py-2 text-sm text-ink-3 transition hover:bg-bg-elev hover:text-ink"
    >
      {children}
    </Link>
  )
}

function IconSolo() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 text-ink-4">
      <circle cx="12" cy="8" r="4"/>
      <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
    </svg>
  )
}

function IconOther() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 text-ink-4">
      <circle cx="9" cy="8" r="3.5"/>
      <path d="M2 20c0-3.5 3.1-6 7-6s7 2.5 7 6"/>
      <path d="M17 11c1.7 0 3 1.3 3 3"/>
      <path d="M22 20c0-2.2-1.3-4-3-4"/>
    </svg>
  )
}

function IconRace() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 text-ink-4">
      <rect x="3" y="4" width="18" height="16" rx="2"/>
      <line x1="3" y1="9" x2="21" y2="9"/>
      <line x1="8" y1="2" x2="8" y2="6"/>
      <line x1="16" y1="2" x2="16" y2="6"/>
    </svg>
  )
}
