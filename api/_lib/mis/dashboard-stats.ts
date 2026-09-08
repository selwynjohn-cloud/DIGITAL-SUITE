/**
 * Dashboard aggregation helpers for mdsummary.
 */

import {
  businessTierForName,
  countBusinessTiers,
  resolveBusinessTiers,
  type BusinessTierId,
} from './client-rules.js'
import { reportDeployTotals } from './deploy-math.js'
import { normalizeToLacs } from '../inr-money.js'
import { weekCollectedSum, ostFooterRecoveryPct } from './summary-autofill.js'
import {
  getMisReportBranches,
  getClients,
  getComplaintsMany,
  getCollections,
  getLatestOstBaseline,
  getDutyIncidents,
  getGuardDocsMany,
  getReportsForDate,
  getVisits,
  type MisBranch,
  type MisClient,
  type MisComplaint,
  type MisReport,
  type MisVisit,
} from './store.js'
import { getSlaIssueRegister, summarizeSlaPending } from './sla-issue.js'
import { collectionDso, LATEST_OST_FOOTER, ostAsOnFromSource } from './collection-import.js'

type TierBucket = { received: number; solved: number }

export type DashboardPayload = {
  opsVisits: { total: number; sites: number; pct: number; nightChecks: number; trainedSites: number }
  dutyStart: {
    timelyPct: number
    latePct: number
    notStartedPct: number
    lateCases: number
    notStartedCases: number
    /** @deprecated alias of notStartedPct — vacant / not started */
    outOfPostPct: number
    outOfPostCases: number
  }
  complaintsByTier: {
    apex: TierBucket
    enterprise: TierBucket
    cluster: TierBucket
    standard: TierBucket
    /** @deprecated aliases for older UI */
    strategic: TierBucket
    highValue: TierBucket
    valued: TierBucket
  }
  slaPending: { totalUnits: number; totalItems: number; repeatedUnits: number; branches: { branch: string; pending: number; repeated: number }[] }
  clientTiers: {
    apex: number
    enterprise: number
    cluster: number
    standard: number
    /** @deprecated aliases */
    strategic: number
    highValue: number
    valued: number
  }
  collection: {
    budget: number
    collected: number
    outstanding: number
    /** Weekly collected ÷ weekly budget */
    weeklyPct: number
    /** Friday OST BILLS collected % for the current billing month — not weekly, never 100% mid-month */
    overallPct: number
    monthlyBilling: number
    recovered: number
    ostSource?: string
    ostAsOn?: string
    dsoOver90Receivable: number
    dsoOver90Branches: number
    avgDso: number
  }
}

export type DashboardPreload = {
  branches: MisBranch[]
  reports: MisReport[]
  visits: MisVisit[]
  guardDocsMap: Map<string, import('./store.js').MisGuardDoc[]>
  complaintsMap: Map<string, MisComplaint[]>
  clients: MisClient[]
  cols: Awaited<ReturnType<typeof getCollections>>
  dutyIncidents?: Awaited<ReturnType<typeof getDutyIncidents>>
}

function emptyBucket(): TierBucket {
  return { received: 0, solved: 0 }
}

export async function buildDashboardExtras(
  date: string,
  weekStart: string,
  preload?: DashboardPreload,
  opts?: { includeSla?: boolean },
): Promise<DashboardPayload> {
  const branches = preload?.branches ?? (await getMisReportBranches(true))
  const branchIds = branches.map((b) => b.id)
  const [reports, visits, guardDocsMap, complaintsMap, clients, cols, dutyIncidents] = preload
    ? [
        preload.reports,
        preload.visits,
        preload.guardDocsMap,
        preload.complaintsMap,
        preload.clients,
        preload.cols,
        preload.dutyIncidents ?? [],
      ]
    : await Promise.all([
        getReportsForDate(date),
        getVisits(date),
        getGuardDocsMany(branchIds),
        getComplaintsMany(branchIds),
        getClients(),
        getCollections(weekStart),
        getDutyIncidents(date),
      ])

  const activeClients = clients.filter((c) => c.active !== false)
  const totalSites = activeClients.length
  const tierByGroup = resolveBusinessTiers(activeClients, branches)

  let nightChecks = 0
  let trainedSites = 0
  const visitedSites = new Set<string>()
  for (const v of visits) {
    if (v.visitType === 'N') nightChecks++
    if (v.visitType === 'T') trainedSites++
    visitedSites.add(`${v.client}|${v.unit}`.toLowerCase())
  }

  let lateCases = 0
  let TS = 0
  let TV = 0
  const latestByBranch = new Map<string, (typeof reports)[number]>()
  for (const r of reports) {
    const prev = latestByBranch.get(r.branchId)
    const newer =
      !prev ||
      String(r.dateFor || '') > String(prev.dateFor || '') ||
      (r.dateFor === prev.dateFor && String(r.submittedAt || '') >= String(prev.submittedAt || ''))
    if (newer) latestByBranch.set(r.branchId, r)
  }
  for (const r of latestByBranch.values()) {
    if (!String(r.submittedAt ?? '').trim()) continue
    const t = reportDeployTotals(r.rows as Record<string, unknown>[], r.branchId, clients)
    TS += t.san
    TV += t.vac
    lateCases += Number(r.summary?.lateStartCases) || 0
  }
  // Work360 typed late_start wins — Daily MIS often dumps late starts into out-of-post.
  if (dutyIncidents.length) {
    let incLate = 0
    for (const d of dutyIncidents) {
      if (d.type === 'late_start') incLate++
    }
    if (incLate > 0) lateCases = incLate
  }

  // Deployment 100% = Timely Start % + Late Start % + Not Started %
  // Not started = vacant posts (posts that did not start duty).
  const notStartedCases = Math.max(0, TV)
  let latePct = TS ? Math.round((lateCases * 100) / TS) : 0
  let notStartedPct = TS ? Math.round((notStartedCases * 100) / TS) : 0
  if (latePct + notStartedPct > 100) notStartedPct = Math.max(0, 100 - latePct)
  const timelyPct = Math.max(0, 100 - latePct - notStartedPct)
  const outOfPostPct = notStartedPct
  const outOfPostCases = notStartedCases

  const complaintsByTier = {
    apex: emptyBucket(),
    enterprise: emptyBucket(),
    cluster: emptyBucket(),
    standard: emptyBucket(),
    strategic: emptyBucket(),
    highValue: emptyBucket(),
    valued: emptyBucket(),
  }
  for (const b of branches) {
    const cs = complaintsMap.get(b.id) ?? []
    for (const c of cs) tallyComplaint(c, tierByGroup, complaintsByTier)
  }

  let colBudget = 0
  let colCollected = 0
  let colOutstanding = 0
  let colMonthlyBilling = 0
  let dsoOver90Receivable = 0
  let dsoOver90Branches = 0
  const dsos: number[] = []
  for (const c of cols) {
    const budget = (normalizeToLacs(c.budget) ?? Number(c.budget)) || 0
    const collected = weekCollectedSum(c)
    const outstanding = (normalizeToLacs(c.outstanding) ?? Number(c.outstanding)) || 0
    const billing = (normalizeToLacs(c.monthlyBilling) ?? Number(c.monthlyBilling)) || 0
    colBudget += budget
    colCollected += collected
    colOutstanding += outstanding
    colMonthlyBilling += billing
    const dso = collectionDso(outstanding, billing)
    if (outstanding > 0 && billing > 0) dsos.push(dso)
    if (dso > 90) {
      dsoOver90Receivable += outstanding
      dsoOver90Branches++
    }
  }
  const weeklyPct = colBudget > 0 ? Math.min(999, Math.round((colCollected * 100) / colBudget)) : 0
  const baseline = await getLatestOstBaseline(weekStart)
  const billL =
    Number(baseline?.billingK) > 0 ? Number(baseline!.billingK) / 100 : LATEST_OST_FOOTER.billingK / 100
  const ostCollectedL =
    Number(baseline?.collectedK) > 0 ? Number(baseline!.collectedK) / 100 : LATEST_OST_FOOTER.collectedK / 100
  const outL =
    Number(baseline?.outstandingK) > 0
      ? Number(baseline!.outstandingK) / 100
      : LATEST_OST_FOOTER.outstandingK / 100
  const monthPct =
    ostFooterRecoveryPct(baseline?.recoveryPct) || LATEST_OST_FOOTER.recoveryPct
  const recovered = ostCollectedL
  const monthBillL = billL || LATEST_OST_FOOTER.billingK / 100
  const overallPct = monthPct
  const avgDso =
    billL > 0 && outL > 0
      ? collectionDso(outL, billL)
      : dsos.length
        ? Math.round((dsos.reduce((a, b) => a + b, 0) / dsos.length) * 100) / 100
        : 0

  const slaBranches: { branch: string; pending: number; repeated: number }[] = []
  let totalUnits = 0
  let totalItems = 0
  let repeatedUnits = 0
  if (opts?.includeSla) {
    const slaRows = await Promise.all(
      branches.map(async (b) => {
        const rows = await getSlaIssueRegister(b.id, false)
        return summarizeSlaPending(b.id, b.name, rows)
      }),
    )
    for (const sum of slaRows) {
      if (sum.pendingUnits || sum.repeatedUnits) {
        slaBranches.push({ branch: sum.branchName, pending: sum.pendingUnits, repeated: sum.repeatedUnits })
      }
      totalUnits += sum.pendingUnits
      totalItems += sum.pendingItems
      repeatedUnits += sum.repeatedUnits
    }
  }

  const counted = countBusinessTiers(tierByGroup)
  const clientTiers = {
    ...counted,
    strategic: counted.apex,
    highValue: counted.enterprise + counted.cluster,
    valued: counted.standard,
  }

  return {
    opsVisits: {
      total: visits.length,
      sites: totalSites,
      pct: totalSites ? Math.round((visitedSites.size * 100) / totalSites) : 0,
      nightChecks,
      trainedSites,
    },
    dutyStart: {
      timelyPct,
      latePct,
      notStartedPct,
      lateCases,
      notStartedCases,
      outOfPostPct,
      outOfPostCases,
    },
    complaintsByTier,
    slaPending: { totalUnits, totalItems, repeatedUnits, branches: slaBranches },
    clientTiers,
    collection: {
      budget: colBudget,
      collected: colCollected,
      outstanding: outL,
      monthlyBilling: monthBillL,
      recovered,
      weeklyPct,
      overallPct,
      ostSource: baseline?.source || LATEST_OST_FOOTER.source,
      ostAsOn: ostAsOnFromSource(baseline?.source),
      dsoOver90Receivable,
      dsoOver90Branches,
      avgDso,
    },
  }
}

function tallyComplaint(
  c: MisComplaint,
  tierByGroup: Map<string, BusinessTierId>,
  bucket: DashboardPayload['complaintsByTier'],
) {
  if (c.active === false) return
  const tier = businessTierForName(c.clientName, tierByGroup)
  bucket[tier].received++
  if (c.status === 'Closed') bucket[tier].solved++
  /** Legacy aliases for older dashboard widgets */
  if (tier === 'apex') {
    bucket.strategic.received++
    if (c.status === 'Closed') bucket.strategic.solved++
  } else if (tier === 'enterprise' || tier === 'cluster') {
    bucket.highValue.received++
    if (c.status === 'Closed') bucket.highValue.solved++
  } else {
    bucket.valued.received++
    if (c.status === 'Closed') bucket.valued.solved++
  }
}
