/** Agile Live — mail if duty is not ended 30 minutes after the scheduled end. */

import {
  getDutySessions,
  getOpsGuards,
  saveDutySessions,
  type OpsDutySession,
  type OpsGuard,
} from '../ops-mobile/store.js'
import { istNow, istYmd } from './duty-window.js'
import { sendLiveDutyExceptionMail } from './exception-mail.js'
import { livePersonWeek } from './weekly-roster.js'
import { addLiveStatus } from './store.js'

function scheduledEndMs(s: OpsDutySession, person?: OpsGuard | null): number {
  const started = new Date(s.startedAt)
  if (Number.isNaN(started.getTime())) return 0
  const at = new Date(started.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }))
  const week = livePersonWeek({
    idNo: s.idNo,
    clientSite: s.clientSite,
    designation: person?.designation,
    shiftRaw: person?.shift || '',
    at,
  })
  const [hh, mm] = String(week.dutyEnd || '').split(':').map(Number)
  if (!Number.isFinite(hh)) {
    return started.getTime() + (s.shiftHours || 12) * 3600000
  }
  const end = new Date(at)
  end.setHours(hh || 0, mm || 0, 0, 0)
  if (end.getTime() <= at.getTime()) end.setDate(end.getDate() + 1)
  return end.getTime()
}

export async function notifyLiveDutyContinuation(opts: {
  session: OpsDutySession
  person?: OpsGuard | null
  clientName?: string
  location?: string
  shiftLabel?: string
}): Promise<boolean> {
  if (opts.session.status !== 'on_duty' || opts.session.continueMailedAt) return false
  const due = scheduledEndMs(opts.session, opts.person) + 30 * 60000
  if (!due || Date.now() < due) return false
  const nowIso = new Date().toISOString()
  const sessions = await getDutySessions()
  const row = sessions.find((s) => s.id === opts.session.id)
  if (!row || row.status !== 'on_duty' || row.continueMailedAt) return false
  row.continueMailedAt = nowIso
  await saveDutySessions(sessions)
  const today = istYmd(istNow())
  await addLiveStatus({
    date: today,
    kind: 'duty_continue',
    guardId: row.guardId,
    idNo: row.idNo,
    name: row.name,
    mobile: row.mobile,
    branch: row.branch,
    clientSite: row.clientSite,
    remark: 'Duty continuation — still on duty 30 minutes after scheduled end.',
  })
  await sendLiveDutyExceptionMail({
    kind: 'duty_continue',
    name: row.name,
    idNo: row.idNo,
    branch: row.branch,
    clientName: opts.clientName || row.clientSite,
    location: opts.location || '',
    shiftLabel: opts.shiftLabel,
    detail:
      'Duty continuation — this person did not End Duty. Still on duty 30 minutes after the scheduled end. OM, HOD, Control and Director are informed.',
  }).catch(() => {})
  return true
}

export async function scanLiveDutyContinuation(): Promise<{ checked: number; mailed: number }> {
  const [sessions, people] = await Promise.all([getDutySessions(), getOpsGuards()])
  const open = sessions.filter((s) => s.status === 'on_duty' && !s.continueMailedAt)
  let mailed = 0
  for (const s of open) {
    const person = people.find((p) => p.id === s.guardId) || null
    if (await notifyLiveDutyContinuation({ session: s, person })) mailed++
  }
  return { checked: open.length, mailed }
}
