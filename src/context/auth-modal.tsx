'use client'

import { createContext, useContext, useState, type ReactNode } from 'react'

export type AuthModalIntent = 'login' | 'new_result' | 'claim' | 'follow' | 'race_wishlist' | 'race_attended' | null

interface AuthModalState {
  isOpen:        boolean
  intent:        AuthModalIntent
  intentPayload: { resultId?: string; athleteId?: string }
}

interface AuthModalContextValue extends AuthModalState {
  open:  (intent?: AuthModalIntent, payload?: { resultId?: string; athleteId?: string }) => void
  close: () => void
}

const AuthModalContext = createContext<AuthModalContextValue | null>(null)

export function AuthModalProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthModalState>({
    isOpen:        false,
    intent:        null,
    intentPayload: {},
  })

  function open(intent: AuthModalIntent = 'login', payload: { resultId?: string; athleteId?: string } = {}) {
    setState({ isOpen: true, intent, intentPayload: payload })
  }

  function close() {
    setState({ isOpen: false, intent: null, intentPayload: {} })
  }

  return (
    <AuthModalContext.Provider value={{ ...state, open, close }}>
      {children}
    </AuthModalContext.Provider>
  )
}

export function useAuthModal() {
  const ctx = useContext(AuthModalContext)
  if (!ctx) throw new Error('useAuthModal must be used within AuthModalProvider')
  return ctx
}
