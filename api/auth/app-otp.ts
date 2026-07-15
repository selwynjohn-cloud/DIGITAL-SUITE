import type { VercelRequest, VercelResponse } from '@vercel/node'
import {
  createSessionToken,
  canLoginWithEmail,
  isSuperAdminEmail,
  normaliseEmail,
  type AuthRole,
} from '../_lib/auth.js'
import { applyTrainingCors, handleTrainingCorsPreflight } from '../_lib/cors.js'
import { sendPinEmail } from '../_lib/email.js'
import { hasPinStorage, pinStorageStatus } from '../_lib/pin-store.js'
import {
  deleteSuitePin,
  markSuitePinSent,
  clearSuitePinSent,
  acquireSuitePinSendLock,
  releaseSuitePinSendLock,
  pinVerifyError,
  saveSuitePin,
  suitePinActive,
  suitePinRecentlySent,
  verifySuitePin,
} from '../_lib/pin-suite.js'
import { matchesSuiteBranchPin } from '../_lib/suite-credentials.js'
import {
  handleSuperAdminPinSend,
  notifySuperAdminEmailLogin,
  verifySuperAdminPin,
} from '../_lib/super-admin-login.js'

function generatePin() {
  return String(Math.floor(100000 + Math.random() * 900000))
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (handleTrainingCorsPreflight(req, res)) return
    applyTrainingCors(req, res)

    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

    const body = (req.body ?? {}) as Record<string, unknown>
    const action = String(body.action ?? '')

    if (!hasPinStorage()) {
      const st = pinStorageStatus()
      const missing = 'missing' in st ? st.missing.join(', ') : 'Upstash Redis'
      return res.status(503).json({
        error: 'Login service not ready. Missing: ' + missing,
      })
    }

    const appId = String(body.appId ?? '').trim()
    const appTitle = String(body.appTitle ?? body.appId ?? 'Agile App').trim()
    const role: AuthRole = body.role === 'staff' ? 'staff' : 'management'

    if (action === 'send') {
      const email = normaliseEmail(String(body.email ?? ''))
      if (!canLoginWithEmail(email)) {
        return res.status(400).json({
          error: 'Use your @agilegroup.co.in work email (Director may also use selwyn.john@gmail.com).',
        })
      }

      const superSend = await handleSuperAdminPinSend(email, appTitle, appId, role)
      if (superSend) {
        return res.status(200).json(superSend)
      }

      if (await suitePinRecentlySent(email, appId) && (await suitePinActive(email, appId))) {
        return res.status(200).json({
          ok: true,
          throttled: true,
          message:
            'PIN already sent — use the 6-digit PIN from your last email (still valid 15 minutes). Check spam. Wait 90 seconds to request a new PIN.',
        })
      }

      if (!(await acquireSuitePinSendLock(email, appId))) {
        return res.status(200).json({
          ok: true,
          throttled: true,
          message:
            'PIN is already being sent — check your inbox and spam in a moment. Wait 90 seconds before requesting again.',
        })
      }

      const pin = generatePin()
      await saveSuitePin(email, pin, role, appId)
      await markSuitePinSent(email, appId)
      const roleLabel = role === 'staff' ? 'HODs / Staff' : 'Management'
      const mailResult = await sendPinEmail(email, pin, appTitle, roleLabel)
      if (mailResult.ok === false) {
        await deleteSuitePin(email, appId)
        await clearSuitePinSent(email, appId)
        await releaseSuitePinSendLock(email, appId)
        return res.status(503).json({ error: mailResult.error })
      }
      await releaseSuitePinSendLock(email, appId)

      return res.status(200).json({
        ok: true,
        message: `PIN sent to ${email}. Check inbox and spam — valid for 15 minutes.`,
      })
    }

    if (action === 'verify') {
      const email = normaliseEmail(String(body.email ?? ''))
      const pin = String(body.pin ?? '').replace(/\D/g, '').trim()
      if (!canLoginWithEmail(email)) {
        return res.status(400).json({ error: 'Invalid email for this portal.' })
      }
      if (!pin || pin.length < (role === 'staff' ? 4 : 6) || pin.length > 6) {
        return res.status(400).json({
          error:
            role === 'staff'
              ? 'Enter your 6-digit branch password or the PIN from your email.'
              : 'Enter the 6-digit PIN from your email.',
        })
      }

      const superLogin = await verifySuperAdminPin(email, pin, appId, appTitle, role)
      if (superLogin) {
        return res.status(200).json({
          ok: true,
          sessionToken: superLogin.token,
          email: superLogin.email,
          role: superLogin.role,
        })
      }

      if (role === 'staff' && matchesSuiteBranchPin(pin)) {
        await notifySuperAdminEmailLogin(email, appTitle, appId, 'staff')
        const token = await createSessionToken({ email, role: 'staff', appId })
        return res.status(200).json({
          ok: true,
          sessionToken: token,
          email,
          role: 'staff',
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
        const err =
          role === 'staff'
            ? checked.failure === 'locked'
              ? pinVerifyError('locked', appTitle)
              : 'Wrong PIN. Use your branch password or the latest 6-digit PIN from your email.'
            : pinVerifyError(checked.failure, appTitle)
        return res.status(401).json({ error: err })
      }

      const sessionRole = checked.record.role
      await notifySuperAdminEmailLogin(email, appTitle, appId, sessionRole)
      const token = await createSessionToken({ email, role: sessionRole, appId })

      return res.status(200).json({
        ok: true,
        sessionToken: token,
        email,
        role: sessionRole,
      })
    }

    return res.status(400).json({ error: 'Unknown action.' })
  } catch (err) {
    console.error('app-otp error', err)
    return res.status(500).json({
      error: err instanceof Error ? err.message : 'Login failed.',
    })
  }
}
