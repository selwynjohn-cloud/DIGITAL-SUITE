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

/** One client row — sum shifts, then vacant = total absent − total OT. */
export function rowDeployTotals(row: Record<string, unknown>): DeployShiftTotals {
  let san = 0
  let abs = 0
  let ot = 0
  for (const s of DEPLOY_SHIFTS) {
    san += Number(row[`san${s}`]) || 0
    abs += Number(row[`abs${s}`]) || 0
    ot += Number(row[`ot${s}`]) || 0
  }
  return finalizeDeployTotals({ san, abs, ot })
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
export function buildVacantSummary(detailRows: VacantDetailRow[]) {
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

  const vacantGrouped: VacantGroupedRow[] = [...byClient.values()]
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
    .slice(0, 25)

  return { vacantRows, vacantGrouped, vacantBranches }
}

/**
 * Clamp OT so it can never exceed Absent or Sanctioned for that shift.
 * Prevents wrong OT totals (e.g. OT entered higher than Abs).
 */
export function clampShiftOt(san: number, abs: number, ot: number): number {
  const s = Math.max(0, Math.floor(Number(san) || 0))
  const a = Math.max(0, Math.floor(Number(abs) || 0))
  const o = Math.max(0, Math.floor(Number(ot) || 0))
  return Math.min(o, a, s > 0 ? s : o)
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
      out[s] += clampShiftOt(
        Number(row[`san${s}`]) || 0,
        Number(row[`abs${s}`]) || 0,
        Number(row[`ot${s}`]) || 0,
      )
    }
  }
  const total = out.A + out.G + out.B + out.C
  return {
    ...out,
    total,
    label: `A ${out.A} + G ${out.G} + B ${out.B} + C ${out.C} = ${total}`,
  }
}
