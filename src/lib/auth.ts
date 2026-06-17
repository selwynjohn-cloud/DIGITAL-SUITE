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

export function normalizeMobile(mobile: string) {
  const d = String(mobile || '').replace(/\D/g, '')
  if (d.length === 10) return d
  if (d.length === 12 && d.startsWith('91')) return d.slice(2)
  return ''
}

export function isValidMobile(mobile: string) {
  return normalizeMobile(mobile).length === 10
}

export async function requestPin(
  channel: 'email' | 'sms',
  value: string,
  role: AuthRole,
  appId: string,
  appTitle: string,
) {
  const body =
    channel === 'email'
      ? { channel, email: value.trim(), role, appId, appTitle }
      : { channel: 'sms', mobile: value.trim(), role, appId, appTitle }

  const res = await fetch('/api/auth/send-pin', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error ?? 'Could not send OTP')
  return data as {
    ok: boolean
    channel: 'email' | 'sms'
    identifier: string
    message: string
    devPin?: string
  }
}

export async function verifyPin(identifier: string, pin: string) {
  const res = await fetch('/api/auth/verify-pin', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identifier, pin }),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error ?? 'Invalid OTP')
  return data as {
    ok: boolean
    token: string
    session: { email: string; role: AuthRole; appId: string }
  }
}

export function formatLoginLabel(identifier: string) {
  if (identifier.startsWith('m:')) return `+91 ${identifier.slice(2)}`
  return identifier
}
