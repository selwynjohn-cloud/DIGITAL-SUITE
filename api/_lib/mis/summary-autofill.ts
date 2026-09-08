import type { MisCollection, MisComplaint, MisSummary } from './store.js'
import { getCollections, isMisReportingBranch, num } from './store.js'
import { normalizeToLacs } from '../inr-money.js'
import { mondaysInMonth } from './dashboard-period.js'
import { misWeekStartMonday } from './dates.js'

export const MANUAL_ATTENTION =
  'Kind attention — system could not get the data. Please enter manually.'

export type FieldFetchStatus = 'auto' | 'previous' | 'manual'

export type SummaryFieldMeta = {
  status: FieldFetchStatus
  source: string
  hint: string
}

const SUMMARY_CARRY_KEYS: (keyof MisSummary)[] = [
  'collectionPct',
  'weeklyCollectionPct',
  'consolidatedCollectionPct',
  'dayVisits',
  'nightChecks',
  'trainedSites',
  'medicalFitnessPct',
  'pvcPct',
  'psaraPct',
  'resignation',
  'recruitment',
  'guardComplaints',
  'clientComplaints',
  'complaints',
  'lateStartCases',
  'outOfPostCases',
  'remarks',
]

export function isEmptySummaryValue(v: unknown): boolean {
  const s = String(v ?? '').trim()
  return !s
}

/** Keep typed values; fill blanks from the branch's previous submission. */
export function mergePreviousSummary(
  current: Partial<MisSummary> | null | undefined,
  previous: Partial<MisSummary> | null | undefined,
): Partial<MisSummary> {
  const out: Partial<MisSummary> = { ...(current ?? {}) }
  if (!previous) return out
  for (const key of SUMMARY_CARRY_KEYS) {
    if (isEmptySummaryValue(out[key]) && !isEmptySummaryValue(previous[key])) {
      ;(out as Record<string, string>)[key] = String(previous[key])
    }
  }
  return out
}

export function complaintSolvedRegistered(solved: number, registered: number): string {
  if (!registered && !solved) return ''
  return `${solved}/${registered}`
}

function isSolvedComplaint(c: MisComplaint): boolean {
  const st = String(c.status ?? '').trim().toLowerCase()
  return st === 'closed' || st === 'solved' || st === 'resolved' || Boolean(c.actionTaken?.trim())
}

/** Guard complaints — Agile Guards app only (solved / registered). */
export function tallyGuardsAppComplaints(list: MisComplaint[]): string {
  const filtered = list.filter(
    (c) =>
      c.active !== false &&
      (c.source === 'guards' || String(c.channel ?? '').toLowerCase().includes('agile guards')),
  )
  const registered = filtered.length
  const solved = filtered.filter(isSolvedComplaint).length
  return complaintSolvedRegistered(solved, registered)
}

/** Client complaints — Director @agilegroup.co.in mail inbox (solved / registered). */
export function tallyDirectorMailComplaints(list: MisComplaint[]): string {
  const filtered = list.filter((c) => {
    if (c.active === false) return false
    if (c.source === 'inbox' || c.emailId) return true
    const ch = String(c.channel ?? '').toLowerCase()
    if (ch.includes('mail') || ch.includes('email')) return true
    const t = String(c.type ?? '').toLowerCase()
    return t.includes('client') && c.source !== 'guards'
  })
  const registered = filtered.length
  const solved = filtered.filter(isSolvedComplaint).length
  return complaintSolvedRegistered(solved, registered)
}

export function weekCollectedSum(row: {
  mon?: number
  tue?: number
  wed?: number
  thu?: number
  fri?: number
  sat?: number
}): number {
  return (
    (normalizeToLacs(row.mon) ?? num(row.mon)) +
    (normalizeToLacs(row.tue) ?? num(row.tue)) +
    (normalizeToLacs(row.wed) ?? num(row.wed)) +
    (normalizeToLacs(row.thu) ?? num(row.thu)) +
    (normalizeToLacs(row.fri) ?? num(row.fri)) +
    (normalizeToLacs(row.sat) ?? num(row.sat))
  )
}

export function weeklyCollectionPct(row: MisCollection, collected?: number): string {
  const budget = normalizeToLacs(row.budget) ?? num(row.budget)
  if (budget <= 0) return ''
  const wk = collected ?? weekCollectedSum(row)
  return String(collectionAchievementPct(wk, budget))
}

/** Weekly collection achievement % — capped at 999. */
export function collectionAchievementPct(collected: number, budget: number): number {
  if (budget <= 0) return 0
  let pct = Math.round((collected * 100) / budget)
  if (!Number.isFinite(pct) || pct < 0) return 0
  if (pct > 999) pct = 999
  return pct
}

/** Guard-service branches only — excludes Corporate Office (banking / HQ). */
export function isGuardServiceCollectionBranch(branchName: string): boolean {
  return isMisReportingBranch(branchName)
}

/** Friday OST current-month collected (lakhs). Weekly Mon–Sat is ignored. */
export function ostCollectedLacs(row?: Pick<MisCollection, 'ostCollected'> | null): number {
  return Math.max(0, Number(row?.ostCollected) || 0)
}

/**
 * Branch month collection % from Friday OST only.
 * Weekly Mon–Sat must never change this figure.
 */
export function ostMonthCollectionPct(
  row?: Pick<MisCollection, 'monthlyBilling' | 'ostCollected'> | null,
): string {
  const billing = Number(row?.monthlyBilling) || 0
  const ost = ostCollectedLacs(row)
  if (!(billing > 0) || ost <= 0) return ''
  const pct = Math.min(100, (ost * 100) / billing)
  return String(Math.round(pct * 100) / 100)
}

/** Clamp a Friday OST footer % — never 100% mid-cycle, never weekly. */
export function ostFooterRecoveryPct(pct: number | null | undefined): number {
  const n = Number(pct)
  if (!Number.isFinite(n) || n <= 0) return 0
  if (n >= 99) return 0
  return Math.round(n * 100) / 100
}

/** ₹ Lakhs recovered on the current billing month — Friday OST collected only. */
export function consolidatedRecoveredLacs(row: MisCollection, _weekCollected?: number): number {
  const ost = ostCollectedLacs(row)
  if (ost > 0) return ost
  return 0
}

/** OST-only recovery % (Saturday upload) — floor for branch consolidated %. */
export function consolidatedOstBaselinePct(row: MisCollection): number {
  const billing = Number(row.monthlyBilling) || 0
  if (!billing) return 0
  const outstanding = Number(row.outstanding) || 0
  const pct = ((billing - outstanding) * 100) / billing
  if (!Number.isFinite(pct) || pct <= 0) return 0
  return Math.min(100, Math.round(pct * 100) / 100)
}

export type CompanyConsolidatedInput = {
  billing: number
  outstanding: number
  collected: number
  guardService: boolean
}

export type CompanyBankingSlice = {
  billing: number
  outstanding: number
  collected?: number
}

function rowRecoveredLacs(billing: number, outstanding: number, collected: number): number {
  return Math.max(0, billing - Math.max(0, outstanding - collected))
}

/**
 * Overall / total collection % — Friday OST collected ÷ current-month billing.
 * Weekly Mon–Sat must not be added (that became 100% mid-month).
 */
export function companyCashCollectionPct(
  billingLacs: number,
  ostCollectedAmount: number,
  _weekCollectedLacs?: number,
): number {
  if (!(billingLacs > 0)) return 0
  const collected = Math.max(0, ostCollectedAmount)
  return Math.min(100, Math.round((collected * 10000) / billingLacs) / 100)
}

/**
 * Overall consolidated totals — all guard branches + banking (June'26 OST).
 * recoveryPct prefers cash collected ÷ billing when baseline collected is known.
 */
export function companyConsolidatedTotals(
  rows: CompanyConsolidatedInput[],
  banking?: CompanyBankingSlice | null,
  opts?: { ostCollectedLacs?: number },
): {
  totalBilling: number
  totalRecovered: number
  recoveryPct: number
  branchBilling: number
  branchRecovered: number
  bankingBilling: number
  bankingRecovered: number
  totalOutstanding: number
} {
  const branches = rows.filter((r) => r.guardService && r.billing > 0)
  const branchBilling = branches.reduce((s, r) => s + r.billing, 0)
  const branchOutstanding = branches.reduce((s, r) => s + (Number(r.outstanding) || 0), 0)
  const branchRecovered = branches.reduce(
    (s, r) => s + rowRecoveredLacs(r.billing, r.outstanding, 0),
    0,
  )
  const bankingBilling = banking?.billing ?? 0
  const bankingOutstanding = banking?.outstanding ?? 0
  const bankingRecovered =
    bankingBilling > 0
      ? rowRecoveredLacs(bankingBilling, bankingOutstanding, 0)
      : 0
  const totalBilling = branchBilling + bankingBilling
  const totalOutstanding = branchOutstanding + bankingOutstanding
  const ostCollected = Number(opts?.ostCollectedLacs) || 0
  // Friday OST collected only — weekly Mon–Sat must not raise this.
  const totalRecovered = ostCollected > 0 ? ostCollected : branchRecovered + bankingRecovered
  const recoveryPct =
    totalBilling > 0 ? Math.min(100, Math.round((totalRecovered * 10000) / totalBilling) / 100) : 0
  return {
    totalBilling,
    totalRecovered,
    recoveryPct,
    branchBilling,
    branchRecovered,
    bankingBilling,
    bankingRecovered,
    totalOutstanding,
  }
}

/** Build banking slice from OST baseline (lakhs). */
export function bankingSliceFromBaseline(
  baseline: { bankingBillingL?: number; bankingOutstandingL?: number } | null | undefined,
): CompanyBankingSlice | null {
  const billing = Number(baseline?.bankingBillingL) || 0
  if (!billing) return null
  return { billing, outstanding: Number(baseline?.bankingOutstandingL) || 0, collected: 0 }
}

/** Fallback only when no Friday OST footer is stored. */
export const JUNE26_OST_RECOVERY_FLOOR_PCT = 13.25

/** Friday OST footer % only — weekly collection must not raise or lower this. */
export function companyConsolidatedRecoveryPct(
  computedPct: number,
  baselinePct?: number | null,
): number {
  const ost = ostFooterRecoveryPct(baselinePct)
  if (ost > 0) return ost
  const computed = ostFooterRecoveryPct(computedPct)
  if (computed > 0) return computed
  return JUNE26_OST_RECOVERY_FLOOR_PCT
}

/**
 * Cash collected on this branch in the calendar month up to (and including) this week.
 */
export async function branchMonthCollectedLacs(branchId: string, dateFor: string): Promise<number> {
  const weekStart = misWeekStartMonday(dateFor)
  const mondays = mondaysInMonth(String(dateFor).slice(0, 7)).filter((m) => m <= weekStart)
  if (!mondays.length) return 0
  const lists = await Promise.all(mondays.map((m) => getCollections(m)))
  let sum = 0
  for (const list of lists) {
    const row = list.find((c) => c.branchId === branchId)
    if (row) sum += weekCollectedSum(row)
  }
  return Math.round(sum * 100) / 100
}

/**
 * Branch consolidated (total) collection % = Friday OST current-month collected ÷ billing.
 * Weekly Mon–Sat arguments are ignored so daily entry cannot change this %.
 */
export function consolidatedCollectionPct(
  row: MisCollection,
  _weekCollected?: number,
  _monthCollected?: number,
): string {
  return ostMonthCollectionPct(row)
}

export function fieldMetaAuto(source: string): SummaryFieldMeta {
  return { status: 'auto', source, hint: `✓ Auto-filled from ${source}` }
}

export function fieldMetaPrevious(): SummaryFieldMeta {
  return {
    status: 'previous',
    source: 'Previous submission',
    hint: '✓ Carried from your last submitted report — you may edit',
  }
}

export function fieldMetaManual(source: string): SummaryFieldMeta {
  return { status: 'manual', source, hint: MANUAL_ATTENTION }
}

export function filledSummaryField(v: unknown): boolean {
  return !isEmptySummaryValue(v)
}
