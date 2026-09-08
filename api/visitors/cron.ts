/**
 * AVM end-of-day counts mail + purge. 7:30 PM IST, catch-up until 11:00 PM IST.
 */
import type { VercelRequest, VercelResponse } from '@vercel/node'
import { sendDailyReportMail } from '../_lib/visitors/report.js'
import { istNow, istYmd, purgeDayVisits, wasDailySent } from '../_lib/visitors/store.js'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const now = istNow()
  const hour = now.getHours()
  const minute = now.getMinutes()
  const ymd = istYmd(now)
  const job = String(req.query.job ?? '').trim()
  const force = String(req.query.force ?? '') === '1'
  const inWindow = (hour === 19 && minute >= 30) || (hour >= 20 && hour < 23) || (hour === 23 && minute === 0)
  const requested = job === 'daily-report' || job === 'purge'
  if (!requested && !inWindow) {
    return res.status(200).json({ ok: true, skipped: true, reason: 'not the evening window', ist: `${ymd} ${hour}:${String(minute).padStart(2, '0')}` })
  }
  if (!force && (await wasDailySent(ymd)) && job !== 'purge') {
    const purged = await purgeDayVisits(ymd)
    return res.status(200).json({ ok: true, skipped: true, reason: 'already sent', ymd, purged })
  }
  try {
    const mail = await sendDailyReportMail(ymd, { force })
    const purged = await purgeDayVisits(ymd)
    if (!mail.ok && !mail.skipped) return res.status(500).json({ error: mail.error || 'Send failed', purged })
    return res.status(200).json({ ok: true, job: 'daily-report', ymd, to: mail.to || [], purged })
  } catch (err) {
    return res.status(500).json({ error: err instanceof Error ? err.message : 'Cron failed' })
  }
}
