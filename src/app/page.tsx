import { redirect } from 'next/navigation'

// 根路徑導向排行榜（公開頁）
export default function RootPage() {
  redirect('/leaderboard')
}
