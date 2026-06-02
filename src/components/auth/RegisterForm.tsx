'use client'

import { useActionState } from 'react'
import Link from 'next/link'
import { signUp, type AuthState } from '@/app/actions/auth'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'

const initial: AuthState = { error: null }

export function RegisterForm() {
  const [state, action, pending] = useActionState(signUp, initial)

  return (
    <form action={action} className="flex flex-col gap-4">
      <Input label="電子郵件" id="email" name="email" type="email" autoComplete="email" required />
      <Input label="密碼" id="password" name="password" type="password" autoComplete="new-password" required />
      <Input label="確認密碼" id="confirm" name="confirm" type="password" autoComplete="new-password" required />

      {state.error && (
        <p className="text-sm text-red text-center">{state.error}</p>
      )}

      <Button type="submit" loading={pending} className="mt-1">
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
