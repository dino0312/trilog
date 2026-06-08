'use client'

import { useActionState } from 'react'
import { approveRace, rejectRace, type RaceActionState } from '@/app/actions/races'

const initial: RaceActionState = { error: null, success: false }

export function ApproveRaceButton({ raceId }: { raceId: string }) {
  const [state, action, pending] = useActionState(approveRace, initial)
  return (
    <form action={action}>
      <input type="hidden" name="race_id" value={raceId} />
      <button
        type="submit"
        disabled={pending}
        className="px-3 py-1 rounded-lg text-xs font-medium bg-good/10 text-good border border-good/20 hover:bg-good/20 transition disabled:opacity-50"
      >
        {pending ? '處理中…' : '✓ 確認上線'}
      </button>
      {state.error && <p className="mt-1 text-xs text-run">{state.error}</p>}
    </form>
  )
}

export function RejectRaceButton({ raceId }: { raceId: string }) {
  const [state, action, pending] = useActionState(rejectRace, initial)
  return (
    <form action={action}>
      <input type="hidden" name="race_id" value={raceId} />
      <button
        type="submit"
        disabled={pending}
        onClick={e => { if (!confirm('確定要刪除這筆待審核賽事？')) e.preventDefault() }}
        className="px-3 py-1 rounded-lg text-xs font-medium bg-run/10 text-run border border-run/20 hover:bg-run/20 transition disabled:opacity-50"
      >
        {pending ? '處理中…' : '✕ 拒絕'}
      </button>
      {state.error && <p className="mt-1 text-xs text-run">{state.error}</p>}
    </form>
  )
}
