/**
 * Match branch daily reports when Master Directory has duplicate / legacy branch names.
 * Does NOT combine Hyderabad-A, Hyderabad-B, or Hi-Tech City — each keeps its own report.
 * Does combine small+large pairs (Tada→Nellore, Pondicherry→TN, Kakinada→Vizag).
 */
import type { MisBranch, MisReport } from './store.js'
import { misBranchGroupKey } from './branch-dedupe.js'

function reportGroupKey(report: MisReport, branches: MisBranch[]): string {
  const name = report.branchName || branches.find((b) => b.id === report.branchId)?.name || ''
  return misBranchGroupKey(name) || report.branchId
}

/** Latest report per branch id, plus one report per branch group (for alias rows). */
export function buildBranchReportMap(branches: MisBranch[], reports: MisReport[]): Map<string, MisReport | null> {
  const byId = new Map<string, MisReport>()
  const byGroup = new Map<string, MisReport>()
  for (const r of reports) {
    byId.set(r.branchId, r)
    const gk = reportGroupKey(r, branches)
    const prev = byGroup.get(gk)
    if (!prev || String(r.submittedAt) > String(prev.submittedAt)) byGroup.set(gk, r)
  }

  const out = new Map<string, MisReport | null>()
  for (const b of branches) {
    const direct = byId.get(b.id)
    if (direct) {
      out.set(b.id, direct)
      continue
    }
    const gk = misBranchGroupKey(b.name)
    out.set(b.id, gk ? byGroup.get(gk) ?? null : null)
  }
  return out
}

export function resolveBranchReport(
  branch: MisBranch,
  reportMap: Map<string, MisReport | null>,
): MisReport | null {
  return reportMap.get(branch.id) ?? null
}
