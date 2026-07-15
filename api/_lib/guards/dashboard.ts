import type { GuardComplaint, GuardOpsStaff } from './store.js'
import { stageClocks } from './completion.js'

export type GuardsDashboard = {
  total: number
  received: number
  delayed: number
  solved: number
  pendingHod: number
  avgResponseHours: number
  slaCompliancePct: number
  topCategories: { category: string; count: number; avgHours: number }[]
  byDepartment: { department: string; count: number; avgHours: number; delayed: number }[]
  hurdles: { label: string; count: number; hint: string }[]
  suggestions: string[]
  byOps: { name: string; count: number; delayed: number; avgHours: number }[]
  byBranch: {
    branchId: string
    branchName: string
    total: number
    received: number
    delayed: number
    solved: number
    avgHours: number
    slaPct: number
  }[]
  weeklyTrend: { label: string; received: number; solved: number; delayed: number }[]
}

export type ComplaintAnalysisReport = {
  rootCauses: { cause: string; count: number; action: string }[]
  delayPoints: { stage: string; avgHours: number; cases: number }[]
  permanentFixes: string[]
  reduceResponseTime: string[]
}

function hoursBetween(a: string, b: string): number {
  const ms = new Date(b).getTime() - new Date(a).getTime()
  return Math.max(0, Math.round((ms / 3600000) * 10) / 10)
}

export function computeGuardsDashboard(
  complaints: GuardComplaint[],
  opsStaff: GuardOpsStaff[],
  branchNames?: Record<string, string>,
): GuardsDashboard {
  const active = complaints.filter((c) => c.active)
  const received = active.filter((c) => c.status !== 'solved')
  const delayed = active.filter((c) => c.isDelayed && c.status !== 'solved')
  const solved = active.filter((c) => c.status === 'solved')
  const pendingHod = active.filter((c) => c.status === 'pending_hod')

  const solvedWithTime = solved.filter((c) => c.solvedAt && c.registeredAt)
  const avgResponseHours = solvedWithTime.length
    ? Math.round(
        (solvedWithTime.reduce((s, c) => s + hoursBetween(c.registeredAt, c.solvedAt), 0) /
          solvedWithTime.length) *
          10,
      ) / 10
    : 0

  const onTime = solved.filter((c) => c.solvedAt && new Date(c.solvedAt) <= new Date(c.slaDeadline)).length
  const slaCompliancePct = solved.length ? Math.round((onTime / solved.length) * 100) : 100

  const catMap: Record<string, { count: number; hours: number; n: number }> = {}
  for (const c of active) {
    const k = c.category || 'Other'
    if (!catMap[k]) catMap[k] = { count: 0, hours: 0, n: 0 }
    catMap[k].count++
    if (c.solvedAt) {
      catMap[k].hours += hoursBetween(c.registeredAt, c.solvedAt)
      catMap[k].n++
    }
  }
  const topCategories = Object.entries(catMap)
    .map(([category, v]) => ({
      category,
      count: v.count,
      avgHours: v.n ? Math.round((v.hours / v.n) * 10) / 10 : 0,
    }))
    .sort((a, b) => b.count - a.count)

  const deptMap: Record<string, { count: number; hours: number; n: number; delayed: number }> = {}
  for (const c of active) {
    const d = c.department || 'Operations'
    if (!deptMap[d]) deptMap[d] = { count: 0, hours: 0, n: 0, delayed: 0 }
    deptMap[d].count++
    if (c.isDelayed && c.status !== 'solved') deptMap[d].delayed++
    const clk = stageClocks(c)
    deptMap[d].hours += clk.deptHrs || clk.opsHrs || clk.totalHrs
    deptMap[d].n++
  }
  const byDepartment = Object.entries(deptMap)
    .map(([department, v]) => ({
      department,
      count: v.count,
      avgHours: v.n ? Math.round((v.hours / v.n) * 10) / 10 : 0,
      delayed: v.delayed,
    }))
    .sort((a, b) => b.count - a.count)

  const hurdles: GuardsDashboard['hurdles'] = []
  if (delayed.length)
    hurdles.push({
      label: 'Beyond 24-hour response time',
      count: delayed.length,
      hint: 'Escalation email sent to Director. Send completion letter from Delayed Complaints.',
    })
  if (pendingHod.length)
    hurdles.push({
      label: 'Awaiting HOD closure',
      count: pendingHod.length,
      hint: 'Approve and send Communication to Complainant.',
    })
  const unassigned = active.filter((c) => !c.opsStaffId && c.status !== 'solved').length
  if (unassigned)
    hurdles.push({
      label: 'HOD/RM not yet assigned',
      count: unassigned,
      hint: 'Assign Operations Staff and Department from Received Complaints.',
    })

  const suggestions: string[] = []
  const slowDept = byDepartment.find((d) => d.avgHours > 12)
  if (slowDept)
    suggestions.push(
      `${slowDept.department} averages ${slowDept.avgHours}h — assign a dedicated department staff with email alerts.`,
    )
  if (topCategories[0])
    suggestions.push(
      `Highest category: ${topCategories[0].category} (${topCategories[0].count} cases) — brief department weekly on root cause.`,
    )
  if (slaCompliancePct < 85)
    suggestions.push('Keep 24-hour clock visible. Daily 10 AM review of open cases with ops + department.')
  if (!suggestions.length)
    suggestions.push('Maintain 24-hour standard. Share QR link monthly at all sites.')

  const byOpsMap: Record<string, { count: number; delayed: number; hours: number; n: number }> = {}
  for (const c of active) {
    const n = c.opsStaffName || 'Unassigned'
    if (!byOpsMap[n]) byOpsMap[n] = { count: 0, delayed: 0, hours: 0, n: 0 }
    byOpsMap[n].count++
    if (c.isDelayed && c.status !== 'solved') byOpsMap[n].delayed++
    const clk = stageClocks(c)
    if (clk.opsHrs) {
      byOpsMap[n].hours += clk.opsHrs
      byOpsMap[n].n++
    }
  }
  const byOps = Object.entries(byOpsMap)
    .map(([name, v]) => ({
      name,
      count: v.count,
      delayed: v.delayed,
      avgHours: v.n ? Math.round((v.hours / v.n) * 10) / 10 : 0,
    }))
    .sort((a, b) => b.count - a.count)

  const byBranchMap: Record<
    string,
    { total: number; received: number; delayed: number; solved: number; hours: number; n: number; onTime: number }
  > = {}
  for (const c of active) {
    const bid = c.branchId || 'unknown'
    if (!byBranchMap[bid])
      byBranchMap[bid] = { total: 0, received: 0, delayed: 0, solved: 0, hours: 0, n: 0, onTime: 0 }
    byBranchMap[bid].total++
    if (c.status !== 'solved') byBranchMap[bid].received++
    if (c.isDelayed && c.status !== 'solved') byBranchMap[bid].delayed++
    if (c.status === 'solved') {
      byBranchMap[bid].solved++
      if (c.solvedAt && new Date(c.solvedAt) <= new Date(c.slaDeadline)) byBranchMap[bid].onTime++
      if (c.solvedAt) {
        byBranchMap[bid].hours += hoursBetween(c.registeredAt, c.solvedAt)
        byBranchMap[bid].n++
      }
    }
  }
  const byBranch = Object.entries(byBranchMap)
    .map(([branchId, v]) => ({
      branchId,
      branchName: branchNames?.[branchId] || branchId,
      total: v.total,
      received: v.received,
      delayed: v.delayed,
      solved: v.solved,
      avgHours: v.n ? Math.round((v.hours / v.n) * 10) / 10 : 0,
      slaPct: v.solved ? Math.round((v.onTime / v.solved) * 100) : 100,
    }))
    .sort((a, b) => b.total - a.total)

  const weeklyTrend: GuardsDashboard['weeklyTrend'] = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    const key = d.toISOString().slice(0, 10)
    const label = d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric' })
    const day = active.filter((c) => c.registeredAt.slice(0, 10) === key)
    weeklyTrend.push({
      label,
      received: day.length,
      solved: day.filter((c) => c.status === 'solved').length,
      delayed: day.filter((c) => c.isDelayed).length,
    })
  }

  return {
    total: active.length,
    received: received.length,
    delayed: delayed.length,
    solved: solved.length,
    pendingHod: pendingHod.length,
    avgResponseHours,
    slaCompliancePct,
    topCategories,
    byDepartment,
    hurdles,
    suggestions,
    byOps,
    byBranch,
    weeklyTrend,
  }
}

export function computeComplaintAnalysis(complaints: GuardComplaint[]): ComplaintAnalysisReport {
  const active = complaints.filter((c) => c.active)
  const catCount: Record<string, number> = {}
  for (const c of active) catCount[c.category] = (catCount[c.category] || 0) + 1

  const rootCauses = Object.entries(catCount)
    .map(([cause, count]) => ({
      cause,
      count,
      action:
        cause === 'Wage'
          ? 'Payroll cut-off calendar + SMS to guards on wage credit day'
          : cause === 'EPF' || cause === 'ESIC'
            ? 'Monthly HR desk at branch + UAN/ESIC help desk'
            : cause === 'Uniform'
              ? 'Quarterly uniform issue camp per branch'
              : 'Standard operating checklist for ' + cause,
    }))
    .sort((a, b) => b.count - a.count)

  let hodSum = 0
  let opsSum = 0
  let deptSum = 0
  let hodN = 0
  let opsN = 0
  let deptN = 0
  for (const c of active) {
    const clk = stageClocks(c)
    if (clk.hodWaitHrs) {
      hodSum += clk.hodWaitHrs
      hodN++
    }
    if (clk.opsHrs) {
      opsSum += clk.opsHrs
      opsN++
    }
    if (clk.deptHrs) {
      deptSum += clk.deptHrs
      deptN++
    }
  }

  const delayPoints = [
    { stage: 'HOD / RM assignment', avgHours: hodN ? Math.round((hodSum / hodN) * 10) / 10 : 0, cases: hodN },
    { stage: 'Operations staff', avgHours: opsN ? Math.round((opsSum / opsN) * 10) / 10 : 0, cases: opsN },
    { stage: 'Department', avgHours: deptN ? Math.round((deptSum / deptN) * 10) / 10 : 0, cases: deptN },
  ].sort((a, b) => b.avgHours - a.avgHours)

  const permanentFixes = rootCauses.slice(0, 4).map((r) => r.action)
  const reduceResponseTime = [
    'Assign within 2 hours of registration (HOD/RM).',
    'Department staff email mandatory on every assignment.',
    'WhatsApp guard if documents missing — do not wait for visit.',
    'Weekly 15-minute review: top 3 categories + delayed cases.',
  ]

  return { rootCauses, delayPoints, permanentFixes, reduceResponseTime }
}

export function delayedComplaintAnalysis(complaints: GuardComplaint[]) {
  const delayed = complaints.filter((c) => c.active && c.isDelayed && c.status !== 'solved')
  const byPerson: Record<string, { count: number; hours: number; department: string }> = {}
  for (const c of delayed) {
    const who = c.deptStaffName || c.opsStaffName || 'Unassigned'
    if (!byPerson[who]) byPerson[who] = { count: 0, hours: 0, department: c.department }
    byPerson[who].count++
    byPerson[who].hours += stageClocks(c).totalHrs
  }
  return {
    total: delayed.length,
    byPerson: Object.entries(byPerson)
      .map(([name, v]) => ({
        name,
        department: v.department,
        count: v.count,
        avgHours: Math.round((v.hours / v.count) * 10) / 10,
        tip: 'Maintain overall 24-hour response. Appreciation email sent on completion.',
      }))
      .sort((a, b) => b.avgHours - a.avgHours),
    byCategory: Object.entries(
      delayed.reduce<Record<string, number>>((m, c) => {
        m[c.category] = (m[c.category] || 0) + 1
        return m
      }, {}),
    ).map(([category, count]) => ({ category, count })),
    cases: delayed,
  }
}

export function weeklyManagementReport(complaints: GuardComplaint[], branchName: string) {
  const weekAgo = Date.now() - 7 * 86400000
  const week = complaints.filter((c) => c.active && new Date(c.registeredAt).getTime() >= weekAgo)
  const pending = complaints.filter((c) => c.active && c.status !== 'solved')
  const dash = computeGuardsDashboard(complaints, [])
  return {
    branchName,
    weekReceived: week.length,
    weekSolved: week.filter((c) => c.status === 'solved').length,
    pending: pending.length,
    delayed: pending.filter((c) => c.isDelayed).length,
    avgResponseHours: dash.avgResponseHours,
    pendingList: pending.map((c) => ({
      code: c.code,
      guardName: c.guardName,
      category: c.category,
      holder: c.deptStaffName || c.opsStaffName || 'Unassigned',
      hoursSince: hoursBetween(c.registeredAt, new Date().toISOString()),
      status: c.isDelayed ? 'Delayed' : 'Under process',
    })),
  }
}

// backward alias
export const delayedAnalysis = delayedComplaintAnalysis
