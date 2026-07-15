import type { VercelRequest, VercelResponse } from '@vercel/node'
import { sendSuiteEmail } from '../_lib/suite-mail.js'
import { Resend } from 'resend'

type ElderHelpPayload = {
  name: string
  phone: string
  category: string
  note?: string
  urgent: boolean
  submittedAt: string
}

const CATEGORY_LABELS: Record<string, string> = {
  sos: 'SOS — Urgent help needed now',
  medical: 'Medical help',
  medicine: 'Medicine',
  doctor: 'Doctor visit or tests',
  tickets: 'Booking tickets',
  provisions: 'Buying provisions',
  other: 'Any other help',
}

function secretOk(req: VercelRequest) {
  const expected = process.env.ANUBHAV_REGISTRATION_SECRET?.trim()
  if (!expected) return false
  const auth = String(req.headers.authorization ?? '')
  const bearer = auth.startsWith('Bearer ') ? auth.slice(7).trim() : ''
  const header = String(req.headers['x-anubhav-registration-secret'] ?? '').trim()
  return bearer === expected || header === expected
}

function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
}

function categoryLabel(category: string) {
  return CATEGORY_LABELS[category] ?? category
}

function buildEmailHtml(payload: ElderHelpPayload) {
  const title = payload.urgent
    ? 'SOS — Elder needs help now'
    : `Help request — ${categoryLabel(payload.category)}`
  const urgencyBanner = payload.urgent
    ? `<p style="margin:0 0 20px;padding:14px 16px;background:#b91c1c;color:#fff;font-size:18px;font-weight:700;border-radius:8px;">URGENT — Please call back as soon as possible.</p>`
    : ''

  const rows = [
    ['Name', payload.name],
    ['Mobile', payload.phone],
    ['Help type', categoryLabel(payload.category)],
    ['Note', payload.note || '—'],
  ]
    .map(
      ([label, value]) => `<tr>
        <td style="padding:10px 12px;border:1px solid #e2e8f0;font-weight:600;vertical-align:top;width:38%;">${escapeHtml(label)}</td>
        <td style="padding:10px 12px;border:1px solid #e2e8f0;vertical-align:top;">${escapeHtml(value)}</td>
      </tr>`,
    )
    .join('')

  return `
    <div style="font-family: Georgia, serif; max-width: 640px; margin: 0 auto; color: #1e293b;">
      <p style="color: #b8860b; letter-spacing: 0.12em; font-size: 12px; margin: 0 0 8px;">ANUBHAV BANK — ELDER HELP</p>
      <h2 style="margin: 0 0 16px; color: #2d6a4f;">${escapeHtml(title)}</h2>
      ${urgencyBanner}
      <p style="margin: 0 0 20px; color: #64748b;">A senior has asked for help through the Anubhavbank app.</p>
      <table style="width:100%; border-collapse: collapse; font-size: 15px;">${rows}</table>
      <p style="margin: 24px 0 0; font-size: 13px; color: #94a3b8;">Submitted at ${escapeHtml(payload.submittedAt)}</p>
    </div>
  `
}

function getAdminEmails() {
  const raw = process.env.ADMIN_NOTIFY_EMAIL?.trim() ?? 'selwyn.john@gmail.com'
  return raw
    .split(',')
    .map((email) => email.trim())
    .filter(Boolean)
}

function isValidPayload(body: unknown): body is ElderHelpPayload {
  if (!body || typeof body !== 'object') return false
  const record = body as ElderHelpPayload
  if (typeof record.name !== 'string' || record.name.trim().length < 2) return false
  if (typeof record.phone !== 'string' || record.phone.replace(/\D/g, '').length < 10) return false
  if (typeof record.category !== 'string' || !record.category.trim()) return false
  if (typeof record.submittedAt !== 'string') return false
  return true
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  if (!secretOk(req)) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  if (!isValidPayload(req.body)) {
    return res.status(400).json({ error: 'Invalid help request.' })
  }

  const apiKey = process.env.RESEND_API_KEY?.trim()
  if (!apiKey) {
    return res.status(503).json({ error: 'Email service not configured.' })
  }

  const from = process.env.EMAIL_FROM ?? 'Anubhav Bank <noreply@agilegroup.co.in>'
  const to = getAdminEmails()
  const subject = req.body.urgent
    ? `SOS — ${req.body.name} needs help now`
    : `Elder help — ${categoryLabel(req.body.category)} — ${req.body.name}`
  const html = buildEmailHtml(req.body)

  try {
    const resend = new Resend(apiKey)
    const result = await sendSuiteEmail(resend, { from, to, subject, html })
    if (result.error) {
      return res.status(503).json({ error: result.error.message ?? 'Could not send email' })
    }
    return res.status(200).json({ ok: true })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Could not send email'
    return res.status(503).json({ error: msg })
  }
}
