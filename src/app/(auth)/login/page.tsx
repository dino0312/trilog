import { Suspense } from 'react'
import type { Metadata } from 'next'
import { LoginForm } from '@/components/auth/LoginForm'

export const metadata: Metadata = { title: '登入' }

export default function LoginPage() {
  return (
    <div className="w-full max-w-sm">
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-bold text-ink">登入 Tri·log</h1>
        <p className="mt-1 text-sm text-ink-3">記錄你的每一場鐵人三項</p>
      </div>
      <div className="rounded-xl border border-border bg-bg-card p-6">
        <Suspense>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  )
}
