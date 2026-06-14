'use client'

import { useState, useEffect, useCallback } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { IconX, IconCheck, IconChevronDown, IconChevronUp } from '@tabler/icons-react'
import { completeOnboarding } from '@/app/actions/onboarding'

interface ChecklistProps {
  isLoggedIn:             boolean
  hasProfile:             boolean
  hasResult:              boolean
  hasCompletedOnboarding: boolean
}

const TASKS = [
  { key: 'login',       label: '建立帳號 / 登入',      href: '/register' },
  { key: 'profile',     label: '完善個人資料',            href: '/my/profile' },
  { key: 'result',      label: '新增或找到你的成績',      href: '/records/new' },
  { key: 'leaderboard', label: '瀏覽最速榜',              href: '/leaderboard' },
] as const

const LS_DISMISSED     = 'tl_onboarding_dismissed'
const LS_LEADERBOARD   = 'tl_visited_leaderboard'
const OPEN_EVENT       = 'trilog:open-onboarding'

export function OnboardingChecklist({
  isLoggedIn,
  hasProfile,
  hasResult,
  hasCompletedOnboarding,
}: ChecklistProps) {
  const pathname = usePathname()
  const [dismissed,         setDismissed]         = useState(true)
  const [collapsed,         setCollapsed]          = useState(false)
  const [visitedLeaderboard, setVisitedLeaderboard] = useState(false)
  const [marked,            setMarked]             = useState(false)

  // 初始化：讀 localStorage + 判斷是否已完成
  useEffect(() => {
    if (hasCompletedOnboarding) { setDismissed(true); return }
    if (localStorage.getItem(LS_DISMISSED) === '1') { setDismissed(true); return }
    setVisitedLeaderboard(localStorage.getItem(LS_LEADERBOARD) === '1')
    setDismissed(false)
  }, [hasCompletedOnboarding])

  // 偵測最速榜造訪
  useEffect(() => {
    if (pathname === '/leaderboard') {
      localStorage.setItem(LS_LEADERBOARD, '1')
      setVisitedLeaderboard(true)
    }
  }, [pathname])

  // 重新打開 checklist 的 custom event
  const handleOpen = useCallback(() => {
    setDismissed(false)
    setCollapsed(false)
  }, [])

  useEffect(() => {
    window.addEventListener(OPEN_EVENT, handleOpen)
    return () => window.removeEventListener(OPEN_EVENT, handleOpen)
  }, [handleOpen])

  const done = {
    login:       isLoggedIn,
    profile:     hasProfile,
    result:      hasResult,
    leaderboard: visitedLeaderboard,
  }
  const doneCount = Object.values(done).filter(Boolean).length
  const allDone   = doneCount === 4

  // 全部完成 → 標記 DB
  useEffect(() => {
    if (allDone && !marked && isLoggedIn) {
      setMarked(true)
      completeOnboarding()
    }
  }, [allDone, marked, isLoggedIn])

  if (dismissed) return null

  function dismiss() {
    localStorage.setItem(LS_DISMISSED, '1')
    setDismissed(true)
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 w-72 rounded-xl border border-border bg-bg-card shadow-xl">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <button
          onClick={() => setCollapsed(c => !c)}
          className="flex items-center gap-2 flex-1 text-left"
        >
          <span className="text-sm font-semibold text-ink">開始使用 Tri·log</span>
          <span className="text-xs text-ink-3 ml-auto">{doneCount}/4</span>
          {collapsed
            ? <IconChevronUp size={14} className="text-ink-3" />
            : <IconChevronDown size={14} className="text-ink-3" />
          }
        </button>
        <button
          onClick={dismiss}
          className="ml-2 text-ink-3 hover:text-ink transition"
          aria-label="關閉"
        >
          <IconX size={14} />
        </button>
      </div>

      {!collapsed && (
        <>
          {/* Progress bar */}
          <div className="px-4 pt-3 pb-1">
            <div className="h-1.5 w-full rounded-full bg-border overflow-hidden">
              <div
                className="h-full rounded-full bg-accent transition-all duration-500"
                style={{ width: `${(doneCount / 4) * 100}%` }}
              />
            </div>
          </div>

          {/* Tasks */}
          <ul className="px-4 py-2 space-y-1">
            {TASKS.map(({ key, label, href }) => {
              const isDone = done[key]
              return (
                <li key={key}>
                  <Link
                    href={isDone ? '#' : href}
                    onClick={isDone ? e => e.preventDefault() : undefined}
                    className={[
                      'flex items-center gap-2.5 rounded-lg px-2 py-1.5 text-sm transition',
                      isDone
                        ? 'text-ink-3 cursor-default'
                        : 'text-ink hover:bg-bg',
                    ].join(' ')}
                  >
                    <span className={[
                      'flex h-4 w-4 shrink-0 items-center justify-center rounded-full border',
                      isDone ? 'bg-accent border-accent' : 'border-ink-3',
                    ].join(' ')}>
                      {isDone && <IconCheck size={10} stroke={3} className="text-bg" />}
                    </span>
                    <span className={isDone ? 'line-through' : ''}>{label}</span>
                  </Link>
                </li>
              )
            })}
          </ul>

          {allDone && (
            <div className="px-4 pb-3">
              <p className="text-xs text-center text-accent font-medium">🎉 全部完成！歡迎加入 Tri·log</p>
            </div>
          )}
        </>
      )}
    </div>
  )
}

/** 觸發重新打開 checklist 的工具函式，供其他 Client Component 呼叫 */
export function openOnboardingChecklist() {
  window.dispatchEvent(new CustomEvent(OPEN_EVENT))
}
