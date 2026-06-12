import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ResultEntryPage } from '@/components/results/ResultEntryPage'

export const metadata: Metadata = { title: '新增成績' }

export default async function NewResultPage({
  searchParams,
}: {
  searchParams: Promise<{ for?: string; tab?: string }>
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login?redirectTo=/records/new')

  const { for: forParam, tab } = await searchParams

  // ?for=other 向後相容，對應 other tab
  const defaultTab =
    tab === 'relay' ? 'relay' :
    tab === 'other' || forParam === 'other' ? 'other' :
    'solo'

  const { data: athlete } = await supabase
    .from('athletes')
    .select('name, gender, birth_year, nationality')
    .eq('id', user.id)
    .single()

  const profileComplete = Boolean(
    athlete?.name && athlete?.gender && athlete?.birth_year && athlete?.nationality
  )

  return (
    <ResultEntryPage
      profileComplete={profileComplete}
      profile={athlete ?? { name: null, gender: null, birth_year: null, nationality: null }}
      defaultTab={defaultTab}
    />
  )
}
