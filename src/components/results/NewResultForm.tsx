'use client'

import { useActionState, useEffect, useState, useMemo } from 'react'
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
  sprint: 'Sprint', olympic: '51.5', '70.3': '113', full: '226',
}

const DISTANCE_ORDER: Record<string, number> = {
  sprint: 1, olympic: 2, '70.3': 3, full: 4,
}

export function NewResultForm() {
  const [state, action, pending] = useActionState(createResult, initial)
  const [editions, setEditions] = useState<RaceEdition[]>([])
  const [raceYearKey, setRaceYearKey] = useState('')
  const [editionId, setEditionId] = useState('')

  useEffect(() => {
    fetch('/api/races').then(r => r.json()).then(setEditions)
  }, [])

  // 每個賽事 + 年份組合（去重）
  const raceYears = useMemo(() => {
    const seen = new Set<string>()
    const result: { key: string; label: string }[] = []
    for (const e of editions) {
      const key = `${e.races?.id}__${e.year}`
      if (!seen.has(key)) {
        seen.add(key)
        result.push({ key, label: `${e.races?.name} ${e.year}` })
      }
    }
    return result
  }, [editions])

  // 選定賽事年份後，顯示可用距離
  const availableDistances = useMemo(() => {
    if (!raceYearKey) return []
    const [raceId, year] = raceYearKey.split('__')
    return editions
      .filter(e => e.races?.id === raceId && String(e.year) === year)
      .sort((a, b) => (DISTANCE_ORDER[a.distance_category] ?? 9) - (DISTANCE_ORDER[b.distance_category] ?? 9))
  }, [editions, raceYearKey])

  // 當可用距離剩一個時自動選取
  useEffect(() => {
    if (availableDistances.length === 1) {
      setEditionId(availableDistances[0].id)
    } else {
      setEditionId('')
    }
  }, [availableDistances])

  return (
    <form action={action} className="flex flex-col gap-5">
      <input type="hidden" name="race_edition_id" value={editionId} />

      {/* Step 1：選賽事年份 */}
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-ink-2">賽事</label>
        <select
          required
          value={raceYearKey}
          onChange={e => setRaceYearKey(e.target.value)}
          className="w-full rounded-lg border border-border-strong bg-bg-elev px-3.5 py-2.5 text-sm text-ink outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
        >
          <option value="">請選擇賽事…</option>
          {raceYears.map(ry => (
            <option key={ry.key} value={ry.key}>{ry.label}</option>
          ))}
        </select>
      </div>

      {/* Step 2：選距離（有多個才顯示） */}
      {raceYearKey && availableDistances.length > 1 && (
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-ink-2">距離組別</label>
          <div className="flex flex-wrap gap-2">
            {availableDistances.map(e => (
              <button
                key={e.id}
                type="button"
                onClick={() => setEditionId(e.id)}
                className={[
                  'px-4 py-2 rounded-lg border text-sm font-medium transition',
                  editionId === e.id
                    ? 'border-accent bg-accent/10 text-accent'
                    : 'border-border text-ink-3 hover:border-border-strong',
                ].join(' ')}
              >
                {DISTANCE_LABEL[e.distance_category] ?? e.distance_category}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 完賽時間 */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Input label="完賽時間" id="total" name="total" placeholder="HH:MM:SS" required className="font-mono" />
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
          id="notes" name="notes" rows={3}
          className="w-full rounded-lg border border-border-strong bg-bg-elev px-3.5 py-2.5 text-sm text-ink placeholder:text-ink-4 outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 resize-none"
          placeholder="天氣狀況、心得…"
        />
      </div>

      {/* 公開設定 */}
      <label className="flex items-center gap-3 cursor-pointer">
        <input type="checkbox" name="is_public" value="true" defaultChecked className="w-4 h-4 accent-accent" />
        <span className="text-sm text-ink-2">公開成績（納入排行榜）</span>
      </label>

      {state.error && <p className="text-sm text-red">{state.error}</p>}

      <Button type="submit" loading={pending} disabled={!editionId}>
        儲存成績
      </Button>
    </form>
  )
}
