'use client'

import { useActionState } from 'react'
import { useAuthModal } from '@/context/auth-modal'
import { toggleRaceInterest, type InterestState } from '@/app/actions/race-interest'

const INIT: InterestState = { error: null, active: false }

function InterestButton({
  raceId,
  year,
  type,
  initialActive,
  initialCount,
  isLoggedIn,
  label,
  activeLabel,
  activeClass,
}: {
  raceId: string
  year: number
  type: 'wishlist' | 'attended'
  initialActive: boolean
  initialCount: number
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

  const delta = state.active !== initialActive ? (state.active ? 1 : -1) : 0
  const displayCount = initialCount + delta

  if (!isLoggedIn) {
    return (
      <button
        type="button"
        onClick={() => open(type === 'wishlist' ? 'race_wishlist' : 'race_attended', { raceId, year })}
        className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg border border-border text-ink-4 hover:border-border-strong hover:text-ink-3 transition whitespace-nowrap flex-shrink-0"
      >
        <span>{label}</span>
        {displayCount > 0 && <span className="font-mono">{displayCount}</span>}
      </button>
    )
  }

  return (
    <form action={formAction}>
      <input type="hidden" name="race_id" value={raceId} />
      <input type="hidden" name="year" value={year} />
      <input type="hidden" name="interest_type" value={type} />
      <button
        type="submit"
        disabled={pending}
        className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg border transition disabled:opacity-50 whitespace-nowrap flex-shrink-0 ${
          state.active
            ? activeClass
            : 'border-border text-ink-4 hover:border-border-strong hover:text-ink-3'
        }`}
      >
        <span>{state.active ? activeLabel : label}</span>
        {displayCount > 0 && (
          <span className={`font-mono ${state.active ? 'opacity-80' : 'text-ink-4'}`}>
            {displayCount}
          </span>
        )}
      </button>
    </form>
  )
}

export function RaceInterestButtons({
  raceId,
  year,
  isLoggedIn,
  initialWishlist,
  initialAttended,
  wishlistCount,
  attendedCount,
  showWishlist = true,
  showAttended = true,
}: {
  raceId: string
  year: number
  isLoggedIn: boolean
  initialWishlist: boolean
  initialAttended: boolean
  wishlistCount: number
  attendedCount: number
  showWishlist?: boolean
  showAttended?: boolean
}) {
  return (
    <div className="flex items-center gap-1.5">
      <span style={{ visibility: showWishlist ? 'visible' : 'hidden' }}>
        <InterestButton
          raceId={raceId}
          year={year}
          type="wishlist"
          initialActive={initialWishlist}
          initialCount={wishlistCount}
          isLoggedIn={isLoggedIn}
          label="想參加"
          activeLabel="✓ 想參加"
          activeClass="border-accent/40 text-accent bg-accent/10"
        />
      </span>
      <span style={{ visibility: showAttended ? 'visible' : 'hidden' }}>
        <InterestButton
          raceId={raceId}
          year={year}
          type="attended"
          initialActive={initialAttended}
          initialCount={attendedCount}
          isLoggedIn={isLoggedIn}
          label="參加過"
          activeLabel="✓ 參加過"
          activeClass="border-[#FF6B3D]/40 text-[#FF6B3D] bg-[#FF6B3D]/10"
        />
      </span>
    </div>
  )
}
