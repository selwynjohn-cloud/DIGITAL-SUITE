/**
 * OJT Branch Dashboard KPIs and Security Observation list rows.
 */

import { getClients, type MisClient } from '../mis/store.js'
import {
  daysUntilTraining,
  loadMonthSessions,
  loadOjtReport,
  type OjtReport,
  type OjtSession,
} from './ojt-store.js'
import { monthsInPeriod } from './ojt-training-dept.js'

function clientSanctioned(c: MisClient): number {
  return (Number(c.sanA) || 0) + (Number(c.sanG) || 0) + (Number(c.sanB) || 0) + (Number(c.sanC) || 0)
}

function isSlaClient(c: MisClient): boolean {
  return Boolean(String(c.slaDayVisit || '').trim() || String(c.slaNightCheck || '').trim())
}

export type OjtBranchKpi = {
  branchId: string
  branchName: string
  totalSites: number
  completedUnits: number
  trainingCompletedLabel: string
  trainingCompletedPct: number
  slaTotal: number
  slaScheduled: number
  slaScheduleLabel: string
  slaSchedulePct: number
  guardsTrained: number
  sanctionedPosts: number
  trainedGuardsPct: number
  unitsTrainedLabel: string
  unitsTrainedPct: number
  balanceSchedule: number
}

/** SLA window for Security Observation closing (calendar days after training). */
export const SEC_OBS_SLA_DAYS = 7

export type OjtSecObsTracking =
  | 'Completed'
  | 'Reminder sent'
  | 'WhatsApp sent'
  | 'Assigned'
  | 'Form shared'
  | 'Awaiting form'
  | 'Overdue'

export type OjtSecObsRow = {
  sessionId: string
  branchId: string
  branchName: string
  clientName: string
  trainingDate: string
  assignedTo: string
  assignedEmail: string
  pendingDays: number | null
  /** 0–100 progress on the open SLA clock (or 100 when completed). */
  timeBarPct: number
  timeBarTone: 'ok' | 'warn' | 'danger' | 'done'
  completed: 'Yes' | 'No'
  status: string
  tracking: OjtSecObsTracking
  trackingDetail: string
  waSentAt: string
  reminderAt: string
  reminderCount: number
  formSharedAt: string
  closureSubmittedAt: string
}

function uniqClients(sessions: OjtSession[], pred: (s: OjtSession) => boolean): Set<string> {
  const set = new Set<string>()
  for (const s of sessions) {
    if (!pred(s)) continue
    const key = String(s.clientId || s.clientName || '').trim()
    if (key) set.add(key)
  }
  return set
}

function inPeriod(dateYmd: string, fromYmd: string, toYmd: string): boolean {
  const d = String(dateYmd || '').slice(0, 10)
  if (!/^\d{4}-\d{2}-\d{2}$/.test(d)) return false
  const from = String(fromYmd || '').slice(0, 10)
  const to = String(toYmd || '').slice(0, 10)
  if (from && d < from) return false
  if (to && d > to) return false
  return true
}

export async function loadSessionsInPeriod(
  branchId: string,
  fromYmd: string,
  toYmd: string,
): Promise<OjtSession[]> {
  const months = monthsInPeriod(fromYmd, toYmd)
  const monthLists = await Promise.all(months.map((m) => loadMonthSessions(branchId, m)))
  const all: OjtSession[] = []
  const seen = new Set<string>()
  for (const list of monthLists) {
    for (const s of list) {
      if (!inPeriod(s.trainingDate, fromYmd, toYmd)) continue
      if (seen.has(s.id)) continue
      seen.add(s.id)
      all.push(s)
    }
  }
  return all
}

export async function buildBranchKpi(
  branchId: string,
  branchName: string,
  fromYmd: string,
  toYmd?: string,
): Promise<{ kpi: OjtBranchKpi; sessions: OjtSession[]; reports: Map<string, OjtReport> }> {
  const to = toYmd || fromYmd
  const monthHint = String(fromYmd || to).slice(0, 7)
  const [clients, sessions] = await Promise.all([
    getClients(branchId, { skipRepair: true }),
    loadSessionsInPeriod(branchId, fromYmd || `${monthHint}-01`, to),
  ])
  const active = clients.filter((c) => c.active !== false)
  const totalSites = active.length
  const reports = new Map<string, OjtReport>()
  let guardsTrained = 0
  await Promise.all(
    sessions.map(async (s) => {
      const r = await loadOjtReport(s.id)
      if (!r) return
      reports.set(s.id, r)
      if (s.status === 'Completed' || r.reportSentToClient === 'Yes') {
        guardsTrained += Number(String(r.attendanceCount || '').replace(/[^\d.]/g, '')) || 0
      }
    }),
  )
  const completedSet = uniqClients(sessions, (s) => s.status === 'Completed')
  const completedUnits = completedSet.size
  const slaClients = active.filter(isSlaClient)
  const slaTotal = slaClients.length
  const slaIds = new Set(slaClients.map((c) => c.id))
  const slaScheduled = uniqClients(
    sessions,
    (s) =>
      (s.slaTag === 'SLA' || slaIds.has(s.clientId)) &&
      (s.status === 'Scheduled' || s.status === 'ClientNotified' || s.status === 'Completed'),
  ).size
  const sanctionedPosts = active.reduce((n, c) => n + clientSanctioned(c), 0)
  const balanceSchedule = sessions.filter(
    (s) => s.status === 'Scheduled' || s.status === 'ClientNotified',
  ).length
  const pct = (a: number, b: number) => (b > 0 ? Math.round((a / b) * 1000) / 10 : 0)
  const kpi: OjtBranchKpi = {
    branchId,
    branchName,
    totalSites,
    completedUnits,
    trainingCompletedLabel: `${completedUnits}/${totalSites}`,
    trainingCompletedPct: pct(completedUnits, totalSites),
    slaTotal,
    slaScheduled,
    slaScheduleLabel: `${slaScheduled}/${slaTotal || totalSites}`,
    slaSchedulePct: pct(slaScheduled, slaTotal || totalSites),
    guardsTrained,
    sanctionedPosts,
    trainedGuardsPct: pct(guardsTrained, sanctionedPosts),
    unitsTrainedLabel: `${completedUnits}/${totalSites}`,
    unitsTrainedPct: pct(completedUnits, totalSites),
    balanceSchedule,
  }
  return { kpi, sessions, reports }
}

function secObsTracking(
  report: OjtReport | null | undefined,
  completed: boolean,
  pendingDays: number | null,
): { tracking: OjtSecObsTracking; detail: string } {
  if (completed) {
    return {
      tracking: 'Completed',
      detail: report?.securityObsClosureSubmittedAt
        ? `Closed ${String(report.securityObsClosureSubmittedAt).slice(0, 10)}`
        : 'Closed',
    }
  }
  if (pendingDays != null && pendingDays >= SEC_OBS_SLA_DAYS) {
    return { tracking: 'Overdue', detail: `${pendingDays} days open (SLA ${SEC_OBS_SLA_DAYS}d)` }
  }
  if (report?.securityObsReminderAt) {
    const n = Number(report.securityObsReminderCount) || 1
    return {
      tracking: 'Reminder sent',
      detail: `×${n} · ${String(report.securityObsReminderAt).slice(0, 10)}`,
    }
  }
  if (report?.securityObsWaSentAt) {
    return { tracking: 'WhatsApp sent', detail: String(report.securityObsWaSentAt).slice(0, 10) }
  }
  if (report?.securityObsAssignedOmEmail || report?.securityObsAssignedOmName) {
    return {
      tracking: 'Assigned',
      detail: report.securityObsAssignedOmName || report.securityObsAssignedOmEmail || '',
    }
  }
  if (report?.securityObsSentAt) {
    return { tracking: 'Form shared', detail: String(report.securityObsSentAt).slice(0, 10) }
  }
  if (report?.securityObsSavedAt) {
    return { tracking: 'Awaiting form', detail: 'Saved — not yet shared with HOD' }
  }
  return { tracking: 'Awaiting form', detail: 'Schedule on file' }
}

function timeBarForPending(
  pendingDays: number | null,
  completed: boolean,
): { pct: number; tone: 'ok' | 'warn' | 'danger' | 'done' } {
  if (completed) return { pct: 100, tone: 'done' }
  const days = Math.max(0, Number(pendingDays) || 0)
  const pct = Math.min(100, Math.round((days / SEC_OBS_SLA_DAYS) * 100))
  if (days >= SEC_OBS_SLA_DAYS) return { pct, tone: 'danger' }
  if (days >= 3) return { pct, tone: 'warn' }
  return { pct, tone: 'ok' }
}

export async function buildSecurityObsList(
  branchId: string,
  branchName: string,
  fromYmd: string,
  toYmd: string,
  todayYmd: string,
): Promise<OjtSecObsRow[]> {
  const sessions = await loadSessionsInPeriod(branchId, fromYmd, toYmd)
  const rows: OjtSecObsRow[] = []
  for (const s of sessions) {
    if (s.status === 'Cancelled') continue
    const report = await loadOjtReport(s.id)
    /** Completed = Branch registered the Security Observation completion report (with evidence). */
    const completed = report?.securityObsClosureSubmittedAt ? 'Yes' : 'No'
    const days = daysUntilTraining(s.trainingDate, todayYmd)
    const pendingDays =
      completed === 'No' && days !== null ? (days < 0 ? Math.abs(days) : 0) : completed === 'No' ? 0 : null
    const omName = String(report?.securityObsAssignedOmName || '').trim()
    const omEmail = String(report?.securityObsAssignedOmEmail || '').trim()
    const assignedTo = omName || s.trainerName || '—'
    const assignedEmail = omEmail || s.trainerEmail || ''
    const { tracking, detail } = secObsTracking(report, completed === 'Yes', pendingDays)
    const bar = timeBarForPending(pendingDays, completed === 'Yes')
    rows.push({
      sessionId: s.id,
      branchId,
      branchName,
      clientName: s.clientName,
      trainingDate: s.trainingDate,
      assignedTo,
      assignedEmail,
      pendingDays,
      timeBarPct: bar.pct,
      timeBarTone: bar.tone,
      completed,
      status: s.status,
      tracking,
      trackingDetail: detail,
      waSentAt: report?.securityObsWaSentAt || '',
      reminderAt: report?.securityObsReminderAt || '',
      reminderCount: Number(report?.securityObsReminderCount) || 0,
      formSharedAt: report?.securityObsSentAt || '',
      closureSubmittedAt: report?.securityObsClosureSubmittedAt || '',
    })
  }
  rows.sort((a, b) => {
    if (a.completed !== b.completed) return a.completed === 'No' ? -1 : 1
    return (b.pendingDays || 0) - (a.pendingDays || 0)
  })
  return rows
}

export function summarizeSecObs(rows: OjtSecObsRow[]): {
  received: number
  resolved: number
  balance: number
} {
  const received = rows.length
  const resolved = rows.filter((r) => r.completed === 'Yes').length
  return { received, resolved, balance: Math.max(0, received - resolved) }
}
