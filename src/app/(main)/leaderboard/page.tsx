import type { Metadata } from 'next'

export const metadata: Metadata = { title: '排行榜' }

export default function LeaderboardPage() {
  return (
    <main className="flex-1 p-8">
      <h1 className="text-3xl font-bold text-ink">排行榜</h1>
      <p className="mt-2 text-ink-3">Coming soon…</p>
    </main>
  )
}
