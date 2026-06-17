import type { VercelRequest, VercelResponse } from '@vercel/node'
import { createSessionToken, isValidAgileEmail, normaliseEmail } from '../_lib/auth.js'
import { normalizeMobile, verifyPin } from '../_lib/pin-store.js'

const COOKIE_MAX_AGE = 8 * 60 * 60

function resolveIdentifier(body: Record<string, unknown>) {
  const rawIdentifier = String(body.identifier ?? '').trim()
  if (rawIdentifier.startsWith('m:')) {
    const mobile10 = normalizeMobile(rawIdentifier.slice(2))
    return mobile10 ? `m:${mobile10}` : ''
  }

  const email = normaliseEmail(String(body.email ?? rawIdentifier))
  if (email && isValidAgileEmail(email)) return email

  const mobile10 = normalizeMobile(String(body.mobile ?? ''))
  if (mobile10) return `m:${mobile10}`

  return ''
}

function sessionEmail(identifier: string) {
  if (identifier.startsWith('m:')) return `+91${identifier.slice(2)}`
  return identifier
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const body = (req.body ?? {}) as Record<string, unknown>
  const pin = String(body.pin ?? '').trim()
  if (!pin) {
    return res.status(400).json({ error: 'Missing OTP' })
  }

  const identifier = resolveIdentifier(body)
  if (!identifier) {
    return res.status(400).json({ error: 'Invalid email or mobile number' })
  }

  const record = await verifyPin(identifier, pin)
  if (!record) {
    return res.status(401).json({ error: 'Invalid or expired OTP' })
  }

  const email = sessionEmail(identifier)
  const token = await createSessionToken({
    email,
    role: record.role,
    appId: record.appId,
  })

  const cookieDomain = process.env.AUTH_COOKIE_DOMAIN
  const secure = process.env.NODE_ENV === 'production'
  const parts = [
    `agil_auth=${token}`,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
    `Max-Age=${COOKIE_MAX_AGE}`,
  ]
  if (secure) parts.push('Secure')
  if (cookieDomain) parts.push(`Domain=${cookieDomain}`)

  res.setHeader('Set-Cookie', parts.join('; '))

  return res.status(200).json({
    ok: true,
    token,
    session: {
      email,
      role: record.role,
      appId: record.appId,
    },
  })
}
