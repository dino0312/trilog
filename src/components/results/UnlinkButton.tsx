'use client'

import { useActionState, useState } from 'react'
import { unlinkResult, type ResultState } from '@/app/actions/results'

const initial: ResultState = { error: null }

export function UnlinkButton({ resultId }: { resultId: string }) {
  const [confirm, setConfirm] = useState(false)
  const [state, action, pending] = useActionState(unlinkResult, initial)

  if (state.error) return <p className="text-xs text-red">{state.error}</p>

  if (!confirm) {
    return (
      <button
        type="button"
        onClick={() => setConfirm(true)}
        className="text-xs text-ink-4 hover:text-ink-3 transition px-2 py-1 rounded hover:bg-bg-elev"
      >
        解除關聯
      </button>
    )
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-ink-3">解除後成績將回到公共狀態，確定？</span>
      <form action={action} className="flex gap-1">
        <input type="hidden" name="id" value={resultId} />
        <button
          type="submit"
          disabled={pending}
          className="text-xs text-red hover:underline disabled:opacity-50"
        >
          {pending ? '處理中…' : '確認'}
        </button>
        <span className="text-ink-4 text-xs">·</span>
        <button
          type="button"
          onClick={() => setConfirm(false)}
          className="text-xs text-ink-4 hover:text-ink-3"
        >
          取消
        </button>
      </form>
    </div>
  )
}
