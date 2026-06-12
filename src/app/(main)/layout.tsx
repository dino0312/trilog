import { Nav } from '@/components/layout/Nav'
import { Footer } from '@/components/layout/Footer'

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col min-h-screen bg-bg">
      <Nav />
      <div className="flex-1">
        {children}
      </div>
      <Footer />
    </div>
  )
}
