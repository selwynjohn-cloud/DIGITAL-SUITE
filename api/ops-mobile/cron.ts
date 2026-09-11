import type { VercelRequest, VercelResponse } from '@vercel/node'
import { misTodayIst } from '../_lib/mis/dates.js'
import { listDutyAlerts } from '../_lib/ops-mobile/duty-alerts.js'
import { scanMissingDutyStarts, syncMisIncidentsToAlerts } from '../_lib/ops-mobile/duty-monitor.js'
import { runRandomDutyVoiceChecks, voiceCheckConfigured } from '../_lib/ops-mobile/voice-check.js'

export const maxDuration = 120

/**
 * Ops Mobile cron — duty alerts + random voice verification.
 * ?job=duty-monitor | voice-check | sync-mis | status
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  const job = String(req.query.job ?? 'status').trim()
  const date = String(req.query.date ?? misTodayIst())
  const branch = String(req.query.branch ?? '').trim()

  try {
    if (job === 'status') {
      const alerts = await listDutyAlerts(date, 50)
      const sev = { mild: 0, medium: 0, severe: 0 }
      for (const a of alerts) sev[a.severity]++
      return res.status(200).json({
        ok: true,
        job,
        date,
        voiceConfigured: voiceCheckConfigured(),
        alerts: alerts.length,
        severity: sev,
        sample: alerts.slice(0, 5),
      })
    }

    if (job === 'duty-monitor') {
      const missing = await scanMissingDutyStarts({ branchFilter: branch || undefined })
      return res.status(200).json({ ok: true, job, date, ...missing })
    }

    if (job === 'sync-mis') {
      const r = await syncMisIncidentsToAlerts(date)
      return res.status(200).json({ ok: true, job, date, ...r })
    }

    if (job === 'voice-check') {
      const max = Number(req.query.max ?? 5) || 5
      const r = await runRandomDutyVoiceChecks({ maxCalls: max, branchFilter: branch || undefined })
      return res.status(200).json({ ok: r.ok, job, date, placed: r.queued, ...r })
    }

    if (job === 'run-all') {
      const sync = await syncMisIncidentsToAlerts(date)
      const missing = await scanMissingDutyStarts({ branchFilter: branch || undefined })
      const voice = await runRandomDutyVoiceChecks({ maxCalls: 3, branchFilter: branch || undefined })
      return res.status(200).json({ ok: true, job, date, sync, missing, voice })
    }

    return res.status(400).json({ ok: false, error: 'Unknown job. Use duty-monitor, voice-check, sync-mis, status' })
  } catch (e) {
    return res.status(500).json({ ok: false, error: e instanceof Error ? e.message : 'Cron failed' })
  }
}
