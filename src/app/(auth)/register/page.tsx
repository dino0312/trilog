import type { Metadata } from 'next'
import { RegisterForm } from '@/components/auth/RegisterForm'
import { TrilogLogo } from '@/components/ui/TrilogLogo'

export const metadata: Metadata = { title: '註冊' }

export default function RegisterPage() {
  return (
    <div className="w-full max-w-sm">
      {/* Logo */}
      <div className="mb-8 flex flex-col items-center gap-3">
        <TrilogLogo size="lg" context="login" />
        <p className="text-sm text-ink-3">加入 Tri·log，開始記錄成績</p>
      </div>

      <div className="rounded-xl border border-border bg-bg-card p-6">
        <RegisterForm />
      </div>
    </div>
  )
}
