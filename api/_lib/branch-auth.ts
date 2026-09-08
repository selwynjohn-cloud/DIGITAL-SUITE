/**
 * Per-branch passwords for HOD / Staff login (all suite apps).
 * Passwords live on each MIS branch record (Data Bank). Forgot → email OTP reset.
 */
import { createSessionToken, normaliseEmail, type AuthRole } from './auth.js'
import { cityOnlyBranchName } from './mis/branch-labels.js'
import { misBranchGroupKey } from './mis/branch-group-key.js'
import { getBranches, getUsers, saveBranches, type MisBranch } from './mis/store.js'
import {
  isRecruitDepartmentLoginId,
  recruitDepartmentFromLoginId,
  verifyRecruitDepartmentPassword,
} from './recruitment/department-auth.js'
import { matchesSuiteBranchPin, suiteBranchPin } from './suite-credentials.js'

const LEGACY_PINS = new Set(['', '1234', '1706', suiteBranchPin()])

/** Login matches id, exact name, or city alias. Independent cities stay independent. */
const GROUP_PRIMARY_NAME: Record<string, string> = {}

function pickGroupedBranch(grouped: MisBranch[], groupKey: string): MisBranch {
  const prefer = GROUP_PRIMARY_NAME[groupKey]
  if (prefer) {
    const hit = grouped.find((b) => String(b.name ?? '').trim().toLowerCase() === prefer.toLowerCase())
    if (hit) return hit
  }
  return grouped[0]
}

/** Easy 6-digit branch password (no leading zero). */
export function generateBranchPassword(): string {
  return String(100000 + Math.floor(Math.random() * 900000))
}

export function isLegacyBranchPin(pin: string): boolean {
  return LEGACY_PINS.has(String(pin ?? '').trim())
}

/** Resolve login branch by id, exact name, city alias, or combined-label group (Chennai / Mumbai / Kochi). */
export async function resolveActiveBranchForLogin(branchKey: string): Promise<MisBranch | null> {
  const key = String(branchKey ?? '').trim()
  if (!key) return null
  if (isRecruitDepartmentLoginId(key)) {
    const dept = recruitDepartmentFromLoginId(key)
    if (!dept) return null
    return {
      id: dept.id,
      name: dept.recruitBranch,
      active: true,
      pin: '',
    } as MisBranch
  }
  const branches = await getBranches(true)
  const byId = branches.find((b) => b.id === key)
  if (byId) return byId
  const byName = branches.find((b) => String(b.name ?? '').trim().toLowerCase() === key.toLowerCase())
  if (byName) return byName
  const canonical = cityOnlyBranchName(key)
  const byCanonical = branches.find(
    (b) => String(b.name ?? '').trim().toLowerCase() === canonical.toLowerCase(),
  )
  if (byCanonical) return byCanonical
  const groupKey = misBranchGroupKey(key) || misBranchGroupKey(canonical)
  if (!groupKey) return null
  const grouped = branches.filter((b) => misBranchGroupKey(String(b.name ?? '')) === groupKey)
  if (!grouped.length) return null
  return pickGroupedBranch(grouped, groupKey)
}

/** Map a staff email to their Data Bank branch (unique match only). */
export async function lookupStaffBranchByEmail(email: string): Promise<MisBranch | null> {
  const em = normaliseEmail(email)
  if (!em) return null
  const users = await getUsers()
  const hits = users.filter(
    (u) => u.active !== false && normaliseEmail(u.email) === em && String(u.branchId ?? '').trim(),
  )
  const ids = [...new Set(hits.map((u) => String(u.branchId).trim()))]
  if (ids.length !== 1) return null
  return resolveActiveBranchForLogin(ids[0])
}

export async function verifyBranchPassword(branchId: string, password: string): Promise<MisBranch | null> {
  const pwd = String(password ?? '').trim()
  if (!pwd) return null
  /** Agile Recruitment department logins (Recruitment Department, Training Academy, IT). */
  if (isRecruitDepartmentLoginId(branchId) && verifyRecruitDepartmentPassword(branchId, pwd)) {
    const dept = recruitDepartmentFromLoginId(branchId)
    if (!dept) return null
    return {
      id: dept.id,
      name: dept.recruitBranch,
      active: true,
      pin: '',
    } as MisBranch
  }
  const branch = await resolveActiveBranchForLogin(branchId)
  if (!branch) return null
  const stored = String(branch.pin ?? '').trim()
  if (stored && stored === pwd) return branch
  // Uniform suite branch PIN always works for active branches (HO recovery / empty PIN).
  if (matchesSuiteBranchPin(pwd)) return branch
  return null
}

export async function setBranchPassword(branchId: string, newPassword: string): Promise<boolean> {
  const id = String(branchId ?? '').trim()
  const pwd = String(newPassword ?? '').trim()
  if (!id || pwd.length < 4 || pwd.length > 12) return false
  const branches = await getBranches()
  const i = branches.findIndex((b) => b.id === id)
  if (i < 0) return false
  branches[i] = { ...branches[i], pin: pwd }
  return saveBranches(branches)
}

export async function ensureBranchPasswords(): Promise<MisBranch[]> {
  const branches = await getBranches()
  let changed = false
  const updated = branches.map((b) => {
    if (!isLegacyBranchPin(String(b.pin ?? ''))) return b
    changed = true
    return { ...b, pin: generateBranchPassword() }
  })
  if (changed) await saveBranches(updated)
  return updated
}

/** Admin: new password for every branch (old passwords stop working). */
export async function regenerateAllBranchPasswords(): Promise<MisBranch[]> {
  const branches = await getBranches()
  const updated = branches.map((b) => ({ ...b, pin: generateBranchPassword() }))
  await saveBranches(updated)
  return updated
}

export async function createBranchStaffSession(
  email: string,
  branch: MisBranch,
  appId: string,
  role: AuthRole = 'staff',
) {
  const token = await createSessionToken({
    email: normaliseEmail(email),
    role,
    appId,
    branchId: branch.id,
  })
  return {
    token,
    branchId: branch.id,
    branchName: branch.name,
  }
}
