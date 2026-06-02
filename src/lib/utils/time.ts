// 時間格式工具

/** "02:01:22" → 7282（秒） */
export function timeToSeconds(time: string): number {
  const parts = time.split(':').map(Number)
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2]
  if (parts.length === 2) return parts[0] * 60 + parts[1]
  return 0
}

/** 7282 → "2:01:22" */
export function secondsToTime(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

/** swim + bike + run 加總驗證 */
export function validateSplits(
  total: string,
  swim: string,
  t1: string,
  bike: string,
  t2: string,
  run: string
): boolean {
  const sum = [swim, t1, bike, t2, run].reduce(
    (acc, t) => acc + timeToSeconds(t),
    0
  )
  return sum === timeToSeconds(total)
}

/** 時間差 "+0:02:18" / "–1:12" */
export function timeDelta(a: string, b: string): string {
  const diff = timeToSeconds(a) - timeToSeconds(b)
  const abs = Math.abs(diff)
  const sign = diff >= 0 ? '+' : '–'
  const m = Math.floor(abs / 60)
  const s = abs % 60
  return `${sign}${m}:${String(s).padStart(2, '0')}`
}
