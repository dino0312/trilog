'use client'

import { useActionState, useRef, useState } from 'react'
import { createResult, type ResultState } from '@/app/actions/results'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { RaceEditionPicker, type RaceEditionValue } from '@/components/races/RaceEditionPicker'

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
  contributorConsented?: boolean
  onContributorConsentChange?: (v: boolean) => void
}

const initial: ResultState = { error: null }

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

export function NewResultForm({ profileComplete, profile, forOther = false, contributorConsented = false, onContributorConsentChange }: Props) {
  const [state, action, pending] = useActionState(createResult, initial)
  const [raceEdition, setRaceEdition] = useState<RaceEditionValue | null>(null)
  const [raceError, setRaceError] = useState<string | undefined>()
  const [isPublic, setIsPublic] = useState(true)
  const [forceSubmit, setForceSubmit] = useState(false)
  const formRef = useRef<HTMLFormElement>(null)

  // 需要顯示 profile 補充欄位：公開 + profile 不完整 + 非幫他人模式
  const showProfileSection = isPublic && !profileComplete && !forOther

  // 哪些 profile 欄位需要補填
  const needName        = !profile.name
  const needGender      = !profile.gender
  const needBirthYear   = !profile.birth_year
  const needNationality = !profile.nationality

  return (
    <form
      ref={formRef}
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
      {forceSubmit && <input type="hidden" name="force_submit" value="true" />}
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
          <div className="flex flex-col gap-1.5">
            <label htmlFor="curated_gender" className="text-sm font-medium text-ink-2">
              性別 <span className="text-run">*</span>
            </label>
            <select
              id="curated_gender"
              name="curated_gender"
              required
              className="w-full rounded-lg border border-border-strong bg-bg-elev px-3.5 py-2.5 text-sm text-ink outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
            >
              <option value="">請選擇…</option>
              <option value="M">男</option>
              <option value="F">女</option>
            </select>
            <p className="text-xs text-ink-4">排行榜分組依據，認領後以本人帳號性別為準</p>
          </div>
        </div>
      )}

      {/* 賽事選擇 */}
      <RaceEditionPicker value={raceEdition} onChange={setRaceEdition} error={raceError} />

      {/* 號碼布 */}
      <Input label="號碼布（選填）" id="bib_number" name="bib_number" placeholder="例：A123" />

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

      {/* 他人成績同意聲明 */}
      {forOther && (
        <div className="flex items-start gap-2">
          <input
            type="checkbox"
            id="contributor-consent"
            checked={contributorConsented}
            onChange={(e) => onContributorConsentChange?.(e.target.checked)}
            className="mt-0.5 shrink-0 accent-accent"
          />
          <label htmlFor="contributor-consent" className="text-xs text-ink-3 leading-relaxed">
            我確認已獲得該選手的明確同意，同意本平台依{' '}
            <a href="/privacy" target="_blank" className="text-accent hover:underline">隱私權政策</a>
            {' '}蒐集其個人資料，並對所填寫資料的正確性負責。
          </label>
        </div>
      )}

      {state.error && <p className="text-sm text-red">{state.error}</p>}

      {state.warning && (
        <div style={{
          background: 'var(--warn-soft, rgba(217,119,6,0.10))',
          border: '1px solid rgba(217,119,6,0.35)',
          borderRadius: '10px',
          padding: '12px 14px',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
        }}>
          <p style={{ fontSize: '13px', color: 'var(--warn, #d97706)', lineHeight: 1.5 }}>
            ⚠️ {state.warning}
          </p>
          <button
            type="button"
            onClick={() => {
              setForceSubmit(true)
              // 等 state 更新後再 submit
              setTimeout(() => formRef.current?.requestSubmit(), 0)
            }}
            style={{
              alignSelf: 'flex-start',
              background: 'var(--warn, #d97706)',
              color: '#ffffff',
              border: 'none',
              borderRadius: '6px',
              padding: '6px 14px',
              fontSize: '13px',
              cursor: 'pointer',
              fontWeight: 600,
            }}
          >
            確認送出
          </button>
        </div>
      )}

      <Button type="submit" loading={pending} disabled={!raceEdition?.editionId || (forOther && !contributorConsented)}>
        {forOther ? '代入成績' : '儲存成績'}
      </Button>
    </form>
  )
}
