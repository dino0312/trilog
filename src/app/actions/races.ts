'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import type { DistanceCategory, SwimType, RaceStatus } from '@/types/database'

export type RaceActionState = { error: string | null; success: boolean }

function toSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[一-鿿]+/g, s => encodeURIComponent(s).replace(/%/g, ''))
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    || `race-${Date.now()}`
}

// ── Races (Series) ────────────────────────────────────────────

export async function createRace(_prev: RaceActionState, formData: FormData): Promise<RaceActionState> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: '未登入', success: false }

  const name = (formData.get('name') as string).trim()
  const slug = ((formData.get('slug') as string) || toSlug(name)).trim()

  const { error } = await supabase.from('races').insert({
    name,
    slug,
    country:   (formData.get('country')   as string) || null,
    city:      (formData.get('city')      as string) || null,
    organizer: (formData.get('organizer') as string) || null,
    website:   (formData.get('website')   as string) || null,
    created_by: user.id,
  })

  if (error) return { error: error.message, success: false }

  revalidatePath('/admin/races')
  return { error: null, success: true }
}

export async function updateRace(_prev: RaceActionState, formData: FormData): Promise<RaceActionState> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: '未登入', success: false }

  const id = formData.get('race_id') as string

  const { error } = await supabase.from('races').update({
    name:      (formData.get('name')      as string).trim(),
    slug:      (formData.get('slug')      as string).trim(),
    status:    (formData.get('status')    as RaceStatus) || 'active',
    country:   (formData.get('country')   as string) || null,
    city:      (formData.get('city')      as string) || null,
    organizer: (formData.get('organizer') as string) || null,
    website:   (formData.get('website')   as string) || null,
  }).eq('id', id)

  if (error) return { error: error.message, success: false }

  revalidatePath('/admin/races')
  revalidatePath(`/admin/races/${id}`)
  return { error: null, success: true }
}

// ── Race Editions ─────────────────────────────────────────────

export async function createEdition(_prev: RaceActionState, formData: FormData): Promise<RaceActionState> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: '未登入', success: false }

  const race_id           = formData.get('race_id') as string
  const race_date         = formData.get('race_date') as string
  const distance_category = formData.get('distance_category') as DistanceCategory

  const swimRaw  = formData.get('swim_distance_m')  as string
  const bikeRaw  = formData.get('bike_distance_km') as string
  const runRaw   = formData.get('run_distance_km')  as string
  const swimType = formData.get('swim_type') as SwimType | null

  const { error } = await supabase.from('race_editions').insert({
    race_id,
    year:               parseInt(race_date.slice(0, 4)),
    race_date,
    distance_category,
    swim_distance_m:    swimRaw  ? parseInt(swimRaw)    : null,
    bike_distance_km:   bikeRaw  ? parseFloat(bikeRaw)  : null,
    run_distance_km:    runRaw   ? parseFloat(runRaw)   : null,
    swim_type:          swimType || null,
    finisher_count:     parseIntOrNull(formData.get('finisher_count') as string),
    dnf_count:          parseIntOrNull(formData.get('dnf_count')      as string),
    total_starters:     parseIntOrNull(formData.get('total_starters') as string),
    notes:              (formData.get('notes') as string) || null,
  })

  if (error) return { error: error.message, success: false }

  revalidatePath(`/admin/races/${race_id}`)
  return { error: null, success: true }
}

export async function updateEdition(_prev: RaceActionState, formData: FormData): Promise<RaceActionState> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: '未登入', success: false }

  const id      = formData.get('edition_id') as string
  const race_id = formData.get('race_id')    as string
  const race_date = formData.get('race_date') as string

  const { error } = await supabase.from('race_editions').update({
    year:               parseInt(race_date.slice(0, 4)),
    race_date,
    distance_category:  formData.get('distance_category') as DistanceCategory,
    swim_distance_m:    parseIntOrNull(formData.get('swim_distance_m')  as string),
    bike_distance_km:   parseFloatOrNull(formData.get('bike_distance_km') as string),
    run_distance_km:    parseFloatOrNull(formData.get('run_distance_km')  as string),
    swim_type:          (formData.get('swim_type') as SwimType) || null,
    finisher_count:     parseIntOrNull(formData.get('finisher_count') as string),
    dnf_count:          parseIntOrNull(formData.get('dnf_count')      as string),
    total_starters:     parseIntOrNull(formData.get('total_starters') as string),
    notes:              (formData.get('notes') as string) || null,
  }).eq('id', id)

  if (error) return { error: error.message, success: false }

  revalidatePath(`/admin/races/${race_id}`)
  return { error: null, success: true }
}

export async function deleteEdition(_prev: RaceActionState, formData: FormData): Promise<RaceActionState> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: '未登入', success: false }

  const id      = formData.get('edition_id') as string
  const race_id = formData.get('race_id')    as string

  const { error } = await supabase.from('race_editions').delete().eq('id', id)

  if (error) return { error: error.message, success: false }

  revalidatePath(`/admin/races/${race_id}`)
  return { error: null, success: true }
}

// ── Helpers ───────────────────────────────────────────────────

function parseIntOrNull(v: string): number | null {
  const n = parseInt(v)
  return isNaN(n) ? null : n
}

function parseFloatOrNull(v: string): number | null {
  const n = parseFloat(v)
  return isNaN(n) ? null : n
}
