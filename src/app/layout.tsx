import type { Metadata } from 'next'
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
      <body className="h-full">{children}</body>
    </html>
  )
}
