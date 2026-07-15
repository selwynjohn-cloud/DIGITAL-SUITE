import { Resend } from 'resend'
import { isSuperAdminEmail } from './auth.js'
import { pinMailFrom, pinMailReplyTo, resolveSuiteUserName, sendSuiteEmail } from './suite-mail.js'

/** Director inbox for super-admin sign-in alerts (never the MD / sign-in email). */
function directorAlertInbox() {
  return (
    process.env.DIRECTOR_ALERT_EMAIL?.trim() ||
    process.env.MIS_DIRECTOR_EMAIL?.trim() ||
    process.env.FLEET_DIRECTOR_EMAIL?.trim() ||
    'director@agilegroup.co.in'
  )
}

export async function sendDirectorLoginAlert(opts: {
  email: string
  appTitle: string
  appId: string
  role: string
}) {
  if (!isSuperAdminEmail(opts.email)) return { ok: false, skipped: true }

  const apiKey = process.env.RESEND_API_KEY?.trim()
  if (!apiKey) return { ok: false, skipped: true }

  const from = pinMailFrom()
  const replyTo = pinMailReplyTo()
  const when = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })
  const name = await resolveSuiteUserName(opts.email)
  const to = directorAlertInbox()

  const who =
    opts.email === 'md@agilegroup.co.in'
      ? 'Managing Director'
      : opts.email === 'director@agilegroup.co.in'
        ? 'Director'
        : 'Super-admin'
  const subject = `Sign-in alert — ${who} — ${opts.appTitle}`
  const html = `
    <div style="font-family:Arial,sans-serif;max-width:560px;color:#111">
      <div style="background:#7f1d1d;color:#fff;padding:14px 18px;border-radius:8px 8px 0 0">
        <b>Sign-in alert — ${who} signed in</b>
      </div>
      <div style="padding:18px;border:1px solid #ddd;border-top:none;border-radius:0 0 8px 8px">
        <p>Someone signed in on the Agile Digital Suite using a <b>Master PIN</b> account.</p>
        <p>If this was not expected, contact IT immediately.</p>
        <p><b>Name:</b> ${name}<br>
        <b>Email used:</b> ${opts.email}<br>
        <b>Application:</b> ${opts.appTitle} (${opts.appId})<br>
        <b>Portal:</b> ${opts.role}<br>
        <b>Time (IST):</b> ${when}</p>
        <p style="font-size:12px;color:#64748b">Agile Digital Suite — security alert</p>
      </div>
    </div>`

  try {
    const resend = new Resend(apiKey)
    await sendSuiteEmail(resend, { from, to, replyTo, subject, html })
    return { ok: true }
  } catch {
    return { ok: false }
  }
}
