import type { Metadata } from 'next'
import { RegisterForm } from '@/components/auth/RegisterForm'

export const metadata: Metadata = { title: '註冊' }

export default function RegisterPage() {
  return (
    <div className="w-full max-w-sm">
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-bold text-ink">建立帳號</h1>
        <p className="mt-1 text-sm text-ink-3">加入 Tri·log，開始記錄成績</p>
      </div>
      <div className="rounded-xl border border-border bg-bg-card p-6">
        <RegisterForm />
      </div>
    </div>
  )
}
