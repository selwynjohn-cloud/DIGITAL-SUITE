import type { VercelRequest } from '@vercel/node'
import { waitUntil } from '@vercel/functions'

/**
 * Vercel’s clock trigger. The documented signal is User-Agent `vercel-cron/1.0`.
 * Also accept the cron headers — do not require only CRON_SECRET.
 */
export function isVercelClockRequest(req: VercelRequest): boolean {
  const ua = String(req.headers['user-agent'] ?? '')
  if (/vercel-cron/i.test(ua)) return true
  const flag = req.headers['x-vercel-cron']
  if (flag != null) {
    const v = String(Array.isArray(flag) ? flag[0] : flag).trim().toLowerCase()
    if (v && v !== '0' && v !== 'false') return true
  }
  if (req.headers['x-vercel-cron-schedule']) return true
  return false
}

export function clockWaitUntilAvailable(): boolean {
  const holder = (globalThis as Record<symbol, { get?: () => { waitUntil?: (p: Promise<unknown>) => void } }>)[
    Symbol.for('@vercel/request-context')
  ]
  return typeof holder?.get?.()?.waitUntil === 'function'
}

/**
 * Reply 200 to the clock immediately, then keep sending.
 * Vercel’s cron client drops a long request; a 155-second WhatsApp loop
 * was being killed before groups received the bulletin.
 * Returns false when this runtime has no waitUntil — caller must send inline.
 */
export function runAfterClockReply(work: Promise<unknown>): boolean {
  const guarded = work.catch((err) => {
    console.error('[pulse] clock work failed', err)
  })
  if (!clockWaitUntilAvailable()) return false
  waitUntil(guarded)
  return true
}

export function pulseHandoffSecret(): string {
  return process.env.CRON_SECRET?.trim() || process.env.PULSE_APPROVE_SECRET?.trim() || ''
}

export function isPulseHandoffRequest(req: VercelRequest): boolean {
  const expected = pulseHandoffSecret()
  if (!expected) return false
  if (String(req.headers['x-pulse-handoff'] ?? '') === expected) return true
  try {
    const u = new URL(String(req.url || ''), 'https://www.agilegroup-digital.co.in')
    const qToken = u.searchParams.get('token') || ''
    return u.searchParams.get('handoff') === '1' && qToken === expected
  } catch {
    return false
  }
}

export function pulsePublicOrigin(): string {
  return (
    process.env.PULSE_PUBLIC_ORIGIN?.trim() ||
    process.env.HEALTH_CHECK_BASE_URL?.trim() ||
    'https://www.agilegroup-digital.co.in'
  )
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms))
}

/**
 * Start the full-length WhatsApp send on a new request, then stay alive
 * a few seconds so that request actually begins. Returning 200 in 0 ms
 * was aborting the handoff — 2:00 PM and 10:00 PM never finished.
 */
export async function startPulseHandoffAndHold(): Promise<void> {
  const origin = pulsePublicOrigin()
  const token = pulseHandoffSecret()
  const handoffUrl = token
    ? `${origin}/api/pulse/cron?handoff=1&token=${encodeURIComponent(token)}`
    : `${origin}/api/pulse/cron?handoff=1`
  const bypass = process.env.VERCEL_AUTOMATION_BYPASS_SECRET?.trim()
  const work = fetch(handoffUrl, {
    headers: {
      'x-pulse-handoff': token,
      'user-agent': 'AgilePulse-Handoff/1.0',
      ...(bypass ? { 'x-vercel-protection-bypass': bypass } : {}),
    },
  }).then(async (r) => {
    const body = await r.text()
    console.log('[pulse] handoff', r.status, body.slice(0, 400))
  })
  if (runAfterClockReply(work)) {
    await Promise.race([work, sleep(5000)])
    return
  }
  await work
}
