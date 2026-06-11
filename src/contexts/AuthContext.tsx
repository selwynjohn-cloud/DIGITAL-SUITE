import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { SuiteApp } from '../data/apps'
import {
  clearSession,
  loadSession,
  saveSession,
  type AuthRole,
  type AuthSession,
} from '../lib/auth'

type PendingAccess = {
  app: SuiteApp
  role: AuthRole
  targetUrl: string
}

type AuthContextValue = {
  session: AuthSession | null
  pending: PendingAccess | null
  activePortal: PendingAccess | null
  requestAccess: (app: SuiteApp, role: AuthRole, targetUrl: string) => void
  completeLogin: (session: AuthSession) => void
  openPortal: (access: PendingAccess) => void
  closeLogin: () => void
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<AuthSession | null>(() => loadSession())
  const [pending, setPending] = useState<PendingAccess | null>(null)
  const [activePortal, setActivePortal] = useState<PendingAccess | null>(null)

  const requestAccess = useCallback(
    (app: SuiteApp, _role: AuthRole, targetUrl: string) => {
      if (app.external || app.requiresAuth === false) {
        window.open(targetUrl, '_blank', 'noopener,noreferrer')
        return
      }

      window.location.href = targetUrl
    },
    [],
  )

  const completeLogin = useCallback((next: AuthSession) => {
    saveSession(next)
    setSession(next)
  }, [])

  const openPortal = useCallback((access: PendingAccess) => {
    setPending(null)
    if (access.app.hasBuiltInPortal) {
      window.location.href = access.targetUrl
      return
    }
    setActivePortal(access)
  }, [])

  const closeLogin = useCallback(() => setPending(null), [])

  const logout = useCallback(() => {
    clearSession()
    setSession(null)
    setActivePortal(null)
    setPending(null)
  }, [])

  const value = useMemo(
    () => ({
      session,
      pending,
      activePortal,
      requestAccess,
      completeLogin,
      openPortal,
      closeLogin,
      logout,
    }),
    [
      session,
      pending,
      activePortal,
      requestAccess,
      completeLogin,
      openPortal,
      closeLogin,
      logout,
    ],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
