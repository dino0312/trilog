'use client'

import { useState, useActionState, useEffect } from 'react'
import { updateEdition, deleteEdition, type RaceActionState } from '@/app/actions/races'
import type { SwimType, DistanceCategory } from '@/types/database'

type Edition = {
  id: string
  year: number
  race_date: string
  race_date_end: string | null
  distance_category: string
  swim_distance_m: number | null
  bike_distance_km: number | null
  run_distance_km: number | null
  swim_type: string | null
  finisher_count: number | null
  dnf_count: number | null
  total_starters: number | null
  notes: string | null
}

const DISTANCES = [
  { value: 'sprint',  label: 'Sprint' },
  { value: 'olympic', label: '51.5' },
  { value: '70.3',    label: '113' },
  { value: 'full',    label: '226' },
]

const initial: RaceActionState = { error: null, success: false }

// ── 編輯表單 ──────────────────────────────────────────────────
function EditForm({ edition, raceId, onClose }: { edition: Edition; raceId: string; onClose: () => void }) {
  const [state, action, pending] = useActionState(updateEdition, initial)
  const [startDate, setStartDate] = useState(edition.race_date)
  const [endDate,   setEndDate]   = useState(edition.race_date_end ?? '')

  function formatDate(d: Date) {
    const yyyy = d.getFullYear()
    const mm   = String(d.getMonth() + 1).padStart(2, '0')
    const dd   = String(d.getDate()).padStart(2, '0')
    return `${yyyy}-${mm}-${dd}`
  }

  function handleStartDateChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value
    setStartDate(val)
    if (val) {
      const [y, m, d] = val.split('-').map(Number)
      setEndDate(formatDate(new Date(y, m - 1, d + 1)))
    }
  }

  useEffect(() => {
    if (state.success) onClose()
  }, [state.success, onClose])

  return (
    <tr>
      <td colSpan={4} className="px-4 py-4 bg-bg-elev">
        <form action={action} className="flex flex-col gap-3">
          <input type="hidden" name="edition_id" value={edition.id} />
          <input type="hidden" name="race_id" value={raceId} />

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {/* 開始日期 */}
            <div className="flex flex-col gap-1">
              <label className="text-xs text-ink-3">開始日期</label>
              <input
                name="race_date" type="date" required
                value={startDate}
                onChange={handleStartDateChange}
                className="rounded-lg border border-border-strong bg-bg px-3 py-2 text-sm text-ink outline-none focus:border-accent"
              />
            </div>
            {/* 結束日期 */}
            <div className="flex flex-col gap-1">
              <label className="text-xs text-ink-3">結束日期</label>
              <input
                name="race_date_end" type="date"
                value={endDate}
                onChange={e => setEndDate(e.target.value)}
                className="rounded-lg border border-border-strong bg-bg px-3 py-2 text-sm text-ink outline-none focus:border-accent"
              />
            </div>
            {/* 距離 */}
            <div className="flex flex-col gap-1">
              <label className="text-xs text-ink-3">距離</label>
              <select
                name="distance_category"
                defaultValue={edition.distance_category}
                className="rounded-lg border border-border-strong bg-bg px-3 py-2 text-sm text-ink outline-none focus:border-accent"
              >
                {DISTANCES.map(d => (
                  <option key={d.value} value={d.value}>{d.label}</option>
                ))}
              </select>
            </div>
            {/* 游泳環境 */}
            <div className="flex flex-col gap-1">
              <label className="text-xs text-ink-3">游泳環境</label>
              <select
                name="swim_type"
                defaultValue={edition.swim_type ?? ''}
                className="rounded-lg border border-border-strong bg-bg px-3 py-2 text-sm text-ink outline-none focus:border-accent"
              >
                <option value="">（未指定）</option>
                <option value="ocean">海洋</option>
                <option value="lake">湖泊</option>
                <option value="open_water_lake">活水湖</option>
                <option value="river">河川</option>
                <option value="pool">泳池</option>
                <option value="other">其他</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
            {[
              { name: 'swim_distance_m',  label: '游泳(m)',  val: edition.swim_distance_m,  step: '1' },
              { name: 'bike_distance_km', label: '騎車(km)', val: edition.bike_distance_km, step: '0.1' },
              { name: 'run_distance_km',  label: '跑步(km)', val: edition.run_distance_km,  step: '0.1' },
              { name: 'finisher_count',   label: '完賽',     val: edition.finisher_count,   step: '1' },
              { name: 'dnf_count',        label: 'DNF',      val: edition.dnf_count,        step: '1' },
              { name: 'total_starters',   label: '出發',     val: edition.total_starters,   step: '1' },
            ].map(f => (
              <div key={f.name} className="flex flex-col gap-1">
                <label className="text-xs text-ink-3">{f.label}</label>
                <input
                  name={f.name} type="number" step={f.step}
                  defaultValue={f.val ?? ''}
                  className="rounded-lg border border-border-strong bg-bg px-3 py-2 text-sm text-ink outline-none focus:border-accent"
                />
              </div>
            ))}
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs text-ink-3">備註</label>
            <input
              name="notes" type="text"
              defaultValue={edition.notes ?? ''}
              className="rounded-lg border border-border-strong bg-bg px-3 py-2 text-sm text-ink outline-none focus:border-accent"
            />
          </div>

          {state.error && <p className="text-xs text-red">{state.error}</p>}

          <div className="flex gap-2 justify-end">
            <button type="button" onClick={onClose}
              className="px-3 py-1.5 rounded-lg text-sm text-ink-3 hover:bg-bg-elev transition">
              取消
            </button>
            <button type="submit" disabled={pending}
              className="px-4 py-1.5 rounded-lg bg-accent text-sm font-semibold text-accent-ink hover:brightness-110 transition disabled:opacity-50">
              {pending ? '儲存中…' : '儲存'}
            </button>
          </div>
        </form>
      </td>
    </tr>
  )
}

// ── 刪除確認 ──────────────────────────────────────────────────
function DeleteConfirm({ edition, raceId, onClose }: { edition: Edition; raceId: string; onClose: () => void }) {
  const [state, action, pending] = useActionState(deleteEdition, initial)
  const blocked = !!state.error

  return (
    <tr>
      <td colSpan={4} className="px-4 py-3 bg-bg-elev">
        <form action={action} className="flex flex-col gap-2">
          <input type="hidden" name="edition_id" value={edition.id} />
          <input type="hidden" name="race_id" value={raceId} />

          {state.error
            ? <p className="text-sm text-red">{state.error}</p>
            : <p className="text-sm text-ink">確定刪除此屆次？此操作無法復原。</p>
          }

          <div className="flex gap-2 justify-end">
            <button type="button" onClick={onClose}
              className="px-3 py-1.5 rounded-lg text-sm text-ink-3 hover:bg-bg transition">
              取消
            </button>
            {!blocked && (
              <button type="submit" disabled={pending}
                className="px-4 py-1.5 rounded-lg bg-red/10 border border-red/30 text-sm font-semibold text-red hover:bg-red/20 transition disabled:opacity-50">
                {pending ? '刪除中…' : '確認刪除'}
              </button>
            )}
          </div>
        </form>
      </td>
    </tr>
  )
}

// ── 主元件：每一列的操作按鈕 ─────────────────────────────────
export function EditionRow({ edition, raceId, distanceLabel }: {
  edition: Edition
  raceId: string
  distanceLabel: string
}) {
  const [mode, setMode] = useState<'view' | 'edit' | 'delete'>('view')

  const SWIM_LABEL: Record<string, string> = {
    ocean: '海洋', lake: '湖泊', open_water_lake: '活水湖', river: '河川', pool: '泳池', other: '其他',
  }

  return (
    <>
      <tr className="border-b border-border last:border-0 group">
        <td className="px-4 py-3">
          <span className="text-accent font-medium">{distanceLabel}</span>
          <p className="text-xs text-ink-4">
            {[
              edition.swim_distance_m  ? `${edition.swim_distance_m}m`   : null,
              edition.bike_distance_km ? `${edition.bike_distance_km}km` : null,
              edition.run_distance_km  ? `${edition.run_distance_km}km`  : null,
            ].filter(Boolean).join(' / ')}
          </p>
        </td>
        <td className="px-4 py-3 text-xs text-ink-3">
          {edition.swim_type ? SWIM_LABEL[edition.swim_type] : '—'}
        </td>
        <td className="px-4 py-3 text-right text-xs text-ink-3">
          {edition.finisher_count != null
            ? `${edition.finisher_count} / ${edition.total_starters ?? '?'}`
            : '—'}
        </td>
        <td className="px-4 py-3 text-right">
          <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition">
            <button
              onClick={() => setMode(mode === 'edit' ? 'view' : 'edit')}
              className="px-2.5 py-1 rounded text-xs text-ink-3 hover:bg-bg-elev hover:text-ink transition"
            >
              編輯
            </button>
            <button
              onClick={() => setMode(mode === 'delete' ? 'view' : 'delete')}
              className="px-2.5 py-1 rounded text-xs text-red/60 hover:bg-red/10 hover:text-red transition"
            >
              刪除
            </button>
          </div>
        </td>
      </tr>

      {mode === 'edit'   && <EditForm   edition={edition} raceId={raceId} onClose={() => setMode('view')} />}
      {mode === 'delete' && <DeleteConfirm edition={edition} raceId={raceId} onClose={() => setMode('view')} />}
    </>
  )
}
