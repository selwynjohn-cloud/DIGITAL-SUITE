/**
 * Dashboard aggregation helpers for mdsummary.
 */

import { normalizeStarRating } from './client-rules.js'
import { deployPct, reportDeployTotals } from './deploy-math.js'
import {
  getBranches,
  getClients,
  getComplaintsMany,
  getCollections,
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

export type DashboardPayload = {
  opsVisits: { total: number; sites: number; pct: number; nightChecks: number; trainedSites: number }
  dutyStart: { timelyPct: number; latePct: number; outOfPostPct: number; lateCases: number; outOfPostCases: number }
  complaintsByTier: {
    strategic: { received: number; solved: number }
    highValue: { received: number; solved: number }
    valued: { received: number; solved: number }
  }
  slaPending: { totalUnits: number; totalItems: number; repeatedUnits: number; branches: { branch: string; pending: number; repeated: number }[] }
  clientTiers: { strategic: number; highValue: number; valued: number }
  collection: {
    budget: number
    collected: number
    outstanding: number
    weeklyPct: number
    /** Received ÷ (Received + Outstanding) */
    overallPct: number
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

function collectionDso(outstanding: number, monthlyBilling: number): number {
  return monthlyBilling > 0 ? Math.round((outstanding / monthlyBilling) * 30) : outstanding > 0 ? 999 : 0
}

function clientTierForName(name: string, clients: MisClient[]): 'strategic' | 'highValue' | 'valued' {
  const n = name.trim().toUpperCase()
  const c = clients.find((x) => x.name.trim().toUpperCase() === n || n.includes(x.name.trim().toUpperCase()))
  const stars = normalizeStarRating(c?.starRating)
  if (stars >= 5) return 'strategic'
  if (stars >= 3) return 'highValue'
  return 'valued'
}

export async function buildDashboardExtras(
  date: string,
  weekStart: string,
  preload?: DashboardPreload,
  opts?: { includeSla?: boolean },
): Promise<DashboardPayload> {
  const branches = preload?.branches ?? (await getBranches(true))
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

  let nightChecks = 0
  let trainedSites = 0
  const visitedSites = new Set<string>()
  for (const v of visits) {
    if (v.visitType === 'N') nightChecks++
    if (v.visitType === 'T') trainedSites++
    visitedSites.add(`${v.client}|${v.unit}`.toLowerCase())
  }

  let lateCases = 0
  let outOfPostCases = 0
  let TS = 0
  for (const r of reports) {
    const t = reportDeployTotals(r.rows as Record<string, unknown>[], r.branchId, clients)
    TS += t.san
    lateCases += Number(r.summary?.lateStartCases) || 0
    outOfPostCases += Number(r.summary?.outOfPostCases) || 0
  }
  if (!lateCases && !outOfPostCases && dutyIncidents.length) {
    for (const d of dutyIncidents) {
      if (d.type === 'late_start') lateCases++
      else if (d.type === 'out_of_post') outOfPostCases++
    }
  }

  const latePct = TS ? Math.round((lateCases * 100) / TS) : 0
  const outOfPostPct = TS ? Math.round((outOfPostCases * 100) / TS) : 0
  const timelyPct = Math.max(0, 100 - latePct - outOfPostPct)

  const complaintsByTier = {
    strategic: { received: 0, solved: 0 },
    highValue: { received: 0, solved: 0 },
    valued: { received: 0, solved: 0 },
  }
  for (const b of branches) {
    const cs = complaintsMap.get(b.id) ?? []
    for (const c of cs) tallyComplaint(c, clients, complaintsByTier)
  }

  let colBudget = 0
  let colCollected = 0
  let colOutstanding = 0
  let dsoOver90Receivable = 0
  let dsoOver90Branches = 0
  const dsos: number[] = []
  for (const c of cols) {
    const budget = Number(c.budget) || 0
    const collected =
      (Number(c.mon) || 0) +
      (Number(c.tue) || 0) +
      (Number(c.wed) || 0) +
      (Number(c.thu) || 0) +
      (Number(c.fri) || 0) +
      (Number(c.sat) || 0)
    const outstanding = Number(c.outstanding) || 0
    const billing = Number(c.monthlyBilling) || 0
    colBudget += budget
    colCollected += collected
    colOutstanding += outstanding
    const dso = collectionDso(outstanding, billing)
    if (outstanding > 0 && billing > 0) dsos.push(dso)
    if (dso > 90) {
      dsoOver90Receivable += outstanding
      dsoOver90Branches++
    }
  }
  const weeklyPct = colBudget ? Math.round((colCollected * 100) / colBudget) : 0
  const recvPool = colCollected + colOutstanding
  const overallPct = recvPool ? Math.round((colCollected * 100) / recvPool) : 0
  const avgDso = dsos.length ? Math.round(dsos.reduce((a, b) => a + b, 0) / dsos.length) : 0

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

  const clientTiers = { strategic: 0, highValue: 0, valued: 0 }
  for (const c of activeClients) {
    const s = normalizeStarRating(c.starRating)
    if (s >= 5) clientTiers.strategic++
    else if (s >= 3) clientTiers.highValue++
    else clientTiers.valued++
  }

  return {
    opsVisits: {
      total: visits.length,
      sites: totalSites,
      pct: totalSites ? Math.round((visitedSites.size * 100) / totalSites) : 0,
      nightChecks,
      trainedSites,
    },
    dutyStart: { timelyPct, latePct, outOfPostPct, lateCases, outOfPostCases },
    complaintsByTier,
    slaPending: { totalUnits, totalItems, repeatedUnits, branches: slaBranches },
    clientTiers,
    collection: {
      budget: colBudget,
      collected: colCollected,
      outstanding: colOutstanding,
      weeklyPct,
      overallPct,
      dsoOver90Receivable,
      dsoOver90Branches,
      avgDso,
    },
  }
}

function tallyComplaint(
  c: MisComplaint,
  clients: MisClient[],
  bucket: DashboardPayload['complaintsByTier'],
) {
  if (c.active === false) return
  const tier = clientTierForName(c.clientName, clients)
  bucket[tier].received++
  if (c.status === 'Closed') bucket[tier].solved++
}
