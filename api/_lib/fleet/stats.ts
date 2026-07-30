/**
 * Weekly fleet stats — fuel (Diesel/Petrol/EV), maintenance, KM, mileage.
 */

import { fleetNum, type FleetWeeklyEntry, type FleetWeeklyReport } from './store.js'

export type WeekEntryStats = {
  km: number
  dieselL: number
  petrolL: number
  cngL: number
  fuelCost: number
  fuelCard: number
  evCharge: number
  evKwh: number
  maintenance: number
  vehicles: number
  evCount: number
}

export type BranchWeekStats = WeekEntryStats & { branchId: string; reported: boolean; submittedBy: string }

export function parseMaint(v: string): number {
  const s = String(v ?? '').trim().toLowerCase()
  if (!s || s === 'nil' || s === 'na' || s === 'n/a') return 0
  return fleetNum(v)
}

export function entryFuelType(e: FleetWeeklyEntry): string {
  if (e.fuelType) return e.fuelType
  const q = String(e.fuelQty ?? '').toLowerCase()
  if (q.includes('electric') || q.includes('ev')) return 'Electric'
  return 'Diesel'
}

export function normalizeWeeklyEntry(e: Partial<FleetWeeklyEntry>): FleetWeeklyEntry {
  const fuelType = String(e.fuelType || entryFuelType(e as FleetWeeklyEntry))
  const isEv = fuelType === 'Electric'
  let fuelLiters = fleetNum(e.fuelLiters ?? e.fuelQty)
  if (isEv) fuelLiters = 0
  else if (!fuelLiters && e.fuelQty && !String(e.fuelQty).toLowerCase().includes('electric')) {
    fuelLiters = fleetNum(e.fuelQty)
  }
  const fuelCost = fleetNum(e.fuelCost ?? e.fuelAmount)
  const fuelCard = fleetNum(e.fuelCardCharged)
  const evCharge = isEv ? fleetNum(e.evChargeCost ?? e.fuelAmount ?? e.fuelCost) : fleetNum(e.evChargeCost)
  const evKwh = fleetNum(e.evChargeKwh)
  const maintenance = fleetNum(e.maintenanceCostNum ?? parseMaint(String(e.maintenanceCost ?? '')))

  return {
    vehicleId: String(e.vehicleId ?? ''),
    regNo: String(e.regNo ?? ''),
    makeModel: String(e.makeModel ?? ''),
    driverName: String(e.driverName ?? ''),
    driverMobile: String(e.driverMobile ?? ''),
    licenseNo: String(e.licenseNo ?? ''),
    licenseValid: String(e.licenseValid ?? ''),
    odoStart: String(e.odoStart ?? ''),
    odoEnd: String(e.odoEnd ?? ''),
    kmWeek: fleetNum(e.kmWeek),
    kmMonth: fleetNum(e.kmMonth),
    lastFuelDate: String(e.lastFuelDate ?? ''),
    fuelType,
    fuelLiters,
    fuelCost,
    fuelCardCharged: fuelCard,
    evChargeCost: evCharge,
    evChargeKwh: evKwh ? String(evKwh) : String(e.evChargeKwh ?? ''),
    fuelAmount: String(e.fuelAmount ?? (fuelCost || '')),
    fuelQty: isEv ? String(e.fuelQty || 'Electric') : String(e.fuelQty ?? (fuelLiters || '')),
    maintenanceDetails: String(e.maintenanceDetails ?? 'Nil'),
    maintenanceCost: String(e.maintenanceCost ?? (maintenance || 'Nil')),
    maintenanceCostNum: maintenance,
    insuranceValid: String(e.insuranceValid ?? ''),
    pucValid: String(e.pucValid ?? ''),
    condition: String(e.condition ?? 'Good'),
    nextServiceKm: String(e.nextServiceKm ?? ''),
    trafficPenaltyRs: String(e.trafficPenaltyRs ?? ''),
    tyreChangeKm: String(e.tyreChangeKm ?? ''),
    batteryChangeKm: String(e.batteryChangeKm ?? ''),
    remarks: String(e.remarks ?? ''),
  }
}

function emptyStats(): WeekEntryStats {
  return { km: 0, dieselL: 0, petrolL: 0, cngL: 0, fuelCost: 0, fuelCard: 0, evCharge: 0, evKwh: 0, maintenance: 0, vehicles: 0, evCount: 0 }
}

export function addEntryToStats(s: WeekEntryStats, e: FleetWeeklyEntry): WeekEntryStats {
  const en = normalizeWeeklyEntry(e)
  const ft = en.fuelType
  const out = { ...s, km: s.km + en.kmWeek, vehicles: s.vehicles + 1 }
  if (ft === 'Electric') {
    out.evCount += 1
    out.evCharge += en.evChargeCost || en.fuelCost
    out.evKwh += fleetNum(en.evChargeKwh)
    out.fuelCost += en.fuelCost
    out.fuelCard += en.fuelCardCharged
  } else if (ft === 'Petrol') {
    out.petrolL += en.fuelLiters
    out.fuelCost += en.fuelCost
    out.fuelCard += en.fuelCardCharged
  } else if (ft === 'CNG') {
    out.cngL += en.fuelLiters
    out.fuelCost += en.fuelCost
    out.fuelCard += en.fuelCardCharged
  } else {
    out.dieselL += en.fuelLiters
    out.fuelCost += en.fuelCost
    out.fuelCard += en.fuelCardCharged
  }
  out.maintenance += en.maintenanceCostNum
  return out
}

export function avgMileage(s: WeekEntryStats): number | null {
  const liters = s.dieselL + s.petrolL
  if (!liters || !s.km) return null
  return Math.round((s.km / liters) * 10) / 10
}

export function evKmPerKwh(s: WeekEntryStats): number | null {
  if (!s.evKwh || !s.km || !s.evCount) return null
  return Math.round((s.km / s.evKwh) * 10) / 10
}

export function aggregateWeekReports(reports: FleetWeeklyReport[], weekNo: string, branches: readonly string[]): {
  total: WeekEntryStats
  byBranch: BranchWeekStats[]
} {
  const weekReports = reports.filter((r) => r.active && r.weekNo === weekNo)
  const byId: Record<string, FleetWeeklyReport> = {}
  for (const r of weekReports) byId[r.branchId] = r

  const byBranch: BranchWeekStats[] = branches.map((branchId) => {
    const r = byId[branchId]
    let s = emptyStats()
    if (r) {
      for (const e of r.entries) s = addEntryToStats(s, e)
    }
    return { branchId, ...s, reported: !!r, submittedBy: r?.submittedBy ?? '' }
  })

  let total = emptyStats()
  for (const r of weekReports) {
    for (const e of r.entries) total = addEntryToStats(total, e)
  }

  return { total, byBranch }
}

/** Calendar month key YYYY-MM from report period */
export function reportMonthKey(r: FleetWeeklyReport): string {
  const d = r.toDate || r.fromDate || (r.submittedAt || '').slice(0, 10)
  if (!d || d.length < 7) return ''
  return d.slice(0, 7)
}

export function listReportMonths(reports: FleetWeeklyReport[]): string[] {
  const set = new Set<string>()
  const now = new Date()
  set.add(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`)
  for (const r of reports.filter((x) => x.active)) {
    const m = reportMonthKey(r)
    if (m) set.add(m)
  }
  return [...set].sort().reverse()
}

export type BranchMonthStats = WeekEntryStats & { branchId: string; weeksSubmitted: number }

export function aggregateMonthReports(
  reports: FleetWeeklyReport[],
  monthKey: string,
  branches: readonly string[],
): { total: WeekEntryStats; byBranch: BranchMonthStats[] } {
  const monthReports = reports.filter((r) => r.active && reportMonthKey(r) === monthKey)
  const byBranchId: Record<string, FleetWeeklyReport[]> = {}
  for (const r of monthReports) {
    if (!byBranchId[r.branchId]) byBranchId[r.branchId] = []
    byBranchId[r.branchId].push(r)
  }

  const byBranch: BranchMonthStats[] = branches.map((branchId) => {
    const reps = byBranchId[branchId] ?? []
    let s = emptyStats()
    for (const r of reps) {
      for (const e of r.entries) s = addEntryToStats(s, e)
    }
    return { branchId, ...s, weeksSubmitted: reps.length }
  })

  let total = emptyStats()
  for (const r of monthReports) {
    for (const e of r.entries) total = addEntryToStats(total, e)
  }

  return { total, byBranch }
}

export type VehicleMonthStats = WeekEntryStats & {
  regNo: string
  makeModel: string
  branchId: string
  weeksReported: number
}

/** Per-vehicle totals for a calendar month (all branches or one branch). */
export function aggregateMonthByVehicle(
  reports: FleetWeeklyReport[],
  monthKey: string,
  branchId?: string,
): VehicleMonthStats[] {
  const monthReports = reports.filter(
    (r) =>
      r.active &&
      reportMonthKey(r) === monthKey &&
      (!branchId || branchId === 'ALL' || r.branchId === branchId),
  )

  const map = new Map<
    string,
    { stats: WeekEntryStats; regNo: string; makeModel: string; branchId: string; weeks: Set<string> }
  >()

  for (const r of monthReports) {
    for (const e of r.entries) {
      const en = normalizeWeeklyEntry(e)
      const key = `${r.branchId}|${en.regNo}`
      let row = map.get(key)
      if (!row) {
        row = { stats: emptyStats(), regNo: en.regNo, makeModel: en.makeModel, branchId: r.branchId, weeks: new Set() }
        map.set(key, row)
      }
      row.stats = addEntryToStats(row.stats, en)
      if (en.makeModel) row.makeModel = en.makeModel
      row.weeks.add(r.weekNo)
    }
  }

  return [...map.values()]
    .map(({ stats, regNo, makeModel, branchId: bid, weeks }) => ({
      ...stats,
      regNo,
      makeModel,
      branchId: bid,
      weeksReported: weeks.size,
    }))
    .sort((a, b) => a.branchId.localeCompare(b.branchId) || a.regNo.localeCompare(b.regNo))
}

export function fmtRs(n: number): string {
  return '₹' + (n || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })
}

export function fmtL(n: number): string {
  return (n || 0).toLocaleString('en-IN', { maximumFractionDigits: 1 }) + ' L'
}
