'use client'

import { useActionState } from 'react'
import { updateRace, type RaceActionState } from '@/app/actions/races'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'

const initial: RaceActionState = { error: null, success: false }

type Race = {
  id: string
  name: string
  slug: string
  status: string
  country: string | null
  city: string | null
  organizer: string | null
  website: string | null
  lat: number | null
  lng: number | null
}

export function RaceEditForm({ race }: { race: Race }) {
  const [state, action, pending] = useActionState(updateRace, initial)

  return (
    <form action={action} className="flex flex-col gap-4">
      <input type="hidden" name="race_id" value={race.id} />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Input label="系列名稱 *" id="re-name" name="name" required defaultValue={race.name} />
        <Input label="Slug *" id="re-slug" name="slug" required defaultValue={race.slug}
               className="font-mono" />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Input label="國家" id="re-country" name="country" defaultValue={race.country ?? ''} />
        <Input label="城市" id="re-city" name="city" defaultValue={race.city ?? ''} />
        <div className="flex flex-col gap-1.5">
          <label htmlFor="re-status" className="text-sm font-medium text-ink-2">狀態</label>
          <select
            id="re-status"
            name="status"
            defaultValue={race.status}
            className="w-full rounded-lg border border-border-strong bg-bg-elev px-3.5 py-2.5 text-sm text-ink outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
          >
            <option value="active">運作中</option>
            <option value="inactive">已停辦</option>
            <option value="cancelled">已取消</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Input label="主辦單位" id="re-organizer" name="organizer" defaultValue={race.organizer ?? ''} />
        <Input label="官方網站" id="re-website" name="website" defaultValue={race.website ?? ''} />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Input label="緯度 Latitude" id="re-lat" name="lat" type="number" step="any"
               defaultValue={race.lat ?? ''} placeholder="22.7486" />
        <Input label="經度 Longitude" id="re-lng" name="lng" type="number" step="any"
               defaultValue={race.lng ?? ''} placeholder="121.1418" />
      </div>

      {state.error && <p className="text-sm text-red">{state.error}</p>}
      {state.success && <p className="text-sm text-good">已儲存</p>}

      <div className="flex justify-end">
        <Button type="submit" loading={pending}>儲存變更</Button>
      </div>
    </form>
  )
}
