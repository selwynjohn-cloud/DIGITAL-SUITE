import type { VercelRequest, VercelResponse } from '@vercel/node'
import { sendSuiteEmail } from '../_lib/suite-mail.js'
import { Resend } from 'resend'

type RegistrationKind = 'join' | 'mentor' | 'hire'

type RegistrationPayload = {
  kind: RegistrationKind
  fields: Record<string, string | string[] | boolean>
  submittedAt: string
}

const KIND_LABELS: Record<RegistrationKind, string> = {
  join: 'Join Anubhav Bank — Register Interest',
  mentor: 'Become a Mentor — Application',
  hire: 'Find an Expert — Hiring Request',
}

const FIELD_LABELS: Record<string, string> = {
  name: 'Full Name',
  phone: 'Mobile Number',
  email: 'Email',
  city: 'City',
  state: 'State',
  previousProfession: 'Previous Profession',
  expertiseOne: 'Expertise (1)',
  expertiseTwo: 'Expertise (2)',
  preferredMedia: 'Preferred Media',
  hasLaptop: 'Has Laptop (for Online)',
  audiences: 'Who They Can Mentor',
  company: 'Company / Organization',
  requirement: 'Requirement Type',
  details: 'Requirement Details',
  contact: 'Contact Number',
  codeOfRespect: 'Agreed to Code of Respect & Joy',
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

function formatFieldValue(value: string | string[] | boolean) {
  if (Array.isArray(value)) return value.join(', ')
  if (typeof value === 'boolean') return value ? 'Yes' : 'No'
  return value
}

function buildEmailHtml(payload: RegistrationPayload) {
  const title = KIND_LABELS[payload.kind]
  const rows = Object.entries(payload.fields)
    .filter(([, value]) => value !== '' && !(Array.isArray(value) && value.length === 0))
    .map(([key, value]) => {
      const label = FIELD_LABELS[key] ?? key
      return `<tr>
        <td style="padding:10px 12px;border:1px solid #e2e8f0;font-weight:600;vertical-align:top;width:38%;">${escapeHtml(label)}</td>
        <td style="padding:10px 12px;border:1px solid #e2e8f0;vertical-align:top;">${escapeHtml(formatFieldValue(value))}</td>
      </tr>`
    })
    .join('')

  return `
    <div style="font-family: Georgia, serif; max-width: 640px; margin: 0 auto; color: #1e293b;">
      <p style="color: #b8860b; letter-spacing: 0.12em; font-size: 12px; margin: 0 0 8px;">ANUBHAV BANK</p>
      <h2 style="margin: 0 0 16px; color: #2d6a4f;">${escapeHtml(title)}</h2>
      <p style="margin: 0 0 20px; color: #64748b;">A new registration was submitted on the website.</p>
      <table style="width:100%; border-collapse: collapse; font-size: 15px;">${rows}</table>
      <p style="margin: 24px 0 0; font-size: 13px; color: #94a3b8;">Submitted at ${escapeHtml(payload.submittedAt)}</p>
    </div>
  `
}

function getAdminEmails() {
  const raw =
    process.env.ADMIN_NOTIFY_EMAIL?.trim() ?? 'selwyn.john@gmail.com'
  return raw
    .split(',')
    .map((email) => email.trim())
    .filter(Boolean)
}

function isValidPayload(body: unknown): body is RegistrationPayload {
  if (!body || typeof body !== 'object') return false
  const record = body as RegistrationPayload
  if (!['join', 'mentor', 'hire'].includes(record.kind)) return false
  if (!record.fields || typeof record.fields !== 'object') return false
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
    return res.status(400).json({ error: 'Invalid registration data.' })
  }

  const name = String(req.body.fields.name ?? req.body.fields.company ?? '').trim()
  const phone = String(req.body.fields.phone ?? req.body.fields.contact ?? '').trim()
  if (!name || !phone) {
    return res.status(400).json({ error: 'Please fill in all required contact details.' })
  }

  const apiKey = process.env.RESEND_API_KEY?.trim()
  if (!apiKey) {
    return res.status(503).json({ error: 'Email service not configured.' })
  }

  const from = process.env.EMAIL_FROM ?? 'Anubhav Bank <noreply@agilegroup.co.in>'
  const to = getAdminEmails()
  const subject = `New registration — ${KIND_LABELS[req.body.kind]}`
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
