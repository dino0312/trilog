'use client'

import { useActionState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { signIn, type AuthState } from '@/app/actions/auth'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'

const initial: AuthState = { error: null }

export function LoginForm() {
  const [state, action, pending] = useActionState(signIn, initial)
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get('redirectTo') ?? ''

  return (
    <form action={action} className="flex flex-col gap-4">
      <input type="hidden" name="redirectTo" value={redirectTo} />
      <Input label="電子郵件" id="email" name="email" type="email" autoComplete="email" required />
      <Input label="密碼" id="password" name="password" type="password" autoComplete="current-password" required />

      {state.error && (
        <p className="text-sm text-red text-center">{state.error}</p>
      )}

      <Button type="submit" loading={pending} className="mt-1">
        登入
      </Button>

      <p className="text-center text-sm text-ink-3">
        還沒有帳號？{' '}
        <Link href="/register" className="text-accent hover:underline">
          立即註冊
        </Link>
      </p>
    </form>
  )
}
