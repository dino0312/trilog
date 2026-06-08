'use client'

import { useActionState, useEffect, useState } from 'react'
import { createEdition, type RaceActionState } from '@/app/actions/races'
import { Button } from '@/components/ui/Button'

const DISTANCES = [
  { value: 'sprint',  label: 'Sprint' },
  { value: 'olympic', label: '51.5' },
  { value: '70.3',    label: '113' },
  { value: 'full',    label: '226' },
]

const DISTANCE_DEFAULTS: Record<string, { swim: number; bike: number; run: number }> = {
  sprint:  { swim: 750,  bike: 20,  run: 5    },
  olympic: { swim: 1500, bike: 40,  run: 10   },
  '70.3':  { swim: 1900, bike: 90,  run: 21.1 },
  full:    { swim: 3800, bike: 180, run: 42.2 },
}

const initial: RaceActionState = { error: null, success: false }

type Props = { raceId: string; onSuccess?: () => void }

export function EditionForm({ raceId, onSuccess }: Props) {
  const [state, action, pending] = useActionState(createEdition, initial)
  const [selected, setSelected] = useState<string[]>(['full'])

  useEffect(() => {
    if (state.success) onSuccess?.()
  }, [state.success, onSuccess])

  const toggle = (val: string) =>
    setSelected(prev => prev.includes(val) ? prev.filter(v => v !== val) : [...prev, val])

  // 依照固定順序顯示已選距離
  const selectedInOrder = DISTANCES.filter(d => selected.includes(d.value))

  return (
    <form action={action} className="flex flex-col gap-4">
      <input type="hidden" name="race_id" value={raceId} />

      {/* 日期 + 距離選擇 */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-ink-2">開始日期 *</label>
          <input
            name="race_date" type="date" required
            className="w-full rounded-lg border border-border-strong bg-bg-elev px-3.5 py-2.5 text-sm text-ink outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-ink-2">
            結束日期 <span className="text-ink-4 font-normal">（多日賽事）</span>
          </label>
          <input
            name="race_date_end" type="date"
            className="w-full rounded-lg border border-border-strong bg-bg-elev px-3.5 py-2.5 text-sm text-ink outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-ink-2">距離組別 *</label>
          <div className="flex flex-wrap gap-2 pt-1">
            {DISTANCES.map(d => (
              <label
                key={d.value}
                className={[
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-sm cursor-pointer transition select-none',
                  selected.includes(d.value)
                    ? 'border-accent bg-accent/10 text-accent'
                    : 'border-border text-ink-3 hover:border-border-strong',
                ].join(' ')}
              >
                <input
                  type="checkbox"
                  name="distance_category"
                  value={d.value}
                  checked={selected.includes(d.value)}
                  onChange={() => toggle(d.value)}
                  className="sr-only"
                />
                {d.label}
              </label>
            ))}
          </div>
          {selected.length === 0 && (
            <p className="text-xs text-warn">請至少勾選一個距離</p>
          )}
        </div>
      </div>

      {/* 每個距離各自的游泳/騎車/跑步 */}
      {selectedInOrder.length > 0 && (
        <div className="flex flex-col gap-2">
          <p className="text-xs text-ink-3 font-medium">各距離公里數</p>
          <div className="rounded-lg border border-border overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-bg-elev text-xs text-ink-3 border-b border-border">
                  <th className="px-3 py-2 text-left w-20">距離</th>
                  <th className="px-3 py-2 text-left">游泳（m）</th>
                  <th className="px-3 py-2 text-left">騎車（km）</th>
                  <th className="px-3 py-2 text-left">跑步（km）</th>
                </tr>
              </thead>
              <tbody>
                {selectedInOrder.map(d => {
                  const def = DISTANCE_DEFAULTS[d.value]
                  return (
                    <tr key={d.value} className="border-b border-border last:border-0">
                      <td className="px-3 py-2">
                        <span className="font-medium text-accent">{d.label}</span>
                      </td>
                      <td className="px-3 py-2">
                        <input
                          name={`swim_${d.value}`}
                          type="number" step="1" min="0"
                          defaultValue={def.swim}
                          className="w-full rounded border border-border-strong bg-bg-elev px-2 py-1 text-sm text-ink outline-none focus:border-accent"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <input
                          name={`bike_${d.value}`}
                          type="number" step="0.1" min="0"
                          defaultValue={def.bike}
                          className="w-full rounded border border-border-strong bg-bg-elev px-2 py-1 text-sm text-ink outline-none focus:border-accent"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <input
                          name={`run_${d.value}`}
                          type="number" step="0.1" min="0"
                          defaultValue={def.run}
                          className="w-full rounded border border-border-strong bg-bg-elev px-2 py-1 text-sm text-ink outline-none focus:border-accent"
                        />
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 游泳環境 + 人數 */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-ink-2">游泳環境</label>
          <select
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
          {[
            { name: 'finisher_count', label: '完賽人數' },
            { name: 'dnf_count',      label: 'DNF' },
            { name: 'total_starters', label: '出發人數' },
          ].map(f => (
            <div key={f.name} className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-ink-2">{f.label}</label>
              <input name={f.name} type="number" min="0"
                className="w-full rounded-lg border border-border-strong bg-bg-elev px-3 py-2.5 text-sm text-ink outline-none focus:border-accent focus:ring-2 focus:ring-accent/20" />
            </div>
          ))}
        </div>
      </div>

      {/* 報名 + 成績查詢 */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-ink-2">報名網頁 URL</label>
          <input name="registration_url" type="url" placeholder="https://..."
            className="w-full rounded-lg border border-border-strong bg-bg-elev px-3.5 py-2.5 text-sm text-ink outline-none focus:border-accent focus:ring-2 focus:ring-accent/20" />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-ink-2">成績查詢 URL</label>
          <input name="results_url" type="url" placeholder="https://..."
            className="w-full rounded-lg border border-border-strong bg-bg-elev px-3.5 py-2.5 text-sm text-ink outline-none focus:border-accent focus:ring-2 focus:ring-accent/20" />
        </div>
      </div>

      {/* 備註 */}
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-ink-2">備註</label>
        <textarea
          name="notes" rows={2}
          className="w-full rounded-lg border border-border-strong bg-bg-elev px-3.5 py-2.5 text-sm text-ink placeholder:text-ink-4 outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 resize-none"
          placeholder="特殊說明、場地調整…"
        />
      </div>

      {state.error && <p className="text-sm text-red">{state.error}</p>}

      <div className="flex justify-end">
        <Button type="submit" loading={pending} disabled={selected.length === 0}>
          新增屆次
        </Button>
      </div>
    </form>
  )
}
