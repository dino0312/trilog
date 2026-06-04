'use client'

import { useActionState, useEffect, useState, useMemo } from 'react'
import { createRelayResult, type ResultState } from '@/app/actions/results'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'

type RaceEdition = {
  id: string
  year: number
  race_date: string
  distance_category: string
  races: { id: string; name: string; city: string } | null
}

type Member = {
  name:          string
  disciplines:   string[]
  split_seconds: string
  is_me:         boolean
}

const initial: ResultState = { error: null }

const DISTANCE_ORDER: Record<string, number> = {
  sprint: 1, olympic: 2, '70.3': 3, full: 4,
}
const DISTANCE_LABEL: Record<string, string> = {
  sprint: 'Sprint', olympic: '51.5', '70.3': '113', full: '226',
}

function parseTime(val: string): number | null {
  if (!val) return null
  const parts = val.split(':').map(Number)
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2]
  if (parts.length === 2) return parts[0] * 60 + parts[1]
  return null
}

const EMPTY_MEMBER: Member = { name: '', disciplines: [], split_seconds: '', is_me: false }

export function NewRelayResultForm() {
  const [state, action, pending] = useActionState(createRelayResult, initial)

  const [editions, setEditions]         = useState<RaceEdition[]>([])
  const [raceYearKey, setRaceYearKey]   = useState('')
  const [editionId, setEditionId]       = useState('')
  const [isPublic, setIsPublic]         = useState(true)
  const [members, setMembers]           = useState<Member[]>([
    { ...EMPTY_MEMBER, is_me: true },
    { ...EMPTY_MEMBER },
  ])

  useEffect(() => {
    fetch('/api/races').then(r => r.json()).then(setEditions)
  }, [])

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

  const availableDistances = useMemo(() => {
    if (!raceYearKey) return []
    const [raceId, year] = raceYearKey.split('__')
    return editions
      .filter(e => e.races?.id === raceId && String(e.year) === year)
      .sort((a, b) => (DISTANCE_ORDER[a.distance_category] ?? 9) - (DISTANCE_ORDER[b.distance_category] ?? 9))
  }, [editions, raceYearKey])

  useEffect(() => {
    if (availableDistances.length === 1) setEditionId(availableDistances[0].id)
    else setEditionId('')
  }, [availableDistances])

  function updateMember(idx: number, field: keyof Member, value: unknown) {
    setMembers(prev => prev.map((m, i) => i === idx ? { ...m, [field]: value } : m))
  }

  function toggleDiscipline(idx: number, disc: string) {
    setMembers(prev => prev.map((m, i) => {
      if (i !== idx) return m
      const discs = m.disciplines.includes(disc)
        ? m.disciplines.filter(d => d !== disc)
        : [...m.disciplines, disc]
      return { ...m, disciplines: discs }
    }))
  }

  function addMember() {
    if (members.length < 3) setMembers(prev => [...prev, { ...EMPTY_MEMBER }])
  }

  function removeMember(idx: number) {
    if (members.length > 1) setMembers(prev => prev.filter((_, i) => i !== idx))
  }

  const membersJson = JSON.stringify(members.map(m => ({
    name:          m.name,
    disciplines:   m.disciplines,
    split_seconds: parseTime(m.split_seconds),
    is_me:         m.is_me,
  })))

  return (
    <form action={action} className="flex flex-col gap-5">
      <input type="hidden" name="race_edition_id" value={editionId} />
      <input type="hidden" name="members" value={membersJson} />
      <input type="hidden" name="is_public" value={isPublic ? 'true' : 'false'} />

      {/* 賽事選擇 */}
      <div>
        <label className="block text-xs text-ink-3 mb-1.5">賽事 *</label>
        <select
          value={raceYearKey}
          onChange={e => setRaceYearKey(e.target.value)}
          className="w-full rounded-lg border border-border bg-bg-card px-3 py-2 text-sm text-ink"
        >
          <option value="">— 選擇賽事與年份 —</option>
          {raceYears.map(({ key, label }) => (
            <option key={key} value={key}>{label}</option>
          ))}
        </select>
      </div>

      {availableDistances.length > 1 && (
        <div>
          <label className="block text-xs text-ink-3 mb-1.5">距離 *</label>
          <div className="flex gap-2 flex-wrap">
            {availableDistances.map(e => (
              <button
                key={e.id} type="button"
                onClick={() => setEditionId(e.id)}
                className={`px-3 py-1.5 rounded-lg text-sm border transition ${
                  editionId === e.id
                    ? 'bg-accent text-accent-ink border-accent'
                    : 'border-border text-ink-3 hover:text-ink'
                }`}
              >
                {DISTANCE_LABEL[e.distance_category] ?? e.distance_category}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 基本資訊 */}
      <div className="grid grid-cols-2 gap-3">
        <Input label="完賽時間 *" name="total" placeholder="HH:MM:SS" />
        <div>
          <label className="block text-xs text-ink-3 mb-1.5">組別 *</label>
          <select name="gender_category" className="w-full rounded-lg border border-border bg-bg-card px-3 py-2 text-sm text-ink">
            <option value="">— 選擇 —</option>
            <option value="male">男子組</option>
            <option value="female">女子組</option>
            <option value="mixed">混合組</option>
          </select>
        </div>
      </div>

      <Input label="隊名（選填）" name="team_name" placeholder="例：鐵人三劍客" />

      {/* 換區時間 */}
      <div className="grid grid-cols-2 gap-3">
        <Input label="T1 換區時間（選填）" name="t1" placeholder="MM:SS" />
        <Input label="T2 換區時間（選填）" name="t2" placeholder="MM:SS" />
      </div>

      {/* 成員 */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs text-ink-3">成員（1–3 人）*</label>
          {members.length < 3 && (
            <button type="button" onClick={addMember} className="text-xs text-accent hover:underline">
              + 新增成員
            </button>
          )}
        </div>
        <div className="flex flex-col gap-3">
          {members.map((m, idx) => (
            <div key={idx} className="rounded-xl border border-border bg-bg-elev/30 p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-ink-3">成員 {idx + 1}</span>
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-1.5 text-xs text-ink-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={m.is_me}
                      onChange={e => updateMember(idx, 'is_me', e.target.checked)}
                      className="rounded"
                    />
                    這是我
                  </label>
                  {members.length > 1 && (
                    <button type="button" onClick={() => removeMember(idx)} className="text-xs text-ink-4 hover:text-run transition">
                      移除
                    </button>
                  )}
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <input
                  type="text"
                  value={m.name}
                  onChange={e => updateMember(idx, 'name', e.target.value)}
                  placeholder="成員姓名 *"
                  className="w-full rounded-lg border border-border bg-bg-card px-3 py-2 text-sm text-ink placeholder:text-ink-4"
                />

                <div>
                  <p className="text-xs text-ink-4 mb-1.5">負責項目 *</p>
                  <div className="flex gap-2">
                    {[
                      { key: 'swim', label: '游泳', color: 'swim' },
                      { key: 'bike', label: '自行車', color: 'bike' },
                      { key: 'run',  label: '跑步',   color: 'run' },
                    ].map(({ key, label, color }) => (
                      <button
                        key={key} type="button"
                        onClick={() => toggleDiscipline(idx, key)}
                        className={`px-3 py-1 rounded-lg text-xs border transition text-${color} ${
                          m.disciplines.includes(key)
                            ? `bg-${color}/10 border-${color}/40`
                            : 'border-border text-ink-4 hover:text-ink'
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                <input
                  type="text"
                  value={m.split_seconds}
                  onChange={e => updateMember(idx, 'split_seconds', e.target.value)}
                  placeholder="個人分項時間（選填，HH:MM:SS）"
                  className="w-full rounded-lg border border-border bg-bg-card px-3 py-2 text-sm text-ink placeholder:text-ink-4"
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 備注 */}
      <Input label="備注（選填）" name="notes" placeholder="賽事備注" />

      {/* 公開設定 */}
      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={isPublic}
          onChange={e => setIsPublic(e.target.checked)}
          className="rounded"
        />
        <span className="text-sm text-ink-3">公開此成績（出現在接力榜）</span>
      </label>

      {state.error && (
        <p className="text-sm text-run">{state.error}</p>
      )}

      <Button type="submit" disabled={pending || !editionId}>
        {pending ? '儲存中…' : '新增接力成績'}
      </Button>
    </form>
  )
}
