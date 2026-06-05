'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

interface Props {
  email:       string
  name:        string | null   // athlete.nickname（spec v27 改名為 name）
  isAssistant: boolean
}

export function AvatarDropdown({ email, name, isAssistant }: Props) {
  const [open, setOpen]     = useState(false)
  const ref                 = useRef<HTMLDivElement>(null)
  const router              = useRouter()

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

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.refresh()
    router.push('/leaderboard')
  }

  /* Avatar 顯示：姓名第一字 or Email 首字母 */
  const initial = name ? name[0] : email[0].toUpperCase()

  return (
    <div ref={ref} className="relative ml-2">
      {/* Avatar 按鈕 */}
      <button
        onClick={() => setOpen(v => !v)}
        className="flex h-8 w-8 items-center justify-center rounded-full bg-bg-elev text-sm font-bold text-ink transition hover:bg-border-strong"
        aria-label="個人選單"
        aria-expanded={open}
        aria-haspopup="true"
      >
        {initial}
      </button>

      {/* 下拉選單 */}
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

          {/* 選單項目 */}
          <div className="py-1">
            <DropdownLink href="/my/results" onClick={() => setOpen(false)}>我的紀錄</DropdownLink>
            <DropdownLink href="/my/profile" onClick={() => setOpen(false)}>個人資料</DropdownLink>
          </div>

          {/* 管理後台（助手以上） */}
          {isAssistant && (
            <div className="border-t border-border py-1">
              <DropdownLink href="/admin" onClick={() => setOpen(false)}>管理後台</DropdownLink>
            </div>
          )}

          {/* 登出 */}
          <div className="border-t border-border py-1">
            <button
              onClick={handleLogout}
              className="w-full px-4 py-2 text-left text-sm text-ink-3 transition hover:bg-bg-elev hover:text-ink"
            >
              登出
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function DropdownLink({ href, onClick, children }: { href: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className="block px-4 py-2 text-sm text-ink-3 transition hover:bg-bg-elev hover:text-ink"
    >
      {children}
    </Link>
  )
}
