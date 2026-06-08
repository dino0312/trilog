'use client'

import { useActionState, useRef, useState } from 'react'
import { deleteRace } from '@/app/actions/races'

const INIT = { error: null, success: false }

export function DeleteRaceButton({ raceId, raceName }: { raceId: string; raceName: string }) {
  const [confirming, setConfirming] = useState(false)
  const [state, formAction, pending] = useActionState(deleteRace, INIT)
  const formRef = useRef<HTMLFormElement>(null)

  if (!confirming) {
    return (
      <button
        type="button"
        onClick={() => setConfirming(true)}
        className="text-xs px-3 py-1.5 rounded-lg border border-red-500/30 text-red-400 hover:bg-red-500/10 transition"
      >
        刪除賽事
      </button>
    )
  }

  return (
    <div className="flex flex-col gap-2 items-end">
      <p className="text-xs text-red-400 text-right">
        確定刪除「{raceName}」？此操作無法復原。
      </p>
      {state.error && (
        <p className="text-xs text-red-400 text-right max-w-xs">{state.error}</p>
      )}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setConfirming(false)}
          className="text-xs px-3 py-1.5 rounded-lg border border-border text-ink-3 hover:text-ink transition"
        >
          取消
        </button>
        <form ref={formRef} action={formAction}>
          <input type="hidden" name="race_id" value={raceId} />
          <button
            type="submit"
            disabled={pending}
            className="text-xs px-3 py-1.5 rounded-lg bg-red-500/15 border border-red-500/40 text-red-400 hover:bg-red-500/25 disabled:opacity-50 transition"
          >
            {pending ? '刪除中…' : '確認刪除'}
          </button>
        </form>
      </div>
    </div>
  )
}
