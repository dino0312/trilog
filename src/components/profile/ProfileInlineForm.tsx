'use client'

import { useRouter } from 'next/navigation'
import { InlineField } from './InlineField'
import { updateProfileField } from '@/app/actions/profile-inline'

type Athlete = {
  nickname:    string | null
  gender:      string | null
  birth_year:  number | null
  nationality: string | null
  bio:         string | null
}

const REQUIRED_FIELDS: (keyof Athlete)[] = ['nickname', 'gender', 'birth_year', 'nationality']
const NATIONALITY_OPTIONS = [
  { value: 'TWN', label: '🇹🇼 台灣' },
  { value: 'JPN', label: '🇯🇵 日本' },
  { value: 'KOR', label: '🇰🇷 韓國' },
  { value: 'CHN', label: '🇨🇳 中國' },
  { value: 'HKG', label: '🇭🇰 香港' },
  { value: 'SGP', label: '🇸🇬 新加坡' },
  { value: 'MYS', label: '🇲🇾 馬來西亞' },
  { value: 'USA', label: '🇺🇸 美國' },
  { value: 'GBR', label: '🇬🇧 英國' },
]
const GENDER_OPTIONS = [
  { value: 'M', label: '男' },
  { value: 'F', label: '女' },
]

export function ProfileInlineForm({ athlete: initial }: { athlete: Athlete }) {
  const router = useRouter()

  // 計算進榜完成度
  const filled = REQUIRED_FIELDS.filter(f => {
    const v = initial[f]
    return v !== null && v !== undefined && String(v).trim() !== ''
  }).length
  const total  = REQUIRED_FIELDS.length
  const pct    = Math.round((filled / total) * 100)
  const done   = filled === total

  async function save(field: Parameters<typeof updateProfileField>[0], value: string) {
    const { error } = await updateProfileField(field, value)
    if (!error) router.refresh()
    return error
  }

  return (
    <div>
      {/* 進榜進度條 */}
      <div className="mb-6 rounded-xl border border-border bg-bg-card p-4">
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm font-medium text-ink">
            {done ? '✓ 你已符合進榜資格' : `還差 ${total - filled} 個欄位即可進入排行榜`}
          </p>
          <span className="text-xs text-ink-4 font-mono">{filled}/{total}</span>
        </div>
        <div className="h-1.5 w-full rounded-full bg-bg-elev overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width:      `${pct}%`,
              background: done ? '#66c6be' : '#FF6B3D',
            }}
          />
        </div>
        {!done && (
          <p className="mt-2 text-xs text-ink-4">
            填寫以下資料，你的成績就會出現在最速榜上
          </p>
        )}
      </div>

      {/* Inline 編輯欄位 */}
      <div className="rounded-xl border border-border bg-bg-card px-4">
        <InlineField
          label="姓名"
          value={initial.nickname}
          placeholder="填寫真實姓名，排行榜顯示用"
          required
          onSave={v => save('nickname', v)}
        />
        <InlineField
          label="性別"
          value={initial.gender}
          required
          type="select"
          options={GENDER_OPTIONS}
          onSave={v => save('gender', v)}
        />
        <InlineField
          label="出生年份"
          value={initial.birth_year !== null ? String(initial.birth_year) : null}
          placeholder="1990"
          required
          type="number"
          min={1930} max={2010}
          onSave={v => save('birth_year', v)}
        />
        <InlineField
          label="國籍"
          value={initial.nationality}
          required
          type="select"
          options={NATIONALITY_OPTIONS}
          onSave={v => save('nationality', v)}
        />
        <InlineField
          label="自我介紹"
          value={initial.bio}
          placeholder="上限 200 字（選填）"
          type="textarea"
          onSave={v => save('bio', v)}
        />
      </div>
    </div>
  )
}
