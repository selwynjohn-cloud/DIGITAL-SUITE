import type { VercelRequest, VercelResponse } from '@vercel/node'
import { isValidAgileEmail, normaliseEmail } from '../_lib/auth.js'
import { sendPinEmail } from '../_lib/email.js'
import { hasPinStorage, pinStorageStatus, savePin } from '../_lib/pin-store.js'

function generatePin() {
  return String(Math.floor(100000 + Math.random() * 900000))
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
        'PIN storage is not configured. In Vercel → Settings → Environment Variables, add Upstash Redis (both Staff and Management use the same store). Missing: ' +
        missing,
    })
  }

  const { email, role, appId, appTitle } = req.body ?? {}

  if (!email || !role || !appId || !appTitle) {
    return res.status(400).json({ error: 'Missing email, role, appId, or appTitle' })
  }

  if (role !== 'staff' && role !== 'management') {
    return res.status(400).json({ error: 'Invalid role' })
  }

  const normalised = normaliseEmail(String(email))
  if (!isValidAgileEmail(normalised)) {
    return res.status(400).json({
      error: `Only @${process.env.ALLOWED_EMAIL_DOMAIN ?? 'agilegroup.co.in'} email addresses are allowed`,
    })
  }

  const pin = generatePin()
  await savePin(normalised, pin, role, String(appId))

  const roleLabel = role === 'staff' ? 'HODs / Staff' : 'Management'
  const mailResult = await sendPinEmail(normalised, pin, String(appTitle), roleLabel)

  return res.status(200).json({
    ok: true,
    message: `PIN sent to ${normalised}`,
    devPin: mailResult.devMode ? pin : undefined,
  })
}
