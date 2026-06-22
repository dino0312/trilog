'use client'

import { useId } from 'react'

interface TrilogLogoProps {
  size?:     'sm' | 'md' | 'lg'
  /** nav = 3s（沉穩）｜login = 1.8s（活力）｜static = 無動畫 */
  context?:  'nav' | 'login' | 'static'
  markOnly?: boolean
  className?: string
}

const sizes = {
  sm: { w: 130, h: 34 },
  md: { w: 195, h: 52 },
  lg: { w: 260, h: 68 },
}

const waveDuration: Record<string, string> = {
  nav:    '3s',
  login:  '1.8s',
  static: '0s',
}

export function TrilogLogo({
  size     = 'md',
  context  = 'nav',
  markOnly = false,
  className = '',
}: TrilogLogoProps) {
  const uid      = useId().replace(/:/g, '')
  const clipId   = `twc-${uid}`
  const { w, h } = sizes[size]
  const animated = context !== 'static'

  /* ── Mark Only（favicon / icon 場合）── */
  if (markOnly) {
    return (
      <svg
        width={48} height={48} viewBox="0 0 68 68"
        xmlns="http://www.w3.org/2000/svg"
        role="img" aria-label="Tri·log"
        className={className}
      >
        <path d="M6 56 C10 44 16 30 21 20 C24 14 27 11 31 9"
          fill="none" stroke="#22C9C9" strokeWidth={4} strokeLinecap="round"/>
        <path d="M31 9 L60 56"
          fill="none" stroke="#A8E063" strokeWidth={4} strokeLinecap="round"
          strokeDasharray="6 3.5"/>
        <path d="M60 56 L53 49 L46 56 L39 49 L32 56 L25 49 L18 56 L11 49 L6 56"
          fill="none" stroke="#FF6B3D" strokeWidth={4} strokeLinecap="round"
          strokeLinejoin="round"/>
      </svg>
    )
  }

  /* ── Full Logo（符號 + Wordmark）── */
  return (
    <svg
      width={w} height={h} viewBox="0 0 260 68"
      xmlns="http://www.w3.org/2000/svg"
      role="img" aria-label="Tri·log"
      className={className}
      style={{ color: 'var(--ink)' }}
    >
      <defs>
        {/* clipPath 限制底邊波浪可見範圍，每個實例用獨立 id */}
        <clipPath id={clipId}>
          <polygon points="4,60 62,60 62,41 4,41"/>
        </clipPath>
      </defs>

      {/* 游泳：靜止波浪曲線（青藍）*/}
      <path
        d="M6 56 C10 44 16 30 21 20 C24 14 27 11 31 9"
        fill="none" stroke="#22C9C9"
        strokeWidth={3.5} strokeLinecap="round"
      />

      {/* 自行車：靜止虛線（草地綠）*/}
      <path
        d="M31 9 L60 56"
        fill="none" stroke="#A8E063"
        strokeWidth={3.5} strokeLinecap="round"
        strokeDasharray="5 3"
      />

      {/* 跑步：動態波浪（珊瑚橘），clipPath 限制三角形內 */}
      <g clipPath={`url(#${clipId})`}>
        <g
          className={animated ? 'trilog-wave' : undefined}
          style={animated
            ? { '--trilog-wave-duration': waveDuration[context] } as React.CSSProperties
            : undefined}
        >
          <path
            d="M-12 56 C-9 56 -7 47 -3 47 C1 47 3 56 6 56
               C9 56 11 47 15 47 C19 47 21 56 24 56
               C27 56 29 47 33 47 C37 47 39 56 42 56
               C45 56 47 47 51 47 C55 47 57 56 60 56
               C63 56 65 47 69 47 C73 47 75 56 78 56"
            fill="none" stroke="#FF6B3D"
            strokeWidth={3.5} strokeLinecap="round" strokeLinejoin="round"
          />
        </g>
      </g>

      {/* Wordmark：Tri（800）·（橘）log（300）*/}
      <text x={78}  y={43}
        fontFamily="Arial, 'Helvetica Neue', sans-serif"
        fontSize={32} fontWeight={800}
        fill="currentColor" letterSpacing={-2}>Tri</text>
      <text x={126} y={43}
        fontFamily="Arial, 'Helvetica Neue', sans-serif"
        fontSize={32} fontWeight={800}
        fill="#FF6B3D">·</text>
      <text x={136} y={43}
        fontFamily="Arial, 'Helvetica Neue', sans-serif"
        fontSize={32} fontWeight={300}
        fill="currentColor" letterSpacing={-2}>log</text>
    </svg>
  )
}
