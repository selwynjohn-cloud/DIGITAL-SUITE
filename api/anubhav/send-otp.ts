import type { VercelRequest, VercelResponse } from '@vercel/node'
import { sendSuiteEmail } from '../_lib/suite-mail.js'
import { Resend } from 'resend'

function secretOk(req: VercelRequest) {
  const expected = process.env.ANUBHAV_REGISTRATION_SECRET?.trim()
  if (!expected) return false
  const auth = String(req.headers.authorization ?? '')
  const bearer = auth.startsWith('Bearer ') ? auth.slice(7).trim() : ''
  return bearer === expected
}

function buildOtpHtml(name: string, email: string, code: string) {
  return `
    <div style="font-family: Georgia, serif; max-width: 520px; margin: 0 auto; color: #1e293b;">
      <p style="color: #b8860b; letter-spacing: 0.12em; font-size: 12px;">ANUBHAV BANK</p>
      <h2 style="color: #2d6a4f;">Your verification code</h2>
      <p>Dear ${name},</p>
      <p>Your one-time code to confirm your email <strong>${email}</strong> is:</p>
      <p style="font-size: 32px; font-weight: bold; letter-spacing: 0.3em; color: #2d6a4f; margin: 24px 0;">${code}</p>
      <p style="font-size: 14px; color: #64748b;">This code expires in <strong>10 minutes</strong>.</p>
    </div>
  `
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  if (!secretOk(req)) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  const { email, phone, name, code } = (req.body ?? {}) as {
    email?: string
    phone?: string
    name?: string
    code?: string
  }

  const to = String(email ?? '').trim().toLowerCase()
  const mobile = String(phone ?? '').replace(/\D/g, '').slice(-10)
  const otp = String(code ?? '').trim()
  const person = String(name ?? 'Member').trim()

  if (!to.includes('@') || mobile.length < 10 || otp.length !== 6) {
    return res.status(400).json({ error: 'Invalid OTP email request.' })
  }

  const apiKey = process.env.RESEND_API_KEY?.trim()
  if (!apiKey) {
    return res.status(503).json({ error: 'Email service not configured.' })
  }

  const from = process.env.EMAIL_FROM ?? 'Anubhav Bank <noreply@agilegroup.co.in>'
  const resend = new Resend(apiKey)

  try {
    const result = await sendSuiteEmail(resend, {
      from,
      to,
      subject: `Anubhav Bank verification code — ${otp}`,
      html: buildOtpHtml(person, to, otp),
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
