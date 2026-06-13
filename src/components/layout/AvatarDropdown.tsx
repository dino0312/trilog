'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import {
  IconUserEdit,
  IconUser,
  IconTrophy,
  IconHeart,
  IconHeartHandshake,
  IconSettings,
  IconLogout,
} from '@tabler/icons-react'

interface Props {
  email:               string
  name:                string | null
  avatarUrl:           string | null
  userId:              string
  isAssistant:         boolean
  followingCount:      number
  contributionBadge?:  number
}

export function AvatarDropdown({ email, name, avatarUrl, userId, isAssistant, followingCount, contributionBadge = 0 }: Props) {
  const [open, setOpen] = useState(false)
  const ref             = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    if (open) document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  useEffect(() => {
    function handler(e: KeyboardEvent) { if (e.key === 'Escape') setOpen(false) }
    if (open) window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open])

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    window.location.href = '/leaderboard'
  }

  const initial = name ? name[0] : email[0].toUpperCase()

  const divider = (
    <div style={{ borderTop: '0.5px solid rgba(136, 146, 160, 0.2)', margin: '4px 0' }} />
  )

  return (
    <div ref={ref} className="relative ml-2">
      <button
        onClick={() => setOpen(v => !v)}
        className="flex h-8 w-8 items-center justify-center rounded-full bg-bg-elev text-sm font-bold text-ink transition hover:bg-border-strong overflow-hidden"
        aria-label="個人選單"
        aria-expanded={open}
        aria-haspopup="true"
      >
        {avatarUrl
          // eslint-disable-next-line @next/next/no-img-element
          ? <img src={avatarUrl} alt={name ?? email} className="h-8 w-8 object-cover" />
          : initial
        }
      </button>

      {open && (
        <div
          className="absolute right-0 top-full mt-2 w-52 rounded-xl border border-border bg-bg-card shadow-2xl"
          style={{ animation: 'dropdown-in 100ms ease-out' }}
        >
          {/* 身份標頭 */}
          <div className="border-b border-border px-4 py-3">
            <p className="text-sm font-semibold text-ink truncate">{name ?? '（未填姓名）'}</p>
            <p className="text-xs text-ink-4 truncate">{email}</p>
          </div>

          {/* 主選單 */}
          <div className="py-1">
            <DropdownLink href="/profile" icon={<IconUserEdit size={16} stroke={1.5} />} onClick={() => setOpen(false)}>
              個人資料
            </DropdownLink>
            <DropdownLink href={`/athletes/${userId}`} icon={<IconUser size={16} stroke={1.5} />} onClick={() => setOpen(false)}>
              我的公開頁
            </DropdownLink>
            <DropdownLink href="/records" icon={<IconTrophy size={16} stroke={1.5} />} onClick={() => setOpen(false)}>
              我的成績
            </DropdownLink>
            <DropdownLink href="/my/following" icon={<IconHeart size={16} stroke={1.5} />} onClick={() => setOpen(false)}>
              <span className="flex items-center justify-between w-full">
                <span>關注名單</span>
                {followingCount > 0 && (
                  <span className="rounded-full bg-accent/20 px-1.5 py-0.5 text-[10px] font-semibold text-accent">
                    {followingCount}
                  </span>
                )}
              </span>
            </DropdownLink>
            <DropdownLink href="/my/contributions" icon={<IconHeartHandshake size={16} stroke={1.5} />} onClick={() => setOpen(false)}>
              <span className="flex items-center justify-between w-full">
                <span>我的貢獻</span>
                {contributionBadge > 0 && (
                  <span className="rounded-full bg-[#FF6B3D] px-1.5 py-0.5 text-[10px] font-semibold text-white">
                    {contributionBadge > 99 ? '99+' : contributionBadge}
                  </span>
                )}
              </span>
            </DropdownLink>
          </div>

          {/* 管理後台（助手以上） */}
          {isAssistant && (
            <>
              {divider}
              <div className="py-1">
                <DropdownLink href="/admin" icon={<IconSettings size={16} stroke={1.5} />} onClick={() => setOpen(false)}>
                  管理後台
                </DropdownLink>
              </div>
            </>
          )}

          {/* 登出 */}
          {divider}
          <div className="py-1">
            <button
              onClick={handleLogout}
              className="dropdown-item w-full px-4 py-2 text-left text-sm text-ink-3 transition hover:bg-bg-elev hover:text-ink flex items-center gap-2.5"
            >
              <IconLogout size={16} stroke={1.5} className="dropdown-icon shrink-0" />
              登出
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function DropdownLink({
  href,
  icon,
  onClick,
  children,
}: {
  href: string
  icon: React.ReactNode
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className="dropdown-item flex items-center gap-2.5 px-4 py-2 text-sm text-ink-3 transition hover:bg-bg-elev hover:text-ink"
    >
      <span className="dropdown-icon shrink-0">{icon}</span>
      {children}
    </Link>
  )
}
