import type { VercelRequest, VercelResponse } from '@vercel/node'
import { runSuiteHealthChecks, sendHealthAlertIfNeeded } from '../_lib/suite/health-monitor.js'
import { sendSlotConfirmation } from '../_lib/pulse/confirm.js'
import { pulseSlot, runPulsePublish } from '../_lib/pulse/scheduler.js'

export const maxDuration = 300

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const manual = String(req.query.force ?? '') === '1'
  try {
    const checks = await runSuiteHealthChecks()
    const failed = checks.filter((c) => !c.ok)
    const mail =
      failed.length || manual
        ? await sendHealthAlertIfNeeded(checks)
        : { alerted: false, failed: 0 }

    let pulse: Awaited<ReturnType<typeof runPulsePublish>> | null = null
    if (pulseSlot()) {
      pulse = await runPulsePublish()
    }

    const confirm = await sendSlotConfirmation()

    return res.status(failed.length ? 503 : 200).json({
      ok: failed.length === 0,
      site: process.env.HEALTH_CHECK_BASE_URL || 'https://www.agilegroup-digital.co.in',
      checkedAt: new Date().toISOString(),
      checks,
      mail,
      pulse,
      confirm,
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Health check failed'
    return res.status(500).json({ ok: false, error: msg })
  }
}
