'use client'

import { useActionState } from 'react'
import { useAuthModal } from '@/context/auth-modal'
import { toggleRaceInterest, type InterestState } from '@/app/actions/race-interest'

const INIT: InterestState = { error: null, active: false }

function InterestButton({
  editionId,
  type,
  initialActive,
  isLoggedIn,
  label,
  activeLabel,
  activeClass,
}: {
  editionId: string
  type: 'wishlist' | 'attended'
  initialActive: boolean
  isLoggedIn: boolean
  label: string
  activeLabel: string
  activeClass: string
}) {
  const { open } = useAuthModal()
  const [state, formAction, pending] = useActionState(
    toggleRaceInterest,
    { ...INIT, active: initialActive },
  )

  if (!isLoggedIn) {
    return (
      <button
        type="button"
        onClick={() => open(type === 'wishlist' ? 'race_wishlist' : 'race_attended')}
        className="text-xs px-2.5 py-1 rounded-lg border border-border text-ink-4 hover:border-border-strong hover:text-ink-3 transition"
      >
        {label}
      </button>
    )
  }

  return (
    <form action={formAction}>
      <input type="hidden" name="race_edition_id" value={editionId} />
      <input type="hidden" name="interest_type" value={type} />
      <button
        type="submit"
        disabled={pending}
        className={`text-xs px-2.5 py-1 rounded-lg border transition disabled:opacity-50 ${
          state.active
            ? activeClass
            : 'border-border text-ink-4 hover:border-border-strong hover:text-ink-3'
        }`}
      >
        {state.active ? activeLabel : label}
      </button>
    </form>
  )
}

export function RaceInterestButtons({
  editionId,
  isLoggedIn,
  initialWishlist,
  initialAttended,
}: {
  editionId: string
  isLoggedIn: boolean
  initialWishlist: boolean
  initialAttended: boolean
}) {
  return (
    <div className="flex items-center gap-1.5">
      <InterestButton
        editionId={editionId}
        type="wishlist"
        initialActive={initialWishlist}
        isLoggedIn={isLoggedIn}
        label="想參加"
        activeLabel="✓ 想參加"
        activeClass="border-accent/40 text-accent bg-accent/10"
      />
      <InterestButton
        editionId={editionId}
        type="attended"
        initialActive={initialAttended}
        isLoggedIn={isLoggedIn}
        label="參加過"
        activeLabel="✓ 參加過"
        activeClass="border-[#FF6B3D]/40 text-[#FF6B3D] bg-[#FF6B3D]/10"
      />
    </div>
  )
}
