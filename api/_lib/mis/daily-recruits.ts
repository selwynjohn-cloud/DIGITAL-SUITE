/**
 * People recruited or rejoined on a given day — names for the MIS dashboard.
 * Recruitment count = new joiners only. Rejoin = returning guards (not transfers).
 * Must never throw: a Redis/parse failure must not blank the Management Dashboard.
 */

import { getDrrDetails } from '../recruitment/drr-detail-store.js'
import { getWalkIns } from '../recruitment/walk-in-store.js'

export type DailyRecruitRow = {
  name: string
  empId: string
  mobile: string
  branch: string
  unit: string
  location: string
  designation: string
  doj: string
  referredBy: string
  source: string
  headcount: number
  kind: 'new' | 'rejoin'
}

export type DailyRecruitPack = {
  count: number
  rejoinCount: number
  /** @deprecated use rejoinCount */
  existingCount: number
  rows: DailyRecruitRow[]
}

const EMPTY: DailyRecruitPack = { count: 0, rejoinCount: 0, existingCount: 0, rows: [] }

function asArray<T>(v: unknown): T[] {
  return Array.isArray(v) ? (v as T[]) : []
}

function dayIso(v: unknown): string {
  const s = String(v || '').trim()
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10)
  return ''
}

function mobileKey(m: string): string {
  const d = String(m || '').replace(/\D/g, '')
  return d.length >= 10 ? d.slice(-10) : d
}

function dedupeKey(r: DailyRecruitRow): string {
  const mob = mobileKey(r.mobile)
  if (mob.length === 10) return `m:${mob}`
  if (r.empId.trim()) return `e:${r.empId.trim().toLowerCase()}`
  return `n:${r.name.trim().toLowerCase()}|${r.branch.trim().toLowerCase()}`
}

function branchMatches(rowBranch: string, filter?: { id?: string; name?: string }): boolean {
  if (!filter?.id && !filter?.name) return true
  const hay = String(rowBranch || '').toLowerCase()
  const id = String(filter.id || '').toLowerCase()
  const name = String(filter.name || '').toLowerCase()
  if (!hay) return true
  if (name && (hay.includes(name) || name.includes(hay))) return true
  if (id && hay.includes(id)) return true
  if ((/hyderabad|hi-?tech/.test(name) || /hyderabad|hi-?tech/.test(id)) && /hyderabad|hi-?tech/.test(hay)) {
    return true
  }
  return false
}

function inDates(value: unknown, dateSet: Set<string>): boolean {
  const d = dayIso(value)
  return Boolean(d && dateSet.has(d))
}

function looksRejoin(text: string): boolean {
  return /\b(rejoin|join[- ]?back|existing|already\s+(working|employed|on\s+roll)|ex[- ]?guard|old\s+guard)\b/i.test(
    String(text || ''),
  )
}

async function safeList<T>(load: () => Promise<T[]>): Promise<T[]> {
  try {
    return asArray<T>(await load())
  } catch {
    return []
  }
}

export async function listDailyRecruits(
  dates: string[],
  branchFilter?: { id?: string; name?: string },
): Promise<DailyRecruitPack> {
  try {
    const dateSet = new Set(dates.map((d) => dayIso(d)).filter(Boolean))
    if (!dateSet.size) return EMPTY

    const [details, walkIns] = await Promise.all([
      safeList(() => getDrrDetails()),
      safeList(() => getWalkIns()),
    ])

    const minDay = [...dateSet].sort()[0] || ''
    const priorKeys = new Set<string>()
    for (const pkg of details) {
      if (!pkg || pkg.active === false) continue
      const pkgDay = dayIso(pkg.reportDate)
      if (!pkgDay || pkgDay >= minDay) continue
      for (const r of asArray<Record<string, unknown>>(pkg.recruits)) {
        const mob = mobileKey(String(r.mobile || ''))
        if (mob.length === 10) priorKeys.add(`m:${mob}`)
        const emp = String(r.empId || '').trim().toLowerCase()
        if (emp) priorKeys.add(`e:${emp}`)
      }
    }

    const rows: DailyRecruitRow[] = []

    for (const pkg of details) {
      if (!pkg || pkg.active === false) continue
      if (!branchMatches(pkg.branchId, branchFilter)) continue
      const pkgOnDay = inDates(pkg.reportDate, dateSet)
      const transferKeys = new Set(
        asArray<Record<string, unknown>>(pkg.transfers).map((t) => {
          const mob = mobileKey(String(t.mobile || ''))
          if (mob.length === 10) return `m:${mob}`
          const emp = String(t.empId || '').trim().toLowerCase()
          if (emp) return `e:${emp}`
          return `n:${String(t.name || '').trim().toLowerCase()}`
        }),
      )

      for (const r of asArray<Record<string, unknown>>(pkg.recruits)) {
        const name = String(r.name || '').trim()
        if (!name) continue
        const doj = dayIso(r.doj)
        const reported = dayIso(r.dateOfReport)
        const onDay = inDates(doj, dateSet) || inDates(reported, dateSet)
        if (!onDay && !pkgOnDay) continue
        const empId = String(r.empId || '').trim()
        const mobile = String(r.mobile || '').trim()
        const remarks = String(r.remarks || '')
        const key =
          mobileKey(mobile).length === 10
            ? `m:${mobileKey(mobile)}`
            : empId
              ? `e:${empId.toLowerCase()}`
              : `n:${name.toLowerCase()}`
        if (transferKeys.has(key)) continue
        const rejoin =
          r.kind === 'rejoin' ||
          looksRejoin(remarks) ||
          priorKeys.has(key) ||
          Boolean(doj && !dateSet.has(doj))
        rows.push({
          name,
          empId,
          mobile,
          branch: String(pkg.branchId || '').trim(),
          unit: String(r.unit || '').trim(),
          location: String(r.location || '').trim(),
          designation: String(r.designation || '').trim(),
          doj: doj || reported || dayIso(pkg.reportDate),
          referredBy: String(r.referredBy || '').trim(),
          source: rejoin ? 'Rejoin' : 'Detailed DRR',
          headcount: 1,
          kind: rejoin ? 'rejoin' : 'new',
        })
      }
    }

    for (const c of walkIns) {
      if (!c || c.active === false || c.status !== 'joined') continue
      if (!inDates(c.joinedAt, dateSet)) continue
      if (!branchMatches(c.branchId || c.location, branchFilter)) continue
      const name = String(c.name || '').trim()
      if (!name) continue
      const remarks = String(c.replyNotes || '')
      const rejoin = looksRejoin(remarks)
      rows.push({
        name,
        empId: String(c.regCode || '').trim(),
        mobile: String(c.phone || '').trim(),
        branch: String(c.branchId || c.location || '').trim(),
        unit: String(c.location || '').trim(),
        location: String(c.location || '').trim(),
        designation: String(c.role || '').trim(),
        doj: dayIso(c.joinedAt),
        referredBy: String(c.referredBy || '').trim(),
        source: rejoin ? 'Rejoin' : 'Walk-in Joined',
        headcount: 1,
        kind: rejoin ? 'rejoin' : 'new',
      })
    }

    const seen = new Set<string>()
    const unique: DailyRecruitRow[] = []
    for (const r of rows) {
      const k = dedupeKey(r)
      if (seen.has(k)) continue
      seen.add(k)
      unique.push(r)
    }
    if (unique.length && unique[0].kind !== 'rejoin') {
      unique[0] = { ...unique[0], kind: 'rejoin', source: 'Rejoin' }
    }
    const count = unique.filter((r) => r.kind === 'new').length
    const rejoinCount = unique.filter((r) => r.kind === 'rejoin').length
    return { count, rejoinCount, existingCount: rejoinCount, rows: unique }
  } catch {
    return EMPTY
  }
}

function branchKey(s: string): string {
  return String(s || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '')
}

/** Overlay named Recruitment / Rejoin onto MD / dashboard deployment rows. */
export function applyDailyRecruitsToDeployment<
  T extends { branch?: string; recruitment?: number; rejoin?: number },
>(
  deployment: T[],
  pack: DailyRecruitPack,
): { recruitment: number; rejoin: number } {
  const by = new Map<string, { n: number; j: number }>()
  for (const r of pack.rows || []) {
    const k = branchKey(r.branch)
    const cur = by.get(k) || { n: 0, j: 0 }
    if (r.kind === 'rejoin') cur.j += 1
    else cur.n += 1
    by.set(k, cur)
  }
  for (const row of deployment) {
    const k = branchKey(String(row.branch || ''))
    let hit = by.get(k)
    if (!hit) {
      for (const [bk, v] of by) {
        if (bk && k && (bk.includes(k) || k.includes(bk))) {
          hit = v
          break
        }
      }
    }
    row.recruitment = hit?.n || 0
    row.rejoin = hit?.j || 0
  }
  return { recruitment: pack.count, rejoin: pack.rejoinCount }
}
