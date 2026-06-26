'use client'

import { useActionState, useEffect, useState } from 'react'
import { addOfficialResult, type OfficialResultState } from '@/app/actions/official'

type RaceEdition = {
  id: string
  year: number
  distance_category: string
  races: { id: string; name: string } | null
}

const DISTANCE_LABEL: Record<string, string> = {
  sprint: 'Sprint', olympic: '51.5', '70.3': '113', full: '226',
}

const initial: OfficialResultState = { error: null, success: false }

export function OfficialResultForm({ editions }: { editions: RaceEdition[] }) {
  const [state, action, pending] = useActionState(addOfficialResult, initial)
  const [editionId, setEditionId] = useState('')
  const [successCount, setSuccessCount] = useState(0)
  const [formKey, setFormKey] = useState(0) // 用於 reset form

  useEffect(() => {
    if (state.success) {
      setSuccessCount(c => c + 1)
      setFormKey(k => k + 1)
    }
  }, [state.success])

  // 依賽事分組 editions
  const byRace = editions.reduce<Record<string, { raceName: string; editions: RaceEdition[] }>>(
    (acc, e) => {
      const raceId = e.races?.id ?? '__unknown'
      if (!acc[raceId]) acc[raceId] = { raceName: e.races?.name ?? '—', editions: [] }
      acc[raceId].editions.push(e)
      return acc
    }, {}
  )

  return (
    <form key={formKey} action={action} className="flex flex-col gap-4">
      <input type="hidden" name="edition_id" value={editionId} />

      {/* 選賽事屆次 */}
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-ink-2">賽事屆次</label>
        <select
          required
          value={editionId}
          onChange={e => setEditionId(e.target.value)}
          className="rounded-lg border border-border-strong bg-bg-elev px-3 py-2 text-sm text-ink outline-none focus:border-accent"
        >
          <option value="">選擇賽事屆次…</option>
          {Object.entries(byRace).map(([, { raceName, editions: eds }]) => (
            <optgroup key={raceName} label={raceName}>
              {eds.map(e => (
                <option key={e.id} value={e.id}>
                  {e.year} · {DISTANCE_LABEL[e.distance_category] ?? e.distance_category}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
      </div>

      {/* 選手資料 */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="col-span-2 flex flex-col gap-1.5">
          <label className="text-sm font-medium text-ink-2">選手姓名</label>
          <input name="name" required placeholder="姓名（同官方成績）"
            className="rounded-lg border border-border-strong bg-bg-elev px-3 py-2 text-sm text-ink placeholder:text-ink-4 outline-none focus:border-accent" />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-ink-2">性別 *</label>
          <select name="gender" required
            className="rounded-lg border border-border-strong bg-bg-elev px-3 py-2 text-sm text-ink outline-none focus:border-accent">
            <option value="">請選擇…</option>
            <option value="M">男</option>
            <option value="F">女</option>
          </select>
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-ink-2">整體名次</label>
          <input name="overall_rank" type="number" min="1" placeholder="1"
            className="rounded-lg border border-border-strong bg-bg-elev px-3 py-2 text-sm text-ink placeholder:text-ink-4 outline-none focus:border-accent" />
        </div>
      </div>

      {/* 時間 */}
      <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
        {[
          { name: 'total', label: '完賽時間', required: true, placeholder: 'HH:MM:SS' },
          { name: 'swim',  label: '游泳',     required: false, placeholder: 'HH:MM:SS' },
          { name: 't1',    label: 'T1',       required: false, placeholder: 'MM:SS' },
          { name: 'bike',  label: '騎車',     required: false, placeholder: 'HH:MM:SS' },
          { name: 't2',    label: 'T2',       required: false, placeholder: 'MM:SS' },
          { name: 'run',   label: '跑步',     required: false, placeholder: 'HH:MM:SS' },
        ].map(f => (
          <div key={f.name} className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-ink-2">{f.label}</label>
            <input name={f.name} required={f.required} placeholder={f.placeholder}
              className="rounded-lg border border-border-strong bg-bg-elev px-3 py-2 text-sm text-ink font-mono placeholder:text-ink-4 outline-none focus:border-accent" />
          </div>
        ))}
      </div>

      {state.error && <p className="text-sm text-red">{state.error}</p>}

      <div className="flex items-center gap-4">
        <button
          type="submit"
          disabled={pending || !editionId}
          className="rounded-lg bg-accent px-5 py-2 text-sm font-semibold text-accent-ink hover:brightness-110 transition disabled:opacity-50"
        >
          {pending ? '新增中…' : '新增成績'}
        </button>
        {successCount > 0 && (
          <span className="text-sm text-good">✓ 已新增 {successCount} 筆</span>
        )}
      </div>
    </form>
  )
}
