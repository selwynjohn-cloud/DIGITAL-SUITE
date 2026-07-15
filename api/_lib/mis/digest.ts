/**
 * MIS daily digest emails — HOD reminders, pending alerts, MD summary.
 */

import { Resend } from 'resend'
import {
  docPresent,
  getBranches,
  getClients,
  getComplaints,
  getGuardDocs,
  getReportsForDate,
  getUsers,
  getMisAckSent,
  guardRecordEligible,
  markMisAckSent,
  setReminderTime,
  type MisBranch,
  type MisUser,
} from './store.js'
import { complaintMatchesBranch } from '../guards/store.js'
import { deployPct, reportDeployTotals } from './deploy-math.js'
import { withoutNoMailRecipients, isNoMailRecipientEmail } from '../auth.js'
import {
  misAckDateDisplay,
  misAckFooterHtml,
  misAckRowDivider,
  misFooterHtml,
  misFooterText,
  misReminderMailWrap,
} from './brand.js'
import { pinMailFrom, pinMailReplyTo, sendSuiteEmail } from '../suite-mail.js'
import { ackStatsTableHtml, buildBranchAckStats, buildConsolidatedAckStats, type BranchAckStats } from './ack-stats.js'
import { misTodayIst, isOnTimeMisSubmission, isExcusedLateMisSubmission } from './dates.js'
import { buildBranchReportMap } from './branch-match.js'
import { misBranchDirectorCc, misBranchCcLokesh, LOKESH_CC_EMAIL } from './branch-mail-cc.js'
import { isSupportMisUser } from '../user-team.js'
import { misBranchGroupKey } from './branch-dedupe.js'
import {
  clientPerfMwLabel,
  clientPerfPeriodLabel,
} from './client-perf-letter.js'
import { buildClientPerfReportEmailHtml, clientPerfReportShareText } from './client-perf-report.js'
import { formatInrFromLacs } from './client-perf-money.js'

function esc(s: unknown) {
  return String(s ?? '').replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
}

function pctNum(s: unknown): number {
  const n = parseFloat(String(s ?? '').replace(/[^\d.]/g, ''))
  return Number.isFinite(n) ? n : 0
}

function intNum(s: unknown): number {
  const n = parseInt(String(s ?? '').replace(/\D/g, ''), 10)
  return Number.isFinite(n) ? n : 0
}

/** Rule-based AI-style alerts for branch MIS acknowledgment email. */
export function buildMisAckAiAlerts(
  totals: { san: number; abs: number; ot: number; vac: number; dep: number; depPct: number },
  summary: Record<string, string>,
  stats?: BranchAckStats,
): string[] {
  const alerts: string[] = []
  const coll = pctNum(summary.collectionPct)
  const medical = pctNum(summary.medicalFitnessPct)
  const pvc = pctNum(summary.pvcPct)
  const psara = pctNum(summary.psaraPct)
  const complaints = intNum(summary.complaints)
  const lateStart = intNum(summary.lateStartCases)
  const outOfPost = intNum(summary.outOfPostCases)

  if (stats) {
    const gc = stats.guardComplaints
    const cc = stats.clientComplaints
    const guardPending = Math.max(0, gc.received - gc.solved)
    const clientPending = Math.max(0, cc.received - cc.solved)
    if (guardPending > 0) {
      alerts.push(
        `ALERT — ${guardPending} pending guard complaint(s) (${gc.solved} closed of ${gc.received} total). Assign owner, update action in MIS Complaints, and brief HQ today.`,
      )
    }
    if (clientPending > 0) {
      alerts.push(
        `ALERT — ${clientPending} pending client complaint(s) (${cc.solved} closed of ${cc.received} total). Close within SLA and confirm with the client.`,
      )
    }
    if (lateStart > 0 || outOfPost > 0) {
      const parts: string[] = []
      if (lateStart > 0) parts.push(`${lateStart} late start`)
      if (outOfPost > 0) parts.push(`${outOfPost} out of post`)
      alerts.push(
        `ALERT — Duty discipline: ${parts.join(' · ')} case(s) today. Review shift handover, supervisor accountability, and post coverage before night shift.`,
      )
    } else if (totals.san > 0) {
      alerts.push('Duty start and post discipline: no late start or out-of-post cases reported today — maintain the same standard.')
    }
  }

  if (totals.depPct < 95) {
    alerts.push(
      `Deployment is ${totals.depPct}% — below the 95% SLA target. Review vacant posts and OT relief for today.`,
    )
  }
  if (totals.vac > 0) {
    alerts.push(
      `${totals.vac} vacant position(s) reported. Confirm relief guards or OT cover for every unit before night shift.`,
    )
  }
  if (totals.abs > 0 && totals.san > 0 && totals.abs / totals.san > 0.08) {
    alerts.push(
      `Absenteeism is high (${totals.abs} of ${totals.san} sanctioned). Follow up with unit in-charges and document reasons.`,
    )
  }
  if (coll > 0 && coll < 75) {
    alerts.push(`Collection is ${coll}% — strengthen client follow-up and billing recovery this week.`)
  }
  if (medical > 0 && medical < 90) {
    alerts.push(`Medical fitness compliance is ${medical}% — prioritise pending medical renewals.`)
  }
  if (pvc > 0 && pvc < 90) {
    alerts.push(`PVC upload compliance is ${pvc}% — clear pending PVC documentation at unit level.`)
  }
  if (psara > 0 && psara < 90) {
    alerts.push(`PSARA certificate compliance is ${psara}% — update expiring certificates without delay.`)
  }
  if (complaints > 0 && !stats) {
    alerts.push(
      `${complaints} client complaint(s) / incident(s) logged — ensure resolution action and brief HQ today.`,
    )
  }
  if (!stats && lateStart > 0) {
    alerts.push(`${lateStart} late start duty case(s) — review shift handover and supervisor accountability.`)
  }
  if (!stats && outOfPost > 0) {
    alerts.push(`${outOfPost} out-of-post case(s) — reinforce post discipline and site supervision.`)
  }
  const remarks = String(summary.remarks ?? '').trim()
  if (remarks.length > 10) {
    alerts.push(`Remarks noted: “${remarks.slice(0, 180)}${remarks.length > 180 ? '…' : ''}” — HQ will track closure.`)
  }
  if (!alerts.length) {
    alerts.push(
      'All key indicators are within normal range. Maintain today’s deployment discipline and collection follow-up.',
    )
  }
  return alerts
}

function misAckFromAddress(): string {
  return (
    process.env.MIS_ACK_FROM?.trim() ||
    process.env.EMAIL_FROM?.trim() ||
    process.env.PIN_EMAIL_FROM?.trim() ||
    'Agile MIS <noreply@agilegroup.co.in>'
  )
}

function misAckDirectorEmail(): string {
  return (
    process.env.MIS_DIRECTOR_EMAIL?.trim() ||
    process.env.FLEET_DIRECTOR_EMAIL?.trim() ||
    pinMailReplyTo() ||
    'director@agilegroup.co.in'
  )
    .trim()
    .toLowerCase()
}

function misAckGmailCopy(): string {
  return (process.env.ADMIN_NOTIFY_EMAIL?.trim() || 'selwyn.john@gmail.com').toLowerCase()
}

async function resendOne(
  resend: Resend,
  from: string,
  to: string,
  subject: string,
  html: string,
  replyTo: string,
): Promise<{ ok: boolean; id?: string; error?: string }> {
  const email = to.trim().toLowerCase()
  if (!email.includes('@')) return { ok: false, error: 'Invalid email' }
  const result = await sendSuiteEmail(resend, {
    from,
    to: email,
    replyTo,
    subject,
    html,
  })
  if (result.error) return { ok: false, error: result.error.message ?? 'Send failed' }
  if (!result.data?.id) return { ok: false, error: 'No delivery confirmation' }
  return { ok: true, id: result.data.id }
}

export function isHodUser(u: MisUser): boolean {
  if (isSupportMisUser(u)) return false
  if (u.active === false || !u.email?.includes('@')) return false
  const role = (u.role || '').toLowerCase()
  return (
    role.includes('hod') ||
    role.includes('head') ||
    role.includes('branch manager') ||
    role.includes('operations manager') ||
    role.includes('area manager') ||
    role.includes('regional manager') ||
    role.includes('general manager')
  )
}

export async function getHodEmailsForBranch(
  branchId: string,
  users?: MisUser[],
  branches?: MisBranch[],
): Promise<string[]> {
  const list = users ?? (await getUsers())
  const branchList = branches ?? (await getBranches())
  const branch = branchList.find((b) => b.id === branchId)
  const branchKey = branch ? misBranchGroupKey(branch.name) : ''
  return Array.from(
    new Set(
      list
        .filter((u) => {
          if (!isHodUser(u)) return false
          const ub = String(u.branchId ?? '').trim()
          if (!ub) return false
          if (complaintMatchesBranch(ub, branchId, branchList)) return true
          if (branch && ub.toLowerCase() === branch.name.toLowerCase()) return true
          if (branch && misBranchGroupKey(ub) === branchKey && branchKey) return true
          return false
        })
        .map((u) => u.email.trim())
        .filter(Boolean),
    ),
  )
}

export async function getBranchNotifyEmails(
  branchId: string,
  extraEmails: string[] = [],
  users?: MisUser[],
  branches?: MisBranch[],
): Promise<string[]> {
  const list = users ?? (await getUsers())
  const branchList = branches ?? (await getBranches())
  const branch = branchList.find((b) => b.id === branchId)
  const branchKey = branch ? misBranchGroupKey(branch.name) : ''

  function userMatchesBranch(u: MisUser): boolean {
    if (u.active === false || !u.email?.includes('@')) return false
    if (isSupportMisUser(u)) return false
    const ub = String(u.branchId ?? '').trim()
    if (!ub) return false
    if (complaintMatchesBranch(ub, branchId, branchList)) return true
    if (branch && ub.toLowerCase() === branch.name.toLowerCase()) return true
    if (branch && misBranchGroupKey(ub) === branchKey && branchKey) return true
    return false
  }

  const branchUsers = list.filter(userMatchesBranch).map((u) => u.email.trim())
  const hodEmails = await getHodEmailsForBranch(branchId, list, branchList)
  return Array.from(
    new Set(
      [...extraEmails, ...hodEmails, ...branchUsers]
        .map((e) => e.trim().toLowerCase())
        .filter((e) => e.includes('@')),
    ),
  )
}

export async function computeDeploymentTotals(date: string) {
  const [branches, reports, clients] = await Promise.all([getBranches(true), getReportsForDate(date), getClients()])
  const reportMap = buildBranchReportMap(branches, reports)
  const countedReportIds = new Set<string>()

  let san = 0
  let dep = 0
  let vac = 0
  const pending: MisBranch[] = []
  const branchRows: { id: string; name: string; submitted: boolean; depPct: number; vac: number }[] = []

  for (const b of branches) {
    const r = reportMap.get(b.id)
    if (!r) {
      pending.push(b)
      branchRows.push({ id: b.id, name: b.name, submitted: false, depPct: 0, vac: 0 })
      continue
    }
    const t = reportDeployTotals(r.rows as Record<string, unknown>[], r.branchId, clients)
    if (!countedReportIds.has(r.id)) {
      countedReportIds.add(r.id)
      san += t.san
      dep += t.dep
      vac += t.vac
    }
    branchRows.push({ id: b.id, name: b.name, submitted: true, depPct: deployPct(t.dep, t.san), vac: t.vac })
  }

  return {
    branches,
    submitted: branchRows.filter((r) => r.submitted).length,
    pending,
    totals: { san, dep, vac, depPct: san ? Math.round((dep / san) * 100) : 0 },
    branchRows,
  }
}

function mailWrap(title: string, inner: string) {
  return `<div style="font-family:Arial,sans-serif;max-width:640px;color:#111">
    <div style="background:#14224f;color:#fff;padding:16px;border-radius:8px 8px 0 0"><b style="color:#c9a84c;font-size:16px">${esc(title)}</b></div>
    <div style="padding:16px;border:1px solid #ddd;border-top:none">${inner}${misFooterHtml('Agile MIS — Management Information System')}</div>
  </div>`
}

function docCentreMailWrap(title: string, inner: string) {
  return `<div style="font-family:Arial,sans-serif;max-width:640px;color:#111">
    <div style="background:#14224f;color:#fff;padding:16px;border-radius:8px 8px 0 0">
      <b style="color:#c9a84c;font-size:16px">${esc(title)}</b>
      <div style="font-size:12px;color:#cbd5e1;margin-top:6px">Agile Digital Operation Centre</div>
    </div>
    <div style="padding:16px;border:1px solid #ddd;border-top:none">${inner}${misFooterHtml('Agile Digital Operation Centre — MIS Command')}</div>
  </div>`
}

export type MisHodReminderOpts = {
  /** Report date the HOD must select in the form (YYYY-MM-DD). */
  reportDate?: string
  /** Deadline calendar day label (YYYY-MM-DD) — e.g. submit overdue 10th by 2 PM on 11th. */
  submitByDate?: string
  /** Send even if branch already submitted (named reminder). */
  force?: boolean
  /** CC Director, Lokesh, and all HODs. */
  ccManagement?: boolean
  /** Digital Operation Centre letterhead. */
  docCentre?: boolean
}

async function misReminderCcList(hodTo: string[], branchName?: string): Promise<string[]> {
  const director = misAckDirectorEmail()
  const hodEmails = await getAllHodEmails()
  const skip = new Set(hodTo.map((e) => e.trim().toLowerCase()))
  const mgmt: string[] = [director, ...hodEmails]
  if (branchName && misBranchCcLokesh(branchName)) mgmt.push(LOKESH_CC_EMAIL)
  return withoutNoMailRecipients(
    Array.from(
      new Set(
        mgmt
          .map((e) => e.trim().toLowerCase())
          .filter((e) => e.includes('@') && !skip.has(e)),
      ),
    ),
  )
}

/** 5:00 PM IST — email each pending branch HOD (or forced list). */
export async function sendMisHodReminders(date: string, branchIds?: string[], opts?: MisHodReminderOpts) {
  const apiKey = process.env.RESEND_API_KEY?.trim()
  if (!apiKey) return { ok: false, error: 'Email not configured' }

  const reportDate = opts?.reportDate || date
  const { pending, branches } = await computeDeploymentTotals(reportDate)
  let target: MisBranch[] = []
  if (branchIds?.length) {
    const byId = new Map(branches.map((b) => [b.id, b]))
    const allActive = await getBranches(true)
    for (const id of branchIds) {
      const b = byId.get(id) || allActive.find((x) => x.id === id)
      if (b) target.push(b)
    }
    if (!opts?.force) target = target.filter((b) => pending.some((p) => p.id === b.id))
  } else if (opts?.force) {
    target = branches
  } else {
    target = pending
  }
  if (!target.length) return { ok: true, skipped: true, reason: 'No branches to remind' }

  const users = await getUsers()
  const resend = new Resend(apiKey)
  const from = opts?.docCentre
    ? (process.env.MIS_DOC_FROM?.trim() || process.env.MIS_ACK_FROM?.trim() || process.env.EMAIL_FROM?.trim() || 'Agile MIS <noreply@agilegroup.co.in>')
    : (process.env.EMAIL_FROM ?? 'Agile MIS <noreply@agilegroup.co.in>')
  const now = new Date().toISOString()
  const sent: string[] = []
  const skipped: string[] = []
  const noEmailBranches: MisBranch[] = []
  const reportLabel = misAckDateDisplay(reportDate)
  const submitByLabel = opts?.submitByDate ? misAckDateDisplay(opts.submitByDate) : ''
  const overdue = Boolean(submitByLabel && submitByLabel !== reportLabel)

  for (const b of target) {
    const to = await getHodEmailsForBranch(b.id, users, branches)
    if (!to.length) {
      skipped.push(b.name)
      noEmailBranches.push(b)
      continue
    }
    const cc = opts?.ccManagement ? await misReminderCcList(to, b.name) : misBranchDirectorCc(b.name, to)
    const deadlineLine = overdue
      ? `<p>Please open the branch form, set the <b>Date</b> to <b>${esc(reportLabel)}</b> (the date you were supposed to send), complete the report, and submit <b>before 2:00 PM IST on ${esc(submitByLabel)}</b>.</p>`
      : `<p>Please submit your branch daily MIS for <b>${esc(reportLabel)}</b> before <b>2:00 PM IST</b> today.</p>`
    const rulesLine = `<p style="font-size:13px;color:#475569;margin-top:14px">• Submit every day before <b>2:00 PM IST</b>.<br>• A previous day's report is <b>never combined</b> with the next day's report.<br>• Late submissions receive a <b>separate consolidated acknowledgment</b>.</p>`
    const inner = `<p>Dear Branch HOD,</p>
        <p>Your branch <b>${esc(b.name)}</b> has <b style="color:#b91c1c">NOT submitted</b> the daily MIS for <b>${esc(reportLabel)}</b>.</p>
        ${deadlineLine}
        ${rulesLine}
        <p>Branch form: <a href="https://www.agilegroup-digital.co.in/mis-report">www.agilegroup-digital.co.in/mis-report</a></p>`
    const wrap = opts?.docCentre ? docCentreMailWrap : mailWrap
    const title = opts?.docCentre ? 'Daily MIS Reminder — Digital Operation Centre' : 'Daily MIS Reminder — Branch HOD'
    const subject = overdue
      ? `Agile Digital Operation Centre — MIS for ${reportLabel} — submit by 2 PM on ${submitByLabel}`
      : `Agile MIS — Daily report pending for ${b.name} (${reportLabel}) — deadline 2 PM`
    const result = await sendSuiteEmail(resend, {
      from,
      to,
      cc: cc.length ? cc : undefined,
      replyTo: misAckDirectorEmail(),
      subject,
      html: wrap(title, inner),
    })
    if (result.error) return { ok: false, error: result.error.message ?? 'Send failed', branch: b.name }
    await setReminderTime(reportDate, b.id, now)
    sent.push(b.name)
  }

  if (noEmailBranches.length) {
    const director = misAckDirectorEmail()
    const hodEmails = await getAllHodEmails()
    const mgmt = [director]
    if (noEmailBranches.some((b) => misBranchCcLokesh(b.name))) mgmt.push(LOKESH_CC_EMAIL)
    const mgmtTo = withoutNoMailRecipients(Array.from(new Set(mgmt)))
    const cc = withoutNoMailRecipients(
      Array.from(new Set(hodEmails.map((e) => e.trim().toLowerCase()).filter((e) => e.includes('@') && !mgmtTo.includes(e)))),
    )
    const branchList = noEmailBranches.map((b) => `<li><b>${esc(b.name)}</b></li>`).join('')
    const deadlineLine = overdue
      ? `<p>Set the <b>Date</b> to <b>${esc(reportLabel)}</b> in the form and submit <b>before 2:00 PM IST on ${esc(submitByLabel)}</b>.</p>`
      : `<p>Submit before <b>2:00 PM IST</b> each day.</p>`
    const inner = `<p>Dear Branch HODs,</p>
      <p>The following branch(es) have <b style="color:#b91c1c">NOT submitted</b> the daily MIS for <b>${esc(reportLabel)}</b>:</p>
      <ul>${branchList}</ul>
      ${deadlineLine}
      <p style="font-size:13px;color:#475569">• Submit every day before <b>2:00 PM IST</b>.<br>• Previous day's report is never combined with the next day.<br>• Late submissions receive a separate consolidated acknowledgment.</p>
      <p>Branch form: <a href="https://www.agilegroup-digital.co.in/mis-report">www.agilegroup-digital.co.in/mis-report</a></p>`
    const wrap = opts?.docCentre ? docCentreMailWrap : mailWrap
    const title = opts?.docCentre ? 'Daily MIS Reminder — Digital Operation Centre' : 'Daily MIS Reminder — Branch HODs'
    const subject = overdue
      ? `Agile Digital Operation Centre — MIS for ${reportLabel} — submit by 2 PM on ${submitByLabel}`
      : `Agile MIS — Daily report pending (${reportLabel}) — deadline 2 PM`
    const bulk = await sendSuiteEmail(resend, {
      from,
      to: mgmtTo,
      cc: cc.length ? cc : undefined,
      replyTo: director,
      subject,
      html: wrap(title, inner),
    })
    if (bulk.error) {
      return { ok: false, error: bulk.error.message ?? 'Bulk reminder failed', sent, skipped }
    }
    for (const b of noEmailBranches) {
      await setReminderTime(reportDate, b.id, now)
      sent.push(`${b.name} (management broadcast)`)
    }
  }

  return { ok: true, sent, skipped, date: reportDate, ccManagement: Boolean(opts?.ccManagement) }
}

export type MisSubmissionReminderSlot = 'morning' | 'midday'

export type MisReminderKind = 'branch' | 'director'

/** Unified reminder headline — same format for all reminders; URGENT on 2:00 PM slot. */
export function misReminderHeadline(
  kind: MisReminderKind,
  date: string,
  slot: MisSubmissionReminderSlot,
): { title: string; subject: string } {
  const reportLabel = misAckDateDisplay(date)
  const urgent = slot === 'midday'
  const prefix = urgent ? 'URGENT — ' : ''
  const role = kind === 'branch' ? 'Branch ' : 'Director '
  const title = `${prefix}${role}Daily MIS Submission Reminder-${reportLabel}. Please submit before 4.00 pm.`
  return { title, subject: title }
}

function misReminderAccent(slot: MisSubmissionReminderSlot): string {
  return slot === 'morning' ? '#f59e0b' : '#dc2626'
}

function misReminderDeadlineBox(text: string, urgent: boolean): string {
  const bg = urgent
    ? 'linear-gradient(135deg,#fef2f2,#fff7ed)'
    : 'linear-gradient(135deg,#fffbeb,#fef3c7)'
  const border = urgent ? '#fca5a5' : '#fcd34d'
  const color = urgent ? '#b91c1c' : '#92400e'
  return `<div style="margin:16px 0;padding:16px 18px;background:${bg};border:2px solid ${border};border-radius:10px;text-align:center">
    <div style="font-size:12px;font-weight:700;color:#64748b;letter-spacing:.4px">DEADLINE</div>
    <div style="font-size:18px;font-weight:800;color:${color};margin-top:6px;line-height:1.4">${text}</div>
  </div>`
}

function misReminderCtaButton(): string {
  return `<div style="text-align:center;margin:20px 0 8px">
    <a href="https://www.agilegroup-digital.co.in/mis-report" style="display:inline-block;padding:14px 28px;background:linear-gradient(135deg,#16a34a,#15803d);color:#ffffff;font-size:15px;font-weight:800;text-decoration:none;border-radius:10px;box-shadow:0 4px 14px rgba(22,163,74,.35)">Submit Daily MIS Now →</a>
  </div>`
}

/** Colourful branch reminder HTML (11 AM or 2 PM). */
export function buildMisBranchReminderHtml(
  branchName: string,
  date: string,
  slot: MisSubmissionReminderSlot,
): string {
  const morning = slot === 'morning'
  const accent = misReminderAccent(slot)
  const { title } = misReminderHeadline('branch', date, slot)
  const subtitle = morning
    ? `11:00 AM reminder · Branch: ${branchName}`
    : `2:00 PM urgent reminder · Branch: ${branchName}`
  const intro = morning
    ? `<p style="margin:0 0 14px;font-size:15px;line-height:1.65">Please submit your <b>Branch Daily MIS</b> for today.</p>`
    : `<p style="margin:0 0 14px;font-size:15px;line-height:1.65">Your branch has <b style="color:#b91c1c">still NOT submitted</b> today's daily MIS.</p>`
  const inner = `<p style="margin:0 0 12px;font-size:15px;line-height:1.6">Dear Branch Team,</p>
    <div style="display:inline-block;padding:8px 14px;background:#eff6ff;border:2px solid #93c5fd;border-radius:999px;font-size:14px;font-weight:700;color:#1d4ed8;margin-bottom:4px">Branch: ${esc(branchName)}</div>
    ${intro}
    ${misReminderDeadlineBox(`Please submit before <b>4.00 pm IST today</b>`, !morning)}
    <div style="margin:14px 0;padding:14px 16px;background:#fffbeb;border-left:4px solid #f59e0b;border-radius:8px">
      <div style="font-size:13px;font-weight:700;color:#92400e;margin-bottom:4px">⚠ Performance Notice</div>
      <div style="font-size:13px;color:#475569;line-height:1.55">Non-submission by <b>4.00 pm</b> counts as <b style="color:#b91c1c">zero performance</b> for the day and reduces monthly branch performance.</div>
    </div>
    ${misReminderCtaButton()}
    <p style="margin:12px 0 0;font-size:13px;color:#64748b;text-align:center">Portal: <a href="https://www.agilegroup-digital.co.in/mis-report" style="color:#1d4ed8">www.agilegroup-digital.co.in/mis-report</a></p>
    <p style="margin:18px 0 0;font-size:14px;line-height:1.6">Regards,<br><b>Director — Security Division</b><br>Agile Security Force Private Limited</p>`
  return misReminderMailWrap(title, subtitle, inner, accent)
}

/** Colourful Director pending summary (11 AM or 2 PM). */
export function buildMisDirectorReminderHtml(
  date: string,
  slot: MisSubmissionReminderSlot,
  opts: { submitted: number; total: number; pending: string[] },
): string {
  const morning = slot === 'morning'
  const accent = misReminderAccent(slot)
  const timeLabel = morning ? '11:00 AM' : '2:00 PM'
  const { title } = misReminderHeadline('director', date, slot)
  const subtitle = `${timeLabel}${morning ? '' : ' urgent'} reminder · ${opts.submitted}/${opts.total} branches submitted`

  if (!opts.pending.length) {
    const inner = `<p style="margin:0 0 14px;font-size:15px;line-height:1.6">Dear Director,</p>
      <div style="padding:18px;background:linear-gradient(135deg,#f0fdf4,#dcfce7);border:2px solid #86efac;border-radius:10px;text-align:center">
        <div style="font-size:28px">✓</div>
        <div style="font-size:16px;font-weight:800;color:#16a34a;margin-top:6px">All ${opts.total} branches have submitted</div>
        <div style="font-size:13px;color:#475569;margin-top:6px">Today's daily MIS for <b>${esc(misAckDateDisplay(date))}</b></div>
      </div>
      <p style="margin:16px 0 0;font-size:14px;color:#475569">Full consolidated dashboard will be sent at <b>5:00 PM IST</b>.</p>`
    return misReminderMailWrap(title, subtitle, inner, '#16a34a')
  }

  const pendingList = opts.pending
    .map(
      (name) =>
        `<li style="margin:0 0 8px;padding:10px 12px;background:#fef2f2;border-left:4px solid #dc2626;border-radius:6px;font-size:14px;font-weight:700;color:#991b1b">${esc(name)}</li>`,
    )
    .join('')
  const inner = `<p style="margin:0 0 14px;font-size:15px;line-height:1.6">Dear Director,</p>
    <div style="display:flex;gap:10px;flex-wrap:wrap;margin:0 0 16px">
      <div style="flex:1;min-width:120px;padding:14px;background:#f0fdf4;border-radius:10px;text-align:center;border:2px solid #86efac">
        <div style="font-size:26px;font-weight:800;color:#16a34a">${opts.submitted}</div>
        <div style="font-size:11px;color:#64748b;margin-top:4px">Submitted</div>
      </div>
      <div style="flex:1;min-width:120px;padding:14px;background:#fef2f2;border-radius:10px;text-align:center;border:2px solid #fca5a5">
        <div style="font-size:26px;font-weight:800;color:#dc2626">${opts.pending.length}</div>
        <div style="font-size:11px;color:#64748b;margin-top:4px">Pending</div>
      </div>
      <div style="flex:1;min-width:120px;padding:14px;background:#eff6ff;border-radius:10px;text-align:center;border:2px solid #93c5fd">
        <div style="font-size:26px;font-weight:800;color:#1d4ed8">${opts.total}</div>
        <div style="font-size:11px;color:#64748b;margin-top:4px">Total Branches</div>
      </div>
    </div>
    <p style="margin:0 0 10px;font-size:14px;font-weight:700;color:#b91c1c">Pending branches — please ensure submission before 4.00 pm IST:</p>
    <ul style="margin:0 0 16px;padding:0;list-style:none">${pendingList}</ul>
    <p style="margin:0 0 8px;font-size:13px;color:#475569;line-height:1.55">Branch reminders have been sent to HOD and branch staff for these branches.</p>
    <p style="margin:0;font-size:13px;color:#475569">Full consolidated dashboard at <b>5:00 PM IST</b>. · <a href="https://www.agilegroup-digital.co.in/mis-submission" style="color:#1d4ed8">Daily MIS Submission</a></p>`
  return misReminderMailWrap(title, subtitle, inner, accent)
}

export type MisSubmissionReminderOpts = {
  /** Send even if branch already submitted (manual re-remind). */
  force?: boolean
  /** Copy Director on each branch reminder (default true). */
  ccDirector?: boolean
}

/** 11:00 AM or 2:00 PM IST — one email per pending branch (HOD + branch staff in TO). */
export async function sendMisSubmissionReminders(
  date: string,
  slot: MisSubmissionReminderSlot,
  branchIds?: string[],
  opts?: MisSubmissionReminderOpts,
) {
  const apiKey = process.env.RESEND_API_KEY?.trim()
  if (!apiKey) return { ok: false, error: 'Email not configured' }

  const { pending, branches } = await computeDeploymentTotals(date)
  let target = pending
  if (branchIds?.length) {
    const ids = new Set(branchIds)
    target = opts?.force ? branches.filter((b) => ids.has(b.id)) : pending.filter((b) => ids.has(b.id))
  }
  if (!target.length) {
    return {
      ok: true,
      skipped: true,
      reason: branchIds?.length && opts?.force ? 'Branch not found' : 'All branches submitted',
    }
  }

  const users = await getUsers()
  const resend = new Resend(apiKey)
  const from = process.env.EMAIL_FROM ?? 'Agile MIS <noreply@agilegroup.co.in>'
  const director = misAckDirectorEmail()
  const ccDirector = opts?.ccDirector !== false
  const now = new Date().toISOString()
  const sent: string[] = []
  const skipped: string[] = []
  const emailed: { branch: string; to: string[]; cc: string[] }[] = []

  for (const b of target) {
    const to = withoutNoMailRecipients(await getBranchNotifyEmails(b.id, [], users, branches))
    if (!to.length) {
      skipped.push(b.name)
      continue
    }
    const toSet = new Set(to.map((e) => e.trim().toLowerCase()))
    const cc = ccDirector ? misBranchDirectorCc(b.name, to) : []
    const { subject } = misReminderHeadline('branch', date, slot)
    const result = await sendSuiteEmail(resend, {
      from,
      to,
      cc: cc.length ? cc : undefined,
      replyTo: director,
      subject,
      html: buildMisBranchReminderHtml(b.name, date, slot),
    })
    if (result.error) return { ok: false, error: result.error.message ?? 'Send failed', branch: b.name, sent, skipped }
    await setReminderTime(date, b.id, now)
    sent.push(b.name)
    emailed.push({ branch: b.name, to, cc })
  }

  return { ok: true, sent, skipped, emailed, date, slot, directorCc: ccDirector ? director : '' }
}

/** 11:00 AM or 2:00 PM IST — consolidated pending-branch reminder to Director only. */
export async function sendMisDirectorPendingReminder(date: string, slot: MisSubmissionReminderSlot) {
  const apiKey = process.env.RESEND_API_KEY?.trim()
  if (!apiKey) return { ok: false, error: 'Email not configured' }

  const { pending, submitted, branches } = await computeDeploymentTotals(date)
  const director = misAckDirectorEmail()

  const resend = new Resend(apiKey)
  const from = process.env.EMAIL_FROM ?? 'Agile MIS <noreply@agilegroup.co.in>'

  if (!pending.length) {
    const { subject } = misReminderHeadline('director', date, slot)
    const result = await sendSuiteEmail(resend, {
      from,
      to: director,
      replyTo: director,
      subject,
      html: buildMisDirectorReminderHtml(date, slot, {
        submitted: branches.length,
        total: branches.length,
        pending: [],
      }),
    })
    if (result.error) return { ok: false, error: result.error.message ?? 'Send failed' }
    return { ok: true, to: director, submitted, total: branches.length, pending: [], slot }
  }

  const { subject } = misReminderHeadline('director', date, slot)
  const result = await sendSuiteEmail(resend, {
    from,
    to: director,
    replyTo: director,
    subject,
    html: buildMisDirectorReminderHtml(date, slot, {
      submitted,
      total: branches.length,
      pending: pending.map((b) => b.name),
    }),
  })
  if (result.error) return { ok: false, error: result.error.message ?? 'Send failed' }
  return { ok: true, to: director, pending: pending.map((b) => b.name), submitted, total: branches.length, slot }
}

export async function sendMisPendingReminder(date: string) {
  return sendMisDirectorPendingReminder(date, 'midday')
}

export async function sendMisDirectorDigest(date: string) {
  const apiKey = process.env.RESEND_API_KEY?.trim()
  if (!apiKey) return { ok: false, error: 'Email not configured' }

  const { branches, submitted, pending, totals, branchRows } = await computeDeploymentTotals(date)

  let cmpOpen = 0
  let cTot = 0
  let cPvc = 0
  for (const b of branches) {
    const cs = await getComplaints(b.id)
    cmpOpen += cs.filter((c) => c.status !== 'Closed').length
    const docs = await getGuardDocs(b.id)
    for (const d of docs.filter(guardRecordEligible)) {
      cTot++
      if (docPresent(d.pvc)) cPvc++
    }
  }
  const pvcPct = cTot ? Math.round((cPvc / cTot) * 100) : 0

  const branchTable = branchRows
    .map(
      (r) =>
        `<tr><td>${esc(r.name)}</td><td style="text-align:center">${r.submitted ? '✓' : '<span style="color:#b91c1c">Pending</span>'}</td><td style="text-align:center">${r.depPct}%</td><td style="text-align:center;color:#b45309">${r.vac}</td></tr>`,
    )
    .join('')

  const resend = new Resend(apiKey)
  const from = process.env.EMAIL_FROM ?? 'Agile MIS <noreply@agilegroup.co.in>'
  const director = process.env.MIS_DIRECTOR_EMAIL?.trim() || process.env.FLEET_DIRECTOR_EMAIL?.trim() || 'director@agilegroup.co.in'

  const result = await sendSuiteEmail(resend, {
    from,
    to: director,
    subject: `Agile MIS — Daily Summary ${date} — ${submitted}/${branches.length} branches · ${totals.depPct}% deployment`,
    html: `<div style="font-family:Arial,sans-serif;max-width:720px;color:#111">
      <div style="background:#14224f;color:#fff;padding:18px;border-radius:10px 10px 0 0">
        <b style="font-size:18px;color:#c9a84c">Agile MIS — Daily Director Summary</b>
        <div style="font-size:13px;color:#cbd5e1;margin-top:4px">${esc(date)}</div>
      </div>
      <div style="display:flex;background:#f1f5f9;text-align:center;font-size:13px;flex-wrap:wrap">
        <div style="flex:1;min-width:100px;padding:12px"><b style="font-size:22px;color:#16a34a">${submitted}</b><br>Submitted</div>
        <div style="flex:1;min-width:100px;padding:12px"><b style="font-size:22px;color:#dc2626">${pending.length}</b><br>Pending</div>
        <div style="flex:1;min-width:100px;padding:12px"><b style="font-size:22px;color:#14224f">${totals.depPct}%</b><br>Deployment</div>
        <div style="flex:1;min-width:100px;padding:12px"><b style="font-size:22px;color:#b45309">${totals.vac}</b><br>Vacant Posts</div>
        <div style="flex:1;min-width:100px;padding:12px"><b style="font-size:22px;color:#7c3aed">${pvcPct}%</b><br>PVC Compliance</div>
        <div style="flex:1;min-width:100px;padding:12px"><b style="font-size:22px;color:#dc2626">${cmpOpen}</b><br>Open Complaints</div>
      </div>
      <div style="padding:16px">
        <h3 style="color:#14224f;border-left:4px solid #c9a84c;padding-left:8px">Branch Status</h3>
        <table style="border-collapse:collapse;width:100%;font-size:12px;margin-top:8px" border="1" cellpadding="6">
          <thead style="background:#14224f;color:#fff"><tr><th>Branch</th><th>Report</th><th>Deploy %</th><th>Vacant</th></tr></thead>
          <tbody>${branchTable}</tbody>
        </table>
        <p style="font-size:12px;color:#64748b;margin-top:14px">Full dashboard: <a href="https://www.agilegroup-digital.co.in/mis">www.agilegroup-digital.co.in/mis</a> · MD Report: /mis-md</p>
      </div>
    </div>`,
  })
  if (result.error) return { ok: false, error: result.error.message ?? 'Send failed' }
  return { ok: true, to: director }
}

export async function sendConsolidatedMisMail(date: string, to: string[]) {
  const apiKey = process.env.RESEND_API_KEY?.trim()
  if (!apiKey) return { ok: false, error: 'Email not configured' }
  if (!to.length) return { ok: false, error: 'No recipients' }

  const { branches, submitted, pending, totals, branchRows } = await computeDeploymentTotals(date)
  const rows = branchRows
    .map(
      (r) =>
        `<tr><td>${esc(r.name)}</td><td style="text-align:center">${r.submitted ? '<span style="color:#16a34a">✓</span>' : '<span style="color:#b91c1c">✗</span>'}</td><td style="text-align:center">${r.submitted ? r.depPct + '%' : '—'}</td><td style="text-align:center;color:#b45309">${r.submitted ? r.vac : '—'}</td></tr>`,
    )
    .join('')

  const resend = new Resend(apiKey)
  const from = process.env.EMAIL_FROM ?? 'Agile MIS <noreply@agilegroup.co.in>'
  const result = await sendSuiteEmail(resend, {
    from,
    to,
    subject: `Agile MIS — Consolidated Report ${date} — ${submitted}/${branches.length} branches`,
    html: mailWrap(
      `Consolidated MIS — ${date}`,
      `<p>All-branch summary for Director / management review.</p>
      <div style="display:flex;gap:12px;flex-wrap:wrap;margin:12px 0;text-align:center">
        <div style="flex:1;min-width:90px;padding:10px;background:#f0fdf4;border-radius:8px"><b style="font-size:20px;color:#16a34a">${submitted}/${branches.length}</b><br><span style="font-size:11px">MIS Received</span></div>
        <div style="flex:1;min-width:90px;padding:10px;background:#eff6ff;border-radius:8px"><b style="font-size:20px;color:#1d4ed8">${totals.san}</b><br><span style="font-size:11px">Auth. Posts</span></div>
        <div style="flex:1;min-width:90px;padding:10px;background:#f0fdf4;border-radius:8px"><b style="font-size:20px;color:#16a34a">${totals.dep}</b><br><span style="font-size:11px">Deployed</span></div>
        <div style="flex:1;min-width:90px;padding:10px;background:#fef2f2;border-radius:8px"><b style="font-size:20px;color:#dc2626">${totals.vac}</b><br><span style="font-size:11px">Vacant</span></div>
      </div>
      ${pending.length ? `<p style="color:#b91c1c;font-weight:700">⚠ MIS not received from ${pending.length} branch(es): ${pending.map((b) => esc(b.name)).join(', ')}</p>` : ''}
      <table style="border-collapse:collapse;width:100%;font-size:12px;margin-top:10px" border="1" cellpadding="6">
        <thead style="background:#14224f;color:#fff"><tr><th>Branch</th><th>MIS Recd</th><th>Deploy %</th><th>Vacant</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
      <p style="font-size:12px;color:#64748b;margin-top:12px">Full dashboard: <a href="https://www.agilegroup-digital.co.in/mis-board">agilegroup-digital.co.in/mis-board</a></p>`,
    ),
  })
  if (result.error) return { ok: false, error: result.error.message ?? 'Send failed' }
  return { ok: true, to }
}

export async function sendMdSirReportMail(date: string, to: string[], summary: Record<string, unknown>) {
  const apiKey = process.env.RESEND_API_KEY?.trim()
  if (!apiKey) return { ok: false, error: 'Email not configured' }
  if (!to.length) return { ok: false, error: 'No recipients' }

  const t = (summary.totals ?? {}) as { san?: number; dep?: number; abs?: number; ot?: number; vac?: number }
  const depPct = t.san ? Math.round(((t.dep ?? 0) * 100) / t.san) : 0
  const submitted = Number(summary.submitted ?? 0)
  const branchCount = Number(summary.branchCount ?? 0)

  const resend = new Resend(apiKey)
  const from = process.env.EMAIL_FROM ?? 'Agile MIS <noreply@agilegroup.co.in>'
  const result = await sendSuiteEmail(resend, {
    from,
    to,
    subject: `Agile MIS — MD Sir Daily Report ${date} — ${depPct}% deployment`,
    html: mailWrap(
      `MD Sir Report — ${date}`,
      `<p><b>Agile Security Force Pvt. Ltd.</b><br>Daily Operations Report — ${esc(date)}</p>
      <div style="display:flex;gap:10px;flex-wrap:wrap;margin:12px 0">
        <div style="padding:10px 14px;background:#eff6ff;border-radius:8px"><b style="font-size:18px;color:#1d4ed8">${t.san ?? 0}</b><br>Sanctioned</div>
        <div style="padding:10px 14px;background:#f0fdf4;border-radius:8px"><b style="font-size:18px;color:#16a34a">${t.dep ?? 0}</b><br>Deployed</div>
        <div style="padding:10px 14px;background:#fef2f2;border-radius:8px"><b style="font-size:18px;color:#dc2626">${t.vac ?? 0}</b><br>Vacant</div>
        <div style="padding:10px 14px;background:#fefce8;border-radius:8px"><b style="font-size:18px;color:#ca8a04">${depPct}%</b><br>Deploy %</div>
      </div>
      <p>${submitted}/${branchCount} branches submitted · ${branchCount - submitted} pending</p>
      <p style="font-size:12px;color:#64748b">Full interactive report: <a href="https://www.agilegroup-digital.co.in/mis-md">agilegroup-digital.co.in/mis-md</a></p>`,
    ),
  })
  if (result.error) return { ok: false, error: result.error.message ?? 'Send failed' }
  return { ok: true, to }
}

function misConsolidatedToEmail(): string {
  return (process.env.MIS_CONSOLIDATED_TO?.trim() || 'lokesh@agilegroup.co.in').toLowerCase()
}

export async function getAllHodEmails(): Promise<string[]> {
  const [users, branches] = await Promise.all([getUsers(), getBranches()])
  const emails = new Set<string>()
  for (const b of branches) {
    for (const em of await getHodEmailsForBranch(b.id, users, branches)) {
      emails.add(em.trim().toLowerCase())
    }
  }
  return withoutNoMailRecipients([...emails])
}

type MisAckDeployTotals = {
  san: number
  abs: number
  ot: number
  vac: number
  dep: number
  depPct: number
  collDisplay: string
}

export function buildMisAckEmailHtml(opts: {
  headerLine: string
  dateFor: string
  dearLine: string
  bodyLine: string
  submittedByLine: string
  totals: MisAckDeployTotals
  statsHtml: string
  alertHtml: string
  extraHtml?: string
}): string {
  const company = 'Agile Security Force Private Limited'
  const ackDate = misAckDateDisplay(opts.dateFor)
  const t = opts.totals
  return `<!DOCTYPE html><html><body style="margin:0;padding:0;background:#f4f4f5">
<div style="font-family:'Segoe UI',Arial,sans-serif;max-width:640px;margin:0 auto;background:#ffffff;color:#1e293b">
  <div style="padding:24px 28px 18px;border-bottom:3px solid #c9a84c">
    <div style="font-size:14px;color:#475569;margin-bottom:6px">To,</div>
    <div style="font-size:16px;font-weight:700;color:#14224f;line-height:1.45">${esc(company)}</div>
    <div style="font-size:14px;color:#334155;margin-top:10px;line-height:1.5">
      <b>${esc(opts.headerLine)}</b> · Response to Daily MIS submitted on: <b>${esc(ackDate)}</b>
    </div>
  </div>
  <div style="padding:24px 28px">
    <p style="margin:0 0 14px;font-size:15px;line-height:1.6">${opts.dearLine}</p>
    <p style="margin:0 0 18px;font-size:15px;line-height:1.6">${opts.bodyLine}</p>
    <p style="margin:0 0 16px;font-size:13px;color:#64748b">${opts.submittedByLine}</p>
    <div style="font-weight:700;color:#14224f;font-size:14px;margin-bottom:4px">Daily Deployment Summary</div>
    ${misAckRowDivider()}
    <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 4px;border-collapse:separate;border-spacing:8px 10px">
      <tr>
        <td width="16.66%" style="padding:14px 8px;background:#eff6ff;border-radius:8px;text-align:center;vertical-align:middle">
          <div style="font-size:24px;font-weight:700;color:#1d4ed8;line-height:1.2">${t.san}</div>
          <div style="font-size:11px;color:#64748b;margin-top:6px">Sanctioned</div>
        </td>
        <td width="16.66%" style="padding:14px 8px;background:#fef2f2;border-radius:8px;text-align:center;vertical-align:middle">
          <div style="font-size:24px;font-weight:700;color:#dc2626;line-height:1.2">${t.abs}</div>
          <div style="font-size:11px;color:#64748b;margin-top:6px">Absent</div>
        </td>
        <td width="16.66%" style="padding:14px 8px;background:#fff7ed;border-radius:8px;text-align:center;vertical-align:middle">
          <div style="font-size:24px;font-weight:700;color:#ea580c;line-height:1.2">${t.ot}</div>
          <div style="font-size:11px;color:#64748b;margin-top:6px">OT</div>
        </td>
        <td width="16.66%" style="padding:14px 8px;background:#fefce8;border-radius:8px;text-align:center;vertical-align:middle">
          <div style="font-size:24px;font-weight:700;color:#ca8a04;line-height:1.2">${t.vac}</div>
          <div style="font-size:11px;color:#64748b;margin-top:6px">Vacant</div>
        </td>
        <td width="16.66%" style="padding:14px 8px;background:#f0fdf4;border-radius:8px;text-align:center;vertical-align:middle">
          <div style="font-size:24px;font-weight:700;color:#16a34a;line-height:1.2">${t.dep}</div>
          <div style="font-size:11px;color:#64748b;margin-top:6px">Deployed</div>
        </td>
        <td width="16.66%" style="padding:14px 8px;background:#f5f3ff;border-radius:8px;text-align:center;vertical-align:middle">
          <div style="font-size:24px;font-weight:700;color:#7c3aed;line-height:1.2">${esc(t.collDisplay)}</div>
          <div style="font-size:11px;color:#64748b;margin-top:6px">Collection</div>
        </td>
      </tr>
    </table>
    <p style="margin:8px 0 16px;font-size:13px;color:#475569">Deployment: <b>${t.depPct}%</b></p>
    ${misAckRowDivider()}
    ${opts.statsHtml}
    ${misAckRowDivider()}
    <div style="margin:0 0 20px;padding:16px 18px;background:#fffbeb;border:1px solid #fcd34d;border-radius:8px">
      <div style="font-size:14px;font-weight:700;color:#92400e;margin-bottom:10px">Suggestion (AI) — Alert Message</div>
      <ul style="margin:0;padding-left:18px;font-size:13px">${opts.alertHtml}</ul>
    </div>
    ${opts.extraHtml || ''}
    <p style="margin:0 0 6px;font-size:14px;line-height:1.6">Regards,</p>
    <p style="margin:0;font-size:14px;line-height:1.6">
      <b>Director — Security Division</b><br>
      ${company}
    </p>
    <p style="margin:18px 0 0;font-size:12px;color:#64748b">
      <a href="https://www.agilegroup-digital.co.in/mis-report" style="color:#1d4ed8">Open MIS Command Centre</a>
    </p>
    ${misAckFooterHtml()}
  </div>
</div>
</body></html>`
}

type ConsolidatedBranchRow = {
  name: string
  submitted: boolean
  san: number
  abs: number
  ot: number
  vac: number
  dep: number
  depPct: number
  collectionPct: string
}

async function buildConsolidatedMisAckPayload(date: string, filter?: { onTimeOnly?: boolean; lateOnly?: boolean }) {
  const [branches, allReports, clients] = await Promise.all([
    getBranches(true),
    getReportsForDate(date),
    getClients(),
  ])
  const reports = allReports.filter((r) => {
    const onTime = isOnTimeMisSubmission(r.dateFor, r.submittedAt)
    if (filter?.onTimeOnly) return onTime
    if (filter?.lateOnly) return !onTime
    return true
  })
  const reportMap = buildBranchReportMap(branches, reports)
  const countedReportIds = new Set<string>()

  let san = 0
  let abs = 0
  let ot = 0
  let dep = 0
  let vac = 0
  let collWeighted = 0
  let collWeight = 0
  let sumComplaints = 0
  let sumLate = 0
  let sumOut = 0
  let medSum = 0
  let pvcSum = 0
  let psaraSum = 0
  let medN = 0
  let pvcN = 0
  let psaraN = 0
  const pending: string[] = []
  const branchRows: ConsolidatedBranchRow[] = []

  for (const b of branches) {
    const r = reportMap.get(b.id)
    if (!r) {
      pending.push(b.name)
      branchRows.push({
        name: b.name,
        submitted: false,
        san: 0,
        abs: 0,
        ot: 0,
        vac: 0,
        dep: 0,
        depPct: 0,
        collectionPct: '—',
      })
      continue
    }
    const t = reportDeployTotals(r.rows as Record<string, unknown>[], r.branchId, clients)
    const v = Math.max(0, t.abs - t.ot)
    const d = Math.min(t.san, Math.max(0, t.san - v))
    if (!countedReportIds.has(r.id)) {
      countedReportIds.add(r.id)
      san += t.san
      abs += t.abs
      ot += t.ot
      vac += v
      dep += d
      const coll = pctNum(r.summary?.collectionPct)
      if (coll > 0 && t.san > 0) {
        collWeighted += coll * t.san
        collWeight += t.san
      }
      const medical = pctNum(r.summary?.medicalFitnessPct)
      const pvc = pctNum(r.summary?.pvcPct)
      const psara = pctNum(r.summary?.psaraPct)
      if (medical > 0) {
        medSum += medical
        medN++
      }
      if (pvc > 0) {
        pvcSum += pvc
        pvcN++
      }
      if (psara > 0) {
        psaraSum += psara
        psaraN++
      }
      sumComplaints += intNum(r.summary?.complaints)
      sumLate += intNum(r.summary?.lateStartCases)
      sumOut += intNum(r.summary?.outOfPostCases)
    }
    branchRows.push({
      name: b.name,
      submitted: true,
      san: t.san,
      abs: t.abs,
      ot: t.ot,
      vac: v,
      dep: d,
      depPct: deployPct(d, t.san),
      collectionPct: String(r.summary?.collectionPct || '—'),
    })
  }

  const depPct = san ? Math.round((dep / san) * 100) : 0
  const collDisplay = collWeight ? `${(collWeighted / collWeight).toFixed(2)}%` : '—'
  const mergedSummary: Record<string, string> = {
    collectionPct: collDisplay.replace(/%/g, '').trim(),
    complaints: String(sumComplaints),
    lateStartCases: String(sumLate),
    outOfPostCases: String(sumOut),
    medicalFitnessPct: medN ? String(Math.round(medSum / medN)) : '',
    pvcPct: pvcN ? String(Math.round(pvcSum / pvcN)) : '',
    psaraPct: psaraN ? String(Math.round(psaraSum / psaraN)) : '',
    remarks: '',
  }

  const ackStats = await buildConsolidatedAckStats(date)
  const aiAlerts = buildMisAckAiAlerts({ san, abs, ot, vac, dep, depPct }, mergedSummary)
  if (pending.length) {
    aiAlerts.unshift(
      `${pending.length} branch(es) have NOT submitted MIS today: ${pending.join(', ')}. Follow up before close of day.`,
    )
  }

  return {
    san,
    abs,
    ot,
    vac,
    dep,
    depPct,
    collDisplay,
    ackStats,
    aiAlerts,
    pending,
    branchRows,
    submitted: countedReportIds.size,
    branchCount: branches.length,
    date,
  }
}

function consolidatedBranchTableHtml(rows: ConsolidatedBranchRow[]): string {
  const body = rows
    .map((r) => {
      const status = r.submitted
        ? '<span style="color:#16a34a">✓</span>'
        : '<span style="color:#dc2626">Pending</span>'
      const coll = r.submitted ? esc(r.collectionPct) : '—'
      return `<tr>
        <td style="padding:8px 10px;border-bottom:1px solid #e2e8f0;font-size:12px">${esc(r.name)}</td>
        <td style="padding:8px 10px;border-bottom:1px solid #e2e8f0;text-align:center;font-size:12px">${status}</td>
        <td style="padding:8px 10px;border-bottom:1px solid #e2e8f0;text-align:center;font-size:12px">${r.submitted ? r.san : '—'}</td>
        <td style="padding:8px 10px;border-bottom:1px solid #e2e8f0;text-align:center;font-size:12px">${r.submitted ? r.abs : '—'}</td>
        <td style="padding:8px 10px;border-bottom:1px solid #e2e8f0;text-align:center;font-size:12px">${r.submitted ? r.ot : '—'}</td>
        <td style="padding:8px 10px;border-bottom:1px solid #e2e8f0;text-align:center;font-size:12px">${r.submitted ? r.vac : '—'}</td>
        <td style="padding:8px 10px;border-bottom:1px solid #e2e8f0;text-align:center;font-size:12px">${r.submitted ? r.dep : '—'}</td>
        <td style="padding:8px 10px;border-bottom:1px solid #e2e8f0;text-align:center;font-size:12px">${r.submitted ? `${r.depPct}%` : '—'}</td>
        <td style="padding:8px 10px;border-bottom:1px solid #e2e8f0;text-align:center;font-size:12px">${coll}</td>
      </tr>`
    })
    .join('')

  return `<div style="margin:0 0 20px">
    <div style="font-weight:700;color:#14224f;font-size:14px;margin-bottom:8px">Branch-wise MIS Data (each branch)</div>
    <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e2e8f0;border-radius:8px;overflow:hidden;border-collapse:collapse">
      <thead>
        <tr style="background:#f1f5f9">
          <th style="padding:10px;font-size:11px;text-align:left;color:#14224f">Branch</th>
          <th style="padding:10px;font-size:11px;color:#14224f">Report</th>
          <th style="padding:10px;font-size:11px;color:#14224f">San</th>
          <th style="padding:10px;font-size:11px;color:#14224f">Abs</th>
          <th style="padding:10px;font-size:11px;color:#14224f">OT</th>
          <th style="padding:10px;font-size:11px;color:#14224f">Vac</th>
          <th style="padding:10px;font-size:11px;color:#14224f">Dep</th>
          <th style="padding:10px;font-size:11px;color:#14224f">Deploy%</th>
          <th style="padding:10px;font-size:11px;color:#14224f">Coll%</th>
        </tr>
      </thead>
      <tbody>${body}</tbody>
    </table>
  </div>`
}

/** 5:00 PM IST — consolidated daily dashboard to Director (all same-day submissions). */
export async function sendMisConsolidatedDailyAck(date: string) {
  const apiKey = process.env.RESEND_API_KEY?.trim()
  if (!apiKey) return { ok: false, error: 'Email not configured' }

  const payload = await buildConsolidatedMisAckPayload(date)
  const statsHtml = ackStatsTableHtml(payload.ackStats)
  const alertHtml = payload.aiAlerts
    .map((a) => `<li style="margin:0 0 8px;line-height:1.5;color:#1e293b">${esc(a)}</li>`)
    .join('')
  const html = buildMisAckEmailHtml({
    headerLine: 'ALL BRANCHES — Consolidated Dashboard',
    dateFor: date,
    dearLine: 'Dear Director,',
    bodyLine:
      'Please find the <b>consolidated Daily MIS Dashboard</b> for all branches — combined deployment and branch status below (sent daily at 5:00 PM IST).',
    submittedByLine: `Branches submitted: <b style="color:#14224f">${payload.submitted} of ${payload.branchCount}</b>`,
    totals: {
      san: payload.san,
      abs: payload.abs,
      ot: payload.ot,
      vac: payload.vac,
      dep: payload.dep,
      depPct: payload.depPct,
      collDisplay: payload.collDisplay,
    },
    statsHtml,
    alertHtml,
    extraHtml: consolidatedBranchTableHtml(payload.branchRows),
  })

  const resend = new Resend(apiKey)
  const from = misAckFromAddress()
  const director = misAckDirectorEmail()
  const gmailCopy = misAckGmailCopy()
  const cc = gmailCopy && gmailCopy !== director ? [gmailCopy] : undefined

  const subject = `MIS Consolidated Dashboard — ${date} — ${payload.submitted}/${payload.branchCount} branches — ${payload.depPct}% deployed`
  const result = await sendSuiteEmail(resend, {
    from,
    to: director,
    cc,
    replyTo: director,
    subject,
    html,
  })
  if (result.error) return { ok: false, error: result.error.message ?? 'Send failed', to: director, cc }
  if (!result.data?.id) return { ok: false, error: 'No delivery confirmation', to: director, cc }

  return {
    ok: true,
    to: director,
    cc,
    from,
    submitted: payload.submitted,
    branchCount: payload.branchCount,
    pending: payload.pending,
    depPct: payload.depPct,
  }
}

/** Late submissions only — separate consolidated email (not mixed with on-time 4 PM report). */
export async function sendMisLateConsolidatedAck(date: string) {
  const apiKey = process.env.RESEND_API_KEY?.trim()
  if (!apiKey) return { ok: false, error: 'Email not configured' }

  const payload = await buildConsolidatedMisAckPayload(date, { lateOnly: true })
  if (!payload.submitted) return { ok: true, skipped: true, reason: 'No late submissions for this date' }

  const statsHtml = ackStatsTableHtml(payload.ackStats)
  const alertHtml = payload.aiAlerts
    .map((a) => `<li style="margin:0 0 8px;line-height:1.5;color:#1e293b">${esc(a)}</li>`)
    .join('')
  const html = buildMisAckEmailHtml({
    headerLine: 'LATE SUBMISSIONS — Consolidated',
    dateFor: date,
    dearLine: 'Dear Team,',
    bodyLine:
      'Please find the <b>late submission</b> consolidated MIS response below. These branches submitted after the 2:00 PM IST deadline or on a later day. They are <b>not included</b> in the on-time consolidated report.',
    submittedByLine: `Late submissions: <b style="color:#14224f">${payload.submitted}</b> branch(es) for ${misAckDateDisplay(date)}`,
    totals: {
      san: payload.san,
      abs: payload.abs,
      ot: payload.ot,
      vac: payload.vac,
      dep: payload.dep,
      depPct: payload.depPct,
      collDisplay: payload.collDisplay,
    },
    statsHtml,
    alertHtml,
    extraHtml: consolidatedBranchTableHtml(payload.branchRows),
  })

  const resend = new Resend(apiKey)
  const from = misAckFromAddress()
  const to = misConsolidatedToEmail()
  const director = misAckDirectorEmail()
  const hodEmails = await getAllHodEmails()
  const cc = withoutNoMailRecipients(
    Array.from(
      new Set(
        [...hodEmails, director, misAckGmailCopy()]
          .map((e) => e.trim().toLowerCase())
          .filter((e) => e.includes('@') && e !== to),
      ),
    ),
  )

  const subject = `MIS Late Submission — Consolidated — ${misAckDateDisplay(date)} — ${payload.submitted} branch(es)`
  const result = await sendSuiteEmail(resend, {
    from,
    to,
    cc: cc.length ? cc : undefined,
    replyTo: director,
    subject,
    html,
  })
  if (result.error) return { ok: false, error: result.error.message ?? 'Send failed', to, cc }
  if (!result.data?.id) return { ok: false, error: 'No delivery confirmation', to, cc }

  return {
    ok: true,
    to,
    cc,
    from,
    submitted: payload.submitted,
    branchCount: payload.branchCount,
    depPct: payload.depPct,
    late: true,
  }
}

/** Acknowledgment email to branch HOD after daily report submit. */
export async function sendBranchSubmitAck(
  report: {
    branchId: string
    branchName: string
    dateFor: string
    submittedBy: string
    submitterEmail?: string
    rows: Record<string, unknown>[]
    summary: Record<string, string>
  },
  extraTo: string[] = [],
) {
  const apiKey = process.env.RESEND_API_KEY?.trim()
  if (!apiKey) return { ok: false, skipped: true, error: 'Email not configured' }

  const defaultAckStats = {
    guardsTotal: 0,
    pvcValid: 0,
    medicalValid: 0,
    dayVisits: Number(report.summary.dayVisits) || 0,
    nightChecks: Number(report.summary.nightChecks) || 0,
    srMgmtVisits: 0,
    resigned: Number(report.summary.resignation) || 0,
    recruitmentOpen: Number(report.summary.recruitment) || 0,
    weeklyCollected: 0,
    weeklyBudget: 0,
    guardComplaints: { received: 0, solved: 0, avgResponseHrs: null as number | null },
    clientComplaints: { received: 0, solved: 0, avgResponseHrs: null as number | null },
  }

  /* Parallel load — keep acknowledgment email under ~2s so submit feels instant */
  const [clients, users, branches, ackStats] = await Promise.all([
    getClients(report.branchId),
    getUsers(),
    getBranches(),
    Promise.race([
      buildBranchAckStats(report.branchId, report.branchName, report.dateFor).catch(() => defaultAckStats),
      new Promise<typeof defaultAckStats>((resolve) => setTimeout(() => resolve(defaultAckStats), 1800)),
    ]),
  ])

  const t = reportDeployTotals(report.rows, report.branchId, clients)
  const vac = Math.max(0, t.abs - t.ot)
  const dep = Math.min(t.san, Math.max(0, t.san - vac))
  const depPct = t.san ? Math.round((dep / t.san) * 100) : 0
  const coll = report.summary.collectionPct || '—'
  const collDisplay =
    coll === '—' || !String(coll).trim() ? '—' : `${String(coll).replace(/%/g, '').trim()}%`
  const aiAlerts = buildMisAckAiAlerts(
    { san: t.san, abs: t.abs, ot: t.ot, vac, dep, depPct },
    report.summary,
    ackStats,
  )
  const statsHtml = ackStatsTableHtml(ackStats)
  const alertHtml = aiAlerts
    .map(
      (a) =>
        `<li style="margin:0 0 8px;line-height:1.5;color:#1e293b">${esc(a)}</li>`,
    )
    .join('')

  const storedEmail = String(report.submitterEmail ?? '').trim().toLowerCase()
  const submitterEmails = [
    ...extraTo,
    ...(storedEmail ? [storedEmail] : []),
  ].filter((e) => e.includes('@'))
  const branchRecipients = withoutNoMailRecipients(
    await getBranchNotifyEmails(report.branchId, submitterEmails, users, branches),
  )
  const directorEmail = misAckDirectorEmail()
  const gmailCopy = misAckGmailCopy()

  const resend = new Resend(apiKey)
  const from = misAckFromAddress()
  const subject = `MIS Acknowledgment — ${report.branchName} — ${report.dateFor} — ${depPct}% deployed`
  const html = buildMisAckEmailHtml({
    headerLine: report.branchName,
    dateFor: report.dateFor,
    dearLine: 'Dear Branch / Zone Team,',
    bodyLine: 'Thank you for submission of your <b>Branch/Zone MIS</b>. Please find the status below.',
    submittedByLine: `Submitted by: <b style="color:#14224f">${esc(report.submittedBy || 'Branch team')}</b>`,
    totals: { san: t.san, abs: t.abs, ot: t.ot, vac, dep, depPct, collDisplay },
    statsHtml,
    alertHtml,
  })

  const primaryTo =
    branchRecipients.find((e) => !isNoMailRecipientEmail(e)) ||
    submitterEmails.map((e) => e.trim().toLowerCase()).find((e) => e.includes('@') && !isNoMailRecipientEmail(e)) ||
    directorEmail

  /* Director must always receive — put in To (CC is often dropped by mail systems) */
  const toList = withoutNoMailRecipients(
    Array.from(
      new Set(
        [primaryTo, directorEmail, gmailCopy]
          .map((e) => String(e || '').trim().toLowerCase())
          .filter((e) => e.includes('@')),
      ),
    ),
  )
  const ccForSend = withoutNoMailRecipients(
    Array.from(
      new Set(
        [
          ...branchRecipients
            .map((e) => e.trim().toLowerCase())
            .filter((e) => e.includes('@') && !toList.includes(e)),
          ...(misBranchCcLokesh(report.branchName) ? [LOKESH_CC_EMAIL] : []),
        ],
      ),
    ),
  )

  async function trySend(): Promise<{ ok: boolean; id?: string; error?: string }> {
    const result = await sendSuiteEmail(resend, {
      from,
      to: toList,
      cc: ccForSend.length ? ccForSend : undefined,
      replyTo: directorEmail,
      subject,
      html,
    })
    if (result.error) return { ok: false, error: result.error.message ?? 'Send failed' }
    if (!result.data?.id) return { ok: false, error: 'No delivery confirmation' }
    return { ok: true, id: result.data.id }
  }

  let send = await trySend()
  let lastError = send.error
  if (!send.ok) {
    await new Promise((r) => setTimeout(r, 800))
    send = await trySend()
    lastError = send.error
  }
  /* Dedicated Director copy if bulk To/CC failed */
  const directorCcList = [directorEmail, gmailCopy]
  if (misBranchCcLokesh(report.branchName) && !directorCcList.includes(LOKESH_CC_EMAIL)) {
    directorCcList.push(LOKESH_CC_EMAIL)
  }

  if (!send.ok) {
    const dir = await resendOne(resend, from, directorEmail, subject, html, directorEmail)
    if (dir.ok) {
      if (gmailCopy && gmailCopy !== directorEmail) {
        await resendOne(resend, from, gmailCopy, subject, html, directorEmail).catch(() => null)
      }
      if (misBranchCcLokesh(report.branchName)) {
        await resendOne(resend, from, LOKESH_CC_EMAIL, subject, html, directorEmail).catch(() => null)
      }
      await markMisAckSent(report.branchId, report.dateFor, directorCcList.filter(Boolean))
      return {
        ok: true,
        to: [directorEmail],
        from,
        directorEmail,
        submitterTo: [primaryTo],
        directorCc: directorCcList,
        forwardedToDirector: true,
        branchErrors: [lastError || `Could not reach branch inbox — Director received copy`],
        aiAlerts,
        ackStats,
        totals: { san: t.san, abs: t.abs, ot: t.ot, vac, dep, depPct, collectionPct: coll },
      }
    }
  }

  if (!send.ok) {
    return {
      ok: false,
      error: send.error || 'Thank-you email could not be sent',
      directorEmail,
      to: [],
      from,
      submitterTo: [primaryTo],
      directorCc: directorCcList,
      aiAlerts,
      ackStats,
    }
  }

  const sentTo = [...toList, ...ccForSend]
  await markMisAckSent(report.branchId, report.dateFor, sentTo)

  return {
    ok: true,
    to: sentTo,
    from,
    directorEmail,
    submitterTo: [primaryTo],
    directorCc: directorCcList,
    aiAlerts,
    ackStats,
    totals: { san: t.san, abs: t.abs, ot: t.ot, vac, dep, depPct, collectionPct: coll },
  }
}

/** Resend full dashboard thank-you email for today's latest branch report (or a specific branch). */
export async function sendMisAckForLatestReport(dateFor?: string, branchId?: string) {
  const date = dateFor || misTodayIst()
  const reports = await getReportsForDate(date)
  if (!reports.length) {
    return { ok: false, error: `No branch MIS submitted yet for ${date}.` }
  }
  let report = branchId ? reports.find((r) => r.branchId === branchId) : undefined
  if (!report) {
    report = [...reports].sort(
      (a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime(),
    )[0]
  }
  if (!report) return { ok: false, error: 'Report not found.' }
  const ack = await sendBranchSubmitAck(
    {
      branchId: report.branchId,
      branchName: report.branchName,
      dateFor: report.dateFor,
      submittedBy: report.submittedBy,
      submitterEmail: report.submitterEmail,
      rows: report.rows as Record<string, unknown>[],
      summary: report.summary as Record<string, string>,
    },
    [],
  )
  return { ...ack, branch: report.branchName, dateFor: report.dateFor }
}

/** Resend acknowledgment only for today's submissions that did not get a confirmed ack email. */
export async function sendMissingMisAcksForDate(dateFor?: string) {
  const date = dateFor || misTodayIst()
  const reports = await getReportsForDate(date)
  if (!reports.length) return { ok: false, error: `No branch MIS submitted for ${date}.` }
  const sent: string[] = []
  const skipped: string[] = []
  const errors: string[] = []
  for (const report of reports) {
    const prev = await getMisAckSent(report.branchId, report.dateFor)
    if (prev?.at) {
      skipped.push(report.branchName)
      continue
    }
    const ack = await sendBranchSubmitAck(
      {
        branchId: report.branchId,
        branchName: report.branchName,
        dateFor: report.dateFor,
        submittedBy: report.submittedBy,
        submitterEmail: report.submitterEmail,
        rows: report.rows as Record<string, unknown>[],
        summary: report.summary as Record<string, string>,
      },
      report.submitterEmail ? [report.submitterEmail] : [],
    )
    if (ack.ok) sent.push(report.branchName)
    else errors.push(`${report.branchName}: ${ack.error || 'send failed'}`)
  }
  return {
    ok: sent.length > 0 || skipped.length > 0,
    date,
    sent,
    skipped,
    errors: errors.length ? errors : undefined,
    total: reports.length,
  }
}

/** Resend thank-you / dashboard acknowledgment email to every branch that submitted on a date. */
export async function sendMisAckForAllSubmissionsToday(dateFor?: string, branchNameFilter?: string[]) {
  const date = dateFor || misTodayIst()
  const reports = await getReportsForDate(date)
  if (!reports.length) {
    return { ok: false, error: `No branch MIS submitted for ${date}.` }
  }
  const filters = (branchNameFilter ?? [])
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean)
  const target = filters.length
    ? reports.filter((r) => {
        const n = String(r.branchName ?? '').toLowerCase()
        return filters.some((f) => n.includes(f) || f.includes(n))
      })
    : reports
  if (!target.length) {
    return {
      ok: false,
      error: `No matching submissions for filter: ${filters.join(', ')}`,
      date,
      available: reports.map((r) => r.branchName),
    }
  }
  const sent: string[] = []
  const errors: string[] = []
  const directorCopies: string[] = []
  for (const report of target) {
    const ack = await sendBranchSubmitAck(
      {
        branchId: report.branchId,
        branchName: report.branchName,
        dateFor: report.dateFor,
        submittedBy: report.submittedBy,
        submitterEmail: report.submitterEmail,
        rows: report.rows as Record<string, unknown>[],
        summary: report.summary as Record<string, string>,
      },
      report.submitterEmail ? [report.submitterEmail] : [],
    )
    if (ack.ok) {
      sent.push(report.branchName)
      if ('directorCc' in ack && Array.isArray(ack.directorCc)) {
        directorCopies.push(`${report.branchName} → ${(ack.directorCc as string[]).join(', ')}`)
      }
    } else errors.push(`${report.branchName}: ${ack.error || 'send failed'}`)
  }
  return {
    ok: sent.length > 0,
    date,
    sent,
    directorCopies,
    errors: errors.length ? errors : undefined,
    total: target.length,
  }
}

function misMdExcludeEmails(): Set<string> {
  const raw = [
    process.env.MIS_MD_EMAIL?.trim(),
    process.env.MIS_MD_SIR_EMAIL?.trim(),
    'md@agilegroup.co.in',
  ]
  return new Set(raw.filter((e) => e && e.includes('@')).map((e) => e!.toLowerCase()))
}

function isMdMisUser(u: MisUser, mdExclude: Set<string>): boolean {
  const em = String(u.email ?? '').trim().toLowerCase()
  if (mdExclude.has(em)) return true
  const role = String(u.role ?? '').toLowerCase()
  return role.includes('md sir') || role === 'md' || role === 'managing director'
}

/** Collect all branch / operations team emails — excludes MD Sir. */
export async function getTeamBroadcastEmails(): Promise<string[]> {
  const mdExclude = misMdExcludeEmails()
  const director = misAckDirectorEmail()
  const [users, hodEmails] = await Promise.all([getUsers(), getAllHodEmails()])
  const emails = new Set<string>()
  for (const u of users) {
    if (u.active === false || !u.email?.includes('@')) continue
    if (isSupportMisUser(u) || isMdMisUser(u, mdExclude)) continue
    emails.add(u.email.trim().toLowerCase())
  }
  for (const em of hodEmails) {
    const e = em.trim().toLowerCase()
    if (!mdExclude.has(e)) emails.add(e)
  }
  emails.delete(director)
  for (const md of mdExclude) emails.delete(md)
  return withoutNoMailRecipients([...emails])
}

/** One team notice: old Manus closed — TO each person, CC Director (not MD). */
export async function sendManusClosedTeamNotice() {
  const apiKey = process.env.RESEND_API_KEY?.trim()
  if (!apiKey) return { ok: false, error: 'Email not configured' }

  const team = await getTeamBroadcastEmails()
  if (!team.length) return { ok: false, error: 'No team emails on file — add users in MIS User Management.' }

  const director = misAckDirectorEmail()
  const gmailCopy = misAckGmailCopy()
  const cc = withoutNoMailRecipients(
    Array.from(new Set([director, gmailCopy].map((e) => e.trim().toLowerCase()))),
  )
  const from = misAckFromAddress()
  const resend = new Resend(apiKey)
  const subject = 'IMPORTANT — Old MIS (agilereporting.live) CLOSED — Use New Portal'
  const inner = `<p>Dear Branch / Operations Team,</p>
    <p style="color:#b91c1c;font-weight:700">The OLD Manus / Railway MIS (agilereporting.live) is PERMANENTLY CLOSED.</p>
    <p>Please <b>ignore</b> any URGENT reminder emails from the old system. Do not use old bookmarks.</p>
    <p>From today, use <b>ONLY</b>:</p>
    <p style="font-size:16px"><a href="https://www.agilegroup-digital.co.in">https://www.agilegroup-digital.co.in</a></p>
    <p><b>Branch HODs — daily report:</b></p>
    <ol style="line-height:1.8">
      <li>Open the website above</li>
      <li>App <b>05</b> Agile MIS</li>
      <li>Tap <b>HODs / Staff</b></li>
      <li>Select your branch → enter your <b>@agilegroup.co.in</b> email + branch password</li>
      <li><b>Daily MIS Submission</b></li>
    </ol>
    <p style="font-size:13px;color:#64748b">Old address (do not use): mis-app-production-ac50.up.railway.app</p>
    <p>Regards,<br><b>Director, Security Division</b><br>Agile Security Force Private Limited</p>`
  const html = mailWrap('IMPORTANT — Agile MIS Portal Change', inner)

  const sent: string[] = []
  const errors: string[] = []
  const delay = (ms: number) => new Promise((r) => setTimeout(r, ms))

  async function sendOne(to: string): Promise<boolean> {
    const result = await sendSuiteEmail(resend, {
      from,
      to,
      cc: cc.length ? cc : undefined,
      replyTo: director,
      subject,
      html,
    })
    if (result.error || !result.data?.id) {
      errors.push(`${to}: ${result.error?.message || 'send failed'}`)
      return false
    }
    sent.push(to)
    return true
  }

  for (const to of team) {
    await sendOne(to)
    await delay(600)
  }

  const missed = team.filter((e) => !sent.includes(e))
  if (missed.length) {
    await delay(2000)
    for (const to of missed) {
      await sendOne(to)
      await delay(600)
    }
  }

  return {
    ok: sent.length > 0,
    sent,
    cc,
    excludedMd: [...misMdExcludeEmails()],
    errors: errors.length ? errors : undefined,
    total: team.length,
  }
}

/** Send sample thank-you email to Director (same mail path as branch submit). */
export async function sendMisAckTestToDirector() {
  const latest = await sendMisAckForLatestReport()
  if (latest.ok) return latest

  const apiKey = process.env.RESEND_API_KEY?.trim()
  if (!apiKey) return { ok: false, error: 'Email not configured' }
  const directorEmail = misAckDirectorEmail()
  const from = misAckFromAddress()
  const resend = new Resend(apiKey)
  const subject = `MIS Acknowledgment — TEST — ${misTodayIst()}`
  const html = `<div style="font-family:Arial,sans-serif;max-width:520px;padding:24px">
    <h2 style="color:#14224f">MIS Thank-You Email — Test</h2>
    <p>Sir, email is working to <b>${esc(directorEmail)}</b> but no branch report was found for today yet.</p>
    <p style="color:#64748b;font-size:13px">From: ${esc(from)}</p>
    <p>Ask a branch to submit MIS — you will then receive the full dashboard email automatically.</p>
  </div>`
  const r = await resendOne(resend, from, directorEmail, subject, html, directorEmail)
  if (!r.ok) return { ok: false, error: r.error, from, directorEmail }
  return { ok: true, to: directorEmail, from, fallback: true }
}

export type ClientPerfPayload = {
  clientName: string
  month: string
  from?: string
  to?: string
  rangeLabel?: string
  san: number
  dep: number
  vac: number
  avgDeploy: number
  daysWithData: number
  visits: number
  dayVisits?: number
  nightChecks?: number
  training?: number
  lateStart?: number
  outOfPost?: number
  mwCompliant?: string
  mwCompliantLabel?: string
  monthlyBillLacs?: number | null
  balanceToPayLacs?: number | null
  collectedLacs?: number | null
  slaDayVisit?: string
  slaNightCheck?: string
}

export function clientPerfShareText(d: ClientPerfPayload): string {
  return clientPerfReportShareText(d)
}

export async function sendClientPerformanceMail(to: string[], d: ClientPerfPayload) {
  const apiKey = process.env.RESEND_API_KEY?.trim()
  if (!apiKey) return { ok: false, error: 'Email not configured' }
  if (!to.length) return { ok: false, error: 'No recipient email' }

  const resend = new Resend(apiKey)
  const from = process.env.EMAIL_FROM ?? 'Agile MIS <noreply@agilegroup.co.in>'

  const period = clientPerfPeriodLabel(d)
  const result = await sendSuiteEmail(resend, {
    from,
    to,
    subject: `Unit Performance Report — ${d.clientName} — ${period}`,
    html: buildClientPerfReportEmailHtml(d),
  })
  if (result.error) return { ok: false, error: result.error.message ?? 'Send failed' }
  return { ok: true, to }
}

export async function sendSlaRepeatedIndentMail(
  to: string[],
  branchName: string,
  htmlBody: string,
  clientName?: string,
) {
  const apiKey = process.env.RESEND_API_KEY?.trim()
  if (!apiKey) return { ok: false, error: 'Email not configured' }
  if (!to.length) return { ok: false, error: 'No recipient email' }

  const resend = new Resend(apiKey)
  const from = process.env.EMAIL_FROM ?? 'Agile MIS <noreply@agilegroup.co.in>'
  const subject = clientName
    ? `Equipment SLA Indent — ${clientName} — ${branchName}`
    : `Equipment SLA Indent — Repeated Issues — ${branchName}`

  const result = await sendSuiteEmail(resend, {
    from,
    to,
    subject,
    html: mailWrap(`Equipment SLA Indent — ${branchName}`, htmlBody),
  })
  if (result.error) return { ok: false, error: result.error.message ?? 'Send failed' }
  return { ok: true, to }
}
