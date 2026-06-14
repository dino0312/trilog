import { createClient } from '@/lib/supabase/server'
import { OnboardingChecklist } from './OnboardingChecklist'

export async function OnboardingChecklistLoader() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return (
      <OnboardingChecklist
        isLoggedIn={false}
        hasProfile={false}
        hasResult={false}
        hasCompletedOnboarding={false}
      />
    )
  }

  const [{ data: athlete }, { count: resultCount }] = await Promise.all([
    supabase
      .from('athletes')
      .select('name, has_completed_onboarding')
      .eq('id', user.id)
      .single(),
    supabase
      .from('results')
      .select('*', { count: 'exact', head: true })
      .eq('athlete_id', user.id),
  ])

  return (
    <OnboardingChecklist
      isLoggedIn={true}
      hasProfile={!!athlete?.name}
      hasResult={(resultCount ?? 0) > 0}
      hasCompletedOnboarding={!!athlete?.has_completed_onboarding}
    />
  )
}
