/**
 * Agile Meeting — reminders for upcoming meetings, cadence gaps, open actions.
 */

import { Resend } from 'resend'
import { LOKESH_CC_EMAIL } from '../mis/branch-mail-cc.js'
import { pinMailFrom, sendSuiteEmail, suiteDirectorEmail } from '../suite-mail.js'
import { getMeetActions, getMeetMeetings } from './store.js'
import type { MeetAction, MeetAlert, MeetMeeting } from './types.js'

const MEET_WINDOWS = [7, 3, 1]
const ACTION_WINDOWS = [7, 3, 1, 0]

function daysUntil(isoDate: string, now = Date.now()): number {
  const t = new Date(String(isoDate || '').slice(0, 10) + 'T12:00:00+05:30').getTime()
  if (!Number.isFinite(t)) return 9999
  return Math.ceil((t - now) / 86_400_000)
}

function refreshActionStatus(a: MeetAction): MeetAction {
  if (a.status === 'Done') return a
  const d = daysUntil(a.dueDate)
  if (d < 0) return { ...a, status: 'Overdue' }
  return a.status === 'Overdue' ? { ...a, status: 'Open' } : a
}

function meetingAlerts(rows: MeetMeeting[], now = Date.now()): MeetAlert[] {
  const out: MeetAlert[] = []
  for (const m of rows) {
    if (m.status !== 'Scheduled') continue
    const d = daysUntil(m.meetingDate, now)
    if (d > 7) continue
    const sev = d < 0 || d <= 1 ? 'critical' : d <= 3 ? 'warn' : 'info'
    out.push({
      id: `mt-${m.id}-${d}`,
      kind: 'meeting',
      severity: sev,
      title: `${m.platform} meeting — ${m.clientName}`,
      branchName: m.branchName,
      clientName: m.clientName,
      dueDate: m.meetingDate,
      actionRequired:
        d < 0
          ? `Meeting was due ${Math.abs(d)} day(s) ago — mark completed or reschedule`
          : `Online meeting in ${d} day(s) · ${m.platform} · ${m.meetingTime || ''}`,
      daysLeft: d,
      refId: m.id,
    })
  }
  return out
}

/** Clients whose next due date (from last completed/scheduled) is approaching or overdue. */
function cadenceAlerts(rows: MeetMeeting[], now = Date.now()): MeetAlert[] {
  const byClient = new Map<string, MeetMeeting>()
  for (const m of rows) {
    if (m.status === 'Cancelled') continue
    const key = `${m.branchId}|${m.clientId || m.clientName}`
    const prev = byClient.get(key)
    const due = m.nextDueDate || m.meetingDate
    if (!prev || (due && (!prev.nextDueDate || due > (prev.nextDueDate || prev.meetingDate)))) {
      byClient.set(key, m)
    }
  }
  const out: MeetAlert[] = []
  for (const m of byClient.values()) {
    const due = m.nextDueDate || ''
    if (!due) continue
    const d = daysUntil(due, now)
    if (d > 14) continue
    const sev = d < 0 || d <= 3 ? 'critical' : d <= 7 ? 'warn' : 'info'
    out.push({
      id: `cd-${m.clientId || m.id}-${d}`,
      kind: 'cadence',
      severity: sev,
      title: `${m.isStrategic ? 'Strategic (monthly)' : 'Quarterly'} — ${m.clientName}`,
      branchName: m.branchName,
      clientName: m.clientName,
      dueDate: due,
      actionRequired:
        d < 0
          ? `Schedule overdue ${m.cadence.toLowerCase()} online meeting`
          : `Schedule ${m.cadence.toLowerCase()} meeting within ${d} day(s)`,
      daysLeft: d,
      refId: m.id,
    })
  }
  return out
}

function actionAlerts(rows: MeetAction[], now = Date.now()): MeetAlert[] {
  const out: MeetAlert[] = []
  for (const a of rows) {
    if (a.status === 'Done') continue
    const d = daysUntil(a.dueDate, now)
    if (d > 7 && a.status !== 'Overdue') continue
    const sev = d < 0 || d <= 1 ? 'critical' : d <= 3 ? 'warn' : 'info'
    out.push({
      id: `ac-${a.id}-${d}`,
      kind: 'action',
      severity: sev,
      title: a.title,
      branchName: a.branchName,
      clientName: a.clientName,
      dueDate: a.dueDate,
      actionRequired:
        d < 0
          ? `Action overdue by ${Math.abs(d)} day(s) — ${a.ownerName || 'owner'}`
          : `Complete action in ${d} day(s) — ${a.ownerName || 'owner'}`,
      daysLeft: d,
      refId: a.id,
    })
  }
  return out
}

export async function collectMeetAlerts(): Promise<MeetAlert[]> {
  const [meetings, actions] = await Promise.all([getMeetMeetings(), getMeetActions()])
  const refreshed = actions.map(refreshActionStatus)
  return [...meetingAlerts(meetings), ...cadenceAlerts(meetings), ...actionAlerts(refreshed)]
    .sort((a, b) => a.daysLeft - b.daysLeft)
    .slice(0, 200)
}

export async function sendMeetingsAlertDigest(): Promise<{ ok: boolean; count: number }> {
  const alerts = await collectMeetAlerts()
  const hot = alerts.filter(
    (a) =>
      a.severity === 'critical' ||
      MEET_WINDOWS.includes(a.daysLeft) ||
      ACTION_WINDOWS.includes(a.daysLeft) ||
      a.daysLeft <= 3,
  )
  if (!hot.length) return { ok: true, count: 0 }
  const apiKey = process.env.RESEND_API_KEY?.trim()
  if (!apiKey) return { ok: false, count: hot.length }
  try {
    const resend = new Resend(apiKey)
    const to = suiteDirectorEmail() || 'director@agilegroup.co.in'
    const cc = [LOKESH_CC_EMAIL].filter((e) => e && e !== to)
    const rows = hot
      .slice(0, 60)
      .map(
        (a) =>
          `<tr><td>${a.kind}</td><td>${a.title}</td><td>${a.branchName}</td><td>${a.clientName}</td><td>${a.dueDate}</td><td>${a.actionRequired}</td></tr>`,
      )
      .join('')
    await sendSuiteEmail(resend, {
      from: pinMailFrom(),
      to,
      cc: cc.length ? cc : undefined,
      subject: `Agile Meeting reminders — ${hot.length} action(s)`,
      html: `<div style="font-family:Arial,sans-serif;max-width:760px">
        <h2>Agile Meeting — reminders</h2>
        <p>Strategic clients: monthly · Other clients: quarterly · Platforms: Zoom / Teams</p>
        <table border="1" cellpadding="6" cellspacing="0" style="border-collapse:collapse;font-size:13px;width:100%">
          <thead><tr><th>Type</th><th>Item</th><th>Branch</th><th>Client</th><th>Date</th><th>Action</th></tr></thead>
          <tbody>${rows}</tbody>
        </table>
        <p style="font-size:12px;color:#64748b">Agile Meeting · Director only (IT not copied)</p>
      </div>`,
      skipDirectorCc: true,
    })
    return { ok: true, count: hot.length }
  } catch {
    return { ok: false, count: hot.length }
  }
}

export { refreshActionStatus, daysUntil }
