import type { VercelRequest, VercelResponse } from '@vercel/node'
import { normaliseEmail, canLoginWithEmail } from '../_lib/auth.js'
import { applyTrainingCors, handleTrainingCorsPreflight } from '../_lib/cors.js'
import { sendPinEmail } from '../_lib/email.js'
import { hasPinStorage, normalizeMobile, pinStorageStatus, savePin } from '../_lib/pin-store.js'
import { sendPinSms } from '../_lib/sms.js'

function generatePin() {
  return String(Math.floor(100000 + Math.random() * 900000))
}

function mobileIdentifier(mobile10: string) {
  return `m:${mobile10}`
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

    const { channel, email, mobile, role, appId, appTitle } = req.body ?? {}
    const loginChannel = channel === 'sms' ? 'sms' : 'email'

    if (!role || !appId || !appTitle) {
      return res.status(400).json({ error: 'Missing role, appId, or appTitle' })
    }

    if (role !== 'staff' && role !== 'management') {
      return res.status(400).json({ error: 'Invalid role' })
    }

    const pin = generatePin()
    const roleLabel = role === 'staff' ? 'HODs / Staff' : 'Management'

    if (loginChannel === 'sms') {
      const mobile10 = normalizeMobile(String(mobile ?? ''))
      if (!mobile10) {
        return res.status(400).json({ error: 'Enter a valid 10-digit mobile number' })
      }

      const identifier = mobileIdentifier(mobile10)
      await savePin(identifier, pin, role, String(appId))

      const smsResult = await sendPinSms(mobile10, pin, String(appTitle))
      return res.status(200).json({
        ok: true,
        channel: 'sms',
        identifier,
        message: `OTP sent to +91 ${mobile10}`,
      })
    }

    const normalised = normaliseEmail(String(email ?? ''))
    if (!canLoginWithEmail(normalised)) {
      return res.status(400).json({
        error: `Only @${process.env.ALLOWED_EMAIL_DOMAIN ?? 'agilegroup.co.in'} email addresses are allowed`,
      })
    }

    await savePin(normalised, pin, role, String(appId))
    const mailResult = await sendPinEmail(normalised, pin, String(appTitle), roleLabel)

    if (!mailResult.ok) {
      return res.status(503).json({ error: mailResult.error })
    }

    return res.status(200).json({
      ok: true,
      channel: 'email',
      identifier: normalised,
      message: `OTP sent to ${normalised}`,
    })
  } catch (err) {
    console.error('send-pin error', err)
    return res.status(500).json({
      error: err instanceof Error ? err.message : 'Could not send OTP. Please try again.',
    })
  }
}
