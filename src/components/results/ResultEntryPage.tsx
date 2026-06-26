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
  { key: 'other', label: '他人成績' },
  { key: 'relay', label: '接力成績' },
]

export function ResultEntryPage({ profileComplete, profile, defaultTab = 'solo' }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>(defaultTab)
  const [contributorConsented, setContributorConsented] = useState(false)

  function handleTabChange(tab: Tab) {
    setActiveTab(tab)
    if (tab !== 'other') setContributorConsented(false)
  }

  return (
    <main className="flex-1 p-6 max-w-2xl mx-auto w-full">
      {/* Tabs */}
      <div className="flex mb-6" role="tablist" style={{ borderBottom: '1px solid var(--border)' }}>
        {TABS.map(tab => {
          const isActive = activeTab === tab.key
          return (
            <button
              key={tab.key}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => handleTabChange(tab.key)}
              style={{
                padding: '8px 16px',
                fontSize: '14px',
                fontWeight: 500,
                color: isActive ? 'var(--ink)' : 'var(--ink-3)',
                borderBottom: isActive ? '2px solid var(--run)' : '2px solid transparent',
                background: 'transparent',
                cursor: 'pointer',
                transition: 'color 0.15s, border-color 0.15s',
                marginBottom: '-1px',
              }}
            >
              {tab.label}
            </button>
          )
        })}
      </div>

      <div className="rounded-xl border border-border bg-bg-card p-6">
        {/* 三個表單同時 mount，切 Tab 不重置 state */}
        <div className={activeTab === 'solo' ? '' : 'hidden'}>
          <NewResultForm profileComplete={profileComplete} profile={profile} forOther={false} />
        </div>
        <div className={activeTab === 'other' ? '' : 'hidden'}>
          <NewResultForm
            profileComplete={profileComplete}
            profile={profile}
            forOther={true}
            contributorConsented={contributorConsented}
            onContributorConsentChange={setContributorConsented}
          />
        </div>
        <div className={activeTab === 'relay' ? '' : 'hidden'}>
          <NewRelayResultForm />
        </div>
      </div>
    </main>
  )
}
