import { SignJWT, jwtVerify } from 'jose'

export type AuthRole = 'staff' | 'management'

export type SessionPayload = {
  email: string
  role: AuthRole
  appId: string
}

const SESSION_HOURS = 8

function secret() {
  const key = process.env.AUTH_SECRET
  if (!key) throw new Error('AUTH_SECRET is not configured')
  return new TextEncoder().encode(key)
}

export async function createSessionToken(payload: SessionPayload) {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_HOURS}h`)
    .sign(secret())
}

export async function verifySessionToken(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secret())
    const email = payload.email as string
    const role = payload.role as AuthRole
    const appId = payload.appId as string
    if (!email || !role || !appId) return null
    return { email, role, appId }
  } catch {
    return null
  }
}

export function isValidAgileEmail(email: string) {
  const domain = (process.env.ALLOWED_EMAIL_DOMAIN ?? 'agilegroup.co.in').toLowerCase()
  const normalised = email.trim().toLowerCase()
  const pattern = new RegExp(`^[a-z0-9._%+-]+@${domain.replace('.', '\\.')}$`)
  return pattern.test(normalised)
}

export function normaliseEmail(email: string) {
  return email.trim().toLowerCase()
}

/** Director emails — Master PIN works without @agilegroup.co.in domain check */
export function getSuperAdminEmails() {
  return (process.env.SUPER_ADMIN_EMAILS ?? 'director@agilegroup.co.in,selwyn.john@gmail.com')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean)
}

export function isSuperAdminEmail(email: string) {
  const em = normaliseEmail(email)
  return getSuperAdminEmails().includes(em)
}

export function canLoginWithEmail(email: string) {
  return isValidAgileEmail(email) || isSuperAdminEmail(email)
}

export function isValidSuperAdminPin(_pin: string) {
  return false
}
