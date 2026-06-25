import { Footer } from '@/components/layout/Footer'

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen flex flex-col bg-bg">
      <div className="flex-1 flex items-center justify-center px-4">
        {children}
      </div>
      <Footer />
    </div>
  )
}
