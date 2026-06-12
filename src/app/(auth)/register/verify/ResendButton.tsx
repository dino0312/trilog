'use client'

import { useEffect, useState } from 'react'

const COOLDOWN_KEY = 'trilog_resend_ts'
const COOLDOWN_SEC = 60

export function ResendButton({ email }: { email: string }) {
  const [secondsLeft, setSecondsLeft] = useState(0)
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')

  // 讀 localStorage，計算剩餘 cooldown
  useEffect(() => {
    const last = Number(localStorage.getItem(COOLDOWN_KEY) ?? 0)
    const elapsed = Math.floor((Date.now() - last) / 1000)
    const remaining = Math.max(0, COOLDOWN_SEC - elapsed)
    setSecondsLeft(remaining)
  }, [])

  // 倒數計時
  useEffect(() => {
    if (secondsLeft <= 0) return
    const t = setInterval(() => setSecondsLeft(s => Math.max(0, s - 1)), 1000)
    return () => clearInterval(t)
  }, [secondsLeft])

  async function handleResend() {
    if (secondsLeft > 0 || status === 'sending') return
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
      setTimeout(() => setStatus('idle'), 4000)
    } catch {
      setStatus('error')
      setTimeout(() => setStatus('idle'), 4000)
    }
  }

  const disabled = secondsLeft > 0 || status === 'sending'

  return (
    <div className="flex flex-col items-center gap-1">
      <button
        onClick={handleResend}
        disabled={disabled}
        className="text-sm text-accent hover:underline disabled:text-ink-4 disabled:no-underline disabled:cursor-not-allowed transition"
      >
        {status === 'sending' ? '寄送中…' : status === 'sent' ? '✓ 已重新寄出' : '重新寄送驗證信'}
      </button>
      {secondsLeft > 0 && (
        <span className="text-xs text-ink-4">{secondsLeft} 秒後可再次寄送</span>
      )}
      {status === 'error' && (
        <span className="text-xs text-run">寄送失敗，請稍後再試</span>
      )}
    </div>
  )
}
