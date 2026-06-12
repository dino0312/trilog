'use client'

import { useState, useEffect, useRef, useCallback } from 'react'

type Race = { id: string; name: string; city: string }
type Edition = { id: string; distance_category: string }
type YearGroup = { year: number; race_date: string | null; editions: Edition[] }

export type RaceEditionValue = { editionId: string; displayText: string }

type Props = {
  value: RaceEditionValue | null
  onChange: (value: RaceEditionValue | null) => void
  error?: string
}

const DISTANCE_KM: Record<string, string> = {
  sprint: '51.5', olympic: '51.5', '70.3': '113', full: '226',
}

function distanceTags(editions: Edition[]): string {
  const kms = [...new Set(editions.map(e => DISTANCE_KM[e.distance_category] ?? e.distance_category))]
  return kms.join(' · ')
}

// 判斷是否為台灣賽事：名稱含中文、Taiwan 字樣，或 city 為台灣城市
const TW_CITIES = /台北|台中|台南|高雄|台東|花蓮|宜蘭|嘉義|屏東|苗栗|彰化|南投|雲林|桃園|新竹|基隆|台灣|Taiwan/i
function isTaiwanRace(race: Race): boolean {
  return /[一-鿿]/.test(race.name) ||
    /taiwan/i.test(race.name) ||
    TW_CITIES.test(race.city ?? '')
}

// 台灣賽事優先排序（僅台灣場次才套用品牌 rank）
const TW_BRAND_PRIORITY: { pattern: RegExp; rank: number }[] = [
  { pattern: /challenge taiwan/i, rank: 1 },
  { pattern: /ironman/i,          rank: 2 },
  { pattern: /普悠瑪/,            rank: 3 },
  { pattern: /force/i,            rank: 4 },
  { pattern: /玩賽樂園/,          rank: 5 },
]

function raceRank(race: Race): number {
  const tw = isTaiwanRace(race)
  if (tw) {
    for (const { pattern, rank } of TW_BRAND_PRIORITY) {
      if (pattern.test(race.name)) return rank
    }
    return 6 // 其他台灣地區賽事
  }
  return 7 // 國外
}

function sortRaces(races: Race[]): Race[] {
  return [...races].sort((a, b) => {
    const dr = raceRank(a) - raceRank(b)
    if (dr !== 0) return dr
    return a.name.localeCompare(b.name, 'zh-TW')
  })
}

export function RaceEditionPicker({ value, onChange, error }: Props) {
  const [step, setStep] = useState<'search' | 'year'>('search')
  const [query, setQuery] = useState('')
  const [allRaces, setAllRaces] = useState<Race[]>([])
  const [open, setOpen] = useState(false)
  const [selectedRace, setSelectedRace] = useState<Race | null>(null)
  const [yearGroups, setYearGroups] = useState<YearGroup[]>([])
  const [loadingYears, setLoadingYears] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Load all races once on mount, pre-sorted
  useEffect(() => {
    fetch('/api/races/search?q=*')
      .then(r => r.ok ? r.json() : [])
      .then((data: Race[]) => setAllRaces(sortRaces(data)))
  }, [])

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  // Client-side filter: empty query shows all
  const results = query.trim()
    ? allRaces.filter(r => r.name.toLowerCase().includes(query.toLowerCase()))
    : allRaces

  const selectRace = useCallback(async (race: Race) => {
    setOpen(false)
    setSelectedRace(race)
    setStep('year')
    setLoadingYears(true)
    try {
      const res = await fetch(`/api/races/${race.id}/editions`)
      if (res.ok) setYearGroups(await res.json())
    } finally {
      setLoadingYears(false)
    }
  }, [])

  const selectYear = useCallback((group: YearGroup) => {
    if (!selectedRace) return
    const editionId = group.editions[0]?.id ?? ''
    const displayText = `${selectedRace.name}（${group.year}）`
    onChange({ editionId, displayText })
  }, [selectedRace, onChange])

  const reset = useCallback(() => {
    onChange(null)
    setStep('search')
    setQuery('')
    setOpen(false)
    setSelectedRace(null)
    setYearGroups([])
    setTimeout(() => inputRef.current?.focus(), 0)
  }, [onChange])

  // Already selected — show chip
  if (value) {
    return (
      <div className="flex flex-col gap-1.5">
        <span className="text-sm font-medium text-ink-2">賽事</span>
        <div className="flex items-center gap-2 rounded-lg border border-accent/40 bg-accent/5 px-3.5 py-2.5">
          <span className="text-sm text-ink flex-1">{value.displayText}</span>
          <button
            type="button"
            onClick={reset}
            className="text-ink-4 hover:text-ink transition text-xs"
          >
            更改
          </button>
          <button
            type="button"
            onClick={reset}
            className="text-ink-4 hover:text-run transition text-base leading-none"
            aria-label="清除選擇"
          >
            ✕
          </button>
        </div>
        {error && <p className="text-xs text-run">{error}</p>}
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-1.5" ref={containerRef}>
      <span className="text-sm font-medium text-ink-2">賽事</span>

      {/* Step 2: year selection */}
      {step === 'year' && selectedRace && (
        <div className="rounded-lg border border-border-strong bg-bg-elev overflow-hidden">
          <button
            type="button"
            onClick={() => { setStep('search'); setSelectedRace(null); setYearGroups([]) }}
            className="flex items-center gap-1.5 w-full px-3.5 py-2 text-sm text-ink-3 hover:text-ink border-b border-border transition"
          >
            <span className="text-base leading-none">←</span>
            <span>{selectedRace.name}</span>
          </button>
          {loadingYears ? (
            <div className="px-3.5 py-3 text-sm text-ink-4">載入中…</div>
          ) : yearGroups.length === 0 ? (
            <div className="px-3.5 py-3 text-sm text-ink-4">此賽事無屆次記錄</div>
          ) : (
            <ul>
              {yearGroups.map((g, i) => (
                <li key={g.year}>
                  <button
                    type="button"
                    onClick={() => selectYear(g)}
                    className="flex items-center justify-between w-full px-3.5 py-2.5 text-sm hover:bg-bg-card/60 transition"
                  >
                    <span className="flex items-center gap-2">
                      <span className="text-ink font-medium">{g.year}</span>
                      {i === 0 && (
                        <span className="text-[10px] font-semibold bg-accent/15 text-accent px-1.5 py-0.5 rounded">最新</span>
                      )}
                    </span>
                    <span className="text-xs text-ink-4 font-mono">{distanceTags(g.editions)}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Step 1: search + dropdown */}
      {step === 'search' && (
        <div className="relative">
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onFocus={() => setOpen(true)}
            onClick={() => setOpen(true)}
            placeholder="點擊選擇或輸入賽事名稱…"
            className="w-full rounded-lg border border-border-strong bg-bg-elev px-3.5 py-2.5 text-sm text-ink placeholder:text-ink-4 outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
          />
          {open && (
            <ul className="absolute z-20 mt-1 w-full max-h-64 overflow-y-auto rounded-lg border border-border-strong bg-bg-elev shadow-lg">
              {results.length === 0 ? (
                <li className="px-3.5 py-3 text-sm text-ink-4">
                  {allRaces.length === 0 ? '載入中…' : `找不到「${query}」`}
                </li>
              ) : results.map(race => (
                <li key={race.id}>
                  <button
                    type="button"
                    onMouseDown={e => { e.preventDefault(); selectRace(race) }}
                    className="flex items-center justify-between w-full px-3.5 py-2.5 text-sm hover:bg-bg-card/60 transition text-left"
                  >
                    <span className="text-ink">{race.name}</span>
                    {race.city && <span className="text-xs text-ink-4">{race.city}</span>}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {error && <p className="text-xs text-run">{error}</p>}
    </div>
  )
}
