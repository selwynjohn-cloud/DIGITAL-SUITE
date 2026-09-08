/**
 * PVC / Medical / Training compliance.
 * Denominator = unique active guards in the register (each guard counted once).
 * Percentage never exceeds 100%.
 */

import { reportDeployTotals } from './deploy-math.js'
import { guardDocPresent, guardRecordEligible, type MisClient, type MisGuardDoc } from './store.js'

/** Sanctioned posts for a branch — today's MIS report first, else client master. */
export function branchSanctionedPosts(
  branchId: string,
  report: { rows: Record<string, unknown>[]; branchId: string } | null | undefined,
  clients: MisClient[],
): number {
  if (report) {
    const san = reportDeployTotals(report.rows, branchId, clients).san
    if (san > 0) return san
  }
  let s = 0
  for (const c of clients) {
    if (c.branchId !== branchId || c.active === false) continue
    s += (Number(c.sanA) || 0) + (Number(c.sanG) || 0) + (Number(c.sanB) || 0) + (Number(c.sanC) || 0)
  }
  return s
}

function norm(s: unknown): string {
  return String(s ?? '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ')
}

/** One row per guard — Excel imports often duplicate the same employee. */
export function dedupeEligibleGuardDocs(docs: MisGuardDoc[]): MisGuardDoc[] {
  const seen = new Set<string>()
  const out: MisGuardDoc[] = []
  for (const d of docs) {
    if (!guardRecordEligible(d)) continue
    const emp = norm(d.employeeId)
    const mob = String(d.mobile ?? '').replace(/\D/g, '')
    const key =
      (emp && emp.length >= 3 ? `e:${emp}` : '') ||
      (mob.length >= 8 ? `m:${mob}` : '') ||
      `n:${norm(d.guardName)}|${norm(d.unitName)}`
    if (seen.has(key)) continue
    seen.add(key)
    out.push(d)
  }
  return out
}

export function compliancePct(numerator: number, denom: number): number {
  if (!denom || denom <= 0) return 0
  return Math.min(100, Math.round((Math.min(numerator, denom) * 100) / denom))
}

export function guardComplianceCounts(
  docs: MisGuardDoc[],
  sanctioned = 0,
): {
  registered: number
  pvc: number
  medical: number
  training: number
  /** Denominator used for % — unique active guards (fallback: sanctioned). */
  sanctioned: number
  posts: number
} {
  const active = dedupeEligibleGuardDocs(docs)
  let pvc = 0
  let medical = 0
  let training = 0
  for (const d of active) {
    if (guardDocPresent(d.pvc, d.pvcValidity)) pvc++
    if (guardDocPresent(d.medical, d.medicalValidity)) medical++
    if (guardDocPresent(d.training)) training++
  }
  // Guard strength = unique active guards. Never use a smaller post count as % base
  // (that caused Bhopal/Kochi over 100%). Fall back to sanctioned posts only if register empty.
  const denom = active.length > 0 ? active.length : Math.max(0, sanctioned)
  return {
    registered: active.length,
    pvc: Math.min(pvc, denom || pvc),
    medical: Math.min(medical, denom || medical),
    training: Math.min(training, denom || training),
    sanctioned: denom,
    posts: Math.max(0, sanctioned),
  }
}

export function guardCompliancePcts(
  docs: MisGuardDoc[],
  sanctioned: number,
): { pvcPct: number; medicalPct: number; trainingPct: number; pvc: number; medical: number; training: number } {
  const c = guardComplianceCounts(docs, sanctioned)
  return {
    pvc: c.pvc,
    medical: c.medical,
    training: c.training,
    pvcPct: compliancePct(c.pvc, c.sanctioned),
    medicalPct: compliancePct(c.medical, c.sanctioned),
    trainingPct: compliancePct(c.training, c.sanctioned),
  }
}
