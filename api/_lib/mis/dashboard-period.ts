/**
 * Dashboard period helpers — day, week, or specific month.
 */
import { misWeekStartMonday } from './dates.js'
import type { MisBranch, MisReport } from './store.js'

export type DashboardPeriod = 'day' | 'week' | 'month'

export type DashboardPeriodRange = {
  period: DashboardPeriod
  anchorDate: string
  weekStart: string
  weekEnd: string
  monthKey: string
  dates: string[]
  label: string
  cacheKey: string
}

function pad(n: number): string {
  return String(n).padStart(2, '0')
}

function addDays(iso: string, days: number): string {
  const d = new Date(`${iso}T12:00:00`)
  d.setDate(d.getDate() + days)
  return d.toISOString().slice(0, 10)
}

function monthEnd(monthKey: string): string {
  const [y, m] = monthKey.split('-').map(Number)
  const last = new Date(y, m, 0).getDate()
  return `${y}-${pad(m)}-${pad(last)}`
}

function datesBetween(start: string, end: string): string[] {
  const out: string[] = []
  let cur = start
  while (cur <= end) {
    out.push(cur)
    cur = addDays(cur, 1)
  }
  return out
}

function formatLabelDay(iso: string): string {
  try {
    return new Date(`${iso}T12:00:00`).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      timeZone: 'Asia/Kolkata',
    })
  } catch {
    return iso
  }
}

function formatLabelMonth(monthKey: string): string {
  const [y, m] = monthKey.split('-').map(Number)
  try {
    return new Date(y, m - 1, 1).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })
  } catch {
    return monthKey
  }
}

/** Resolve dashboard period from API body. */
export function resolveDashboardPeriod(body: {
  period?: unknown
  date?: unknown
  month?: unknown
  dateFor?: unknown
}): DashboardPeriodRange {
  const periodRaw = String(body.period ?? 'day').trim().toLowerCase()
  const period: DashboardPeriod =
    periodRaw === 'week' || periodRaw === 'month' ? periodRaw : 'day'

  const anchorDate = String(body.date ?? body.dateFor ?? new Date().toISOString().slice(0, 10)).slice(0, 10)
  const monthPick = String(body.month ?? '').trim().slice(0, 7)

  const weekStart = misWeekStartMonday(anchorDate)
  const weekEnd = addDays(weekStart, 5)

  let monthKey = anchorDate.slice(0, 7)
  let dates: string[] = [anchorDate]
  let label = formatLabelDay(anchorDate)
  let cacheKey = `day:${anchorDate}`

  if (period === 'week') {
    dates = datesBetween(weekStart, weekEnd)
    label = `Week ${formatLabelDay(weekStart)} – ${formatLabelDay(weekEnd)}`
    cacheKey = `week:${weekStart}`
  } else if (period === 'month') {
    monthKey = /^\d{4}-\d{2}$/.test(monthPick) ? monthPick : anchorDate.slice(0, 7)
    const start = `${monthKey}-01`
    const end = monthEnd(monthKey)
    dates = datesBetween(start, end)
    label = formatLabelMonth(monthKey)
    cacheKey = `month:${monthKey}`
  }

  return { period, anchorDate, weekStart, weekEnd, monthKey, dates, label, cacheKey }
}

/** Monday week-start dates that fall inside a calendar month. */
export function mondaysInMonth(monthKey: string): string[] {
  const start = `${monthKey}-01`
  const end = monthEnd(monthKey)
  const mondays: string[] = []
  let cur = misWeekStartMonday(start)
  if (cur < start) cur = addDays(cur, 7)
  while (cur <= end) {
    mondays.push(cur)
    cur = addDays(cur, 7)
  }
  return mondays
}

/** Latest submitted report per branch within a date range. */
export function pickLatestBranchReports(
  branches: MisBranch[],
  reportsByDate: Map<string, MisReport[]>,
  dates: string[],
): Map<string, MisReport> {
  const out = new Map<string, MisReport>()
  for (const b of branches) {
    let best: MisReport | null = null
    for (const d of dates) {
      const list = reportsByDate.get(d) ?? []
      const r = list.find((x) => x.branchId === b.id)
      if (!r) continue
      if (!best || String(r.submittedAt ?? '') > String(best.submittedAt ?? '')) best = r
    }
    if (best) out.set(b.id, best)
  }
  return out
}

/** Count submission days + sum HR/complaint fields across period. */
export function aggregateBranchPeriodStats(
  branchId: string,
  reportsByDate: Map<string, MisReport[]>,
  dates: string[],
): { daysSubmitted: number; resignation: number; recruitment: number; complaints: number } {
  let daysSubmitted = 0
  let resignation = 0
  let recruitment = 0
  let complaints = 0
  for (const d of dates) {
    const r = (reportsByDate.get(d) ?? []).find((x) => x.branchId === branchId)
    if (!r) continue
    daysSubmitted++
    const s = r.summary ?? {}
    resignation += Number(s.resignation ?? s.mobileMentionedPct) || 0
    recruitment += Number(s.recruitment ?? s.mobileActualPct) || 0
    complaints += Number(s.complaints) || 0
  }
  return { daysSubmitted, resignation, recruitment, complaints }
}
