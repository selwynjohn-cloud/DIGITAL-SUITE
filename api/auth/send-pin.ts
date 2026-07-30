import type { VercelRequest, VercelResponse } from '@vercel/node'
import { normaliseEmail, canLoginWithEmail, type AuthRole } from '../_lib/auth.js'
import { applyTrainingCors, handleTrainingCorsPreflight } from '../_lib/cors.js'
import { sendPinEmail } from '../_lib/email.js'
import { hasPinStorage, pinStorageStatus } from '../_lib/pin-store.js'
import {
  deleteSuitePin,
  markSuitePinSent,
  clearSuitePinSent,
  acquireSuitePinSendLock,
  releaseSuitePinSendLock,
  saveSuitePin,
  suitePinActive,
  suitePinRecentlySent,
} from '../_lib/pin-suite.js'
import { handleSuperAdminPinSend } from '../_lib/super-admin-login.js'

function generatePin() {
  return String(Math.floor(100000 + Math.random() * 900000))
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (handleTrainingCorsPreflight(req, res)) return
    applyTrainingCors(req, res)

    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' })
    }

    if (!hasPinStorage()) {
      const st = pinStorageStatus()
      const missing = 'missing' in st ? st.missing.join(', ') : 'Upstash Redis'
      return res.status(503).json({
        error:
          'Login storage is not configured. Ask IT to add Upstash Redis on Vercel. Missing: ' +
          missing,
      })
    }

    const { email, role, appId, appTitle } = req.body ?? {}

    if (!role || !appId || !appTitle) {
      return res.status(400).json({ error: 'Missing role, appId, or appTitle' })
    }

    if (role !== 'staff' && role !== 'management') {
      return res.status(400).json({ error: 'Invalid role' })
    }

    const normalised = normaliseEmail(String(email ?? ''))
    if (!canLoginWithEmail(normalised)) {
      return res.status(400).json({
        error: `Only @${process.env.ALLOWED_EMAIL_DOMAIN ?? 'agilegroup.co.in'} email addresses are allowed`,
      })
    }

    const appIdStr = String(appId)
    const authRole: AuthRole = role === 'staff' ? 'staff' : 'management'
    const superSend = await handleSuperAdminPinSend(
      normalised,
      String(appTitle),
      appIdStr,
      authRole,
    )
    if (superSend) {
      return res.status(200).json({
        ...superSend,
        channel: 'email',
        identifier: normalised,
      })
    }

    if (await suitePinRecentlySent(normalised, appIdStr) && (await suitePinActive(normalised, appIdStr))) {
      return res.status(200).json({
        ok: true,
        throttled: true,
        channel: 'email',
        identifier: normalised,
        message:
          'PIN already sent — use the 6-digit PIN from your last email (valid 15 minutes). Check spam. Wait 90 seconds for a new PIN.',
      })
    }

    if (!(await acquireSuitePinSendLock(normalised, appIdStr))) {
      return res.status(200).json({
        ok: true,
        throttled: true,
        channel: 'email',
        identifier: normalised,
        message:
          'PIN is already being sent — check your inbox and spam in a moment. Wait 90 seconds before requesting again.',
      })
    }

    const pin = generatePin()
    const roleLabel = role === 'staff' ? 'HODs / Staff' : 'Management'

    await saveSuitePin(normalised, pin, role, appIdStr)
    await markSuitePinSent(normalised, appIdStr)
    const mailResult = await sendPinEmail(normalised, pin, String(appTitle), roleLabel)

    if (mailResult.ok === false) {
      await deleteSuitePin(normalised, appIdStr)
      await clearSuitePinSent(normalised, appIdStr)
      await releaseSuitePinSendLock(normalised, appIdStr)
      return res.status(503).json({ error: mailResult.error })
    }
    await releaseSuitePinSendLock(normalised, appIdStr)

    return res.status(200).json({
      ok: true,
      channel: 'email',
      identifier: normalised,
      message: `OTP sent to ${normalised}. Check inbox and spam — valid 15 minutes.`,
    })
  } catch (err) {
    console.error('send-pin error', err)
    return res.status(500).json({
      error: err instanceof Error ? err.message : 'Could not send OTP. Please try again.',
    })
  }
}
