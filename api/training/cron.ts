import type { VercelRequest, VercelResponse } from '@vercel/node'
import { sendOjtMorningScheduleMail } from '../_lib/training/ojt-morning-report.js'
import { runOjtT3AdvanceMails } from '../_lib/training/ojt-t3-cron.js'
import { isSaturdayIst, runOjtSecObsWeeklyMails } from '../_lib/training/ojt-sec-obs-weekly.js'

export const maxDuration = 120

/**
 * Agile Training cron:
 * - ojt-t3 — client advance notices when training is exactly 3 days ahead (daily)
 * - ojt-sec-obs-weekly — open Security Observation closing chase to HOD (Saturday IST)
 *     CC: Training, Lokesh, Director
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  const secret = process.env.CRON_SECRET?.trim()
  const job = String(req.query.job ?? 'ojt-t3')
  const token = String(req.query.token ?? '')
  const force = Boolean(token && secret && token === secret)
  const sampleOnly = String(req.query.sample ?? '') === '1'

  if (secret && !force) {
    const auth = String(req.headers.authorization ?? '')
    if (auth !== `Bearer ${secret}`) {
      return res.status(401).json({ ok: false, error: 'Unauthorized' })
    }
  }

  try {
    if (job === 'ojt-morning') {
      const result = await sendOjtMorningScheduleMail({ force })
      return res.status(200).json({ ok: true, job, ...result })
    }
    if (job === 'ojt-t3') {
      const result = await runOjtT3AdvanceMails()
      return res.status(200).json({ ok: true, job, ...result })
    }
    if (job === 'ojt-sec-obs-weekly') {
      if (!force && !sampleOnly && !isSaturdayIst()) {
        return res.status(200).json({ ok: true, job, skipped: true, reason: 'Runs on Saturday IST only.' })
      }
      const result = await runOjtSecObsWeeklyMails({ sampleOnly, force: force || sampleOnly })
      return res.status(200).json({ ok: true, job, ...result })
    }
    return res.status(400).json({ ok: false, error: `Unknown job: ${job}` })
  } catch (err) {
    console.error('[training/cron]', err)
    return res.status(500).json({ ok: false, error: 'Training cron failed' })
  }
}
