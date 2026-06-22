'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { updateRaceFollow } from '@/app/actions/race-follows'

export function UpgradeToRegisteredButton({ followId }: { followId: string }) {
  const [pending, startTransition] = useTransition()
  const router = useRouter()

  function handle() {
    startTransition(async () => {
      const result = await updateRaceFollow(followId, { status: 'registered' })
      if (!result.error) router.refresh()
    })
  }

  return (
    <button
      onClick={handle}
      disabled={pending}
      className="rounded-lg border border-accent/50 px-3 py-1.5 text-xs text-accent hover:bg-accent/10 transition disabled:opacity-50"
    >
      升級為已報名
    </button>
  )
}
