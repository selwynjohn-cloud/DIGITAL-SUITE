import { Resend } from 'resend'
import { sendSuiteEmail } from '../suite-mail.js'
import { hasPinStorage, pinStorageStatus } from '../pin-store.js'

export type HealthCheck = {
  id: string
  label: string
  ok: boolean
  detail: string
}

const SITE =
  process.env.HEALTH_CHECK_BASE_URL?.trim() ||
  (process.env.VERCEL_URL?.trim()
    ? `https://${process.env.VERCEL_URL}`
    : 'https://www.agilegroup-digital.co.in')

function alertInbox() {
  return (
    process.env.ADMIN_NOTIFY_EMAIL?.trim() ||
    process.env.MIS_DIRECTOR_EMAIL?.trim() ||
    'selwyn.john@gmail.com'
  )
}

function mailFrom() {
  return (
    process.env.EMAIL_FROM?.trim() ||
    process.env.PIN_EMAIL_FROM?.trim() ||
    'Agile Security Force <onboarding@resend.dev>'
  )
}

async function fetchCheck(
  path: string,
  needle?: string,
  timeoutMs = 12000,
): Promise<{ ok: boolean; detail: string }> {
  const url = path.startsWith('http') ? path : `${SITE.replace(/\/$/, '')}${path}`
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), timeoutMs)
  try {
    const res = await fetch(url, {
      method: 'GET',
      signal: ctrl.signal,
      headers: { 'User-Agent': 'AgileSuite-Health/1.0' },
      redirect: 'follow',
    })
    const text = await res.text()
    if (!res.ok) {
      return { ok: false, detail: `HTTP ${res.status} at ${url}` }
    }
    if (needle && !text.includes(needle)) {
      return { ok: false, detail: `Page loaded but missing "${needle}" (${url})` }
    }
    return { ok: true, detail: `OK (${res.status})` }
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Request failed'
    return { ok: false, detail: `${url} — ${msg}` }
  } finally {
    clearTimeout(timer)
  }
}

export async function runSuiteHealthChecks(): Promise<HealthCheck[]> {
  const checks: HealthCheck[] = []

  const pages: Array<{ id: string; label: string; path: string; needle: string }> = [
    { id: 'suite', label: 'Command Centre', path: '/', needle: 'Command Centre' },
    { id: 'guards', label: 'Agile Guards', path: '/guards', needle: 'Agile Guards' },
    { id: 'mis', label: 'Agile MIS', path: '/mis', needle: 'Agile MIS' },
    { id: 'crm', label: 'Agile CRM', path: '/crm', needle: 'Agile CRM' },
    { id: 'mis-report', label: 'MIS Branch Report', path: '/mis-report', needle: 'MIS' },
    { id: 'guards-feedback', label: 'Guards Feedback', path: '/guards/feedback?code=HEALTH', needle: 'Feedback' },
  ]

  for (const p of pages) {
    const r = await fetchCheck(p.path, p.needle)
    checks.push({ id: p.id, label: p.label, ok: r.ok, detail: r.detail })
  }

  const pinOk = hasPinStorage()
  const pinSt = pinStorageStatus()
  checks.push({
    id: 'pin-storage',
    label: 'Login PIN storage (Redis)',
    ok: pinOk,
    detail: pinOk
      ? 'OK'
      : 'missing' in pinSt
        ? `Missing: ${pinSt.missing.join(', ')}`
        : 'Not configured',
  })

  const apiKey = process.env.RESEND_API_KEY?.trim()
  checks.push({
    id: 'email',
    label: 'Email service (Resend)',
    ok: !!apiKey,
    detail: apiKey ? 'OK' : 'RESEND_API_KEY not set — OTP emails will fail',
  })

  return checks
}

async function redisGet(key: string): Promise<string | null> {
  const url = process.env.UPSTASH_REDIS_REST_URL?.trim()
  const token = process.env.UPSTASH_REDIS_REST_TOKEN?.trim()
  if (!url || !token) return null
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(['GET', key]),
    })
    const data = (await res.json()) as { result?: string | null }
    return data.result ?? null
  } catch {
    return null
  }
}

async function redisSet(key: string, value: string, exSec: number) {
  const url = process.env.UPSTASH_REDIS_REST_URL?.trim()
  const token = process.env.UPSTASH_REDIS_REST_TOKEN?.trim()
  if (!url || !token) return
  try {
    await fetch(url, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(['SET', key, value, 'EX', exSec]),
    })
  } catch {
    /* optional */
  }
}

export async function sendHealthAlertIfNeeded(checks: HealthCheck[]) {
  const failed = checks.filter((c) => !c.ok)
  if (!failed.length) {
    await redisSet('agil:health:last_ok', new Date().toISOString(), 86400 * 7)
    return { alerted: false, failed: 0 }
  }

  const fingerprint = failed.map((f) => f.id).sort().join(',')
  const prev = await redisGet('agil:health:last_alert_fp')
  const lastAlertAt = await redisGet('agil:health:last_alert_at')
  const now = Date.now()
  const minGapMs = 60 * 60 * 1000

  if (prev === fingerprint && lastAlertAt) {
    const elapsed = now - Number(lastAlertAt)
    if (!Number.isNaN(elapsed) && elapsed < minGapMs) {
      return { alerted: false, failed: failed.length, throttled: true }
    }
  }

  const apiKey = process.env.RESEND_API_KEY?.trim()
  const to = alertInbox()
  const subject = `⚠ Agile Suite — ${failed.length} link/service issue(s) detected`
  const rows = failed
    .map(
      (f) =>
        `<tr><td style="padding:8px;border:1px solid #e2e8f0"><strong>${f.label}</strong></td><td style="padding:8px;border:1px solid #e2e8f0;color:#b91c1c">${f.detail}</td></tr>`,
    )
    .join('')
  const html = `
    <div style="font-family:Arial,sans-serif;max-width:640px;color:#1e293b">
      <p style="color:#b45309;font-weight:bold;font-size:12px">AGILE DIGITAL SUITE — HEALTH ALERT</p>
      <p>The automatic link check found <strong>${failed.length}</strong> problem(s) on <strong>${SITE}</strong>.</p>
      <p style="font-size:13px;color:#64748b">Time (IST): ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}</p>
      <table style="border-collapse:collapse;width:100%;font-size:13px;margin-top:16px">${rows}</table>
      <p style="font-size:12px;color:#94a3b8;margin-top:20px">This message repeats at most once per hour while the same issues remain. When all checks pass, alerts stop automatically.</p>
    </div>
  `

  if (!apiKey) {
    console.error('[health] failures', failed)
    return { alerted: false, failed: failed.length, error: 'No RESEND_API_KEY' }
  }

  const resend = new Resend(apiKey)
  const sent = await sendSuiteEmail(resend, { from: mailFrom(), to, subject, html })
  if (sent.error) {
    console.error('[health] email failed', sent.error)
    return { alerted: false, failed: failed.length, error: sent.error.message }
  }

  await redisSet('agil:health:last_alert_fp', fingerprint, 86400 * 7)
  await redisSet('agil:health:last_alert_at', String(now), 86400 * 7)
  return { alerted: true, failed: failed.length, to }
}
