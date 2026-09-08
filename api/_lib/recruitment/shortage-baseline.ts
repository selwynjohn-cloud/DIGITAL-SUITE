/**
 * Shortage baseline from Consolidated MIS (Director: 14 Aug 2026).
 * Opening Vacant + OT from that day is carried until recruitment is registered on DRR.
 */

import { deployPct, filterActiveReportRows, reportDeployTotals } from '../mis/deploy-math.js'
import { getBranches, getClients, getMisReportBranches, getReportsForDate, type MisBranch } from '../mis/store.js'
import { drrMailMisBranchIds } from './departments.js'
import { isHydZoneCentre, metaForRecruitBranch } from './branches.js'
import { resolveHyderabadRcZones } from './recruitment-centre.js'
import { RECRUIT_BRANCHES } from './store.js'
import { getShortageSnap, saveShortageSnap, type ShortageBranchSnap, type ShortageDaySnap } from './shortage-ledger.js'

/** Consolidated MIS date Director locked as opening shortage balance. */
export const SHORTAGE_BASELINE_DATE = '2026-08-14'

const BASELINE_KEY_DATE = SHORTAGE_BASELINE_DATE

function resolveMisTargets(branchName: string, branches: MisBranch[]): MisBranch[] {
  const scope = String(branchName || '').trim()
  if (!scope) return []
  if (isHydZoneCentre(scope)) {
    const zones = resolveHyderabadRcZones(branches)
    const want =
      scope === 'Hi-Tech City'
        ? /hi-?tech/i
        : scope === 'Hyderabad - B'
          ? /hyderabad[\s\-–]*b|zone[\s\-]*b/i
          : /hyderabad[\s\-–]*a|zone[\s\-]*a/i
    const hit = zones.find((z) => want.test(z.label) || want.test(z.misBranchId))
    if (hit) {
      const b = branches.find((x) => x.id === hit.misBranchId)
      if (b) return [b]
    }
    return branches.filter((b) => {
      const n = String(b.name || '')
      if (scope === 'Hi-Tech City') return /hi-?tech/i.test(n)
      if (scope === 'Hyderabad - B') return /hyderabad[\s\-–]*b/i.test(n) || /hyd[\s\-]*zone[\s\-]*b/i.test(n)
      return /hyderabad[\s\-–]*a/i.test(n) || /hyd[\s\-]*zone[\s\-]*a/i.test(n)
    })
  }
  const ids = new Set(drrMailMisBranchIds(scope, branches))
  if (ids.size) return branches.filter((b) => ids.has(b.id))
  const hit = branches.find((b) => b.name === scope || b.id === scope)
  if (hit) return [hit]
  const lower = scope.toLowerCase()
  if (lower === 'bangalore') {
    return branches.filter((b) => /bangalore|bengaluru|gulbarga|kalaburagi/i.test(String(b.name || '')))
  }
  if (lower === 'tada') {
    return branches.filter((b) => {
      const n = String(b.name || '')
      return /^tada\b/i.test(n.trim()) && !/tadipatri/i.test(n)
    })
  }
  const meta = metaForRecruitBranch(scope)
  if (!meta) return []
  return branches.filter((b) => {
    const n = String(b.name || '').trim().toLowerCase()
    return meta.misNameHints.some((h) => n === h.toLowerCase() || n.startsWith(h.toLowerCase() + ' ') || n.startsWith(h.toLowerCase() + '-'))
  })
}

async function computeMisShortageForDate(
  dateFor: string,
  centres: readonly string[],
): Promise<ShortageDaySnap | null> {
  const allOps = await getMisReportBranches(true)
  const branches = await getBranches(true)
  const clients = await getClients()
  const reports = await getReportsForDate(dateFor)
  if (!reports.length) return null

  const byBranch: ShortageBranchSnap[] = []
  let vac = 0
  let ot = 0
  let found = 0

  for (const centre of centres) {
    const targets = resolveMisTargets(centre, branches).filter((b) => allOps.some((o) => o.id === b.id))
    let cVac = 0
    let cOt = 0
    let submitted = false
    for (const hit of targets) {
      const rep = reports.find((r) => r.branchId === hit.id)
      if (!rep) continue
      submitted = true
      const rows = filterActiveReportRows(hit.id, rep.rows as Record<string, unknown>[], clients)
      const totals = reportDeployTotals(rows, hit.id, clients)
      cVac += totals.vac
      cOt += totals.ot
    }
    if (submitted) found += 1
    vac += cVac
    ot += cOt
    byBranch.push({ branch: centre, vac: cVac, ot: cOt, shortage: cVac + cOt })
  }

  /** Company-wide from all MIS reporting branches (Consolidated). */
  let allVac = 0
  let allOt = 0
  for (const hit of allOps) {
    const rep = reports.find((r) => r.branchId === hit.id)
    if (!rep) continue
    const rows = filterActiveReportRows(hit.id, rep.rows as Record<string, unknown>[], clients)
    const totals = reportDeployTotals(rows, hit.id, clients)
    allVac += totals.vac
    allOt += totals.ot
  }

  if (found === 0 && allVac + allOt === 0) return null

  return {
    date: dateFor,
    vac: allVac,
    ot: allOt,
    shortage: allVac + allOt,
    byBranch,
    savedAt: new Date().toISOString(),
  }
}

/**
 * Load / create baseline shortage snap from Consolidated MIS on SHORTAGE_BASELINE_DATE.
 * This opening balance is carried until recruitment is registered on DRR.
 * Prefer the saved Redis snap (locked date) so login is not blocked by a full MIS recompute.
 */
export async function ensureShortageBaseline(
  centres: readonly string[] = RECRUIT_BRANCHES,
): Promise<ShortageDaySnap> {
  const existing = await getShortageSnap(BASELINE_KEY_DATE)
  if (existing && (existing.shortage > 0 || (existing.byBranch || []).some((b) => b.shortage > 0))) {
    return existing
  }

  const computed = await computeMisShortageForDate(SHORTAGE_BASELINE_DATE, centres)
  if (computed && (computed.shortage > 0 || computed.byBranch.some((b) => b.shortage > 0))) {
    await saveShortageSnap({ ...computed, date: BASELINE_KEY_DATE })
    return { ...computed, date: BASELINE_KEY_DATE }
  }

  if (existing) return existing

  /** If 14 Aug not in Redis yet, keep an empty shell so login still opens. */
  const empty: ShortageDaySnap = {
    date: SHORTAGE_BASELINE_DATE,
    vac: 0,
    ot: 0,
    shortage: 0,
    byBranch: centres.map((branch) => ({ branch, vac: 0, ot: 0, shortage: 0 })),
    savedAt: new Date().toISOString(),
  }
  await saveShortageSnap(empty)
  return empty
}

export function baselineDateLabel(): string {
  const [y, m, d] = SHORTAGE_BASELINE_DATE.split('-')
  return `${d}/${m}/${y}`
}

/** Remaining shortage after registered recruits since baseline. */
export function remainingShortage(opening: number, recruitsSinceBaseline: number): number {
  return Math.max(0, Math.floor(opening) - Math.max(0, Math.floor(recruitsSinceBaseline)))
}

export { deployPct }
