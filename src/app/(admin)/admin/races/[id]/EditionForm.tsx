'use client'

import { useActionState, useEffect } from 'react'
import { createEdition, type RaceActionState } from '@/app/actions/races'
import { Button } from '@/components/ui/Button'

const initial: RaceActionState = { error: null, success: false }

const DISTANCE_DEFAULTS: Record<string, { swim: number; bike: number; run: number }> = {
  sprint:  { swim: 750,  bike: 20,   run: 5    },
  olympic: { swim: 1500, bike: 40,   run: 10   },
  '70.3':  { swim: 1900, bike: 90,   run: 21.1 },
  full:    { swim: 3860, bike: 180,  run: 42.2 },
}

type Props = { raceId: string; onSuccess?: () => void }

export function EditionForm({ raceId, onSuccess }: Props) {
  const [state, action, pending] = useActionState(createEdition, initial)

  useEffect(() => {
    if (state.success) onSuccess?.()
  }, [state.success, onSuccess])

  return (
    <form action={action} className="flex flex-col gap-4">
      <input type="hidden" name="race_id" value={raceId} />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="ed-date" className="text-sm font-medium text-ink-2">比賽日期 *</label>
          <input
            id="ed-date"
            name="race_date"
            type="date"
            required
            className="w-full rounded-lg border border-border-strong bg-bg-elev px-3.5 py-2.5 text-sm text-ink outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="ed-distance" className="text-sm font-medium text-ink-2">距離分類 *</label>
          <select
            id="ed-distance"
            name="distance_category"
            required
            defaultValue="full"
            onChange={e => {
              const defaults = DISTANCE_DEFAULTS[e.target.value]
              if (!defaults) return
              const form = e.target.closest('form') as HTMLFormElement
              ;(form.elements.namedItem('swim_distance_m')  as HTMLInputElement).value = String(defaults.swim)
              ;(form.elements.namedItem('bike_distance_km') as HTMLInputElement).value = String(defaults.bike)
              ;(form.elements.namedItem('run_distance_km')  as HTMLInputElement).value = String(defaults.run)
            }}
            className="w-full rounded-lg border border-border-strong bg-bg-elev px-3.5 py-2.5 text-sm text-ink outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
          >
            <option value="sprint">Sprint（51.5）</option>
            <option value="olympic">Olympic（51.5）</option>
            <option value="70.3">70.3（Half）</option>
            <option value="full">Full（226）</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="ed-swim" className="text-sm font-medium text-ink-2">游泳（m）</label>
          <input
            id="ed-swim"
            name="swim_distance_m"
            type="number"
            defaultValue={3860}
            className="w-full rounded-lg border border-border-strong bg-bg-elev px-3.5 py-2.5 text-sm text-ink outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="ed-bike" className="text-sm font-medium text-ink-2">騎車（km）</label>
          <input
            id="ed-bike"
            name="bike_distance_km"
            type="number"
            step="0.1"
            defaultValue={180}
            className="w-full rounded-lg border border-border-strong bg-bg-elev px-3.5 py-2.5 text-sm text-ink outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="ed-run" className="text-sm font-medium text-ink-2">跑步（km）</label>
          <input
            id="ed-run"
            name="run_distance_km"
            type="number"
            step="0.1"
            defaultValue={42.2}
            className="w-full rounded-lg border border-border-strong bg-bg-elev px-3.5 py-2.5 text-sm text-ink outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="ed-swim-type" className="text-sm font-medium text-ink-2">游泳環境</label>
          <select
            id="ed-swim-type"
            name="swim_type"
            className="w-full rounded-lg border border-border-strong bg-bg-elev px-3.5 py-2.5 text-sm text-ink outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
          >
            <option value="">（未指定）</option>
            <option value="ocean">海洋</option>
            <option value="lake">湖泊</option>
            <option value="river">河川</option>
            <option value="pool">泳池</option>
            <option value="other">其他</option>
          </select>
        </div>
        <div className="grid grid-cols-3 gap-2">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="ed-finishers" className="text-sm font-medium text-ink-2">完賽人數</label>
            <input
              id="ed-finishers"
              name="finisher_count"
              type="number"
              min="0"
              className="w-full rounded-lg border border-border-strong bg-bg-elev px-3 py-2.5 text-sm text-ink outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="ed-dnf" className="text-sm font-medium text-ink-2">DNF</label>
            <input
              id="ed-dnf"
              name="dnf_count"
              type="number"
              min="0"
              className="w-full rounded-lg border border-border-strong bg-bg-elev px-3 py-2.5 text-sm text-ink outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="ed-starters" className="text-sm font-medium text-ink-2">出發人數</label>
            <input
              id="ed-starters"
              name="total_starters"
              type="number"
              min="0"
              className="w-full rounded-lg border border-border-strong bg-bg-elev px-3 py-2.5 text-sm text-ink outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
            />
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="ed-notes" className="text-sm font-medium text-ink-2">備註</label>
        <textarea
          id="ed-notes"
          name="notes"
          rows={2}
          className="w-full rounded-lg border border-border-strong bg-bg-elev px-3.5 py-2.5 text-sm text-ink placeholder:text-ink-4 outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 resize-none"
          placeholder="特殊說明、場地調整…"
        />
      </div>

      {state.error && (
        <p className="text-sm text-red">{state.error}</p>
      )}

      <div className="flex justify-end">
        <Button type="submit" loading={pending}>新增屆次</Button>
      </div>
    </form>
  )
}
