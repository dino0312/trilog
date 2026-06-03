import type { Metadata } from 'next'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { RaceFormPanel } from './RaceFormPanel'

export const metadata: Metadata = { title: '賽事管理 · Tri·log' }

const STATUS_LABEL: Record<string, string> = {
  active:    '運作中',
  inactive:  '已停辦',
  cancelled: '已取消',
}

export default async function AdminRacesPage() {
  const supabase = await createClient()

  const { data: races } = await supabase
    .from('races')
    .select(`
      id, name, slug, status, country, city, organizer, website, created_at,
      race_editions ( id )
    `)
    .order('name')

  return (
    <main className="flex-1 p-6 max-w-4xl mx-auto w-full">
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-ink">賽事管理</h1>
          <p className="mt-0.5 text-sm text-ink-3">系列賽與屆次資料維護</p>
        </div>
      </div>

      {/* 新增系列賽 panel */}
      <RaceFormPanel />

      {/* 系列賽列表 */}
      <section className="mt-8">
        <h2 className="text-base font-semibold text-ink mb-4">
          所有系列賽
          <span className="ml-2 text-xs font-normal text-ink-4">{races?.length ?? 0} 個</span>
        </h2>

        {!races?.length ? (
          <div className="rounded-xl border border-border bg-bg-card p-8 text-center">
            <p className="text-ink-3 text-sm">尚無系列賽資料</p>
          </div>
        ) : (
          <div className="rounded-xl border border-border bg-bg-card overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-ink-3 text-xs">
                  <th className="px-4 py-3 text-left">系列名稱</th>
                  <th className="px-4 py-3 text-left">地點</th>
                  <th className="px-4 py-3 text-left">主辦</th>
                  <th className="px-4 py-3 text-center">屆次</th>
                  <th className="px-4 py-3 text-center">狀態</th>
                  <th className="px-4 py-3 text-right">操作</th>
                </tr>
              </thead>
              <tbody>
                {races.map(race => {
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const editionCount = (race.race_editions as any as { id: string }[])?.length ?? 0
                  return (
                    <tr key={race.id} className="border-b border-border last:border-0 hover:bg-bg-elev/30 transition">
                      <td className="px-4 py-3">
                        <p className="font-medium text-ink">{race.name}</p>
                        <p className="text-xs text-ink-4 font-mono">{race.slug}</p>
                      </td>
                      <td className="px-4 py-3 text-ink-3 text-xs">
                        {[race.city, race.country].filter(Boolean).join('，') || '—'}
                      </td>
                      <td className="px-4 py-3 text-ink-3 text-xs">
                        {race.organizer || '—'}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="font-mono text-accent">{editionCount}</span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`text-xs px-2 py-0.5 rounded-full border ${
                          race.status === 'active'
                            ? 'border-good/30 text-good'
                            : 'border-border-strong text-ink-4'
                        }`}>
                          {STATUS_LABEL[race.status] ?? race.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Link
                          href={`/admin/races/${race.id}`}
                          className="text-xs text-accent hover:underline"
                        >
                          管理 →
                        </Link>
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
