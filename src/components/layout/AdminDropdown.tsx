'use client'

import Link from 'next/link'
import { useState, useRef, useEffect } from 'react'

const ADMIN_LINKS = [
  { href: '/admin',       label: '審核中心' },
  { href: '/admin/races', label: '賽事管理' },
]

export function AdminDropdown() {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(v => !v)}
        className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-sm text-warn hover:bg-bg-elev transition"
      >
        管理
        <svg className={`w-3 h-3 transition-transform ${open ? 'rotate-180' : ''}`} viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M2 4l4 4 4-4"/>
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1 w-36 rounded-xl border border-border bg-bg-card shadow-lg py-1 z-50">
          {ADMIN_LINKS.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              onClick={() => setOpen(false)}
              className="block px-4 py-2 text-sm text-ink-3 hover:text-ink hover:bg-bg-elev transition"
            >
              {label}
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
