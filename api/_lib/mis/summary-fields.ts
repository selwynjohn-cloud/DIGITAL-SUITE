import type { MisSummary } from './store.js'

/** Resignation count from branch daily summary (legacy: mobileMentionedPct). */
export function summaryResignation(s?: Partial<MisSummary> | null): string {
  const v = String(s?.resignation ?? '').trim()
  if (v) return v
  return String(s?.mobileMentionedPct ?? '').trim()
}

/** Recruitment count from branch daily summary (legacy: mobileActualPct). */
export function summaryRecruitment(s?: Partial<MisSummary> | null): string {
  const v = String(s?.recruitment ?? '').trim()
  if (v) return v
  return String(s?.mobileActualPct ?? '').trim()
}

export function summaryResignationNum(s?: Partial<MisSummary> | null): number {
  const n = Number(summaryResignation(s))
  return Number.isFinite(n) ? n : 0
}

export function summaryRecruitmentNum(s?: Partial<MisSummary> | null): number {
  const n = Number(summaryRecruitment(s))
  return Number.isFinite(n) ? n : 0
}
