import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { NewResultForm } from '@/components/results/NewResultForm'

export const metadata: Metadata = { title: '新增成績' }

export default async function NewResultPage({
  searchParams,
}: {
  searchParams: Promise<{ for?: string }>
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login?redirectTo=/records/new')

  const { for: forParam } = await searchParams
  const forOther = forParam === 'other'

  const { data: athlete } = await supabase
    .from('athletes')
    .select('name, gender, birth_year, nationality')
    .eq('id', user.id)
    .single()

  const profileComplete = Boolean(
    athlete?.name && athlete?.gender && athlete?.birth_year && athlete?.nationality
  )

  return (
    <main className="flex-1 p-6 max-w-2xl mx-auto w-full">
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-ink">
              {forOther ? '幫他人新增成績' : '新增成績'}
            </h1>
            <p className="mt-1 text-sm text-ink-3">
              {forOther ? '成績將以未認領狀態建立，本人可稍後認領' : '記錄你的完賽時間'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {!forOther && (
              <Link
                href="/records/new?for=other"
                className="text-sm text-ink-3 border border-border rounded-lg px-3 py-1.5 hover:text-ink hover:bg-bg-elev transition"
              >
                幫他人新增 →
              </Link>
            )}
            {forOther && (
              <Link
                href="/records/new"
                className="text-sm text-ink-3 border border-border rounded-lg px-3 py-1.5 hover:text-ink hover:bg-bg-elev transition"
              >
                ← 自己的成績
              </Link>
            )}
            {!forOther && (
              <Link
                href="/records/relay/new"
                className="text-sm text-ink-3 border border-border rounded-lg px-3 py-1.5 hover:text-ink hover:bg-bg-elev transition"
              >
                接力成績 →
              </Link>
            )}
          </div>
        </div>
      </div>
      <div className="rounded-xl border border-border bg-bg-card p-6">
        <NewResultForm
          profileComplete={profileComplete}
          profile={athlete ?? { name: null, gender: null, birth_year: null, nationality: null }}
          forOther={forOther}
        />
      </div>
    </main>
  )
}
