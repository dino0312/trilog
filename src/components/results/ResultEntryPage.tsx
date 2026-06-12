'use client'

import { useState } from 'react'
import { NewResultForm } from '@/components/results/NewResultForm'
import { NewRelayResultForm } from '@/components/relay/NewRelayResultForm'

type Profile = {
  name: string | null
  gender: string | null
  birth_year: number | null
  nationality: string | null
}

type Tab = 'solo' | 'other' | 'relay'

type Props = {
  profileComplete: boolean
  profile: Profile
  defaultTab?: Tab
}

const TABS: { key: Tab; label: string }[] = [
  { key: 'solo',  label: '個人成績' },
  { key: 'other', label: '幫他人新增' },
  { key: 'relay', label: '接力成績' },
]

export function ResultEntryPage({ profileComplete, profile, defaultTab = 'solo' }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>(defaultTab)

  return (
    <main className="flex-1 p-6 max-w-2xl mx-auto w-full">
      {/* Tabs */}
      <div className="flex gap-1 mb-6 rounded-xl bg-bg-elev p-1 w-fit">
        {TABS.map(tab => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key)}
            className={[
              'px-4 py-2 rounded-lg text-sm font-medium transition',
              activeTab === tab.key
                ? 'bg-bg-card text-ink shadow-sm'
                : 'text-ink-3 hover:text-ink',
            ].join(' ')}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="rounded-xl border border-border bg-bg-card p-6">
        {/* 三個表單同時 mount，切 Tab 不重置 state */}
        <div className={activeTab === 'solo' ? '' : 'hidden'}>
          <NewResultForm profileComplete={profileComplete} profile={profile} forOther={false} />
        </div>
        <div className={activeTab === 'other' ? '' : 'hidden'}>
          <div className="rounded-xl border border-accent/20 bg-accent/5 px-4 py-3 mb-5">
            <p className="text-sm font-semibold text-ink">成績歸屬人</p>
            <p className="text-xs text-ink-3 mt-0.5">成績將以「未認領」狀態建立，本人可稍後自行認領</p>
          </div>
          <NewResultForm profileComplete={profileComplete} profile={profile} forOther={true} />
        </div>
        <div className={activeTab === 'relay' ? '' : 'hidden'}>
          <NewRelayResultForm />
        </div>
      </div>
    </main>
  )
}
