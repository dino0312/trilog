import type { Metadata } from 'next'
import Link from 'next/link'
import { TrilogLogo } from '@/components/ui/TrilogLogo'
import { ResendButton } from './ResendButton'

export const metadata: Metadata = { title: '請驗證您的 Email · Tri·log' }

function maskEmail(email: string): string {
  const [local, domain] = email.split('@')
  if (!domain) return email
  const visible = local.length <= 2 ? local : local.slice(0, 2) + '*'.repeat(Math.min(local.length - 2, 4))
  return `${visible}@${domain}`
}

type Props = { searchParams: Promise<{ email?: string }> }

export default async function VerifyEmailPage({ searchParams }: Props) {
  const { email } = await searchParams
  const masked = email ? maskEmail(email) : null

  return (
    <div className="w-full max-w-sm">
      <div className="mb-8 flex flex-col items-center gap-3">
        <TrilogLogo size="lg" context="login" />
      </div>

      <div className="rounded-xl border border-border bg-bg-card p-7 flex flex-col items-center gap-5 text-center">
        {/* 信封圖示 */}
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-accent/10">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="text-accent">
            <rect x="2" y="4" width="20" height="16" rx="2"/>
            <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
          </svg>
        </div>

        <div>
          <h1 className="text-lg font-bold text-ink">請前往信箱完成驗證</h1>
          <p className="mt-2 text-sm text-ink-3 leading-relaxed">
            驗證信已寄送至{masked ? (
              <> <span className="font-mono text-ink">{masked}</span><br/></>
            ) : '您的信箱'}
            請點擊信中的連結以啟用帳號。
          </p>
        </div>

        <div className="w-full rounded-lg border border-border bg-bg-elev px-4 py-3 text-left text-xs text-ink-3 space-y-1">
          <p>📬 若未收到，請檢查垃圾信件夾</p>
          <p>⏱ 連結有效期為 24 小時</p>
          <p>✉️ 驗證完成後，直接回來登入即可</p>
        </div>

        {email && <ResendButton email={email} />}

        <Link
          href="/login"
          className="mt-1 w-full rounded-lg border border-border py-2.5 text-sm font-medium text-ink-3 hover:text-ink hover:bg-bg-elev transition text-center"
        >
          已驗證，前往登入
        </Link>
      </div>
    </div>
  )
}
