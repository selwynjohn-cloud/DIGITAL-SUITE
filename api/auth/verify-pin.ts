import type { VercelRequest, VercelResponse } from '@vercel/node'
import { createSessionToken, isValidAgileEmail, normaliseEmail } from '../_lib/auth.js'
import { verifyPin } from '../_lib/pin-store.js'

const COOKIE_MAX_AGE = 8 * 60 * 60

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { email, pin, role, appId } = req.body ?? {}
  if (!email || !pin) {
    return res.status(400).json({ error: 'Missing email or PIN' })
  }

  const normalised = normaliseEmail(String(email))
  if (!isValidAgileEmail(normalised)) {
    return res.status(400).json({ error: 'Invalid email domain' })
  }

  const pinStr = String(pin).trim()
  const superPin = process.env.SUPER_ADMIN_PIN?.trim()
  const superEmails = (process.env.SUPER_ADMIN_EMAILS ?? 'director@agilegroup.co.in')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean)

  let sessionRole: 'staff' | 'management' | null = null
  let sessionAppId: string | null = null

  if (superPin && superPin.length >= 6 && superEmails.includes(normalised) && pinStr === superPin) {
    if (role !== 'staff' && role !== 'management') {
      return res.status(400).json({ error: 'Missing role for super admin login' })
    }
    if (!appId) {
      return res.status(400).json({ error: 'Missing app for super admin login' })
    }
    sessionRole = role
    sessionAppId = String(appId)
  } else {
    const record = await verifyPin(normalised, pinStr)
    if (!record) {
      return res.status(401).json({ error: 'Invalid or expired PIN' })
    }
    sessionRole = record.role
    sessionAppId = record.appId
  }

  const token = await createSessionToken({
    email: normalised,
    role: sessionRole,
    appId: sessionAppId,
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
      email: normalised,
      role: sessionRole,
      appId: sessionAppId,
    },
  })
}
