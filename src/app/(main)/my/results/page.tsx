import { redirect } from 'next/navigation'

// /my/results → /records（待完整遷移後可直接實作內容）
export default function MyResultsPage() {
  redirect('/records')
}
