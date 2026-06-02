import type { Metadata } from 'next'

export const metadata: Metadata = { title: '我的紀錄' }

export default function RecordsPage() {
  return (
    <main className="flex-1 p-8">
      <h1 className="text-3xl font-bold text-ink">我的紀錄</h1>
      <p className="mt-2 text-ink-3">Coming soon…</p>
    </main>
  )
}
