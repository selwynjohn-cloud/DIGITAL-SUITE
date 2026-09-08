/**
 * Agile Control cron — auto-escalation, randomised strategic client checks,
 * and 8:00 AM IST daily Control report.
 */

import type { VercelRequest, VercelResponse } from '@vercel/node'
import { sendControlDailyReport } from '../_lib/control/daily-report.js'
import { generateAcClientChecks, runAcEscalations } from '../_lib/control/escalation.js'
import { acStorageOk } from '../_lib/control/store.js'
import { ensureSuiteDailyReports } from '../_lib/suite-daily-delivery.js'

export const maxDuration = 120

function cronAllowed(req: VercelRequest) {
  const secret = process.env.CRON_SECRET?.trim()
  if (!secret) return true
  const auth = String(req.headers.authorization || '')
  if (auth === `Bearer ${secret}`) return true
  if (req.headers['x-vercel-cron']) return true
  if (String(req.query.token ?? '') === secret) return true
  if (req.method === 'GET' && String(req.query.preview ?? '') === '1') return true
  return false
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Cache-Control', 'no-store')
  if (!cronAllowed(req)) return res.status(401).json({ ok: false, error: 'Unauthorized' })

  if (!acStorageOk()) {
    return res.status(503).json({ ok: false, error: 'Redis not configured' })
  }

  const job = String(req.query?.job || 'all').trim().toLowerCase()
  const preview = String(req.query.preview ?? '') === '1'
  const sampleOnly = String(req.query.sample ?? '') === '1' || String(req.query.sampleOnly ?? '') === '1'
  const force = String(req.query.force ?? '') === '1'
  const out: Record<string, unknown> = { ok: true, job }

  try {
    if (job === 'daily-report' || job === 'daily') {
      const result = await sendControlDailyReport({
        date: String(req.query.date ?? '').trim() || undefined,
        preview,
        sampleOnly,
        force,
      })
      if (!result.ok) return res.status(500).json({ ok: false, job, ...result })
      return res.status(200).json({ ok: true, job, ...result })
    }

    if (job === 'escalations' || job === 'all') {
      out.escalations = await runAcEscalations()
    }
    if (job === 'client-checks' || job === 'checks' || job === 'all') {
      out.clientChecks = await generateAcClientChecks({ force: job === 'client-checks' || job === 'checks' })
    }

    out.dailyCatchUp = await ensureSuiteDailyReports({ ids: ['control'] })
    return res.status(200).json(out)
  } catch (err) {
    console.error('[control/cron]', err)
    return res.status(500).json({ ok: false, error: 'Control cron failed' })
  }
}
