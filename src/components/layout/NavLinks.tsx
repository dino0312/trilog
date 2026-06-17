'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const PUBLIC_LINKS = [
  { href: '/leaderboard', label: '最速榜' },
  { href: '/unclaimed',   label: '未認領' },
  { href: '/races',       label: '賽事' },
  { href: '/about',       label: '關於' },
]

const AUTH_LINKS = [
  { href: '/leaderboard', label: '最速榜' },
  { href: '/unclaimed',   label: '未認領' },
  { href: '/races',       label: '賽事' },
  { href: '/records',      label: '我的成績' },
  { href: '/my/following', label: '關注名單' },
]

type Props = { isLoggedIn?: boolean }

export function NavLinks({ isLoggedIn = false }: Props) {
  const pathname = usePathname()
  const links = isLoggedIn ? AUTH_LINKS : PUBLIC_LINKS

  return (
    <>
      {links.map(({ href, label }) => {
        const active = pathname === href || pathname.startsWith(href + '/')
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? 'page' : undefined}
            className="flex h-14 items-center px-3.5 text-sm transition-colors"
            style={{
              color:        active ? '#F0EDE6' : '#4A5568',
              borderBottom: active ? '2px solid #FF6B3D' : '2px solid transparent',
            }}
            onMouseEnter={e => {
              if (!active) (e.currentTarget as HTMLAnchorElement).style.color = '#8A96A8'
            }}
            onMouseLeave={e => {
              if (!active) (e.currentTarget as HTMLAnchorElement).style.color = '#4A5568'
            }}
          >
            {label}
          </Link>
        )
      })}
    </>
  )
}
