/**
 * HODs and Operation Managers from MIS User Management → Guards assign / remind lists.
 * Source of truth is User Management, not a second typed-in Guards staff book.
 * HR is always on the Department list (hr@agilegroup.co.in).
 */
import type { MisUser } from '../mis/store.js'
import {
  canonicalBranchStorageId,
  complaintMatchesBranch,
  normalizeDeptStaff,
  type GuardDeptStaff,
  type GuardOpsStaff,
  type GuardPortalUser,
} from './store.js'

export const MIS_OPS_ID_PREFIX = 'misops:'
export const MIS_DEPT_ID_PREFIX = 'misdept:'
export const GUARDS_HR_EMAIL = (process.env.GUARDS_HR_EMAIL || 'hr@agilegroup.co.in').trim().toLowerCase()

export type DirectoryOpsStaff = GuardOpsStaff & { roleLabel: string }

export function misOpsStaffId(email: string): string {
  return `${MIS_OPS_ID_PREFIX}${String(email || '').trim().toLowerCase()}`
}

export function misDeptStaffId(email: string): string {
  return `${MIS_DEPT_ID_PREFIX}${String(email || '').trim().toLowerCase()}`
}

export function isMisOpsStaffId(id: string): boolean {
  return String(id || '').startsWith(MIS_OPS_ID_PREFIX)
}

export function isMisDeptStaffId(id: string): boolean {
  return String(id || '').startsWith(MIS_DEPT_ID_PREFIX)
}

export function guardsHrEmail(): string {
  return GUARDS_HR_EMAIL.includes('@') ? GUARDS_HR_EMAIL : 'hr@agilegroup.co.in'
}

/** Branch leaders for Guards assign / remind — do not drop them if User Management tagged them Support. */
export function isGuardsDirectoryLeader(u: { role?: string; email?: string; active?: boolean }): boolean {
  if (u.active === false || !String(u.email || '').includes('@')) return false
  const role = String(u.role || '').toLowerCase()
  return (
    role.includes('hod') ||
    role.includes('head of') ||
    role.includes('branch manager') ||
    role.includes('operations manager') ||
    role.includes('operation manager') ||
    role.includes('area manager') ||
    role.includes('regional manager') ||
    role.includes('general manager') ||
    role.includes('field officer') ||
    /\b(rm|gm|om)\b/.test(role)
  )
}

export function isGuardsHrUser(u: { role?: string; department?: string; email?: string; active?: boolean }): boolean {
  if (u.active === false || !String(u.email || '').includes('@')) return false
  const em = String(u.email || '').trim().toLowerCase()
  if (em === guardsHrEmail()) return true
  const role = String(u.role || '').toLowerCase()
  const dept = String(u.department || '').toLowerCase()
  return role === 'hr' || role.includes('human resource') || dept === 'hr' || dept.includes('human resource')
}

export function guardsDirectoryRoleLabel(role: string): string {
  const r = String(role || '').toLowerCase()
  if (r.includes('operations manager') || r.includes('operation manager') || r === 'ops' || r === 'om') {
    return 'Operations Manager'
  }
  if (r.includes('area manager')) return 'Area Manager'
  if (r.includes('regional manager') || r === 'rm') return 'Regional Manager'
  if (r.includes('general manager') || r === 'gm') return 'General Manager'
  if (r.includes('field officer')) return 'Field Officer'
  if (r.includes('branch manager')) return 'HOD'
  if (r.includes('hod') || r.includes('head')) return 'HOD'
  return 'HOD'
}

function pushDirectoryOps(
  out: DirectoryOpsStaff[],
  seen: Set<string>,
  row: { email: string; name: string; branchId: string; phone?: string; role: string },
  branches: { id: string; name: string }[],
) {
  const email = String(row.email || '').trim()
  const em = email.toLowerCase()
  if (!em.includes('@') || seen.has(em)) return
  const branchId = canonicalBranchStorageId(row.branchId, branches)
  seen.add(em)
  out.push({
    id: misOpsStaffId(em),
    branchId,
    name: String(row.name || email).trim() || email,
    mobile: String(row.phone || ''),
    email,
    whatsApp: String(row.phone || ''),
    active: true,
    createdAt: '',
    roleLabel: guardsDirectoryRoleLabel(row.role),
  })
}

/** Branch HOD / Operation Manager rows from User Management + Guards portal users. */
export function directoryOpsStaff(
  misUsers: MisUser[],
  portalUsers: GuardPortalUser[],
  branches: { id: string; name: string }[],
): DirectoryOpsStaff[] {
  const seen = new Set<string>()
  const out: DirectoryOpsStaff[] = []

  for (const u of misUsers) {
    if (!isGuardsDirectoryLeader(u) || !u.email?.includes('@')) continue
    pushDirectoryOps(
      out,
      seen,
      {
        email: u.email,
        name: u.name || u.email,
        branchId: u.branchId || '',
        phone: u.phone,
        role: u.role || 'HOD',
      },
      branches,
    )
  }

  for (const u of portalUsers) {
    if (!u.active || !u.email?.includes('@')) continue
    if (u.role !== 'hod' && u.role !== 'ops') continue
    pushDirectoryOps(
      out,
      seen,
      {
        email: u.email,
        name: u.name || u.email,
        branchId: u.branchId,
        role: u.role === 'ops' ? 'Operations Manager' : 'HOD',
      },
      branches,
    )
  }

  return out.sort((a, b) => a.name.localeCompare(b.name))
}

/** Saved Guards Ops list plus User Management HODs / Operation Managers (same branch only when filtered later). */
export function mergeOpsWithDirectory(
  saved: GuardOpsStaff[],
  misUsers: MisUser[],
  portalUsers: GuardPortalUser[],
  branches: { id: string; name: string }[],
): DirectoryOpsStaff[] {
  const directory = directoryOpsStaff(misUsers, portalUsers, branches)
  const byEmail = new Map<string, DirectoryOpsStaff>()
  const out: DirectoryOpsStaff[] = []

  for (const row of saved) {
    if (row.active === false) continue
    const em = String(row.email || '').trim().toLowerCase()
    const match = em ? directory.find((d) => d.email.toLowerCase() === em) : undefined
    const merged: DirectoryOpsStaff = {
      ...row,
      roleLabel: match?.roleLabel || (row as DirectoryOpsStaff).roleLabel || 'Operations',
    }
    out.push(merged)
    if (em) byEmail.set(em, merged)
  }

  for (const row of directory) {
    const em = row.email.toLowerCase()
    if (byEmail.has(em)) continue
    out.push(row)
    byEmail.set(em, row)
  }

  return out
}

export function findOpsInDirectoryOrSaved(
  opsStaffId: string,
  saved: GuardOpsStaff[],
  misUsers: MisUser[],
  portalUsers: GuardPortalUser[],
  branches: { id: string; name: string }[],
): DirectoryOpsStaff | undefined {
  const id = String(opsStaffId || '').trim()
  if (!id) return undefined
  return mergeOpsWithDirectory(saved, misUsers, portalUsers, branches).find((o) => o.id === id)
}

export function directoryOpsForBranch(
  branchId: string,
  merged: DirectoryOpsStaff[],
  branches: { id: string; name: string }[],
): DirectoryOpsStaff[] {
  return merged.filter((o) => {
    if (o.active === false) return false
    if (!String(o.branchId || '').trim()) return true
    return complaintMatchesBranch(o.branchId, branchId, branches)
  })
}

export function guardsHrDeptRow(): GuardDeptStaff {
  const email = guardsHrEmail()
  return normalizeDeptStaff({
    id: misDeptStaffId(email),
    branchId: '',
    department: 'HR',
    name: 'HR',
    email,
    mobile: '',
    active: true,
    createdAt: '',
  })
}

/** User Management HR rows + the standing hr@agilegroup.co.in mailbox. */
export function directoryDeptStaff(misUsers: MisUser[]): GuardDeptStaff[] {
  const seen = new Set<string>()
  const out: GuardDeptStaff[] = []
  const add = (row: GuardDeptStaff) => {
    const em = String(row.email || '').trim().toLowerCase()
    if (!em.includes('@') || seen.has(em)) return
    seen.add(em)
    out.push(row)
  }
  add(guardsHrDeptRow())
  for (const u of misUsers) {
    if (!isGuardsHrUser(u)) continue
    const email = String(u.email || '').trim()
    add(
      normalizeDeptStaff({
        id: misDeptStaffId(email),
        branchId: '',
        department: 'HR',
        name: String(u.name || 'HR').trim() || 'HR',
        email,
        mobile: String(u.phone || ''),
        active: true,
        createdAt: '',
      }),
    )
  }
  return out.sort((a, b) => a.name.localeCompare(b.name))
}

export function mergeDeptWithDirectory(saved: GuardDeptStaff[], misUsers: MisUser[]): GuardDeptStaff[] {
  const directory = directoryDeptStaff(misUsers)
  const byEmail = new Map<string, GuardDeptStaff>()
  const out: GuardDeptStaff[] = []
  for (const row of saved) {
    if (row.active === false) continue
    const em = String(row.email || '').trim().toLowerCase()
    out.push(row)
    if (em) byEmail.set(em, row)
  }
  for (const row of directory) {
    const em = String(row.email || '').trim().toLowerCase()
    if (em && byEmail.has(em)) continue
    out.push(row)
    if (em) byEmail.set(em, row)
  }
  if (!out.some((d) => String(d.email || '').trim().toLowerCase() === guardsHrEmail())) {
    out.unshift(guardsHrDeptRow())
  }
  return out
}

export function findDeptInDirectoryOrSaved(
  deptStaffId: string,
  saved: GuardDeptStaff[],
  misUsers: MisUser[],
): GuardDeptStaff | undefined {
  const id = String(deptStaffId || '').trim()
  if (!id) return undefined
  return mergeDeptWithDirectory(saved, misUsers).find((d) => d.id === id)
}
