'use client'

import { useState, useActionState, useEffect } from 'react'
import { updateYearEdition, deleteYearEditions, fetchEditionWeather, type RaceActionState, type WeatherFetchState } from '@/app/actions/races'

export type Edition = {
  id: string
  year: number
  race_date: string
  race_date_end: string | null
  distance_category: string
  swim_distance_m: number | null
  bike_distance_km: number | null
  run_distance_km: number | null
  swim_type: string | null
  is_wetsuit_allowed: boolean | null
  water_temp_c: number | null
  weather_data: Record<string, unknown> | null
  weather_source: string | null
  finisher_count: number | null
  dnf_count: number | null
  total_starters: number | null
  registration_url: string | null
  results_url: string | null
  notes: string | null
}

const DISTANCES = [
  { value: 'sprint',  label: 'Sprint' },
  { value: 'olympic', label: '51.5' },
  { value: '70.3',    label: '113' },
  { value: 'full',    label: '226' },
]

const DISTANCE_DEFAULTS: Record<string, { swim: number; bike: number; run: number }> = {
  sprint:  { swim: 750,  bike: 20,  run: 5    },
  olympic: { swim: 1500, bike: 40,  run: 10   },
  '70.3':  { swim: 1900, bike: 90,  run: 21.1 },
  full:    { swim: 3800, bike: 180, run: 42.2 },
}

const DISTANCE_LABEL: Record<string, string> = {
  sprint: 'Sprint', olympic: '51.5', '70.3': '113', full: '226',
}

const SWIM_LABEL: Record<string, string> = {
  ocean: '海洋', lake: '湖泊', river: '河川', pool: '泳池', other: '其他',
}

const initial: RaceActionState = { error: null, success: false }

// ── 編輯整個屆次（含所有距離） ────────────────────────────────
function EditYearForm({ editions, raceId, year, onClose }: {
  editions: Edition[]
  raceId: string
  year: number
  onClose: () => void
}) {
  const [state, action, pending] = useActionState(updateYearEdition, initial)
  const base = editions[0]

  const existingDistances = new Set(editions.map(e => e.distance_category))
  const [selected, setSelected] = useState<string[]>(
    DISTANCES.filter(d => existingDistances.has(d.value)).map(d => d.value)
  )

  const toggle = (val: string) =>
    setSelected(prev => prev.includes(val) ? prev.filter(v => v !== val) : [...prev, val])

  const selectedInOrder = DISTANCES.filter(d => selected.includes(d.value))

  useEffect(() => { if (state.success) onClose() }, [state.success, onClose])

  // 取得現有距離的 km 值（用於 defaultValue）
  const getEdition = (dist: string) => editions.find(e => e.distance_category === dist)

  return (
    <div className="px-4 py-4 border-t border-border bg-bg-elev">
      <form action={action} className="flex flex-col gap-4">
        <input type="hidden" name="race_id" value={raceId} />
        <input type="hidden" name="year" value={year} />

        {/* 日期 */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="flex flex-col gap-1">
            <label className="text-xs text-ink-3">開始日期</label>
            <input name="race_date" type="date" required defaultValue={base.race_date}
              className="rounded-lg border border-border-strong bg-bg px-3 py-2 text-sm text-ink outline-none focus:border-accent" />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-ink-3">結束日期（多日賽事）</label>
            <input name="race_date_end" type="date" defaultValue={base.race_date_end ?? ''}
              className="rounded-lg border border-border-strong bg-bg px-3 py-2 text-sm text-ink outline-none focus:border-accent" />
          </div>
        </div>

        {/* 距離組別（多選） */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs text-ink-3">距離組別</label>
          <div className="flex flex-wrap gap-2">
            {DISTANCES.map(d => (
              <label key={d.value}
                className={[
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-sm cursor-pointer transition select-none',
                  selected.includes(d.value)
                    ? 'border-accent bg-accent/10 text-accent'
                    : 'border-border text-ink-3 hover:border-border-strong',
                ].join(' ')}
              >
                <input type="checkbox" name="distance_category" value={d.value}
                  checked={selected.includes(d.value)} onChange={() => toggle(d.value)} className="sr-only" />
                {d.label}
              </label>
            ))}
          </div>
        </div>

        {/* 各距離 km */}
        {selectedInOrder.length > 0 && (
          <div className="rounded-lg border border-border overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-bg text-xs text-ink-3 border-b border-border">
                  <th className="px-3 py-2 text-left w-20">距離</th>
                  <th className="px-3 py-2 text-left">游泳（m）</th>
                  <th className="px-3 py-2 text-left">騎車（km）</th>
                  <th className="px-3 py-2 text-left">跑步（km）</th>
                </tr>
              </thead>
              <tbody>
                {selectedInOrder.map(d => {
                  const ex = getEdition(d.value)
                  const def = DISTANCE_DEFAULTS[d.value]
                  return (
                    <tr key={d.value} className="border-b border-border last:border-0">
                      <td className="px-3 py-2 font-medium text-accent">{d.label}</td>
                      <td className="px-3 py-2">
                        <input name={`swim_${d.value}`} type="number" step="1" min="0"
                          defaultValue={ex?.swim_distance_m ?? def.swim}
                          className="w-full rounded border border-border-strong bg-bg-elev px-2 py-1 text-sm text-ink outline-none focus:border-accent" />
                      </td>
                      <td className="px-3 py-2">
                        <input name={`bike_${d.value}`} type="number" step="0.1" min="0"
                          defaultValue={ex?.bike_distance_km ?? def.bike}
                          className="w-full rounded border border-border-strong bg-bg-elev px-2 py-1 text-sm text-ink outline-none focus:border-accent" />
                      </td>
                      <td className="px-3 py-2">
                        <input name={`run_${d.value}`} type="number" step="0.1" min="0"
                          defaultValue={ex?.run_distance_km ?? def.run}
                          className="w-full rounded border border-border-strong bg-bg-elev px-2 py-1 text-sm text-ink outline-none focus:border-accent" />
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* 游泳環境 + 防寒衣 + 水溫 */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="flex flex-col gap-1">
            <label className="text-xs text-ink-3">游泳環境</label>
            <select name="swim_type" defaultValue={base.swim_type ?? ''}
              className="rounded-lg border border-border-strong bg-bg px-3 py-2 text-sm text-ink outline-none focus:border-accent">
              <option value="">（未指定）</option>
              <option value="ocean">海洋</option>
              <option value="lake">湖泊</option>
              <option value="river">河川</option>
              <option value="pool">泳池</option>
              <option value="other">其他</option>
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-ink-3">防寒衣</label>
            <select name="is_wetsuit_allowed" defaultValue={
              base.is_wetsuit_allowed === true ? 'true' : base.is_wetsuit_allowed === false ? 'false' : ''
            } className="rounded-lg border border-border-strong bg-bg px-3 py-2 text-sm text-ink outline-none focus:border-accent">
              <option value="">（未指定）</option>
              <option value="true">允許</option>
              <option value="false">禁止</option>
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-ink-3">水溫（°C）</label>
            <input name="water_temp_c" type="number" step="0.1" defaultValue={base.water_temp_c ?? ''}
              placeholder="—"
              className="rounded-lg border border-border-strong bg-bg px-3 py-2 text-sm text-ink outline-none focus:border-accent" />
          </div>
        </div>

        {/* 完賽人數 */}
        <div className="grid grid-cols-3 gap-2">
          {[
            { name: 'finisher_count', label: '完賽', val: base.finisher_count },
            { name: 'dnf_count',      label: 'DNF',  val: base.dnf_count },
            { name: 'total_starters', label: '出發',  val: base.total_starters },
          ].map(f => (
            <div key={f.name} className="flex flex-col gap-1">
              <label className="text-xs text-ink-3">{f.label}</label>
              <input name={f.name} type="number" min="0" defaultValue={f.val ?? ''}
                className="rounded border border-border-strong bg-bg px-2 py-1.5 text-sm text-ink outline-none focus:border-accent" />
            </div>
          ))}
        </div>

        {/* 報名 + 成績查詢 */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="flex flex-col gap-1">
            <label className="text-xs text-ink-3">報名網頁 URL</label>
            <input name="registration_url" type="url" defaultValue={base.registration_url ?? ''}
              placeholder="https://..."
              className="rounded-lg border border-border-strong bg-bg px-3 py-2 text-sm text-ink outline-none focus:border-accent" />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-ink-3">成績查詢 URL</label>
            <input name="results_url" type="url" defaultValue={base.results_url ?? ''}
              placeholder="https://..."
              className="rounded-lg border border-border-strong bg-bg px-3 py-2 text-sm text-ink outline-none focus:border-accent" />
          </div>
        </div>

        {/* 備註 */}
        <div className="flex flex-col gap-1">
          <label className="text-xs text-ink-3">備註</label>
          <input name="notes" type="text" defaultValue={base.notes ?? ''}
            className="rounded-lg border border-border-strong bg-bg px-3 py-2 text-sm text-ink outline-none focus:border-accent" />
        </div>

        {state.error && <p className="text-sm text-red">{state.error}</p>}

        <div className="flex gap-2 justify-end">
          <button type="button" onClick={onClose}
            className="px-3 py-1.5 rounded-lg text-sm text-ink-3 hover:bg-bg transition">
            取消
          </button>
          <button type="submit" disabled={pending || selected.length === 0}
            className="px-4 py-1.5 rounded-lg bg-accent text-sm font-semibold text-accent-ink hover:brightness-110 transition disabled:opacity-50">
            {pending ? '儲存中…' : '儲存'}
          </button>
        </div>
      </form>
    </div>
  )
}

// ── 天氣列（抓取 + 顯示） ─────────────────────────────────────
const WEATHER_INIT: WeatherFetchState = { error: null, success: false }

function WindDir({ deg }: { deg: string }) {
  const map: Record<string, string> = { N:'北', NE:'東北', E:'東', SE:'東南', S:'南', SW:'西南', W:'西', NW:'西北' }
  return <>{map[deg] ?? deg}</>
}

function WeatherBar({ editions, raceId }: { editions: Edition[]; raceId: string }) {
  const [state, action, pending] = useActionState(fetchEditionWeather, WEATHER_INIT)
  const base = editions[0]
  const wx = base.weather_data as {
    temp_c?: number; humidity_pct?: number; wind_speed_ms?: number
    wind_direction?: string; precipitation_mm?: number
  } | null

  return (
    <div className="border-t border-border/50 px-4 py-2.5 flex items-center gap-3 flex-wrap">
      {/* 現有天氣資料 */}
      {wx ? (
        <span className="text-xs text-ink-3 flex items-center gap-2">
          <span className="text-ink-4">天氣</span>
          {wx.temp_c != null && <span>{wx.temp_c}°C</span>}
          {wx.humidity_pct != null && <span>濕度 {wx.humidity_pct}%</span>}
          {wx.wind_speed_ms != null && (
            <span>風 {wx.wind_speed_ms} m/s{wx.wind_direction ? <> <WindDir deg={wx.wind_direction} /></> : ''}</span>
          )}
          {wx.precipitation_mm != null && <span>雨 {wx.precipitation_mm} mm</span>}
          {base.weather_source && <span className="text-ink-4/60">({base.weather_source})</span>}
        </span>
      ) : (
        <span className="text-xs text-ink-4">尚無天氣資料</span>
      )}

      {/* 抓取按鈕 */}
      <form action={action} className="ml-auto flex items-center gap-2">
        <input type="hidden" name="edition_id" value={base.id} />
        <input type="hidden" name="race_id" value={raceId} />
        {state.error && <span className="text-xs text-red">{state.error}</span>}
        {state.success && state.message && <span className="text-xs text-good">{state.message}</span>}
        <button type="submit" disabled={pending}
          className="px-2.5 py-1 rounded text-xs border border-border text-ink-3 hover:border-border-strong hover:text-ink transition disabled:opacity-50">
          {pending ? '抓取中…' : wx ? '重新抓取天氣' : '抓取天氣'}
        </button>
      </form>
    </div>
  )
}

// ── 刪除確認（年份層級） ──────────────────────────────────────
function DeleteYearConfirm({ editions, raceId, year, onClose }: {
  editions: Edition[]
  raceId: string
  year: number
  onClose: () => void
}) {
  const [state, action, pending] = useActionState(deleteYearEditions, initial)

  return (
    <div className="px-4 py-3 border-t border-border bg-bg-elev">
      <form action={action} className="flex flex-col gap-2">
        <input type="hidden" name="race_id" value={raceId} />
        <input type="hidden" name="year" value={year} />

        {state.error
          ? <p className="text-sm text-red">{state.error}</p>
          : <p className="text-sm text-ink">
              確定刪除 {year} 年全部屆次（{editions.length} 個距離）？此操作無法復原。
            </p>
        }

        <div className="flex gap-2 justify-end">
          <button type="button" onClick={onClose}
            className="px-3 py-1.5 rounded-lg text-sm text-ink-3 hover:bg-bg transition">
            取消
          </button>
          {!state.error && (
            <button type="submit" disabled={pending}
              className="px-4 py-1.5 rounded-lg bg-red/10 border border-red/30 text-sm font-semibold text-red hover:bg-red/20 transition disabled:opacity-50">
              {pending ? '刪除中…' : '確認刪除'}
            </button>
          )}
        </div>
      </form>
    </div>
  )
}

// ── 主元件：年份區塊 ──────────────────────────────────────────
export function YearEditionBlock({ year, editions, raceId }: {
  year: number
  editions: Edition[]
  raceId: string
}) {
  const [mode, setMode] = useState<'view' | 'edit' | 'delete'>('view')
  const base = editions[0]
  const dateRange = base.race_date_end ? `${base.race_date} – ${base.race_date_end}` : base.race_date

  return (
    <div className="rounded-xl border border-border bg-bg-card overflow-hidden">
      {/* 年份標頭 */}
      <div className="px-4 py-2.5 bg-bg-elev border-b border-border flex items-center gap-2">
        <span className="text-sm font-semibold text-ink">{year}</span>
        <span className="text-xs text-ink-4">{dateRange}</span>
        <div className="ml-auto flex gap-1">
          <button
            onClick={() => setMode(mode === 'edit' ? 'view' : 'edit')}
            className={[
              'px-2.5 py-1 rounded text-xs transition',
              mode === 'edit'
                ? 'bg-accent/10 text-accent'
                : 'text-ink-3 hover:bg-bg hover:text-ink',
            ].join(' ')}
          >
            編輯
          </button>
          <button
            onClick={() => setMode(mode === 'delete' ? 'view' : 'delete')}
            className={[
              'px-2.5 py-1 rounded text-xs transition',
              mode === 'delete'
                ? 'bg-red/10 text-red'
                : 'text-red/50 hover:bg-red/10 hover:text-red',
            ].join(' ')}
          >
            刪除
          </button>
        </div>
      </div>

      {/* 距離列表（唯讀） */}
      {mode === 'view' && (
        <>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-ink-3 text-xs">
                <th className="px-4 py-2 text-left">距離</th>
                <th className="px-4 py-2 text-left">游泳</th>
                <th className="px-4 py-2 text-left">騎車</th>
                <th className="px-4 py-2 text-left">跑步</th>
                <th className="px-4 py-2 text-left">游泳環境</th>
                <th className="px-4 py-2 text-left">連結</th>
                <th className="px-4 py-2 text-right">完賽／出發</th>
              </tr>
            </thead>
            <tbody>
              {editions.map(e => (
                <tr key={e.id} className="border-b border-border last:border-0">
                  <td className="px-4 py-2.5">
                    <span className="font-medium text-accent">{DISTANCE_LABEL[e.distance_category] ?? e.distance_category}</span>
                  </td>
                  <td className="px-4 py-2.5 text-xs text-ink-3">{e.swim_distance_m ? `${e.swim_distance_m}m` : '—'}</td>
                  <td className="px-4 py-2.5 text-xs text-ink-3">{e.bike_distance_km ? `${e.bike_distance_km}km` : '—'}</td>
                  <td className="px-4 py-2.5 text-xs text-ink-3">{e.run_distance_km ? `${e.run_distance_km}km` : '—'}</td>
                  <td className="px-4 py-2.5 text-xs text-ink-3">
                    {[
                      e.swim_type ? SWIM_LABEL[e.swim_type] : null,
                      e.water_temp_c != null ? `${e.water_temp_c}°C` : null,
                      e.is_wetsuit_allowed === true ? '✓ 防寒衣' : e.is_wetsuit_allowed === false ? '✗ 防寒衣' : null,
                    ].filter(Boolean).join('・') || '—'}
                  </td>
                  <td className="px-4 py-2.5 text-xs text-ink-3">
                    {e.registration_url && <a href={e.registration_url} target="_blank" rel="noopener noreferrer" className="text-accent hover:underline mr-2">報名</a>}
                    {e.results_url && <a href={e.results_url} target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">成績</a>}
                    {!e.registration_url && !e.results_url && '—'}
                  </td>
                  <td className="px-4 py-2.5 text-right text-xs text-ink-3">
                    {e.finisher_count != null ? `${e.finisher_count} / ${e.total_starters ?? '?'}` : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {/* 天氣列 */}
          <WeatherBar editions={editions} raceId={raceId} />
        </>
      )}

      {mode === 'edit' && (
        <EditYearForm editions={editions} raceId={raceId} year={year} onClose={() => setMode('view')} />
      )}

      {mode === 'delete' && (
        <DeleteYearConfirm editions={editions} raceId={raceId} year={year} onClose={() => setMode('view')} />
      )}
    </div>
  )
}
