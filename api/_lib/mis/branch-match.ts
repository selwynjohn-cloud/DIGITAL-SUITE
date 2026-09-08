/**
 * Match branch daily reports when Master Directory has duplicate / legacy branch names.
 * Does NOT combine Hyderabad-A, Hyderabad-B, or Hi-Tech City — each keeps its own report.
 * Does NOT combine neighbouring cities (Tada stays Tada, Pondicherry stays Pondicherry).
 */
import type { MisBranch, MisReport } from './store.js'
import { misBranchGroupKey } from './branch-dedupe.js'

function reportGroupKey(report: MisReport, branches: MisBranch[]): string {
  const name = report.branchName || branches.find((b) => b.id === report.branchId)?.name || ''
  return misBranchGroupKey(name) || report.branchId
}

export function isSubmitted(r: MisReport | null | undefined): r is MisReport {
  return Boolean(r && String(r.submittedAt ?? '').trim())
}

/** Prefer a submitted report over an empty draft on a newer branch id. */
function preferReport(direct: MisReport | undefined, grouped: MisReport | undefined): MisReport | null {
  if (isSubmitted(direct) && isSubmitted(grouped)) {
    return String(grouped!.submittedAt) > String(direct!.submittedAt) ? grouped! : direct!
  }
  if (isSubmitted(direct)) return direct!
  if (isSubmitted(grouped)) return grouped!
  return direct ?? grouped ?? null
}

/** Latest report per branch id, plus one report per branch group (for alias rows). */
export function buildBranchReportMap(branches: MisBranch[], reports: MisReport[]): Map<string, MisReport | null> {
  const byId = new Map<string, MisReport>()
  const byGroup = new Map<string, MisReport>()
  for (const r of reports) {
    const prevId = byId.get(r.branchId)
    if (!prevId || String(r.submittedAt ?? '') >= String(prevId.submittedAt ?? '')) byId.set(r.branchId, r)
    const gk = reportGroupKey(r, branches)
    const prev = byGroup.get(gk)
    if (!prev || String(r.submittedAt ?? '') > String(prev.submittedAt ?? '')) byGroup.set(gk, r)
  }

  const out = new Map<string, MisReport | null>()
  for (const b of branches) {
    const gk = misBranchGroupKey(b.name)
    out.set(b.id, preferReport(byId.get(b.id), gk ? byGroup.get(gk) : undefined))
  }
  return out
}

export function resolveBranchReport(
  branch: MisBranch,
  reportMap: Map<string, MisReport | null>,
): MisReport | null {
  return reportMap.get(branch.id) ?? null
}
