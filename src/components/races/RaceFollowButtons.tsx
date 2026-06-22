'use client'

import { useState, useTransition } from 'react'
import { IconBookmark, IconBookmarkFilled, IconFlag, IconFlagFilled } from '@tabler/icons-react'
import { createRaceFollow, updateRaceFollow, type RaceFollowStatus } from '@/app/actions/race-follows'

interface Props {
  raceEditionId: string
  initialFollow: { id: string; status: RaceFollowStatus } | null
  raceDate: string
}

export function RaceFollowButtons({ raceEditionId, initialFollow, raceDate }: Props) {
  const [follow, setFollow] = useState(initialFollow)
  const [pending, startTransition] = useTransition()

  const today = new Date().toISOString().slice(0, 10)
  const isPast = raceDate <= today

  async function handleWatch() {
    startTransition(async () => {
      const result = await createRaceFollow(raceEditionId, 'watching')
      if (!result.error && result.data) setFollow(result.data)
    })
  }

  async function handleRegistered() {
    if (follow && follow.status === 'watching') {
      startTransition(async () => {
        const result = await updateRaceFollow(follow.id, { status: 'registered' })
        if (!result.error && result.data) setFollow(result.data)
      })
    } else if (!follow) {
      startTransition(async () => {
        const result = await createRaceFollow(raceEditionId, 'registered')
        if (!result.error && result.data) setFollow(result.data)
      })
    }
  }

  if (follow && (follow.status === 'completed' || follow.status === 'dns' || follow.status === 'dnf')) {
    const label = follow.status === 'completed' ? '已完賽' : follow.status.toUpperCase()
    const isCompleted = follow.status === 'completed'
    return (
      <span
        className="inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold"
        style={{
          background: isCompleted ? 'var(--accent-soft)' : 'rgba(136,146,160,0.12)',
          color: isCompleted ? 'var(--accent)' : 'var(--ink-3)',
        }}
      >
        {label}
      </span>
    )
  }

  if (follow?.status === 'registered') {
    return (
      <span
        className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold"
        style={{ background: '#FF6B3D22', color: '#FF6B3D' }}
      >
        <IconFlagFilled size={14} />
        已報名
      </span>
    )
  }

  return (
    <div className="flex items-center gap-2">
      {!isPast && !follow && (
        <button
          onClick={handleWatch}
          disabled={pending}
          className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1 text-xs text-ink-3 transition hover:bg-bg-elev hover:text-ink disabled:opacity-50"
        >
          <IconBookmark size={14} />
          關注
        </button>
      )}
      {!isPast && follow?.status === 'watching' && (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-bg-elev px-3 py-1 text-xs text-ink-3">
          <IconBookmarkFilled size={14} />
          已關注
        </span>
      )}
      <button
        onClick={handleRegistered}
        disabled={pending}
        className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1 text-xs text-ink-3 transition hover:bg-bg-elev hover:text-ink disabled:opacity-50"
      >
        <IconFlag size={14} />
        已報名
      </button>
    </div>
  )
}
