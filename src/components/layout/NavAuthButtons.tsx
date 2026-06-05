'use client'

import { useAuthModal } from '@/context/auth-modal'

export function NavAuthButtons() {
  const { open } = useAuthModal()

  return (
    <>
      {/* 登入：Ghost 邊框 */}
      <button
        onClick={() => open('login')}
        className="rounded-lg border border-border-strong px-3 py-1.5 text-sm text-ink-3 transition hover:border-ink-3 hover:text-ink"
      >
        登入
      </button>

      {/* 新增成績：品牌橘色，未登入時觸發 Modal */}
      <button
        onClick={() => open('new_result')}
        className="ml-2 flex items-center gap-1.5 rounded-lg border border-[#FF6B3D] bg-[rgba(255,107,61,0.08)] px-3 py-1.5 text-sm font-medium text-[#FF6B3D] transition hover:bg-[#FF6B3D] hover:text-white"
      >
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <line x1="12" y1="5" x2="12" y2="19"/>
          <line x1="5"  y1="12" x2="19" y2="12"/>
        </svg>
        新增成績
      </button>
    </>
  )
}
