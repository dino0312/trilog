/**
 * 鐵人三項分項 icon（游泳 / 自行車 / 跑步）
 * 自製 SVG，線條風格，顏色跟隨 CSS currentColor。
 * 預設套用設計系統顏色：text-swim / text-bike / text-run。
 */

type Props = {
  discipline: 'swim' | 'bike' | 'run'
  className?: string   // 可覆寫尺寸或顏色，例如 "w-6 h-6 text-white"
}

export function DisciplineIcon({ discipline, className }: Props) {
  const base = 'flex-shrink-0'

  if (discipline === 'swim') {
    return (
      <svg
        viewBox="0 0 24 24" fill="none"
        stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
        className={`w-5 h-5 text-swim ${base} ${className ?? ''}`}
        aria-label="游泳"
      >
        {/* 頭 */}
        <circle cx="15" cy="4" r="1.5" fill="currentColor" stroke="none" />
        {/* 手臂划水 */}
        <path d="M5 11 9 8l4 3 4-2" />
        {/* 水波兩道 */}
        <path d="M3 16c1.5 0 2.5-1 4-1s2.5 1 4 1 2.5-1 4-1 2.5 1 4 1" />
        <path d="M3 19.5c1.5 0 2.5-1 4-1s2.5 1 4 1 2.5-1 4-1 2.5 1 4 1" />
      </svg>
    )
  }

  if (discipline === 'bike') {
    return (
      <svg
        viewBox="0 0 24 24" fill="none"
        stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
        className={`w-5 h-5 text-bike ${base} ${className ?? ''}`}
        aria-label="自行車"
      >
        {/* 兩個輪子 */}
        <circle cx="6" cy="15" r="4" />
        <circle cx="18" cy="15" r="4" />
        {/* 車架 */}
        <path d="M6 15 10 6h4l2 3" />
        <path d="m10 6 2 4 4-1" />
        {/* 騎士頭 */}
        <circle cx="14.5" cy="4.5" r="1.5" fill="currentColor" stroke="none" />
      </svg>
    )
  }

  // run
  return (
    <svg
      viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
      className={`w-5 h-5 text-run ${base} ${className ?? ''}`}
      aria-label="跑步"
    >
      {/* 頭 */}
      <circle cx="14" cy="3" r="1.5" fill="currentColor" stroke="none" />
      {/* 身體與四肢 */}
      <path d="M9 21 11 12 8 9" />
      <path d="m11 12 2-3 3 2 3-1" />
      <path d="M9 8.5 11 7l3 2-1 3" />
      <path d="m13 21 1-5-3-2" />
    </svg>
  )
}
