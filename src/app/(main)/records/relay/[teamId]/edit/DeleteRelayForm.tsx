'use client'

import { useActionState, useState } from 'react'
import { deleteRelayResult, type ResultState } from '@/app/actions/results'
import { Button } from '@/components/ui/Button'

const initial: ResultState = { error: null }

export function DeleteRelayForm({ teamId, teamName }: { teamId: string; teamName: string | null }) {
  const [state, action, pending] = useActionState(deleteRelayResult, initial)
  const [confirmName, setConfirmName] = useState('')

  const expectedName = teamName?.trim() ?? ''
  const deleteReady = expectedName
    ? confirmName.trim() === expectedName
    : confirmName.trim().length > 0

  return (
    <div className="rounded-xl border border-border bg-bg-card p-5">
      <h2 className="text-sm font-semibold text-ink mb-1">刪除接力成績</h2>
      <p className="text-xs text-ink-3 mb-4">
        此操作無法還原。請輸入隊名{expectedName ? `「${expectedName}」` : ''}確認刪除。
      </p>

      <input
        type="text"
        value={confirmName}
        onChange={e => setConfirmName(e.target.value)}
        placeholder={expectedName || '輸入文字確認'}
        className="w-full rounded-lg border border-border-strong bg-bg-elev px-3.5 py-2.5 text-sm text-ink placeholder:text-ink-4 outline-none focus:border-run/60 focus:ring-2 focus:ring-run/20 mb-4"
      />

      <form action={action}>
        <input type="hidden" name="team_id" value={teamId} />
        {state.error && <p className="text-sm text-run mb-3">{state.error}</p>}
        <Button
          type="submit"
          loading={pending}
          disabled={!deleteReady}
          className="w-full bg-run hover:brightness-110"
        >
          確認刪除此接力成績
        </Button>
      </form>
    </div>
  )
}
