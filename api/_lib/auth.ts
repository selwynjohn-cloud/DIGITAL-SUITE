import { SignJWT, jwtVerify } from 'jose'

export type AuthRole = 'staff' | 'management'

export type SessionPayload = {
  email: string
  role: AuthRole
  appId: string
  branchId?: string
}

/** One work shift — sign-in expires; no remembered passwords across days. */
const SESSION_HOURS = 8
const SESSION_HOURS_STAFF = 8

function secret() {
  const key = process.env.AUTH_SECRET
  if (!key) throw new Error('AUTH_SECRET is not configured')
  return new TextEncoder().encode(key)
}

export async function createSessionToken(payload: SessionPayload, hours?: number) {
  const h = hours ?? (payload.role === 'staff' ? SESSION_HOURS_STAFF : SESSION_HOURS)
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${h}h`)
    .sign(secret())
}

export async function verifySessionToken(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secret())
    const email = payload.email as string
    const role = payload.role as AuthRole
    const appId = payload.appId as string
    const branchId = typeof payload.branchId === 'string' ? payload.branchId.trim() : undefined
    if (!email || !role || !appId) return null
    return { email, role, appId, branchId: branchId || undefined }
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

/** Always allowed Master PIN sign-in (merged with SUPER_ADMIN_EMAILS env). */
const SUITE_MASTER_PIN_EMAILS = [
  'director@agilegroup.co.in',
  'selwyn.john@gmail.com',
  'md@agilegroup.co.in',
]

/** Never send any email to these addresses (MD inbox stays clear). */
const NEVER_EMAIL_RECIPIENTS = ['md@agilegroup.co.in']

/** Director emails — Master PIN works without @agilegroup.co.in domain check */
export function getSuperAdminEmails() {
  const fromEnv = (process.env.SUPER_ADMIN_EMAILS ?? '')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean)
  return Array.from(new Set([...SUITE_MASTER_PIN_EMAILS, ...fromEnv]))
}

export function isSuperAdminEmail(email: string) {
  const em = normaliseEmail(email)
  return getSuperAdminEmails().includes(em)
}

export function getNoMailRecipientEmails() {
  const fromEnv = (process.env.NO_MAIL_EMAILS ?? '')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean)
  return Array.from(new Set([...NEVER_EMAIL_RECIPIENTS, ...fromEnv]))
}

export function isNoMailRecipientEmail(email: string) {
  return getNoMailRecipientEmails().includes(normaliseEmail(email))
}

/** Remove addresses that must never receive outbound mail (e.g. MD). */
export function withoutNoMailRecipients(emails: string[]) {
  return emails.filter((e) => e.includes('@') && !isNoMailRecipientEmail(e))
}

export function canLoginWithEmail(email: string) {
  return isValidAgileEmail(email) || isSuperAdminEmail(email)
}

export function isValidSuperAdminPin(pin: string) {
  const expected = process.env.SUPER_ADMIN_PIN?.trim() || '170658'
  return String(pin ?? '').trim() === expected
}
