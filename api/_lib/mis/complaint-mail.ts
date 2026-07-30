import { Resend } from 'resend'
import { sendSuiteEmail } from '../suite-mail.js'
import type { MisComplaint } from './store.js'
import { getUsers } from './store.js'
import { getHodEmailsForBranch, isHodUser } from './digest.js'
import { waSendText, whatsappConfigured } from '../pulse/whatsapp.js'

function esc(s: unknown) {
  return String(s ?? '').replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
}

export function whatsappMobile(raw: string): string {
  let d = String(raw ?? '').replace(/\D/g, '')
  if (d.startsWith('0') && d.length === 11) d = d.slice(1)
  if (d.length === 10) return `91${d}`
  if (d.length === 12 && d.startsWith('91')) return d
  return d
}

function fmtIst(iso?: string) {
  if (!iso) return '—'
  try {
    return new Date(iso).toLocaleString('en-IN', {
      dateStyle: 'full',
      timeStyle: 'short',
      timeZone: 'Asia/Kolkata',
    })
  } catch {
    return iso
  }
}

function reporterThankYouWa(complaint: MisComplaint, branchName: string) {
  return (
    `✅ *Agile Security Force*\n\n` +
    `Thank you! Your complaint has been registered.\n\n` +
    `*Complaint Code:* ${complaint.code}\n` +
    `*Received:* ${fmtIst(complaint.registeredAt)}\n` +
    `*Branch:* ${branchName}\n` +
    `*Nature:* ${complaint.nature || '—'}\n` +
    `${branchName} branch has been notified and *will respond to you*.\n` +
    `Please save your complaint code for follow-up.\n\n` +
    `— Agile MIS Operations`
  )
}

function directorAlertWa(complaint: MisComplaint, branchName: string) {
  return (
    `⚠ *New Operations Complaint*\n\n` +
    `*Code:* ${complaint.code}\n` +
    `*Branch:* ${branchName}\n` +
    `*Client:* ${complaint.clientName}\n` +
    `*Nature:* ${complaint.nature || '—'}\n\n` +
    `*Location:* ${complaint.location || '—'}\n` +
    `*Received via:* ${complaint.channel || 'Web'}\n` +
    `*Reported by:* ${complaint.reportedBy}\n` +
    `*Mobile:* ${complaint.contactPhone || '—'}\n\n` +
    `${String(complaint.description ?? '').slice(0, 280)}`
  )
}

async function hodWhatsAppNumbers(branchId: string): Promise<string[]> {
  const users = await getUsers()
  const nums = new Set<string>()
  for (const u of users) {
    if (u.branchId !== branchId || !isHodUser(u)) continue
    const m = whatsappMobile(u.phone || '')
    if (m.length >= 12) nums.add(m)
  }
  return [...nums]
}

async function waSendSafe(to: string, body: string): Promise<{ ok: boolean; error?: string }> {
  const r = await waSendText(to, body)
  if (r?.ok) return { ok: true }
  const err =
    (r?.data && (r.data.message || r.data.error || JSON.stringify(r.data).slice(0, 120))) ||
    `HTTP ${r?.status ?? 0}`
  return { ok: false, error: String(err) }
}

/** WhatsApp — reporter thank-you + director + branch HOD alert. Runs even if email is off. */
export async function sendComplaintWhatsApp(complaint: MisComplaint, branchName: string) {
  if (!whatsappConfigured()) {
    return { ok: false, skipped: true, reason: 'WHAPI_TOKEN not set on server', reporterSent: false }
  }

  const sent: string[] = []
  const failed: { who: string; error?: string }[] = []

  const reporter = whatsappMobile(complaint.contactPhone || '')
  if (reporter.length >= 12) {
    const r = await waSendSafe(reporter, reporterThankYouWa(complaint, branchName))
    if (r.ok) sent.push('reporter')
    else failed.push({ who: 'reporter', error: r.error })
  } else if (complaint.contactPhone) {
    failed.push({ who: 'reporter', error: 'Invalid mobile number — use 10 digits' })
  }

  const adminRaw = process.env.ADMIN_WHATSAPP ?? process.env.MIS_DIRECTOR_WHATSAPP ?? ''
  const admin = whatsappMobile(adminRaw.replace(/\D/g, '') || adminRaw)
  if (admin.length >= 12) {
    const r = await waSendSafe(admin, directorAlertWa(complaint, branchName))
    if (r.ok) sent.push('director')
    else failed.push({ who: 'director', error: r.error })
  }

  for (const hod of await hodWhatsAppNumbers(complaint.branchId)) {
    const r = await waSendSafe(hod, directorAlertWa(complaint, branchName))
    if (r.ok) sent.push(`hod:${hod}`)
    else failed.push({ who: `hod:${hod}`, error: r.error })
  }

  return {
    ok: sent.length > 0,
    sent,
    failed,
    reporterSent: sent.includes('reporter'),
    skipped: false,
  }
}

async function sendComplaintEmails(complaint: MisComplaint, branchName: string) {
  const apiKey = process.env.RESEND_API_KEY?.trim()
  if (!apiKey) return { ok: false, skipped: true, reason: 'Email not configured' }

  const director =
    process.env.MIS_DIRECTOR_EMAIL?.trim() ||
    process.env.FLEET_DIRECTOR_EMAIL?.trim() ||
    'director@agilegroup.co.in'

  const resend = new Resend(apiKey)
  const from = process.env.EMAIL_FROM ?? 'Agile MIS <noreply@agilegroup.co.in>'
  const hodTo = await getHodEmailsForBranch(complaint.branchId)
  const branchRecipients = hodTo.length ? hodTo : [director]

  const detailTable = `
    <table style="width:100%;font-size:14px;border-collapse:collapse;margin-top:12px">
      <tr><td style="padding:8px;border-bottom:1px solid #eee;font-weight:600;width:40%">Complaint Code</td><td style="padding:8px;border-bottom:1px solid #eee;color:#b45309;font-weight:800;font-size:16px">${esc(complaint.code)}</td></tr>
      <tr><td style="padding:8px;border-bottom:1px solid #eee;font-weight:600">Received</td><td style="padding:8px;border-bottom:1px solid #eee">${esc(fmtIst(complaint.registeredAt))}</td></tr>
      <tr><td style="padding:8px;border-bottom:1px solid #eee;font-weight:600">Branch</td><td style="padding:8px;border-bottom:1px solid #eee">${esc(branchName)}</td></tr>
      <tr><td style="padding:8px;border-bottom:1px solid #eee;font-weight:600">Client</td><td style="padding:8px;border-bottom:1px solid #eee">${esc(complaint.clientName)}</td></tr>
      <tr><td style="padding:8px;border-bottom:1px solid #eee;font-weight:600">Nature</td><td style="padding:8px;border-bottom:1px solid #eee">${esc(complaint.nature)}</td></tr>
      <tr><td style="padding:8px;border-bottom:1px solid #eee;font-weight:600">Location</td><td style="padding:8px;border-bottom:1px solid #eee">${esc(complaint.location)}</td></tr>
      <tr><td style="padding:8px;border-bottom:1px solid #eee;font-weight:600">Received via</td><td style="padding:8px;border-bottom:1px solid #eee">${esc(complaint.channel)}</td></tr>
      <tr><td style="padding:8px;border-bottom:1px solid #eee;font-weight:600">Reported by</td><td style="padding:8px;border-bottom:1px solid #eee">${esc(complaint.reportedBy)}</td></tr>
      <tr><td style="padding:8px;border-bottom:1px solid #eee;font-weight:600">Mobile</td><td style="padding:8px;border-bottom:1px solid #eee">${esc(complaint.contactPhone)}</td></tr>
      <tr><td style="padding:8px;border-bottom:1px solid #eee;font-weight:600;vertical-align:top">Description</td><td style="padding:8px;border-bottom:1px solid #eee">${esc(complaint.description)}</td></tr>
      <tr><td style="padding:8px;font-weight:600;vertical-align:top">Expected action</td><td style="padding:8px">${esc(complaint.expectedAction)}</td></tr>
    </table>`

  const branchMail = await sendSuiteEmail(resend, {
    from,
    to: branchRecipients,
    cc: hodTo.length ? [director] : undefined,
    subject: `⚠ New Complaint ${complaint.code} — ${branchName} — ${complaint.clientName}`,
    html: `<div style="font-family:Arial,sans-serif;max-width:640px;color:#111">
      <div style="background:#14224f;color:#fff;padding:16px;border-radius:8px 8px 0 0">
        <b style="color:#c9a84c">Operations Complaint — Action Required</b>
      </div>
      <div style="padding:16px;border:1px solid #ddd;border-top:none">
        <p>A new complaint was registered via the <b>Operations Complaints Form</b>. Please respond to the client.</p>
        ${detailTable}
        <p style="font-size:12px;color:#64748b;margin-top:14px"><a href="https://www.agilegroup-digital.co.in/mis-complaints">Open MIS Complaints</a></p>
      </div>
    </div>`,
  })

  let thankYouSent = false
  const reporterEmail = String(complaint.contactEmail ?? '').trim()
  if (reporterEmail.includes('@')) {
    const thankYou = await sendSuiteEmail(resend, {
      from,
      to: [reporterEmail],
      subject: `Thank you — Complaint ${complaint.code} registered — Agile Security Force`,
      html: `<div style="font-family:Arial,sans-serif;max-width:640px;color:#111">
        <div style="background:linear-gradient(135deg,#14224f,#1d4ed8);color:#fff;padding:20px;border-radius:10px 10px 0 0;text-align:center">
          <b style="font-size:20px;color:#fde68a">Thank You</b>
          <div style="font-size:14px;margin-top:8px">Your complaint has been received</div>
        </div>
        <div style="padding:20px;border:1px solid #ddd;border-top:none;text-align:center">
          <p style="font-size:15px">Dear ${esc(complaint.reportedBy || 'Sir/Madam')},</p>
          <p>We have registered your complaint. Please save your <b>Complaint Code</b> below.</p>
          <div style="background:#fefce8;border:2px solid #c9a84c;border-radius:10px;padding:16px;margin:18px 0">
            <div style="font-size:12px;color:#64748b">YOUR COMPLAINT CODE</div>
            <div style="font-size:26px;font-weight:800;color:#b45309;letter-spacing:1px">${esc(complaint.code)}</div>
            <div style="font-size:13px;color:#64748b;margin-top:6px">${esc(fmtIst(complaint.registeredAt))}</div>
          </div>
          <p><b>${esc(branchName)}</b> branch will respond to you.</p>
        </div>
      </div>`,
    })
    thankYouSent = !thankYou.error
  }

  if (branchMail.error) return { ok: false, error: branchMail.error.message, thankYouSent }
  return { ok: true, branchSent: true, thankYouSent }
}

/** WhatsApp first (always), then email (if configured). */
export async function sendComplaintThankYouMail(complaint: MisComplaint, branchName: string) {
  const whatsapp = await sendComplaintWhatsApp(complaint, branchName)
  const email = await sendComplaintEmails(complaint, branchName)
  return { ok: true, whatsapp, email }
}
