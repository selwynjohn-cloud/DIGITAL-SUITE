import type { VercelRequest, VercelResponse } from '@vercel/node'
import { sendSuiteEmail } from '../_lib/suite-mail.js'
import { Resend } from 'resend'

function secretOk(req: VercelRequest) {
  const expected = process.env.MIS_EMAIL_HOOK_SECRET?.trim()
  if (!expected) return false
  const auth = String(req.headers.authorization ?? '')
  const bearer = auth.startsWith('Bearer ') ? auth.slice(7).trim() : ''
  const header = String(req.headers['x-mis-email-secret'] ?? '').trim()
  return bearer === expected || header === expected
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  if (!secretOk(req)) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  const apiKey = process.env.RESEND_API_KEY?.trim()
  if (!apiKey) {
    return res.status(503).json({ error: 'Email service not configured on Command Centre' })
  }

  const { email, otp, userName } = (req.body ?? {}) as {
    email?: string
    otp?: string
    userName?: string
  }

  const to = String(email ?? '')
    .trim()
    .toLowerCase()
  const code = String(otp ?? '').trim()

  if (!to.includes('@') || code.length !== 6) {
    return res.status(400).json({ error: 'Invalid email or OTP' })
  }

  const from = process.env.EMAIL_FROM ?? 'Agile MIS <noreply@agilegroup.co.in>'
  const resend = new Resend(apiKey)
  const name = String(userName ?? 'User').trim() || 'User'

  const html = `
    <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;background:#0f1729;color:#e2e8f0;border-radius:12px;overflow:hidden">
      <div style="background:#1a2540;padding:24px;text-align:center;border-bottom:2px solid #d4a853">
        <h2 style="color:#d4a853;margin:12px 0 4px;font-size:20px">Agile Security Force</h2>
        <p style="color:#94a3b8;margin:0;font-size:13px">MIS Dashboard Login</p>
      </div>
      <div style="padding:32px 24px;text-align:center">
        <p style="color:#94a3b8;margin:0 0 8px">Dear <strong style="color:#e2e8f0">${name}</strong>, your one-time login OTP is:</p>
        <div style="font-size:40px;font-weight:bold;letter-spacing:10px;color:#d4a853;background:#0f1729;border:2px solid #d4a853;border-radius:8px;padding:16px 24px;display:inline-block;margin:16px 0">${code}</div>
        <p style="color:#94a3b8;font-size:13px;margin:16px 0 0">This code expires in <strong style="color:#e2e8f0">10 minutes</strong>.</p>
      </div>
    </div>`

  try {
    const result = await sendSuiteEmail(resend, {
      from,
      to,
      subject: `Your Agile MIS Login OTP — ${code}`,
      html,
    })
    if (result.error) {
      return res.status(503).json({ error: result.error.message ?? 'Could not send email' })
    }
    return res.status(200).json({ ok: true })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Could not send email'
    return res.status(503).json({ error: msg })
  }
}
