/**
 * Agile MIS deployment formulas (all reports):
 *   Vacant   = Absent − OT   (on totals: sum all absent minus sum all OT)
 *   Deployed = Sanctioned − Vacant
 * Column order: Sanctioned → Absent → OT → Deployed → Vacant
 */

import { clientMatchesBranch } from './client-branch.js'

export const DEPLOY_SHIFTS = ['A', 'G', 'B', 'C'] as const

export type DeployShiftTotals = { san: number; abs: number; ot: number; dep: number; vac: number }

/** Apply vacant = absent − OT and deployed = sanctioned − vacant. */
export function finalizeDeployTotals(t: { san: number; abs: number; ot: number }): DeployShiftTotals {
  const san = Math.max(0, t.san)
  const abs = Math.max(0, t.abs)
  const ot = Math.max(0, t.ot)
  const vac = Math.max(0, abs - ot)
  const dep = Math.min(san, Math.max(0, san - vac))
  return { san, abs, ot, dep, vac }
}

/** Per shift (HOD form): vacant = absent − OT for that shift. */
export function shiftDeploy(san: number, abs: number, ot: number): DeployShiftTotals {
  return finalizeDeployTotals({ san, abs, ot })
}

/**
 * Clamp OT so it can never exceed Absent or Sanctioned for that shift.
 * Prevents wrong OT totals (e.g. OT entered higher than Abs).
 */
export function clampShiftOt(san: number, abs: number, ot: number): number {
  const s = Math.max(0, Math.floor(Number(san) || 0))
  if (s <= 0) return 0
  const a = Math.max(0, Math.floor(Number(abs) || 0))
  const o = Math.max(0, Math.floor(Number(ot) || 0))
  return Math.min(o, a, s)
}

/** OT for one shift — only when that shift has sanctioned posts. */
export function rowShiftOt(row: Record<string, unknown>, shift: (typeof DEPLOY_SHIFTS)[number]): number {
  const san = Math.max(0, Number(row[`san${shift}`]) || 0)
  if (san <= 0) return 0
  const abs = Math.max(0, Number(row[`abs${shift}`]) || 0)
  return clampShiftOt(san, abs, Number(row[`ot${shift}`]) || 0)
}

/** Total OT on a client row — active shifts only (sanctioned &gt; 0). */
export function rowOtTotal(row: Record<string, unknown>): number {
  let ot = 0
  for (const s of DEPLOY_SHIFTS) ot += rowShiftOt(row, s)
  return ot
}

/** One client row — active shifts only, then vacant = total absent − total OT. */
export function rowDeployTotals(row: Record<string, unknown>): DeployShiftTotals {
  let san = 0
  let abs = 0
  let ot = 0
  for (const s of DEPLOY_SHIFTS) {
    const shiftSan = Math.max(0, Number(row[`san${s}`]) || 0)
    if (shiftSan <= 0) continue
    const shiftAbs = Math.max(0, Number(row[`abs${s}`]) || 0)
    const shiftOt = rowShiftOt(row, s)
    san += shiftSan
    abs += shiftAbs
    ot += shiftOt
  }
  return finalizeDeployTotals({ san, abs, ot })
}

export function deployRowSiteKey(row: { clientId?: string; clientName?: string; location?: string }): string {
  const id = String(row.clientId || '').trim()
  if (id) return `id:${id}`
  return `nm:${String(row.clientName || '').trim().toUpperCase()}|${String(row.location || '').trim().toUpperCase()}`
}

function priorDayList(
  priorDaysRows: Record<string, unknown>[][] | Record<string, unknown>[],
): Record<string, unknown>[][] {
  if (!priorDaysRows.length) return []
  return Array.isArray(priorDaysRows[0])
    ? (priorDaysRows as Record<string, unknown>[][])
    : [priorDaysRows as Record<string, unknown>[]]
}

/**
 * Every branch: if Absent was copied forward and OT was reset to 0,
 * keep only the last real vacant (Absent − OT). Walks recent days so a
 * Sat→Sun→Mon copy still unwraps. Real vacant (no OT on those days) stays.
 */
export function undoCarriedAbsentWithoutOt<T extends Record<string, unknown>>(
  todayRows: T[],
  priorDaysRows: Record<string, unknown>[][] | Record<string, unknown>[],
): { rows: T[]; changed: boolean } {
  const days = priorDayList(priorDaysRows)
  const dayMaps = days.map((lastRows) => {
    const lastByKey = new Map<string, Record<string, unknown>>()
    for (const r of lastRows) lastByKey.set(deployRowSiteKey(r), r)
    return lastByKey
  })
  let changed = false
  const rows = todayRows.map((row) => {
    const key = deployRowSiteKey(row)
    const next = { ...row }
    let rowChanged = false
    for (const s of DEPLOY_SHIFTS) {
      const absT = Math.max(0, Math.floor(Number(next[`abs${s}`]) || 0))
      const otT = Math.max(0, Math.floor(Number(next[`ot${s}`]) || 0))
      if (otT > 0 || absT <= 0) continue
      for (const lastByKey of dayMaps) {
        const last = lastByKey.get(key)
        if (!last) continue
        const absL = Math.max(0, Math.floor(Number(last[`abs${s}`]) || 0))
        const sanL = Math.max(0, Number(last[`san${s}`]) || Number(next[`san${s}`]) || 0)
        const otL = clampShiftOt(sanL, absL, Number(last[`ot${s}`]) || 0)
        if (absL !== absT || otL <= 0) continue
        const realVac = Math.max(0, absL - otL)
        if (absT === realVac) break
        ;(next as Record<string, number>)[`abs${s}`] = realVac
        rowChanged = true
        break
      }
    }
    if (!rowChanged) return row
    changed = true
    return normalizeDeployRow(next) as T
  })
  return { rows, changed }
}

/** Vacant posts at a site — MIS vacant (abs−OT) or unfilled sanctioned (san−deployed). */
export function rowVacantPosts(row: Record<string, unknown>): number {
  let san = 0
  let abs = 0
  let ot = 0
  let depStored = 0
  for (const s of DEPLOY_SHIFTS) {
    const shiftSan = Math.max(0, Number(row[`san${s}`]) || 0)
    san += shiftSan
    if (shiftSan > 0) {
      abs += Math.max(0, Number(row[`abs${s}`]) || 0)
      ot += rowShiftOt(row, s)
    }
    depStored += Number(row[`dep${s}`]) || 0
  }
  san = Math.max(0, san)
  const vacFromAbs = Math.max(0, abs - ot)
  const dep = depStored > 0 ? Math.min(san, depStored) : Math.max(0, san - vacFromAbs)
  const vacFromSanDep = Math.max(0, san - dep)
  return Math.max(vacFromAbs, vacFromSanDep)
}

/** Keep only active clients from a branch report (matches Data Bank). */
export function filterActiveReportRows(
  branchId: string,
  rows: Record<string, unknown>[],
  clients: { id: string; branchId: string; name: string; active?: boolean }[],
  branches?: { id: string; name: string }[],
): Record<string, unknown>[] {
  const active = branches?.length
    ? clients.filter((c) => c.active !== false && clientMatchesBranch(c.branchId, branchId, branches))
    : clients.filter((c) => c.branchId === branchId && c.active !== false)
  if (!active.length) return rows
  const ids = new Set(active.map((c) => c.id))
  const names = new Set(active.map((c) => c.name.trim().toUpperCase()))
  return rows.filter((r) => {
    const id = String(r.clientId ?? '')
    if (id && ids.has(id)) return true
    const nm = String(r.clientName ?? '').trim().toUpperCase()
    return nm && names.has(nm)
  })
}

/** Branch daily report — sum all clients, then vacant = total absent − total OT. */
export function reportDeployTotals(
  rows: Record<string, unknown>[],
  branchId?: string,
  clients?: { id: string; branchId: string; name: string; active?: boolean }[],
  branches?: { id: string; name: string }[],
): DeployShiftTotals {
  const list =
    branchId && clients?.length
      ? filterActiveReportRows(branchId, rows, clients, branches)
      : rows
  let san = 0
  let abs = 0
  let ot = 0
  for (const row of list) {
    const r = rowDeployTotals(row)
    san += r.san
    abs += r.abs
    ot += r.ot
  }
  return finalizeDeployTotals({ san, abs, ot })
}

export function deployPct(dep: number, san: number): number {
  return san > 0 ? Math.round((dep / san) * 100) : 0
}

export type VacantDetailRow = {
  branchId: string
  branch: string
  client: string
  unit: string
  san: number
  abs: number
  ot: number
  dep: number
  vac: number
  fill: number
}

export type VacantGroupedRow = {
  client: string
  branches: string
  locations: string
  san: number
  abs: number
  ot: number
  dep: number
  vac: number
  fill: number
}

function vacantClientKey(name: string): string {
  return name.trim().toUpperCase() || 'UNKNOWN'
}

/** Club same client across branches/locations; keep branch-wise detail rows for filtering. */
export function buildVacantSummary(
  detailRows: VacantDetailRow[],
  opts?: { /** Max clubbed clients (default 25). Pass null for full list (MD mail). */ maxGrouped?: number | null },
) {
  const vacantRows = [...detailRows].sort((a, b) => b.vac - a.vac)
  const vacantBranches = [...new Set(vacantRows.map((r) => r.branch))].sort()

  const byClient = new Map<
    string,
    {
      client: string
      branchSet: Set<string>
      locationSet: Set<string>
      san: number
      abs: number
      ot: number
      dep: number
      vac: number
    }
  >()

  for (const v of vacantRows) {
    const key = vacantClientKey(v.client)
    if (!byClient.has(key)) {
      byClient.set(key, {
        client: v.client || 'Unknown',
        branchSet: new Set(),
        locationSet: new Set(),
        san: 0,
        abs: 0,
        ot: 0,
        dep: 0,
        vac: 0,
      })
    }
    const g = byClient.get(key)!
    g.branchSet.add(v.branch)
    const loc = v.unit.trim()
    if (loc) g.locationSet.add(loc)
    g.san += v.san
    g.abs += v.abs
    g.ot += v.ot
    g.dep += v.dep
    g.vac += v.vac
  }

  const allGrouped: VacantGroupedRow[] = [...byClient.values()]
    .map((g) => ({
      client: g.client,
      branches: [...g.branchSet].sort().join(' · '),
      locations: [...g.locationSet].sort().join(' · '),
      san: g.san,
      abs: g.abs,
      ot: g.ot,
      dep: g.dep,
      vac: g.vac,
      fill: deployPct(g.dep, g.san),
    }))
    .sort((a, b) => b.vac - a.vac)

  const maxGrouped = opts?.maxGrouped === undefined ? 25 : opts.maxGrouped
  const vacantGrouped = maxGrouped == null ? allGrouped : allGrouped.slice(0, maxGrouped)

  return { vacantRows, vacantGrouped, vacantBranches }
}

export type OtDetailRow = VacantDetailRow
export type OtGroupedRow = {
  client: string
  branches: string
  locations: string
  san: number
  abs: number
  ot: number
  dep: number
  vac: number
}

/** Club same client across branches/sites; OT highest first. */
export function buildOtSummary(detailRows: OtDetailRow[]) {
  const otRows = detailRows.filter((r) => r.ot > 0).sort((a, b) => b.ot - a.ot)
  const otBranches = [...new Set(otRows.map((r) => r.branch))].sort()

  const byClient = new Map<
    string,
    {
      client: string
      branchSet: Set<string>
      locationSet: Set<string>
      san: number
      abs: number
      ot: number
      dep: number
      vac: number
    }
  >()

  for (const v of otRows) {
    const key = vacantClientKey(v.client)
    if (!byClient.has(key)) {
      byClient.set(key, {
        client: v.client || 'Unknown',
        branchSet: new Set(),
        locationSet: new Set(),
        san: 0,
        abs: 0,
        ot: 0,
        dep: 0,
        vac: 0,
      })
    }
    const g = byClient.get(key)!
    g.branchSet.add(v.branch)
    const loc = v.unit.trim()
    if (loc) g.locationSet.add(loc)
    g.san += v.san
    g.abs += v.abs
    g.ot += v.ot
    g.dep += v.dep
    g.vac += v.vac
  }

  const otGrouped: OtGroupedRow[] = [...byClient.values()]
    .map((g) => ({
      client: g.client,
      branches: [...g.branchSet].sort().join(' · '),
      locations: [...g.locationSet].sort().join(' · '),
      san: g.san,
      abs: g.abs,
      ot: g.ot,
      dep: g.dep,
      vac: g.vac,
    }))
    .sort((a, b) => b.ot - a.ot)
    .slice(0, 25)

  return { otRows, otGrouped, otBranches }
}

/** Apply formula to each shift on a row (mutates ot + dep for storage consistency). */
export function normalizeDeployRow<T extends Record<string, unknown>>(row: T): T {
  for (const s of DEPLOY_SHIFTS) {
    const san = Number(row[`san${s}`]) || 0
    const abs = Math.max(0, Number(row[`abs${s}`]) || 0)
    const ot = clampShiftOt(san, abs, Number(row[`ot${s}`]) || 0)
    ;(row as Record<string, number>)[`abs${s}`] = abs
    ;(row as Record<string, number>)[`ot${s}`] = ot
    const m = shiftDeploy(san, abs, ot)
    ;(row as Record<string, number>)[`dep${s}`] = m.dep
  }
  return row
}

/** Branch OT broken down by shift — for HOD review before submit. */
export function reportShiftOtTotals(rows: Record<string, unknown>[]): {
  A: number
  G: number
  B: number
  C: number
  total: number
  label: string
} {
  const out = { A: 0, G: 0, B: 0, C: 0 }
  for (const row of rows) {
    for (const s of DEPLOY_SHIFTS) {
      out[s] += rowShiftOt(row, s)
    }
  }
  const total = out.A + out.G + out.B + out.C
  return {
    ...out,
    total,
    label: `A ${out.A} + G ${out.G} + B ${out.B} + C ${out.C} = ${total}`,
  }
}
