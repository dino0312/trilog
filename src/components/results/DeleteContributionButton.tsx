'use client'

import { useActionState } from 'react'
import { deleteContribution, type ResultState } from '@/app/actions/results'

const initial: ResultState = { error: null }

export function DeleteContributionButton({ id }: { id: string }) {
  const [state, action, pending] = useActionState(deleteContribution, initial)

  function handleClick(e: React.MouseEvent) {
    if (!window.confirm('確定要刪除這筆成績嗎？此動作無法復原。')) {
      e.preventDefault()
    }
  }

  return (
    <form action={action}>
      <input type="hidden" name="id" value={id} />
      <button
        type="submit"
        disabled={pending}
        onClick={handleClick}
        style={{
          fontSize: '12px',
          color: pending ? 'var(--ink-4)' : 'var(--run)',
          background: 'transparent',
          border: 'none',
          padding: '4px 8px',
          borderRadius: '6px',
          cursor: pending ? 'not-allowed' : 'pointer',
          transition: 'background 0.1s',
        }}
        onMouseEnter={e => { if (!pending) (e.currentTarget as HTMLButtonElement).style.background = 'rgba(232,68,58,0.08)' }}
        onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent' }}
      >
        {pending ? '刪除中…' : '刪除'}
      </button>
      {state.error && (
        <p style={{ fontSize: '11px', color: 'var(--run)', marginTop: '2px' }}>{state.error}</p>
      )}
    </form>
  )
}
