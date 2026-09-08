import { Resend } from 'resend'
import { normaliseEmail } from './auth.js'
import { isItSuiteEmail } from './it-activity-alert.js'
import { pinMailFrom, pinMailReplyTo, resolveSuiteUserName, sendSuiteEmail } from './suite-mail.js'

/** Director inbox for login / PIN / access alerts — never IT or anyone else. */
function directorAlertInbox() {
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

async function redisThrottle(key: string, ttlSeconds: number): Promise<boolean> {
  const url = process.env.UPSTASH_REDIS_REST_URL?.trim()
  const token = process.env.UPSTASH_REDIS_REST_TOKEN?.trim()
  if (!url || !token) return false
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(['SET', key, new Date().toISOString(), 'EX', ttlSeconds, 'NX']),
    })
    const d = (await res.json()) as { result?: unknown }
    return d?.result !== 'OK'
  } catch {
    return false
  }
}

async function sendDirectorOnlyAlert(opts: {
  subject: string
  headline: string
  intro: string
  email: string
  appTitle: string
  appId: string
  role: string
  kind: 'pin' | 'access'
}): Promise<{ ok: boolean; skipped?: boolean }> {
  const em = normaliseEmail(opts.email)
  const to = directorAlertInbox()
  if (!to.includes('@')) return { ok: false, skipped: true }
  // No need to alert Director about their own mailbox activity.
  if (em === to) return { ok: false, skipped: true }

  const apiKey = process.env.RESEND_API_KEY?.trim()
  if (!apiKey) return { ok: false, skipped: true }

  const throttleKey = `suite:dir-alert:${opts.kind}:${em}:${opts.appId || 'suite'}`
  if (await redisThrottle(throttleKey, 5 * 60)) {
    return { ok: true, skipped: true }
  }

  const when = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })
  const name = await resolveSuiteUserName(em)
  const accountNote = isItSuiteEmail(em) ? ' (IT account)' : ''

  const html = `
    <div style="font-family:Arial,sans-serif;max-width:560px;color:#111">
      <div style="background:#0f172a;color:#fff;padding:14px 18px;border-radius:8px 8px 0 0">
        <b>${esc(opts.headline)}</b>
      </div>
      <div style="padding:18px;border:1px solid #ddd;border-top:none;border-radius:0 0 8px 8px">
        <p>${esc(opts.intro)}</p>
        <p><b>Name:</b> ${esc(name)}${esc(accountNote)}<br>
        <b>Email used:</b> ${esc(em)}<br>
        <b>Application:</b> ${esc(opts.appTitle)} (${esc(opts.appId)})<br>
        <b>Portal:</b> ${esc(opts.role)}<br>
        <b>Time (IST):</b> ${esc(when)}</p>
        <p style="font-size:12px;color:#64748b">Agile Digital Suite — Director only (not copied to IT or anyone else)</p>
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

/**
 * Login PIN was emailed to a user — report the event to Director only.
 * Never includes the PIN digits.
 */
export async function notifyDirectorOfPinIssued(opts: {
  email: string
  appTitle: string
  appId: string
  role: string
}) {
  return sendDirectorOnlyAlert({
    kind: 'pin',
    subject: `Login PIN sent — ${opts.appTitle} — ${normaliseEmail(opts.email)}`,
    headline: 'Login PIN sent',
    intro: 'A login PIN was emailed to this person for suite access. The PIN itself is not included here.',
    email: opts.email,
    appTitle: opts.appTitle,
    appId: opts.appId,
    role: opts.role,
  })
}

/**
 * Someone signed into an application — report to Director only.
 */
export async function notifyDirectorOfAppAccess(opts: {
  email: string
  appTitle: string
  appId: string
  role: string
}) {
  const em = normaliseEmail(opts.email)
  const who = isItSuiteEmail(em)
    ? 'IT'
    : em === 'md@agilegroup.co.in'
      ? 'Managing Director'
      : em === 'director@agilegroup.co.in' || em === 'selwyn.john@gmail.com'
        ? 'Director'
        : 'User'
  return sendDirectorOnlyAlert({
    kind: 'access',
    subject: `App access — ${who} — ${opts.appTitle}`,
    headline: `${who} signed in`,
    intro: 'Someone signed in to an Agile Digital Suite application.',
    email: opts.email,
    appTitle: opts.appTitle,
    appId: opts.appId,
    role: opts.role,
  })
}

/** @deprecated use notifyDirectorOfAppAccess — kept for older call sites */
export async function sendDirectorLoginAlert(opts: {
  email: string
  appTitle: string
  appId: string
  role: string
}) {
  return notifyDirectorOfAppAccess(opts)
}
