import { redirect } from 'next/navigation'

// 舊路徑 /profile → 新路徑 /my/profile
export default function ProfileRedirect() {
  redirect('/my/profile')
}
