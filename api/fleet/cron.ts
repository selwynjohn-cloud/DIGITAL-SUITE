import type { VercelRequest, VercelResponse } from '@vercel/node'
import { sendConsolidatedDirectorReport, sendPendingReminder } from '../_lib/fleet/analysis.js'
import {
  FLEET_BRANCHES,
  currentWeekLabel,
  getDrivers,
  getReports,
  getVehicles,
  normalizeDriver,
  normalizeVehicle,
} from '../_lib/fleet/store.js'

const IST_OFFSET_MIN = 5 * 60 + 30
function istNow(): Date {
  const utcMs = Date.now() + new Date().getTimezoneOffset() * 60000
  return new Date(utcMs + IST_OFFSET_MIN * 60000)
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const now = istNow()
  const day = now.getDay()
  const hour = now.getHours()
  const manual = String(req.query.job ?? '')

  /**
   * Schedule (IST):
   * - Saturday 10:00 AM — reminder to branches who have not submitted
   * - Saturday 4:30 PM — final reminder before deadline
   * - Sunday 10:00 AM — consolidated all-branch report to Director
   */
  let job = ''
  if (manual === 'consolidated' || manual === 'report') job = 'consolidated'
  else if (manual === 'reminder') job = 'reminder'
  else if (manual === 'final') job = 'final'
  else if (day === 6 && hour === 10) job = 'reminder'
  else if (day === 6 && hour === 16) job = 'final'
  else if (day === 0 && hour === 10) job = 'consolidated'

  if (!job) return res.status(200).json({ ok: true, skipped: true, reason: 'not a scheduled slot', ist: now.toISOString() })

  const apiKey = process.env.RESEND_API_KEY?.trim()
  if (!apiKey) return res.status(503).json({ error: 'Email not configured' })

  const wk = currentWeekLabel(now)
  const dateLabel = now.toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })

  try {
    if (job === 'reminder' || job === 'final') {
      const reports = await getReports()
      const reported = new Set(reports.filter((r) => r.active && r.weekNo === wk).map((r) => r.branchId))
      const pending = FLEET_BRANCHES.filter((b) => !reported.has(b))
      const sent: string[] = []
      const urgent = job === 'final'
      for (const b of pending) {
        const r = await sendPendingReminder(b, wk, urgent)
        if (r.ok) sent.push(b)
      }
      return res.status(200).json({ ok: true, job, week: wk, remindersSent: sent.length, branches: sent })
    }

    const [reports, rawVehicles, rawDrivers] = await Promise.all([getReports(), getVehicles(), getDrivers()])
    const vehicles = rawVehicles.map((v) => normalizeVehicle(v))
    const drivers = rawDrivers.map((d) => normalizeDriver(d))
    const mail = await sendConsolidatedDirectorReport(wk, reports, vehicles, drivers, dateLabel)
    if (!mail.ok) return res.status(500).json({ error: mail.error ?? 'Send failed' })

    return res.status(200).json({ ok: true, job: 'consolidated', week: wk, sentTo: mail.to, schedule: 'Sunday 10:00 AM IST' })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Cron failed'
    return res.status(500).json({ error: msg })
  }
}
