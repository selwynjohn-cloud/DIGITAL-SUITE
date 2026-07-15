/**
 * Remove duplicate MIS branch masters and merge data onto one canonical branch per zone.
 *
 * Business rules (Director):
 * - Same city, multiple branches = SEPARATE daily reports (e.g. Hyderabad-A, Hyderabad-B,
 *   Hi-Tech City — three branches, three reports; split by guard headcount).
 * - Small branch + nearby big branch = ONE combined report (e.g. Nellore & Tada,
 *   Tamil Nadu & Pondicherry, Vizag & Kakinada).
 * - Surat (Gujarat state) reports under Mumbai & Surat — no separate Gujarat branch.
 */
import {
  getBranches,
  getClients,
  getCollections,
  getComplaints,
  getGuardDocs,
  getGuards,
  getReport,
  getReportDates,
  getStaff,
  getUsers,
  saveBranches,
  saveClients,
  saveCollections,
  saveComplaints,
  saveGuardDocs,
  saveGuards,
  saveStaff,
  saveUsers,
  submitReport,
  type MisBranch,
  type MisClient,
  type MisCollection,
  type MisComplaint,
  type MisGuard,
  type MisGuardDoc,
  type MisReport,
  type MisStaff,
  type MisUser,
} from './store.js'
import { misTodayIst } from './dates.js'

import { misBranchGroupKey } from './branch-group-key.js'
export { misBranchGroupKey }
const PREFERRED_DISPLAY: Record<string, string> = {
  'HYDERABAD-A': 'Hyderabad-A',
  'HYDERABAD-B': 'Hyderabad-B',
  'HI-TECH CITY': 'Hi-Tech City',
  'TN-PONDICHERRY': 'Chennai & Pondicherry',
  'VIZAG-KAKINADA': 'Visakhapatnam & Kakinada',
  'NELLORE-TADA': 'Nellore & Tada',
  'KARNATAKA': 'Bangalore',
  'KERALA': 'Kochi',
  'MUMBAI-SURAT': 'Mumbai & Surat',
  'BHOPAL-MP': 'Bhopal',
  'LUCKNOW-UP': 'Lucknow',
  'VIJAYAWADA': 'Vijayawada',
  'TIRUPATHI': 'Tirupati & Tadipatri',
}

function weekStartMonday(dateFor: string): string {
  const d = new Date(`${dateFor}T12:00:00`)
  const day = d.getDay()
  const diff = day === 0 ? -6 : 1 - day
  d.setDate(d.getDate() + diff)
  return d.toISOString().slice(0, 10)
}

async function branchWeight(branchId: string, today: string): Promise<number> {
  const [clients, staff, todayReport] = await Promise.all([
    getClients(branchId),
    getStaff(branchId),
    getReport(branchId, today),
  ])
  return clients.length * 20 + staff.length * 5 + (todayReport ? 200 : 0)
}

async function mergeClients(fromId: string, toId: string): Promise<number> {
  if (fromId === toId) return 0
  const all = await getClients()
  const fromRows = all.filter((c) => c.branchId === fromId)
  if (!fromRows.length) return 0
  const next = all
    .filter((c) => c.branchId !== fromId)
    .concat(fromRows.map((c) => ({ ...c, branchId: toId })))
  await saveClients(next)
  return fromRows.length
}

async function mergeStaffRows(fromId: string, toId: string): Promise<number> {
  if (fromId === toId) return 0
  const all = await getStaff()
  const fromRows = all.filter((s) => s.branchId === fromId)
  if (!fromRows.length) return 0
  const next = all
    .filter((s) => s.branchId !== fromId)
    .concat(fromRows.map((s) => ({ ...s, branchId: toId })))
  await saveStaff(next)
  return fromRows.length
}

async function mergeKeyedRows<T extends { branchId: string }>(
  fromId: string,
  toId: string,
  load: (id: string) => Promise<T[]>,
  save: (id: string, list: T[]) => Promise<boolean>,
): Promise<number> {
  if (fromId === toId) return 0
  const fromList = await load(fromId)
  if (!fromList.length) return 0
  const toList = await load(toId)
  await save(toId, [...toList, ...fromList.map((row) => ({ ...row, branchId: toId }))])
  await save(fromId, [])
  return fromList.length
}

async function mergeReports(fromId: string, toId: string, dates: string[]): Promise<number> {
  if (fromId === toId) return 0
  let moved = 0
  for (const dateFor of dates) {
    const from = await getReport(fromId, dateFor)
    if (!from) continue
    const to = await getReport(toId, dateFor)
    const report: MisReport = {
      ...from,
      branchId: toId,
      id: `${toId}:${dateFor}`,
    }
    if (!to) {
      await submitReport(report)
      moved++
    }
  }
  return moved
}

async function mergeCollections(fromId: string, toId: string): Promise<number> {
  if (fromId === toId) return 0
  const today = misTodayIst()
  const weeks = new Set<string>()
  for (let i = 0; i < 12; i++) {
    const d = new Date(`${today}T12:00:00`)
    d.setDate(d.getDate() - i * 7)
    weeks.add(weekStartMonday(d.toISOString().slice(0, 10)))
  }
  let moved = 0
  for (const week of weeks) {
    const rows = await getCollections(week)
    const fromRow = rows.find((r) => r.branchId === fromId)
    if (!fromRow) continue
    const hasTo = rows.some((r) => r.branchId === toId)
    const next: MisCollection[] = rows
      .filter((r) => r.branchId !== fromId)
      .concat(hasTo ? [] : [{ ...fromRow, branchId: toId, id: `${toId}:${week}` }])
    await saveCollections(week, next)
    moved++
  }
  return moved
}

async function mergeUsers(fromId: string, toId: string): Promise<number> {
  const users = await getUsers()
  let n = 0
  const next = users.map((u) => {
    if (u.branchId !== fromId) return u
    n++
    return { ...u, branchId: toId }
  })
  if (n) await saveUsers(next)
  return n
}

export async function dedupeMisBranches(): Promise<{
  ok: boolean
  before: number
  after: number
  removed: { id: string; name: string; mergedInto: string }[]
  kept: { id: string; name: string }[]
  error?: string
}> {
  const branches = await getBranches()
  const today = misTodayIst()
  const reportDates = await getReportDates()
  const dates = [...new Set([today, ...reportDates.slice(-30)])]

  const groups = new Map<string, MisBranch[]>()
  for (const b of branches) {
    const key = misBranchGroupKey(b.name)
    if (!key) continue
    const list = groups.get(key) || []
    list.push(b)
    groups.set(key, list)
  }

  const removeIds = new Set<string>()
  const removed: { id: string; name: string; mergedInto: string }[] = []
  const keeperById = new Map<string, MisBranch>()

  for (const [groupKey, list] of groups) {
    if (list.length === 1) {
      const only = list[0]
      const display = PREFERRED_DISPLAY[groupKey] || only.name.trim()
      keeperById.set(only.id, { ...only, name: display, active: only.active !== false })
      continue
    }

    const scored = await Promise.all(
      list.map(async (b) => ({ b, score: await branchWeight(b.id, today) })),
    )
    scored.sort((a, b) => b.score - a.score || b.b.name.length - a.b.name.length)
    const keeper = scored[0].b
    const display = PREFERRED_DISPLAY[groupKey] || keeper.name.trim()
    keeperById.set(keeper.id, { ...keeper, name: display, active: keeper.active !== false })

    for (const dup of scored.slice(1).map((x) => x.b)) {
      removeIds.add(dup.id)
      removed.push({ id: dup.id, name: dup.name, mergedInto: display })

      await mergeClients(dup.id, keeper.id)
      await mergeStaffRows(dup.id, keeper.id)
      await mergeKeyedRows(dup.id, keeper.id, getGuards, saveGuards)
      await mergeKeyedRows(dup.id, keeper.id, getGuardDocs, saveGuardDocs)
      await mergeKeyedRows(dup.id, keeper.id, getComplaints, saveComplaints)
      await mergeUsers(dup.id, keeper.id)
      await mergeCollections(dup.id, keeper.id)
      await mergeReports(dup.id, keeper.id, dates)
    }
  }

  const emptyBranches = branches.filter((b) => !String(b.name ?? '').trim())
  for (const b of emptyBranches) {
    removeIds.add(b.id)
    removed.push({ id: b.id, name: '(empty)', mergedInto: '—' })
  }

  const kept = branches
    .filter((b) => !removeIds.has(b.id) && String(b.name ?? '').trim())
    .map((b) => keeperById.get(b.id) || b)

  const uniqueKept = Array.from(
    new Map(kept.map((b) => [b.id, { ...b, name: b.name.trim(), active: b.active !== false }])).values(),
  ).sort((a, b) => a.name.localeCompare(b.name))

  const ok = await saveBranches(uniqueKept)
  if (!ok) return { ok: false, before: branches.length, after: uniqueKept.length, removed, kept: [], error: 'Could not save branches' }

  return {
    ok: true,
    before: branches.length,
    after: uniqueKept.length,
    removed,
    kept: uniqueKept.map((b) => ({ id: b.id, name: b.name })),
  }
}
