import { getActiveBranch, getBranches } from '../mis/store.js'
import { misBranchGroupKey } from '../mis/branch-group-key.js'
import { LIVE_TRIAL_KEYS } from './types.js'

export function liveRoomKey(branchName: string): string {
  return misBranchGroupKey(branchName) || String(branchName || '').trim().toUpperCase()
}

export function isLiveTrialKey(key: string): boolean {
  const k = String(key || '').trim().toUpperCase()
  return (LIVE_TRIAL_KEYS as readonly string[]).includes(k)
}

export function isLiveTrialBranch(nameOrId: string): boolean {
  const raw = String(nameOrId || '').trim()
  if (!raw) return false
  if (isLiveTrialKey(liveRoomKey(raw))) return true
  return /hyderabad[\s\-–]*[ab]\b|hyd[\s\-]*zone[\s\-]*[ab]|hi-?tech/i.test(raw)
}

export async function liveTrialBranchOptions(): Promise<{ id: string; name: string }[]> {
  return liveBranchOptions()
}

/** All active MIS branches. Nellore stays ≠ Tada, Vizag ≠ Kakinada. */
export async function liveBranchOptions(): Promise<{ id: string; name: string }[]> {
  const branches = await getBranches(true)
  return branches
    .filter((b) => b.active !== false)
    .map((b) => ({ id: b.id, name: b.name }))
}

export async function resolveLiveBranchName(branchId: string): Promise<string> {
  const id = String(branchId || '').trim()
  if (!id) return ''
  const b = await getActiveBranch(id)
  return String(b?.name || '').trim()
}
