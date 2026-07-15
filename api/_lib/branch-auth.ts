/**
 * Per-branch passwords for HOD / Staff login (all suite apps).
 * Passwords live on each MIS branch record (Data Bank). Forgot → email OTP reset.
 */
import { createSessionToken, normaliseEmail, type AuthRole } from './auth.js'
import { getBranches, saveBranches, type MisBranch } from './mis/store.js'
import { matchesSuiteBranchPin, suiteBranchPin } from './suite-credentials.js'

const LEGACY_PINS = new Set(['', '1234', '1706', suiteBranchPin()])

/** Easy 6-digit branch password (no leading zero). */
export function generateBranchPassword(): string {
  return String(100000 + Math.floor(Math.random() * 900000))
}

export function isLegacyBranchPin(pin: string): boolean {
  return LEGACY_PINS.has(String(pin ?? '').trim())
}

export async function verifyBranchPassword(branchId: string, password: string): Promise<MisBranch | null> {
  const id = String(branchId ?? '').trim()
  const pwd = String(password ?? '').trim()
  if (!id || !pwd) return null
  const branches = await getBranches(true)
  const branch = branches.find((b) => b.id === id)
  if (!branch) return null
  const stored = String(branch.pin ?? '').trim()
  if (!stored) return null
  if (stored === pwd) return branch
  if (matchesSuiteBranchPin(pwd) && (isLegacyBranchPin(stored) || stored === pwd)) return branch
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
