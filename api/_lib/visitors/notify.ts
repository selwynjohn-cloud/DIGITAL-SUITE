/**
 * AVM SMS + host mail. Fast2SMS and Resend only — no Twilio, no WhatsApp logout.
 */
import { Resend } from 'resend'
import { pinMailFrom, pinMailReplyTo, sendSuiteEmail } from '../suite-mail.js'
import { suiteAppOpenPageFooterInlineHtml } from '../suite-app-footer.js'
import { guardsSendWhatsAppPing } from '../guards/whatsapp-send.js'
import type { AvmVisit } from './store.js'

const PUBLIC_BASE = 'https://www.agilegroup-digital.co.in'

export function inviteUrl(token: string): string {
  return `${PUBLIC_BASE}/visit/${encodeURIComponent(token)}`
}

function mobile10(raw: string): string {
  const d = String(raw || '').replace(/\D/g, '')
  if (d.length === 10) return d
  if (d.length === 12 && d.startsWith('91')) return d.slice(2)
  return ''
}

export async function sendAvmUserPinWhatsApp(opts: {
  mobile: string
  name: string
  pin: string
  clientName: string
  kind: 'staff' | 'guard'
}): Promise<{ ok: boolean; error?: string }> {
  const numbers = mobile10(opts.mobile)
  if (!numbers) return { ok: false, error: 'Need a 10-digit mobile for WhatsApp.' }
  const door = opts.kind === 'guard' ? 'Guards' : 'Staff'
  const text =
    `Visitor Management — ${String(opts.clientName || '').slice(0, 60)}\n` +
    `Hello ${String(opts.name || 'Sir / Madam').slice(0, 40)},\n` +
    `Your login PIN is ${opts.pin}\n` +
    `Open the company link → ${door} door → your name and this PIN.\n` +
    `Do not share this PIN.\n` +
    `Agile Security Force Private Limited`
  const wa = await guardsSendWhatsAppPing(numbers, text)
  if (wa.ok) return { ok: true }
  const sms = await sendAvmSms(
    numbers,
    `Visitor Management PIN ${opts.pin} for ${door} door. Do not share. Agile.`,
  )
  if (sms.ok) return { ok: true }
  return { ok: false, error: wa.error || sms.error || 'WhatsApp could not go.' }
}

export async function sendAvmGateShiftPinWhatsApp(opts: {
  mobile: string
  gateName: string
  shift: string
  pin: string
  clientName: string
}): Promise<{ ok: boolean; error?: string }> {
  const numbers = mobile10(opts.mobile)
  if (!numbers) return { ok: false, error: 'Need a 10-digit mobile for WhatsApp.' }
  const text =
    `Visitor Management — ${String(opts.clientName || '').slice(0, 60)}\n` +
    `Gate: ${String(opts.gateName || '').slice(0, 40)}\n` +
    `Shift: ${String(opts.shift || '').slice(0, 40)}\n` +
    `Your login PIN is ${opts.pin}\n` +
    `Enter this PIN to login, and again each time you issue a Gate pass.\n` +
    `This PIN changes every shift. Do not share.\n` +
    `Agile Security Force Private Limited`
  const wa = await guardsSendWhatsAppPing(numbers, text)
  if (wa.ok) return { ok: true }
  const sms = await sendAvmSms(numbers, `Visitors Pass PIN ${opts.pin} for ${opts.gateName} ${opts.shift}. Changes every shift.`)
  if (sms.ok) return { ok: true }
  return { ok: false, error: wa.error || sms.error || 'WhatsApp could not go.' }
}

export async function sendAvmSms(mobile: string, message: string): Promise<{ ok: boolean; error?: string }> {
  const numbers = mobile10(mobile)
  if (!numbers) return { ok: false, error: 'Need a 10-digit mobile' }
  const text = String(message || '').replace(/\b\d{4}\s?\d{4}\s?\d{4}\b/g, '[redacted]').slice(0, 240)
  const apiKey = process.env.FAST2SMS_API_KEY
  if (!apiKey) {
    if (process.env.NODE_ENV === 'production') return { ok: false, error: 'SMS not configured' }
    console.log(`[DEV] AVM SMS +91${numbers}: ${text}`)
    return { ok: true }
  }
  try {
    const response = await fetch('https://www.fast2sms.com/dev/bulkV2', {
      method: 'POST',
      headers: { authorization: apiKey, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        route: 'q',
        message: text,
        language: 'english',
        flash: 0,
        numbers,
      }),
    })
    if (!response.ok) {
      const err = await response.text()
      return { ok: false, error: err.slice(0, 120) }
    }
    return { ok: true }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'SMS failed' }
  }
}

export async function sendInviteSms(visit: AvmVisit): Promise<{ ok: boolean; error?: string }> {
  return sendAvmSms(
    visit.visitorMobile,
    `Agile Visitors: Please complete your visit form for ${visit.buildingName} on ${visit.visitDate}. ${inviteUrl(visit.token)}`,
  )
}

export async function sendPassSms(visit: AvmVisit): Promise<{ ok: boolean; error?: string }> {
  return sendAvmSms(
    visit.visitorMobile,
    `Agile Visitors: Approved for ${visit.buildingName}. Pass ${visit.passCode}. Show this at the gate. ${inviteUrl(visit.token)}`,
  )
}

export async function sendEscortSms(visit: AvmVisit): Promise<{ ok: boolean; error?: string }> {
  if (!visit.escortRequired || !visit.escortMobile) return { ok: true }
  return sendAvmSms(
    visit.escortMobile,
    `Agile Visitors: Your visitor has arrived at ${visit.buildingName}. Please meet them at the gate.`,
  )
}

export async function sendHostApproveMail(visit: AvmVisit): Promise<{ ok: boolean; error?: string }> {
  const to = String(visit.hostEmail || '').trim().toLowerCase()
  if (!to.includes('@')) return { ok: true }
  const apiKey = process.env.RESEND_API_KEY?.trim()
  if (!apiKey) return { ok: false, error: 'Email not configured' }
  const resend = new Resend(apiKey)
  const name = visit.visitorName || 'Visitor'
  const html = `<div style="font-family:Segoe UI,Arial,sans-serif;color:#0f172a">
  <p>Dear ${esc(visit.hostName || 'Host')},</p>
  <p>A visitor has been <b>approved</b> for your meeting.</p>
  <table style="border-collapse:collapse;font-size:14px">
    <tr><td style="padding:4px 10px 4px 0;color:#64748b">Visitor</td><td>${esc(name)}</td></tr>
    <tr><td style="padding:4px 10px 4px 0;color:#64748b">Building</td><td>${esc(visit.buildingName)}</td></tr>
    <tr><td style="padding:4px 10px 4px 0;color:#64748b">Date</td><td>${esc(visit.visitDate)} ${esc(visit.windowFrom)}–${esc(visit.windowTo)}</td></tr>
    <tr><td style="padding:4px 10px 4px 0;color:#64748b">Pass</td><td>${esc(visit.passCode)}</td></tr>
  </table>
  <p style="color:#64748b;font-size:12px">This mail has no identity-card numbers. Visitor details are wiped after the visit closes.</p>
  ${suiteAppOpenPageFooterInlineHtml()}
</div>`
  const sent = await sendSuiteEmail(resend, {
    from: pinMailFrom(),
    to,
    replyTo: pinMailReplyTo(),
    subject: `Visitor approved — ${visit.buildingName}`,
    html,
  })
  if (sent.error) return { ok: false, error: sent.error.message }
  return { ok: true }
}

function esc(s: string): string {
  return String(s ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
}

export function welcomeClientMailHtml(opts: {
  staffName: string
  clientName: string
  link: string
}): string {
  const link = String(opts.link || '').trim()
  const linkLine = link || 'The unique link will appear after Save.'
  const href = link.indexOf('http') === 0 ? esc(link) : '#'
  return `<div style="font-family:Segoe UI,Arial,sans-serif;color:#0f172a;max-width:640px;margin:0 auto">
  <div style="text-align:center;padding:18px 12px 12px;border-bottom:3px solid #c9a84c">
    <img src="https://www.agilegroup-digital.co.in/agile-logo-clear.png" alt="Agile" height="52" style="background:transparent;display:block;margin:0 auto">
    <div style="font-size:16px;font-weight:800;color:#14224f;margin-top:8px">Agile Security Force Private Limited</div>
    <div style="font-size:13px;color:#0ea5e9;font-weight:700">Visitor Management</div>
    <div style="font-size:12px;color:#64748b;margin-top:4px">Welcome</div>
  </div>
  <div style="padding:18px 8px 8px">
    <p>Dear ${esc(opts.staffName || 'Sir / Madam')},</p>
    <p>Welcome to <b>Agile Visitors Management</b>.</p>
    <p>Your company <b>${esc(opts.clientName || '—')}</b> is now registered. You may use this unique link to open your Staff door and Gate door.</p>
    <p><a href="${href}">${esc(linkLine)}</a></p>
    <p>Please keep this letter. Do not share the link with anyone who is not from your company.</p>
    <p>If you need help, write to us or speak to your Agile branch.</p>
    <p>With regards,<br><b>Agile Security Force Private Limited</b><br>Visitor Management</p>
  </div>
  ${suiteAppOpenPageFooterInlineHtml()}
</div>`
}

export async function sendClientPortalLinkMail(opts: {
  to: string
  clientName: string
  staffName: string
  link: string
}): Promise<{ ok: boolean; error?: string }> {
  const to = String(opts.to || '').trim().toLowerCase()
  if (!to.includes('@')) return { ok: false, error: 'Email Id is required.' }
  const apiKey = process.env.RESEND_API_KEY?.trim()
  if (!apiKey) return { ok: false, error: 'Email not configured' }
  const resend = new Resend(apiKey)
  const html = welcomeClientMailHtml(opts)
  const sent = await sendSuiteEmail(resend, {
    from: pinMailFrom(),
    to,
    replyTo: pinMailReplyTo(),
    subject: `Welcome — Agile Visitors Management — ${opts.clientName}`,
    html,
  })
  if (sent.error) return { ok: false, error: sent.error.message }
  return { ok: true }
}

export function serviceComplaintMailHtml(opts: {
  ticketNo: string
  clientName: string
  receivedFrom: string
  issue: string
  ymd: string
  time: string
  closedYmd: string
  closedTime: string
  respondTime: string
}): string {
  return `<div style="font-family:Segoe UI,Arial,sans-serif;color:#0f172a;max-width:640px;margin:0 auto">
  <div style="text-align:center;padding:18px 12px 12px;border-bottom:3px solid #c9a84c">
    <img src="https://www.agilegroup-digital.co.in/agile-logo-clear.png" alt="Agile" height="52" style="background:transparent;display:block;margin:0 auto">
    <div style="font-size:16px;font-weight:800;color:#14224f;margin-top:8px">Agile Security Force Private Limited</div>
    <div style="font-size:13px;color:#0ea5e9;font-weight:700">Visitor Management</div>
    <div style="font-size:12px;color:#64748b;margin-top:4px">Service Complaint — Completion</div>
  </div>
  <div style="padding:18px 8px 8px">
    <p>Dear ${esc(opts.receivedFrom || 'Sir / Madam')},</p>
    <p>Your service complaint has been <b>completed</b>. Please find the details below.</p>
    <table style="border-collapse:collapse;font-size:14px;width:100%">
      <tr><td style="padding:6px 10px 6px 0;color:#64748b;width:160px">Token No.</td><td>${esc(opts.ticketNo)}</td></tr>
      <tr><td style="padding:6px 10px 6px 0;color:#64748b">Client Name</td><td>${esc(opts.clientName)}</td></tr>
      <tr><td style="padding:6px 10px 6px 0;color:#64748b">Date and time</td><td>${esc(opts.ymd)} ${esc(opts.time)}</td></tr>
      <tr><td style="padding:6px 10px 6px 0;color:#64748b">Nature of complaint</td><td>${esc(opts.issue)}</td></tr>
      <tr><td style="padding:6px 10px 6px 0;color:#64748b">Completed on</td><td>${esc(opts.closedYmd)} ${esc(opts.closedTime)}</td></tr>
      <tr><td style="padding:6px 10px 6px 0;color:#64748b">Respond time</td><td>${esc(opts.respondTime || '—')}</td></tr>
    </table>
    <p>Thank you for writing to Visitor Management.</p>
  </div>
  ${suiteAppOpenPageFooterInlineHtml()}
</div>`
}

export async function sendComplaintCompletionMail(opts: {
  to: string
  ticketNo: string
  clientName: string
  receivedFrom?: string
  issue: string
  ymd?: string
  time?: string
  closedYmd: string
  closedTime: string
  respondTime?: string
}): Promise<{ ok: boolean; error?: string }> {
  const to = String(opts.to || '').trim().toLowerCase()
  if (!to.includes('@')) return { ok: false, error: 'Email Id is required.' }
  const apiKey = process.env.RESEND_API_KEY?.trim()
  if (!apiKey) return { ok: false, error: 'Email not configured' }
  const resend = new Resend(apiKey)
  const html = serviceComplaintMailHtml({
    ticketNo: opts.ticketNo,
    clientName: opts.clientName,
    receivedFrom: opts.receivedFrom || '',
    issue: opts.issue,
    ymd: opts.ymd || '',
    time: opts.time || '',
    closedYmd: opts.closedYmd,
    closedTime: opts.closedTime,
    respondTime: opts.respondTime || '',
  })
  const sent = await sendSuiteEmail(resend, {
    from: pinMailFrom(),
    to,
    replyTo: pinMailReplyTo(),
    subject: `Visitor Management — Service Complaint ${opts.ticketNo} completed`,
    html,
  })
  if (sent.error) return { ok: false, error: sent.error.message }
  return { ok: true }
}

export async function sendVisitorShareMail(opts: {
  to: string
  clientName: string
  visitorName: string
  visitorCompany: string
  visitorMobile: string
  inTime: string
  outTime: string
  hoursSpent: string
  previousVisits: number
}): Promise<{ ok: boolean; error?: string }> {
  const to = String(opts.to || '').trim().toLowerCase()
  if (!to.includes('@')) return { ok: false, error: 'Enter the client email Id to share.' }
  const apiKey = process.env.RESEND_API_KEY?.trim()
  if (!apiKey) return { ok: false, error: 'Email not configured' }
  const resend = new Resend(apiKey)
  const html = `<div style="font-family:Segoe UI,Arial,sans-serif;color:#0f172a">
  <p>Visitor Management — visit details for <b>${esc(opts.clientName)}</b>.</p>
  <table style="border-collapse:collapse;font-size:14px">
    <tr><td style="padding:4px 10px 4px 0;color:#64748b">Name of visitor</td><td>${esc(opts.visitorName)}</td></tr>
    <tr><td style="padding:4px 10px 4px 0;color:#64748b">Company name</td><td>${esc(opts.visitorCompany || '—')}</td></tr>
    <tr><td style="padding:4px 10px 4px 0;color:#64748b">Contact number</td><td>${esc(opts.visitorMobile)}</td></tr>
    <tr><td style="padding:4px 10px 4px 0;color:#64748b">In time</td><td>${esc(opts.inTime || '—')}</td></tr>
    <tr><td style="padding:4px 10px 4px 0;color:#64748b">Out time</td><td>${esc(opts.outTime || '—')}</td></tr>
    <tr><td style="padding:4px 10px 4px 0;color:#64748b">Hours spent in premises</td><td>${esc(opts.hoursSpent)}</td></tr>
    <tr><td style="padding:4px 10px 4px 0;color:#64748b">Previous visits</td><td>${opts.previousVisits}</td></tr>
  </table>
  ${suiteAppOpenPageFooterInlineHtml()}
</div>`
  const sent = await sendSuiteEmail(resend, {
    from: pinMailFrom(),
    to,
    replyTo: pinMailReplyTo(),
    subject: `Visitor Management — ${opts.visitorName} — ${opts.clientName}`,
    html,
  })
  if (sent.error) return { ok: false, error: sent.error.message }
  return { ok: true }
}

export async function sendVisitorAnalysisMail(opts: {
  to: string
  clientName: string
  rows: Array<{
    visitorName: string
    metWhom: string
    timeSpend: string
    repeated: number
    shiftA: number
    shiftB: number
    shiftC: number
    total: number
  }>
}): Promise<{ ok: boolean; error?: string }> {
  const to = String(opts.to || '').trim().toLowerCase()
  if (!to.includes('@')) return { ok: false, error: 'Enter the client email Id to share.' }
  const apiKey = process.env.RESEND_API_KEY?.trim()
  if (!apiKey) return { ok: false, error: 'Email not configured' }
  const resend = new Resend(apiKey)
  const body = (opts.rows || [])
    .map(
      (r, i) =>
        `<tr><td style="border:1px solid #cbd5e1;padding:6px">${i + 1}</td><td style="border:1px solid #cbd5e1;padding:6px">${esc(r.visitorName)}</td><td style="border:1px solid #cbd5e1;padding:6px">${esc(r.metWhom)}</td><td style="border:1px solid #cbd5e1;padding:6px">${esc(r.timeSpend)}</td><td style="border:1px solid #cbd5e1;padding:6px">${r.repeated}</td><td style="border:1px solid #cbd5e1;padding:6px">${r.shiftA || ''}</td><td style="border:1px solid #cbd5e1;padding:6px">${r.shiftB || ''}</td><td style="border:1px solid #cbd5e1;padding:6px">${r.shiftC || ''}</td><td style="border:1px solid #cbd5e1;padding:6px">${r.total}</td></tr>`,
    )
    .join('') || `<tr><td colspan="9" style="border:1px solid #cbd5e1;padding:6px">No visitors yet for this client.</td></tr>`
  const html = `<div style="font-family:Segoe UI,Arial,sans-serif;color:#0f172a">
  <p>Visitor analysis for <b>${esc(opts.clientName)}</b>.</p>
  <table style="border-collapse:collapse;font-size:13px;width:100%">
    <tr>
      <th style="border:1px solid #cbd5e1;padding:6px;text-align:left">Sl. no.</th>
      <th style="border:1px solid #cbd5e1;padding:6px;text-align:left">Visitor Name</th>
      <th style="border:1px solid #cbd5e1;padding:6px;text-align:left">Met whom</th>
      <th style="border:1px solid #cbd5e1;padding:6px;text-align:left">Time spend</th>
      <th style="border:1px solid #cbd5e1;padding:6px;text-align:left">Repeated visit no</th>
      <th style="border:1px solid #cbd5e1;padding:6px;text-align:left">A shift</th>
      <th style="border:1px solid #cbd5e1;padding:6px;text-align:left">B shift</th>
      <th style="border:1px solid #cbd5e1;padding:6px;text-align:left">C shift</th>
      <th style="border:1px solid #cbd5e1;padding:6px;text-align:left">Total</th>
    </tr>
    ${body}
  </table>
  ${suiteAppOpenPageFooterInlineHtml()}
</div>`
  const sent = await sendSuiteEmail(resend, {
    from: pinMailFrom(),
    to,
    replyTo: pinMailReplyTo(),
    subject: `Visitor analysis — ${opts.clientName}`,
    html,
  })
  if (sent.error) return { ok: false, error: sent.error.message }
  return { ok: true }
}

export async function sendGuardShareMail(opts: {
  to: string
  clientName: string
  ymd: string
  loginTime: string
  logoutTime: string
  visitorsHandled: number
}): Promise<{ ok: boolean; error?: string }> {
  const to = String(opts.to || '').trim().toLowerCase()
  if (!to.includes('@')) return { ok: false, error: 'Client email is required to share.' }
  const apiKey = process.env.RESEND_API_KEY?.trim()
  if (!apiKey) return { ok: false, error: 'Email not configured' }
  const resend = new Resend(apiKey)
  const html = `<div style="font-family:Segoe UI,Arial,sans-serif;color:#0f172a">
  <p>Guards Portal — visitors handled at <b>${esc(opts.clientName)}</b>.</p>
  <table style="border-collapse:collapse;font-size:14px">
    <tr><td style="padding:4px 10px 4px 0;color:#64748b">Date</td><td>${esc(opts.ymd)}</td></tr>
    <tr><td style="padding:4px 10px 4px 0;color:#64748b">Login time</td><td>${esc(opts.loginTime)}</td></tr>
    <tr><td style="padding:4px 10px 4px 0;color:#64748b">Logout</td><td>${esc(opts.logoutTime)}</td></tr>
    <tr><td style="padding:4px 10px 4px 0;color:#64748b">Total Visitors Handled</td><td>${opts.visitorsHandled}</td></tr>
  </table>
  ${suiteAppOpenPageFooterInlineHtml()}
</div>`
  const sent = await sendSuiteEmail(resend, {
    from: pinMailFrom(),
    to,
    replyTo: pinMailReplyTo(),
    subject: `Guards Portal — ${opts.clientName} ${opts.ymd}`,
    html,
  })
  if (sent.error) return { ok: false, error: sent.error.message }
  return { ok: true }
}
