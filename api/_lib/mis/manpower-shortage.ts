/**
 * Daily MIS Step 2 — Manpower Shortage Details (role-wise).
 * For the day: Absent = Shortage = Manpower shortages (sanctioned posts only;
 * weekly-off / relievers are not included in this figure).
 */

export const MANPOWER_SHORTAGE_ROLES = [
  { key: 'assignmentManager', label: 'Assignment Manager' },
  { key: 'dutyOfficer', label: 'Duty Officer' },
  { key: 'securityOfficer', label: 'Security Officer' },
  { key: 'assistantSecurityOfficer', label: 'Assistant Security Officer' },
  { key: 'supervisor', label: 'Supervisor' },
  { key: 'cctvOperator', label: 'CCTV operator' },
  { key: 'ladySecurityGuard', label: 'Lady Security Guard' },
  { key: 'securityGuards', label: 'Security Guards' },
  { key: 'driver', label: 'Driver' },
  { key: 'houseKeeping', label: 'HK' },
  { key: 'hkSupervisor', label: 'HK-Supervisor' },
  { key: 'escort', label: 'Escorts' },
  { key: 'spo', label: 'SPO' },
  { key: 'spa', label: 'SPA' },
  { key: 'pantryBoy', label: 'Pantry Boy' },
  { key: 'stf', label: 'STF' },
  { key: 'fa', label: 'FA' },
  { key: 'careTaker', label: 'Care Taker' },
] as const

export type ManpowerShortageRoleKey = (typeof MANPOWER_SHORTAGE_ROLES)[number]['key']

export type MisManpowerShortage = {
  totalBranchShortages: number
  assignmentManager: number
  dutyOfficer: number
  securityOfficer: number
  assistantSecurityOfficer: number
  supervisor: number
  cctvOperator: number
  ladySecurityGuard: number
  securityGuards: number
  driver: number
  houseKeeping: number
  hkSupervisor: number
  escort: number
  spo: number
  spa: number
  pantryBoy: number
  stf: number
  fa: number
  careTaker: number
  savedAt?: string
  savedBy?: string
}

function n(v: unknown): number {
  const x = Math.floor(Number(v) || 0)
  return x < 0 ? 0 : x
}

export function emptyManpowerShortage(total = 0): MisManpowerShortage {
  return {
    totalBranchShortages: n(total),
    assignmentManager: 0,
    dutyOfficer: 0,
    securityOfficer: 0,
    assistantSecurityOfficer: 0,
    supervisor: 0,
    cctvOperator: 0,
    ladySecurityGuard: 0,
    securityGuards: 0,
    driver: 0,
    houseKeeping: 0,
    hkSupervisor: 0,
    escort: 0,
    spo: 0,
    spa: 0,
    pantryBoy: 0,
    stf: 0,
    fa: 0,
    careTaker: 0,
  }
}

export function normaliseManpowerShortage(
  raw: unknown,
  opts?: { defaultTotal?: number },
): MisManpowerShortage {
  const r = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>
  const base = emptyManpowerShortage(opts?.defaultTotal ?? 0)
  const out: MisManpowerShortage = {
    ...base,
    totalBranchShortages:
      r.totalBranchShortages != null && String(r.totalBranchShortages).trim() !== ''
        ? n(r.totalBranchShortages)
        : n(opts?.defaultTotal ?? base.totalBranchShortages),
  }
  for (const role of MANPOWER_SHORTAGE_ROLES) {
    out[role.key] = n(r[role.key])
  }
  if (r.savedAt) out.savedAt = String(r.savedAt).slice(0, 40)
  if (r.savedBy) out.savedBy = String(r.savedBy).slice(0, 80)
  return out
}

/** Role boxes sum (excludes Total). */
export function sumManpowerShortageRoles(s: MisManpowerShortage): number {
  return MANPOWER_SHORTAGE_ROLES.reduce((a, role) => a + n(s[role.key]), 0)
}

/**
 * Force role breakdown to equal Absent / Total Branch shortages.
 * - Empty roles → all under Security Guards
 * - Roles short of total → remainder added to Security Guards
 * - Roles over total → trim from largest roles first
 */
export function reconcileManpowerShortageToTotal(
  raw: MisManpowerShortage,
  targetTotal: number,
): MisManpowerShortage {
  const out: MisManpowerShortage = {
    ...raw,
    totalBranchShortages: n(targetTotal),
  }
  for (const role of MANPOWER_SHORTAGE_ROLES) {
    out[role.key] = n(out[role.key])
  }
  const target = n(targetTotal)
  let sum = sumManpowerShortageRoles(out)
  if (sum === target) return out
  if (sum === 0) {
    out.securityGuards = target
    return out
  }
  if (sum < target) {
    out.securityGuards = n(out.securityGuards) + (target - sum)
    return out
  }
  let excess = sum - target
  const order = [...MANPOWER_SHORTAGE_ROLES].sort((a, b) => n(out[b.key]) - n(out[a.key]))
  for (const role of order) {
    if (excess <= 0) break
    const cur = n(out[role.key])
    const cut = Math.min(cur, excess)
    out[role.key] = cur - cut
    excess -= cut
  }
  return out
}

/**
 * Manpower shortage for the day = Absent (sanctioned posts; excludes w.off relievers).
 * `ot` kept for callers — not added to shortage.
 */
export function shortageWithoutRelievers(absent: number, _ot?: number): number {
  return n(absent)
}

/** Daily mail vacancy table — Director order (19 Aug 2026). */
export const VACANCY_RANK_COLUMNS = [
  { key: 'so', label: 'SO', shortageKey: 'securityOfficer' },
  { key: 'aso', label: 'ASO', shortageKey: 'assistantSecurityOfficer' },
  { key: 'lsg', label: 'LSG', shortageKey: 'ladySecurityGuard' },
  { key: 'sg', label: 'SG', shortageKey: 'securityGuards' },
  { key: 'driver', label: 'Driver', shortageKey: 'driver' },
  { key: 'hk', label: 'HK', shortageKey: 'houseKeeping' },
  { key: 'hkSupervisor', label: 'HK-Supervisor', shortageKey: 'hkSupervisor' },
  { key: 'escorts', label: 'Escorts', shortageKey: 'escort' },
  { key: 'spo', label: 'SPO', shortageKey: 'spo' },
  { key: 'spa', label: 'SPA', shortageKey: 'spa' },
  { key: 'pantryBoy', label: 'Pantry Boy', shortageKey: 'pantryBoy' },
  { key: 'stf', label: 'STF', shortageKey: 'stf' },
] as const

export type VacancyRankKey = (typeof VACANCY_RANK_COLUMNS)[number]['key']

export type VacancyRankCounts = Record<VacancyRankKey, number> & { total: number }

export function emptyVacancyRanks(total = 0): VacancyRankCounts {
  const out = { total: n(total) } as VacancyRankCounts
  for (const col of VACANCY_RANK_COLUMNS) out[col.key] = 0
  return out
}

export function vacancyRanksFromShortage(
  raw: unknown,
  fallbackTotal = 0,
): VacancyRankCounts {
  const vacant = n(fallbackTotal)
  if (vacant <= 0) return emptyVacancyRanks(0)
  const s = reconcileManpowerShortageToTotal(
    normaliseManpowerShortage(raw, { defaultTotal: vacant }),
    vacant,
  )
  const out = emptyVacancyRanks(vacant)
  for (const col of VACANCY_RANK_COLUMNS) {
    out[col.key] = n(s[col.shortageKey])
  }
  return out
}
