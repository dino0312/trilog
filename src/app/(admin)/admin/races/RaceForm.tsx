'use client'

import { useActionState, useEffect, useState } from 'react'
import { createRace, type RaceActionState } from '@/app/actions/races'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'

const initial: RaceActionState = { error: null, success: false }

function toSlug(name: string) {
  return name.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '')
}

export function RaceForm({ onSuccess }: { onSuccess?: () => void }) {
  const [state, action, pending] = useActionState(createRace, initial)
  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [slugEdited, setSlugEdited] = useState(false)

  useEffect(() => {
    if (!slugEdited) setSlug(toSlug(name))
  }, [name, slugEdited])

  useEffect(() => {
    if (state.success) onSuccess?.()
  }, [state.success, onSuccess])

  return (
    <form action={action} className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="race-name" className="text-sm font-medium text-ink-2">系列名稱 *</label>
          <input
            id="race-name"
            name="name"
            required
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="如：IRONMAN Taiwan"
            className="w-full rounded-lg border border-border-strong bg-bg-elev px-3.5 py-2.5 text-sm text-ink placeholder:text-ink-4 outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="race-slug" className="text-sm font-medium text-ink-2">Slug（URL 識別）*</label>
          <input
            id="race-slug"
            name="slug"
            required
            value={slug}
            onChange={e => { setSlug(e.target.value); setSlugEdited(true) }}
            placeholder="ironman-taiwan"
            className="w-full rounded-lg border border-border-strong bg-bg-elev px-3.5 py-2.5 text-sm text-ink font-mono placeholder:text-ink-4 outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Input label="國家" id="race-country" name="country" placeholder="TW" />
        <Input label="城市" id="race-city" name="city" placeholder="台東" />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Input label="主辦單位" id="race-organizer" name="organizer" placeholder="IRONMAN Group" />
        <Input label="官方網站" id="race-website" name="website" placeholder="https://..." />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Input label="緯度 Latitude" id="race-lat" name="lat" type="number" step="any" placeholder="22.7486" />
        <Input label="經度 Longitude" id="race-lng" name="lng" type="number" step="any" placeholder="121.1418" />
      </div>

      {state.error && (
        <p className="text-sm text-red">{state.error}</p>
      )}

      <div className="flex justify-end">
        <Button type="submit" loading={pending}>建立系列賽</Button>
      </div>
    </form>
  )
}
