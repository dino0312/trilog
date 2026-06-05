import type { Metadata } from 'next'
import { Analytics } from '@vercel/analytics/next'
import { AuthModalProvider } from '@/context/auth-modal'
import { AuthModal } from '@/components/auth/AuthModal'
import './globals.css'

export const metadata: Metadata = {
  title: {
    default: 'Tri·log',
    template: '%s · Tri·log',
  },
  description: '鐵人三項成績記錄與排行榜平台',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-Hant" className="h-full">
      <body className="h-full">
        <AuthModalProvider>
          {children}
          {/* Auth Modal 掛在根層，任何頁面皆可觸發 */}
          <AuthModal />
        </AuthModalProvider>
        <Analytics />
      </body>
    </html>
  )
}
