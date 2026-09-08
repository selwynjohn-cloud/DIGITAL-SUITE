/**
 * Recruitment cron — 5:00 PM IST Daily registered candidates (SecurityJob.co.in).
 * welcome-daily = day-before welcome WhatsApp (Whapi only).
 */

import type { VercelRequest, VercelResponse } from '@vercel/node'
import { sendDailySecurityJobRegistrationsMail } from '../_lib/recruitment/daily-registrations-mail.js'
import { sendSjEveWelcomeMessages } from '../_lib/recruitment/sj-eve-welcome.js'
import { isVercelClockRequest } from '../_lib/pulse/clock.js'
import { ensureSuiteDailyReports } from '../_lib/suite-daily-delivery.js'

export const maxDuration = 60

function cronAllowed(req: VercelRequest) {
  if (isVercelClockRequest(req)) return true
  const secret = process.env.CRON_SECRET?.trim()
  const auth = String(req.headers.authorization || '')
  if (secret && auth === `Bearer ${secret}`) return true
  if (secret && String(req.query.token ?? '') === secret) return true
  if (req.headers['x-vercel-cron']) return true
  if (req.method === 'GET' && String(req.query.preview ?? '') === '1') return true
  return !secret
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Cache-Control', 'no-store')
  if (!cronAllowed(req)) return res.status(401).json({ ok: false, error: 'Unauthorized' })

  const job = String(req.query?.job || '').trim().toLowerCase()
  const preview = String(req.query.preview ?? '') === '1'
  const force = String(req.query.force ?? '') === '1'
  const ymd = String(req.query.date ?? req.query.ymd ?? '').trim()
  const out: Record<string, unknown> = { ok: true, job: job || 'catch-up' }

  try {
    if (
      job === 'daily-registrations' ||
      job === 'daily-registered' ||
      job === 'securityjob-regs'
    ) {
      const result = await sendDailySecurityJobRegistrationsMail({
        preview,
        force,
        ymd: ymd || undefined,
      })
      return res.status(result.ok === false ? 500 : 200).json({ ok: result.ok !== false, job, ...result })
    }

    if (job === 'welcome-daily' || job === 'sj-eve-welcome') {
      const result = await sendSjEveWelcomeMessages({
        preview,
        force,
        ymd: ymd || undefined,
      })
      return res.status(result.ok === false ? 500 : 200).json({ ok: result.ok !== false, job, ...result })
    }

    const { flushSjAiCallQueue } = await import('../_lib/recruitment/sj-ai-call.js')
    out.aiCalls = await flushSjAiCallQueue()
    out.dailyCatchUp = await ensureSuiteDailyReports({ ids: ['securityjob-regs'] })
    return res.status(200).json(out)
  } catch (err) {
    console.error('[recruitment/cron]', err)
    return res.status(500).json({ ok: false, error: 'Recruitment cron failed' })
  }
}
