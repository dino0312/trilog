'use client'

import { useActionState } from 'react'
import { updateProfile, type ProfileState } from '@/app/actions/profile'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'

type Props = {
  athlete: {
    nickname: string | null
    gender: string | null
    birth_year: number | null
    nationality: string | null
    bio: string | null
  }
}

const initial: ProfileState = { error: null, success: false }

export function ProfileForm({ athlete }: Props) {
  const [state, action, pending] = useActionState(updateProfile, initial)

  return (
    <form action={action} className="flex flex-col gap-5">
      <Input
        label="暱稱（排行榜顯示名稱）"
        id="nickname" name="nickname"
        defaultValue={athlete.nickname ?? ''}
        placeholder="留空則不顯示於排行榜"
      />

      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="gender" className="text-sm font-medium text-ink-2">性別</label>
          <select id="gender" name="gender" defaultValue={athlete.gender ?? ''}
            className="rounded-lg border border-border-strong bg-bg-elev px-3.5 py-2.5 text-sm text-ink outline-none focus:border-accent focus:ring-2 focus:ring-accent/20">
            <option value="">不填寫</option>
            <option value="M">男</option>
            <option value="F">女</option>
          </select>
        </div>

        <Input
          label="出生年份"
          id="birth_year" name="birth_year" type="number"
          defaultValue={athlete.birth_year ?? ''}
          placeholder="1990"
          min={1900} max={new Date().getFullYear()}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="nationality" className="text-sm font-medium text-ink-2">國籍</label>
        <select id="nationality" name="nationality" defaultValue={athlete.nationality ?? ''}
          className="rounded-lg border border-border-strong bg-bg-elev px-3.5 py-2.5 text-sm text-ink outline-none focus:border-accent focus:ring-2 focus:ring-accent/20">
          <option value="">不填寫</option>
          <option value="TWN">🇹🇼 台灣</option>
          <option value="JPN">🇯🇵 日本</option>
          <option value="KOR">🇰🇷 韓國</option>
          <option value="CHN">🇨🇳 中國</option>
          <option value="HKG">🇭🇰 香港</option>
          <option value="USA">🇺🇸 美國</option>
          <option value="GBR">🇬🇧 英國</option>
          <option value="AUS">🇦🇺 澳洲</option>
          <option value="DEU">🇩🇪 德國</option>
          <option value="FRA">🇫🇷 法國</option>
        </select>
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="bio" className="text-sm font-medium text-ink-2">自我介紹（選填）</label>
        <textarea id="bio" name="bio" rows={3} defaultValue={athlete.bio ?? ''}
          placeholder="分享你的鐵人三項故事…"
          className="w-full rounded-lg border border-border-strong bg-bg-elev px-3.5 py-2.5 text-sm text-ink placeholder:text-ink-4 outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 resize-none"
        />
      </div>

      {state.error && <p className="text-sm text-red">{state.error}</p>}
      {state.success && <p className="text-sm text-good">✓ 已儲存</p>}

      <Button type="submit" loading={pending}>儲存</Button>
    </form>
  )
}
