import type { MisUser } from '../mis/store.js'
import { guardsDirectoryRoleLabel, isGuardsDirectoryLeader } from './directory-staff.js'
import {
  branchDisplayName,
  canonicalBranchStorageId,
  complaintMatchesBranch,
  type GuardPortalUser,
} from './store.js'

export type HodContact = {
  email: string
  name: string
  branchId: string
  branchName: string
  roleLabel: string
}

/** HOD / RM emails for a branch — matches branch id or name (Hyderabad-B, br3, etc.). */
export function listHodContacts(
  branchId: string,
  branches: { id: string; name: string }[],
  misUsers: MisUser[],
  portalUsers: GuardPortalUser[] = [],
): HodContact[] {
  const canonical = canonicalBranchStorageId(branchId, branches) || branchId
  const branchName = branchDisplayName(canonical, branches)
  const seen = new Set<string>()
  const out: HodContact[] = []

  const add = (email: string, name: string, bid: string, role: string) => {
    const em = email.trim().toLowerCase()
    if (!em.includes('@') || seen.has(em)) return
    seen.add(em)
    out.push({
      email: email.trim(),
      name: name || email.trim(),
      branchId: bid,
      branchName,
      roleLabel: guardsDirectoryRoleLabel(role),
    })
  }

  for (const u of misUsers) {
    if (!isGuardsDirectoryLeader(u) || !u.email?.includes('@')) continue
    const ub = String(u.branchId || '').trim()
    if (ub && !complaintMatchesBranch(ub, branchId, branches)) continue
    add(
      u.email,
      u.name || u.email,
      canonicalBranchStorageId(u.branchId, branches) || canonical,
      u.role || 'HOD',
    )
  }

  for (const u of portalUsers) {
    if (!u.active || (u.role !== 'hod' && u.role !== 'ops') || !u.email?.includes('@')) continue
    if (!complaintMatchesBranch(u.branchId, branchId, branches)) continue
    add(
      u.email,
      u.name || u.email,
      canonicalBranchStorageId(u.branchId, branches) || canonical,
      u.role === 'ops' ? 'Operations Manager' : 'HOD',
    )
  }

  return out.sort((a, b) => a.name.localeCompare(b.name))
}

export function listAllHodContacts(
  branches: { id: string; name: string }[],
  misUsers: MisUser[],
  portalUsers: GuardPortalUser[] = [],
): HodContact[] {
  const seen = new Set<string>()
  const out: HodContact[] = []
  const canonicalNames = new Map<string, string>()
  for (const b of branches) {
    canonicalNames.set(b.id, b.name)
  }
  for (const b of branches) {
    for (const h of listHodContacts(b.id, branches, misUsers, portalUsers)) {
      const branchName = canonicalNames.get(h.branchId) || h.branchName
      const key = `${h.email.toLowerCase()}|${branchName.toLowerCase()}`
      if (seen.has(key)) continue
      seen.add(key)
      out.push({ ...h, branchName })
    }
  }
  return out.sort((a, b) => a.branchName.localeCompare(b.branchName) || a.name.localeCompare(b.name))
}

export async function hodEmailsForBranch(
  branchId: string,
  branches: { id: string; name: string }[],
  misUsers: MisUser[],
  portalUsers: GuardPortalUser[] = [],
): Promise<string[]> {
  return listHodContacts(branchId, branches, misUsers, portalUsers).map((h) => h.email)
}
