'use client'

import { useActionState } from 'react'
import { updateRelayResult, type ResultState } from '@/app/actions/results'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { secondsToTime } from '@/lib/utils/time'

type Member = {
  id: string
  athlete_id: string | null
  athlete_name_snapshot: string
  disciplines: string[]
  split_seconds: number | null
  claim_status: string
  sort_order: number
}

type Props = {
  teamId: string
  teamName: string | null
  members: Member[]
}

const initial: ResultState = { error: null }

const DISC_LABEL: Record<string, string> = { swim: '游泳', bike: '自行車', run: '跑步' }

export function RelayEditForm({ teamId, teamName, members }: Props) {
  const [state, action, pending] = useActionState(updateRelayResult, initial)

  return (
    <form action={action} className="flex flex-col gap-5">
      <input type="hidden" name="team_id" value={teamId} />

      <Input
        label="隊名（選填）"
        name="team_name"
        defaultValue={teamName ?? ''}
        placeholder="例：鐵人三劍客"
      />

      <div className="flex flex-col gap-3">
        <p className="text-xs font-semibold text-ink-3 uppercase tracking-widest">成員</p>
        {members.map(m => {
          const isClaimed = m.claim_status === 'claimed'
          return (
            <div key={m.id} className="rounded-xl border border-border bg-bg-elev/30 p-4 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-ink-3">
                  {m.disciplines.map(d => DISC_LABEL[d] ?? d).join(' · ')}
                </p>
                {isClaimed && (
                  <span className="text-xs text-good font-medium">✓ 已認領</span>
                )}
              </div>

              {isClaimed ? (
                <p className="text-sm text-ink bg-bg-card rounded-lg px-3 py-2 border border-border">
                  {m.athlete_name_snapshot}
                </p>
              ) : (
                <input
                  type="text"
                  name={`member_${m.id}_name`}
                  defaultValue={m.athlete_name_snapshot}
                  placeholder="成員姓名"
                  className="w-full rounded-lg border border-border bg-bg-card px-3 py-2 text-sm text-ink placeholder:text-ink-4 outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
                />
              )}

              <input
                type="text"
                name={`member_${m.id}_split`}
                defaultValue={m.split_seconds ? secondsToTime(m.split_seconds) : ''}
                placeholder="分項時間（HH:MM:SS，選填）"
                className="w-full rounded-lg border border-border bg-bg-card px-3 py-2 text-sm font-mono text-ink placeholder:text-ink-4 outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
              />
            </div>
          )
        })}
      </div>

      {state.error && <p className="text-sm text-run">{state.error}</p>}

      <Button type="submit" loading={pending}>
        儲存變更
      </Button>
    </form>
  )
}
