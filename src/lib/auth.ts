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

export function canUseEmailLogin(email: string) {
  const em = email.trim().toLowerCase()
  if (isAgileEmail(em)) return true
  const extras = (import.meta.env.VITE_SUPER_ADMIN_EMAILS ?? 'director@agilegroup.co.in,selwyn.john@gmail.com,md@agilegroup.co.in')
    .split(',')
    .map((e: string) => e.trim().toLowerCase())
    .filter(Boolean)
  return extras.includes(em)
}

async function readApiError(res: Response) {
  const text = await res.text()
  try {
    const data = JSON.parse(text) as { error?: string }
    return data.error ?? text.slice(0, 200)
  } catch {
    return text.slice(0, 200) || 'Something went wrong. Please try again.'
  }
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
    body: JSON.stringify({ email: email.trim(), role, appId, appTitle }),
  })
  if (!res.ok) throw new Error(await readApiError(res))
  const data = (await res.json()) as {
    ok: boolean
    channel: 'email'
    identifier: string
    message: string
  }
  return data
}

export async function verifyPin(
  identifier: string,
  pin: string,
  role: AuthRole,
  appId: string,
) {
  const res = await fetch('/api/auth/verify-pin', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identifier, pin, role, appId }),
  })
  if (!res.ok) throw new Error(await readApiError(res))
  const data = (await res.json()) as {
    ok: boolean
    token: string
    session: { email: string; role: AuthRole; appId: string }
  }
  return data
}

export function formatLoginLabel(identifier: string) {
  return identifier
}
