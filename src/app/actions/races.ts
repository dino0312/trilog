'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
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
    country:    (formData.get('country')   as string) || null,
    city:       (formData.get('city')      as string) || null,
    organizer:  (formData.get('organizer') as string) || null,
    website:    (formData.get('website')   as string) || null,
    created_by: user.id,
    status:     'pending_review',
  })

  if (error) return { error: error.message, success: false }

  revalidatePath('/admin/races')
  revalidatePath('/admin/races/review')
  return { error: null, success: true }
}

export async function approveRace(_prev: RaceActionState, formData: FormData): Promise<RaceActionState> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: '未登入', success: false }

  const { data: isAssistant } = await supabase.rpc('is_assistant_or_above')
  if (!isAssistant) return { error: '權限不足', success: false }

  const id = formData.get('race_id') as string
  const { error } = await supabase.from('races').update({ status: 'active' }).eq('id', id)

  if (error) return { error: error.message, success: false }

  revalidatePath('/admin/races')
  revalidatePath('/admin/races/review')
  return { error: null, success: true }
}

export async function rejectRace(_prev: RaceActionState, formData: FormData): Promise<RaceActionState> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: '未登入', success: false }

  const { data: isAssistant } = await supabase.rpc('is_assistant_or_above')
  if (!isAssistant) return { error: '權限不足', success: false }

  const id = formData.get('race_id') as string

  // 確認沒有關聯屆次才能刪除
  const { count } = await supabase
    .from('race_editions').select('id', { count: 'exact', head: true }).eq('race_id', id)
  if (count && count > 0) {
    return { error: '此賽事已有屆次資料，請先刪除屆次再拒絕', success: false }
  }

  const { error } = await supabase.from('races').delete().eq('id', id)
  if (error) return { error: error.message, success: false }

  revalidatePath('/admin/races')
  revalidatePath('/admin/races/review')
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
    lat:       parseFloatOrNull(formData.get('lat') as string),
    lng:       parseFloatOrNull(formData.get('lng') as string),
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
  const wetsuitRaw         = formData.get('is_wetsuit_allowed') as string
  const isWetsuitAllowed   = wetsuitRaw === 'true' ? true : wetsuitRaw === 'false' ? false : null
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
      swim_type:          swimType,
      is_wetsuit_allowed: isWetsuitAllowed,
      water_temp_c:       parseFloatOrNull(formData.get('water_temp_c') as string),
      finisher_count:     parseIntOrNull(formData.get('finisher_count') as string),
      dnf_count:          parseIntOrNull(formData.get('dnf_count')      as string),
      total_starters:     parseIntOrNull(formData.get('total_starters') as string),
      registration_url:   (formData.get('registration_url') as string) || null,
      results_url:        (formData.get('results_url')      as string) || null,
      notes:              (formData.get('notes') as string) || null,
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

// ── 年份屆次整體操作（含多距離） ───────────────────────────────

export async function updateYearEdition(_prev: RaceActionState, formData: FormData): Promise<RaceActionState> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: '未登入', success: false }

  const race_id            = formData.get('race_id') as string
  const year               = parseInt(formData.get('year') as string)
  const race_date          = formData.get('race_date') as string
  const race_date_end      = (formData.get('race_date_end') as string) || null
  const swimType           = (formData.get('swim_type') as SwimType) || null
  const distance_categories = formData.getAll('distance_category') as DistanceCategory[]

  if (!distance_categories.length) return { error: '請至少勾選一個距離組別', success: false }

  const wetsuitRaw = formData.get('is_wetsuit_allowed') as string
  const shared = {
    race_date,
    race_date_end,
    swim_type:          swimType,
    is_wetsuit_allowed: wetsuitRaw === 'true' ? true : wetsuitRaw === 'false' ? false : null,
    water_temp_c:       parseFloatOrNull(formData.get('water_temp_c') as string),
    finisher_count:     parseIntOrNull(formData.get('finisher_count') as string),
    dnf_count:          parseIntOrNull(formData.get('dnf_count')      as string),
    total_starters:     parseIntOrNull(formData.get('total_starters') as string),
    registration_url:   (formData.get('registration_url') as string) || null,
    results_url:        (formData.get('results_url')      as string) || null,
    notes:              (formData.get('notes') as string) || null,
  }

  // 取得目前 DB 中這個年份的所有距離
  const { data: existing } = await supabase
    .from('race_editions')
    .select('id, distance_category')
    .eq('race_id', race_id)
    .eq('year', year)

  const existingMap = new Map((existing ?? []).map(e => [e.distance_category, e.id]))
  const selectedSet = new Set(distance_categories)

  // 更新或新增各距離
  for (const dist of distance_categories) {
    const swim = parseIntOrNull(formData.get(`swim_${dist}`) as string) ?? DISTANCE_DEFAULTS[dist]?.swim ?? null
    const bike = parseFloatOrNull(formData.get(`bike_${dist}`) as string) ?? DISTANCE_DEFAULTS[dist]?.bike ?? null
    const run  = parseFloatOrNull(formData.get(`run_${dist}`)  as string) ?? DISTANCE_DEFAULTS[dist]?.run  ?? null

    const row = { ...shared, swim_distance_m: swim, bike_distance_km: bike, run_distance_km: run }

    if (existingMap.has(dist)) {
      const { error } = await supabase.from('race_editions').update(row).eq('id', existingMap.get(dist)!)
      if (error) return { error: error.message, success: false }
    } else {
      const { error } = await supabase.from('race_editions').insert({ race_id, year, distance_category: dist, ...row })
      if (error) {
        if (error.code === '23505') return { error: `${year} 年 ${dist} 的屆次已存在。`, success: false }
        return { error: error.message, success: false }
      }
    }
  }

  // 移除已取消勾選的距離（有成績時阻擋）
  for (const [dist, id] of existingMap) {
    if (!selectedSet.has(dist)) {
      const { count } = await supabase
        .from('results').select('id', { count: 'exact', head: true }).eq('race_edition_id', id)
      if (count && count > 0)
        return { error: `距離 ${dist} 有 ${count} 筆成績，無法移除。請先刪除相關成績。`, success: false }
      await supabase.from('race_editions').delete().eq('id', id)
    }
  }

  revalidatePath(`/admin/races/${race_id}`)
  return { error: null, success: true }
}

export async function deleteYearEditions(_prev: RaceActionState, formData: FormData): Promise<RaceActionState> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: '未登入', success: false }

  const race_id = formData.get('race_id') as string
  const year    = parseInt(formData.get('year') as string)

  const { data: editions } = await supabase
    .from('race_editions')
    .select('id, distance_category')
    .eq('race_id', race_id)
    .eq('year', year)

  for (const e of editions ?? []) {
    const { count } = await supabase
      .from('results').select('id', { count: 'exact', head: true }).eq('race_edition_id', e.id)
    if (count && count > 0)
      return { error: `${year} 年屆次有 ${count} 筆成績資料，無法刪除。請先移除相關成績。`, success: false }
  }

  for (const e of editions ?? []) {
    const { error } = await supabase.from('race_editions').delete().eq('id', e.id)
    if (error) return { error: error.message, success: false }
  }

  revalidatePath(`/admin/races/${race_id}`)
  return { error: null, success: true }
}

export async function deleteEdition(_prev: RaceActionState, formData: FormData): Promise<RaceActionState> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: '未登入', success: false }

  const id      = formData.get('edition_id') as string
  const race_id = formData.get('race_id')    as string

  // 先確認是否有關聯成績
  const { count } = await supabase
    .from('results')
    .select('id', { count: 'exact', head: true })
    .eq('race_edition_id', id)

  if (count && count > 0) {
    return { error: `此屆次有 ${count} 筆成績資料，無法直接刪除。請先移除相關成績後再試。`, success: false }
  }

  const { error } = await supabase.from('race_editions').delete().eq('id', id)

  if (error) return { error: error.message, success: false }

  revalidatePath(`/admin/races/${race_id}`)
  return { error: null, success: true }
}

export async function deleteRace(_prev: RaceActionState, formData: FormData): Promise<RaceActionState> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: '未登入', success: false }

  const { data: isAssistant } = await supabase.rpc('is_assistant_or_above')
  if (!isAssistant) return { error: '權限不足', success: false }

  const id = formData.get('race_id') as string

  // 先取得此賽事所有屆次 id，再確認是否有成績
  const { data: editions } = await supabase
    .from('race_editions')
    .select('id')
    .eq('race_id', id)

  const editionIds = (editions ?? []).map(e => e.id)

  if (editionIds.length > 0) {
    const { count } = await supabase
      .from('results')
      .select('id', { count: 'exact', head: true })
      .in('race_edition_id', editionIds)

    if ((count ?? 0) > 0) {
      return {
        error: `此賽事仍有 ${count} 筆成績紀錄，請先刪除所有成績後再刪除賽事。`,
        success: false,
      }
    }
  }

  const { error } = await supabase.from('races').delete().eq('id', id)
  if (error) return { error: error.message, success: false }

  revalidatePath('/admin/races')
  redirect('/admin/races')
}

// ── 天氣資料抓取（Open-Meteo Historical Archive） ──────────────

export type WeatherFetchState = { error: string | null; success: boolean; message?: string }

export async function fetchEditionWeather(
  _prev: WeatherFetchState,
  formData: FormData,
): Promise<WeatherFetchState> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: '未登入', success: false }

  const edition_id = formData.get('edition_id') as string
  const race_id    = formData.get('race_id')    as string

  // 取得屆次 race_date
  const { data: edition } = await supabase
    .from('race_editions')
    .select('race_date')
    .eq('id', edition_id)
    .single()
  if (!edition) return { error: '找不到屆次', success: false }

  // 取得賽事 lat/lng
  const { data: race } = await supabase
    .from('races')
    .select('lat, lng, name')
    .eq('id', race_id)
    .single()
  if (!race) return { error: '找不到賽事', success: false }
  if (!race.lat || !race.lng) return { error: '賽事尚未設定座標（lat/lng），請先儲存緯度與經度', success: false }

  const dateStr = edition.race_date.slice(0, 10)

  // 呼叫 Open-Meteo Historical Archive API
  const url = `https://archive-api.open-meteo.com/v1/archive?latitude=${race.lat}&longitude=${race.lng}&start_date=${dateStr}&end_date=${dateStr}&hourly=temperature_2m,relative_humidity_2m,wind_speed_10m,wind_direction_10m,precipitation&timezone=Asia%2FTaipei&wind_speed_unit=ms`

  let apiData: {
    hourly: {
      temperature_2m: number[]
      relative_humidity_2m: number[]
      wind_speed_10m: number[]
      wind_direction_10m: number[]
      precipitation: number[]
    }
  }
  try {
    const res = await fetch(url, { cache: 'no-store' })
    if (!res.ok) return { error: `Open-Meteo API 錯誤：${res.status}`, success: false }
    apiData = await res.json()
  } catch {
    return { error: '無法連線至 Open-Meteo，請稍後再試', success: false }
  }

  // 取 06:00–12:00（index 6–12）均值，代表賽事進行時段
  const h = apiData.hourly
  const idx = [6, 7, 8, 9, 10, 11, 12]
  const avg = (arr: number[]) => Math.round((arr.reduce((s, v) => s + v, 0) / arr.length) * 10) / 10
  const sum = (arr: number[]) => Math.round(arr.reduce((s, v) => s + v, 0) * 10) / 10

  const temps = idx.map(i => h.temperature_2m[i])
  const hums  = idx.map(i => h.relative_humidity_2m[i])
  const winds = idx.map(i => h.wind_speed_10m[i])
  const wdirs = idx.map(i => h.wind_direction_10m[i])
  const precs = idx.map(i => h.precipitation[i])

  // 風向角度轉方位
  const avgDir = avg(wdirs)
  const directions = ['N','NE','E','SE','S','SW','W','NW','N']
  const windDir = directions[Math.round(avgDir / 45) % 8]

  const weather_data = {
    temp_c:           avg(temps),
    humidity_pct:     Math.round(avg(hums)),
    wind_speed_ms:    avg(winds),
    wind_direction:   windDir,
    precipitation_mm: sum(precs),
  }

  // 更新 race_editions（同年所有距離共用天氣）
  const { error } = await supabase
    .from('race_editions')
    .update({ weather_data, weather_source: 'open-meteo' })
    .eq('race_id', race_id)
    .eq('year', parseInt(edition.race_date.slice(0, 4)))

  if (error) return { error: error.message, success: false }

  revalidatePath(`/admin/races/${race_id}`)
  return {
    error: null,
    success: true,
    message: `${weather_data.temp_c}°C・濕度 ${weather_data.humidity_pct}%・風速 ${weather_data.wind_speed_ms} m/s・降雨 ${weather_data.precipitation_mm} mm`,
  }
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
