'use client'

import { useActionState, useState } from 'react'
import Link from 'next/link'
import { signUp, type AuthState } from '@/app/actions/auth'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'

const initial: AuthState = { error: null }

export function RegisterForm() {
  const [state, action, pending] = useActionState(signUp, initial)
  const [agreed, setAgreed] = useState(false)

  return (
    <form action={action} className="flex flex-col gap-4">
      <Input label="電子郵件" id="email" name="email" type="email" autoComplete="email" required />
      <Input label="密碼" id="password" name="password" type="password" autoComplete="new-password" required />
      <Input label="確認密碼" id="confirm" name="confirm" type="password" autoComplete="new-password" required />

      <div className="flex items-start gap-2">
        <input
          type="checkbox"
          id="terms-agree"
          checked={agreed}
          onChange={(e) => setAgreed(e.target.checked)}
          className="mt-0.5 shrink-0 accent-accent"
        />
        <label htmlFor="terms-agree" className="text-xs text-ink-3 leading-relaxed">
          我已閱讀並同意{' '}
          <Link href="/terms" target="_blank" className="text-accent hover:underline">服務條款</Link>
          {' '}及{' '}
          <Link href="/privacy" target="_blank" className="text-accent hover:underline">隱私權政策</Link>
        </label>
      </div>

      {state.error && (
        <p className="text-sm text-red text-center">{state.error}</p>
      )}

      <Button type="submit" loading={pending} disabled={!agreed || pending} className="mt-1" style={{ opacity: !agreed ? 0.5 : undefined, cursor: !agreed ? 'not-allowed' : undefined }}>
        建立帳號
      </Button>

      <p className="text-center text-sm text-ink-3">
        已有帳號？{' '}
        <Link href="/login" className="text-accent hover:underline">
          直接登入
        </Link>
      </p>
    </form>
  )
}
