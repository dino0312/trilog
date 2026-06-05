import { Suspense } from 'react'
import type { Metadata } from 'next'
import { LoginForm } from '@/components/auth/LoginForm'
import { TrilogLogo } from '@/components/ui/TrilogLogo'

export const metadata: Metadata = { title: '登入' }

export default function LoginPage() {
  return (
    <div className="w-full max-w-sm">
      {/* Logo — 1.8s 活力節奏 */}
      <div className="mb-8 flex flex-col items-center gap-3">
        <TrilogLogo size="lg" context="login" />
        <p className="text-sm text-ink-3">記錄你的每一場鐵人三項</p>
      </div>

      <div className="rounded-xl border border-border bg-bg-card p-6">
        <Suspense>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  )
}
