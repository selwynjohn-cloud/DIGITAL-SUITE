/**
 * Agile Guards cron — morning status (09:30 IST), 5:00 PM delayed lists, hourly catch-up.
 */

import type { VercelRequest, VercelResponse } from '@vercel/node'
import { sendDailyGuardsStatusMail } from '../_lib/guards/digest.js'
import { sendDailyGuardsDelayedMail } from '../_lib/guards/delayed-daily.js'
import { processDelayedEscalations } from '../_lib/guards/escalation.js'
import { getComplaints, guardsStorageOk } from '../_lib/guards/store.js'
import { getBranches } from '../_lib/mis/store.js'
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
  if (!guardsStorageOk()) return res.status(503).json({ ok: false, error: 'Storage not connected.' })

  const job = String(req.query?.job || '').trim().toLowerCase()
  const preview = String(req.query.preview ?? '') === '1'
  const force = String(req.query.force ?? '') === '1'
  const out: Record<string, unknown> = { ok: true, job: job || 'catch-up' }

  try {
    if (job === 'daily-complaints' || job === 'daily') {
      const result = await sendDailyGuardsStatusMail({ preview, force })
      const delayedAm = await sendDailyGuardsDelayedMail({ preview, force, slot: 'am' })
      return res.status(result.ok === false && delayedAm.ok === false ? 500 : 200).json({
        ok: result.ok !== false || delayedAm.ok !== false,
        job,
        status: result,
        delayedMorning: delayedAm,
      })
    }
    if (job === 'delayed-morning' || job === 'delayed-am') {
      const result = await sendDailyGuardsDelayedMail({ preview, force, slot: 'am' })
      return res.status(result.ok === false ? 500 : 200).json({ ok: result.ok !== false, job, ...result })
    }
    if (job === 'delayed-daily' || job === 'delayed') {
      return res.status(200).json({
        ok: true,
        job,
        skipped: true,
        reason: 'Evening delayed mail stopped — 9:30 AM only (office hours)',
      })
    }
    if (job === 'escalations' || job === 'sla') {
      const [complaints, branches] = await Promise.all([getComplaints(), getBranches()])
      await processDelayedEscalations(complaints, branches, { sendEmails: !preview })
      return res.status(200).json({ ok: true, job })
    }

    // Hourly / missing job= — still catch up both daily packs (do not rely on the query string).
    out.dailyCatchUp = await ensureSuiteDailyReports({ ids: ['guards', 'guards-delayed-am'] })
    if (!preview && (job === '' || job === 'all' || job === 'catch-up')) {
      const [complaints, branches] = await Promise.all([getComplaints(), getBranches()])
      await processDelayedEscalations(complaints, branches, { sendEmails: true }).catch(() => null)
    }
    return res.status(200).json(out)
  } catch (err) {
    console.error('[guards/cron]', err)
    return res.status(500).json({ ok: false, error: 'Guards cron failed' })
  }
}
