'use client'

import { usePathname } from 'next/navigation'

const PAGE_CONTEXT: Record<string, { title: string; sub: string }> = {
  '/leaderboard': { title: '最速榜',     sub: '台灣選手 · 個人最佳 · 跨賽事' },
  '/rankings':    { title: '排行榜',     sub: '依距離篩選 · 完整成績記錄' },
  '/relay':       { title: '接力榜',     sub: '隊伍接力成績 · 跨賽事排列' },
  '/unclaimed':   { title: '未認領成績', sub: '搜尋你的名字，認領屬於你的成績' },
  '/races':       { title: '賽事資料庫', sub: '台灣鐵人三項賽事 · 路線 · 天氣 · 歷史成績' },
  '/my/results':  { title: '我的紀錄',   sub: '個人成績歷史' },
  '/my/profile':  { title: '個人資料',   sub: '帳號設定與公開資訊' },
  '/admin':       { title: '管理後台',   sub: '賽事資料 · 公證審核' },
}

function matchContext(pathname: string) {
  // 精確優先，再前綴比對
  if (PAGE_CONTEXT[pathname]) return PAGE_CONTEXT[pathname]
  for (const key of Object.keys(PAGE_CONTEXT)) {
    if (pathname.startsWith(key + '/')) return PAGE_CONTEXT[key]
  }
  return null
}

export function PageContextStrip() {
  const pathname = usePathname()
  const ctx = matchContext(pathname)
  if (!ctx) return null

  return (
    <div
      className="flex items-center px-5 py-2.5"
      style={{ background: '#0D1526', borderTop: '1px solid rgba(255,255,255,0.06)' }}
    >
      <span
        style={{
          fontFamily:    'Arial, sans-serif',
          fontSize:      22,
          fontWeight:    800,
          color:         '#F0EDE6',
          letterSpacing: '-0.03em',
          lineHeight:    1,
        }}
      >
        {ctx.title}
      </span>
      <span
        className="ml-auto"
        style={{
          fontFamily: "'DM Mono', monospace",
          fontSize:   11,
          color:      '#4A5568',
        }}
      >
        {ctx.sub}
      </span>
    </div>
  )
}
