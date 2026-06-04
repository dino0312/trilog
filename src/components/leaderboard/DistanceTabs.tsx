'use client'

import { useRouter, useSearchParams } from 'next/navigation'

const TABS = [
  { value: 'full',    label: '226 全距離', enabled: true  },
  { value: '70.3',    label: '113 半程',   enabled: false },
  { value: 'olympic', label: '51.5 奧林匹克', enabled: false },
  { value: 'sprint',  label: '25.75 衝刺', enabled: false },
]

export function DistanceTabs({ current }: { current: string }) {
  const router = useRouter()
  const searchParams = useSearchParams()

  function switchDistance(value: string) {
    const params = new URLSearchParams(searchParams.toString())
    params.set('distance', value)
    router.push(`/leaderboard?${params.toString()}`)
  }

  return (
    <div style={{
      display: 'flex',
      borderTop: '1px solid rgba(255,255,255,0.04)',
      margin: '0 -2rem',
    }}>
      {TABS.map(tab => {
        const active = tab.value === current
        return (
          <button
            key={tab.value}
            type="button"
            disabled={!tab.enabled}
            onClick={() => tab.enabled && switchDistance(tab.value)}
            style={{
              padding: '12px 22px',
              fontSize: 14,
              fontWeight: 500,
              color: active ? '#F0EDE6' : '#4A5568',
              borderBottom: active ? '2px solid #FF6B3D' : '2px solid transparent',
              opacity: tab.enabled ? 1 : 0.35,
              cursor: tab.enabled ? 'pointer' : 'not-allowed',
              whiteSpace: 'nowrap',
              fontFamily: "'Noto Sans TC', sans-serif",
              background: 'transparent',
              border: 'none',
            } as React.CSSProperties}
          >
            {tab.label}
          </button>
        )
      })}
    </div>
  )
}
