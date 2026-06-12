'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

const DISMISS_KEY = 'trilog_verify_banner_dismissed'
const COOLDOWN_KEY = 'trilog_resend_ts'
const COOLDOWN_SEC = 60

export function GlobalVerifyBannerClient({ email }: { email: string }) {
  const [dismissed, setDismissed] = useState(true) // 預設 true 避免 SSR flash
  const [secondsLeft, setSecondsLeft] = useState(0)
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')

  useEffect(() => {
    const isDismissed = sessionStorage.getItem(DISMISS_KEY) === '1'
    setDismissed(isDismissed)
    const last = Number(localStorage.getItem(COOLDOWN_KEY) ?? 0)
    const remaining = Math.max(0, COOLDOWN_SEC - Math.floor((Date.now() - last) / 1000))
    setSecondsLeft(remaining)
  }, [])

  useEffect(() => {
    if (secondsLeft <= 0) return
    const t = setInterval(() => setSecondsLeft(s => Math.max(0, s - 1)), 1000)
    return () => clearInterval(t)
  }, [secondsLeft])

  function dismiss() {
    sessionStorage.setItem(DISMISS_KEY, '1')
    setDismissed(true)
  }

  async function handleResend() {
    if (secondsLeft > 0 || status === 'sending' || !email) return
    setStatus('sending')
    try {
      const res = await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      if (!res.ok) throw new Error()
      localStorage.setItem(COOLDOWN_KEY, String(Date.now()))
      setSecondsLeft(COOLDOWN_SEC)
      setStatus('sent')
      setTimeout(() => setStatus('idle'), 5000)
    } catch {
      setStatus('error')
      setTimeout(() => setStatus('idle'), 4000)
    }
  }

  if (dismissed) return null

  return (
    <div className="w-full bg-warn/10 border-b border-warn/20 px-4 py-2.5">
      <div className="max-w-4xl mx-auto flex items-center justify-between gap-3 flex-wrap">
        <p className="text-sm text-warn">
          ✉️ 您的 Email 尚未驗證，部分功能可能受限。
          {' '}
          <Link href={`/register/verify?email=${encodeURIComponent(email)}`} className="underline hover:text-warn/80 transition">
            查看說明
          </Link>
        </p>
        <div className="flex items-center gap-3 flex-shrink-0">
          {status === 'sent' ? (
            <span className="text-xs text-good">✓ 已重新寄出</span>
          ) : status === 'error' ? (
            <span className="text-xs text-run">寄送失敗</span>
          ) : (
            <button
              onClick={handleResend}
              disabled={secondsLeft > 0 || status === 'sending'}
              className="text-xs text-warn underline disabled:no-underline disabled:text-ink-4 disabled:cursor-not-allowed transition"
            >
              {status === 'sending'
                ? '寄送中…'
                : secondsLeft > 0
                ? `重寄（${secondsLeft}s）`
                : '重寄驗證信'}
            </button>
          )}
          <button
            onClick={dismiss}
            aria-label="關閉"
            className="text-ink-4 hover:text-ink transition"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}
