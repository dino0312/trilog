import { LeaderboardPreview } from '@/components/auth/LeaderboardPreview'

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen flex bg-bg">

      {/* ── 左側：最速榜主視覺（md 以上顯示）── */}
      <div className="hidden md:flex md:w-[55%] lg:w-[60%] flex-col justify-center px-10 lg:px-16"
        style={{ background: '#060D18' }}>
        {/* 頁面標題 */}
        <div className="mb-6">
          <p style={{
            fontFamily: "'DM Mono', monospace",
            fontSize: 11, color: '#22C9C9',
            letterSpacing: '0.15em',
            display: 'flex', alignItems: 'center', gap: 8,
            marginBottom: 10,
          }}>
            <span style={{ display: 'inline-block', width: 20, height: 1, background: '#22C9C9' }}/>
            台灣選手
          </p>
          <h1 style={{
            fontFamily: "'Syne', sans-serif", fontWeight: 800,
            fontSize: 'clamp(1.8rem, 3vw, 2.6rem)',
            letterSpacing: '-0.03em', lineHeight: 1,
            color: '#F0EDE6', marginBottom: 6,
          }}>
            最<span style={{ color: '#FF6B3D' }}>速</span>榜
          </h1>
          <p style={{ fontSize: 13, color: '#4A5568' }}>
            各選手個人最佳完賽時間，跨賽事排列
          </p>
        </div>

        {/* 最速榜元件 */}
        <LeaderboardPreview />
      </div>

      {/* ── 右側：登入 / 註冊表單 ── */}
      <div className="flex flex-1 items-center justify-center px-4 py-12">
        {children}
      </div>

    </div>
  )
}
