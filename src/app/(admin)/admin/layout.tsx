import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { AdminTabs } from './AdminTabs'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: isAssistant } = await supabase.rpc('is_assistant_or_above')
  if (!isAssistant) redirect('/leaderboard')

  return (
    <div className="flex flex-col flex-1">
      <AdminTabs />
      {children}
    </div>
  )
}
