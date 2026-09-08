/**
 * Agile Recruitment only — not used in MIS or other suite apps.
 * Training Academy, IT help desk, and Hyderabad Recruitment Department.
 */

import {
  isRecruitDepartmentLoginId,
  recruitDepartmentFromLoginId,
  recruitDepartmentLoginBranches,
} from './department-auth.js'
import { resolveHyderabadRcZones } from './recruitment-centre.js'
import { matchesRecruitBranch } from './registration-store.js'

export type RecruitMisBranchOption = {
  id: string
  name: string
  displayName: string
  recruitBranch: string
  active: boolean
  isDepartment?: boolean
}

/** Login departments on Agile Recruitment Select Branch (Training Academy is not a login option). */
export const RECRUIT_DEPARTMENT_IDS = [
  'Recruitment Department',
  'IT Department',
] as const

/** Corporate Office + recruitment teams share Hyderabad-A, B, Hi-Tech City MIS branches. */
export const HYDERABAD_MULTI_BRANCH_SCOPES = [
  'Corporate Office',
  'IT Department',
  'Recruitment Department',
  'Training Academy',
] as const

export type HyderabadMultiBranchScope = (typeof HYDERABAD_MULTI_BRANCH_SCOPES)[number]

export function isHyderabadMultiBranchScope(scope: string): boolean {
  return (HYDERABAD_MULTI_BRANCH_SCOPES as readonly string[]).includes(String(scope ?? '').trim())
}

export function hyderabadRcMisTargets(misBranches: { id: string; name: string }[]): { id: string; name: string }[] {
  const zones = resolveHyderabadRcZones(misBranches)
  const zoneIds = new Set(zones.map((z) => z.misBranchId.toLowerCase()))
  return misBranches.filter((b) => zoneIds.has(String(b.id || '').toLowerCase()))
}

/** MIS branch ids for DRR acknowledgement mail (HOD lookup). */
export function drrMailMisBranchIds(
  branchId: string,
  misBranches: { id: string; name: string }[],
): string[] {
  const scope = String(branchId ?? '').trim()
  if (isHyderabadMultiBranchScope(scope)) {
    return hyderabadRcMisTargets(misBranches).map((b) => b.id)
  }
  const hit = misBranches.find((b) => b.id === scope || b.name === scope)
  return hit ? [hit.id] : []
}

export type RecruitDepartmentId = (typeof RECRUIT_DEPARTMENT_IDS)[number]

export function isRecruitDepartment(id: string): boolean {
  return (RECRUIT_DEPARTMENT_IDS as readonly string[]).includes(String(id ?? '').trim())
}

/** Recruitment Department covers Hyderabad-A, Hyderabad-B, Hi-Tech City (shared Hyderabad RC). */
export function recruitmentDepartmentMatches(candidateBranchId: string): boolean {
  const c = String(candidateBranchId ?? '').trim()
  if (matchesRecruitBranch(c, 'Hyderabad')) return true
  return /hyderabad|hi-?tech|hitech|zone[\s-]*a|zone[\s-]*b/i.test(c)
}

/**
 * Hyderabad Security Job registrations are one shared list.
 * Visible on Hi-Tech City, Hyderabad-A, Hyderabad-B, and Recruitment Department.
 */
export function isHyderabadSjShareScope(scope: string): boolean {
  const s = String(scope ?? '').trim()
  if (!s) return false
  if (s === 'Recruitment Department' || s === 'Hyderabad') return true
  if (/^hyderabad[\s\-–]*a\b/i.test(s) || /^hyd[\s\-]*zone[\s\-]*a\b/i.test(s)) return true
  if (/^hyderabad[\s\-–]*b\b/i.test(s) || /^hyd[\s\-]*zone[\s\-]*b\b/i.test(s)) return true
  if (/^hi-?tech/i.test(s)) return true
  return false
}

/**
 * Security Job — Registered List visibility (ownership).
 * Hyd-A / Hyd-B / Hi-Tech / Recruitment Department share the Hyderabad list.
 * Other cities stay on that branch HOD only. Training Academy / IT — never.
 */
export function securityJobListVisibleForScope(
  ownerTeam: string,
  recruitBranch: string,
  allBranches: boolean,
): boolean {
  if (allBranches) return true
  const scope = String(recruitBranch ?? '').trim()
  const owner = String(ownerTeam ?? '').trim() || 'Recruitment Department'
  if (!scope) return false
  if (scope === 'Training Academy' || scope === 'IT Department') return false
  if (scope === 'Corporate Office') return true
  if (isHyderabadSjShareScope(scope)) {
    return owner === 'Recruitment Department' || isHyderabadSjShareScope(owner)
  }
  return owner === scope
}

/** Filter candidates by candidate branch (registration form / SecurityJob). */
export function candidateVisibleForRecruitScope(
  candidateBranchId: string,
  recruitBranch: string,
  allBranches: boolean,
  ownerTeam?: string,
): boolean {
  if (allBranches) return true
  const scope = String(recruitBranch ?? '').trim()
  if (!scope) return false
  if (scope === 'Training Academy' || scope === 'IT Department') return false
  if (ownerTeam != null && String(ownerTeam).trim() !== '') {
    return securityJobListVisibleForScope(ownerTeam, scope, false)
  }
  if (isHyderabadSjShareScope(scope)) return recruitmentDepartmentMatches(candidateBranchId)
  if (scope === 'Recruitment Department') return recruitmentDepartmentMatches(candidateBranchId)
  return matchesRecruitBranch(candidateBranchId, scope)
}

/** Filter walk-ins by walk-in source team and candidate branch. */
export function walkInVisibleForRecruitScope(
  row: { branchId?: string; walkInFrom?: string },
  recruitBranch: string,
  allBranches: boolean,
): boolean {
  if (allBranches) return true
  const scope = String(recruitBranch ?? '').trim()
  if (!scope) return false
  const from = String(row.walkInFrom ?? '').trim()
  const candBranch = String(row.branchId ?? '').trim()
  if (scope === 'Recruitment Department') {
    return from === 'Recruitment Department' || recruitmentDepartmentMatches(candBranch)
  }
  if (scope === 'Training Academy') return from === 'Training Academy'
  if (scope === 'IT Department') return from === 'IT Department'
  if (from && matchesRecruitBranch(from, scope)) return true
  return matchesRecruitBranch(candBranch, scope)
}

export function recruitBranchListWithDepartments(branches: string[]): string[] {
  const merged = [...branches, ...RECRUIT_DEPARTMENT_IDS.filter((d) => !branches.includes(d))]
  return merged.sort((a, b) => a.localeCompare(b, 'en', { sensitivity: 'base' }))
}

export function isRecruitPhysicalBranch(name: string): boolean {
  return !isRecruitDepartment(name)
}

export function recruitMisBranchesWithDepartments(
  misBranches: RecruitMisBranchOption[],
): RecruitMisBranchOption[] {
  const deptEntries: RecruitMisBranchOption[] = recruitDepartmentLoginBranches().map((d) => ({
    id: d.id,
    name: d.name,
    displayName: d.displayName,
    recruitBranch: d.recruitBranch,
    active: true,
    isDepartment: true,
  }))
  const ids = new Set(misBranches.map((b) => b.id))
  const merged = [...misBranches, ...deptEntries.filter((d) => !ids.has(d.id))]
  return merged.sort((a, b) =>
    String(a.displayName || a.name || a.id).localeCompare(
      String(b.displayName || b.name || b.id),
      'en',
      { sensitivity: 'base' },
    ),
  )
}

/** Which MIS branches to load for Dashboard when a recruitment department is selected. */
export function resolveMgmtDashboardTargets(
  misBranches: { id: string; name: string }[],
  misIdFilter: string,
  branchFilter: string,
  branchFromMis: (id: string) => string | null,
): { targets: { id: string; name: string }[]; departmentLabel: string | null } {
  const deptFromLogin = isRecruitDepartmentLoginId(misIdFilter)
    ? recruitDepartmentFromLoginId(misIdFilter)?.recruitBranch
    : null
  const deptFromFilter = isRecruitDepartment(branchFilter) ? branchFilter : null
  const corpFromMis =
    misIdFilter && branchFromMis(misIdFilter) === 'Corporate Office' ? 'Corporate Office' : null
  const corpFromFilter = branchFilter === 'Corporate Office' ? 'Corporate Office' : null
  const scope = deptFromLogin || deptFromFilter || corpFromMis || corpFromFilter

  if (scope && isHyderabadMultiBranchScope(scope)) {
    return { targets: hyderabadRcMisTargets(misBranches), departmentLabel: scope }
  }
  return { targets: [], departmentLabel: null }
}

export function departmentLabel(id: string): string {
  if (id === 'Recruitment Department') return 'Recruitment Department (Hyderabad A · B · Hi-Tech)'
  if (id === 'IT Department') return 'IT Department'
  if (id === 'Training Academy') return 'Training Academy (Hyderabad A · B · Hi-Tech)'
  if (id === 'Corporate Office') return 'Corporate Office (Hyderabad A · B · Hi-Tech)'
  return id
}
