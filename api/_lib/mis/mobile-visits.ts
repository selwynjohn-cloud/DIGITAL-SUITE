/**
 * Pull duty visits from Agile Mobile (Work360 / Aititude) into MIS.
 *
 * Configure on Vercel:
 *   MOBILE_VISIT_API_URL  — e.g. https://agilegroup-work360.aititude.in/api/mis/visits?date={date}
 *   MOBILE_VISIT_API_KEY  — optional Bearer token
 *
 * Expected JSON (flexible field names):
 *   { visits: [{ staff, user, client, unit, time, place, personMet, remarks, type, visitType }] }
 */

import { getBranches, nid, saveVisits, type MisVisit } from './store.js'
import { syncWork360Visits } from './work360.js'
import { syncWork360DutyIncidents } from './work360-duty.js'
import { syncWork360AttendanceRange } from '../recruitment/work360-attendance.js'
import type { SyncVisitsResult } from './visit-sync-types.js'

export type { SyncVisitsResult } from './visit-sync-types.js'

const TIMEOUT_MS = 25_000

export function inferVisitType(raw: Record<string, unknown>): 'D' | 'N' | 'T' | '' {
  const t = String(raw.visitType ?? raw.type ?? raw.visit_type ?? raw.category ?? '').trim().toUpperCase()
  if (!t) return ''
  if (t === 'D' || t.includes('DAY')) return 'D'
  if (t === 'N' || t.includes('NIGHT')) return 'N'
  if (t === 'T' || t.includes('TRAIN')) return 'T'
  if (t.includes('PATROL')) return 'D'
  return ''
}

function pick(raw: Record<string, unknown>, keys: string[]): string {
  for (const k of keys) {
    const v = raw[k]
    if (v != null && String(v).trim()) return String(v).trim()
  }
  return ''
}

function normalizeVisit(raw: Record<string, unknown>, date: string): MisVisit {
  return {
    id: String(raw.id ?? nid('vs')),
    date,
    user: pick(raw, ['user', 'staff', 'staffName', 'employeeName', 'officer', 'name']).slice(0, 120),
    personMet: pick(raw, ['personMet', 'person_met', 'contact', 'met']).slice(0, 120),
    client: pick(raw, ['client', 'clientName', 'client_name', 'company']).slice(0, 120),
    unit: pick(raw, ['unit', 'location', 'site', 'branch', 'unitName']).slice(0, 120),
    visitTime: pick(raw, ['visitTime', 'time', 'timestamp', 'visitedAt', 'createdAt']).slice(0, 40),
    place: pick(raw, ['place', 'address', 'geo', 'locationName']).slice(0, 120),
    remarks: pick(raw, ['remarks', 'notes', 'comment', 'description']).slice(0, 300),
    visitType: inferVisitType(raw),
    fromMobile: true,
  }
}

export type MobileSyncOptions = {
  /** Pull visit report for this date (default true). */
  includeVisits?: boolean
  /** Pull late start / left post for this date. */
  includeDuty?: boolean
  /** Slow — only for Recruitment absconder sync, not visit pages. */
  includeAttendance?: boolean
  attendanceDays?: number
}

export async function syncMobileVisits(
  date: string,
  opts: MobileSyncOptions = {},
): Promise<
  SyncVisitsResult & {
    duty?: SyncVisitsResult
    attendance?: { ok: boolean; saved?: number; error?: string; attempts?: string[] }
  }
> {
  if (process.env.WORK360_API_BASE_URL?.trim()) {
    const includeVisits = opts.includeVisits !== false
    const includeDuty = opts.includeDuty === true
    const includeAttendance = opts.includeAttendance === true

    const visits: SyncVisitsResult = includeVisits
      ? await syncWork360Visits(date)
      : { ok: true, date, fetched: 0, saved: 0, skipped: true }

    const duty = includeDuty ? await syncWork360DutyIncidents(date) : undefined
    const attendance = includeAttendance
      ? await syncWork360AttendanceRange(date, opts.attendanceDays ?? 14)
      : undefined

    return {
      ...visits,
      duty,
      attendance: attendance
        ? {
            ok: attendance.ok,
            saved: attendance.saved,
            error: attendance.error,
            attempts: attendance.attempts,
          }
        : undefined,
    }
  }

  const base = process.env.MOBILE_VISIT_API_URL?.trim()
  if (!base) {
    return { ok: true, date, fetched: 0, saved: 0, skipped: true, error: 'MOBILE_VISIT_API_URL not set' }
  }

  const url = base.includes('{date}') ? base.replace('{date}', date) : `${base}${base.includes('?') ? '&' : '?'}date=${encodeURIComponent(date)}`
  const key = process.env.MOBILE_VISIT_API_KEY?.trim()

  try {
    const headers: Record<string, string> = { Accept: 'application/json' }
    if (key) headers.Authorization = `Bearer ${key}`

    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)
    const res = await fetch(url, { headers, signal: controller.signal })
    clearTimeout(timer)

    if (!res.ok) {
      return { ok: false, date, fetched: 0, saved: 0, error: `Mobile API returned ${res.status}` }
    }

    const data = (await res.json()) as Record<string, unknown>
    const arr = Array.isArray(data.visits)
      ? data.visits
      : Array.isArray(data.data)
        ? data.data
        : Array.isArray(data.records)
          ? data.records
          : []

    const list: MisVisit[] = arr
      .slice(0, 5000)
      .filter((x): x is Record<string, unknown> => x && typeof x === 'object')
      .map((x) => normalizeVisit(x, date))
      .filter((v) => v.user || v.client)

    if (!list.length) {
      return { ok: true, date, fetched: 0, saved: 0, skipped: true, error: 'No visits returned for this date' }
    }

    const ok = await saveVisits(date, list)
    return { ok, date, fetched: arr.length, saved: list.length, error: ok ? undefined : 'Could not save to storage' }
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Mobile sync failed'
    return { ok: false, date, fetched: 0, saved: 0, error: msg }
  }
}

/** Map MIS branch name → mobile branch label (extend when API shares branch codes). */
export function branchAliases(): Record<string, string> {
  const aliases: Record<string, string> = {}
  for (const b of DEFAULT_BRANCH_ALIASES) aliases[b.id] = b.mobileName
  return aliases
}

const DEFAULT_BRANCH_ALIASES = [
  { id: 'br15', mobileName: 'Hi-Tech City' },
]

export async function buildVisitAnalysis(date: string, visits: MisVisit[]) {
  const branches = await getBranches()
  const byStaff: Record<string, { D: number; N: number; T: number; total: number; clients: Set<string> }> = {}
  const byClient: Record<string, { D: number; N: number; T: number; total: number }> = {}

  for (const v of visits) {
    const u = v.user || 'Unknown'
    if (!byStaff[u]) byStaff[u] = { D: 0, N: 0, T: 0, total: 0, clients: new Set() }
    byStaff[u].total++
    if (v.client) byStaff[u].clients.add(v.client)
    const t = v.visitType || 'D'
    if (t === 'N') byStaff[u].N++
    else if (t === 'T') byStaff[u].T++
    else byStaff[u].D++

    const cl = v.client || 'Unknown'
    if (!byClient[cl]) byClient[cl] = { D: 0, N: 0, T: 0, total: 0 }
    byClient[cl].total++
    if (t === 'N') byClient[cl].N++
    else if (t === 'T') byClient[cl].T++
    else byClient[cl].D++
  }

  const staffRows = Object.entries(byStaff)
    .map(([name, s]) => ({
      name,
      day: s.D,
      night: s.N,
      training: s.T,
      total: s.total,
      clients: s.clients.size,
      metTarget: s.D >= 5,
    }))
    .sort((a, b) => b.total - a.total)

  const clientRows = Object.entries(byClient)
    .map(([client, c]) => ({ client, ...c }))
    .sort((a, b) => b.total - a.total)

  return {
    branchCount: branches.length,
    staffRows,
    clientRows,
    metFiveTarget: staffRows.filter((s) => s.metTarget).length,
    staffCount: staffRows.length,
  }
}
