import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { secondsToTime } from '@/lib/utils/time'
import { ApproveRaceButton, RejectRaceButton } from './RaceReviewActions'

export const metadata: Metadata = { title: '賽事審核 · Tri·log' }

// 簡單相似度：去空白後是否包含對方名稱的主要詞（超過 4 字元）
function isSimilar(a: string, b: string): boolean {
  const normalize = (s: string) => s.toLowerCase().replace(/\s+/g, '')
  const na = normalize(a)
  const nb = normalize(b)
  if (na === nb) return true
  // 其中一個包含另一個（最少 4 字元）
  if (na.length >= 4 && (nb.includes(na) || na.includes(nb))) return true
  return false
}

export default async function RaceReviewPage() {
  const supabase = await createClient()

  // 待審核賽事
  const { data: pending } = await supabase
    .from('races')
    .select('id, name, slug, city, country, organizer, created_at')
    .eq('status', 'pending_review')
    .order('created_at', { ascending: true })

  // 現有上線賽事（用於重複偵測）
  const { data: activeRaces } = await supabase
    .from('races')
    .select('id, name')
    .eq('status', 'active')

  // 近期 self_reported 成績（成績審查，最近 30 筆）
  const { data: selfReported } = await supabase
    .from('results')
    .select(`
      id, total_seconds, is_public, created_at,
      athletes ( name, nickname, email ),
      race_editions ( year, races ( name ) )
    `)
    .eq('source_credibility', 'self_reported')
    .eq('result_type', 'solo')
    .order('created_at', { ascending: false })
    .limit(30)

  return (
    <main className="flex-1 p-6 max-w-4xl mx-auto w-full">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-ink">賽事審核</h1>
        <p className="mt-0.5 text-sm text-ink-3">待上線賽事確認 · 近期成績 spot-check</p>
      </div>

      {/* ── 待審核賽事 ── */}
      <section className="mb-10">
        <div className="flex items-center gap-3 mb-4">
          <h2 className="text-base font-semibold text-ink">待審核賽事</h2>
          {pending && pending.length > 0 && (
            <span className="rounded-full bg-warn/20 px-2 py-0.5 text-xs font-semibold text-warn">
              {pending.length}
            </span>
          )}
        </div>

        {!pending?.length ? (
          <div className="rounded-xl border border-border bg-bg-card p-8 text-center">
            <p className="text-ink-3 text-sm">目前沒有待審核的賽事</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {pending.map(race => {
              const duplicates = (activeRaces ?? []).filter(
                ar => ar.id !== race.id && isSimilar(ar.name, race.name)
              )
              return (
                <div key={race.id} className="rounded-xl border border-border bg-bg-card p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-ink">{race.name}</p>
                      <p className="text-xs text-ink-4 font-mono mt-0.5">{race.slug}</p>
                      <p className="text-xs text-ink-3 mt-1">
                        {[race.city, race.country].filter(Boolean).join('，') || '（無地點）'}
                        {race.organizer && ` · ${race.organizer}`}
                      </p>
                      <p className="text-xs text-ink-4 mt-1">
                        送審時間：{new Date(race.created_at).toLocaleString('zh-TW', {
                          year: 'numeric', month: '2-digit', day: '2-digit',
                          hour: '2-digit', minute: '2-digit',
                        })}
                      </p>

                      {/* 疑似重複警告 */}
                      {duplicates.length > 0 && (
                        <div className="mt-2 rounded-lg bg-warn/10 border border-warn/20 px-3 py-2">
                          <p className="text-xs font-semibold text-warn mb-1">⚠️ 疑似重複</p>
                          {duplicates.map(d => (
                            <p key={d.id} className="text-xs text-warn/80">已有「{d.name}」</p>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col gap-2 shrink-0">
                      <ApproveRaceButton raceId={race.id} />
                      <RejectRaceButton raceId={race.id} />
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </section>

      {/* ── 近期 self_reported 成績 ── */}
      <section>
        <div className="flex items-center gap-3 mb-4">
          <h2 className="text-base font-semibold text-ink">近期自填成績</h2>
          <span className="text-xs text-ink-4">最近 30 筆，供 spot-check</span>
        </div>

        {!selfReported?.length ? (
          <div className="rounded-xl border border-border bg-bg-card p-8 text-center">
            <p className="text-ink-3 text-sm">尚無自填成績</p>
          </div>
        ) : (
          <div className="rounded-xl border border-border bg-bg-card overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-ink-3 text-xs">
                  <th className="px-4 py-3 text-left">選手</th>
                  <th className="px-4 py-3 text-left">賽事</th>
                  <th className="px-4 py-3 text-left font-mono">完賽時間</th>
                  <th className="px-4 py-3 text-center">公開</th>
                  <th className="px-4 py-3 text-right">建立時間</th>
                </tr>
              </thead>
              <tbody>
                {selfReported.map(r => {
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  const athlete = r.athletes as any
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  const edition = r.race_editions as any
                  return (
                    <tr key={r.id} className="border-b border-border last:border-0 hover:bg-bg-elev/30 transition">
                      <td className="px-4 py-3">
                        <p className="text-ink">{athlete?.nickname ?? athlete?.name ?? '—'}</p>
                        <p className="text-xs text-ink-4">{athlete?.email}</p>
                      </td>
                      <td className="px-4 py-3 text-ink-3 text-xs">
                        {edition?.races?.name} {edition?.year}
                      </td>
                      <td className="px-4 py-3 font-mono text-accent">
                        {secondsToTime(r.total_seconds)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {r.is_public
                          ? <span className="text-xs text-good">公開</span>
                          : <span className="text-xs text-ink-4">私人</span>}
                      </td>
                      <td className="px-4 py-3 text-right text-xs text-ink-4">
                        {new Date(r.created_at).toLocaleDateString('zh-TW')}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  )
}
