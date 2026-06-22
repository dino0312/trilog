'use client'

import { useState, useTransition, useRef, useEffect } from 'react'
import { IconX } from '@tabler/icons-react'
import { updateRaceFollow, type RaceFollowStatus } from '@/app/actions/race-follows'

interface Props {
  raceFollowId: string
  raceEditionId: string
  raceName: string
  onComplete?: (status: RaceFollowStatus) => void
  trigger: React.ReactNode
}

export function RaceFollowStatusModal({ raceFollowId, raceName, onComplete, trigger }: Props) {
  const [open, setOpen] = useState(false)
  const [choice, setChoice] = useState<'dns' | 'dnf' | null>(null)
  const [reason, setReason] = useState('')
  const [isPublic, setIsPublic] = useState(false)
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const overlayRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handler(e: KeyboardEvent) { if (e.key === 'Escape') setOpen(false) }
    if (open) window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open])

  function handleOverlayClick(e: React.MouseEvent<HTMLDivElement>) {
    if (e.target === overlayRef.current) setOpen(false)
  }

  async function handleSubmit(status: 'completed' | 'dns' | 'dnf') {
    startTransition(async () => {
      const result = await updateRaceFollow(raceFollowId, {
        status,
        dns_dnf_reason: status !== 'completed' ? reason || null : null,
        dns_dnf_public: status !== 'completed' ? isPublic : false,
      })
      if (result.error) { setError(result.error); return }
      setOpen(false)
      onComplete?.(status)
    })
  }

  return (
    <>
      <span onClick={() => setOpen(true)} className="contents">{trigger}</span>
      {open && (
        <div
          ref={overlayRef}
          onClick={handleOverlayClick}
          className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 p-4"
        >
          <div
            className="w-full max-w-md rounded-2xl border border-border bg-bg-card p-6 shadow-2xl"
            style={{ animation: 'dropdown-in 150ms ease-out' }}
          >
            <div className="flex items-center justify-between mb-4">
              <p className="text-base font-semibold text-ink">{raceName}</p>
              <button onClick={() => setOpen(false)} className="text-ink-4 hover:text-ink transition">
                <IconX size={18} />
              </button>
            </div>

            {error && (
              <p className="mb-3 rounded-lg bg-red-500/10 px-3 py-2 text-xs text-red-400">{error}</p>
            )}

            <div className="space-y-2">
              <button
                onClick={() => handleSubmit('completed')}
                disabled={pending}
                className="w-full rounded-xl border border-border bg-bg-elev px-4 py-3 text-left text-sm font-medium text-ink transition hover:bg-border disabled:opacity-50"
              >
                ✅ 認領 / 登錄成績
              </button>
              <button
                onClick={() => setChoice('dns')}
                className={`w-full rounded-xl border px-4 py-3 text-left text-sm font-medium transition ${choice === 'dns' ? 'border-ink-3 bg-bg-elev text-ink' : 'border-border text-ink-3 hover:bg-bg-elev'}`}
              >
                🚫 DNS（報名未出賽）
              </button>
              <button
                onClick={() => setChoice('dnf')}
                className={`w-full rounded-xl border px-4 py-3 text-left text-sm font-medium transition ${choice === 'dnf' ? 'border-ink-3 bg-bg-elev text-ink' : 'border-border text-ink-3 hover:bg-bg-elev'}`}
              >
                🏳️ DNF（未完賽）
              </button>
            </div>

            {choice && (
              <div className="mt-4 space-y-3">
                <textarea
                  value={reason}
                  onChange={e => setReason(e.target.value)}
                  maxLength={200}
                  placeholder="原因（選填）"
                  rows={3}
                  className="w-full rounded-xl border border-border bg-bg px-3 py-2 text-sm text-ink placeholder:text-ink-4 focus:outline-none focus:ring-1 focus:ring-accent/50 resize-none"
                />
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isPublic}
                    onChange={e => setIsPublic(e.target.checked)}
                    className="rounded"
                  />
                  <span className="text-xs text-ink-3">公開顯示原因</span>
                </label>
                <button
                  onClick={() => handleSubmit(choice)}
                  disabled={pending}
                  className="w-full rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-bg transition hover:opacity-90 disabled:opacity-50"
                >
                  確認標記為 {choice.toUpperCase()}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}
