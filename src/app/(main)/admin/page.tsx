import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { secondsToTime } from '@/lib/utils/time'
import { ApproveButton, RejectButton, ResetButton } from './ClaimActions'

export const metadata: Metadata = { title: '審核中心 · Tri·log' }

export default async function AdminPage() {
  const supabase = await createClient()

  // 權限檢查
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: isAssistant } = await supabase.rpc('is_assistant_or_above')
  if (!isAssistant) redirect('/leaderboard')

  // 待審核認領（pending）
  const { data: pending } = await supabase
    .from('results')
    .select(`
      id, total_seconds, athlete_name_snapshot, claimed_at, certificate_url,
      athletes ( id, nickname, email ),
      race_editions ( year, races ( name ) )
    `)
    .eq('claim_status', 'pending')
    .order('claimed_at', { ascending: true })

  // 已認領成績（可強制重設）
  const { data: claimed } = await supabase
    .from('results')
    .select(`
      id, total_seconds, athlete_name_snapshot, claimed_at, source_credibility,
      athletes ( id, nickname, email ),
      race_editions ( year, races ( name ) )
    `)
    .eq('claim_status', 'claimed')
    .order('claimed_at', { ascending: false })
    .limit(50)

  return (
    <main className="flex-1 p-6 max-w-4xl mx-auto w-full">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-ink">審核中心</h1>
        <p className="mt-0.5 text-sm text-ink-3">認領申請審核 · 助手功能</p>
      </div>

      {/* ── 待審核 ── */}
      <section className="mb-10">
        <div className="flex items-center gap-3 mb-4">
          <h2 className="text-base font-semibold text-ink">待審核</h2>
          {pending && pending.length > 0 && (
            <span className="rounded-full bg-warn/20 px-2 py-0.5 text-xs font-semibold text-warn">
              {pending.length}
            </span>
          )}
        </div>

        {!pending?.length ? (
          <div className="rounded-xl border border-border bg-bg-card p-8 text-center">
            <p className="text-ink-3 text-sm">目前沒有待審核的認領申請</p>
          </div>
        ) : (
          <div className="rounded-xl border border-border bg-bg-card overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-ink-3 text-xs">
                  <th className="px-4 py-3 text-left">成績</th>
                  <th className="px-4 py-3 text-left">認領人</th>
                  <th className="px-4 py-3 text-left">完賽時間</th>
                  <th className="px-4 py-3 text-left">證書</th>
                  <th className="px-4 py-3 text-left">申請時間</th>
                  <th className="px-4 py-3 text-right">操作</th>
                </tr>
              </thead>
              <tbody>
                {pending.map(r => {
                  const edition = r.race_editions as any
                  const athlete = r.athletes as any
                  return (
                    <tr key={r.id} className="border-b border-border last:border-0">
                      <td className="px-4 py-3">
                        <p className="font-medium text-ink">{r.athlete_name_snapshot ?? '—'}</p>
                        <p className="text-xs text-ink-4">{edition?.races?.name} {edition?.year}</p>
                      </td>
                      <td className="px-4 py-3 text-ink-3">
                        <p>{athlete?.nickname ?? '—'}</p>
                        <p className="text-xs text-ink-4">{athlete?.email}</p>
                      </td>
                      <td className="px-4 py-3 font-mono text-accent">
                        {secondsToTime(r.total_seconds)}
                      </td>
                      <td className="px-4 py-3">
                        {r.certificate_url ? (
                          <a
                            href={r.certificate_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-accent hover:underline"
                          >
                            查看證書 ↗
                          </a>
                        ) : (
                          <span className="text-xs text-ink-4">無證書</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-xs text-ink-4">
                        {r.claimed_at ? new Date(r.claimed_at).toLocaleDateString('zh-TW') : '—'}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-2">
                          <ApproveButton resultId={r.id} />
                          <RejectButton resultId={r.id} />
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* ── 已認領（可強制重設）── */}
      <section>
        <div className="flex items-center gap-3 mb-4">
          <h2 className="text-base font-semibold text-ink">已認領成績</h2>
          <span className="text-xs text-ink-4">最近 50 筆，可強制重設誤認領</span>
        </div>

        {!claimed?.length ? (
          <div className="rounded-xl border border-border bg-bg-card p-8 text-center">
            <p className="text-ink-3 text-sm">目前沒有已認領的成績</p>
          </div>
        ) : (
          <div className="rounded-xl border border-border bg-bg-card overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-ink-3 text-xs">
                  <th className="px-4 py-3 text-left">成績快照</th>
                  <th className="px-4 py-3 text-left">認領人</th>
                  <th className="px-4 py-3 text-left">完賽時間</th>
                  <th className="px-4 py-3 text-left">來源</th>
                  <th className="px-4 py-3 text-right">操作</th>
                </tr>
              </thead>
              <tbody>
                {claimed.map(r => {
                  const edition = r.race_editions as any
                  const athlete = r.athletes as any
                  return (
                    <tr key={r.id} className="border-b border-border last:border-0">
                      <td className="px-4 py-3">
                        <p className="font-medium text-ink">{r.athlete_name_snapshot ?? '—'}</p>
                        <p className="text-xs text-ink-4">{edition?.races?.name} {edition?.year}</p>
                      </td>
                      <td className="px-4 py-3 text-ink-3">
                        <p>{athlete?.nickname ?? '—'}</p>
                        <p className="text-xs text-ink-4">{athlete?.email}</p>
                      </td>
                      <td className="px-4 py-3 font-mono text-accent">
                        {secondsToTime(r.total_seconds)}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full border ${
                          r.source_credibility === 'official'
                            ? 'border-swim/30 text-swim'
                            : r.source_credibility === 'certificate'
                            ? 'border-good/30 text-good'
                            : 'border-border-strong text-ink-4'
                        }`}>
                          {r.source_credibility === 'official' ? '官方成績'
                            : r.source_credibility === 'certificate' ? '已公證'
                            : '自填'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <ResetButton resultId={r.id} />
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
