'use client'

import { useActionState } from 'react'
import { approveClaim, rejectClaim, resetClaim, type AdminActionState } from '@/app/actions/admin'

const INIT: AdminActionState = { error: null, success: false }

export function ApproveButton({ resultId }: { resultId: string }) {
  const [state, action, pending] = useActionState(approveClaim, INIT)
  return (
    <form action={action}>
      <input type="hidden" name="result_id" value={resultId} />
      <button
        disabled={pending || state.success}
        className="rounded-lg bg-good px-3 py-1.5 text-xs font-semibold text-bg disabled:opacity-50 hover:brightness-110 transition"
      >
        {state.success ? '已核准 ✓' : pending ? '處理中…' : '核准'}
      </button>
      {state.error && <p className="mt-1 text-xs text-bad">{state.error}</p>}
    </form>
  )
}

export function RejectButton({ resultId }: { resultId: string }) {
  const [state, action, pending] = useActionState(rejectClaim, INIT)
  return (
    <form action={action}>
      <input type="hidden" name="result_id" value={resultId} />
      <button
        disabled={pending || state.success}
        className="rounded-lg border border-border-strong px-3 py-1.5 text-xs font-semibold text-ink-3 disabled:opacity-50 hover:border-bad hover:text-bad transition"
      >
        {state.success ? '已拒絕 ✓' : pending ? '處理中…' : '拒絕'}
      </button>
      {state.error && <p className="mt-1 text-xs text-bad">{state.error}</p>}
    </form>
  )
}

export function ResetButton({ resultId }: { resultId: string }) {
  const [state, action, pending] = useActionState(resetClaim, INIT)
  return (
    <form action={action}>
      <input type="hidden" name="result_id" value={resultId} />
      <button
        disabled={pending || state.success}
        onClick={e => { if (!confirm('確定將此成績重設為未認領？')) e.preventDefault() }}
        className="rounded-lg border border-border-strong px-3 py-1.5 text-xs font-semibold text-warn disabled:opacity-50 hover:border-warn transition"
      >
        {state.success ? '已重設 ✓' : pending ? '處理中…' : '強制重設'}
      </button>
      {state.error && <p className="mt-1 text-xs text-bad">{state.error}</p>}
    </form>
  )
}
