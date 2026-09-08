/**
 * IT must not receive copies of other people's logins / PINs / suite activity.
 * When IT itself signs in or changes data, Director is notified by email.
 */
import { Resend } from 'resend'
import { normaliseEmail } from './auth.js'
import { pinMailFrom, pinMailReplyTo, resolveSuiteUserName, sendSuiteEmail } from './suite-mail.js'

/** Company IT mailbox(es) — monitored for their own activity only. */
export function getItSuiteEmails(): string[] {
  const fromEnv = (process.env.IT_SUITE_EMAILS ?? process.env.IT_EMAIL ?? '')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean)
  return Array.from(new Set(['it@agilegroup.co.in', ...fromEnv]))
}

export function isItSuiteEmail(email: string): boolean {
  return getItSuiteEmails().includes(normaliseEmail(email))
}

function directorAlertInbox(): string {
  return (
    process.env.DIRECTOR_ALERT_EMAIL?.trim() ||
    process.env.MIS_DIRECTOR_EMAIL?.trim() ||
    process.env.FLEET_DIRECTOR_EMAIL?.trim() ||
    'director@agilegroup.co.in'
  )
    .trim()
    .toLowerCase()
}

function esc(s: unknown): string {
  return String(s ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
}

async function sendDirectorItAlert(opts: {
  subject: string
  headline: string
  email: string
  appTitle: string
  appId: string
  roleOrAction: string
  detail?: string
}): Promise<{ ok: boolean; skipped?: boolean }> {
  const apiKey = process.env.RESEND_API_KEY?.trim()
  if (!apiKey) return { ok: false, skipped: true }

  const to = directorAlertInbox()
  if (!to.includes('@')) return { ok: false, skipped: true }

  const when = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })
  const name = await resolveSuiteUserName(opts.email)
  const detailRow = opts.detail
    ? `<tr><td style="padding:8px 10px;border-bottom:1px solid #e2e8f0;color:#64748b;width:140px">Detail</td><td style="padding:8px 10px;border-bottom:1px solid #e2e8f0">${esc(opts.detail)}</td></tr>`
    : ''

  const html = `
    <div style="font-family:Arial,sans-serif;max-width:560px;color:#111">
      <div style="background:#0f766e;color:#fff;padding:14px 18px;border-radius:8px 8px 0 0">
        <b>${esc(opts.headline)}</b>
      </div>
      <div style="padding:18px;border:1px solid #ddd;border-top:none;border-radius:0 0 8px 8px">
        <p>IT activity on the Agile Digital Suite — for Director review only.</p>
        <table style="width:100%;border-collapse:collapse;font-size:14px">
          <tr><td style="padding:8px 10px;border-bottom:1px solid #e2e8f0;color:#64748b">Name</td><td style="padding:8px 10px;border-bottom:1px solid #e2e8f0">${esc(name)}</td></tr>
          <tr><td style="padding:8px 10px;border-bottom:1px solid #e2e8f0;color:#64748b">Email</td><td style="padding:8px 10px;border-bottom:1px solid #e2e8f0">${esc(opts.email)}</td></tr>
          <tr><td style="padding:8px 10px;border-bottom:1px solid #e2e8f0;color:#64748b">Application</td><td style="padding:8px 10px;border-bottom:1px solid #e2e8f0">${esc(opts.appTitle)} (${esc(opts.appId)})</td></tr>
          <tr><td style="padding:8px 10px;border-bottom:1px solid #e2e8f0;color:#64748b">Action</td><td style="padding:8px 10px;border-bottom:1px solid #e2e8f0">${esc(opts.roleOrAction)}</td></tr>
          ${detailRow}
          <tr><td style="padding:8px 10px;color:#64748b">Time (IST)</td><td style="padding:8px 10px">${esc(when)}</td></tr>
        </table>
        <p style="font-size:12px;color:#64748b;margin-top:16px">Agile Digital Suite — IT activity alert (Director only)</p>
      </div>
    </div>`

  try {
    const resend = new Resend(apiKey)
    const result = await sendSuiteEmail(resend, {
      from: pinMailFrom(),
      to,
      replyTo: pinMailReplyTo(),
      subject: opts.subject,
      html,
      skipDirectorCc: true,
    })
    return { ok: !result.error }
  } catch {
    return { ok: false }
  }
}

/** Fire when IT signs in successfully. */
export async function notifyDirectorOfItLogin(opts: {
  email: string
  appTitle: string
  appId: string
  role: string
}) {
  if (!isItSuiteEmail(opts.email)) return { ok: false, skipped: true }
  return sendDirectorItAlert({
    subject: `IT sign-in — ${opts.appTitle}`,
    headline: 'IT signed in',
    email: normaliseEmail(opts.email),
    appTitle: opts.appTitle,
    appId: opts.appId,
    roleOrAction: opts.role,
  })
}

/** Fire when IT saves / deletes / publishes suite data. */
export async function notifyDirectorOfItChange(opts: {
  email: string
  appTitle: string
  appId: string
  action: string
  detail?: string
}) {
  if (!isItSuiteEmail(opts.email)) return { ok: false, skipped: true }
  return sendDirectorItAlert({
    subject: `IT change — ${opts.appTitle} — ${opts.action}`,
    headline: 'IT made a change',
    email: normaliseEmail(opts.email),
    appTitle: opts.appTitle,
    appId: opts.appId,
    roleOrAction: opts.action,
    detail: opts.detail,
  })
}

/** Non-blocking wrapper for data APIs. */
export function noteItSuiteChange(
  email: string | undefined | null,
  appTitle: string,
  appId: string,
  action: string,
  detail?: string,
) {
  const em = normaliseEmail(email || '')
  if (!em || !isItSuiteEmail(em)) return
  void notifyDirectorOfItChange({
    email: em,
    appTitle,
    appId,
    action,
    detail,
  }).catch(() => {})
}
