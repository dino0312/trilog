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

const DISTANCE_DEFAULTS: Record<string, { swim: number; bike: number; run: number }> = {
  sprint:  { swim: 750,  bike: 20,  run: 5    },
  olympic: { swim: 1500, bike: 40,  run: 10   },
  '70.3':  { swim: 1900, bike: 90,  run: 21.1 },
  full:    { swim: 3800, bike: 180, run: 42.2 },
}

export async function createEdition(_prev: RaceActionState, formData: FormData): Promise<RaceActionState> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: '未登入', success: false }

  const race_id            = formData.get('race_id') as string
  const race_date          = formData.get('race_date') as string
  const race_date_end      = (formData.get('race_date_end') as string) || null
  const distance_categories = formData.getAll('distance_category') as DistanceCategory[]
  const swimType           = (formData.get('swim_type') as SwimType) || null
  const year               = parseInt(race_date.slice(0, 4))

  if (!distance_categories.length) return { error: '請至少勾選一個距離組別', success: false }

  for (const distance_category of distance_categories) {
    const defaults = DISTANCE_DEFAULTS[distance_category]
    // 優先使用表單中各距離獨立欄位，fallback 到預設值
    const swim = parseIntOrNull(formData.get(`swim_${distance_category}`) as string) ?? defaults?.swim ?? null
    const bike = parseFloatOrNull(formData.get(`bike_${distance_category}`) as string) ?? defaults?.bike ?? null
    const run  = parseFloatOrNull(formData.get(`run_${distance_category}`)  as string) ?? defaults?.run  ?? null

    const { error } = await supabase.from('race_editions').insert({
      race_id,
      year,
      race_date,
      race_date_end,
      distance_category,
      swim_distance_m:  swim,
      bike_distance_km: bike,
      run_distance_km:  run,
      swim_type:        swimType,
      finisher_count:   parseIntOrNull(formData.get('finisher_count') as string),
      dnf_count:        parseIntOrNull(formData.get('dnf_count')      as string),
      total_starters:   parseIntOrNull(formData.get('total_starters') as string),
      notes:            (formData.get('notes') as string) || null,
    })
    if (error) {
      if (error.code === '23505') return { error: `${year} 年 ${distance_category} 的屆次已存在。`, success: false }
      return { error: error.message, success: false }
    }
  }

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
  const race_date_end = (formData.get('race_date_end') as string) || null

  const { error } = await supabase.from('race_editions').update({
    year:               parseInt(race_date.slice(0, 4)),
    race_date,
    race_date_end,
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
