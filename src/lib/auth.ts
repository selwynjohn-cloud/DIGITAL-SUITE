export type AuthRole = 'staff' | 'management'

export type AuthSession = {
  email: string
  role: AuthRole
  appId: string
  token: string
}

const STORAGE_KEY = 'agil_auth_session'

export function loadSession(): AuthSession | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    return JSON.parse(raw) as AuthSession
  } catch {
    return null
  }
}

export function saveSession(session: AuthSession) {
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(session))
}

export function clearSession() {
  sessionStorage.removeItem(STORAGE_KEY)
}

export function isAgileEmail(email: string) {
  const domain = (import.meta.env.VITE_ALLOWED_EMAIL_DOMAIN ?? 'agilegroup.co.in').toLowerCase()
  return new RegExp(`^[a-z0-9._%+-]+@${domain.replace('.', '\\.')}$`, 'i').test(email.trim())
}

export async function requestPin(
  email: string,
  role: AuthRole,
  appId: string,
  appTitle: string,
) {
  const res = await fetch('/api/auth/send-pin', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, role, appId, appTitle }),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error ?? 'Could not send PIN')
  return data as { ok: boolean; message: string; devPin?: string }
}

export async function verifyPin(
  email: string,
  pin: string,
  opts?: { role?: AuthRole; appId?: string },
) {
  const res = await fetch('/api/auth/verify-pin', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, pin, role: opts?.role, appId: opts?.appId }),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error ?? 'Invalid PIN')
  return data as {
    ok: boolean
    token: string
    session: { email: string; role: AuthRole; appId: string }
  }
}
