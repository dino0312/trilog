'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuthModal } from '@/context/auth-modal'
import { createClient } from '@/lib/supabase/client'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'

type Tab = 'login' | 'register'

export function AuthModal() {
  const { isOpen, intent, intentPayload, close } = useAuthModal()
  const [tab, setTab]               = useState<Tab>('login')
  const [error, setError]           = useState<string | null>(null)
  const [emailSent, setEmailSent]   = useState(false)
  const [loading, setLoading]       = useState(false)
  const overlayRef            = useRef<HTMLDivElement>(null)
  const router                = useRouter()

  /* 重置狀態，每次開啟 */
  useEffect(() => {
    if (isOpen) {
      setTab('login')
      setError(null)
      setEmailSent(false)
      setLoading(false)
    }
  }, [isOpen])

  /* Escape 鍵關閉 */
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') close()
    }
    if (isOpen) window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [isOpen, close])

  /* 鎖定 body scroll */
  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [isOpen])

  if (!isOpen) return null

  /* ── 登入成功後跳轉 ── */
  async function handleSuccess() {
    close()
    router.refresh()  // 刷新 Server Components（Nav 顯示已登入狀態）
    if (intent === 'new_result') {
      router.push('/records/new')
    } else if (intent === 'claim' && intentPayload.resultId) {
      router.push(`/results/${intentPayload.resultId}/claim`)
    } else if (intent === 'follow' && intentPayload.athleteId) {
      // 登入後自動執行追蹤，失敗則靜默（使用者可再點一次）
      try {
        await fetch(`/api/athletes/${intentPayload.athleteId}/follow`, { method: 'POST' })
        router.refresh()
      } catch {
        // 靜默失敗
      }
    } else if (
      (intent === 'race_wishlist' || intent === 'race_attended') &&
      intentPayload.raceId && intentPayload.year
    ) {
      // 登入後自動完成賽事互動標記，失敗則靜默（使用者可再點一次）
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        await supabase.from('race_interest').insert({
          athlete_id:    user.id,
          race_id:       intentPayload.raceId,
          year:          intentPayload.year,
          interest_type: intent === 'race_wishlist' ? 'wishlist' : 'attended',
        })  // 已存在時觸發 unique constraint，靜默忽略
        router.refresh()
      }
    }
  }

  /* ── Email 登入 ── */
  async function handleLogin(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    const form     = new FormData(e.currentTarget)
    const email    = form.get('email') as string
    const password = form.get('password') as string
    const supabase = createClient()
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) { setError('電子郵件或密碼錯誤'); setLoading(false); return }
    // 首次登入（未填姓名）且無特定 intent → 導到個人資料頁
    if (data.user && (!intent || intent === 'login')) {
      const { data: athlete } = await supabase
        .from('athletes').select('name').eq('id', data.user.id).single()
      if (!athlete?.name) {
        close()
        router.push('/my/profile')
        return
      }
    }
    handleSuccess()
  }

  /* ── Email 註冊 ── */
  async function handleRegister(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    const form     = new FormData(e.currentTarget)
    const email    = form.get('email') as string
    const password = form.get('password') as string
    const confirm  = form.get('confirm') as string
    if (password !== confirm) { setError('兩次密碼不一致'); setLoading(false); return }
    if (password.length < 8)  { setError('密碼至少 8 個字元'); setLoading(false); return }
    const supabase = createClient()
    const { error } = await supabase.auth.signUp({ email, password })
    if (error) {
      const msg = error.message
      if (msg.toLowerCase().includes('already registered') || msg.toLowerCase().includes('already exists')) {
        setError('此 Email 已被註冊，請直接登入')
      } else {
        setError(msg || JSON.stringify(error))
      }
      return
    }
    // 需要 email 驗證（session 為 null）
    setEmailSent(true)
    setLoading(false)
  }

  return (
    /* 遮罩 */
    <div
      ref={overlayRef}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm"
      onClick={e => { if (e.target === overlayRef.current) close() }}
    >
      {/* Modal 本體 */}
      <div
        className="relative w-full max-w-sm rounded-2xl border border-border bg-bg-card p-6 shadow-2xl"
        role="dialog" aria-modal="true" aria-label="登入 Tri·log"
      >
        {/* 關閉按鈕 */}
        <button
          onClick={close}
          className="absolute right-4 top-4 flex h-7 w-7 items-center justify-center rounded-lg text-ink-3 transition hover:bg-bg-elev hover:text-ink"
          aria-label="關閉"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>

        {/* Tab 切換 */}
        <div className="mb-5 flex gap-4 border-b border-border">
          {(['login', 'register'] as Tab[]).map(t => (
            <button
              key={t}
              onClick={() => { setTab(t); setError(null) }}
              className={`pb-2.5 text-sm font-medium transition border-b-2 -mb-px ${
                tab === t
                  ? 'border-[#FF6B3D] text-ink'
                  : 'border-transparent text-ink-3 hover:text-ink'
              }`}
            >
              {t === 'login' ? '登入' : '註冊'}
            </button>
          ))}
        </div>

        {/* 登入表單 */}
        {tab === 'login' && (
          <form onSubmit={handleLogin} className="flex flex-col gap-4">
            <Input label="電子郵件" id="modal-email" name="email" type="email" autoComplete="email" required />
            <Input label="密碼" id="modal-password" name="password" type="password" autoComplete="current-password" required />
            {error && <p className="text-sm text-red text-center">{error}</p>}
            <Button type="submit" loading={loading} className="mt-1">登入</Button>
          </form>
        )}

        {/* 註冊表單 */}
        {tab === 'register' && !emailSent && (
          <form onSubmit={handleRegister} className="flex flex-col gap-4">
            <Input label="電子郵件" id="modal-reg-email" name="email" type="email" autoComplete="email" required />
            <Input label="密碼" id="modal-reg-password" name="password" type="password" autoComplete="new-password" required />
            <Input label="確認密碼" id="modal-reg-confirm" name="confirm" type="password" autoComplete="new-password" required />
            {error && <p className="text-sm text-red text-center">{error}</p>}
            <Button type="submit" loading={loading} className="mt-1">建立帳號</Button>
          </form>
        )}

        {/* 驗證信已寄出 */}
        {tab === 'register' && emailSent && (
          <div className="flex flex-col items-center gap-4 py-4 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent/10">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-accent">
                <rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
              </svg>
            </div>
            <div>
              <p className="font-medium text-ink">驗證信已寄出</p>
              <p className="mt-1 text-sm text-ink-3">請前往信箱點擊驗證連結，<br/>驗證後再回來登入即可。</p>
            </div>
            <button
              onClick={() => { setEmailSent(false); setTab('login') }}
              className="mt-2 text-sm text-accent hover:underline"
            >
              前往登入
            </button>
          </div>
        )}

        {/* 完整頁面連結 */}
        <p className="mt-4 text-center text-xs text-ink-4">
          <Link
            href={tab === 'login' ? '/login' : '/register'}
            onClick={close}
            className="hover:text-ink-3 transition"
          >
            使用完整頁面{tab === 'login' ? '登入' : '註冊'}
          </Link>
        </p>
      </div>
    </div>
  )
}
