/**
 * MIS Training (OJT) Follow-up — Track 1 OJT only (no complaints / duty / night visit).
 */
import { misTodayIst } from './dates.js'
import { getBranches, getMisReportBranches, getUsers, type MisBranch, type MisUser } from './store.js'
import { buildBranchKpi } from '../training/ojt-dashboard.js'
import {
  emptyOjtReport,
  findSession,
  findSessionAcrossBranches,
  loadOjtReport,
  saveOjtReport,
  type OjtReport,
  type OjtSession,
} from '../training/ojt-store.js'
import { buildCompletionReportHtml } from '../training/ojt-mail.js'

export type TrainingCompletedRow = {
  sessionId: string
  branchId: string
  branchName: string
  clientName: string
  trainingDate: string
  trainerName: string
  reportSentAt: string
  reportSentBy: string
  canReviewReport: boolean
}

export type TrainingObsRow = {
  sessionId: string
  branchId: string
  branchName: string
  clientName: string
  trainingDate: string
  assignedOmName: string
  assignedOmEmail: string
  assignedAt: string
  assignedBy: string
  obsRecorded: boolean
  obsCompleted: boolean
  statusLabel: string
  detail: string
  canAssign: boolean
  canReviewClosure: boolean
  canReopen: boolean
}

export type TrainingOjtFollowupPayload = {
  ok: boolean
  month: string
  from: string
  to: string
  branchId: string
  branches: { id: string; name: string }[]
  omOptions: { branchId: string; name: string; email: string }[]
  summary: {
    totalScheduled: number
    trainingCompleted: number
    completionReportSent: number
    balanceToComplete: number
    balancePendingCompletionReport: number
    observationCompleted: number
    observationBalance: number
  }
  completedList: TrainingCompletedRow[]
  observationList: TrainingObsRow[]
}

function sessionMonthHints(monthHint?: string): string[] {
  const hints: string[] = []
  const add = (m: string) => {
    const v = String(m || '').slice(0, 7)
    if (/^\d{4}-\d{2}$/.test(v) && !hints.includes(v)) hints.push(v)
  }
  add(monthHint || '')
  const today = misTodayIst()
  add(today.slice(0, 7))
  const prev = new Date(`${today.slice(0, 10)}T12:00:00`)
  prev.setMonth(prev.getMonth() - 1)
  add(prev.toISOString().slice(0, 7))
  return hints
}

async function locateSession(branchId: string, sessionId: string, monthHint?: string) {
  return findSession(branchId, sessionId, sessionMonthHints(monthHint))
}

function monthBounds(ym: string): { from: string; to: string } {
  const m = /^\d{4}-\d{2}$/.test(ym) ? ym : misTodayIst().slice(0, 7)
  const [y, mo] = m.split('-').map(Number)
  const last = new Date(y, mo, 0).getDate()
  return { from: `${m}-01`, to: `${m}-${String(last).padStart(2, '0')}` }
}

function hasSecurityObs(report: OjtReport | undefined): boolean {
  if (!report) return false
  return Boolean(
    report.securityObsSavedAt ||
      report.turnoutRating ||
      report.otherAbnormality ||
      report.informationGathering ||
      report.idCardValidity ||
      report.recordKeeping,
  )
}

function obsDetail(report: OjtReport | undefined): string {
  if (!report) return ''
  return String(
    report.otherAbnormality || report.informationGathering || report.turnoutReason || report.idCardReason || '',
  ).slice(0, 200)
}

function omOptionsForBranches(branches: MisBranch[], users: MisUser[]) {
  const ids = new Set(branches.map((b) => b.id))
  return users
    .filter(
      (u) =>
        u.active !== false &&
        ids.has(u.branchId) &&
        (u.role === 'Operations Manager' || u.role === 'Area Manager' || u.role === 'Field Officer'),
    )
    .map((u) => ({ branchId: u.branchId, name: u.name, email: u.email }))
}

function buildRowsForBranch(
  branch: MisBranch,
  sessions: OjtSession[],
  reports: Map<string, OjtReport>,
  portal: 'mgmt' | 'staff',
): {
  completedList: TrainingCompletedRow[]
  observationList: TrainingObsRow[]
  counts: Omit<TrainingOjtFollowupPayload['summary'], never>
} {
  const completedList: TrainingCompletedRow[] = []
  const observationList: TrainingObsRow[] = []
  let totalScheduled = 0
  let trainingCompleted = 0
  let completionReportSent = 0
  let balanceToComplete = 0
  let balancePendingCompletionReport = 0
  let observationCompleted = 0
  let observationBalance = 0

  for (const s of sessions) {
    if (s.status === 'Cancelled') continue
    totalScheduled += 1
    const report = reports.get(s.id)
    const isCompleted = s.status === 'Completed'
    const sent = report?.reportSentToClient === 'Yes'

    if (isCompleted) {
      trainingCompleted += 1
      if (sent) {
        completionReportSent += 1
        completedList.push({
          sessionId: s.id,
          branchId: branch.id,
          branchName: branch.name,
          clientName: s.clientName,
          trainingDate: s.trainingDate,
          trainerName: s.trainerName || '—',
          reportSentAt: report?.reportSentAt || '',
          reportSentBy: report?.reportSentBy || '',
          canReviewReport: true,
        })
      } else {
        balancePendingCompletionReport += 1
      }
    } else {
      balanceToComplete += 1
    }

    if (!isCompleted && !hasSecurityObs(report)) continue

    const obsDone = Boolean(report?.securityObsClosureSubmittedAt)
    const assigned = Boolean(report?.securityObsAssignedOmEmail || report?.securityObsAssignedOmName)
    if (obsDone) observationCompleted += 1
    else observationBalance += 1

    let statusLabel = 'Pending assignment'
    if (obsDone) statusLabel = 'Completed'
    else if (assigned) statusLabel = 'Assigned to OM'
    else if (hasSecurityObs(report)) statusLabel = 'Observation recorded'

    observationList.push({
      sessionId: s.id,
      branchId: branch.id,
      branchName: branch.name,
      clientName: s.clientName,
      trainingDate: s.trainingDate,
      assignedOmName: report?.securityObsAssignedOmName || '',
      assignedOmEmail: report?.securityObsAssignedOmEmail || '',
      assignedAt: report?.securityObsAssignedAt || '',
      assignedBy: report?.securityObsAssignedBy || '',
      obsRecorded: hasSecurityObs(report),
      obsCompleted: obsDone,
      statusLabel,
      detail: obsDetail(report),
      /** Branch HOD assigns OM; Management may also assign for follow-up / tests. */
      canAssign: (portal === 'staff' || portal === 'mgmt') && !obsDone,
      canReviewClosure: obsDone,
      canReopen: portal === 'mgmt' && obsDone,
    })
  }

  return {
    completedList,
    observationList,
    counts: {
      totalScheduled,
      trainingCompleted,
      completionReportSent,
      balanceToComplete,
      balancePendingCompletionReport,
      observationCompleted,
      observationBalance,
    },
  }
}

export async function buildTrainingOjtFollowup(opts: {
  month?: string
  branchId?: string
  portal?: 'mgmt' | 'staff'
}): Promise<TrainingOjtFollowupPayload> {
  const month = String(opts.month || misTodayIst().slice(0, 7))
  const { from, to } = monthBounds(month)
  const portal = opts.portal === 'staff' ? 'staff' : 'mgmt'
  const allBranches = await getMisReportBranches(true)
  const filterId = String(opts.branchId || '').trim()
  const branches =
    filterId && filterId !== 'ALL'
      ? allBranches.filter((b) => b.id === filterId)
      : allBranches

  const [users, branchResults] = await Promise.all([
    getUsers(),
    Promise.all(
      branches.map(async (branch) => {
        const { sessions, reports } = await buildBranchKpi(branch.id, branch.name, from, to)
        return buildRowsForBranch(branch, sessions, reports, portal)
      }),
    ),
  ])

  const summary = {
    totalScheduled: 0,
    trainingCompleted: 0,
    completionReportSent: 0,
    balanceToComplete: 0,
    balancePendingCompletionReport: 0,
    observationCompleted: 0,
    observationBalance: 0,
  }
  const completedList: TrainingCompletedRow[] = []
  const observationList: TrainingObsRow[] = []

  for (const r of branchResults) {
    summary.totalScheduled += r.counts.totalScheduled
    summary.trainingCompleted += r.counts.trainingCompleted
    summary.completionReportSent += r.counts.completionReportSent
    summary.balanceToComplete += r.counts.balanceToComplete
    summary.balancePendingCompletionReport += r.counts.balancePendingCompletionReport
    summary.observationCompleted += r.counts.observationCompleted
    summary.observationBalance += r.counts.observationBalance
    completedList.push(...r.completedList)
    observationList.push(...r.observationList)
  }

  const sortDate = (a: { trainingDate: string }, b: { trainingDate: string }) =>
    (b.trainingDate || '').localeCompare(a.trainingDate || '')
  completedList.sort(sortDate)
  observationList.sort((a, b) => {
    if (a.obsCompleted !== b.obsCompleted) return a.obsCompleted ? 1 : -1
    return sortDate(a, b)
  })

  return {
    ok: true,
    month,
    from,
    to,
    branchId: filterId || 'ALL',
    branches: allBranches.map((b) => ({ id: b.id, name: b.name })),
    omOptions: omOptionsForBranches(branches, users),
    summary,
    completedList,
    observationList,
  }
}

function buildObsClosureReviewHtml(session: OjtSession, report: OjtReport): string {
  const files = (report.securityObsClosureFiles || [])
    .map((f) => `<li>${f.name || 'Evidence file'}</li>`)
    .join('')
  return `
<div style="font-family:Arial,sans-serif;color:#0f172a;line-height:1.55;padding:8px">
  <h2 style="margin:0 0 12px;color:#14224f">Security Observation — Completion Report</h2>
  <p><strong>Client / Unit:</strong> ${session.clientName}<br/>
  <strong>Training date:</strong> ${session.trainingDate}<br/>
  <strong>Assigned OM:</strong> ${report.securityObsAssignedOmName || '—'}<br/>
  <strong>Submitted by:</strong> ${report.securityObsClosureSubmittedBy || '—'}<br/>
  <strong>Closure date:</strong> ${report.securityObsClosureDate || '—'}</p>
  <div style="margin:12px 0;padding:12px;border:1px solid #cbd5e1;border-radius:8px;background:#f8fafc;white-space:pre-wrap">${report.securityObsClosureText || '—'}</div>
  ${files ? `<p><strong>Evidence:</strong></p><ul>${files}</ul>` : ''}
</div>`.trim()
}

export async function reviewTrainingOjtReport(
  kind: 'completion' | 'observation',
  sessionId: string,
  branchId: string,
): Promise<{ ok: true; html: string; title: string } | { ok: false; error: string }> {
  const id = String(sessionId ?? '').trim()
  const bid = String(branchId ?? '').trim()
  if (!id) return { ok: false, error: 'Session not found.' }

  const branches = await getBranches(true)
  const searchIds = [bid, ...branches.map((b) => b.id)].filter(Boolean)
  let found = await findSessionAcrossBranches(id, searchIds, misTodayIst().slice(0, 7))
  if (!found && bid) {
    const legacy = await locateSession(bid, id, misTodayIst().slice(0, 7))
    if (legacy) found = { session: legacy.session, month: legacy.month, branchId: legacy.session.branchId || bid }
  }
  const report = await loadOjtReport(id)
  if (!report) return { ok: false, error: 'Report not found.' }

  const session =
    found?.session ||
    ({
      id,
      branchId: bid,
      clientName: '—',
      trainingDate: '',
      topics: '',
    } as OjtSession)

  if (kind === 'completion') {
    if (report.reportSentToClient !== 'Yes') {
      return { ok: false, error: 'Completion report has not been sent to the client yet.' }
    }
    if (!found) return { ok: false, error: 'Training session not found.' }
    return {
      ok: true,
      title: `OJT completion — ${session.clientName}`,
      html: buildCompletionReportHtml(session, report),
    }
  }

  if (!report.securityObsClosureSubmittedAt) {
    return { ok: false, error: 'Observation completion report not submitted yet.' }
  }
  return {
    ok: true,
    title: `Observation completion — ${session.clientName}`,
    html: buildObsClosureReviewHtml(session, report),
  }
}

export async function assignTrainingObsToOm(opts: {
  sessionId: string
  branchId: string
  omName: string
  omEmail: string
  assignedBy: string
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const id = String(opts.sessionId ?? '').trim()
  const bid = String(opts.branchId ?? '').trim()
  const omEmail = String(opts.omEmail ?? '').trim().toLowerCase()
  const omName = String(opts.omName ?? '').trim()
  if (!id || !bid || !omEmail) return { ok: false, error: 'Pick an Operations Manager to assign.' }

  const found = await locateSession(bid, id, misTodayIst().slice(0, 7))
  if (!found) return { ok: false, error: 'Training session not found.' }
  const report = (await loadOjtReport(id)) || emptyOjtReport(id)

  await saveOjtReport({
    ...report,
    sessionId: id,
    securityObsAssignedOmName: omName,
    securityObsAssignedOmEmail: omEmail,
    securityObsAssignedAt: new Date().toISOString(),
    securityObsAssignedBy: opts.assignedBy,
  })
  return { ok: true }
}

export async function reopenTrainingFollowupCase(
  kind: string,
  id: string,
  branchId: string,
  userName: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (kind === 'ojt_observation' || kind === 'observation') {
    const sessionId = id.replace(/:obs$/, '')
    const report = await loadOjtReport(sessionId)
    if (!report) return { ok: false, error: 'Observation report not found.' }
    await saveOjtReport({
      ...report,
      securityObsClosureDate: '',
      securityObsClosureText: '',
      securityObsClosureFiles: [],
      securityObsClosureSubmittedAt: '',
      securityObsClosureSubmittedBy: '',
    })
    return { ok: true }
  }

  if (kind === 'ojt_completion' || kind === 'completion') {
    const sessionId = id.replace(/:completion$/, '')
    const report = await loadOjtReport(sessionId)
    if (!report) return { ok: false, error: 'Completion report not found.' }
    await saveOjtReport({
      ...report,
      reportSentToClient: 'No',
      reportSentAt: '',
      reportSentBy: userName,
      reportMessageId: '',
    })
    return { ok: true }
  }

  return { ok: false, error: 'This case type cannot be reopened here.' }
}
