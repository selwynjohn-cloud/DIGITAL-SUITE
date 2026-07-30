import type { VercelRequest, VercelResponse } from '@vercel/node'
import { sendSlotConfirmation } from '../_lib/pulse/confirm.js'
import { runPulsePublish } from '../_lib/pulse/scheduler.js'

/**
 * Agile Pulse — auto-publish bulletin.
 * Vercel cron hits this every 30 minutes; IST windows decide morning / afternoon / evening.
 * Manual recovery: ?job=publish&token=PULSE_APPROVE_SECRET
 * Preview: ?preview=1
 */

export const maxDuration = 300

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const secret = process.env.CRON_SECRET?.trim()
  const preview = String(req.query.preview ?? '') === '1'
  const job = String(req.query.job ?? '')
  const token = String(req.query.token ?? '')
  const approveSecret = process.env.PULSE_APPROVE_SECRET?.trim()
  const force = job === 'publish' && approveSecret && token === approveSecret

  if (secret && !preview && !force) {
    const auth = String(req.headers.authorization ?? '')
    if (auth !== `Bearer ${secret}`) return res.status(401).json({ error: 'Unauthorized' })
  }

  const retry = String(req.query.retry ?? '') === '1'

  try {
    const result = await runPulsePublish({ preview, force, retry })
    const confirm = preview ? null : await sendSlotConfirmation()
    return res.status(200).json({ ...result, confirm })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'cron failed'
    console.error('[pulse/cron]', err)
    return res.status(500).json({ ok: false, error: msg })
  }
}
