import type { VercelRequest, VercelResponse } from '@vercel/node'
import { isValidAgileEmail, normaliseEmail } from '../_lib/auth.js'
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

    try {
      const smsResult = await sendPinSms(mobile10, pin, String(appTitle))
      return res.status(200).json({
        ok: true,
        channel: 'sms',
        identifier,
        message: `OTP sent to +91 ${mobile10}`,
        devPin: smsResult.devMode ? pin : undefined,
      })
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Could not send SMS'
      return res.status(503).json({ error: msg })
    }
  }

  const normalised = normaliseEmail(String(email ?? ''))
  if (!isValidAgileEmail(normalised)) {
    return res.status(400).json({
      error: `Only @${process.env.ALLOWED_EMAIL_DOMAIN ?? 'agilegroup.co.in'} email addresses are allowed`,
    })
  }

  await savePin(normalised, pin, role, String(appId))
  const mailResult = await sendPinEmail(normalised, pin, String(appTitle), roleLabel)

  return res.status(200).json({
    ok: true,
    channel: 'email',
    identifier: normalised,
    message: `OTP sent to ${normalised}`,
    devPin: mailResult.devMode ? pin : undefined,
  })
}
