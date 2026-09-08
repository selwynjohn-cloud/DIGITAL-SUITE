/**
 * Monitor duty sessions — late start, missing start after shift time.
 */
import {
  addDutyAlert,
  severityLateStart,
  severityNoStart,
} from './duty-alerts.js'
import {
  getDutySessions,
  getOpsGuards,
  type OpsDutySession,
} from './store.js'

/** Default shift start times (IST) when guard has no roster time — A/G/B/C common starts. */
const DEFAULT_SHIFT_START: Record<string, string> = {
  A: '06:00',
  G: '14:00',
  B: '22:00',
  C: '06:00',
}

function istNow(): Date {
  return new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }))
}

function parseHm(hm: string): { h: number; m: number } | null {
  const m = /^(\d{1,2}):(\d{2})$/.exec(String(hm || '').trim())
  if (!m) return null
  return { h: Number(m[1]), m: Number(m[2]) }
}

function minutesAfterScheduled(scheduledHm: string, at: Date): number {
  const p = parseHm(scheduledHm)
  if (!p) return 0
  const sched = new Date(at)
  sched.setHours(p.h, p.m, 0, 0)
  return Math.round((at.getTime() - sched.getTime()) / 60000)
}

function shiftCode(raw: string): string {
  const s = String(raw || '').trim().toUpperCase()
  if (/^[ABGC]$/.test(s)) return s
  if (/morning|^a\b|day/i.test(s)) return 'A'
  if (/general|^g\b|afternoon/i.test(s)) return 'G'
  if (/night|^b\b|night/i.test(s)) return 'B'
  return 'A'
}

export async function recordLateStartIfNeeded(session: OpsDutySession, shiftHint = ''): Promise<void> {
  const started = new Date(session.startedAt)
  const code = shiftCode(shiftHint)
  const sched = DEFAULT_SHIFT_START[code] || '06:00'
  const lateMin = minutesAfterScheduled(sched, started)
  if (lateMin <= 0) return

  const severity = severityLateStart(lateMin)
  const today = started.toISOString().slice(0, 10)
  await addDutyAlert({
    date: today,
    type: 'late_start',
    severity,
    guardId: session.guardId,
    idNo: session.idNo,
    name: session.name,
    mobile: session.mobile,
    branch: session.branch,
    clientSite: session.clientSite,
    detail: `Duty started ${lateMin} min after scheduled ${sched} (shift ${code})`,
  })
}

/** Cron: guards rostered but no duty start X minutes after shift. */
export async function scanMissingDutyStarts(opts?: { branchFilter?: string }): Promise<{
  alerts: number
}> {
  const branchQ = String(opts?.branchFilter ?? '').trim().toLowerCase()
  const guards = await getOpsGuards()
  const sessions = await getDutySessions()
  const now = istNow()
  const today = now.toISOString().slice(0, 10)
  let alerts = 0

  for (const g of guards) {
    if (g.active === false) continue
    if (branchQ && !g.branch.toLowerCase().includes(branchQ)) continue
    const open = sessions.find((s) => s.guardId === g.id && s.status === 'on_duty')
    if (open) continue

    const code = shiftCode(g.shift)
    const sched = DEFAULT_SHIFT_START[code] || '06:00'
    const past = minutesAfterScheduled(sched, now)
    if (past < 5 || past > 180) continue

    const severity = severityNoStart(past)
    await addDutyAlert({
      date: today,
      type: 'no_duty_start',
      severity,
      guardId: g.id,
      idNo: g.idNo,
      name: g.name,
      mobile: g.mobile,
      branch: g.branch,
      clientSite: g.clientSite,
      detail: `No duty start ${past} min after scheduled ${sched} (shift ${code})`,
    })
    alerts++
  }

  return { alerts }
}

/** Pull Work360 MIS duty incidents and mirror as ops alerts with severity. */
export async function syncMisIncidentsToAlerts(date: string): Promise<{ added: number }> {
  const { getDutyIncidents } = await import('../mis/store.js')
  const { severityOutOfPost, severityLateStart } = await import('./duty-alerts.js')
  const incidents = await getDutyIncidents(date)
  let added = 0
  for (const inc of incidents) {
    let severity: 'mild' | 'medium' | 'severe' = 'medium'
    let detail = inc.remarks || ''
    if (inc.type === 'late_start') {
      const m = /(\d+)\s*min/i.exec(`${inc.remarks} ${inc.dutyStartTime}`)
      severity = severityLateStart(m ? Number(m[1]) : 20)
      detail = inc.dutyStartTime
        ? `Late start — scheduled ${inc.scheduledTime || '—'}, actual ${inc.dutyStartTime}`
        : inc.remarks
    } else {
      const km = parseFloat(String(inc.kmFromPost || '0').replace(/[^\d.]/g, '')) || 0
      severity = severityOutOfPost(30, km)
      detail = inc.kmFromPost ? `Away from post — ${inc.kmFromPost}` : inc.remarks
    }
    await addDutyAlert({
      date,
      type: inc.type === 'out_of_post' ? 'out_of_post' : 'late_start',
      severity,
      guardId: inc.employeeId,
      idNo: inc.employeeId,
      name: inc.guardName,
      mobile: '',
      branch: '',
      clientSite: inc.unit || inc.client,
      detail,
    })
    added++
  }
  return { added }
}
