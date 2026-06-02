import type { Metadata } from 'next'
import { NewResultForm } from '@/components/results/NewResultForm'

export const metadata: Metadata = { title: '新增成績' }

export default function NewResultPage() {
  return (
    <main className="flex-1 p-6 max-w-2xl mx-auto w-full">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-ink">新增成績</h1>
        <p className="mt-1 text-sm text-ink-3">記錄你的完賽時間</p>
      </div>
      <div className="rounded-xl border border-border bg-bg-card p-6">
        <NewResultForm />
      </div>
    </main>
  )
}
