import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { RelayLeaderboard } from '@/components/relay/RelayLeaderboard'

export const metadata: Metadata = { title: '接力榜 · Tri·log' }

const DISTANCE_LABEL: Record<string, string> = {
  sprint: 'Sprint', olympic: '51.5', '70.3': '113', full: '226',
}
const DISTANCES = ['full', '70.3', 'olympic', 'sprint']
const GENDERS   = [
  { value: '',       label: '全部' },
  { value: 'male',   label: '男子組' },
  { value: 'female', label: '女子組' },
  { value: 'mixed',  label: '混合組' },
]

type SearchParams = Promise<{ distance?: string; gender_category?: string; race?: string }>

export default async function RelayPage({ searchParams }: { searchParams: SearchParams }) {
  const { distance = 'full', gender_category = '', race = '' } = await searchParams

  const supabase = await createClient()
  const { data: races } = await supabase
    .from('races')
    .select('id, name')
    .eq('status', 'active')
    .order('name')

  return (
    <main className="flex-1 p-6 max-w-5xl mx-auto w-full">
      <div className="mb-6">
        <h1 className="text-4xl font-bold text-ink">接力榜</h1>
        <p className="mt-0.5 text-base text-ink-3">接力隊伍成績排行</p>
      </div>

      {/* Distance tabs */}
      <div className="flex gap-2 mb-5 flex-wrap">
        {DISTANCES.map(d => {
          const params = new URLSearchParams({ distance: d })
          if (gender_category) params.set('gender_category', gender_category)
          if (race) params.set('race', race)
          return (
            <a
              key={d}
              href={`/relay?${params}`}
              className={`px-5 py-2 rounded-lg text-base font-medium transition ${
                d === distance
                  ? 'bg-accent text-accent-ink'
                  : 'text-ink-3 hover:text-ink hover:bg-bg-elev'
              }`}
            >
              {DISTANCE_LABEL[d]}
            </a>
          )
        })}
      </div>

      {/* Gender + race filters */}
      <div className="flex gap-3 mb-6 flex-wrap items-center">
        <div className="flex gap-1">
          {GENDERS.map(g => {
            const params = new URLSearchParams({ distance })
            if (g.value) params.set('gender_category', g.value)
            if (race) params.set('race', race)
            return (
              <a
                key={g.value}
                href={`/relay?${params}`}
                className={`px-4 py-1.5 rounded-lg text-sm transition ${
                  g.value === gender_category
                    ? 'bg-bg-elev text-ink font-semibold'
                    : 'text-ink-3 hover:text-ink hover:bg-bg-elev'
                }`}
              >
                {g.label}
              </a>
            )
          })}
        </div>

        <select
          name="race"
          defaultValue={race}
          onChange={undefined}
          className="ml-auto text-sm bg-bg-card border border-border rounded-lg px-3 py-1.5 text-ink-3"
        >
          <option value="">全部賽事</option>
          {(races ?? []).map(r => (
            <option key={r.id} value={r.id}>{r.name}</option>
          ))}
        </select>
      </div>

      <RelayLeaderboard
        distance={distance}
        genderCategory={gender_category}
        raceId={race}
      />
    </main>
  )
}
