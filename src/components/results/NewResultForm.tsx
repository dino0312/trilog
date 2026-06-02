'use client'

import { useActionState, useEffect, useState } from 'react'
import { createResult, type ResultState } from '@/app/actions/results'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'

type RaceEdition = {
  id: string
  year: number
  race_date: string
  distance_category: string
  races: { id: string; name: string; city: string } | null
}

const initial: ResultState = { error: null }

const DISTANCE_LABEL: Record<string, string> = {
  sprint: 'Sprint',
  olympic: 'Olympic',
  '70.3': '70.3',
  full: 'Full',
}

export function NewResultForm() {
  const [state, action, pending] = useActionState(createResult, initial)
  const [editions, setEditions] = useState<RaceEdition[]>([])

  useEffect(() => {
    fetch('/api/races').then(r => r.json()).then(setEditions)
  }, [])

  return (
    <form action={action} className="flex flex-col gap-5">
      {/* 賽事選擇 */}
      <div className="flex flex-col gap-1.5">
        <label htmlFor="race_edition_id" className="text-sm font-medium text-ink-2">
          賽事
        </label>
        <select
          id="race_edition_id"
          name="race_edition_id"
          required
          className="w-full rounded-lg border border-border-strong bg-bg-elev px-3.5 py-2.5 text-sm text-ink outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
        >
          <option value="">請選擇賽事…</option>
          {editions.map(e => (
            <option key={e.id} value={e.id}>
              {e.races?.name} {e.year}（{DISTANCE_LABEL[e.distance_category]}）
            </option>
          ))}
        </select>
      </div>

      {/* 完賽時間 */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Input label="完賽時間" id="total" name="total" placeholder="HH:MM:SS" required
               className="font-mono" />
        <Input label="游泳" id="swim" name="swim" placeholder="HH:MM:SS" className="font-mono" />
        <Input label="T1" id="t1" name="t1" placeholder="MM:SS" className="font-mono" />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Input label="騎車" id="bike" name="bike" placeholder="HH:MM:SS" className="font-mono" />
        <Input label="T2" id="t2" name="t2" placeholder="MM:SS" className="font-mono" />
        <Input label="跑步" id="run" name="run" placeholder="HH:MM:SS" className="font-mono" />
      </div>

      {/* 備註 */}
      <div className="flex flex-col gap-1.5">
        <label htmlFor="notes" className="text-sm font-medium text-ink-2">備註（選填）</label>
        <textarea
          id="notes"
          name="notes"
          rows={3}
          className="w-full rounded-lg border border-border-strong bg-bg-elev px-3.5 py-2.5 text-sm text-ink placeholder:text-ink-4 outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 resize-none"
          placeholder="天氣狀況、心得…"
        />
      </div>

      {/* 公開設定 */}
      <label className="flex items-center gap-3 cursor-pointer">
        <input type="checkbox" name="is_public" value="true" defaultChecked
               className="w-4 h-4 accent-accent" />
        <span className="text-sm text-ink-2">公開成績（納入排行榜）</span>
      </label>

      {state.error && (
        <p className="text-sm text-red">{state.error}</p>
      )}

      <Button type="submit" loading={pending}>
        儲存成績
      </Button>
    </form>
  )
}
