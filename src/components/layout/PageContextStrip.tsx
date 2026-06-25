'use client'

import { usePathname } from 'next/navigation'

const PAGE_CONTEXT: Record<string, { title: string; sub: string }> = {
  '/leaderboard': { title: '最速榜',     sub: '台灣選手 · 個人最佳 · 跨賽事' },
  '/rankings':    { title: '排行榜',     sub: '依距離篩選 · 完整成績記錄' },
  '/relay':       { title: '接力榜',     sub: '隊伍接力成績 · 跨賽事排列' },
  '/unclaimed':   { title: '未認領成績', sub: '搜尋你的名字，認領屬於你的成績' },
  '/races':       { title: '賽事資料庫', sub: '台灣鐵人三項賽事 · 路線 · 天氣 · 歷史成績' },
  '/my/results':   { title: '我的成績',  sub: '個人成績歷史' },
  '/records':      { title: '我的成績',  sub: '個人成績歷史' },
  '/records/new':  { title: '新增成績',  sub: '個人成績 · 接力成績 · 幫他人新增' },
  '/my/contributions': { title: '我的貢獻', sub: '你幫別人新增的成績 · 待認領追蹤' },
  '/my/following': { title: '關注名單',  sub: '你關注的選手 · 查看最佳成績' },
  '/my/races':     { title: '我的賽事',  sub: '追蹤 · 記錄 · 回顧' },
  '/my/profile':   { title: '個人資料',  sub: '帳號設定與公開資訊' },
  '/about':       { title: '關於 Tri·log', sub: '平台介紹 · 如何使用 · 常見問題' },
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
      style={{ background: 'var(--bg-alt)', borderTop: '1px solid var(--border)' }}
    >
      <span
        style={{
          fontFamily:    'Arial, sans-serif',
          fontSize:      22,
          fontWeight:    800,
          color:         'var(--ink)',
          letterSpacing: '-0.03em',
          lineHeight:    1,
        }}
      >
        {ctx.title}
      </span>
      <span
        className="ml-auto text-right overflow-hidden"
        style={{
          fontFamily:  "'DM Mono', monospace",
          fontSize:    11,
          color:       'var(--ink-3)',
          whiteSpace:  'nowrap',
          textOverflow:'ellipsis',
          minWidth:    0,
        }}
      >
        {ctx.sub}
      </span>
    </div>
  )
}
