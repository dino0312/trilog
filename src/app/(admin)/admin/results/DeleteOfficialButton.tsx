'use client'

import { useActionState } from 'react'
import { deleteOfficialResult, type OfficialResultState } from '@/app/actions/official'

const initial: OfficialResultState = { error: null, success: false }

export function DeleteOfficialButton({ resultId }: { resultId: string }) {
  const [state, action, pending] = useActionState(deleteOfficialResult, initial)

  if (state.success) return <span className="text-xs text-ink-4">已刪除</span>

  return (
    <form action={action} className="inline">
      <input type="hidden" name="id" value={resultId} />
      {state.error && <p className="text-xs text-red">{state.error}</p>}
      <button
        type="submit"
        disabled={pending}
        className="text-xs text-red/50 hover:text-red transition disabled:opacity-50"
      >
        {pending ? '…' : '刪除'}
      </button>
    </form>
  )
}
