'use client'

import { useState, useTransition } from 'react'
import { useAuthModal } from '@/context/auth-modal'

interface Props {
  athleteId:        string
  athleteName:      string
  initialFollowing: boolean
  isLoggedIn:       boolean
  size?:            'sm' | 'md'
}

export function FollowButton({
  athleteId,
  athleteName,
  initialFollowing,
  isLoggedIn,
  size = 'md',
}: Props) {
  const [following, setFollowing] = useState(initialFollowing)
  const [isPending, startTransition] = useTransition()
  const { open } = useAuthModal()

  const iconSize = size === 'sm' ? 16 : 20

  async function toggle() {
    if (!isLoggedIn) {
      open('follow', { athleteId })
      return
    }

    if (following) {
      const confirmed = window.confirm(`取消關注 ${athleteName}？`)
      if (!confirmed) return
    }

    startTransition(async () => {
      // Optimistic update
      setFollowing(f => !f)
      try {
        const res = await fetch(`/api/athletes/${athleteId}/follow`, {
          method: following ? 'DELETE' : 'POST',
        })
        if (!res.ok) {
          // 回滾
          setFollowing(f => !f)
        }
      } catch {
        setFollowing(f => !f)
      }
    })
  }

  return (
    <button
      onClick={e => { e.preventDefault(); e.stopPropagation(); toggle() }}
      disabled={isPending}
      aria-label={following ? `取消關注 ${athleteName}` : `關注 ${athleteName}`}
      title={following ? `取消關注 ${athleteName}` : `關注 ${athleteName}`}
      className="flex items-center justify-center rounded-md p-1 transition hover:bg-bg-elev disabled:opacity-50"
    >
      {following ? (
        <svg
          width={iconSize} height={iconSize}
          viewBox="0 0 24 24"
          fill="currentColor"
          className="text-accent"
        >
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
      ) : (
        <svg
          width={iconSize} height={iconSize}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-ink-4 hover:text-ink-3"
        >
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
      )}
    </button>
  )
}
