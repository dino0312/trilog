'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const TABS = [
  { href: '/admin',                label: '審核中心' },
  { href: '/admin/reports',        label: '問題回報' },
  { href: '/admin/races',          label: '賽事管理' },
  { href: '/admin/races/review',   label: '賽事審核' },
  { href: '/admin/results',        label: '官方成績' },
  { href: '/admin/members',        label: '會員名單' },
  { href: '/admin/manage-results', label: '成績維護' },
]

export function AdminTabs() {
  const pathname = usePathname()

  return (
    <div className="border-b border-border bg-bg">
      <div className="mx-auto max-w-4xl px-4 flex gap-0.5 pt-5">
        {TABS.map(({ href, label }) => {
          const isActive = href === '/admin' ? pathname === '/admin' : pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              style={{ position: 'relative', top: '1px' }}
              className={[
                'px-4 py-2 text-sm font-medium rounded-t-lg border transition',
                isActive
                  ? 'text-ink border-border border-b-bg bg-bg-card'
                  : 'text-ink-3 hover:text-ink border-transparent hover:border-border',
              ].join(' ')}
            >
              {label}
            </Link>
          )
        })}
      </div>
    </div>
  )
}
