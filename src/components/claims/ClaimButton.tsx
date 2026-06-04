'use client'

import { useActionState } from 'react'
import { claimResult, type ClaimState } from '@/app/actions/claims'

const initial: ClaimState = { error: null, success: false }

export function ClaimButton({ resultId, visible = true }: { resultId: string; visible?: boolean }) {
  const [state, action, pending] = useActionState(claimResult, initial)

  if (!visible) return null

  if (state.success) {
    return <p className="text-xs text-good font-medium">✓ 申請已提交</p>
  }

  return (
    <form action={action}>
      <input type="hidden" name="result_id" value={resultId} />
      {state.error && <p className="text-xs text-red mb-1">{state.error}</p>}
      <button
        type="submit"
        disabled={pending}
        className="rounded-lg border border-accent px-3 py-1.5 text-xs font-semibold text-accent hover:bg-accent hover:text-accent-ink transition disabled:opacity-50"
      >
        {pending ? '處理中…' : '這是我的成績'}
      </button>
    </form>
  )
}
