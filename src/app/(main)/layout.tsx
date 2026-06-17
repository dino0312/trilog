import { Nav } from '@/components/layout/Nav'
import { Footer } from '@/components/layout/Footer'
import { GlobalVerifyBanner } from '@/components/layout/GlobalVerifyBanner'
import { GuestBanner } from '@/components/onboarding/GuestBanner'
import { OnboardingChecklistLoader } from '@/components/onboarding/OnboardingChecklistLoader'

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col min-h-screen bg-bg">
      <Nav />
      <GlobalVerifyBanner />
      <GuestBanner />
      <div className="flex-1">
        {children}
      </div>
      <Footer />
      <OnboardingChecklistLoader />
    </div>
  )
}
