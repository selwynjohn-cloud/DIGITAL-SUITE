import type { VercelRequest, VercelResponse } from '@vercel/node'
import {
  createSessionToken,
  canLoginWithEmail,
  isSuperAdminEmail,
  normaliseEmail,
  type AuthRole,
} from '../_lib/auth.js'
import { applyTrainingCors, handleTrainingCorsPreflight } from '../_lib/cors.js'
import { verifySuitePin, pinVerifyError } from '../_lib/pin-suite.js'
import {
  notifySuperAdminEmailLogin,
  verifySuperAdminPin,
} from '../_lib/super-admin-login.js'

const COOKIE_MAX_AGE = 8 * 60 * 60

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (handleTrainingCorsPreflight(req, res)) return
    applyTrainingCors(req, res)

    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' })
    }

    const body = (req.body ?? {}) as Record<string, unknown>
    const pin = String(body.pin ?? '').replace(/\D/g, '').trim()
    if (!pin) {
      return res.status(400).json({ error: 'Missing OTP' })
    }

    const role = body.role === 'management' ? 'management' : body.role === 'staff' ? 'staff' : null
    const appId = String(body.appId ?? '').trim()
    const email = normaliseEmail(String(body.identifier ?? body.email ?? ''))

    const appTitle = String(body.appTitle ?? appId ?? 'Agile App').trim()

    if (!email || !canLoginWithEmail(email)) {
      return res.status(400).json({ error: 'Use your @agilegroup.co.in work email.' })
    }

    const sessionRoleHint: AuthRole = role === 'staff' ? 'staff' : 'management'
    const superLogin = await verifySuperAdminPin(email, pin, appId, appTitle, sessionRoleHint)
    if (superLogin) {
      const token = superLogin.token
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
        session: { email: superLogin.email, role: superLogin.role, appId },
      })
    }

    const checked = await verifySuitePin(email, pin, appId)
    if (!checked.record) {
      if (isSuperAdminEmail(email)) {
        return res.status(401).json({
          error:
            'Wrong PIN. Director: enter your private Master PIN (170658) — not an old email code. Tap Send PIN first, then enter 170658.',
        })
      }
      return res.status(401).json({ error: pinVerifyError(checked.failure, appTitle) })
    }

    const sessionRole: AuthRole = checked.record.role
    await notifySuperAdminEmailLogin(email, appTitle, appId, sessionRole)
    const token = await createSessionToken({
      email,
      role: sessionRole,
      appId,
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
        role: sessionRole,
        appId,
      },
    })
  } catch (err) {
    console.error('verify-pin error', err)
    return res.status(500).json({
      error: err instanceof Error ? err.message : 'Could not verify OTP. Please try again.',
    })
  }
}
