import { misBranchGroupKey } from './branch-group-key.js'
import { complaintMatchesBranch, resolveBranchId } from '../guards/store.js'
import type { MisClient } from './store.js'

type BranchRef = { id: string; name: string }

/** True when a Data Bank client belongs to this branch (id, name, alias, or combined zone). */
export function clientMatchesBranch(
  clientBranchId: string,
  scopeBranchId: string,
  branches: BranchRef[],
): boolean {
  if (!scopeBranchId) return true
  if (complaintMatchesBranch(clientBranchId, scopeBranchId, branches)) return true

  const scope = branches.find((b) => b.id === scopeBranchId) ?? resolveBranchId(scopeBranchId, branches)
  const scopeName =
    scope && 'name' in scope
      ? String(scope.name)
      : resolveBranchId(scopeBranchId, branches)?.name ?? ''
  const clientName =
    resolveBranchId(clientBranchId, branches)?.name ??
    branches.find((b) => b.id === clientBranchId || b.name === clientBranchId)?.name ??
    clientBranchId

  const sk = misBranchGroupKey(scopeName)
  const ck = misBranchGroupKey(clientName)
  if (sk && ck && sk === ck) return true

  return (
    clientBranchId === scopeBranchId ||
    clientBranchId.toLowerCase() === scopeName.toLowerCase()
  )
}

/** Rewrite client branchId to canonical MIS branch ids (br1, br2, …). */
export function normalizeClientBranchIds(
  clients: MisClient[],
  branches: BranchRef[],
): { list: MisClient[]; changed: boolean } {
  let changed = false
  const list = clients.map((c) => {
    const resolved = resolveBranchId(c.branchId, branches)
    if (!resolved) return c
    if (c.branchId !== resolved.id) {
      changed = true
      return { ...c, branchId: resolved.id }
    }
    return c
  })
  return { list, changed }
}

export function filterClientsForBranch(
  clients: MisClient[],
  branchId: string,
  branches: BranchRef[],
): MisClient[] {
  if (!branchId) return clients
  return clients.filter((c) => clientMatchesBranch(c.branchId, branchId, branches))
}

/** Sites for one branch — strict branch id first (avoids double-count), then legacy alias. */
export function sitesForBranch(
  clients: MisClient[],
  branchId: string,
  branches: BranchRef[],
  onlyActive = true,
): MisClient[] {
  let list = clients.filter((c) => c.branchId === branchId)
  if (!list.length) list = filterClientsForBranch(clients, branchId, branches)
  if (onlyActive) list = list.filter((c) => c.active !== false)
  return list
}
