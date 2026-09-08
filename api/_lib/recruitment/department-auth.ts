/**
 * Agile Recruitment department login — NOT in MIS Data Bank.
 * Shown on recruitment branch login dropdown only.
 * Sign-in is email PIN → then select department (no shared password).
 */

import { departmentLabel, RECRUIT_DEPARTMENT_IDS } from './departments.js'

export const RECRUIT_DEPT_LOGIN_PREFIX = 'recruit-dept:'

export type RecruitDepartmentLoginBranch = {
  id: string
  name: string
  displayName: string
  /** Value stored as RECRUIT_BRANCH in the portal */
  recruitBranch: string
}

const DEPT_LOGIN: RecruitDepartmentLoginBranch[] = RECRUIT_DEPARTMENT_IDS.map((name) => ({
  id: `${RECRUIT_DEPT_LOGIN_PREFIX}${name.toLowerCase().replace(/\s+/g, '-')}`,
  name,
  displayName: departmentLabel(name),
  recruitBranch: name,
}))

export const RECRUIT_ONLY_CENTRE_PREFIX = 'recruit-centre:'

/** Cities that recruit but do not submit Daily MIS (Lucknow). */
export const RECRUIT_ONLY_LOGIN_CENTRES: RecruitDepartmentLoginBranch[] = [
  {
    id: `${RECRUIT_ONLY_CENTRE_PREFIX}lucknow`,
    name: 'Lucknow',
    displayName: 'Lucknow',
    recruitBranch: 'Lucknow',
  },
]

export function isRecruitOnlyCentreLoginId(branchId: string): boolean {
  return String(branchId ?? '').trim().startsWith(RECRUIT_ONLY_CENTRE_PREFIX)
}

export function recruitOnlyCentreFromLoginId(
  branchId: string,
): RecruitDepartmentLoginBranch | null {
  const id = String(branchId ?? '').trim()
  return RECRUIT_ONLY_LOGIN_CENTRES.find((d) => d.id === id) ?? null
}

export function isRecruitDepartmentLoginId(branchId: string): boolean {
  const id = String(branchId ?? '').trim()
  return id.startsWith(RECRUIT_DEPT_LOGIN_PREFIX) || isRecruitOnlyCentreLoginId(id)
}

export function recruitDepartmentLoginBranches(): RecruitDepartmentLoginBranch[] {
  return [...DEPT_LOGIN, ...RECRUIT_ONLY_LOGIN_CENTRES]
}

export function recruitDepartmentFromLoginId(
  branchId: string,
): RecruitDepartmentLoginBranch | null {
  const id = String(branchId ?? '').trim()
  return DEPT_LOGIN.find((d) => d.id === id) ?? recruitOnlyCentreFromLoginId(id)
}

/** @deprecated Shared department password login removed — use email PIN then bind-branch. */
export function verifyRecruitDepartmentPassword(_branchId: string, _password: string): boolean {
  return false
}

/** Walk-in source options — who added the walk-in entry. */
export const WALK_IN_SOURCE_OPTIONS = [
  'Bangalore',
  'Bhopal',
  'Chennai',
  'Hi-Tech City',
  'Hyderabad - A',
  'Hyderabad - B',
  'IT Department',
  'Kakinada',
  'Kochi',
  'Lucknow',
  'Mumbai',
  'Nellore',
  'Puducherry',
  'Recruitment Department',
  'Surat',
  'Tada',
  'Tadipatri',
  'Tirupati',
  'Training Academy',
  'Training Department',
  'Vijayawada',
  'Visakhapatnam',
] as const

export function defaultWalkInSource(recruitBranch: string): string {
  const b = String(recruitBranch ?? '').trim()
  if ((WALK_IN_SOURCE_OPTIONS as readonly string[]).includes(b)) return b
  if (b === 'Recruitment Department' || b === 'Training Academy' || b === 'IT Department') return b
  return b || 'Recruitment Department'
}
