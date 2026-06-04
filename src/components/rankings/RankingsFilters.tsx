'use client'

import { useRouter, useSearchParams } from 'next/navigation'

const DISTANCES = [
  { value: 'full',    label: '226' },
  { value: '70.3',    label: '113' },
  { value: 'olympic', label: '51.5' },
  { value: 'sprint',  label: 'Sprint' },
] as const

type Props = {
  races: { id: string; name: string }[]
  currentDistance: string
  currentRace: string
  currentGender: string
}

export function RankingsFilters({ races, currentDistance, currentRace, currentGender }: Props) {
  const router = useRouter()
  const searchParams = useSearchParams()

  function switchDistance(value: string) {
    const params = new URLSearchParams(searchParams.toString())
    params.set('distance', value)
    router.push(`/rankings?${params.toString()}`)
  }

  return (
    <div className="flex flex-col gap-4 mb-6">
      {/* 距離頁籤 */}
      <div className="flex gap-2 flex-wrap">
        {DISTANCES.map(d => (
          <button
            key={d.value}
            type="button"
            onClick={() => switchDistance(d.value)}
            className={[
              'px-5 py-2 rounded-lg text-sm font-semibold border transition',
              currentDistance === d.value
                ? 'border-accent bg-accent/10 text-accent'
                : 'border-border text-ink-3 hover:border-border-strong hover:text-ink',
            ].join(' ')}
          >
            {d.label}
          </button>
        ))}
      </div>

      {/* 其他篩選 */}
      <form className="flex flex-wrap gap-3">
        <input type="hidden" name="distance" value={currentDistance} />

        <select name="race" defaultValue={currentRace}
          className="rounded-lg border border-border-strong bg-bg-elev px-3 py-2 text-sm text-ink outline-none focus:border-accent">
          <option value="">所有賽事</option>
          {races.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
        </select>

        <select name="gender" defaultValue={currentGender}
          className="rounded-lg border border-border-strong bg-bg-elev px-3 py-2 text-sm text-ink outline-none focus:border-accent">
          <option value="">男女不限</option>
          <option value="M">男子</option>
          <option value="F">女子</option>
        </select>

        <button type="submit"
          className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-accent-ink hover:brightness-110 transition">
          篩選
        </button>
      </form>
    </div>
  )
}
