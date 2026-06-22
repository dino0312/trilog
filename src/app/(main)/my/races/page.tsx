import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { RaceFollowStatusModal } from '@/components/races/RaceFollowStatusModal'
import { UpgradeToRegisteredButton } from '@/components/races/UpgradeToRegisteredButton'

export const metadata = { title: '我的賽事 · Tri·log' }

const DISTANCE_LABEL: Record<string, string> = {
  sprint: 'Sprint', olympic: '51.5', '70.3': '113', full: '226',
}
const STATUS_LABEL: Record<string, string> = {
  completed: '已完賽', dns: 'DNS', dnf: 'DNF',
}
const STATUS_COLOR: Record<string, string> = {
  completed: 'var(--accent)', dns: 'var(--ink-3)', dnf: 'var(--ink-3)',
}

function daysUntil(dateStr: string): number {
  const today = new Date(); today.setHours(0, 0, 0, 0)
  const target = new Date(dateStr); target.setHours(0, 0, 0, 0)
  return Math.ceil((target.getTime() - today.getTime()) / 86400000)
}

export default async function MyRacesPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { tab = 'upcoming' } = await searchParams
  const today = new Date().toISOString().slice(0, 10)

  // 各 tab 獨立查詢
  const { data: upcoming } = await supabase
    .from('race_follows')
    .select(`
      id, status, result_id,
      race_editions (
        id, year, distance_category, race_date, registration_url,
        races ( id, name, name_zh, slug, county )
      )
    `)
    .eq('athlete_id', user.id)
    .eq('status', 'registered')
    .gt('race_editions.race_date', today)
    .order('race_editions(race_date)', { ascending: true })

  const { data: watching } = await supabase
    .from('race_follows')
    .select(`
      id, status,
      race_editions (
        id, year, distance_category, race_date, registration_url, registration_deadline,
        races ( id, name, name_zh, slug, county )
      )
    `)
    .eq('athlete_id', user.id)
    .eq('status', 'watching')
    .order('race_editions(race_date)', { ascending: true })

  const { data: history } = await supabase
    .from('race_follows')
    .select(`
      id, status, result_id, dns_dnf_reason, dns_dnf_public,
      race_editions (
        id, year, distance_category, race_date,
        races ( id, name, name_zh, slug, county )
      )
    `)
    .eq('athlete_id', user.id)
    .in('status', ['completed', 'dns', 'dnf'])
    .order('race_editions(race_date)', { ascending: false })

  const tabs = [
    { key: 'upcoming', label: '即將出賽', count: upcoming?.length ?? 0 },
    { key: 'watching', label: '關注中', count: watching?.length ?? 0 },
    { key: 'history',  label: '歷史', count: history?.length ?? 0 },
  ]

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      {/* Tab 列 */}
      <div className="mb-6 flex gap-1 rounded-xl bg-bg-card p-1">
        {tabs.map(t => (
          <Link
            key={t.key}
            href={`/my/races?tab=${t.key}`}
            className="flex-1 rounded-lg px-3 py-2 text-center text-sm transition"
            style={{
              background: tab === t.key ? 'var(--bg-elev)' : 'transparent',
              color: tab === t.key ? 'var(--ink)' : 'var(--ink-3)',
              fontWeight: tab === t.key ? 600 : 400,
            }}
          >
            {t.label}
            {t.count > 0 && (
              <span className="ml-1.5 rounded-full bg-accent/20 px-1.5 py-0.5 text-[10px] font-semibold text-accent">
                {t.count}
              </span>
            )}
          </Link>
        ))}
      </div>

      {/* Upcoming Tab */}
      {tab === 'upcoming' && (
        <div className="space-y-4">
          {!upcoming?.length ? (
            <EmptyState text="尚無已報名賽事。找到心儀賽事後，在屆次頁標記「已報名」！" />
          ) : upcoming.map(f => {
            const ed = f.race_editions as any
            if (!ed) return null
            const race = ed.races as any
            const days = daysUntil(ed.race_date)
            const nearRace = days <= 3 && days >= 0

            return (
              <div key={f.id} className="rounded-2xl border border-border bg-bg-card p-5">
                <div className="mb-3 flex items-start justify-between gap-3">
                  <div>
                    <Link
                      href={`/races/${race.slug}/${ed.year}`}
                      className="text-base font-semibold text-ink hover:text-accent transition"
                    >
                      {race.name_zh ?? race.name} {ed.year}
                    </Link>
                    <p className="mt-0.5 text-xs text-ink-4">{race.county} · {ed.race_date}</p>
                  </div>
                  {days >= 0 && (
                    <div className="shrink-0 text-right">
                      <span className="block text-3xl font-black text-accent leading-none">{days}</span>
                      <span className="text-[10px] text-ink-4">天後</span>
                    </div>
                  )}
                </div>

                <div className="flex flex-wrap gap-1.5 mb-3">
                  <span className="rounded-full bg-bg-elev px-2 py-0.5 text-xs text-ink-3">
                    {DISTANCE_LABEL[ed.distance_category] ?? ed.distance_category}
                  </span>
                </div>

                <div className="flex flex-wrap gap-2 text-xs">
                  <Link
                    href={`/races/${race.slug}/${ed.year}`}
                    className="text-accent hover:underline"
                  >
                    前往賽事資訊 →
                  </Link>
                  {ed.registration_url && (
                    <a href={ed.registration_url} target="_blank" rel="noopener noreferrer" className="text-ink-3 hover:text-ink">
                      官方網站 ↗
                    </a>
                  )}
                </div>

                {nearRace && (
                  <div className="mt-4 rounded-xl border border-accent/30 bg-accent/5 p-3">
                    <p className="mb-2 text-xs font-medium text-accent">
                      {days === 0 ? '今天比賽！' : `距離賽事只剩 ${days} 天`} 已完賽了嗎？
                    </p>
                    <RaceFollowStatusModal
                      raceFollowId={f.id}
                      raceEditionId={ed.id}
                      raceName={`${race.name_zh ?? race.name} ${ed.year}`}
                      trigger={
                        <button className="rounded-lg bg-accent px-3 py-1.5 text-xs font-semibold text-bg hover:opacity-90">
                          標記完賽狀態
                        </button>
                      }
                    />
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Watching Tab */}
      {tab === 'watching' && (
        <div className="space-y-4">
          {!watching?.length ? (
            <EmptyState text="尚無關注中的賽事。在屆次頁點擊「關注」即可追蹤！" />
          ) : watching.map(f => {
            const ed = f.race_editions as any
            if (!ed) return null
            const race = ed.races as any
            const deadlineDays = ed.registration_deadline ? daysUntil(ed.registration_deadline) : null

            return (
              <div key={f.id} className="rounded-2xl border border-border bg-bg-card p-5">
                <div className="mb-2 flex items-start justify-between gap-3">
                  <div>
                    <Link
                      href={`/races/${race.slug}/${ed.year}`}
                      className="text-base font-semibold text-ink hover:text-accent transition"
                    >
                      {race.name_zh ?? race.name} {ed.year}
                    </Link>
                    <p className="mt-0.5 text-xs text-ink-4">{race.county} · {ed.race_date}</p>
                  </div>
                  {deadlineDays !== null && deadlineDays >= 0 && (
                    <div className="shrink-0 text-right">
                      <span className="block text-xl font-bold text-ink leading-none">{deadlineDays}</span>
                      <span className="text-[10px] text-ink-4">天截止</span>
                    </div>
                  )}
                </div>

                {deadlineDays !== null && (
                  <p className="mb-2 text-xs text-ink-4">
                    報名截止：{ed.registration_deadline}
                    {deadlineDays < 0 ? '（已截止）' : ''}
                  </p>
                )}

                <div className="flex flex-wrap gap-2 mt-3">
                  {ed.registration_url && (
                    <a
                      href={ed.registration_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded-lg border border-border px-3 py-1.5 text-xs text-ink-3 hover:bg-bg-elev hover:text-ink transition"
                    >
                      前往報名 ↗
                    </a>
                  )}
                  <UpgradeToRegisteredButton followId={f.id} />
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* History Tab */}
      {tab === 'history' && (
        <div className="space-y-4">
          {!history?.length ? (
            <EmptyState text="尚無歷史賽事記錄。" />
          ) : history.map(f => {
            const ed = f.race_editions as any
            if (!ed) return null
            const race = ed.races as any
            const status = f.status as string

            return (
              <div key={f.id} className="rounded-2xl border border-border bg-bg-card p-5">
                <div className="mb-2 flex items-start justify-between gap-2">
                  <div>
                    <Link
                      href={`/races/${race.slug}/${ed.year}`}
                      className="text-base font-semibold text-ink hover:text-accent transition"
                    >
                      {race.name_zh ?? race.name} {ed.year}
                    </Link>
                    <p className="mt-0.5 text-xs text-ink-4">{race.county} · {ed.race_date}</p>
                  </div>
                  <span
                    className="shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold"
                    style={{
                      background: `${STATUS_COLOR[status]}22`,
                      color: STATUS_COLOR[status],
                    }}
                  >
                    {STATUS_LABEL[status]}
                  </span>
                </div>

                {status === 'completed' && (
                  f.result_id
                    ? (
                      <Link
                        href={`/results/${f.result_id}`}
                        className="mt-1 inline-flex text-xs text-accent hover:underline"
                      >
                        查看成績 →
                      </Link>
                    )
                    : (
                      <Link
                        href={`/records/new?race_edition_id=${ed.id}`}
                        className="mt-1 inline-flex text-xs text-ink-3 hover:text-ink hover:underline"
                      >
                        尚未連結成績 → 前往登錄
                      </Link>
                    )
                )}

                {(status === 'dns' || status === 'dnf') && f.dns_dnf_public && f.dns_dnf_reason && (
                  <p className="mt-1 text-xs text-ink-4">{f.dns_dnf_reason}</p>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="rounded-2xl border border-border bg-bg-card px-6 py-12 text-center">
      <p className="text-sm text-ink-4">{text}</p>
    </div>
  )
}

