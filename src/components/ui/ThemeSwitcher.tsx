'use client'

import { useEffect, useState } from 'react'
import { IconDeviceLaptop, IconSun, IconMoon } from '@tabler/icons-react'

type Theme = 'system' | 'light' | 'dark'

export function ThemeSwitcher() {
  const [theme, setTheme] = useState<Theme>('system')

  useEffect(() => {
    const stored = localStorage.getItem('tl_theme') as Theme | null
    if (stored === 'light' || stored === 'dark') setTheme(stored)
  }, [])

  function apply(t: Theme) {
    setTheme(t)
    if (t === 'system') {
      localStorage.removeItem('tl_theme')
      document.documentElement.removeAttribute('data-theme')
    } else {
      localStorage.setItem('tl_theme', t)
      document.documentElement.setAttribute('data-theme', t)
    }
  }

  const options: { value: Theme; icon: React.ReactNode; label: string }[] = [
    { value: 'system', icon: <IconDeviceLaptop size={13} />, label: '系統' },
    { value: 'light',  icon: <IconSun size={13} />,          label: '淺色' },
    { value: 'dark',   icon: <IconMoon size={13} />,          label: '深色' },
  ]

  return (
    <div
      role="group"
      aria-label="主題切換"
      style={{
        display: 'inline-flex',
        border: '0.5px solid var(--border-strong)',
        borderRadius: '7px',
        overflow: 'hidden',
      }}
    >
      {options.map((opt, idx) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => apply(opt.value)}
          aria-label={opt.label}
          aria-pressed={theme === opt.value}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            padding: '5px 9px',
            fontSize: '11px',
            border: 'none',
            borderLeft: idx > 0 ? '0.5px solid var(--border-strong)' : 'none',
            cursor: 'pointer',
            background: theme === opt.value ? 'var(--bg-elev)' : 'transparent',
            color: theme === opt.value ? 'var(--ink)' : 'var(--ink-3)',
            transition: 'background 0.15s, color 0.15s',
          }}
        >
          {opt.icon}
          <span>{opt.label}</span>
        </button>
      ))}
    </div>
  )
}
