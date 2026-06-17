'use client'

import Link from 'next/link'
import { useState } from 'react'
import { ReportModal } from '@/components/reports/ReportModal'

export function Footer() {
  const [open, setOpen] = useState(false)

  return (
    <footer className="border-t border-border py-4 px-6 mt-8">
      <div className="mx-auto max-w-4xl flex items-center justify-between text-xs text-ink-4">
        <div className="flex items-center gap-4">
          <span>© 2026 Tri·log · trilog.run</span>
          <Link href="/about" className="hover:text-ink transition underline underline-offset-2">
            關於
          </Link>
        </div>
        <button
          onClick={() => setOpen(true)}
          className="hover:text-ink transition underline underline-offset-2"
        >
          回報問題
        </button>
      </div>
      <ReportModal open={open} onClose={() => setOpen(false)} />
    </footer>
  )
}
