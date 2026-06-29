'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'

type Race = { id: string; name: string; city?: string | null }

type Props = {
  races: Race[]
  selectedId: string | null
}

export function RacePicker({ races, selectedId }: Props) {
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const selected = races.find(r => r.id === selectedId) ?? null

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const filtered = query.trim()
    ? races.filter(r => r.name.toLowerCase().includes(query.toLowerCase()))
    : races

  function select(race: Race) {
    setOpen(false)
    setQuery('')
    router.push(`/admin/races?raceId=${race.id}`)
  }

  function clear() {
    router.push('/admin/races')
    setTimeout(() => inputRef.current?.focus(), 0)
  }

  if (selected) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-accent/40 bg-accent/5 px-3.5 py-2.5">
        <span className="text-sm text-ink flex-1">{selected.name}</span>
        <button
          type="button"
          onClick={clear}
          className="text-xs text-ink-4 hover:text-ink transition px-2"
        >
          更改
        </button>
        <button
          type="button"
          onClick={clear}
          className="text-ink-4 hover:text-run transition text-base leading-none"
          aria-label="清除選擇"
        >
          ✕
        </button>
      </div>
    )
  }

  return (
    <div className="relative" ref={containerRef}>
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
          {filtered.length === 0 ? (
            <li className="px-3.5 py-3 text-sm text-ink-4">找不到「{query}」</li>
          ) : filtered.map(race => (
            <li key={race.id}>
              <button
                type="button"
                onMouseDown={e => { e.preventDefault(); select(race) }}
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
  )
}
