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

type Profile = {
  name: string | null
  gender: string | null
  birth_year: number | null
  nationality: string | null
}

type Props = {
  profileComplete: boolean
  profile: Profile
  forOther?: boolean
}

const initial: ResultState = { error: null }

const DISTANCE_LABEL: Record<string, string> = {
  sprint: 'Sprint', olympic: '51.5', '70.3': '113', full: '226',
}
const DISTANCE_ORDER: Record<string, number> = {
  sprint: 1, olympic: 2, '70.3': 3, full: 4,
}

const NATIONALITIES = [
  { value: 'TWN', label: '🇹🇼 台灣' },
  { value: 'JPN', label: '🇯🇵 日本' },
  { value: 'KOR', label: '🇰🇷 韓國' },
  { value: 'CHN', label: '🇨🇳 中國' },
  { value: 'HKG', label: '🇭🇰 香港' },
  { value: 'USA', label: '🇺🇸 美國' },
  { value: 'GBR', label: '🇬🇧 英國' },
  { value: 'AUS', label: '🇦🇺 澳洲' },
  { value: 'DEU', label: '🇩🇪 德國' },
  { value: 'FRA', label: '🇫🇷 法國' },
]

export function NewResultForm({ profileComplete, profile, forOther = false }: Props) {
  const [state, action, pending] = useActionState(createResult, initial)
  const [editions, setEditions] = useState<RaceEdition[]>([])
  const [raceYearKey, setRaceYearKey] = useState('')
  const [editionId, setEditionId] = useState('')
  const [isPublic, setIsPublic] = useState(true)

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

  // 需要顯示 profile 補充欄位：公開 + profile 不完整 + 非幫他人模式
  const showProfileSection = isPublic && !profileComplete && !forOther

  // 哪些 profile 欄位需要補填
  const needName        = !profile.name
  const needGender      = !profile.gender
  const needBirthYear   = !profile.birth_year
  const needNationality = !profile.nationality

  return (
    <form action={action} className="flex flex-col gap-5">
      <input type="hidden" name="race_edition_id" value={editionId} />
      {forOther && <input type="hidden" name="for_other" value="true" />}

      {/* 幫他人新增：歸屬人姓名 */}
      {forOther && (
        <div className="rounded-xl border border-accent/20 bg-accent/5 px-4 py-3 flex flex-col gap-3">
          <div>
            <p className="text-sm font-semibold text-ink">成績歸屬人</p>
            <p className="text-xs text-ink-3 mt-0.5">此成績將以「未認領」狀態建立，本人可稍後自行認領</p>
          </div>
          <Input
            label="姓名"
            id="athlete_name_snapshot"
            name="athlete_name_snapshot"
            placeholder="選手真實姓名（用於比對認領）"
            required
          />
        </div>
      )}

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

      {/* Step 2：距離 */}
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
        <input type="hidden" name="is_public" value="false" />
        <input
          type="checkbox"
          name="is_public"
          value="true"
          checked={isPublic}
          onChange={e => setIsPublic(e.target.checked)}
          className="w-4 h-4 accent-accent"
        />
        <span className="text-sm text-ink-2">公開成績（納入排行榜）</span>
      </label>

      {/* ── 21.3 Profile 補充欄位 ─────────────────────────────── */}
      {showProfileSection && (
        <div className="rounded-xl border border-accent/20 bg-accent/5 p-4 flex flex-col gap-4">
          <div>
            <p className="text-sm font-semibold text-ink">完成個人資料以進入排行榜</p>
            <p className="text-xs text-ink-3 mt-0.5">
              公開成績需要以下資料才能納入排行榜。僅此一次，之後不再詢問。
            </p>
          </div>

          {needName && (
            <Input
              label="真實姓名"
              id="p-name" name="name"
              placeholder="用於認領成績與排行榜"
              required={isPublic}
            />
          )}

          {needGender && (
            <div className="flex flex-col gap-1.5">
              <label htmlFor="p-gender" className="text-sm font-medium text-ink-2">性別</label>
              <select
                id="p-gender" name="gender"
                required={isPublic}
                className="w-full rounded-lg border border-border-strong bg-bg-elev px-3.5 py-2.5 text-sm text-ink outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
              >
                <option value="">請選擇…</option>
                <option value="M">男</option>
                <option value="F">女</option>
              </select>
            </div>
          )}

          {needBirthYear && (
            <Input
              label="出生年份"
              id="p-birth-year" name="birth_year" type="number"
              placeholder="1990"
              min={1900} max={new Date().getFullYear()}
              required={isPublic}
            />
          )}

          {needNationality && (
            <div className="flex flex-col gap-1.5">
              <label htmlFor="p-nationality" className="text-sm font-medium text-ink-2">國籍</label>
              <select
                id="p-nationality" name="nationality"
                required={isPublic}
                className="w-full rounded-lg border border-border-strong bg-bg-elev px-3.5 py-2.5 text-sm text-ink outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
              >
                <option value="">請選擇…</option>
                {NATIONALITIES.map(n => (
                  <option key={n.value} value={n.value}>{n.label}</option>
                ))}
              </select>
            </div>
          )}
        </div>
      )}

      {state.error && <p className="text-sm text-red">{state.error}</p>}

      <Button type="submit" loading={pending} disabled={!editionId}>
        {forOther ? '代入成績' : '儲存成績'}
      </Button>
    </form>
  )
}
