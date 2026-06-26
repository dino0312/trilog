'use client'

import { useActionState, useState } from 'react'
import { createRelayResult, type ResultState } from '@/app/actions/results'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { RaceEditionPicker, type RaceEditionValue } from '@/components/races/RaceEditionPicker'

type Member = {
  name:          string
  disciplines:   string[]
  split_seconds: string
  is_me:         boolean
}

const initial: ResultState = { error: null }

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

  const [raceEdition, setRaceEdition] = useState<RaceEditionValue | null>(null)
  const [raceError, setRaceError]     = useState<string | undefined>()
  const [isPublic, setIsPublic]       = useState(true)
  const [members, setMembers]         = useState<Member[]>([
    { ...EMPTY_MEMBER, is_me: true },
    { ...EMPTY_MEMBER },
  ])

  function updateMember(idx: number, field: keyof Member, value: unknown) {
    setMembers(prev => prev.map((m, i) => {
      if (i === idx) return { ...m, [field]: value }
      // radio 語意：勾選「這是我」時，取消其他成員的勾選
      if (field === 'is_me' && value === true) return { ...m, is_me: false }
      return m
    }))
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
    <form
      action={async (formData) => {
        if (!raceEdition?.editionId) {
          setRaceError('請選擇賽事與年份')
          return
        }
        setRaceError(undefined)
        formData.set('race_edition_id', raceEdition.editionId)
        await action(formData)
      }}
      className="flex flex-col gap-5"
    >
      <input type="hidden" name="members" value={membersJson} />
      <input type="hidden" name="is_public" value={isPublic ? 'true' : 'false'} />

      {/* 賽事選擇 */}
      <RaceEditionPicker value={raceEdition} onChange={setRaceEdition} error={raceError} />

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
                  <button
                    type="button"
                    onClick={() => updateMember(idx, 'is_me', !m.is_me)}
                    aria-pressed={m.is_me}
                    style={{
                      background: m.is_me ? 'var(--accent)' : 'transparent',
                      border: `0.5px solid ${m.is_me ? 'var(--accent)' : 'var(--border)'}`,
                      color: m.is_me ? '#ffffff' : 'var(--ink-3)',
                      borderRadius: '6px',
                      padding: '4px 10px',
                      fontSize: '12px',
                      cursor: 'pointer',
                      transition: 'background 0.15s, color 0.15s, border-color 0.15s',
                    }}
                  >
                    {m.is_me ? '✓ 這是我' : '這是我'}
                  </button>
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
                      { key: 'swim', label: '游泳' },
                      { key: 'bike', label: '自行車' },
                      { key: 'run',  label: '跑步' },
                    ].map(({ key, label }) => {
                      const isSelected = m.disciplines.includes(key)
                      return (
                        <button
                          key={key}
                          type="button"
                          onClick={() => toggleDiscipline(idx, key)}
                          aria-pressed={isSelected}
                          data-sport={key}
                          style={{
                            background: isSelected ? `var(--${key})` : 'transparent',
                            border: `0.5px solid ${isSelected ? `var(--${key})` : 'var(--border)'}`,
                            color: isSelected ? '#ffffff' : 'var(--ink-3)',
                            transition: 'background 0.15s, color 0.15s, border-color 0.15s',
                            borderRadius: '6px',
                            padding: '5px 12px',
                            fontSize: '13px',
                            cursor: 'pointer',
                          }}
                        >
                          {label}
                        </button>
                      )
                    })}
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

      <Button type="submit" disabled={pending || !raceEdition?.editionId}>
        {pending ? '儲存中…' : '新增接力成績'}
      </Button>
    </form>
  )
}
