/**
 * OJT Management — Training Department covers Hyderabad-A, Hyderabad-B, Hi-Tech City
 * individually (each keeps its own schedules).
 */

import { cityOnlyBranchName } from '../mis/branch-labels.js'
import { getBranches, saveBranches, type MisBranch, type MisClient } from '../mis/store.js'

export const TRAINING_DEPARTMENT_NAME = 'Training Department'
export const TRAINING_DEPARTMENT_ID = 'br-training-department'

/** Real branches trained under Training Department (individually). */
export const TRAINING_DEPT_COVERED_NAMES = ['Hyderabad-A', 'Hyderabad-B', 'Hi-Tech City'] as const

/** Known branch ids (clients-seed / DEFAULT_BRANCHES) — fallback when name drifted in Redis. */
export const TRAINING_DEPT_COVERED_IDS = ['br5', 'br6', 'br4'] as const

function normBranchName(name: string): string {
  return String(name || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .replace(/-/g, '')
}

export function matchTrainingDeptCoveredBranch(b: { id?: string; name?: string }): boolean {
  if (!b) return false
  const id = String(b.id || '').trim()
  if ((TRAINING_DEPT_COVERED_IDS as readonly string[]).includes(id)) return true
  const canonical = cityOnlyBranchName(String(b.name || ''))
  if (isTrainingDeptCoveredName(canonical)) return true
  return isTrainingDeptCoveredName(String(b.name || ''))
}

/** 6-digit branch password for Training Department login (Track-1 manager). */
export function trainingDeptBranchPassword(): string {
  return (process.env.TRAINING_DEPT_BRANCH_PIN?.trim() || '170617').replace(/\D/g, '').slice(0, 6) || '170617'
}

/** Training manager inbox — handles Hyd-A / Hyd-B / Hi-Tech Track-1 schedules. */
export function trainingDeptManagerEmail(): string {
  return (
    process.env.TRAINING_DEPT_EMAIL?.trim() ||
    process.env.OJT_TRAINING_EMAIL?.trim() ||
    'training@agilegroup.co.in'
  )
    .trim()
    .toLowerCase()
}

export function isTrainingDeptManagerEmail(email: string): boolean {
  const e = String(email || '')
    .trim()
    .toLowerCase()
  return Boolean(e && e === trainingDeptManagerEmail())
}

export function isTrainingDepartmentBranch(b: { id?: string; name?: string } | null | undefined): boolean {
  if (!b) return false
  if (String(b.id || '') === TRAINING_DEPARTMENT_ID) return true
  return /training\s*department/i.test(String(b.name || ''))
}

export function isTrainingDeptCoveredName(name: string): boolean {
  const n = normBranchName(name)
  return TRAINING_DEPT_COVERED_NAMES.some((x) => {
    const canon = normBranchName(cityOnlyBranchName(x))
    const raw = normBranchName(x)
    return canon === n || raw === n
  })
}

export async function ensureTrainingDepartmentBranch(): Promise<MisBranch | null> {
  const all = await getBranches(false)
  const pin = trainingDeptBranchPassword()
  const existing = all.find((b) => isTrainingDepartmentBranch(b))
  if (existing) {
    const needsFix =
      existing.active === false ||
      existing.name !== TRAINING_DEPARTMENT_NAME ||
      String(existing.pin || '').trim() !== pin
    if (needsFix) {
      const next = all.map((b) =>
        b.id === existing.id
          ? { ...b, active: true, name: TRAINING_DEPARTMENT_NAME, pin }
          : b,
      )
      await saveBranches(next)
      return { ...existing, active: true, name: TRAINING_DEPARTMENT_NAME, pin }
    }
    return existing
  }
  const row: MisBranch = {
    id: TRAINING_DEPARTMENT_ID,
    name: TRAINING_DEPARTMENT_NAME,
    pin,
    active: true,
  }
  await saveBranches([...all, row])
  return row
}

export async function resolveTrainingDeptCoveredBranches(): Promise<MisBranch[]> {
  await ensureTrainingDepartmentBranch()
  const all = await getBranches(true)
  const covered = all.filter((b) => matchTrainingDeptCoveredBranch(b))
  const byName = new Map<string, MisBranch>()
  for (const b of covered) {
    const key = cityOnlyBranchName(b.name)
    if (!byName.has(key)) byName.set(key, b)
  }
  // Stable order + id fallback when live branch table names drift
  const ordered: MisBranch[] = []
  for (const name of TRAINING_DEPT_COVERED_NAMES) {
    const hit = byName.get(name) || covered.find((b) => cityOnlyBranchName(b.name) === name)
    if (hit) ordered.push(hit)
  }
  if (ordered.length >= TRAINING_DEPT_COVERED_NAMES.length) return ordered
  for (const id of TRAINING_DEPT_COVERED_IDS) {
    if (ordered.some((b) => b.id === id)) continue
    const hit = all.find((b) => b.id === id && b.active !== false && matchTrainingDeptCoveredBranch(b))
    if (hit) ordered.push(hit)
  }
  return ordered
}

export type OjtClientPick = {
  id: string
  name: string
  location: string
  branchId: string
  branchName: string
}

/** True when client belongs to one of the three Hyderabad ops branches (not Training Department id). */
export function isTrainingDeptCoveredClientBranch(
  clientBranchId: string,
  covered: MisBranch[],
): boolean {
  const bid = String(clientBranchId || '').trim()
  if (!bid || isTrainingDepartmentBranch({ id: bid })) return false
  return covered.some((b) => b.id === bid)
}

/**
 * Training Department schedule picker trusts the Master Directory branch books
 * for Hyderabad-A, Hyderabad-B and Hi-Tech City (all active clients).
 */
export type TrainingDeptClientRow = Pick<MisClient, 'name' | 'location' | 'branchId'> & {
  geoAddress?: string
  active?: boolean
}

export function isClientInTrainingDeptZone(
  c: TrainingDeptClientRow,
  covered: MisBranch[],
  _allBranches?: MisBranch[],
): boolean {
  const coveredIds = new Set(covered.map((b) => b.id))
  const bid = String(c.branchId || '').trim()
  return Boolean(bid && coveredIds.has(bid) && c.active !== false)
}

/** Keep full Hyd-A / Hyd-B / Hi-Tech books for Training schedule dropdown. */
export function filterClientsForTrainingDept(
  clients: MisClient[],
  covered: MisBranch[],
  _allBranches?: MisBranch[],
): MisClient[] {
  const coveredIds = new Set(covered.map((b) => b.id))
  return clients.filter((c) => {
    if (c.active === false) return false
    const bid = String(c.branchId || '').trim()
    return Boolean(bid && coveredIds.has(bid))
  })
}

/**
 * FROZEN 23 Aug 2026 — Training Department extras only.
 * Keep Capitaland / Kondapur. Do not add, remove, or rename extras.
 * Never written to Master Directory or any other branch book.
 */
export const TRAINING_DEPT_EXTRA_CLIENTS = [
  {
    id: 'ojt-extra-capitaland-kondapur',
    name: 'Capitaland',
    location: 'Kondapur',
    branchName: 'Hyderabad-A',
  },
] as const

function extraPickAlreadyListed(
  picks: OjtClientPick[],
  extra: (typeof TRAINING_DEPT_EXTRA_CLIENTS)[number],
): boolean {
  const extraName = extra.name.replace(/\s+/g, '').toLowerCase()
  const extraLoc = extra.location.replace(/\s+/g, '').toLowerCase()
  return picks.some((p) => {
    const name = String(p.name || '').replace(/\s+/g, '').toLowerCase()
    const loc = String(p.location || '').replace(/\s+/g, '').toLowerCase()
    if (!name || !extraName || !loc || !extraLoc) return false
    const nameHit = name.includes(extraName) || extraName.includes(name)
    const locHit = loc.includes(extraLoc) || extraLoc.includes(loc)
    return nameHit && locHit
  })
}

/** Append Director extras if missing. Existing Hyd-A / Hyd-B / Hi-Tech rows are left untouched. */
export function appendTrainingDeptExtraPicks(
  picks: OjtClientPick[],
  covered: MisBranch[],
): OjtClientPick[] {
  const next = picks.slice()
  for (const extra of TRAINING_DEPT_EXTRA_CLIENTS) {
    if (extraPickAlreadyListed(next, extra)) continue
    const branch =
      covered.find((b) => cityOnlyBranchName(b.name) === extra.branchName) ||
      covered.find((b) => normBranchName(b.name) === normBranchName(extra.branchName))
    if (!branch) continue
    next.push({
      id: extra.id,
      name: extra.name,
      location: extra.location,
      branchId: branch.id,
      branchName: branch.name,
    })
  }
  return next
}

/** Master Directory / Daily MIS clients for Hyd-A / Hyd-B / Hi-Tech as on freeze date. */
export async function loadTrainingDeptClientPicks(): Promise<OjtClientPick[]> {
  const covered = await resolveTrainingDeptCoveredBranches()
  if (!covered.length) return []
  const allBranches = await getBranches(false)
  const { getClients, getReport } = await import('../mis/store.js')
  const { CLIENT_BOOK_FREEZE_DATE } = await import('../mis/client-book-freeze.js')
  const { displaySiteLocation, collapsePremierTrainingPicks } = await import('./ojt-guard-scope.js')
  const freezeDate = CLIENT_BOOK_FREEZE_DATE

  const lists = await Promise.all(
    covered.map(async (b) => {
      const master = await getClients(b.id, { skipRepair: true, branches: allBranches })
      const byId = new Map(master.map((c) => [c.id, c]))
      const byKey = new Map(
        master.map((c) => [`${String(c.name || '').trim().toUpperCase()}|${String(c.location || '').trim().toUpperCase()}`, c]),
      )
      const report = await getReport(b.id, freezeDate)
      const rows = report && String(report.submittedAt || '').trim() ? report.rows || [] : []
      let picks: OjtClientPick[]
      if (rows.length) {
        const seen = new Set<string>()
        picks = []
        for (const row of rows) {
          const name = String(row.clientName || '').trim()
          if (!name) continue
          const loc = String(row.location || '').trim()
          const key = `${name.toUpperCase()}|${loc.toUpperCase()}`
          if (seen.has(key)) continue
          seen.add(key)
          const rowId = String(row.clientId || '').trim()
          const hit = (rowId && byId.get(rowId)) || byKey.get(key)
          picks.push({
            id: hit?.id || rowId || `freeze-${b.id}-${picks.length}`,
            name,
            location: displaySiteLocation(name, loc),
            branchId: b.id,
            branchName: b.name,
          })
        }
      } else {
        picks = filterClientsForTrainingDept(master, covered, allBranches).map((c) => ({
          id: c.id,
          name: c.name,
          location: displaySiteLocation(c.name, c.location || ''),
          branchId: c.branchId || b.id,
          branchName: b.name,
        }))
      }
      return collapsePremierTrainingPicks(picks)
    }),
  )
  return appendTrainingDeptExtraPicks(lists.flat(), covered).sort(
    (a, b) =>
      a.branchName.localeCompare(b.branchName, 'en', { sensitivity: 'base' }) ||
      a.name.localeCompare(b.name, 'en', { sensitivity: 'base' }),
  )
}

/** Months YYYY-MM from fromYmd through toYmd inclusive. */
export function monthsInPeriod(fromYmd: string, toYmd: string): string[] {
  let from = String(fromYmd || '').slice(0, 10)
  let to = String(toYmd || '').slice(0, 10)
  if (!/^\d{4}-\d{2}-\d{2}$/.test(from)) from = to
  if (!/^\d{4}-\d{2}-\d{2}$/.test(to)) to = from
  if (!from || !to) return []
  if (from > to) {
    const t = from
    from = to
    to = t
  }
  const out: string[] = []
  let y = Number(from.slice(0, 4))
  let m = Number(from.slice(5, 7))
  const endY = Number(to.slice(0, 4))
  const endM = Number(to.slice(5, 7))
  while (y < endY || (y === endY && m <= endM)) {
    out.push(`${y}-${String(m).padStart(2, '0')}`)
    m += 1
    if (m > 12) {
      m = 1
      y += 1
    }
    if (out.length > 36) break
  }
  return out
}

export const OJT_QUESTION_SUBJECTS = [
  'Access Control',
  'Emergency Response',
  'Fire Safety',
  'First Aid',
  'Patrolling & Observation',
  'Soft Skills & Grooming',
  'Site SOP',
  'Table Top Exercise',
] as const
